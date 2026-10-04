# Editorial review — "Geometry of Seeing" & "Geometry of the Cosmic Web"

*Referee-style review of both blog series as submissions to a joint mathematics/astrophysics venue.
Compiled 2026-07-08 from three specialist passes (cosmic-web Parts 1–2; appendices B1–B5; appendices
A1–A4) plus a line-level pass over Seeing Parts 1–4, A5, and the spacetime capstone.*

---

## Editorial summary and verdicts

**Geometry of Seeing (P1–P4, A1–A5).** A rare object: a pedagogically serious, internally
cross-checked exposition of sub-Riemannian geometry on SE(2) written by a co-author of the source
literature, with runnable self-checks and correct sign discipline almost everywhere. Two problems
block publication as-is: (1) a **series-level conflation of the SE(2) sub-Riemannian problem with
Euler's elastica problem** — appendix A3 contains the mathematically correct account, and the rest of
the series contradicts it; (2) the **"Open Problem" framing in Part 1 misstates the state of the
art** relative to Sachkov's 2010–2011 theorems and now also contradicts Part 4. Verdict: **major
revision** (narrative re-anchoring; no result collapses).

**Geometry of the Cosmic Web, empirical core (P1–P2, B1–B5).** Methodologically above field norms —
pre-registered kill criteria, a self-caught benchmark artifact honestly reported, jackknife-deflated
significances, physically-null controls, an oracle-bound technique worth imitating. The physics is
consistent with standard ΛCDM structure formation except where noted. Blocking issues: the **H3
verdict as printed contradicts its own kill criterion**, the **9σ headline needs re-framing** against
the published tSZ-filament literature, one **unit error**, and a required **pre-registration
deviations table**. Verdict: **minor-to-moderate revision**.

**Spacetime capstone (cosmic-web P3).** The Klein→Cartan→gauge story and the tidal dictionary are
textbook-correct; the filament-theory section matches standard Zel'dovich/caustic theory. Needs
hedging on three physics-status claims (torsion bounds, GW-polarization exclusions, Einstein–Cartan
bounce attribution). Verdict: **minor revision**.

---

## Part A — Findings that touch established theory
*(the "errors and mishaps with the current theory" the review was asked to prioritise)*

**A1. [MAJOR — Seeing, series-wide] SR geodesics on SE(2) are not Euler elastica, and the series
says they are — except A3, which gets it right.**
Part 2 (§"From the pendulum to the curve") claims the SR geodesic's plane projection has curvature
κ(s) = 2k·cn(s|k²) after the ds = |h₁|dt reparametrisation, "carried out in full in Appendix A3."
A3 actually derives the opposite and is correct: the SR projection has κ_SR = cot(φ/2) — unbounded,
with **cusps** where the forward velocity h₁ vanishes (which happens on every inflectional libration)
— and the smooth 2k·cn / 2·sech / 2·dn profiles belong to the *sister* problem with u₁ ≡ 1 (Euler's
elastica). Independent checks: cot(φ/2) satisfies no Duffing equation κ'' + κ³/2 − μκ = 0; and the
κ = 2k·cn ⇒ θ = 2 arcsin(k·sn) ⇒ y = 2k(1−cn) triple verified numerically in this repo is exactly the
*elastica* curve, self-consistently. This matches the published distinction (Duits–Boscain–Rossi–
Sachkov: SE(2) SR geodesics are generically cuspidal; elastica are a different family) — and A5's own
aside about "cuspidal trajectories" already knows it.
**Inherited by:** P2 §pendulum-to-curve and its figures ("every geodesic of SE(2) projects to one of
these curve types"); P1 Fig 4 caption; A1:399–403, 520–521; A2:329–331; A4:282–288; A5's boxed
"plane projection of the SR geodesic" (its own hedge notwithstanding); P3/P4's labeling of the
y = 2k(1−cn) family as "the SR geodesic"; the capstone's synthesis-table cell "κ = 2k cn".
**Fix:** adopt A3's "shared vertical subsystem, two horizontal problems" formulation series-wide;
state precisely which problem each closed form solves, quoting Sachkov (2011) eqs. (24)–(28) for the
SR side. The Maxwell/cut analysis of P3–P4 stands for the elastica family as computed; whether each
"first Maxwell time = 4K(k²)/ω₀" claim is the SR-problem statement, the elastica statement, or an
upper branch of a min over strata must be verified against Moiseev–Sachkov (2010) — see A5 below.

**A2. [MAJOR — Seeing P1] The "Open Problem" box misstates the state of the art and now contradicts
Part 4.** P1 presents t_cut = t_MAX as "conjectured — and verified numerically," with "a complete
proof in all degenerate cases remains open." Sachkov (ESAIM COCV 2010, 2011) *proved* the cut time
and full optimal synthesis for the SE(2) SR problem; Part 4 says so ("SE(2) itself is solved") and
relocates the open problem to the general Maxwell-equals-cut question. Re-word P1's box to match P4:
either state precisely which degenerate boundary statement remains unproved (with citation) or frame
the open problem as the general theorem beyond SE(2).

**A3. [MAJOR — Cosmic P1/P2] "Matter falls across filaments, not flowing along them" flattens a
standard nuance — and the series' own data shows the along-flow.** Standard picture: filament
*growth* is transverse (the posts get this right), but flow **along** filaments feeding nodes is real
and significant (filaments as transport highways). The series' own measurements show it:
⟨|v̂·e₃|⟩ ≈ 0.54–0.57 > 0.5 in every bin, P2-statistic 0.364 > 1/3 inside spines. Correct statement:
"filament growth is transverse; along-spine drainage toward nodes exists and is detected here at weak
amplitude" — with the caveat that 128³ PM at 1 h⁻¹Mpc under-resolves intra-filament streaming (needs
external check against Tempel+2014-class alignment amplitudes).

**A4. [MAJOR — Cosmic P1] H3's ✓ contradicts its own pre-registered kill criterion, and the 9σ
headline misreads against the literature.** Pre-registration made H3 *comparative* (lift spines must
at least match the standard skeleton's stack significance); measured: Hessian 8.99σ vs lift 6.86σ,
and after halo masking 1.95σ vs 0.07σ — by its own criterion H3 is killed or at best confirmed only
in the weakened "both webs trace real gas" sense. Separately, P1's bare "up to 9σ" implies a 9σ
filament detection, which would conflict with the field; the series' own decomposition shows the 9σ
is dominated by the tracer galaxies' halo gas, with the inter-halo bridge at ≈2σ per instrument and
y ~ 1.2–1.4×10⁻⁸ — which *matches* published bridge detections (de Graaff+2019, Tanimura+2019).
Re-grade the H3 row; reframe the headline as "halo-dominated 9σ; bridge component ≈2σ, reproducing
published amplitudes."

**A5. [MAJOR-verify — Seeing P3, project page, A5] Symmetry group and "first" Maxwell time vs the
source paper.** The series commits to ℤ₂×ℤ₂ (time reversal, mirror, composite) and to
t¹_MAX = 4K(k²)/ω₀ for the inflectional family. Moiseev–Sachkov (2010) work with the full reflection
group (ε¹…ε⁷ ≅ ℤ₂×ℤ₂×ℤ₂ in the companion elastica paper) and express the first Maxwell time as a
*minimum over strata*, at least one branch of which is a transcendental-equation root rather than 4K.
Verify against the source: (a) group order as attributed; (b) whether 4K is the binding stratum for
all k or an upper branch. If the latter, P3's box and P4's "cut time = 4K" require the min-form, and
the "same elliptic period" punchline needs a qualifier.

**A6. [Cosmic P2/B1/B4] "Adhesion (1989)" misattribution.** The ladder row "stick at walls —
adhesion (1989)" scoring 5.34 (worse than ZA) is the series' *isotropic-sticking proxy*, not the
published adhesion model (Burgers/Hopf–Lax), which is generally regarded as improving on ZA.
Relabel; do not let the proxy's failure read as a failure of Gurbatov–Saichev–Shandarin adhesion.

**A7. [Capstone] Three physics-status claims need hedging.** (i) "Torsion has never been detected; no
experiment is yet precise enough to bound it meaningfully" — too strong: laboratory/astrophysical
bounds on specific torsion couplings exist (spin-polarized-matter experiments; Kostelecký-framework
constraint tables). Say "bounds exist on specific couplings; no detection." (ii) "absence of extra
GW polarisations rules most propagating-torsion versions out" — fair qualitatively but needs a
citation and "constrains" rather than "rules out." (iii) The Einstein–Cartan bounce should be
attributed (Popławski). Also, Newton–Cartan arises from gauging the *Bargmann* (centrally extended
Galilei) group — footnote-level correction.

**A8. [Seeing P2/A3] "Euler spiral" mislabel of the separatrix.** The E = 1 elastica κ = 2 sech s is
the borderline/solitary elastica (one loop, Δθ = 2π, asymptotic to a line) — not the Euler–Cornu
clothoid (κ ∝ s, two eyes), whose phenomenology ("Fresnel", "winding around two limiting points")
P2 wrongly attributes to it. Rename "critical/borderline elastica"; note P2's own Δθ = 2π line is
correct and inconsistent with the clothoid reading. (The k→1 *inflectional* curves do wind into two
eyes; the mislabel is specifically about the separatrix itself.)

**A9. [Seeing A2] Chow–Rashevskii proof sketch is false as stated.** The composition-of-flows map has
rank ≤ 2 at the origin (bracket directions appear at second order — that is the whole subject);
the inverse-function-theorem argument fails at t = 0. Fix via the endpoint map at nonzero parameters
or cite the Orbit Theorem.

---

## Part B — Factual/internal errors (fix-list)

**Cosmic web.**
1. P2 fig-ladder caption: "grid cells of about 1.4 million light-years" — 1 h⁻¹Mpc ≈ **4.7 Mly**
   (the posts' own footnotes get it right); "1.4" is the Mpc value mislabeled.
2. B4 transfer table mixes units against its own source: the coarse row is in 2 h⁻¹Mpc *voxels*
   (≈4.18/4.08 Mpc/h physical) under a "physical h⁻¹Mpc" header — as printed, coarsening appears to
   halve the physical error, contradicting B4's "error scale is set by physics, not the grid."
3. B1:235 quotes 0.364 as a *velocity* streaming statistic; it is E2's chord-deviation direction
   statistic P2 (null 1/3). The velocity statistic is P1 ≈ 0.56 (null 1/2). Name both.
4. Pre-registration deviations to table (mandatory for the framing): DisPerSE/NEXUS never run
   (in-house Hessian substituted); E0 testbed changed to Voronoi toys; M1 tolerance 0.5 → 2 vox,
   junctions → 3 vox; orientations 60–160 → 42; M5 controls ≥1000 → 200; H4's M4 replaced by the
   direction-statistic protocol (state the substitution; the inference itself is sound).
5. "Tidal tensor of the model's own density" (B1/B4): undefined object as phrased — say "computed
   from the model's density via Poisson." Add one sentence noting the density-Hessian detector
   (axis = top eigenvector) vs potential-Hessian tidal frame (axis = e₃) opposite-convention trap.
6. B4 damping recipe: state the frame (damping toward box rest is not Galilean-invariant; defend the
   bulk-velocity≪infall assumption), and discuss why both-perpendicular damping beats
   pancake-ordered damping when B2's own ordering predicts otherwise.
7. Number drift to reconcile: ZA 4.97/4.98/5.00; E5 4.91±0.14 vs "4.93"; "cutting error by 3–17%"
   vs table span −2…−22%; B3 text Δ=−0.045…−0.066 vs figure max −0.057; "70+ control stacks" vs 200;
   1.2/0.5 printed as ≈2.2σ (it is 2.4σ); "89% of the gap" recomputes to 90.2%; "512 h⁻¹Mpc cubes"
   are radially ~250 h⁻¹Mpc slabs; P2:560 "4.4 h⁻¹Mpc residual" is the along-axis component (3D RMS
   ≈8); fig-e1b caption "leads at both densities" contradicts the text's tie at σ∥=3.
8. ZA displacement written with the raw peculiar potential is dimensionally inconsistent in P1
   (B1's Φ⁽¹⁾ and the capstone's "suitably scaled" phrasing are fine); define ψ₀ = −Φ₀ and separate
   the two ψ's in B1 (velocity potential vs displacement divergence).
9. B5: add the n_e² (X-ray) vs n_e (tSZ) scaling and the WHIM 10⁵–10⁷ K range; qualify "WHIM sits
   near y ~ 10⁻⁸" as the stacked-bridge value (prominent individual bridges reach 10⁻⁷–10⁻⁶);
   per-bin 10.1σ > overall 8.99σ needs the correlated-bins clause; ACT large-scale-filtering
   diagnosis needs an external check (DR6 co-adds Planck at large scales).
10. Citation hygiene: E7b report cited but lives inside E8; B3 figure cites E0/E0a absent from its
    reference list.

**Seeing.**
11. A3:360 generator typo: ξ = u₁E₁ + u₂**E₃** (not E₂) — as written the reconstruction is a
    pure-translation flow contradicting the chart equations two lines below.
12. P1's ω₀(k) ("linearised oscillation frequency", k-dependent) vs A5's cylinder-coordinate ω₀ vs
    P3's ω₀ = 1 normalization — unify the definition once, in one place.
13. Abnormal extremals: P2's "abnormal ⟺ h₁ ≡ 0" should be h₁ ≡ h₂ ≡ 0 (contact structure ⇒
    abnormals are trivial/constant); the "Sachkov 2004 (generalized Dido)" citation is the wrong
    problem for this claim.
14. A3 PMP box omits the free-terminal-time condition ℋ ≡ 0 (what fixes the unit level);
    transversality unstated.
15. A4 Fig A4.2 JS bug: slider handler resets the AGM iteration before the new m is read — iteration
    converges against the *previous* m while the reference line shows the new one. Reorder.
16. Smaller: A1 Fig A1.1 "pure a₂ → circle through origin" (pure rotation fixes the origin; the
    circle is the screw case); Part 2 "K(k²) is the exact half-period of sn" — quarter-period (its
    own code comment is right); A1 §6 asserts rather than derives the coadjoint cylinders that P2
    promises it derives; A3 Fig A3.3 caption promises a √c-rescale the code ignores; A5's
    `conjugate_time_inflectional` docstring says "closed form" over an approximation; A3's Part-2
    "quotation" is a paraphrase inside quotation marks; verify A1 ref "ESAIM COCV 17(4)" issue
    number and P1's "Fig. 34" pointer.

---

## Part C — Statistics & methodology assessment

The B3 protocol (matched realized length, held-out seeds, competitor-favoring calibration,
reference-free mass criterion, jackknife over exchangeable patches, provenance hashing) is sound and
better than most published web-finder benchmarks; the corrected-benchmark story (a p≈10⁻¹⁴ "win"
reversed by a 19% length mismatch) is exemplary and publishable on its own. An editor would still
require: (i) an explicit **look-elsewhere / multiple-testing policy** for the E3→E3e estimator
sequence (pre-registration appears only in B5's E3c gate); (ii) honesty about **n = 3 held-out
seeds** (variance-of-variance; report spread or add seeds); (iii) "statistical tie" claims (p = 0.36,
0.55) upgraded to equivalence statements (CI on Δ or TOST); (iv) error propagation for the null
subtraction, and the "9σ" acknowledged as a Gaussian-tail extrapolation of a 200-draw empirical null;
(v) a completeness-vs-length curve rather than one matched operating point; (vi) E2's far-bin
(16–64 vox) "transverse infall" reinterpreted — the nearest-spine frame is not meaningful 30+ h⁻¹Mpc
away.

---

## Part D — Strengths (what an editor would highlight)

- **Methodological honesty as a first-class result**: pre-registered kill criteria; a self-caught
  scoring artifact reported with its reversal; jackknife deflation factors (1.6–2.4×) printed; a
  4.7σ Planck beam-leakage ghost exposed by physically-null pairs; refuted headline hypotheses (H1,
  H4, T1) documented as carefully as wins. "Stricter controls shrink lies, not signals" deserves to
  be quoted.
- **Numerical cross-file discipline**: essentially every ratio, %, and table entry recomputed by the
  referees checks out against the underlying experiment reports; the reproduction Makefile targets
  all exist.
- **The transverse-damping model is a real product**: one knob (β≈0.6), ties MUSCLE, gains grow with
  clustering as a shell-crossing correction should, validated against two independent codes; the
  oracle-bound device cleanly prices physics vs estimation. Publishable as a methods note.
- **B1's theory resolution** — ZA as free motion in growth-factor time, filaments as shocks of flat
  optimal transport, killing the Jacobi-metric hypothesis constructively — is correct and elegant.
- **Seeing series' sign discipline**: brackets, Lie–Poisson structure, Casimir, pendulum reduction,
  every Jacobi-elliptic identity, K/E special values, AGM, Landen, both period normalizations —
  all independently recomputed clean. A3's cot(φ/2) cusp treatment is the most honest account of the
  SR↔elastica subtlety at this level; the runnable self-checks are a refereeing aid other authors
  should copy.
- **The capstone's tidal dictionary** (E_ij = R_{i0j0} → ∂i∂jΦ = B2's tensor) is correct and is the
  right unification: the same object at two levels of one theory, not an analogy.
- **The CAMELS byte-identical CV_0 twins catch** is a community-useful finding — report upstream.

## Part E — Promising directions ("perspective aspects")

1. **Derive β.** The capstone makes it well-posed: is β≈0.6 the leading post-Zel'dovich tidal term
   evaluated in the eigenframe? A derivation (or a clean failure) upgrades the damping model from
   empirical to physical. Related: a MUSCLE×damping field-level hybrid.
2. **The anisotropy-descriptor win is real and portable**: tidal-alignment 0.73–0.76 vs 0.67 (sims)
   and 0.677 vs 0.617 (BOSS) suggests applications to intrinsic alignments / spin–filament studies —
   the lift's one clean survivor deserves its own paper.
3. **Caustic-skeleton bridge**: the capstone's catastrophe dictionary connects the series to an
   active program (Feldbrugge–van de Weygaert); the tidal-eigenframe detectors here are natural
   inputs to it.
4. **Sub-Lorentzian SE(2) analogues** of the Maxwell/cut results (P4's open direction) — genuinely
   uncharted, and this author is unusually placed to chart it.
5. **Small-scale bridge estimators on ACT-class beams**, with the leakage-null machinery already
   built, could turn the ≈2σ bridge into a competitive measurement.

## Part F — Prioritized recommendations

**Before anything ships:** A1 (re-anchor SR vs elastica series-wide, from A3's correct version),
A2 (rewrite P1's Open-Problem box to match P4), A4 (re-grade H3; reframe 9σ), B-list items 1–4
(unit error, B4 table units, mislabeled statistic, deviations table).
**Second pass:** A3/A5/A6/A7/A8 wording and verifications against the source papers; Part C's
statistics upgrades; the remaining B-list.
**Then:** the series is publishable — the cosmic-web methodology/damping-model material arguably in
a journal, not only a blog.

---

## Addendum (2026-07-08) — fixes applied

All text-applicable findings above were applied in commits `f50633b` (Seeing) and
`fa44cbc` (cosmic web), with one upgrade: the source papers were fetched and read
(arXiv:0807.4731; 0903.0727 §§2–3), which sharpened three items beyond the review's
"verify" requests — the reflection group is (ℤ₂)³; the SR cut time on the inflectional
family is **2K(k²)** (half the series' previous 4K claim, which is the *elastica*
mirror-tie value); and Sachkov Thm 2.1 shows the inflectional/critical SR families have
**no conjugate points at all** (finite conjugate bounds exist only for the rotating
family, switching branches at k₀ ≈ 0.909). P1's box, P2's preview, P3, P4 (text and both
figures), A5, and the project page were rewritten around the verified statements.

Not applied (analysis-level, not text fixes): error propagation for the B5 null
subtraction; a completeness-vs-length curve for B3; verifying the "Fig. 34" pointer in
P1's caption; independent re-derivation of the CAMELS twin claim. These remain open in
Part C / B-list.
