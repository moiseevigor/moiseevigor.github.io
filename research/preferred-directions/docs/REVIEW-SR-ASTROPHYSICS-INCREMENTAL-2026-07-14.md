> **SUPERSEDED (housekeeping, final review F4).** This file is an earlier
> same-day draft; its findings were consolidated into
> `REVIEW-SR-ASTROPHYSICS-REREVIEW-2026-07-14.md`, which is the review of
> record for that round (response: `RESPONSE-REREVIEW-2026-07-14.md`).

# Incremental SR and astrophysics referee review

**Date:** 2026-07-14  
**Scope:** revisions made after `REVIEW-SR-ASTROPHYSICS-2026-07.md`  
**Material reviewed:** current article, blog series, appendices, program reports,
`RESPONSE-REVIEW-2026-07.md`, mathematical scripts, solar-analysis code, Jupiter
census/ensemble code, and regenerated artifacts  
**Recommendation:** **major revision remains**, with a materially improved and now
potentially publishable mathematical core

## 1. Executive assessment

The revision is a serious scientific improvement. Its most important addition is
Proposition 4.2,

\[
c_2^{\mathrm{caustic}}=1-\frac34\beta,
\]

derived by a computer-assisted second-order perturbation of the exponential-map
Jacobian. I reran `run_o6_caustic_c2.py`: it returned
\(\tau_1=2\pi\sin\theta_0\) and the symbolic average
\(c_2=1-3\beta/4\), with numerical quadrature agreement at machine precision. This
turns what was previously a two-profile numerical pattern into a credible leading-order
mathematical result for smooth one-dimensional profiles. Together with the already
proved elliptic period-average identity, this is the strongest scientific contribution
of the program.

The revision also improves scientific honesty. It now distinguishes period from
caustic, constructed fields from observations, tangent-cone checks from blind
detection, numerical sensitivity from statistical uncertainty, and a magnetic fold
from reconnection. The new Jupiter calculation finds a third root missed by the seeded
hunt, which is itself a valuable demonstration that seed clouds are not censuses.

However, the response document's repeated **Done** labels are not yet supported by the
whole repository. Several retracted or corrected claims remain in the current blog and
documentation layer. The solar gold-standard analysis is only a charter and has not
run. The Jupiter procedure is stronger than the old seed hunt but is not an exhaustive
Haynes--Parnell census as currently implemented. The coefficient ensemble is a useful
stress test, not a probability model or an error bar. A sign error also remains in the
article's Lorentz-force reduction.

My revised high-level verdict is therefore:

- **Mathematical core:** substantially improved; suitable for development into a
  focused paper after several proof and notation repairs.
- **Computational evidence:** highly reproducible and stronger than before.
- **Solar astrophysical evidence:** unchanged in scientific standing; still a methods
  demonstration on convenience products.
- **Jovian evidence:** upgraded from a fragile seeded prediction to a
  resolution-reproduced model result plus sensitivity experiment, but not yet a robust
  physical inference.
- **Blog/publication layer:** not synchronized well enough for release.

## 2. Revised scores

Scores use the original 1--5 scale. Parentheses give the change from the first review.

### Article and mathematical program

| Criterion | Revised score | Incremental assessment |
|---|---:|---|
| Scientific contribution | **3.7/5** (+0.7) | The derived caustic coefficient adds a genuine result beside the exact period-average law. The lift and flag count remain classical or incremental. |
| Logical correctness | **4.0/5** (+0.6) | The period/caustic separation is much cleaner. Remaining problems are first-root status, finite-horizon claims, and repository-level contradictions. |
| Mathematical correctness | **4.0/5** (+0.5) | The new symbolic calculation reproduces, but the Lorentz-force sign, theorem hypotheses, and first-conjugate-root argument require correction. |
| Clarity | **4.1/5** (+0.1) | The status ledger and prior-work section are strong. A few summary sentences and tables contradict the detailed text. |
| Reproducibility | **4.5/5** (+0.4) | All principal mathematical checks reran successfully from the documented environment. |

### Blog and astrophysical analysis

| Criterion | Revised score | Incremental assessment |
|---|---:|---|
| Scientific contribution | **3.0/5** (+0.3) | Jupiter gains a useful new model census and sensitivity study; no new solar experiment has been executed. |
| Logical correctness | **3.1/5** (+0.6) | Many important caveats were added, but stale claims still contradict the revised article and response. |
| Mathematical correctness | **3.3/5** (+0.6) | Generic-fold \(Q=6\), profile dependence, and conditional caustic language are substantially repaired, but not propagated everywhere. |
| Clarity | **3.4/5** (-0.1) | Individual new explanations are clearer; cross-document inconsistency now becomes the dominant clarity problem. |
| Reproducibility | **4.4/5** (+0.4) | The new Jupiter and profile-law scripts reproduce their recorded outputs. |
| Astrophysical grounding | **2.8/5** (+0.4) | The limitations are much better stated, but G1 has not run and the Jovian uncertainty experiment is only a proxy. |

## 3. Disposition of the original major findings

| Original finding | Independent disposition | Comment |
|---|---|---|
| **M1: closest prior art omitted** | **Substantially resolved** | Article §6 now gives an appropriate not-new list and discusses Montgomery (1995) and Barilari--Bossio--Franceschi. A proof-level comparison is still deferred. |
| **M2: period theorem and caustic conjecture conflated** | **Substantially resolved, not closed** | The article is now careful and Conjecture A remains open. README summaries and the supercritical wording still overreach in places. |
| **M3: profile-law non-sequiturs** | **Mathematically resolved; propagation incomplete** | Two-radius identifiability is correctly retracted in the article, inversion is asymptotic, and \(\beta=2\) is scoped correctly. `docs/V1-profile-law.md` still says two radii separate gradient and curvature. |
| **M4: singular-point \(Q\) language** | **Resolved in the article; incomplete in the blog** | Remark 2.6 properly separates dilation weights from ball-volume growth. Part 1 and Part 2 still describe \(Q\) as the ball-volume exponent at the null without the non-equiregular qualification. |
| **M5: notation, dimensions, codimension, topology** | **Mostly resolved** | The requested changes are present. A separate sign error in Lemma 1.3 is identified below. |
| **M6: detection vocabulary** | **Partially resolved** | The three-level taxonomy is excellent. Older posts and the README still use “detector” or “detects a real null” where the result is a root-finder-conditioned confirmation. |
| **M7: solar validation** | **Still partial** | `PROGRAM-G1-solar-gold-standard.md` is a good preregistered charter, but no G1 data pull, trilinear census, uncertainty ensemble, or tracked temporal experiment has run. |
| **M8: null/fold versus reconnection** | **Partially resolved; response's Done label is incorrect** | Part 6 now states the distinction well, but Parts 1, 2, and 4 still define magnetic nulls as “reconnection sites.” |
| **M9: T96 retraction propagation** | **Mostly resolved** | The main result tables carry the retraction. Some summary language still counts the magnetosphere as a grounded world without preserving the model-boundary qualification. |
| **M10: Jupiter overstatement** | **Materially improved, still partial** | Degree truncation, mapping radius, a third root, and a sensitivity ensemble are now reported. Census completeness and probabilistic language remain overstated. |
| **M11: statistical language** | **Mostly resolved** | Fit bands are correctly labelled. “Survival probability” and “prediction's error bar” are not justified by the model-difference stress ensemble. |
| **M12: record versus publication layer** | **Not resolved** | Current files contain mutually inconsistent result histories. The exact-phrase regression test passes while missing several scientifically material stale claims. |

## 4. Major incremental findings

### I1. Proposition 4.2 is the principal successful revision

The symbolic computation is internally coherent and independently reproducible. It
expands the geodesic endpoint and the Jacobian jointly in profile gradient
\(\varepsilon\) and fibre-momentum variation \(h\), tracks the simple root near
\(2\pi\), and obtains

\[
t_c(\theta_0)=2\pi+2\pi\varepsilon\sin\theta_0
+\varepsilon^2\tau_2(\theta_0)+O(\varepsilon^3),
\qquad
\frac{\langle\tau_2\rangle}{2\pi}=1-\frac34\beta.
\]

The independent nonlinear pipeline confirms the coefficient for
\(\beta=-1\) and \(-1/2\). This result raises the scientific contribution level of the
article.

Before treating it as a journal theorem, make three qualifications explicit:

1. “Arbitrary profile” means a sufficiently smooth **one-dimensional** profile
   \(B(x)=B_0e^{L(x)}\), with \(L'(0)\ne0\) and controlled higher normalized jets in the
   small-Larmor-radius limit. It does not cover an arbitrary \(B(x,y)\).
2. The perturbation constructs a conjugate root continuously bifurcating from
   \(2\pi\). Add the short stability argument that this root remains the **first**
   positive conjugate root for sufficiently small \(\varepsilon\).
3. Preserve an auditable symbolic artifact or add exact assertions to the script. The
   current program prints the theorem but writes no result file.

The consequence should also use an absolute value when the coefficient changes sign:

\[
\sqrt{|\delta|}/r_L
=\sqrt{\left|1-\tfrac34\beta\right|}\,|L'(0)|+o(1),
\]

not an unqualified square root of \(1-3\beta/4\). The \(\beta=2\) example makes this
important rather than cosmetic.

### I2. Lemma 1.3 contains a Lorentz-force sign inconsistency

The article defines

\[
F_{ij}=\partial_iA_j-\partial_jA_i,
\qquad u_i=p_i+wA_i.
\]

Hamilton's equations then give

\[
\dot u_i
=w\sum_j u_j(\partial_jA_i-\partial_iA_j)
=-w\sum_jF_{ij}u_j,
\]

whereas the article writes \(+wF_{ij}u_j\). Correct either the component convention for
\(F\), the displayed equation, or the definition of the planar rotation \(J\), and keep
the convention consistent through the reduced flow. This changes orientation rather
than the launch-averaged periods, so it does not invalidate Theorem B or Proposition
4.2, but it is a genuine algebraic error in a foundational lemma.

### I3. The supercritical computation is finite-horizon evidence

`run_r6_supercritical.py` reproduces the reported counts:

- \(\varepsilon=0.45,0.48\): 64/64 conjugate points, no grazing suspects;
- \(\varepsilon=0.52\): 55/64 sign-changing roots;
- \(\varepsilon=0.55\): 51/64 sign-changing roots.

This supports the period-band picture. It does not prove that the remaining angles
“lose their conjugate point”: it establishes that no sign-changing root was detected in
the finite integration window, with deep Jacobian minima recorded. State the result as
“no conjugate point detected within eight reference periods” unless a global no-root
argument is supplied.

### I4. The Jupiter census is stronger but not exhaustive in the claimed sense

The rerun reproduces three roots at both grids:

| \(r/R_J\) | Latitude | Longitude |
|---:|---:|---:|
| 0.873 | +69.0° | 282.3° |
| 0.864 | +9.7° | 157.4° |
| 0.857 | +27.2° | 67.0° |

This is meaningful progress. In particular, finding a root missed by approximately
3,000 Newton seeds demonstrates the weakness of the former method.

But `run_j2_census.py` implements a corner-sign **prefilter** followed by Newton descent
from each candidate-cell centre. It does not implement a trilinear root solve or a
Poincaré-index verification. At the two resolutions, 29 and 39 cells pass the necessary
sign test, while only three centre-started Newton iterations converge to retained roots.
Agreement of the retained count is good convergence evidence, not a completeness proof.

Use “two-resolution, cell-prefiltered census” or “resolution-stable root set” until the
full trilinear/Poincaré procedure is implemented. Also vary the lower shell boundary:
the third root is only \(0.002R_J\) above the adopted floor and is explicitly
floor-sensitive.

The blog must be synchronized with the new count. It currently reports three roots and
later says “0 spirals out of 2”; the third root has not been classified. Claims about
the anatomy, raw \(w_4\), and spiral fraction therefore apply only to the two profiled
roots.

### I5. The Jupiter ensemble is a sensitivity scenario, not a probability model

The 40-member experiment is useful, and the code honestly records that formal JRM33
covariances are unavailable. Nevertheless, its distribution is constructed from:

- JRM33--JRM09 per-degree differences through \(l=10\);
- log-linear extrapolation to \(l=18\), capped at 100%;
- independent Gaussian perturbations of each coefficient;
- a warm-started local search around the reference polar null;
- a fixed reversed-patch threshold.

This is not a posterior or calibrated sampling distribution. Therefore 33/40 is a
**survival fraction under this chosen stress model**, not a physical survival
probability. The min--max position range is a sample envelope, not an error bar or
confidence interval. The warm-start radius also conflates disappearance with migration
beyond the accepted neighbourhood.

Recommended next checks are: perturbation-scale and threshold sweeps; at least several
hundred members; a full cell census for every member or a validated tracker with a loss
audit; and separate survival results for all three nominal roots.

### I6. The solar correction is a charter, not new evidence

The G1 document responds well to the first review. It specifies definitive 720-s SHARP
CEA vector data, uncertainty maps, non-periodic extrapolation comparisons, window and
noise ensembles, a trilinear/Poincaré reference census, and temporally tracked fold
criteria.

No part of G1 has been executed. The existing solar outputs therefore retain their
original status: reproducible software demonstrations on 45-s line-of-sight convenience
products and cropped potential extrapolations. The revised prose mostly admits this,
but the scientific score should not be raised as though the external-standard solar
test had already occurred.

### I7. The response and regression guard miss material stale claims

Examples in the current layer include:

- `_posts/2026-08-14-forbidden-directions-finding-nulls.md`: a null is called a
  “reconnection site” in both body and glossary;
- `_posts/2026-08-08-forbidden-directions-magnetic-contact.md`: nulls are called
  “the reconnection sites”;
- `_posts/2026-08-05-forbidden-directions-research-program.md`: the same definition
  remains and \(Q\) is still introduced as a ball-volume exponent without the singular
  qualification;
- `docs/V1-profile-law.md`: “two Larmor radii separate gradient from curvature,” directly
  contradicting the corrected article;
- `README.md`: “seven-part series,” although the current article says Parts 1--8;
- `README.md`: the Part 6 summary still says “the fold, Q=7” without saying this is the
  symmetric constructed family;
- `README.md`: the leading inversion is still written without the profile factor and
  asymptotic qualifier;
- the Jupiter post: “0 spirals out of 2” after the three-root census;
- article closing text: “derived before being measured,” conflicting with “measured,
  then derived” elsewhere and with the recorded sequence of V1 followed by O6.

`check_retracted_claims.py` passes because it matches 15 narrow strings. Expand it to
cover semantic headline invariants, including `reconnection site`, the exact surviving
two-radius wording, part counts, Jupiter count/classification consistency, and generic
fold summaries. A passing exact-phrase scan should not be described as publication-layer
alignment.

## 5. Minor and editorial findings

1. The Corollary 2.4 HTML table contains six cells in the \(d=2,k\ge2\) row but five
   headers; “higher Martinet family” is duplicated.
2. Proposition 2.7 is appropriately called a proof sketch, but its
   \(O(r^{w_i+1})\) endpoint estimate and sampled-percentile transfer should receive an
   exact theorem citation or be weakened to an asymptotic \(o(r^{w_i})\) statement.
3. “The elliptic reduction and everything downstream of it is now mathematics” should
   read “all period-theoretic consequences downstream of it”; the caustic reading still
   depends on Conjecture A.
4. “Every continuous path” between two solar boundary magnetograms need not contain an
   interior fold unless boundary crossings are excluded along that path. Preserve the
   boundary-crossing condition whenever this argument is summarized.
5. The site could not be rendered in this review environment because the repository's
   Bundler installation lacks the `jekyll` executable. No dependency installation was
   attempted. Source-level checks therefore do not replace a final rendered-page review.

## 6. Verification performed

All commands were run from `research/preferred-directions` using the documented sibling
virtual environment.

| Check | Result |
|---|---|
| `scripts/smoke_test.py` | PASS |
| `scripts/check_retracted_claims.py` | PASS as implemented, but inadequate coverage found by manual audit |
| `scripts/run_t2_reduction_check.py` | PASS; direct, elliptic, and reduction-chain values agree to floating-point precision |
| `scripts/run_t4_beta_period_check.py` | PASS; \(1-\beta/2\) period coefficient reproduced |
| `scripts/run_v1_linear_profile.py` | PASS; \(c_2=1.7466\pm0.0074\) and \(1.3741\pm0.0019\) reproduced |
| `scripts/run_o6_caustic_c2.py` | PASS; symbolic \(1-3\beta/4\) reproduced in about 8 s |
| `scripts/run_r6_supercritical.py` | PASS; 64/64, 64/64, 55/64, 51/64 counts reproduced |
| `scripts/run_j2_census.py` | PASS; three roots at both grids and 33/40 polar-null stress survival reproduced |
| Python compile of `src` and `scripts` | PASS |
| Jekyll build | NOT RUN; local bundle lacks the Jekyll executable |

## 7. Minimum release gate

Before publishing the article or blog series, I recommend requiring all of the
following:

1. Correct Lemma 1.3's sign convention and add a regression assertion for the planar
   orientation.
2. State Proposition 4.2's one-dimensional smooth-profile hypotheses and justify that
   the continued root remains the first conjugate root.
3. Replace all stale two-radius, reconnection-site, singular-volume, part-count, generic
   fold, and Jupiter-count statements; then extend the regression guard.
4. Rename J2's current output as a cell-prefiltered, resolution-stable census or
   implement the actual trilinear and Poincaré-index method.
5. Replace “survival probability” and “error bar” with “stress-ensemble survival
   fraction” and “sample range,” and add sensitivity to the proxy construction.
6. Keep solar claims at “methods demonstration” until G1 is executed. A charter is not
   an experiment.
7. Render the complete site and inspect equations, tables, captions, and cross-links
   after the Jekyll environment is restored.

## 8. Final incremental recommendation

The response has moved the project in the right direction and has produced one important
new result: the leading caustic profile coefficient is now derived rather than guessed.
That addition materially improves the prospective paper. The exact period-average law
plus Proposition 4.2 can support a focused mathematical article if the computer-assisted
derivation is converted into a transparent proof or formal supplementary calculation.

The astrophysical layer is not yet at the same standard. Jupiter is an interesting,
clearly falsifiable model prediction with improved sensitivity diagnostics, but its
completeness and uncertainty language must be narrowed. The solar analysis has an
excellent next-phase plan but no new external-standard evidence. The blog still contains
enough contradictory headline claims that it should not be released in its current form.

**Decision remains major revision**, now with a substantially stronger mathematical
case and a shorter, concrete path to a defensible release.
