# Scientific peer review — Forbidden Directions research program, blog series, and article

**Review date:** 2026-07-13  
**Material reviewed:** current working-tree versions of the Preferred/Forbidden Directions
research program; Parts 1–8 of *The Geometry of Forbidden Directions*; Appendices D1–D5;
the companion article *Growth Vectors and Caustics of Magnetic Flux Lifts*; supporting
reports, source code, and result artifacts under `research/preferred-directions/`.  
**Perspective:** sub-Riemannian geometry and mathematical/observational astrophysics.  
**Recommendation:** **major revision** for both the article and the public blog series.

## 1. Executive assessment

This is an unusually transparent independent research program with a real mathematical
core, executable experiments, explicit negative results, and repeated attempts to falsify
its own preferred interpretation. The strongest result in the current version is the exact
elliptic-integral reduction for the **launch-angle-averaged orbital period** in the planar
exponential magnetic profile,

$$
\frac{\langle T\rangle}{2\pi}=\frac{2}{\pi}K(2\varepsilon),
\qquad 0\leq\varepsilon<\frac12.
$$

I independently reran the symbolic/numerical reduction; it agrees to machine precision.
The flag calculation giving $Q=d+k+2$ at a finite-order zero is also correct under its
stated local hypotheses.

The present package is nevertheless not ready to be presented as a settled research
article or as authoritative scientific exposition. Four issues are decisive:

1. The claimed **caustic law** remains conditional on the unproved identification of the
   first conjugate time with the orbital period for the exponential profile. The period
   theorem is exact; the caustic theorem is not yet proved.
2. The article and blog are internally out of sync. Most importantly, Part 7 still says a
   generic magnetic fold has $Q=7$, whereas the article correctly shows that a generic
   rank-2 fold has $Q=6$. The obsolete “149 nulls, 79 spiral in real physics” conclusion
   also survives in summary documents despite the later finding that all 149 lie outside
   the T96 model magnetopause.
3. The astrophysical evidence is mostly evidence about **constructed or extrapolated
   fields**, not direct evidence of physical solar, magnetospheric, or Jovian events. The
   real-data inputs are genuine, but the claimed nulls and folds are outputs of fragile
   potential-field/model continuations. Several census methods do not establish
   completeness.
4. The novelty discussion omits the closest prior art. Montgomery’s 1995 magnetic lift
   already identifies the lifted sub-Riemannian structure, its extra bracket at a
   nondegenerate magnetic zero, and abnormal minimizers on the zero locus. A 2025/2026
   paper by Barilari, Bossio, and Franceschi explicitly studies lifted magnetic
   sub-Riemannian structures, their step, zero sets, and abnormal trajectories. Until the
   article compares theorem-by-theorem with this literature, its contribution cannot be
   evaluated or advertised accurately.

My overall judgment is therefore:

- **Mathematical contribution:** moderate, with one promising short-note result, but the
  headline caustic interpretation still has a load-bearing proof gap.
- **Astrophysical contribution:** currently limited. The work contains useful model and
  robustness diagnostics, but no securely established new solar or magnetospheric
  phenomenon. The Jovian result is a conditional, falsifiable model prediction.
- **Methodological contribution:** strong. The willingness to publish failed races,
  boundary audits, window tests, and corrected interpretations is genuinely valuable.
- **Expository contribution:** potentially strong after synchronization and claim
  calibration; at present, polished language often outruns the evidence.

## 2. Scoring rubric

Scores use a five-point scale:

| Score | Meaning |
|---:|---|
| 5 | Publication-ready; only editorial changes |
| 4 | Strong; limited, non-load-bearing revisions |
| 3 | Substantive value, but major revision required |
| 2 | Important conceptual/evidentiary problems |
| 1 | Fundamentally invalid or unsupported |

### 2.1 Companion article

| Criterion | Score | Assessment |
|---|---:|---|
| **Scientific contribution level** | **3.0/5** | The period-average elliptic reduction and profile-dependence calculation are potentially publishable. The magnetic lift and $Q=d+k+2$ flag count are mostly classical/elementary once placed beside Montgomery, Martinet, Bellaïche, Jean, and the recent magnetic-lift literature. Novelty of the caustic statistic remains unverified. |
| **Logical correctness** | **3.4/5** | The theorem/measurement/conjecture ledger is excellent and resolves several earlier overclaims. However, the article still draws unsupported conclusions from the profile expansion, calls two-profile evidence a general caustic law, and occasionally switches from period statements to caustic statements without preserving the condition. |
| **Mathematical correctness** | **3.5/5** | Lemma 2.3 and Theorem B are correct. Conjecture A is explicitly open. Several secondary statements need correction: the two-radius identifiability claim, “exact” square-root inversion, the $O(\varepsilon^4)$ remainder as currently proved, the solenoidal codimension count, and the universal-function notation for per-angle conjugate time. |
| **Clarity of content** | **4.0/5** | The status ledger, definitions, and separation of proof from measurement are very good. Clarity is reduced by an abstract that sounds more complete than the paper is, by result/history interleaving, and by terms such as “critical gradient” and “caustic law” being used beyond their proved scope. |
| **Reproducibility** | **4.1/5** | Core scripts run and reproduce the reported numerical relationships. Statistical uncertainty, null-census completeness, data provenance, and environment pinning need improvement. |
| **Astrophysical grounding** | **2.6/5** | The Lorentz-force reduction is physically standard, but the paper does not yet connect its observable to a feasible measurement, a plasma regime, dimensional units, electric fields, guiding-centre validity, or observational uncertainty. |

### 2.2 Blog series and appendices

| Criterion | Score | Assessment |
|---|---:|---|
| **Scientific contribution level** | **2.7/5** | Strong research diary and methods narrative; weaker as a source of established new physics. The negative results and robustness audits are more defensible than several positive “world” claims. |
| **Logical correctness** | **2.5/5** | Later posts correct earlier claims, but the corrections are not propagated consistently. Contradictory fold, magnetosphere, detector, and exact-law statements coexist. |
| **Mathematical correctness** | **2.7/5** | Most local formulas are sound, but the series repeatedly presents a conditional caustic identity as exact, retains the obsolete generic-fold $Q=7$ claim, and describes singular-point $Q$ too casually as a ball-volume exponent. |
| **Clarity of content** | **3.5/5** | The figures, glossaries, and narrative arc are excellent. Precision suffers from superlatives, shifting meanings of “detected,” “real,” “certified,” and “pre-registered,” and an exceptionally dense Part 6 that contains several partially retracted stories. |
| **Reproducibility** | **4.0/5** | Scripts and artifacts are unusually visible for a blog. Some figure claims are not tied to uncertainty estimates or exhaustive algorithms, and some top-level documents are stale. |
| **Astrophysical grounding** | **2.4/5** | Solar and planetary inputs are real measurements/models, but the inferred topologies are model-dependent. The text sometimes equates magnetic nulls with reconnection and model interpolation with physical evolution. |

## 3. Major findings

### M1. The closest prior art must be addressed before any novelty claim

The article currently positions the flux lift through Montgomery’s book and
Kostant–Souriau language, but omits the most directly relevant paper: Richard
Montgomery’s *Hearing the Zero Locus of a Magnetic Field* (1995). That paper already:

- writes the magnetic covariant Laplacian as a sub-Laplacian on a circle lift;
- identifies the horizontal fields determined by the vector potential;
- states that one extra bracket is needed away from a magnetic zero and two at a
  nondegenerate zero; and
- identifies horizontal lifts of the zero locus as strictly abnormal/singular
  minimizers.

This overlaps directly with the article’s magnetic lift, the $k=1$ instance of the flag
law, and the abnormal-geodesic question left open in Remark 1.3/2.6. The $k=1$ statement
is not merely analogous to known work; it is already part of that work’s mechanism.

The article must also compare with Barilari, Bossio, and Franceschi, *Magnetic flows on
3D contact sub-Riemannian manifolds via the Rumin complex* (arXiv:2504.09274, revised
2026, to appear in *Transactions of the AMS*). That paper explicitly characterizes the
step and abnormal trajectories of a lifted structure when the magnetic field may vanish.
Its base geometry differs from the Euclidean flux lift here, but it is close enough that
omission is not acceptable in a 2026 article.

**Required revision:** add a “relation to prior work” section containing a theorem-level
comparison. State precisely which of the following is new: the general finite-order
Euclidean flag formula; the period-average elliptic identity for the exponential profile;
the conjectured conjugate-time identity; the measured profile coefficient; and/or the
astrophysical applications. Do not claim novelty for the magnetic lift, Heisenberg
reduction, nondegenerate-zero extra bracket, or existence of abnormal curves at the zero
locus.

### M2. The period theorem and the caustic conjecture are still conflated

The current article makes a substantial improvement by labeling
$t_c(\theta_0)=T(\theta_0)$ as Conjecture A. That distinction must now be propagated to
every headline, summary, appendix, and post.

What is proved:

1. the reduced exponential-profile orbit admits the displayed first integral;
2. its heading period has the displayed elementary formula;
3. the launch-angle average of that period equals $2K(2\varepsilon)/\pi$; and
4. the period average diverges at $\varepsilon=1/2$.

What is not proved:

1. that the **first** conjugate time equals that period for every launch angle and every
   $0\le\varepsilon<1/2$;
2. that no earlier even-multiplicity Jacobian zero is missed by the sign-change detector;
3. that the absence of a detected zero within a finite time window above
   $\varepsilon=1/2$ means no conjugate point exists; and
4. that the physical “beam caustic” has the same operational meaning as the
   sub-Riemannian exponential-map caustic in a realizable plasma measurement.

The blog still calls the relation an “exact law” and says a charged-particle beam stops
refocusing beyond one-half. Even under Conjecture A, only the slowest launch loses its
period at $1/2$; many other launch angles continue to satisfy the period condition for
$\varepsilon>1/2$. The mean over all angles becomes singular because a subset approaches
the turning condition. “The beam stops refocusing” is therefore too broad.

**Required revision:** use one of these formulations consistently:

- “exact period-average law, numerically equal to the caustic statistic to
  $10^{-8}$–$10^{-9}$ in the exponential profile”; or
- prove Conjecture A analytically, including first-zero status, and then restore “exact
  caustic law.”

### M3. Several statements in article §4 do not follow from the displayed mathematics

Four corrections are required.

1. **Two Larmor radii do not separate gradient and curvature at leading order.** From
   the article’s measured law,

   $$
   \delta(r_L)=-\left[(L')^2-\frac34L''\right]r_L^2+O(r_L^4).
   $$

   Dividing by $r_L^2$ gives the same single combination at every sufficiently small
   radius. Two radii do not identify $L'$ and $L''$ without a derived and independently
   parameterized higher-order term. The current claim of separation is unsupported.
2. **The square-root inversion is not exact even for the exponential profile.** Since
   $-\delta=\varepsilon^2+\tfrac94\varepsilon^4+\cdots$,
   $\sqrt{|\delta|}/r_L$ is a leading-order estimator. Exact inversion would require the
   inverse of $K(2\varepsilon)$, not a square root.
3. **The $\beta=2$ example is a blind spot of the period average, not of the caustic.**
   The article itself proposes the caustic coefficient $1-3\beta/4$, which equals
   $-1/2$ at $\beta=2$, not zero. The sentence saying the “caustic statistic cannot see”
   this field contradicts the subsequent measured law.
4. **The caustic coefficient is not yet a general law.** It is supported by one control
   and two nonzero $\beta$ values ($-1$ and $-1/2$). Two points can select a line against
   one tested alternative, but they do not establish universality over general profiles.
   Moreover, the quoted “$32\sigma$” is not an inferential significance: the script’s
   `sigma` is a deterministic blend of fit-form spread and resolution bias, with no
   stochastic sampling model.

There is also a proof-writing issue in Proposition 4.1: the displayed expansion is
carried only to an $O(\varepsilon^3)$ remainder, yet the result states
$O(\varepsilon^4)$. The parity/reflection argument needed to eliminate the averaged cubic
term should be written for a general profile, including the transformation of all profile
jets, rather than imported from the special exponential family.

### M4. The singular-point interpretation of $Q$ is improved but not fully repaired

Lemma 2.3 correctly computes the bracket flag and weights at a finite-order zero. The
article also correctly retracts the automatic identification of that weight sum with a
small-ball volume exponent at a non-equiregular point. That is a major improvement.

The blog, however, continues to define $Q$ globally as the exponent in
$\operatorname{vol}B(r)\sim r^Q$ and then applies it directly at magnetic nulls. Work by
Ghezzi and Jean shows that Hausdorff dimension and volume near singular strata depend on
the singular locus and nonholonomic orders, not only the pointwise flag. The article’s
“open problem O1” is the appropriate status; the blog must match it.

The criterion in Appendix D2 that “$Q>n$ on a set of full measure” distinguishes genuine
sub-Riemannian geometry is not a standard equivalence and should not be presented as one.
A Lagrangian caustic does not acquire a sub-Riemannian homogeneous dimension at its fold;
an estimator may return a similar scaling exponent, but that is an estimator-confounding
problem, not equality of the geometric invariants.

**Required revision:** reserve “pointwise weight sum” or “homogeneous dimension of the
nilpotent approximation” for the null; reserve Hausdorff/ball-volume assertions for cases
where the non-equiregular theorem has actually been applied.

### M5. The article’s smaller mathematical issues should be corrected

- Proposition 3.1 writes $t_c=r_LF(\varepsilon)$ although $t_c$ was defined per launch
  angle. It should be $t_c=r_LF(\theta_0,\varepsilon)$; only the angle average is a
  one-variable function.
- The text alternates between $\varepsilon=g r_L$ and
  $\varepsilon=|\nabla\log B|r_L$. State $g\ge0$ or keep the sign and prove the averaged
  symmetry explicitly.
- For a solenoidal magnetic field, $\operatorname{tr}\nabla\mathbf B=0$. Setting the
  entire Jacobian to zero is codimension eight in the space of trace-free $3\times3$
  matrices, not codimension nine. The qualitative comparison with a codimension-one fold
  survives.
- At a magnetic zero in the 2D lift, abnormal extremals are not merely an unspecified
  “fine print” issue; the nondegenerate zero-locus case is classical and must be discussed.
- The article should distinguish a local $\mathbb R$ fibre from a global $U(1)$ bundle,
  and state the topology/exactness assumptions under which a global vector potential
  exists.

### M6. “Detection” is often a theorem-assisted consistency check

On the solar gallery, the reported $Q=6$ values are obtained by:

1. finding a null with Newton’s method;
2. measuring its Jacobian;
3. building the exact linear tangent-cone field from that Jacobian; and
4. measuring a weight that is already fixed by the nonzero linear jet.

This does not independently detect the null. It verifies that the code realizes Lemma
2.3 after the standard method has supplied the null and its Jacobian. The later raw-grid
$w_4\approx3$ calculation is more independent, but it is scale-window selected and needs
a frozen, externally validated window-selection rule before it can be called a detector.

The Jupiter raw-field calculation is stronger because it uses an analytic vector
potential without injecting the Jacobian. Even there, the null locations come from the
standard root finder first, so the result is local confirmation, not blind discovery.

**Required revision:** use a three-level vocabulary throughout:

- **blind detection:** candidate location obtained from the SR statistic without a
  standard root/Jacobian input;
- **independent local confirmation:** SR statistic evaluated on the full field at a
  location found by another method; and
- **tangent-cone consistency check:** SR structure constructed from the measured
  Jacobian.

### M7. The solar validation is not yet adequate for astrophysical claims

The solar pipeline is useful as a software demonstration, but it lacks several controls
expected for a solar-physics result:

1. It treats HMI line-of-sight magnetograms as the normal boundary field without an
   explicit radial conversion/deprojection and without propagating HMI uncertainties.
   The appropriate HMI vector/SHARP products and remapped coordinate systems exist.
2. It uses 45-second line-of-sight products in some runs, downsampled from 4096 to 1024,
   rather than a 720-second definitive radial/vector product designed for field modeling.
3. It subtracts the mean flux and applies a periodic FFT continuation to cropped windows.
   The repository’s own window test shows low nulls disappear when the crop changes. Such
   nulls are properties of the chosen boundary-value model, not established coronal
   structures.
4. The Newton seed search is not an exhaustive cell-by-cell trilinear/Poincaré-index
   census. `run_r3_real_gallery.py` also limits output to two nulls per region despite the
   prose saying “every interior null kept.” Completeness and recall therefore cannot be
   inferred.
5. The eight-frame AR11158 sequence is too sparse and too model-sensitive to establish
   null count as a topological complexity index or a relationship to flare capability.

The standard trilinear method of Haynes and Parnell is specifically designed to be
consistent with field-line interpolation and to find candidate cells before subgrid
positioning. It should be the external baseline, supplemented by domain-size, resolution,
noise, and boundary-condition ensembles.

### M8. A magnetic null or fold is not itself a reconnection event

The blog repeatedly calls a null a “reconnection site” and a null collision “the
transition state of reconnection.” In three dimensions, reconnection is defined by
non-ideal evolution and a nonzero integrated parallel electric field; it can occur at a
null, at separators or quasi-separators, or without any null. Conversely, a static null
or a topological fold in a family of potential fields does not demonstrate reconnection.

The “certified solar fold” is a mathematically well-resolved saddle-node in a **linear
interpolation between two cropped magnetogram boundary arrays**. It is not an observed
temporal event, and machine precision in the spectral continuation does not reduce model
or measurement error. In addition, a changing interior null count can be mediated by a
null crossing the finite model boundary, so “every continuous path between the endpoints
crosses a fold wall” requires a fixed domain and an explicit no-boundary-crossing proof.

**Required revision:** call this a “fold in a real-data-anchored boundary interpolation
family.” Reserve “solar fold event” and “reconnection transition” for a temporally tracked,
robust topology change accompanied by appropriate physical diagnostics.

### M9. The magnetosphere result has been retracted locally but not globally

The T96 audit found that all 149 modeled nulls lie outside the model’s own magnetopause,
while the valid interior was null-free over the tested parameter range. This invalidates
the earlier claim that the census demonstrates 79 spiral nulls “in real physics.” The
correct output is a warning about continuation beyond the empirical model boundary and a
negative result about the tested smooth T96 interior.

Part 6 contains this correction, but `README.md`, the earlier S3 report, and Part 7’s
summary retain the positive conclusion. A reader entering through the summary therefore
receives the opposite of the final audit.

**Required revision:** propagate the retraction everywhere. The existence of spiral
magnetic nulls in non-force-free plasma is not in doubt, but this T96 run does not provide
valid interior examples. A Cluster/MMS catalogue comparison or event-conditioned field
reconstruction would be the appropriate astrophysical test.

### M10. The Jupiter result is an interesting but fragile model prediction

The Jovian analysis is potentially the most interesting astrophysical component because
it states a precise, falsifiable location for a null and a fan dome. Its current wording is
still too strong.

1. JRM33 is a degree-30 model. Its coefficients are reasonably determined through degree
   and order 13, with useful information extending through degree 18. The calculation uses
   an $l\le18$ truncation, so “full JRM33 (degree 18)” is internally contradictory. Call it
   “the $l\le18$ JRM33 continuation.”
2. Connerney et al. infer a Lowes radius near $0.81R_J$, not $0.85R_J$. If $0.85R_J$ is a
   chosen evaluation surface, it should not be called the measured dynamo surface or the
   established metallic-hydrogen boundary.
3. “Exactly two nulls” is not established by approximately 3,000 Newton seeds. An
   exhaustive spherical-cell degree test, convergence with seed density, or a global
   topological-degree accounting is needed.
4. No covariance/ensemble propagation of the Gauss coefficients is performed. This is
   especially important because the claimed polar null vanishes at $l\le13$ and therefore
   depends on the less-certain $l=14$–18 tail amplified by downward continuation.
5. Seventy-two fan lines show a dome-like footprint but do not establish that the full
   patch boundary is the fan footprint. The reported boundary-to-footprint 90th percentile
   of $15^\circ$ is large. The absence of bald-patch segments does not by itself prove that
   all remaining boundary segments belong to the null separatrix.

The defensible conclusion is:

> In the $l\le18$ JRM33 potential continuation evaluated down to $0.85R_J$, the numerical
> pipeline finds a polar radial null near $(r,\mathrm{lat},\mathrm{lon})=(0.873R_J,
> 69^\circ,282^\circ)$ whose sampled fan surface forms a dome associated with much of the
> reversed-flux patch boundary. The structure is absent at $l\le13$ and must be treated as
> a high-degree, model-dependent prediction pending coefficient-uncertainty propagation
> and a future field model.

### M11. Statistical language is stronger than the uncertainty model

The reported uncertainty bars are predominantly numerical convergence and fit-model
spread. They are not repeated-sample standard errors, posterior intervals, or calibrated
confidence intervals. Consequently:

- “$280\sigma$” and “$32\sigma$” should not be used;
- fit covariance from a deterministic, truncated asymptotic curve should not be given a
  frequentist significance interpretation;
- uncertainties should be labeled “numerical/fit sensitivity” unless a probabilistic
  error model is introduced; and
- solar/Jovian field-model uncertainty will dominate machine-precision root accuracy and
  should be reported separately.

The exact elliptic derivation already settles $c_4=9/4$ for the period average; a dramatic
sigma claim is unnecessary.

### M12. The research record and the publication layer must be separated

The repository usefully preserves failed hypotheses and superseded interpretations. The
public article and blog, however, should present the current scientific state, with the
history moved into dated correction notes. At present:

- `PROGRAM.md` still says no real data exist and retains an obsolete wide-window
  coefficient;
- `S1-fold-crossover.md` describes $Q=7$ as the magnetic fold result without leading with
  the later generic-fold correction;
- Part 7 says generic fold $Q=7$ after Part 6 and the article say generic fold $Q=6$;
- top-level summaries retain the invalid T96 “real spiral” result;
- the series is described as seven parts even though Part 8 exists; and
- “confirmed,” “proved,” “measured,” “model-derived,” and “observed” are not used with
  stable meanings.

Create one machine-readable/current status ledger and generate or manually synchronize all
summary tables from it. Preserve the historical reports, but label them superseded.

## 4. Minor and editorial findings

1. Use “sub-Riemannian” consistently; avoid “SR” in the article abstract and theorem
   statements unless defined.
2. State dimensions/units in the Lorentz-force reduction. Explain how the fibre momentum
   $w$ maps to charge-to-mass ratio after nondimensionalization.
3. Restrict “uniform rotation is Heisenberg” to the planar reduction. A 3D base produces a
   different rank/corank structure.
4. Replace “contact where $\mathbf B\ne0$” by “contact in the planar lift; quasi-/even-
   contact in the 3D-base lift,” with conventions cited.
5. A magnetic null is a topological feature associated with possible current focusing,
   not automatically a reconnection site.
6. Give NOAA active-region identifiers, exact UTC timestamps, HMI series names, map
   projection, pixel scale, disk position, and uncertainty product for every solar figure.
7. State the seed density, convergence tolerance, deduplication radius, and completeness
   test beside every null count.
8. “Pre-registered” should remain qualified as repository-internal and timestamped. Git
   history can document ordering but is not an external registry.
9. Distinguish “real data,” “data-fitted model,” “field extrapolation,” “analytic test
   field,” and “direct observation” in figure captions.
10. Reduce Part 6 into at least two posts: fold methodology/solar interpolation, and
    magnetospheric model audit. The current density makes logical updates difficult to
    track.
11. The article’s title promises caustics, but its only exact new closed form is presently
    a period formula conditional on Conjecture A for caustics. Either prove the conjecture
    or reflect the conditional status in the title/abstract.
12. The repository should add regression tests that ensure stale, retracted headline
    strings such as “149 nulls, 79 spiral — real physics” and “generic fold $Q=7$” do not
    reappear in current summaries.

## 5. What is strong and should be retained

1. **The exact factorization in Theorem B.** The tangent-half-angle/Gauss-integral chain is
   compact, correct, and well suited to a short mathematical-physics note.
2. **The status ledger.** Explicit labels for theorem, measurement, and conjecture are a
   major improvement and should become the series-wide standard.
3. **The negative races.** Reporting that the least-squares field fit beats both the flow
   classifier and the crossover estimator is scientifically valuable.
4. **The boundary and robustness audits.** The T96 magnetopause audit, solar window tests,
   JRM truncation test, bald-patch alternative, and dipole control are good habits even
   where they weaken the original claim.
5. **Gauge awareness.** The treatment of gauge equivalence and adapted coordinates is
   careful and relevant.
6. **Executable artifacts.** The core numerical results are reproducible locally and the
   scripts are readable enough to audit.
7. **The corrected generic-fold result.** Showing that the scalar order-of-zero statistic
   is blind to a rank-2 fold is an important clarification of what the method cannot see.

## 6. Contribution hierarchy after review

### Tier A — plausible publishable units after major revision

1. **Exponential-profile period average.** Exact elliptic-integral expression, coefficient
   series, and period divergence. To become a caustic theorem, Conjecture A must be proved.
2. **Actual caustic profile expansion.** The numerical evidence for
   $c_2^{\mathrm{caustic}}=1-3\beta/4$ is interesting, but publication requires an analytic
   derivation and tests on more independent profile jets.
3. **Model-robustness methodology.** A methods note centered on how window choice,
   interpolation, model boundaries, harmonic truncation, and null-finder completeness can
   manufacture or destroy modeled magnetic nulls. The negative findings are the result.
4. **Jovian conditional prediction.** Potentially a short planetary-magnetism note after
   coefficient-uncertainty ensembles and exhaustive topology tests.

### Tier B — correct but incremental/classical

1. The Euclidean magnetic flux lift and Lorentz-force reduction.
2. The Heisenberg uniform-field model.
3. The $k=1$ Martinet/nondegenerate-zero growth step.
4. The general finite-order flag count $Q=d+k+2$ as a concise extension/dictionary.
5. The fact that a scalar order-of-zero statistic cannot distinguish radial from spiral
   linear nulls or identify a generic rank-2 fold.

### Tier C — not established by the present evidence

1. A practically superior SR magnetic-null detector or classifier.
2. A physical solar fold/reconnection event.
3. Interior spiral nulls demonstrated by the T96 census.
4. A general two-scale inversion separating field gradient and profile curvature.
5. A universal caustic critical gradient at $\varepsilon=1/2$.
6. A physically established Jovian polar separatrix skeleton independent of uncertain
   high-degree coefficients.

## 7. Required revision plan, in priority order

### Before public release of either article or blog

1. Synchronize every current summary with the generic-fold $Q=6$ correction and T96
   boundary retraction.
2. Replace “exact caustic law” by conditional language everywhere, or prove Conjecture A.
3. Correct the §4 inversion, two-radius identifiability, $\beta=2$, and “sigma” claims.
4. Add Montgomery (1995) and Barilari–Bossio–Franceschi (2025/2026), with explicit novelty
   comparison and abnormal-geodesic discussion.
5. Separate model-derived topology from observed astrophysical events in titles,
   abstracts, figure captions, and status tables.

### Before submitting the mathematical article

6. Prove first-conjugate-time equality, or refocus the article on the exact period result.
7. Complete the general-profile parity/remainder proof and derive the actual caustic
   coefficient analytically.
8. Correct the smaller notation, codimension, global-bundle, and dimensional-analysis
   issues.
9. Provide a formal proposition describing precisely what the reach estimator converges
   to and under what scale/noise assumptions.

### Before making astrophysical discovery claims

10. Rebuild the solar analysis with definitive remapped radial/vector HMI products,
    exhaustive cell-based null finding, domain/resolution ensembles, and propagated
    uncertainties.
11. Treat temporal topology with tracked regions at adequate cadence and explicitly rule
    out boundary crossings.
12. Reanalyze Jupiter with JRM coefficient ensembles, several truncations/models, and an
    exhaustive spherical topology census.
13. Compare any magnetospheric null claim against event-conditioned Cluster/MMS data or a
    validated reconstruction inside the model domain.

## 8. Verification performed for this review

The following repository checks were run on the current working tree:

| Check | Result |
|---|---|
| `scripts/smoke_test.py` | Passed: uniform-field conjugate time, gauge invariance, dilation collapse, leading $-\varepsilon^2$, 2D/3D weight laws, analytic-field null check |
| `scripts/run_t2_reduction_check.py` | Passed: direct integral, Gauss chain, and $2K(2\varepsilon)/\pi$ agree to machine precision; symbolic factorization exact |
| `scripts/run_v1_linear_profile.py` | Reproduced: $c_2\approx1.7466$ for $\beta=-1$ and $1.3741$ for $\beta=-1/2$; also reproduced $t_c\ne T$ away from the exponential profile |
| Artifact audit | Confirmed tangent-cone caveat for solar $Q$, T96 population outside model boundary as reported in later text, crossover race loss, and JRM truncation sensitivity |

These checks validate the implementation against its own analytic targets. They do not
replace an independent proof of Conjecture A, an external statistical error model, or an
astrophysical validation dataset.

## 9. Primary literature that must anchor the revision

- R. Montgomery (1995), [“Hearing the Zero Locus of a Magnetic Field”](https://doi.org/10.1007/BF02101848), *Communications in Mathematical Physics* 168, 651–675.
- D. Barilari, T. Bossio, V. Franceschi (2025/2026), [“Magnetic flows on 3D contact sub-Riemannian manifolds via the Rumin complex”](https://arxiv.org/abs/2504.09274), to appear in *Transactions of the AMS*.
- R. Ghezzi, F. Jean (2013), [“Hausdorff measures and dimensions in non-equiregular sub-Riemannian manifolds”](https://arxiv.org/abs/1301.3682).
- R. Ghezzi, F. Jean (2015), [“Hausdorff volume in non-equiregular sub-Riemannian manifolds”](https://arxiv.org/abs/1501.05342), *Nonlinear Analysis* 126.
- A. L. Haynes, C. E. Parnell (2007), [“A trilinear method for finding null points in a three-dimensional vector space”](https://doi.org/10.1063/1.2756751), *Physics of Plasmas* 14, 082107.
- E. Priest, D. Pontin (2022), [“Magnetic reconnection: MHD theory and modelling”](https://doi.org/10.1007/s41116-022-00032-9), *Living Reviews in Solar Physics* 19.
- M. G. Bobra et al. (2014), [“The Helioseismic and Magnetic Imager (HMI) Vector Magnetic Field Pipeline: SHARPs”](https://arxiv.org/abs/1404.1879), *Solar Physics* 289.
- J. E. P. Connerney et al. (2022), [“A New Model of Jupiter’s Magnetic Field at the Completion of Juno’s Prime Mission”](https://doi.org/10.1029/2021JE007055), *JGR: Planets* 127.
- V. S. Titov, E. R. Priest, P. Démoulin (1993), [“Conditions for the appearance of ‘bald patches’ at the solar surface”](https://ui.adsabs.harvard.edu/abs/1993A%26A...276..564T/abstract), *Astronomy & Astrophysics* 276, 564.

## 10. Final recommendation

**Article:** major revision. A publishable short mathematical-physics paper is plausible if
it is narrowed to proved content, positioned against the closest prior art, and either
proves Conjecture A or clearly makes the caustic formula conditional. The current article
should not be submitted with “complete statements, hypotheses, and proofs” in the subtitle
while its central caustic identification remains open.

**Blog series:** major revision before publication. Retain the experimental narrative,
figures, negative races, and honesty boxes, but synchronize all corrections and adopt
stable evidence labels. The blog can be excellent open research communication; it should
not ask polished prose to carry more certainty than the mathematics or astrophysical data
provide.

**Program:** continue, but concentrate effort on the two decisive frontiers rather than
adding more “worlds”: (1) prove or refute the exponential-profile conjugate-time identity;
and (2) perform one astrophysical test with externally standard data products,
uncertainty propagation, exhaustive null finding, and a frozen detection protocol.
