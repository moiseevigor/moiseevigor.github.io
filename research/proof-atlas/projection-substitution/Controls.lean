/- Own raw-syntax controls. Projection.samples is the unchanged 23-shape
   constructor/payload fixture from context-projection/Fixtures.lean. -/
namespace ProofAtlas.ProjectionFusionControls
open Lean Elab Command ProofAtlas.Projection

def mappings : Array (Array (Option Nat)) := Id.run do
  let mut maps := #[]
  for code in [:64] do
    maps := maps.push <| (List.range 12).toArray.map fun i =>
      if i < 3 then let digit := code / 4^i % 4; if digit == 3 then none else some digit
      else none
  maps := maps.push <| (List.range 12).toArray.map some
  maps := maps.push <| (List.range 12).toArray.map (fun i => some (i+2))
  maps := maps.push <| (List.range 12).toArray.map (fun _ => some 0)
  return maps

def record (es : Array (Option Expr)) (initial : AtlasLibrary.Shared) :
    Array Json × AtlasLibrary.Shared := Id.run do
  let mut s := initial
  let mut roots := #[]
  for e in es do
    match e with
    | none => roots := roots.push Json.null
    | some e =>
      let (root,next) := AtlasLibrary.intern e s
      s := next
      roots := roots.push (toJson root)
  return (roots,s)

def same (a b : Option Expr) : Bool :=
  match a,b with
  | none,none => true
  | some a,some b => (⟨a⟩ : ExprStructEq) == ⟨b⟩
  | _,_ => false

def wrap (e : Expr) : Nat → Expr
  | 0 => e
  | d+1 => .lam `scope (.const ``Nat []) (wrap e d) .default

def peel (e : Expr) : Nat → Option Expr
  | 0 => some e
  | d+1 => match e with | .lam _ _ b _ => peel b d | _ => none

def closeNat (e : Expr) : Expr :=
  .lam `a (.const ``Nat []) (.lam `unused (.const ``Nat []) e .default) .default

def closeDependent (e : Expr) : Expr :=
  .lam `A (.sort (.succ .zero))
    (.lam `unused (.const ``Nat []) (.lam `a (.bvar 1) e .default) .default) .default

syntax "#atlas_projection_fusion " str : command
elab_rules : command
  | `(#atlas_projection_fusion $output:str) => do
    let mut laws : Array Json := #[]
    for name in [``project_lift,``project_substitute,``project_instantiate,
        ``unused_replacement_counterexample] do
      let .thmInfo value ← getConstInfo name | throwError "Expected theorem"
      let env ← getEnv
      for e in [value.type,value.value,
          mkApp (mkLambda `expected .default value.type (.bvar 0)) value.value] do
        let .ok _ := Kernel.check env {} e | throwError "Kernel rejected fusion theorem"
      let axioms ← collectAxioms name
      unless axioms.all (fun a => a == ``propext || a == ``Quot.sound) do
        throwError "Unexpected fusion axiom: {axioms}"
      let text ← liftTermElabM fun _ => return (← ppExpr value.type).pretty
      laws := laws.push <| Json.mkObj [("name",toJson name.toString),("type",toJson text),
        ("axioms",toJson (axioms.map Name.toString)),("kernelType",toJson "PASS"),
        ("kernelProof",toJson "PASS"),("kernelExpectedTypeConversion",toJson "PASS")]
    let values := #[Expr.bvar 0,.app (.bvar 0) (.bvar 2),
      .lam `inside (.const ``Nat []) (.app (.bvar 0) (.bvar 2)) .implicit,
      mkNatLit 7,Expr.fvar ⟨Name.num `free 2⟩]
    let mut pool : AtlasLibrary.Shared := {}
    let mut lifts : Array Json := #[]
    let mut substitutions : Array Json := #[]
    for c in [:4] do
      -- Keep ambient indices above every tested cutoff, so missing support
      -- is exercised on the expression as well as on its replacement.
      let es := ProofAtlas.Projection.samples 4
      for mi in [:mappings.size] do
        let mapping := mappings[mi]!
        let r : Renaming := fun i => (mapping[i]?).join
        for ei in [:es.size] do
          let e := es[ei]!.2
          for k in [0,1,3] do
            let direct := AtlasExprReference.lift e k c
            let native := e.liftLooseBVars c k
            unless same (some direct) (some native) do throwError "Native lift mismatch"
            let before := project (liftN c r) e
            let left := project (liftN (c+k) r) direct
            let right := before.map (fun e' => AtlasExprReference.lift e' k c)
            unless same left right do throwError "Lift square mismatch"
            let (roots,next) := record #[some e,before,some direct,some native,left,right] pool
            pool := next
            lifts := lifts.push <| toJson (#[toJson mi,toJson c,toJson ei,toJson k,toJson roots])
          for vi in [:values.size] do
            let v := values[vi]!
            let pv := project r v
            let direct := AtlasExprReference.substitute e v c
            let some native := peel ((wrap e c).instantiate1 v) c | throwError "Native scope peel"
            unless same (some direct) (some native) do throwError "Native substitution mismatch"
            let before := project (liftN (c+1) r) e
            let left := project (liftN c r) direct
            let right := pv.bind fun v' => before.map fun e' => AtlasExprReference.substitute e' v' c
            if pv.isSome then
              unless same left right do throwError "Substitution square mismatch"
            let (roots,next) := record #[some e,some v,pv,before,some direct,some native,left,right] pool
            pool := next
            substitutions := substitutions.push <| toJson (#[toJson mi,toJson c,toJson ei,toJson vi,toJson roots])
    let mut typed : Array Json := #[]
    for dependent in [false,true] do
      let nat := Expr.const ``Nat []
      let e := if dependent then Expr.lam `y (.bvar 3) (.bvar 1) .default
        else mkApp2 (mkConst ``Nat.add) (.bvar 0) (.bvar 2)
      let v := Expr.bvar (if dependent then 0 else 1)
      let mapping : Array (Option Nat) := if dependent then #[some 0,none,some 1] else #[none,some 0]
      let r : Renaming := fun i => (mapping[i]?).join
      let some pv := project r v | throwError "Typed replacement projection"
      let some pe := project (lift r) e | throwError "Typed body projection"
      let after := AtlasExprReference.substitute e v 0
      let some left := project r after | throwError "Typed result projection"
      let right := AtlasExprReference.substitute pe pv 0
      unless same (some left) (some right) do throwError "Typed square"
      let full := if dependent then closeDependent else closeNat
      let original := full <| .app (.lam `x (if dependent then .bvar 2 else nat) e .default) v
      let originalAfter := full after
      let reduced := if dependent then
        Expr.lam `A (.sort (.succ .zero)) (.lam `a (.bvar 0) right .default) .default
        else Expr.lam `a nat right .default
      let adapter := full <| if dependent then mkApp2 reduced (.bvar 2) (.bvar 0) else .app reduced (.bvar 1)
      let env ← getEnv
      let mut types : Array (Option Expr) := #[]
      for term in [original,originalAfter,reduced,adapter] do
        let .ok type := Kernel.check env {} term | throwError "Typed control rejected"
        let .ok _ := Kernel.check env {} type | throwError "Typed control type rejected"
        types := types.push (some type)
      for term in [originalAfter,adapter] do
        let .ok true := Kernel.isDefEq env {} original term | throwError "Typed recovery conversion"
      let (expected,witness) ← liftTermElabM fun _ => do
        return (← Meta.mkEq original adapter, ← Meta.mkEqRefl original)
      let .ok _ := Kernel.check env {} expected | throwError "Typed equality type rejected"
      let .ok _ := Kernel.check env {} witness | throwError "Typed equality proof rejected"
      let .ok _ := Kernel.check env {} (mkApp (mkLambda `expected .default expected (.bvar 0)) witness)
        | throwError "Typed recovery witness rejected at expected equality"
      let (roots,next) := record (#[some e,some v,some pe,some pv,some after,some left,some right,
        some original,some originalAfter,some reduced,some adapter,some expected,some witness] ++ types) pool
      pool := next
      typed := typed.push <| Json.mkObj [("label",toJson (if dependent then "dependent-family" else "Nat-value")),
        ("mapping",toJson mapping),("roots",toJson roots),("kernelTyping",toJson "PASS"),
        ("kernelRecoveryConversion",toJson "PASS"),("kernelEqualityWitness",toJson "PASS")]
    let graph := Json.mkObj [("serialization",toJson "ExprDAG/1"),
      ("kind",toJson pool.kind),("children",toJson pool.children),("payloads",toJson pool.payloads),
      ("expanded",toJson (pool.expanded.map (toString ·))),("neededScope",toJson pool.neededScope)]
    liftIO <| IO.FS.writeFile output.getString (Json.mkObj [
      ("format",toJson "ProofAtlasProjectionFusionControls/1"),("laws",toJson laws),
      ("maps",toJson mappings),("sampleLabels",toJson ((ProofAtlas.Projection.samples 0).map Prod.fst)),
      ("graph",graph),("lifts",toJson lifts),("substitutions",toJson substitutions),
      ("typedControls",toJson typed),
      ("typingClaim",toJson false),("generalNativeRefinementClaim",toJson false)]).compress
end ProofAtlas.ProjectionFusionControls
