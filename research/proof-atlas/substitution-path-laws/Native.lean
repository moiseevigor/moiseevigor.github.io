/- Finite wire/cursor checks. Generic path laws do not prove this JSON adapter
   or the JavaScript renderer. The native proof fields are erased. -/
namespace ProofAtlas.SubstitutionPathsNative
open Lean ProofAtlas.CertifiedSubstitution ProofAtlas.SubstitutionPaths
open ProofAtlas.SourceRecoveryNative (required compare graph CompareWork)
open ProofAtlas.CertifiedSubstitutionNative (frame fromRows arguments)

def check (condition : Bool) (message : String) : IO Unit := do
  unless condition do throw (IO.userError message)

def equal (memo : IO.Ref CompareWork) (a b : Expr) : IO Unit := do
  -- Release the reference's old owner before updating the copy-on-write map.
  let previous ← memo.get
  memo.set {}
  let (same,next) ← required ((compare a b).run previous)
  check same "Expression comparison mismatch"
  memo.set next

def getPath (value : Json) (key : String) : IO (List Nat) := do
  let path ← required (value.getObjValAs? (Array Nat) key)
  check (path.size ≤ 512 && path.all (· < 3)) "Path request bound"
  return path.toList

def componentRoot (o : Json) (root expected : Nat) (images : Array Nat) : IO Nat := do
  match ← required (o.getObjValAs? String "part") with
  | "source" => return root
  | "result" => return expected
  | "image" =>
      let image ← required (o.getObjValAs? Nat "image")
      let some node := images[image]? | throw (IO.userError "Image ordinal bound")
      return node
  | _ => throw (IO.userError "Unknown component")

def locate (g : Graph) (rows : Array Expr) (memo : IO.Ref CompareWork)
    (root : Nat) (path : List Nat) : IO (Nat × Nat × Expr) := do
  let some (node,depth) := selectGraph g root path | throw (IO.userError "Graph path unavailable")
  let some (value,count) := follow rows[root]! path | throw (IO.userError "Expr path unavailable")
  check (node < rows.size && depth == count) "Graph/Expr path depth mismatch"
  equal memo value rows[node]!
  return (node,depth,value)

def owner (rows : Array Expr) (root : Nat) (path : List Nat) (part : String)
    (image : Option Nat) (binding : Json) : IO Unit := do
  let target ← required (binding.getObjVal? "address")
  check ((← required (target.getObjValAs? String "component")) == part) "Binder component mismatch"
  if let some image := image then
    check ((← required (target.getObjValAs? Nat "image")) == image) "Binder image owner mismatch"
  else check ((← required (target.getObjVal? "image")) == Json.null) "Unexpected binder image owner"
  let binderPath ← getPath target "path"
  check (binderPath.length < path.length && path.take binderPath.length == binderPath) "Binder path prefix mismatch"
  let some (binder,_) := follow rows[root]! binderPath | throw (IO.userError "Binder path unavailable")
  let slot := path[binderPath.length]!
  let some (body,1) := field binder slot | throw (IO.userError "Binder body role mismatch")
  let some (.bvar index,depth) := follow body (path.drop (binderPath.length+1))
    | throw (IO.userError "Binder variable unavailable")
  check (index == depth) "Binder owner witness mismatch"
  let name ← match binder with
    | .lam n .. | .forallE n .. | .letE n .. => pure n.toString
    | _ => throw (IO.userError "Binder constructor mismatch")
  check ((← required (binding.getObjValAs? String "name")) == name) "Binder name payload mismatch"

def bindingCheck (rows : Array Expr) (root : Nat) (path : List Nat) (part : String)
    (image : Option Nat) (depth imageCount targetScope : Nat) (e : Expr) (binding : Json) : IO Nat := do
  match e with
  | .bvar index =>
      let kind ← required (binding.getObjValAs? String "kind")
      if index < depth then
        check (kind == "local") "Local reference role mismatch"
        owner rows root path part image binding
        return 1
      let outside := index-depth
      if part == "source" && outside < imageCount then
        check (kind == "substitution-input" &&
          (← required (binding.getObjValAs? Nat "image")) == imageCount-1-outside) "Substitution-input ordinal mismatch"
      else
        let relative := if part == "source" then outside-imageCount else outside
        check (kind == "target-context" &&
          (← required (binding.getObjValAs? Nat "relativeIndex")) == relative) "Target-context index mismatch"
        if part == "source" then
          check ((← required (binding.getObjValAs? Nat "sourceRelativeIndex")) == outside) "Source remainder index mismatch"
        let expectedSlot := if relative < targetScope then toJson (targetScope-1-relative) else Json.null
        check ((← required (binding.getObjVal? "slot")) == expectedSlot) "Target-context slot mismatch"
      return 0
  | .fvar id =>
      check ((← required (binding.getObjValAs? String "kind")) == "free-identifier") "Free identifier role mismatch"
      check ((← required (binding.getObjValAs? String "id")) == reprStr id.name) "Free identifier payload mismatch"
      return 0
  | .mvar id =>
      check ((← required (binding.getObjValAs? String "kind")) == "metavariable") "Metavariable role mismatch"
      check ((← required (binding.getObjValAs? String "id")) == reprStr id.name) "Metavariable payload mismatch"
      return 0
  | _ =>
      check (binding == Json.null) "Non-reference acquired a binding portal"
      return 0

/-- Resolve the first source reference boundary using actual Expr prefixes.
    This finite classifier is checked against the JS address record; its general
    algorithm refinement is distinct from the path laws. -/
def originCheck (source : Expr) (images : Array Nat) (path : List Nat) (origin : Json) : IO Unit := do
  for n in [:path.length+1] do
    let front := path.take n
    let some (e,depth) := follow source front | throw (IO.userError "Source origin prefix unavailable")
    if let .bvar index := e then
      if depth ≤ index && index-depth < images.size then
        check ((← required (origin.getObjValAs? String "kind")) == "image") "Image origin role mismatch"
        check ((← getPath origin "usePath") == front) "Image source prefix mismatch"
        check ((← getPath origin "imagePath") == path.drop n) "Image suffix mismatch"
        check ((← required (origin.getObjValAs? Nat "image")) == images.size-1-(index-depth)) "Image origin ordinal mismatch"
        check ((← required (origin.getObjValAs? Nat "shift")) == depth) "Image origin shift mismatch"
        return
    if n == path.length then
      check ((← required (origin.getObjValAs? String "kind")) == "source" &&
        (← getPath origin "path") == path) "Preserved-source origin mismatch"
      return
  throw (IO.userError "No origin classification")

def run (packet : Json) : IO Json := do
  let raw ← required (packet.getObjVal? "graph")
  let rows ← required (AtlasPacketReplay.decode raw)
  let kinds ← required (raw.getObjValAs? (Array Nat) "kind")
  let children ← required (raw.getObjValAs? (Array (Array Nat)) "children")
  let queries ← required (packet.getObjValAs? (Array Json) "queries")
  check (rows.size > 0 && rows.size ≤ 262144 && queries.size ≤ 4096) "Packet bounds"
  let mut frames : Array ((i : Nat) × Frame (Fin i)) := #[]
  for i in [:rows.size] do frames := frames.push ⟨i,← required (frame i rows[i]! children[i]!)⟩
  let g := fromRows frames
  let memo ← IO.mkRef ({} : CompareWork)
  let mut fieldChecks := 0
  let mut ports := 0
  let mut constructorKinds := Array.replicate 12 false
  -- Calibrate the formal field convention against every original wire row.
  for i in [:rows.size] do
    check (kinds[i]! < 12) "Wire kind bound"
    constructorKinds := constructorKinds.set! kinds[i]! true
    for slot in [:4] do
      fieldChecks := fieldChecks+1
      match children[i]![slot]?, field rows[i]! slot, frameField (g i) slot with
      | none,none,none => pure ()
      | some child,some (value,depth),some (node,count) =>
          let binds := ((kinds[i]! == 6 || kinds[i]! == 7) && slot == 1) || (kinds[i]! == 8 && slot == 2)
          let expectedDepth := if binds then 1 else 0
          check (child == node.val && depth == expectedDepth && count == expectedDepth) "Wire field role mismatch"
          equal memo value rows[child]!
          ports := ports+1
      | _,_,_ => throw (IO.userError "Wire field arity mismatch")
  memo.set {}
  let copyAction : StateT (Work g #[]) (Except String) (Array Expr) := do
    let mut output : Array Expr := #[]
    for i in [:rows.size] do output := output.push (← copyGraph g #[] 262144 513 i).val
    return output
  let (copies,copyWork) ← required (copyAction.run {})
  let mut results := #[]
  for q in queries do
    memo.set {}
    let (root,images,expected,targetScope) ← arguments rows q
    let observations ← required (q.getObjValAs? (Array Json) "observations")
    check (observations.size ≤ 4096) "Observation bound"
    let initial : Work g images := {copies := copyWork.copies}
    let (output,firstWork) ← required ((substituteGraph g images 262144 513 root 0).run initial)
    let mut work := firstWork
    equal memo output.val rows[expected]!
    equal memo (rows[root]!.instantiateRev (images.map (rows[·]!))) rows[expected]!
    check (output.val.looseBVarRange ≤ targetScope) "Result scope mismatch"
    let mut sourceRelations := 0
    let mut imageRelations := 0
    let mut resultOrigins := 0
    let mut owners := 0
    for o in observations do
      let part ← required (o.getObjValAs? String "part")
      let image ← if part == "image" then
        some <$> required (o.getObjValAs? Nat "image")
        else pure none
      let component ← componentRoot o root expected images
      let path ← getPath o "path"
      let (node,depth,value) ← locate g rows memo component path
      check (node == (← required (o.getObjValAs? Nat "node"))) "Recorded row mismatch"
      check (depth == (← required (o.getObjValAs? Nat "depth"))) "Recorded depth mismatch"
      owners := owners + (← bindingCheck rows component path part image depth images.size targetScope value (← required (o.getObjVal? "binding")))
      if part == "source" then
        check ((← getPath o "resultPath") == path) "Source path transport mismatch"
        let (target,_,_) ← locate g rows memo expected path
        check (target == (← required (o.getObjValAs? Nat "resultNode"))) "Source result row mismatch"
        let (selected,next) ← required ((substituteGraph g images 262144 513 node depth).run work)
        work := next
        let some (actual,d) := follow output.val path | throw (IO.userError "Computed source path unavailable")
        check (d == depth) "Computed source depth mismatch"
        equal memo selected.val actual
        equal memo actual rows[target]!
        sourceRelations := sourceRelations+1
      else if part == "image" && (o.getObjVal? "usePath").isOk then
        let usePath ← getPath o "usePath"
        let some (.bvar index,shift) := follow rows[root]! usePath | throw (IO.userError "Source image use unavailable")
        check (shift ≤ index && index-shift < images.size) "Source use is not a supplied reference"
        check (image == some (images.size-1-(index-shift))) "Image use ordinal mismatch"
        check (shift == (← required (o.getObjValAs? Nat "shift"))) "Image shift mismatch"
        let resultPath ← getPath o "resultPath"
        check (resultPath == usePath ++ path) "Image address concatenation mismatch"
        let (target,after,_) ← locate g rows memo expected resultPath
        check (target == (← required (o.getObjValAs? Nat "resultNode")) && after == shift+depth) "Image result address mismatch"
        let (selected,next) ← required ((renameGraph g images 262144 513 shift node depth).run work)
        work := next
        let some (actual,d) := follow output.val resultPath | throw (IO.userError "Computed image suffix unavailable")
        check (d == shift+depth) "Computed image depth mismatch"
        equal memo selected.val actual
        equal memo actual rows[target]!
        imageRelations := imageRelations+1
      else if part == "result" then
        originCheck rows[root]! images path (← required (o.getObjVal? "origin"))
        resultOrigins := resultOrigins+1
    let invalid ← required (q.getObjValAs? (Array Json) "invalidPaths")
    for o in invalid do
      let component ← componentRoot o root expected images
      let path ← getPath o "path"
      match selectGraph g component path, follow rows[component]! path with
      | none,none => pure ()
      | _,_ => throw (IO.userError "Expected invalid path became valid")
    check (work.size ≤ 262144) "Certificate table bound"
    results := results.push (Json.mkObj [("index",← required (q.getObjVal? "index")),
      ("status",toJson "PASS"),("nativeInstantiation",toJson "PASS"),("observations",toJson observations.size),
      ("sourceRelations",toJson sourceRelations),("imageRelations",toJson imageRelations),
      ("resultOrigins",toJson resultOrigins),("localOwners",toJson owners),("invalidPaths",toJson invalid.size),
      ("cacheStates",toJson work.size)])
  return Json.mkObj [("format",toJson "ProofAtlasSubstitutionPathNative/1"),("status",toJson "PASS"),
    ("rowRoundtrip",graph copies),("fieldChecks",toJson fieldChecks),("validPorts",toJson ports),
    ("kernelKinds",toJson ((List.range 12).filter (fun i => constructorKinds[i]!))),
    ("queries",toJson results)]

end ProofAtlas.SubstitutionPathsNative

def main (args : List String) : IO UInt32 := do
  let [input,output] := args | throw (IO.userError "Expected input/output")
  let bytes ← IO.FS.readFile input
  unless bytes.utf8ByteSize ≤ 64*1024*1024 do throw (IO.userError "Input byte bound")
  let packet ← ProofAtlas.SourceRecoveryNative.required (Lean.Json.parse bytes)
  let result ← ProofAtlas.SubstitutionPathsNative.run packet
  IO.FS.writeFile output (result.compress ++ "\n")
  return 0
