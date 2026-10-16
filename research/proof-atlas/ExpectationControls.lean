/- Appended to the core constructor fixture; these are our synthetic scope controls. -/
namespace AtlasConstructorControl
def nestedDomain (n : Nat) (h : ∀ x : Nat, x = n → x = n) :
    (∀ x : Nat, x = n → x = n) ∧ True := And.intro h True.intro
def letDomain (n : Nat) (h : let x := n; x = x) :
    (let x := n; x = x) ∧ True := And.intro h True.intro
def localWitness (P : Nat → Prop) (n : Nat) (h : P n) : ∃ x, P x :=
  let m := n
  Exists.intro m (show P m from h)
def shadowed (x : Nat) : Nat → Nat := fun x => Nat.succ x
def dependentFunction (P : Nat → Type u) (n : Nat) (h : ∀ m, P m) : Sigma P :=
  Sigma.mk n (h n)
def sharedDependentScopes : PProd (∀ x : Nat, x = x) (∀ y : Nat, y = y) :=
  PProd.mk (fun x : Nat => Eq.refl x) (fun y : Nat => Eq.refl y)
end AtlasConstructorControl
