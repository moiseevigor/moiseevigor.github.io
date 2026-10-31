/- Restricted boundary equations. No metavariables, higher-order guessing,
   new axioms or MetaM operations in the constant-data environment. -/
namespace AtlasRegionInputs
open Lean AtlasLibrary AtlasPacketReplay AtlasRegionKernel

structure ConstraintState where
  context : LocalContext
  bindings : Array Binding
  records : Array Json := #[]
  steps : Nat := 0
  refusal : Json := Json.null
  deriving Inhabited

def rebuildContext (env : Environment) (prefixCtx : LocalContext)
    (bindings : Array Binding) : IO LocalContext := do
  let mut ctx := prefixCtx
  for b in bindings do
    let _ ← typeOf env ctx (.forallE `checkDomain b.domain (.sort .zero) .default)
    let id := b.termVar.fvarId!
    if let some value := b.value then
      atType env ctx value b.domain
      ctx := ctx.mkLetDecl id (Name.num `result ctx.numIndices) b.domain value (nondep:=false)
    else ctx := ctx.mkLocalDecl id (Name.num `input ctx.numIndices) b.domain .default
  return ctx

def independentIndex (bindings : Array Binding) (e : Expr) : Option Nat := do
  let .fvar _ := e | none
  bindings.findIdx? fun b => same b.termVar e && b.value.isNone

def noteRefusal (state : IO.Ref ConstraintState) (reason : String) : IO Bool := do
  state.modify fun s => {s with refusal := obj [("reason",str reason)]}
  return false

def deriveInput (env : Environment) (prefixCtx : LocalContext) (xs : Array Expr)
    (state : IO.Ref ConstraintState) (call slot index : Nat) (value : Expr) : IO Bool := do
  let s ← state.get
  let b := s.bindings[index]!
  let earlier := s.bindings.extract 0 index
  let before := xs ++ earlier.map (·.termVar)
  unless scopeAllowed value before && !value.hasLooseBVars && !value.hasMVar do
    return ← noteRefusal state "assignment-escapes-earlier-context"
  let originalAssigned := value.replaceFVars (earlier.map (·.termVar)) (earlier.map (·.originalValue))
  let originalDomain := b.domain.replaceFVars (earlier.map (·.termVar)) (earlier.map (·.originalValue))
  try
    atType env s.context value b.domain
    atType env prefixCtx originalAssigned originalDomain
    atType env prefixCtx b.originalValue originalDomain
  catch _ => return ← noteRefusal state "assignment-typing-refused"
  unless (Kernel.isDefEq env prefixCtx originalAssigned b.originalValue).toOption == some true do
    return ← noteRefusal state "source-specialization-refused"
  let .sort level ← typeOf env prefixCtx originalDomain
    | return ← noteRefusal state "assignment-domain-sort"
  let equality := mkApp3 (.const ``Eq [level]) originalDomain originalAssigned b.originalValue
  let witness := mkApp2 (.const ``Eq.refl [level]) originalDomain originalAssigned
  atType env prefixCtx witness equality
  let metadata := b.metadata.mergeObj <| obj [("kind",str "derived-input"),("constraint",nat s.records.size)]
  let next := s.bindings.set! index {b with value := some value, metadata := metadata}
  let context ← rebuildContext env prefixCtx next
  let record := obj [("binding",nat index),("call",nat call),("slot",nat slot),
    ("sourcePort",b.metadata),("contextLength",nat before.size),
    ("graph",AtlasPacketReplay.graph #[value.abstract before,originalAssigned.abstract xs,
      b.originalValue.abstract xs,b.domain.abstract before,originalDomain.abstract xs,
      witness.abstract xs,equality.abstract xs]),
    ("rootContexts",toJson #["before-binding","original","original","before-binding","original","original","original"]),
    ("kernelAssignmentTyping",str "PASS"),("kernelSourceSpecialization",str "PASS"),
    ("kernelSourceEqualityWitness",str "PASS")]
  state.set {s with context := context, bindings := next, records := s.records.push record}
  return true

def unfoldConstraintRoot (ctx : LocalContext) (input : Expr) : Expr := Id.run do
  let mut e := input
  for _ in [:512] do
    match e with
    | .mdata _ body => e := body
    | .fvar id =>
      match (ctx.find? id).bind (·.value? true) with
      | some value => e := value
      | none => return e
    | _ => return e
  return e

partial def solveConstraint (env : Environment) (prefixCtx : LocalContext) (xs : Array Expr)
    (state : IO.Ref ConstraintState) (call slot : Nat) (left right : Expr) (depth : Nat := 0) : IO Bool := do
  let s ← state.get
  unless s.steps < 4096 && depth <= 64 do return ← noteRefusal state "constraint-work-depth-bound"
  state.modify fun s => {s with steps := s.steps+1}
  if same left right || (Kernel.isDefEq env s.context left right).toOption == some true then return true
  let left := unfoldConstraintRoot s.context left
  let right := unfoldConstraintRoot s.context right
  -- Prefer eliminating the later independent input. Assignments can only use
  -- the exact prefixCtx available before that input; there is no search/backtracking.
  let choices := ((independentIndex s.bindings right).toArray.map (fun i => (i,left)) ++
    (independentIndex s.bindings left).toArray.map (fun i => (i,right))).qsort (fun a b => a.1 > b.1)
  for (index,value) in choices do
    if ← deriveInput env prefixCtx xs state call slot index value then return true
  match left,right with
  | .app f a,.app g b =>
    if !(← solveConstraint env prefixCtx xs state call slot f g (depth+1)) then return false
    solveConstraint env prefixCtx xs state call slot a b (depth+1)
  | .proj n i e,.proj m j f =>
    if n != m || i != j then return ← noteRefusal state "projection-owner-mismatch"
    solveConstraint env prefixCtx xs state call slot e f (depth+1)
  | _,_ => noteRefusal state "rigid-or-unsupported-constraint"

end AtlasRegionInputs
