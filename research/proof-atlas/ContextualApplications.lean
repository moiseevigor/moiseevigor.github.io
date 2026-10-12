import Lean

/- Proof Atlas: check the *closed abstraction* of a contextual application.
   inferType is used for a candidate type, never as proof of well-typedness. -/
open Lean Meta
namespace ProofAtlas.ContextProbe
theorem fact (n : Nat) : n = n := rfl
end ProofAtlas.ContextProbe

run_meta do
  let f := mkConst `ProofAtlas.ContextProbe.fact
  let three := mkNatLit 3
  let closed := mkApp f three
  let closedType ← inferType closed
  let expected ← mkEq three three
  unless (← isDefEq closedType expected) do
    throwError "Closed application does not infer its expected equality"
  checkWithKernel closed
  withLocalDeclD `n (mkConst `Nat) fun n => do
    let application := mkApp f n
    let candidate ← inferType application
    let expected ← mkEq n n
    unless (← isDefEq candidate expected) do
      throwError "Scoped application result is not n = n"
    let asserted := Expr.app (Expr.lam `w candidate (.bvar 0) .default) application
    let closedWitness ← mkLambdaFVars #[n] asserted
    checkWithKernel closedWitness
  let bad := mkApp f (mkConst `Bool.true)
  unless (← observing? (checkWithKernel bad)).isNone do
    throwError "Ill-typed application passed kernel check"
