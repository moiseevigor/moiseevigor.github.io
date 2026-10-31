import Lean

/- Authored controls, separate from the mathematical corpus. -/
namespace AtlasFrontierControls
universe u
def plain (f : Nat → Nat) (x : Nat) : Nat := Nat.succ (f x)
def nested (f : Nat → Nat) : Nat → Nat := fun n => Nat.succ (f n)
def definition (f : Nat → Nat) (x : Nat) : Nat :=
 let y := f x
 Nat.succ y
theorem proof (P Q : Prop) (f : P → Q) (p : P) : Q := f p
def proofTwins (P : Prop) (p q : P) : PProd P P := ⟨p,q⟩
def dependent (P : Nat → Type u) (n : Nat) (v : P n) : Sigma P := ⟨n,v⟩
def alias (P : Nat → Type u) (n : Nat) : (v : P n) → Sigma P :=
 let k := n
 fun v : P k => ⟨n,v⟩
def siblings (x y : Nat) : (Nat → Nat) × (Nat → Nat) :=
 ((fun n : Nat => Nat.succ n), (fun n : Nat => Nat.succ n))
def typeOutput (F : Unit → Type u) : Type u := F ()
end AtlasFrontierControls
