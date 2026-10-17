/- Ordered syntactic context closure. No typing or logical-necessity theorem. -/
import Lean
namespace ProofAtlas.ContextClosure
abbrev Dependencies := Nat → List Nat

def close (deps : Dependencies) : Nat → List Nat → List Nat
 | 0, seeds => seeds
 | d+1, seeds => close deps d (if d ∈ seeds then seeds ++ deps d else seeds)

def Earlier (deps : Dependencies) : Prop := ∀ j k, k ∈ deps j → k < j

def Includes (a b : List Nat) : Prop := ∀ i ∈ a, i ∈ b

def Closed (deps : Dependencies) (xs : List Nat) : Prop := ∀ j ∈ xs, ∀ k ∈ deps j, k ∈ xs

def Bounded (xs : List Nat) (d : Nat) : Prop := ∀ i ∈ xs, i < d

theorem close_preserves : Includes seeds (close deps d seeds) := by
 induction d generalizing seeds with
 | zero => exact fun _ h => h
 | succ d ih =>
  simp only [close]
  apply fun i hi => ih _ ?_
  split
  · exact List.mem_append_left _ hi
  · exact hi

theorem close_upper (earlier : Earlier deps) (bound : d ≤ i) :
    i ∈ close deps d seeds ↔ i ∈ seeds := by
 induction d generalizing seeds with
 | zero => rfl
 | succ d ih =>
  simp only [close]
  rw [ih (by omega)]
  split
  · simp only [List.mem_append]
    constructor
    · intro h
      rcases h with h | h
      · exact h
      · have := earlier d i h; omega
    · exact Or.inl
  · rfl

theorem close_minimal (closed : Closed deps target) (included : Includes seeds target) :
    Includes (close deps d seeds) target := by
 induction d generalizing seeds with
 | zero => exact included
 | succ d ih =>
  simp only [close]
  apply ih
  intro i hi
  split at hi
  · rename_i selected
    rcases List.mem_append.mp hi with hi | hi
    · exact included i hi
    · exact closed d (included d selected) i hi
  · exact included i hi

theorem close_closed_before (earlier : Earlier deps) :
    ∀ j, j < d → j ∈ close deps d seeds → ∀ k ∈ deps j, k ∈ close deps d seeds := by
 induction d generalizing seeds with
 | zero => intro j hj; omega
 | succ d ih =>
  intro j hj selected k hk
  by_cases lower : j < d
  · exact ih j lower selected k hk
  · have eq : j = d := by omega
    subst j
    by_cases present : d ∈ seeds
    · have member : k ∈ (if d ∈ seeds then seeds ++ deps d else seeds) := by
       simp only [if_pos present, List.mem_append]; exact Or.inr hk
      change k ∈ close deps d (if d ∈ seeds then seeds ++ deps d else seeds)
      exact close_preserves k member
    · have absent : d ∉ close deps d seeds := fun h => present ((close_upper earlier (by omega)).mp h)
      simp only [close, if_neg present] at selected
      exact False.elim (absent selected)

theorem close_bounded (earlier : Earlier deps) (bound : Bounded seeds d) :
    Bounded (close deps d seeds) d := by
 intro i hi
 by_cases lower : i < d
 · exact lower
 · have old : i ∈ seeds := (close_upper earlier (Nat.le_of_not_gt lower)).mp hi
   exact False.elim (lower (bound i old))

theorem close_closed (earlier : Earlier deps) (bound : Bounded seeds d) :
    Closed deps (close deps d seeds) := by
 intro j hj k hk
 exact close_closed_before earlier j (close_bounded earlier bound j hj) hj k hk

theorem close_idempotent (earlier : Earlier deps) (bound : Bounded seeds d) :
    ∀ i, i ∈ close deps d (close deps d seeds) ↔ i ∈ close deps d seeds := by
 intro i
 exact ⟨close_minimal (close_closed earlier bound) (fun _ h => h) i, close_preserves i⟩


theorem closed_append (ha : Closed deps a) (hb : Closed deps b) : Closed deps (a ++ b) := by
 intro j hj k hk
 rcases List.mem_append.mp hj with hj | hj
 · exact List.mem_append_left _ (ha j hj k hk)
 · exact List.mem_append_right _ (hb j hj k hk)

theorem close_union (earlier : Earlier deps) (ba : Bounded a d) (bb : Bounded b d) :
    ∀ i, i ∈ close deps d (a ++ b) ↔ i ∈ close deps d a ++ close deps d b := by
 have combined : Bounded (a ++ b) d := by
  intro i hi
  rcases List.mem_append.mp hi with hi | hi
  · exact ba i hi
  · exact bb i hi
 have leftClosed := close_closed earlier ba
 have rightClosed := close_closed earlier bb
 have unionClosed := close_closed earlier combined
 have forward : Includes (close deps d (a ++ b)) (close deps d a ++ close deps d b) := by
  apply close_minimal (closed_append leftClosed rightClosed)
  intro i hi
  rcases List.mem_append.mp hi with hi | hi
  · exact List.mem_append_left _ (close_preserves i hi)
  · exact List.mem_append_right _ (close_preserves i hi)
 have backwardLeft : Includes (close deps d a) (close deps d (a ++ b)) := by
  apply close_minimal unionClosed
  intro i hi
  exact close_preserves i (List.mem_append_left _ hi)
 have backwardRight : Includes (close deps d b) (close deps d (a ++ b)) := by
  apply close_minimal unionClosed
  intro i hi
  exact close_preserves i (List.mem_append_right _ hi)
 intro i
 constructor
 · exact forward i
 · intro hi
   rcases List.mem_append.mp hi with hi | hi
   · exact backwardLeft i hi
   · exact backwardRight i hi

end ProofAtlas.ContextClosure
