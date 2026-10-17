open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
namespace AtlasReducedReplay
syntax "#atlas_reduced_packet " str " => " str : command
elab_rules : command
 | `(#atlas_reduced_packet $input:str => $output:str) => do
  let request ← readJson input.getString
  let packet ← readJson (← string request "packetFile")
  let name := (← string request "name").toName
  let sourceModule ← string request "module"
  unless ((← getEnv).find? name).isNone &&
      !((← getEnv).header.moduleNames.any (·.toString == sourceModule)) do
   throwError "Original theorem or module is present"
  let (values,roots) ← match AtlasPacketReplay.exact packet with
   | .ok v => pure v | .error err => throwError err
  unless roots.size == 2 do throwError "Type/proof roots required"
  let exprs := roots.map (values[·]!)
  let (_,s) := intern exprs[0]! {}
  let (_,shared) := intern exprs[1]! s
  let states ← match (← field request "states").getArr? with | .ok s => pure s | .error e => throwError e
  unless states.size > 0 && states.size <= 512 do throwError "Bounded query inventory required"
  let cache ← liftIO <| IO.mkRef (#[] : Array AtlasContextClosure.ReducedModule)
  let mut representatives : Std.HashMap Nat AtlasContextClosure.Checked := {}
  liftIO <| IO.FS.writeFile output.getString ""
  for state in states do
   let route ← field state "route"
   let root ← match route.getObjValAs? Nat "root" with | .ok n => pure n | .error e => throwError e
   let slots ← match route.getObjValAs? (Array Nat) "slots" with | .ok s => pure s | .error e => throwError e
   let id ← match state.getObjValAs? Nat "state" with | .ok n => pure n | .error e => throwError e
   unless root < 2 && slots.size <= 512 do throwError "Bounded route required"
   let result ← liftTermElabM fun _ => AtlasContextClosure.atRoute exprs[root]! slots.toList #[] #[] shared root #[] state (representatives.get? id) cache
   unless (← string result.entry "status") == "checked" do throwError "Context check failed"
   if !representatives.contains id then representatives := representatives.insert id result
   let row := obj [("source",← field request "source"),("nativeDagMatchesPacket",toJson true),
    ("kernelDeclarationTyping",str "PASS"),("originalTheoremAbsentFromEnvironment",toJson true),
    ("originalModuleAbsentFromEnvironment",toJson true),("entry",result.entry)]
   liftIO <| IO.FS.withFile output.getString .append fun h => h.putStrLn row.compress
end AtlasReducedReplay
