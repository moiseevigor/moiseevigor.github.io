-- Compiled with the project's expression interner by build-shared-case.py.
theorem separatedAssumptions (P : Prop) : (P → P ∧ P) ∧ (P → P ∧ P) :=
  And.intro (fun h => And.intro h h) (fun h => And.intro h h)

theorem distinctPremises (P : Prop) (first second : P) : P ∧ P :=
  And.intro first second

-- Request primitive projections explicitly so the control tests Expr.proj, even
-- when surface field notation would elaborate to a named projection function.
open Lean Elab Term in
elab "primitiveAndField" i:num t:term:max : term => do
  return .proj ``And i.getNat (← elabTerm t none)

theorem projectedFunctions (P Q : Prop) (rules : (P → Q) ∧ (P → Q)) (p : P) : Q ∧ Q :=
  And.intro ((primitiveAndField 0 rules) p) ((primitiveAndField 1 rules) p)

theorem letFunction (P Q : Prop) (f : P → Q) (p : P) : Q ∧ P :=
  And.intro ((let f := f; f) p) p

open Lean Elab Command AtlasLibrary in
run_cmd do
  let env ← getEnv
  let name := match ← IO.getEnv "ATLAS_BINDER_CONTROL" with
    | some "distinct" => ``distinctPremises
    | some "let" => ``letFunction
    | some "projected" => ``projectedFunctions
    | _ => ``separatedAssumptions
  let some (.thmInfo decl) := env.find? name | throwError "Missing theorem"
  let .ok inferred := Kernel.check env {} decl.value | throwError "Invalid proof"
  let .ok true := Kernel.isDefEq env {} inferred decl.type | throwError "Unexpected type"
  let (typeRoot, state) := intern decl.type {}
  let (bodyRoot, state) := intern decl.value state
  let packet := Json.mkObj [("name", toJson name.toString), ("roots", toJson #[typeRoot, bodyRoot]), ("kind", toJson state.kind),
    ("payloads", toJson state.payloads), ("children", toJson state.children),
    ("neededScope", toJson state.neededScope)]
  liftIO <| IO.FS.writeFile "shared-case.json" packet.compress
