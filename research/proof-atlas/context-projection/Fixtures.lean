/- Own compiled bridge fixtures. Open expressions have no typing claim. -/
open Lean Elab Command Meta AtlasLibrary
namespace ProofAtlas.Projection

def graph (e : Expr) : Json :=
 let (root,s) := intern e {}
 Json.mkObj [("serialization",toJson "ExprDAG/1"),("kind",toJson s.kind),
  ("children",toJson s.children),("payloads",toJson s.payloads),
  ("expanded",toJson (s.expanded.map (toString ·))),
  ("neededScope",toJson s.neededScope),("roots",toJson #[root])]

def kept (depth mask : Nat) : Array Nat :=
 (List.range depth).filter (fun i => mask / 2^i % 2 == 1) |>.toArray

def indices (depth : Nat) (slots : Array Nat) : List Nat :=
 slots.toList.reverse.map (fun slot => depth-1-slot)

def samples (depth : Nat) : Array (String × Expr) := Id.run do
 let i := depth-1
 let x := Expr.bvar i
 let nat := mkConst ``Nat
 let data := (KVMap.empty.setBool `flag false).setString `opaque "unchanged annotation"
 let u := Level.param (.num .anonymous 1)
 let mut shared := u
 for _ in [:40] do shared := .max shared shared
 let mut es : Array (String × Expr) := #[
  ("ambient",x),("innermost-ambient",.bvar 0),("escaped-ambient",.bvar depth),
  ("free-variable",.fvar ⟨.num (.str .anonymous "local") 11⟩),
  ("expression-metavariable",.mvar ⟨.num (.str .anonymous "meta") 13⟩),
  ("sort",.sort (.imax u (.succ .zero))),("shared-level",.sort shared),
  ("constant",.const ``id [.max u .zero]),
  ("application",.app x (.bvar 0)),
  ("lambda",.lam `x x (.app (.bvar (i+1)) (.bvar 0)) .default),
  ("Pi",.forallE `x x (.app (.bvar (i+1)) (.bvar 0)) .implicit),
  ("let-scope",.letE `x x (.bvar 0) (.app (.bvar (i+1)) (.bvar 0)) false),
  ("nondependent-let",.letE `x nat x (mkNatLit 1) true),
  ("natural-literal",mkNatLit (2^100+1)),("string-literal",mkStrLit "a\n\"\\λ"),
  ("metadata",.mdata data x),("projection",.proj ``Prod 1 x),
  ("shared-different-scopes",.app (.lam `x nat (.bvar 0) .default) (.bvar 0)),
  ("nested-shadowing",.lam `x nat (.lam `x (.bvar 1) (.app (.bvar (i+2)) (.bvar 0)) .default) .implicit)]
 for visibility in [BinderInfo.default,.implicit,.strictImplicit,.instImplicit] do
  es := es.push ("visibility-" ++ bi visibility,.lam `v x (.bvar 0) visibility)
 return es

syntax "#atlas_projection_theory " str : command
elab_rules : command
 | `(#atlas_projection_theory $output:str) => do
  let names := #[``project_roundtrip,``project_occurrences,``selected_context_roundtrip,
   ``project_compose,``project_injective,``liftN_below,``liftN_above]
  let mut theorems : Array Json := #[]
  for name in names do
   let info ← getConstInfo name
   let .thmInfo value := info | throwError "Expected a theorem: {name}"
   for e in [value.type,value.value,
       mkApp (mkLambda `expected .default value.type (.bvar 0)) value.value] do
    match Kernel.check (← getEnv) {} e with
    | .ok _ => pure ()
    | .error err => throwError "Theory kernel check: {err.toMessageData (← getOptions)}"
   let axioms ← collectAxioms name
   unless axioms.all (fun a => a == ``propext || a == ``Quot.sound) do
    throwError "Unexpected theory assumption: {axioms}"
   let typeText ← liftTermElabM fun _ => do return (← ppExpr value.type).pretty
   theorems := theorems.push (Json.mkObj [("name",toJson name.toString),
    ("type",toJson typeText),("axioms",toJson (axioms.map Name.toString)),
    ("kernelType",toJson "PASS"),("kernelProof",toJson "PASS"),
    ("kernelExpectedTypeConversion",toJson "PASS")])
  let mut rows : Array Json := #[]
  for depth in [:5] do
   for mask in [:2^depth] do
    let slots := kept depth mask
    let mapping := indices depth slots
    for (label,e) in samples depth do
     let projected := project (select mapping) e
     let mut second : Array Json := #[]
     if let some p := projected then
      let some restored := project (embed mapping) p | throwError "Projection restoration failed"
      unless graph restored == graph e do
       throwError "Computed restoration mismatch"
      unless occurrences p == occurrences e do throwError "Computed occurrence mismatch"
      for mask2 in [:2^slots.size] do
       let slots2 := kept slots.size mask2
       let mapping2 := indices slots.size slots2
       let twice := project (select mapping2) p
       let direct := project (compose (select mapping2) (select mapping)) e
       unless twice.map graph == direct.map graph do throwError "Computed composition mismatch"
       second := second.push (Json.mkObj [("keptSlots",toJson slots2),
        ("projected",(twice.map graph).getD Json.null)])
     rows := rows.push (Json.mkObj [("label",toJson label),("depth",toJson depth),
      ("keptSlots",toJson slots),("source",graph e),
      ("projected",(projected.map graph).getD Json.null),
      ("second",toJson second),("kernelTypingClaim",toJson false)])
  liftIO <| IO.FS.writeFile output.getString (Json.mkObj [
   ("format",toJson "ProofAtlasProjectionTheory/1"),("leanVersion",toJson "4.33.1"),
   ("theorems",toJson theorems),("rows",toJson rows)]).compress
end ProofAtlas.Projection
