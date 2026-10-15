import ExportOccurrenceTypes
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
namespace AtlasRecursionQueries
syntax "#atlas_recursion_queries " str " => " str : command
elab_rules : command
 | `(#atlas_recursion_queries $input:str => $output:str) => do
  let inputs ← readJson input.getString
  let cases ← match inputs.getArr? with | .ok a => pure a | .error e => throwError e
  if cases.size > 32 then throwError "Declaration discovery bound"
  let mut queries : Array Json := #[]
  for query in cases do
   let packet ← readJson (← string query "packetFile")
   let name ← string (← field packet "declaration") "name"
   let info ← getConstInfo name.toName
   let some value := info.value? true | throwError "Control declaration has no value"
   let mut paths : Array Json := #[routeJson 0 #[],routeJson 1 #[]]
   let mut keys : Std.HashSet String := ({} : Std.HashSet String).insert ("1:" ++ toString (#[] : Array Nat))
   let mut work : Array (Expr × Array Nat) := #[(value,#[])]
   let mut seen : ExprStructMap Bool := {}
   let mut offset := 0
   while offset < work.size do
    if work.size > 200000 then throwError "Discovery node bound"
    let (nodeExpr,pathSlots) := work[offset]!
    offset := offset+1
    if (seen.get? ⟨nodeExpr⟩).isSome then continue
    seen := seen.insert ⟨nodeExpr⟩ true
    if pathSlots.size > 512 then throwError "Discovery path bound"
    if nodeExpr.isLambda then
     -- The leading and branch lambda queries use the same exact occurrence API.
     let key := "1:" ++ toString pathSlots
     if !keys.contains key then
      keys := keys.insert key; paths := paths.push (routeJson 1 pathSlots)
    if nodeExpr.isApp then
     let candidate ← liftTermElabM fun _ => do
      try recursorAdapter nodeExpr.getAppFn catch _ => pure none
     if let some (_,rec,order,_,_) := candidate then
      if nodeExpr.getAppArgs.size >= rec.getMajorIdx+1 then
       let key := "1:" ++ toString pathSlots
       if !keys.contains key then
        keys := keys.insert key; paths := paths.push (routeJson 1 pathSlots)
       -- Shared lambda IDs can occur under different contexts. Record each
       -- exact minor-prefix route required by a selected recursor representative.
       for rule in rec.rules do
        let mut rhs := rule.rhs
        let mut binders := 0
        while rhs.isLambda do binders := binders+1;rhs := rhs.bindingBody!
        let .bvar index := rhs.getAppFn | throwError "Discovery minor reference"
        let minor := binders-1-index-rec.numParams-rec.numMotives
        let sourceSlot := order[rec.numParams+rec.numMotives+minor]!
        let mut arg := nodeExpr.getAppArgs[sourceSlot]!
        let mut argPath := pathSlots ++ Array.replicate (nodeExpr.getAppArgs.size-1-sourceSlot) 0 |>.push 1
        for _ in [:rhs.getAppArgs.size] do
         if !arg.isLambda then break
         let key := "1:" ++ toString argPath
         if !keys.contains key then
          keys := keys.insert key;paths := paths.push (routeJson 1 argPath)
         arg := arg.bindingBody!;argPath := argPath.push 1
    let cs : Array Expr := match nodeExpr with
     | .app f a => #[f,a] | .lam _ t b _ | .forallE _ t b _ => #[t,b]
     | .letE _ t v b _ => #[t,v,b] | .mdata _ e => #[e] | .proj _ _ e => #[e] | _ => #[]
    for j in [:cs.size] do work := work.push (cs[j]!,pathSlots.push j)
   if paths.size > 512 then throwError "Discovery query bound"
   queries := queries.push (obj [("packetFile",← field query "packetFile"),("source",← field query "source"),("routes",toJson paths)])
  liftIO <| IO.FS.writeFile output.getString (toJson queries).compress
end AtlasRecursionQueries
