namespace AtlasScopedDagControls
open Lean Elab Command AtlasExprReferenceBridge

/- Both return forms inside a do-bound match leave the surrounding function.
   An explicit monadic value lets the subsequent cache insertion execute. -/
def earlyBranch : IO Nat := do
 let n ← match true with
  | true => return 1
  | false => pure 0
 pure (n+1)

def explicitBranch : IO Nat := do
 let n ← match true with
  | true => pure 1
  | false => pure 0
 pure (n+1)

/- Deliberately wrong control: cached results lose local binder depth. -/
partial def rowOnlyLift (source : AtlasExprReferenceNodes.Source) (node depth : Nat) :
 StateT (Std.HashMap Nat Expr) (Except String) Expr := do
 if source.scopes[node]!<=depth then return source.nodes[node]!
 if let some e := (← get).get? node then return e
 let e := source.nodes[node]!
 let cs := source.children[node]!
 let result : Expr ← match e with
  | .bvar i => pure (.bvar (if depth≤i then i+1 else i))
  | .app _ _ => pure <| e.updateApp! (← rowOnlyLift source cs[0]! depth) (← rowOnlyLift source cs[1]! depth)
  | .lam _ _ _ _ => pure <| e.updateLambdaE! (← rowOnlyLift source cs[0]! depth) (← rowOnlyLift source cs[1]! (depth+1))
  | _ => pure e
 modify (·.insert node result)
 return result

def close (e : Expr) (count : Nat) : Expr :=
 match count with
 | 0 => e
 | n+1 => .lam (Name.num `input n) (.const `Nat []) (close e n) .default

def regressions : CommandElabM Json := do
 unless (← liftIO earlyBranch)==1 && (← liftIO explicitBranch)==2 do throwError "Return-scope regression"
 let simple := Expr.app (.bvar 0) (.bvar 0)
 let (old,oldStates) ← required <| memoLift simple 1 0
 let source ← required <| AtlasExprReferenceNodes.decode (AtlasPacketReplay.graph #[simple])
 let fixedResult ← liftIO <| AtlasExprReferenceNodes.lift source source.roots[0]! 1 0
 let fixed := fixedResult.value
 let fixedStates := fixedResult.states
 let _ ← required <| equal old fixed "legacy correct value despite missing composite cache insertion"
 unless oldStates==1 && fixedStates==2 do throwError "Composite cache insertion regression"
 let nat := Expr.const `Nat []
 let natFn := Expr.forallE `x nat nat .default
 let fan := mkApp2 (.const `Nat.add []) (.bvar 0) (.bvar 1)
 let original := mkApp4 (.const `Prod.mk [.zero,.zero]) nat natFn fan (.lam `x nat fan .default)
 let source ← required <| AtlasExprReferenceNodes.decode (AtlasPacketReplay.graph #[original])
 let root := source.roots[0]!
 let rightResult ← liftIO <| AtlasExprReferenceNodes.lift source root 1 0
 let right := rightResult.value
 let (wrong,_) ← required <| (rowOnlyLift source root 0).run {}
 let .error _ := equal right wrong "row-only scope alias" | throwError "Row-only cache failed to change reference meaning"
 let right := close right 3
 let wrong := close wrong 3
 let env ← getEnv
 let .ok rightType := Kernel.check env {} right | throwError "Correct scope control typing"
 let .ok wrongType := Kernel.check env {} wrong | throwError "Wrong scope control typing"
 let .ok true := Kernel.isDefEq env {} rightType wrongType | throwError "Scope controls must share a type"
 let .ok false := Kernel.isDefEq env {} right wrong | throwError "Kernel must distinguish wrongly transported scope"
 Command.liftTermElabM do
  let goal := mkNot (← mkEq right wrong)
  let proof ← Term.elabTermEnsuringType (← `(by
   intro h
   have hh := congrArg (fun f => (f 0 0 0).2 1) h
   change (1 : Nat) = 0 at hh
   exact Nat.noConfusion hh)) (some goal)
  Term.synthesizeSyntheticMVarsNoPostponing
  let proof ← instantiateMVars proof
  unless !proof.hasExprMVar && !proof.hasLevelMVar do throwError "Open inequality proof"
  unless (proof.find? (·.isConstOf ``sorryAx)).isNone do throwError "Unproved inequality control"
  let actual ← match Kernel.check (← getEnv) {} proof with
   | .ok value => pure value
   | .error error => throwError "Wrong-cache inequality proof: {error.toMessageData {}}"
  let .ok true := Kernel.isDefEq (← getEnv) {} actual goal | throwError "Wrong-cache inequality declared type"
 return Json.mkObj [("earlyBranch",toJson (1:Nat)),("explicitBranch",toJson (2:Nat)),
  ("legacyStates",toJson oldStates),("fixedStates",toJson fixedStates),("sameLegacyOutput",toJson true),
  ("wrongCacheTyped",toJson true),("sameType",toJson true),("wrongCacheNonconvertible",toJson true),("kernelInequalityProof",toJson "PASS"),
  ("graph",AtlasPacketReplay.graph #[original,close original 2,right,wrong])]

def auditProtected : CommandElabM Json := do
 let names := [``AtlasExprReferencePruning.lift_protected,
  ``AtlasExprReferencePruning.swap_protected,``AtlasExprReferencePruning.substitute_protected]
 let mut rows : Array Json := #[]
 for name in names do
  let env ← getEnv
  let .thmInfo info := env.find? name |>.get! | throwError "Expected protected-subtree theorem"
  let .ok actual := Kernel.check env {} info.value | throwError "Protected-subtree theorem kernel rejection"
  let .ok true := Kernel.isDefEq env {} actual info.type | throwError "Protected-subtree theorem declared type"
  let axioms ← liftCoreM <| Lean.collectAxioms name
  unless !axioms.contains ``sorryAx do throwError "Unproved protected-subtree theorem"
  rows := rows.push <| Json.mkObj [("name",toJson name.toString),("kernelTyping",toJson "PASS"),("axioms",toJson (axioms.toList.map Name.toString))]
 return toJson rows

syntax "#atlas_scoped_dag_controls " str " => " str : command
elab_rules : command
 | `(#atlas_scoped_dag_controls $input:str => $output:str) => do
  let bytes ← liftIO <| IO.FS.readFile input.getString
  let .ok data := Json.parse bytes | throwError "Control JSON"
  let graph ← required <| data.getObjVal? "graph"
  let source ← required <| AtlasExprReferenceNodes.decode graph
  let invalidGraphs ← required <| data.getObjValAs? (Array Json) "invalidGraphs"
  let mut metadataRefusals : Array String := #[]
  for invalid in invalidGraphs do
   let name ← required <| invalid.getObjValAs? String "name"
   let graph ← required <| invalid.getObjVal? "graph"
   let .error _ := AtlasExprReferenceNodes.decode graph | throwError "Malformed source metadata accepted: {name}"
   metadataRefusals := metadataRefusals.push name
  for (root,depth) in [(source.nodes.size,0),(source.roots[0]!,513)] do
   let refused ← liftIO do
    try
     let _ ← AtlasExprReferenceNodes.swap source root depth
     pure false
    catch _ => pure true
   unless refused do throwError "Invalid evaluator address/depth accepted"
  let sampleCount ← required <| data.getObjValAs? Nat "sampleCount"
  let mut observations : Array Json := #[]
  for operation in ["lifts","swaps","substitutions"] do
   let controls ← required <| data.getObjValAs? (Array Json) operation
   for c in controls do
    let sample ← required <| c.getObjValAs? Nat "sample"
    let expectedRoot ← required <| c.getObjValAs? Nat "root"
    unless sample<sampleCount && expectedRoot<source.roots.size do throwError "Control component address"
    let root := source.roots[sample]!
    let result ← if operation=="lifts" then do
      let amount ← required <| c.getObjValAs? Nat "amount"
      let cutoff ← required <| c.getObjValAs? Nat "cutoff"
      liftIO <| AtlasExprReferenceNodes.lift source root amount cutoff
     else if operation=="swaps" then do
      let depth ← required <| c.getObjValAs? Nat "depth"
      liftIO <| AtlasExprReferenceNodes.swap source root depth
     else do
      let depth ← required <| c.getObjValAs? Nat "depth"
      let value ← required <| c.getObjValAs? Nat "value"
      unless sampleCount+value<source.roots.size do throwError "Control replacement address"
      liftIO <| AtlasExprReferenceNodes.substitute source root source.nodes[source.roots[sampleCount+value]!]! depth
    let _ ← required <| equal result.value source.nodes[source.roots[expectedRoot]!]! "row/depth evaluator against full frozen raw output"
    observations := observations.push <| Json.mkObj [("operation",toJson operation),("control",c),("rawEquality",toJson "PASS"),("stats",result.stats)]
  let result := Json.mkObj [("format",toJson "ProofAtlasScopedDagControls/1"),("typedProofs",toJson false),("observations",toJson observations),("protectedLaws",← auditProtected),("regressions",← regressions),("metadataRefusals",toJson metadataRefusals),("addressDepthRefusals",toJson (2:Nat))]
  liftIO <| IO.FS.writeFile output.getString result.compress
end AtlasScopedDagControls
