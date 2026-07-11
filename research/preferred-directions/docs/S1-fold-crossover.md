# S1 — the magnetic fold: Q = 7, and a null pair read as one scale crossover

Reproduce: `../cosmic-web/.venv/bin/python scripts/run_p4_fold.py` (~6 min).
Results → `artifacts/p4_fold.json`, figure →
`public/img/posts/forbidden-directions-fold-crossover.png`.
Family and predictions: [`PROGRAM-P4-bifurcations-new-worlds.md`](PROGRAM-P4-bifurcations-new-worlds.md).

## H-P4a — the law's first k = 2 point in 3D: **confirmed**

| Point | measured weights | Q | prediction |
|---|---|---|---|
| fold (degenerate) null, $\mu=0$ | $(1, 1, 0.99, 4.00)$ | **7** | $(1,1,1,4)$, $Q=7$ |
| split null, $\mu=0.09$ | $(1, 1, 0.99, 2.98)$ | **6** | $(1,1,1,3)$, $Q=6$ |

The split pair classifies radial− / radial+ — opposite signs, the canonical
pair-creation topology. $Q = d + k + 2$ now stands measured at $k = 0, 1, 2$ in 3D.

## H-P4b — the crossover and its dilation collapse: **confirmed**

The scale-resolved flux exponent $w_4(r)$ at the pair midpoint:

- $\mu = 0$ control: flat at $4$ over two decades (no spurious scale).
- Every $\mu > 0$: clean plateau at $2$ (the field is nonzero at the midpoint —
  locally uniform), then a knee to $4$ (the probe swallows the pair and sees the
  degenerate parent). The knee marches with $\sqrt\mu$.
- **Collapse**: plotted against $r/\sqrt\mu$, all four curves lie on one universal
  crossover (knee at $r/\sqrt\mu \approx 1\!-\!3$) — the dilation symmetry, verified.
- Centred on a member null: plateau at $3$ (single generic null), knee to $4$ when the
  partner enters the probe.

**What this means, plainly.** A pointwise method needs to *resolve* two nulls to know
there are two; below its resolution a merging pair is indistinguishable from one null.
The growth-vector read-out gets the same information from **one point**: the height of
the plateau says what you are sitting on (uniform 2 / single null 3 / degenerate 4), and
the knee location reads the **pair separation** — including for pairs it never resolves
individually. This is the first observable in the program that the standard toolkit has
*no analogue of*, and it is precisely the transition state of magnetic reconnection
(null creation/annihilation) that it measures.

*Post-hoc note (T1):* "no analogue" does not mean "no competitor". The pre-registered
race of P5 pitted this knee estimator against a divergence-free quadratic fit +
root-finding on shared noisy grids; **the fit won every cell** and the crossover is
demoted to a conceptual observable — see [`T1-race.md`](T1-race.md). The plateau
dictionary and $Q=7$ at the fold stand; the separation *estimator* does not.

## The gauge lesson (caught and fixed)

The first run measured flux weight 2 at the split null — a **gauge artefact**: the
vector potential's *symmetric* gradient at the probe point (curl-free junk,
$\partial_1A_2+\partial_2A_1 = \mu \neq 0$ there) contributes an $r^2$ term that masks
the physical $r^3$. Since that term is the gradient of
$\chi = A_0\!\cdot\!d + \tfrac12 d\!\cdot\!S\,d$ (an exact form), it is a pure endpoint
correction; `mfield3d.weights_Q` now subtracts it in general (`gauge_terms`). All
earlier results are unchanged (their potentials had $S = 0$ at the probe points —
re-verified: uniform 5, linear null 6, spiral 6); the fold's split null is the first
configuration that exposed the trap the program's own "gauge-adapt before measuring"
rule warned about.

## Open

- The $\mu < 0$ face (the null **ring**) has its own SR signature — unmeasured.
- The eigenvalue-collision degeneracy (radial↔spiral boundary, improper node) keeps
  $k = 1$, so $Q$ stays 6 — the growth vector is blind to *that* transition (honest).
- S2 asks whether real solar extrapolations contain close pairs showing this crossover.
