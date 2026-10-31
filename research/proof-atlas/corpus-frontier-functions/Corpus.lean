/- Replay real compiled packets with the preceding, unchanged frontier rule. -/
namespace AtlasCorpusFrontier
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes AtlasResultClosures AtlasFrontierFunctions
syntax "#atlas_corpus_frontier " str " => " str : command
elab_rules : command
 | `(#atlas_corpus_frontier $input:str => $output:str) => do
  let request ← readJson input.getString
  let packet ← readJson (← string request "packetFile")
  let .ok (source,roots) := AtlasPacketReplay.exact packet | throwError "Exact corpus frontier packet"
  unless roots.size==2 do throwError "Closed corpus roots"
  let sourceInfo ← field request "source"
  let name ← string sourceInfo "name"
  let moduleName ← string sourceInfo "module"
  let isRiccati := name=="JacobiData.slope_bound_abs"
  let declarationImported := ((← getEnv).find? name.toName).isSome
  let moduleImported := (← getEnv).header.moduleNames.any (·.toString==moduleName)
  let privateImported := (← getEnv).header.moduleNames.any (·.toString.startsWith "SE2Conjugate.")
  unless declarationImported==isRiccati && moduleImported==isRiccati && privateImported==isRiccati do throwError "Corpus original/private import boundary"
  liftTermElabM fun _ => do
   checkDomain source[roots[0]!]!
   kernelAs source[roots[1]!]! source[roots[0]!]!
   if isRiccati then
    let info ← getConstInfo name.toName
    structural info.type source[roots[0]!]! "Riccati original type"
    let some value := info.value? true | throwError "Riccati original body absent"
    structural value source[roots[1]!]! "Riccati original complete body"
  let (_,start) := intern source[roots[0]!]! {}
  let (_,shared) := intern source[roots[1]!]! start
  let .ok cases := (← field request "cases").getArr? | throwError "Corpus cases"
  unless cases.size==1 do throwError "One corpus case per native process"
  let c := cases[0]!
  unless (← field c "prefixRoute")==routeJson 1 #[] && (← field c "context")==toJson (#[] : Array Json) do throwError "Corpus closed-root scope"
  let result ← liftTermElabM fun _ => atRouteWith source[roots[1]!]! [] #[] #[] shared 1 #[] "root.value" (AtlasJointFrontier.atRoot c source source[roots[0]!]!)
  liftIO <| IO.println "PHASE case-output-json-complete"
  liftIO <| IO.FS.writeFile output.getString (obj [("format",str "ProofAtlasCorpusFrontier/1"),("source",sourceInfo),
   ("closedPacketKernelTyping",str "PASS"),("originalDeclarationImported",toJson declarationImported),
   ("originalModuleImported",toJson moduleImported),("privateRiccatiModulesImported",toJson privateImported),
   ("recompiledOriginalTypeAndBodyMatch",toJson isRiccati),("case",result)]).compress
end AtlasCorpusFrontier
