open Lean Elab Command Meta
namespace ProofAtlas.SourceCut

def referenceShape : Expr → Json
 | .bvar i => Json.mkObj [("kind",toJson "bvar"),("index",toJson i),("children",toJson (#[] : Array Json))]
 | .app f a => shapeNode "app" #[referenceShape f,referenceShape a]
 | .lam _ d b _ => shapeNode "lam" #[referenceShape d,referenceShape b]
 | .forallE _ d b _ => shapeNode "forallE" #[referenceShape d,referenceShape b]
 | .letE _ t v b _ => shapeNode "letE" #[referenceShape t,referenceShape v,referenceShape b]
 | .mdata _ e => shapeNode "mdata" #[referenceShape e]
 | .proj _ _ e => shapeNode "proj" #[referenceShape e]
 | e => exprShape e

def referenceControls : Array (String × Expr) := Id.run do
 let n := Expr.const ``Nat []
 let mut result := controlExpressions
 for i in [:6] do result := result.push ("free-index-" ++ toString i,.bvar i)
 let fieldControls : Array (String × Expr) := #[
  ("app-function",.app (.bvar 0) n),("app-argument",.app n (.bvar 0)),
  ("lambda-domain",.lam `x (.bvar 0) n .default),
  ("lambda-body",.lam `x n (.bvar 1) .default),
  ("pi-domain",.forallE `x (.bvar 0) n .default),
  ("pi-body",.forallE `x n (.bvar 1) .default),
  ("let-type",.letE `x (.bvar 0) n n false),
  ("let-value",.letE `x n (.bvar 0) n false),
  ("let-body",.letE `x n n (.bvar 1) false),
  ("metadata-expression",.mdata {} (.bvar 0)),
  ("projection-structure",.proj `Pair 0 (.bvar 0))]
 result := result ++ fieldControls
 let scopes : Array (String × Expr) := #[
  ("lambda-local",.lam `x n (.bvar 0) .default),
  ("pi-local",.forallE `x n (.bvar 0) .default),
  ("let-local",.letE `x n n (.bvar 0) false),
  ("nondependent-let",.letE `x (.bvar 0) (.bvar 0) (.bvar 1) true),
  ("dependent-let",.letE `x (.bvar 0) (.bvar 0) (.bvar 1) false),
  ("shadowed-names",.lam `x (.bvar 0) (.lam `x (.bvar 1) (.app (.bvar 2) (.bvar 0)) .implicit) .default),
  ("domain-dependency",.forallE `x (.bvar 0) (.lam `y (.bvar 1) (.bvar 2) .default) .default),
  ("local-and-outer",.letE `x (.bvar 2) (.bvar 0) (.app (.bvar 0) (.bvar 3)) false)]
 result := result ++ scopes
 let mut shared := Expr.bvar 0
 for i in [:8] do
  shared := .app shared shared
  result := result.push ("shared-reference-" ++ toString i,shared)
 return result

syntax "#atlas_reference_laws " str : command
elab_rules : command
 | `(#atlas_reference_laws $output:str) => do
  let mut laws : Array Json := #[]
  for name in [``reference_partition,``visible_references_monotone,
      ``hidden_references_antitone,``exact_reference_transfer,
      ``reference_present_iff,``reference_absent_iff,``references_bounded,
      ``let_reference_fields,``lambda_reference_fields,``pi_reference_fields] do
   let .thmInfo info ← getConstInfo name | throwError "Expected theorem {name}"
   for e in [info.type,info.value,mkApp (mkLambda `expected .default info.type (.bvar 0)) info.value] do
    match Kernel.check (← getEnv) {} e with
    | .ok _ => pure ()
    | .error err => throwError "Reference theorem kernel check: {err.toMessageData (← getOptions)}"
   let axioms ← collectAxioms name
   unless axioms.all (fun a => a == ``propext || a == ``Quot.sound) do throwError "Unexpected assumptions in {name}: {axioms}"
   let text ← liftTermElabM fun _ => do return (← ppExpr info.type).pretty
   laws := laws.push (Json.mkObj [("name",toJson name.toString),("type",toJson text),
    ("axioms",toJson (axioms.map Name.toString)),("kernelType",toJson "PASS"),
    ("kernelProof",toJson "PASS"),("kernelExpectedTypeConversion",toJson "PASS")])
  let mut cases : Array Json := #[]
  for (label,e) in referenceControls do
   let mut rows : Array Json := #[]
   for depth in [0,1,2,3,4,6] do
    let c := cutAt depth e
    let mut coefficients : Array Json := #[]
    for i in [:8] do
     coefficients := coefficients.push (Json.mkObj [("index",toJson i),
      ("total",toJson (toString (references e i))),
      ("visible",toJson (toString (visibleReferences c i))),
      ("hidden",toJson (toString (hiddenReferences c i)))])
    rows := rows.push (Json.mkObj [("depth",toJson depth),("coefficients",toJson coefficients)])
   cases := cases.push (Json.mkObj [("label",toJson label),("source",referenceShape e),
    ("rows",toJson rows),("proofTypingClaim",toJson false)])
  liftIO <| IO.FS.writeFile output.getString (Json.mkObj [
   ("format",toJson "ProofAtlasSourceReferenceLaws/1"),("leanVersion",toJson "4.33.1"),
   ("theorems",toJson laws),("cases",toJson cases)]).compress
end ProofAtlas.SourceCut
