/- Scoped reference multiplicity on native Expr objects, before serialization.
   Native hasLooseBVar supplies an independent absence test and prunes counts.
   A state/depth failure remains unavailable, never zero. -/
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
namespace AtlasBindingUsesOracle
structure Counts where
 memo : Std.HashMap (ExprStructEq × Nat) Nat := {}
 states : Nat := 0
partial def references (e : Expr) (target depth : Nat) : StateT Counts (Except String) Nat := do
 if !e.hasLooseBVar target then return 0
 let key := (⟨e⟩,target)
 if let some n := (← get).memo[key]? then return n
 if depth > 512 || (← get).states >= 65536 then throw "Native scoped count budget"
 modify fun s => {s with states := s.states+1}
 let mut total := 0
 match e with
 | .bvar i => total := if i == target then 1 else 0
 | .app f a => total := (← references f target (depth+1)) + (← references a target (depth+1))
 | .lam _ t b _ | .forallE _ t b _ =>
  total := (← references t target (depth+1)) + (← references b (target+1) (depth+1))
 | .letE _ t v b _ =>
  total := (← references t target (depth+1)) + (← references v target (depth+1)) + (← references b (target+1) (depth+1))
 | .mdata _ b | .proj _ _ b => total := ← references b target (depth+1)
 | _ => pure ()
 modify fun s => {s with memo := s.memo.insert key total}
 return total
syntax "#atlas_binding_uses " str " => " str : command
elab_rules : command
 | `(#atlas_binding_uses $input:str => $output:str) => do
  let queries ← match (← readJson input.getString).getArr? with | .ok a => pure a | .error e => throwError e
  if queries.size > 32 then throwError "Oracle declaration bound"
  let mut results : Array Json := #[]
  for query in queries do
   let packet ← readJson (← string query "packetFile")
   let name ← string (← field packet "declaration") "name"
   let info ← getConstInfo name.toName
   let (typeRoot,initial) := intern info.type {}
   let some value := info.value? true | throwError "Missing compiled proof body"
   let (bodyRoot,shared) := intern value initial
   let native := graphJson shared
   for key in ["kind","children","payloads","expanded","neededScope"] do
    unless (← field native key) == (← field packet key) do throwError "Oracle source graph mismatch"
   unless toJson #[typeRoot,bodyRoot] == (← field packet "roots") do throwError "Oracle root mismatch"
   let mut rows : Array Json := #[]
   for (wrapped,node) in shared.seen.toList do
    let (body,kind) ← match wrapped.val with
     | .lam _ _ b _ => pure (b,"lam")
     | .forallE _ _ b _ => pure (b,"forallE")
     | .letE _ _ _ b _ => pure (b,"letE")
     | _ => continue
    let presence := body.hasLooseBVar 0
    let counted := match (references body 0 0).run {} with
     | .ok (n,s) => obj [("status",str "counted"),("occurrences",str (toString n)),("states",nat s.states)]
     | .error reason => obj [("status",str "unavailable"),("reason",str reason)]
    rows := rows.push (obj [("node",nat node),("kind",str kind),("hasReference",toJson presence),("count",counted)])
   results := results.push (obj [("name",str name),("nativeDagMatchesPacket",toJson true),
    ("source",← field query "source"),("bindings",toJson rows)])
  liftIO <| IO.FS.writeFile output.getString (toJson results).compress
end AtlasBindingUsesOracle
