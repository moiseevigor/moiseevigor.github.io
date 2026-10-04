# E11 — cusps on the first conjugate locus, and the fold test in dimension 6

Reproduce: `.venv/bin/python scripts/run_e11.py` → `artifacts/e11_results.json`, ~3.5 min
(`--quick` is a reduced smoke configuration with different numbers). All numbers below
are from that artifact.

## Question

E10 showed that a *random* first-conjugate point of SE(2), Engel and Cartan is a fold
(A2). It left two gaps: (a) the next germ on Arnol'd's list, the cusp (A3), sits on a
codimension-1 subset of the critical set that random geodesics miss — does the
exponential map of Engel and Cartan have standard A3 cusps there, or something
non-generic? (b) nothing was tested for SE(3) (dimension 6).

## Hypotheses and kill criteria (written before the script was run)

Notation. E(p) = exp_e(p), p ∈ R^n the initial covector (time 1). Σ = {det DE = 0} is
the critical set, v(p) the unit kernel direction of DE on Σ, and the **tangency
function** is

    τ(p) = ∇det DE(p) · v(p) / |∇det DE(p)|        (E10's "transversality", signed)

— the cosine of the angle between the kernel and the normal of Σ. τ ≠ 0 is a fold. By
Morin's criterion a point of Σ is a **cusp (A3)** iff the corank is 1, τ = 0, and the
zero is simple in the kernel direction: κ = dτ/ds ≠ 0 along the curve c(s) ⊂ Σ with
c(0) = p*, c'(0) = v (v is tangent to Σ exactly when τ = 0). Then the image E(c(s))
is a semicubical curve: E(c(s)) − E(p*) = a s² + b s³ + …, a ∦ b.

**H-cal (calibration, SE(2)).** For a generic 3D contact structure the first conjugate
locus near the pole is a four-cusp astroid (Agrachev 1996; El-Alaoui, Gauthier & Kupka
1996; Agrachev, Charlot, Gauthier & Zakalyukin 2000), and Sachkov (2010) and
Moiseev & Sachkov (2010) describe the SE(2) conjugate locus explicitly. Prediction:
on every loop φ ↦ (cos φ, sin φ, w) of initial covectors at fixed vertical momentum w,
the search finds **at least 4** tangency points and every one of them passes all the
A3 checks below.

**Kill criterion.** If any SE(2) loop yields fewer than 4 verified cusps, the method is
not trusted and the experiment is **inconclusive** for Engel and Cartan, whatever it
outputs there. It is not a confirmation.

**H-cusp (Engel, Cartan).** Every tangency point (τ = 0) located on the sampled loops
of the Engel and Cartan first conjugate loci is a standard A3 cusp: all of (i)–(iii)
hold. Refuted by any located tangency point that fails a check and keeps failing when
the numerical resolution is doubled (a non-A3 germ on a codimension-1 set would be
non-generic). If no tangency point is found on a group, the cusp question stays
**untested** for that group (not confirmed).

A3 checks at a located point p* (tolerances fixed here):

| check | quantity | pass iff |
|---|---|---|
| located | \|τ(p*)\| | ≤ 1e-4 (E10 fold threshold is 1e-3; generic values are 0.05–0.3) |
| sign change | τ at loop parameter u* ± 1e-3 rad | opposite signs, both \|τ\| ≥ 10·\|τ(p*)\| |
| (i) corank 1 | gap s_{n-1}/s_1 vs residual s_n/s_1 | gap > 100 · residual (as E10) and residual ≤ 1e-6 |
| (ii) simple zero | κ = [τ(c(s)) − τ(c(−s))] / (2σ), s = σ·\|p*\|, σ = 0.02 | τ(c(±s)) of opposite signs and \|κ\| ≥ 1e-2 |
| (iii) image cusp | Δ(s) = E(c(s)) − E(p*) at σ ∈ {0.01, 0.02, 0.04, 0.08}; even part Δe, odd part Δo, Δo⊥ = Δo minus its component along Δe | log-log slope of \|Δe\| ∈ [1.8, 2.2], slope of \|Δo⊥\| ∈ [2.6, 3.4] (the 2/3-power signature y ∼ x^{3/2}), and cos∠(Δ(s), Δ(−s)) > 0.9 at σ = 0.01 (both branches leave on the same side: tangent direction flips) |

**H-fold6 (dimension 6).** At the first conjugate point of 24 random geodesics (E10's
sampler, seed 0) the exponential map is a fold by E10's criterion (corank 1,
transversality > 1e-3), on (1) the nilpotent tangent cone `SE(3)-cone` in
`src/liegroup.py` (free 2-step group on 3 generators) and (2) the curved group SE(3)
with the fibre-tracking distribution {forward translation, two rotations}. Refuted on
a model if fewer than 24 of the found points are folds. For n = 6 Arnol'd's finite
ADE list no longer guarantees stability of generic germs (moduli appear), so a
positive result supports the group-blindness hypothesis **only at fold points**; it
says nothing about the deeper strata in dimension 6.

## Test

`scripts/run_e11.py` (full run 204 s; RK4 Lie–Poisson engine `src/liegroup.py`, 2000
steps per unit time; DE by central differences, step 1e-4; ∇det by central
differences, step 1e-3 — as E10).

**Part 1, cusps.** Loops u ↦ h0(u) = (cos u, sin u, vertical momenta fixed), 96
covectors per loop: SE(2) w ∈ {1, 1.5, 2, 3}; Engel (h3, h4) ∈ {(1,1), (2,1), (1,2),
(3,1), (1,3), (2,−2)}; Cartan (h3, h4, h5) ∈ {(1,1,1), (2,1,1), (1,2,1), (1,1,2),
(2,−1,2), (3,1,−2)}. Per covector: first sign change of det DE(t·h0), t ∈ (0.3, 12],
240-point scan, then four rounds of 16× bracketing and a secant step. Then τ at every
loop point; every sign change of τ between neighbours is solved in u by 12 Illinois
iterations (the conjugate time is re-solved at each iterate) and put through the A3
checks. Loop intervals where t_c jumps by more than 0.3 or the kernel turns by more
than 60° between neighbours are skipped and counted. One variable changes between
rows: the group.

**Part 2, dimension 6.** E10's sampler (24 covectors, seed 0, unit horizontal part,
vertical momenta of magnitude 1–3) and E10's fold criterion, on the nilpotent cone
(`liegroup.GROUPS["SE(3)-cone"]`) and on the curved group SE(3). The curved group is
not in `src/liegroup.py`; the script integrates it as a matrix group (g' = g·Σ h_a E_a,
structure constants computed from the matrix commutators, increments read in the
left-invariant coframe g⁻¹dg). That engine is validated on SE(2) against the E10
artifact: 24/24 conjugate times agree to 2.3e-8 and transversalities to 3.3e-7.

## Result

### Part 1 — pre-registered checks

| group | loops | covectors searched | first conjugate point found | loop intervals skipped | tangency points located (\|τ\| ≤ 1e-4) | pass all A3 checks | per loop |
|---|---|---|---|---|---|---|---|
| SE(2) (calibration) | 4 | 384 | 378 | 34 | 16 | **16** | 4, 4, 4, 4 |
| Engel | 6 | 576 | 571 | 87 | 21 | **7** | 4, 0, 1, 0, 0, 2 |
| Cartan | 6 | 576 | 576 | 98 | 38 | **16** | 4, 2, 3, 3, 3, 1 |

Ranges over the points that pass (all from the artifact, `cusps.*.verified_summary`):

| group | \|τ(p*)\| | \|τ\| at doubled RK4 steps | gap | residual | \|κ\| | slope of \|Δe\| | slope of \|Δo⊥\| | cos∠(Δ(s), Δ(−s)) |
|---|---|---|---|---|---|---|---|---|
| SE(2) | 1.5e-10 – 4.5e-7 | ≤ 2.0e-7 | 0.34 – 0.71 | ≤ 6.0e-11 | 1.2 – 4.8 | 2.00 – 2.14 | 3.00 – 3.11 | 0.994 – 1 |
| Engel | 2.1e-8 – 9.0e-7 | ≤ 1.4e-6 | 0.025 – 0.36 | ≤ 2.4e-11 | 0.38 – 9.8 | 1.93 – 2.10 | 3.00 – 3.18 | 0.999 – 1 |
| Cartan | 3.9e-8 – 1.1e-6 | ≤ 9.3e-7 | 0.0035 – 0.11 | ≤ 3.8e-11 | 0.075 – 0.90 | 1.99 – 2.04 | 2.99 – 3.07 | 0.999 – 1 |

Which checks the other located points fail (`cusps.*.failed_checks`): Engel — 10 fail
only (iii), 4 fail only (ii). Cartan — 7 fail only (iii), 14 fail only (ii), 1 fails
(ii) and the sign-change magnitude rule. No located point on any group fails corank 1.

### Part 1 — post-hoc reading of the points that did not pass

Added after the first full run; these descriptors are in the artifact
(`cusps.*.cusps[*].class`, `fine`, `tau_curve_*`, `period_defect`, `orbit_*`,
`kernel_symmetry_residual`) but were **not pre-registered**.

| class | Engel | Cartan | evidence |
|---|---|---|---|
| A3 by the pre-registered checks | 7 | 16 | table above |
| A3 once check (iii) is run on an 8× finer ladder σ ∈ {0.00125, …, 0.01} | 10 | 7 | at the pre-registered σ the curve c(s) leaves the ±5 % window or the asymptotic regime (these points have large \|κ\| 2.3–34 or small gap ≤ 0.066); on the finer ladder slopes are 2.00–2.13 and 3.00–3.22, cos = 1.000 |
| **degenerate tangency**: τ = 0 at p* but τ has the *same sign* on both sides along the kernel curve (also at doubled RK4 steps) | **4** | **10** | \|κ\| = 3.5e-4 – 8.2e-4 (Engel), 2.2e-4 – 2.1e-3 (Cartan), against ≥ 0.38 and ≥ 0.075 on the cusps; \|τ(c(±s))\| = 9e-5 – 1e-3, far above the 1e-6 level of τ(p*) |
| simple zero but \|κ\| < 1e-2 (6.7e-5 – 8.2e-3), undecided | 0 | 5 | sign change along the kernel curve present but below the pre-registered threshold; one of the five also fails the sign-change magnitude rule, and for one τ(c(±s)) is at the noise level |

What the degenerate points are (same descriptors):

- At **all 14** the whole covector orbit {t_c·h(s)} of the Lie–Poisson flow through
  h0 is critical at time t_c (max s_n/s_1 along the orbit ≤ 1.6e-7), and the kernel
  lies in the span of the phase-shift field dh/ds (plus, on Cartan, the generator of
  the rotation symmetry) to ≤ 2.4e-7.
- At **4 of 4 on Engel and 6 of 10 on Cartan** t_c is a period of the covector orbit
  (\|h(t_c) − h0\| ≤ 2.2e-6) and the whole orbit is mapped to **one point** (image
  spread ≤ 3.5e-6, against 0.2–40 on the cusps): a one-parameter family of geodesics
  refocuses at a single point. This is the Heisenberg mechanism (E10's control), here
  on a codimension-1 subset of the critical set instead of all of it.
- At the other 4 Cartan points t_c is not a period and the orbit's image is not a
  point (spread 4.0–4.9); the mechanism is not identified.

They occur on 2 of 6 Engel loops and 5 of 6 Cartan loops, i.e. generic one-parameter
families meet them, which is what a codimension-1 stratum of the critical set does.
A generic Lagrangian map has no such stratum (non-simple tangency is codimension 2).

### Part 2 — fold test in dimension 6

```
model                          found   t_c median   gap min   residual max   transversality min / median / max   corank 1   folds
SE(2), matrix engine (check)   24/24     3.459      0.3790      6.1e-11        1.0e-01 / 2.8e-01 / 4.6e-01         24/24     24/24
SE(3)-cone (nilpotent)         24/24     2.037      0.0250      1.7e-11        1.7e-09 / 4.3e-08 / 7.5e-07         24/24      0/24
SE(3) (curved group)           24/24     2.147      0.0264      1.5e-11        1.1e-04 / 1.5e-02 / 2.1e-01         24/24     23/24
```

## Verdict

- **H-cal: confirmed.** 4 verified cusps on each of the 4 SE(2) loops (16 of 16
  located points pass every check), the count the 3D contact theory predicts. The kill
  criterion is not triggered; the method is trusted for what follows.
- **H-cusp: partially confirmed, and refuted as stated.** Standard A3 cusps exist on
  the first conjugate locus of both groups — Engel 7, Cartan 16 by the pre-registered
  checks (17 and 23 with the post-hoc finer ladder). But not every tangency point is
  A3: 4 Engel and 10 Cartan points are degenerate tangencies that persist at doubled
  resolution, which is the pre-registered refutation. The Engel and Cartan first
  conjugate loci contain a non-generic stratum that is not on Arnol'd's list; where
  its mechanism is identified (10 of 14) it is a symmetry collapse of the Heisenberg
  kind.
- **H-fold6: refuted on the cone, 23 of 24 on the curved group.** The nilpotent cone
  of SE(3) behaves like Heisenberg: corank 1 with the kernel tangent to the critical
  set at all 24 points (transversality ≤ 7.5e-7), 0 folds. On the curved group SE(3)
  23 of 24 points are folds; the 24th has transversality 1.1e-4 — 140 times the
  largest cone value, but below the 1e-3 threshold fixed in E10 — so the pre-registered
  24/24 is not met. Median transversality is 0.015 (SE(2): 0.28): at these momenta
  SE(3) is close to its collapsed cone.

For the series: the group-blindness hypothesis is supported at folds (E10) and now at
the cusps located here, on SE(2), Engel and Cartan, and at folds on SE(3). The
"symmetry" exception is larger than Heisenberg's line: it includes a degenerate
stratum inside the Engel and Cartan loci and the whole first conjugate locus of the
SE(3) cone.

## Caveats

- **Sampled points, not proof.** Finite-difference diagnostics at 4–6 loops per group
  in one momentum band.
- **Thresholds were fixed blind.** The pre-registered σ ladder was too coarse for 17
  points and the κ threshold leaves 5 Cartan points undecided; the finer ladder and the
  degenerate/weak split are post-hoc and labelled as such.
- **The search is not exhaustive.** 34 / 87 / 98 loop intervals (SE(2) / Engel /
  Cartan) were skipped because t_c or the kernel jumps between neighbours; tangency
  points inside them are missed. One is known: Cartan loops (1,2,1) and (1,1,2) are the
  same loop up to the rotation symmetry (same h3 and \|(h4, h5)\|) — their six common
  points agree in t_c and κ to 6 digits, and the seventh point of (1,1,2) falls in a
  skipped interval of (1,2,1). So Cartan has 5 independent loops and 32 distinct
  located points (13 distinct verified cusps).
- **Points related by discrete symmetries are counted separately** (e.g. the Engel
  degenerate points come in two mirror pairs).
- **Higher germs (A4, D4, …) were not searched.** They sit in codimension ≥ 2 of the
  critical set and one-parameter loops miss them.
- **Degenerate stratum: the germ is not classified.** The data say "not A3" and, for
  10 of 14 points, "a curve of covectors maps to a point"; they do not give a normal
  form, and 4 Cartan points have no identified mechanism.
- **SE(3):** first conjugate point only, one momentum band, n = 6 (Arnol'd's finite
  list does not apply); the curved-group integrator lives in the script and is
  validated only against SE(2).
- **First conjugate point only**, found as a sign change of det DE.

## Next

- Classify the degenerate stratum: normal form, and whether it coincides with a known
  Maxwell/periodicity set of the Engel and Cartan literature (Ardentov & Sachkov;
  Ardentov & Hakavuori); identify the mechanism at the 4 non-periodic Cartan points.
- Two-parameter search for swallowtails (zeros of κ along the cusp set).
- Re-run with 192 points per loop and a t_c-jump-tolerant bracketing to shrink the
  skipped intervals; resolve the 5 undecided Cartan points on a finer κ ladder.
- SE(3): the transversality as a function of distance from the pole (does it vanish
  like the cone's?), and move the matrix-group engine into `src/`.

## Glossary

- **Σ, critical set** — {p : det DE(p) = 0}, a hypersurface in covector space.
- **τ, tangency function** — ∇det DE · v / \|∇det DE\|, v the unit kernel of DE; cosine
  of the angle between the kernel and the normal of Σ. Zero = kernel tangent to Σ.
- **gap / residual** — s_{n−1}/s_1 and s_n/s_1 of DE (singular values, descending).
- **kernel curve c(s)** — p* + s·v rescaled along its ray onto Σ; s = σ·\|p*\|.
- **κ** — [τ(c(s)) − τ(c(−s))]/(2σ) at σ = 0.02, the derivative of τ along the kernel
  curve per unit relative displacement.
- **Δe, Δo, Δo⊥** — even and odd parts in s of E(c(s)) − E(p*), and the odd part with
  its component along Δe removed; slopes are least-squares in log–log over the 4 σ.
- **A3 (cusp), A2 (fold)** — Arnol'd's germs; Morin's criteria as in the hypotheses.
- **degenerate tangency** — τ(p*) = 0 with τ of the same sign on both sides along c(s).
- **covector orbit, period defect** — the Lie–Poisson trajectory h(s) of the initial
  covector; \|h(t_c) − h0\|.
- **SE(3)-cone** — the nilpotent tangent cone of SE(3)'s fibre-tracking structure:
  the free 2-step group on 3 generators, growth vector (3, 6).
