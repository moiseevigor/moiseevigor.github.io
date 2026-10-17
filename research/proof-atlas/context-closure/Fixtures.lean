/- Abstract dependency controls; none is a new source typing observation. -/
open Lean Elab Command Meta
namespace ProofAtlas.ContextClosure
set_option maxRecDepth 10000
set_option maxHeartbeats 20000000

def slots (depth mask : Nat) : List Nat := (List.range depth).filter fun i => mask / 2^i % 2 == 1

def canonical (xs : List Nat) : List Nat := xs.eraseDups.mergeSort (· ≤ ·)

def graphFixture (label : String) (domains : Array (List Nat))
    (values : Array (Option (List Nat))) (seeds : Array (List Nat)) : Except String Json := do
 let depth := domains.size
 unless values.size == depth do throw "Dependency field arity"
 let deps : Dependencies := fun j => domains[j]?.getD [] ++ ((values[j]?.getD none).getD [])
 for j in [:depth] do
  unless (deps j).all (· < j) do throw "Dependency outside pre-binder context"
 let mut rows : Array Json := #[]
 for seed in seeds do
  unless seed.all (· < depth) do throw "Seed outside recorded context"
  let retained := canonical (close deps depth seed)
  unless retained.all (· < depth) && seed.all (retained.contains ·) &&
      retained.all (fun j => (deps j).all (retained.contains ·)) do throw "Computed closure invariant"
  rows := rows.push (Json.mkObj [("seeds",toJson seed),("retained",toJson retained)])
 return Json.mkObj [("label",toJson label),("depth",toJson depth),
  ("domains",toJson domains),("values",toJson values),("rows",toJson rows),
  ("kernelTypingClaim",toJson false)]

syntax "#atlas_context_closure " str : command
elab_rules : command
 | `(#atlas_context_closure $output:str) => do
  let mut laws : Array Json := #[]
  for name in [``close_preserves,``close_minimal,``close_bounded,``close_closed,``close_idempotent,``close_union] do
   let .thmInfo info ← getConstInfo name | throwError "Expected theorem {name}"
   for e in [info.type,info.value,mkApp (mkLambda `expected .default info.type (.bvar 0)) info.value] do
    match Kernel.check (← getEnv) {} e with
    | .ok _ => pure ()
    | .error err => throwError "Closure theorem kernel check: {err.toMessageData (← getOptions)}"
   let axioms ← collectAxioms name
   unless axioms.all (fun a => a == ``propext || a == ``Quot.sound) do throwError "Unexpected assumptions {axioms}"
   let text ← liftTermElabM fun _ => do return (← ppExpr info.type).pretty
   laws := laws.push (Json.mkObj [("name",toJson name.toString),("type",toJson text),
    ("axioms",toJson (axioms.map Name.toString)),("kernelType",toJson "PASS"),
    ("kernelProof",toJson "PASS"),("kernelExpectedTypeConversion",toJson "PASS")])
  let mut cases : Array Json := #[]
  for depth in [:5] do
   for mask in [:2^(depth*(depth-1)/2)] do
    let mut domains : Array (List Nat) := #[]
    let mut values : Array (Option (List Nat)) := #[]
    for j in [:depth] do
     let ds := slots j (mask / 2^(j*(j-1)/2))
     let isLet := j % 2 == 1
     domains := domains.push (ds.filter fun k => !isLet || k % 2 == 0)
     values := values.push (if isLet then some (ds.filter fun k => k % 2 == 1) else none)
    match graphFixture (toString depth ++ ":" ++ toString mask) domains values
        ((List.range (2^depth)).map (slots depth)).toArray with
    | .ok row => cases := cases.push row
    | .error err => throwError err
  let mut extras : Array Json := #[]
  let add := fun label domains values seeds => graphFixture label domains values seeds
  let configs := [
   add "chain-512" ((List.range 512).map fun j => if j == 0 then [] else [j-1]).toArray
      (Array.replicate 512 none) #[[511]],
   add "empty-512" (Array.replicate 512 []) (Array.replicate 512 none) #[[]],
   add "disconnected-512" ((List.range 512).map List.range).toArray (Array.replicate 512 none) #[[0]],
   add "duplicates" #[[],[0,0],[],[1,1]] #[none,none,none,none] #[[3,3],[3,1],[1,3]],
   add "let-value-chain" #[[],[],[],[]] #[none,some [0],some [1],some [2]] #[[3]],
   add "dense-32" ((List.range 32).map List.range).toArray (Array.replicate 32 none) #[[31]]]
  for config in configs do
   match config with
   | .ok row => extras := extras.push row
   | .error err => throwError err
  liftIO <| IO.FS.writeFile output.getString (Json.mkObj [("format",toJson "ProofAtlasContextClosure/1"),
   ("leanVersion",toJson "4.33.1"),("theorems",toJson laws),("cases",toJson cases),
   ("extras",toJson extras)]).compress
end ProofAtlas.ContextClosure
