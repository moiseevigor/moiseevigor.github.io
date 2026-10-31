/- Compiled standalone. Imported constant data are used only by direct kernel
   operations; no MetaM operation runs with uninitialized extensions. -/
namespace AtlasNotationKernelCatalog
open Lean AtlasLibrary AtlasPacketReplay

def required (value : Except String α) : IO α :=
  match value with | .ok a => pure a | .error e => throw (IO.userError e)

def run (request output : System.FilePath) : IO Unit := do
  let input ← required <| Json.parse (← IO.FS.readFile request)
  let names ← required <| input.getObjValAs? (Array Json) "names"
  let sourceFile ← required <| input.getObjValAs? String "sourceGraph"
  let packet ← required <| Json.parse (← IO.FS.readFile sourceFile)
  let values ← required <| decode packet
  let roots ← required <| packet.getObjValAs? (Array Nat) "roots"
  let env ← importModules #[{module:=`Mathlib,importAll:=true},{module:=`Aesop,importAll:=true},
    {module:=`SE2Conjugate.Riccati,importAll:=true}] {} (trustLevel:=0) (loadExts:=false)
  let some original := env.find? `JacobiData.slope_bound_abs | throw (IO.userError "Missing original support")
  let some body := original.value? true | throw (IO.userError "Missing original body")
  unless (⟨body⟩ : ExprStructEq) == ⟨values[roots[0]!]!⟩ &&
      (⟨original.type⟩ : ExprStructEq) == ⟨values[roots[1]!]!⟩ do
    throw (IO.userError "Original type/body does not match pinned compiled source")
  let mut signatures := #[]
  for query in names do
    let name ← required <| AtlasPacketReplay.name query "nameParts" "name"
    let some info := env.find? name | throw (IO.userError ("Missing signature: " ++ name.toString))
    unless (Kernel.check env {} info.type).isOk do throw (IO.userError "Signature kernel check")
    let mut type := info.type
    let mut binders := #[]
    while let .forallE name _ body bi := type do
      binders := binders.push <| obj [("name",str name.toString),("nameParts",toJson (nameParts name)),
        ("binderInfo",str (AtlasLibrary.bi bi))]
      type := body
    signatures := signatures.push <| obj [("name",str name.toString),("nameParts",toJson (nameParts name)),
      ("levelParams",toJson (info.levelParams.map nameParts)),("arity",toJson binders.size),
      ("binders",toJson binders),("graph",graph #[info.type]),("kernelSignature",str "PASS")]
  IO.FS.writeFile output (obj [("format",str "ProofAtlasNotationExtraNative/1"),
    ("signatures",toJson signatures),("sourceRiccatiTypeBodyMatch",str "PASS"),
    ("loadExts",toJson false),("trustLevel",toJson (0:Nat)),
    ("importedModules",toJson env.header.moduleNames.size)]).compress
end AtlasNotationKernelCatalog

def main (args : List String) : IO Unit := do
  match args with
  | [root,request,output] =>
    Lean.initSearchPath root
    AtlasNotationKernelCatalog.run request output
  | _ => throw (IO.userError "Expected root, request, output")
