# Phase 3 — Grounding the sub-Riemannian null detector in real data

**Program charter.** Phases 1–2 established that a magnetic environment carries genuine
sub-Riemannian (SR) geometry, that the growth vector jumps `5 → 6` at a magnetic null (a
*detector*), and that on one real SDO/HMI coronal field the detector fires. That is **one**
data point and a detector that only reports *presence + order*. This phase asks the two
questions that decide whether the SR framing is a **tool** or merely a **language**:

1. **Grounding.** Does the detector reproduce the *standard* coronal-null catalogue across
   *many* fields — synthetic-with-ground-truth and real? (a **gallery**, not an anecdote.)
2. **Classification.** Can SR invariants **classify** a null (radial vs spiral, sign) — and
   is that classification **more robust to noise** than the standard eigenvalue scheme?
   This is the only way the framing *adds* something, because the standard classifier is the
   linearization and the SR tangent cone *is* the linearization.

---

## 1. Literature — the standard scheme we must match or beat

A 3D magnetic null is a point where **B = 0**. Its structure is read from the Jacobian
**M = ∇B** in the first-order Taylor expansion `B ≈ M·r`, with `tr M = ∇·B = 0`.

- **Classification by eigenvalues (Parnell, Smith, Neukirch & Priest 1996).** The eigenvalues
  `(λ₁, λ₂, λ₃)`, `Σλ = 0`, split into a **spine** (the odd-sign-out eigenvector) and a **fan**
  (the plane of the two like-sign eigenvectors). If all three eigenvalues are **real** the null
  is **radial** (an *X*-type in the fan 2D projection); if two are a **complex-conjugate pair**
  it is a **spiral** null (an *O*-type). The **sign** (positive / negative, historically *A* /
  *B*) is the sign of the spine eigenvalue: field lines run *in* along the spine and *out* along
  the fan, or vice-versa.
- **Radial → spiral is a current threshold.** Writing `M = S + J` (symmetric + antisymmetric),
  the antisymmetric part is the current `∇×B`. The component of current **parallel to the
  spine** rotates the fan; when it exceeds a threshold `J_thr` the two fan eigenvalues collide
  and go complex — the null turns from radial to spiral. This gives a *continuous, controllable*
  ground-truth knob.
- **Detection.** On a Cartesian grid the field standards are the **Poincaré-index** method and
  the **trilinear** method (Haynes & Parnell 2007), with **FOTE** (first-order Taylor expansion)
  a fast alternative; a 2020 A&A inter-comparison finds FOTE and trilinear the most reliable on
  gridded fields. These are applied to **potential / NLFFF extrapolations of SDO/HMI**
  magnetograms; real catalogues exist (e.g. nulls associated with X-class flares in cycle 24).

**Reading, and the caveats it hands us.** The entire standard classification is a function of
**M** — the *linearization*. The SR **tangent cone** (nilpotent approximation) at the null is
*also* built from **M**. So an SR classifier that reads the tangent cone cannot, in principle,
know more than the eigenvalues do at zero noise. The **only** room for a genuine contribution is
**conditioning**: the standard route estimates `M` by *finite-differencing a noisy field* (an
ill-conditioned derivative) and then tests a *discriminant* (real-vs-complex) that is fragile
exactly at the `J_thr` boundary; the SR route can instead read the type from *integrated*
geodesic quantities, and integration is far better conditioned than differentiation. Whether
that theoretical advantage survives in practice is an empirical question — the decisive one below.

Sources:
- Parnell et al. 1996, *Phys. Plasmas* 3, 759 — null classification (spine/fan, radial/spiral).
- Haynes & Parnell 2007 — trilinear null-finding.
- Olshevsky et al. 2020, *A&A* 644, A150 — comparison of null-finding methods.
- Edwards & Parnell et al. 2024 (arXiv:2410.16778) — real HMI null-point catalogue (cycle 24).

---

## 2. Candidate edge and failure modes

**Candidate edge.** An SR null **classifier** that (a) reproduces the Parnell radial/spiral/sign
labels on ground-truth fields, and (b) *degrades more gracefully than direct eigenvalue
classification as field noise rises*, because it reads the type from integrated geodesic flow
rather than a finite-difference Jacobian.

**Failure modes to guard against (pre-registered).**
- **Circularity.** If the SR classifier internally finite-differences `M`, it *is* the standard
  classifier in disguise — no contribution. The SR classifier must use only **integrated flow**
  quantities (geodesic caustics / return maps), never a numerical `∇B`.
- **Resolution limit (known).** On a raw gridded field the reach estimator under-resolves the
  null (Phase-2 caveat: returns `Q = 5`); detection reads the measured tangent cone. The gallery
  must state, per detection, whether `Q = 6` came from the resolved grid or the local Jacobian.
- **Threshold fragility is the point, not a bug.** Near `J_thr` *both* classifiers should
  struggle; the test is *which struggles less*, measured, not asserted.
- **Selection / survivorship.** Report *every* seeded null, including ones the detector misses;
  no quiet dropping of hard cases.

---

## 3. Glossary and metrics (single source of truth)

| Symbol / term | Definition |
|---|---|
| **Null** | point where `B = 0`. |
| **M = ∇B** | field Jacobian at the null; `tr M = 0` (`∇·B = 0`). |
| **(λ₁,λ₂,λ₃)** | eigenvalues of `M`, `Σλ = 0`. |
| **radial null** | all `λ` real (fan projection is an *X*). |
| **spiral null** | one real `λ`, two complex-conjugate (fan projection is an *O*). |
| **spine / fan** | eigenvector of the odd-sign-out `λ` / plane of the other two. |
| **sign (±, A/B)** | sign of the spine eigenvalue. |
| **J∥** | spine-parallel current, `= ½(spine)·(∇×B)`; drives radial→spiral at `J_thr`. |
| **Q (growth vector homog. dim.)** | SR homogeneous dimension of the tangent cone; `Q=5` in bulk field, `Q=6` at a null. |
| **δ (nilpotent deviation)** | fractional departure of the geodesic refocusing pattern from the flat (nilpotent) model; a purely *integrated* quantity. |
| **χ (SR chirality)** | signed asymmetry of the geodesic caustic under fan rotation — the SR read-out of `J∥`'s sign; `0` for a radial null. |

**Metrics.**
- **Detection recall** `= (# nulls with Q=6) / (# seeded nulls)`, per configuration.
- **Classification accuracy** `= (# type matches vs ground truth) / (# nulls)`; type ∈ {radial+, radial−, spiral+, spiral−}.
- **Confusion matrix** over the four types.
- **Noise-robustness curve**: accuracy vs relative field noise `σ = ‖noise‖ / ‖B‖_rms` (added as
  Gaussian per-component before either classifier runs), for the SR classifier and the
  finite-difference-eigenvalue baseline on the *same* noisy fields. Report the crossover `σ*` (if
  any) beyond which SR wins.
- All curves from ≥ `N` independent noise draws with mean ± std; state `N`.

---

## 4. Hypotheses (falsifiable, ordered)

- **H-R1 (recovery).** On noiseless synthetic nulls of every type, the SR classifier's labels
  match the Parnell eigenvalue labels: confusion matrix within one off-diagonal count of
  diagonal. *Prediction:* yes (tangent cone = linearization). *Judged by:* classification accuracy.
- **H-R2 (robustness — decisive).** As `σ` rises, SR classification accuracy stays above the
  finite-difference-eigenvalue baseline beyond some `σ* > 0`. *Prediction (pre-registered):*
  SR wins for `σ ≳ 0.1` near the radial/spiral boundary; *may be refuted* if integration's
  conditioning advantage is swamped by the null-localization error. *Judged by:* the two
  accuracy-vs-`σ` curves and `σ*`.
- **H-R3 (grounding).** On real SDO/HMI fields the detector reproduces a standard null catalogue
  — a gallery of ≥ several detections whose types agree with the eigenvalue scheme where the
  field is resolved. *Judged by:* per-null agreement table.

---

## 5. Ordered experiments

- **R1 — baseline + synthetic ground truth + first gallery.** `nulltopo.py` (Parnell
  classification, golden-tested); `nullfields.py` (`linear_null(eigs, current)` with *known*
  type; `charge_field` for realistic emergent nulls). Run the SR growth-vector detector on a
  battery covering all four types + the real HMI null; confirm `Q=6` for every type (detection
  recall); assemble the first **gallery** with baseline labels. *(H-R1 detection half.)*
- **R2 — SR classifier + noise head-to-head.** Define `χ`/δ-based SR type read-out from
  *integrated* geodesics only. Confusion matrix at `σ=0` (H-R1). Accuracy-vs-`σ` for SR vs
  finite-difference baseline on identical noisy fields; report `σ*` (H-R2, decisive).
- **R3 — real gallery.** Several real SDO/HMI magnetograms → extrapolate → detect + classify all
  nulls → a real detection gallery with a per-null agreement table (H-R3).

Each experiment ends with: confirmed / refuted / partial, magnitude, the honest read of what
could still be wrong, and the next hypothesis. Results land in `docs/R1..R3-*.md`, the gallery
figures under `public/img/posts/`, and a series write-up.

**Reproduce:** `../cosmic-web/.venv/bin/python scripts/run_r1_gallery.py` (numpy/scipy/matplotlib;
sunpy+astropy for R3).
