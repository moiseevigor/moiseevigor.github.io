/- Raw syntax controls. These are not asserted to be well-typed proof terms. -/
namespace AtlasExprReferenceControls
open Lean Elab Command AtlasExprReference AtlasExprReferenceBridge

def samples : Array Expr := Id.run do
 let nat := Expr.const `Nat []
 let md := KVMap.empty.setBool (Name.num `source 7) true
 let u := Level.imax (.param `u) (.max (.mvar ⟨`unresolved⟩) .zero)
 let base := #[Expr.bvar 0,.bvar 1,.bvar 4,.fvar ⟨Name.num `free 2⟩,.mvar ⟨Name.num `meta 3⟩,
  .sort u,.const (Name.num `Constant 4) [u],.lit (.natVal 7),.lit (.strVal "a\"b")]
 let shapes := #[Expr.app (.bvar 0) (.bvar 2),
  .lam `x nat (.app (.bvar 0) (.bvar 1)) .implicit,
  .forallE `x (.bvar 0) (.app (.bvar 1) (.bvar 2)) .instImplicit,
  .letE `x (.bvar 0) (.bvar 1) (.app (.bvar 0) (.bvar 2)) false,
  .letE `x (.bvar 0) (.bvar 1) (.app (.bvar 0) (.bvar 2)) true,
  .mdata md (.app (.bvar 0) (.bvar 3)),
  .proj (Name.num `Structure 2) 3 (.app (.bvar 0) (.bvar 2)),
  .lam `x nat (.letE `x nat (.bvar 0) (.lam `x nat (.app (.bvar 0) (.bvar 3)) .strictImplicit) false) .default]
 return base++shapes

def wrap (e : Expr) (depth : Nat) : Expr :=
 match depth with
 | 0 => e
 | n+1 => .lam `scope (.const `Nat []) (wrap e n) .default

def peel (e : Expr) (depth : Nat) : Except String Expr :=
 match depth,e with
 | 0,_ => return e
 | n+1,.lam _ _ body _ => peel body n
 | _,_ => throw "Control scope wrapper"

syntax "#atlas_expr_reference_controls " str : command
elab_rules : command
 | `(#atlas_expr_reference_controls $output:str) => do
  let original := samples
  let values := #[Expr.bvar 0,.app (.bvar 0) (.bvar 2),.lam `inside (.const `Nat []) (.app (.bvar 0) (.bvar 2)) .default]
  let mut components := original++values
  let mut lifts : Array Json := #[]
  let mut swaps : Array Json := #[]
  let mut substitutions : Array Json := #[]
  for i in [:original.size] do
   let e := original[i]!
   for cutoff in [:4] do
    for amount in [0,1,3] do
     let direct := lift e amount cutoff
     let native := e.liftLooseBVars cutoff amount
     let (memo,states) ← required <| memoLift e amount cutoff
     let _ ← required <| equal direct native "all-constructor lift"
     let _ ← required <| equal direct memo "all-constructor memo lift"
     unless size direct==size e do throwError "Control lift size"
     let coefficients := (List.range 12).map fun target => toString (uses direct target)
     let root := components.size
     components := components.push direct
     lifts := lifts.push <| Json.mkObj [("root",toJson root),("sample",toJson i),("amount",toJson amount),("cutoff",toJson cutoff),("coefficients",toJson coefficients),("size",toJson (toString (size direct))),("states",toJson states)]
   for depth in [:4] do
    let direct := swap e depth
    let native ← required <| peel (nativeSwap (wrap e depth)) depth
    let (memo,states) ← required <| memoSwap e depth
    let _ ← required <| equal direct native "all-constructor swap"
    let _ ← required <| equal direct memo "all-constructor memo swap"
    let _ ← required <| equal (swap direct depth) e "all-constructor swap inverse"
    unless size direct==size e do throwError "Control swap size"
    let root := components.size
    components := components.push direct
    swaps := swaps.push <| Json.mkObj [("root",toJson root),("sample",toJson i),("depth",toJson depth),("coefficients",toJson ((List.range 12).map fun target => toString (uses direct target))),("size",toJson (toString (size direct))),("states",toJson states)]
    for j in [:values.size] do
     let value := values[j]!
     let direct := substitute e value depth
     let native ← required <| peel ((wrap e depth).instantiate1 value) depth
     let _ ← required <| equal direct native "all-constructor substitution"
     if depth==0 then
      let (memo,_) ← required <| memoSubstitute e value
      let _ ← required <| equal direct memo "all-constructor memo substitution"
     unless size direct+uses e depth==size e+uses e depth*size value do throwError "Control substitution size"
     let root := components.size
     components := components.push direct
     substitutions := substitutions.push <| Json.mkObj [("root",toJson root),("sample",toJson i),("value",toJson j),("depth",toJson depth),("coefficients",toJson ((List.range 12).map fun target => toString (uses direct target))),("size",toJson (toString (size direct)))]
  let a := Expr.lam `first (.const `Nat []) (.bvar 0) .default
  let b := Expr.lam `second (.const `Nat []) (.bvar 0) .default
  unless a==b do throwError "Alpha-equality control"
  let .error _ := equal a b "binder names" | throwError "Raw equality must retain names"
  let .error _ := equal a (.lam `first (.const `Nat []) (.bvar 0) .implicit) "annotation" | throwError "Raw equality must retain annotations"
  let .error _ := memoSwap (.bvar 0) 513 | throwError "Rewrite scope bound control"
  let graph := AtlasPacketReplay.graph components
  let result := Json.mkObj [("format",toJson "ProofAtlasExprReferenceControls/1"),("graph",graph),("sampleCount",toJson original.size),("valueCount",toJson values.size),("lifts",toJson lifts),("swaps",toJson swaps),("substitutions",toJson substitutions),("rawEqualityRefusals",toJson (2:Nat)),("depthRefusals",toJson (1:Nat)),("typedProofs",toJson false),("laws",← auditLaws)]
  liftIO <| IO.FS.writeFile output.getString result.compress
end AtlasExprReferenceControls
