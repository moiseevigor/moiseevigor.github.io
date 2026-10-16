import Lean
namespace AtlasClosure
universe u
def sameHeader : Nat × Nat := ((fun x : Nat => x) 2, (fun x : Nat => x) 7)
def differentHeader : Nat × Bool := ((fun x : Nat => x) 2, (fun x : Bool => x) true)
def shadowing (x : Nat) : Nat × Nat := ((fun x : Nat => x) x, x)
def dependent (α : Sort u) (x : α) : x = x := Eq.refl x
def dependentReuse : (2 = 2) ∧ (7 = 7) := ⟨(fun x : Nat => Eq.refl x) 2, (fun x : Nat => Eq.refl x) 7⟩
def dependentLet (α : Sort u) (x : α) : x = x := let y : α := x; let h : y = x := Eq.refl x; h
def closedUnderBinder (x : Nat) : Nat × (Bool → Bool) := (x, fun y : Bool => y)
def letBeforeBinder (n : Nat) : Nat := let x := n; (fun x : Nat => x) x
def unusedLet (n : Nat) : Nat := let x := n; 4
def implicit {α : Type u} [Inhabited α] (x : α) : α := x
def sameHeaderLet : Nat × Nat := ((fun x : Nat => let y : Nat := x; y) 2, (fun x : Nat => let y : Nat := x; y) 7)
def differentLet : Nat × Nat := ((fun x : Nat => let y : Nat := 2; y+x) 3, (fun x : Nat => let y : Nat := 7; y+x) 3)
end AtlasClosure
