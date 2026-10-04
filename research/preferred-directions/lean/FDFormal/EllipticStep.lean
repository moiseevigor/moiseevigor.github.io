/-
F1c — the tan-half-angle factorization step of Theorem B (article §3.5).

The elliptic reduction rests on one algebraic identity: under the tangent
half-angle substitution `c (1+t²) = 1-t²` (i.e. `c = cos θ`, `t = tan(θ/2)`),

  ((1 - ε c)² - ε²) (1+t²)²  =  (t² + (1-2ε)) (1 + (1+2ε) t²),

which factors the period radicand into the two quadratics whose Gauss integral
produces `K(2ε)`; the modulus enters through `1 - (1-2ε)(1+2ε) = (2ε)²`.
Both identities are machine-checked here, plus the substitution relation
itself from mathlib's trigonometry.
-/
import Mathlib

open Real

namespace FDFormal

/-- The factorization identity of Theorem B, step 2, with the tan-half-angle
relation `c (1+t²) = 1-t²` as hypothesis. -/
theorem radicand_factorization (t ε c : ℝ) (hc : c * (1 + t ^ 2) = 1 - t ^ 2) :
    ((1 - ε * c) ^ 2 - ε ^ 2) * (1 + t ^ 2) ^ 2
      = (t ^ 2 + (1 - 2 * ε)) * (1 + (1 + 2 * ε) * t ^ 2) := by
  calc ((1 - ε * c) ^ 2 - ε ^ 2) * (1 + t ^ 2) ^ 2
      = ((1 + t ^ 2) - ε * (c * (1 + t ^ 2))) ^ 2 - ε ^ 2 * (1 + t ^ 2) ^ 2 := by
        ring
    _ = ((1 + t ^ 2) - ε * (1 - t ^ 2)) ^ 2 - ε ^ 2 * (1 + t ^ 2) ^ 2 := by
        rw [hc]
    _ = (t ^ 2 + (1 - 2 * ε)) * (1 + (1 + 2 * ε) * t ^ 2) := by ring

/-- The tan-half-angle relation the hypothesis of `radicand_factorization`
instantiates: for `cos (θ/2) ≠ 0`, `cos θ (1 + tan(θ/2)²) = 1 - tan(θ/2)²`. -/
theorem cos_tan_half_relation (θ : ℝ) (h : cos (θ / 2) ≠ 0) :
    cos θ * (1 + tan (θ / 2) ^ 2) = 1 - tan (θ / 2) ^ 2 := by
  have h2 : 2 * (θ / 2) = θ := by ring
  have hcos : cos θ = cos (θ / 2) ^ 2 - sin (θ / 2) ^ 2 := by
    have h' := cos_two_mul' (θ / 2)
    rwa [h2] at h'
  have pyth : sin (θ / 2) ^ 2 + cos (θ / 2) ^ 2 = 1 := sin_sq_add_cos_sq _
  rw [hcos, tan_eq_sin_div_cos]
  field_simp
  linear_combination (cos (θ / 2) ^ 2 - sin (θ / 2) ^ 2) * pyth

/-- The modulus of the resulting elliptic integral: `1 - p²q² = (2ε)²`
for `p² = 1-2ε`, `q² = 1+2ε` — the `k = 2ε` in `δ = 1 - (2/π) K(2ε)`. -/
theorem modulus_identity (ε : ℝ) :
    1 - (1 - 2 * ε) * (1 + 2 * ε) = (2 * ε) ^ 2 := by ring

end FDFormal
