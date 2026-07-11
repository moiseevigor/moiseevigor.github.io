# T2 — the closed form: δ(ε) = 1 − (2/π) K(2ε)

Reproduce: `../cosmic-web/.venv/bin/python scripts/run_p5_series.py` (~15 s).
Results → `artifacts/p5_series.json`. Supersedes the numerical value hunt of
`run_c4_precision.py` (whose c₄ = 9/4 is now a corollary).

## The result

For the magnetic contact structure with constant fractional gradient
($B = B_0 e^{\varepsilon x/r_L}$, $\varepsilon = \lvert\nabla\ln B\rvert\,r_L$), the
angle-averaged conjugate (refocusing) time obeys **exactly**

$$
\frac{\langle t_c\rangle}{t_c^{\text{flat}}} \;=\; \frac{2}{\pi}\,K(2\varepsilon),
\qquad\text{i.e.}\qquad
\boxed{\;\delta(\varepsilon) \;=\; 1 - \frac{2}{\pi}K(2\varepsilon)\;}
$$

with $K$ the complete elliptic integral of the first kind (modulus convention
$K(k) = \int_0^{\pi/2} d\phi/\sqrt{1-k^2\sin^2\phi}$).

## The chain (each link tested against the geodesic code)

1. **Integral of motion (exact, one line).** Along a geodesic, $\dot\theta = e^{\varepsilon x}$
   and $\dot x = \cos\theta$, so $d\dot\theta/d\theta = \varepsilon\cos\theta$:
   $$\dot\theta(\theta) = 1 + \varepsilon(\sin\theta - \sin\theta_0).$$
   The angular dynamics decouples — the system is integrable.
2. **Per-angle conjugate time = the θ-period.**
   $$t_c(\theta_0) = \oint \frac{d\theta}{1+\varepsilon(\sin\theta-\sin\theta_0)}
   = \frac{2\pi}{\sqrt{(1-\varepsilon\sin\theta_0)^2 - \varepsilon^2}}.$$
   *Verified: matches the Jacobian-zero conjugate times of the integrator to
   $\sim 10^{-8}$ relative, at ε = 0.1, 0.25, 0.4, all launch angles.* (Analytic status:
   the period formula is exact; the identification of the conjugate time with the
   period is verified numerically to integrator precision — the remaining formal step
   is the Jacobian argument for this integrable family.)
3. **The angle average is elliptic.**
   $$\frac{\langle t_c\rangle}{2\pi} = \frac{1}{2\pi}\oint
   \frac{d\phi}{\sqrt{(1-\varepsilon\sin\phi)^2-\varepsilon^2}} = \frac{2}{\pi}K(2\varepsilon).$$
   *Verified two ways: symbolically, term by term through $O(\varepsilon^{12})$
   (sympy — every coefficient $\binom{2m}{m}^2 4^{-m}$ matches, difference exactly 0);
   and numerically, $\delta$ from the full pipeline matches $1-(2/\pi)K(2\varepsilon)$ to
   $10^{-10}$–$10^{-9}$ absolute across ε = 0.05 … 0.45. The formal reduction of the
   integral is a standard elliptic substitution, not yet written out here.*

## Corollaries

- **The Taylor coefficients are squared normalised central binomials:**
  $$-\delta(\varepsilon) = \sum_{m\ge1} \left[\binom{2m}{m}2^{-m}\right]^2 \varepsilon^{2m}
  = \varepsilon^2 + \tfrac94\varepsilon^4 + \tfrac{25}4\varepsilon^6 + \tfrac{1225}{64}\varepsilon^8 + \cdots$$
  The measured $c_4 = 2.2497 \pm 0.0009$ and the $c_6$ intercept ($\approx 6.25$) are
  now consequences; the earlier "odd-square" guess ($c_6=25/4$ coincides, $c_8$ does
  not) is corrected by the exact law.
- **A critical gradient exists: $\varepsilon_c = 1/2$.** $K$ diverges at unit modulus, so
  the *mean* refocusing time diverges as $\varepsilon \to 1/2$; per angle, the slowest
  launch direction ($\sin\theta_0 = 1$) has
  $t_c = 2\pi/\sqrt{(1-\varepsilon)^2-\varepsilon^2} = 2\pi/\sqrt{1-2\varepsilon}$,
  losing its conjugate point at exactly $\varepsilon = 1/2$. *Verified: $t_c/2\pi =
  3.162$ at ε=0.45 and $7.071$ at ε=0.49 (both matching $1/\sqrt{1-2\varepsilon}$), and
  no conjugate point found at ε = 0.52.* Physically: **a charged-particle beam stops
  refocusing when the field changes by more than half across a Larmor radius** — the
  caustic opens.
- The inversion of Part 3 upgrades from leading-order to exact:
  $\varepsilon = \tfrac12 K^{-1}\!\big(\tfrac\pi2(1-\delta)\big)$.

## Novelty status (per the P5 audit)

Second-order guiding-centre theory contains the machinery but not this statistic; we
found no statement of this closed form in the checked literature. It is also a natural
fit to the sub-Riemannian lineage: the SE(2) sub-Riemannian geodesics (Sachkov–Moiseev)
are governed by Jacobi elliptic functions, and here the *magnetic* contact structure's
caustic turns out to be governed by the complete elliptic integral. Claim class:
**exact result, candidate-new**, pending one more targeted literature pass on
gyro-period integrals in exponential field profiles.
