import Lean
open Lean Elab Command

/- Native kernel controls for a single shared bvar in distinct lexical
contexts. These are small fixtures, not certificates for published packets. -/
run_cmd do
  let env ← getEnv
  let n := mkConst ``Nat
  let b := mkConst ``Bool
  let v := Expr.bvar 0
  let natClosed := Expr.lam `x n v .default
  let boolClosed := Expr.lam `x b v .default
  let natType ← match Kernel.check env {} natClosed with
    | .ok t => pure t
    | .error _ => throwError "Nat context rejected"
  let boolType ← match Kernel.check env {} boolClosed with
    | .ok t => pure t
    | .error _ => throwError "Bool context rejected"
  if natType == boolType then
    throwError "Distinct binders produced identical checked types"
  let dep := Expr.lam `α (.sort (.succ .zero))
    (.lam `x (.bvar 0) (.bvar 0) .default) .default
  if let .error _ := Kernel.check env {} dep then
    throwError "Dependent context closure rejected"
  let letTerm := Expr.letE `x n (mkNatLit 7) v false
  if let .error _ := Kernel.check env {} letTerm then
    throwError "Let-bound occurrence closure rejected"
  if let .ok _ := Kernel.check env {} v then
    throwError "Unbound bvar incorrectly accepted"
  let wrong := Expr.lam `x b (.app (mkConst ``Nat.succ) v) .default
  if let .ok _ := Kernel.check env {} wrong then
    throwError "Wrong lexical type incorrectly accepted"
  logInfo "Kernel contextual identity controls PASS: 4 accepted and 2 rejected."
