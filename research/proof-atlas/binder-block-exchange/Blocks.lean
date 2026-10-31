/- Composes the preceding local Expr exchange on the primary binder spine. -/
namespace AtlasBinderBlocks
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes AtlasResultClosures AtlasBinderExchange

partial def candidates (e : Expr) (path : Array Nat := #[]) : Array (Array Nat) :=
 match e with
 | .lam _ _ body _ => candidates body (path.push 1)
 | .letE _ _ _ body _ =>
  let rest := candidates body (path.push 2)
  match body with
  | .lam .. => #[path] ++ rest
  | _ => rest
 | _ => #[]

partial def inversions (e : Expr) (lets := 0) : Nat :=
 match e with
 | .lam _ _ body _ => lets + inversions body lets
 | .letE _ _ _ body _ => inversions body (lets+1)
 | _ => 0

partial def atPath (e : Expr) (path : List Nat) : Except String Expr := do
 match path with
 | [] => return e
 | 1::rest =>
  let .lam _ _ b _ := e | throw "Block lambda path"
  atPath b rest
 | 2::rest =>
  let .letE _ _ _ b _ := e | throw "Block let path"
  atPath b rest
 | _ => throw "Block body slot"

partial def replaceAt (e : Expr) (path : List Nat) (value : Expr) : Except String Expr := do
 match path with
 | [] => return value
 | 1::rest =>
  let .lam n t b bi := e | throw "Block lambda replacement"
  return .lam n t (← replaceAt b rest value) bi
 | 2::rest =>
  let .letE n t v b flag := e | throw "Block let replacement"
  return .letE n t v (← replaceAt b rest value) flag
 | _ => throw "Block replacement slot"

partial def describeSpine (e : Expr) (path : Array Nat := #[]) : MetaM (Array Json) := do
 unless path.size <= 128 do throwError "Block presentation path bound"
 match e with
 | .lam n t body bi =>
  let row := obj [("kind",str "lam"),("name",str n.toString),("domain",str (← prettyType t)),
   ("binderInfo",str (AtlasLibrary.bi bi)),("path",toJson path)]
  let rest ← withLocalDecl n bi t fun x => describeSpine (body.instantiate1 x) (path.push 1)
  return #[row] ++ rest
 | .letE n t v body flag =>
  let row := obj [("kind",str "letE"),("name",str n.toString),("domain",str (← prettyType t)),
   ("value",str (← prettyType v)),("nondep",toJson flag),("path",toJson path)]
  let rest ← withLetDecl n t v (nondep := flag) fun x => describeSpine (body.instantiate1 x) (path.push 2)
  return #[row] ++ rest
 | _ => return #[]

structure Step where
 path : Array Nat
 before : Expr
 after : Expr
 residual : Expr
 flag : Bool
 deriving Inhabited

def run (original : Expr) (expected : Expr) (deepest : Bool) : MetaM (Expr × Array Step) := do
 let initial := inversions original
 unless initial <= 4096 do throwError "Block step bound"
 let mut current := original
 let mut steps : Array Step := #[]
 for _ in [:initial] do
  let choices := candidates current
  unless !choices.isEmpty do throwError "Missing block inversion"
  let path := if deepest then choices.back! else choices[0]!
  unless path.size <= 128 do throwError "Block path bound"
  let .ok localBefore := atPath current path.toList | throwError "Block path"
  let .ok (localAfter,residual,flag) := exchange localBefore | throwError "Block exchange"
  let .ok next := replaceAt current path.toList localAfter | throwError "Block replacement"
  unless inversions next + 1 == inversions current do throwError "Block inversion measure"
  let .ok undo := inverse localAfter residual flag | throwError "Block inverse"
  let .ok previous := replaceAt next path.toList undo | throwError "Block undo replacement"
  structural previous current "block single inverse"
  kernelAs next expected
  conversion next original
  steps := steps.push {path,before:=current,after:=next,residual,flag}
  current := next
 unless inversions current == 0 && (candidates current).isEmpty do throwError "Incomplete block normalization"
 let mut restored := current
 for step in steps.reverse do
  structural restored step.after "computed trace owner"
  let .ok localAfter := atPath restored step.path.toList | throwError "Block inverse path"
  let .ok localBefore := inverse localAfter step.residual step.flag | throwError "Block inverse residual"
  let .ok previous := replaceAt restored step.path.toList localBefore | throwError "Block inverse replacement"
  structural previous step.before "block previous owner"
  restored := previous
 structural restored original "complete block inverse"
 return (current,steps)

syntax "#atlas_binder_blocks " str " => " str : command
elab_rules : command
 | `(#atlas_binder_blocks $input:str => $output:str) => do
  let request ← readJson input.getString
  let .ok profiles := (← field request "profiles").getArr? | throwError "Block profiles"
  let mut rows : Array Json := #[]
  for p in profiles do
   let packet ← readJson (← string p "packetFile")
   let .ok (source,roots) := AtlasPacketReplay.exact packet | throwError "Block packet"
   let name ← string (← field p "source") "name"
   unless (← string (← field packet "declaration") "name") == name do throwError "Block declaration mismatch"
   unless ((← getEnv).find? name.toName).isNone do throwError "Original block declaration imported"
   let result ← liftTermElabM fun _ => do
    let original := source[roots[1]!]!
    let declared := source[roots[0]!]!
    checkDomain declared
    kernelAs original declared
    let (left,leftSteps) ← run original declared false
    let (right,rightSteps) ← run original declared true
    structural left right "schedule coherence"
    kernelAs (← mkEqRefl left) (← mkEq left original)
    let mut components := #[original,declared,left,right]
    let mut schedules : Array Json := #[]
    for (label,steps) in #[("outermost",leftSteps),("deepest",rightSteps)] do
     let mut records : Array Json := #[]
     for step in steps do
      let start := components.size
      components := components ++ #[step.before,step.after,step.residual]
      records := records.push (obj [("path",toJson step.path),("beforeRoot",nat start),
       ("afterRoot",nat (start+1)),("residualRoot",nat (start+2)),
       ("beforeSpine",toJson (← describeSpine step.before)),("afterSpine",toJson (← describeSpine step.after)),
       ("beforeText",str (← prettyType step.before)),("afterText",str (← prettyType step.after)),("sourceNondep",toJson step.flag),
       ("typingAtDeclaredGoal",str "PASS"),("conversionToSource",str "PASS"),("literalInverse",str "PASS")])
     schedules := schedules.push (obj [("name",str label),("steps",toJson records)])
    return obj [("status",str "PASS"),("graph",AtlasPacketReplay.graph components),
     ("initialInversions",nat (inversions original)),("schedules",toJson schedules),
     ("originalSpine",toJson (← describeSpine original)),("normalSpine",toJson (← describeSpine left)),
     ("originalText",str (← prettyType original)),("normalText",str (← prettyType left)),
     ("declaredGoalTyping",str "PASS"),("literalScheduleCoherence",str "PASS"),
     ("sourceEqualityWitness",str "PASS"),("completeLiteralInverse",str "PASS")]
   rows := rows.push (obj [("source",← field p "source"),("originalDeclarationImported",toJson false),("result",result)])
  liftIO <| IO.FS.writeFile output.getString (obj [("format",str "ProofAtlasBinderBlocksNative/1"),("profiles",toJson rows)]).compress
end AtlasBinderBlocks
