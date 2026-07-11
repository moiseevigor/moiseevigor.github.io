# T1 — the race: crossover vs quadratic-fit root-finder. Verdict: the fit wins.

Reproduce: `../cosmic-web/.venv/bin/python scripts/run_p5_race.py` (~75 min). Results →
`artifacts/p5_race.json`, figure → `public/img/posts/forbidden-directions-race.png`.
Protocol pre-registered in [`PROGRAM-P5-litmus.md`](PROGRAM-P5-litmus.md).

## Result

Median relative error of the estimated pair separation (same noisy gridded B to both;
crossover builds its own potential by the ray gauge; fit = divergence-free quadratic
LSQ + Newton roots; κ frozen from one disclosed calibration):

| leg | sep | σ=0 | | σ=0.1 | | σ=0.25 | |
|---|---|---|---|---|---|---|---|
| | | xover | fit | xover | fit | xover | fit |
| pure | 0.40 | 0.21 | **1e-11** | 0.07 | **0.003** | 0.06 | **0.004** |
| pure | 0.20 | 0.011 | **1e-8** | 0.04 | **0.004** | 0.14 | **0.014** |
| pure | 0.10 | 0.02 | **~0** | 0.47 | **0.023** | 1.15 | **0.029** |
| contam | ~0.56 | 0.32–0.45 | **~1e-4** | 0.33–0.41 | **≤0.002** | 0.29–0.40 | **≤0.004** |

**The quadratic fit wins every cell, by one to four orders of magnitude. Per the
pre-registered rule, the scale crossover is demoted from candidate tool to conceptual
observable.** This is R2's lesson confirmed a second time on our own strongest claim.

## The anatomy (why, honestly)

1. **Smooth backgrounds are what polynomial fits absorb.** The "contaminated" leg's
   far point-charge field is analytic over the ball; its Taylor series converges fast,
   so a quadratic model captures it almost perfectly — the fit stayed at ~1e-4 error
   *with* 25% contamination. A background that actually breaks a polynomial fit must
   vary on the probe scale — and then the crossover's trajectories integrate through
   the same roughness. There is no obvious middle regime, and we did not find one.
2. **The crossover needs a base point; the fit doesn't.** The background shifted the
   true pair midpoint off the crossover's probe point, inflating its errors (0.3–0.45)
   — a genuine deployment cost (scanning base points multiplies its already ~10⁴×
   higher compute).
3. **Estimator calibration is a real weakness**: the frozen κ transferred imperfectly
   across separations (21% systematic at sep 0.4, ~1–2% at 0.2/0.1) because the knee is
   a broad feature, not a sharp point.
4. At the smallest separation under noise (pure, sep 0.10, σ≥0.1) the crossover
   degrades catastrophically (0.47–1.15) while the fit holds at ~2–3%.

## What survives, stated precisely

- **Q = 7 at the fold point** is a statement about the field's intrinsic geometry
  (homogeneous dimension of the tangent structure), not an estimate in competition —
  it survives untouched, as does the 2/3/4 plateau *dictionary* as physical meaning.
- The crossover remains the *conceptual* explanation of what "an unresolved pair"
  looks like to scale-covariant geometry — the right mental model, demonstrated with a
  universal dilation collapse (S1).
- For *quantitative* pair metrology on data: **fit a polynomial field model and
  root-find it.** The division-of-labour table gains its final row.

## The programme-level moral, twice measured

Integrated/geometric observables beat *naive* pointwise practice and lose to *matched
statistical estimation* — classification (R2) and now pair metrology (T1). The
sub-Riemannian framing's durable contributions are the ones with no estimation
competitor: existence/order laws (Q = k+5, the fold's Q = 7), exact analytic structure
(δ = 1 − (2/π)K(2ε), the critical gradient ε = 1/2), and physical dictionaries — not
estimators.
