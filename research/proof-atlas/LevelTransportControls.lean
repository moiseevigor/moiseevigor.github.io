/- Independent decoder and exact native roundtrips through the production serializer. -/
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
namespace AtlasLevelTransport

def jsonName (j : Json) : Except String Name := do
 let parts ← j.getArr?
 let mut n := Name.anonymous
 for part in parts do
  let fields ← part.getObj?
  unless fields.size == 1 do throw "Structured Name arity"
  if let .ok text := part.getObjValAs? String "str" then n := .str n text
  else
   let text ← part.getObjValAs? String "num"
   let some value := text.toNat? | throw "Numeric Name component"
   unless toString value == text do throw "Numeric Name encoding"
   n := .num n value
 return n

def decodeDag (j : Json) : Except String Level := do
 unless (← j.getObjValAs? String "format") == "LevelDAG/1" do throw "Level format"
 let kinds ← j.getObjValAs? (Array String) "kind"
 let children ← j.getObjValAs? (Array (Array Nat)) "children"
 let payloads ← j.getObjValAs? (Array Json) "payloads"
 let expanded ← j.getObjValAs? (Array String) "expanded"
 let roots ← j.getObjValAs? (Array Nat) "roots"
 unless kinds.size > 0 && kinds.size <= 4096 && children.size == kinds.size && payloads.size == kinds.size && expanded.size == kinds.size && roots.size == 1 && roots[0]! < kinds.size do throw "Level shape bound"
 let mut values : Array Level := #[]
 let mut counts : Array Nat := #[]
 for i in [:kinds.size] do
  let cs := children[i]!
  unless cs.all (· < i) do throw "Forward/cyclic Level reference"
  let count := cs.foldl (fun n c => n+counts[c]!) 1
  unless expanded[i]! == toString count do throw "Level count"
  let arity := if kinds[i]! == "succ" then 1 else if kinds[i]! == "max" || kinds[i]! == "imax" then 2 else 0
  unless cs.size == arity do throw "Level port count"
  let p := payloads[i]!
  let value ← match kinds[i]! with
   | "zero" => pure Level.zero
   | "succ" => pure (.succ values[cs[0]!]!)
   | "max" => pure (.max values[cs[0]!]! values[cs[1]!]!)
   | "imax" => pure (.imax values[cs[0]!]! values[cs[1]!]!)
   | "param" => do
    let n ← jsonName (← p.getObjVal? "nameParts")
    unless (← p.getObjValAs? String "name") == n.toString do throw "Parameter display/name mismatch"
    pure (.param n)
   | "mvar" => do
    let n ← jsonName (← p.getObjVal? "idNameParts")
    let id : LMVarId := ⟨n⟩
    unless (← p.getObjValAs? String "id") == reprStr id do throw "Metavariable display/name mismatch"
    pure (.mvar id)
   | _ => throw "Unknown Level constructor"
  values := values.push value; counts := counts.push count
 -- A Level envelope has no unreachable side channel.
 let mut reached : Std.HashSet Nat := {}
 reached := reached.insert roots[0]!
 for i in (List.range kinds.size).reverse do
  if reached.contains i then
   for c in children[i]! do reached := reached.insert c
 unless reached.size == kinds.size do throw "Unreachable Level node"
 return values[roots[0]!]!

partial def decode (j : Json) (depth : Nat := 0) : Except String Level := do
 if depth > 512 then throw "Level depth bound"
 if let .ok encoding := j.getObjValAs? String "encoding" then
  unless encoding == "LevelDAG/1" do throw "Unknown Level transport"
  return ← decodeDag (← j.getObjVal? "graph")
 match ← j.getObjValAs? String "kind" with
 | "zero" => return .zero
 | "succ" => return .succ (← decode (← j.getObjVal? "of") (depth+1))
 | "max" => return .max (← decode (← j.getObjVal? "left") (depth+1)) (← decode (← j.getObjVal? "right") (depth+1))
 | "imax" => return .imax (← decode (← j.getObjVal? "left") (depth+1)) (← decode (← j.getObjVal? "right") (depth+1))
 | "param" => return .param (← jsonName (← j.getObjVal? "nameParts"))
 | "mvar" => return .mvar ⟨← jsonName (← j.getObjVal? "idNameParts")⟩
 | _ => throw "Unknown Level constructor"

def compactGraph (s : Shared) : Except String Shared := do
 let mut out := s
 for i in [:s.kind.size] do
  if s.kind[i]! == 3 then
   let l ← decode (← s.payloads[i]!.getObjVal? "level")
   out := {out with payloads := out.payloads.set! i (obj [("level",levelCompact l)])}
  if s.kind[i]! == 4 then
   let p := s.payloads[i]!
   let ls ← p.getObjValAs? (Array Json) "levels"
   let ls ← ls.mapM fun j => return levelCompact (← decode j)
   out := {out with payloads := out.payloads.set! i (obj [("name",← p.getObjVal? "name"),("nameParts",← p.getObjVal? "nameParts"),("levels",toJson ls)])}
 return out
end AtlasLevelTransport

universe u v
namespace AtlasLevelProofs
def identity (α : Sort u) (x : α) : α := x
theorem reflexive (α : Sort u) (x : α) : identity α x = x := rfl
def compose (α : Sort u) (β : Sort v) (f : α → β) (x : α) : β := f (identity α x)
def localLet (α : Sort u) (x : α) : α := let y : α := x; y
def dependent (α : Sort u) (β : α → Sort v) (f : (x : α) → β x) (x : α) : β x := f x
end AtlasLevelProofs

run_cmd do
 let u := Level.param `u
 let v := Level.param `v
 let mut shared := u
 for _ in [:80] do shared := .max shared shared
 let mut deep := Level.zero
 for _ in [:200] do deep := .succ deep
 let numeric := Name.num .anonymous 1
 let textual := Name.str .anonymous "1"
 let hugeName := Name.num .anonymous (2^100+1)
 let levels : Array Level := #[.zero,.succ .zero,.max u .zero,.imax u v,u,.mvar ⟨`openUniverse⟩,
  .max u v,.imax u .zero,.imax u (.succ v),.max (.succ u) (.succ v),.imax (.max u v) (.imax v u),
  .param numeric,.param textual,.param hugeName,shared,deep,.max (.param numeric) (.param textual),.max v u]
 let labels := #["zero","successor","raw max u 0","imax u v","parameter u","unresolved metavariable",
  "max u v","imax u 0","imax u (v+1)","max (u+1) (v+1)","nested imax","numeric name 1","string name 1","large numeric name",
  "shared raw max, 80 levels (structural control)","200 successors","two distinct structured names","reversed max v u"]
 let mut cases : Array Json := #[]
 for i in [:levels.size] do
  let l := levels[i]!
  let adaptive := level l
  let compact := levelCompact l
  let .ok decoded := AtlasLevelTransport.decode adaptive | throwError "Adaptive Level roundtrip {i}"
  let .ok decodedCompact := AtlasLevelTransport.decode compact | throwError "Compact Level roundtrip {i}"
  -- Recursive equality between independently allocated shared trees can repeat
  -- the same pair exponentially. Compare their complete postorder DAG tables.
  unless levelCompact decoded == compact && levelCompact decodedCompact == compact do throwError "Raw Level DAG changed {i}"
  let (r,pool) := internLevel l {}
  if pool.expanded[r]! <= 256 then
   unless decoded == l && decodedCompact == l do throwError "Small raw Level equality changed {i}"
  let (_,s) := intern (.sort l) {}
  unless s.payloads[0]! == obj [("level",adaptive)] do throwError "Production Expr serializer bypasses Level transport"
  cases := cases.push (obj [("adaptive",adaptive),("compact",compact),("rawStructuralRoundtrip",toJson true),
   ("kernelChecked",toJson false),("sourceExprGraph",graphJson s),("sourceConstantGraph",graphJson (intern (.const ``id [l]) {}).2)])
 let mut balanced := u
 for _ in [:7] do balanced := .max balanced balanced
 let depth32 := (List.range 32).foldl (fun l _ => Level.succ l) Level.zero
 let boundaries := #[(balanced,false),(.succ balanced,false),(.succ (.succ balanced),true),(depth32,false),(.succ depth32,true)]
 let mut thresholds : Array Json := #[]
 for (l,expectedDag) in boundaries do
  let encoded := level l
  unless (encoded.getObjValAs? String "encoding").isOk == expectedDag do throwError "Adaptive threshold changed"
  let .ok decoded := AtlasLevelTransport.decode encoded | throwError "Threshold decoder failed"
  unless levelCompact decoded == levelCompact l do throwError "Threshold structure changed"
  let (root,pool) := internLevel l {}
  thresholds := thresholds.push (obj [("adaptive",encoded),("expectedDag",toJson expectedDag),("occurrences",str (toString pool.expanded[root]!)),("depth",nat pool.depth[root]!)])
 let mut proofs : Array Json := #[]
 for name in [``AtlasLevelProofs.identity,``AtlasLevelProofs.reflexive,``AtlasLevelProofs.compose,``AtlasLevelProofs.localLet,``AtlasLevelProofs.dependent] do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "Missing native proof body"
  let _ ← match Kernel.check (← getEnv) {} info.type with | .ok t => pure t | .error _ => throwError "Type failed kernel check"
  let _ ← match Kernel.check (← getEnv) {} value with | .ok t => pure t | .error _ => throwError "Body failed kernel check"
  liftTermElabM fun _ => kernelAs value info.type
  let (t,s) := intern info.type {}
  let (b,s) := intern value s
  let .ok compact := AtlasLevelTransport.compactGraph s | throwError "Compact source graph failed"
  let inferred ← liftTermElabM fun _ => kernelType value
  let (it,types) := intern inferred {}
  let .ok compactTypes := AtlasLevelTransport.compactGraph types | throwError "Compact inferred graph failed"
  proofs := proofs.push (obj [("name",str name.toString),("typeText",str (← liftTermElabM fun _ => prettyType info.type)),("typeTextIsPresentation",toJson true),("kind",str (AtlasLibrary.kind info)),("levelParams",toJson (info.levelParams.map (·.toString))),("kernelCheck",str "PASS"),("kernelDeclaredConversion",str "PASS"),
   ("rootPaths",toJson #["root.type","root.value"]),("roots",toJson #[t,b]),("legacy",graphJson s),("compact",graphJson compact),
   ("inferredTypeRoot",nat it),("inferredType",graphJson types),("compactInferredType",graphJson compactTypes)])
 liftIO <| IO.FS.writeFile "TRANSPORT_OUTPUT" (obj [("format",str "ProofAtlasLevelTransportControls/1"),
  ("leanVersion",str Lean.versionString),("labels",toJson labels),("cases",toJson cases),("sharedControl",obj [("root",nat 14),("uniqueNodes",nat 81),("occurrences",str (toString (2^81-1 : Nat))),("kernelChecked",toJson false)]),("proofs",toJson proofs),("thresholds",toJson thresholds),
  ("scope",str "Fresh native Level transport and five core-only declarations. Large shared Level shapes are structural controls, not an AI proof benchmark.")]).compress
