# Program — Preferred Directions: sub-Riemannian geometry of physical connections

**Status:** active; this charter is the *original* program document, kept as the record.
Laws confirmed at time of writing: E9 (2D), P1 (moduli read grad B), P2 (3D, Q=k+5 & null
jump). Since written, the real-data phases ran: solar HMI (P2-solar, R1–R3), the fold
program (S1–S5c, with the generic rank-2 correction: $Q=6$, not 7), the magnetosphere
audit (S4: all T96 census nulls sit outside the model's own magnetopause — the
"79 spiral" claim is retracted), Jupiter (J1), the closed form (T2, period average
proven), and the profile law (T4/V1). Current state: `README.md` and the companion
article's status ledger.
**Relationship:** an independent program that *depends on* the caustics-to-groups toolkit.
Neither supersedes the other (see §9).

---

## 1. The thesis

> The class of environments studied here carries genuine sub-Riemannian geometry
> **because a connection's curvature is a physical field** (one-way: sub-Riemannian
> structures also arise without any field; the selection rule below is the filter). On the total space
> (configuration × holonomy), the sub-Riemannian invariants read off that curvature:
> the growth vector gives its **vanishing order**, the ball–box exponents give the
> **cost of accumulating holonomy**, and the conjugate locus / moduli give a
> **profile-calibrated combination of its gradient and profile curvature** —
> $(1-\tfrac34\beta)\,|\nabla\ln B|^2$ at leading order, blind at $\beta = 4/3$.
> (The thesis originally said "its gradient"; that hypothesis was sharpened by
> V1/O6/F2 — article §4 — into the calibrated combination stated here.)

This is earned, not assumed. It is the generalisation of E8, and its central law is
already confirmed (§4).

## 2. The selection rule (and what fails it)

"Some directions are preferred" is *not* sufficient. The rule:

> A direction must be **forbidden**, not merely slow, and reachable **only through a
> bracket** of allowed moves. Equivalently: a connection with nonzero curvature.

This is a sharp filter, and most "preferred direction" phenomena fail it:

| Environment | Structure | Verdict |
|---|---|---|
| Cosmic-ray / heat transport across **B** | $D_\perp \ll D_\parallel$: *coefficient* anisotropy | ✗ anisotropic Riemannian, $Q=n$ (measured to $D_\perp/D_\parallel=10^{-6}$) |
| $D_\perp \to 0$ exactly | rank-1 distribution | ✗ integrable (Frobenius) — field lines, no Chow |
| Anisotropic media, birefringence | Finsler / anisotropic metric | ✗ $Q=n$ |
| Stratified fluid, internal-wave cones | a **cone**, not a linear subspace | ✗ sub-Finsler / causal, different theory |
| Gravitational structure formation | a *flow*, no control system at all | ✗ no distribution (E5) |
| **Magnetic field** | U(1) connection $A$, curvature $B$ | ✓ contact where $B\neq0$ |
| **Rotating frame** (Coriolis) | effective connection, curvature $2\omega$ | ✓ uniform rotation ⇒ *exactly* Heisenberg |
| **Berry connection** | curvature = Berry curvature | ✓ but degeneracies are *singularities* (monopoles), not zeros — a distinct regime |
| **Gravitomagnetism** (Kerr $g_{t\varphi}$) | frame-dragging connection | ✓ in principle; speculative, hard |

The rule also explains the failures we already paid for: the $\mathbb{R}^3\times S^2$
orientation lift has *universal, physics-free* curvature (it is the canonical contact
structure of the unit tangent bundle), so its growth vector measures the instrument.
The flux lift has curvature $B$, a physical field. **That is the whole difference
between an informative and a tautological lift.**

## 3. What is already established

- **E5** — gravity has no SR structure. The orientation lift is a tautology (residual
  $5\!\times\!10^{-16}$). A Zel'dovich fold counterfeits Heisenberg's $Q=4$ pointwise,
  so the criterion must be **measure-theoretic**: $Q>n$ on a set of *full measure*.
- **E6** — the cosmic web's local group is the isotropy group of the deformation tensor.
  Validated externally against Doroshkevich (1970): covariance, eigenvalue law
  (KS $D\approx0.002$), Vandermonde repulsion ($\alpha=0.973$ vs 1.0).
- **E8** — the magnetic contact structure. $[X_1,X_2]=B\,\partial_z$; $Q=4>n=3$ on full
  measure; uniform $B$ in symmetric gauge is *literally* the Heisenberg frame; at a null,
  Martinet, $Q=5$.
- **E9** — the unifying law (below).

## 4. The law (Phase 0 core — CONFIRMED)

With base dimension $d$ and curvature vanishing to order $k$ (i.e. $F\sim r^k$), the flux
swept by a loop of size $L$ is $\Phi \sim L^k\cdot L^2 = L^{k+2}$, so the holonomy
coordinate has weight $k+2$ and

$$Q \;=\; d + k + 2 .$$

Measured ($d=2$), `scripts/run_e9.py`:

```
 k    B      weights            w_flux   Q   pred   holonomy cost
 0   x^0   (1.00,1.01,1.98)      1.98    4    4     L ~ Phi^(1/2)
 1   x^1   (1.00,1.00,3.00)      3.00    5    5     L ~ Phi^(1/3)
 2   x^2   (1.00,1.00,3.99)      3.99    6    6     L ~ Phi^(1/4)
 3   x^3   (1.00,1.01,5.00)      5.00    7    7     L ~ Phi^(1/5)

 fit  w_flux = 1.005*k + 1.985     (theory 1*k + 2)
```

**Physical reading.** Near a curvature zero of order $k$, acquiring holonomy $\Phi$ costs
path length $L \sim \Phi^{1/(k+2)}$. Geometric phase is *expensive near degeneracies*, with
an exponent set by the vanishing order.

**Untested prediction:** $d=3$ gives $Q = k+5$ (the rank-3 distribution
$\ker(d\varphi - A\!\cdot\!dx)$ in 4D has growth $(3,4)$ when $B\neq0$). Phase 2.

## 5. The existential question — Phase 0's kill criterion

**If you already know $B(x)$, finding its zeros and their order is elementary.** The
scaling law of §4, once $k$ is known, is a two-line dimensional argument. So the honest
question, asked *before* building anything:

> Does the sub-Riemannian framing predict anything that is **not** a repackaging of local
> derivatives of the curvature?

Three candidate sources of value, ranked by how much I believe them:

1. **Non-elementary consequences (strongest).** Hypoelliptic heat-kernel asymptotics,
   spectral gaps (Landau levels for $k=0$; the known pathologies of Martinet operators for
   $k=1$), the **conjugate locus**, and the **moduli** $(\chi,\kappa)$. None of these is a
   dimensional argument; each requires solving the geodesic flow.
2. **Stability classification (real).** Contact / Martinet / higher are structurally stable
   normal forms of the *distribution* under perturbation — an Arnol'd-style classification
   of the constraint, not a pointwise property of the field.
3. **Observational access asymmetry (speculative).** Settings where the accessible datum is
   the **holonomy** (interferometric Berry phase, circulation, Aharonov–Bohm), not the
   curvature. Then SR invariants are what you can actually estimate. *Needs a concrete
   observable; do not assume one exists.*

**KILL CRITERION (whole program).** If, after Phase 1, every SR invariant reduces to a
cheaply-computed local derivative of the curvature — and no non-elementary consequence
survives — then this is a rebranding and the program should be stopped. Say so and stop.

## 6. Phases

### Phase 0 — the law and the justification *(law DONE; justification open)*
- **E9 ✓** $Q = d+k+2$ confirmed for $d=2$, $k=0..3$.
- **T0 (open, theory).** Write down precisely which SR results about this structure are
  *not* two-line arguments. Deliverable: a list, with the cheapest test for each.

### Phase 1 — **do the moduli measure $\nabla B$?** — DONE, CONFIRMED

*Result: $\delta=-\varepsilon^2-2.52\varepsilon^4+O(\varepsilon^6)$ with $\varepsilon=|\nabla\ln B|\,r_L$; leading coefficient measured 0.99960, parity exponent 2.014, only even powers. Inverts as a leading-order estimator on this exponential profile: $|\nabla\ln B|\approx\sqrt{|\delta|}/r_L$ (general 1D profiles carry the $|1-\tfrac34\beta|^{-1/2}$ calibration). A field gradient delays refocusing on this profile (flips past $\beta = 4/3$). The 'collapse' turned out to be a dilation **theorem**, not evidence — logged. Quartic coefficient later pinned by the precision follow-up at $c_4 = 9/4$ (the 2.52 here was a wide-window truncation artefact; $5/2$ refuted). See [`P1-moduli-read-grad-B.md`](P1-moduli-read-grad-B.md).*
The single most decision-relevant experiment in this program: it is the first setting in
which the nilpotent-deviation statistic has a *physical ground truth* to be checked against.

- **H1.** The conjugate locus and the nilpotent-deviation $\delta$ of the magnetic contact
  structure encode the Agrachev–Barilari moduli $(\chi,\kappa)$, which are functions of
  $B$ and $\nabla B$.
- **Test.** Build a family of fields with known $\nabla B$; compute the conjugate locus with
  the existing detector (`src/caustics.py`); regress $(\hat\chi,\hat\kappa)$ against truth.
- **Metric.** $R^2$ of the regression; bias and spread of $(\hat\chi,\hat\kappa)$.
- **KILL.** If $\delta$ does not correlate with $\nabla B$, the moduli leg is useless *here
  too*: this is the first domain in which the moduli have a checkable ground truth, so a
  null here means this program's moduli leg is dead and Phase 2 must proceed on the growth
  vector alone. (It bounds where the statistic applies; it does not settle its status as a
  mathematical invariant.)
- *If it survives:* the caustics→moduli inverse map has, for the first time, a well-posed
  physical target with checkable truth.

### Phase 2 — 3D, and real magnetic fields
- **H2.** ✓ $Q = k+5$ in $d=3$ CONFIRMED (P2): uniform Q=5; a linear null jumps Q: 5→6.
  The growth vector locates nulls and reads their vanishing order. Their eigenvalue
  *type* is NOT in the growth vector (all linear nulls are k=1) — open whether the moduli carry it.
- **Test.** Synthetic 3D fields, then a **solar-corona NLFFF extrapolation or MHD snapshot**.
- **External validation.** Compare detected nulls and their classification against standard
  null-finding algorithms (eigenvalues of $\nabla\mathbf B$: radial/spiral/improper types).
  **This is the program's external check — do not skip it.**
- **KILL.** If the SR classification neither agrees with nor refines the standard one, the
  method adds nothing to reconnection diagnostics.

### Phase 3 — universality across physical origins: rotation
- **H3.** The Coriolis connection (curvature $2\omega$) obeys the same law. Uniform rotation
  ⇒ exactly Heisenberg; differential rotation $\omega(r)$ ⇒ non-flat contact; corotation /
  vanishing-effective-vorticity surfaces ⇒ Martinet strata.
- **Why it matters.** If the same framework covers a connection of *entirely different
  physical origin*, the thesis is universal. If not, the program shrinks to magnetism.
- Targets: accretion disks, rotating stars, planetary atmospheres.

### Phase 4 — the opposite degeneracy: Berry curvature singularities
- **H4.** At a conical intersection the Berry curvature **diverges** (monopole) rather than
  vanishing. The SR structure there is a distinct regime, not covered by $Q=d+k+2$.
- Best external validation available (monopole charge is quantised; Berry phases are
  measured interferometrically).
- Exploratory; do not start before Phases 1–2 report.

## 7. Metrics (defined)

- **M1 — growth vector / $Q$.** $Q=\sum_i i(n_i-n_{i-1})$, measured by reach exponents:
  log–log slope of coordinate reach vs path length, with the noise-floor fit
  $m(r)=\sqrt{(a r^w)^2+b^2}$. **Requires graded-adapted coordinates** (gauge-fix at the
  base point — see §8).
- **M2 — curvature vanishing order.** $k = Q - d - 2$. Cross-check against $k$ read directly
  from $B$; disagreement is a bug, not a discovery.
- **M3 — holonomy cost exponent.** $L(\Phi)\sim\Phi^{1/(k+2)}$; fit the exponent.
- **M4 — moduli.** $(\hat\chi,\hat\kappa)$ from the conjugate locus; nilpotent deviation
  $\delta$. Regressed against $\nabla B$ (Phase 1).
- **M5 — hypoelliptic diffusion exponent** of the holonomy coordinate; must track $Q$.
- **M6 — null detection.** Precision/recall against standard null-finders, with a
  permutation null. (Phase 2, external.)

## 8. Non-negotiables (earned in the caustics-to-groups program)

1. **Measure-theoretic, never pointwise.** $Q>n$ *at a point* is worthless — a Lagrangian
   fold counterfeits it. Only "$Q>n$ on a set of full measure" is meaningful.
2. **Coefficient anisotropy ≠ exponent anisotropy.** Check at every step.
3. **Gauge / adapted coordinates.** The holonomy coordinate is gauge-dependent for open
   paths. Always transform to $\mathbf A(q_0)=0$ at the base point before measuring weights.
   (This bug produced $Q=3$ where $Q=4$ was certain.)
4. **Consistency guard for every structure.** Frame ↔ structure constants; connection ↔
   curvature. An inconsistent pair is not a geometry.
5. **No self-graded results.** Every estimator must be validated against an *external*
   analytic or published prediction before it is believed. A confusion matrix scored against
   one's own generator is a unit test, not a finding.
6. **Ask "is there a control system, or just a flow?" before measuring anything.**

## 9. Relationship to the caustics-to-groups program

This is a **new, independent program — not a replacement, and not a demotion.** The two
stand in a **dependency relationship**, which elevates the earlier work rather than
diminishing it:

> The caustics-to-groups program built and validated a sub-Riemannian toolkit, established
> the ADE group-blindness obstruction, and produced the honest-scope discipline of §8.
> This program **consumes that toolkit** and points it at physical connections. Neither
> supersedes the other; both continue.

**What this program inherits** (imported, never copied, from
`research/caustics-to-groups/src/`):

| Inherited | Used for |
|---|---|
| `liegroup.py` — Lie–Poisson engine, group specs, frame↔C guard | Nilpotent reference models |
| `growth.py` — M1 reach estimator, noise-floor fit | The law $Q=d+k+2$ (E9) rests on it |
| `caustics.py` — conjugate-time detection | The core of Phase 1 |
| `heisenberg.py` + its golden test | The golden anchor — and *literally* the uniform-$B$ structure |
| `magnetic.py`, `lagrangian.py`, `grf.py` | Direct foundations (E8, E9) |
| The nilpotent-deviation $\delta$ / moduli machinery | **Phase 1's subject** — it finally gets a physical ground truth |

**What each program owns.** caustics-to-groups keeps its full standing and its own open
threads: real DW-MRI inference on $\mathrm{SE}(3)$, curved-$\mathrm{SE}(3)$ exact geodesics,
the four-part blog series and its six appendices, and the aliasing/identifiability results
about the toolkit itself. Its internal record includes E5's correction of E4's *argument*
for calibrated silence — an ordinary in-program correction of the kind a healthy program
makes about itself, not a downgrade.

**What this program owns.** The thesis (§1), the selection rule (§2), the law (§4), and
Phases 0–4. Its results are reported here and do not restate the earlier program's.

**A design commitment, carried forward rather than assigned backwards.** This program is
built so that its central claims are checkable against something *external* — an analytic
law (E9), a published prediction (Doroshkevich), or a standard field-physics algorithm
(null finders, Phase 2). That is a commitment for the new work. It is not a verdict on the
old.

## 10. Risks, stated now

1. **The rebranding risk (dominant).** Everything may reduce to "compute $B$, differentiate
   it." §5's kill criterion exists for exactly this. Phase 1 decides it.
2. **The lift is still tautological.** Any planar curve lifts horizontally. What rescues it
   is that the *contact condition* is set by a physical field — but the growth vector then
   carries only **one bit** (curvature zero or not) plus its order. The moduli must carry the
   rest, or there is little here.
3. **Holonomy is not transport.** This is the geometry of flux/phase accumulation, not of
   particle transport, which stays Riemannian. Conflating them would repeat the error the
   last three experiments were spent avoiding.
4. **2D is a toy.** Real nulls are 3D and the structure differs. Phase 2 is not optional.
5. **No real data yet** *(status at time of writing; superseded — the solar,
   magnetospheric and Jovian phases have since run, with their own honesty boxes)*.
   Every Phase-1 result was synthetic-with-analytic-truth. The MHD / solar-corona step
   (Phase 2) was the first genuine external test.

## 11. What success looks like

- **Minimum:** Phase 1 reports honestly. Either $\delta$ measures $\nabla B$ (and the
  caustics→moduli inverse map has a real, checkable physical target for the first time), or it
  does not (and we learn, with evidence, that the moduli do not read a physical curvature
  gradient). Both are worth writing down.
- **Strong:** Phase 2 detects and classifies 3D magnetic nulls in a real MHD or coronal field,
  agreeing with or refining standard null-finders; Phase 3 shows the same law governs rotation.
  Then "sub-Riemannian invariants as curvature-degeneracy diagnostics" is a real method.
- **Null:** §5's kill fires. Then the honest conclusion is that sub-Riemannian geometry is a
  beautiful *language* for these systems and not a *tool*, and the correct output is a short
  paper saying so, with the law of §4 as its one positive result.
