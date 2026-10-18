/- Larger table profile; original indexed-cut and lexical checkers are reused. -/
namespace ProofAtlas.SourceCut.Bridge
open Lean Elab Command
syntax "#atlas_large_source_cuts " str " => " str : command
elab_rules : command
 | `(#atlas_large_source_cuts $input:str => $output:str) => do
  let .ok request := Json.parse (← IO.FS.readFile input.getString) | throwError "Request JSON"
  let .ok packetFile := request.getObjValAs? String "packetFile" | throwError "Packet path"
  let .ok packet := Json.parse (← IO.FS.readFile packetFile) | throwError "Packet JSON"
  let .ok (values,roots) := AtlasLargePacketReplay.exact packet | throwError "Exact native source roundtrip failed"
  let .ok children := packet.getObjValAs? (Array (Array Nat)) "children" | throwError "Source children"
  let .ok records := request.getObjValAs? (Array Json) "records" | throwError "Cut records"
  unless records.size > 0 && records.size <= 4096 do throwError "Record bound"
  let mut entries := 0
  let mut bindings : Array Json := #[]
  for record in records do
   let .ok cut := decodeCut values roots children record | throwError "Indexed cut reconstruction failed"
   let .ok observed := BindingWire.check values roots children cut.1 cut.2 record | throwError "Native lexical check failed"
   bindings := bindings.push (toJson observed)
   let .ok es := record.getObjValAs? (Array Json) "entries" | throwError "Entries"
   entries := entries+es.size
  let .ok pairs := request.getObjValAs? (Array (Array Nat)) "refinements" | throwError "Refinement pairs"
  let .ok rejected := request.getObjValAs? (Array (Array Nat)) "rejectedRefinements" | throwError "Rejected pairs"
  for pair in pairs do
   unless pair.size == 2 && pair.all (· < records.size) do throwError "Refinement index"
   let .ok result := compareRecords values roots children records[pair[0]!]! records[pair[1]!]! | throwError "Refinement record decode"
   unless result do throwError "Native cut refinement rejected"
  for pair in rejected do
   unless pair.size == 2 && pair.all (· < records.size) do throwError "Counterexample index"
   let .ok result := compareRecords values roots children records[pair[0]!]! records[pair[1]!]! | throwError "Counterexample record decode"
   unless !result do throwError "Non-refinement incorrectly accepted"
  liftIO <| IO.FS.writeFile output.getString (Json.mkObj [("format",toJson "ProofAtlasNativeSourceCuts/1"),("records",toJson records.size),("entries",toJson entries),("refinements",toJson pairs.size),("rejectedRefinements",toJson rejected.size),("sourceNodes",toJson values.size),("sourceNodeLimit",toJson (262144 : Nat)),("nativeIndexedCutReconstruction",toJson true),("nativeMathematicalTyping",toJson false),("bindings",toJson bindings)]).compress
end ProofAtlas.SourceCut.Bridge
