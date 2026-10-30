/- Fresh native checks for recorded method-port types. Original declarations
   are decoded from compiled packets and remain absent from the environment. -/
namespace AtlasPortConversion
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes

def structural (a b : Expr) (label : String) : MetaM Unit := do
 unless (⟨a⟩ : ExprStructEq) == ⟨b⟩ do throwError "Recorded expression differs: {label}"

def nativeConversion (a b : Expr) : MetaM Unit := do
 match Kernel.isDefEq (← getEnv) (← getLCtx) a b with
 | .ok true => pure ()
 | _ => throwError "Port conversion rejected by kernel"

def decode (j : Json) : MetaM (Array Expr) := do
 match AtlasPacketReplay.decode j with
 | .ok xs => return xs
 | .error e => throwError e

def fieldM (j : Json) (key : String) : MetaM Json := do
 match j.getObjVal? key with | .ok v => return v | .error e => throwError e

def number (j : Json) (key : String) : MetaM Nat := do
 match j.getObjValAs? Nat key with | .ok v => return v | .error e => throwError e

def observe (query : Json) (original term : Expr) (xs : Array Expr) (context : Array Json)
    (shared : Shared) (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 let old ← fieldM query "originalQuery"
 let parent ← fieldM old "parent"
 unless (← fieldM parent "context") == toJson context do throwError "Original source context differs"
 unless (← number parent "node") == (← sourceId shared original) do throwError "Original occurrence differs"
 let _ ← kernelType term
 let some (recHead,rec,order,_,_) ← recursorAdapter term.getAppFn | throwError "Recursor adapter unavailable"
 let trace ← fieldM parent "eliminationJudgment"
 unless (← fieldM trace "recursor") == toJson rec.name.toString &&
     (← fieldM trace "argumentOrder") == toJson (order.map (·+1)) do throwError "Recursor projection differs"
 let recArgs := order.map (term.getAppArgs[·]!)
 let parentValues ← decode (← fieldM parent "typeGraph")
 let .ok branches := (← fieldM old "branches").getArr? | throwError "Branches"
 let .ok ports := (← fieldM query "ports").getArr? | throwError "Ports"
 let mut output : Array Json := #[]
 for port in ports do
  let minor ← number port "minor"
  let some branch := branches.find? (fun b => (b.getObjValAs? Nat "minor").toOption == some minor) | throwError "Minor missing"
  let m ← fieldM branch "interface"
  let inputCount ← number m "inputCount"
  let methodOffset := rec.numParams+rec.numMotives+minor
  let method := recArgs[methodOffset]!
  -- Recheck the native reduction-rule-to-minor mapping and method input count.
  let mut found := false
  for rule in rec.rules do
   let mut body := rule.rhs
   let mut binders := 0
   while body.isLambda do binders := binders+1;body := body.bindingBody!
   if let .bvar index := body.getAppFn then
    if binders-1-index == methodOffset then
     unless body.getAppArgs.size == inputCount do throwError "Kernel method input count differs"
     found := true
  unless found do throwError "Native constructor rule absent"
  let mut applied := recHead
  let mut before ← kernelType applied
  for i in [:methodOffset] do
   let .forallE _ domain _ _ ← whnf before | throwError "Recursor prefix"
   kernelAs recArgs[i]! domain
   applied := mkApp applied recArgs[i]!
   before ← kernelType applied
  let .forallE _ expectedType _ _ ← whnf before | throwError "Expected method domain"
  let actualType ← kernelType method
  let .ok arguments := (← fieldM trace "arguments").getArr? | throwError "Arguments"
  let arg := arguments[methodOffset]!
  structural expectedType ((parentValues[← number arg "expectedRoot"]!).instantiateRev xs) "expected method domain"
  structural actualType ((parentValues[← number arg "typeRoot"]!).instantiateRev xs) "actual method type"
  kernelAs method expectedType
  let methodValues ← decode (← fieldM m "graph")
  structural method ((methodValues[← number m "sourceMethodRoot"]!).instantiateRev xs) "source method"
  let result ← forallBoundedTelescope actualType (some inputCount) (fun ys _ => do
   unless ys.size == inputCount do throwError "Computed input count"
   let .ok inputs := (← fieldM m "inputs").getArr? | throwError "Computed inputs"
   let mut expectedResult := expectedType
   let mut prefixChecks : Array Json := #[]
   for i in [:ys.size] do
    let .forallE _ domain body _ ← whnf expectedResult | throwError "Expected input telescope"
    let actualDomain ← kernelType ys[i]!
    let input := inputs[i]!
    let originalDomain := (methodValues[← number input "domainRoot"]!).instantiateRev (xs++ys.extract 0 i)
    structural actualDomain originalDomain "computed input domain"
    checkDomain domain;checkDomain actualDomain
    nativeConversion domain actualDomain
    kernelAs ys[i]! domain
    prefixChecks := prefixChecks.push (obj [("ordinal",nat i),("kernelDomainConversion",str "PASS"),("termAtExpectedDomain",str "PASS")])
    expectedResult := body.instantiate1 ys[i]!
   let scope := xs++ys
   let body := mkAppN method ys
   let actualResult ← kernelType body
   let originalBody ← fieldM m "body"
   structural actualResult ((methodValues[← number originalBody "typeRoot"]!).instantiateRev scope) "computed result type"
   nativeConversion expectedResult actualResult
   let candidates ← fieldM port "candidateGraph"
   let candidateValues ← decode candidates
   let .ok roots := candidates.getObjValAs? (Array Nat) "roots" | throwError "Candidate roots"
   unless roots.size == 2 do throwError "Candidate arity"
   let left := candidateValues[roots[0]!]!.instantiateRev scope
   let right := candidateValues[roots[1]!]!.instantiateRev scope
   -- Bind the displayed forms to the independently reconstructed method types.
   let mut normalized := (ContextPrimitive.normal expectedType).run' {}
   for y in ys do
    let .forallE _ _ rest _ := normalized | throwError "Normalized expected telescope"
    normalized := rest.instantiate1 y
   structural left normalized "displayed expected normal form"
   structural right ((ContextPrimitive.normal actualResult).run' {}) "displayed computed normal form"
   checkDomain left;checkDomain right
   nativeConversion left right
   kernelAs body left
   let wrongTypeRejected ← try
    kernelAs body (mkConst ``Bool)
    pure false
   catch _ => pure true
   unless wrongTypeRejected do throwError "Wrong type negative control unexpectedly accepted"
   let abstractLeft := left.abstract scope
   let abstractRight := right.abstract scope
   unless (⟨abstractLeft.instantiateRev scope⟩ : ExprStructEq) == ⟨left⟩ &&
       (⟨abstractRight.instantiateRev scope⟩ : ExprStructEq) == ⟨right⟩ do throwError "Port context roundtrip"
   let graph := AtlasPacketReplay.graph #[abstractLeft,abstractRight]
   for key in ["kind","children","payloads","expanded","neededScope","roots"] do
    unless (← fieldM graph key) == (← fieldM candidates key) do throwError "Displayed graph roundtrip differs: {key}"
   return obj [("minor",nat minor),("originalContext",toJson context),("originalContextLength",nat xs.size),
    ("computedInputs",nat ys.size),("contextLength",nat scope.size),("prefixChecks",toJson prefixChecks),
    ("graph",graph),("expectedText",str (← prettyType left)),("computedText",str (← prettyType right)),
    ("checks",obj [("expectedIsType",str "PASS"),("computedIsType",str "PASS"),("kernelTypeConversion",str "PASS"),
     ("kernelTermAtExpectedType",str "PASS"),("exactContextRoundtrip",toJson true),("wrongTypeRejected",toJson true)])]) (whnfType:=true)
  output := output.push result
 return obj [("source",obj [("node",nat (← sourceId shared original)),("route",routeJson root slots),("path",str path)]),("ports",toJson output)]

syntax "#atlas_port_conversions " str " => " str : command
elab_rules : command
 | `(#atlas_port_conversions $input:str => $output:str) => do
  let request ← readJson input.getString
  let packet ← readJson (← string request "packetFile")
  let source ← field request "source"
  let name ← string source "name"
  let moduleName ← string source "module"
  unless ((← getEnv).find? name.toName).isNone && !((← getEnv).header.moduleNames.any (·.toString == moduleName)) do throwError "Original theorem or module imported"
  unless !((← getEnv).header.moduleNames.any (·.toString.startsWith "SE2Conjugate")) do throwError "Private research module imported"
  let .ok (values,roots) := AtlasPacketReplay.exact packet | throwError "Exact original packet decode failed"
  unless roots.size == 2 do throwError "Original roots"
  liftTermElabM fun _ => do
   checkDomain values[roots[0]!]!
   kernelAs values[roots[1]!]! values[roots[0]!]!
  let (_,start) := intern values[roots[0]!]! {}
  let (_,shared) := intern values[roots[1]!]! start
  let .ok queries := (← field request "queries").getArr? | throwError "Queries"
  let mut results : Array Json := #[]
  for query in queries do
   let original ← field query "originalQuery"
   let route ← field (← field original "parent") "route"
   let .ok root := route.getObjValAs? Nat "root" | throwError "Root"
   let .ok slots := route.getObjValAs? (Array Nat) "slots" | throwError "Slots"
   let result ← liftTermElabM fun _ => atRouteWith values[roots[root]!]! slots.toList #[] #[] shared root #[] (if root==0 then "root.type" else "root.value") (observe query)
   results := results.push result
  liftIO <| IO.FS.writeFile output.getString (obj [("status",str "PASS"),("source",source),("originalNativeOwner",← field request "originalNativeOwner"),
    ("leanVersion",str Lean.versionString),("originalTheoremAbsent",toJson true),("originalModuleAbsent",toJson true),("privateResearchModulesAbsent",toJson true),
    ("originalDeclarationKernelTyping",str "PASS"),("queries",toJson results)]).compress
end AtlasPortConversion
