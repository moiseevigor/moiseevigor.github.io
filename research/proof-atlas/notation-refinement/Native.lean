/- Finite codec comparison against actual Expr-indexed cuts. No new typing of
   mathematical source terms, and no authentication of supplied owner hashes. -/
namespace ProofAtlas.NotationRefinement
open Lean SourceCut

def metadataControls : Except String Nat := do
  let mut checked := 0
  for value in [DataValue.ofBool true, .ofBool false, .ofString "unchanged annotation",
      .ofString "quoted \"value\"", .ofString "line\nnext", .ofString "λ → ∀"] do
    let data := KVMap.empty.set `annotation value
    let p := (AtlasLibrary.classify (.mdata data (.bvar 0))).2
    let result ← AtlasPacketReplay.refinementMetadata p
    unless result.entries == data.entries do throw "Metadata control roundtrip"
    checked := checked+1
  for value in [DataValue.ofNat 7, .ofInt (-2), .ofName `name, .ofSyntax Syntax.missing] do
    let data := KVMap.empty.set `annotation value
    let p := (AtlasLibrary.classify (.mdata data (.bvar 0))).2
    match AtlasPacketReplay.refinementMetadata p with
    | .ok _ => throw "Unsupported metadata control accepted"
    | .error _ => checked := checked+1
  return checked

def selected (values : Array Expr) (roots : Array Nat) (children : Array (Array Nat))
    (record : Json) : Except String Nat := do
  let root ← record.getObjVal? "root"
  let route ← root.getObjVal? "route"
  let index ← route.getObjValAs? Nat "root"
  let slots ← route.getObjValAs? (Array Nat) "slots"
  unless index < roots.size && slots.size <= 512 do throw "Selected route"
  let mut node := roots[index]!
  for slot in slots do
    unless node < children.size && slot < children[node]!.size do throw "Selected field"
    node := children[node]![slot]!
  unless node < values.size && node == (← root.getObjValAs? Nat "node") do throw "Selected node"
  return node

def check (request : Json) : Except String Json := do
  let g ← request.getObjVal? "graph"
  let values ← AtlasPacketReplay.decode g
  let roots ← g.getObjValAs? (Array Nat) "roots"
  let children ← g.getObjValAs? (Array (Array Nat)) "children"
  let kinds ← g.getObjValAs? (Array Nat) "kind"
  let payloads ← g.getObjValAs? (Array Json) "payloads"
  let expanded ← g.getObjValAs? (Array String) "expanded"
  unless roots.all (· < values.size) && expanded.size == values.size do throw "Source roots/counts"
  -- Exact per-row classification also checks unreachable authored fixture rows.
  -- The largest decoded expression in this finite input has 485 occurrences.
  for i in [:values.size] do
    let (kind,payload) := AtlasLibrary.classify values[i]!
    unless kind == kinds[i]! && payload == payloads[i]! do throw "Source payload roundtrip"
    let some n := expanded[i]!.toNat? | throw "Source count encoding"
    unless n <= 4096 && n == occurrences values[i]! do throw "Finite expanded count bound"
  let records ← request.getObjValAs? (Array Json) "records"
  unless records.size > 0 && records.size <= 4096 do throw "Record count bound"
  let mut referenceCoefficients := 0
  for entry in records do
    let record ← entry.getObjVal? "cut"
    let node ← selected values roots children record
    let c ← Bridge.decodeAt children node 0 values[node]! record
    let stats ← record.getObjVal? "stats"
    unless (← stats.getObjValAs? String "hidden") == toString (hidden c) do throw "Hidden count"
    unless (← stats.getObjValAs? String "represented") == toString (occurrences values[node]!) do throw "Represented count"
    let refs ← entry.getObjValAs? (Array Json) "references"
    for r in refs do
      let index ← r.getObjValAs? Nat "index"
      unless (← r.getObjValAs? String "visible") == toString (visibleReferences c index) &&
          (← r.getObjValAs? String "hidden") == toString (hiddenReferences c index) do throw "Reference coefficient"
      referenceCoefficients := referenceCoefficients+1
  let joins ← request.getObjValAs? (Array (Array Nat)) "joins"
  for indices in joins do
    unless indices.size == 4 && indices.all (· < records.size) do throw "Join indices"
    let a ← records[indices[0]!]!.getObjVal? "cut"
    let b ← records[indices[1]!]!.getObjVal? "cut"
    let j ← records[indices[2]!]!.getObjVal? "cut"
    let m ← records[indices[3]!]!.getObjVal? "cut"
    let root ← a.getObjVal? "root"
    unless [b,j,m].all (fun r => match r.getObjVal? "root" with
      | .ok owner => owner == root
      | .error _ => false) do throw "Qualified root mismatch"
    let node ← selected values roots children a
    let e := values[node]!
    let ca ← Bridge.decodeAt children node 0 e a
    let cb ← Bridge.decodeAt children node 0 e b
    let cj ← Bridge.decodeAt children node 0 e j
    let cm ← Bridge.decodeAt children node 0 e m
    let join := Union.join ca cb
    let meet := Union.meet ca cb
    unless Bridge.test join cj && Bridge.test cj join && Bridge.test meet cm && Bridge.test cm meet do
      throw "Native union/intersection mismatch"
    unless Bridge.test ca cj && Bridge.test cb cj do throw "Native refinement mismatch"
  return Json.mkObj [("records",toJson records.size),("joins",toJson joins.size),
    ("referenceCoefficients",toJson referenceCoefficients),("sourceRows",toJson values.size)]
end ProofAtlas.NotationRefinement

def main (args : List String) : IO UInt32 := do
  let [input,output] := args | throw <| IO.userError "Expected input/output paths"
  let .ok request := Lean.Json.parse (← IO.FS.readFile input) | throw <| IO.userError "Input JSON"
  let .ok requests := request.getObjValAs? (Array Lean.Json) "requests" | throw <| IO.userError "Requests"
  unless requests.size > 0 && requests.size <= 256 do throw <| IO.userError "Request count bound"
  let .ok metadataControls := ProofAtlas.NotationRefinement.metadataControls | throw <| IO.userError "Metadata controls"
  let mut results := #[]
  for r in requests do
    match ProofAtlas.NotationRefinement.check r with
    | .ok checked => results := results.push checked
    | .error reason => throw <| IO.userError reason
  IO.FS.writeFile output <| (Lean.Json.mkObj [("format",Lean.toJson "ProofAtlasNotationRefinementNative/1"),
    ("results",Lean.toJson results),("metadataControls",Lean.toJson metadataControls),
    ("mathematicalTyping",Lean.toJson false)]).compress
  return 0
