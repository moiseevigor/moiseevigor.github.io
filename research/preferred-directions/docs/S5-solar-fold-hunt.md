# S5 — The solar fold hunt: nulls colliding on the real Sun

**Question.** Does the real Sun show a null pair collapsing or splitting on
camera — in the 32-frame, 6-min-cadence AR11429 sequence (2012-03-07
00:00–03:06 UT, through the X5.4 and X1.3 flares)?

## Pre-registered hypotheses

- **H-S5 (temporal fold).** Somewhere in the sequence an opposite-degree
  null pair of the co-rotating wide-window potential extrapolation
  annihilates or is born: a tracked pair whose separation decreases over
  ≥ 3 frames below the gate, both members then vanishing away from the
  volume walls (or the time-mirror). Interior events must survive the
  window-shift test (±16 px) — the R3 window-sensitivity caveat applied to
  events.
- **H-S5b-1 (the inhabited transition state).** The fine-dedup census of
  the null-rich subvolume near window (33, 194) tracks ONE persistent
  opposite-degree pair at ~1.6 px separation and healthy height
  (z ≈ 8–12 px) through both flares — a *stable* nearly-degenerate
  configuration: the fold's neighbourhood is inhabited but not crossed.
- **H-S5b-2 (the fold, pinned by boundary continuation).** For the
  candidate annihilation bracketed by the measured frames 01:07 and
  01:19 UT, the straight-line blend of the two measured boundary
  magnetograms, cut(s) = (1−s)·cut_A + s·cut_B, exhibits a genuine fold at
  some s_c ∈ (0,1): separation C·√(s_c − s), opposite degrees,
  det ∇B → 0, and the SR 2-jet plateau at the collision. The real Sun
  moved from one side of the fold to the other between two measurements
  12 minutes apart; the blend pins where the wall stands between them.

## Protocol

1. Census: per-frame potential re-extrapolation of the co-rotating
   WINL = 360 px window (CUTL = 225, NZL = 64), ALL nulls per frame
   (Newton from a 14³ grid + warm starts at the previous frame's nulls +
   a dense patch on the null-rich cluster), height filter z > 1.4 px,
   lateral margins 6 px.
2. Identity tracking (6 px gate, 1-frame miss allowed); every birth/death
   attributed: floor (submergence through the height filter), wall
   (window-domain artifact), interior (fold candidate).
3. Interior candidates: opposite-degree co-death/co-birth with monotone
   approach; window-shift robustness required.
4. S5b: fine-dedup (0.6 px) subvolume tracking of the persistent pair;
   boundary-blend continuation of the bracketed candidate with bisection,
   √ fit, degree/det checks and the SR 2-jet read (grid Poincaré gauge).

## Results

**H-S5: REFUTED on this sequence.** The warm-started census finds 12–21
nulls per frame, but the per-frame degree sum swings between −5 and −17:
births/deaths are dominated by detection-boundary effects (height-floor
submergence, lateral walls, marginal low nulls flickering against the
finder), and *no* interior opposite-degree co-death passes the pairing
criteria. One relaxed candidate (approach 14.5 → 5.3 px, co-death within
2 frames at 00:55–01:13) motivated S5b-2.

**H-S5b-1: REFUTED.** The fine-dedup (0.6 px) subvolume census does not
sustain one persistent pair: the closest opposite-degree separation churns
(0.7 → 12 px frame to frame, some frames pairless), and the window-shift
test reproduces the separation in 0/6 shifted windows. The 1.6-px
encounters at 01:49 and 02:49 are transient configurations of a churning
low cluster, not a stable transition state.

**H-S5b-2: REFUTED — and the refutation is the result.** The blend
continuation 01:07 → 01:19 "loses" the pair at s_c = 0.426, but with every
fold signature ABSENT: the separation ladder is flat at ≈ 6.2 px
(log–log slope −0.015 vs the predicted 0.500), w₄(r) at the "collision"
reads ≈ 2 (generic point, no plateau), the growth vector reads Q = 5 (not
even a null), and neither ±16-px shifted window reproduces any s_c. The
candidate was a detection artifact — the pair stops being *found* (one
member slips below the height floor), it does not merge. The certification
protocol (√ law + degree bookkeeping + SR plateau + window shifts) killed a
candidate that simple track-bookkeeping would have published.

**Verdict (temporal arm).** On this data — windowed potential
extrapolations of 6-min line-of-sight magnetograms — no fold is certified
in TIME across the 3-hour sequence.

## S5c — the certified fold (boundary continuation, spectral stage)

**H-S5c-a/b (CONFIRMED, machine precision).** Blending the first and last
measured magnetograms (00:01 → 03:07 UT; endpoint censuses 9 vs 11
interior nulls) and walking newborn nulls backward with predictor–corrector
continuation on the **analytic mode sum** of the extrapolation (the FFT
extrapolation is a finite Fourier series — the grid is only its sampling;
Newton on the mode sum resolves nulls to ~1e-5 px):

- fold at **s_c = 0.14095804**, collision at window (11.84, 209.05,
  z = 3.67 px);
- opposite degrees (+1, −1); separation walked from 3.4 px down to
  **1.2e-5 px**; log–log slope **0.4999** (fold predicts 0.500) over more
  than four decades of δ = s − s_c; det ∇B → 0 for both members.

**H-S5c-c (REFINED — the deviation is the finding).** Pre-registered as
"plateau-4 / Q = 7" from the S1 fold family; the catch corrected the
expectation: a GENERIC fold's collision keeps a rank-2 Jacobian (exactly
one eigenvalue crosses zero — that is what det → 0 with a √ pair means),
so the field still vanishes linearly in two directions and the growth
vector correctly reads k = 1: **Q = 6, flux exponent flat-3**. The
plateau-4 belongs to the fully degenerate symmetric normal form
(∇B ≡ 0), which is what S1 built. What survives on real data is the
**collapsing crossover knee**: w4(r) elbows at r ~ separation, marching to
zero like √δ (measured at δ = 2e-2 → 1e-4 → 0).

**H-S5c-d (REFUTED — reported plainly).** The fold is NOT window-invariant:
+16 px shifts push the event region out of frame (geometric); the −16 px
family has different null content at the matching position (checked by
sub-box census across s). This is R3's window-sensitivity operating at
event level, on a low null (z ≈ 3.7 px). Precise claim: a fold of the
windowed family built from two measured magnetograms, certified to machine
precision; whether the physical corona crossed THIS wall needs a global or
NLFFF extrapolation.

Three impostor candidates were executed along the way by the certificate
(flat ladders, w4 ≈ 2, Q = 5, no robustness) — the protocol kills what it
should kill.

## Reproduce

```bash
cd research/preferred-directions
../cosmic-web/.venv/bin/python scripts/run_s5_solar_fold.py   # temporal census
../cosmic-web/.venv/bin/python scripts/run_s5b_pair.py        # the impostor, executed
../cosmic-web/.venv/bin/python scripts/run_s5c_blend_fold.py  # the certified fold
../cosmic-web/.venv/bin/python scripts/render_s45_figures.py
```

Artifacts: `s5_solar_fold.json`, `s5b_pair.json`, `s5c_blend_fold.json`.

## Honesty box

These are nulls of a windowed potential extrapolation of measured
line-of-sight magnetograms — the same model class whose window-sensitivity
R3 documented; that is exactly why the event protocol carries the
window-shift test and why deaths at the height floor or lateral walls are
excluded. The blend path is linear interpolation between two measurements
12 minutes apart, not the Sun's actual trajectory through boundary-data
space; what is pinned is that the two measured states lie on opposite
sides of a fold wall, and where the straight path crosses it.
