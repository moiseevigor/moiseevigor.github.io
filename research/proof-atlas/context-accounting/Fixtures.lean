/- Synthetic Expr accounting controls. Their open terms have no typing claim. -/
open Lean Elab Command Meta ProofAtlas.Projection
namespace ProofAtlas.ContextAccounting

def headerAt (j : Nat) : Header :=
 {name:=.num `h j,info:=if j % 3 == 0 then .implicit else .default,
  type:=if j % 2 == 0 then mkConst ``Nat
        else .forallE `x (mkConst ``Nat) (.sort .zero) .default,
  value:=if j % 2 == 1 then some (.lam `x (mkConst ``Nat) (.bvar 0) .default) else none}

def headerJson (h : Header) : Json := Json.mkObj [
 ("type",graph h.type),("value",(h.value.map graph).getD Json.null),
 ("weight",toJson (toString (weight h)))]

syntax "#atlas_context_accounting " str : command
elab_rules : command
 | `(#atlas_context_accounting $output:str) => do
  let mut laws : Array Json := #[]
  for name in [``weight_positive,``wrap_occurrences,``close_occurrences,
      ``projectHeader_weight,``selection_partition,``projected_closure_partition,
      ``projected_closure_le,``total_positive_iff,``projected_closure_strict_iff] do
   let .thmInfo info ← getConstInfo name | throwError "Expected theorem {name}"
   for e in [info.type,info.value,mkApp (mkLambda `expected .default info.type (.bvar 0)) info.value] do
    match Kernel.check (← getEnv) {} e with
    | .ok _ => pure ()
    | .error err => throwError "Accounting theorem kernel check: {err.toMessageData (← getOptions)}"
   let axioms ← collectAxioms name
   unless axioms.all (fun a => a == ``propext || a == ``Quot.sound) do throwError "Unexpected assumptions {axioms}"
   let text ← liftTermElabM fun _ => do return (← ppExpr info.type).pretty
   laws := laws.push (Json.mkObj [("name",toJson name.toString),("type",toJson text),
    ("axioms",toJson (axioms.map Name.toString)),("kernelType",toJson "PASS"),
    ("kernelProof",toJson "PASS"),("kernelExpectedTypeConversion",toJson "PASS")])
  let mut rows : Array Json := #[]
  for depth in [:5] do
   let headers := (List.range depth).map headerAt
   for mask in [:2^depth] do
    let slots := kept depth mask
    let selected := headers.zipIdx |>.filter fun (_,j) => slots.contains j
    let mut projectedHeaders : List Header := []
    for (h,j) in selected do
     let mapping := indices j (slots.filter (· < j))
     let some h' := projectHeader (select mapping) h | throwError "Independent header projection failed"
     unless weight h' == weight h do throwError "Header weight changed"
     projectedHeaders := projectedHeaders ++ [h']
    let omitted := headers.zipIdx |>.filter (fun (_,j) => !slots.contains j) |>.map Prod.fst
    for (label,body) in samples depth do
     let projected := project (select (indices depth slots)) body
     let counts := projected.map fun p => Json.mkObj [
      ("body",toJson (toString (occurrences p))),
      ("termFull",toJson (toString (occurrences (close false headers body)))),
      ("termReduced",toJson (toString (occurrences (close false projectedHeaders p)))),
      ("typeFull",toJson (toString (occurrences (close true headers body)))),
      ("typeReduced",toJson (toString (occurrences (close true projectedHeaders p)))),
      ("omitted",toJson (toString (total omitted)))]
     rows := rows.push (Json.mkObj [("label",toJson label),("depth",toJson depth),
      ("headers",toJson (headers.map headerJson)),("keptSlots",toJson slots),
      ("source",graph body),("projected",(projected.map graph).getD Json.null),
      ("counts",counts.getD Json.null),("kernelTypingClaim",toJson false)])
  let dependant : Header := {name:=`dependent,info:=.default,type:=.bvar 0,value:=none}
  unless (projectHeader (fun _ => none) dependant).isNone do throwError "Missing header support accepted"
  let letDep : Header := {dependant with type:=mkConst ``Nat,value:=some (.bvar 0)}
  unless (projectHeader (fun _ => none) letDep).isNone do throwError "Missing let-value support accepted"
  liftIO <| IO.FS.writeFile output.getString (Json.mkObj [("format",toJson "ProofAtlasContextAccounting/1"),
   ("leanVersion",toJson "4.33.1"),("theorems",toJson laws),("rows",toJson rows),
   ("missingHeaderSupportRejected",toJson true),("missingLetValueSupportRejected",toJson true)]).compress
end ProofAtlas.ContextAccounting
