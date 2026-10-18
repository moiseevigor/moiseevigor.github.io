namespace ProofAtlas.SourceCut.Bridge
open Lean Elab Command
private def checkedRecord (values : Array Expr) (roots : Array Nat) (children : Array (Array Nat))
    (record : Json) : Except String Unit := do
 let cut ← decodeCut values roots children record
 let _ ← BindingWire.check values roots children cut.1 cut.2 record
 return ()
syntax "#atlas_source_cut_rejects " str " => " str : command
elab_rules : command
 | `(#atlas_source_cut_rejects $input:str => $output:str) => do
  let .ok request := Json.parse (← IO.FS.readFile input.getString) | throwError "Negative request JSON"
  let .ok packetFile := request.getObjValAs? String "packetFile" | throwError "Packet path"
  let .ok packet := Json.parse (← IO.FS.readFile packetFile) | throwError "Packet JSON"
  let .ok (values,roots) := AtlasPacketReplay.exact packet | throwError "Exact native source roundtrip failed"
  let .ok children := packet.getObjValAs? (Array (Array Nat)) "children" | throwError "Source children"
  let .ok positive := request.getObjVal? "positive" | throwError "Positive control"
  let .ok _ := checkedRecord values roots children positive | throwError "Positive control rejected"
  let .ok controls := request.getObjValAs? (Array Json) "controls" | throwError "Controls"
  unless controls.size > 0 && controls.size <= 64 do throwError "Control bound"
  let mut rejected : Array String := #[]
  for control in controls do
   let .ok name := control.getObjValAs? String "name" | throwError "Control name"
   let .ok record := control.getObjVal? "record" | throwError "Control record"
   match checkedRecord values roots children record with
   | .ok _ => throwError "Altered native cut accepted: {name}"
   | .error _ => rejected := rejected.push name
  liftIO <| IO.FS.writeFile output.getString (Json.mkObj [("status",toJson "PASS"),("rejected",toJson rejected)]).compress
end ProofAtlas.SourceCut.Bridge
