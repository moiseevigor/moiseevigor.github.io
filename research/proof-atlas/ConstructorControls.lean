import Lean
universe u v
namespace AtlasConstructorControl
structure UniverseBox (α : Sort (max u v)) where
 value : α
inductive Indexed (α : Type u) : Nat → Type u where
 | nil : Indexed α 0
 | cons {n : Nat} (head : α) (tail : Indexed α n) : Indexed α (n+1)
def conjunction (P Q : Prop) (p : P) (q : Q) : P ∧ Q := And.intro p q
def left (P Q : Prop) (p : P) : P ∨ Q := Or.inl p
def right (P Q : Prop) (q : Q) : P ∨ Q := Or.inr q
def witness (P : Nat → Prop) (n : Nat) (p : P n) : ∃ n, P n := Exists.intro n p
def reflexive (α : Sort u) (x : α) : x = x := Eq.refl x
def truth : True := True.intro
def zero : Nat := Nat.zero
def successor (n : Nat) : Nat := Nat.succ n
def pair (α : Sort u) (β : Sort v) (a : α) (b : β) : PProd α β := PProd.mk a b
def dependent (P : Nat → Type u) (n : Nat) (x : P n) : Sigma P := Sigma.mk n x
def empty (α : Type u) : Indexed α 0 := Indexed.nil
def indexed (α : Type u) (n : Nat) (x : α) (xs : Indexed α n) : Indexed α (n+1) := Indexed.cons x xs
def collapse (n : Nat) : UniverseBox.{0,1} Nat := @UniverseBox.mk.{0,1} Nat n
def higher (α : Type) : UniverseBox.{1,2} Type := @UniverseBox.mk.{1,2} Type α
def partialConstructor (P : Prop) : ∀ Q : Prop, P → Q → P ∧ Q := @And.intro P
def Pretend.intro (n : Nat) : Nat := n
def wrapped (n : Nat) : Nat := Pretend.intro n
def ProofPretend.intro {P Q : Prop} (p : P) (q : Q) : P ∧ Q := And.intro p q
def wrappedProof {P Q : Prop} (p : P) (q : Q) : P ∧ Q := ProofPretend.intro p q
def sharedScopes : (Nat → Nat) × (Nat → Nat) := (fun x => Nat.succ x, fun y => Nat.succ y)
end AtlasConstructorControl
