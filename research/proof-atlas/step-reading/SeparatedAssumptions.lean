-- Compiled with the project's expression interner by build-shared-case.py.
theorem separatedAssumptions (P : Prop) : (P → P ∧ P) ∧ (P → P ∧ P) :=
  And.intro (fun h => And.intro h h) (fun h => And.intro h h)

theorem distinctPremises (P : Prop) (first second : P) : P ∧ P :=
  And.intro first second

open Lean Elab Command AtlasLibrary in
run_cmd do
  let env ← getEnv
  let name := if (← IO.getEnv "ATLAS_DISTINCT_PREMISES") == some "1" then ``distinctPremises else ``separatedAssumptions
  let some (.thmInfo decl) := env.find? name | throwError "Missing theorem"
  let .ok inferred := Kernel.check env {} decl.value | throwError "Invalid proof"
  let .ok true := Kernel.isDefEq env {} inferred decl.type | throwError "Unexpected type"
  let (typeRoot, state) := intern decl.type {}
  let (bodyRoot, state) := intern decl.value state
  let packet := Json.mkObj [("name", toJson name.toString), ("roots", toJson #[typeRoot, bodyRoot]), ("kind", toJson state.kind),
    ("payloads", toJson state.payloads), ("children", toJson state.children),
    ("neededScope", toJson state.neededScope)]
  liftIO <| IO.FS.writeFile "shared-case.json" packet.compress
