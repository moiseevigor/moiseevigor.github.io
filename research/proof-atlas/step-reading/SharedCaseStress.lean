-- Appended to the standard compiled-expression exporter by build-shared-case.py.
open Lean Elab Command AtlasLibrary
private def taggedTree : Nat → Nat → Expr
  | 0, first => .letE `tag (mkConst ``Nat) (mkNatLit first) (mkBVar 1) true
  | depth+1, first =>
    mkApp2 (mkBVar 2) (taggedTree depth first) (taggedTree depth (first + 2^depth))

run_cmd do
  let t := mkConst ``True
  let disj := mkApp2 (mkConst ``Or) t t
  let fnType := Expr.forallE .anonymous t (.forallE .anonymous t t .default) .default
  let mut doubled := mkBVar 0
  for _ in [:60] do
    doubled := mkApp2 (mkBVar 2) doubled doubled
  if let some depth := (← IO.getEnv "ATLAS_TAGGED_TREE_DEPTH").bind String.toNat? then
    if depth > 18 then throwError "Tagged fixture depth exceeds 18"
    doubled := taggedTree depth 0
  let left := Expr.lam `left t doubled .default
  let right := Expr.lam `right t (mkBVar 0) .default
  let motive := Expr.lam .anonymous disj t .default
  let split := mkAppN (mkConst ``Or.casesOn) #[t,t,motive,mkBVar 0,left,right]
  let term := Expr.lam `f fnType (.lam `h disj split .default) .default
  let expected := Expr.forallE `f fnType (.forallE `h disj t .default) .default
  let env ← getEnv
  let .ok inferred := Kernel.check env {} term | throwError "Kernel rejected the shared term"
  let .ok true := Kernel.isDefEq env {} inferred expected | throwError "Unexpected proof type"
  let (root,s) := intern term {}
  let packet := Json.mkObj [("roots",toJson #[root]),("kind",toJson s.kind),
    ("payloads",toJson s.payloads),("children",toJson s.children),
    ("expanded",toJson (s.expanded.map toString)),("neededScope",toJson s.neededScope)]
  liftIO <| IO.FS.writeFile "shared-case.json" packet.compress
