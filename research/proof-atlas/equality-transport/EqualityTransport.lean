/- A separate typed transport rule. No branch-method or source-lambda inference. -/
namespace AtlasEqualityTransport
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes

def same (a b : Expr) : Bool := (⟨a⟩ : ExprStructEq) == ⟨b⟩
def convert (a b : Expr) : MetaM Unit := do
 match Kernel.isDefEq (← getEnv) (← getLCtx) a b with
 | .ok true => pure ()
 | _ => throwError "Kernel transport conversion failed"

/- Only literal definition unfolding and beta substitution. Stop at the actual
   Eq.rec declaration; do not reduce its equality proof or unfold theorems. -/
def project (term : Expr) : MetaM (Expr × Array Name) := do
 let mut term := term
 let mut unfolded := #[]
 for _ in [:8] do
  let .const name levels := term.getAppFn | throwError "Transport head is not constant"
  if name == ``Eq.rec then
   let rec ← getConstInfoRec name
   unless rec.all == [``Eq] && rec.numParams == 2 && rec.numIndices == 1 &&
      rec.numMotives == 1 && rec.numMinors == 1 && rec.rules.length == 1 &&
      rec.rules[0]!.ctor == ``Eq.refl do throwError "Unexpected kernel equality recursor"
   unless term.getAppNumArgs >= 6 do throwError "Partial equality recursor"
   return (term,unfolded)
  let .defnInfo info ← getConstInfo name | throwError "Head is not a transparent definition"
  unless info.levelParams.length == levels.length do throwError "Universe arity mismatch"
  term := (info.value.instantiateLevelParams info.levelParams levels).beta term.getAppArgs
  unfolded := unfolded.push name
 throwError "Definition unfolding bound exceeded"

def anchor (source : Expr) (shared : Shared) (root : Nat) (slots : Array Nat) : MetaM Json :=
 return obj [("node",nat (← sourceId shared source)),("route",routeJson root slots)]

def observe (original term : Expr) (xs : Array Expr) (context : Array Json)
    (shared : Shared) (root : Nat) (slots : Array Nat) (_path : String) : MetaM Json := do
 let (projected,unfolded) ← project term
 let args := projected.getAppArgs
 let sourceArgs := term.getAppArgs
 let trailing := args.size - 6
 unless trailing <= sourceArgs.size do throwError "Transport suffix exceeds source arity"
 let coreArity := sourceArgs.size - trailing
 unless coreArity > 0 && coreArity <= 32 do throwError "Source argument bound"
 for i in [:trailing] do
  unless same args[6+i]! sourceArgs[coreArity+i]! do throwError "Trailing argument was changed"
 let sourceHead := term.getAppFn
 let sourceHeadType ← kernelType sourceHead
 let sourceCore := mkAppN sourceHead (sourceArgs.extract 0 coreArity)
 let core := mkAppN projected.getAppFn (args.extract 0 6)
 kernelAs core (← kernelType sourceCore)
 convert core sourceCore
 let (template,valueSlot,equalitySlot,reversed) ← forallBoundedTelescope sourceHeadType (some coreArity) fun ys _ => do
  unless ys.size == coreArity do throwError "Source head telescope is partial"
  let (generic,steps) ← project (mkAppN sourceHead ys)
  unless steps == unfolded && generic.getAppNumArgs == 6 do throwError "Wrapper template arity changed"
  let abstract := generic.abstract ys
  let ga := abstract.getAppArgs
  let forwarded (e : Expr) : MetaM Nat := do
   let .bvar index := e | throwError "Value/equality argument is computed, not directly forwarded"
   unless index < coreArity do throwError "Forwarding index outside template"
   return coreArity-index
  let v ← forwarded ga[3]!
  let (h,reversed) ← if ga[5]!.isBVar then pure (← forwarded ga[5]!,false) else do
   let h := ga[5]!
   let .const name _ := h.getAppFn | throwError "Unsupported computed equality witness"
   let ha := h.getAppArgs
   unless name == ``Eq.symm && ha.size == 4 && same ha[0]! ga[0]! &&
     same ha[1]! ga[4]! && same ha[2]! ga[1]! do
    throwError "Computed equality is not literal reversed transport"
   pure (← forwarded ha[3]!,true)
  let template ← mkLambdaFVars ys generic (etaReduce := false)
  kernelAs template sourceHeadType
  convert template sourceHead
  unless same (template.beta (sourceArgs.extract 0 coreArity)) core do
   throwError "Wrapper instantiation is not literal"
  return (template,v,h,reversed)
 let carrier := args[0]!
 let origin := args[1]!
 let motive := args[2]!
 let value := args[3]!
 let destination := args[4]!
 let equality := args[5]!
 let carrierLevel ← getLevel carrier
 let equalityType := mkApp3 (.const ``Eq [carrierLevel]) carrier origin destination
 let originalEqualityType := if reversed then
   mkApp3 (.const ``Eq [carrierLevel]) carrier destination origin else equalityType
 let refl := mkApp2 (.const ``Eq.refl [carrierLevel]) carrier origin
 let fromType := mkApp2 motive origin refl
 let toType := mkApp2 motive destination equality
 kernelAs equality equalityType
 kernelAs sourceArgs[equalitySlot-1]! originalEqualityType
 kernelAs value fromType
 kernelAs core toType
 kernelAs term (← kernelType term)
 let mut computed : Shared := {}
 let mut roots : Array (String × Json) := #[]
 let mut texts : Array (String × Json) := #[]
 for (label,e) in #[("template",template),("carrier",carrier),("origin",origin),
    ("destination",destination),("motive",motive),("equalityType",equalityType),
    ("originalEqualityType",originalEqualityType),
    ("fromType",fromType),("toType",toType),("selectedType",← kernelType term)] do
  let (r,s) ← internScoped e xs computed 65536
  computed := s
  roots := roots.push (label,nat r)
  texts := texts.push (label,str (← prettyType e))
 let mut source := original
 let mut coreSlots := slots
 for _ in [:trailing] do
  source := source.appFn!
  coreSlots := coreSlots.push 0
 let argAnchor (slot : Nat) : MetaM Json := do
  let mut e := source
  let mut cursor := coreSlots
  for _ in [:coreArity-slot] do
   e := e.appFn!
   cursor := cursor.push 0
  return (← anchor e.appArg! shared root (cursor.push 1)).mergeObj (obj [("slot",nat slot)])
 let sourceHeadAnchor ← do
  let mut e := source
  let mut cursor := coreSlots
  for _ in [:coreArity] do
   e := e.appFn!
   cursor := cursor.push 0
  anchor e shared root cursor
 return obj [("format",str "ProofAtlasEqualityTransport/1"),("namespace",str "equality-transport"),
  ("status",str "checked"),("selected",← anchor original shared root slots),
  ("core",← anchor source shared root coreSlots),("sourceHead",sourceHeadAnchor),
  ("sourceArity",nat sourceArgs.size),("coreArity",nat coreArity),("trailingArguments",nat trailing),
  ("sourceValue",← argAnchor valueSlot),("sourceEquality",← argAnchor equalitySlot),
  ("equalityWitness",str (if reversed then "symmetry-of-source" else "direct-source")),
  ("sourceContext",toJson context),("ambientContextLength",nat xs.size),
  ("kernelHead",str "Eq.rec"),("kernelHeadPayload",(classify projected.getAppFn).2),
  ("unfoldedDefinitions",toJson (unfolded.map (·.toString))),
  ("computedRoots",obj roots.toList),("display",obj texts.toList),("graph",graphJson computed),
  ("checks",obj [("kernelContextualTyping",str "PASS"),("kernelTemplateTyping",str "PASS"),
   ("kernelTemplateConversion",str "PASS"),("literalTemplateInstantiation",toJson true),
   ("literalTrailingArguments",toJson true),("kernelEqualityTyping",str "PASS"),
   ("kernelValueTyping",str "PASS"),("kernelResultTyping",str "PASS"),
   ("kernelCoreConversion",str "PASS")]),("sourceOccurrenceInvented",toJson false)]

syntax "#atlas_equality_replay " str " => " str : command
elab_rules : command
 | `(#atlas_equality_replay $input:str => $output:str) => do
  let requests ← readJson input.getString
  let cases ← match requests.getArr? with | .ok v => pure v | .error e => throwError e
  let mut results : Array Json := #[]
  for request in cases do
   let packet ← readJson (← string request "packetFile")
   let name ← string (← field packet "declaration") "name"
   let sourceModule ← string (← field packet "declaration") "module"
   let env ← getEnv
   unless (env.find? name.toName).isNone &&
       !(env.header.moduleNames.any (·.toString == sourceModule)) &&
       !(env.header.moduleNames.any (·.toString.startsWith "SE2Conjugate")) do
    throwError "Source theorem/module or private Riccati environment imported"
   let (values,roots) ← match AtlasPacketReplay.exact packet with
    | .ok v => pure v | .error e => throwError e
   unless roots.size == 2 do throwError "Type/proof roots required"
   let exprs := roots.map (values[·]!)
   liftTermElabM fun _ => do
    let _ ← kernelType exprs[0]!
    kernelAs exprs[1]! exprs[0]!
   let (_,s) := intern exprs[0]! {}
   let (_,shared) := intern exprs[1]! s
   let routes ← match (← field request "routes").getArr? with | .ok v => pure v | .error e => throwError e
   unless routes.size <= 64 do throwError "Query bound"
   let mut entries : Array Json := #[]
   let mut outcomes : Array Json := #[]
   for route in routes do
    let r ← match route.getObjValAs? Nat "root" with | .ok v => pure v | .error e => throwError e
    let ss ← match route.getObjValAs? (Array Nat) "slots" with | .ok v => pure v | .error e => throwError e
    unless r < 2 && ss.size <= 512 do throwError "Route bound"
    let result ← liftTermElabM fun _ => do
     try
      let v ← atRouteWith exprs[r]! ss.toList #[] #[] shared r #[] (if r == 0 then "root.type" else "root.value") observe
      pure (Except.ok v : Except String Json)
     catch ex => pure (.error (← ex.toMessageData.toString))
    match result with
    | .ok v =>
     entries := entries.push v
     outcomes := outcomes.push (obj [("route",route),("status",str "checked")])
    | .error reason =>
     outcomes := outcomes.push (obj [("route",route),("status",str "unavailable"),("reason",str reason)])
   results := results.push (obj [("format",str "ProofAtlasEqualityReplay/1"),("name",str name),
    ("source",← field request "source"),("leanVersion",str Lean.versionString),
    ("kernelClosedPacketTyping",str "PASS"),("originalTheoremAbsent",toJson true),
    ("originalModuleAbsent",toJson true),("privateRiccatiModulesAbsent",toJson true),
    ("entries",toJson entries),("outcomes",toJson outcomes)])
  liftIO <| IO.FS.writeFile output.getString (toJson results).compress
end AtlasEqualityTransport
