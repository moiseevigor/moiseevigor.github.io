# Preferred Directions — sub-Riemannian geometry of physical connections

An independent research program. Charter: [`docs/PROGRAM.md`](docs/PROGRAM.md).

**Thesis.** The class of physical environments studied here carries genuine sub-Riemannian
geometry **because a connection's curvature is a physical field** (one-way: not every
sub-Riemannian structure arises this way, and Part 1's selection rule is what admits an
environment into the class). On the total space (configuration ×
holonomy) the SR invariants read that curvature off: the growth vector gives its
*vanishing order*, the ball–box exponents give the *cost of accumulating holonomy*, and the
conjugate locus / moduli give a *profile-calibrated combination of its gradient and
profile curvature* — $(1-\tfrac34\beta)\lvert\nabla\ln B\rvert^2$ at leading order,
blind at $\beta = \tfrac43$ (the original "gradient" phrasing was the hypothesis;
superseded by V1/O6/F2, article §4).

**Selection rule.** A direction must be *forbidden*, not merely slow, and reachable only
through a **bracket**. Most "preferred direction" phenomena fail this: anisotropic transport
($D_\perp\ll D_\parallel$) is anisotropic *Riemannian*, $Q=n$; the limit $D_\perp\to0$ is an
integrable rank-1 foliation. Magnetic fields, rotating frames (Coriolis) and Berry
connections pass.

## Relationship to `research/caustics-to-groups`

A **dependency**, not a replacement. That program built and validated the sub-Riemannian
toolkit; this one consumes it and points it at physical connections. Both continue, each
with its own open threads. Nothing here demotes anything there.

Shared math core is **imported, never copied**, from `../caustics-to-groups/src/`
(`liegroup.py`, `growth.py`, `caustics.py`, `heisenberg.py`, `magnetic.py`).

## Results so far

| Experiment | Question | Verdict |
|---|---|---|
| **E9** (sibling repo) | Is $Q=d+k+2$ a law? | ✓ confirmed, $k=0..3$, $d=2$ |
| **P1** | Do the moduli measure $\nabla B$? | ✓ confirmed on the exponential profile: $\delta=-\varepsilon^2+O(\varepsilon^4)$; general 1D leading coefficient is $1-\tfrac34\beta$ (article Prop 4.2) |
| **P2 law** | $Q=k+5$ in 3D? | ✓ confirmed; growth vector jumps $5\to6$ at a null |
| **P2 nulls** | SR vs standard null-finder (ABC-like field) | ✓ agrees on location & order; type open |
| **P2 solar** | SR estimator on a REAL SDO/HMI coronal field | ✓ independent local confirmation at a root-finder location (Q=6) — not blind detection; raw-grid resolution-limited; methods demonstration on LOS convenience products (G1 charters the definitive version) |
| **R1** | Does $Q=6$ fire at every null type (Parnell battery + real)? | ✓ 5/5, radial & spiral — the tangent-cone consistency check is type-agnostic (not blind detection) |
| **R2** | Does integrated-flow classification beat $\nabla B$ under noise? | ✓ vs pointwise differences, ✗ vs least-squares fit — SR's edge stays detection+order |
| **R3** | Real gallery: 3 HMI days (2011/2012/2014), strongest nulls per region (cap 2 — a gallery, not a completeness census) | ✓ 5/5 confirmed (Q=6) & classified, all methods agree — independent local confirmation at root-finder locations, not blind discovery |
| **R5 theorem** | Can any force-free extrapolation host a spiral null? | ✗ never: $J=\alpha B$ vanishes at nulls ⇒ $\nabla B$ symmetric ⇒ radial — the real gallery covers the whole force-free-accessible class |
| **S1 fold** | $Q=7$ at a degenerate (fold) null? Pair separation readable? | ✓ $Q=7$, weights $(1,1,1,4)$ for the SYMMETRIC ($\nabla\mathbf B \equiv 0$) family — a generic rank-2 fold reads $Q=6$ (S5c/Part 6 correction); ✓ midpoint $w_4(r)$: $2\to4$ crossover at $r\sim\sqrt\mu$, universal dilation collapse |
| **S2 solar pairs** | Real pairs? The crossover on the real Sun? | ✓ 4 real pairs (closest 23 px); crossover rising edge yes, fold plateau no (needs a merging pair). Repair: raw-grid null weight $w_4\approx3$ reads directly in the cell-to-structure scale window |
| **S3 magnetosphere** | Do spiral nulls exist in real physics? | ✓→**✗ retracted**: the census found 149 nulls (79 spiral), but the S4b boundary audit shows every one sits OUTSIDE the T96 model's own magnetopause; the valid interior is null-free at all tested drivings — stands only as a boundary-audit lesson |
| **T2 closed form** | Is there an exact law behind $\delta(\varepsilon)$? | ✓ $\delta = 1-\tfrac2\pi K(2\varepsilon)$ — proven for the PERIOD AVERAGE; its caustic reading (conjugate time = period) is verified to $10^{-8}$ but formally open; pipeline agreement $10^{-10}$; mean **period** diverges at $\varepsilon=1/2$ (the refocusing reading of that divergence is Conjecture-A-conditional) |
| **T1 race** | Is the crossover a practical pair-metrology tool? | ✗ the div-free quadratic fit wins every cell by 1–4 orders — crossover demoted to conceptual observable (pre-registered rule) |
| **T3 emergence** | Can we catch a fold forming on the real Sun? | ~ census: arcade 0-null → post-flare pair; the pair is same-signed ⇒ not a fold birth; hourly co-moving tracking specified |

**The law (E9).** With base dimension $d$ and curvature vanishing to order $k$,
$Q = d + k + 2$. Physically: acquiring holonomy $\Phi$ near a curvature zero of order $k$
costs path length $L\sim\Phi^{1/(k+2)}$.

**The moduli (P1).** The magnetic contact structure's geodesics are unit-speed curves of
curvature $B(x,y)\,w$ — Larmor motion. Its tangent cone at $q_0$ is Heisenberg with the
constant field $B_0=B(q_0)$, conjugate time $t_c=2\pi/(B_0|w|)$. The nilpotent deviation
obeys

$$\delta \;=\; 1 - \tfrac{2}{\pi}K(2\varepsilon) \;=\; -\varepsilon^2 - \tfrac94\varepsilon^4 - \tfrac{25}4\varepsilon^6 - \cdots,
\qquad \varepsilon = |\nabla\ln B|\cdot r_L,\quad r_L = 1/(B_0|w|)$$

an **exact period-average law** ($K$ = complete elliptic integral of the first kind;
proven for the launch-averaged $\theta$-period, its caustic reading conditional on the
open conjugate-time=period identification, verified $10^{-8}$; `run_p5_series.py`,
pipeline agreement $10^{-10}$; coefficients are squared normalised central binomials; the mean
**period** diverges at the critical gradient $\varepsilon = 1/2$ and the slowest launch
angle loses its finite period there — read as refocusing, both statements ride on
Conjecture A; measured above critical, the band $\sin\theta_0 \ge (1-\varepsilon)/\varepsilon$
shows no conjugate point within the eight-period integration window, finite-horizon
evidence, `run_r6_supercritical.py`). Found via the precision chain: $c_4$ pinned at
$2.2497\pm0.0009 = 9/4$ (`run_c4_precision.py`; the earlier wide-window $2.52$ was a
truncation artefact and $5/2$ refuted), and **only even powers** (the pre-registered
parity prediction). It inverts as a *leading-order estimator calibrated on the
exponential profile*: $|\nabla\ln B| \approx \sqrt{|\delta|}/r_L$ — the exact relation
would invert $K(2\varepsilon)$ itself, and off-exponential profiles need the
$|1-\tfrac34\beta|^{-1/2}$ calibration factor (article §4). A field gradient
*delays* refocusing where $1-\tfrac34\beta > 0$ (exponential-class included); past
$\beta = \tfrac43$ the derived leading-order effect flips to *acceleration*. See [`docs/P1-moduli-read-grad-B.md`](docs/P1-moduli-read-grad-B.md).

## Layout

- `src/mfield.py` — geodesic flow, conjugate time, and nilpotent deviation of a magnetic
  contact structure.
- `scripts/run_p1_moduli.py` — Phase 1, the decisive moduli experiment.
- `scripts/smoke_test.py` — assert-based self-checks (calibration, gauge invariance, law).
- `docs/` — the charter and the experiment reports.
- `artifacts/` — result JSONs (gitignored, regenerable).

## Reproduce

Uses the sibling program's virtualenv (numpy + scipy); no second venv.

```bash
cd research/preferred-directions
../caustics-to-groups/.venv/bin/python scripts/smoke_test.py
../caustics-to-groups/.venv/bin/python scripts/run_p1_moduli.py
```

## Blog series — "The Geometry of Forbidden Directions"

The program is written up as an eight-part series with five appendices (house `distill`
style, `published: false`, interactive figures drawn from the real artifacts here):

- Part 1 — the research program, the selection rule, the law (animated holonomy loop).
- Part 2 — the magnetic contact geometry; Larmor motion is Heisenberg (real reach-scaling).
- Part 3 — reading the field gradient from the caustic on the exponential profile;
  `δ = −ε²` there (general 1D profiles: `1 − 3β/4` calibration; two-view figure).
- Part 4 — finding magnetic nulls; external validation on the ABC-like field (axonometric).
- Part 5 — the null gallery: grounding on the real Sun; the classification race (R1–R3).
- Part 6 — the transition state: the fold (generic rank-2 reads Q = 6; Q = 7 belongs to
  the symmetric $\nabla\mathbf B \equiv 0$ family only), the crossover, new worlds (S1–S3).
- Part 7 — the litmus tests: the period-average law, the race verdict, the emergence
  census (T1–T3).
- Part 8 — Jupiter: the polar dome+spine patch, the buried null, the two-resolution
  cell-prefiltered census + stress ensemble (J1–J2).
- Appendices D1–D5 — connections/holonomy, the selection rule, the law derived, the
  geodesic flow, and the gradient formula.

Registered in `_data/series.yml` (`id: preferred-directions`); files under `_posts/` and
`_appendices/` dated 2026-08-05 … 2026-09-02.

## Open frontiers (after Phases 2–5)

- Do the conjugate-locus **moduli** distinguish what the growth vector can't (null
  sub-classification)? The one framework leg never raced.
- A formal proof that the per-angle conjugate time equals the θ-period **on the
  exponential profile** (currently verified to $10^{-8}$ there; the equality is FALSE for
  general profiles — V1 counterexample), and one final literature pass on gyro-period
  integrals in exponential profiles.
- Catch a **fold** on the real Sun: hourly-cadence co-moving tracking of an emerging region
  with null identity tracking (requirements in `docs/T3-emergence.md`).
- Cross-match the magnetospheric census against in-situ Cluster/MMS null catalogues.
- The $\mu<0$ null **ring**'s SR signature; GR fields (the flux lift on curved spacetime).
