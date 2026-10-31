/- A source-table cache uses exact row identifiers and local binder depth.
   Row identifiers are scoped to one immutable table and one operation. -/
namespace AtlasExprReferenceNodes
open Lean AtlasExprReference
structure Source where
 nodes : Array Expr
 children : Array (Array Nat)
 scopes : Array Nat
 roots : Array Nat

structure Cache where
 cells : Array (IO.Ref (Array (Nat × Expr)))
 states : IO.Ref Nat
 visits : IO.Ref Nat

@[noinline] def find (cache : Cache) (node depth : Nat) : IO (Option Expr) := do
 let some cell := cache.cells[node]? | throw <| IO.userError "Source-table cache address"
 let row ← cell.get
 return row.findSome? fun (d,e) => if d==depth then some e else none

@[noinline] def insert (cache : Cache) (node depth : Nat) (value : Expr) : IO Unit := do
 let count ← cache.states.get
 unless count<262144 do throw <| IO.userError "Source-table rewrite state bound"
 let some cell := cache.cells[node]? | throw <| IO.userError "Source-table cache address"
 let row ← cell.swap #[]
 cell.set (row.push (depth,value))
 cache.states.set (count+1)

def resolved (source : Source) (cache : Cache) (node depth : Nat) : IO Expr := do
 if source.scopes[node]!<=depth then return source.nodes[node]!
 let some e ← find cache node depth | throw <| IO.userError "Unfinished source-table dependency"
 return e

structure Result where
 value : Expr
 states : Nat
 visits : Nat
 peakPending : Nat

def Result.stats (r : Result) : Json := Json.mkObj [
 ("states",toJson r.states),("visits",toJson r.visits),("peakPending",toJson r.peakPending)]

/- An explicit postorder work stack avoids retaining one interpreted monadic
   call chain per constructor. Cache identity remains (source row, local depth). -/
def run (source : Source) (root depth : Nat) (mapVariable : Nat → Nat → Expr) : IO Result := do
 let cells ← source.nodes.mapM fun _ => IO.mkRef (#[] : Array (Nat × Expr))
 let states ← IO.mkRef (0 : Nat)
 let visits ← IO.mkRef (0 : Nat)
 let cache : Cache := {cells,states,visits}
 let mut work : Array (Nat × Nat × Bool) := #[(root,depth,false)]
 let mut peakPending := 1
 while !work.isEmpty do
  let (node,d,finish) := work.back!
  work := work.pop
  unless node<source.nodes.size && d<=512 do throw <| IO.userError "Source-table rewrite address/depth"
  let visited ← visits.get
  visits.set (visited+1)
  unless visited<1048577 do throw <| IO.userError "Source-table visit bound"
  if source.scopes[node]!<=d then continue
  if (← find cache node d).isSome then continue
  let e := source.nodes[node]!
  let cs := source.children[node]!
  if !finish then
   work := work.push (node,d,true)
   for slot in (List.range cs.size).reverse do
    let binding := match e with
     | .lam .. | .forallE .. => slot==1
     | .letE .. => slot==2
     | _ => false
    work := work.push (cs[slot]!,d+(if binding then 1 else 0),false)
   unless work.size<=4096 do throw <| IO.userError "Source-table pending stack bound"
   peakPending := max peakPending work.size
  else
   let getChild (slot localDepth : Nat) := resolved source cache cs[slot]! localDepth
   let result : Expr ← match e with
    | .bvar i => pure (mapVariable i d)
    | .app _ _ => pure <| e.updateApp! (← getChild 0 d) (← getChild 1 d)
    | .lam _ _ _ _ => pure <| e.updateLambdaE! (← getChild 0 d) (← getChild 1 (d+1))
    | .forallE _ _ _ _ => pure <| e.updateForallE! (← getChild 0 d) (← getChild 1 (d+1))
    | .letE _ _ _ _ flag => pure <| e.updateLet! (← getChild 0 d) (← getChild 1 d) (← getChild 2 (d+1)) flag
    | .mdata _ _ => pure <| e.updateMData! (← getChild 0 d)
    | .proj _ _ _ => pure <| e.updateProj! (← getChild 0 d)
    | _ => pure e
   insert cache node d result
 return {value := ← resolved source cache root depth, states := ← states.get, visits := ← visits.get, peakPending}

def lift (source : Source) (root amount cutoff : Nat) : IO Result :=
 run source root cutoff fun i d => .bvar (if d≤i then i+amount else i)

def swap (source : Source) (root depth : Nat) : IO Result :=
 run source root depth fun i d => .bvar (swapIndex d i)

def substitute (source : Source) (root : Nat) (value : Expr) (depth : Nat) : IO Result :=
 run source root depth fun i d => if i=d then value.liftLooseBVars 0 d else .bvar (if d<i then i-1 else i)

def decode (graph : Json) : Except String Source := do
 unless (← graph.getObjValAs? String "serialization")=="ExprDAG/1" do throw "Source-table format"
 let nodes ← AtlasPacketReplay.decode graph
 let children ← graph.getObjValAs? (Array (Array Nat)) "children"
 let scopes ← graph.getObjValAs? (Array Nat) "neededScope"
 let roots ← graph.getObjValAs? (Array Nat) "roots"
 let expanded ← graph.getObjValAs? (Array String) "expanded"
 unless expanded.size==nodes.size && roots.size>0 && roots.size<=512 do throw "Source-table count/root bounds"
 let mut counts : Array Nat := #[]
 unless scopes.size==nodes.size && scopes.all (·<=512) && roots.all (·<nodes.size) do throw "Source-table metadata bounds"
 for i in [:nodes.size] do
  let cs := children[i]!
  unless expanded[i]!.length<=4096 do throw "Source-table count digit bound"
  let some count := expanded[i]!.toNat? | throw "Source-table count integer"
  unless count==1+cs.foldl (fun n c => n+counts[c]!) 0 do throw "Exact source-table count recurrence"
  counts := counts.push count
  let expected := match nodes[i]! with
   | .bvar n => n+1
   | .lam .. | .forallE .. => max scopes[cs[0]!]! (scopes[cs[1]!]!-1)
   | .letE .. => max (max scopes[cs[0]!]! scopes[cs[1]!]!) (scopes[cs[2]!]!-1)
   | _ => cs.foldl (fun n c => max n scopes[c]!) 0
  unless scopes[i]! == expected do throw "Exact source-table scope recurrence"

 return {nodes,children,scopes,roots}
end AtlasExprReferenceNodes
