/-
F1d — the subcriticality algebra of Corollary B2 (article §3.6).

For `0 ≤ ε < 1/2` every launch angle has `E = 1 - ε sin θ₀ > ε`, so the
period radicand `E² - ε²` is positive and every launch angle keeps a finite
θ-period. Sharpness: at `ε = 1/2` the slowest launch (`sin θ₀ = 1`) reaches
equality — the critical gradient.
-/
import Mathlib

open Real

namespace FDFormal

/-- Subcriticality: `E = 1 - ε sin θ₀ > ε` for `0 ≤ ε < 1/2`. -/
theorem subcritical_E_gt_eps {ε : ℝ} (θ₀ : ℝ) (h0 : 0 ≤ ε) (h : ε < 1 / 2) :
    ε < 1 - ε * sin θ₀ := by
  nlinarith [sin_le_one θ₀, neg_one_le_sin θ₀]

/-- The period radicand `E² - ε²` is positive below the critical gradient:
every launch angle has a finite θ-period for `ε < 1/2`. -/
theorem subcritical_radicand_pos {ε : ℝ} (θ₀ : ℝ) (h0 : 0 ≤ ε) (h : ε < 1 / 2) :
    0 < (1 - ε * sin θ₀) ^ 2 - ε ^ 2 := by
  have hE := subcritical_E_gt_eps θ₀ h0 h
  nlinarith

/-- Sharpness at the critical gradient: for `ε = 1/2` the slowest launch
(`θ₀ = π/2`, `sin θ₀ = 1`) reaches `E = ε` exactly — the radicand vanishes
and the θ-period diverges there. -/
theorem critical_equality : 1 - (1 / 2 : ℝ) * sin (π / 2) = 1 / 2 := by
  rw [sin_pi_div_two]; norm_num

end FDFormal
