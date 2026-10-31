namespace AtlasRegionInputs
open Lean AtlasLibrary AtlasPacketReplay AtlasRegionKernel

def candidate (env : Environment) (source : Expr) (records : Array Json)
    (order : Array Nat) (common : Array Frame) (commonPaths : Array (Array Nat)) (policy : String) : IO Json := do
  let (prefixCtx,prefixXs) ← openContext env common
  let mut ctx := prefixCtx
  let mut bindings : Array Binding := #[]
  let mut computed : Array (Nat × Expr) := #[]
  let mut sourceResults : Array Expr := #[]
  let mut callObservations : Array Json := #[]
  let mut boundaryPositions := 0
  let mut internalPositions := 0
  let mut constraints : Array Json := #[]
  let mut constraintSteps := 0
  let mut templates : Array Json := #[]
  let mut permutations : Array Json := #[]
  let fail (status phase : String) (call slot : Nat) (extra : Json := Json.null) :=
    obj [("policy",str policy),("status",str status),("phase",str phase),
      ("call",nat call),("slot",nat slot),("detail",extra)]
  for call in order do
    let some record := records.find? (fun r => (r.getObjValAs? Nat "index").toOption == some call)
      | throw <| IO.userError "Missing ordered call"
    let (raw,frames) ← originalAt source (← field record "anchor")
    unless frames.size >= common.size do throw <| IO.userError "Common context size"
    let sourceSlots ← required <| (← field (← field record "anchor") "route").getObjValAs? (Array Nat) "slots"
    for i in [:common.size] do
      unless sourceSlots.extract 0 frames[i]!.pathDepth == commonPaths[i]! && frames[i]!.pathDepth == common[i]!.pathDepth && same frames[i]!.original common[i]!.original do
        throw <| IO.userError "Different common source context"
    let (originalCtx,originalXs) ← openContext env frames
    let actual := raw.instantiateRev originalXs
    let actualType ← typeOf env originalCtx actual
    let some sourceResult ← collapseSuffix actual originalCtx originalXs common.size
      | return fail "UNSUPPORTED_SCOPE" "result-needs-local-lambda" call 0
    unless scopeAllowed sourceResult prefixXs do return fail "UNSUPPORTED_SCOPE" "result-scope" call 0
    let ports ← arr record "ports"
    let args := raw.getAppArgs
    unless ports.size == args.size+1 && ports.size <= 65 do throw <| IO.userError "Complete application spine"
    let sourceArgs := #[raw.getAppFn] ++ args
    let mut rebuilt := raw.getAppFn.instantiateRev originalXs
    for slot in [:ports.size] do
      let port := ports[slot]!
      unless (← number port "slot") == slot do throw <| IO.userError "Port ordering"
      let (rawInput,_) ← originalAt source (← field port "input")
      unless same rawInput sourceArgs[slot]! do throw <| IO.userError "Input source occurrence"
      let original := rawInput.instantiateRev originalXs
      let originalType ← typeOf env originalCtx original
      let .sort inputSort ← typeOf env originalCtx originalType | throw <| IO.userError "Original argument sort"
      let originalRole := if inputSort == .zero then "proof" else if originalType.consumeMData.isSort then "type" else "value"
      unless originalRole == (← string port "role") do throw <| IO.userError "Original role differs from native inventory"
      let producer ← field port "knownProducer"
      let known := producer.getNat?.toOption
      let sourceProducer ← field port "producer"
      let member := records.find? fun r => match r.getObjVal? "anchor" with
        | .ok anchor => anchor == sourceProducer
        | .error _ => false
      if let some record := member then
        unless known == some (← number record "index") do throw <| IO.userError "Omitted internal source use"
      else unless !(known.any order.contains) do throw <| IO.userError "Invented internal source use"
      let internal := known.any (fun id => order.contains id)
      let mut input : Expr := original
      if internal then
        internalPositions := internalPositions+1
        let some (_,value) := computed.find? (fun p => some p.1 == known)
          | throw <| IO.userError "Producer is not earlier in topological order"
        let some producerRecord := records.find? (fun r => (r.getObjValAs? Nat "index").toOption == known)
          | throw <| IO.userError "Producer record"
        unless (← field producerRecord "anchor") == (← field port "producer") do
          throw <| IO.userError "Internal source producer endpoint"
        let (producerRaw,producerFrames) ← originalAt source (← field port "producer")
        let (producerCtx,producerXs) ← openContext env producerFrames
        let _ := producerCtx
        let producerValue := producerRaw.instantiateRev producerXs
        let .ok true := Kernel.isDefEq env originalCtx original producerValue
          | throw <| IO.userError "Original internal-use conversion"
        input := value
      else
        boundaryPositions := boundaryPositions+1
        let promote := policy == "all-boundary-positions" ||
          (originalRole == "proof" && (slot > 0 || policy == "proof-and-function-inputs"))
        if promote then
          let mut domain := originalType
          if slot > 0 then
            let callable ← typeOf env ctx rebuilt
            match callable.consumeMData with
            | .forallE _ t _ _ => domain := t
            | _ => return fail "UNSUPPORTED_TYPE_FORM" "nonliteral-callable-telescope" call slot
          let allowed := prefixXs ++ bindings.map (·.termVar)
          unless scopeAllowed domain allowed do return fail "UNSUPPORTED_SCOPE" "input-domain" call slot
          let some originalValue ← collapseSuffix original originalCtx originalXs common.size
            | return fail "UNSUPPORTED_SCOPE" "input-value-needs-local-lambda" call slot
          unless scopeAllowed originalValue prefixXs do return fail "UNSUPPORTED_SCOPE" "input-specialization" call slot
          let id : FVarId := ⟨Name.num `atlasRegionInput bindings.size⟩
          let termVar := Expr.fvar id
          ctx := ctx.mkLocalDecl id (Name.num `input bindings.size) domain .default
          bindings := bindings.push {termVar := termVar, domain := domain, value := none, originalValue := originalValue, metadata := obj [("kind",str "input"),("call",nat call),("slot",nat slot),("source",port)]}
          input := termVar
        else
          let some fixed ← collapseSuffix original originalCtx originalXs common.size
            | return fail "UNSUPPORTED_SCOPE" "fixed-value-needs-local-lambda" call slot
          input := fixed
      unless scopeAllowed input (prefixXs ++ bindings.map (·.termVar)) do
        return fail "UNSUPPORTED_SCOPE" "reconstructed-input" call slot
      if slot == 0 then rebuilt := input else rebuilt := .app rebuilt input
      match Kernel.check env ctx rebuilt with
      | .ok _ => pure ()
      | .error _ =>
        let bound := prefixXs ++ bindings.map (·.termVar)
        let actualInputType ← typeOf env ctx input
        let .app function _ := rebuilt | throw <| IO.userError "Rejected head rather than application"
        let callable ← typeOf env ctx function
        let .forallE _ expectedInputType _ _ := callable.consumeMData
          | throw <| IO.userError "Rejected application lacks literal telescope"
        let .ok false := Kernel.isDefEq env ctx actualInputType expectedInputType
          | throw <| IO.userError "Rejected input did not yield a strict non-conversion verdict"
        let state ← IO.mkRef ({context := ctx, bindings := bindings, records := constraints, steps := constraintSteps, templates := templates, permutations := permutations} : ConstraintState)
        let solverComplete ← solveWithTemplates env prefixCtx prefixXs state call slot actualInputType expectedInputType
        let solved ← state.get
        ctx := solved.context
        bindings := solved.bindings
        constraints := solved.records
        constraintSteps := solved.steps
        templates := solved.templates
        permutations := solved.permutations
        match Kernel.check env ctx rebuilt with
        | .ok _ => pure ()
        | .error _ =>
          let actualAfter ← typeOf env ctx input
          let .ok false := Kernel.isDefEq env ctx actualAfter expectedInputType
            | throw <| IO.userError "Unresolved application without strict type nonconversion"
          return obj [("policy",str policy),("status",str "KERNEL_REJECTED"),
            ("phase",str "unresolved-boundary-constraint"),("call",nat call),("slot",nat slot),
            ("kernelInputTypeNonconversion",str "PASS"),("constraintRule",str "source-lambda-order/1"),
            ("solverComplete",toJson solverComplete),("constraintRefusal",solved.refusal),
            ("constraints",toJson constraints),("constraintSteps",nat constraintSteps),
    ("templates",toJson templates),("permutations",toJson permutations),
            ("bindings",scopedBindingDirectory prefixXs bindings),("completedCalls",toJson callObservations),
            ("boundaryPositionsVisited",nat boundaryPositions),("internalPositionsVisited",nat internalPositions),
            ("detail",AtlasPacketReplay.graph #[rebuilt.abstract (prefixXs ++ bindings.map (·.termVar)),
              actualAfter.abstract (prefixXs ++ bindings.map (·.termVar)),expectedInputType.abstract (prefixXs ++ bindings.map (·.termVar))])]

    let resultType ← typeOf env ctx rebuilt
    let id : FVarId := ⟨Name.num `atlasRegionResult call⟩
    let termVar := Expr.fvar id
    let before := prefixXs ++ bindings.map (·.termVar)
    callObservations := callObservations.push <| obj [("call",nat call),
      ("source",← field record "anchor"),("originalContextLength",nat frames.size),
      ("contextBindingKeys",toJson (bindings.map bindingKey)),
      ("graph",AtlasPacketReplay.graph #[rebuilt.abstract before,resultType.abstract before]),
      ("originalType",AtlasPacketReplay.graph #[actualType.abstract originalXs])]
    ctx := ctx.mkLetDecl id (Name.num `result call) resultType rebuilt (nondep:=false)
    bindings := bindings.push {termVar := termVar, domain := resultType, value := some rebuilt, originalValue := sourceResult, metadata := obj [("kind",str "result"),("call",nat call)]}
    computed := computed.push (call,termVar)
    sourceResults := sourceResults.push sourceResult
  -- Result order is the original inventory member order, not evaluation order.
  let members ← records.mapM (fun r => number r "index")
  let results ← members.mapM fun call => do
    let some (_,value) := computed.find? (fun p => p.1 == call) | throw <| IO.userError "Result portal"
    return value
  let originalResults ← members.mapM fun call => do
    let some i := order.findIdx? (· == call) | throw <| IO.userError "Original result order"
    return sourceResults[i]!
  let (body,_) ← tuple env ctx results
  let function := closeBindings bindings body
  let functionType ← typeOf env prefixCtx function
  let originals := (bindings.filter (·.value.isNone)).map (·.originalValue)
  let instantiated := mkAppN function originals
  let (sourceTuple,sourceTupleType) ← tuple env prefixCtx originalResults
  atType env prefixCtx instantiated sourceTupleType
  let .ok true := Kernel.isDefEq env prefixCtx instantiated sourceTuple
    | throw <| IO.userError "Module specialization conversion"
  let memo ← IO.mkRef ({} : Supports)
  let rawFunction := function.abstract prefixXs
  let rawType := functionType.abstract prefixXs
  let mut kept := union (← support memo rawFunction) (← support memo rawType) |>.map (common.size-1-·)
  for j in (List.range common.size).reverse do
    if kept.contains j then
      let (_,t,v,_,_) ← domainValue common[j]!
      let mut deps ← support memo t
      if let some v := v then deps := union deps (← support memo v)
      for i in deps do
        let k := j-1-i
        if !kept.contains k then kept := kept.push k
  kept := kept.qsort (· < ·)
  let projected ← project rawFunction common.size kept
  let projectedType ← project rawType common.size kept
  let closed ← close projected common kept false
  let expected ← close projectedType common kept true
  atType env {} closed expected
  let mut restored := closed
  for j in kept do
    let (_,_,v,_,_) ← domainValue common[j]!
    if v.isNone then restored := .app restored prefixXs[j]!
  restored := mkAppN restored originals
  atType env prefixCtx restored sourceTupleType
  let .ok true := Kernel.isDefEq env prefixCtx restored sourceTuple
    | throw <| IO.userError "Projected module specialization"
  let .sort level ← typeOf env prefixCtx sourceTupleType | throw <| IO.userError "Source tuple sort"
  let equality := mkApp3 (.const ``Eq [level]) sourceTupleType restored sourceTuple
  let witness := mkApp2 (.const ``Eq.refl [level]) sourceTupleType restored
  atType env prefixCtx witness equality
  let all := (List.range common.size).toArray
  let closedWitness ← close (witness.abstract prefixXs) common all false
  let closedEquality ← close (equality.abstract prefixXs) common all true
  atType env {} closedWitness closedEquality
  for i in [:members.size] do
    let call := records[i]!
    let (raw,frames) ← originalAt source (← field call "anchor")
    let (originalCtx,originalXs) ← openContext env frames
    let original := raw.instantiateRev originalXs
    let selected := projection restored i members.size
    atType env originalCtx selected (← typeOf env originalCtx original)
    let .ok true := Kernel.isDefEq env originalCtx selected original
      | throw <| IO.userError "Original result portal recovery"
  return obj [("policy",str policy),("status",str "PASS"),("namespace",str "region-source-template-function"),("constraintRule",str "source-lambda-order/1"),
    ("members",toJson members),("order",toJson order),("originalContextLength",nat common.size),
    ("keptContextSlots",toJson kept),("boundaryPositions",nat boundaryPositions),
    ("internalPositions",nat internalPositions),("independentInputs",nat originals.size),("derivedInputs",nat constraints.size),
    ("constraints",toJson constraints),("constraintSteps",nat constraintSteps),
    ("templates",toJson templates),("permutations",toJson permutations),
    ("calls",toJson callObservations),("bindings",scopedBindingDirectory prefixXs bindings),
    ("graph",AtlasPacketReplay.graph #[rawFunction,rawType,projected,projectedType,closed,expected,
      restored.abstract prefixXs,sourceTuple.abstract prefixXs,closedWitness,closedEquality]),
    ("kernelClosedTyping",str "PASS"),("kernelSpecialization",str "PASS"),
    ("kernelEqualityWitness",str "PASS"),
    ("originalResultPortals",nat members.size)]

end AtlasRegionInputs
