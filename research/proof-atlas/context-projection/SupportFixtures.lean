/- Own support fixtures, not new typing observations. -/
open Lean Elab Command Meta AtlasLibrary
namespace ProofAtlas.Projection

def supportGraph (e : Expr) : Except String Json := do
 let (_,state) := intern e {}
 let entries := state.seen.toArray.qsort (fun a b => a.2 < b.2)
 let mut nodes : Array Json := #[]
 for (key,id) in entries do
  let uses := (support key.val).eraseDups.mergeSort (· ≤ ·)
  let need := needed key.val
  unless need == state.neededScope[id]! do throw "Native support/serializer scope mismatch"
  nodes := nodes.push (Json.mkObj [("node",toJson id),("support",toJson uses),
   ("needed",toJson need),("unresolvedTermIds",toJson (key.val.hasFVar || key.val.hasExprMVar))])
 return Json.mkObj [("graph",graph e),("nodes",toJson nodes)]

syntax "#atlas_projection_support " str : command
elab_rules : command
 | `(#atlas_projection_support $output:str) => do
  let names := #[``project_supported,``needed_bound,``needed_zero_iff,``maximum_is_not_support]
  let mut theorems : Array Json := #[]
  for name in names do
   let .thmInfo value ← getConstInfo name | throwError "Expected theorem {name}"
   for e in [value.type,value.value,mkApp (mkLambda `expected .default value.type (.bvar 0)) value.value] do
    match Kernel.check (← getEnv) {} e with
    | .ok _ => pure ()
    | .error err => throwError "Support kernel check: {err.toMessageData (← getOptions)}"
   let axioms ← collectAxioms name
   unless axioms.all (fun a => a == ``propext || a == ``Quot.sound || a == ``Classical.choice) do
    throwError "Unexpected support assumption: {axioms}"
   let typeText ← liftTermElabM fun _ => do return (← ppExpr value.type).pretty
   theorems := theorems.push (Json.mkObj [("name",toJson name.toString),("type",toJson typeText),
    ("axioms",toJson (axioms.map Name.toString)),("kernelType",toJson "PASS"),
    ("kernelProof",toJson "PASS"),("kernelExpectedTypeConversion",toJson "PASS")])
  let mut cases : Array Json := #[]
  for depth in [:5] do
   for (label,e) in samples depth do
    let source ← match supportGraph e with | .ok g => pure g | .error err => throwError err
    let mut selections : Array Json := #[]
    for mask in [:2^depth] do
     let slots := kept depth mask
     let r := select (indices depth slots)
     let covered := (support e).all (fun i => (r i).isSome)
     let defined := (project r e).isSome
     unless covered == defined do throwError "Computed support criterion mismatch"
     selections := selections.push (Json.mkObj [("keptSlots",toJson slots),("defined",toJson defined)])
    cases := cases.push (Json.mkObj [("label",toJson label),("depth",toJson depth),
     ("source",source),("selections",toJson selections),("kernelTypingClaim",toJson false)])
  let mut deep : Expr := .bvar 512
  for _ in [:513] do deep := .lam `x (mkConst ``Nat) deep .default
  let mut shared : Expr := .bvar 2
  for _ in [:8] do shared := .app shared shared
  let mut extras : Array Json := #[]
  for (label,e) in [("closed-beyond-width",deep),("shared-support",shared),
      ("single-outer",onlyOuter),("same-maximum-extra-inner",outerAndInner),
      ("unresolved-universe",Expr.sort (.mvar ⟨`unresolvedLevel⟩))] do
   let source ← match supportGraph e with | .ok g => pure g | .error err => throwError err
   extras := extras.push (Json.mkObj [("label",toJson label),("source",source),("kernelTypingClaim",toJson false)])
  liftIO <| IO.FS.writeFile output.getString (Json.mkObj [
   ("format",toJson "ProofAtlasProjectionSupport/1"),("leanVersion",toJson "4.33.1"),
   ("theorems",toJson theorems),("cases",toJson cases),("extras",toJson extras)]).compress
end ProofAtlas.Projection
