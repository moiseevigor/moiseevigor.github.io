---
layout: distill
image: /public/img/posts/geometry-seeing-2.svg
title: "Appendix A3 — Calculus of Variations and the Pontryagin Maximum Principle"
subtitle: >
  From Euler–Lagrange to the PMP, then Lie–Poisson reduction on
  $\mathfrak{se}(2)^{\ast}$.  Why the equations $\dot h_1 = h_2 h_3$,
  $\dot h_2 = -h_1 h_3$, $\dot h_3 = 0$ that Part 2 §1 used as a starting
  point are exactly what you get when you do the optimal-control problem
  carefully on a Lie group.
date: 2026-05-03 09:00:00
categories: [mathematics]
tags: [sub-riemannian, SE2, optimal-control, pmp, hamiltonian, lie-groups]
description: >
  Self-contained derivation of the Pontryagin Maximum Principle, applied to
  the sub-Riemannian length functional on $\mathrm{SE}(2)$.  Lie–Poisson
  reduction recovers the costate equations Part 2 uses out of the box.
series: geometry-of-seeing
series_title: "Geometry of Seeing"
series_part: A3
arxiv: "0807.4731"
coauthors: "Yu. L. Sachkov"
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">What this appendix is for</div>

Part 2 §1 begins:

<blockquote>
"The Pontryagin Maximum Principle introduces a covector $\lambda$ in the
cotangent bundle... <em>(After several lines of unjustified algebra)</em>...
the Hamiltonian equations on $\mathfrak{se}(2)^{\ast}$ read
$\dot h_1 = h_2 h_3, \dot h_2 = -h_1 h_3, \dot h_3 = 0$."
</blockquote>

This appendix supplies the missing derivation.  It assumes Appendix A1
(Lie groups + $\mathfrak{se}(2)$) and A2 (distributions + Chow's theorem).
The phase portraits and pendulum-period plots borrow directly from the
<a href="https://moiseevigor.github.io/elliptic/examples/physical-pendulum/">physical-pendulum</a>
example in the
<a href="https://moiseevigor.github.io/elliptic/">elliptic project</a>:
the same Jacobi-elliptic period $4K(k^2)$ controls both that page's
nonlinear pendulum and our SE(2) elastica problem.

</div>

## The Euler–Lagrange equations in one paragraph

A Lagrangian $L(q, \dot q, t)$ on configuration space defines the **action**

$$S[\gamma] \;:=\; \int_{t_0}^{t_1} L(q(t), \dot q(t), t)\,dt.$$

Stationary paths under fixed-endpoint variations
$\delta q(t_0) = \delta q(t_1) = 0$ satisfy

$$\boxed{\;\frac{d}{dt}\frac{\partial L}{\partial \dot q^i}
        \;=\; \frac{\partial L}{\partial q^i}\;}\qquad (i = 1, \ldots, n).$$

Derivation in three lines:

$$\delta S = \int_{t_0}^{t_1} \Bigl(\frac{\partial L}{\partial q^i}\delta q^i
                                  + \frac{\partial L}{\partial \dot q^i}\delta \dot q^i\Bigr) dt
           = \int_{t_0}^{t_1}\Bigl(\frac{\partial L}{\partial q^i}
                              - \frac{d}{dt}\frac{\partial L}{\partial \dot q^i}\Bigr)\delta q^i \,dt
           + \Bigl[\frac{\partial L}{\partial \dot q^i}\delta q^i\Bigr]_{t_0}^{t_1}.$$

The boundary term vanishes; for $\delta S = 0$ for all $\delta q$, the
integrand has to vanish, giving E-L.

## Legendre transform → Hamiltonian

Define the **conjugate momentum** $p_i := \partial L / \partial \dot q^i$
and the **Hamiltonian** by Legendre transform

$$H(q, p, t) \;:=\; p_i \dot q^i - L(q, \dot q, t).$$

(Eliminating $\dot q$ in favour of $p$.)  The E-L equations become
**Hamilton's equations**

$$\dot q^i \;=\; \frac{\partial H}{\partial p_i}, \qquad
  \dot p_i \;=\; -\frac{\partial H}{\partial q^i}.$$

A direct consequence: $H$ is conserved on solutions when it has no
explicit $t$-dependence ($\dot H = \partial H / \partial t$ along
solutions).  This is what makes "energy is conserved" a theorem and not
just a slogan.

</div><!-- /.l-body -->

<!-- Fig A3.1 — Variation of the action -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>perturbation amplitude $\eta$
        <input type="range" id="var-eta" min="-100" max="100" value="0" step="1">
        <span class="ctrl-val" id="var-eta-val">+0.00</span>
      </label>
      <label>frequency $n$
        <input type="range" id="var-n" min="1" max="6" value="2" step="1">
        <span class="ctrl-val" id="var-n-val">2</span>
      </label>
      <span style="margin-left:auto;font-size:12px;color:#888;">
        Lagrangian $L = \tfrac12 \dot q^2$; straight line is the geodesic
      </span>
    </div>
    <svg id="fig-variation" style="width:100%;height:300px;"></svg>
  </div>
  <figcaption>
    <strong>Figure A3.1.</strong> The action $S[q] = \int_0^1 \tfrac12 \dot q^2
    \,dt$ for a free particle going from $q = 0$ at $t = 0$ to $q = 1$ at
    $t = 1$.  The straight-line solution $q(t) = t$ has $S = 1/2$ (the
    minimum).  Perturb it by $\delta q(t) = \eta \sin(n \pi t)$ and the
    action becomes $S = \tfrac12 + \tfrac14 (\eta n \pi)^2$ — strictly
    larger for any $\eta \neq 0$.  The right panel plots $S(\eta)$ as a
    parabola; the left panel shows the path being perturbed.  Critical
    paths satisfy E-L, here $\ddot q = 0$, hence the straight line.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## Optimal control on a manifold

We now generalise.  The state is a point $g \in M$ on a smooth manifold;
the **control** is $u(t) \in U \subseteq \mathbb R^k$; the dynamics are

$$\dot g \;=\; f(g, u),$$

and we minimise

$$J \;=\; \int_0^T L(g, u)\,dt, \qquad g(0), g(T) \text{ fixed}.$$

In our setting $M = \mathrm{SE}(2)$, $u = (u_1, u_2)$,
$f(g, u) = u_1 X_1(g) + u_2 X_2(g)$, $L = \sqrt{u_1^2 + u_2^2}$, and $T$ is
**free** (we minimise total length, so $T$ itself is the cost when $u_1^2 +
u_2^2 = 1$).

## The Pontryagin Maximum Principle

<div class="callout theorem">
<div class="callout-title">Pontryagin Maximum Principle (Pontryagin et al. 1962)</div>

If $(g^{\ast}, u^{\ast})$ is an optimal pair, there exist a constant
$\nu \in \{0, 1\}$ and a curve $\lambda^{\ast} : [0, T] \to T^{\ast}M$ with
$\lambda^{\ast}(t) \in T^{\ast}_{g^{\ast}(t)} M$, not both zero, such that the
<strong>Pontryagin Hamiltonian</strong>

$$\mathcal H(g, \lambda, u, \nu) \;:=\; \langle \lambda, f(g, u)\rangle - \nu L(g, u)$$

is <strong>maximised</strong> over admissible $u$ at every $t$:

$$\mathcal H(g^{\ast}(t), \lambda^{\ast}(t), u^{\ast}(t), \nu) \;=\;
  \max_{u \in U} \mathcal H(g^{\ast}(t), \lambda^{\ast}(t), u, \nu),$$

and $(g^{\ast}, \lambda^{\ast})$ obey the Hamilton equations of $\mathcal H$ in $T^{\ast}M$.

<strong>Normal extremals</strong>: $\nu = 1$.  <strong>Abnormal</strong>:
$\nu = 0$.
</div>

<aside id="note-costate">
The <strong>costate</strong> is the optimal-control name for the conjugate
momentum. In classical mechanics, momentum is paired with position; in
optimal control, the costate is paired with the state and tracks how the
optimal cost varies with shifts in the trajectory. In our setting it lives
in $T^{*}\mathrm{SE}(2)$, and via left-trivialisation collapses to three
numbers $(h_1, h_2, h_3) \in \mathfrak{se}(2)^{*}$ (Appendix A1).
</aside>

The key new object is the <span class="annotated-term" data-note="note-costate">**costate**</span> $\lambda \in T^{\ast}M$.  Heuristically, it
is the Lagrange multiplier enforcing the dynamic constraint $\dot g = f$.
In a coordinate chart $\lambda = \lambda_i \,dq^i$ and Hamilton's equations
read $\dot q^i = \partial \mathcal H / \partial \lambda_i$,
$\dot \lambda_i = -\partial \mathcal H / \partial q^i$.

### Maximising over $u$ for the SR problem

Sub-Riemannian length functional has $L = \sqrt{u_1^2 + u_2^2}$.  A standard
trick: parametrise by arc length, so $u_1^2 + u_2^2 = 1$ throughout.  The
controls live on the unit circle, and the cost becomes simply $T$ (the
total time = total arc length).

The Pontryagin Hamiltonian on $T^{\ast}\mathrm{SE}(2)$ with controls
$u_1 X_1 + u_2 X_2$ is

$$\mathcal H = u_1 \langle \lambda, X_1\rangle + u_2 \langle \lambda, X_2\rangle - \nu.$$

Define $h_i := \langle \lambda, X_i\rangle$ (this is the contraction of the
covector $\lambda$ with the LI vector field $X_i$).  Then
$\mathcal H = u_1 h_1 + u_2 h_2 - \nu$ (the last term is constant in $u$).

Maximising $u_1 h_1 + u_2 h_2$ over $u_1^2 + u_2^2 \leq 1$:

$$\max_{u \in S^1} (u_1 h_1 + u_2 h_2) \;=\; \sqrt{h_1^2 + h_2^2},$$

attained at $u^{\ast} = (h_1, h_2) / \sqrt{h_1^2 + h_2^2}$.

Substituting back, the **maximised Hamiltonian** is

$$\mathcal H^{\ast}(g, \lambda) \;=\; \sqrt{h_1^2 + h_2^2} - \nu \;=\;
                                 \sqrt{h_1^2 + h_2^2} - 1.$$

Standard rescaling: the trajectories of the maximised SR Hamiltonian are
the same as those of $\tfrac12(h_1^2 + h_2^2)$ (squaring is allowed
because the Hamiltonian is conserved, so $h_1^2 + h_2^2 = $ const along
solutions).  We use the squared form:

$$\boxed{\;\mathcal H_n \;=\; \tfrac12 (h_1^2 + h_2^2).\;}$$

This is the "normal Hamiltonian" of Part 2 §1.

## Lie–Poisson reduction on $\mathfrak{se}(2)^{\ast}$

Hamilton's equations for $\mathcal H_n$ on $T^{\ast}\mathrm{SE}(2)$ are coupled
equations in $(g, \lambda)$.  But the LI vector fields make
$T^{\ast}\mathrm{SE}(2)$ trivialise:

$$T^{\ast}\mathrm{SE}(2) \;\xrightarrow{\sim}\; \mathrm{SE}(2) \times \mathfrak{se}(2)^{\ast},
  \qquad \lambda \mapsto (g, \mu)$$

where $\mu = (h_1, h_2, h_3) := (\langle\lambda, X_1\rangle, \langle\lambda, X_2\rangle, \langle\lambda, X_3\rangle)$
in the basis dual to $\{E_1, E_2, E_3\}$.  In this trivialisation the
Hamiltonian flow on $T^{\ast}G$ for a *left-invariant* Hamiltonian (depending
only on $\mu$) decouples:

- the $\mu$-component evolves on $\mathfrak g^{\ast}$ alone, by the
  **Lie–Poisson equation**
  $\dot\mu = \mathrm{ad}^{\ast}_{dH(\mu)}\,\mu$;
- the $g$-component is then recovered by a **reconstruction**
  $\dot g = g \cdot dH(\mu)$.

For matrix Lie groups the Lie–Poisson equation in the $h_i$ coordinates
reads

$$\dot h_i \;=\; -\sum_{j, k} c^k_{ij}\,h_k\,\frac{\partial H}{\partial h_j},$$

where $c^k_{ij}$ are the structure constants $[E_i, E_j] = c^k_{ij} E_k$.
For $\mathfrak{se}(2)$ in the body-frame basis $\{X_1, X_2, X_3\}$ used in
Part 1 (forward / rotation / sideways), the brackets are
$[X_1, X_2] = -X_3$, $[X_2, X_3] = -X_1$, $[X_1, X_3] = 0$, giving the
non-zero coordinate brackets $\{h_1, h_2\} = h_3$ and $\{h_2, h_3\} = h_1$.
With $H_n = \tfrac12(h_1^2 + h_2^2)$ this yields

$$\dot h_1 \;=\; h_2\,h_3, \qquad
  \dot h_2 \;=\; -h_1\,h_3, \qquad
  \dot h_3 \;=\; -h_1\,h_2.$$

These are the equations Part 2 §1 uses. The conserved quantities are the
Hamiltonian $\mathcal H_n = \tfrac12(h_1^2 + h_2^2)$ and the
**Casimir** of $\mathfrak{se}(2)^{*}$,

$$C \;=\; h_1^{2} + h_3^{2}$$

— the squared translation momentum, which Poisson-commutes with every
coordinate function and so is preserved by any Hamiltonian flow on the
dual algebra (not just our particular $\mathcal H_n$). $h_3$ alone is not
conserved: the third equation above shows it evolves whenever the geodesic
is mid-cusp.

### Reduction to the pendulum

The two integrals $\mathcal H_n = \tfrac12$ (unit-speed normalisation) and
$C = h_1^2 + h_3^2$ cut the 3D dynamics down to a 1D motion. Set
$h_1 = \sin\alpha$, $h_2 = \cos\alpha$, so that $\mathcal H_n = 1/2$ is
automatic. From $\dot h_1 = h_2 h_3$ we read off $\dot\alpha = h_3$, and
the Casimir gives $h_3^2 = C - \sin^2\alpha$. With $\varphi = 2\alpha$:

$$\dot\varphi^{2} \;=\; 4 h_3^{2} \;=\; (4C - 2) \,+\, 2\cos\varphi.$$

Differentiating once in $t$:

$$\boxed{\;\ddot\varphi + \sin\varphi \;=\; 0,
        \qquad E \;=\; \tfrac12\dot\varphi^{2} - \cos\varphi \;=\; 2C - 1.\;}$$

That is the **pendulum equation** — derived, not postulated, from the
Lie–Poisson flow on $\mathfrak{se}(2)^{*}$. The pendulum angle
$\varphi = 2\alpha$ is twice the phase of $(h_1, h_2)$ on the unit circle;
the pendulum energy $E$ is fixed by the Casimir on the coadjoint orbit.

The reconstruction equation then ties the planar curve's heading $\theta$
back to the costate. With $u_1^{\ast} = h_1 = \sin(\varphi/2)$ and
$u_2^{\ast} = h_2 = \cos(\varphi/2)$, the SE(2) ODE
$(\dot x, \dot y, \dot\theta) = (u_1^{\ast}\cos\theta, u_1^{\ast}\sin\theta, u_2^{\ast})$
gets reparametrised by Euclidean arc length $s$ (with $ds = |u_1^{\ast}|\,dt$);
the resulting projected curve has curvature

$$\kappa(s) = \frac{u_2^{\ast}}{u_1^{\ast}} = \cot(\varphi/2).$$

Tracking $\kappa$ through the three pendulum regimes recovers the three
elastica families of Part 2 §3 — inflectional ($E < 1$, $\kappa = 2k\,\mathrm{cn}$),
separatrix ($E = 1$, $\kappa = 2\,\mathrm{sech}$), non-inflectional
($E > 1$, $\kappa = 2\,\mathrm{dn}$). Appendix A4 §3 tracks that
substitution in detail; the **elastica curvature ODE**
$\kappa''(s) + \tfrac12\kappa^3 - \mu\kappa = 0$ is the Duffing form
equivalent to the pendulum and is what the figures in Part 2 actually plot.

</div><!-- /.l-body -->

<!-- Fig A3.2 — Pendulum phase portrait -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>energy $E$
        <input type="range" id="phase-E" min="-95" max="200" value="40" step="1">
        <span class="ctrl-val" id="phase-E-val">+0.40</span>
      </label>
      <label>show
        <select id="phase-mode">
          <option value="curve">single trajectory</option>
          <option value="all" selected>level sets (libration / sep / rotation)</option>
        </select>
      </label>
      <span style="margin-left:auto;font-size:12px;color:#888;">
        $\ddot\varphi + \sin\varphi = 0$, energy $E = \tfrac12\dot\varphi^2 - \cos\varphi$
      </span>
    </div>
    <svg id="fig-phase" style="width:100%;height:380px;"></svg>
  </div>
  <figcaption>
    <strong>Figure A3.2.</strong> Phase portrait of the planar pendulum
    in coordinates $(\varphi, \dot\varphi)$ — same diagram that drives the
    <a href="https://moiseevigor.github.io/elliptic/examples/physical-pendulum/">elliptic project's
    physical-pendulum example</a>.
    Three regimes correspond exactly to the three SE(2) elastica families
    of Part 2:
    <strong>libration</strong> ($-1 < E < 1$, blue closed orbits) —
    inflectional elastica;
    <strong>separatrix</strong> ($E = 1$, red curve) — Euler spiral;
    <strong>rotation</strong> ($E > 1$, green orbits) — non-inflectional
    elastica.  The energy $E$ slider also controls the modulus
    $k = \sqrt{(E+1)/2}$ for libration; $k = 1$ at the separatrix; $k > 1$
    in the rotation regime where the period becomes $2K(1/k^2)/k$.  The
    period diverges at $E = 1$ (both sides) — this is the
    $K(k^2) \to \infty$ asymptotic of Appendix A4.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## The reconstruction equation

Once $\mu(t) = (h_1(t), h_2(t), h_3)$ is known, the SE(2) trajectory itself
is obtained from

$$\dot g(t) \;=\; g(t)\,\xi(t), \qquad \xi(t) := u_1^{\ast}(t) E_1 + u_2^{\ast}(t) E_2,$$

with $u^{\ast}(t) = (h_1(t), h_2(t)) / \sqrt c$ from the maximisation.  In the
$(x, y, \theta)$ chart this is exactly Part 1's Frenet–Serret integration:

$$\dot x = u_1^{\ast} \cos\theta, \qquad \dot y = u_1^{\ast} \sin\theta,
  \qquad \dot \theta = u_2^{\ast}.$$

Setting $u_1^{\ast} = 1$ (unit-speed normalisation), we get $u_2^{\ast} = \dot\theta =
\kappa$, which is the **curvature** of the projected plane curve.  The
relation $\kappa = h_2 / \sqrt c$ ties the costate to the curvature
directly: $\kappa$ inherits the $h_2$-pendulum dynamics and so becomes a
Jacobi sn (libration), sech (separatrix), or dn (rotation) — Part 2 §2.

</div><!-- /.l-body -->

<!-- Fig A3.3 — Costate trajectory on cylinder + plane curve -->
<figure class="l-middle">
  <div class="fig-box">
    <div class="fig-controls">
      <label>$\omega_0 = h_3$
        <input type="range" id="costate-h3" min="-150" max="150" value="60" step="1">
        <span class="ctrl-val" id="costate-h3-val">+0.60</span>
      </label>
      <label>$\sqrt c$ (orbit radius)
        <input type="range" id="costate-c" min="20" max="160" value="100" step="1">
        <span class="ctrl-val" id="costate-c-val">1.00</span>
      </label>
      <span style="margin-left:auto;font-size:12px;color:#888;">
        Left: costate on cylinder.  Right: reconstructed plane curve.
      </span>
    </div>
    <svg id="fig-costate" style="width:100%;height:380px;"></svg>
  </div>
  <figcaption>
    <strong>Figure A3.3.</strong> Left: the costate $(h_1, h_2, h_3)$ winds
    on a cylinder $h_1^2 + h_2^2 = c$ at the constant rate
    $\dot\phi = -h_3$.  Right: the plane projection of the resulting
    SE(2) geodesic, integrated by the reconstruction equation $\dot g =
    g\cdot\xi(t)$.  Vary $h_3$ and the curve interpolates between
    near-circular (small $h_3$) and the elastica regime; vary $\sqrt c$
    and the curve scales without changing shape — confirming Part 2's
    observation that only the dimensionless ratio $h_3 / \sqrt c$
    determines which elastica family you land in.
  </figcaption>
</figure>

<div class="l-body" markdown="1">

## Connection to the elliptic project

The phase portrait of Figure A3.2 is computationally identical to the one
in
<a href="https://moiseevigor.github.io/elliptic/examples/physical-pendulum/">
elliptic project's physical-pendulum example</a> — both compute level sets
of $E = \tfrac12\dot\varphi^2 - \cos\varphi$ and trace closed orbits with
period $4K(k^2)$.  The SE(2) elastica problem is, structurally, the *same
ODE* as a nonlinear pendulum: this appendix's job has been to make that
equivalence inevitable, by deriving the pendulum equation from the PMP on
$\mathrm{SE}(2)$ rather than postulating it.

Once you have the pendulum, the period-and-amplitude analysis is the
business of Appendix A4 (Jacobi elliptic functions) and the closed-form
geodesic endpoints are the business of Appendix A5 (the SR exponential
map).

## Code

```python
# Verify the Lie–Poisson equations on se(2)* numerically
# from a random initial costate (h1, h2, h3) and check that:
#   - h3(t) is constant
#   - h1²+h2² is constant
#   - h1(t) = sqrt(c) cos(-h3 t + φ0)
import numpy as np
from scipy.integrate import solve_ivp

def lie_poisson_se2(t, h):
    h1, h2, h3 = h
    return [h2*h3, -h1*h3, 0.0]

h0 = [0.6, 0.4, 0.7]
sol = solve_ivp(lie_poisson_se2, [0, 8], h0, rtol=1e-10, atol=1e-12,
                t_eval=np.linspace(0, 8, 400))

# Check Casimirs
c = sol.y[0]**2 + sol.y[1]**2
print(f"max |c - c0| / |c0| = {np.max(np.abs(c - c[0]))/c[0]:.2e}")  # ~ 1e-10
print(f"max |h3 - h30|       = {np.max(np.abs(sol.y[2] - h0[2])):.2e}")  # ~ 1e-12

# Match the closed form
phi0 = np.arctan2(h0[1], h0[0])
phi_t = phi0 - h0[2] * sol.t
h1_pred = np.sqrt(c[0]) * np.cos(phi_t)
print(f"max |h1 - prediction| = {np.max(np.abs(sol.y[0] - h1_pred)):.2e}")  # ~ 1e-10
```

```python
# Reconstruct the SE(2) trajectory from the costate solution
# (same algorithm used by elliptic-core.js's integrateElastica routine)
def reconstruct_se2(h_t, t_arr):
    """Given h(t) sampled at t_arr, return (x, y, theta)."""
    c = h_t[0,0]**2 + h_t[1,0]**2
    sqrt_c = np.sqrt(c)
    u1 = h_t[0] / sqrt_c
    u2 = h_t[1] / sqrt_c
    x, y, th = 0.0, 0.0, 0.0
    out = [(0,0,0)]
    for i in range(len(t_arr) - 1):
        dt = t_arr[i+1] - t_arr[i]
        thmid = th + 0.5 * u2[i] * dt
        x  += u1[i] * np.cos(thmid) * dt
        y  += u1[i] * np.sin(thmid) * dt
        th += u2[i] * dt
        out.append((x, y, th))
    return np.array(out)
```

## What we covered, and what comes next

The Pontryagin Maximum Principle takes an optimal-control problem and
produces a Hamiltonian system on $T^{\ast}M$.  For the SE(2) sub-Riemannian
length problem, maximisation over $u_1, u_2$ on the unit circle gives the
normal Hamiltonian $\mathcal H_n = \tfrac12(h_1^2 + h_2^2)$.
Lie–Poisson reduction on $\mathfrak{se}(2)^{\ast}$ collapses the
$T^{\ast}\mathrm{SE}(2)$ flow to the costate equations
$\dot h_1 = h_2 h_3, \dot h_2 = -h_1 h_3, \dot h_3 = 0$ — exactly the
equations Part 2 §1 wrote down.  The substitution $h_1 = \sqrt c \cos\phi,
h_2 = \sqrt c \sin\phi$ turns the costate into a uniformly-rotating phase,
and differentiating once more gives the nonlinear pendulum equation for
the curvature.

Appendix A4 will solve the pendulum equation in closed form using Jacobi
elliptic functions and the AGM, recovering the period $4K(k^2)$ and the
explicit $\kappa(s) = 2k\,\mathrm{sn}(s\mid k^2)$ formula of Part 2.

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>
    L. S. Pontryagin, V. G. Boltyanskii, R. V. Gamkrelidze, E. F. Mishchenko
    (1962). <em>The Mathematical Theory of Optimal Processes.</em>
    Wiley–Interscience.  The original PMP source.
  </li>
  <li>
    A. A. Agrachev, Yu. L. Sachkov (2004). <em>Control Theory from the
    Geometric Viewpoint.</em> Springer.  Chapter 12 derives the SR
    geodesic equations on Lie groups by exactly this route.
  </li>
  <li>
    J. E. Marsden, T. S. Ratiu (1999). <em>Introduction to Mechanics and
    Symmetry.</em> Springer.  Chapters 13–14 for Lie–Poisson reduction.
  </li>
  <li>
    V. I. Arnold (1989). <em>Mathematical Methods of Classical Mechanics.</em>
    Springer GTM 60.  Appendix 2 has Lie–Poisson dynamics.
  </li>
  <li>
    Yu. L. Sachkov (2010).  "Conjugate and cut time in the sub-Riemannian
    problem on the group of motions of a plane."  ESAIM: COCV 16:
    1018–1039.  Uses the costate ODE derived here.
  </li>
  <li>
    <a href="https://moiseevigor.github.io/elliptic/examples/physical-pendulum/">
    Elliptic project — Physical Pendulum</a>.  Phase-portrait diagram
    identical to Figure A3.2; same $K(k^2)$ period.
  </li>
</ol>
</div>
</div>

<!-- ── Interactive figures ── -->
<script src="/public/js/elliptic-core.js"></script>
<script>
(function () {
'use strict';

// ── Figure A3.1 — Variation of the action ─────────────────────────────
function drawVariation() {
  const svg = document.getElementById('fig-variation');
  if (!svg) return;
  const eta = parseFloat(document.getElementById('var-eta').value) / 100;
  const n = parseInt(document.getElementById('var-n').value, 10);
  document.getElementById('var-eta-val').textContent = (eta >= 0 ? '+' : '') + eta.toFixed(2);
  document.getElementById('var-n-val').textContent = String(n);

  const W = svg.clientWidth || 720, H = 300;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();

  // Two panels: left q(t) plot, right S(eta) parabola
  const split = W * 0.6;
  const m = { t: 18, b: 32, l: 40, r: 16 };

  // Left: q(t) plot
  const xS = d3.scaleLinear().domain([0, 1]).range([m.l, split - m.r]);
  const yS = d3.scaleLinear().domain([-0.4, 1.6]).range([H - m.b, m.t]);

  // Straight-line geodesic q(t) = t
  const tArr = d3.range(0, 1.001, 0.005);
  const qStr = tArr.map(t => ({ t, q: t }));
  const qPert = tArr.map(t => ({ t, q: t + eta * Math.sin(n * Math.PI * t) }));

  // Axes
  g.append('line').attr('x1', m.l).attr('x2', split - m.r)
    .attr('y1', yS(0)).attr('y2', yS(0)).attr('stroke', '#eee').attr('stroke-width', 1);
  g.append('text').attr('x', m.l).attr('y', m.t + 12)
    .attr('font-family', 'Source Sans 3').attr('font-size', 11).attr('fill', '#888').text('q(t)');

  g.append('path')
    .attr('d', d3.line().x(p => xS(p.t)).y(p => yS(p.q))(qStr))
    .attr('fill', 'none').attr('stroke', '#888').attr('stroke-width', 1.4)
    .attr('stroke-dasharray', '4,3');
  g.append('path')
    .attr('d', d3.line().x(p => xS(p.t)).y(p => yS(p.q))(qPert))
    .attr('fill', 'none').attr('stroke', '#1565c0').attr('stroke-width', 2.2);

  // Endpoints
  g.append('circle').attr('cx', xS(0)).attr('cy', yS(0)).attr('r', 4).attr('fill', '#444');
  g.append('circle').attr('cx', xS(1)).attr('cy', yS(1)).attr('r', 4).attr('fill', '#444');

  g.append('text').attr('x', m.l + 4).attr('y', H - 10)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#666')
    .text('dashed: straight-line E-L solution');

  // Right: S(eta) parabola
  const aE = (n * Math.PI) / 2;  // S(eta) = 1/2 + (eta n pi)^2 / 4
  const eArr = d3.range(-1, 1.01, 0.02);
  const Svals = eArr.map(e => ({ e, S: 0.5 + 0.25 * (e * n * Math.PI) ** 2 }));

  const xE = d3.scaleLinear().domain([-1, 1]).range([split + m.l, W - m.r]);
  const yE = d3.scaleLinear().domain([0, 30]).range([H - m.b, m.t]);

  g.append('line').attr('x1', split + m.l).attr('x2', W - m.r)
    .attr('y1', yE(0.5)).attr('y2', yE(0.5)).attr('stroke', '#eee').attr('stroke-dasharray', '3,3');
  g.append('text').attr('x', split + m.l).attr('y', m.t + 12)
    .attr('font-family', 'Source Sans 3').attr('font-size', 11).attr('fill', '#888').text('S(η)');

  g.append('path')
    .attr('d', d3.line().x(p => xE(p.e)).y(p => yE(Math.min(p.S, 30)))(Svals))
    .attr('fill', 'none').attr('stroke', '#1565c0').attr('stroke-width', 2);
  // Current point
  const Scur = 0.5 + 0.25 * (eta * n * Math.PI) ** 2;
  g.append('circle').attr('cx', xE(eta)).attr('cy', yE(Math.min(Scur, 30))).attr('r', 4).attr('fill', '#1565c0');
  // Min point
  g.append('circle').attr('cx', xE(0)).attr('cy', yE(0.5)).attr('r', 4)
    .attr('fill', 'none').attr('stroke', '#b71c1c').attr('stroke-width', 1.5);

  g.append('text').attr('x', split + m.l + 4).attr('y', H - 10)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 10).attr('fill', '#666')
    .text(`S = ½ + ¼ (η·n·π)²    S(η) = ${Scur.toFixed(3)}`);

  // Divider
  g.append('line').attr('x1', split).attr('x2', split)
    .attr('y1', m.t).attr('y2', H - m.b).attr('stroke', '#e0e0e0').attr('stroke-width', 1);
}

// ── Figure A3.2 — Pendulum phase portrait ─────────────────────────────
function drawPhase() {
  const svg = document.getElementById('fig-phase');
  if (!svg) return;
  const E = parseFloat(document.getElementById('phase-E').value) / 100;
  const mode = document.getElementById('phase-mode').value;
  document.getElementById('phase-E-val').textContent = (E >= 0 ? '+' : '') + E.toFixed(2);

  const W = svg.clientWidth || 720, H = 380;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();

  const m = { t: 18, b: 36, l: 50, r: 30 };
  const xS = d3.scaleLinear().domain([-Math.PI * 1.4, Math.PI * 1.4]).range([m.l, W - m.r]);
  const yS = d3.scaleLinear().domain([-3, 3]).range([H - m.b, m.t]);

  // Axes
  g.append('line').attr('x1', m.l).attr('x2', W - m.r)
    .attr('y1', yS(0)).attr('y2', yS(0)).attr('stroke', '#e0e0e0').attr('stroke-width', 1);
  g.append('line').attr('x1', xS(0)).attr('x2', xS(0))
    .attr('y1', m.t).attr('y2', H - m.b).attr('stroke', '#e0e0e0').attr('stroke-width', 1);

  // Helper to plot a level set E = 1/2 dot_phi^2 - cos phi  ⇒ dot_phi = ±sqrt(2(E + cos phi))
  function plotLevel(Ev, color, dash) {
    const phiArr = d3.range(-Math.PI * 1.35, Math.PI * 1.35 + 0.001, 0.01);
    const top = [], bot = [];
    phiArr.forEach(p => {
      const inner = 2 * (Ev + Math.cos(p));
      if (inner >= 0) {
        const v = Math.sqrt(inner);
        top.push({ phi: p, dphi: v });
        bot.push({ phi: p, dphi: -v });
      }
    });
    [top, bot].forEach(arr => {
      if (arr.length > 1) {
        g.append('path')
          .attr('d', d3.line().x(p => xS(p.phi)).y(p => yS(p.dphi))(arr))
          .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 1.6)
          .attr('stroke-dasharray', dash || null);
      }
    });
  }

  if (mode === 'all') {
    // libration: E in (-1, 1)
    [-0.7, -0.4, 0, 0.4, 0.7, 0.9].forEach(Ev => plotLevel(Ev, '#1565c0'));
    // separatrix
    plotLevel(1.0, '#b71c1c');
    // rotation
    [1.3, 1.7, 2.5].forEach(Ev => plotLevel(Ev, '#2e7d32'));
  }

  // Selected level
  plotLevel(E,
    E < 0.99 ? '#1565c0' : (E < 1.02 ? '#b71c1c' : '#2e7d32'),
    '5,3');

  // Equilibria
  g.append('circle').attr('cx', xS(0)).attr('cy', yS(0)).attr('r', 3).attr('fill', '#444');
  g.append('circle').attr('cx', xS(Math.PI)).attr('cy', yS(0)).attr('r', 3)
    .attr('fill', 'none').attr('stroke', '#444').attr('stroke-width', 1.4);
  g.append('circle').attr('cx', xS(-Math.PI)).attr('cy', yS(0)).attr('r', 3)
    .attr('fill', 'none').attr('stroke', '#444').attr('stroke-width', 1.4);

  // Axes labels
  g.append('text').attr('x', W - m.r - 6).attr('y', yS(0) - 4)
    .attr('text-anchor', 'end')
    .attr('font-family', 'Source Sans 3').attr('font-size', 11).attr('fill', '#666').text('φ');
  g.append('text').attr('x', xS(0) + 6).attr('y', m.t + 10)
    .attr('font-family', 'Source Sans 3').attr('font-size', 11).attr('fill', '#666').text('φ̇');

  // Period readout (libration only, via 4K(k²))
  let periodText = '';
  if (E > -1 && E < 1) {
    const k2 = (E + 1) / 2;
    const Km = ellipticK(k2);
    periodText = `T = 4K(k²) = ${(4 * Km).toFixed(3)} (libration, k = ${Math.sqrt(k2).toFixed(2)})`;
  } else if (Math.abs(E - 1) < 0.01) {
    periodText = 'T → ∞ (separatrix)';
  } else if (E > 1) {
    const m1 = 2 / (1 + E);
    const Km = ellipticK(m1);
    periodText = `T = 2K(m)·√m = ${(2 * Km * Math.sqrt(m1)).toFixed(3)} (rotation)`;
  } else {
    periodText = 'E < -1: no motion';
  }
  g.append('text').attr('x', m.l).attr('y', m.t + 12)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#555')
    .text(`E = ${E.toFixed(2)}    ${periodText}`);
}

// ── Figure A3.3 — costate cylinder + plane curve ─────────────────────
function drawCostate() {
  const svg = document.getElementById('fig-costate');
  if (!svg) return;
  const h3 = parseFloat(document.getElementById('costate-h3').value) / 100;
  const c = parseFloat(document.getElementById('costate-c').value) / 100;
  document.getElementById('costate-h3-val').textContent = (h3 >= 0 ? '+' : '') + h3.toFixed(2);
  document.getElementById('costate-c-val').textContent = c.toFixed(2);

  const W = svg.clientWidth || 720, H = 380;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const g = d3.select(svg); g.selectAll('*').remove();

  // Two panels
  const split = W * 0.5;
  const m = { t: 18, b: 26, l: 30, r: 30 };

  // Left: cylinder with trajectory (oblique 3D)
  const cosA = Math.cos(Math.PI / 6), sinA = Math.sin(Math.PI / 6);
  const scaleL = Math.min(split - m.l - m.r, H - m.t - m.b) / 4;
  const oxL = m.l + (split - m.l - m.r) / 2, oyL = m.t + (H - m.t - m.b) / 2;
  const proj = (h1, h2, h3z) => ({
    x: oxL + scaleL * (h1 - 0.5 * cosA * h2),
    y: oyL - scaleL * (h3z + 0.5 * sinA * h2),
  });
  const r = Math.sqrt(c);
  // Cylinder hoops
  for (let h3i = -1; h3i <= 1; h3i += 0.25) {
    const ring = [];
    for (let phi = 0; phi <= 2 * Math.PI + 0.01; phi += 0.05) {
      ring.push(proj(r * Math.cos(phi), r * Math.sin(phi), h3i));
    }
    g.append('path')
      .attr('d', d3.line().x(p => p.x).y(p => p.y)(ring))
      .attr('fill', 'none').attr('stroke', '#e8e8e8').attr('stroke-width', 1);
  }
  // Trajectory at constant h3 = slider
  const T = 12;
  const tArr = d3.range(0, T, 0.05);
  const tr = tArr.map(t => proj(r * Math.cos(-h3 * t), r * Math.sin(-h3 * t), h3));
  g.append('path')
    .attr('d', d3.line().x(p => p.x).y(p => p.y)(tr))
    .attr('fill', 'none').attr('stroke', '#1565c0').attr('stroke-width', 2.2);
  g.append('text').attr('x', m.l + 4).attr('y', m.t + 12)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#555')
    .text(`(h₁,h₂,h₃) on cylinder, c = ${c.toFixed(2)}`);

  // Right: plane curve from reconstruction
  // u1 = cos(phi), u2 = sin(phi), phi = phi0 - h3·t  (we set phi0 = 0)
  // dot_theta = u2 → integrate
  const N = 600;
  const Tend = 12;
  const dt = Tend / N;
  let x = 0, y = 0, theta = 0;
  const path = [{ x, y }];
  for (let i = 0; i < N; i++) {
    const t = i * dt;
    const phi = -h3 * (t + dt / 2);
    const u1 = Math.cos(phi), u2 = Math.sin(phi);
    const thMid = theta + 0.5 * u2 * dt;
    x += u1 * Math.cos(thMid) * dt;
    y += u1 * Math.sin(thMid) * dt;
    theta += u2 * dt;
    path.push({ x, y });
  }

  // Bounds
  const xs = path.map(p => p.x), ys = path.map(p => p.y);
  const xExt = [Math.min(...xs), Math.max(...xs)];
  const yExt = [Math.min(...ys), Math.max(...ys)];
  const cx = (xExt[0] + xExt[1]) / 2, cy = (yExt[0] + yExt[1]) / 2;
  const range = Math.max(xExt[1] - xExt[0], yExt[1] - yExt[0]) / 2 + 0.3;
  const aspect = (W - split - m.l - m.r) / (H - m.t - m.b);
  const xR = range * Math.max(aspect, 1);
  const yR = range * Math.max(1 / aspect, 1);
  const xS = d3.scaleLinear().domain([cx - xR, cx + xR]).range([split + m.l, W - m.r]);
  const yS = d3.scaleLinear().domain([cy - yR, cy + yR]).range([H - m.b, m.t]);

  g.append('path')
    .attr('d', d3.line().x(p => xS(p.x)).y(p => yS(p.y))(path))
    .attr('fill', 'none').attr('stroke', '#1565c0').attr('stroke-width', 2.2);
  g.append('circle').attr('cx', xS(0)).attr('cy', yS(0)).attr('r', 3).attr('fill', '#444');

  g.append('text').attr('x', split + m.l + 4).attr('y', m.t + 12)
    .attr('font-family', 'JetBrains Mono').attr('font-size', 11).attr('fill', '#555')
    .text(`plane curve (x(s), y(s))`);

  // Divider
  g.append('line').attr('x1', split).attr('x2', split)
    .attr('y1', m.t).attr('y2', H - m.b).attr('stroke', '#e0e0e0').attr('stroke-width', 1);
}

// ── Boot ─────────────────────────────────────────────────────────────
function wire() {
  ['var-eta', 'var-n'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawVariation);
  });
  ['phase-E', 'phase-mode'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawPhase);
    if (el) el.addEventListener('change', drawPhase);
  });
  ['costate-h3', 'costate-c'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', drawCostate);
  });
  drawVariation();
  drawPhase();
  drawCostate();
  window.addEventListener('resize', () => { drawVariation(); drawPhase(); drawCostate(); });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wire);
} else {
  wire();
}

})();
</script>
