/- Small kernel-checked binding scopes and an exponentially shared proof.
   Names, binder visibility and nondep flags do not substitute for lexical use. -/
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes AtlasBindingUsesOracle
syntax "#atlas_binding_controls " str : command
elab_rules : command
 | `(#atlas_binding_controls $output:str) => do
  let natType := mkConst ``Nat
  let sortType := mkSort (Level.succ Level.zero)
  let usedLet := Expr.lam `x natType (.letE `x natType (.bvar 0) (.bvar 0) true) .default
  let unusedLet := Expr.lam `x natType (.letE `x natType (.bvar 0) (.bvar 1) false) .default
  let shadow := Expr.lam `x sortType (.lam `x (.bvar 0) (.bvar 0) .implicit) .default
  let dependent := Expr.forallE `x sortType (.forallE `x (.bvar 0) (.bvar 1) .default) .default
  let mut deep := Expr.bvar 512
  for _ in [:513] do deep := .lam `x natType deep .default
  let mut type := mkAppN (mkConst ``Eq [Level.succ Level.zero]) #[natType,.bvar 0,.bvar 0]
  let mut proof := mkAppN (mkConst ``Eq.refl [Level.succ Level.zero]) #[natType,.bvar 0]
  for _ in [:80] do
   proof := mkAppN (mkConst ``And.intro) #[type,type,proof,proof]
   type := mkApp2 (mkConst ``And) type type
  let shared := Expr.lam `n natType proof .default
  let examples := #[("used-let",usedLet),("unused-let",unusedLet),("shadowed-domain",shadow),
                    ("dependent-forall",dependent),("wide-scope-fallback",deep),("shared-proof-80",shared)]
  let mut records : Array Json := #[]
  for (name,e) in examples do
   let _ ← liftTermElabM fun _ => kernelType e
   let (root,graph) := intern e {}
   let mut bindings : Array Json := #[]
   for (wrapped,node) in graph.seen.toList do
    let body ← match wrapped.val with
     | .lam _ _ b _ | .forallE _ _ b _ | .letE _ _ _ b _ => pure b
     | _ => continue
    let count := match (references body 0 0).run {} with
     | .ok (n,_) => obj [("status",str "counted"),("occurrences",str (toString n))]
     | .error reason => obj [("status",str "unavailable"),("reason",str reason)]
    bindings := bindings.push (obj [("node",nat node),("hasReference",toJson (body.hasLooseBVar 0)),("count",count)])
   records := records.push (obj [("name",str name),("kernelCheck",str "PASS"),("root",nat root),
    ("graph",graphJson graph),("bindings",toJson bindings)])
  let convertedType := mkApp (mkLambda `T .default sortType (.bvar 0)) natType
  let converted := mkApp (mkLambda `declared .default convertedType (.bvar 0)) (mkNatLit 0)
  let _ ← liftTermElabM fun _ => kernelType converted
  let wrong := mkApp (mkLambda `declared .default natType (.bvar 0)) (mkConst ``True.intro)
  match Kernel.check (← getEnv) {} wrong with
  | .ok _ => throwError "Kernel accepted a body at the wrong declared type"
  | .error _ => pure ()
  liftIO <| IO.FS.writeFile output.getString (obj [("format",str "ProofAtlasBindingControls/1"),
   ("convertibleDeclaredTypeAccepted",toJson true),("wrongDeclaredTypeRejected",toJson true),("examples",toJson records)]).compress
