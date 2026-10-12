import Lean
import SE2Conjugate

/- Complete environment inventory and semantic Expr payloads; no declaration allowlist.
   Module ownership defines the finite corpus. Types and every available body are exported.
   Shared subterms are retained losslessly with ExprStructMap; expanded counts are decimal strings. -/
open Lean Elab Command Meta
set_option maxHeartbeats 0
set_option maxRecDepth 100000
namespace AtlasLibrary
def obj := Json.mkObj
def str := Json.str
def nat (n : Nat) : Json := toJson n
def nameParts : Name → List Json
  | .anonymous => []
  | .str p s => nameParts p ++ [obj [("str", str s)]]
  | .num p n => nameParts p ++ [obj [("num", str (toString n))]]
partial def level : Level → Json
  | .zero => obj [("kind", str "zero")]
  | .succ u => obj [("kind", str "succ"), ("of", level u)]
  | .max u v => obj [("kind", str "max"), ("left", level u), ("right", level v)]
  | .imax u v => obj [("kind", str "imax"), ("left", level u), ("right", level v)]
  | .param n => obj [("kind", str "param"), ("name", str n.toString), ("nameParts", toJson (nameParts n))]
  | .mvar n => obj [("kind", str "mvar"), ("id", str (reprStr n)), ("idNameParts", toJson (nameParts n.name))]
def bi : BinderInfo → String
  | .default => "default" | .implicit => "implicit"
  | .strictImplicit => "strictImplicit" | .instImplicit => "instImplicit"
def metaValue (v : DataValue) : Json :=
  obj [("kind", str (match v with
    | .ofString _ => "ofString" | .ofBool _ => "ofBool" | .ofName _ => "ofName"
    | .ofNat _ => "ofNat" | .ofInt _ => "ofInt" | .ofSyntax _ => "ofSyntax")),
    ("repr", str (reprStr v))]
structure Tree where
  parent : Array Int := #[]
  kind : Array Nat := #[]
  size : Array Nat := #[]
  payloads : Array Json := #[]
  binder : Array Json := #[]
  deriving Inhabited
def classify (e : Expr) : Nat × Json :=
  match e with
    | .bvar n => (0, obj [("index", nat n)])
    | .fvar n => (1, obj [("id", str (reprStr n)), ("idNameParts", toJson (nameParts n.name))])
    | .mvar n => (2, obj [("id", str (reprStr n)), ("idNameParts", toJson (nameParts n.name))])
    | .sort u => (3, obj [("level", level u)])
    | .const n us => (4, obj [("name", str n.toString), ("nameParts", toJson (nameParts n)), ("levels", toJson (us.map level))])
    | .app .. => (5, obj [])
    | .lam n _ _ b => (6, obj [("binderName", str n.toString), ("binderNameParts", toJson (nameParts n)), ("binderInfo", str (bi b))])
    | .forallE n _ _ b => (7, obj [("binderName", str n.toString), ("binderNameParts", toJson (nameParts n)), ("binderInfo", str (bi b))])
    | .letE n _ _ _ d => (8, obj [("declName", str n.toString), ("declNameParts", toJson (nameParts n)), ("nondep", toJson d)])
    | .lit l => (9, obj [("repr", str (reprStr l)), ("literalKind", str (match l with | .natVal _ => "natVal" | .strVal _ => "strVal")), ("value", match l with | .natVal n => str (toString n) | .strVal s => str s)])
    | .mdata m _ => (10, obj [("metadata", toJson (m.entries.map fun (n,v) => obj [("key", str n.toString), ("keyNameParts", toJson (nameParts n)), ("value", metaValue v)]))])
    | .proj n j _ => (11, obj [("typeName", str n.toString), ("typeNameParts", toJson (nameParts n)), ("index", nat j)])

partial def visit (e : Expr) (parent : Int) (scope : List Nat) (s : Tree) : Tree := Id.run do
  let i := s.parent.size
  let (k,p) := classify e
  let mut s := {s with parent := s.parent.push parent, kind := s.kind.push k, size := s.size.push 0, payloads := s.payloads.push p}
  match e with
  | .bvar n =>
    if let some b := scope[n]? then s := {s with binder := s.binder.push (toJson #[i,b])}
  | .app f a => s := visit a i scope (visit f i scope s)
  | .lam _ t b _ | .forallE _ t b _ => s := visit b i (i :: scope) (visit t i scope s)
  | .letE _ t v b _ => s := visit b i (i :: scope) (visit v i scope (visit t i scope s))
  | .mdata _ x | .proj _ _ x => s := visit x i scope s
  | _ => pure ()
  return {s with size := s.size.set! i (s.parent.size-i)}
/- Structural equality retains names and annotations, unlike Expr's alpha equality.
   IDs are postorder. Each declaration owns and discards its own table. -/
structure Shared where
  seen : ExprStructMap Nat := {}
  kind : Array Nat := #[]
  children : Array (Array Nat) := #[]
  payloads : Array Json := #[]
  expanded : Array Nat := #[]
  neededScope : Array Nat := #[]
  deriving Inhabited
partial def intern (e : Expr) (s : Shared) : Nat × Shared := Id.run do
  if let some i := s.seen.get? ⟨e⟩ then return (i,s)
  let mut s := s
  let mut cs : Array Nat := #[]
  let es := match e with
    | .app f a => #[f,a]
    | .lam _ t b _ | .forallE _ t b _ => #[t,b]
    | .letE _ t v b _ => #[t,v,b]
    | .mdata _ x | .proj _ _ x => #[x]
    | _ => #[]
  for c in es do
    let (i,next) := intern c s
    s := next
    cs := cs.push i
  let (k,p) := classify e
  let need := match e with
    | .bvar n => n+1
    | .lam .. | .forallE .. => max s.neededScope[cs[0]!]! (s.neededScope[cs[1]!]!-1)
    | .letE .. => max (max s.neededScope[cs[0]!]! s.neededScope[cs[1]!]!) (s.neededScope[cs[2]!]!-1)
    | _ => cs.foldl (fun n c => max n s.neededScope[c]!) 0
  let count := cs.foldl (fun n c => n+s.expanded[c]!) 1
  let i := s.kind.size
  return (i, { s with seen := (s.seen.insert ⟨e⟩ i), kind := (s.kind.push k), children := (s.children.push cs), payloads := (s.payloads.push p), expanded := (s.expanded.push count), neededScope := (s.neededScope.push need) })

def kind : ConstantInfo → String
  | .axiomInfo _ => "axiom" | .defnInfo _ => "definition" | .thmInfo _ => "theorem"
  | .opaqueInfo _ => "opaque" | .quotInfo _ => "quotient" | .inductInfo _ => "inductive"
  | .ctorInfo _ => "constructor" | .recInfo _ => "recursor"
def rangeJson (r : DeclarationRanges) : Json := obj [
  ("startLine", nat r.range.pos.line), ("startColumn", nat r.range.pos.column),
  ("endLine", nat r.range.endPos.line), ("endColumn", nat r.range.endPos.column)]

syntax "#atlas_library " str : command
elab_rules : command
  | `(#atlas_library $path:str) => do
    let env ← getEnv
    let modules := env.header.moduleNames
    let out := System.FilePath.mk path.getString
    liftIO <| IO.FS.createDirAll out
    let owned := env.constants.toList.filter fun (n,_) =>
      match env.getModuleIdxFor? n with
      | some i => (modules[i.toNat]!).toString.startsWith "SE2Conjugate."
      | none => false
    let owned := owned.toArray.qsort fun a b => a.1.toString < b.1.toString
    liftIO <| IO.println s!"Inventory: {owned.size} project-owned declarations"
    let mut inventory : Array Json := #[]
    for idx in [:owned.size] do
      let (name, info) := owned[idx]!
      let moduleName := (modules[(env.getModuleIdxFor? name).get!.toNat]!).toString
      let axioms ← collectAxioms name
      let ranges ← findDeclarationRanges? name
      let _ ← match Kernel.check env {} info.type with
        | .ok t => pure t
        | .error _ => throwError "Kernel rejected type {name}"
      if let some value := info.value? true then
        let inferred ← match Kernel.check env {} value with
          | .ok t => pure t
          | .error _ => throwError "Kernel rejected body {name}"
        unless ← liftTermElabM fun _ => isDefEq inferred info.type do
          throwError "Body/type mismatch for {name}"
      let typeText ← liftTermElabM fun _ => withOptions (fun o => (o.setBool `pp.universes true).set `pp.width (100 : Nat)) do
        return (← ppExpr info.type).pretty
      let (typeRoot, initial) := intern info.type {}
      let mut tree := initial
      let typeSize := tree.expanded[typeRoot]!
      let mut roots := #[typeRoot]
      let mut rootPaths := #["root.type"]
      if let some v := info.value? true then
        let (r,next) := intern v tree
        tree := next
        roots := roots.push r
        rootPaths := rootPaths.push "root.value"
      let mut rules : Array Json := #[]
      if let .recInfo v := info then
        for rule in v.rules do
          let _ ← match Kernel.check env {} rule.rhs with
            | .ok t => pure t
            | .error _ => throwError "Kernel rejected reduction rule {name}"
          let (r,next) := intern rule.rhs tree
          tree := next
          rules := rules.push (obj [("constructor", str rule.ctor.toString), ("numFields", nat rule.nfields), ("root", nat r)])
          roots := roots.push r
          rootPaths := rootPaths.push s!"root.rule.{rules.size-1}"
      for r in roots do
        unless tree.neededScope[r]! == 0 do throwError "Open root in {name}"
      let occurrences := roots.foldl (fun n r => n+tree.expanded[r]!) 0
      let record := obj [("name", str name.toString), ("module", str moduleName),
        ("kind", str (kind info)), ("bodyAvailable", toJson (info.hasValue true)),
        ("unsafe", toJson info.isUnsafe), ("partial", toJson info.isPartial),
        ("levelParams", toJson (info.levelParams.map (·.toString))),
        ("axioms", toJson (axioms.map (·.toString))), ("type", str typeText),
        ("sourceRange", ranges.map rangeJson |>.getD Json.null),
        ("kernelCheck", str "PASS"), ("occurrences", str (toString occurrences)), ("uniqueNodes", nat tree.kind.size),
        ("typeOccurrences", str (toString typeSize)), ("rules", toJson rules), ("rootPaths", toJson rootPaths), ("file", str s!"{idx}.json")]
      let data := obj [("serialization", str "ExprDAG/1"), ("declaration", record),
        ("kind", toJson tree.kind), ("children", toJson tree.children), ("roots", toJson roots),
        ("payloads", toJson tree.payloads), ("expanded", toJson (tree.expanded.map (fun n => toString n))),
        ("neededScope", toJson tree.neededScope)]
      liftIO <| IO.FS.writeFile (out / s!"{idx}.json") data.compress
      if idx % 25 == 0 then liftIO <| IO.println s!"{idx+1}/{owned.size}: {name} ({tree.kind.size} shared nodes)"
      inventory := inventory.push record
    liftIO <| IO.FS.writeFile (out / "inventory.json") (toJson inventory).pretty
    logInfo m!"Exported {owned.size} declarations, types and available bodies; checked every body/type."
end AtlasLibrary
