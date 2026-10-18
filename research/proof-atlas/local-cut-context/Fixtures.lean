open Lean Elab Command Meta
namespace ProofAtlas.SourceCut.Local

def cutAt : Nat → (e : Expr) → Cut e
 | 0, e => .hole e
 | _ + 1, .bvar i => .bvar i
 | _ + 1, .fvar i => .fvar i
 | _ + 1, .mvar i => .mvar i
 | _ + 1, .sort u => .sort u
 | _ + 1, .const n us => .const n us
 | d + 1, .app f a => .app (cutAt d f) (cutAt d a)
 | d + 1, .lam n t b bi => .lam n bi (cutAt d t) (cutAt d b)
 | d + 1, .forallE n t b bi => .forallE n bi (cutAt d t) (cutAt d b)
 | d + 1, .letE n t v b nd => .letE n nd (cutAt d t) (cutAt d v) (cutAt d b)
 | _ + 1, .lit l => .lit l
 | d + 1, .mdata m e => .mdata m (cutAt d e)
 | d + 1, .proj n i e => .proj n i (cutAt d e)

def kind : Expr → String
 | .bvar _ => "bvar" | .fvar _ => "fvar" | .mvar _ => "mvar"
 | .sort _ => "sort" | .const .. => "const" | .app .. => "app"
 | .lam .. => "lam" | .forallE .. => "forallE" | .letE .. => "letE"
 | .lit _ => "lit" | .mdata .. => "mdata" | .proj .. => "proj"

/-- Literal pinned-compiler payload representations; not a general Expr decoder. -/
def payload : Expr → Json
 | .bvar i => toJson i
 | .fvar i => toJson (reprStr i)
 | .mvar i => toJson (reprStr i)
 | .sort u => toJson (reprStr u)
 | .const n us => toJson [reprStr n, reprStr us]
 | .app .. => Json.null
 | .lam n _ _ bi | .forallE n _ _ bi => toJson [reprStr n, reprStr bi]
 | .letE n _ _ _ nd => toJson [reprStr n, reprStr nd]
 | .lit l => toJson (reprStr l)
 | .mdata d _ => toJson (reprStr d.entries)
 | .proj n i _ => toJson [reprStr n, reprStr i]

def treeNode (e : Expr) (children : Array Json) : Json :=
 Json.mkObj [("kind", toJson (kind e)), ("payload", payload e), ("children", toJson children)]

def sourceTree : Expr → Json
 | e@(.app f a) => treeNode e #[sourceTree f, sourceTree a]
 | e@(.lam _ d b _) | e@(.forallE _ d b _) => treeNode e #[sourceTree d, sourceTree b]
 | e@(.letE _ t v b _) => treeNode e #[sourceTree t, sourceTree v, sourceTree b]
 | e@(.mdata _ a) | e@(.proj _ _ a) => treeNode e #[sourceTree a]
 | e => treeNode e #[]

def cutTree {e : Expr} (c : Cut e) : Json :=
 match c with
 | .hole source => Json.mkObj [("kind", toJson "hole"), ("source", sourceTree source)]
 | .app f a => treeNode e #[cutTree f, cutTree a]
 | .lam _ _ d b | .forallE _ _ d b => treeNode e #[cutTree d, cutTree b]
 | .letE _ _ t v b => treeNode e #[cutTree t, cutTree v, cutTree b]
 | .mdata _ a | .proj _ _ a => treeNode e #[cutTree a]
 | _ => treeNode e #[]

def childPaths (slot : Nat) (paths : List (List Nat)) := paths.map (slot :: ·)
def paths : Expr → List (List Nat)
 | .app f a => [[]] ++ childPaths 0 (paths f) ++ childPaths 1 (paths a)
 | .lam _ d b _ | .forallE _ d b _ => [[]] ++ childPaths 0 (paths d) ++ childPaths 1 (paths b)
 | .letE _ t v b _ => [[]] ++ childPaths 0 (paths t) ++ childPaths 1 (paths v) ++ childPaths 2 (paths b)
 | .mdata _ e | .proj _ _ e => [[]] ++ childPaths 0 (paths e)
 | _ => [[]]

structure Example where
 label : String
 focus : Expr
 root : Expr
 context : HoleContext focus root

def contexts (s : Expr) : Array Example := Id.run do
 let n := Expr.const ``Nat []
 let value := Expr.app (.const ``Nat.succ []) (.lit (.natVal 2))
 let body := Expr.app (.bvar 1) (.bvar 0)
 let c := HoleContext.here s
 let mut xs : Array Example := #[
  ⟨"root", s, s, c⟩,
  ⟨"app.fn", s, .app s value, .appFn c (cutAt 1 value)⟩,
  ⟨"app.arg", s, .app value s, .appArg (cutAt 2 value) c⟩,
  ⟨"lam.binderType", s, .lam `x s body .implicit, .lamDomain `x .implicit c (cutAt 1 body)⟩,
  ⟨"lam.body", s, .lam `x n s .instImplicit, .lamBody `x .instImplicit (cutAt 1 n) c⟩,
  ⟨"forallE.binderType", s, .forallE `x s body .strictImplicit, .forallDomain `x .strictImplicit c (cutAt 1 body)⟩,
  ⟨"forallE.body", s, .forallE `x n s .default, .forallBody `x .default (cutAt 1 n) c⟩,
  ⟨"letE.type", s, .letE `x s value body false, .letType `x false c (cutAt 1 value) (cutAt 2 body)⟩,
  ⟨"letE.value", s, .letE `x n s body true, .letValue `x true (cutAt 0 n) c (cutAt 1 body)⟩,
  ⟨"letE.body", s, .letE `x n value s false, .letBody `x false (cutAt 1 n) (cutAt 1 value) c⟩,
  ⟨"mdata.expr", s, .mdata {} s, .mdata {} c⟩,
  ⟨"proj.struct", s, .proj `Pair 1 s, .proj `Pair 1 c⟩]
 let inner : HoleContext s (.letE `shadow n value s false) := .letBody `shadow false (cutAt 1 n) (cutAt 2 value) c
 let outer : HoleContext (.letE `shadow n value s false) (.lam `shadow n (.letE `shadow n value s false) .default) := .lamBody `shadow .default (cutAt 1 n) (.here _)
 xs := xs.push ⟨"nested.shadowed-body", s, _, compose outer inner⟩
 return xs

def focuses : Array Expr := #[
 .bvar 0, .fvar ⟨`free⟩, .mvar ⟨`meta⟩,
 .sort (.max (.param `u) (.succ .zero)), .const `Example.c [.param `u],
 .app (.const ``Nat.succ []) (.lit (.natVal 2)),
 .lam `x (.const ``Nat []) (.bvar 0) .implicit,
 .forallE `x (.const ``Nat []) (.bvar 0) .strictImplicit,
 .letE `x (.const ``Nat []) (.lit (.natVal 2)) (.bvar 0) false,
 .lit (.strVal "source"), .mdata {} (.bvar 0), .proj `Pair 1 (.bvar 0)]

syntax "#atlas_local_cut_context " str : command
elab_rules : command
 | `(#atlas_local_cut_context $output:str) => do
  let mut theorems : Array Json := #[]
  for name in [``plug_refines, ``fill_refines, ``retained_plug, ``hidden_plug,
      ``fill_visible, ``fill_exact_transfer, ``visible_inside, ``visible_outside,
      ``plug_compose, ``focus_compose] do
   let .thmInfo info ← getConstInfo name | throwError "Expected theorem {name}"
   for e in [info.type, info.value, mkApp (mkLambda `expected .default info.type (.bvar 0)) info.value] do
    match Kernel.check (← getEnv) {} e with
    | .ok _ => pure ()
    | .error err => throwError "Kernel check failed: {err.toMessageData (← getOptions)}"
   let axioms ← collectAxioms name
   unless axioms.all (fun a => a == ``propext || a == ``Quot.sound) do throwError "Unexpected assumptions {axioms}"
   let text ← liftTermElabM fun _ => do return (← ppExpr info.type).pretty
   theorems := theorems.push (Json.mkObj [("name", toJson name.toString), ("type", toJson text),
    ("axioms", toJson (axioms.map Name.toString)), ("kernelType", toJson "PASS"),
    ("kernelProof", toJson "PASS"), ("kernelExpectedTypeConversion", toJson "PASS")])
  let mut cases : Array Json := #[]
  for focus in focuses do
   for x in contexts focus do
    let before := plug x.context (.hole x.focus)
    let mut rows : Array Json := #[]
    for depth in [:4] do
     let replacement := cutAt depth x.focus
     let after := plug x.context replacement
     let observations := (paths x.root).map fun path => Json.mkObj [
      ("path", toJson path), ("inside", toJson (isBelow (focusPath x.context) path)),
      ("before", toJson (visible before path)), ("after", toJson (visible after path))]
     rows := rows.push (Json.mkObj [("depth", toJson depth), ("replacement", cutTree replacement),
      ("after", cutTree after), ("retained", toJson (retained after)), ("hidden", toJson (hidden after)),
      ("replacementRetained", toJson (retained replacement)), ("visibility", toJson observations)])
    cases := cases.push (Json.mkObj [("label", toJson (kind focus ++ "/" ++ x.label)),
     ("proofTypingClaim", toJson false), ("source", sourceTree x.root), ("focus", toJson (focusPath x.context)),
     ("before", cutTree before), ("occurrences", toJson (occurrences x.root)),
     ("initialRetained", toJson (retained before)), ("initialHidden", toJson (hidden before)), ("rows", toJson rows)])
  let result := Json.mkObj [("format", toJson "ProofAtlasLocalCutContext/1"), ("leanVersion", toJson Lean.versionString),
   ("theorems", toJson theorems), ("cases", toJson cases)]
  liftIO <| IO.FS.writeFile output.getString result.compress
end ProofAtlas.SourceCut.Local
