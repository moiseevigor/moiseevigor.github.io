# T2 — the closed form: δ(ε) = 1 − (2/π) K(2ε)

Reproduce: `../cosmic-web/.venv/bin/python scripts/run_p5_series.py` (~15 s).
Results → `artifacts/p5_series.json`. Supersedes the numerical value hunt of
`run_c4_precision.py` (whose c₄ = 9/4 is now a corollary).

## The result

For the magnetic contact structure with constant fractional gradient
($B = B_0 e^{\varepsilon x/r_L}$, $\varepsilon = \lvert\nabla\ln B\rvert\,r_L$), the
angle-averaged **θ-period** $T$ obeys **exactly**

$$
\frac{\langle T\rangle}{T^{\text{flat}}} \;=\; \frac{2}{\pi}\,K(2\varepsilon),
\qquad\text{i.e.}\qquad
\boxed{\;\delta(\varepsilon) \;=\; 1 - \frac{2}{\pi}K(2\varepsilon)\;}
$$

(Notation: $T$ is the exact θ-period throughout; $t_c$ is reserved for the *measured*
conjugate time, whose identification with $T$ is the conditional step.)

with $K$ the complete elliptic integral of the first kind (modulus convention
$K(k) = \int_0^{\pi/2} d\phi/\sqrt{1-k^2\sin^2\phi}$). This is the **period-average
law**. Reading the same expression as the angle-averaged *conjugate* (refocusing) time
is conditional on the open conjugate-time = period identification (Conjecture A):
verified to 1e-8 on this exponential profile, REFUTED off it (V1) — so the caustic
reading is exponential-conditional, not established.

## The chain (each link tested against the geodesic code)

1. **Integral of motion (exact, one line).** Along a geodesic, $\dot\theta = e^{\varepsilon x}$
   and $\dot x = \cos\theta$, so $d\dot\theta/d\theta = \varepsilon\cos\theta$:
   $$\dot\theta(\theta) = 1 + \varepsilon(\sin\theta - \sin\theta_0).$$
   The angular dynamics decouples — the system is integrable.
2. **Per-angle θ-period (closed form); its identification with the conjugate time is
   the open step.**
   $$T(\theta_0) = \oint \frac{d\theta}{1+\varepsilon(\sin\theta-\sin\theta_0)}
   = \frac{2\pi}{\sqrt{(1-\varepsilon\sin\theta_0)^2 - \varepsilon^2}}.$$
   *Verified: matches the Jacobian-zero conjugate times of the integrator to
   $\sim 10^{-8}$ relative, at ε = 0.1, 0.25, 0.4, all launch angles.* (Analytic status:
   the period formula is exact; the identification of the conjugate time with the
   period is verified numerically to integrator precision — the remaining formal step
   is the Jacobian argument for this integrable family.)
3. **The angle average is elliptic.**
   $$\frac{\langle T\rangle}{2\pi} = \frac{1}{2\pi}\oint
   \frac{d\phi}{\sqrt{(1-\varepsilon\sin\phi)^2-\varepsilon^2}} = \frac{2}{\pi}K(2\varepsilon).$$
   *Verified two ways: symbolically, term by term through $O(\varepsilon^{12})$
   (sympy — every coefficient $\binom{2m}{m}^2 4^{-m}$ matches, difference exactly 0);
   and numerically, $\delta$ from the full pipeline matches $1-(2/\pi)K(2\varepsilon)$ to
   $10^{-10}$–$10^{-9}$ absolute across ε = 0.05 … 0.45. The formal reduction of the
   integral is now WRITTEN OUT AND PROVEN (2026-07-12): phase-shift to cosine,
   t = tan(theta/2) factorises the radicand exactly into
   [t^2 + (1-2eps)][1 + (1+2eps)t^2], and Gauss's
   INT_0^inf dt/sqrt((t^2+a^2)(t^2+b^2)) = K(k)/a with a = (1+2eps)^{-1/2},
   b = (1-2eps)^{1/2} gives k^2 = 1 - (1-2eps)(1+2eps) = 4 eps^2 and prefactor 4 —
   i.e. exactly (2/pi)K(2eps), modulus convention, valid for eps < 1/2 (the
   factor 1-2eps > 0 is the domain; its vanishing is the critical gradient).
   Chain verified to machine precision + sympy: `scripts/run_t2_reduction_check.py`.
   The elliptic-reduction step (item 3) is CLOSED; the conjugate-time = period
   identification (item 2) remains the open formal step, unchanged.*

## Corollaries

- **The Taylor coefficients are squared normalised central binomials:**
  $$-\delta(\varepsilon) = \sum_{m\ge1} \left[\binom{2m}{m}2^{-m}\right]^2 \varepsilon^{2m}
  = \varepsilon^2 + \tfrac94\varepsilon^4 + \tfrac{25}4\varepsilon^6 + \tfrac{1225}{64}\varepsilon^8 + \cdots$$
  The measured $c_4 = 2.2497 \pm 0.0009$ is now a consequence; the fitted $c_6$
  was always a model-dependent nuisance (6.18–6.57 across the fit models in
  `c4_precision.json`; the fitted $c_8 \approx 23.6$ likewise scatters against the
  exact $1225/64 \approx 19.14$) — high-order coefficients on a 10-point window
  are unstable, and the closed form is verified directly against $\delta$ to
  $10^{-10}$, superseding the fits. The earlier "odd-square" guess
  ($c_6 = 25/4$ coincides, $c_8$ does not) is corrected by the exact law.
- **A critical gradient exists: $\varepsilon_c = 1/2$.** $K$ diverges at unit modulus, so
  the *mean* **period** diverges as $\varepsilon \to 1/2$; per angle, the slowest
  launch direction ($\sin\theta_0 = 1$) has
  $T = 2\pi/\sqrt{(1-\varepsilon)^2-\varepsilon^2} = 2\pi/\sqrt{1-2\varepsilon}$,
  diverging at exactly $\varepsilon = 1/2$. *Verified on the measured conjugate times
  (their tracking of $T$ is the Conjecture-A step): $t_c/2\pi =
  3.162$ at ε=0.45 and $7.071$ at ε=0.49 (both matching $1/\sqrt{1-2\varepsilon}$);
  above the critical gradient, for exactly the launch band sin θ0 ≥ (1−ε)/ε, no
  conjugate point is detected within the eight-period integration window
  (finite-horizon evidence, `run_r6_supercritical.py`), while every other angle keeps
  $t_c = T$.* Physically, three separate claims: **the mean period diverges — a
  theorem; for the slowest launch band, refocusing is not observed on any integrated
  horizon once the field changes by more than half across a Larmor radius — a
  finite-horizon measurement; and that the launch-averaged caustic opens with the
  period is Conjecture A** — the rest of the beam keeps refocusing.
- The inversion of Part 3 upgrades from leading-order to exact **for the
  period-average δ on this exponential profile**:
  $\varepsilon = \tfrac12 K^{-1}\!\big(\tfrac\pi2(1-\delta)\big)$ (as a caustic
  statement, conditional on Conjecture A; general 1D profiles carry the
  $1-\tfrac34\beta$ calibration).

## Novelty status (per the P5 audit)

Second-order guiding-centre theory contains the machinery but not this statistic; we
found no statement of this closed form in the checked literature. It is also a natural
fit to the sub-Riemannian lineage: the SE(2) sub-Riemannian geodesics (Sachkov–Moiseev)
are governed by Jacobi elliptic functions, and here the *magnetic* contact structure's
caustic turns out to be governed by the complete elliptic integral. Claim class:
**exact result, candidate-new**, pending one more targeted literature pass on
gyro-period integrals in exponential field profiles.

## Post-review addenda (pointers)

The chain above was subsequently sharpened by four results recorded elsewhere:
step 2 (elliptic reduction) is PROVEN (`run_t2_reduction_check.py`; D5/article §3.5);
the caustic-vs-period distinction became load-bearing — the identification t_c = T is
EXPONENTIAL-SPECIFIC (V1 counterexample, `V1-profile-law.md`), the caustic profile law
c2 = 1 − (3/4)β is DERIVED (`run_o6_caustic_c2.py`, article Prop 4.2), and above the
critical gradient exactly the launch band sin θ0 ≥ (1−ε)/ε shows no conjugate point
within the eight-period integration window (finite-horizon evidence)
while all other angles keep t_c = T (`run_r6_supercritical.py`). The "one more targeted
literature pass" promised above has run: machinery found (Northrop, Littlejohn),
statistic/closed form/critical gradient not found — recorded as a bounded search, D5 +
article §6.
