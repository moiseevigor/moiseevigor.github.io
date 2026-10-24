/- Raw Expr support facts for scoped source-use discovery. The driver prepends
   Projection.lean and Support.lean. This does not verify the JS search or typing. -/
namespace ProofAtlas.Projection

theorem above_support_absent (h : needed e ≤ i) : i ∉ support e := by
 intro hi
 have := (needed_bound (e := e) (d := i)).mp h i hi
 omega

theorem highest_support_present (h : 0 < needed e) : needed e - 1 ∈ support e := by
 apply Classical.byContradiction
 intro missing
 have all := (needed_bound (e := e) (d := needed e)).mp (Nat.le_refl _)
 have smaller : Below (support e) (needed e - 1) := by
  intro i hi
  have bound := all i hi
  have different : i ≠ needed e - 1 := by intro eq; exact missing (eq ▸ hi)
  omega
 have := (needed_bound (e := e) (d := needed e - 1)).mpr smaller
 omega

theorem mem_unbind_iff : i ∈ unbind xs ↔ i + 1 ∈ xs := by
 induction xs with
 | nil => simp [unbind]
 | cons j xs ih =>
  cases j with
  | zero => simpa [unbind] using ih
  | succ j => simpa [unbind, Nat.succ.injEq] using or_congr (by omega : i = j ↔ i + 1 = j + 1) ih

theorem lambda_use_fields :
    i ∈ support (.lam n t b bi) ↔ i ∈ support t ∨ i + 1 ∈ support b := by
 simp [support, mem_unbind_iff]

theorem forall_use_fields :
    i ∈ support (.forallE n t b bi) ↔ i ∈ support t ∨ i + 1 ∈ support b := by
 simp [support, mem_unbind_iff]

theorem let_use_fields :
    i ∈ support (.letE n t v b nd) ↔
      (i ∈ support t ∨ i ∈ support v) ∨ i + 1 ∈ support b := by
 simp [support, mem_unbind_iff, or_assoc]

open Lean Elab Command Meta
syntax "#atlas_use_navigation " str : command
elab_rules : command
 | `(#atlas_use_navigation $output:str) => do
  let names := #[``above_support_absent, ``highest_support_present,
    ``mem_unbind_iff, ``lambda_use_fields, ``forall_use_fields, ``let_use_fields]
  let mut rows : Array Json := #[]
  for name in names do
   let .thmInfo value ← getConstInfo name | throwError "Expected theorem {name}"
   for e in [value.type, value.value,
       mkApp (mkLambda `expected .default value.type (.bvar 0)) value.value] do
    match Kernel.check (← getEnv) {} e with
    | .ok _ => pure ()
    | .error err => throwError "Use navigation kernel check: {err.toMessageData (← getOptions)}"
   let axioms ← collectAxioms name
   unless axioms.all (fun a => a == ``propext || a == ``Quot.sound || a == ``Classical.choice) do
    throwError "Unexpected assumption: {axioms}"
   let text ← liftTermElabM fun _ => do return (← ppExpr value.type).pretty
   rows := rows.push (Json.mkObj [("name", toJson name.toString), ("type", toJson text),
     ("axioms", toJson (axioms.map Name.toString)), ("kernelType", toJson "PASS"),
     ("kernelProof", toJson "PASS"), ("kernelExpectedTypeConversion", toJson "PASS")])
  liftIO <| IO.FS.writeFile output.getString (Json.mkObj [
    ("format", toJson "ProofAtlasUseNavigationTheory/1"), ("theorems", toJson rows)]).compress
end ProofAtlas.Projection
