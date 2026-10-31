/- Authored calibration inputs, not excerpts from private proof projects. -/
namespace AtlasDependentRegion

def finSuccessor (n : Nat) (x : Fin (Nat.succ n)) : Fin (Nat.succ (Nat.succ n)) :=
  let k := Nat.succ n
  @Fin.succ k x

def finConstructor (n a : Nat) (h : a < Nat.succ n) : Fin (Nat.succ n) :=
  let k := Nat.succ n
  @Fin.mk k a h

theorem proofAfter (n a : Nat) (h : a < Nat.succ n) : a ≤ Nat.succ n :=
  let k := Nat.succ n
  @Nat.le_of_lt a k h

theorem proofDiamond (n a : Nat) (h : a < Nat.succ n) :
    (a ≤ Nat.succ n) ∧ (a < Nat.succ (Nat.succ n)) :=
  let k := Nat.succ n
  And.intro (@Nat.le_of_lt a k h) (@Nat.lt_succ_of_lt a k h)

end AtlasDependentRegion
