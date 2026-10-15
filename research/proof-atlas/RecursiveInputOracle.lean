/- Independent checks on native Expr values, before DAG serialization.
   Only these small branch bodies are traversed by occurrence; expansion is capped. -/
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
namespace AtlasRecursiveOracle
partial def references (e : Expr) (target depth fuel : Nat) : Except String (Nat × Nat) := do
 if fuel == 0 then throw "Native reference-count budget"
 let mut remaining := fuel-1
 let mut total := 0
 if let .bvar i := e then total := if i == target+depth then 1 else 0
 let cs : Array (Expr × Nat) := match e with
  | .app f a => #[(f,depth),(a,depth)]
  | .lam _ t b _ | .forallE _ t b _ => #[(t,depth),(b,depth+1)]
  | .letE _ t v b _ => #[(t,depth),(v,depth),(b,depth+1)]
  | .mdata _ b | .proj _ _ b => #[(b,depth)] | _ => #[]
 for (c,d) in cs do
  let (n,left) ← references c target d remaining
  total := total+n;remaining := left
 return (total,remaining)
def child (e : Expr) (slot : Nat) : CommandElabM Expr := do
 let cs : Array Expr := match e with
  | .app f a => #[f,a] | .lam _ t b _ | .forallE _ t b _ => #[t,b]
  | .letE _ t v b _ => #[t,v,b] | .mdata _ b | .proj _ _ b => #[b] | _ => #[]
 if slot >= cs.size then throwError "Native oracle route"
 return cs[slot]!
def classify (recHead : Expr) (rec : RecursorVal) (fields : Nat) (arg : Expr) : Json := Id.run do
 let base := rec.numParams+rec.numMotives+rec.numMinors
 if let .bvar i := arg then
  if i < fields then return obj [("kind",str "constructor-field"),("field",nat (fields-1-i))]
 let mut body := arg
 let mut depth := 0
 while body.isLambda do
  depth := depth+1;body := body.bindingBody!
  if depth > 64 then return obj [("kind",str "unclassified")]
 let args := body.getAppArgs
 if (⟨body.getAppFn⟩ : ExprStructEq) != ⟨recHead⟩ || args.size != rec.getMajorIdx+1 then
  return obj [("kind",str "unclassified")]
 for j in [:base] do
  if args[j]! != Expr.bvar (base+fields+depth-1-j) then return obj [("kind",str "unclassified")]
 let major := args[rec.getMajorIdx]!
 let .bvar i := major.getAppFn | return obj [("kind",str "unclassified")]
 if i < depth || i >= depth+fields || major.getAppArgs.size != depth then return obj [("kind",str "unclassified")]
 for j in [:depth] do
  if major.getAppArgs[j]! != Expr.bvar (depth-1-j) then return obj [("kind",str "unclassified")]
 return obj [("kind",str "recursive-premise"),("field",nat (fields-1-(i-depth))),("familyArity",nat depth)]
syntax "#atlas_recursive_oracle " str " => " str : command
elab_rules : command
 | `(#atlas_recursive_oracle $input:str => $output:str) => do
  let cases ← match (← readJson input.getString).getArr? with | .ok a => pure a | .error e => throwError e
  let mut rows : Array Json := #[]
  for query in cases do
   let name ← string (← field query "source") "name"
   let info ← getConstInfo name.toName
   let roots := #[info.type,(info.value? true).get!]
   let paths ← match (← field query "routes").getArr? with | .ok a => pure a | .error e => throwError e
   for route in paths do
    let root ← match route.getObjValAs? Nat "root" with | .ok n => pure n | .error e => throwError e
    let slots ← match route.getObjValAs? (Array Nat) "slots" with | .ok a => pure a | .error e => throwError e
    let mut term := roots[root]!
    for slot in slots do term ← child term slot
    if !term.isApp then continue
    let adapter ← liftTermElabM fun _ => do try recursorAdapter term.getAppFn catch _ => pure none
    let some (head,rec,order,_,_) := adapter | continue
    if term.getAppArgs.size < rec.getMajorIdx+1 then continue
    let .const _ levels := head | throwError "Oracle recursor constant"
    let args := order.map (term.getAppArgs[·]!)
    for rule in rec.rules do
     let mut rhs := rule.rhs.instantiateLevelParams rec.levelParams levels
     let mut count := 0
     while rhs.isLambda do count := count+1;rhs := rhs.bindingBody!
     let .bvar minorIndex := rhs.getAppFn | throwError "Oracle minor"
     let minor := count-1-minorIndex-rec.numParams-rec.numMotives
     let inputs := rhs.getAppArgs
     let mut branch := args[rec.numParams+rec.numMotives+minor]!
     let mut frames := 0
     while branch.isLambda && frames < inputs.size do frames := frames+1;branch := branch.bindingBody!
     let mut inputRows : Array Json := #[]
     for j in [:inputs.size] do
      let use ← if frames == inputs.size then
       match references branch (inputs.size-1-j) 0 100000 with
       | .ok (n,_) => pure (str (toString n))
       | .error e => throwError e
      else pure Json.null
      inputRows := inputRows.push (obj [("slot",nat (j+1)),("role",classify head rec rule.nfields inputs[j]!), ("sourceBodyReferences",use)])
     rows := rows.push (obj [("name",str name),("route",route),("constructor",str rule.ctor.toString),("inputs",toJson inputRows)])
  liftIO <| IO.FS.writeFile output.getString (toJson rows).compress
end AtlasRecursiveOracle
