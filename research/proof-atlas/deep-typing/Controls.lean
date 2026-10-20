/- Prepended with the production exporter/decoder and DeepTyping.lean. -/
open Lean Elab Command Meta
namespace AtlasDeepTyping

def baselineAxioms (values : Array Expr) : MetaM (Array String) := do
  let mut axioms : NameSet := {}
  for value in values do
    if let .const name _ := value then
      unless ((← getEnv).find? name).isSome do throwError "Constant absent from core environment: {name}"
      for dependency in (← collectAxioms name) do axioms := axioms.insert dependency
  unless !(axioms.contains ``sorryAx) do throwError "Admitted proof dependency"
  return (axioms.toArray.map Name.toString).qsort (· < ·)

def packetCase (name : String) (expected value : Expr) (routes : Array (Array Nat)) : MetaM Json := do
  let packet := AtlasPacketReplay.graph #[expected,value]
  let (values, roots) ← match AtlasPacketReplay.exact packet with
    | .ok result => pure result | .error error => throwError "Packet roundtrip: {error}"
  let axioms ← baselineAxioms values
  let expected := values[roots[0]!]!
  let value := values[roots[1]!]!
  let expectedType ← checkAt {} expected
  let .ok expectedSort := Kernel.whnf (← getEnv) {} expectedType
    | throwError "Expected type normalization rejected"
  unless expectedSort.isSort do throwError "Expected type is not a type"
  checkAs {} value expected
  let mut shared : AtlasLibrary.Shared := {}
  for root in #[expected,value] do shared := (AtlasLibrary.intern root shared).2
  let mut queries : Array Json := #[]
  for route in routes do
    unless route.size <= 262144 do throwError "Query route limit"
    let (source, binders, type, role) ← query value route
    let some node := shared.seen.get? ⟨source⟩ | throwError "Source occurrence missing"
    let target := match source with
      | .bvar index => if index < binders.size then toJson (binders[binders.size-1-index]!) else Json.null
      | _ => Json.null
    queries := queries.push (Json.mkObj [("root",toJson (1 : Nat)),("slots",toJson route),
      ("node",toJson node),("binderDepths",toJson binders),("bindingTargetDepth",target),
      ("role",toJson role),
      ("typeNamespace",toJson "computed-native-type"),("typeGraph",AtlasPacketReplay.graph #[type]),
      ("typeContextRoundtrip",toJson true)])
  return Json.mkObj [("name",toJson name),("source",packet),("queries",toJson queries),
    ("rootTypeKernelChecked",toJson true),("rootValueConversionKernelChecked",toJson true),
    ("sourcePacketExactRoundtrip",toJson true),("baselineAxioms",toJson axioms)]

syntax "#atlas_context_packet " str " with " str " => " str : command
elab_rules : command
  | `(#atlas_context_packet $input:str with $request:str => $output:str) => liftTermElabM do
    let packet ← match Json.parse (← IO.FS.readFile input.getString) with
      | .ok packet => pure packet | .error error => throwError "Source JSON: {error}"
    let requests ← match Json.parse (← IO.FS.readFile request.getString) >>= Json.getArr? with
      | .ok requests => pure requests | .error error => throwError "Query JSON: {error}"
    unless requests.size <= 256 do throwError "Query table bound"
    let routes ← requests.mapM fun row => do
      match fromJson? row (α := Array Nat) with
      | .ok slots => pure slots | .error error => throwError "Query path: {error}"
    let (values, roots) ← match AtlasPacketReplay.exact packet with
      | .ok result => pure result | .error error => throwError "Original packet roundtrip: {error}"
    unless roots.size == 2 do throwError "Expected the original type/value root pair"
    let declaration ← match packet.getObjVal? "declaration" with
      | .ok declaration => pure declaration | .error error => throwError "Declaration: {error}"
    let labels ← match declaration.getObjValAs? (Array String) "rootPaths" with
      | .ok labels => pure labels | .error error => throwError "Root labels: {error}"
    unless labels == #["root.type","root.value"] do throwError "Not a declaration type/value namespace"
    let name ← match declaration.getObjValAs? String "name" with
      | .ok name => pure name | .error error => throwError "Declaration name: {error}"
    let record ← packetCase name values[roots[0]!]! values[roots[1]!]! routes
    let rebuilt := (record.getObjVal? "source").toOption.get!
    for key in ["kind","children","payloads","expanded","neededScope","roots"] do
      let before ← match packet.getObjVal? key with
        | .ok value => pure value | .error error => throwError "Original field: {error}"
      let after ← match rebuilt.getObjVal? key with
        | .ok value => pure value | .error error => throwError "Rebuilt field: {error}"
      unless before == after do throwError "Original source table changed: {key}"
    IO.FS.writeFile output.getString (Json.mkObj [("status",toJson "PASS"),("record",record),
      ("originalDeclaration",declaration),("originalProducerClaimUnchanged",toJson true)]).compress

def mustReject (name : String) (action : MetaM Unit) : MetaM Json := do
  let observed ← try
    let result ← action
    pure (some result)
  catch _ => pure none
  if observed.isSome then throwError "Negative control accepted: {name}"
  return Json.mkObj [("name",toJson name),("rejected",toJson true)]

syntax "#atlas_deep_packets " num " => " str : command
elab_rules : command
  | `(#atlas_deep_packets $n:num => $file:str) => liftTermElabM do
    let nat := mkConst ``Nat
    let zero := Expr.lit (.natVal 0)
    let one := Expr.lit (.natVal 1)
    let eq a b := mkApp3 (mkConst ``Eq [.succ .zero]) nat a b
    let fn := mkForall `x .default nat nat
    let mut deep : Expr := .bvar 0
    for _ in [:n.getNat] do deep := mkApp (mkConst ``Nat.succ) deep
    let expected := mkForall `x .default nat (eq deep deep)
    let proof := mkLambda `x .default nat (mkApp2 (mkConst ``Eq.refl [.succ .zero]) nat deep)
    let mut cases : Array Json := #[]
    cases := cases.push (← packetCase "deep-reflexivity" expected proof
      #[#[],#[1],#[1,1],#[1,1] ++ Array.replicate n.getNat 1])
    if n.getNat > 0 then
      let mut shadowedDeep : Expr := .bvar (n.getNat-1)
      let mut shadowedType := nat
      for _ in [:n.getNat] do
        shadowedDeep := mkLambda `x .default nat shadowedDeep
        shadowedType := mkForall `x .default nat shadowedType
      cases := cases.push (← packetCase "deep-shadowed-context" shadowedType shadowedDeep
        #[Array.replicate n.getNat 1])
    let shadowed := mkLambda `x .default nat
      (mkApp2 (mkConst ``Nat.add) (.bvar 0) (mkApp (mkLambda `x .default nat (.bvar 0)) (.bvar 0)))
    cases := cases.push (← packetCase "shadowed-shared-variable" fn shadowed
      #[#[0],#[1,0,1],#[1,1,0,1],#[1,1,1]])
    let dependentType := mkForall `A .default (mkSort (.succ .zero))
      (mkForall `x .default (.bvar 0) (.bvar 1))
    let dependent := mkLambda `A .default (mkSort (.succ .zero))
      (mkLambda `x .default (.bvar 0) (.bvar 0))
    cases := cases.push (← packetCase "dependent-domain" dependentType dependent
      #[#[0],#[1,0],#[1,1]])
    let letTerm := mkLambda `x .default nat (.letE `x nat (.bvar 0) (.bvar 0) false)
    cases := cases.push (← packetCase "let-value-before-binder" fn letTerm
      #[#[1,0],#[1,1],#[1,2]])
    let quantified := mkForall `x .default nat (eq (.bvar 0) (.bvar 0))
    cases := cases.push (← packetCase "forall-scope" (mkSort .zero) quantified
      #[#[0],#[1],#[1,0,1],#[1,1]])
    let tagged := Expr.mdata (KVMap.empty.setBool `synthetic true) zero
    cases := cases.push (← packetCase "metadata-field" nat tagged #[#[],#[0]])
    let pair := mkApp4 (mkConst ``Prod.mk [.zero,.zero]) nat nat zero one
    cases := cases.push (← packetCase "projection-field" nat (.proj ``Prod 0 pair) #[#[],#[0],#[0,1]])
    let mut negatives : Array Json := #[]
    negatives := negatives.push (← mustReject "terminal-has-no-child" (do let _ ← query zero #[0]; pure ()))
    negatives := negatives.push (← mustReject "slot-three" (do let _ ← query proof #[3]; pure ()))
    negatives := negatives.push (← mustReject "ill-typed-binder-context"
      (do let _ ← query (mkLambda `x .default zero one) #[1]; pure ()))
    negatives := negatives.push (← mustReject "ill-typed-let-context"
      (do let _ ← query (.letE `x nat (mkConst ``Bool.true) zero false) #[2]; pure ()))
    negatives := negatives.push (← mustReject "loose-index" (do let _ ← query (.bvar 0) #[]; pure ()))
    negatives := negatives.push (← mustReject "unknown-constant" (do let _ ← checkAt {} (mkConst `AtlasMissingConstant); pure ()))
    negatives := negatives.push (← mustReject "wrong-root-type" (checkAs {} proof nat))
    negatives := negatives.push (← mustReject "unresolved-metavariable" (do let _ ← checkAt {} (.mvar ⟨`missing⟩); pure ()))
    IO.FS.writeFile file.getString (Json.mkObj [("status",toJson "PASS"),
      ("format",toJson "ProofAtlasDeepNativeTypingPackets/1"),("cases",toJson cases),
      ("negativeControls",toJson negatives),("successorDepth",toJson n.getNat),
      ("scope",toJson "Finite core-only decoded-packet judgments. No private corpus, browser typing, arbitrary-size or semantic abstraction claim.")]).compress

end AtlasDeepTyping
