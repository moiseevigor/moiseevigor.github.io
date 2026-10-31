/- Real-packet invocation of the unchanged definition and exchange primitives. -/
namespace AtlasCorpusDefinitionBoundaries
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes AtlasResultClosures AtlasBinderExchange AtlasBinderBlocks AtlasDefinitionBoundaries

partial def selectedMetadata (request : Json) (source : Array Expr)
    (raw opened : Expr) (ordinal := 0) (path : Array Nat := #[]) : MetaM (Array Json) := do
 unless ordinal<=128 do throwError "Corpus boundary spine bound"
 let .ok chosen := (← fieldM request "chosen").getArr?.bind (·.mapM (·.getNat?)) | throwError "Corpus choices"
 match raw,opened with
 | .lam n _ body bi,.lam _ domain actualBody _ =>
  withLocalDecl n bi domain fun x => selectedMetadata request source body (actualBody.instantiate1 x) (ordinal+1) (path.push 1)
 | .letE n _ _ body flag,.letE _ domain value actualBody _ =>
  let mut here : Array Json := #[]
  if chosen.contains ordinal then
   let .ok positions := (← fieldM request "positions").getArr? | throwError "Source positions"
   let some position := positions.find? (fun j => (j.getObjValAs? Nat "ordinal").toOption == some ordinal) | throwError "Selected source ordinal absent"
   let .ok node := position.getObjValAs? Nat "node" | throwError "Selected source node"
   structural source[node]! raw "selected original let"
   unless (← fieldM position "route") == routeJson 1 path do throwError "Exact selected source route mismatch"
   checkDomain domain
   kernelAs value domain
   here := #[obj [("ordinal",nat ordinal),("source",position),("role",str (← role domain)),
    ("typeText",str (← prettyType domain)),("valueText",str (← prettyType value))]]
  let rest ← withLetDecl n domain value (nondep := flag) fun x =>
   selectedMetadata request source body (actualBody.instantiate1 x) (ordinal+1) (path.push 2)
  return here++rest
 | _,_ => return #[]

/- The two corpus bodies have all original inputs before the original lets.
   The claimed fixed-goal bridge is checked, not inferred from proof roles. -/
partial def declaredTail (term declared : Expr) (count := 0) : Except String (Nat × Expr) := do
 match term with
 | .lam _ _ body _ =>
  let .forallE _ _ goal _ := declared.consumeMData | throw "Original declared telescope shape"
  declaredTail body goal (count+1)
 | _ => return (count,declared)

partial def declaredInterface (term goal : Expr) (originalInputs addedInputs : Nat)
    (count := 0) : Except String Expr := do
 match term with
 | .lam n t body bi => return .forallE n t (← declaredInterface body goal originalInputs addedInputs (count+1)) bi
 | _ =>
  unless count==originalInputs+addedInputs do throw "Computed interface input count"
  return goal.liftLooseBVars 0 addedInputs

syntax "#atlas_corpus_definition_boundary " str " => " str : command
elab_rules : command
 | `(#atlas_corpus_definition_boundary $input:str => $output:str) => do
  let request ← readJson input.getString
  let packet ← readJson (← string request "packetFile")
  let .ok (source,roots) := AtlasPacketReplay.exact packet | throwError "Exact corpus boundary packet"
  let info ← field request "source"
  let name ← string info "name"
  unless (← string (← field packet "declaration") "name")==name do throwError "Corpus boundary declaration identity mismatch"
  let isRiccati := name=="JacobiData.slope_bound_abs"
  let declarationImported := ((← getEnv).find? name.toName).isSome
  let moduleName ← string info "module"
  let moduleImported := (← getEnv).header.moduleNames.any (·.toString==moduleName)
  let privateImported := (← getEnv).header.moduleNames.any (·.toString.startsWith "SE2Conjugate.")
  unless declarationImported==isRiccati && moduleImported==isRiccati && privateImported==isRiccati do throwError "Corpus boundary import ownership"
  let .ok chosen := (← field request "chosen").getArr?.bind (·.mapM (·.getNat?)) | throwError "Corpus boundary choices"
  unless !chosen.isEmpty && chosen.size<=64 && chosen.toList.eraseDups.length==chosen.size do throwError "Corpus boundary selection bounds"
  let result ← liftTermElabM fun _ => do
   let original := source[roots[1]!]!
   let declared := source[roots[0]!]!
   checkDomain declared
   kernelAs original declared
   if isRiccati then
    let c ← getConstInfo name.toName
    structural c.type declared "imported original declared type"
    let some value := c.value? true | throwError "Imported original body unavailable"
    structural value original "imported original complete body"
   let metadata ← selectedMetadata request source original original
   unless metadata.size==chosen.size do throwError "Selected definition count"
   let .ok (promoted,residuals) := promote original chosen | throwError "Corpus promotion"
   let .ok restored := demote promoted residuals | throwError "Corpus promotion inverse"
   structural restored original "corpus literal promotion recovery"
   match Kernel.check (← getEnv) (← getLCtx) promoted with
   | .error _ =>
    return obj [("status",str "KERNEL_REJECTED"),("phase",str "promoted-closed-function"),
     ("selected",toJson metadata),("graph",AtlasPacketReplay.graph #[original,declared,promoted]),
     ("closedPacketKernelTyping",str "PASS"),("literalPromotionInverse",str "PASS")]
   | .ok promotedType =>
    let (normalized,left) ← AtlasBinderBlocks.run promoted promotedType false
    let (right,rightSteps) ← AtlasBinderBlocks.run promoted promotedType true
    structural normalized right "corpus literal schedule coherence"
    let inferred ← kernelType normalized
    let .ok (originalInputs,goal) := declaredTail original declared | throwError "Declared source tail"
    let .ok expected := declaredInterface normalized goal originalInputs chosen.size | throwError "Declared interface telescope"
    kernelAs normalized expected
    conversion inferred expected
    let specialized := wrapOriginal original (← sourceApplication original normalized chosen)
    kernelAs specialized declared
    conversion specialized original
    kernelAs (← mkEqRefl specialized) (← mkEq specialized original)
    let mut components := #[original,declared,promoted,promotedType,normalized,inferred,expected,specialized]
    let mut ports : Array Json := #[]
    for r in residuals do
     let index := components.size
     components := components.push r.value
     ports := ports.push (obj [("ordinal",nat r.ordinal),("valueRoot",nat index),("sourceNondep",toJson r.flag)])
    let mut steps : Array Json := #[]
    for (schedule,ss) in #[("outermost",left),("deepest",rightSteps)] do
     for step in ss do
      let index := components.size
      components := components ++ #[step.before,step.after,step.residual]
      steps := steps.push (obj [("schedule",str schedule),("path",toJson step.path),("beforeRoot",nat index),
       ("afterRoot",nat (index+1)),("residualRoot",nat (index+2)),("sourceNondep",toJson step.flag)])
    let sourceAnnotations ← auditFlags original original
    let promotedAnnotations ← auditFlags promoted promoted
    let normalizedAnnotations ← auditFlags normalized normalized
    unless (sourceAnnotations++promotedAnnotations++normalizedAnnotations).all (fun j =>
       (j.getObjValAs? String "lambdaExpansionTyping").toOption==some "PASS" &&
       (j.getObjValAs? Bool "conversion").toOption==some true) do throwError "Uncertified true let annotation"
    let specializedAnnotations ← auditFlags specialized specialized
    unless specializedAnnotations.isEmpty do throwError "Computed specialization flags must be false"
    return obj [("status",str "PASS"),("namespace",str "corpus-definition-boundary"),
     ("selected",toJson metadata),("originalInputs",nat originalInputs),("newInputs",nat chosen.size),
     ("graph",AtlasPacketReplay.graph components),("residuals",toJson ports),("steps",toJson steps),
     ("sourceSpine",toJson (← describeSpine original)),("promotedSpine",toJson (← describeSpine promoted)),
     ("normalSpine",toJson (← describeSpine normalized)),("functionText",str (← prettyType normalized)),
     ("typeText",str (← prettyType inferred)),("declaredGoalTypeText",str (← prettyType expected)),
     ("closedPacketKernelTyping",str "PASS"),("functionTyping",str "PASS"),
     ("declaredGoalInterfaceTyping",str "PASS"),("declaredGoalTypeConversion",str "PASS"),
     ("sourceSpecializationTyping",str "PASS"),("sourceSpecializationConversion",str "PASS"),
     ("sourceEqualityWitness",str "PASS"),("literalPromotionInverse",str "PASS"),("literalScheduleCoherence",str "PASS"),
     ("annotations",obj [("source",toJson sourceAnnotations),("promoted",toJson promotedAnnotations),
      ("normalized",toJson normalizedAnnotations),("specialized",toJson specializedAnnotations)])]
  liftIO <| IO.FS.writeFile output.getString (obj [("format",str "ProofAtlasCorpusDefinitionBoundary/1"),
   ("source",info),("id",← field request "id"),("chosen",toJson chosen),
   ("originalDeclarationImported",toJson declarationImported),("originalModuleImported",toJson moduleImported),
   ("privateModulesImported",toJson privateImported),("originalTypeAndBodyMatch",toJson isRiccati),("result",result)]).compress
end AtlasCorpusDefinitionBoundaries
