/-
F1b — the Lorentz-force sign identity behind article Lemma 1.3.

The sign error `u̇ = +wFu` (with `F i j = ∂ᵢAⱼ - ∂ⱼAᵢ`) survived three drafts
before the re-review caught it. Machine-checked here, permanently:

* `lorentz_sum_identity`     — the pure finite-sum algebra;
* `lorentz_force_reduction`  — the calculus version: given Hamilton's equation
  for `pᵢ` and the chain rule for `Aᵢ` along the trajectory (both supplied as
  `HasDerivAt` hypotheses, which is exactly what Hamilton + chain rule give),
  the velocity component `uᵢ = pᵢ + w Aᵢ` satisfies `u̇ᵢ = -w Σⱼ Fᵢⱼ uⱼ`.
-/
import Mathlib

namespace FDFormal

open Finset

/-- The sum algebra of Lemma 1.3's final step:
`w Σⱼ uⱼ (∂ⱼAᵢ - ∂ᵢAⱼ) = -(w Σⱼ (∂ᵢAⱼ - ∂ⱼAᵢ) uⱼ)`. -/
theorem lorentz_sum_identity {n : ℕ} (w : ℝ) (u : Fin n → ℝ)
    (dA : Fin n → Fin n → ℝ) (i : Fin n) :
    w * ∑ j, u j * (dA j i - dA i j) = -(w * ∑ j, (dA i j - dA j i) * u j) := by
  rw [← neg_mul, Finset.mul_sum, Finset.mul_sum]
  exact Finset.sum_congr rfl fun j _ => by ring

/-- Lemma 1.3, the calculus form. Hypotheses are what Hamilton's equations and
the chain rule deliver along a trajectory at time `t`:
`hp : ṗᵢ = -w Σⱼ uⱼ ∂ᵢAⱼ` and `hA : (d/dt) Aᵢ(x t) = Σⱼ ∂ⱼAᵢ uⱼ`
(`u j` the velocity components at time `t`, `dA i j = ∂ᵢAⱼ` at the point).
Conclusion: `uᵢ = pᵢ + w Aᵢ` has derivative `-w Σⱼ Fᵢⱼ uⱼ`,
`F i j = dA i j - dA j i`. -/
theorem lorentz_force_reduction {n : ℕ} (w t : ℝ) (u : Fin n → ℝ)
    (dA : Fin n → Fin n → ℝ) (i : Fin n) (p Ai : ℝ → ℝ)
    (hp : HasDerivAt p (-(w * ∑ j, u j * dA i j)) t)
    (hA : HasDerivAt Ai (∑ j, dA j i * u j) t) :
    HasDerivAt (fun s => p s + w * Ai s)
      (-(w * ∑ j, (dA i j - dA j i) * u j)) t := by
  have key : -(w * ∑ j, u j * dA i j) + w * ∑ j, dA j i * u j
      = -(w * ∑ j, (dA i j - dA j i) * u j) := by
    rw [Finset.mul_sum, Finset.mul_sum, Finset.mul_sum,
      ← Finset.sum_neg_distrib, ← Finset.sum_neg_distrib,
      ← Finset.sum_add_distrib]
    exact Finset.sum_congr rfl fun j _ => by ring
  have h := hp.add (hA.const_mul w)
  rw [key] at h
  exact h

end FDFormal
