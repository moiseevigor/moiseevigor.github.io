# Preferred Directions — sub-Riemannian geometry of physical connections

An independent research program. Charter: [`docs/PROGRAM.md`](docs/PROGRAM.md).

**Thesis.** A physical environment carries genuine sub-Riemannian geometry **iff there is a
connection whose curvature is a physical field.** On the total space (configuration ×
holonomy) the SR invariants read that curvature off: the growth vector gives its
*vanishing order*, the ball–box exponents give the *cost of accumulating holonomy*, and the
conjugate locus / moduli give its *gradient*.

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
| **P1** | Do the moduli measure $\nabla B$? | ✓ confirmed: $\delta=-\varepsilon^2+O(\varepsilon^4)$ |
| **P2 law** | $Q=k+5$ in 3D? | ✓ confirmed; growth vector jumps $5\to6$ at a null |
| **P2 nulls** | SR vs standard null-finder (ABC field) | ✓ agrees on location & order; type open |
| **P2 solar** | SR detector on a REAL SDO/HMI coronal field | ✓ detects a real null (Q=6); raw-grid resolution-limited |

**The law (E9).** With base dimension $d$ and curvature vanishing to order $k$,
$Q = d + k + 2$. Physically: acquiring holonomy $\Phi$ near a curvature zero of order $k$
costs path length $L\sim\Phi^{1/(k+2)}$.

**The moduli (P1).** The magnetic contact structure's geodesics are unit-speed curves of
curvature $B(x,y)\,w$ — Larmor motion. Its tangent cone at $q_0$ is Heisenberg with the
constant field $B_0=B(q_0)$, conjugate time $t_c=2\pi/(B_0|w|)$. The nilpotent deviation
obeys

$$\delta \;=\; -\varepsilon^2 \;-\; 2.52\,\varepsilon^4 \;+\; O(\varepsilon^6),
\qquad \varepsilon = |\nabla\ln B|\cdot r_L,\quad r_L = 1/(B_0|w|)$$

with the leading coefficient measured $0.99960$ and **only even powers** (the pre-registered
parity prediction). It inverts: $|\nabla\ln B| = \sqrt{|\delta|}/r_L$. A field gradient
*delays* refocusing. See [`docs/P1-moduli-read-grad-B.md`](docs/P1-moduli-read-grad-B.md).

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

The program is written up as a four-part series with five appendices (house `distill`
style, `published: false`, interactive figures drawn from the real artifacts here):

- Part 1 — the research program, the selection rule, the law (animated holonomy loop).
- Part 2 — the magnetic contact geometry; Larmor motion is Heisenberg (real reach-scaling).
- Part 3 — reading the field gradient from the caustic; `δ = −ε²` (two-view figure).
- Part 4 — finding magnetic nulls; external validation on the ABC field (axonometric).
- Appendices D1–D5 — connections/holonomy, the selection rule, the law derived, the
  geodesic flow, and the gradient formula.

Registered in `_data/series.yml` (`id: preferred-directions`); files under `_posts/` and
`_appendices/` dated 2026-08-05 … 2026-08-21.

## Next

**Phase 2** — 3D, and real magnetic fields. Predicted $Q=k+5$ in $d=3$ (untested). Then a
solar-corona NLFFF extrapolation or MHD snapshot, with the SR-detected nulls and their order
compared against standard null-finding algorithms. **That is this program's first external
validation and it is not optional.**
