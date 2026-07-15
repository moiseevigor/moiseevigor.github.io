# FORMAL.md — the Lean 4 formalization ledger

Machine-checked core of the companion article *Growth Vectors and Caustics of
Magnetic Flux Lifts* (final review, condition F1). Toolchain: Lean 4
(`lean-toolchain`: leanprover/lean4:v4.32.0) + mathlib (pinned in
`lakefile.toml` / `lake-manifest.json`). Check: `lake build` — completes with
zero errors; the source tree contains **no `sorry`** (grep-checked; recorded
in `artifacts/site_build_verification.txt`).

The rule this ledger enforces: **no article claim may cite Lean for more than
the Lean statement says.** Column 3 is exactly what is proved; column 4 is
what the article still owes elsewhere.

## Formalized (zero sorry)

| Article claim | Lean theorem | What the Lean statement proves | What it does NOT prove |
|---|---|---|---|
| Prop 4.2, first-root window (i)+(ii): the homogeneous Jacobian has no root before 2π | `FDFormal.J0_pos` (`FDFormal/Jacobian.lean`) | `J0 t = 2(1−cos t) − t sin t > 0` for `0 < t < 2π` | that `J0` **is** the flow Jacobian — that identification is symbolic (sympy, θ₀-independence and the exact match recorded in the F1 log and `o6_certificate.json`), not Lean |
| Prop 4.2, window (iii): simple zero at 2π | `FDFormal.J0_two_pi`, `FDFormal.deriv_J0_two_pi` | `J0 (2π) = 0` and `deriv J0 (2π) = −2π` | the implicit-function step for the **perturbed** root (stated in the article; ε-dependence not formalized) |
| Prop 4.2, small-time display `J0 = t⁴/12 (1+O(t))` | `FDFormal.J0_div_pow_four_tendsto` | `J0 t / t⁴ → 1/12` as `t → 0⁺` (four L'Hôpital steps, all derivative lemmas proved) | the `O(t)` **rate**; and uniformity in ε is NOT a Lean statement — it rests on the structural `t⁴` factorization (order-counting lemma in the article + exact-symbolic verification `run_f3_smalltime_uniform.py`: `t⁰–t³` coefficients vanish identically in jets/h/θ₀, `t⁴` coefficient ≡ 1/12 for the three-jet family) |
| Lemma 1.3 (the Lorentz sign, permanently) | `FDFormal.lorentz_sum_identity`, `FDFormal.lorentz_force_reduction` (`FDFormal/Lorentz.lean`) | the sum algebra `w Σ uⱼ(∂ⱼAᵢ−∂ᵢAⱼ) = −(w Σ Fᵢⱼuⱼ)` **and** the calculus form: given Hamilton's `ṗᵢ` and the chain rule for `Aᵢ` along the trajectory (as `HasDerivAt` hypotheses), `uᵢ = pᵢ + wAᵢ` has derivative `−w Σ Fᵢⱼ uⱼ` | the derivation of Hamilton's equations themselves from the sub-Riemannian Hamiltonian (standard; article §1) |
| Theorem B, step 2 (tan-half-angle factorization) | `FDFormal.radicand_factorization`, `FDFormal.cos_tan_half_relation`, `FDFormal.modulus_identity` (`FDFormal/EllipticStep.lean`) | `((1−εc)²−ε²)(1+t²)² = (t²+(1−2ε))(1+(1+2ε)t²)` under `c(1+t²) = 1−t²`; the substitution relation for `cos(θ/2) ≠ 0`; `1−(1−2ε)(1+2ε) = (2ε)²` | the Gauss integral and the `K(2ε)` average (mathlib has no complete elliptic integrals) — Theorem B's integral steps remain hand-proved + sympy/numeric-checked (`run_t2_reduction_check.py`) |
| Corollary B2 (critical gradient, subcritical side) | `FDFormal.subcritical_E_gt_eps`, `FDFormal.subcritical_radicand_pos`, `FDFormal.critical_equality` (`FDFormal/CriticalGradient.lean`) | the **algebra only**: for `0 ≤ ε < 1/2` and every launch angle, `E = 1 − ε sin θ₀ > ε` and the radicand `E² − ε²` is positive; equality at `ε = 1/2`, `sin θ₀ = 1` | that a positive radicand gives a **finite θ-period** — that step goes through the externally derived period formula `T = 2π/√(E²−ε²)` (Theorem B chain), not Lean; also the divergence rate and everything supercritical (measured, finite-horizon) |
| Part 5 / force-free theorem, linear-algebra core | `FDFormal.spectrum_real_of_isSymm`, `FDFormal.forcefree_null_no_spiral` (`FDFormal/ForceFree.lean`) | a real symmetric matrix (complexified) is Hermitian and every eigenvalue in `spectrum ℂ` has zero imaginary part — no spiral (complex-pair) type | the physics step: at a null of a `J = αB` field the current vanishes so `∇B` is symmetric (two-line identity, article/Part 5); the bounded-α scope note |

## Not formalized (and why)

- **The elliptic period average** `⟨T⟩/T₀ = (2/π)K(2ε)` — mathlib has no complete
  elliptic integrals; the reduction's integral steps live in the hand proof +
  `run_t2_reduction_check.py` (sympy + numeric to 1e-10).
- **The ε-perturbation of Prop 4.2** (τ₁, τ₂, ⟨τ₂⟩ = 2π(1−¾β)) — the derivation of
  record is the exact-symbolic sympy trace, archived as
  `artifacts/o6_certificate.json`. Formalizing the perturbation expansion of a
  parameterized ODE flow is a research-scale Lean project, out of scope here.
- **The growth-vector flag (Lemma 2.3)** beyond algebra — bracket calculus of vector
  fields on ℝ^{d+1} at singular points; not attempted.
- **Anything observational** (solar, Jupiter) — not mathematics.

## Reproduce

```bash
cd research/preferred-directions/lean
lake exe cache get   # fetch mathlib binaries (first time)
lake build           # completes with zero errors; no `sorry` in FDFormal/
```

## The J0 identification (the definitional interface)

Lean proves properties of the **closed form** `J0 t = 2(1−cos t) − t sin t`.
That this closed form equals the uniform-field flow Jacobian of the reduced
system (x' = cos θ, y' = sin θ, θ' = 1+h, φ' = A(x) sin θ, columns ∂θ₀/∂h/∂t)
was verified symbolically: the exact 3×3 determinant simplifies to it,
θ₀-free, with `J0(2π) = 0`, `J0'(2π) = −2π`, and series `t⁴/12 + O(t⁶)`
(sympy; the check is reproduced in the final-review response log). The article
cites the Lean theorems only through this interface.
