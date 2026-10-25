/- Compiler-checked mutual recursor family. Inserted only in the versioned fixture runtime. -/
def mutualFamily (rec : RecursorVal) (levels : List Level) : MetaM (Array (RecursorVal × List Level × Name × Nat)) := do
 if rec.all.length < 2 || rec.all.length > 8 || rec.all.length != rec.numMotives then
  throwError "Mutual family inventory outside bound"
 let base := rec.numParams+rec.numMotives+rec.numMinors
 let primaryType := rec.type.instantiateLevelParams rec.levelParams levels
 let mut family : Array (RecursorVal × List Level × Name × Nat) := #[]
 let mut motives : Array Nat := #[]
 for inductiveName in rec.all do
  let .recInfo target ← getConstInfo (mkRecName inductiveName) | throwError "Mutual kernel recursor missing"
  unless target.all == rec.all && target.numParams == rec.numParams && target.numMotives == rec.numMotives && target.numMinors == rec.numMinors do
   throwError "Mutual prefix inventory mismatch"
  let targetLevels ← target.levelParams.mapM fun p => do
   let some i := rec.levelParams.idxOf? p | throwError "Mutual universe parameter absent"
   return levels[i]!
  let targetType := target.type.instantiateLevelParams target.levelParams targetLevels
  let mut a := primaryType
  let mut b := targetType
  for _ in [:base] do
   let .forallE _ da ba _ := a | throwError "Primary prefix missing"
   let .forallE _ db bb _ := b | throwError "Mutual prefix missing"
   unless (⟨da⟩ : ExprStructEq) == ⟨db⟩ do throwError "Mutual prefix domains differ"
   a := ba;b := bb
  let mut tail := targetType
  for _ in [:target.getMajorIdx] do tail := tail.bindingBody!
  let .forallE _ major result _ := tail | throwError "Mutual major binder missing"
  unless major.getAppFn.isConstOf inductiveName do throwError "Mutual major owner differs"
  let .bvar index := result.getAppFn | throwError "Mutual result has no motive binder"
  let binder := target.getMajorIdx-index
  if binder < rec.numParams || binder >= rec.numParams+rec.numMotives then throwError "Mutual result motive range"
  let motive := binder-rec.numParams
  if motives.contains motive then throwError "Duplicate mutual result motive"
  motives := motives.push motive
  family := family.push (target,targetLevels,inductiveName,motive)
 return family

def mutualEliminationJudgment (original term type : Expr) (xs : Array Expr) (shared initial : Shared)
    (root : Nat) (slots : Array Nat) (path : String) : MetaM (Option (Json × Shared)) := do
 let some (recHead,rec,order,etaDepths,wrapper) ← recursorAdapter term.getAppFn | return none
 if rec.all.length == 1 then return (← eliminationJudgment original term type xs shared initial root slots path)
 let count := rec.getMajorIdx+1
 let args := term.getAppArgs
 if count > 128 || args.size < count then throwError "Recursor application is partial or exceeds its bound"
 if rec.numMinors > 32 || rec.rules.length > 32 then
  throwError "Recursor branch inventory exceeds the current bound"
 let recArgs := order.map (args[·]!)
 let core := mkAppN recHead recArgs
 let sourceCore := mkAppN term.getAppFn (args.extract 0 count)
 if let some value := wrapper then
  let mut body := value
  for _ in [:count] do body := body.bindingBody!
  unless (⟨value.beta (args.extract 0 count)⟩ : ExprStructEq) == ⟨body.instantiateRev (args.extract 0 count)⟩ do
   throwError "Wrapper unfolding changed its literal body"
  let template := mkAppN recHead (order.map (fun i => Expr.bvar (count-1-i)))
  unless (⟨template.instantiateRev (args.extract 0 count)⟩ : ExprStructEq) == ⟨core⟩ do
   throwError "Forwarding template/permutation structural mismatch"
 let coreType ← kernelType core
 let sourceType ← kernelType sourceCore
 kernelAs core sourceType
 match Kernel.isDefEq (← getEnv) (← getLCtx) sourceCore core with
 | .ok true => pure ()
 | _ => throwError "Recursor projection failed kernel conversion"
 let full := mkAppN core (args.extract count args.size)
 kernelAs full type
 let mut source := original
 let mut sourceSlots := slots
 let mut sourcePath := path
 for _ in [:args.size-count] do
  source := source.appFn!; sourceSlots := sourceSlots.push 0; sourcePath := sourcePath ++ ".fn"
 let sourceCoreJson := obj [("node",nat (← sourceId shared source)),("route",routeJson root sourceSlots),("path",str sourcePath)]
 let .const recName recLevels := recHead | throwError "Missing recursor constant"
 let (recTypeRoot,metadataStart) ← internScoped (rec.type.instantiateLevelParams rec.levelParams recLevels) #[] {} 16384
 let (wrapperRoot,metadataStart) ← match wrapper with
  | some value => do let (r,s) ← internScoped value #[] metadataStart 16384; pure (some r,s)
  | none => pure (none,metadataStart)
 let family ← mutualFamily rec recLevels
 let mut metadataTable := metadataStart
 let mut targets : Array Json := #[]
 for (target,targetLevels,inductiveName,motive) in family do
  let targetType := target.type.instantiateLevelParams target.levelParams targetLevels
  let targetHead := mkConst target.name targetLevels
  kernelAs targetHead targetType
  let (headRoot,s) ← internScoped targetHead #[] metadataTable 16384
  metadataTable := s
  let (typeRoot,s) ← internScoped targetType #[] metadataTable 16384
  metadataTable := s
  let .inductInfo owner ← getConstInfo inductiveName | throwError "Mutual owner is not inductiveName"
  targets := targets.push (obj [("recursor",str target.name.toString),("recursorLevels",toJson (targetLevels.map AtlasLibrary.level)),
   ("inductive",str inductiveName.toString),("motive",nat motive),("parameters",nat target.numParams),("motives",nat target.numMotives),
   ("minors",nat target.numMinors),("indices",nat target.numIndices),("majorSlot",nat (target.getMajorIdx+1)),
   ("recursorTypeRoot",nat typeRoot),("headRoot",nat headRoot),("constructors",toJson (owner.ctors.map Name.toString)),("kernelTypeCheck",str "PASS"),("prefixDomainMatch",toJson true)])
 let mut rules : Array Json := #[]
 let mut mapped : Array Nat := #[]
 for (target,targetLevels,inductiveName,_) in family do
  for rule in target.rules do
   let rhs := rule.rhs.instantiateLevelParams target.levelParams targetLevels
   let _ ← kernelType rhs
   let mut body := rhs
   let mut binders := 0
   while body.isLambda do
    binders := binders+1; body := body.bindingBody!
   if binders != rec.numParams+rec.numMotives+rec.numMinors+rule.nfields then
    throwError "Recursor reduction rule has an unsupported binder prefix"
   let .bvar index := body.getAppFn | throwError "Recursor reduction does not directly call a minor premise"
   if index >= binders then throwError "Recursor rule reference escapes its context"
   let binder := binders-1-index
   if binder < rec.numParams+rec.numMotives || binder >= rec.numParams+rec.numMotives+rec.numMinors then
    throwError "Recursor rule does not call a minor premise"
   let minor := binder-rec.numParams-rec.numMotives
   if mapped.contains minor then throwError "Several constructor rules call the same minor premise"
   if body.getAppArgs.size > 128 then throwError "Minor input inventory exceeds its bound"
   mapped := mapped.push minor
   let mut minorBinder := rhs
   for _ in [:rec.numParams+rec.numMotives+minor] do minorBinder := minorBinder.bindingBody!
   let mut minorResult := minorBinder.bindingDomain!
   for _ in [:body.getAppArgs.size] do
    let .forallE _ _ result _ := minorResult | throwError "Minor input telescope is not explicit"
    minorResult := result
   let some constructorResult := minorResult.getAppArgs.back? | throwError "Minor result has no constructor argument"
   unless constructorResult.getAppFn.isConstOf rule.ctor do throwError "Minor result constructor differs from its reduction rule"
   let .ctorInfo ctor ← getConstInfo rule.ctor | throwError "Rule constructor metadata missing"
   unless ctor.induct == inductiveName do throwError "Mutual constructor owner mismatch"
   if ctor.numFields != rule.nfields then throwError "Constructor field count differs from the recursor rule"
   let (rhsRoot,s) ← internScoped rhs #[] metadataTable 16384
   metadataTable := s
   rules := rules.push (obj [("recursor",str target.name.toString),("constructor",str rule.ctor.toString),("constructorFields",nat rule.nfields),
    ("minor",nat minor),("inputCount",nat body.getAppArgs.size),("rhsRoot",nat rhsRoot),
    ("binderCount",nat binders),("kernelRuleTyping",str "PASS")])
 if mapped.size != rec.numMinors then throwError "Some minor premises have no mapped constructor rule"
 let (coreTypeRoot,start) ← internScoped coreType xs initial 32768
 let mut types := start
 let mut before ← kernelType recHead
 let mut applied := recHead
 let mut observations : Array Json := #[]
 for j in [:count] do
  let pi ← whnf before
  let .forallE _ domain _ _ := pi | throwError "Recursor argument domain is missing"
  let arg := recArgs[j]!
  let actual ← kernelType arg
  kernelAs arg domain
  let (actualRoot,s) ← internScoped actual xs types 32768
  let (expectedRoot,s) ← internScoped domain xs s 32768
  types := s
  let sourceSlot := order[j]!
  let mut sourceArg := original
  let mut atSlots := slots
  let mut atPath := path
  for _ in [:args.size-1-sourceSlot] do
   sourceArg := sourceArg.appFn!; atSlots := atSlots.push 0; atPath := atPath ++ ".fn"
  sourceArg := sourceArg.appArg!; atSlots := atSlots.push 1; atPath := atPath ++ ".arg"
  observations := observations.push (obj [("slot",nat (j+1)),("sourceSlot",nat (sourceSlot+1)),
   ("node",nat (← sourceId shared sourceArg)),("route",routeJson root atSlots),("path",str atPath),
   ("typeRoot",nat actualRoot),("expectedRoot",nat expectedRoot),("role",str (← role actual)),
   ("typeText",str (← prettyType actual)),("expectedText",str (← prettyType domain)),("kernelDomainConversion",str "PASS")])
  applied := mkApp applied arg
  before ← kernelType applied
 unless (⟨before⟩ : ExprStructEq) == ⟨coreType⟩ do throwError "Recursor trace has a changed result type"
 let .const sourceName sourceLevels := term.getAppFn | throwError "Missing source head"
 return some (obj [("format",str "ProofAtlasElimination/2"),("status",str "checked"),
  ("projection",str (if wrapper.isSome then "structural-eta-permutation-wrapper/1" else "direct-kernel-recursor/1")),
  ("sourceHead",str sourceName.toString),("sourceLevels",toJson (sourceLevels.map AtlasLibrary.level)),
  ("recursor",str recName.toString),("recursorLevels",toJson (recLevels.map AtlasLibrary.level)),
  ("inductives",toJson (rec.all.map Name.toString)),("parameters",nat rec.numParams),("indices",nat rec.numIndices),
  ("motives",nat rec.numMotives),("minors",nat rec.numMinors),("majorSlot",nat (rec.getMajorIdx+1)),
  ("argumentOrder",toJson (order.map (·+1))),("etaDepths",toJson etaDepths),("arguments",toJson observations),
  ("targets",toJson targets),("rules",toJson rules),("metadataGraph",graphJson metadataTable),("recursorTypeRoot",nat recTypeRoot),
  ("wrapperRoot",toJson wrapperRoot),("core",sourceCoreJson),("coreTypeRoot",nat coreTypeRoot),
  ("trailingArguments",nat (args.size-count)),("coreTypeText",str (← prettyType coreType)),("coreRole",str (← role coreType)),
  ("kernelCoreTyping",str "PASS"),("kernelCoreTypeConversion",str "PASS"),("kernelTermConversion",str "PASS"),
  ("wrapperStructuralMatch",toJson true),("typeAbstractionRoundtrip",toJson true),("textIsPresentation",toJson true)],types)

