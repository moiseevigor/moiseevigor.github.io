/- Construct functions over actual region input positions. Graph acyclicity is
   supplied separately; kernel rejection and unsupported scope are distinct. -/
namespace AtlasRegionInputs
open Lean AtlasLibrary AtlasPacketReplay AtlasRegionKernel

def number (j : Json) (k : String) : IO Nat := required <| j.getObjValAs? Nat k
def field (j : Json) (k : String) : IO Json := required <| j.getObjVal? k
def string (j : Json) (k : String) : IO String := required <| j.getObjValAs? String k
def arr (j : Json) (k : String) : IO (Array Json) := required <| j.getObjValAs? (Array Json) k
def same (a b : Expr) : Bool := (⟨a⟩ : ExprStructEq) == ⟨b⟩

structure Binding where
  termVar : Expr
  domain : Expr
  value : Option Expr
  originalValue : Expr
  metadata : Json
  deriving Inhabited

def scopeAllowed (e : Expr) (allowed : Array Expr) : Bool :=
  (collectFVars {} e).fvarIds.all fun id => allowed.contains (.fvar id)

def originalAt (source : Expr) (anchor : Json) : IO (Expr × Array Frame) := do
  let route ← field anchor "route"
  unless (← number route "root") == 1 do throw <| IO.userError "Proof-body source root required"
  walk source (← required <| route.getObjValAs? (Array Nat) "slots")

def anchorValid (children : Array (Array Nat)) (roots : Array Nat) (a : Json) : IO Unit := do
  let route ← field a "route"
  let root ← number route "root"
  let slots ← required <| route.getObjValAs? (Array Nat) "slots"
  unless root == 1 && slots.size <= 512 do throw <| IO.userError "Source anchor root/path"
  let mut node := roots[root]!
  for slot in slots do
    unless node < children.size && slot < children[node]!.size do throw <| IO.userError "Source anchor field"
    node := children[node]![slot]!
  unless node == (← number a "node") do throw <| IO.userError "Source anchor row"

def bindingWitness (source : Expr) (port : Json) : IO Unit := do
  let mut current ← field port "input"
  let hops ← arr port "hops"
  unless hops.size <= 16 do throw <| IO.userError "Binding path bound"
  for hop in hops do
    unless current == (← field hop "use") do throw <| IO.userError "Binding use endpoint"
    let (raw,frames) ← originalAt source current
    let .bvar index := raw | throw <| IO.userError "Binding use is not a variable"
    unless index < frames.size do throw <| IO.userError "Binding reference index"
    let position := frames.size-1-index
    let frame := frames[position]!
    let .letE _ _ value _ flag := frame.original | throw <| IO.userError "Binding owner is not a definition"
    let slots ← required <| (← field current "route").getObjValAs? (Array Nat) "slots"
    let binder ← field hop "binder"
    unless (← field binder "route") == obj [("root",nat 1),("slots",toJson (slots.extract 0 frame.pathDepth))] &&
      (← number hop "index") == index && (← number hop "position") == position &&
      (← required <| hop.getObjValAs? Bool "nondep") == flag do throw <| IO.userError "Exact original binding owner"
    let target ← field hop "value"
    unless (← field target "route") == obj [("root",nat 1),("slots",toJson ((slots.extract 0 frame.pathDepth).push 1))] do
      throw <| IO.userError "Binding value field"
    let (actual,_) ← originalAt source target
    unless same value actual do throw <| IO.userError "Binding value expression"
    current := target
  unless current == (← field port "producer") do throw <| IO.userError "Binding producer endpoint"

def closeBindings (bindings : Array Binding) (body : Expr) : Expr := Id.run do
  let mut body := body
  for i in (List.range bindings.size).reverse do
    let b := bindings[i]!
    body := body.abstract #[b.termVar]
    body := match b.value with
      | none => .lam (Name.num `input i) b.domain body .default
      | some value => .letE (Name.num `result i) b.domain value body false
  return body

def bindingDirectory (prefixXs : Array Expr) (bindings : Array Binding) : Json := Id.run do
  let mut directory : Array Json := #[]
  for i in [:bindings.size] do
    let b := bindings[i]!
    let before := prefixXs ++ (bindings.extract 0 i).map (·.termVar)
    directory := directory.push <| obj [("port",b.metadata),
      ("graph",AtlasPacketReplay.graph (#[b.domain.abstract before] ++
        (b.value.toArray.map (fun v => v.abstract before)) ++ #[b.originalValue.abstract prefixXs]))]
  return toJson directory

def collapseSuffix (e : Expr) (ctx : LocalContext) (xs : Array Expr) (keep : Nat) : IO (Option Expr) := do
  let mut result := e
  for j in (List.range xs.size).reverse do
    if j >= keep then
      let some decl := ctx.find? xs[j]!.fvarId! | throw <| IO.userError "Missing original context"
      if let some value := decl.value? true then result := result.replaceFVars #[xs[j]!] #[value]
      else if (collectFVars {} result).fvarSet.contains xs[j]!.fvarId! then return none
  return some result

def tuple (env : Environment) (ctx : LocalContext) (terms : Array Expr) : IO (Expr × Expr) := do
  unless !terms.isEmpty do throw <| IO.userError "Empty result tuple"
  let mut term := terms.back!
  let mut type ← typeOf env ctx term
  for i in (List.range (terms.size-1)).reverse do
    let a := terms[i]!
    let argType ← typeOf env ctx a
    let .sort u ← typeOf env ctx argType | throw <| IO.userError "Result sort"
    let .sort v ← typeOf env ctx type | throw <| IO.userError "Tuple sort"
    term := mkApp4 (.const ``PProd.mk [u,v]) argType type a term
    type := mkApp2 (.const ``PProd [u,v]) argType type
    atType env ctx term type
  return (term,type)

def projection (term : Expr) (index count : Nat) : Expr := Id.run do
  let mut result := term
  for _ in [:index] do result := .proj ``PProd 1 result
  if index+1 < count then result := .proj ``PProd 0 result
  return result

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
        return obj [("policy",str policy),("status",str "KERNEL_REJECTED"),
          ("phase",str "rebuilt-application"),("call",nat call),("slot",nat slot),
          ("kernelInputTypeNonconversion",str "PASS"),
          ("bindings",bindingDirectory prefixXs bindings),("completedCalls",toJson callObservations),
          ("boundaryPositionsVisited",nat boundaryPositions),("internalPositionsVisited",nat internalPositions),
          ("detail",AtlasPacketReplay.graph #[rebuilt.abstract bound,
            actualInputType.abstract bound,expectedInputType.abstract bound])]
    let resultType ← typeOf env ctx rebuilt
    let id : FVarId := ⟨Name.num `atlasRegionResult call⟩
    let termVar := Expr.fvar id
    let before := prefixXs ++ bindings.map (·.termVar)
    callObservations := callObservations.push <| obj [("call",nat call),
      ("source",← field record "anchor"),("originalContextLength",nat frames.size),
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
  return obj [("policy",str policy),("status",str "PASS"),("namespace",str "region-input-function"),
    ("members",toJson members),("order",toJson order),("originalContextLength",nat common.size),
    ("keptContextSlots",toJson kept),("boundaryPositions",nat boundaryPositions),
    ("internalPositions",nat internalPositions),("independentInputs",nat originals.size),
    ("calls",toJson callObservations),("bindings",bindingDirectory prefixXs bindings),
    ("graph",AtlasPacketReplay.graph #[rawFunction,rawType,projected,projectedType,closed,expected,
      restored.abstract prefixXs,sourceTuple.abstract prefixXs,closedWitness,closedEquality]),
    ("kernelClosedTyping",str "PASS"),("kernelSpecialization",str "PASS"),
    ("kernelEqualityWitness",str "PASS"),
    ("originalResultPortals",nat members.size)]

def run (input output : System.FilePath) : IO Unit := do
  let request ← required <| Json.parse (← IO.FS.readFile input)
  let packet ← required <| Json.parse (← IO.FS.readFile (← string request "packetFile"))
  let (values,roots) ← required <| AtlasPacketReplay.exact packet
  let source ← field request "source"
  let name ← string source "name"
  unless (← string (← field packet "declaration") "name") == name do
    throw <| IO.userError "Original declaration identity mismatch"
  let imports := if name == "JacobiData.slope_bound_abs" then
    #[`Mathlib,`Aesop,`SE2Conjugate.Riccati] else if name == "lean_workbook_plus_6206" then
    #[`Mathlib,`Aesop] else #[`Lean]
  let env ← importModules (imports.map fun module => {module,importAll:=true}) {} (trustLevel:=0) (loadExts:=false)
  if name == "JacobiData.slope_bound_abs" then
    let some original := env.find? name.toName | throw <| IO.userError "Missing Riccati support"
    let some body := original.value? true | throw <| IO.userError "Missing original body"
    unless same original.type values[roots[0]!]! && same body values[roots[1]!]! do
      throw <| IO.userError "Riccati compiled source mismatch"
  else unless (env.find? name.toName).isNone do throw <| IO.userError "Original declaration imported"
  atType env {} values[roots[1]!]! values[roots[0]!]!
  let records ← arr request "records"
  let order ← required <| request.getObjValAs? (Array Nat) "order"
  unless records.size > 0 && records.size <= 8 && order.size == records.size &&
    order.toList.eraseDups.length == order.size do throw <| IO.userError "Region bound/order"
  let ids ← records.mapM (fun r => number r "index")
  unless ids.toList.eraseDups.length == ids.size && ids.all order.contains do
    throw <| IO.userError "Exact region member/order set"
  let first ← field records[0]! "anchor"
  let (_,frames) ← originalAt values[roots[1]!]! first
  let common ← arr request "commonContext"
  unless common.size <= frames.size do throw <| IO.userError "Common prefix"
  let children ← required <| packet.getObjValAs? (Array (Array Nat)) "children"
  let commonPaths ← common.mapM fun f => required <| f.getObjValAs? (Array Nat) "slots"
  let firstSlots ← required <| (← field first "route").getObjValAs? (Array Nat) "slots"
  for i in [:common.size] do
    unless commonPaths[i]! == firstSlots.extract 0 frames[i]!.pathDepth &&
      (← number common[i]! "node") < values.size && same values[← number common[i]! "node"]! frames[i]!.original do
      throw <| IO.userError "Common original context directory"
  for record in records do
    anchorValid children roots (← field record "anchor")
    for port in (← arr record "ports") do
      anchorValid children roots (← field port "input")
      anchorValid children roots (← field port "producer")
      for hop in (← arr port "hops") do
        for key in ["use","binder","value"] do anchorValid children roots (← field hop key)
      bindingWitness values[roots[1]!]! port
  let policies ← required <| request.getObjValAs? (Array String) "policies"
  let mut cases := #[]
  for policy in policies do
    unless ["all-boundary-positions","proof-arguments","proof-and-function-inputs"].contains policy do
      throw <| IO.userError "Policy"
    cases := cases.push (← candidate env values[roots[1]!]! records order (frames.extract 0 common.size) commonPaths policy)
  IO.FS.writeFile output <| (obj [("format",str "ProofAtlasRegionInputFunctionNative/1"),
    ("source",source),("closedOriginalTyping",str "PASS"),("cases",toJson cases)]).compress
end AtlasRegionInputs

def main (args : List String) : IO Unit := do
  let [root,input,output] := args | throw <| IO.userError "Expected root/input/output"
  Lean.initSearchPath root
  AtlasRegionInputs.run input output
