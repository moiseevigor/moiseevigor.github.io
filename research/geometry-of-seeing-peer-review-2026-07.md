# Referee Report: *Geometry of Seeing* and the Companion Research Article

**Review perspective:** sub-Riemannian geometry, mathematical physics, special relativity, and astrophysics  
**Corpus reviewed:** project page; four *Geometry of Seeing* posts; Appendices A1–A5; `scripts/sr_geodesics_v1.py`; and the repository’s sole article, *Growth Vectors and Caustics of Magnetic Flux Lifts*  
**Date:** 13 July 2026  
**Recommendation:** **Major revision before scholarly publication**

## Executive assessment

The *Geometry of Seeing* series is an unusually ambitious and potentially valuable pedagogical synthesis. Its strongest contribution is expository: it connects the contact geometry of orientation lifts, the Pontryagin maximum principle, the pendulum reduction, Jacobi elliptic functions, Maxwell strata, and the exact SE(2) optimal synthesis in a coherent visual narrative. The appendices are substantially stronger than ordinary blog supplements and could form the basis of a serious graduate-level survey.

The present corpus is not yet internally consistent enough to be treated as a reliable scholarly article. The central defect is no longer a wholesale conflation of sub-Riemannian (SR) geodesics with Euler elastica—the current body text often distinguishes them correctly—but a residual layer of captions, summaries, and examples that still identifies smooth elastica as projections of free SR geodesics or as SR-shortest Maxwell pairs. This is a major issue because the distinction is structural: free SE(2) SR geodesics are generically cuspidal in planar projection, whereas the displayed smooth curves solve the pinned-forward-speed elastica problem.

The neuroscience framing also exceeds the evidence. Petitot–Citti–Sarti neurogeometry supplies a mathematically and neurobiologically motivated model of cortical architecture and perceptual completion; it does not establish that the brain’s modal completion is *mathematically equivalent* to a single homogeneous shortest-path problem. The relevant literature also uses the projective orientation bundle \(\mathbb R^2\times P^1\) when orientation is unoriented, whereas the series moves between \(S^1\), SE(2), and modulo-\(\pi\) identification without a consistently stated quotient model.

The companion magnetic-flux article is scientifically separate from *Geometry of Seeing*, but it was reviewed because it is the only file in the repository’s article collection. It is a promising mathematical-physics programme with unusually good theorem/measurement/conjecture bookkeeping. Its growth-vector lemma is a clean and useful dictionary from magnetic-field jets to sub-Riemannian weights. However, Lemma 1.3 has an internal sign error in the Lorentz-force reduction, and the astrophysical claims remain demonstrations on prescribed or reconstructed fields rather than validated observational detectors of magnetic nulls. The article should be positioned as a mathematical and computational methods paper, not yet as an astrophysical inference result.

## Scope and terminology

In this corpus, **SR normally means sub-Riemannian**, not special relativity. No Lorentzian spacetime, causal cone, four-vector, or relativistic radiative-transfer calculation appears in the *Geometry of Seeing* programme. A special-relativity referee therefore finds no special-relativistic result to validate. The magnetic-flux article uses a nonrelativistic charged-particle reduction. If relativistic applicability is intended, the manuscript must formulate a constrained relativistic Hamiltonian and state the regime in which the current unit-speed Euclidean model is an approximation.

The article *Growth Vectors and Caustics of Magnetic Flux Lifts* belongs to the separate *Geometry of Forbidden Directions* programme. It should not be presented editorially as the research article corresponding to *Geometry of Seeing* without an explicit bridge explaining the common construction and the different physical claims.

## Evaluation criteria and scores

Scores use a five-point scale: 1 = inadequate, 2 = weak, 3 = sound but limited, 4 = strong, 5 = field-leading.

| Work | Contribution | Logic | Math | Clarity | Publication status |
|---|---:|---:|---:|---:|---|
| *Geometry of Seeing* project and blog series | 3.5 | 2.5 | 3.0 | 4.0 | Major revision |
| Appendices A1–A5 | 4.0 | 3.5 | 3.5 | 4.0 | Major revision, then publishable as survey notes |
| *Magnetic Flux Lifts* article | 3.5 | 3.5 | 3.0 | 4.0 | Major revision |
| Corpus as one research programme | 3.0 | 2.5 | 3.0 | 3.5 | Re-scope before submission |

### Interpretation of the criteria

**Scientific contribution** measures novelty, significance, relation to prior work, and whether the contribution is theorem, synthesis, computation, or empirical result. The Seeing series is chiefly a high-quality synthesis of established results, not a new solution of the SE(2) problem. The flux-lift article has more original programme-level content, but its principal caustic identification remains conjectural and its astrophysical tests are not independent detections.

**Logical correctness** measures whether conclusions follow from stated hypotheses, whether model claims are separated from biological or physical claims, and whether theorem/measurement/conjecture labels are stable across the text.

**Mathematical correctness** measures definitions, signs, parameter conventions, derivations, theorem statements, and whether figures instantiate the equations they claim to show.

**Clarity** measures notation, narrative structure, figure accuracy, audience calibration, and the ability to distinguish closely related models.

## Major findings: *Geometry of Seeing*

### 1. The SR-geodesic/elastica distinction remains inconsistent

The correct distinction is stated in Part 2: the free SR problem has both controls and generically cuspidal planar projections; pinning the forward speed produces smooth Euler elastica. That statement should be the invariant editorial rule for every page and figure.

Residual contradictions include:

- Part 2’s elastica-explorer caption calls the displayed smooth curve “the spatial projection of the SE(2) geodesic” (Part 2, lines 301–306).
- Part 2’s summary says every normal SR geodesic has Jacobi-elliptic curvature \(2k\,\mathrm{cn}\) (lines 493–498). This curvature belongs to the elastica sibling; the SR projection has a different curvature law and cusps.
- Part 1’s orientation-field caption says the SR Hamiltonian gives \(d\theta/ds\) “as one of the elastica functions” (lines 408–412).
- Part 1 describes two smooth figure-eight elastica as “closed SR-shortest paths” and a Maxwell pair on SE(2) (lines 427–441). This confuses an elastica symmetry event at \(4K\) with the free SR first Maxwell/cut event at \(2K\).
- Appendix A2 says the parking commutator converges to “the elastica geodesic” (lines 346–353). A bracket-commutator reachability construction does not generally converge to a minimizing elastica.

**Required correction:** label every displayed trajectory as exactly one of: free SR geodesic, planar SR projection, pinned elastica extremal, minimizing elastica (if proved for the boundary data), or a qualitative reachability path. Never use “geodesic” without specifying the metric/problem.

### 2. The neuroscience claims are too strong and the state space is not consistently specified

The project page says modal completion “is mathematically equivalent” to shortest paths on SE(2). This should be weakened to: a class of neurogeometric models represents oriented cortical states by a contact bundle and models completion using geodesics, elastica-type functionals, or hypoelliptic/diffusive evolutions. Citti–Sarti’s 2006 model includes a lifted surface and curvature-driven diffusion toward a minimal surface; it is not exhausted by the homogeneous point-to-point SR problem.

For unoriented edge orientation, \(\theta\sim\theta+\pi\), so the natural fibre is \(P^1\), not \(S^1\). SE(2) is a convenient oriented double cover. The text currently invokes SE(2) but later uses modulo-\(\pi\) equality to identify neurons. That quotient must be introduced before it is used, together with the consequences for endpoints, symmetries, and cut loci.

The biological wording should also distinguish:

- an idealized cortical state or orientation column from a single neuron;
- anatomical horizontal connectivity from an allowed control direction;
- a model prediction from a demonstrated neural computation;
- contour completion from surface completion and modal from amodal completion.

### 3. Part 4 invents an unresolved SE(2) “seam” after acknowledging a complete synthesis

Part 4 correctly says that Sachkov gives the full cut locus and optimal synthesis on SE(2), all families. It then says abnormal/degenerate seams and the separatrix boundary remain only numerically settled or lack a fully uniform proof (lines 190–224 and 249–258). This is unsupported and contradicts the stated complete solution.

For a rank-two contact distribution in dimension three, nontrivial abnormal minimizers are absent. The current Part 2 states this correctly, while Part 4 says abnormal extremals exist and are a remaining difficulty. Remove the claimed open SE(2) residue unless a precise, citable theorem-level question is supplied. The defensible open direction is broader: sufficient structural conditions under which a symmetry-generated first Maxwell time exhausts the cut locus in other SR problems. Even there, avoid presenting “Maxwell = cut” as a universal conjecture across all left-invariant structures without a precise class of hypotheses.

### 4. The \(2K\) and \(4K\) clocks need a permanent notation firewall

The series now mostly knows the distinction:

- \(4K(k^2)\): curvature period and a mirror re-meeting time for the displayed inflectional elastica;
- \(2K(k^2)\): first Maxwell/cut time for the inflectional family of the free SE(2) SR problem.

Because both arise from the same vertical pendulum, the prose repeatedly slides from analogy to identity. Add a boxed notation table at the start of Parts 2–4 and A5 with columns for problem, time parameter, plane curve, event, and formula. Every figure caption should refer back to it.

### 5. Several geometric descriptions of elastica require correction or qualification

- “The curve shape repeats” after one curvature period is not generally the same as the plane curve closing. Curvature and tangent repeat while position may acquire a translational drift.
- Non-inflectional elastica do not generally close after one finite curvature period; closure requires an additional displacement condition.
- At the separatrix, “infinite total curvature” conflicts with the stated total turning \(2\pi\). The period is infinite; the integrated curvature is finite for \(2\,\mathrm{sech}(s)\).
- “Spirals inward, winding around two limiting points” needs a precise parameter range and reference; it should not be presented as the generic \(k\to1^-\) behaviour without qualification.

### 6. The contribution claim should be reframed as scholarship, not discovery

The SE(2) cut time, cut locus, Maxwell strata, and optimal synthesis are established results. The series’ genuine contribution is a modern, interactive, cross-checked exposition by an author close to the source literature. That is substantial. A scholarly version should explicitly separate:

- established theorem, with exact citation and matching notation;
- derivation reproduced by the author;
- new pedagogical visualization or code;
- new conjecture or research direction;
- neuroscience interpretation.

## Major findings: *Growth Vectors and Caustics of Magnetic Flux Lifts*

### 7. Lemma 1.3 has an internal sign error

The article defines

\[
F_{ij}=\partial_iA_j-\partial_jA_i
\]

and \(u_i=p_i+wA_i\). Hamilton’s equations then give

\[
\dot u_i=w\,u_j(\partial_jA_i-\partial_iA_j)=-wF_{ij}u_j,
\]

not \(+wF_{ij}u_j\) as printed in lines 98–119. This can be repaired by changing the sign in the dynamical equation, defining \(F\) with the opposite index order, or replacing \(w\) by \(-w\), but the choice must propagate consistently through the two-dimensional \(J\) convention and all reduced-flow equations.

**Required correction:** state the matrix convention for \(J\), derive the planar heading equation from it, and rerun the symbolic/numerical checks under the selected sign convention.

### 8. The growth-vector result is sound but its novelty is limited and its singular-volume meaning is correctly unresolved

Lemma 2.3 is a clean bracket calculation. Under its stated finite-order hypothesis, the vertical direction first appears at step \(k+2\), giving weights \((1,\ldots,1,k+2)\) and \(Q=d+k+2\). The article commendably recognizes that this is close to an exercise in the Bellaïche/Jean framework and that ball-volume asymptotics at a non-equiregular point do not follow automatically.

The paper should avoid calling \(Q\) “the homogeneous dimension of the nilpotent approximation” at a singular point without specifying the privileged-coordinate/nilpotentization framework being used. “Pointwise weight sum” is safer until the tangent and measure statements are proved.

### 9. The caustic statistic is interesting, but its load-bearing identification remains conjectural

The article does a good job labeling \(t_c=T\) for the exponential profile as Conjecture A and recording a counterexample to its generalization. That honesty should be reflected in the title, abstract, and conclusions: the proved elliptic reduction concerns a period average; its interpretation as a conjugate-time/caustic law depends on Conjecture A for the exponential family.

Numerical agreement at \(10^{-8}\) is strong verification of an implementation, not a proof or a statistical confidence statement. Provide:

- the exact determinant whose vanishing is conjectured;
- numerical conditioning and convergence tests near the critical gradient;
- independent integration or automatic-differentiation validation of the Jacobi fields;
- a clear definition of first conjugate time when a trajectory ceases to complete a full angular period.

### 10. The astrophysical interpretation is not yet an observational validation

The flux lift is a legitimate geometric encoding of a prescribed magnetic 2-form, and the projected normal geodesics reproduce a nonrelativistic magnetic-force equation up to convention. But the programme currently assumes the field is already known well enough to construct \(A\), \(F\), its derivatives, and often its null location. Consequently, many “detections” are consistency checks on a reconstructed/model field rather than new inference from telescope data.

For an astrophysical methods claim, the article needs an observation operator and uncertainty model:

- what measured quantities determine the vector field or its admissible posterior ensemble;
- how line-of-sight ambiguity, inversion regularization, cadence, spatial resolution, and boundary assumptions propagate to \(Q\), \(t_c\), and the caustic;
- comparison against standard null finders and topological methods on blind benchmarks;
- sensitivity to non-solenoidal numerical error;
- a physically justified particle or transport population if caustics are claimed to be observable, rather than only geometrically computable.

The current “independent local confirmation” and “tangent-cone consistency check” labels are appropriate and should remain prominent.

### 11. Special-relativistic and plasma-physics scope must be stated

The magnetic model is nonrelativistic and kinematic. It contains neither electric fields nor the relativistic Lorentz force, radiation losses, pitch-angle scattering, finite gyroradius distributions, guiding-centre ordering, nor self-consistent MHD/kinetic back-reaction. For solar-coronal and magnetospheric applications, these omissions do not invalidate the mathematics, but they constrain the physical interpretation.

State a validity regime such as prescribed, static magnetic field; negligible electric field; test-particle dynamics; nonrelativistic speed; and local scales on which the field model is trustworthy. If the intended observable is field topology rather than particle motion, make clear that the charged-particle interpretation is a mathematical probe, not a literal plasma model.

## Minor and editorial findings

1. Replace “a neuron” with “an idealized orientation-selective cortical state/column” except where single-cell physiology is specifically cited.
2. Define the anisotropy parameter or metric weights. Declaring \(X_1,X_2\) orthonormal is a modeling choice, not forced by cortical anatomy.
3. Keep modulus \(k\) and parameter \(m=k^2\) visibly distinct across prose, code, and references.
4. State whether heading is oriented (SE(2)) or unoriented (projective quotient) in every boundary-value problem.
5. Replace uncited phrases such as “standard general conjecture” with a precise bibliographic statement or a narrower research question.
6. Distinguish extremal, locally minimizing geodesic, globally minimizing segment, and complete geodesic.
7. Add equation numbers to all formulas cited later; blog-style positional references are insufficient for peer review.
8. Move implementation details out of theorem statements and provide test tolerances, software version, and reproducible environment metadata.
9. The repository’s `scripts/sr_geodesics_v1.py` should state in its module docstring whether each routine integrates the free SR Hamiltonian or the pinned elastica system.
10. The magnetic article should cite primary charged-particle/prequantization sources more precisely and add contemporary magnetic-null detection benchmarks.

## Required revision plan

### Priority 1 — blockers

1. Correct the Lorentz-force sign convention in the magnetic article and verify every dependent equation and numerical result.
2. Perform a corpus-wide SR-versus-elastica terminology audit, including figure captions, code comments, summaries, and accessibility text.
3. Remove or precisely source the claim that degenerate/abnormal SE(2) seams remain unproved; reconcile Part 4 with the complete optimal synthesis.
4. Replace biological equivalence claims with model-language and define \(P^1\) versus \(S^1\)/SE(2).
5. Correct the false closure, total-curvature, and “SR-shortest figure-eight” statements.

### Priority 2 — scholarly positioning

6. Add a contribution ledger to the Seeing series: established theorem, reproduced derivation, new exposition/visualization, new code, open question.
7. Split the Seeing survey from the magnetic-flux research article editorially; add a bridge only if a common umbrella programme is intended.
8. Add a notation/convention table for vector fields, brackets, \(J\), \(F_{ij}\), \(k\), \(m\), time variables, and curve families.
9. State the astrophysical validity regime and build an uncertainty-aware blind-validation protocol.

### Priority 3 — quality and reproducibility

10. Add automated tests for bracket signs, Hamiltonian conservation, endpoint identities, \(2K/4K\) events, and finite-difference/variational conjugate times.
11. Add a manuscript-level bibliography with equation/theorem pointers to the primary literature.
12. Run a final line-by-line consistency review after all captions and callouts are regenerated.

## Publication recommendation by format

**As a blog series:** publish after the Priority 1 corrections. The visual and pedagogical value is high, and the material will be useful to mathematically mature readers.

**As a survey/tutorial article:** potentially publishable after major revision. The strongest route is one self-contained article centered on “one vertical pendulum, two distinct horizontal problems,” with the V1 model explicitly framed as a model and the exact SE(2) synthesis accurately attributed.

**As an original research article:** the Seeing material alone does not presently supply a new theorem or empirical neuroscience result. Its novelty is expository and computational. The flux-lift paper could become an original mathematical-physics methods article if the sign error is corrected, Conjecture A is either proved or isolated from proved results, and the novelty/literature comparison is completed.

**As an astrophysics paper:** not yet. A credible submission requires blind benchmarks, uncertainty propagation from observables to field reconstruction and geometric statistics, comparisons with standard null/topology methods, and a disciplined statement of plasma-physical scope.

## Strengths worth preserving

- The “one pendulum, two problems” insight is the right organizing principle.
- The appendices provide unusually helpful first-principles derivations.
- Interactive figures and executable checks make the exposition auditable.
- The theorem/measurement/conjecture ledger in the magnetic article is exemplary.
- The author openly records counterexamples and revises claims instead of hiding failed predictions.
- The connection from field jets to bracket growth is simple, memorable, and potentially useful.
- The corpus has the makings of an excellent advanced teaching resource once terminology is made invariant.

## Evidence base

The review compared the repository text with the following primary or near-primary sources:

1. J. Petitot, “The neurogeometry of pinwheels as a sub-Riemannian contact structure,” *Journal of Physiology–Paris* 97 (2003), 265–309, DOI: 10.1016/j.jphysparis.2003.10.010.
2. G. Citti and A. Sarti, “A cortical based model of perceptual completion in the roto-translation space,” *Journal of Mathematical Imaging and Vision* 24 (2006), 307–326, DOI: 10.1007/s10851-005-3630-2.
3. I. Moiseev and Yu. L. Sachkov, “Maxwell strata in sub-Riemannian problem on the group of motions of a plane,” *ESAIM: COCV* 16 (2010), 380–399, arXiv:0807.4731.
4. Yu. L. Sachkov, “Cut time and optimal synthesis in sub-Riemannian problem on the group of motions of a plane,” *ESAIM: COCV* 17 (2011), 293–321, arXiv:0903.0727.
5. U. Boscain, R. Duits, F. Rossi, and Yu. Sachkov, “Curve cuspless reconstruction via sub-Riemannian geometry,” arXiv:1203.3089.
6. E. J. Bekkers, R. Duits, A. Mashtakov, and G. R. Sanguinetti, “A PDE approach to data-driven sub-Riemannian geodesics in SE(2),” arXiv:1503.01433.

## Final verdict

**Major revision.** The project is intellectually serious and unusually transparent, and no wholesale abandonment is warranted. The corrections are conceptually concentrated: enforce the distinction between free SR geodesics and pinned elastica; separate model from biology; stop reopening a solved SE(2) synthesis without a precise theorem; repair the magnetic sign convention; and narrow astrophysical claims to what the current evidence actually demonstrates. After those changes, the Seeing series should be a strong advanced exposition, and the flux-lift article could become a credible mathematical-physics research submission.
