/- Native compiled-module comparison. Unlike packet replay, the original
   declaration and its private compiled environment are present. -/
namespace AtlasRiccatiTransport
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
syntax "#atlas_riccati_transport " str " => " str : command
elab_rules : command
 | `(#atlas_riccati_transport $input:str => $output:str) => do
  let request ← readJson input.getString
  let packet ← readJson (← string request "packetFile")
  let name ← string (← field packet "declaration") "name"
  let info ← getConstInfo name.toName
  let some value := info.value? true | throwError "No compiled body"
  let env ← getEnv
  let some moduleIdx := env.getModuleIdxFor? info.name | throwError "Declaration has no imported owner"
  let owner := env.header.moduleNames[moduleIdx.toNat]!
  unless owner.toString == (← string (← field packet "declaration") "module") do throwError "Compiled module mismatch"
  liftTermElabM fun _ => kernelAs value info.type
  let (t,s) := intern info.type {}
  let (v,s) := intern value s
  let native := graphJson s
  for fieldName in ["kind","children","payloads","expanded","neededScope"] do
   unless (← field native fieldName) == (← field packet fieldName) do throwError "Packet changed at {fieldName}"
  unless (← field packet "roots") == toJson #[t,v] do throwError "Packet roots changed"
  let routes ← match (← field request "routes").getArr? with | .ok v => pure v | .error e => throwError e
  unless routes.size <= 64 do throwError "Query bound"
  let mut entries : Array Json := #[]
  let mut outcomes : Array Json := #[]
  for route in routes do
   let r ← match route.getObjValAs? Nat "root" with | .ok v => pure v | .error e => throwError e
   let ss ← match route.getObjValAs? (Array Nat) "slots" with | .ok v => pure v | .error e => throwError e
   unless r < 2 && ss.size <= 512 do throwError "Route bound"
   let e := if r == 0 then info.type else value
   let result ← liftTermElabM fun _ => do
    try
     pure (Except.ok (← atRouteWith e ss.toList #[] #[] s r #[] (if r == 0 then "root.type" else "root.value") AtlasEqualityTransport.observe) : Except String Json)
    catch ex => pure (.error (← ex.toMessageData.toString))
   match result with
   | .ok q =>
    entries := entries.push q
    outcomes := outcomes.push (obj [("route",route),("status",str "checked")])
   | .error reason =>
    outcomes := outcomes.push (obj [("route",route),("status",str "unavailable"),("reason",str reason)])
  let result := obj [("format",str "ProofAtlasEqualityNative/1"),("name",str name),
   ("source",← field request "source"),("leanVersion",str Lean.versionString),
   ("kernelClosedPacketTyping",str "PASS"),("packetFieldsMatchCompiledDeclaration",toJson true),
   ("originalTheoremAbsent",toJson false),("originalModuleAbsent",toJson false),
   ("privateRiccatiModulesAbsent",toJson false),("nativeDeclarationModule",str owner.toString),
   ("entries",toJson entries),("outcomes",toJson outcomes)]
  liftIO <| IO.FS.writeFile output.getString result.compress
end AtlasRiccatiTransport
