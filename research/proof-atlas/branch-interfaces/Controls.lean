/- Publicly authored controls: methods deliberately have no source lambdas. -/
namespace AtlasMethodControls
universe u
def disjunction (P Q C : Prop) (major : P ∨ Q) (left : P → C) (right : Q → C) : C :=
 Or.casesOn major left right
def conjunction (P Q C : Prop) (major : P ∧ Q) (method : P → Q → C) : C :=
 And.casesOn major method
def dependent (n : Nat) (P : Nat → Sort u) (zero : P 0)
    (step : ∀ n, P n → P (n+1)) : P n := Nat.rec zero step n
def functionValued (n : Nat) (zero : Nat → Nat)
    (step : Nat → (Nat → Nat) → Nat → Nat) : Nat → Nat :=
 Nat.rec zero step n
end AtlasMethodControls

namespace AtlasMethodControls
def storedMethod (P Q C : Prop) (major : P ∧ Q) (method : P → Q → C) : C :=
 let stored := method
 And.casesOn major (id stored)
end AtlasMethodControls
