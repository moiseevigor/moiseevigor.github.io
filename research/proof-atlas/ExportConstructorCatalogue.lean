import ExportLibrary
/- Native constructor metadata is independent of inferred source-occurrence types. -/
open Lean Elab Command Meta
namespace AtlasConstructorCatalogue
open AtlasLibrary

def readName (j : Json) : Except String Name := do
 let mut n := Name.anonymous
 for part in ← j.getArr? do
  if let .ok s := part.getObjValAs? String "str" then n := .str n s
  else
   let s ← part.getObjValAs? String "num"
   let some k := s.toNat? | throw "Invalid numeric name component"
   n := .num n k
 return n

def readLevels (j : Json) : Except String (List Level) := do
 if j == Json.null then return []
 let kinds ← j.getObjValAs? (Array String) "kind"
 let children ← j.getObjValAs? (Array (Array Nat)) "children"
 let payloads ← j.getObjValAs? (Array Json) "payloads"
 let roots ← j.getObjValAs? (Array Nat) "roots"
 unless kinds.size <= 4096 && children.size == kinds.size && payloads.size == kinds.size && roots.size <= 128 do throw "Level DAG bound"
 let mut values : Array Level := #[]
 for k in [:kinds.size] do
  let cs := children[k]!
  unless cs.all (· < k) do throw "Level DAG order"
  let value ← match kinds[k]!,cs.toList with
   | "zero",[] => pure Level.zero
   | "succ",[a] => pure (.succ values[a]!)
   | "max",[a,b] => pure (.max values[a]! values[b]!)
   | "imax",[a,b] => pure (.imax values[a]! values[b]!)
   | "param",[] => do
    let n ← readName (← payloads[k]!.getObjVal? "nameParts")
    unless n.toString == (← payloads[k]!.getObjValAs? String "name") do throw "Level name mismatch"
    pure (.param n)
   | _,_ => throw "Unsupported Level payload"
  values := values.push value
 unless roots.all (· < values.size) do throw "Level root"
 return roots.toList.map (values[·]!)

def names (ns : List Name) : Json := toJson (ns.map fun n => obj [("name",str n.toString),("nameParts",toJson (nameParts n))])
def graph (s : Shared) : Json := obj [("kind",toJson s.kind),("children",toJson s.children),("payloads",toJson s.payloads),
 ("expanded",toJson (s.expanded.map (toString ·))),("neededScope",toJson s.neededScope)]

def exportCatalogue (request : Json) : MetaM Json := do
 let constants ← ofExcept <| request.getObjValAs? (Array Json) "constants"
 unless constants.size <= 16384 do throwError "Constant inventory bound"
 let mut s : Shared := {}
 let mut constructors : Array Json := #[]
 let mut inductives : Array Json := #[]
 let mut seen : NameSet := {}
 let mut knownOther := 0
 let mut missing := 0
 let env ← getEnv
 for item in constants do
  let n ← ofExcept <| readName (← ofExcept <| item.getObjVal? "nameParts")
  unless n.toString == (← ofExcept <| item.getObjValAs? String "name") do throwError "Name identity mismatch"
  match env.find? n with
  | none => missing := missing + 1
  | some (.ctorInfo c) =>
   unless c.numParams+c.numFields <= 256 do throwError "Constructor telescope bound"
   let .ok _ := Kernel.check env {} c.type | throwError "Kernel rejected constructor type"
   let (r,next) := intern c.type s
   s := next
   let mut instances : Array Json := #[]
   for input in ← ofExcept <| item.getObjValAs? (Array Json) "instances" do
    unless instances.size < 4096 do throwError "Instance inventory bound"
    let us ← ofExcept <| readLevels (← ofExcept <| input.getObjVal? "graph")
    unless us.length == c.levelParams.length do throwError "Constructor universe arity"
    let .ok actual := Kernel.check env {} (mkConst n us) | throwError "Kernel rejected constructor instance"
    let (ir,next) := intern actual s
    s := next
    instances := instances.push (obj [("levels",toJson (us.map level)),("typeRoot",nat ir),("kernelTypeCheck",str "PASS")])
   let text ← withOptions (fun o => ((o.set `pp.maxDepth (16 : Nat)).set `pp.maxSteps (5000 : Nat)).set `pp.width (80 : Nat)) do
    return (← ppExpr c.type).pretty
   constructors := constructors.push (obj [("name",str n.toString),("nameParts",toJson (nameParts n)),
    ("inductive",str c.induct.toString),("inductiveNameParts",toJson (nameParts c.induct)),("index",nat c.cidx),
    ("parameters",nat c.numParams),("fields",nat c.numFields),("unsafe",toJson c.isUnsafe),
    ("levelParams",names c.levelParams),("instances",toJson instances),("typeText",str text),("typeTextIsPresentation",toJson true),("typeRoot",nat r),("kernelTypeCheck",str "PASS")])
   if !seen.contains c.induct then
    let .inductInfo i ← getConstInfo c.induct | throwError "Missing native inductive metadata"
    let .ok _ := Kernel.check env {} i.type | throwError "Kernel rejected inductive type"
    let (r,next) := intern i.type s
    s := next
    inductives := inductives.push (obj [("name",str i.name.toString),("nameParts",toJson (nameParts i.name)),
     ("parameters",nat i.numParams),("indices",nat i.numIndices),("constructors",names i.ctors),
     ("levelParams",names i.levelParams),("recursive",toJson i.isRec),("unsafe",toJson i.isUnsafe),
     ("typeRoot",nat r),("kernelTypeCheck",str "PASS")])
    seen := seen.insert c.induct
  | some _ => knownOther := knownOther + 1
 unless s.kind.size <= 131072 && constructors.size <= 2048 do throwError "Catalogue bound"
 return obj [("format",str "ProofAtlasConstructorCatalogue/1"),("leanVersion",str "4.33.1"),
  ("edition",← ofExcept <| request.getObjVal? "edition"),("sources",← ofExcept <| request.getObjVal? "sources"),
  ("constructors",toJson constructors),("inductives",toJson inductives),("graph",graph s),
  ("inventory",obj [("requested",nat constants.size),("constructors",nat constructors.size),
   ("knownOther",nat knownOther),("unavailable",nat missing)])]
end AtlasConstructorCatalogue
syntax "#atlas_constructor_catalogue " str " => " str : command
elab_rules : command
 | `(#atlas_constructor_catalogue $input:str => $output:str) => do
  let request ← liftIO <| IO.FS.readFile input.getString
  let j ← ofExcept <| Json.parse request
  let result ← liftTermElabM <| AtlasConstructorCatalogue.exportCatalogue j
  liftIO <| IO.FS.writeFile output.getString result.compress
