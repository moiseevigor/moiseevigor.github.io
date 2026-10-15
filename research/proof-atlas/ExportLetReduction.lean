import ExportOccurrenceTypes
/- One source let is discharged. Other lets and beta redexes are retained. -/
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
namespace AtlasLetReduction
def inspectLet (original term : Expr) (xs : Array Expr) (context : Array Json) (shared : Shared)
    (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 let .letE _ sourceType sourceValue sourceBody sourceNondep := original | throwError "Source is not let"
 let .letE name declared value body nondep := term | throwError "Contextual expression is not let"
 unless sourceNondep == nondep do throwError "Changed let flag"
 checkDomain declared
 kernelAs value declared
 let type ← kernelType term
 let declaredType ← kernelType declared
 let sort ← match Kernel.whnf (← getEnv) (← getLCtx) declaredType with
  | .ok v => pure v | .error _ => throwError "Declared type sort failed"
 unless sort.isSort do throwError "Declared domain is not a type"
 let valueType ← kernelType value
 let reduced := body.instantiate1 value
 let reducedType ← kernelType reduced
 kernelAs reduced type
 match Kernel.isDefEq (← getEnv) (← getLCtx) term reduced with
 | .ok true => pure () | _ => throwError "Kernel rejected zeta conversion"
 let (typeRoot,s) ← internScoped type xs {} 32768
 let (declaredRoot,s) ← internScoped declared xs s 32768
 let (declaredTypeRoot,s) ← internScoped declaredType xs s 32768
 let (sortRoot,s) ← internScoped sort xs s 32768
 let (valueTypeRoot,s) ← internScoped valueType xs s 32768
 let (reducedTypeRoot,s) ← internScoped reducedType xs s 32768
 let (reducedRoot,reducedGraph) ← internScoped reduced xs {} 131072
 let sourceAt (e : Expr) (slot : Nat) (field : String) : MetaM (List (String × Json)) := do
  return [("node",nat (← sourceId shared e)),("route",routeJson root (slots.push slot)),("path",str (path ++ "." ++ field))]
 let binder := obj [("node",nat (← sourceId shared original)),("route",routeJson root slots),("path",str path),("kind",str "letE")]
 let typeAt ← sourceAt sourceType 0 "type"
 let valueAt ← sourceAt sourceValue 1 "value"
 let bodyAt ← sourceAt sourceBody 2 "body"
 let merge (j : List (String × Json)) (fields : List (String × Json)) := obj (j ++ fields)
 withLetDecl name declared value (nondep := nondep) fun x => do
  let openBody := body.instantiate1 x
  let bodyType ← kernelType openBody
  let substitutedType := (bodyType.abstract #[x]).instantiate1 value
  kernelAs reduced substitutedType
  let (bodyTypeRoot,s) ← internScoped bodyType (xs.push x) s 32768
  let (substitutedTypeRoot,s) ← internScoped substitutedType xs s 32768
  let trace := obj [("format",str "ProofAtlasLetReduction/1"),("status",str "checked"),("method",str "one-let-zeta/1"),
   ("binderName",str name.toString),("nondep",toJson nondep),
   ("type",merge typeAt [("expressionRoot",nat declaredRoot),("typeRoot",nat declaredTypeRoot),("sortRoot",nat sortRoot),("text",str (← prettyType declared))]),
   ("value",merge valueAt [("typeRoot",nat valueTypeRoot),("expectedRoot",nat declaredRoot),("role",str (← role valueType)),("text",str (← prettyType value)),("typeText",str (← prettyType valueType))]),
   ("body",merge bodyAt [("context",toJson (context.push binder)),("typeRoot",nat bodyTypeRoot),("role",str (← role bodyType)),("typeText",str (← prettyType bodyType))]),
   ("reducedTypeRoot",nat reducedTypeRoot),("substitutedTypeRoot",nat substitutedTypeRoot),
   ("reducedRoot",nat reducedRoot),("reducedGraph",graphJson reducedGraph),
   ("kernelDomainSort",str "PASS"),("kernelValueConversion",str "PASS"),("kernelTermConversion",str "PASS"),
   ("kernelResultTyping",str "PASS"),("kernelResultTypeConversion",str "PASS"),("kernelSubstitutedTypeConversion",str "PASS"),
   ("termAbstractionRoundtrip",toJson true),("typeAndValueBeforeBinder",toJson true),("bodyContextExtended",toJson true),
   ("textIsPresentation",toJson true),("originalText",str (← prettyType term)),("reducedText",str (← prettyType reduced))]
  return obj [("status",str "checked"),("kernelCheck",str "PASS"),("contextWellFormed",toJson true),
   ("typeAbstractionRoundtrip",toJson true),("node",nat (← sourceId shared original)),("path",str path),("route",routeJson root slots),
   ("context",toJson context),("role",str (← role type)),("typeRoot",nat typeRoot),("typeGraph",graphJson s),
   ("typeText",str (← prettyType type)),("typeTextIsPresentation",toJson true),("arguments",toJson (#[] : Array Json)),("letJudgment",trace)]
syntax "#atlas_let_reductions " str " => " str : command
elab_rules : command
 | `(#atlas_let_reductions $input:str => $output:str) => do
  let request ← readJson input.getString
  let cases ← match request.getArr? with | .ok a => pure a | .error e => throwError e
  if cases.size > 32 then throwError "Declaration bound"
  let mut results : Array Json := #[]
  for query in cases do
   let packet ← readJson (← string query "packetFile")
   let name ← string (← field packet "declaration") "name"
   let info ← getConstInfo name.toName
   let some value := info.value? true | throwError "No complete source body"
   let (t,s) := intern info.type {}
   let (v,s) := intern value s
   let roots := #[t,v]
   let exprs := #[info.type,value]
   let rootPaths := #["root.type","root.value"]
   for key in ["kind","children","payloads","expanded","neededScope"] do
    unless (← field (graphJson s) key) == (← field packet key) do throwError "Native/published DAG mismatch: {name} {key}"
   unless toJson roots == (← field packet "roots") && toJson rootPaths == (← field (← field packet "declaration") "rootPaths") do throwError "Root mismatch"
   let paths ← match (← field query "routes").getArr? with | .ok a => pure a | .error e => throwError e
   if paths.size > 512 then throwError "Occurrence query bound"
   let mut entries : Array Json := #[]
   for route in paths do
    let root ← match route.getObjValAs? Nat "root" with | .ok n => pure n | .error e => throwError e
    let slots ← match route.getObjValAs? (Array Nat) "slots" with | .ok n => pure n | .error e => throwError e
    if root >= 2 || slots.size > 512 then throwError "Invalid/bounded route"
    let result ← liftTermElabM fun _ => do
     try atRouteWith exprs[root]! slots.toList #[] #[] s root #[] rootPaths[root]! inspectLet
     catch ex =>
      logInfo m!"Let reduction unavailable: {ex.toMessageData}"
      pure (obj [("status",str "unavailable"),("route",routeJson root slots),("reason",str "Let reduction exceeded a bound or failed native checks")])
    entries := entries.push result
   results := results.push (obj [("format",str "ProofAtlasOccurrenceTypes/1"),("name",str name),
    ("source",← field query "source"),("nativeDagMatchesPacket",toJson true),("leanVersion",str Lean.versionString),("entries",toJson entries)])
  liftIO <| IO.FS.writeFile output.getString (toJson results).compress
end AtlasLetReduction
