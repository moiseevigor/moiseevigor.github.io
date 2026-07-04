# Model card — anisotropic-adhesion effective transport model ("transverse damping")

## What this model does

Input: a linear initial density field (equivalently its Zel'dovich
displacement field ψ) on a periodic grid. Output: approximate final
comoving particle positions at a = 1, at a small fraction of an N-body
run's cost (~18 cheap steps vs 90 force-solving steps; no Poisson solves
except cheap density deposits). Downstream consumers: fast mock-catalogue
generation, initial-condition reconstruction experiments, and any
application currently using the Zel'dovich approximation or the classical
adhesion model as its transport engine.

Recipe (frozen, E5d): evolve particles on straight Zel'dovich rays in
growth-factor steps ΔD = 0.05; at each step deposit the model's own
particles to a density grid; the first time a particle's local density
exceeds ρ_c = 5, remove **β = 60%** of its velocity components
perpendicular to the local filament axis e₃ (minor eigenvector of the
tidal tensor of the model's own density, smoothed at 2 h⁻¹Mpc, refreshed
every 3rd step); keep the along-filament component intact.

## Capabilities

| capability | evidence (median per-particle error vs 128³ PM N-body truth, held-out seeds) |
|---|---|
| Better global transport than Zel'dovich | 4.52 vs 4.98 vox (−9%), 3 held-out seeds × 50k particles |
| Better than classical isotropic adhesion proxy | isotropic sticking scores 5.34 (E5); this model 4.52 |
| Near the frame-information optimum | oracle-frame bound 4.47; model reaches 4.52 (89% of the recoverable gap closed) |
| Largest gains where structure forms | at the web (0–2 vox from spines): −14% vs ZA already at the E5c stage; oracle shows −20% available |
| Preserves along-filament flow | by construction (e₃ component undamped); isotropic sticking destroys it |

## Limitations

| limitation | magnitude |
|---|---|
| One-shot damping (first crossing only) — no multi-stream hierarchy | untested beyond first crossing; likely underdamps cluster cores |
| Transfer verified with frozen knobs (E6, E7): voxels 0.5–2 h⁻¹Mpc, σ₈ ∈ [0.6, 1.0], EdS and flat ΛCDM (Ωm = 0.31); advantage grows with clustering and is cosmology/resolution-invariant in physical units | high-res verified at n = 1 seed (indicative); multi-stream interiors remain out of scope |
| Sequential (pancake-ordered) damping variant underperforms here | −4% worse than both-perp at this resolution (E5c) — may differ at higher resolution |
| Gains are modest far from the web | −2% at 8–64 vox: the model is a web-region correction, not a global one |
| β, ρ_c calibrated on this box size / tracer density | re-calibrate for other setups; β optimum may sit slightly below 0.6 (flat minimum) |

## Per-segment table (distance to the filament web, voxels = h⁻¹Mpc)

| segment | n/seed | ZA err | this model (E5c stage / E5d winner overall) | oracle bound |
|---|---|---|---|---|
| 0–2 | ~21k | 6.95 | 5.96 | 5.53 |
| 2–4 | ~7k | 5.43 | 5.37 | 5.20 |
| 4–8 | ~7k | 3.74 | 3.67 | 3.68 |
| 8–64 | ~15k | 3.38 | 3.28 | 3.33 |
| **all** | 50k | **4.98** | **4.52** (E5d) | **4.47** |

(Per-bin numbers from the E5c winner β=0.75/smooth-4; the E5d winner
β=0.6/smooth-2 improves the overall figure; jackknife errors ±0.1–0.3.)

## Failure modes

- **F1 — over-damping feedback at β = 1.** Symptom: model underperforms
  even the ZA-proxy version. Where: everywhere, via density feedback
  (damped particles pile up → more spurious crossings). Magnitude: +0.1
  vox global. Fix: β ≤ 0.75 (frozen recipe uses 0.6).
- **F2 — noisy frames in the outskirts.** Symptom: small deficit vs ZA at
  2–4 vox with proxy frames. Magnitude: +4% in that ring (E5).
  Fix: self-density frames at 2 h⁻¹Mpc smoothing (in the recipe); oracle
  test (E5b) confirms the physics is not at fault.
- **F3 — untreated post-crossing dynamics.** Symptom: residual error at
  the web (5.5–6 vox) remains well above zero even at the oracle bound.
  Where: virialized interiors. Impact: don't use this model for
  intra-halo structure. Fix: out of scope; requires multi-stream
  treatment.

## Downstream integration guide

1. Generate ψ from your linear density (`fields.zeldovich_box` internals).
2. Call `evolve_full(q_grid, psi_full, beta=0.6, smooth=2.0)` as in
   `scripts/run_e5d.py` (ρ_c = 5, ΔD = 0.05, frames every 3rd step).
3. Re-calibrate (ρ_c, β) if your grid resolution or tracer density
   differs; calibrate against a small PM truth run as in E5 (optimize the
   *competitor* first to keep the comparison honest).
4. Do not interpret positions within ~2 vox of density peaks as resolved
   halo structure (F3).

## Files & artefacts

| path | contents |
|---|---|
| `scripts/run_e5.py` | model v1 (proxy frames) + calibration protocol |
| `scripts/run_e5b.py` | oracle-frame bound experiment |
| `scripts/run_e5c.py` | config grid incl. sequential variant, `evolve_full` |
| `scripts/run_e5d.py` | final β × smoothing grid; frozen winner |
| `artifacts/e5*_results.json` | all runs, per-seed numbers |
| `docs/E4-report.md` … `docs/E5d-report.md` | the evidence chain |

## Scope of the calibration/validation set

| item | value |
|---|---|
| truth engine | PM N-body, 128³ grid & particles, EdS, a: 0.1→1, 90 KDK steps |
| box | 128 h⁻¹Mpc (1 vox = 1 h⁻¹Mpc), BBKS spectrum, σ₈ = 0.8 |
| seeds | selection {2,3}; validation {4,5,6}; ρ_c calibration seed 1 |
| tracked particles | 50,000/seed (250k held-out measurements) |

## Reproduce

```bash
cd research/cosmic-web
.venv/bin/python scripts/run_e5.py    # v1 + rho_c calibration
.venv/bin/python scripts/run_e5b.py   # oracle bound
.venv/bin/python scripts/run_e5c.py   # config grid
.venv/bin/python scripts/run_e5d.py   # final grid -> frozen recipe
```
