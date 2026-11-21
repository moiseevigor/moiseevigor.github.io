import Mathlib

namespace ProofAtlas.NegationControls

def system (a b c : ℝ) (goal : Prop) : Prop :=
  (0 ≤ a ∧ 0 ≤ b ∧ 0 ≤ c) → a^2 + a*b = c → b^2 + b*c = a → c^2 + c*a = b → goal

def cyclicStatement := ∀ a b c : ℝ, system a b c
  ((a = 0 ∧ b = 0 ∧ c = 0) ∨ (a = 1/2 ∧ b = 1/2 ∧ c = 1/2))

theorem cyclicModels : ¬ system 0 0 0 False ∧ ¬ system (1/2) (1/2) (1/2) False := by
  norm_num [system]

def quadratic (a : ℝ) (goal : Prop) := a^2 - 4*a + 3 = 0 → goal
def quadraticStatement := ∀ a : ℝ, quadratic a (a = 1 ∨ a = 3)

theorem quadraticModels : ¬ quadratic 1 False ∧ ¬ quadratic 3 False := by
  norm_num [quadratic]

def modularLeft (a b : ℤ) := a^2 + a*b + (1 % (b^2 + a*b + 1))

def modular (a b : ℤ) (goal : Prop) :=
  0 < a → 0 < b → modularLeft a b = 0 → goal
def modularStatement := ∀ a b : ℤ, modular a b (a = b)

theorem modularInconsistent (a b : ℤ) : modular a b False := by
  intro ha hb hz
  unfold modularLeft at hz
  have denom : 0 < b^2 + a*b + 1 := by positivity
  have rem := Int.emod_nonneg 1 (ne_of_gt denom)
  nlinarith [sq_nonneg a, mul_pos ha hb]

-- Each proper pair of the three original premises has an integer model.
theorem withoutPositiveA : ∃ a b : ℤ, 0 < b ∧ modularLeft a b = 0 := by
  exact ⟨-1, 2, by decide⟩

theorem withoutPositiveB : ∃ a b : ℤ, 0 < a ∧ modularLeft a b = 0 := by
  exact ⟨1, -1, by decide⟩

theorem withoutEquality : ∃ a b : ℤ, 0 < a ∧ 0 < b := by
  exact ⟨1, 1, by decide⟩

-- Counterfactual syntax used for comparison; the compiled declaration uses modularLeft.
def regroupedLeft (a b : ℤ) := (a^2 + a*b + 1) % (b^2 + a*b + 1)

theorem regroupedDiagonal (n : ℤ) : regroupedLeft n n = 0 := by
  simp [regroupedLeft]

theorem differentAtOne : modularLeft 1 1 = 3 ∧ regroupedLeft 1 1 = 0 := by
  decide

#print axioms cyclicModels
#print axioms quadraticModels
#print axioms modularInconsistent
end ProofAtlas.NegationControls
