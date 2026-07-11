# P1 — Do the conjugate-locus moduli measure ∇B?

Phase 1 of [`PROGRAM.md`](PROGRAM.md), the program's decisive experiment.
Reproduce: `../caustics-to-groups/.venv/bin/python scripts/run_p1_moduli.py`
→ `artifacts/p1_results.json`.

**Verdict: yes, and exactly.** $\delta = -\varepsilon^2 + O(\varepsilon^4)$ with leading
coefficient 1, where $\varepsilon = |\nabla\ln B|\cdot r_L$. The nilpotent-deviation
statistic reads a physical curvature gradient, invertibly.

## Why this experiment is the decisive one

The nilpotent deviation $\delta$ — the departure of a structure's conjugate locus from that
of its own tangent cone — is the central quantitative object of the sub-Riemannian inverse
map. Until now it had never been tested against a *physical ground truth*: in the
caustics-to-groups program it separated Heisenberg from SE(2), but both were structures its
own forward model generated. The magnetic contact structure is the first setting where
$\delta$ can be checked against an independently known field.

## Setup

The magnetic contact structure ($X_1=\partial_x+A_x\partial_z$, $X_2=\partial_y+A_y\partial_z$,
$[X_1,X_2]=B\,\partial_z$) has normal geodesics of a purely physical form. With
$h_1=\cos\theta$, $h_2=\sin\theta$ and $w=p_z$ (conserved):

$$\dot x = \cos\theta,\quad \dot y=\sin\theta,\quad \dot z = A_x\cos\theta+A_y\sin\theta,
\quad \dot\theta = B(x,y)\,w$$

— **unit-speed curves of curvature $B(x,y)\,w$: Larmor motion in a position-dependent field.**
For uniform $B_0$ the orbit closes at $t_c = 2\pi/(B_0|w|)$, which is exactly the Heisenberg
conjugate time. So the tangent cone at $q_0$ is Heisenberg with $B_0=B(q_0)$, and

$$\delta \;=\; \Big\langle\, 1 - t_c(\theta_0,w)\,\tfrac{B_0|w|}{2\pi} \,\Big\rangle_{\theta_0}.$$

**Field family.** $B = B_0 e^{gx}$ — the unique family with *exactly constant*
$\nabla\ln B = (g,0)$. The only dimensionless combination available is

$$\varepsilon \;=\; g\,r_L \;=\; \frac{g}{B_0|w|} \qquad(\text{gradient} \times \text{Larmor radius}).$$

## Calibration (must pass before anything else)

```
uniform B:  t_c matches 2*pi/(B0|w|) to 1e-11 relative;  |delta| floor = 1.4e-11
gauge:      symmetric gauge A=(-y/2,x/2)  ->  t_c = 6.28318531
            Landau    gauge A=(0,x)       ->  t_c = 6.28318531
```

Gauge invariance is not an accident: a gauge change $z\mapsto z+\chi(x,y)$ is a
diffeomorphism of the target, and a diffeomorphism cannot move the set where a map's
Jacobian drops rank. The conjugate time is therefore gauge-invariant, as observed.

## A pre-registration I had to correct

I pre-registered three predictions. **The second was not a prediction — it was a theorem,
and I should have seen it before running.**

Rescale $X=x/r_L$, $\tau=t/r_L$. The geodesic system becomes

$$\frac{dX}{d\tau}=\cos\theta,\qquad \frac{d\theta}{d\tau}=e^{\varepsilon X},$$

which depends on $(g,w)$ **only through $\varepsilon$**. Hence $t_c = r_L\,F(\varepsilon)$
exactly and $\delta = 1-F(\varepsilon)/2\pi$. The "collapse" of $\delta$ onto a function of
$\varepsilon$ is guaranteed by the structure's intrinsic dilation. Observing it (at 0.00%
spread across every $\varepsilon$-group) **validates the implementation; it is not evidence
about physics.** Logged rather than quietly claimed as a finding.

The genuine empirical content is the *function* $F$ — i.e. the coefficients of its series —
and the parity prediction that fixes which powers may appear.

## Results

```
     g      w       eps         delta   delta/eps^2
  0.05    2.0   0.02500    -6.259e-04       -1.0014
  0.05    4.0   0.01250    -1.563e-04       -1.0004
  0.05    8.0   0.00625    -3.907e-05       -1.0001
  0.05   16.0   0.00313    -9.766e-06       -1.0000
   0.4    2.0   0.20000    -4.406e-02       -1.1014
   ... (16 (g,w) pairs; delta uniformly negative)

parity:        p = 2.0143            (pre-registered: 2)
even series:   c2 = 0.99960          (small-eps limit of |delta|/eps^2 = 1.00002)
               c4 = 2.5236
collapse:      0.00% spread          (the dilation theorem — a code check)
uniform ctrl:  |delta| < 1.4e-11
```

$$\boxed{\;\delta(\varepsilon) \;=\; -\varepsilon^{2} \;-\; 2.52\,\varepsilon^{4}\;+\;O(\varepsilon^{6})\;}$$

## Analysis

**H1 confirmed.** Three things make this stronger than a correlation:

1. **Parity holds.** Only even powers appear, exactly as predicted: the $\theta_0$-average
   kills the odd (directional) terms, leaving $\delta$ even in $\varepsilon$. The measured
   exponent is $2.0143$, and the residual series $|\delta|/\varepsilon^2 = c_2 + c_4\varepsilon^2$
   is itself linear in $\varepsilon^2$ — even powers all the way down.
2. **The leading coefficient is exactly 1.** Measured $0.99960$, with the small-$\varepsilon$
   limit $1.00002$. This is a sharp quantitative claim, not a fitted slope.
3. **It inverts.** $|\nabla\ln B| = \sqrt{|\delta|}\,/\,r_L$ to leading order. Given the
   conjugate locus, you recover the curvature gradient.

**Physical reading.** $\delta<0$ means $t_c > t_c^{\text{nilpotent}}$: **a magnetic-field
gradient delays refocusing**, by a fractional amount $\varepsilon^2 = (\nabla\ln B\cdot r_L)^2$.
Gradient-driven drift defocuses the geodesic family, and it does so at second order because
the first-order effect is purely directional and averages away.

**The kill criterion was not triggered.** The moduli leg lives; Phase 2 may use it.

## Honest caveats

1. **Magnitude, not direction.** By averaging over $\theta_0$ I deliberately discarded the
   directional information. The $\theta_0$-*dependence* of $t_c$ should encode the
   *direction* of $\nabla B$ — untested, and the obvious next step.
2. **$\delta$ is a proxy, not the Agrachev–Barilari invariants.** Whether $\delta$ maps
   analytically onto $(\chi,\kappa)$ is a separate question, not settled here.
3. **At this order $\delta$ is blind to $\nabla^2 B$.** The family $B=B_0e^{gx}$ has
   constant $\nabla\ln B$ by construction; a family with $\nabla\ln B = 0$ but
   $\nabla^2 B\neq0$ would test the next coefficient.
4. **$c_4 = 2.5236$ is suspiciously close to $5/2$.** Both $c_2=1$ and $c_4$ look like exact
   rationals. An analytic derivation of $F(\varepsilon)$ is the natural theory follow-up,
   and would be a genuine non-elementary result of the kind §5 of the charter demands.
   *Correction (precision follow-up, `run_c4_precision.py` / `c4_precision.json`):* the
   suspicion was right that $c_4$ is rational, wrong about which one. This report's
   two-term fit over a wide $\varepsilon$ window read the local slope, not the intercept;
   the small-$\varepsilon$ extrapolation gives $c_4 = 2.2497 \pm 0.0009 = \mathbf{9/4}$
   ($5/2$ refuted at $\sim280\sigma$), with $c_6 \approx 6.4$. Caveat 3's warning about the
   next coefficient was exactly the trap this report fell into.
5. Synthetic field with analytic truth. No real data yet — that is Phase 2.

## What this settles for the charter

§5 asks whether the SR framing predicts anything that is not a repackaging of local
derivatives of the curvature. $\delta = -(\nabla\ln B\cdot r_L)^2$ is a statement about the
**conjugate locus** — an object that requires solving the geodesic flow, not differentiating
$B$. It is a first, concrete answer in the affirmative. It does not by itself defeat the
rebranding risk (one could argue the relation is "just" a perturbation of the Larmor orbit),
but it is exactly the kind of non-elementary consequence the charter demanded, and it is now
measured.
