/- Reuse the occurrence-rule extractor on an exact public ExprDAG, with the
   original theorem and proof module absent. No original proof scripts. -/
namespace AtlasPacketTyping
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
syntax "#atlas_packet_types " str " => " str : command
elab_rules : command
 | `(#atlas_packet_types $input:str => $output:str) => do
  let request ← readJson input.getString
  let packet ← readJson (← string request "packetFile")
  let name ← string request "name"
  let sourceModule ← string request "module"
  unless ((← getEnv).find? name.toName).isNone &&
      !((← getEnv).header.moduleNames.any (·.toString == sourceModule)) do
   throwError "Original theorem or proof module is present"
  let (values,roots) ← match AtlasPacketReplay.exact packet with
   | .ok v => pure v | .error err => throwError err
  unless roots.size == 2 do throwError "Type/proof roots required"
  let exprs := roots.map (values[·]!)
  liftTermElabM fun _ => do
   AtlasPacketReplay.theoremType exprs[0]!
   kernelAs exprs[1]! exprs[0]!
  let (_,start) := intern exprs[0]! {}
  let (_,shared) := intern exprs[1]! start
  let routes ← match request.getObjValAs? (Array Json) "routes" with
   | .ok v => pure v | .error err => throwError err
  unless routes.size > 0 && routes.size <= 512 do throwError "Bounded query inventory required"
  let mut entries : Array Json := #[]
  for route in routes do
   let root ← match route.getObjValAs? Nat "root" with | .ok v => pure v | .error err => throwError err
   let slots ← match route.getObjValAs? (Array Nat) "slots" with | .ok v => pure v | .error err => throwError err
   unless root < 2 && slots.size <= 512 do throwError "Bounded route required"
   let entry ← liftTermElabM fun _ =>
    atRoute exprs[root]! slots.toList #[] #[] shared root #[] (if root == 0 then "root.type" else "root.value")
   entries := entries.push entry
  let invalidRouteRejected ← liftTermElabM fun _ => do
   try
    let _ ← atRoute exprs[1]! [2] #[] #[] shared 1 #[] "root.value"
    pure false
   catch ex => pure ((← ex.toMessageData.toString) == "Invalid occurrence route")
  unless invalidRouteRejected do throwError "Invalid route rejection control failed"
  let result := obj [("format",str "ProofAtlasOccurrenceTypes/1"),("name",str name),
   ("source",← field request "source"),("nativeDagMatchesPacket",toJson true),
   ("leanVersion",str Lean.versionString),("kernelDeclarationTyping",str "PASS"),
   ("originalTheoremAbsentFromEnvironment",toJson true),("originalModuleAbsentFromEnvironment",toJson true),
   ("invalidRouteRejected",toJson true),("entries",toJson entries)]
  liftIO <| IO.FS.writeFile output.getString result.compress
end AtlasPacketTyping
