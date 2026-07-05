# Geometry of the Cosmic Web — experiments

Code for the research program scoped in the blog post
[`_posts/2026-07-03-geometry-of-cosmic-web-research-program.md`](../../_posts/2026-07-03-geometry-of-cosmic-web-research-program.md):
does lifting the cosmic web to the position–orientation manifold
R³×S² ≅ SE(3)/SO(2) improve filament extraction (claim C1), and do the
dynamics follow sub-Riemannian geodesics there (claim C2)?

## Layout

- `src/` — pipeline modules:
  - `fields.py` — synthetic webs: Voronoi filament model (exact truth,
    optionally Bézier-curved) and Zel'dovich boxes; CIC deposit; galaxy sampling.
  - `lift.py` — orientation score on R³×S² (elongated anisotropic ridge
    filters, Fourier-domain) and hypoelliptic diffusion (splitting scheme).
  - `spines.py` — ridgeness fields (lifted + Hessian baseline), matched-length
    skeleton extraction, junction detection. Both methods share identical
    post-processing so the comparison isolates the lift.
  - `metrics.py` — M1 spine distance/completeness/purity, M2 junction P/R/F1
    (defined in the scoping post, §5).
- `scripts/run_e0.py` — experiment E0a: calibrate on seed 1, evaluate on
  held-out seeds, straight (`default`) or curved (`--curved`) filaments.
  `--smoke` for a fast 64³ sanity run.
- `scripts/smoke_test.py` — assert-based self-checks.
- `docs/` — experiment reports with figures in `docs/figures/`.
- `artifacts/` — result JSONs (gitignored, regenerable).

## Reproduce

```bash
cd research/cosmic-web
python3.13 -m venv .venv && .venv/bin/pip install numpy scipy matplotlib scikit-image
.venv/bin/python scripts/smoke_test.py
.venv/bin/python scripts/run_e0.py            # straight filaments, ~4 min
.venv/bin/python scripts/run_e0.py --curved   # curved filaments, ~4 min
```
