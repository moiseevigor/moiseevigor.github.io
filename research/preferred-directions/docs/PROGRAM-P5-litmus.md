# Phase 5 — litmus tests: from "signs of new science" to claims

Three novelty candidates came out of P3/P4. This phase runs the tests that decide them.

## 0. The novelty audit (literature check, done first)

| Candidate | Audit result |
|---|---|
| **No-spiral theorem** (force-free ⇒ radial-only nulls) | **Downgraded, honestly.** The MHD-relaxation literature (Fuentes-Fernández & Parnell, A&A 2012–13, spiral-null relaxation series) established *dynamically* that spiral nulls with spine current settle into genuinely **non-force-free** equilibria. Our 3-line pointwise proof is the elementary algebraic form of a dynamically-known fact. What remains ours: the *statement as a catalogue audit* — any spiral null in an extrapolation-based catalogue is a numerical force-free violation, not physics — plus the demonstrated dichotomy (radial-only Sun vs spiral-rich magnetotail). Claim class: **clarification + audit corollary**, not discovery. |
| **δ(ε) = −ε² − (9/4)ε⁴ − …** (gyro-refocusing delay) | **Survives.** Second-order guiding-centre theory (Littlejohn 1981; Brizard 1995; Hahm) contains the *machinery* (second-order gradient corrections to gyromotion) but the **conjugate-time / caustic statistic itself is not a named output** of that literature. Novelty contingent on the analytic derivation and a deeper GC-literature dive. |
| **The scale-crossover observable** ($w_4(r)$ plateaus 2/3/4; knee = pair separation) | **Survives.** Null-detection practice is pointwise (Poincaré index, trilinear, FOTE — Olshevsky et al. 2020); the nearest neighbour, multifractal local-dimension analysis in reconnection turbulence, is a *statistical* dimension of dissipation fields, not a per-point flux-reach exponent. No prior use of homogeneous-dimension scaling as a null/pair diagnostic found. |

## 1. T1 — THE RACE (decisive): crossover vs quadratic-fit root-finder

R2's lesson, aimed at our own uniqueness claim: a *model fit* can also find sub-resolution
pairs — fit a divergence-free quadratic field over the ball, root-find it, read the
separation. If that beats the crossover everywhere, the crossover remains a beautiful
*observable* but not a *tool*, exactly as classification fell to the linear fit.

**Protocol (pre-registered).** Input: the SAME noisy gridded $\mathbf B$ to both methods
(no analytic potential — the crossover must construct its own $A$ from the ray/Poincaré
gauge $A(\mathbf r) = -\mathbf r \times \int_0^1 s\,\mathbf B(s\mathbf r)\,ds$).
Two legs:

- **Pure fold** — the field IS a divergence-free quadratic, i.e. the fit's exact model
  class. *Pre-registered prediction: the fit wins here, possibly totally.* (If it does
  not, that itself is informative about noise conditioning.)
- **Contaminated** — fold + a smooth non-polynomial background (far point-charge field,
  25% RMS over the ball): both methods misspecified; the crossover is model-free.
  *Pre-registered prediction: open; this leg decides the claim.*

Configurations: pair separations $2\sqrt\mu \in \{0.4, 0.2, 0.1\}$ on an $L=1$, $41^3$
grid (separations of 8, 4, 2 grid cells — resolved to marginal); noise
$\sigma \in \{0, 0.1, 0.25\}$ (relative RMS over the info ball), $N=8$ draws.
Metrics: relative separation error (median ± spread) and pair-vs-merged detection rate.
The crossover's knee-to-separation constant is calibrated ONCE on a single noiseless pure
configuration, then frozen (disclosed).

**Verdict rule:** the crossover claim survives as a *tool* only if it beats the quadratic
fit somewhere honest (the contaminated leg at realistic noise); otherwise it is
demoted to *conceptual observable* — stated exactly so.

## 2. T2 — the series: pin $c_6$, derive $9/4$

- **$c_6$ precision** (cheap, decisive for the pattern): intercept fits of
  $z_2 = (z - 9/4)/\varepsilon^2$ on the high-precision δ data; verdict on $25/4$ and the
  odd-square conjecture $c_{2m} = (2m-1)^2/4$.
- **Analytic derivation** (time-boxed): perturbative solution of
  $\dot x = \cos\theta,\ \dot y = \sin\theta,\ \dot\theta = e^{\varepsilon x}$ around the
  circular orbit; conjugate time from the Jacobian zero of the exponential map;
  angle-average. Milestones: $c_2 = 1$ exactly at $O(\varepsilon^2)$; $c_4$ at
  $O(\varepsilon^4)$ by computer algebra. Partial progress documented as such.

## 3. T3 — catch a fold forming (real data)

Fetch an HMI LOS sequence across the AR11158 flux-emergence day (2011-02-13, the
textbook emergence event); track the null census per frame in the emerging region;
if a pair is born at our resolution, measure the knee migration. Honest expectation:
birth at 1024²-scale resolution is not guaranteed; a null-count time series is the
minimum deliverable.

*(T4, MMS in-situ cross-match, is deferred: new data infrastructure, its own phase.)*
