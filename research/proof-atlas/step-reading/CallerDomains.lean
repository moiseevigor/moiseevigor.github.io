-- Appended to the packet decoder and occurrence-type extractor by replay-call.py.
namespace ProofAtlas.CallerDomains
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes

-- Follow the only differing child while both sides are applications.
partial def conversionSite (a b : Expr) (path : Array Nat) : MetaM Json := do
  if let .app f x := a then
    if let .app g y := b then
      if (⟨f⟩ : ExprStructEq) == ⟨g⟩ then return ← conversionSite x y (path.push 1)
      if (⟨x⟩ : ExprStructEq) == ⟨y⟩ then return ← conversionSite f g (path.push 0)
  let .ok true := Kernel.isDefEq (← getEnv) (← getLCtx) a b
    | return Json.null
  return Json.mkObj [("fields",toJson path),("kernelDefEq",toJson true)]

syntax "#caller_domains " str str str : command
elab_rules : command
 | `(#caller_domains $packetFile:str $requestFile:str $outFile:str) => do
  let packet ← IO.ofExcept <| Json.parse (← IO.FS.readFile packetFile.getString)
  let request ← IO.ofExcept <| Json.parse (← IO.FS.readFile requestFile.getString)
  let (values,roots) ← IO.ofExcept <| AtlasPacketReplay.exact packet
  let (_,shared) := (roots.map (values[·]!)).foldl (fun (_,s) e => intern e s) (0, {})
  let runOne (request : Json) : CommandElabM Json := do
    let slots ← IO.ofExcept <| request.getObjValAs? (Array Nat) "slots"
    let id ← IO.ofExcept <| request.getObjValAs? Nat "node"
    liftTermElabM <| atRouteWith values[roots[1]!]! slots.toList #[] #[] shared 1 #[] "root.value"
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
          let domainSort ← kernelType domain
          let .ok proofInput := Kernel.isDefEq (← getEnv) (← getLCtx) domainSort (.sort .zero)
            | throwError "Cannot classify argument domain"
          let (a,s) ← internScoped inferred xs compact
          let (b,s) ← internScoped domain xs s
          compact := s
          let conversion ← if a == b then pure Json.null else conversionSite domain inferred #[]
          arguments := arguments.push <| Json.mkObj [("proofInput",toJson proofInput),("conversionSite",conversion),("slot",toJson (j+1)),("node",toJson (← sourceId owner arg)),
            ("inferred",toJson (← ppExpr inferred).pretty),("expected",toJson (← ppExpr domain).pretty),
            ("inferredRoot",toJson a),("expectedRoot",toJson b),("structurallyIdentical",toJson (actual==expected))]
        let mut extra := []
        if let .const name _ := term.getAppFn then
          let mut declared := (← getConstInfo name).type
          let mut declaredCount := 0
          while let .forallE _ _ body _ := declared do
            declaredCount := declaredCount + 1
            declared := body
          if declaredCount < stages.size then
            let applied := mkAppN term.getAppFn (term.getAppArgs.extract 0 declaredCount)
            let returned ← whnf (← kernelType applied)
            kernelAs applied returned
            let originalPrefix := mkAppN original.getAppFn (original.getAppArgs.extract 0 declaredCount)
            let prefixNode ← sourceId owner originalPrefix
            extra := [("returnedFunction",Json.mkObj [("declaredBinders",toJson declaredCount),
              ("head",toJson name.toString),("node",toJson prefixNode),
              ("type",toJson (← ppExpr returned).pretty),
              ("result",toJson (← ppExpr (← kernelType term)).pretty)])]
        return Json.mkObj <| extra ++ [("call",request),("context",toJson ctx),("arguments",toJson arguments),
          ("types",graphJson compact),("kernelDomainConversions",toJson stages.size)]
  let report ← match request.getArr? with
    | .ok requests => do pure (toJson (← requests.mapM runOne))
    | .error _ => runOne request
  liftIO <| IO.FS.writeFile outFile.getString report.compress

end ProofAtlas.CallerDomains
