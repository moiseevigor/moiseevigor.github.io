/- Finite comparisons with native instantiation. This memoized executor is not
   proved a refinement of the tree-recursive substitution specification. -/
namespace ProofAtlas.ContextInstantiationNative
open Lean ProofAtlas.ContextFrame ProofAtlas.ContextInstantiation
open ProofAtlas.SourceRecoveryNative (required compare graph)

structure Work where
  memo : Std.HashMap (ExprStructEq × Nat) Expr := {}
  deriving Inhabited

partial def memoSubst (images : Array Expr) (e : Expr) (depth : Nat := 0)
    (height : Nat := 0) : StateT Work (Except String) Expr := do
  if let some out := (← get).memo.get? (⟨e⟩,depth) then return out
  unless height ≤ 512 && (← get).memo.size < 262144 do throw "Instantiation work bound"
  let child := fun e d => memoSubst images e d (height+1)
  let out ← match e with
    | .bvar i => pure <| if i < depth then e
        else if i-depth < images.size then
          images[images.size-1-(i-depth)]!.liftLooseBVars 0 depth
        else .bvar (i-images.size)
    | .app f a => pure <| .app (← child f depth) (← child a depth)
    | .lam n t b bi => pure <| .lam n (← child t depth) (← child b (depth+1)) bi
    | .forallE n t b bi => pure <| .forallE n (← child t depth) (← child b (depth+1)) bi
    | .letE n t v b nd => pure <| .letE n (← child t depth) (← child v depth) (← child b (depth+1)) nd
    | .mdata md b => pure <| .mdata md (← child b depth)
    | .proj n i b => pure <| .proj n i (← child b depth)
    | e => pure e
  unless (← get).memo.size < 262144 do throw "Instantiation table bound"
  modify fun s => {s with memo := s.memo.insert (⟨e⟩,depth) out}
  return out

def headApply (typeMode : Bool) : List Bool → Expr → List Expr → Option Expr
  | [], e, [] => some e
  | true :: rest, .letE _ _ v b _, args => headApply typeMode rest (b.instantiate1 v) args
  | false :: rest, .lam _ _ b _, a :: args =>
      if typeMode then none else headApply typeMode rest (b.instantiate1 a) args
  | false :: rest, .forallE _ _ b _, a :: args =>
      if typeMode then headApply typeMode rest (b.instantiate1 a) args else none
  | _, _, _ => none

def imageSubstitution (images : Array Expr) : Substitution := fun i =>
  if i < images.size then images[images.size-1-i]! else .bvar (i-images.size)

def same (a b : Expr) : IO Bool := do
  return (← required ((compare a b).run {})).1

def ensureSame (a b : Expr) (label : String) : IO Unit := do
  unless ← same a b do throw (IO.userError label)

def value (rows : Array Expr) (j : Json) (key : String) : IO Expr := do
  let i ← required (j.getObjValAs? Nat key)
  unless i < rows.size do throw (IO.userError "Expression address")
  return rows[i]!

def runCase (rows : Array Expr) (input : Json) : IO Json := do
  let index ← required (input.getObjValAs? Nat "index")
  let plan ← required (input.getObjValAs? (List Bool) "plan")
  unless plan.length ≤ 512 do throw (IO.userError "Boundary bound")
  let ids ← required (input.getObjValAs? (Array Nat) "args")
  unless ids.all (· < rows.size) do throw (IO.userError "Argument address")
  let args := ids.map (rows[·]!)
  let term ← value rows input "term"
  let type ← value rows input "type"
  let body ← value rows input "body"
  let bodyType ← value rows input "bodyType"
  let expected ← value rows input "expectedTerm"
  let expectedType ← value rows input "expectedType"
  let targetScope ← required (input.getObjValAs? Nat "targetScope")
  unless !term.hasLooseBVars && !type.hasLooseBVars &&
      args.all (fun a => a.looseBVarRange ≤ targetScope) do
    throw (IO.userError "Module/argument explicit scope")
  let (members,peeled) := peel plan.length term
  unless members.length == plan.length && members.map isDefinition == plan do
    throw (IO.userError "Declared term boundary")
  ensureSame peeled body "Term body address"
  ensureSame (closeType members bodyType) type "Type boundary/header mismatch"
  let mut images : Array Expr := #[]
  let mut position := 0
  let mut states := 0
  let mut maximumQueryStates := 0
  for member in members do
    match member with
    | .assumption .. =>
      unless position < args.size do throw (IO.userError "Missing assumption argument")
      images := images.push args[position]!
      position := position+1
    | .definition _ _ v _ =>
      let (out,work) ← required ((memoSubst images v).run {})
      ensureSame out (v.instantiateRev images) "Let prefix substitution"
      states := states+work.memo.size
      maximumQueryStates := max maximumQueryStates work.memo.size
      images := images.push out
  unless position == args.size do throw (IO.userError "Extra assumption argument")
  let (out,work) ← required ((memoSubst images body).run {})
  let (outType,typeWork) ← required ((memoSubst images bodyType).run {})
  ensureSame out expected "Independent model term mismatch"
  ensureSame outType expectedType "Independent model type mismatch"
  ensureSame out (body.instantiateRev images) "Native simultaneous term instantiation"
  ensureSame outType (bodyType.instantiateRev images) "Native simultaneous type instantiation"
  let some applied := headApply false plan term args.toList
    | throw (IO.userError "Term application rejected")
  let some instantiated := headApply true plan type args.toList
    | throw (IO.userError "Type instantiation rejected")
  ensureSame applied expected "Sequential term instantiation"
  ensureSame instantiated expectedType "Sequential type instantiation"
  unless out.looseBVarRange ≤ targetScope && outType.looseBVarRange ≤ targetScope do
    throw (IO.userError "Result explicit scope")
  -- The specification is tree-recursive: never force it on exponentially shared inputs.
  let budget ← required (input.getObjValAs? Bool "runSpecification")
  if budget then
    ensureSame (subst (imageSubstitution images) body) out "Specification term substitution"
    ensureSame (subst (imageSubstitution images) bodyType) outType "Specification type substitution"
    let some formalTerm := applyTerm plan term args.toList
      | throw (IO.userError "Specification term application")
    let some formalType := instantiateType plan type args.toList
      | throw (IO.userError "Specification type instantiation")
    ensureSame formalTerm out "Specification term recovery"
    ensureSame formalType outType "Specification type recovery"
  return Json.mkObj [("index",toJson index),("nativeSimultaneous",toJson "PASS"),
    ("nativeSequential",toJson "PASS"),("modelResults",toJson "PASS"),
    ("scope",toJson "PASS"),("specification",toJson (if budget then "PASS" else "not-evaluated-expanded-budget")),
    ("substitutionStates",toJson (states+work.memo.size+typeWork.memo.size)),
    ("maximumQueryStates",toJson (max maximumQueryStates (max work.memo.size typeWork.memo.size)))]

def controls : IO Json := do
  let n := natType
  let x := mkFVar ⟨`probeX⟩
  let y := mkFVar ⟨`probeY⟩
  let pair := Expr.lam `x n (.lam `y n (.app (.bvar 1) (.bvar 0)) .default) .default
  let some ordered := headApply false [false,false] pair [x,y]
    | throw (IO.userError "Ordered control")
  let some reversed := headApply false [false,false] pair [y,x]
    | throw (IO.userError "Reversed control")
  unless !(← same ordered reversed) do throw (IO.userError "Swapped arguments accepted")
  unless (headApply false [false] identityValue []).isNone &&
      (headApply false [false] identityValue [x,y]).isNone &&
      (headApply false [false,true] (rebuild oneDefinition (.bvar 0)) [x,y]).isNone &&
      (headApply false [false,false] (rebuild oneDefinition (.bvar 0)) [x,y]).isNone &&
      (headApply false [false] identityType [x]).isNone do
    throw (IO.userError "Wrong boundary/arity interpreter accepted")
  let some whole := headApply false [] identityValue []
    | throw (IO.userError "Empty interface")
  ensureSame whole identityValue "Empty interface consumed selected lambda"
  let (shifted,_) ← required ((memoSubst #[.bvar 0] (.lam `inner n (.bvar 1) .default)).run {})
  ensureSame shifted (.lam `inner n (.bvar 1) .default) "Capture avoidance"
  unless !(← same shifted (.lam `inner n (.bvar 0) .default)) do
    throw (IO.userError "Captured image accepted")
  unless !(← same identityValue (.lam `x n (.bvar 0) .implicit)) do
    throw (IO.userError "Changed binder flag accepted")
  return Json.mkObj [("status",toJson "PASS"),("refusals",toJson (8 : Nat)),
    ("emptyBoundary",toJson "PASS"),("captureAvoidance",toJson "PASS")]

end ProofAtlas.ContextInstantiationNative

def main (args : List String) : IO UInt32 := do
  let [input,output] := args | throw (IO.userError "Expected input/output paths")
  let bytes ← IO.FS.readFile input
  unless bytes.utf8ByteSize ≤ 64*1024*1024 do throw (IO.userError "Input file bound")
  let packet ← ProofAtlas.SourceRecoveryNative.required (Json.parse bytes)
  let g ← ProofAtlas.SourceRecoveryNative.required (packet.getObjVal? "graph")
  let rows ← ProofAtlas.SourceRecoveryNative.required (AtlasPacketReplay.decode g)
  let cases ← ProofAtlas.SourceRecoveryNative.required (packet.getObjValAs? (Array Json) "cases")
  unless cases.size > 0 && cases.size ≤ 1383 do throw (IO.userError "Complete inventory/control count")
  let mut results : Array Json := #[]
  for c in cases do
    results := results.push (← ProofAtlas.ContextInstantiationNative.runCase rows c)
  let result := Json.mkObj [("status",toJson "PASS"),("cases",toJson results),
    ("rowRoundtrip",ProofAtlas.SourceRecoveryNative.graph rows),
    ("controls",← ProofAtlas.ContextInstantiationNative.controls)]
  IO.FS.writeFile output (result.compress ++ "\n")
  return 0
