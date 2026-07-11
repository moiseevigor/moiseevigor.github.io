# P2 — the 3D law, and null detection validated against the standard finder

Phase 2 of [`PROGRAM.md`](PROGRAM.md). Two parts, both passing:
`run_p2_law.py` (the law) and `run_p2_nulls.py` (external validation).

**Verdict: the 3D law $Q=k+5$ holds, and the SR growth vector is a valid, independent
null detector — it agrees with the standard eigenvalue finder on location and order, and
(honestly) does not resolve the eigenvalue type.**

## Part 1 — the law $Q = d + k + 2$ in 3D

The flux lift in 3D has frame $X_i = \partial_i + A_i\partial_\varphi$ with
$[X_i,X_j] = (\text{curl }A)\cdot\partial_\varphi = B\,\partial_\varphi$, so the growth
vector is $(3,4)$ where $B\neq0$ and

$$Q = 1\cdot3 + 2\cdot(4-3) = 5 = d + k + 2\quad(d=3,\ k=0).$$

Measured (`run_p2_law.py`), field $B=(x,y,-2z)$ from $A=(yz,-xz,0)$, a proper linear null:

```
uniform Bz              weights (1.00,1.00,1.00,2.00)   Q=5
null field, generic pt  weights (1.00,1.00,0.99,2.09)   Q=5
null field, AT null     weights (1.00,1.00,1.01,3.00)   Q=6      (flux weight 2->3, k=1)

Q along x through the null:   5 5 5 [6] 5 5 5
```

The charter's one untested prediction is confirmed. The growth vector locates the null
(Q jumps) and reads its vanishing order ($k=1\Rightarrow Q=6$).

## Part 2 — external validation on the ABC-like field

The **ABC-like field** $B=(\cos y,\cos z,\cos x)$ (from $A=(\sin z,\sin x,\sin y)$; a curl-partner of the classic Beltrami ABC field, itself NOT force-free — which is what permits its spiral nulls, see the R5 theorem) is a
canonical divergence-free MHD/dynamo flow with eight isolated linear nulls in
$[0,2\pi)^3$. Two independent computations:

- **Standard finder** — Newton's method on $B=0$ (location), eigenvalues of $\nabla B$
  (type).
- **SR detector** — the growth vector / $Q$.

```
standard finder:  8 nulls; sub-classes {spiral-A: 4, spiral-B: 4}
                  (each null: one real eigenvalue +/-1 and a complex pair -/+0.5 +- 0.87i)

SR detector:      Q = 6 at all 8 nulls;  Q = 5 at all generic points

(A) location + order:  Q=6 at 8/8 nulls, Q=5 at 6/6 generic  ->  AGREE
(B) type:              Q=6 for spiral-A AND spiral-B          ->  does NOT refine
```

## Analysis — an honest reading of the kill criterion

The charter's Phase-2 kill criterion: *if the SR classification neither agrees with nor
refines the standard one, the method adds nothing.*

- **It agrees.** The growth vector's $Q=6$ points coincide exactly with the standard
  finder's nulls, and $Q=5$ everywhere else. As an independent detector it reproduces the
  standard result. The kill criterion is **not** triggered.
- **It does not (yet) refine.** Every linear null has $k=1$, so $Q=6$ for all of them; the
  growth vector cannot tell spiral-A from spiral-B. That distinction is in the eigenvalues
  of $\nabla B$ — the standard method's domain.

So on the **growth-vector leg**, the SR method is a valid but not superior null detector.
Its potential added value is entirely in the **moduli**: P1 showed the 2D moduli read
$\nabla B$ ($\delta=-\varepsilon^2$), so the natural and genuinely open question is whether
a 3D moduli invariant distinguishes spiral-A from spiral-B — i.e. whether it recovers the
eigenvalue type that the growth vector discards. That is the decisive next experiment.

## What is real here, and what is not

- **Real:** the ABC-like field is a genuine divergence-free magnetic field used across MHD and
  dynamo theory; its nulls and their eigenvalue types are exactly what solar/space-physics
  null-finders classify; the SR detector and the eigenvalue finder are truly independent.
- **Not yet:** this is an analytic field, not an observational magnetogram or an MHD
  simulation snapshot. A potential-field or NLFFF extrapolation of a real active region is
  the next step toward observational grounding, and does not change the method — only its
  provenance.

## Status

- Phase 2 law: **confirmed** ($Q=k+5$, null jump $5\to6$).
- Phase 2 external validation: **passed** on location and order; type-refinement open.
- Next: (i) do the moduli distinguish spiral-A from spiral-B? (ii) a real extrapolated
  field. (iii) the blog series.
