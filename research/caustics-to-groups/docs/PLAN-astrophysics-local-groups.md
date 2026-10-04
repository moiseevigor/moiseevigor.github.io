# Research plan — local group structure in cosmic caustic fields

**Question.** Globally the cosmic web is not a Lie group. Locally, might it be — and can
the caustics-to-groups technique detect that? Or does astrophysics have a better tool?

**Short answer, established below.** *Locally a group* is true but in two very different
senses, only one of which is detectable and useful. The sub-Riemannian sense is **vacuous
or instrument-determined** and the technique of this series cannot work there, for a
structural reason (not a tuning one). The sense that *is* real and detectable is the **local
isotropy (stabilizer) group of the deformation tensor**, and astrophysics already has the
right machinery for it — the caustic skeleton of Lagrangian catastrophe theory. This plan
(a) kills the wrong idea rigorously against real data, (b) validates our pipeline against an
independent published criterion, and (c) points the sub-Riemannian machinery at the one place
in astrophysics where a genuine nonholonomic constraint exists: magnetized plasma.

---

## 1. Literature: what is already settled

- **Caustic skeleton.** Feldbrugge, Hidding &amp; van de Weygaert (JCAP 2018,
  [arXiv:1703.09598](https://arxiv.org/abs/1703.09598)); Hertzsch et al. (JCAP 2026,
  [arXiv:2510.02419](https://arxiv.org/abs/2510.02419)). The cosmic web's walls, filaments
  and clusters are the $A_3, A_4, A_5, D_4, D_5$ caustics of **Lagrangian catastrophe
  theory**, obtained from *caustic conditions on the eigenvalue and eigenvector fields of the
  deformation tensor*. Bleeding edge: the caustic skeleton of the **local** cosmic web (Coma
  node, Pisces–Perseus ridge, arXiv:2604.22213) and of IllustrisTNG galaxy populations
  (arXiv:2604.18209).
- **Umbilics = eigenvalue degeneracy.** The literature is explicit: *there is a $D_4$
  singularity where two eigenvalues of the deformation tensor are equal*, with the two classes
  $D_4^{\pm}$ (elliptic / hyperbolic umbilic). Eigenvalue-degeneracy statistics of the
  primordial Gaussian field are being worked out (2D case,
  [arXiv:2301.07200](https://arxiv.org/abs/2301.07200)).
- **Web classification.** T-web / V-web (Hahn 2007; Forero-Romero 2009; Hoffman 2012) classify
  by *signs* of tidal eigenvalues; NEXUS+ (Cautun 2013), DisPerSE (Sousbie 2011), T-ReX
  (Bonnaire 2020) give multiscale / topological skeletons.
- **Sub-Riemannian geometry in cosmology.** Essentially absent from the mainstream. What
  exists is exotic non-Riemannian / Finsler / nonholonomic-manifold gravity (Vacaru and
  successors) — not a claim that CDM structure formation carries a bracket-generating
  distribution.
- **Genuine constraint in astrophysics.** Guiding-centre dynamics of a charged particle in a
  magnetic field *is* a constrained Hamiltonian system (two constraints in 6D phase space),
  and a charged particle in a uniform magnetic field is **exactly** the Heisenberg group
  (Appendix C1). Cross-field transport is strongly suppressed relative to field-aligned
  transport.

---

## 2. The structural verdict (the load-bearing result of this planning step)

### 2.1 Unlifted configuration space: no constraint, trivial group

Cold dark matter obeys $\ddot{\mathbf{x}} = -\nabla\Phi$. A particle at any point may move in
**any** direction; there is no restriction on allowed velocity directions, i.e. **no
distribution**. Consequently:

- the metric tangent cone at every point is the abelian group $\mathbb{R}^3$;
- the homogeneous dimension equals the topological dimension, $Q = n = 3$.

The hallmark of genuine sub-Riemannian structure is $Q > n$ (Heisenberg: $Q=4>3$). So "locally
a group" holds — it is the **translation group** — and it is **vacuous**: it carries no
information and is the same for every unconstrained flow in the universe.

### 2.2 Lifted space $\mathbb{R}^3\times S^2$: the constraint is *kinematic*, not dynamical

The sibling [cosmic-web series]({{ site.baseurl }}/mathematics/2026/07/03/geometry-of-cosmic-web-research-program/)
lifted the web to position + orientation, where a rank-3 "move forward along $\hat{\mathbf{v}}$,
reorient two ways" distribution *does* exist — the $\mathrm{SE}(3)$ structure of growth vector
$(3,6)$. **But that constraint is a tautology of the lift.** For any smooth curve,
$\hat{\mathbf{v}} := \dot{\mathbf{x}}/|\dot{\mathbf{x}}|$, so $\dot{\mathbf{x}} \parallel
\hat{\mathbf{v}}$ holds identically. Every smooth trajectory field — cosmic web, a river, a
plate of spaghetti — lifts to a horizontal curve of the *same* distribution.

Therefore:

> **The growth vector of the lifted structure is a property of the lift, not of the flow.**
> Metric M1 applied to $\mathbb{R}^3\times S^2$ returns $(3,6)$ regardless of the dynamics. It
> measures the instrument.

And the second fingerprint leg fares no better: the conjugate locus of the lifted structure
depends on the **metric chosen on the distribution** (how much turning is penalised), which is a
free modelling parameter that gravity does not fix. So the nilpotent-deviation $\delta$ would
measure *our modelling choice*, not the universe.

This is the ADE-universality trap in its purest form: the cosmic web's caustics and a
sub-Riemannian conjugate locus share Arnol'd's classification **and nothing else**, because they
have different generators — the cosmic web's are folds of the Lagrangian (Zel'dovich/adhesion)
map, not critical values of a sub-Riemannian exponential map.

**Internal corroboration.** The sibling programme already *empirically refuted* the dynamical
version of this: its H4 ("matter transport follows sub-Riemannian geodesics") died — filaments
grow by transverse infall, not along-spine geodesic drainage. So the SR-dynamics hypothesis for
gravity is not merely unsupported; it was tested and rejected in this repository.

**Consequence for the E4 abstention test.** The E4 "calibrated silence" experiment abstained
because a *hand-built* mixture had inconsistent growth vectors across base points. That was the
right verdict for the wrong reason. The principled abstention criterion is structural and
available *before any measurement*:

1. **Is there a distribution at all?** Test $Q$ vs $n$. If $Q = n$, the geometry is Riemannian
   and the group question is void.
2. **If a lift supplies the distribution, is the growth vector determined by the data or by the
   lift?** If swapping the dynamics leaves it unchanged, it is instrument-determined and carries
   no information.

> ### ⚠ Correction, forced by experiment E5 (see [`E5-no-sr-structure-in-gravity.md`](E5-no-sr-structure-in-gravity.md))
>
> **Criterion 1 above, as originally written, is wrong.** $Q > n$ *at a point* does **not**
> imply sub-Riemannian structure. A Lagrangian **fold** compresses one direction so the image
> of a small ball extends like $r^2$ there, giving $Q = 4$ — numerically identical to the
> Heisenberg group. Measured: a Zel'dovich fold yields exponents $(1.00, 1.01, 2.00)$, $Q=4$;
> Heisenberg yields $(0.97, 0.98, 2.00)$, $Q=4$. The ADE-universality trap resurfaces at the
> level of the *growth vector*, not just the caustic germ.
>
> **The corrected criterion is measure-theoretic:** genuine sub-Riemannian structure has
> $Q > n$ on a set of **full measure** (it is a property of the distribution, present
> everywhere); a Lagrangian catastrophe has $Q>n$ only on the caustic, a codimension-1 null
> set. Measured: Zel'dovich $0\%$ of base points, Heisenberg $100\%$.
>
> Criterion 2 (the lift tautology) stands, and was confirmed to machine precision.

This supersedes E4's criterion and repairs the weakness identified in the programme's honest
evaluation.

---

## 3. What *is* locally a group in the cosmic web

The user's intuition is right; the group is simply a different one. At each Lagrangian point the
deformation tensor $D_{ij} = \partial^2\Phi/\partial q_i\partial q_j$ is a symmetric $3\times3$
form. The **local symmetry (isotropy / stabilizer) group** of that form is fixed by its
eigenvalue-degeneracy pattern:

| Eigenvalues | Local isotropy group | Codim. | Web element | Caustic |
|---|---|---|---|---|
| $\lambda_1>\lambda_2>\lambda_3$ (triaxial) | discrete ($\mathbb{Z}_2\times\mathbb{Z}_2$) | 0 | generic wall/filament | $A_2, A_3, A_4, A_5$ |
| two equal (axisymmetric) | continuous $\mathrm{SO}(2)$ | 2 | ridge / umbilic locus | $\mathbf{D_4^{\pm}}$ |
| all three equal (isotropic) | full $\mathrm{SO}(3)$ | 5 | isolated special points | higher ($D_5$, …) |

The middle row is the key: **the $\mathrm{SO}(2)$-isotropy stratum is exactly the $D_4$ umbilic
caustic set**, because "two eigenvalues equal" is simultaneously the definition of enhanced local
symmetry and (per the caustic-skeleton literature) the $D_4$ condition. So:

> Local group detection in the cosmic web **is** eigenvalue-degeneracy detection **is** umbilic
> caustic classification. The information one would want from "which group is here?" is already
> carried by the caustic type — and it is obtained from the deformation tensor, never from a
> growth vector.

**Technical note.** Degeneracy should be located basis-free via the **discriminant** of the
characteristic polynomial, $\Delta = \prod_{i<j}(\lambda_i-\lambda_j)^2$, which vanishes iff two
eigenvalues coincide. This avoids the numerical fragility of eigenvalue-crossing detection and
needs no eigendecomposition.

---

## 4. The plan

Three phases, each gating the next. Every experiment names the result that kills it.

### Phase A — Kill the wrong idea (experiment E5) — **DONE, conclusion strengthened**

*Status: complete. H-A confirmed to machine precision; the plan's own $Q>n$ criterion was
refuted and replaced by the full-measure criterion. See
[`E5-no-sr-structure-in-gravity.md`](E5-no-sr-structure-in-gravity.md).*


**H-A (instrument invariance).** The growth vector recovered from the $\mathbb{R}^3\times S^2$
lift is determined by the lift, not the dynamics.

*Test.* Run the existing M1 estimator (`research/caustics-to-groups/src/growth.py`) on lifted
trajectories from four flows: (i) **real** CAMELS N-body particles
(`research/cosmic-web/data/camels`), (ii) a Zel'dovich flow (`src/fields.zeldovich_box`),
(iii) a PM N-body run (`src/pm.pm_sim`), (iv) a random smooth solenoidal flow. Also report $Q$
vs $n$ in unlifted configuration space.

*Prediction.* All four return growth vector $(3,6)$, statistically indistinguishable; unlifted
$Q = n = 3$.

**Kill criterion.** If any flow yields a robustly different growth vector, the lift *does* carry
dynamical information — a genuine surprise, and the plan pivots to chase it.

*Why this matters.* It is the **first real-data test in the entire programme**, and it converts
the E4 abstention from a demonstration into a theorem-plus-measurement.

### Phase B — Detect the local group that actually exists (E6, E7) — **E6 DONE**

*Status: E6 complete and passing — the programme's first external validation, against
Doroshkevich (1970). See [`E6-local-symmetry-doroshkevich.md`](E6-local-symmetry-doroshkevich.md).*

*Source correction (read from the paper, not summaries): the caustic conditions are stated in
**Lagrangian space**; $A_2$ fold → walls, $A_3$ cusp → filaments, $A_4$ → cluster nodes, and
$D_4$ umbilic is **corank 2** (two eigenvalue fields at the fold: degeneracy AND fold). Earlier
secondary summaries claiming "$A_3$ → walls, $A_4$ → filaments" were wrong.*

*Caveat 1 of §6 (Lagrangian vs Eulerian) is therefore resolved: Lagrangian.*


**H-B (external validation).** The eigenvalue-degeneracy locus of the deformation tensor
coincides with the independently-computed $D_4$ umbilic caustic set.

*Test (E6).* On a real N-body field: (a) locate degeneracies via the discriminant $\Delta$;
(b) independently locate $D_4$ points via the published caustic condition; (c) compare.

*Metric.* Bidirectional matched fraction within tolerance $r_0$, against a permutation null of
randomly rotated/translated $D_4$ sets. Report as a function of the tidal smoothing scale.

**Kill criterion.** If the two sets do not coincide, our implementation is wrong — because the
literature says they *must*. This is a genuine falsification test **against an independent
published criterion on real data**, precisely the external validation the programme lacked.

**H-C (a modest new contribution).** The isotropy stratification (triaxial / $\mathrm{SO}(2)$ /
$\mathrm{SO}(3)$ volume fractions and their scale dependence) is a cosmic-web descriptor carrying
information beyond T-web's eigenvalue-*sign* classification.

*Test (E7).* Compare separability of node/filament/wall populations, at matched smoothing and
matched parameter count, against T-web. Does the stratification find umbilic (cluster-progenitor)
points that sign-counting misses?

**Kill criterion.** No separation beyond T-web ⇒ report the null: the stratification is a
redundant relabelling. *(This is a likely and perfectly acceptable outcome.)*

### Phase C — Point the SR machinery where a real constraint exists (E8) — **DONE**

*Status: complete. H-D confirmed, with a sharper answer than planned. See
[`E8-magnetized-plasma.md`](E8-magnetized-plasma.md). Anisotropic transport ($D_\perp\ll
D_\parallel$) is **not** sub-Riemannian ($Q=n$ down to $D_\perp/D_\parallel=10^{-6}$), and
$D_\perp\to0$ gives an integrable rank-1 foliation. The genuine structure is on the
**(position, flux)** space: $[X_1,X_2]=B\,\partial_z$, contact wherever $B\neq0$, so $Q=4>n=3$
on full measure (30/30 base points). At a magnetic null the weight jumps $2\to3$ (Martinet),
$Q: 4\to5$ — the growth vector is a **magnetic-null / reconnection-site detector**.*


**H-D (magnetized plasma).** In the strong-field limit of guiding-centre motion, cross-field
transport is suppressed and the effective transport structure becomes genuinely rank-deficient,
so $Q > n$ and the growth vector encodes magnetic field-line topology.

*Test.* Build a synthetic $\mathbf{B}$-field of known topology; construct the anisotropic
transport structure (fast along $\mathbf{B}$, suppressed across, plus drifts); measure $Q$ and the
growth vector as the anisotropy $\to\infty$. Candidate real targets afterwards: cosmic-ray
transport along galactic/cluster field lines; ICM conduction suppression.

**Kill criterion.** $Q = n$ even in the singular limit ⇒ the SR framing has no astrophysical home
either, and the technique's honest scope is neuro-imaging and robotics only.

*Caveat.* Guiding-centre dynamics is a *constrained Hamiltonian* system, not literally
sub-Riemannian; the SR limit is singular and must be taken carefully. Heisenberg *is* the exact
uniform-field case, which is the anchor.

---

## 5. Is there a better way in astrophysics? Yes, and it exists.

For the cosmic web specifically the correct machinery is already built:

- **Caustic skeleton** — Lagrangian catastrophe theory on the eigenvalue *and eigenvector* fields
  of the deformation tensor. It classifies exactly the structures one wants ($A_3$ walls, $A_4$
  filaments, $A_5$/$D_4$ clusters) and, crucially, does so *in Lagrangian space where the
  structure is clean* — no pretence of a group.
- **T-web / V-web** for coarse sign-based classification; **NEXUS+**, **DisPerSE**, **T-ReX** for
  multiscale and topological skeletons.

This series' technique is the wrong tool for gravity, because it requires a constraint gravity
does not impose. Its correct astrophysical target, if any, is Phase C.

---

## 6. Risks and caveats, stated now

1. **Lagrangian vs Eulerian space.** The deformation tensor and the caustic conditions live in
   *Lagrangian* (initial-condition) space; after shell-crossing, Eulerian space is multi-streamed.
   Every measurement must state which space it is in. This is the most likely source of a wrong
   result in Phase B.
2. **Caustic-type ↔ web-element identification must be read from the source.** Secondary summaries
   conflict on whether $D_4$ maps to filaments or clusters. Verify directly against Feldbrugge et
   al. 2018 before asserting anything.
3. **Degeneracy is delicate.** Use the discriminant, not thresholded eigenvalue differences; the
   $\mathrm{SO}(2)$ stratum is codimension 2, so it is a *curve* in 3D and sensitive to resolution.
4. **Scale dependence.** The tidal tensor requires a smoothing scale; the whole stratification is
   scale-dependent and must be reported as a function of it, never at one arbitrary scale.
5. **H-C is likely null.** The isotropy stratification is probably equivalent to known caustic
   conditions rather than new physics. That is fine: the value of this plan lies in Phase A
   (killing a wrong idea rigorously) and Phase B's E6 (first external validation), not in H-C.

---

## 7. What success looks like

- **Minimum:** a rigorous, real-data-backed statement of why the sub-Riemannian technique cannot
  apply to gravitational structure formation, replacing the hand-built E4 abstention with a
  structural criterion ($Q$ vs $n$; instrument-invariance). Plus the programme's first external
  validation (E6).
- **Strong:** the isotropy stratification proves a useful, scale-explicit descriptor (H-C
  survives), and/or Phase C finds $Q>n$ in the magnetized strong-field limit, giving the technique
  a genuine astrophysical home.
- **Null:** H-C dies and Phase C shows $Q=n$. Then the honest conclusion is that this technique
  belongs to neuro-imaging and robotics, and astrophysics should use the caustic skeleton. That
  conclusion would itself be worth writing down.
