import Mathlib

namespace ProofAtlas.Recurrence4274

def Recurrence (b : ℕ → ℝ) : Prop :=
  ∀ n : ℕ, b n = ((n : ℝ) + 3) / ((n : ℝ) + 1) * b (n - 1)

theorem inconsistent (b : ℕ → ℝ) (rec : Recurrence b) (initial : b 0 = 1) : False := by
  have atZero := rec 0
  norm_num [initial] at atZero

theorem recurrenceAlone : ∃ b : ℕ → ℝ, Recurrence b := by
  exact ⟨fun _ => 0, fun _ => by simp⟩

theorem initialAlone : ∃ b : ℕ → ℝ, b 0 = 1 :=
  ⟨fun _ => 1, rfl⟩

#print axioms inconsistent
end ProofAtlas.Recurrence4274
