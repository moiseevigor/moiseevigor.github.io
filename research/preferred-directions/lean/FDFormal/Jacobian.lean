/-
F1a — the homogeneous-Jacobian backbone of article Proposition 4.2.

`J0 t = 2 (1 - cos t) - t * sin t` is the uniform-field (ε = 0) Jacobian of the
magnetic exponential map in the reduced units of the article's §3. The closed
form is certified against the flow symbolically (sympy check recorded in
FORMAL.md; artifacts/o6_certificate.json carries the flow-side series).

Formalized here, with no `sorry`:
* `J0_pos`            — J0 > 0 on (0, 2π): the homogeneous FIRST-ROOT statement
                        (window (i)+(ii) input of Prop 4.2's continuity argument);
* `J0_two_pi`         — J0 (2π) = 0;
* `deriv_J0_two_pi`   — J0' (2π) = -2π ≠ 0: the simple-zero input to the
                        implicit-function step (window (iii));
* `J0_div_pow_four_tendsto` — J0 t / t⁴ → 1/12 as t → 0⁺: the small-time
                        coefficient displayed in the article's proof.
-/
import Mathlib

open Real Filter Set Topology

namespace FDFormal

/-- The homogeneous (uniform-field) Jacobian of the magnetic exponential map. -/
noncomputable def J0 (t : ℝ) : ℝ := 2 * (1 - cos t) - t * sin t

/-- Half-angle product form: `J0 t = 2 sin(t/2) (2 sin(t/2) - t cos(t/2))`. -/
theorem J0_eq_half_angle (t : ℝ) :
    J0 t = 2 * sin (t / 2) * (2 * sin (t / 2) - t * cos (t / 2)) := by
  have h2 : 2 * (t / 2) = t := by ring
  have hs : sin t = 2 * sin (t / 2) * cos (t / 2) := by
    have h := sin_two_mul (t / 2)
    rwa [h2] at h
  have hc : cos t = cos (t / 2) ^ 2 - sin (t / 2) ^ 2 := by
    have h := cos_two_mul' (t / 2)
    rwa [h2] at h
  have pyth : sin (t / 2) ^ 2 + cos (t / 2) ^ 2 = 1 := sin_sq_add_cos_sq _
  unfold J0
  rw [hs, hc]
  linear_combination (-2 : ℝ) * pyth

/-- `sin x - x cos x > 0` on `(0, π)` — via `x < tan x` below `π/2`, trivially
above (there `cos ≤ 0 < sin`). -/
theorem sin_sub_mul_cos_pos {x : ℝ} (hx : 0 < x) (hxpi : x < π) :
    0 < sin x - x * cos x := by
  rcases lt_or_ge x (π / 2) with h | h
  · have hc : 0 < cos x := cos_pos_of_mem_Ioo ⟨by linarith [pi_pos], h⟩
    have ht := lt_tan hx h
    rw [tan_eq_sin_div_cos, lt_div_iff₀ hc] at ht
    linarith
  · have hs : 0 < sin x := sin_pos_of_pos_of_lt_pi hx hxpi
    have hc : cos x ≤ 0 := cos_nonpos_of_pi_div_two_le_of_le h (by linarith [pi_pos])
    nlinarith

/-- **First-root positivity**: the homogeneous Jacobian does not vanish before
`2π`. This is the quantitative content of window (i)–(ii) in the article's
Proposition 4.2 first-root argument, for the unperturbed flow. -/
theorem J0_pos {t : ℝ} (h0 : 0 < t) (h2 : t < 2 * π) : 0 < J0 t := by
  have hx0 : 0 < t / 2 := by linarith
  have hxpi : t / 2 < π := by linarith
  have hs : 0 < sin (t / 2) := sin_pos_of_pos_of_lt_pi hx0 hxpi
  have hg : 0 < sin (t / 2) - t / 2 * cos (t / 2) := sin_sub_mul_cos_pos hx0 hxpi
  rw [J0_eq_half_angle]
  nlinarith

/-- The homogeneous first conjugate time: `J0 (2π) = 0`. -/
theorem J0_two_pi : J0 (2 * π) = 0 := by
  simp [J0, cos_two_pi, sin_two_pi]

/-- `J0` is differentiable with `J0' t = sin t - t cos t`. -/
theorem hasDerivAt_J0 (t : ℝ) : HasDerivAt J0 (sin t - t * cos t) t := by
  have h1 : HasDerivAt (fun s : ℝ => 2 * (1 - cos s)) (2 * sin t) t := by
    have h := ((Real.hasDerivAt_cos t).const_sub 1).const_mul (2 : ℝ)
    simpa using h
  have h2 : HasDerivAt (fun s : ℝ => s * sin s) (1 * sin t + t * cos t) t :=
    (hasDerivAt_id t).mul (Real.hasDerivAt_sin t)
  have h := h1.sub h2
  have hv : 2 * sin t - (1 * sin t + t * cos t) = sin t - t * cos t := by ring
  rw [hv] at h
  exact h

/-- The zero at `2π` is **simple**: `J0' (2π) = -2π`. -/
theorem deriv_J0_two_pi : deriv J0 (2 * π) = -(2 * π) := by
  rw [(hasDerivAt_J0 (2 * π)).deriv]
  simp [sin_two_pi, cos_two_pi]

/- Higher derivatives, for the small-time limit. -/

theorem hasDerivAt_J1 (t : ℝ) :
    HasDerivAt (fun s : ℝ => sin s - s * cos s) (t * sin t) t := by
  have h2 : HasDerivAt (fun s : ℝ => s * cos s) (1 * cos t + t * -sin t) t :=
    (hasDerivAt_id t).mul (Real.hasDerivAt_cos t)
  have h := (Real.hasDerivAt_sin t).sub h2
  have hv : cos t - (1 * cos t + t * -sin t) = t * sin t := by ring
  rw [hv] at h
  exact h

theorem hasDerivAt_J2 (t : ℝ) :
    HasDerivAt (fun s : ℝ => s * sin s) (sin t + t * cos t) t := by
  have h : HasDerivAt (fun s : ℝ => s * sin s) (1 * sin t + t * cos t) t :=
    (hasDerivAt_id t).mul (Real.hasDerivAt_sin t)
  have hv : 1 * sin t + t * cos t = sin t + t * cos t := by ring
  rw [hv] at h
  exact h

theorem hasDerivAt_J3 (t : ℝ) :
    HasDerivAt (fun s : ℝ => sin s + s * cos s) (2 * cos t - t * sin t) t := by
  have h2 : HasDerivAt (fun s : ℝ => s * cos s) (1 * cos t + t * -sin t) t :=
    (hasDerivAt_id t).mul (Real.hasDerivAt_cos t)
  have h := (Real.hasDerivAt_sin t).add h2
  have hv : cos t + (1 * cos t + t * -sin t) = 2 * cos t - t * sin t := by ring
  rw [hv] at h
  exact h

/- Powers of `t`, with clean derivative constants. -/

theorem hasDerivAt_pow4 (t : ℝ) : HasDerivAt (fun s : ℝ => s ^ 4) (4 * t ^ 3) t := by
  have h := hasDerivAt_pow 4 t
  norm_num at h
  exact h

theorem hasDerivAt_c_pow3 (t : ℝ) :
    HasDerivAt (fun s : ℝ => 4 * s ^ 3) (12 * t ^ 2) t := by
  have h := (hasDerivAt_pow 3 t).const_mul (4 : ℝ)
  norm_num at h
  have hv : (4 : ℝ) * (3 * t ^ 2) = 12 * t ^ 2 := by ring
  rwa [hv] at h

theorem hasDerivAt_c_pow2 (t : ℝ) :
    HasDerivAt (fun s : ℝ => 12 * s ^ 2) (24 * t) t := by
  have h := (hasDerivAt_pow 2 t).const_mul (12 : ℝ)
  norm_num at h
  have hv : (12 : ℝ) * (2 * t) = 24 * t := by ring
  rwa [hv] at h

theorem hasDerivAt_c_pow1 (t : ℝ) :
    HasDerivAt (fun s : ℝ => 24 * s) (24 : ℝ) t := by
  have h := (hasDerivAt_id t).const_mul (24 : ℝ)
  simpa using h

private theorem tendsto_zero_of_continuous_zero {f : ℝ → ℝ} (hf : Continuous f)
    (h0 : f 0 = 0) : Tendsto f (𝓝[>] (0 : ℝ)) (𝓝 0) := by
  have h := (hf.tendsto 0).mono_left (nhdsWithin_le_nhds (s := Set.Ioi (0 : ℝ)))
  rwa [h0] at h

/-- **Small-time coefficient**: `J0 t / t⁴ → 1/12` as `t → 0⁺` — the expansion
`J0 = t⁴/12 (1 + O(t))` displayed in the article's Proposition 4.2 proof,
here as a one-sided limit (four L'Hôpital steps). -/
theorem J0_div_pow_four_tendsto :
    Tendsto (fun t => J0 t / t ^ 4) (𝓝[>] (0 : ℝ)) (𝓝 (1 / 12)) := by
  have h4 : Tendsto (fun t : ℝ => (2 * cos t - t * sin t) / 24)
      (𝓝[>] (0 : ℝ)) (𝓝 (1 / 12)) := by
    have hcont : Continuous (fun t : ℝ => (2 * cos t - t * sin t) / 24) := by
      fun_prop
    have h := (hcont.tendsto 0).mono_left (nhdsWithin_le_nhds (s := Set.Ioi (0 : ℝ)))
    convert h using 2
    norm_num
  have h3 : Tendsto (fun t : ℝ => (sin t + t * cos t) / (24 * t))
      (𝓝[>] (0 : ℝ)) (𝓝 (1 / 12)) := by
    refine HasDerivAt.lhopital_zero_nhdsGT
      (Eventually.of_forall fun x => hasDerivAt_J3 x)
      (Eventually.of_forall fun x => hasDerivAt_c_pow1 x)
      (Eventually.of_forall fun _ => by norm_num)
      (tendsto_zero_of_continuous_zero (by fun_prop) (by simp))
      (tendsto_zero_of_continuous_zero (by fun_prop) (by simp)) h4
  have h2 : Tendsto (fun t : ℝ => (t * sin t) / (12 * t ^ 2))
      (𝓝[>] (0 : ℝ)) (𝓝 (1 / 12)) := by
    refine HasDerivAt.lhopital_zero_nhdsGT
      (Eventually.of_forall fun x => hasDerivAt_J2 x)
      (Eventually.of_forall fun x => hasDerivAt_c_pow2 x)
      ?_ (tendsto_zero_of_continuous_zero (by fun_prop) (by simp))
      (tendsto_zero_of_continuous_zero (by fun_prop) (by simp)) h3
    filter_upwards [self_mem_nhdsWithin] with x hx
    have hx0 : (0 : ℝ) < x := hx
    positivity
  have h1 : Tendsto (fun t : ℝ => (sin t - t * cos t) / (4 * t ^ 3))
      (𝓝[>] (0 : ℝ)) (𝓝 (1 / 12)) := by
    refine HasDerivAt.lhopital_zero_nhdsGT
      (Eventually.of_forall fun x => hasDerivAt_J1 x)
      (Eventually.of_forall fun x => hasDerivAt_c_pow3 x)
      ?_ (tendsto_zero_of_continuous_zero (by fun_prop) (by simp))
      (tendsto_zero_of_continuous_zero (by fun_prop) (by simp)) h2
    filter_upwards [self_mem_nhdsWithin] with x hx
    have hx0 : (0 : ℝ) < x := hx
    positivity
  refine HasDerivAt.lhopital_zero_nhdsGT
    (Eventually.of_forall fun x => hasDerivAt_J0 x)
    (Eventually.of_forall fun x => hasDerivAt_pow4 x)
    ?_ (tendsto_zero_of_continuous_zero (by unfold J0; fun_prop) (by simp [J0]))
    (tendsto_zero_of_continuous_zero (by fun_prop) (by simp)) h1
  filter_upwards [self_mem_nhdsWithin] with x hx
  have hx0 : (0 : ℝ) < x := hx
  positivity

end FDFormal
