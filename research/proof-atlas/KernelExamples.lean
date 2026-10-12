import Lean

-- Check constructed closed terms with the kernel, not just their Expr type.
-- fvar/mvar and loose bvar examples deliberately belong to open contexts.
open Lean Meta
run_meta do
  let nat := Expr.const `Nat []
  let zero := Expr.const `Nat.zero []
  let succ := Expr.const `Nat.succ []
  let terms := [
    Expr.sort .zero,
    nat,
    Expr.app succ zero,
    Expr.lam `x nat (.bvar 0) .default,
    Expr.forallE `x nat nat .default,
    Expr.letE `n nat (.lit (.natVal 2)) (.app succ (.bvar 0)) false,
    Expr.lit (.natVal 42),
    Expr.lit (.strVal "Lean"),
    Expr.mdata {} zero]
  for term in terms do checkWithKernel term
  -- An open local variable is scoped; abstraction yields a closed bvar term.
  withLocalDeclD `p (mkApp2 (mkConst `Prod [.zero, .zero]) nat (mkConst `Bool)) fun p => do
    let projection := Expr.proj `Prod 0 p
    checkWithKernel (← mkLambdaFVars #[p] projection)
  -- An invalid projection is a genuine negative control.
  let invalid := Expr.proj `Nat 4 zero
  unless (← observing? (checkWithKernel invalid)).isNone do
    throwError "Invalid projection unexpectedly passed kernel checking"

#check Lean.Expr.bvar
#check Lean.Expr.fvar
#check Lean.Expr.mvar
#check Lean.Expr.sort
#check Lean.Expr.const
#check Lean.Expr.app
#check Lean.Expr.lam
#check Lean.Expr.forallE
#check Lean.Expr.letE
#check Lean.Expr.lit
#check Lean.Expr.mdata
#check Lean.Expr.proj
