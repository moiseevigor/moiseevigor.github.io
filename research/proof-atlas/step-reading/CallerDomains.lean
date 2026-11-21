-- Appended to the packet decoder and occurrence-type extractor by replay-call.py.
namespace ProofAtlas.CallerDomains
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes

syntax "#caller_domains " str str str : command
elab_rules : command
 | `(#caller_domains $packetFile:str $requestFile:str $outFile:str) => do
  let packet ← IO.ofExcept <| Json.parse (← IO.FS.readFile packetFile.getString)
  let request ← IO.ofExcept <| Json.parse (← IO.FS.readFile requestFile.getString)
  let slots ← IO.ofExcept <| request.getObjValAs? (Array Nat) "slots"
  let id ← IO.ofExcept <| request.getObjValAs? Nat "node"
  let (values,roots) ← IO.ofExcept <| AtlasPacketReplay.exact packet
  let (_,shared) := (roots.map (values[·]!)).foldl (fun (_,s) e => intern e s) (0, {})
  let report ← liftTermElabM <| atRouteWith values[roots[1]!]! slots.toList #[] #[] shared 1 #[] "root.value"
    fun original term xs ctx owner root route path => do
      unless (← sourceId owner original) == id do throwError "Wrong source occurrence"
      let (trace, _) ← applicationJudgment original term (← kernelType term) xs owner {} root route path
      let stages ← IO.ofExcept <| trace.getObjValAs? (Array Json) "stages"
      let mut arguments := #[]
      let mut compact : Shared := {}
      for (arg, stage) in original.getAppArgs.zip stages do
        let actual ← IO.ofExcept <| stage.getObjValAs? Nat "actualRoot"
        let expected ← IO.ofExcept <| stage.getObjValAs? Nat "domainRoot"
        let args := term.getAppArgs
        let j := arguments.size
        let prefixTerm := mkAppN term.getAppFn (args.extract 0 j)
        let .forallE _ domain _ _ ← whnf (← kernelType prefixTerm) | throwError "Expected function"
        let inferred ← kernelType args[j]!
        let (a,s) ← internScoped inferred xs compact
        let (b,s) ← internScoped domain xs s
        compact := s
        arguments := arguments.push <| Json.mkObj [("slot",toJson (j+1)),("node",toJson (← sourceId owner arg)),
          ("inferred",toJson (← ppExpr inferred).pretty),("expected",toJson (← ppExpr domain).pretty),
          ("inferredRoot",toJson a),("expectedRoot",toJson b),("structurallyIdentical",toJson (actual==expected))]
      return Json.mkObj [("call",request),("context",toJson ctx),("arguments",toJson arguments),
        ("types",graphJson compact),("kernelDomainConversions",toJson stages.size)]
  liftIO <| IO.FS.writeFile outFile.getString report.compress

end ProofAtlas.CallerDomains
