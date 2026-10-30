/- Computed output tuples in one exact original lexical prefix. This tooling
   does not infer independent boundary premises or a quotient-region function. -/
namespace AtlasResultClosures
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes

def fieldM (j : Json) (k : String) : MetaM Json := do
 match j.getObjVal? k with | .ok x => return x | .error e => throwError e

def number (j : Json) (k : String) : MetaM Nat := do
 match j.getObjValAs? Nat k with | .ok x => return x | .error e => throwError e

def structural (a b : Expr) (label : String) : MetaM Unit := do
 unless (⟨a⟩ : ExprStructEq) == ⟨b⟩ do throwError "Structural mismatch: {label}"

def conversion (a b : Expr) : MetaM Unit := do
 match Kernel.isDefEq (← getEnv) (← getLCtx) a b with
 | .ok true => pure ()
 | _ => throwError "Kernel conversion rejected"

def kernelAtPrefix (xs : Array Expr) (keep : Nat) (term expected : Expr) : MetaM Unit := do
 unless keep <= xs.size do throwError "Kernel prefix bounds"
 let mut context ← getLCtx
 for x in xs.extract keep xs.size do context := context.erase x.fvarId!
 let env ← getEnv
 match Kernel.check env context expected with
 | .ok (.sort _) => pure ()
 | _ => throwError "Expected type rejected in exact prefix"
 let identity := mkApp (mkLambda `atlasPrefixExpected .default expected (.bvar 0)) term
 match Kernel.check env context identity with
 | .ok _ => pure ()
 | _ => throwError "Term rejected in exact prefix"

structure ClosedPort where
 term : Expr
 expected : Expr
 info : Json
 deriving Inhabited

def closeSuffix (source : Array Expr) (original term inferred : Expr)
    (xs : Array Expr) (context : Array Json) (common : Nat) : MetaM (Expr × Expr × Array Bool) := do
 unless common <= xs.size && context.size == xs.size do throwError "Context lengths"
 let suffix := xs.extract common xs.size
 let mut closed := term.abstract suffix
 let mut expected := inferred.abstract suffix
 let mut lets : Array Bool := #[]
 for i in [:suffix.size] do
  let index := common+i
  let header := source[← number context[index]! "node"]!
  let decl ← getFVarLocalDecl xs[index]!
  let domain := decl.type.abstract (suffix.extract 0 i)
  let ambient := xs.extract 0 index
  match header with
  | .lam n t _ bi | .forallE n t _ bi =>
   structural decl.type (t.instantiateRev ambient) "source header domain"
   unless decl.userName == n && decl.binderInfo == bi do throwError "Source header binder identity"
   lets := lets.push false
  | .letE n t v _ nondep =>
   structural decl.type (t.instantiateRev ambient) "source let domain"
   let some actual := decl.value? true | throwError "Source local definition absent"
   structural actual (v.instantiateRev ambient) "source let value"
   unless decl.userName == n && decl.isNondep == nondep do throwError "Source local-definition identity"
   lets := lets.push true
  | _ => throwError "Source context header"
  let _ := domain
 for i in (List.range suffix.size).reverse do
  let index := common+i
  let header := source[← number context[index]! "node"]!
  let decl ← getFVarLocalDecl xs[index]!
  let before := suffix.extract 0 i
  let domain := decl.type.abstract before
  match header with
  | .lam n _ _ bi | .forallE n _ _ bi =>
   closed := .lam n domain closed bi
   expected := .forallE n domain expected bi
  | .letE n _ _ _ nondep =>
   let some value := decl.value? true | throwError "Local-definition value"
   closed := .letE n domain (value.abstract before) closed nondep
   expected := .letE n domain (value.abstract before) expected nondep
  | _ => throwError "Closing header"
 -- Reopen by source binder identity, including lets. This is a structural
 -- inverse, separate from kernel conversion/proof irrelevance.
 let mut reopened := closed
 for i in [:suffix.size] do
  let header := source[← number context[common+i]! "node"]!
  match header,reopened with
  | .lam _ _ _ _,.lam _ _ body _ | .forallE _ _ _ _,.lam _ _ body _ =>
   reopened := body.instantiate1 suffix[i]!
  | .letE _ _ _ _ _,.letE _ _ _ body _ => reopened := body.instantiate1 suffix[i]!
  | _,_ => throwError "Reopening header shape"
 structural reopened term "literal source reopening"
 let commonXs := xs.extract 0 common
 for e in [closed,expected] do
  let abstracted := e.abstract commonXs
  unless !abstracted.hasFVar && !abstracted.hasMVar &&
      (⟨abstracted.instantiateRev commonXs⟩ : ExprStructEq) == ⟨e⟩ do throwError "Suffix escaped common prefix"
 let _ := original
 return (closed,expected,lets)

def observePort (call : Json) (source : Array Expr) (commonXs : Array Expr)
    (cache : IO.Ref (Array ClosedPort)) (original term : Expr) (xs : Array Expr)
    (context : Array Json) (shared : Shared) (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 let anchor ← fieldM call "anchor"
 unless (← number anchor "node") == (← sourceId shared original) &&
     (← fieldM anchor "route") == routeJson root slots && (← fieldM call "context") == toJson context do throwError "Exact source port/context mismatch"
 let inferred ← kernelType term
 if let .ok raw := call.getObjVal? "oldTypeGraph" then
  let .ok values := AtlasPacketReplay.decode raw | throwError "Old native type graph"
  structural inferred ((values[← number call "oldTypeRoot"]!).instantiateRev xs) "old native result type"
  unless (← fieldM call "oldRole") == str (← role inferred) do throwError "Old native result role"
 let (closed,expected,lets) ← closeSuffix source original term inferred xs context commonXs.size
 let _ ← kernelType closed
 checkDomain expected
 kernelAs closed expected
 kernelAtPrefix xs commonXs.size closed expected
 let middle := commonXs.size+(xs.size-commonXs.size)/2
 let (innerTerm,innerType,_) ← closeSuffix source original term inferred xs context middle
 kernelAtPrefix xs middle innerTerm innerType
 let (stagedTerm,stagedType,_) ← closeSuffix source original innerTerm innerType (xs.extract 0 middle) (context.extract 0 middle) commonXs.size
 structural stagedTerm closed "two-stage term closure"
 structural stagedType expected "two-stage type closure"
 kernelAtPrefix xs commonXs.size stagedTerm stagedType
 let rawType := AtlasPacketReplay.graph #[inferred.abstract xs]
 let metadata := obj [("call",← fieldM call "id"),("source",obj [("node",nat (← sourceId shared original)),("route",routeJson root slots),("path",str path)]),
  ("context",toJson context),("commonContextLength",nat commonXs.size),("suffixLength",nat (xs.size-commonXs.size)),
  ("letSlots",toJson lets),("argumentCount",nat (lets.filter (!·)).size),("originalRole",str (← role inferred)),
  ("originalType",rawType),("originalTypeText",str (← prettyType inferred)),
  ("closedTypeText",str (← prettyType expected)),
  ("composition",obj [("middleContextLength",nat middle),("nontrivial",toJson (commonXs.size < middle && middle < xs.size)),
   ("termStructuralEquality",str "PASS"),("typeStructuralEquality",str "PASS"),("intermediatePrefixTyping",str "PASS"),("targetPrefixTyping",str "PASS")]),("literalReopening",str "PASS"),("suffixSupportClosed",str "PASS")]
 liftM (m := IO) <| cache.modify (·.push {term:=closed,expected,info:=metadata})
 return Json.null

def checkProjection (call : Json) (source : Array Expr) (commonXs : Array Expr)
    (closure : ClosedPort) (projected : Expr) (original term : Expr) (xs : Array Expr)
    (context : Array Json) (_shared : Shared) (_root : Nat) (_slots : Array Nat) (_path : String) : MetaM Json := do
 let inferred ← kernelType term
 let (again,expected,lets) ← closeSuffix source original term inferred xs context commonXs.size
 structural again closure.term "repeated source closure"
 structural expected closure.expected "repeated closed type"
 kernelAs projected expected
 conversion projected closure.term
 let mut applied := projected
 for i in [:lets.size] do
  unless lets[i]! do applied := mkApp applied xs[commonXs.size+i]!
 kernelAs applied inferred
 conversion applied term
 kernelAs (← mkEqRefl applied) (← mkEq applied term)
 let wrongTypeRejected ← try
  kernelAs projected (mkConst ``Bool)
  pure false
 catch _ => pure true
 unless wrongTypeRejected do throwError "Wrong projection type accepted"
 let _ := call
 return obj [("projectionTyping",str "PASS"),("projectionConversion",str "PASS"),
  ("instantiationTyping",str "PASS"),("instantiationConversion",str "PASS"),("wrongTypeRejected",toJson true)]

def groupAt (group : Json) (source : Array Expr) (original _term : Expr) (xs : Array Expr)
    (context : Array Json) (shared : Shared) (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 unless (← fieldM group "commonContext") == toJson context && (← fieldM group "prefixRoute") == routeJson root slots do throwError "Exact common prefix mismatch"
 let .ok calls := (← fieldM group "calls").getArr? | throwError "Calls"
 unless !calls.isEmpty && calls.size<=8 do throwError "Result port count bound"
 let cache ← liftM (m := IO) <| IO.mkRef (#[] : Array ClosedPort)
 for call in calls do
  let targetRoute ← fieldM (← fieldM call "anchor") "route"
  let .ok targetRoot := targetRoute.getObjValAs? Nat "root" | throwError "Target root"
  let .ok target := targetRoute.getObjValAs? (Array Nat) "slots" | throwError "Target route"
  unless targetRoot == root && target.extract 0 slots.size == slots do throwError "Port outside common-prefix occurrence"
  let _ ← atRouteWith original (target.extract slots.size target.size).toList xs context shared root slots path (observePort call source xs cache)
 let ports ← liftM (m := IO) cache.get
 unless ports.size == calls.size do throwError "Result count"
 for port in ports do
  -- This runs after the inner lexical context has been removed.
  let _ ← kernelType port.term
  checkDomain port.expected
  kernelAs port.term port.expected
 let mut tupleSteps : Array Json := #[]
 let mut tuple := ports[ports.size-1]!.term
 let mut tupleType := ports[ports.size-1]!.expected
 for i in (List.range (ports.size-1)).reverse do
  let .sort u ← whnf (← kernelType ports[i]!.expected) | throwError "Port universe"
  let .sort v ← whnf (← kernelType tupleType) | throwError "Tuple universe"
  tuple := mkAppN (mkConst ``PProd.mk [u,v]) #[ports[i]!.expected,tupleType,ports[i]!.term,tuple]
  tupleType := mkApp2 (mkConst ``PProd [u,v]) ports[i]!.expected tupleType
  kernelAs tuple tupleType
  let resultSort ← kernelType tupleType
  tupleSteps := tupleSteps.push (obj [("ordinal",nat i),("universes",AtlasPacketReplay.graph #[.sort u,.sort v,resultSort])])
 checkDomain tupleType
 kernelAs tuple tupleType
 let mut projected := tuple
 let mut results : Array Json := #[]
 for i in [:ports.size] do
  let projection := if i+1 == ports.size then projected else .proj ``PProd 0 projected
  kernelAs projection ports[i]!.expected
  conversion projection ports[i]!.term
  let call := calls[i]!
  let targetRoute ← fieldM (← fieldM call "anchor") "route"
  let .ok target := targetRoute.getObjValAs? (Array Nat) "slots" | throwError "Projection target route"
  let checked ← atRouteWith original (target.extract slots.size target.size).toList xs context shared root slots path (checkProjection call source xs ports[i]! projection)
  let graph := AtlasPacketReplay.graph #[ports[i]!.term.abstract xs,ports[i]!.expected.abstract xs]
  let .ok kinds := graph.getObjValAs? (Array Nat) "kind" | throwError "Closure graph shape"
  unless kinds.size<=131072 do throwError "Closure graph bound"
  results := results.push (obj [("port",ports[i]!.info),("graph",graph),("checks",checked)])
  if i+1<ports.size then projected := .proj ``PProd 1 projected
 let tupleGraph := AtlasPacketReplay.graph #[tuple.abstract xs,tupleType.abstract xs]
 return obj [("id",← fieldM group "id"),("commonContext",toJson context),("prefixRoute",routeJson root slots),
  ("ports",toJson results),("tupleSteps",toJson tupleSteps),("tupleGraph",tupleGraph),("tupleTypeText",str (← prettyType tupleType)),
  ("tupleTyping",str "PASS"),("tupleNamespace",str "common-prefix-result-tuple"),
  ("isIndependentBoundaryFunction",toJson false)]

syntax "#atlas_result_closures " str " => " str : command
elab_rules : command
 | `(#atlas_result_closures $input:str => $output:str) => do
  let request ← readJson input.getString
  let packet ← readJson (← string request "packetFile")
  let source ← field request "source"
  let name ← string source "name"
  let isRiccati := name == "JacobiData.slope_bound_abs"
  let imported := ((← getEnv).find? name.toName).isSome
  unless imported == isRiccati do throwError "Unexpected original declaration import status"
  let moduleName ← string source "module"
  let moduleImported := (← getEnv).header.moduleNames.any (·.toString == moduleName)
  let privateImported := (← getEnv).header.moduleNames.any (·.toString.startsWith "SE2Conjugate.")
  unless moduleImported == isRiccati && privateImported == isRiccati do throwError "Unexpected original/private module import status"
  let .ok (values,roots) := AtlasPacketReplay.exact packet | throwError "Exact packet decode"
  unless roots.size == 2 do throwError "Closed declaration roots"
  liftTermElabM fun _ => do
   checkDomain values[roots[0]!]!
   kernelAs values[roots[1]!]! values[roots[0]!]!
   if isRiccati then
    let info ← getConstInfo name.toName
    structural info.type values[roots[0]!]! "recompiled Riccati type"
    let some body := info.value? true | throwError "Recompiled Riccati body absent"
    structural body values[roots[1]!]! "recompiled Riccati body"
  let (_,start) := intern values[roots[0]!]! {}
  let (_,shared) := intern values[roots[1]!]! start
  let .ok groups := (← field request "groups").getArr? | throwError "Groups"
  let mut lawChecks : Array Json := #[]
  for lawName in [``AtlasResultClosureLaws.wrapper_append, ``AtlasResultClosureLaws.term_append, ``AtlasResultClosureLaws.type_append] do
   let info ← getConstInfo lawName
   let some proof := info.value? true | throwError "Composition law proof absent"
   liftTermElabM fun _ => kernelAs proof info.type
   let axioms ← collectAxioms lawName
   let allowed := if lawName == ``AtlasResultClosureLaws.wrapper_append then #[] else #[``propext]
   unless axioms == allowed do throwError "Unexpected axiom in structural composition law: {lawName}: {axioms}"
   lawChecks := lawChecks.push (obj [("name",str lawName.toString),("kernelTyping",str "PASS"),("axioms",toJson (axioms.map (·.toString)))])
  let mut results : Array Json := #[]
  for group in groups do
   let route ← field group "prefixRoute"
   let .ok root := route.getObjValAs? Nat "root" | throwError "Root"
   let .ok slots := route.getObjValAs? (Array Nat) "slots" | throwError "Slots"
   let result ← liftTermElabM fun _ => atRouteWith values[roots[root]!]! slots.toList #[] #[] shared root #[] (if root==0 then "root.type" else "root.value") (groupAt group values)
   results := results.push result
  liftIO <| IO.FS.writeFile output.getString (obj [("format",str "ProofAtlasCommonPrefixResultClosures/1"),("status",str "PASS"),
   ("source",source),("originalDeclarationImported",toJson imported),("originalModuleImported",toJson moduleImported),
   ("privateRiccatiModulesImported",toJson privateImported),("recompiledOriginalTypeAndBodyMatch",toJson isRiccati),("closedPacketKernelTyping",str "PASS"),
   ("laws",toJson lawChecks),("groups",toJson results)]).compress
end AtlasResultClosures
