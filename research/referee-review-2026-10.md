# Referee review of the four Lab programs — October 2026

**Question.** Read as a journal referee would, do the four programs (39 posts and
appendices plus the magnetic-flux-lifts article) contain typos, logical or
mathematical errors, numbers that disagree with their own artifacts, or figures
below standard?

**Method.** One referee pass per program (Forbidden Directions split into theory
and real-data halves), each reading every file in full and checking numbers
against `research/<program>/` docs and artifacts; errors were fixed only when the
correct statement could be verified (derivation, artifact, or primary source).
A separate figure audit viewed every referenced image. Verdict for all four
programs: **minor revision** — no headline result changed.

## Errors corrected

| Program | Correction | Verified against |
|---|---|---|
| Geometry of Seeing | Non-inflectional elastica curvature rescaled: $(2/\sqrt m)\,\mathrm{dn}(s/\sqrt m \mid m)$, not $2\,\mathrm{dn}(s\mid m)$ | pendulum ODE; Appendix A3 |
| | Mirror coincidence condition $\theta_A\in\{0,\pi\}$ (was $\equiv 0 \bmod 2\pi$) | symmetry $(x,y,\theta)\to(x,-y,-\theta)$ |
| | Conjugate/cut-time theorems attributed to Sachkov 2010 (were "2011, Thm 2.1") | arXiv:0903.0727 |
| | A5 no longer boxes $t_\text{cut}=t_\text{Maxwell}$ as general; cut/conjugate definitions fixed | Part 4 |
| | A4: AGM convergence caption, "quartic in sn"; A5 sample-code error bound ($2.4\times10^{-2}$, not $10^{-6}$) | run of the code |
| | Agrachev–Sachkov chapter pointers (PMP Ch. 12, Lie groups Ch. 18, Jacobi equation Ch. 21) | book contents |
| Cosmic Web | Planck bridge significance 2.2σ (was 2.4σ in B3/B5) | `e3e_results.json` |
| | Early flawed win +0.07; oracle gap closed "85–90% (86% on matched seeds)" | 50-seed report; E5 artifacts |
| | "Hessian wins 50/50 seeds" false in one cell (lift wins 3/50) | `e0_results_straight.json` |
| | Palatini action coefficient $1/(32\pi G)$ (was $1/(16\pi G)$) | $\epsilon_{abcd}e^a e^b R^{cd}=2R\,\mathrm{vol}$ |
| | Caustic taxonomy: $A_3$ walls, $A_4/D_4$ filaments, $A_5/D_5$ nodes | Feldbrugge et al. 2018 |
| | Tidal-ellipsoid labels (two positive in-plane eigenvalues = filament) | Appendix B2, `src/fields.py` |
| Caustics to Groups | Two-trailer car is Goursat (2,3,4,5), not Cartan (2,3,5) | `src/liegroup.py` |
| | SE(2) invariants $\kappa=\chi>0$ (was $\kappa<0$); G₂ is the smallest exceptional group | structure constants |
| | SE(3) is six-dimensional; bracket figure now a true four-move commutator | code; rendered |
| | Measured slopes, "perfect diagonal" (Cartan 24/25), abnormal-existence claim scoped | `e0_results.json`, E1 |
| Forbidden Directions | D3: a rank-2 fold keeps $k=1$, $Q=6$ (was $k=2$ "at the fold") | article Cor. 5.1 |
| | Tolerances: closed form $4\times10^{-9}$ (was $10^{-10}$); Conjecture A $\lesssim10^{-7}$ (was $10^{-8}$) | `p5_series.json` |
| | Growth vector is a local *confirmation*, not an independent detector | `run_p2_nulls.py` |
| | Fan-plane types: radial = node, spiral = focus (was "X / O") | null topology |
| | Jupiter longitudes are east System III; sphere-degree values re-ordered | `j2b_sensitivity.json` |
| | T96 audit covers the 70 core-box nulls, not all 149; dates, units, Dungey estimate | S4/S5 docs |

Also: 2 KaTeX parse errors, undefined labels (G1, R3, F2, O6, Conjecture A)
defined at first use, and ~40 spelling/grammar/notation fixes.

## Figures

22 figures regenerated from their artifacts (presentation only): in-figure titles
and prose blocks removed, axes labelled with units and scale, colourbars added,
legends moved off the data, an eight-panel strip re-laid as 2×4, and a real
plotting bug fixed (a stray chord across the Jupiter spine). Captions and alt text
now carry everything removed from the images.

## The ten open items — resolved

| # | Item | Resolution |
|---|---|---|
| 1 | Caustics artifacts on disk were reduced runs | All experiments re-run at full settings (≈10 min). E0, E2, E4, E6, E8 reproduce the docs exactly. E1 was **not reproducible**: `run_e1.py` seeded with Python's per-process salted `hash()`; now `zlib.crc32`. Text follows the regenerated artifacts: exact accuracy at noise 0.03 is 0.55 (was 0.52), class accuracy 0.98 (was 0.96), clean accuracy 0.99 ("near-perfect", was "perfect"). No verdict changed. Reach curves are now stored and plotted from the artifact. |
| 2 | "It is a theorem" that local caustics are group-blind | Split into the theorem (generic Lagrangian maps, n ≤ 5, away from the pole and abnormals) and the program's working hypothesis. New experiment E10 (`run_e10.py`): fold germs (corank 1, kernel transverse) at the first conjugate point in 24/24 geodesics for SE(2), Engel, Cartan; Heisenberg control 0/24. Cusps and SE(3) remain unchecked and are stated as such. |
| 3 | Cosmic Web Part 1 deviations list incomplete | Added the simulation swap (Quijote/TNG → in-house Zel'dovich and PM boxes; CAMELS only validates the PM code) and the survey swap (SDSS DR17 → BOSS DR12 CMASS-North), each with its effect on the hypotheses. Added the missing T1 verdict (refuted). |
| 4 | Research docs still said 89% | SYNTHESIS, MODEL-CARD, PAPER-DRAFT, `main.tex` now say 86% on matched seeds 4–6, with the origin of the old figure; ACT significance 1.7σ (unrounded 1.67); seed-win counts corrected. |
| 5 | Per-bin figure mixed seed sets | All three series recomputed on seeds 4–6 (`make_perbin_matched.py`); figure data, caption and model-card table updated. B3 caption states seed counts; B4 distinguishes "2 voxels" from "2 h⁻¹Mpc". |
| 6 | Grochowski reference | Confirmed: Bull. Polish Acad. Sci. Math. 50(2) (2002) 161–178. Neyrinck (MNRAS Letters 455, L11) and Feldbrugge et al. (JCAP 05 (2018) 027) confirmed. |
| 7 | Forbidden Directions: scale, units, unsourced numbers | Pixel scale derived from FITS headers and the resampling code: 3.23″ = 2.3 Mm per grid px (`hmi_scale.json`); heights now given in Mm. Normalisations defined (M̂ = ∇B / max\|λᵢ\|, J∥ dimensionless). "4777 G" and the T96 audit are now in artifacts — and the audit **corrected a claim**: boundary nulls are 0.68–26.8 R_E outside the magnetopause (median 1.5), not "a thin shell under 1 R_E". The two Jupiter census files disagreed because one applied the shell floor inside Newton; aligned, both give 32/40. |
| 8 | Part 4 called an analytic field "real" | Subtitle and heading now say "analytic ABC-like test field"; "real" is kept for observations only. |
| 9 | Geometry of Seeing Part 4 title contradicted its body | Retitled "The Exact Cut Time on SE(2) — and the Open Problem Beyond It"; Part 3 now says a tie bounds the cut time, with equality as the SE(2) theorem. |
| 10 | Unchecked citations; unlabelled schematic figures | The free-geodesic formula is from Moiseev–Sachkov (arXiv:0807.4731, §4.3), not "Sachkov 2011, eqs. 24–28"; the symmetry group is (ℤ₂)³ with the 2π shift as printed in that paper; code-identity claims softened to "same algorithm"; snippets fixed to the `elliptic` package's real API. All plane panels carry axis labels or a scale bar. A dead demo link (11 places) and a NaN in the phase-portrait figure were fixed. |

### The four follow-ups — resolved

| Item | Resolution |
|---|---|
| Solar figures labelled in px | Ten figures re-rendered with axes in Mm, each at its own day's plane-of-sky scale (`hmi_scale.json`); "normalised" axes now state the normalisation; captions carry the no-foreshortening caveat. |
| Cusp germs on Engel/Cartan; SE(3) | Experiment E11 (`run_e11.py`, pre-registered in `docs/E11-cusp-germs.md`). Calibration passed: SE(2) gives 4 cusps per loop, 16/16 verified. Engel: 21 tangency points, 7 pass every pre-registered cusp test, 10 more at a finer scale chosen post hoc, 4 are degenerate. Cartan: 38 points, 16 pass, 7 more post hoc, 10 degenerate, 5 undecided. **The hypothesis "every tangency is a standard cusp" is refuted as stated**: at 10 of the 14 degenerate points a one-parameter family of geodesics refocuses at one point, the Heisenberg mechanism. SE(3): 23/24 folds on the group, 0/24 on its nilpotent cone. The posts now say the hypothesis holds at the sampled folds and standard cusps, and that the symmetry exception is wider than Heisenberg alone. |
| Cosmic Web paper PDF stale | Rebuilt with `tectonic` (14 pages, no unresolved references). The abstract compared a three-seed result with a five-seed bound ("within 0.05"); paper, draft and posts now say within 0.07 on matched seeds. |
| Journal numbering for the Sachkov papers | The three ESAIM: COCV papers were read as published PDFs (Numdam). Journal section and theorem numbers differ from the preprints; citations now give the journal number with the preprint number in parentheses. The two J. Dyn. Control Syst. papers are paywalled and keep preprint numbering, labelled as such. Found on the way: Moiseev–Sachkov call the oscillating-pendulum SR family *non-inflexional* and the rotating one *inflexional*, the reverse of the elastica naming the posts had applied to both; SR families are now named by pendulum regime (C₁, C₂, C₃) with a note. |

### Still open

- Caustics: swallowtails and higher germs unsearched; 4 Engel and 5 Cartan tangency points unexplained or undecided; the E11 loop search skipped intervals where the conjugate time jumps, so it is not exhaustive.
- Figure numbers cited from the paywalled J. Dyn. Control Syst. papers remain preprint numbering.
- Book-chapter annotations for Montgomery, Marsden–Ratiu, Arnold, Spivak and Whittaker–Watson were not checked against the books.

## Glossary

- **Referee pass** — a full read of one program by one reviewer with authority to
  fix only verified errors.
- **Artifact** — a result file written by a research script
  (`research/<program>/artifacts/*`); the source of truth for every number.
- **Minor revision** — journal verdict: correct in substance, needs small fixes.
