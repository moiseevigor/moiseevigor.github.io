/- Replay the same frozen local exchanges with the row/depth evaluator.
   Original research declarations are absent; this is structural replay. -/
namespace AtlasScopedDagCorpus
open Lean Elab Command AtlasExprReferenceBridge

syntax "#atlas_scoped_dag_replay " str " => " str : command
elab_rules : command
 | `(#atlas_scoped_dag_replay $input:str => $output:str) => do
  let requestRaw ← liftIO <| IO.FS.readFile input.getString
  let .ok request := Json.parse requestRaw | throwError "Corpus request JSON"
  let graphFile ← required <| request.getObjValAs? String "graphFile"
  let graphRaw ← liftIO <| IO.FS.readFile graphFile
  let .ok graph := Json.parse graphRaw | throwError "Corpus graph JSON"
  let source ← required <| AtlasExprReferenceNodes.decode graph
  let owner ← required <| request.getObjVal? "source"
  let sourceName ← required <| owner.getObjValAs? String "name"
  unless ((← getEnv).find? sourceName.toName).isNone do throwError "Original declaration imported"
  unless !(← getEnv).header.moduleNames.any (fun n => n.toString.startsWith "Mathlib" || n.toString.startsWith "SE2Conjugate") do throwError "Non-core replay environment"
  let queries ← required <| request.getObjValAs? (Array Json) "queries"
  unless queries.size<=128 do throwError "Corpus query bound"
  let mut observations : Array Json := #[]
  for q in queries do
   let indices ← required <| q.getObjVal? "nodes"
   let nodeId (key : String) := required <| indices.getObjValAs? Nat key
   let node (key : String) : CommandElabM Expr := do
    let i ← nodeId key
    unless i<source.nodes.size do throwError "Corpus source row"
    return source.nodes[i]!
   let beforeRoot ← required <| q.getObjValAs? Nat "beforeRoot"
   let afterRoot ← required <| q.getObjValAs? Nat "afterRoot"
   unless beforeRoot<source.roots.size && afterRoot<source.roots.size do throwError "Corpus component"
   let route ← required <| q.getObjValAs? (Array Nat) "path"
   unless route.size<=128 do throwError "Corpus route bound"
   let before ← required <| selectPath source.nodes[source.roots[beforeRoot]!]! route.toList
   let after ← required <| selectPath source.nodes[source.roots[afterRoot]!]! route.toList
   let .letE ln a v (.lam bn domain body bi) _ := before | throwError "Corpus original exchange shape"
   let .lam _ newDomain (.letE _ newA newV newBody false) _ := after | throwError "Corpus computed exchange shape"
   for (key,e) in [("before",before),("after",after),("a",a),("value",v),("domain",domain),("body",body),("newDomain",newDomain),("newA",newA),("newValue",newV),("newBody",newBody)] do
    let _ ← required <| equal (← node key) e ("Corpus exact selected "++key)
   let domainResult ← liftIO <| AtlasExprReferenceNodes.substitute source (← nodeId "domain") v 0
   let aResult ← liftIO <| AtlasExprReferenceNodes.lift source (← nodeId "a") 1 0
   let valueResult ← liftIO <| AtlasExprReferenceNodes.lift source (← nodeId "value") 1 0
   let bodyResult ← liftIO <| AtlasExprReferenceNodes.swap source (← nodeId "body") 0
   for (computed,recorded,label) in [(domainResult.value,newDomain,"domain"),(aResult.value,newA,"type"),(valueResult.value,newV,"value"),(bodyResult.value,newBody,"body")] do
    let _ ← required <| equal computed recorded ("Corpus row/depth "++label)
   let _ ← required <| equal domainResult.value (domain.instantiate1 v) "Corpus native instantiation"
   let _ ← required <| equal aResult.value (a.liftLooseBVars 0 1) "Corpus native type lift"
   let _ ← required <| equal valueResult.value (v.liftLooseBVars 0 1) "Corpus native value lift"
   let _ ← required <| equal bodyResult.value (nativeSwap body) "Corpus native body swap"
   let computed := Expr.lam bn domainResult.value (.letE ln aResult.value valueResult.value bodyResult.value false) bi
   let _ ← required <| equal computed after "Corpus complete local block"
   observations := observations.push <| Json.mkObj [("query",q),("recordedAndNative",toJson "PASS"),
    ("stats",toJson #[domainResult.stats,aResult.stats,valueResult.stats,bodyResult.stats])]
  let result := Json.mkObj [("format",toJson "ProofAtlasScopedDagCorpus/1"),("source",owner),
   ("id",← required <| request.getObjVal? "id"),("nativeInventory",← required <| request.getObjVal? "nativeInventory"),
   ("nativeCaseSha256",← required <| request.getObjVal? "nativeCaseSha256"),
   ("originalDeclarationImported",toJson false),("observations",toJson observations)]
  liftIO <| IO.FS.writeFile output.getString result.compress
end AtlasScopedDagCorpus
