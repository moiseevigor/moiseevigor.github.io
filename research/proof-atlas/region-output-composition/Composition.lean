/- Runtime bridge for typed regrouping of scope-correct output tuples.
   Requires the pinned packet replay and result-closure tooling; keeps
   original occurrence order distinct from the hierarchy's tuple order. -/
namespace AtlasOutputCompositionNative
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes AtlasResultClosures

structure Bundle where
 value : Expr
 type : Expr
 steps : Array Json
 deriving Inhabited

structure Nested where
 bundle : Bundle
 members : Array Nat
 common : Nat
 context : Array Json
 prefixSlots : Array Nat
 deriving Inhabited

def pack (values types : Array Expr) : MetaM Bundle := do
 unless values.size == types.size && !values.isEmpty do throwError "Tuple arity"
 let mut v := values.back!
 let mut t := types.back!
 let mut steps := #[]
 for i in (List.range (values.size-1)).reverse do
  let .sort u ← whnf (← kernelType types[i]!) | throwError "Tuple component universe"
  let .sort w ← whnf (← kernelType t) | throwError "Tuple tail universe"
  v := mkAppN (mkConst ``PProd.mk [u,w]) #[types[i]!,t,values[i]!,v]
  t := mkApp2 (mkConst ``PProd [u,w]) types[i]! t
  kernelAs v t
  steps := steps.push (obj [("ordinal",nat i),("levels",AtlasPacketReplay.graph #[.sort u,.sort w])])
 kernelAs v t
 return {value:=v,type:=t,steps}

def project (tuple : Expr) (size ordinal : Nat) : MetaM Expr := do
 unless ordinal < size do throwError "Projection position"
 let mut result := tuple
 for _ in [:ordinal] do result := .proj ``PProd 1 result
 return if ordinal+1 == size then result else .proj ``PProd 0 result

def applyFrames (source : Array Expr) (value : Expr) (xs : Array Expr)
    (context : Array Json) (start stop : Nat) : MetaM Expr := do
 unless start <= stop && stop <= xs.size && context.size == xs.size do throwError "Instantiation interval"
 let mut term := value
 for i in [start:stop] do
  match source[← number context[i]! "node"]! with
  | .lam .. | .forallE .. => term := mkApp term xs[i]!
  | .letE .. => pure ()
  | _ => throwError "Instantiation source frame"
 return term

/- The source contexts have already been independently authenticated by the
   old closure producer. This variant permits one explicitly supplied adapter
   input in the common prefix, retains exact source headers, and checks the
   new candidate's typing and literal reopening separately. -/
def closeCandidate (source : Array Expr) (term expected : Expr) (xs : Array Expr)
    (context : Array Json) (common : Nat) (extra : Expr) : MetaM ClosedPort := do
 kernelAs term expected
 let suffix := xs.extract common xs.size
 let mut v := term.abstract suffix
 let mut t := expected.abstract suffix
 for i in (List.range suffix.size).reverse do
  let j := common+i
  let decl ← getFVarLocalDecl xs[j]!
  let before := suffix.extract 0 i
  let domain := decl.type.abstract before
  let header := source[← number context[j]! "node"]!
  match header with
  | .lam n ty _ info | .forallE n ty _ info =>
   structural decl.type (ty.instantiateRev (xs.extract 0 j)) "adapter source domain"
   unless decl.userName == n && decl.binderInfo == info do throwError "Adapter binder identity"
   v := .lam n domain v info
   t := .forallE n domain t info
  | .letE n ty value _ nondep =>
   structural decl.type (ty.instantiateRev (xs.extract 0 j)) "adapter let domain"
   let some actual := decl.value? true | throwError "Adapter let value absent"
   structural actual (value.instantiateRev (xs.extract 0 j)) "adapter source let value"
   unless decl.userName == n && decl.isNondep == nondep do throwError "Adapter let identity"
   v := .letE n domain (actual.abstract before) v nondep
   t := .letE n domain (actual.abstract before) t nondep
  | _ => throwError "Adapter source context"
 let mut reopened := v
 for x in suffix do
  match reopened with
  | .lam _ _ body _ | .letE _ _ _ body _ => reopened := body.instantiate1 x
  | _ => throwError "Adapter literal reopening"
 structural reopened term "adapter source-local reopening"
 let allowed := (xs.extract 0 common).push extra
 for e in [v,t] do
  let closed := e.abstract allowed
  unless !closed.hasFVar && !closed.hasMVar do throwError "Adapter suffix escaped prefix"
 kernelAtPrefix xs common v t
 return {term:=v,expected:=t,info:=Json.null}

def collect (group : Json) (source : Array Expr) (original : Expr) (xs : Array Expr)
    (context : Array Json) (shared : Shared) (root : Nat) (slots : Array Nat) (path : String) : MetaM (Array ClosedPort) := do
 unless (← fieldM group "commonContext") == toJson context && (← fieldM group "prefixRoute") == routeJson root slots do throwError "Group exact common prefix"
 let .ok calls := (← fieldM group "calls").getArr? | throwError "Calls"
 let cache ← liftM (m:=IO) <| IO.mkRef (#[] : Array ClosedPort)
 for call in calls do
  let route ← fieldM (← fieldM call "anchor") "route"
  let .ok targetRoot := route.getObjValAs? Nat "root" | throwError "Call root"
  let .ok target := route.getObjValAs? (Array Nat) "slots" | throwError "Call route"
  unless targetRoot == root && target.extract 0 slots.size == slots do throwError "Call outside prefix"
  let _ ← atRouteWith original (target.extract slots.size target.size).toList xs context shared root slots path (observePort call source xs cache)
 let ports ← liftM (m:=IO) cache.get
 unless ports.size == calls.size do throwError "Collected source port count"
 return ports

def subAt (sub : Json) (source : Array Expr) (global : Nat) (cache : IO.Ref (Array Nested))
    (original term : Expr) (xs : Array Expr) (context : Array Json) (shared : Shared)
    (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 let ports ← collect sub source original xs context shared root slots path
 let bundle ← pack (ports.map (·.term)) (ports.map (·.expected))
 let (closed,expected,_) ← closeSuffix source original bundle.value bundle.type xs context global
 kernelAtPrefix xs global closed expected
 let .ok members := (← fieldM sub "positions").getArr? | throwError "Subgroup positions"
 let positions ← members.mapM fun m => match m.getNat? with | .ok x => pure x | _ => throwError "Subgroup member"
 liftM (m:=IO) <| cache.modify (·.push {bundle:={bundle with value:=closed,type:=expected},members:=positions,common:=xs.size,context,prefixSlots:=slots})
 let _ := term
 return Json.null

def flattenPort (source : Array Expr) (global : Nat) (sub : Nested)
    (innerOrdinal : Nat) (hierProjected : Expr) (original term : Expr) (xs : Array Expr)
    (context : Array Json) (_shared : Shared) (_root : Nat) (_slots : Array Nat) (_path : String) : MetaM ClosedPort := do
 let inferred ← kernelType term
 let (_,innerType,_) ← closeSuffix source original term inferred xs context sub.common
 let localTuple ← applyFrames source hierProjected xs context global sub.common
 let component ← project localTuple sub.members.size innerOrdinal
 kernelAs component innerType
 let applied ← applyFrames source component xs context sub.common xs.size
 kernelAs applied inferred
 -- The input variable is supplied separately by the caller.
 return {term:=applied,expected:=inferred,info:=Json.null}

def atClosed (original : Expr) (rest : List Nat) (xs : Array Expr) (context : Array Json)
    (shared : Shared) (root : Nat) (slots : Array Nat) (path : String)
    (observe : Expr → Expr → Array Expr → Array Json → Shared → Nat → Array Nat → String → MetaM ClosedPort) : MetaM ClosedPort := do
 let result ← liftM (m:=IO) <| IO.mkRef (none : Option ClosedPort)
 let _ ← atRouteWith original rest xs context shared root slots path fun a b c d e f g h => do
  let value ← observe a b c d e f g h
  liftM (m:=IO) <| result.set (some value)
  return Json.null
 let some value ← liftM (m:=IO) result.get | throwError "Source closure callback absent"
 return value

def composeAt (group : Json) (source : Array Expr) (original _term : Expr) (xs : Array Expr)
    (context : Array Json) (shared : Shared) (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 let flatPorts ← collect group source original xs context shared root slots path
 unless !flatPorts.isEmpty && flatPorts.size<=8 do throwError "Output collection bound"
 let flat ← pack (flatPorts.map (·.term)) (flatPorts.map (·.expected))
 let .ok subgroups := (← fieldM group "subgroups").getArr? | throwError "Subgroups"
 unless !subgroups.isEmpty && subgroups.size<=8 do throwError "Subgroup bound"
 let .ok calls := (← fieldM group "calls").getArr? | throwError "Calls"
 let cache ← liftM (m:=IO) <| IO.mkRef (#[] : Array Nested)
 for sub in subgroups do
  let .ok listed := (← fieldM sub "calls").getArr? | throwError "Subgroup calls"
  let .ok positions := (← fieldM sub "positions").getArr? | throwError "Subgroup positions"
  unless listed.size == positions.size do throwError "Subgroup binding count"
  for j in [:positions.size] do
   let .ok position := positions[j]!.getNat? | throwError "Subgroup binding position"
   unless position < calls.size && listed[j]! == calls[position]! do throwError "Subgroup changed original source binding"
  let route ← fieldM sub "prefixRoute"
  let .ok target := route.getObjValAs? (Array Nat) "slots" | throwError "Subgroup route"
  unless (← number route "root") == root && target.extract 0 slots.size == slots do throwError "Subgroup outside common occurrence"
  let _ ← atRouteWith original (target.extract slots.size target.size).toList xs context shared root slots path (subAt sub source xs.size cache)
 let nested ← liftM (m:=IO) cache.get
 let mut positions : Array Nat := #[]
 for sub in nested do positions := positions ++ sub.members
 unless positions.size == flatPorts.size && positions.toList.mergeSort (·<=·) == (List.range flatPorts.size) do throwError "Partition must conserve each original output exactly once"
 let hier ← pack (nested.map (·.bundle.value)) (nested.map (·.bundle.type))
 let flatten ← withLocalDecl `atlasHierInput .default hier.type fun h => do
  let mut values := #[]
  for i in [:flatPorts.size] do
   let some groupIndex := nested.findIdx? (fun sub => sub.members.contains i) | throwError "Missing original output"
   let sub := nested[groupIndex]!
   let some innerOrdinal := sub.members.findIdx? (·==i) | throwError "Missing local output"
   let projected ← project h nested.size groupIndex
   let route ← fieldM (← fieldM calls[i]! "anchor") "route"
   let .ok target := route.getObjValAs? (Array Nat) "slots" | throwError "Output target"
   let callback := fun orig term localXs localContext sh rt ss pp => do
    let portValue ← flattenPort source xs.size sub innerOrdinal projected orig term localXs localContext sh rt ss pp
    closeCandidate source portValue.term portValue.expected localXs localContext xs.size h
   let port ← atClosed original (target.extract slots.size target.size).toList xs context shared root slots path callback
   kernelAs port.term flatPorts[i]!.expected
   values := values.push port.term
  let bundle ← pack values (flatPorts.map (·.expected))
  mkLambdaFVars #[h] bundle.value
 let gather ← withLocalDecl `atlasFlatInput .default flat.type fun h => do
  let mut values := #[]
  for gi in [:nested.size] do
   let sub := nested[gi]!
   let callback := fun originalSub _term localXs localContext sh rt ss pp => do
    let canonical ← collect subgroups[gi]! source originalSub localXs localContext sh rt ss pp
    let mut localValues := #[]
    for j in [:sub.members.size] do
     let projected ← project h flatPorts.size sub.members[j]!
     let applied ← applyFrames source projected localXs localContext xs.size localXs.size
     kernelAs applied canonical[j]!.expected
     localValues := localValues.push applied
    let bundle ← pack localValues (canonical.map (·.expected))
    closeCandidate source bundle.value bundle.type localXs localContext xs.size h
   let port ← atClosed original (sub.prefixSlots.extract slots.size sub.prefixSlots.size).toList xs context shared root slots path callback
   kernelAs port.term sub.bundle.type
   values := values.push port.term
  let bundle ← pack values (nested.map (·.bundle.type))
  mkLambdaFVars #[h] bundle.value
 -- Adapter input is a free local until mkForallFVars closes it.
 let flattenType ← withLocalDecl `atlasHierInput .default hier.type fun h => mkForallFVars #[h] flat.type
 let gatherType ← withLocalDecl `atlasFlatInput .default flat.type fun h => mkForallFVars #[h] hier.type
 kernelAs flatten flattenType
 kernelAs gather gatherType
 kernelAtPrefix xs xs.size flatten flattenType
 kernelAtPrefix xs xs.size gather gatherType
 conversion (mkApp flatten hier.value) flat.value
 conversion (mkApp gather flat.value) hier.value
 withLocalDecl `atlasArbitraryFlat .default flat.type fun f => do
  conversion (mkApp flatten (mkApp gather f)) f
  kernelAs (← mkEqRefl (mkApp flatten (mkApp gather f))) (← mkEq (mkApp flatten (mkApp gather f)) f)
 withLocalDecl `atlasArbitraryHier .default hier.type fun h => do
  conversion (mkApp gather (mkApp flatten h)) h
  kernelAs (← mkEqRefl (mkApp gather (mkApp flatten h))) (← mkEq (mkApp gather (mkApp flatten h)) h)
 let literalTypesEqual := (⟨hier.type⟩ : ExprStructEq) == ⟨flat.type⟩
 let typeConvertible := match Kernel.isDefEq (← getEnv) (← getLCtx) hier.type flat.type with | .ok b => b | _ => false
 let rawReuseRejected ← try
  kernelAs hier.value flat.type
  pure false
 catch _ => pure true
 unless rawReuseRejected == !typeConvertible do throwError "Raw reuse/type conversion disagreement"
 let graph (term expected : Expr) := AtlasPacketReplay.graph #[term.abstract xs,expected.abstract xs]
 return obj [("id",← fieldM group "id"),("ports",toJson (flatPorts.map (·.info))),("sourceCommonContext",toJson context),("partition",toJson (nested.map (·.members))),
  ("subgroupContexts",toJson (nested.map (·.context))),
  ("flat",graph flat.value flat.type),("flatSteps",toJson flat.steps),
  ("hierarchical",graph hier.value hier.type),("hierarchicalSteps",toJson hier.steps),
  ("subgroupSteps",toJson (nested.map (·.bundle.steps))),
  ("flatten",graph flatten flattenType),("gather",graph gather gatherType),
  ("flattenTyping",str "PASS"),("gatherTyping",str "PASS"),("sourceFlatRecovery",str "PASS"),("sourceHierarchicalRecovery",str "PASS"),
  ("arbitraryFlatRoundTrip",str "PASS"),("arbitraryHierarchicalRoundTrip",str "PASS"),
  ("literalTypesEqual",toJson literalTypesEqual),("typeConvertible",toJson typeConvertible),("rawReuseRejected",toJson rawReuseRejected),
  ("namespace",str "scope-output-composition"),("isIndependentBoundaryFunction",toJson false)]

syntax "#atlas_output_composition " str " => " str : command
elab_rules : command
 | `(#atlas_output_composition $input:str => $output:str) => do
  let request ← readJson input.getString
  let packet ← readJson (← string request "packetFile")
  let source ← field request "source"
  let name ← string source "name"
  let riccati := name == "JacobiData.slope_bound_abs"
  let imported := ((← getEnv).find? name.toName).isSome
  unless imported == riccati do throwError "Original declaration import boundary"
  let moduleName ← string source "module"
  let moduleImported := (← getEnv).header.moduleNames.any (·.toString == moduleName)
  let privateImported := (← getEnv).header.moduleNames.any (·.toString.startsWith "SE2Conjugate.")
  unless moduleImported == riccati && privateImported == riccati do throwError "Original/private module boundary"
  let .ok (values,roots) := AtlasPacketReplay.exact packet | throwError "Exact packet"
  liftTermElabM fun _ => do
   checkDomain values[roots[0]!]!
   kernelAs values[roots[1]!]! values[roots[0]!]!
   if riccati then
    let info ← getConstInfo name.toName
    structural info.type values[roots[0]!]! "Pinned Riccati type"
    let some body := info.value? true | throwError "Riccati body absent"
    structural body values[roots[1]!]! "Pinned Riccati body"
  let (_,start) := intern values[roots[0]!]! {}
  let (_,shared) := intern values[roots[1]!]! start
  let .ok groups := (← field request "groups").getArr? | throwError "Groups"
  let mut results := #[]
  for group in groups do
   let route ← field group "prefixRoute"
   let rt ← liftTermElabM fun _ => number route "root"
   let .ok ss := route.getObjValAs? (Array Nat) "slots" | throwError "Route slots"
   let result ← liftTermElabM fun _ => atRouteWith values[roots[rt]!]! ss.toList #[] #[] shared rt #[] "root.value" (composeAt group values)
   results := results.push result
  let mut laws := #[]
  for law in [``AtlasOutputComposition.join_split,``AtlasOutputComposition.split_join,``AtlasOutputComposition.split_fst_apply,``AtlasOutputComposition.split_snd_apply] do
   let info ← getConstInfo law
   let some proof := info.value? true | throwError "Law body"
   liftTermElabM fun _ => kernelAs proof info.type
   let axioms ← collectAxioms law
   unless axioms.isEmpty do throwError "Unexpected law axiom"
   laws := laws.push (obj [("name",str law.toString),("kernelTyping",str "PASS"),("axioms",toJson (axioms.map (·.toString)))])
  liftIO <| IO.FS.writeFile output.getString (obj [("format",str "ProofAtlasScopeOutputComposition/1"),("status",str "PASS"),("source",source),
   ("originalDeclarationImported",toJson imported),("originalModuleImported",toJson moduleImported),("privateRiccatiModulesImported",toJson privateImported),("closedPacketKernelTyping",str "PASS"),("groups",toJson results),("laws",toJson laws)]).compress
end AtlasOutputCompositionNative
