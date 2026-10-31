/- Included after the public packet decoder and original scope-closure tools.
   The source context is fixed; derived parameters have their own telescope. -/
namespace AtlasFrontierFunctions
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes AtlasResultClosures

structure Hole where
 source : Json
 context : Array Json
 term : Expr
 type : Expr
 lets : Array Bool
 originalType : Json
 deriving Inhabited

def collect (request : Json) (source : Array Expr) (keep : Nat)
    (cache : IO.Ref (Array Hole)) (original term : Expr) (xs : Array Expr)
    (ctx : Array Json) (shared : Shared) (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 unless (← fieldM request "anchor") == obj [("node",nat (← sourceId shared original)),("route",routeJson root slots)] &&
     (← fieldM request "context") == toJson ctx do throwError "Exact frontier source/context mismatch"
 let inferred ← kernelType term
 let (closed,closedType,lets) ← closeSuffix source original term inferred xs ctx keep
 kernelAtPrefix xs keep closed closedType
 liftM (m := IO) <| cache.modify (·.push {source:=request,context:=ctx,term:=closed,type:=closedType,lets,originalType:=AtlasPacketReplay.graph #[inferred.abstract xs]})
 let _ := path
 return Json.null

/- Traversal follows the supplied frontier trie. Unaffected source subgraphs
   remain shared. Parameters are free variables, so they cannot be captured. -/
partial def rewrite (e : Expr) (path : Array Nat) (routes : Array (Array Nat))
    (holes : Array Hole) (parameters : Array Expr) (work : IO.Ref Nat) : MetaM Expr := do
 let count ← liftM (m := IO) <| work.modifyGet fun n => (n+1,n+1)
 unless count<=65536 && path.size<=512 do throwError "Frontier traversal bound"
 if let some i := routes.findIdx? (· == path) then
  let mut value := parameters[i]!
  let flags := holes[i]!.lets
  for j in [:flags.size] do
   unless flags[j]! do value := mkApp value (.bvar (flags.size-1-j))
  return value
 unless routes.any (fun route => path.size < route.size && route.extract 0 path.size == path) do return e
 let child (x : Expr) (slot : Nat) := rewrite x (path.push slot) routes holes parameters work
 match e with
 | .app f a => return e.updateApp! (← child f 0) (← child a 1)
 | .lam n t b bi => return .lam n (← child t 0) (← child b 1) bi
 | .forallE n t b bi => return .forallE n (← child t 0) (← child b 1) bi
 | .letE n t v b nondep => return .letE n (← child t 0) (← child v 1) (← child b 2) nondep
 | .mdata _ x => return e.updateMData! (← child x 0)
 | .proj _ _ x => return e.updateProj! (← child x 0)
 | _ => throwError "Frontier route into atomic expression"

/- Literal, ordered substitution in a new parameter's type. This is not
   normalization or a claim of a unique semantic interface. -/
def generalize (type : Expr) (originals parameters : Array Expr) : Expr :=
 type.replace fun e => (originals.findIdx? (fun x => (⟨x⟩ : ExprStructEq) == ⟨e⟩)).map (parameters[·]!)

partial def introduce (holes : Array Hole) (generalizeTypes : Bool)
    (i : Nat) (parameters : Array Expr)
    (finish : Array Expr → MetaM Json) : MetaM Json := do
 if i == holes.size then return ← finish parameters
 let originals := (holes.extract 0 i).map (·.term)
 let type := if generalizeTypes then generalize holes[i]!.type originals parameters else holes[i]!.type
 structural (type.replaceFVars parameters originals) holes[i]!.type "literal parameter-type recovery"
 checkDomain type
 withLocalDecl (.str .anonymous ("input"++toString i)) .default type fun h =>
  introduce holes generalizeTypes (i+1) (parameters.push h) finish

def holeJson (xs : Array Expr) (h : Hole) : Json :=
 obj [("source",h.source),("context",toJson h.context),("letSlots",toJson h.lets),
  ("original",AtlasPacketReplay.graph #[h.term.abstract xs,h.type.abstract xs]),("originalType",h.originalType)]

def parameterGraphs (xs parameters : Array Expr) : MetaM (Array Json) := do
 let mut result : Array Json := #[]
 for i in [:parameters.size] do
  let type := (← getFVarLocalDecl parameters[i]!).type
  result := result.push (AtlasPacketReplay.graph #[type.abstract (xs++parameters.extract 0 i)])
 return result

def atPrefix (request : Json) (source : Array Expr) (original term : Expr)
    (xs : Array Expr) (context : Array Json) (shared : Shared) (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 unless (← fieldM request "context") == toJson context do throwError "Exact frontier prefix context"
 let .ok entries := (← fieldM request "holes").getArr? | throwError "Frontier holes"
 unless !entries.isEmpty && entries.size<=64 do throwError "Frontier parameter bound"
 let mut routes : Array (Array Nat) := #[]
 let cache ← liftM (m := IO) <| IO.mkRef (#[] : Array Hole)
 for entry in entries do
  let targetRoute ← fieldM (← fieldM entry "anchor") "route"
  let .ok targetRoot := targetRoute.getObjValAs? Nat "root" | throwError "Frontier root"
  let .ok target := targetRoute.getObjValAs? (Array Nat) "slots" | throwError "Frontier slots"
  unless targetRoot==root && target.extract 0 slots.size==slots && target.size<=512 do throwError "Frontier outside selected source"
  let relative := target.extract slots.size target.size
  for route in routes do
   unless !(relative.extract 0 route.size==route || route.extract 0 relative.size==relative) do throwError "Overlapping frontier occurrences"
  routes := routes.push relative
  let _ ← atRouteWith original relative.toList xs context shared root slots path (collect entry source xs.size cache)
 let holes ← liftM (m := IO) cache.get
 unless holes.size==entries.size do throwError "Frontier parameter count"
 let .ok generalizeTypes := request.getObjValAs? Bool "generalizeTypes" | throwError "Type substitution mode"
 let originalType ← kernelType term
 introduce holes generalizeTypes 0 #[] fun parameters => do
  let work ← liftM (m := IO) <| IO.mkRef 0
  let body ← rewrite term #[] routes holes parameters work
  let result := Kernel.check (← getEnv) (← getLCtx) body
  let status ← fieldM request "expected"
  match result with
  | .error _ =>
   unless status == str "KERNEL_REJECTED" do throwError "Candidate frontier body rejected by kernel"
   let rejectedFunction ← mkLambdaFVars parameters body
   return obj [("id",← fieldM request "id"),("status",str "KERNEL_REJECTED"),("phase",str "candidate-body"),
    ("rejectedFunctionGraph",AtlasPacketReplay.graph #[rejectedFunction.abstract xs]),("context",toJson context),
    ("holes",toJson (holes.map (holeJson xs))),("parameterTypes",toJson (← parameterGraphs xs parameters)),
    ("parameters",nat holes.size),("work",nat (← liftM (m := IO) work.get))]
  | .ok bodyType =>
   unless status == str "PASS" do throwError "Expected frontier rejection was accepted"
   let function ← mkLambdaFVars parameters body
   let functionType ← mkForallFVars parameters bodyType
   kernelAs function functionType
   kernelAtPrefix (xs++parameters) xs.size function functionType
   let applied := mkAppN function (holes.map (·.term))
   kernelAs applied originalType
   conversion applied term
   kernelAs (← mkEqRefl applied) (← mkEq applied term)
   let parameterTypes ← parameterGraphs xs parameters
   let sourceGraph := AtlasPacketReplay.graph #[term.abstract xs,originalType.abstract xs]
   let graph := AtlasPacketReplay.graph #[function.abstract xs,functionType.abstract xs]
   let mut permutationControl := Json.null
   if (← fieldM request "id") == str "proofTwins:distinct-proof-ports" then
    let wrong ← rewrite term #[] routes holes parameters.reverse work
    unless !((⟨wrong⟩ : ExprStructEq) == ⟨body⟩) do throwError "Proof permutation failed to change literal body"
    let wrongFunction ← mkLambdaFVars parameters wrong
    let wrongApplied := mkAppN wrongFunction (holes.map (·.term))
    kernelAs wrongApplied originalType
    conversion wrongApplied term
    kernelAs (← mkEqRefl wrongApplied) (← mkEq wrongApplied term)
    permutationControl := obj [("typingAndConversion",str "PASS"),("literalBodyDifferent",toJson true),
     ("wrongGraph",AtlasPacketReplay.graph #[wrongFunction.abstract xs])]
   return obj [("id",← fieldM request "id"),("status",str "PASS"),("namespace",str "source-frontier-function"),
    ("sourceGraph",sourceGraph),("graph",graph),("context",toJson context),("holes",toJson (holes.map (holeJson xs))),
    ("parameterTypes",toJson parameterTypes),("functionText",str (← prettyType function)),("typeText",str (← prettyType functionType)),
    ("functionTyping",str "PASS"),("sourceInstantiationTyping",str "PASS"),("sourceInstantiationConversion",str "PASS"),
    ("sourceEqualityWitness",str "PASS"),("literalHoleReopening",str "PASS"),("literalParameterTypeRecovery",str "PASS"),
    ("proofPermutationControl",permutationControl),
    ("work",nat (← liftM (m := IO) work.get))]

syntax "#atlas_frontier_functions " str " => " str : command
elab_rules : command
 | `(#atlas_frontier_functions $input:str => $output:str) => do
  let request ← readJson input.getString
  let packet ← readJson (← string request "packetFile")
  let .ok (source,roots) := AtlasPacketReplay.exact packet | throwError "Exact frontier packet"
  let sourceInfo ← field request "source"
  let name ← string sourceInfo "name"
  unless ((← getEnv).find? name.toName).isNone do throwError "Original declaration unexpectedly imported"
  liftTermElabM fun _ => do
   checkDomain source[roots[0]!]!
   kernelAs source[roots[1]!]! source[roots[0]!]!
  let (_,start) := intern source[roots[0]!]! {}
  let (_,shared) := intern source[roots[1]!]! start
  let .ok cases := (← field request "cases").getArr? | throwError "Frontier cases"
  let mut results : Array Json := #[]
  for c in cases do
   let route ← field c "prefixRoute"
   let .ok root := route.getObjValAs? Nat "root" | throwError "Prefix root"
   let .ok slots := route.getObjValAs? (Array Nat) "slots" | throwError "Prefix slots"
   let result ← liftTermElabM fun _ => atRouteWith source[roots[root]!]! slots.toList #[] #[] shared root #[] (if root==0 then "root.type" else "root.value") (atPrefix c source)
   results := results.push result
  liftIO <| IO.FS.writeFile output.getString (obj [("format",str "ProofAtlasFrontierFunctions/1"),("source",sourceInfo),
   ("closedPacketKernelTyping",str "PASS"),("originalDeclarationImported",toJson false),("cases",toJson results)]).compress
end AtlasFrontierFunctions
