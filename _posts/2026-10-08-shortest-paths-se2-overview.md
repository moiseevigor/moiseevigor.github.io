---
layout: distill
title: "The Shortest Path When You Cannot Move Sideways"
subtitle: >
  An interactive guide to the geometry of motion in the plane: from a simple
  constraint to the pendulum, competing routes, and the complete shortest-path solution.
date: 2026-10-08 12:00:00 +0200
categories: [mathematics]
tags: [SE2, sub-riemannian, popular-science, geometry, optimal-control]
permalink: /mathematics/se2-explained/
image: /public/img/posts/se2-explained.svg
published: true
reference_style: bibliography
comments: false
description: >
  A layered, illustrated overview of the classical sub-Riemannian problem on
  SE(2), its history, applications, and published optimal synthesis.
---

{% include se2-assets.html %}
<link rel="stylesheet" href="/public/css/se2-overview.css">
<script type="module" src="/public/js/se2/overview.js?v={{ site.time | date: '%s' }}"></script>

<div class="l-body" markdown="1">

<div class="se2-review"><strong>Interactive overview · published 8 October 2026.</strong> This guide explains the classical problem and its published solution. The separate <a href="/mathematics/2026/10/07/se2-geodesics-research-program/">research program</a> begins where this story ends: with geodesics continued beyond shortest paths.</div>

Imagine a small robot that can drive forward, reverse, and turn on the spot. It cannot slide sideways. To reach a destination, it must choose a route and arrive pointing the right way. What is its shortest possible motion?

This is the **sub-Riemannian problem on SE(2), the group of motions of the plane**. A ruler cannot answer. It measures position; the robot must also pay for changing direction. Yet this problem is not an unsolved maze. For a precise, obstacle-free model, mathematicians have described all shortest paths and exactly where they cease to be shortest. The surprise is that their equations contain a pendulum.

<div class="se2-reading" role="group" aria-label="Choose reading depth"><span>Read at your depth</span><button type="button" data-depth="story" aria-pressed="true">The visual story</button><button type="button" data-depth="mechanism" aria-pressed="false">Add the geometry</button><button type="button" data-depth="full" aria-pressed="false">Include the mathematics</button></div>
<p class="se2-depth-note" aria-live="polite">The main story needs no calculus. Open any detail individually, or use the buttons to expand a whole level.</p>

<nav class="se2-overview-map" aria-label="Chapters">
<a href="#the-rule">1 · The rule</a><a href="#the-space">2 · The space</a><a href="#the-applications">3 · Why it matters</a><a href="#the-history">4 · How we got here</a><a href="#the-pendulum">5 · The pendulum</a><a href="#when-shortest-paths-stop">6 · The competition</a><a href="#the-solution">7 · The solution</a><a href="#what-comes-next">8 · Beyond shortest</a>
</nav>

<h2 id="the-rule">A forbidden direction changes distance</h2>

At each instant the robot has two controls: driving speed and turning speed. It may combine them to follow a curve. A sideways jump is forbidden even if it would make the trip shorter.

That does not make a sideways destination unreachable. Turn a little, drive, turn back, and reverse. These individually allowed moves leave a net sideways displacement. Try the sequence below. This is a demonstration of **reachability**, not a proposed shortest route.

</div>

{% include se2-overview-figure.html mode="motion" kicker="Experiment 1 · build a missing direction" title="Sideways motion from allowed moves" caption="The four moves are turn by ε, drive a distance ε, turn back, and reverse by ε. The endpoint is (ε(cos ε − 1), ε sin ε, 0). The small horizontal remainder is real; it is not an exact sideways translation." %}

<div class="l-body" markdown="1">

The geometry measures the least total effort among allowed motions. In normalized units, simultaneous driving and turning cost the square root of the sum of their squared speeds. Turning in place costs something; it adds no length to the drawing in the plane. That is why **the length of a motion is different from the length of its planar trace**.

<details class="se2-detail" data-level="mechanism" markdown="1"><summary>The geometric idea: two directions now, three over a journey</summary>

A Riemannian metric assigns lengths to every tangent direction. A **sub-Riemannian metric** assigns lengths only to an allowed subspace at each state. Here that subspace has two dimensions in a three-dimensional space. A curve tangent to it is called *horizontal*; “horizontal” does not mean parallel to the ground.

Composing the two motions produces the missing third direction. The bracket-generating condition formalizes this, and the Chow–Rashevskii theorem gives connectivity on the connected state space.[^foundations] It guarantees a route, not its optimality.

</details>

<details class="se2-detail" data-level="full" markdown="1"><summary>The exact model and a short reachability calculation</summary>

For a pose $q=(x,y,\theta)$, with heading $\theta$ modulo $2\pi$, set

$$X_1=\cos\theta\,\partial_x+\sin\theta\,\partial_y,\qquad X_2=\partial_\theta.$$

Declare these fields orthonormal. The admissible paths and their length are

$$\dot q=u_1X_1+u_2X_2,\qquad \ell(q)=\int_0^T\sqrt{u_1^2+u_2^2}\,dt.$$

Both controls are real: reversing and turning in place are allowed. This is an idealized reversible vehicle, without obstacles, acceleration limits, or a minimum turning radius. A weight $\xi>0$ can instead give the cost $\sqrt{\xi^2u_1^2+u_2^2}$; spatial rescaling reduces a constant weight to the normalization used here. Position and angle must be nondimensionalized before their squares are added.

The missing direction appears in

$$[X_2,X_1]=-\sin\theta\,\partial_x+\cos\theta\,\partial_y.$$

Together the three fields span every tangent space. In the experiment, $y=\varepsilon\sin\varepsilon=\varepsilon^2+O(\varepsilon^4)$ and $x=\varepsilon(\cos\varepsilon-1)=-\varepsilon^3/2+O(\varepsilon^5)$. The effort is $4\varepsilon$ for positive $\varepsilon$: two rotations and two translations. The leading sideways effect is second order.

</details>

<h2 id="the-space">A position plus a heading is a point in SE(2)</h2>

Draw a little arrow on the robot. Two robots at the same dot, facing different ways, have different states. Each dot in the plane comes with a circle of possible headings. The state space is therefore a plane times a circle.

It also has a way of composing motions. Driving after a turn follows the new heading; turning after a drive does not move the drive that already happened. **Order matters.** This composition makes the space a group: SE(2), the special Euclidean group in two dimensions. “Special” excludes reflections. “Euclidean” refers to the rigid motions, not to the distance we have just defined on them.

</div>

{% include se2-overview-figure.html mode="order" kicker="Experiment 2 · compare two orders" title="Turn, then drive — or drive, then turn?" caption="Both sequences travel one spatial unit and turn through the same angle. They finish with the same heading but generally different positions. The colored endpoint arrows show complete poses, not just dots." %}

<div class="l-body" markdown="1">

<details class="se2-detail" data-level="full" markdown="1"><summary>Group multiplication and left invariance</summary>

Writing $r=(x,y)$ and $R_\theta$ for ordinary planar rotation, the group law is

$$(r,\theta)\cdot(r^{\prime},\theta^{\prime})=(r+R_\theta r^{\prime},\theta+\theta^{\prime}\bmod 2\pi).$$

The same two body-relative controls apply wherever the robot starts and however it faces. This is **left invariance**. If $g_0$ and $g_1$ are arbitrary initial and final poses, solve from the identity to $g_0^{-1}g_1$, then apply $g_0$ to the whole path. This reduces the boundary-value problem to one fixed starting state without changing its cost.

</details>

<h2 id="the-applications">The same space helps describe curves and images</h2>

**Motion planning** provides the concrete picture: reaching a position with a prescribed heading while respecting a constraint. A robot able to pivot in place fits this idealization better than a conventional car. A physical planner must add its actual steering, obstacles, dynamics, and costs.

**Contour completion** provides another picture. An edge fragment has both a location and an orientation. Lifting those fragments into a position–orientation space separates information that overlaps in an ordinary image. Petitot’s neurogeometry and Citti–Sarti’s cortical model use this structure to describe aspects of perceptual organization.[^petitot][^citti] These are mathematical models informed by vision, not a claim that the brain literally runs the shortest-path algorithm below. The earlier [visual-cortex article](/mathematics/2026/04/25/geometry-of-seeing-visual-cortex-se2/) develops that motivation.

**Image analysis** turns this idea into computational tools: paths in lifted spaces can follow vessels and other elongated structures through crossings. Data-dependent costs and forward-only variants are useful there; they change the exact homogeneous problem whose solution we explain here.[^imaging]

<details class="se2-detail" data-level="mechanism" markdown="1"><summary>Three similar models that should not be confused</summary>

The classical Dubins and Reeds–Shepp car problems impose a minimum turning radius. Dubins allows forward motion; Reeds–Shepp also allows reversing.[^dubins][^reeds] Our metric permits independent turning, including pivoting in place, and penalizes combined controls smoothly. It has a different optimal synthesis.

For an image edge, orientation is often an **unoriented line**, so $\theta$ and $\theta+\pi$ represent the same feature. Our robot has a directed heading modulo $2\pi$. Passing to the projective orientation space changes the endpoint identification and can change shortest-path multiplicities.

A smooth lifted curve moving strictly forward can be reparametrized by spatial arclength $s$. With planar curvature $\kappa$, our normalized length becomes $\int\sqrt{1+\kappa^2}\,ds$. Euler’s elastica instead minimizes a quadratic curvature functional such as $\int(1+\kappa^2)\,ds$. These objectives are different. The forward arclength description also breaks down at a planar cusp or a pure rotation.[^association]

</details>

<h2 id="the-history">A history with several beginnings</h2>

There was no single day when somebody invented this entire problem. Constrained motion, geometric control, and models of vision supplied different parts. The chronology below follows the sources relevant to this guide; it is not an exhaustive history of every contribution to sub-Riemannian geometry. Expand an entry for its role and reference.

<details class="se2-history" markdown="1"><summary><span>1909</span> Accessibility before the modern name</summary>

Carathéodory’s work on the foundations of thermodynamics is an early source of ideas about accessibility under differential constraints.[^caratheodory] It is a precursor, not a solution of the vehicle problem. The modern textbook’s historical notes also point to Cartan’s later work and to several independent developments in the 1960s and 1970s.[^foundations]

</details>
<details class="se2-history" markdown="1"><summary><span>1938–1940</span> Allowed directions can connect a whole space</summary>

Rashevskii and Chow established the connectivity principle now bearing their names. The conventional references are Rashevskii (1938) and Chow (1939). Chow’s publisher currently gives December 1940 for the journal issue; the reference records that difference rather than silently choosing one date.[^chow] This theorem answers “can we get there?” before we ask “what is shortest?”

</details>
<details class="se2-history" markdown="1"><summary><span>1957 · 1990</span> Two influential car problems</summary>

Dubins studied shortest bounded-curvature paths with prescribed positions and tangents in 1957. Reeds and Shepp treated the reversible car in 1990.[^dubins][^reeds] They are neighboring models that make endpoint headings central, while imposing different controls and costs from the metric in this guide.

</details>
<details class="se2-history" markdown="1"><summary><span>1960s–1980s</span> A geometric language for control</summary>

The maximum principle supplies necessary conditions for optimal motion; geometric control expresses constraints as vector fields and studies the paths they generate. The term “sub-Riemannian” is attributed to Strichartz’s 1986 paper in Agrachev–Barilari–Boscain’s historical notes.[^foundations] This is a statement about the terminology, not a claim that constrained geometry began in 1986.

</details>
<details class="se2-history" markdown="1"><summary><span>1999–2006</span> Position and orientation enter neurogeometry</summary>

Petitot and Tondut’s 1999 work and Petitot’s 2003 account connect cortical organization with contact geometry; Citti and Sarti’s 2006 paper develops a cortical model of perceptual completion in roto-translation space.[^association][^petitot][^citti] This is an important application lineage, alongside motion planning, rather than an exclusive origin story for SE(2).

</details>
<details class="se2-history" markdown="1"><summary><span>2008–2011</span> From geodesic formulas to the global solution</summary>

Moiseev and Sachkov’s Maxwell-strata work appeared as a 2008 preprint and in the journal in 2010. It gives the geodesic parametrization, symmetries, and candidate meeting sets.[^maxwell] Sachkov’s 2010 conjugate-and-cut-time paper settles the cut time and studies conjugate points.[^conjugate] His optimal-synthesis paper appeared as a 2009 preprint, online in 2010, and in the 2011 journal volume.[^cut] That last step describes the global endpoint map and completes the classification of minimizers.

</details>
<details class="se2-history" markdown="1"><summary><span>2014 · 2018</span> Geometric solutions become imaging tools</summary>

Duits, Boscain, Rossi, and Sachkov analyze cuspless curves and association fields in 2014; Duits, Meesters, Mirebeau, and Portegies develop path-finding for reversible and forward-only variants, with image-analysis applications, in 2018.[^association][^imaging] Such work adapts the geometry to application-specific endpoints and costs.

</details>

<h2 id="the-pendulum">The shortest-path equations contain a pendulum</h2>

Finding a route means choosing two functions of time. The maximum principle converts that infinite choice into a finite-dimensional family of differential equations. Their extra variables describe the balance between driving and turning along a candidate path.

After a change of coordinates, two of those variables obey the equations of a pendulum. The pendulum is **a coordinate description of the optimality equations**, not a physical pendulum attached to the robot. Its oscillations, rotations, and limiting motions organize the families of geodesics.

In this guide, a *geodesic* means a trajectory of those normal equations, which can be continued after it stops minimizing globally. Solving the equations produces candidates; deciding how long they are shortest requires another step.

</div>

{% include se2-overview-figure.html mode="pendulum" kicker="Experiment 3 · the hidden dynamics" title="One pendulum, several families of paths" caption="Change the pendulum’s initial angular velocity, or select a family. The phase panel follows its pendulum portrait; the path panel follows the resulting pose. The initial pendulum angle is 1 radian. This bounded numerical integration illustrates the equations and does not certify shortestness." %}

<div class="l-body" markdown="1">

<details class="se2-detail" data-level="mechanism" markdown="1"><summary>Why elliptic functions enter the solution</summary>

The nonlinear pendulum conserves an energy. Below the separatrix energy it swings; above it, it rotates; at the separatrix it approaches an unstable equilibrium. Integrating these motions leads to elliptic integrals and Jacobi elliptic functions. They play the role that sines and cosines play for a linear oscillator, but retain the nonlinear dependence of the period on energy.

The names *oscillating* and *rotating* refer to this auxiliary pendulum. A rotating pendulum does not necessarily mean the robot’s heading winds once around the circle.

</details>

<details class="se2-detail" data-level="full" markdown="1"><summary>From the Hamiltonian to the pendulum</summary>

For canonical momenta $(p_x,p_y,p_\theta)$, the normal Hamiltonian is

$$H=\frac12\left((p_x\cos\theta+p_y\sin\theta)^2+p_\theta^2\right).$$

Use unit sub-Riemannian speed, $H=1/2$, and put $h_1=p_x\cos\theta+p_y\sin\theta=\sin(\gamma/2)$, $h_2=p_\theta=-\cos(\gamma/2)$, and $c=2(p_x\sin\theta-p_y\cos\theta)$. Hamilton’s equations give

$$\dot\gamma=c,\qquad\dot c=-\sin\gamma,$$

$$\dot x=\sin(\gamma/2)\cos\theta,\quad
\dot y=\sin(\gamma/2)\sin\theta,\quad
\dot\theta=-\cos(\gamma/2).$$

The conserved pendulum energy is $\mathcal E=c^2/2-\cos\gamma$. It is different from the fixed Hamiltonian energy $H=1/2$. The pendulum angle is naturally modulo $4\pi$ here: adding $2\pi$ reverses both controls. For this rank-two contact structure in dimension three, nonconstant minimizers are normal; there is no missing family of strictly abnormal minimizing paths.[^foundations]

</details>

<h2 id="when-shortest-paths-stop">Following the equations is not enough</h2>

Two paths can leave the origin and arrive at the **same position and heading** with the same length. If these are different minimizing paths, their common endpoint is a **Maxwell point**. In the standard solution, symmetry helps locate these meetings.

There is also a local event: neighboring candidate paths can focus so that changing the initial data no longer changes the endpoint to first order. That is a **conjugate point**, a loss of rank of the exponential map that sends initial data and travel time to a pose.

The **cut time** is the end of a geodesic’s globally minimizing segment. A geodesic is still shortest at its finite cut time in this model. Extending it any further loses global minimality. A regular Maxwell meeting gives competition before the first conjugate time; at certain boundary cases the cut and first conjugate times coincide. These are distinct mechanisms, even though their loci can meet.

</div>

{% include se2-overview-figure.html mode="maxwell" kicker="Experiment 4 · a published mechanism, numerically drawn" title="Two shortest paths arrive together" caption="These rotating geodesics are related by the published reflection symmetry. At their common cut time, they have the same SE(2) endpoint and the same length. Scrub time to see their distinct arrivals. The slider stays away from the phases where the pair collapses into one source." %}

<div class="l-body" markdown="1">

<details class="se2-detail" data-level="full" markdown="1"><summary>The equality used in this picture</summary>

For a rotating geodesic, let $0<k<1$, $m=k^2$, and $K(m)=\int_0^{\pi/2}(1-m\sin^2a)^{-1/2}\,da$. Let $E(p\mid m)=\int_0^{\operatorname{am}(p\mid m)}\sqrt{1-m\sin^2a}\,da$ denote Jacobi’s epsilon; this is not the complete elliptic integral. Here $\operatorname{am}$ is the continuous Jacobi amplitude. Write $\operatorname{sn},\operatorname{cn},\operatorname{dn}$ for the Jacobi functions at parameter $m$.

The first positive root $p_1^1$ of

$$f_1(p)=\operatorname{cn}(p\mid m)\bigl(E(p\mid m)-p\bigr)-\operatorname{dn}(p\mid m)\operatorname{sn}(p\mid m)=0$$

lies in $(K,2K)$, and the cut time is $t_{\rm cut}=2kp_1^1$. If the midpoint phase is $\tau=\psi+p_1^1$, the reflection uses the initial phase $\psi^{\prime}=-\psi-2p_1^1$ modulo $4K$. For the generic phases displayed, these are two different sources with the same endpoint at the cut time. They need not share an endpoint at an earlier time.[^maxwell][^cut]

</details>

The drawing is a projection from a three-dimensional state space. Two curves crossing in the plane usually do **not** form a Maxwell point: the headings and traveled lengths must also agree. Similarly, a sharp-looking planar cusp is not automatically a conjugate point. The lifted pose can remain smooth when the robot stops driving and reverses.

<h2 id="the-solution">What the complete solution actually gives</h2>

The solution is a global **optimal synthesis**: it identifies which geodesic segments reach each target with least cost. It combines explicit geodesic formulas with a stratification of the endpoint space, including the boundaries where paths compete.

For every target other than the starting pose, the standard directed-heading problem has **one minimizing trajectory off the Maxwell set and exactly two on it**. Some cut points are conjugate boundary points with a unique minimizer, so the entire cut locus should not be described as a set of two-path ties. These statements are Theorem 3.2 of Sachkov’s published synthesis.[^cut]

Three simple destinations help ground this result. A point straight ahead is reached by straight driving. A change of heading at the same position is reached by a pure rotation through the shorter angular difference. At a half-turn, the two rotation directions tie. Other destinations usually require the elliptic geodesic formulas and a numerical inversion of their endpoint map.

<details class="se2-detail" data-level="full" markdown="1"><summary>Two special cases can be proved without elliptic functions</summary>

For a target $(a,0,0)$, any admissible motion satisfies

$$\ell\ge\int_0^T|u_1|\,dt\ge\left\|\int_0^T u_1(\cos\theta,\sin\theta)\,dt\right\|=|a|.$$

Straight driving attains the lower bound. For a target $(0,0,\vartheta)$, take a continuous lift of the heading. Then

$$\ell\ge\int_0^T|u_2|\,dt\ge\min_{j\in\mathbb Z}|\vartheta+2\pi j|.$$

A pure rotation attains the bound. For $0<\lvert\vartheta\rvert<\pi$ it is unique as a geometric trajectory; at $\vartheta=\pi$ modulo $2\pi$ there are two. Reparametrizations are not counted as different minimizing trajectories.

</details>

<details class="se2-detail" data-level="full" markdown="1"><summary>The cut-time formula for all five pendulum strata</summary>

Use the pendulum energy $\mathcal E$ defined above. The published formulas are:

<div class="se2-ledger" markdown="1">

| Pendulum family | Modulus convention | Cut time at unit speed |
|---|---|---|
| Oscillation, $-1<\mathcal E<1$ | $k=\sqrt{(\mathcal E+1)/2}$ | $2K(k^2)$ |
| Rotation, $\mathcal E>1$ | $k=\sqrt{2/(\mathcal E+1)}$ | $2kp_1^1(k)$ |
| Nonconstant separatrix, $\mathcal E=1$, $c\ne0$ | Limiting $k=1$ | $+\infty$ |
| Stable equilibrium, $\mathcal E=-1$ | Pure rotation of the robot | $\pi$ |
| Unstable equilibrium, $\mathcal E=1$, $c=0$ | Straight driving of the robot | $+\infty$ |

</div>

“Stable” and “unstable” refer to the pendulum, not the robustness of a robot controller. The straight and separatrix trajectories minimize along every finite segment from their initial state. The critical strata must be treated separately; substituting $k=1$ into a finite-period formula is not a valid shortcut.[^cut]

</details>

### A route from any start to any finish

First express the target relative to the starting pose. Next use the published endpoint stratification to choose the admissible minimizing branch or branches. Solve for their initial covector and travel time, retaining the cut-time restriction. Finally reconstruct the path and check its endpoint and length.

This is a complete mathematical classification, not a single elementary formula for the coordinates of every arbitrary target. Sachkov’s paper includes explicit special cases and numerical evaluation for generic targets. A numerical shooting method without the synthesis can find a geodesic that is longer than necessary.

</div>

{% include se2-figure.html mode="geodesic" kicker="Experiment 5 · see the stopping rule" title="A geodesic can continue after it stops being shortest" caption="The explorer shows the rotating family. Purple marks its published cut point; orange marks numerically detected conjugate points. Scrub or play time to continue past the purple marker. Continuing the equations does not preserve shortestness; this is not an arbitrary-target optimal-path solver." %}

<div class="l-body" markdown="1">

<h2 id="what-comes-next">Beyond the solved shortest-path problem</h2>

The synthesis settles which paths minimize for this exact metric on SE(2). It does not make every question about the geodesic flow disappear. Continuing paths creates further conjugate points, caustic sheets, and additional inverse images of a target. Changing to a forward-only model, adding obstacles, identifying opposite headings, or using image-dependent costs asks a different problem.

Readers who want the newer work can continue to [Beyond the Shortest Path](/mathematics/2026/10/07/se2-geodesics-research-program/) and its three manuscript companions. Their research status, hypotheses, and unresolved questions are stated there. The classical synthesis is a published input to that program; the newer drafts are not needed to justify the solution presented in this overview.

### A small glossary to take with you

**Pose:** position and heading. **Horizontal path:** a motion satisfying the allowed-direction constraint. **Geodesic:** a solution of the normal optimality equations, possibly continued beyond its minimizing segment. **Exponential map:** the map from initial covector and time to endpoint. **Maxwell point:** an equal-cost meeting of distinct minimizing paths in the synthesis. **Conjugate point:** an endpoint where the differential of the exponential map loses rank. **Cut time:** the last time a geodesic segment from its start remains globally shortest. **Optimal synthesis:** the classification of minimizing trajectories for all targets.

<h2 id="references">Sources and further reading</h2>

Each reference below identifies its role in the explanation. Publication years refer to the cited journal volumes unless an online or preprint date is explicitly given. The historical route is selective; the foundational textbook and the original papers provide broader bibliographies.

The four new experiments implement the stated elementary formulas or a bounded integration of the published normal equations. The fifth reuses the reviewed rotating explorer. Numerical drawings explain these results; they do not replace the published arguments or certify a solver for arbitrary targets.

[^foundations]: A. Agrachev, D. Barilari, U. Boscain, *A Comprehensive Introduction to Sub-Riemannian Geometry*, Cambridge, 2020. [Author-hosted 2019 draft](https://www.math.unipd.it/~barilari/ABB-v2.pdf), especially §§3.2 and 3.7, the contact discussion, and §13.8 on SE(2). The draft’s page numbers differ from the published edition. It supports the definitions, reachability theorem, historical attribution of terminology, and the normality discussion.
[^caratheodory]: C. Carathéodory, *Untersuchungen über die Grundlagen der Thermodynamik*, Math. Ann. 67 (1909), 355–386. [Original paper](https://academicweb.nd.edu/~powers/ame.20231/caratheodory1909.pdf). Historical role described in the foundational textbook’s §3.7.
[^chow]: P. K. Rashevskii, *Any two points of a totally nonholonomic space may be connected by an admissible line*, 1938, as cited in the foundational textbook. W.-L. Chow, *Über Systeme von linearen partiellen Differentialgleichungen erster Ordnung*, Math. Ann. 117, 98–105. [Publisher record](https://doi.org/10.1007/BF01450011): received November 1938; issue dated December 1940. The standard textbook bibliography cites the latter as 1939. The original Rashevskii paper has not been inspected for this overview.
[^dubins]: L. E. Dubins, *On Curves of Minimal Length with a Constraint on Average Curvature, and with Prescribed Initial and Terminal Positions and Tangents*, American Journal of Mathematics 79 (1957), 497–516. [DOI](https://doi.org/10.2307/2372560). A neighboring bounded-curvature model.
[^reeds]: J. A. Reeds, L. A. Shepp, *Optimal Paths for a Car That Goes Both Forwards and Backwards*, Pacific Journal of Mathematics 145 (1990), 367–393. [Publisher PDF](https://msp.org/pjm/1990/145-2/pjm-v145-n2-p06-p.pdf). The reversible bounded-curvature model.
[^petitot]: J. Petitot, *The neurogeometry of pinwheels as a sub-Riemannian contact structure*, Journal of Physiology–Paris 97 (2003), 265–309. [DOI](https://doi.org/10.1016/j.jphysparis.2003.10.010). A neurogeometric model; full cortical physiology is outside this guide.
[^citti]: G. Citti, A. Sarti, *A Cortical Based Model of Perceptual Completion in the Roto-Translation Space*, Journal of Mathematical Imaging and Vision 24 (2006), 307–326. [DOI](https://doi.org/10.1007/s10851-005-3630-2). A cortical completion model with lifted geometry and diffusion-driven evolution.
[^maxwell]: I. Moiseev, Y. L. Sachkov, *Maxwell strata in sub-Riemannian problem on the group of motions of a plane*, ESAIM: COCV 16 (2010), 380–399. [Published paper](https://doi.org/10.1051/cocv/2009004); [2008 preprint](https://arxiv.org/abs/0807.4731). Parametrization, discrete symmetries, and Maxwell strata.
[^conjugate]: Y. L. Sachkov, *Conjugate and cut time in the sub-Riemannian problem on the group of motions of a plane*, ESAIM: COCV 16 (2010), 1018–1039. [DOI](https://doi.org/10.1051/cocv/2009031). The conjugate-time analysis and exact cut-time result.
[^cut]: Y. L. Sachkov, *Cut locus and optimal synthesis in the sub-Riemannian problem on the group of motions of a plane*, ESAIM: COCV 17 (2011), 293–321. [Published paper](https://numdam.org/articles/10.1051/cocv/2010005/); [2009 preprint](https://arxiv.org/abs/0903.0727). §2 gives the cut-time formulas, Theorem 3.2 gives minimizing multiplicities and controls, and §4 treats special endpoints. Published online in March 2010; the journal volume is 2011.
[^association]: R. Duits, U. Boscain, F. Rossi, Y. Sachkov, *Association Fields via Cuspless Sub-Riemannian Geodesics in SE(2)*, Journal of Mathematical Imaging and Vision 49 (2014), 384–417. [Open-access paper](https://doi.org/10.1007/s10851-013-0475-y). §§1–2 distinguish the curve problem, the SE(2) problem, and elastica; its references include Petitot–Tondut (1999). Online publication was in December 2013.
[^imaging]: R. Duits, S. P. L. Meesters, J.-M. Mirebeau, J. M. Portegies, *Optimal Paths for Variants of the 2D and 3D Reeds–Shepp Car with Applications in Image Analysis*, Journal of Mathematical Imaging and Vision 60 (2018), 816–848. [Author preprint](https://arxiv.org/abs/1612.06137). Reversible and forward-only variants, numerical methods, and imaging applications.

</div>
