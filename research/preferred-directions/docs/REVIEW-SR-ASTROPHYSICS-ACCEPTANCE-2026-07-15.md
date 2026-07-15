# Independent SR/astrophysics acceptance re-review

**Date:** 2026-07-15  
**Reviewed response:** `RESPONSE-POST-FINAL-REREVIEW-2026-07-15.md`  
**Scope:** the mathematical article, the Forbidden Directions blog series, D5/T2/P1,
the claim guard, the F2/F3/O6 evidence, the Lean project, and the refreshed site-build
record.  
**Review standard:** scientific contribution, logical correctness, mathematical
correctness, clarity, astrophysical interpretation, and reproducibility.

## Disposition

**Accept for public circulation as an independent mathematical research article and
research blog, with no further scientific revision required.**

The six requested corrections from the post-final re-review are substantively complete.
The former major mathematical objection to Proposition 4.2 is closed, and the previous
period/refocusing claim leakage has been corrected at the theorem, measurement, and
conjecture levels. I found no remaining statement that changes the scientific conclusion
or requires another referee round.

This recommendation does not mean that the package has received journal peer review,
that candidate-new results have an established priority claim, or that the planetary and
solar applications constitute observational validation. The article now states those
boundaries well enough for public circulation.

## Closure of the six objections

| Prior item | Finding in this round | Disposition |
|---|---|---|
| PF-1: finite regularity and the first-root proof | Proposition 4.2 now assumes $L\in C^6$, defines the bounded normalized-jet regime, derives the structural $O(t^4)$ vanishing, and uses the fourth-order integral Taylor formula plus one further order to obtain $J=t^4(a+tR)$ with a uniform positive coefficient near the homogeneous model. The short-time, compact-bulk, and implicit-function windows now form a valid first-root argument. | **Closed** |
| PF-2: period versus refocusing | The article, README, Part 3, Part 7, D5, and T2 now distinguish the exact period theorem, the eight-period finite-horizon conjugate-point measurement, and Conjecture A. The correction is scientifically material and is consistently expressed. | **Closed** |
| PF-3: T2 notation and critical corollary | Exact formulae use $T$; $t_c$ is reserved for measured conjugate time; the divergence theorem, finite-horizon observation, and caustic conjecture are separated. | **Closed** |
| P1 curvature caveat | P1 now correctly says that the $\beta=0$ experiment cannot identify curvature dependence and points to the later $c_2=1-3\beta/4$ result. | **Closed** |
| F2 claim boundary | The script now conditions the ε⁴ start on the even-power fitting ansatz and explicitly says that theory does not exclude an ε³ term. | **Closed** |
| Guard/build evidence | Guard v5 covers the three previously missed near-context paraphrases and its fixtures pass. The verification record is current and accurately labels HTML-proofer as having no content verdict. | **Closed** |

## Mathematical assessment

The key repair is the new short-time argument for Proposition 4.2. The determinant order
counting is not merely smooth dependence on a parameter: the elevated order of the
φ-component forces all coefficients below $t^4$ to vanish. The integral-remainder
formula then makes $J/t^4$ continuous without an analyticity assumption, and the next
Taylor order supplies the bounded remainder required for uniform positivity. Combined
with compactness away from $0$ and the simple zero at $2\pi$, this excludes an earlier
positive root. This directly answers the previous counterexample
$t^4/12-\varepsilon t^3$.

The F3 certificate independently returned

\[
[t^0]J=[t^1]J=[t^2]J=[t^3]J=0,
\qquad [t^4]J=\frac1{12},
\]

with profile jets, $h$, and launch angle symbolic. O6 independently returned
$c_2=1-3\beta/4$, including the expected zero first-order launch average. These checks
support the stated computer-assisted derivations; they do not replace the article's
explicit proof-status labels, which are now appropriate.

The use of comparison theory as an alternative route is also accurately characterized:
Barilari–Rizzi develop comparison results for the existence and location of
sub-Riemannian conjugate points, but the present article does not pretend that this
literature proves its profile-specific coefficient. See
[Barilari and Rizzi (2016)](https://www.esaim-cocv.org/articles/cocv/pdf/2016/02/cocv150013.pdf).

## Scientific contribution and novelty

The strongest contribution is the combination of:

1. an exact exponential-profile period-average law in complete elliptic-integral form;
2. a demonstrated period/caustic split outside that profile;
3. the computer-assisted caustic coefficient $1-3\beta/4$;
4. a geometric flag/null classification connected to reproducible numerical examples.

The package's use of **candidate-new** remains the correct novelty label. A targeted check
of the closest recent literature found lifted magnetic-flow geometry and abnormal/step
classification, but not an obvious anticipation of this particular period statistic or
profile coefficient. The closest current record is
[Barilari, Bossio and Franceschi, arXiv:2504.09274](https://arxiv.org/abs/2504.09274),
which treats magnetic flows on 3D contact sub-Riemannian manifolds and their lifted Engel
geometry. This is encouraging but is not an exhaustive priority search.

## Astrophysical assessment

The astrophysical layer is now appropriately conditional. The solar, terrestrial, and
Jovian examples are applications of a geometric diagnostic to field models or selected
data products; they do not establish that a measured plasma refocusing observable follows
the sub-Riemannian caustic law. The article's test-particle caveat and its separation of
geometric predictions from plasma dynamics are therefore essential and should remain.

The Jupiter discussion retains the right model-resolution caution. The JRM33 primary
paper describes coefficients as reasonably resolved through degree/order 13, with useful
information extending through 18, rather than treating every degree-18 feature as equally
constrained. See
[Connerney et al. (2022)](https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2021JE007055).

## Independent verification performed

| Check | Result |
|---|---|
| Claim guard v5 | **Pass:** 24 files; 44 banned, 3 require-context, 7 near-context, 2 positive rules; all 33 fixtures caught |
| Lean project | **Pass:** `lake build`, 8661 jobs; no proof placeholder in executable FDFormal code (one docstring mentions the word `sorry`) |
| F3 uniform small-time certificate | **Pass:** exact vanishing through $t^3$, coefficient $1/12$ at $t^4$ |
| O6 caustic coefficient | **Pass:** exact $1-3\beta/4$, with numerical cross-checks agreeing at floating-point precision |
| Docker production build | **Pass:** completed in 67.09 s in this review environment |
| Development rendering | **Pass:** article plus nine series/appendix pages returned HTTP 200 after regeneration |
| Client-side mathematics | **Pass:** article 640 KaTeX nodes/0 errors; Part 3 87/0; Part 7 57/0; D5 154/0; no document-width overflow on those pages |
| HTML-proofer | **No content verdict:** reproduced startup failure because the image lacks `libcurl`; the refreshed log describes this accurately |

The default host Python does not contain SymPy. I reproduced F3 and O6 using a temporary
dependency environment; the repository's documented sibling virtual environment also
contains SymPy and NumPy. This is not a correctness failure, but the exact interpreter
path remains part of the reproducibility contract.

## Scores after revision

Scores use a five-point scale. They describe the present public-facing package, not a
journal's acceptance probability.

| Criterion | Article | Blog/appendix package | Rationale |
|---|---:|---:|---|
| Scientific contribution | **4.1/5** | **3.6/5** | Exact period law, falsified off-profile identification, and profile-sensitive caustic coefficient are substantial; novelty remains candidate-new. |
| Logical correctness | **4.7/5** | **4.5/5** | The proof/measurement/conjecture hierarchy is now coherent across the main public texts. |
| Mathematical correctness | **4.6/5** | **4.3/5** | The former first-root gap is closed and the central symbolic/Lean checks reproduce; some derivations remain computer-assisted by design. |
| Clarity | **4.5/5** | **4.4/5** | Scope and epistemic labels are markedly clearer; the series is still technically dense. |
| Astrophysical grounding | **3.3/5** | **3.4/5** | Strong model-based illustrations and appropriate caveats, but no direct observational test of the caustic statistic. |
| Reproducibility | **4.6/5** | **4.5/5** | Certificates, artifacts, guards, Lean, and rendered checks are strong; the HTML-proofer image and staging/production split remain release-engineering gaps. |

## Non-blocking cleanup

These points do not change the acceptance recommendation and do not require another
scientific re-review.

1. In `docs/T2-closed-form.md`, lines 58–60 say “Step 2 is CLOSED; step 1 above
   (conjugate time = period) remains open.” In the numbered chain, the identification is
   in item 2 and the elliptic average is item 3. Replace the legacy step numbers with
   descriptive names, for example: “The elliptic-reduction step is closed; the
   conjugate-time = period identification remains open.”
2. The production and development containers share `_site`. A production build removes
   the future/unpublished pages, after which the still-running `--future --unpublished`
   server returns 404 until it regenerates or restarts. Separate destinations, or make
   the verification script restart/regenerate the development server before its HTTP
   checks.
3. The article and series pages are future-dated and/or `published: false`. The current
   production build therefore validates the site engine but does not yet prove that these
   pages are included in the production output. At the intended release date, perform one
   production build with the final publication flags and rerun link checking after adding
   `libcurl` to the image.

## Final referee statement

The response has done what a good revision should do: it has not merely softened wording;
it has repaired the missing first-root argument, corrected a scientifically important
period/caustic conflation, and made the automated evidence correspond to the claims. I
therefore withdraw the previous minor-revision recommendation and recommend **acceptance
for public circulation**, subject only to the non-scientific release cleanup above.
