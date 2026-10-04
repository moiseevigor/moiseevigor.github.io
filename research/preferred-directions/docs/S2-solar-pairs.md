# S2 — null pairs on the real Sun: a partial crossover, and a resolution repair

Reproduce: `../cosmic-web/.venv/bin/python scripts/run_p4_solar_pairs.py` (~15 s; needs
the R3 magnetograms in `artifacts/hmi/`). Results → `artifacts/p4_solar_pairs.json`,
figure → `public/img/posts/forbidden-directions-solar-pair.png`.

## Census (H-P4c, first half)

Twelve active-region volumes across the three real days hold **4 same-volume null
pairs**; the closest: separation 23.4 px (2012-03-07), then 30.9, 52.1, 58.7 px. Real
coronal extrapolations do carry pairs — but none *near-degenerate*: the closest pair is
well separated, two independent nulls embedded in a busy active region, not a
fold-in-progress.

## The crossover on the real field (H-P4c, second half): **partial**

The scale-resolved flux exponent $w_4(r)$ at the closest pair's midpoint, measured on
the **real extrapolation's own vector potential** (trilinear-interpolated):

- $w_4 = 2.0$ at the smallest resolvable radius (locally uniform — correct);
- a clean **rising edge** through $\sim 3$ as the probe reaches the pair scale — the
  null-ness of the neighbourhood is read from a point that is not a null (the S1
  mechanism, qualitatively on real data);
- **no** degenerate-parent plateau at 4: beyond the pair separation the probe leaves the
  pair's zone of influence and the active region's background field dominates, so
  $w_4$ relaxes ($\approx 2.7$ at $2.4\times$ half-separation).

Honest verdict: the fold picture's rising edge is visible on the real Sun; the full
$2\to4$ crossover is **not**, and should not be — a 23-px pair in a structured region is
not the fold normal form. The clean signature needs a genuinely merging pair (separation
of a few px, e.g. flux-emergence null creation watched in a magnetogram *sequence*) —
recorded as the concrete next data need.

## The resolution repair (upgrades the P2 caveat)

P2 reported that the raw-grid reach estimator fails at a real null (returns the bulk
value) and fell back to the null's measured Jacobian. S2 locates the actual cause: P2
probed at **sub-pixel radii** (0.02–0.2 px), inside the interpolation-flattened zone.
Probing the same real field at **super-pixel radii** (1.5–10 px, above the grid cell,
below the structure scale) returns

$$w_4 \approx 3\ \ (\text{mean } 2.93 \text{ in } 1.5\!-\!6\ \text{px})$$

at a real coronal null — the single-null flux weight, read **directly off the raw
gridded field**. The detector's scale window on gridded data is
$\text{cell} \lesssim r \lesssim \text{structure}$; within it, no tangent-cone
substitution is needed. (The gauge adaptation of S1 — subtracting the potential's
symmetric gradient — is required here too; without it the reading is masked at 2.)

## Status

- Pair census: real, 4 pairs, closest 23.4 px.
- Real crossover: rising edge yes, full fold signature no (needs a merging pair).
- Raw-grid real-data detection: **works** in the correct scale window — P2's caveat is
  now a *scale-window rule*, not a limitation.
