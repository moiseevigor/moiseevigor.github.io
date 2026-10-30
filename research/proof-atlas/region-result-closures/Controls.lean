import Lean

/- Authored controls for common-prefix result closures. No original project
   proof source or mathematical formalization is included. -/
namespace AtlasRegionClosureControls
universe u

def siblings (f : Nat → Nat) (x y : Nat) : Nat × Nat :=
  ((fun z : Nat => f z) x, (fun z : Nat => f z) y)

def dependent (P : Nat → Sort u) (f : (n : Nat) → P n → P (n + 1))
    (n : Nat) (p : P n) : P (n + 1 + 1) :=
  let step := f n p
  f (n + 1) step

def proofResults (P Q : Prop) (f : P → Q) (p : P) : Q ∧ Q :=
  ⟨(fun h : P => f h) p, (fun h : P => f h) p⟩

end AtlasRegionClosureControls
