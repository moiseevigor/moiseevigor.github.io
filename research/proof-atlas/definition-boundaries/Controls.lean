import Lean

/- Authored core-only interface controls. -/
namespace AtlasDefinitionControls
universe u

def branchJoin (f g : Nat → Nat) (n : Nat) :=
 let external := Nat.succ n
 let a := f external
 let b := g external
 let out := Nat.add a b
 out

def interleaved (f : Nat → Nat) (n : Nat) :=
 let a := f n
 let b := Nat.succ a
 let c := Nat.add a b
 fun h : Fin c => Nat.add c h.val

def dependentPort (n : Nat) :=
 let k := Nat.succ n
 let i : Fin k := ⟨0, Nat.zero_lt_succ n⟩
 Nat.add k i.val

def proofBoundary (P Q : Prop) (h : P) (f : P → Q) :=
 let p : P := h
 let q : Q := f p
 q

def dependentProof (n : Nat) :=
 let k := Nat.succ n
 let p : 0 < k := Nat.zero_lt_succ n
 p

def shadowPorts (x : Nat) :=
 let x := Nat.succ x
 let x := Nat.succ x
 let x := Nat.add x x
 x

def multipleBoundary (n : Nat) :=
 let k := Nat.succ n
 let i : Fin k := ⟨0, Nat.zero_lt_succ n⟩
 let j : Fin (Nat.succ i.val) := ⟨0, Nat.zero_lt_succ i.val⟩
 let r := Nat.add i.val j.val
 r

def universePort (A : Type u) (a : A) :=
 let T := A
 fun x : T => x

-- The promoted interfaces coincide, while specialization values differ.
def oneBoundary :=
 let k : Nat := 1
 fun i : Fin k => Nat.add k i.val

def twoBoundary :=
 let k : Nat := 2
 fun i : Fin k => Nat.add k i.val

-- Both source terms type-check. Unconstrained promotion must fail.
def fixedIndex (h : 0 < 1) :=
 let k : Nat := 1
 (⟨0, h⟩ : Fin k)

def typeAlias :=
 let T := Nat
 fun x : T => Nat.succ x

end AtlasDefinitionControls
