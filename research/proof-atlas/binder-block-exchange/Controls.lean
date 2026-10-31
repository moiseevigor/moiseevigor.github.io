import Lean

/- Authored controls for composing the local let/input rule. -/
namespace AtlasBlockControls
universe u

def dependentLets (f : Nat → Nat) (n : Nat) :=
 let a := f n
 let b := Nat.succ a
 fun i : Fin b => fun j : Fin (Nat.succ i.val) =>
  Nat.add (Nat.add a b) (Nat.add i.val j.val)

def interleaved (n : Nat) :=
 let a := Nat.succ n
 fun i : Fin a =>
 let b := Nat.succ i.val
 fun j : Fin b => Nat.add a (Nat.add b j.val)

def dependentTypes (A : Type u) (a : A) :=
 let T := A
 let x : T := a
 fun f : T → T => fun g : T → T => g (f x)

def proofAndValue (P : Nat → Prop) (n : Nat) (h : P n) :=
 let k := n
 let p : P k := h
 fun f : P k → Nat => fun i : Fin (Nat.succ (f p)) => i.val

def shadowed (x : Nat) :=
 let x := Nat.succ x
 let x := Nat.succ x
 fun x : Fin x => fun x : Fin (Nat.succ x.val) => x.val

def implicitInputs (n : Nat) :=
 let k := Nat.succ n
 let l := Nat.succ k
 fun {i : Fin k} => fun {j : Fin l} => Nat.add i.val j.val

-- A let with no downstream input must retain its original annotation.
def trailingDefinition (n : Nat) :=
 let k := Nat.succ n
 fun i : Fin k =>
 let r := Nat.add k i.val
 r

-- Negative search control: there is no let/input inversion.
def alreadyOrdered (n : Nat) (i : Fin (Nat.succ n)) :=
 let k := Nat.succ n
 Nat.add k i.val

end AtlasBlockControls
