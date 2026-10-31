/- Source-preserving templates and explicitly recorded declaration permutations.
   Kernel checks are authoritative; no MetaM operation or new axiom is used. -/
namespace AtlasRegionInputs
open Lean AtlasLibrary AtlasPacketReplay AtlasRegionKernel

def bindingKey (b : Binding) : String := b.termVar.fvarId!.name.toString

def scopedBindingDirectory (xs : Array Expr) (bindings : Array Binding) : Json :=
  match bindingDirectory xs bindings with
  | .arr rows => .arr <| rows.mapIdx fun i row => row.mergeObj (obj [("key",str (bindingKey bindings[i]!))])
  | _ => Json.null

structure ConstraintState where
  context : LocalContext
  bindings : Array Binding
  records : Array Json := #[]
  templates : Array Json := #[]
  permutations : Array Json := #[]
  steps : Nat := 0
  refusal : Json := Json.null
  deriving Inhabited

def rebuildContext (env : Environment) (prefixCtx : LocalContext)
    (bindings : Array Binding) : IO LocalContext := do
  let mut ctx := prefixCtx
  for b in bindings do
    let _ ← typeOf env ctx (.forallE `checkDomain b.domain (.sort .zero) .default)
    if let some value := b.value then
      atType env ctx value b.domain
      ctx := ctx.mkLetDecl b.termVar.fvarId! (Name.num `result ctx.numIndices) b.domain value (nondep:=false)
    else ctx := ctx.mkLocalDecl b.termVar.fvarId! (Name.num `input ctx.numIndices) b.domain .default
  return ctx

def orderBindings (xs : Array Expr) (bindings : Array Binding) : Option (Array Binding) := Id.run do
  if bindings.size > 512 then return none
  let mut pending := bindings
  let mut ordered := #[]
  let mut allowed := xs
  while !pending.isEmpty do
    let some i := pending.findIdx? (fun b => scopeAllowed b.domain allowed &&
      b.value.all (fun v => scopeAllowed v allowed)) | return none
    let b := pending[i]!
    ordered := ordered.push b
    allowed := allowed.push b.termVar
    pending := (pending.extract 0 i) ++ pending.extract (i+1) pending.size
  return some ordered

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
  let all := s.bindings.map (·.termVar)
  unless scopeAllowed value (xs ++ all) && !value.hasLooseBVars && !value.hasMVar do
    return ← noteRefusal state "assignment-outside-recorded-context"
  let originalAssigned := value.replaceFVars all (s.bindings.map (·.originalValue))
  let originalDomain := b.domain.replaceFVars all (s.bindings.map (·.originalValue))
  try
    atType env s.context value b.domain
    atType env prefixCtx originalAssigned originalDomain
    atType env prefixCtx b.originalValue originalDomain
  catch _ => return ← noteRefusal state "assignment-typing-refused"
  unless (Kernel.isDefEq env prefixCtx originalAssigned b.originalValue).toOption == some true do
    return ← noteRefusal state "source-specialization-refused"
  let metadata := b.metadata.mergeObj <| obj [("kind",str "derived-input"),("constraint",nat s.records.size)]
  let unsorted := s.bindings.set! index {b with value := some value, metadata := metadata}
  let some ordered := orderBindings xs unsorted
    | return ← noteRefusal state "cyclic-or-unknown-binding-dependency"
  let context ← try rebuildContext env prefixCtx ordered
    catch _ => return ← noteRefusal state "reordered-context-typing-refused"
  let some position := ordered.findIdx? (fun c => same c.termVar b.termVar)
    | throw <| IO.userError "Assignment disappeared from declaration order"
  let earlier := ordered.extract 0 position
  let before := xs ++ earlier.map (·.termVar)
  let .sort level ← typeOf env prefixCtx originalDomain
    | return ← noteRefusal state "assignment-domain-sort"
  let equality := mkApp3 (.const ``Eq [level]) originalDomain originalAssigned b.originalValue
  let witness := mkApp2 (.const ``Eq.refl [level]) originalDomain originalAssigned
  atType env prefixCtx witness equality
  let record := obj [("binding",nat position),("bindingKey",str (bindingKey b)),("call",nat call),("slot",nat slot),
    ("sourcePort",b.metadata),("contextLength",nat before.size),("contextBindingKeys",toJson (earlier.map bindingKey)),
    ("graph",AtlasPacketReplay.graph #[value.abstract before,originalAssigned.abstract xs,
      b.originalValue.abstract xs,b.domain.abstract before,originalDomain.abstract xs,witness.abstract xs,equality.abstract xs]),
    ("rootContexts",toJson #["before-binding","original","original","before-binding","original","original","original"]),
    ("kernelAssignmentTyping",str "PASS"),("kernelSourceSpecialization",str "PASS"),("kernelSourceEqualityWitness",str "PASS")]
  let mut permutations := s.permutations
  let oldKeys := s.bindings.map bindingKey
  let newKeys := ordered.map bindingKey
  if oldKeys != newKeys then
    let scope := xs ++ unsorted.map (·.termVar)
    let mut roots := #[]
    let mut nodes := #[]
    for row in unsorted do
      let domainRoot := roots.size
      roots := roots.push (row.domain.abstract scope)
      let valueRoot := if row.value.isSome then some roots.size else none
      if let some v := row.value then roots := roots.push (v.abstract scope)
      nodes := nodes.push <| obj [("key",str (bindingKey row)),("domainRoot",nat domainRoot),("valueRoot",toJson valueRoot)]
    permutations := permutations.push <| obj [("cause",str (bindingKey b)),("old",toJson oldKeys),("new",toJson newKeys),
      ("nodes",toJson nodes),("graph",AtlasPacketReplay.graph roots),("kernelContextTyping",str "PASS")]
  state.set {s with context := context, bindings := ordered, records := s.records.push record, permutations := permutations}
  return true

partial def unfoldConstraintRoot (ctx : LocalContext) (e : Expr) (fuel : Nat := 512) : Expr :=
  if fuel == 0 then e else match e with
  | .mdata _ body => unfoldConstraintRoot ctx body (fuel-1)
  | .fvar id => match (ctx.find? id).bind (·.value? true) with
    | some value => unfoldConstraintRoot ctx value (fuel-1)
    | none => e
  | .letE _ _ value body _ => unfoldConstraintRoot ctx (body.instantiate1 value) (fuel-1)
  | .app f a =>
    let f' := unfoldConstraintRoot ctx f (fuel-1)
    match f' with
    | .lam _ _ body _ => unfoldConstraintRoot ctx (body.instantiate1 a) (fuel-1)
    | _ => .app f' a
  | _ => e

partial def solveConstraint (env : Environment) (prefixCtx : LocalContext) (xs : Array Expr)
    (state : IO.Ref ConstraintState) (call slot : Nat) (left right : Expr) (depth : Nat := 0) : IO Bool := do
  let s ← state.get
  unless s.steps < 4096 && depth <= 64 do return ← noteRefusal state "constraint-work-depth-bound"
  state.modify fun s => {s with steps := s.steps+1}
  if same left right || (Kernel.isDefEq env s.context left right).toOption == some true then return true
  let left := unfoldConstraintRoot s.context left
  let right := unfoldConstraintRoot s.context right
  let choices := ((independentIndex s.bindings right).toArray.map (fun i => (i,left)) ++
    (independentIndex s.bindings left).toArray.map (fun i => (i,right))).qsort (fun a b => a.1 > b.1)
  for (index,value) in choices do
    if ← deriveInput env prefixCtx xs state call slot index value then return true
  match left,right with
  | .app f a,.app g b =>
    if !(← solveConstraint env prefixCtx xs state call slot f g (depth+1)) then return false
    solveConstraint env prefixCtx xs state call slot a b (depth+1)
  | .forallE _ a bodyA _,.forallE _ b bodyB _ =>
    if !(← solveConstraint env prefixCtx xs state call slot a b (depth+1)) then return false
    if !bodyA.hasLooseBVars && !bodyB.hasLooseBVars then
      let _ ← solveConstraint env prefixCtx xs state call slot bodyA bodyB (depth+1)
    let current ← state.get
    return (Kernel.isDefEq env current.context left right).toOption == some true
  | .proj n i e,.proj m j f =>
    if n != m || i != j then return ← noteRefusal state "projection-owner-mismatch"
    solveConstraint env prefixCtx xs state call slot e f (depth+1)
  | _,_ => noteRefusal state "rigid-or-unsupported-constraint"

structure TemplateGroup where
  original : Expr
  targets : Array Nat
  deriving Inhabited

structure TemplateWork where
  memo : ExprStructMap Expr := {}
  used : Array Nat := #[]
  deriving Inhabited

partial def rewriteTemplate (env : Environment) (ctx : LocalContext) (groups : Array TemplateGroup)
    (lookup : ExprStructMap Nat) (bindings : Array Binding) (e : Expr) (depth : Nat) :
    StateT TemplateWork (Except String) Expr := do
  if let some result := (← get).memo.get? ⟨e⟩ then return result
  unless depth <= 512 && (← get).memo.size < 262144 do throw "template-work-depth-bound"
  let result ← if let some i := lookup.get? ⟨e⟩ then do
    let group := groups[i]!
    let first := bindings[group.targets[0]!]!.termVar
    unless group.targets.all (fun j => (Kernel.isDefEq env ctx first bindings[j]!.termVar).toOption == some true) do
      throw "ambiguous-source-value-pattern"
    modify fun s => {s with used := if s.used.contains i then s.used else s.used.push i}
    pure first
   else match e with
    | .app f a => pure <| .app (← rewriteTemplate env ctx groups lookup bindings f (depth+1)) (← rewriteTemplate env ctx groups lookup bindings a (depth+1))
    | .lam n t b bi => pure <| .lam n (← rewriteTemplate env ctx groups lookup bindings t (depth+1)) (← rewriteTemplate env ctx groups lookup bindings b (depth+1)) bi
    | .forallE n t b bi => pure <| .forallE n (← rewriteTemplate env ctx groups lookup bindings t (depth+1)) (← rewriteTemplate env ctx groups lookup bindings b (depth+1)) bi
    | .letE n t v b nd => pure <| .letE n (← rewriteTemplate env ctx groups lookup bindings t (depth+1)) (← rewriteTemplate env ctx groups lookup bindings v (depth+1)) (← rewriteTemplate env ctx groups lookup bindings b (depth+1)) nd
    | .mdata d b => pure <| .mdata d (← rewriteTemplate env ctx groups lookup bindings b (depth+1))
    | .proj n i b => pure <| .proj n i (← rewriteTemplate env ctx groups lookup bindings b (depth+1))
    | e => pure e
  modify fun s => {s with memo := s.memo.insert ⟨e⟩ result}
  return result

def makeTemplate (env : Environment) (prefixCtx : LocalContext) (xs : Array Expr)
    (s : ConstraintState) (index : Nat) : IO (Expr × Json) := do
  let earlier := s.bindings.extract 0 index
  let before := xs ++ earlier.map (·.termVar)
  let original := s.bindings[index]!.originalValue
  unless original.consumeMData.isLambda do throw <| IO.userError "Source template is not a lambda"
  let mut groups : Array TemplateGroup := #[]
  let mut lookup : ExprStructMap Nat := {}
  for j in [:earlier.size] do
    let b := earlier[j]!
    -- Type-valued positions are constrained explicitly; do not replace the
    -- literal Real/Nat/Prop types throughout a mathematical function body.
    if (← typeOf env prefixCtx b.originalValue).consumeMData.isSort then continue
    unless !b.originalValue.hasLooseBVars && !b.originalValue.hasMVar do
      throw <| IO.userError "Open source template pattern"
    if let some i := lookup.get? ⟨b.originalValue⟩ then
      groups := groups.set! i {groups[i]! with targets := groups[i]!.targets.push j}
    else
      lookup := lookup.insert ⟨b.originalValue⟩ groups.size
      groups := groups.push {original := b.originalValue, targets := #[j]}
  let (value,work) ← required <| (rewriteTemplate env s.context groups lookup earlier original 0).run {}
  let mut roots := #[original.abstract xs,value.abstract before]
  let mut directory := #[]
  for group in groups do
    let sourceRoot := roots.size
    roots := roots.push (group.original.abstract xs)
    let targetRoot := roots.size
    roots := roots.push (earlier[group.targets[0]!]!.termVar.abstract before)
    directory := directory.push <| obj [("sourceRoot",nat sourceRoot),("targetRoot",nat targetRoot),
      ("targets",toJson (group.targets.map (fun j => bindingKey earlier[j]!)))]
  return (value,obj [("bindingKey",str (bindingKey s.bindings[index]!)),("contextBindingKeys",toJson (earlier.map bindingKey)),
    ("groups",toJson directory),("usedGroups",toJson work.used),("storedStates",nat work.memo.size),
    ("graph",AtlasPacketReplay.graph roots),("relation",str "derived-source-value-pattern/1")])

def occursThroughDefinitions (ctx : LocalContext) (input : Expr) (id : FVarId) : Bool := Id.run do
  let mut todo := (collectFVars {} input).fvarIds
  let mut seen : Array FVarId := #[]
  for step in [:512] do
    if step >= todo.size then return false
    let current := todo[step]!
    if current == id then return true
    if seen.contains current then continue
    seen := seen.push current
    if let some value := (ctx.find? current).bind (·.value? true) then
      todo := todo ++ (collectFVars {} value).fvarIds
  return false

def solveWithTemplates (env : Environment) (prefixCtx : LocalContext) (xs : Array Expr)
    (state : IO.Ref ConstraintState) (call slot : Nat) (left right : Expr) : IO Bool := do
  let _ ← solveConstraint env prefixCtx xs state call slot left right
  for _ in [:32] do
    let s ← state.get
    if (Kernel.isDefEq env s.context left right).toOption == some true then return true
    let mut advanced := false
    for b in s.bindings do
      unless b.value.isNone && b.originalValue.consumeMData.isLambda &&
        (occursThroughDefinitions s.context left b.termVar.fvarId! || occursThroughDefinitions s.context right b.termVar.fvarId!) do continue
      let snapshot ← state.get
      let some index := snapshot.bindings.findIdx? (fun row => same row.termVar b.termVar) | continue
      try
        let (value,plan) ← makeTemplate env prefixCtx xs snapshot index
        let actual ← typeOf env snapshot.context value
        let expected := b.domain
        let _ ← solveConstraint env prefixCtx xs state call slot actual expected
        let current ← state.get
        let some target := current.bindings.findIdx? (fun row => same row.termVar b.termVar) | throw <| IO.userError "Template input disappeared"
        unless (Kernel.isDefEq env current.context actual expected).toOption == some true &&
          (← deriveInput env prefixCtx xs state call slot target value) do throw <| IO.userError "Template typing/source guard refused"
        state.modify fun next => {next with templates := next.templates.push (plan.mergeObj (obj [("constraint",nat (next.records.size-1)),("call",nat call),("slot",nat slot)]))}
        let _ ← solveConstraint env prefixCtx xs state call slot left right
        advanced := true
        break
      catch _ =>
        let after ← state.get
        state.set {snapshot with steps := max snapshot.steps after.steps}
    unless advanced do return false
  return ← noteRefusal state "template-attempt-bound"

end AtlasRegionInputs
