# V1 — the profile law at the caustic: c2 = 1 − (3/4)β, and Conjecture A delimited

**Question.** Is the deviation statistic's leading coefficient c2 = 1 universal,
or does it read the field's profile shape beyond |∇ln B|?

**Derived first (T4, period average).** For B = B0 e^L with β = L''(0)/L'(0)²,
the θ-period average obeys c2 = 1 − β/2 (article Prop 4.1, proven at leading
order; verified at β = 0, ±1, ±2 by `run_t4_beta_period_check.py`).

**Pre-registered prediction (V1).** If conjugate time = θ-period held on every
profile, the Jacobian pipeline would measure c2 = 3/2 on B = B0(1+gx).

**Result: REFUTED — twice informative.** `run_v1_linear_profile.py`
(artifacts/v1_linear_profile.json), power family B = (1+gx)^n, β = −1/n:

| profile              | β    | period c2 (proven) | caustic c2 (measured) | 1 − (3/4)β |
|----------------------|------|--------------------|-----------------------|------------|
| exponential (n = ∞)  | 0    | 1                  | 0.9996 (P1)           | 1          |
| quadratic (n = 2)    | −1/2 | 5/4                | 1.3741 ± 0.0019       | 11/8       |
| linear (n = 1)       | −1   | 3/2                | 1.7466 ± 0.0074       | 7/4        |

1. **Caustic law: c2 = 1 − (3/4)β — measured, then DERIVED.** Measurement: both points
   within ~half the quoted sensitivity band; the alternative "period + β²/4" misses the
   n = 2 point by 0.062, ~30× that band. (Bands are fit-model spread + resolution
   shift — numerical sensitivities, not sampling σ.) Derivation (`run_o6_caustic_c2.py`,
   article Prop. 4.2): exact second-order perturbation of the Jacobian zero —
   τ1(θ0) = 2π sin θ0 at first order (odd ⇒ averages out), and ⟨τ2⟩ evaluates
   symbolically to 2π(1 − 3β/4) for an ARBITRARY one-dimensional profile jet, lifting the power-family
   restriction. Remaining of O6: higher coefficients and a hand-written proof.
2. **Conjecture A (t_c = θ-period) is exponential-specific**: on n = 1, 2 the
   per-angle gap max|t_c/T − 1| grows ∝ βε² (1.2e-2 at ε = 0.15, n = 1) while
   the exponential holds at 1e-8. Orbit closure + E-collapse hold on the linear
   profile too — so they cannot suffice to prove A.
3. **Critical gradient is profile-dependent**: ε = 1/4 for the linear profile
   (radicand turning point), vs 1/2 (K's singularity) for the exponential.
4. **The blind jet at β = 4/3, TESTED (F2, final review)**: the power profile
   n = −3/4 through the same pipeline gives caustic c2 = (−0.7 ± 1.4)e−5 —
   consistent with zero, as the law predicts, while the period average there
   is 1/3. The residual is consistent with ε⁴ scaling over the sampled range,
   under the even-power fit models used (run_f2_beta43_blind.py,
   artifacts/f2_beta43_blind.json; pre-registered rule: PASS).

**Consequence for Part 3's inversion.** |∇ln B| = √|δ|/r_L carries a
profile-calibration factor |1 − (3/4)β|^{−1/2} (absolute value: at β > 4/3 the
combination is negative and δ flips sign — the β = 2 example enters that regime).
Two Larmor radii do NOT separate gradient from curvature: every sufficiently small
radius measures the same single combination (1 − (3/4)β)L′(0)²; the separation claim
is retracted (article §4, consequence ii). Written into Part 3, D5, and article §4.

**Reproduce.**
```bash
cd research/preferred-directions
../cosmic-web/.venv/bin/python scripts/run_t4_beta_period_check.py
../cosmic-web/.venv/bin/python scripts/run_v1_linear_profile.py
```
