/- Authored controls for the assignment rule, not original project proofs. -/
namespace AtlasBoundaryControls
open Lean AtlasLibrary AtlasPacketReplay AtlasRegionKernel AtlasRegionInputs

def zero : Expr := mkNatLit 0
def one : Expr := mkNatLit 1
def natType : Expr := .const ``Nat []
def equalNat (a b : Expr) : Expr := mkApp3 (.const ``Eq [.succ .zero]) natType a b
def portVar (i : Nat) : Expr := .fvar ⟨Name.num `boundaryControl i⟩
def input (i : Nat) (domain original : Expr) : Binding :=
  {termVar := portVar i, domain := domain, value := none, originalValue := original,
   metadata := obj [("kind",str "input"),("call",nat 0),("slot",nat i),("source",Json.null)]}

def ensure (p : Bool) (message : String) : IO Unit :=
  unless p do throw <| IO.userError message

def run (env : Environment) : IO Json := do
  let mut records : Array Json := #[]
  let simple := #[input 0 natType zero,input 1 natType zero]
  let make (bindings : Array Binding) := do
    IO.mkRef ({context := (← rebuildContext env {} bindings), bindings := bindings} : ConstraintState)
  let success ← make simple
  let solved ← solveConstraint env {} #[] success 0 0 (portVar 0) (portVar 1)
  let state ← success.get
  ensure (solved && state.records.size == 1 && state.bindings[0]!.value.isNone && state.bindings[1]!.value.isSome) "Later-input orientation"
  let function := closeBindings state.bindings (portVar 1)
  let inferred ← typeOf env {} function
  let restored := .app function zero
  atType env {} restored natType
  ensure ((Kernel.isDefEq env {} restored zero).toOption == some true) "Control recovery"
  records := records.push <| obj [("name",str "later-input-equation"),("accepted",toJson true),
    ("constraints",toJson state.records),("graph",AtlasPacketReplay.graph #[function,inferred,restored,zero])]
  let propBindings := #[input 0 natType zero,input 1 (.sort .zero) (equalNat zero zero)]
  let prop ← make propBindings
  let formula := equalNat (portVar 0) (portVar 0)
  ensure (← solveConstraint env {} #[] prop 0 0 formula (portVar 1)) "Proposition boundary equation"
  let propState ← prop.get
  let propFunction := closeBindings propState.bindings (portVar 1)
  let propType ← typeOf env {} propFunction
  records := records.push <| obj [("name",str "derived-proposition"),("accepted",toJson true),
    ("constraints",toJson propState.records),("graph",AtlasPacketReplay.graph #[propFunction,propType])]
  for (name,index,value) in #[
      ("source-value-mismatch",0,one),
      ("wrong-assignment-type",0,Expr.sort .zero),
      ("future-binding",0,portVar 1),
      ("self-reference",0,portVar 0)] do
    let state ← make simple
    ensure (!(← deriveInput env {} #[] state 0 0 index value)) name
    let after ← state.get
    ensure (after.records.isEmpty && after.bindings.all (·.value.isNone)) (name ++ " changed state")
    records := records.push <| obj [("name",str name),("accepted",toJson false),("refusal",after.refusal)]
  let originalFamily := Expr.lam `n natType (equalNat (.bvar 0) (.bvar 0)) .default
  let constantFamily := Expr.lam `n natType (equalNat zero zero) .default
  let familyType := Expr.forallE `n natType (.sort .zero) .default
  atType env {} originalFamily familyType
  atType env {} constantFamily familyType
  ensure ((Kernel.isDefEq env {} (.app originalFamily zero) (.app constantFamily zero)).toOption == some true) "Families agree at original argument"
  ensure ((Kernel.isDefEq env {} originalFamily constantFamily).toOption == some false) "Distinct source families"
  let family ← make #[input 0 familyType originalFamily]
  ensure (!(← deriveInput env {} #[] family 0 0 0 constantFamily)) "Constant family replaced original function"
  records := records.push <| obj [("name",str "constant-family-source-mismatch"),("accepted",toJson false),
    ("sameOriginalApplication",toJson true),("differentSourceFunctions",toJson true),
    ("refusal",(← family.get).refusal),("graph",AtlasPacketReplay.graph #[originalFamily,constantFamily,familyType,
      .app originalFamily zero,.app constantFamily zero])]
  for (name,steps,depth) in #[("work-bound",4096,0),("depth-bound",0,65)] do
    let state ← make simple
    state.modify fun s => {s with steps := steps}
    ensure (!(← solveConstraint env {} #[] state 0 0 (portVar 0) (portVar 1) depth)) name
    ensure ((← state.get).records.isEmpty) (name ++ " added constraint")
    records := records.push <| obj [("name",str name),("accepted",toJson false),("refusal",(← state.get).refusal)]
  return obj [("format",str "ProofAtlasBoundaryConstraintControls/1"),("status",str "PASS"),
    ("namespace",str "authored-boundary-controls"),("records",toJson records)]

end AtlasBoundaryControls
