/- Decode public ExprDAG packets and replay closed roots in the pinned kernel.
   This is tooling source, independent of original proof scripts. The driver
   prepends the production serializer and existing exact universe decoder. -/
namespace AtlasPacketReplay
open Lean Elab Command Meta AtlasLibrary
def field (j : Json) (k : String) : Except String Json := j.getObjVal? k
def name (j : Json) (parts display : String) : Except String Name := do
 let n ← AtlasLevelTransport.jsonName (← field j parts)
 unless n.toString == (← j.getObjValAs? String display) do throw "Name display mismatch"
 return n
def binderInfo (p : Json) : Except String BinderInfo := do
 match ← p.getObjValAs? String "binderInfo" with
 | "default" => return .default
 | "implicit" => return .implicit
 | "strictImplicit" => return .strictImplicit
 | "instImplicit" => return .instImplicit
 | _ => throw "Unknown binder information"
def metadata (p : Json) : Except String KVMap := do
 let entries ← p.getObjValAs? (Array Json) "metadata"
 let mut data := KVMap.empty
 for e in entries do
  let n ← name e "keyNameParts" "key"
  let value ← field e "value"
  unless (← value.getObjValAs? String "kind") == "ofBool" do throw "Unsupported metadata value: only exact Boolean values are implemented in this finite experiment"
  let repr ← value.getObjValAs? String "repr"
  let b ← if repr == "Lean.DataValue.ofBool true" then pure true else if repr == "Lean.DataValue.ofBool false" then pure false else throw "Unsupported Boolean metadata representation"
  data := data.setBool n b
 return data
def decode (packet : Json) : Except String (Array Expr) := do
 let kinds ← packet.getObjValAs? (Array Nat) "kind"
 let children ← packet.getObjValAs? (Array (Array Nat)) "children"
 let payloads ← packet.getObjValAs? (Array Json) "payloads"
 unless kinds.size > 0 && kinds.size <= 131072 && children.size == kinds.size && payloads.size == kinds.size do throw "Expression table bound/shape"
 let mut values : Array Expr := #[]
 for i in [:kinds.size] do
  let cs := children[i]!
  unless cs.all (· < i) do throw "Forward or cyclic expression input"
  let k := kinds[i]!
  let expected := if k == 5 || k == 6 || k == 7 then 2 else if k == 8 then 3 else if k == 10 || k == 11 then 1 else 0
  unless cs.size == expected do throw "Constructor port arity"
  let p := payloads[i]!
  let value : Expr ← match k with
   | 0 => pure (.bvar (← p.getObjValAs? Nat "index"))
   | 1 => do
    let n ← AtlasLevelTransport.jsonName (← field p "idNameParts")
    pure (.fvar ⟨n⟩)
   | 2 => do
    let n ← AtlasLevelTransport.jsonName (← field p "idNameParts")
    pure (.mvar ⟨n⟩)
   | 3 => pure (.sort (← AtlasLevelTransport.decode (← field p "level")))
   | 4 => do
    let levels ← p.getObjValAs? (Array Json) "levels"
    pure (.const (← name p "nameParts" "name") (← levels.toList.mapM AtlasLevelTransport.decode))
   | 5 => pure (.app values[cs[0]!]! values[cs[1]!]!)
   | 6 => pure (.lam (← name p "binderNameParts" "binderName") values[cs[0]!]! values[cs[1]!]! (← binderInfo p))
   | 7 => pure (.forallE (← name p "binderNameParts" "binderName") values[cs[0]!]! values[cs[1]!]! (← binderInfo p))
   | 8 => pure (.letE (← name p "declNameParts" "declName") values[cs[0]!]! values[cs[1]!]! values[cs[2]!]! (← p.getObjValAs? Bool "nondep"))
   | 9 => do
    let v ← p.getObjValAs? String "value"
    match ← p.getObjValAs? String "literalKind" with
    | "natVal" => do
     let some n := v.toNat? | throw "Natural literal encoding"
     pure (.lit (.natVal n))
    | "strVal" => pure (.lit (.strVal v))
    | _ => throw "Literal kind"
   | 10 => pure (.mdata (← metadata p) values[cs[0]!]!)
   | 11 => pure (.proj (← name p "typeNameParts" "typeName") (← p.getObjValAs? Nat "index") values[cs[0]!]!)
   | _ => throw "Expression constructor"
  values := values.push value
 return values

def graph (roots : Array Expr) : Json := Id.run do
 let mut state : Shared := {}
 let mut indices : Array Nat := #[]
 for e in roots do
  let (i,next) := intern e state
  state := next
  indices := indices.push i
 return Json.mkObj [("serialization",toJson "ExprDAG/1"),("kind",toJson state.kind),
  ("children",toJson state.children),("payloads",toJson state.payloads),
  ("expanded",toJson (state.expanded.map (toString ·))),
  ("neededScope",toJson state.neededScope),("roots",toJson indices)]

def exact (packet : Json) : Except String (Array Expr × Array Nat) := do
 unless (← packet.getObjValAs? String "serialization") == "ExprDAG/1" do throw "Packet format"
 let values ← decode packet
 let roots ← packet.getObjValAs? (Array Nat) "roots"
 unless roots.size > 0 && roots.size <= 32 && roots.all (· < values.size) do throw "Packet roots"
 let rebuilt := graph (roots.map (values[·]!))
 for key in ["kind","children","payloads","expanded","neededScope","roots"] do
  unless (← rebuilt.getObjVal? key) == (← packet.getObjVal? key) do
   throw ("Exact roundtrip mismatch: " ++ key)
 return (values,roots)

def checked (e : Expr) : MetaM Expr := do
 unless !e.hasFVar && !e.hasMVar && !e.hasLooseBVars do throwError "Packet root is not closed"
 match Kernel.check (← getEnv) {} e with
 | .ok type => return type
 | .error ex => throwError "Decoded packet kernel check: {ex.toMessageData (← getOptions)}"
def theoremType (type : Expr) : MetaM Unit := do
 let sort ← checked type
 unless sort == mkSort .zero do throwError "Theorem expected type is not a proposition"
syntax "#atlas_packet_replay " str " => " str : command
elab_rules : command
 | `(#atlas_packet_replay $input:str => $output:str) => do
  let requests ← IO.FS.readFile input.getString
  let requests ← match Json.parse requests >>= Json.getArr? with | .ok v => pure v | .error e => throwError e
  liftIO <| IO.FS.writeFile output.getString ""
  for request in requests do
   let file ← match request.getObjValAs? String "file" with | .ok v => pure v | .error e => throwError e
   let theoremName ← match request.getObjValAs? String "name" with | .ok v => pure v | .error e => throwError e
   let moduleName ← match request.getObjValAs? String "module" with | .ok v => pure v | .error e => throwError e
   unless ((← getEnv).find? theoremName.toName).isNone do throwError "Original theorem is already imported"
   unless !((← getEnv).header.moduleNames.any (·.toString == moduleName)) do throwError "Original proof module is already imported"
   let packet ← match Json.parse (← IO.FS.readFile file) with | .ok v => pure v | .error e => throwError e
   let (values,roots) ← match exact packet with | .ok v => pure v | .error e => throwError e
   unless roots.size == 2 do throwError "Theorem packet requires type and proof roots"
   let type := values[roots[0]!]!
   let value := values[roots[1]!]!
   let mut constants := 0
   let mut axioms : NameSet := {}
   for e in values do
    if let .const n _ := e then
     unless ((← getEnv).find? n).isSome do throwError "Missing baseline constant: {n}"
     constants := constants+1
     for ax in (← collectAxioms n) do axioms := axioms.insert ax
   let allAxioms := axioms.toArray.qsort Name.lt
   let expectedAxioms ← match request.getObjValAs? (Array String) "axioms" with | .ok v => pure v | .error e => throwError e
   unless (allAxioms.map Name.toString).qsort (· < ·) == expectedAxioms.qsort (· < ·) do throwError "Transitive baseline axiom mismatch"
   unless !(allAxioms.contains ``sorryAx) do throwError "Admitted proof dependency"
   liftTermElabM fun _ => do
    theoremType type
    let _ ← checked value
    let _ ← checked (mkApp (mkLambda `atlasDecodedExpected .default type (.bvar 0)) value)
    let wrongProofAccepted ← try
     let _ ← checked (mkApp (mkLambda `atlasDecodedWrongExpected .default type (.bvar 0)) (mkNatLit 0))
     pure true
    catch _ => pure false
    unless !wrongProofAccepted do throwError "Wrong proof was accepted at the decoded expected type"
    let invalidBinderAccepted ← try
     let _ ← checked (.lam `invalid (mkNatLit 0) (.bvar 0) .default)
     pure true
    catch _ => pure false
    unless !invalidBinderAccepted do throwError "Ill-typed binder was accepted"
    pure ()
   let packetSha ← match request.getObjValAs? String "indexSha256" with | .ok v => pure v | .error e => throwError e
   let row := Json.mkObj [("name",toJson theoremName),("indexSha256",toJson packetSha),("storedNodes",toJson values.size),
    ("roundtripFields",toJson #["kind","children","payloads","expanded","neededScope","roots"]),
    ("knownBaselineConstantNodes",toJson constants),("kernelExpectedType",toJson "PASS"),
    ("kernelProof",toJson "PASS"),("kernelExpectedTypeIsProposition",toJson "PASS"),
    ("kernelExpectedTypeConversion",toJson "PASS"),("axioms",toJson (allAxioms.map Name.toString)),
    ("originalTheoremAbsentFromEnvironment",toJson true),("originalModuleAbsentFromEnvironment",toJson true),
    ("wrongProofRejectedByKernel",toJson true),("illTypedBinderRejectedByKernel",toJson true)]
   liftIO <| IO.FS.withFile output.getString .append fun h => h.putStrLn row.compress
end AtlasPacketReplay
