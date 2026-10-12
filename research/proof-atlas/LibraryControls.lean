import ExportLibrary
open Lean Elab Command Meta AtlasLibrary
set_option maxHeartbeats 0
run_cmd do
  let env ← getEnv
  let n := mkConst ``Nat
  let z := mkNatLit 0
  let expressions : Array Expr := #[.bvar 0, .fvar ⟨`localX⟩, .mvar ⟨`openGoal⟩,
    .sort .zero, n, .app (mkConst ``Nat.succ) z,
    .lam `x n (.bvar 0) .implicit, .forallE `x n n .instImplicit,
    .letE `x n z (.bvar 0) false, .lit (.strVal "actual literal"),
    .mdata {entries := [(`tag, .ofBool true)]} n, .proj ``Prod 0 (mkConst ``Prod.mk)]
  let levels := [Level.zero, .succ .zero, .max (.param `u) .zero,
    .imax (.param `u) (.param `v), .param `u, .mvar ⟨`openUniverse⟩]
  let fixtures := expressions.map fun e =>
    let t := visit e (-1) [] {}
    obj [("parent", toJson t.parent), ("kind", toJson t.kind), ("size", toJson t.size),
      ("payloads", toJson t.payloads), ("binder", toJson t.binder)]
  unless fixtures.size == 12 do throwError "Constructor fixture inventory incomplete"
  for bad in [Expr.bvar 0, Expr.fvar ⟨`localX⟩, Expr.mvar ⟨`openGoal⟩, Expr.proj ``Nat 0 z] do
    if let .ok _ := Kernel.check env {} bad then throwError "Kernel rejection control accepted an invalid/open expression"
  let falseType := mkApp3 (mkConst ``Eq [.succ .zero]) n z (mkNatLit 1)
  let refl := mkApp2 (mkConst ``Eq.refl [.succ .zero]) n z
  let inferred ← match Kernel.check env {} refl with
    | .ok t => pure t
    | .error _ => throwError "Valid reflexivity control failed"
  if ← liftTermElabM fun _ => isDefEq inferred falseType then throwError "False proof body/type control accepted 0=1"
  unless nameParts (.num .anonymous 1) != nameParts (.str .anonymous "1") do
    throwError "Name serialization conflated numeric and string name components"
  let mut repeated := mkConst ``Nat
  for _ in [:80] do repeated := .app repeated repeated
  let (r,shared) := intern repeated {}
  unless shared.kind.size == 81 && shared.expanded[r]! == 2^81-1 do
    throwError "Shared graph expanded an exponential fixture or lost occurrences"
  let variants := [Expr.lam `x n (.bvar 0) .default, Expr.lam `y n (.bvar 0) .default,
    Expr.lam `x n (.bvar 0) .implicit,
    Expr.mdata {entries := [(`tag,.ofBool true)]} n,
    Expr.mdata {entries := [(`tag,.ofBool false)]} n]
  let mut seen : Shared := {}
  let mut ids : Array Nat := #[]
  for e in variants do
    let (i,next) := intern e seen
    seen := next
    ids := ids.push i
  unless ids.toList.eraseDups.length == 5 do
    throwError "Structural interning erased binder names, annotations or metadata"
  let (openRoot,openDag) := intern (.bvar 2) {}
  unless openDag.neededScope[openRoot]! == 3 do throwError "Scope control failed"
  let huge := 2^100+1
  let (_,literalPayload) := classify (.lit (.natVal huge))
  let value ← match literalPayload.getObjValAs? String "value" with
    | .ok v => pure v
    | .error _ => throwError "Large natural literal has wrong encoding"
  unless value == toString huge do throwError "Large natural literal lost precision"
  liftIO <| IO.FS.writeFile "/tmp/proof-atlas-kernel-controls.json" (obj [
    ("status", str "PASS"), ("exponentialFixture", obj [("uniqueNodes", nat shared.kind.size), ("occurrences", str (toString shared.expanded[r]!))]), ("binderAndMetadataVariantsDistinct", toJson true), ("largeNaturalLiteralExact", toJson true), ("constructors", toJson fixtures), ("levels", toJson (levels.map level)),
    ("rejectedOpenOrInvalidExpressions", nat 4), ("falseBodyTypeRejected", toJson true),
    ("numericNameIdentityPreserved", toJson true)]).pretty
  logInfo "All twelve Expr fixtures and all six Level fixtures serialized; four open/invalid expressions and a false body/type claim rejected."
