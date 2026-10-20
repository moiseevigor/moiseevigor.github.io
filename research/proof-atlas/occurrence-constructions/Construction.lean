/- Appended to the unchanged, core-only packet decoder/context-query runtime.
   Native observation prototype: not a verified context-reconstruction algorithm. -/
open Lean Elab Command Meta
namespace AtlasDeepConstruction

structure State where
  source : Expr
  ctx : LocalContext
  locals : Array Expr
  binderDepths : Array Nat

def normalize (ctx : LocalContext) (term : Expr) : MetaM Expr := do
  match Kernel.whnf (← getEnv) ctx term with
  | .ok result => return result
  | .error error => throwError "Kernel normalization: {error.toMessageData (← getOptions)}"

def descend (root : Expr) (slots : Array Nat) : MetaM State := do
  unless slots.size <= 262144 do throwError "Route limit"
  let mut source := root
  let mut ctx : LocalContext := {}
  let mut locals : Array Expr := #[]
  let mut depths : Array Nat := #[]
  for depth in [:slots.size] do
    let slot := slots[depth]!
    match source with
    | .lam name domain body info | .forallE name domain body info =>
      if slot == 0 then source := domain
      else if slot == 1 then
        let domain := domain.instantiateRev locals
        let sort ← normalize ctx (← AtlasDeepTyping.checkAt ctx domain)
        unless sort.isSort do throwError "Non-type binder domain"
        let id ← mkFreshFVarId
        ctx := ctx.mkLocalDecl id name domain info
        locals := locals.push (.fvar id)
        depths := depths.push depth
        source := body
      else throwError "Binder slot"
    | .letE name type value body nondep =>
      if slot == 0 then source := type
      else if slot == 1 then source := value
      else if slot == 2 then
        let type := type.instantiateRev locals
        let sort ← normalize ctx (← AtlasDeepTyping.checkAt ctx type)
        unless sort.isSort do throwError "Non-type let domain"
        let value := value.instantiateRev locals
        AtlasDeepTyping.checkAs ctx value type
        let id ← mkFreshFVarId
        ctx := ctx.mkLetDecl id name type value nondep
        locals := locals.push (.fvar id)
        depths := depths.push depth
        source := body
      else throwError "Let slot"
    | .app fn arg =>
      if slot == 0 then source := fn
      else if slot == 1 then source := arg
      else throwError "Application slot"
    | .mdata _ inner | .proj _ _ inner =>
      if slot == 0 then source := inner else throwError "Unary slot"
    | _ => throwError "Terminal field"
  return ⟨source, ctx, locals, depths⟩

def close (locals : Array Expr) (term : Expr) : MetaM Expr := do
  let result := term.abstract locals
  unless (⟨result.instantiateRev locals⟩ : ExprStructEq) == ⟨term⟩ do
    throwError "Context abstraction roundtrip"
  return result

def sourceRoundtrip (locals : Array Expr) (term source : Expr) : MetaM Unit := do
  unless (⟨← close locals term⟩ : ExprStructEq) == ⟨source⟩ do
    throwError "Source term/context roundtrip"

structure Typed where
  type : Expr
  closed : Expr
  role : String

def typed (ctx : LocalContext) (locals : Array Expr) (term : Expr) : MetaM Typed := do
  let type ← AtlasDeepTyping.checkAt ctx term
  let sort ← normalize ctx (← AtlasDeepTyping.checkAt ctx type)
  let normal ← normalize ctx type
  let role := if sort == mkSort .zero then "proof" else if normal.isSort then "type" else "value"
  return ⟨type, ← close locals type, role⟩

def point (shared : AtlasLibrary.Shared) (source : Expr) (slots : Array Nat) : MetaM Json := do
  let some node := shared.seen.get? ⟨source⟩ | throwError "Point is outside original source graph"
  return Json.mkObj [("root",toJson (1 : Nat)),("slots",toJson slots),("node",toJson node)]

def construction (root : Expr) (shared : AtlasLibrary.Shared) (slots : Array Nat)
    (rule : String) : MetaM Json := do
  let s ← descend root slots
  let term := s.source.instantiateRev s.locals
  sourceRoundtrip s.locals term s.source
  let j ← typed s.ctx s.locals term
  let (oldSource, oldDepths, oldType, oldRole) ← AtlasDeepTyping.query root slots
  unless (⟨s.source⟩ : ExprStructEq) == ⟨oldSource⟩ && s.binderDepths == oldDepths &&
      (⟨j.closed⟩ : ExprStructEq) == ⟨oldType⟩ && j.role == oldRole do
    throwError "Preceding contextual-query disagreement"
  let origin ← point shared s.source slots
  if rule == "Pi-introduction" then
    let .lam name domain body info := s.source | throwError "Introduction requires a lambda"
    let domainTerm := domain.instantiateRev s.locals
    let d ← typed s.ctx s.locals domainTerm
    let sort ← normalize s.ctx d.type
    unless sort.isSort do throwError "Introduction domain is not a type"
    AtlasDeepTyping.checkAs s.ctx domainTerm sort
    let pi ← normalize s.ctx j.type
    let .forallE _ piDomain piBody _ := pi | throwError "Lambda type does not normalize to Pi"
    AtlasDeepTyping.checkAs s.ctx term pi
    let id ← mkFreshFVarId
    let x := Expr.fvar id
    let ctx := s.ctx.mkLocalDecl id name domainTerm info
    let locals := s.locals.push x
    AtlasDeepTyping.checkAs ctx x piDomain
    let bodyTerm := body.instantiateRev locals
    sourceRoundtrip s.locals domainTerm domain
    sourceRoundtrip locals bodyTerm body
    let b ← typed ctx locals bodyTerm
    let expected := piBody.instantiate1 x
    AtlasDeepTyping.checkAs ctx bodyTerm expected
    let types ← #[pure j.closed,close s.locals domainTerm,pure d.closed,
      close s.locals sort,close s.locals pi,pure b.closed,close locals expected].mapM (fun task => task)
    return Json.mkObj [("rule",toJson rule),("source",origin),("role",toJson j.role),
      ("binderDepths",toJson s.binderDepths),("contextLength",toJson s.locals.size),
      ("domain",← point shared domain (slots.push 0)),("body",← point shared body (slots.push 1)),
      ("domainRole",toJson d.role),("bodyRole",toJson b.role),("bodyContextLength",toJson locals.size),
      ("bodyBinderDepths",toJson (s.binderDepths.push slots.size)),
      ("typeGraph",AtlasPacketReplay.graph types),
      ("typeRoots",toJson #["lambda-type","domain-expression","domain-type","domain-sort",
        "pi-type","body-type","expected-body-type"]),
      ("domainBeforeBinder",toJson true),("bodyContextExtended",toJson true),
      ("kernelDomainSort",toJson "PASS"),("kernelBinderConversion",toJson "PASS"),
      ("kernelBodyConversion",toJson "PASS"),("kernelFunctionConversion",toJson "PASS"),
      ("typeContextRoundtrips",toJson true),("sourceTermContextRoundtrips",toJson true),
      ("precedingQueryAgreement",toJson true)]
  else if rule == "Pi-application" then
    let .app fn arg := s.source | throwError "Application requires an app"
    let fnTerm := fn.instantiateRev s.locals
    let argTerm := arg.instantiateRev s.locals
    sourceRoundtrip s.locals fnTerm fn
    sourceRoundtrip s.locals argTerm arg
    let f ← typed s.ctx s.locals fnTerm
    let a ← typed s.ctx s.locals argTerm
    let pi ← normalize s.ctx f.type
    let .forallE _ domain body _ := pi | throwError "Function type does not normalize to Pi"
    AtlasDeepTyping.checkAs s.ctx fnTerm pi
    AtlasDeepTyping.checkAs s.ctx argTerm domain
    let expected := body.instantiate1 argTerm
    AtlasDeepTyping.checkAs s.ctx term expected
    let types ← #[pure j.closed,pure f.closed,close s.locals pi,close s.locals domain,
      pure a.closed,close s.locals expected].mapM (fun task => task)
    return Json.mkObj [("rule",toJson rule),("source",origin),("role",toJson j.role),
      ("binderDepths",toJson s.binderDepths),("contextLength",toJson s.locals.size),
      ("function",← point shared fn (slots.push 0)),("argument",← point shared arg (slots.push 1)),
      ("functionRole",toJson f.role),("argumentRole",toJson a.role),
      ("typeGraph",AtlasPacketReplay.graph types),
      ("typeRoots",toJson #["result-type","function-type","pi-type","expected-domain",
        "argument-type","substituted-result"]),
      ("kernelFunctionConversion",toJson "PASS"),("kernelDomainConversion",toJson "PASS"),
      ("kernelResultConversion",toJson "PASS"),("typeContextRoundtrips",toJson true),
      ("sourceTermContextRoundtrips",toJson true),("precedingQueryAgreement",toJson true)]
  else throwError "Unsupported rule"

syntax "#atlas_construction_packets " str " => " str : command
elab_rules : command
 | `(#atlas_construction_packets $input:str => $output:str) => liftTermElabM do
    let .ok rows := Json.parse (← IO.FS.readFile input.getString) >>= Json.getArr?
      | throwError "Input rows"
    let mut result : Array Json := #[]
    for row in rows do
      let .ok name := row.getObjValAs? String "name" | throwError "Case name"
      let .ok packet := row.getObjVal? "source" | throwError "Source packet"
      let .ok requests := row.getObjValAs? (Array Json) "requests" | throwError "Requests"
      let .ok (values,roots) := AtlasPacketReplay.exact packet | throwError "Source roundtrip"
      unless roots.size == 2 do throwError "Declaration root pair"
      let expected := values[roots[0]!]!
      let value := values[roots[1]!]!
      let axioms ← AtlasDeepTyping.baselineAxioms values
      let sort ← normalize {} (← AtlasDeepTyping.checkAt {} expected)
      unless sort.isSort do throwError "Declaration expected type"
      AtlasDeepTyping.checkAs {} value expected
      let mut shared : AtlasLibrary.Shared := {}
      for root in #[expected,value] do shared := (AtlasLibrary.intern root shared).2
      let mut observations : Array Json := #[]
      for request in requests do
        let .ok slots := request.getObjValAs? (Array Nat) "slots" | throwError "Request path"
        let .ok rule := request.getObjValAs? String "rule" | throwError "Request rule"
        observations := observations.push (← construction value shared slots rule)
      result := result.push (Json.mkObj [("name",toJson name),("observations",toJson observations),
        ("rootTypeKernelChecked",toJson true),("rootValueConversionKernelChecked",toJson true),
        ("baselineAxioms",toJson axioms)])
    let nat := mkConst ``Nat
    let zero := Expr.lit (.natVal 0)
    let one := Expr.lit (.natVal 1)
    let mut negative : Array Json := #[]
    negative := negative.push (← AtlasDeepTyping.mustReject "wrong-application-domain"
      (AtlasDeepTyping.checkAs {} (mkConst ``Bool.true) nat))
    negative := negative.push (← AtlasDeepTyping.mustReject "wrong-introduction-body-type"
      (AtlasDeepTyping.checkAs {} one (mkConst ``Bool)))
    negative := negative.push (← AtlasDeepTyping.mustReject "ill-typed-surrounding-binder"
      (do let _ ← descend (mkLambda `x .default zero one) #[1]; pure ()))
    negative := negative.push (← AtlasDeepTyping.mustReject "ill-typed-surrounding-let"
      (do let _ ← descend (.letE `x nat (mkConst ``Bool.true) zero false) #[2]; pure ()))
    let piSource := mkForall `x .default nat nat
    let (_,piShared) := AtlasLibrary.intern piSource {}
    negative := negative.push (← AtlasDeepTyping.mustReject "pi-is-not-lambda-introduction"
      (do let _ ← construction piSource piShared #[] "Pi-introduction"; pure ()))
    IO.FS.writeFile output.getString (Json.mkObj [("status",toJson "PASS"),
      ("format",toJson "ProofAtlasDeepConstructionPrototype/1"),("cases",toJson result),
      ("negativeControls",toJson negative),
      ("sourceModuleBytesVerified",toJson false),("queryAlgorithmFormallyVerified",toJson false),
      ("originalMathematicalModulesImported",toJson false)]).compress
end AtlasDeepConstruction
