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

## Open items for the author (not changed — unverifiable or author's call)

1. **Caustics artifacts on disk are reduced runs** (`e1`: n_eval = 10; `e0`: 6
   trials) while posts quote the full runs (25 seeds, K = 30). Re-run or re-point.
2. Caustics: "it is a theorem" that local caustics are group-blind — ADE
   universality covers generic Lagrangian maps; no Engel/Cartan computation shown.
3. Cosmic Web Part 1 "Deviations" list omits the dataset swaps (Quijote/TNG →
   in-house PM + CAMELS; SDSS DR17 → BOSS DR12 CMASS).
4. Cosmic Web read-only docs (SYNTHESIS, MODEL-CARD, PAPER-DRAFT) still say 89%.
5. Cosmic Web Part 2 per-bin figure mixes seed sets (5-seed ZA/oracle vs seeds 4–6).
6. Grochowski reference (Part 3): probably Bull. Polish Acad. Sci. Math. 50 (2002).
7. Forbidden Directions: no physical scale (Mm/px) for null heights; J∥ has no
   units; "peak 4777 G" and the T96 audit counts are in no artifact;
   `j2_census.json` (33/40) and `j2b_sensitivity.json` (32/40) disagree slightly.
8. Forbidden Directions Part 4 title calls the analytic ABC-like field "a real
   dynamo field".
9. Geometry of Seeing Part 4 title "The Open Problem: Exact Cut Time on SE(2)"
   contradicts its body (SE(2) is solved; the open problem is beyond it).
10. Geometry of Seeing: "Sachkov 2011, eqs. 24–28" and the reflection-group
    generators not checked against the journal versions; schematic plane panels
    have no axis labels.

## Glossary

- **Referee pass** — a full read of one program by one reviewer with authority to
  fix only verified errors.
- **Artifact** — a result file written by a research script
  (`research/<program>/artifacts/*`); the source of truth for every number.
- **Minor revision** — journal verdict: correct in substance, needs small fixes.
