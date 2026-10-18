open Lean Elab Command Meta
namespace ProofAtlas.SourceCut

/-- Small unbounded-depth controls; not the browser's fixed-budget selection policy. -/
def cutAt : (depth : Nat) → (e : Expr) → Cut e
 | 0, e => .hole e
 | _d+1, .bvar i => .bvar i
 | _d+1, .fvar i => .fvar i
 | _d+1, .mvar i => .mvar i
 | _d+1, .sort u => .sort u
 | _d+1, .const n us => .const n us
 | d+1, .app f a => .app (cutAt d f) (cutAt d a)
 | d+1, .lam n t b bi => .lam n bi (cutAt d t) (cutAt d b)
 | d+1, .forallE n t b bi => .forallE n bi (cutAt d t) (cutAt d b)
 | d+1, .letE n t v b nd => .letE n nd (cutAt d t) (cutAt d v) (cutAt d b)
 | _d+1, .lit l => .lit l
 | d+1, .mdata m e => .mdata m (cutAt d e)
 | d+1, .proj n i e => .proj n i (cutAt d e)

def shapeNode (kind : String) (children : Array Json := #[]) : Json :=
 Json.mkObj [("kind",toJson kind),("children",toJson children)]

def exprShape : Expr → Json
 | .bvar _ => shapeNode "bvar"
 | .fvar _ => shapeNode "fvar"
 | .mvar _ => shapeNode "mvar"
 | .sort _ => shapeNode "sort"
 | .const _ _ => shapeNode "const"
 | .app f a => shapeNode "app" #[exprShape f,exprShape a]
 | .lam _ d b _ => shapeNode "lam" #[exprShape d,exprShape b]
 | .forallE _ d b _ => shapeNode "forallE" #[exprShape d,exprShape b]
 | .letE _ t v b _ => shapeNode "letE" #[exprShape t,exprShape v,exprShape b]
 | .lit _ => shapeNode "lit"
 | .mdata _ e => shapeNode "mdata" #[exprShape e]
 | .proj _ _ e => shapeNode "proj" #[exprShape e]

def prefixed (slot : Nat) (ps : List (List Nat)) := ps.map (slot :: ·)

def retainedPaths : {e : Expr} → Cut e → List (List Nat)
 | _, .hole _ => []
 | _, .app f a => [[]] ++ prefixed 0 (retainedPaths f) ++ prefixed 1 (retainedPaths a)
 | _, .lam _ _ d b | _, .forallE _ _ d b => [[]] ++ prefixed 0 (retainedPaths d) ++ prefixed 1 (retainedPaths b)
 | _, .letE _ _ t v b => [[]] ++ prefixed 0 (retainedPaths t) ++ prefixed 1 (retainedPaths v) ++ prefixed 2 (retainedPaths b)
 | _, .mdata _ e | _, .proj _ _ e => [[]] ++ prefixed 0 (retainedPaths e)
 | _, _ => [[]]

def allPaths (e : Expr) : List (List Nat) := retainedPaths (cutAt 16 e)

def controlExpressions : Array (String × Expr) := Id.run do
 let n := Expr.const ``Nat []
 let atoms : Array (String × Expr) := #[
  ("bvar",.bvar 0),("fvar",.fvar ⟨`free⟩),("mvar",.mvar ⟨`meta⟩),
  ("sort",.sort (.param `u)),("const",n),
  ("app",.app (.const ``Nat.succ []) (.lit (.natVal 2))),
  ("lam",.lam `x n (.bvar 0) .implicit),
  ("forallE",.forallE `x n (.bvar 0) .strictImplicit),
  ("letE",.letE `x n (.lit (.natVal 2)) (.bvar 0) false),
  ("lit",.lit (.strVal "source")),("mdata",.mdata {} (.bvar 0)),
  ("proj",.proj `Pair 1 (.bvar 0))]
 let mut result := atoms
 let mut wide := n
 for i in [:6] do
  wide := .app wide wide
  result := result.push ("shared-" ++ toString i,wide)
 let mixed := Expr.lam `x n (.letE `y n (.bvar 0) (.app (.bvar 1) (.bvar 0)) false) .instImplicit
 return result.push ("mixed-scope-syntax",mixed)

syntax "#atlas_source_cut_laws " str : command
elab_rules : command
 | `(#atlas_source_cut_laws $output:str) => do
  let mut laws : Array Json := #[]
  for name in [``partition,``reflexive,``retained_monotone,``hidden_antitone,``visible_monotone,``exact_transfer] do
   let .thmInfo info ← getConstInfo name | throwError "Expected theorem {name}"
   for e in [info.type,info.value,mkApp (mkLambda `expected .default info.type (.bvar 0)) info.value] do
    match Kernel.check (← getEnv) {} e with
    | .ok _ => pure ()
    | .error err => throwError "Cut theorem kernel check: {err.toMessageData (← getOptions)}"
   let axioms ← collectAxioms name
   unless axioms.all (fun a => a == ``propext || a == ``Quot.sound) do throwError "Unexpected assumptions {axioms}"
   let text ← liftTermElabM fun _ => do return (← ppExpr info.type).pretty
   laws := laws.push (Json.mkObj [("name",toJson name.toString),("type",toJson text),
    ("axioms",toJson (axioms.map Name.toString)),("kernelType",toJson "PASS"),
    ("kernelProof",toJson "PASS"),("kernelExpectedTypeConversion",toJson "PASS")])
  let mut cases : Array Json := #[]
  for (label,e) in controlExpressions do
   let mut rows : Array Json := #[]
   for depth in [:5] do
    let c := cutAt depth e
    let paths := retainedPaths c
    let tests := allPaths e ++ [[99],[0,99],[2,99]]
    rows := rows.push (Json.mkObj [("depth",toJson depth),("retained",toJson (retained c)),
     ("hidden",toJson (hidden c)),("paths",toJson paths),
     ("visibility",toJson (tests.map fun p => Json.mkObj [("path",toJson p),("visible",toJson (visible c p))]))])
   cases := cases.push (Json.mkObj [("label",toJson label),("source",exprShape e),
    ("occurrences",toJson (occurrences e)),("rows",toJson rows),("proofTypingClaim",toJson false)])
  liftIO <| IO.FS.writeFile output.getString (Json.mkObj [("format",toJson "ProofAtlasSourceCutLaws/1"),
   ("leanVersion",toJson "4.33.1"),("theorems",toJson laws),("cases",toJson cases)]).compress
end ProofAtlas.SourceCut
