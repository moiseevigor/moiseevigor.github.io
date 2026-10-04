# Post-revision re-review: magnetic flux lifts and forbidden directions

**Date:** 2026-07-14  
**Role:** sub-Riemannian geometry and astrophysics referee  
**Scope:** current article, all eight blog posts, appendices, response document,
program reports, mathematical code, solar pipeline, Jupiter pipeline, and regenerated
artifacts  
**Decision:** **major revision; not ready for public or journal release in the current
repository state**

## 1. Honest overall verdict

The program now contains a credible and potentially publishable mathematical core. The
two strongest results are:

1. the exact exponential-profile **period average**

   \[
   \frac{\langle T\rangle}{T_0}=\frac{2}{\pi}K(2\varepsilon),
   \qquad 0\leq\varepsilon<\frac12,
   \]

   with its complete coefficient series; and
2. the computer-assisted leading caustic coefficient

   \[
   c_2^{\mathrm{caustic}}=1-\frac34\beta,
   \qquad \beta=\frac{L''(0)}{L'(0)^2},
   \]

   supported independently by the nonlinear conjugate-point pipeline.

Both results reproduced in this review. The exact period calculation is proved cleanly.
The caustic coefficient is a real advance over the previous version and is the best
novelty candidate in the project.

The revised article also handles prior work much more honestly. It now makes clear that
the magnetic lift, the extra bracket at a nondegenerate zero, gauge invariance, and the
abnormal zero-locus phenomenon are classical. This is consistent with Montgomery's
work and with the recent lifted-magnetic-flow treatment of
[Barilari--Bossio--Franceschi](https://arxiv.org/abs/2504.09274), which characterizes
step and abnormal trajectories in terms of the magnetic field's analytic behavior.

However, I cannot recommend release yet. The response document says multiple findings
are **Done**, but the current public-facing files still contain the rejected claims
verbatim. More seriously, the article retains a sign error in its foundational
Lorentz-force lemma, and Proposition 4.2 does not yet justify that the locally continued
Jacobian root is the *first* conjugate root. The solar work remains a methods
demonstration, while the Jupiter work is still described with stronger completeness and
probabilistic language than its code supports.

This is no longer a weak research program. It is a promising mathematical paper
surrounded by an astrophysical/blog layer that has not yet been brought to the same
standard.

## 2. Revised ratings

### Companion article

| Criterion | Score | Assessment |
|---|---:|---|
| Scientific contribution | **3.7/5** | The period identity and caustic profile coefficient are potentially publishable. The lift and flag law are mainly classical/incremental. |
| Logical correctness | **3.7/5** | The theorem/conjecture ledger is strong, but first-root status, finite-horizon inference, and contradictory closing language remain. |
| Mathematical correctness | **3.8/5** | Core scalar results reproduce. The Lorentz-force sign and Proposition 4.2 hypotheses/proof status must be repaired. |
| Clarity | **4.0/5** | Strong organization and prior-art delimitation; several summary sentences overstate what the detailed sections establish. |
| Reproducibility | **4.5/5** | Excellent. The main scripts execute quickly and reproduce the stated numbers. |

### Blog and astrophysical layer

| Criterion | Score | Assessment |
|---|---:|---|
| Scientific contribution | **3.0/5** | Interesting model experiments and one conditional Jovian prediction, but no externally validated astrophysical discovery. |
| Logical correctness | **2.9/5** | Current posts contradict the article and the response document on several central claims. |
| Mathematical correctness | **3.1/5** | Corrected results exist, but obsolete inversion, volume, fold, and detection language remains visible. |
| Clarity | **3.1/5** | Individual posts are engaging, but readers cannot reliably know which headline statements remain valid. |
| Reproducibility | **4.4/5** | Very good, including negative results and model audits. |
| Astrophysical grounding | **2.7/5** | Solar G1 has not run; Jupiter is a model continuation with an uncalibrated sensitivity proxy. |

## 3. What has genuinely improved

The following revisions are scientifically successful:

- The article clearly distinguishes the exact period theorem from open Conjecture A.
- Proposition 4.1 now carries the honest \(O(\varepsilon^3)\) remainder.
- The two-radius identifiability claim is correctly retracted in the article.
- The generic rank-2 fold is correctly assigned \(Q=6\), while \(Q=7\) is restricted to
  the fully quadratic symmetric construction.
- The singular-point discussion now distinguishes nilpotent dilation weights from an
  unproved ball-volume exponent.
- The closest prior work and abnormal minimizers are acknowledged.
- The T96 population is explicitly reinterpreted as structure outside the model's own
  magnetopause rather than a physical magnetospheric discovery.
- Solar fold language is narrowed to a fold in a real-data-anchored boundary
  interpolation family, not an observed temporal reconnection event.
- The Jupiter analysis now reports the \(l\le18\) continuation, the degree-13 failure,
  the mapping-surface caveat, and a third root missed by the seeded search.
- Numerical bands are mostly identified as fit or convergence sensitivities rather than
  sampling errors.
- The G1 solar charter is scientifically well designed.

These changes materially improve the work and should be retained.

## 4. Remaining release blockers

### R1. The Lorentz-force lemma has the wrong component sign

The article defines

\[
F_{ij}=\partial_iA_j-\partial_jA_i,
\qquad u_i=p_i+wA_i.
\]

It then correctly obtains

\[
\dot u_i=w\sum_j u_j(\partial_jA_i-\partial_iA_j),
\]

but incorrectly identifies this with \(+wF_{ij}u_j\). With the displayed definition it
is

\[
\dot u_i=-w\sum_jF_{ij}u_j.
\]

Fix the definition, the Hamiltonian convention, or the final force equation and define
the planar rotation \(J\) consistently. This reverses orientation and does not invalidate
the averaged periods or caustic coefficients, but a foundational lemma cannot be left
algebraically inconsistent.

Location: `_articles/2026-09-05-magnetic-flux-lifts.md`, Lemma 1.3.

### R2. Proposition 4.2 proves a nearby root, not yet the first conjugate root

The symbolic perturbation expands the simple Jacobian zero at \(t=2\pi\). It therefore
constructs a conjugate root that continues from the homogeneous first root. To call its
time \(t_c\), the article must add a stability argument excluding an earlier positive
root for sufficiently small \(\varepsilon\).

The proposition should also say explicitly that “arbitrary profile” means a sufficiently
smooth **one-dimensional** field \(B(x)=B_0e^{L(x)}\), with \(L'(0)\ne0\) and controlled
higher normalized jets in the small-radius limit. It is not a theorem for arbitrary
\(B(x,y)\).

Finally, when \(1-3\beta/4<0\), the inversion involves
\(\sqrt{|1-3\beta/4|}\), not an unqualified real square root. The article's own
\(\beta=2\) example enters this regime.

### R3. The supercritical “no conjugate point” claim exceeds the computation

The code finds no sign-changing root for the excluded launch band within eight reference
periods and records deep Jacobian minima. That is finite-horizon evidence, not a proof
that those geodesics have no later or even-multiplicity conjugate point. Replace “loses
its conjugate point” with “no conjugate point was detected within the integration
window” unless a global argument is added.

### R4. The current repository still contains claims marked as corrected

The following are present in public-facing or current-layer files:

- `_posts/2026-08-14-forbidden-directions-finding-nulls.md` calls a magnetic null a
  “reconnection site” in both body and glossary.
- `_posts/2026-08-08-forbidden-directions-magnetic-contact.md` calls nulls “the
  reconnection sites” and says the invariant is computed from ball growth and becomes an
  “actual detector.”
- `_posts/2026-08-05-forbidden-directions-research-program.md` retains the same
  reconnection definition and unqualified ball-volume definition at the singular point.
- `research/preferred-directions/docs/V1-profile-law.md` still says two Larmor radii
  separate gradient and curvature, directly contradicting article §4.
- `research/preferred-directions/README.md` still says “seven-part series,” omits Part 8,
  summarizes Part 6 as “the fold, Q=7,” and says the solar pipeline “detects a real
  null.”
- The README still presents \(|\nabla\ln B|=\sqrt{|\delta|}/r_L\) as an inversion without
  the leading-order and profile-calibration qualifications.
- `_posts/2026-09-02-forbidden-directions-jupiter.md` reports three roots and later says
  “0 spirals out of 2.” The third root remains unclassified.
- The article says the profile law was “measured, then derived” near the beginning but
  “derived before being measured” in its closing summary.

These are not harmless historical notes: they occur in the current presentation. The
response document's **Done** labels for M3, M6, M8, M10, M11, and M12 are therefore
factually inaccurate.

The regression test passes because it searches 15 narrow phrases. It misses the exact
surviving two-radius sentence, all reconnection-site instances, the seven-part count,
the Jupiter inconsistency, and the unqualified inversion. Expand it to test scientific
invariants rather than a few exact strings.

### R5. J2 is not yet an exhaustive Haynes--Parnell census

`run_j2_census.py` applies a necessary corner-sign filter to every spherical cell and
then starts Newton descent from each candidate-cell center. It does not solve the
trilinear interpolant or verify a Poincaré index. At the two resolutions, 29 and 39 cells
pass the filter, but only three roots are retained.

Agreement of the three roots at two grids is valuable convergence evidence. It is not a
completeness theorem because center-started Newton iteration can fail or leave a
candidate cell. Call this a “two-resolution cell-prefiltered root census” or implement
the full trilinear/Poincaré method before using “exhaustive” and “completeness.” The third
root at \(r=0.857R_J\) is also only \(0.002R_J\) above the chosen lower boundary and
requires a shell-floor sensitivity test.

### R6. The Jupiter ensemble does not define a survival probability or error bar

The perturbation distribution is an intentionally constructed stress model:
JRM33--JRM09 differences through degree 10, log-linear extrapolation to degree 18,
independent Gaussian coefficient perturbations, a 100% cap at high degree, a fixed
patch threshold, and a warm-started local null search. Forty realizations give a useful
stress-test fraction, but not a posterior probability.

Use:

- “33/40 survival fraction under the chosen stress ensemble,” not “survival
  probability”; and
- “sample position range,” not “prediction's error bar.”

The model should also test the other two nominal roots and vary perturbation amplitude,
patch threshold, search radius, and shell floor.

### R7. The solar astrophysical claim remains unvalidated

The G1 charter calls for definitive 720-s SHARP CEA radial/vector products, uncertainty
maps, non-periodic extrapolation comparisons, noise/window ensembles, a cell census,
and tracked temporal topology. None of these experiments has run.

Therefore the present solar results remain reproducible demonstrations using
line-of-sight convenience products and windowed potential extrapolations. They should
not be summarized as an astrophysical discovery or external-standard validation. A
magnetic null is also not automatically a reconnection site: three-dimensional
reconnection requires non-ideal evolution and can occur without a null, as reviewed by
[Pontin and Priest](https://doi.org/10.1007/s41116-022-00032-9).

## 5. Verification results

The following were rerun from `research/preferred-directions` using the documented
virtual environment:

| Check | Result |
|---|---|
| `scripts/smoke_test.py` | PASS |
| `scripts/run_t2_reduction_check.py` | PASS; elliptic identity reproduced to floating-point precision |
| `scripts/run_v1_linear_profile.py` | PASS; \(1.7466\pm0.0074\) and \(1.3741\pm0.0019\) reproduced |
| `scripts/run_o6_caustic_c2.py` | PASS; symbolic \(1-3\beta/4\) reproduced |
| `scripts/run_r6_supercritical.py` | PASS; 64/64, 64/64, 55/64, and 51/64 detected-root counts reproduced |
| `scripts/run_j2_census.py` | PASS; three retained roots at both grids; 33/40 proxy survival reproduced |
| `scripts/check_retracted_claims.py` | PASS as implemented; manual audit demonstrates inadequate coverage |
| Python compile of `src` and `scripts` | PASS |
| `_data/series.yml` parse | PASS |
| Jekyll render | NOT RUN; the local bundle lacks the Jekyll executable |

## 6. Minimum changes required for release

1. Correct the Lorentz-force sign convention.
2. Narrow and complete Proposition 4.2's theorem statement, including first-root
   stability and the absolute-value inversion.
3. Change the supercritical statement to finite-horizon evidence.
4. Remove all stale reconnection, two-radius, ball-volume, detector, part-count,
   inversion, fold, and Jupiter-count claims from the current layer.
5. Expand the regression guard so the response document cannot say **Done** while the
   old scientific claim remains elsewhere.
6. Rename or complete the Jupiter census and replace probability/error-bar language.
7. Keep solar claims at methods-demonstration status until G1 is actually executed.
8. Restore the site build environment and visually inspect the rendered article and all
   eight posts.

## 7. Final recommendation

**Major revision, not release-ready.** This recommendation is driven less by the core
numerics—which are reproducible—than by mathematical statement precision and
cross-document integrity.

There is a good paper here. A focused mathematical version centered on the exact period
average, the profile-dependent caustic coefficient, and the exponential-specific open
conjecture would be scientifically defensible after the sign and first-root issues are
fixed. The solar and Jupiter studies should be presented as model demonstrations and
falsifiable predictions, not as confirmed astrophysical discoveries.

The most important editorial action is now simple: make every public-facing sentence
obey the careful status ledger already present in the article. Until that is done, a
reader will encounter mutually incompatible claims and cannot know which version the
authors endorse.
