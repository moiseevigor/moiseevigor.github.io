/- Decode public packets; never import or recreate their original declaration. -/
namespace AtlasMethodReplay
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
syntax "#atlas_method_replay " str " => " str : command
elab_rules : command
 | `(#atlas_method_replay $input:str => $output:str) => do
  let request ← readJson input.getString
  let packet ← readJson (← string request "packetFile")
  let name ← string request "name"
  let sourceModule ← string request "module"
  let env ← getEnv
  unless (env.find? name.toName).isNone &&
      !(env.header.moduleNames.any (·.toString == sourceModule)) do
   throwError "Original theorem or module was imported"
  unless !(env.header.moduleNames.any (·.toString.startsWith "SE2Conjugate")) do
   throwError "Private Riccati environment was imported"
  unless (← string (← field packet "declaration") "name") == name do
   throwError "Source declaration identity mismatch"
  let (values,roots) ← match AtlasPacketReplay.exact packet with
   | .ok v => pure v | .error e => throwError e
  unless roots.size == 2 do throwError "Type/proof roots required"
  let exprs := roots.map (values[·]!)
  liftTermElabM fun _ => do
   AtlasPacketReplay.theoremType exprs[0]!
   let _ ← AtlasPacketReplay.checked exprs[1]!
   kernelAs exprs[1]! exprs[0]!
  let (_,s) := intern exprs[0]! {}
  let (_,shared) := intern exprs[1]! s
  let routes ← match request.getObjValAs? (Array Json) "routes" with
   | .ok v => pure v | .error e => throwError e
  unless routes.size > 0 && routes.size <= 64 do throwError "Query bound"
  let mut entries : Array Json := #[]
  let mut outcomes : Array Json := #[]
  for route in routes do
   let root ← match route.getObjValAs? Nat "root" with | .ok v => pure v | .error e => throwError e
   let slots ← match route.getObjValAs? (Array Nat) "slots" with | .ok v => pure v | .error e => throwError e
   unless root < 2 && slots.size <= 512 do throwError "Route bound"
   let result ← liftTermElabM fun _ => do
    try
     let entry ← atRouteWith exprs[root]! slots.toList #[] #[] shared root #[]
      (if root == 0 then "root.type" else "root.value") AtlasBranchInterfaces.observe
     pure (some entry)
    catch ex =>
     logInfo m!"Method interface withheld at {route.compress}: {ex.toMessageData}"
     pure none
   if let some entry := result then
    entries := entries.push entry
    outcomes := outcomes.push (obj [("route",route),("status",str "checked")])
   else
    outcomes := outcomes.push (obj [("route",route),("status",str "unavailable"),
     ("reason",str "Native method extraction unavailable within the supported scheme and bounds")])
  unless ((← getEnv).find? name.toName).isNone do throwError "Original theorem appeared during replay"
  let result := obj [("format",str "ProofAtlasBranchInterfaces/1"),("name",str name),
   ("source",← field request "source"),("nativeDagMatchesPacket",toJson true),
   ("leanVersion",str Lean.versionString),("nativeDeclarationModule",Json.null),
   ("nativeMainModule",str env.mainModule.toString),("kernelDeclarationTyping",str "PASS"),
   ("originalTheoremAbsentFromEnvironment",toJson true),("originalModuleAbsentFromEnvironment",toJson true),
   ("privateRiccatiModulesAbsent",toJson true),("outcomes",toJson outcomes),("entries",toJson entries)]
  liftIO <| IO.FS.writeFile output.getString result.compress
end AtlasMethodReplay
