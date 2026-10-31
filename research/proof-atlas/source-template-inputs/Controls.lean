/- Authored controls, separate from the corpus proof scripts. -/
namespace AtlasSourceTemplateControls
open Lean AtlasLibrary AtlasPacketReplay AtlasRegionKernel AtlasRegionInputs

def natType : Expr := .const ``Nat []
def portVar (i : Nat) : Expr := .fvar ⟨Name.num `sourceTemplateControl i⟩
def input (i : Nat) (domain original : Expr) : Binding :=
  {termVar := portVar i, domain := domain, value := none, originalValue := original,
   metadata := obj [("kind",str "input"),("call",nat 0),("slot",nat i),("source",Json.null)]}
def equalNat (a b : Expr) : Expr := mkApp3 (.const ``Eq [.succ .zero]) natType a b
def addNat (a b : Expr) : Expr := mkApp2 (.const ``Nat.add []) a b
def ensure (condition : Bool) (message : String) : IO Unit :=
  unless condition do throw <| IO.userError message
def make (env : Environment) (bindings : Array Binding) : IO (IO.Ref ConstraintState) := do
  IO.mkRef ({context := (← rebuildContext env {} bindings), bindings := bindings} : ConstraintState)
def snapshot (name : String) (s : ConstraintState) (graph : Json := Json.null) : Json :=
  obj [("name",str name),("constraints",toJson s.records),("permutations",toJson s.permutations),
    ("bindings",scopedBindingDirectory #[] s.bindings),("graph",graph)]

def run (env : Environment) : IO Json := do
  let zero := mkNatLit 0
  let seventeen := mkNatLit 17
  let mut rows : Array Json := #[]
  let forward ← make env #[input 0 natType zero,input 1 natType zero]
  ensure (← deriveInput env {} #[] forward 0 0 0 (portVar 1)) "Forward value could not be ordered"
  let s ← forward.get
  ensure (s.bindings.map bindingKey == #[bindingKey (input 1 natType zero),bindingKey (input 0 natType zero)]) "Forward order"
  ensure (s.permutations.size == 1) "Missing forward permutation"
  let function := closeBindings s.bindings (portVar 0)
  let expected ← typeOf env {} function
  let restored := .app function zero
  ensure ((Kernel.isDefEq env {} restored zero).toOption == some true) "Forward recovery"
  rows := rows.push <| snapshot "forward-value-order" s (AtlasPacketReplay.graph #[function,expected,restored,zero])
  let a := input 0 (.sort (.succ .zero)) natType
  let x := input 1 (portVar 0) zero
  let b := input 2 (.sort (.succ .zero)) natType
  let y := input 3 (portVar 2) zero
  let dependent ← make env #[a,x,b,y]
  ensure (← deriveInput env {} #[] dependent 0 0 2 (portVar 0)) "Type equation"
  ensure (← deriveInput env {} #[] dependent 0 0 1 (portVar 3)) "Dependent forward value"
  let s ← dependent.get
  ensure (s.bindings.map bindingKey == #[bindingKey a,bindingKey b,bindingKey y,bindingKey x]) "Domain dependencies were not ordered"
  let function := closeBindings s.bindings (portVar 1)
  let type ← typeOf env {} function
  let restored := mkApp2 function natType zero
  atType env {} restored natType
  ensure ((Kernel.isDefEq env {} restored zero).toOption == some true) "Dependent recovery"
  rows := rows.push <| snapshot "dependent-domain-order" s (AtlasPacketReplay.graph #[function,type,restored,zero])
  let circularResult : Binding := {termVar := portVar 1, domain := natType, value := some (portVar 0), originalValue := zero, metadata := obj [("kind",str "result"),("call",nat 1)]}
  let cycle ← make env #[input 0 natType zero,circularResult]
  ensure (!(← deriveInput env {} #[] cycle 0 0 0 (portVar 1))) "A cyclic definition was accepted"
  ensure ((← cycle.get).records.isEmpty && (← cycle.get).permutations.isEmpty) "Cycle changed state"
  rows := rows.push <| obj [("name",str "cycle-refused"),("refusal",(← cycle.get).refusal)]
  let fnType := Expr.forallE `z natType natType .default
  for (name,shared,shadow) in #[("source-lambda",false,false),("shadowed-lambda",false,true),("shared-lambda",true,false)] do
    let mut body := seventeen
    if shared then
      for _ in [:80] do body := addNat body body
    body := addNat body (.bvar 0)
    let mut original := Expr.lam `z natType body .default
    let mut domain := fnType
    if shadow then
      original := .lam `z natType original .default
      domain := .forallE `z natType domain .default
    let state ← make env #[input 0 natType seventeen,input 1 domain original]
    let initial ← state.get
    let (value,plan) ← makeTemplate env {} #[] initial 1
    atType env initial.context value domain
    ensure (← deriveInput env {} #[] state 0 0 1 value) (name ++ " did not recover its source")
    let current ← state.get
    let function := closeBindings current.bindings (portVar 1)
    let type ← typeOf env {} function
    ensure ((Kernel.isDefEq env {} (.app function seventeen) original).toOption == some true) (name ++ " complete function recovery")
    let states ← required <| plan.getObjValAs? Nat "storedStates"
    if shared then ensure (states >= 160 && states <= 256) "Shared source template cache did not retain composite rows"
    rows := rows.push <| (snapshot name current (AtlasPacketReplay.graph #[original,value.abstract #[portVar 0],function,type])).mergeObj
      (obj [("template",plan),("sourceFunctionConversion",str "PASS")])
  let original := Expr.lam `z natType (addNat seventeen (.bvar 0)) .default
  let duplicates ← make env #[input 0 natType seventeen,input 1 natType seventeen,input 2 fnType original]
  let mut ambiguous := false
  let mut ambiguityReason := ""
  try
    let _ ← makeTemplate env {} #[] (← duplicates.get) 2
    pure ()
  catch error =>
    ambiguous := true
    ambiguityReason := error.toString
  ensure (ambiguityReason == "ambiguous-source-value-pattern") "Duplicate refusal had another cause"
  ensure ambiguous "Ambiguous duplicate source values were silently identified"
  rows := rows.push <| obj [("name",str "ambiguous-source-values-refused"),("refused",toJson true),("refusalReason",str ambiguityReason)]
  ensure (← deriveInput env {} #[] duplicates 0 0 1 (portVar 0)) "Coherent duplicate equation"
  let (value,plan) ← makeTemplate env {} #[] (← duplicates.get) 2
  ensure (← deriveInput env {} #[] duplicates 0 0 2 value) "Coherent duplicate template"
  rows := rows.push <| (snapshot "coherent-source-values" (← duplicates.get)).mergeObj (obj [("template",plan)])
  let sourceFamily := Expr.lam `z natType (equalNat (.bvar 0) (.bvar 0)) .default
  let constantFamily := Expr.lam `z natType (equalNat zero zero) .default
  let familyType := Expr.forallE `z natType (.sort .zero) .default
  let sourceGuard ← make env #[input 0 familyType sourceFamily]
  atType env {} sourceFamily familyType
  atType env {} constantFamily familyType
  ensure ((Kernel.isDefEq env {} (.app sourceFamily zero) (.app constantFamily zero)).toOption == some true) "Source families should agree at zero"
  ensure (!(← deriveInput env {} #[] sourceGuard 0 0 0 constantFamily)) "Constant motive lost source family"
  rows := rows.push <| obj [("name",str "constant-family-refused"),("refusal",(← sourceGuard.get).refusal),
    ("graph",AtlasPacketReplay.graph #[sourceFamily,constantFamily,familyType])]
  for (name,value) in #[("source-value-refused",mkNatLit 1),("wrong-type-refused",Expr.sort .zero),("unknown-binding-refused",portVar 99)] do
    let state ← make env #[input 0 natType zero]
    ensure (!(← deriveInput env {} #[] state 0 0 0 value)) name
    ensure ((← state.get).records.isEmpty) (name ++ " changed state")
    rows := rows.push <| obj [("name",str name),("refusal",(← state.get).refusal)]
  let generic := #[input 0 (.sort (.succ .zero)) natType,input 1 (.sort (.succ .zero)) natType]
  let telescope ← make env generic
  let actual := Expr.forallE `z natType natType .default
  let expected := Expr.forallE `z (portVar 0) (portVar 1) .default
  ensure (← solveConstraint env {} #[] telescope 0 0 actual expected) "Closed telescope domain/codomain alignment"
  rows := rows.push <| snapshot "closed-telescope-alignment" (← telescope.get)
  return obj [("format",str "ProofAtlasSourceTemplateControls/1"),("status",str "PASS"),
    ("namespace",str "authored-source-template-controls"),("records",toJson rows)]

end AtlasSourceTemplateControls
