/- The same frontier construction, with one shared graph for scoped components. -/
namespace AtlasJointFrontier
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes AtlasResultClosures AtlasFrontierFunctions

def declaredResult (type : Expr) (parameters : Nat) (goal : Expr) : MetaM Expr := do
 match parameters,type with
 | 0,_ => return goal
 | n+1,.forallE name domain body info => return .forallE name domain (← declaredResult body n goal) info
 | _,_ => throwError "Declared-goal parameter telescope"

def scope (kind : String) (length : Nat) : Json := obj [("kind",str kind),("length",nat length)]

def atRoot (request : Json) (source : Array Expr) (declaredGoal : Expr) (original term : Expr)
    (xs : Array Expr) (context : Array Json) (shared : Shared) (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 unless xs.isEmpty && context.isEmpty && slots.isEmpty && root==1 do throwError "Joint frontier requires closed body root"
 unless (← fieldM request "context")==toJson context do throwError "Joint frontier prefix context"
 let .ok entries := (← fieldM request "holes").getArr? | throwError "Joint frontier holes"
 unless !entries.isEmpty && entries.size<=64 do throwError "Frontier parameter bound"
 let cache ← liftM (m := IO) <| IO.mkRef (#[] : Array Hole)
 let mut routes : Array (Array Nat) := #[]
 for entry in entries do
  let targetRoute ← fieldM (← fieldM entry "anchor") "route"
  let .ok targetRoot := targetRoute.getObjValAs? Nat "root" | throwError "Frontier root"
  let .ok target := targetRoute.getObjValAs? (Array Nat) "slots" | throwError "Frontier slots"
  unless targetRoot==root && target.size<=512 do throwError "Frontier outside selected source"
  for route in routes do
   unless !(target.extract 0 route.size==route || route.extract 0 target.size==target) do throwError "Overlapping frontier occurrences"
  routes := routes.push target
  let _ ← atRouteWith original target.toList xs context shared root slots path (collect entry source 0 cache)
 let holes ← liftM (m := IO) cache.get
 unless holes.size==entries.size do throwError "Frontier parameter count"
 let .ok generalizeTypes := request.getObjValAs? Bool "generalizeTypes" | throwError "Type substitution mode"
 let originalType ← kernelType term
 introduce holes generalizeTypes 0 #[] fun parameters => do
  let work ← liftM (m := IO) <| IO.mkRef 0
  let body ← rewrite term #[] routes holes parameters work
  liftM (m := IO) <| IO.println "PHASE candidate-body"
  let bodyType ← kernelType body
  let function ← mkLambdaFVars parameters body
  let functionType ← mkForallFVars parameters bodyType
  kernelAtPrefix parameters 0 function functionType
  let expected ← declaredResult functionType parameters.size declaredGoal
  kernelAtPrefix parameters 0 function expected
  conversion functionType expected
  let applied := mkAppN function (holes.map (·.term))
  kernelAs applied originalType
  conversion applied term
  kernelAs (← mkEqRefl applied) (← mkEq applied term)
  liftM (m := IO) <| IO.println "PHASE typing-and-recovery-passed"
  let mut expressions := #[function,functionType,expected,term,originalType,declaredGoal]
  let mut components : Array Json := #[]
  for (name,i) in [("function.term",0),("function.inferredType",1),("function.declaredGoalType",2),
      ("source.term",3),("source.inferredType",4),("source.declaredType",5)] do
   components := components.push (obj [("component",str name),("ordinal",nat i),("scope",scope "closed" 0)])
  let mut holeInfo : Array Json := #[]
  for i in [:holes.size] do
   let h := holes[i]!
   let .ok decoded := AtlasPacketReplay.decode h.originalType | throwError "Original hole type decode"
   let .ok typeRoots := h.originalType.getObjValAs? (Array Nat) "roots" | throwError "Original hole type roots"
   unless typeRoots.size==1 do throwError "Original hole type arity"
   let ordinal := expressions.size
   expressions := expressions ++ #[h.term,h.type,decoded[typeRoots[0]!]!]
   for (name,offset,kind,length) in [("closedTerm",0,"closed",0),("closedType",1,"closed",0),
       ("originalType",2,"source-prefix",h.context.size)] do
    components := components.push (obj [("component",str ("hole."++toString i++"."++name)),("ordinal",nat (ordinal+offset)),("scope",scope kind length)])
   holeInfo := holeInfo.push (obj [("source",h.source),("context",toJson h.context),("letSlots",toJson h.lets)])
  for i in [:parameters.size] do
   let type := (← getFVarLocalDecl parameters[i]!).type
   let ordinal := expressions.size
   expressions := expressions.push (type.abstract (parameters.extract 0 i))
   components := components.push (obj [("component",str ("parameter."++toString i++".type")),("ordinal",nat ordinal),("scope",scope "parameter-prefix" i)])
  let graph := AtlasPacketReplay.graph expressions
  let .ok kinds := graph.getObjValAs? (Array Nat) "kind" | throwError "Joint graph"
  unless kinds.size<=131072 do throwError "Joint graph row bound"
  liftM (m := IO) <| IO.println "PHASE shared-graph-exported"
  return obj [("id",← fieldM request "id"),("status",str "PASS"),("namespace",str "source-frontier-function"),
   ("storage",str "joint-scoped-components/1"),("graph",graph),("components",toJson components),("holes",toJson holeInfo),("context",toJson context),
   ("functionText",str (← prettyType function)),("typeText",str (← prettyType functionType)),
   ("functionTyping",str "PASS"),("declaredGoalFunctionTyping",str "PASS"),("declaredGoalTypeConversion",str "PASS"),
   ("sourceInstantiationTyping",str "PASS"),("sourceInstantiationConversion",str "PASS"),("sourceEqualityWitness",str "PASS"),
   ("literalHoleReopening",str "PASS"),("literalParameterTypeRecovery",str "PASS"),("work",nat (← liftM (m := IO) work.get))]
end AtlasJointFrontier
