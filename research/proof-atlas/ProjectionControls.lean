import Lean
open Lean Elab Command Meta
universe u
namespace AtlasProjectionControl
structure Pack where
  α : Type u
  value : α
  proof : value = value
structure Base (α : Type u) where
  value : α
structure Child (α : Type u) extends Base α where
  count : Nat
structure Nested (α : Type u) where
  inner : Base α
structure FunBox where
  function : Nat → Nat
inductive Solo (α : Type u) where
  | pack (value : α) : Solo α
def namedWrapper (s : Base Nat) : Nat := s.value
run_cmd liftTermElabM do
 let arrow (a b : Expr) := Expr.forallE Name.anonymous a b BinderInfo.default
 let nat := mkConst ``Nat
 let base := mkApp (mkConst ``Base [Level.zero]) nat
 let funType := arrow base nat
 let left := mkLambda `x .default base (.proj ``Base 0 (.bvar 0))
 let right := mkLambda `y .default base (.proj ``Base 0 (.bvar 0))
 let pairType := mkApp2 (mkConst ``Prod [Level.zero,Level.zero]) funType funType
 let pair := mkApp4 (mkConst ``Prod.mk [Level.zero,Level.zero]) funType funType left right
 let localBody := mkLambda `s .default base (.letE `local base (.bvar 0) (.proj ``Base 0 (.bvar 0)) false)
 let metadata := mkLambda `s .default base (.proj ``Base 0 (.mdata {} (.bvar 0)))
 let truth := mkConst ``True
 let conjunction := mkApp2 (mkConst ``And) truth truth
 let proof := mkLambda `s .default conjunction (.proj ``And 0 (.bvar 0))
 let solo := mkApp (mkConst ``Solo [Level.zero]) nat
 let unregistered := mkLambda `s .default solo (.proj ``Solo 0 (.bvar 0))
 for (name,type,value) in [(`AtlasProjectionControl.shared,pairType,pair),
    (`AtlasProjectionControl.localDefinition,funType,localBody),
    (`AtlasProjectionControl.annotated,funType,metadata),
    (`AtlasProjectionControl.proofField,arrow conjunction truth,proof),
    (`AtlasProjectionControl.unregistered,arrow solo nat,unregistered)] do
  addDecl (.defnDecl {name,levelParams:=[],type,value,hints:=.abbrev,safety:=.safe})
 let mut huge := Expr.bvar 0
 for _ in [:80] do huge := mkApp2 (mkConst ``Nat.add) huge huge
 let operand := mkApp2 (mkConst ``Base.mk [Level.zero]) nat huge
 let projected := mkLambda `n .default nat (.proj ``Base 0 operand)
 addDecl (.defnDecl {name:=`AtlasProjectionControl.hugeProjection,levelParams:=[],type:=arrow nat nat,value:=projected,hints:=.abbrev,safety:=.safe})
 let reflexive := mkApp2 (mkConst ``Eq.refl [Level.succ Level.zero]) nat huge
 let dependentOperand := mkApp3 (mkConst ``Pack.mk [Level.zero]) nat huge reflexive
 let proposition := mkApp3 (mkConst ``Eq [Level.succ Level.zero]) nat huge huge
 addDecl (.thmDecl {name:=`AtlasProjectionControl.hugeProofProjection,levelParams:=[],type:=Expr.forallE `n nat proposition .default,value:=mkLambda `n .default nat (.proj ``Pack 2 dependentOperand)})
 let validOperand := mkApp2 (mkConst ``Base.mk [Level.zero]) nat (mkNatLit 0)
 match Kernel.check (← getEnv) {} (.proj ``Base 0 validOperand) with
 | .ok _ => pure ()
 | .error _ => throwError "Valid projection control rejected"
 for bad in [Expr.proj ``Base 2 validOperand, Expr.proj ``Child 0 validOperand,
    Expr.proj ``Nat 0 (mkNatLit 0)] do
  match Kernel.check (← getEnv) {} bad with
  | .error _ => pure ()
  | .ok _ => throwError "Invalid projection control accepted"
end AtlasProjectionControl
