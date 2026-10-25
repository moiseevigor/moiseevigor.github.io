/- Typed source-use junctions. A conversion never chooses a producer. -/
namespace AtlasConstructionPorts
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
def same (a b : Expr) : Bool := (⟨a⟩ : ExprStructEq) == ⟨b⟩
def convert (a b : Expr) : MetaM Unit := do
 match Kernel.isDefEq (← getEnv) (← getLCtx) a b with
 | .ok true => pure ()
 | _ => throwError "Port kernel conversion failed"
def natField (j : Json) (k : String) : MetaM Nat :=
 match j.getObjValAs? Nat k with | .ok v => pure v | .error e => throwError e
def route (j : Json) : MetaM (Nat × Array Nat) := do
 let r ← natField j "root"
 let ss ← match j.getObjValAs? (Array Nat) "slots" with | .ok v => pure v | .error e => throwError e
 unless r < 2 && ss.size <= 512 do throwError "Port route bound"
 return (r,ss)
def anchor (e : Expr) (shared : Shared) (r : Nat) (ss : Array Nat) : MetaM Json :=
 return obj [("node",nat (← sourceId shared e)),("route",routeJson r ss)]

/- Traverse raw syntax, retaining the same ordered source-context addresses as
   the contextual observer. This function does not invent local declarations. -/
def rawAt (exprs : Array Expr) (shared : Shared) (r : Nat) (ss : Array Nat) : MetaM (Expr × Array Json) := do
 let mut e := exprs[r]!
 let mut ancestry := #[]
 let mut context := #[]
 let mut path := if r == 0 then "root.type" else "root.value"
 for slot in ss do
  if (e.isLambda || e.isForall) && slot == 1 || e.isLet && slot == 2 then
   context := context.push (obj [("node",nat (← sourceId shared e)),("route",routeJson r ancestry),
    ("path",str path),("kind",str (if e.isLambda then "lam" else if e.isForall then "forallE" else "letE"))])
  let (field,child) ← match e,slot with
   | .app f _,0 => pure ("fn",f) | .app _ a,1 => pure ("arg",a)
   | .lam _ t _ _,0 | .forallE _ t _ _,0 => pure ("domain",t)
   | .lam _ _ b _,1 | .forallE _ _ b _,1 => pure ("body",b)
   | .letE _ t _ _ _,0 => pure ("type",t) | .letE _ _ v _ _,1 => pure ("value",v) | .letE _ _ _ b _,2 => pure ("body",b)
   | .mdata _ x,0 => pure ("expr",x) | .proj _ _ x,0 => pure ("struct",x)
   | _,_ => throwError "Invalid raw port route"
  e := child
  ancestry := ancestry.push slot
  path := path ++ "." ++ field
 return (e,context)

def observe (exprs : Array Expr) (request : Json) (original term : Expr) (xs : Array Expr)
    (context : Array Json) (shared : Shared) (r : Nat) (ss : Array Nat) (_path : String) : MetaM Json := do
 let slot ← natField request "slot"
 let args := term.getAppArgs
 unless slot > 0 && slot <= args.size && args.size <= 64 do throwError "Application input slot bound"
 let mut before ← kernelType term.getAppFn
 let mut partialTerm := term.getAppFn
 let mut domain := before
 for i in [:slot] do
  let pi ← whnf before
  let .forallE _ a _ _ := pi | throwError "No function domain at source slot"
  kernelAs partialTerm pi
  kernelAs args[i]! a
  domain := a
  partialTerm := mkApp partialTerm args[i]!
  before ← kernelType partialTerm
 let actualInput := args[slot-1]!
 let mut input := original
 let mut inputSlots := ss
 for _ in [:args.size-slot] do
  input := input.appFn!
  inputSlots := inputSlots.push 0
 input := input.appArg!
 inputSlots := inputSlots.push 1
 let inputAnchor ← anchor input shared r inputSlots
 let mut producer := input
 let mut producerSlots := inputSlots
 let mut producerContext := context
 let mut hops : Array Json := #[]
 let mut external : Json := Json.null
 let mut boundary := false
 for _ in [:16] do
  let .bvar index := producer | break
  unless index < producerContext.size do throwError "Unbound source input"
  let pos := producerContext.size-1-index
  let binder := producerContext[pos]!
  let (br,bs) ← route (← match binder.getObjVal? "route" with | .ok v => pure v | .error e => throwError e)
  let (binderExpr,_) ← rawAt exprs shared br bs
  let .letE _ _ value _ nondep := binderExpr | do
   external := binder
   break
  let nextSlots := bs.push 1
  let (next,nextContext) ← rawAt exprs shared br nextSlots
  unless same next value && nextContext == producerContext.extract 0 pos do throwError "Source let context changed"
  unless br == r do throwError "Source root changed across definition"
  hops := hops.push (obj [("use",← anchor producer shared r producerSlots),("binder",binder),
   ("value",← anchor value shared r nextSlots),("index",nat index),("position",nat pos),("nondep",toJson nondep)])
  producer := value
  producerSlots := nextSlots
  producerContext := nextContext
 if let .bvar index := producer then
  unless index < producerContext.size do throwError "Unbound final source input"
  let binder := producerContext[producerContext.size-1-index]!
  if (binder.getObjValAs? String "kind").toOption == some "letE" then boundary := true
  else external := binder
 unless producerContext.size <= context.size && producerContext == context.extract 0 producerContext.size do
  throwError "Producer context is not the original consumer ancestry"
 let producerAnchor ← anchor producer shared r producerSlots
 let expected ← match request.getObjVal? "producer" with | .ok v => pure v | .error e => throwError e
 unless expected == producerAnchor do throwError "Requested producer is not the source-use witness"
 let mut alternative : Json := Json.null
 if let .ok candidate := request.getObjVal? "alternative" then
  let (ar,ass) ← route (← match candidate.getObjVal? "route" with | .ok v => pure v | .error e => throwError e)
  let (ae,ac) ← rawAt exprs shared ar ass
  let aa ← anchor ae shared ar ass
  unless aa == candidate do throwError "Alternative anchor changed"
  let compatible := ac.size <= context.size && ac == context.extract 0 ac.size
  let mut typeConversion : Json := Json.null
  let mut termConversion : Json := Json.null
  if compatible then
   let av := ae.instantiateRev (xs.extract 0 ac.size)
   let alternativeType ← kernelType av
   typeConversion := toJson (← match Kernel.isDefEq (← getEnv) (← getLCtx) alternativeType domain with | .ok b => pure b | .error e => throwError "Alternative type check failed: {e.toMessageData (← getOptions)}")
   termConversion := toJson (← match Kernel.isDefEq (← getEnv) (← getLCtx) av actualInput with | .ok b => pure b | .error e => throwError "Alternative term check failed: {e.toMessageData (← getOptions)}")
  alternative := obj [("anchor",aa),("contextCompatible",toJson compatible),
   ("sameStoredNode",toJson ((← sourceId shared ae) == (← sourceId shared producer))),
   ("sourceWitnessMatches",toJson (aa == producerAnchor)),
   ("kernelTypeConversion",typeConversion),("kernelTermConversion",termConversion)]
 let ys := xs.extract 0 producerContext.size
 let lifted := producer.instantiateRev ys
 -- Check the producer in its own original context, then after weakening.
 let mut small ← getLCtx
 for x in xs.extract ys.size xs.size do small := small.erase x.fvarId!
 let originalType ← withLCtx' small <| kernelType lifted
 let liftedType ← kernelType lifted
 unless same originalType liftedType do throwError "Weakening changed the inferred type syntax"
 kernelAs lifted domain
 convert originalType domain
 let openTermConversion ← match Kernel.isDefEq (← getEnv) (← getLCtx) lifted actualInput with
  | .ok b => pure b | .error e => throwError "Open-term conversion probe failed: {e.toMessageData (← getOptions)}"
 -- Literal definition values, not proof irrelevance, justify the term bridge.
 if hops.isEmpty then
  unless same lifted actualInput do throwError "Direct source argument changed"
 else
  let mut atValue := actualInput
  for hop in hops do
   let pos ← natField hop "position"
   unless same atValue xs[pos]! do throwError "Source use is not the recorded local definition"
   let decl ← xs[pos]!.fvarId!.getDecl
   let some value := decl.value? (allowNondep := true) | throwError "Source binder is not a local definition"
   let binder ← match hop.getObjVal? "binder" with | .ok v => pure v | .error e => throwError e
   let (br,bs) ← route (← match binder.getObjVal? "route" with | .ok v => pure v | .error e => throwError e)
   let (raw,_) ← rawAt exprs shared br bs
   let .letE n t v b nondep := raw | throwError "Expected source binding"
   unless same value (v.instantiateRev (xs.extract 0 pos)) do throwError "Source binding value changed"
   let closed := raw.instantiateRev (xs.extract 0 pos)
   let expanded := (mkApp (.lam n t b .default) v).instantiateRev (xs.extract 0 pos)
   let type ← kernelType closed
   kernelAs expanded type
   convert closed expanded
   let _ := nondep
   atValue := value
  unless same atValue lifted do throwError "Local-definition chain changed its literal value"
 let mut graph : Shared := {}
 let mut roots : Array (String × Json) := #[]
 let mut display : Array (String × Json) := #[]
 for (label,e,scope) in #[("producerType",originalType,ys),("producerTypeInConsumer",liftedType,xs),
    ("inputType",domain,xs),("consumerType",← kernelType term,xs)] do
  let (root,next) ← internScoped e scope graph 65536
  graph := next
  roots := roots.push (label,nat root)
  display := display.push (label,str (← prettyType e))
 let head := producer.getAppFn
 let headPayload := (classify head).2
 let producerInfo := obj [("anchor",producerAnchor),("context",toJson producerContext),
  ("kind",nat (classify producer).1),("role",str (← role originalType)),
  ("headKind",nat (classify head).1),("headPayload",headPayload),
  ("arguments",nat producer.getAppNumArgs),("expanded",str (toString shared.expanded[(← sourceId shared producer)]!))]
 return obj [("format",str "ProofAtlasConstructionJunction/1"),("namespace",str "construction-composition"),
  ("consumer",obj [("anchor",← anchor original shared r ss),("context",toJson context),
   ("slot",nat slot),("arguments",nat args.size),("input",inputAnchor)]),
  ("producer",producerInfo),("alternative",alternative),("definitionHops",toJson hops),("externalBinder",external),
  ("definitionBoundary",toJson boundary),("openTermConversion",toJson openTermConversion),("roots",obj roots.toList),("graph",graphJson graph),
  ("display",obj display.toList),("checks",obj [("originalContextTyping",str "PASS"),
   ("consumerContextTyping",str "PASS"),("literalTypeWeakening",toJson true),
   ("kernelInputDomain",str "PASS"),("kernelPortTypeConversion",str "PASS"),
   ("kernelBindingAbstractionConversions",str "PASS"),("literalSourceUseWitness",toJson true)])]

syntax "#atlas_composition " str " => " str : command
elab_rules : command
 | `(#atlas_composition $input:str => $output:str) => do
  let requests ← readJson input.getString
  let cases ← match requests.getArr? with | .ok v => pure v | .error e => throwError e
  let mut records : Array Json := #[]
  for request in cases do
   let packet ← readJson (← string request "packetFile")
   let name ← string (← field packet "declaration") "name"
   let mode ← string request "mode"
   let env ← getEnv
   unless mode == "compiled" || mode == "replay" do throwError "Unknown checking mode"
   let sourceModule ← string (← field packet "declaration") "module"
   let (exprs,shared) ← if mode == "compiled" then do
    let info ← getConstInfo name.toName
    let some value := info.value? true | throwError "Missing compiled proof body"
    liftTermElabM fun _ => kernelAs value info.type
    let (t,s) := intern info.type {}
    let (v,s) := intern value s
    for f in ["kind","children","payloads","expanded","neededScope"] do
     unless (← field (graphJson s) f) == (← field packet f) do throwError "Compiled packet mismatch"
    unless (← field packet "roots") == toJson #[t,v] do throwError "Compiled root mismatch"
    pure (#[info.type,value],s)
   else do
    unless (env.find? name.toName).isNone && !(env.header.moduleNames.any (·.toString == sourceModule)) && !(env.header.moduleNames.any (·.toString.startsWith "SE2Conjugate")) do throwError "Original/private declaration imported"
    let (values,roots) ← match AtlasPacketReplay.exact packet with | .ok v => pure v | .error e => throwError e
    unless roots.size == 2 do throwError "Packet roots"
    let exprs := roots.map (values[·]!)
    liftTermElabM fun _ => kernelAs exprs[1]! exprs[0]!
    let (_,s) := intern exprs[0]! {}
    let (_,s) := intern exprs[1]! s
    pure (exprs,s)
   let inputs ← match (← field request "inputs").getArr? with | .ok v => pure v | .error e => throwError e
   unless inputs.size <= 128 do throwError "Junction inventory bound"
   let mut entries : Array Json := #[]
   let mut refusals : Array Json := #[]
   for input in inputs do
    let (r,ss) ← liftTermElabM fun _ => do route (← match input.getObjVal? "consumer" with | .ok v => pure v | .error e => throwError e)
    let result ← liftTermElabM fun _ => do
     try
      let entry ← atRouteWith exprs[r]! ss.toList #[] #[] shared r #[]
       (if r == 0 then "root.type" else "root.value") (observe exprs input)
      pure (Except.ok entry : Except String Json)
     catch e => pure (.error (← e.toMessageData.toString))
    match result with
    | .ok entry => entries := entries.push (obj [("id",← field input "id"),("junction",entry)])
    | .error reason => refusals := refusals.push (obj [("id",← field input "id"),("reason",str reason)])
   records := records.push (obj [("format",str "ProofAtlasConstructionPorts/1"),("source",← field request "source"),
    ("leanVersion",str Lean.versionString),("mode",str mode),("kernelClosedProofTyping",str "PASS"),
    ("originalDeclarationPresent",toJson (mode == "compiled")),("originalModulePresent",toJson (env.header.moduleNames.any (·.toString == sourceModule))),
    ("privateRiccatiModulesPresent",toJson (env.header.moduleNames.any (·.toString.startsWith "SE2Conjugate"))),
    ("entries",toJson entries),("refusals",toJson refusals)])
  liftIO <| IO.FS.writeFile output.getString (toJson records).compress
end AtlasConstructionPorts
