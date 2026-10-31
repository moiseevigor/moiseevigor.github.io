import Lean

/- Authored core-only controls, not mathematical-corpus proof scripts. -/
namespace AtlasExchangeControls
universe u

def computation (f : Nat → Nat) (n : Nat) : Fin (f n) → Nat :=
 let k := f n
 fun i : Fin k => Nat.add k i.val

def dependentResult (f : Nat → Nat) (n : Nat) : Fin (f n) → Fin (f n) :=
 let k := f n
 fun i : Fin k => i

theorem proofInput (P : Nat → Prop) (n : Nat) : P n → P n :=
 let k := n
 fun h : P k => h

theorem proofDefinition (P Q : Prop) (p : P) (f : P → Q) : Q → Q :=
 let q := f p
 fun _ : Q => q

def typeDefinition (A : Type u) : A → A :=
 let T := A
 fun x : T => x

def shadows (x : Nat) (f : Nat → Nat) : Fin (f x) → Nat :=
 let x := f x
 fun x : Fin x => x.val

def implicitInput (f : Nat → Nat) (n : Nat) :=
 let k := f n
 fun {i : Fin k} => Nat.add k i.val

def nestedInput (f : Nat → Nat) (n : Nat) : Fin (f n) → Nat → Nat :=
 let k := f n
 fun i : Fin k => fun n : Nat => Nat.add (Nat.add k i.val) n

def ambientDefinition (n : Nat) : Fin (Nat.succ n) → Nat :=
 let a := Nat.succ n
 let k := a
 fun i : Fin k => Nat.add k i.val

-- Different original domains, identical transported functions. Both bodies
-- use k, so the collision does not rely on deleting the local definition.
def namedDomain (j : Fin 1) : Fin 1 → Nat :=
 let k : Nat := 1
 fun i : Fin k => Nat.add (@Fin.val 1 i) (@Fin.val k j)

def expandedDomain (j : Fin 1) : Fin 1 → Nat :=
 let k : Nat := 1
 fun i : Fin 1 => Nat.add (@Fin.val 1 i) (@Fin.val k j)

end AtlasExchangeControls
