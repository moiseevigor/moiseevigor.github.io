/- Included after the exact packet codec and the local/composed exchange rules. -/
namespace AtlasDefinitionBoundaries
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes AtlasResultClosures AtlasBinderExchange AtlasBinderBlocks

structure Residual where
 ordinal : Nat
 value : Expr
 flag : Bool
 deriving Inhabited

partial def promote (e : Expr) (chosen : Array Nat) (ordinal := 0) : Except String (Expr × Array Residual) := do
 unless ordinal <= 128 do throw "Definition-boundary spine bound"
 match e with
 | .lam n t b bi =>
  unless !chosen.contains ordinal do throw "Selected boundary is not a let"
  let (body,rs) ← promote b chosen (ordinal+1)
  return (.lam n t body bi,rs)
 | .letE n t v b flag =>
  let (body,rs) ← promote b chosen (ordinal+1)
  if chosen.contains ordinal then
   return (.lam n t body .default,#[{ordinal,value:=v,flag}]++rs)
  else return (.letE n t v body flag,rs)
 | _ =>
  unless chosen.all (· < ordinal) do throw "Boundary beyond primary spine"
  return (e,#[])

partial def demote (e : Expr) (rs : Array Residual) (ordinal := 0) : Except String Expr := do
 unless ordinal <= 128 do throw "Definition recovery spine bound"
 if let some r := rs.find? (·.ordinal == ordinal) then
  let .lam n t b .default := e | throw "Boundary parameter identity"
  return .letE n t r.value (← demote b rs (ordinal+1)) r.flag
 match e with
 | .lam n t b bi => return .lam n t (← demote b rs (ordinal+1)) bi
 | .letE n t v b flag => return .letE n t v (← demote b rs (ordinal+1)) flag
 | _ => return e

/- Build the source specialization using actual original binder identities.
   Retained local definitions do not become independently supplied arguments. -/
partial def sourceApplication (original normalized : Expr) (chosen : Array Nat)
    (ordinal := 0) (xs : Array Expr := #[]) (arguments : Array Expr := #[]) : MetaM Expr := do
 unless ordinal <= 128 do throwError "Source specialization spine bound"
 match original with
 | .lam n t b bi =>
  withLocalDecl n bi t fun x =>
   sourceApplication (b.instantiate1 x) normalized chosen (ordinal+1) (xs.push x) (arguments.push x)
 | .letE n t v b flag =>
  withLetDecl n t v (nondep := flag) fun x =>
   sourceApplication (b.instantiate1 x) normalized chosen (ordinal+1) (xs.push x)
    (if chosen.contains ordinal then arguments.push x else arguments)
 | _ =>
  let applied := mkAppN normalized arguments
  let expected ← kernelType original
  kernelAs applied expected
  conversion applied original
  return applied.abstract xs

partial def wrapOriginal (original body : Expr) (conservative := true) : Expr :=
 match original with
 | .lam n t b bi => .lam n t (wrapOriginal b body conservative) bi
 | .letE n t v b flag => .letE n t v (wrapOriginal b body conservative) (if conservative then false else flag)
 | _ => body

partial def auditFlags (whole current : Expr) (path : Array Nat := #[]) (ordinal := 0) : MetaM (Array Json) := do
 unless ordinal <= 128 do throwError "Annotation audit spine bound"
 match current with
 | .lam _ _ body _ => auditFlags whole body (path.push 1) (ordinal+1)
 | .letE n t v body flag =>
  let rest ← auditFlags whole body (path.push 2) (ordinal+1)
  if !flag then return rest
  let expanded := mkApp (.lam n t body .default) v
  let .ok candidate := replaceAt whole path.toList expanded | throwError "Annotation expansion path"
  let env ← getEnv
  let context ← getLCtx
  let typed := (Kernel.check env context candidate).isOk
  let equivalent := if typed then (Kernel.isDefEq env context candidate whole).toOption.getD false else false
  return #[obj [("ordinal",nat ordinal),("path",toJson path),("name",str n.toString),
   ("lambdaExpansionTyping",str (if typed then "PASS" else "KERNEL_REJECTED")),("conversion",toJson equivalent)]] ++ rest
 | _ => return #[]

syntax "#atlas_definition_boundaries " str " => " str : command
elab_rules : command
 | `(#atlas_definition_boundaries $input:str => $output:str) => do
  let request ← readJson input.getString
  let .ok profiles := (← field request "profiles").getArr? | throwError "Boundary profiles"
  let mut helperRows : Array Json := #[]
  let .ok support := (← field request "support").getArr? | throwError "Boundary support records"
  for helper in support do
   let packet ← readJson (← string helper "packetFile")
   let .ok (nodes,roots) := AtlasPacketReplay.exact packet | throwError "Boundary helper packet"
   let declaration ← field packet "declaration"
   let name := (← string declaration "name").toName
   unless (← getEnv).find? name |>.isNone do throwError "Boundary helper already imported"
   unless (← string declaration "kind") == "theorem" do throwError "Boundary support is not a theorem"
   let .ok levels := (← field declaration "levelParams").getArr?.bind (·.mapM (·.getStr?)) | throwError "Helper universe names"
   liftTermElabM fun _ => do
    checkDomain nodes[roots[0]!]!
    kernelAs nodes[roots[1]!]! nodes[roots[0]!]!
   liftCoreM <| addDecl (.thmDecl {name,levelParams:=levels.toList.map String.toName,type:=nodes[roots[0]!]!,value:=nodes[roots[1]!]!})
   helperRows := helperRows.push (obj [("name",str name.toString),("kernelTyping",str "PASS"),("imported",toJson false)])
  let mut rows : Array Json := #[]
  for p in profiles do
   let packet ← readJson (← string p "packetFile")
   let .ok (source,roots) := AtlasPacketReplay.exact packet | throwError "Boundary packet"
   let name ← string (← field p "source") "name"
   unless (← string (← field packet "declaration") "name") == name do throwError "Boundary source identity"
   unless ((← getEnv).find? name.toName).isNone do throwError "Original boundary declaration imported"
   let .ok chosen := (← field p "chosen").getArr?.bind (·.mapM (·.getNat?)) | throwError "Boundary selection"
   unless !chosen.isEmpty && chosen.size<=64 && chosen.toList.eraseDups.length==chosen.size do throwError "Boundary selection bounds"
   let expected ← string p "expected"
   let result ← liftTermElabM fun _ => do
    let original := source[roots[1]!]!
    let declared := source[roots[0]!]!
    checkDomain declared
    kernelAs original declared
    let .ok (promoted,rs) := promote original chosen | throwError "Boundary promotion failed"
    unless rs.size==chosen.size do throwError "Boundary residual count"
    let .ok restored := demote promoted rs | throwError "Boundary demotion failed"
    structural restored original "literal promotion inverse"
    let sourceStatus := obj [("closedPacketTyping",str "PASS"),("literalPromotionInverse",str "PASS")]
    let mut components := #[original,declared,promoted]
    let mut residuals : Array Json := #[]
    for r in rs do
     let index := components.size
     components := components.push r.value
     residuals := residuals.push (obj [("ordinal",nat r.ordinal),("valueRoot",nat index),("sourceNondep",toJson r.flag)])
    match Kernel.check (← getEnv) (← getLCtx) promoted with
    | .error _ =>
     unless expected == "KERNEL_REJECTED" do throwError "Unexpected boundary rejection"
     return obj [("status",str "KERNEL_REJECTED"),("phase",str "promoted-closed-function"),
      ("sourceChecks",sourceStatus),("sourceSpine",toJson (← describeSpine original)),
      ("sourceText",str (← prettyType original)),("sourceTypeText",str (← prettyType declared)),
      ("graph",AtlasPacketReplay.graph components),("residuals",toJson residuals)]
    | .ok promotedType =>
     unless expected == "PASS" do throwError "Expected boundary rejection was accepted"
     let (normalized,leftSteps) ← AtlasBinderBlocks.run promoted promotedType false
     let (right,rightSteps) ← AtlasBinderBlocks.run promoted promotedType true
     structural normalized right "boundary schedule coherence"
     let normalizedType ← kernelType normalized
     let application ← sourceApplication original normalized chosen
     let specialized := wrapOriginal original application
     let sourceFlagAdapter := wrapOriginal original application false
     kernelAs sourceFlagAdapter declared
     kernelAs specialized declared
     conversion specialized original
     kernelAs (← mkEqRefl specialized) (← mkEq specialized original)
     let promotedTypeRoot := components.size
     components := components ++ #[promotedType,normalized,normalizedType,specialized,sourceFlagAdapter]
     let mut steps : Array Json := #[]
     for (schedule,ss) in #[("outermost",leftSteps),("deepest",rightSteps)] do
      for s in ss do
       let index := components.size
       components := components ++ #[s.before,s.after,s.residual]
       steps := steps.push (obj [("schedule",str schedule),("path",toJson s.path),
        ("beforeRoot",nat index),("afterRoot",nat (index+1)),("residualRoot",nat (index+2)),("sourceNondep",toJson s.flag)])
     return obj [("status",str "PASS"),("sourceChecks",sourceStatus),("graph",AtlasPacketReplay.graph components),
      ("residuals",toJson residuals),("promotedTypeRoot",nat promotedTypeRoot),
      ("normalRoot",nat (promotedTypeRoot+1)),("normalTypeRoot",nat (promotedTypeRoot+2)),
      ("specializedRoot",nat (promotedTypeRoot+3)),("sourceFlagAdapterRoot",nat (promotedTypeRoot+4)),("steps",toJson steps),
      ("annotationAudit",obj [("source",toJson (← auditFlags original original)),("promoted",toJson (← auditFlags promoted promoted)),
       ("normalized",toJson (← auditFlags normalized normalized)),("specialized",toJson (← auditFlags specialized specialized)),
       ("sourceFlagAdapter",toJson (← auditFlags sourceFlagAdapter sourceFlagAdapter))]),
      ("normalSpine",toJson (← describeSpine normalized)),("sourceSpine",toJson (← describeSpine original)),
      ("sourceText",str (← prettyType original)),("sourceTypeText",str (← prettyType declared)),
      ("promotedSpine",toJson (← describeSpine promoted)),("promotedText",str (← prettyType promoted)),
      ("promotedTypeText",str (← prettyType promotedType)),
      ("functionText",str (← prettyType normalized)),("typeText",str (← prettyType normalizedType)),
      ("functionTyping",str "PASS"),("sourceSpecializationTyping",str "PASS"),("sourceFlagAdapterTyping",str "PASS"),
      ("sourceSpecializationConversion",str "PASS"),("sourceEqualityWitness",str "PASS"),
      ("literalScheduleCoherence",str "PASS"),("literalPromotionInverse",str "PASS")]
   rows := rows.push (obj [("source",← field p "source"),("chosen",toJson chosen),
    ("originalDeclarationImported",toJson false),("result",result)])
  liftIO <| IO.FS.writeFile output.getString (obj [("format",str "ProofAtlasDefinitionBoundariesNative/1"),("profiles",toJson rows),("helpers",toJson helperRows)]).compress
end AtlasDefinitionBoundaries
