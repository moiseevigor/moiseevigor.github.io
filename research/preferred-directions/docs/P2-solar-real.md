# P2-solar — the SR null detector on a real solar coronal field

Reproduce: `../cosmic-web/.venv/bin/python scripts/run_p2_solar.py` (needs `sunpy` +
`astropy` + `scipy` + `matplotlib`; the cosmic-web venv has them).
Results → `artifacts/p2_solar_results.json`,
`public/img/posts/forbidden-directions-solar-null.png`.

**The program's first result on real observational magnetic-field data.**

## Pipeline

1. **Real data.** A line-of-sight **SDO/HMI** magnetogram (sunpy sample, active region
   observed 2011-06-07, photospheric field up to $\sim\!3\times10^3$ G). The most
   bipolar-balanced $160\,\text{px}$ window is cut out (both polarities strong).
2. **Extrapolation.** Potential-field (current-free) extension to a 3D coronal field by
   the Fourier/Schmidt method, `src/solar.py`: $B_z(k,z)=\hat B_z(k)\,e^{-|k|z}$, etc. A
   vector potential $A$ (Coulomb gauge, $\hat A = i\,k\times\hat B/|k|^2$) is computed for
   the sub-Riemannian detector; $\nabla\times A = B$ verified to $\sim1\%$.
3. **Standard finder.** Newton descent to $B=0$; a coronal null is located $\sim\!40$ px
   above the surface and classified **radial** by the eigenvalues of $\nabla B$
   (normalised $\approx(-0.76,-0.24,+1.0)$, traceless — divergence-free).
4. **SR detector.** The growth vector at the null's local (tangent-cone) structure returns
   $Q=6$; in the bulk strong field, $Q=5$. The null jump, on the real Sun.

```
standard finder:  coronal null at height ~40 px, radial (grad B eigenvalues)
SR growth vector: Q = 6 at the null  ·  Q = 5 in the bulk
```

## The honest caveat (a real methodological finding)

Resolving $Q=6$ **directly** on the raw gridded extrapolation *fails* — the reach
estimator returns $Q=5$ at the null. The reason is resolution: the null's linear zone
(where $|B|\sim r$) is about one grid cell across, so the $r\to0$ flux-scaling regime the
growth-vector estimator needs is unresolved. The detection above therefore reads the null's
**measured Jacobian** — its tangent-cone structure, which is precisely what the growth
vector is defined to see, and the leading-order truth of the real field there.

This is not a failure of principle (the analytic ABC-like field, exact at all scales, gives
$Q=6$ directly — see `run_p2_nulls.py`); it is a genuine requirement the method places on
real data: the field must be resolved below the null's linear scale, finer than a
potential-field extrapolation naturally provides. A higher-resolution NLFFF extrapolation or
an analytic local fit (used here) supplies it.

*Repair (S2, Phase 4):* the failure was the probe window, not the grid. This experiment
probed at sub-pixel radii (0.02–0.2 px), inside the trilinear-flattened zone; probing the
same real field at super-pixel radii (1.5–10 px — above the cell, below the structure
scale) returns the null flux weight $w_4 \approx 3$ **directly off the raw grid** (with
the S1 gauge adaptation). See [`S2-solar-pairs.md`](S2-solar-pairs.md).

## What this establishes, honestly

- The full chain **real magnetogram → coronal field → null → SR detection**, validated
  against the standard eigenvalue null-finder, runs end to end on genuine observational data.
- The SR framework agrees with the standard finder on the null's **presence** and **order**
  (both first-order), reproducing the Part-4 verdict on real data: valid detector, not (on
  the growth-vector leg) a refinement of the eigenvalue classification.
- The resolution requirement is the concrete obstacle for future raw-field application, and
  it is stated rather than hidden.

## Status

Preferred-directions now has a real-observational-data result (this) alongside the analytic
ABC-like-field validation. The decisive open question is unchanged and unaddressed here: do the *moduli*
(not the growth vector) distinguish the null *type* the eigenvalue finder assigns — the one
place the framework could *refine* rather than merely agree with the standard tool.
