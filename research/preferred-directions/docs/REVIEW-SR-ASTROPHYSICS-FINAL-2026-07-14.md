# Final SR/astrophysics review: release gate

**Date:** 2026-07-14
**Baseline:** `REVIEW-SR-ASTROPHYSICS-POST-RESPONSE-2026-07-14.md` and its response
(`RESPONSE-POST-2026-07-14.md`)
**Scope:** the complete package — companion article, eight posts, five appendices,
program reports, scripts, artifacts, regression guard
**Decision:** **conditionally accepted for public release as an independent research
program** — conditions F1–F4 below, all executable without new observational data

## 1. Verdict

Across four review rounds the package has converged: the mathematical core is scoped
and certified, the astrophysical layer is labelled as model interrogation, the blog no
longer contradicts the article on any point checked, and the guard's fixtures make the
audit trail durable. Two classes of residual risk remain, and both are addressable
in-place:

1. **Assurance risk.** The program's trust chain now runs: hand proofs (period
   identity, reductions) → computer-assisted symbolic certificate (caustic
   coefficient) → numerics. The weakest link is no longer *what* is claimed but *how
   it is checked*: the elementary, load-bearing analysis steps are verified by
   inspection and by sympy — both of which have already failed once each in this
   program's history (the Lorentz sign; the first O6 run). The final upgrade is to
   machine-check the elementary steps in a proof assistant, so that the parts of the
   chain that *can* be formal are formal, and the ledger says exactly which parts are
   not.
2. **Closure risk.** Proposition 4.2 makes one untested prediction inside the
   program's own reach — the caustic-blind jet at β = 4/3 — and testing it requires
   nothing but the existing V1 pipeline. Leaving it untested when it is a
   two-hour run invites the obvious referee question.

## 2. Conditions for release

### F1 — Formalize the formalizable core in Lean 4 / mathlib (the user-directed centerpiece)

Formalize, with `lake build` as the check and zero `sorry`:

- **F1a (Prop 4.2 backbone).** The homogeneous Jacobian's closed form
  $J_0(t) = 2(1-\cos t) - t\sin t$ (certified against the flow symbolically) with the
  four load-bearing facts: (i) $J_0 > 0$ on $(0, 2\pi)$ — the homogeneous
  *first-root* statement the continuity argument leans on; (ii) $J_0(2\pi) = 0$;
  (iii) $J_0'(2\pi) = -2\pi \ne 0$ — the simple-zero input to the implicit-function
  step; (iv) the small-time coefficient, $J_0(t)/t^4 \to 1/12$.
- **F1b (R1, permanently).** The Lorentz-force sign identity behind Lemma 1.3 — the
  finite-sum algebra $w\sum_j u_j(\partial_jA_i-\partial_iA_j) = -w\sum_jF_{ij}u_j$
  and a calculus version along a trajectory (chain rule) — so the sign error that
  survived three drafts is now machine-checked.
- **F1c (Theorem B step).** The tan-half-angle radicand factorization identity used
  in the elliptic reduction, as a polynomial identity.
- **F1d (Corollary B2 algebra).** Subcriticality: for $0 \le \varepsilon < \tfrac12$
  and any launch angle, $E = 1-\varepsilon\sin\theta_0$ satisfies $E > \varepsilon$
  (finite period for every angle), sharp at $\varepsilon = \tfrac12$,
  $\sin\theta_0 = 1$.
- **F1e (R5 theorem core).** A real symmetric $3\times3$ matrix has only real
  eigenvalues — the linear-algebra heart of "force-free extrapolations host only
  radial nulls" — stated so that the physics step (null of $J=\alpha B$ field ⇒
  symmetric $\nabla\mathbf B$) plugs in.
- **F1f (ledger).** A `FORMAL.md` mapping every article claim to its Lean theorem
  name or to an explicit *not formalized* entry with the reason (e.g. complete
  elliptic integrals absent from mathlib; the ε-perturbation certificate remains
  sympy-based). The article's §0 and reproduce section must point at it. No claim may
  cite Lean for more than the Lean file states.

### F2 — Run the β = 4/3 caustic-blind prediction

Pre-registered rule: the power-family profile with $n = -3/4$ (β = 4/3, exact
potential $A_y = \tfrac4g[(1+gx)^{1/4}-1]$) goes through the V1 conjugate-point
pipeline unchanged; the prediction **c₂ consistent with 0** passes iff
$\lvert c_2^{\mathrm{fit}}\rvert$ is within the fit's own sensitivity band (the same
band construction as V1's published points). Either outcome is publishable; a failure
refutes the leading-order law where it is most falsifiable.

### F3 — Consistency wiring

FORMAL.md linked from the article ledger; `lake build` in the reproduce block;
the guard learns nothing new (no banned phrases arise from F1/F2) but the
build-verification log gains the Lean build stamp.

### F4 — Housekeeping

`REVIEW-SR-ASTROPHYSICS-INCREMENTAL-2026-07-14.md` is an earlier same-day draft of
the re-review and is superseded by it; stamp it as such so the docs/ chronology
stays navigable.

## 3. Scores (current state, before F1–F4)

| Criterion | Article | Blog | Comment |
|---|---:|---:|---|
| Scientific contribution | 3.7/5 | 3.4/5 | unchanged: the period identity + 1D caustic β-law carry the package |
| Logical correctness | 4.3/5 | 4.0/5 | contradictions checked in the last round are gone |
| Mathematical correctness | 4.2/5 | 3.9/5 | certificate present; elementary steps still human/sympy-checked → F1 |
| Astrophysical evidential strength | 2.8/5 | 2.8/5 | correctly capped at model interrogation until G1 |
| Clarity & status discipline | 4.3/5 | 4.0/5 | four-label ledger + acceptance-set separation now consistent |

## 4. What F1 cannot buy (stated so nobody over-claims it)

Formalizing F1a–F1e does **not** formalize: the elliptic period average (mathlib has
no complete elliptic integrals), the ε-perturbation that produces τ₁, τ₂ (the sympy
certificate remains the derivation of record), the growth-vector flag beyond the
bracket identity, or anything observational. After F1 the correct sentence is:
"the elementary load-bearing steps are machine-checked; the symbolic perturbation is
certificate-backed; the identification of period with caustic remains an open
conjecture" — nothing stronger.
