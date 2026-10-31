/- Separately authored typed value program. Not an AI proof or theorem benchmark. -/
namespace AtlasExprReferenceStress
open Lean Elab Command Meta AtlasExprReference AtlasExprReferenceBridge

def checkpoint (message : String) : CommandElabM Unit :=
 liftIO do
  IO.FS.writeFile "stage.txt" message
  IO.println message
  (← IO.getStdout).flush

def add (a b : Expr) : Expr := mkApp2 (.const `Nat.add []) a b

def closeNat (e : Expr) (count : Nat) : Expr :=
 match count with
 | 0 => e
 | n+1 => .lam (Name.num `input n) (.const `Nat []) (closeNat e n) .default

def functionType (result : Expr) (count : Nat) : Expr :=
 match count with
 | 0 => result
 | n+1 => .forallE (Name.num `input n) (.const `Nat []) (functionType result n) .default

def typed (e expected : Expr) : CommandElabM Unit := do
 let .ok actual := Kernel.check (← getEnv) {} e | throwError "Stress kernel typing"
 let .ok true := Kernel.isDefEq (← getEnv) {} actual expected | throwError "Stress declared type"

def equivalent (a b expected : Expr) : CommandElabM Unit := do
 typed a expected
 typed b expected
 let .ok true := Kernel.isDefEq (← getEnv) {} a b | throwError "Stress conversion"
 liftTermElabM fun _ => do
  let proof ← mkEqRefl a
  let goal ← mkEq a b
  let .ok actual := Kernel.check (← getEnv) {} proof | throwError "Stress equality proof"
  let .ok true := Kernel.isDefEq (← getEnv) {} actual goal | throwError "Stress equality witness type"

syntax (name := exprReferenceStress) "#atlas_expr_reference_stress " str : command
@[command_elab exprReferenceStress] meta def elabStress : CommandElab
 | `(#atlas_expr_reference_stress $output:str) => do
  checkpoint "stress: start"
  let leafCount := 8192
  let doublings := 64
  let nat := Expr.const `Nat []
  let natFn := Expr.forallE `x nat nat .default
  let pairType := mkApp2 (.const `Prod [.zero,.zero]) nat natFn
  let mut layer := (List.range leafCount).toArray.map fun i => add (.bvar 0) (.lit (.natVal i))
  checkpoint "stress: leaves"
  while layer.size>1 do
   unless layer.size%2==0 do throwError "Balanced stress layer"
   layer := (List.range (layer.size/2)).toArray.map fun i => add layer[2*i]! layer[2*i+1]!
  checkpoint "stress: balanced"
  let mut fan := layer[0]!
  for _ in [:doublings] do fan := add fan fan
  checkpoint "stress: amplified"
  -- The identical shared fan has free index 0 on the left, and is bound by
  -- the inner lambda on the right. Stored-row equality must not merge scopes.
  let original := mkApp4 (.const `Prod.mk [.zero,.zero]) nat natFn fan (.lam `x nat fan .default)
  let value := add (.bvar 0) (.bvar 1)
  checkpoint "stress: constructed"
  let sourceGraph := AtlasPacketReplay.graph #[original]
  let source ← required <| AtlasExprReferenceNodes.decode sourceGraph
  let root := source.roots[0]!
  let original := source.nodes[root]!
  checkpoint "stress: source table"

  let liftResult ← liftIO <| AtlasExprReferenceNodes.lift source root 2 0
  let lifted := liftResult.value
  let liftStates := liftResult.states
  checkpoint "stress: lift complete"
  let swapResult ← liftIO <| AtlasExprReferenceNodes.swap source root 0
  let swapped := swapResult.value
  let swapStates := swapResult.states
  checkpoint "stress: swap complete"
  let subResult ← liftIO <| AtlasExprReferenceNodes.substitute source root value 0
  let substituted := subResult.value
  let subStates := subResult.states
  checkpoint "stress: rewrites"
  let _ ← required <| equal lifted (original.liftLooseBVars 0 2) "stress native lift"
  let _ ← required <| equal swapped (nativeSwap original) "stress native swap"
  let _ ← required <| equal substituted (original.instantiate1 value) "stress native substitute"
  checkpoint "stress: native equality"
  let swappedSource ← required <| AtlasExprReferenceNodes.decode (AtlasPacketReplay.graph #[swapped])
  let backResult ← liftIO <| AtlasExprReferenceNodes.swap swappedSource swappedSource.roots[0]! 0
  let back := backResult.value
  let backStates := backResult.states
  let _ ← required <| equal back original "stress exact swap inverse"
  let _ ← required <| equal (lifted.lowerLooseBVars 2 2) original "stress exact lift recovery"
  checkpoint "stress: literal inverses"
  let sourceFunction := closeNat original 1
  let liftFunction := closeNat lifted 3
  let swapFunction := closeNat swapped 2
  let subFunction := closeNat substituted 2
  typed sourceFunction (functionType pairType 1)
  checkpoint "stress: source typing"
  typed liftFunction (functionType pairType 3)
  checkpoint "stress: lift typing"
  typed swapFunction (functionType pairType 2)
  checkpoint "stress: swap typing"
  typed subFunction (functionType pairType 2)
  checkpoint "stress: substitution typing"
  let zero := Expr.lit (.natVal 0)
  let liftAdapter := closeNat (mkAppN liftFunction #[.bvar 0,zero,zero]) 1
  let swapAdapter := closeNat (mkAppN swapFunction #[.bvar 0,zero]) 1
  let sourceAtValue := closeNat (mkApp sourceFunction value) 2
  equivalent liftAdapter sourceFunction (functionType pairType 1)
  checkpoint "stress: lift conversion"
  equivalent swapAdapter sourceFunction (functionType pairType 1)
  checkpoint "stress: swap conversion"
  equivalent subFunction sourceAtValue (functionType pairType 2)
  checkpoint "stress: substitution conversion"
  let graph := AtlasPacketReplay.graph #[original,value,lifted,swapped,substituted,sourceFunction,liftFunction,swapFunction,subFunction,liftAdapter,swapAdapter,sourceAtValue,pairType]
  let kinds ← required <| graph.getObjValAs? (Array Nat) "kind"
  unless kinds.size<=131072 do throwError "Stress joint table bound"
  let expectedUses := leafCount*2^doublings
  let result := Json.mkObj [("format",toJson "ProofAtlasExprReferenceStress/1"),("provenance",toJson "assistant-authored typed value program; not AI-source evidence"),("leafCount",toJson leafCount),("doublings",toJson doublings),("expectedFreeUses",toJson (toString expectedUses)),("expectedLocalUses",toJson (toString expectedUses)),("expectedOriginalOccurrences",toJson (toString (16*expectedUses+5))),("expectedSubstitutedOccurrences",toJson (toString (20*expectedUses+5))),("memoStates",toJson #[liftStates,swapStates,subStates,backStates]),("rewriteStats",toJson #[liftResult.stats,swapResult.stats,subResult.stats,backResult.stats]),("kernelTyping",toJson (4:Nat)),("kernelConversions",toJson (3:Nat)),("typedEqualityWitnesses",toJson (3:Nat)),("literalInverses",toJson (2:Nat)),("graph",graph),("laws",← auditLaws)]
  liftIO <| IO.FS.writeFile output.getString result.compress
 | _ => throwUnsupportedSyntax
end AtlasExprReferenceStress
