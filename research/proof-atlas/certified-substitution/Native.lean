/- Finite codec/oracle bridge for the proof-carrying executor. The source
   interpreter occurs only in erased proof fields, never in native evaluation. -/
namespace ProofAtlas.CertifiedSubstitutionNative
open Lean ProofAtlas.CertifiedSubstitution
open ProofAtlas.SourceRecoveryNative (required compare graph)

def child (cs : Array Nat) (slot parent : Nat) : Except String (Fin parent) := do
  let some i := cs[slot]? | throw "Missing constructor field"
  if h : i < parent then return ⟨i,h⟩
  else throw "Non-postorder child"

def frame (i : Nat) (e : Expr) (cs : Array Nat) : Except String (Frame (Fin i)) := do
  let c := fun j => child cs j i
  match e with
  | .bvar n => return .bvar n
  | .fvar n => return .fvar n
  | .mvar n => return .mvar n
  | .sort u => return .sort u
  | .const n us => return .const n us
  | .app .. => return .app (← c 0) (← c 1)
  | .lam n _ _ bi => return .lam n (← c 0) (← c 1) bi
  | .forallE n _ _ bi => return .forallE n (← c 0) (← c 1) bi
  | .letE n _ _ _ nd => return .letE n (← c 0) (← c 1) (← c 2) nd
  | .lit l => return .lit l
  | .mdata md _ => return .mdata md (← c 0)
  | .proj n j _ => return .proj n j (← c 0)

def fromRows (rows : Array ((i : Nat) × Frame (Fin i))) : Graph := fun i =>
  if let some p := rows[i]? then
    if h : p.1 = i then h ▸ p.2 else .bvar 0
  else .bvar 0

def same (a b : Expr) : IO Unit := do
  unless (← required ((compare a b).run {})).1 do
    throw (IO.userError "Certified result/model mismatch")

def arguments (rows : Array Expr) (q : Json) : IO (Nat × Array Nat × Nat × Nat) := do
  let root ← required (q.getObjValAs? Nat "root")
  let images ← required (q.getObjValAs? (Array Nat) "images")
  let expected ← required (q.getObjValAs? Nat "expected")
  let scope ← required (q.getObjValAs? Nat "targetScope")
  unless root < rows.size && expected < rows.size && images.all (· < rows.size) &&
      images.size ≤ 512 && scope ≤ 512 do throw (IO.userError "Query address/scope bound")
  return (root,images,expected,scope)

def run (mode : String) (packet : Json) : IO Json := do
  let raw ← required (packet.getObjVal? "graph")
  let rows ← required (AtlasPacketReplay.decode raw)
  let queries ← required (packet.getObjValAs? (Array Json) "queries")
  unless queries.size > 0 && queries.size ≤ 4096 do throw (IO.userError "Query count bound")
  let mut results : Array Json := #[]
  if mode == "primitive" then
    for q in queries do
      let (root,images,expected,scope) ← arguments rows q
      let out := rows[root]!.instantiateRev (images.map (rows[·]!))
      same out rows[expected]!
      unless out.looseBVarRange ≤ scope do throw (IO.userError "Primitive explicit scope")
      results := results.push (Json.mkObj [("index",← required (q.getObjVal? "index")),("status",toJson "PASS")])
    return Json.mkObj [("status",toJson "PASS"),("mode",toJson mode),("queries",toJson results)]
  unless mode == "certified" do throw (IO.userError "Unknown mode")
  let children ← required (raw.getObjValAs? (Array (Array Nat)) "children")
  let mut frames : Array ((i : Nat) × Frame (Fin i)) := #[]
  for i in [:rows.size] do frames := frames.push ⟨i,← required (frame i rows[i]! children[i]!)⟩
  let g := fromRows frames
  let copyAction : StateT (Work g #[]) (Except String) (Array Expr) := do
    let mut output : Array Expr := #[]
    for i in [:rows.size] do output := output.push (← copyGraph g #[] 262144 513 i).val
    return output
  let (copies,copyWork) ← required (copyAction.run {})
  for q in queries do
    let (root,images,expected,scope) ← arguments rows q
    let initial : Work g images := {copies := copyWork.copies}
    let (out,work) ← required ((substituteGraph g images 262144 513 root 0).run initial)
    same out.val rows[expected]!
    unless out.val.looseBVarRange ≤ scope && work.size ≤ 262144 do
      throw (IO.userError "Certified scope/table bound")
    results := results.push (Json.mkObj [("index",← required (q.getObjVal? "index")),
      ("status",toJson "PASS"),("proof",toJson "Substituted.property"),
      ("copyStates",toJson work.copies.size),("renamingStates",toJson work.renamings.size),
      ("substitutionStates",toJson work.substitutions.size),("totalStates",toJson work.size)])
  -- Explicit resource refusal is independent of a mathematical counterexample.
  let depthRefused := match (substituteGraph g #[] 262144 0 0 0).run {} with
    | .error _ => true
    | .ok _ => false
  let tableRefused := match (substituteGraph g #[] 0 513 0 0).run {} with
    | .error _ => true
    | .ok _ => false
  unless depthRefused && tableRefused do throw (IO.userError "Missing resource refusal")
  return Json.mkObj [("status",toJson "PASS"),("mode",toJson mode),("queries",toJson results),
    ("rowRoundtrip",graph copies),("resourceRefusals",toJson (2 : Nat))]

end ProofAtlas.CertifiedSubstitutionNative

def main (args : List String) : IO UInt32 := do
  let [mode,input,output] := args | throw (IO.userError "Expected mode/input/output")
  let bytes ← IO.FS.readFile input
  unless bytes.utf8ByteSize ≤ 64*1024*1024 do throw (IO.userError "Input size bound")
  let packet ← ProofAtlas.SourceRecoveryNative.required (Json.parse bytes)
  let result ← ProofAtlas.CertifiedSubstitutionNative.run mode packet
  IO.FS.writeFile output (result.compress ++ "\n")
  return 0
