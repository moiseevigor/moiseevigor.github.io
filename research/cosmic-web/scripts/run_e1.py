#!/usr/bin/env python3
"""E1: gravity-shaped fields (Zel'dovich boxes) — H1 transfer + first H2 test.

No exact truth exists here, so the reference skeleton is extracted from the
CLEAN full-particle density (2.1M particles, effectively noise-free) and
methods are scored on sparse galaxy subsamples against it. To avoid
favouring either method, references from BOTH methods are used (2x2):
beating the baseline even when judged against the baseline's own clean
reference is a conservative win.

H2 (first pass): multiply the orientation score by a tidal-alignment weight
w(x,n) = 1 + beta * (<n, e3(x)>^2 - 1/3),  e3 = eigenvector of the smallest
eigenvalue of the tidal tensor T = Hess(phi) computed FROM THE SPARSE FIELD
itself (usable on real data). beta = 0 is the unmodulated control.

M3: alignment of final spine tangents with the clean-field tidal e3
(isotropic null: E|cos| = 0.5).

Results -> artifacts/e1_results.json, report -> docs/E1-report.md.
"""

import json
import sys
import time
from multiprocessing import Pool
from pathlib import Path

import numpy as np
from scipy.ndimage import gaussian_filter
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import fields, lift, spines, metrics  # noqa: E402

N, L, D, TRUNC = 128, 128.0, 1.0, 2.0
N_TARGET = 2400          # matched spine budget (voxels), all skeletons
R0 = 3.0
SEEDS = list(range(1, 13))
LEVELS = [5000, 20000]
BETAS = [0.0, 1.0, 2.0]

_AXES = lift.hemisphere_axes(42)


def lifted_ridgeness_weighted(field, e3, beta):
    U = lift.orientation_score(field, _AXES, 6.0, 1.5)
    if beta:
        for a, n in enumerate(_AXES):
            dot2 = (e3 @ n) ** 2
            U[a] *= np.maximum(1 + beta * (dot2 - 1 / 3), 0.05).astype(np.float32)
    return spines.lifted_ridgeness(U)


def spine_tangents(pts, radius=3.0):
    """Local PCA tangent per skeleton point."""
    tree = cKDTree(pts)
    tans = np.zeros_like(pts)
    for i, p in enumerate(pts):
        nb = pts[tree.query_ball_point(p, radius)]
        if len(nb) < 3:
            continue
        c = nb - nb.mean(0)
        _, _, vt = np.linalg.svd(c, full_matrices=False)
        tans[i] = vt[0]
    return tans


def alignment(pts, tans, e3):
    ok = np.linalg.norm(tans, axis=1) > 0
    idx = np.clip(np.round(pts[ok]).astype(int), 0, N - 1)
    e = e3[idx[:, 0], idx[:, 1], idx[:, 2]]
    return float(np.mean(np.abs(np.sum(tans[ok] * e, axis=1))))


def run_seed(seed):
    rng = np.random.default_rng(seed)
    rho, pos = fields.zeldovich_box(N, L, D, rng, trunc=TRUNC)
    clean = gaussian_filter(np.log1p(rho), 1.0, mode="wrap")
    e3_clean = fields.tidal_frame(clean)

    refs = {
        "ref_hessian": spines.skeleton_points(spines.extract_matched(
            spines.hessian_ridgeness(clean, 1.5), N_TARGET, lo_frac=1.0)),
        "ref_lift": spines.skeleton_points(spines.extract_matched(
            lifted_ridgeness_weighted(clean, None, 0.0), N_TARGET,
            lo_frac=1.0)),
    }

    recs = []
    for n_gal in LEVELS:
        gal_field = fields.galaxy_field(pos, N, n_gal, rng, adaptive=True)
        e3_sparse = fields.tidal_frame(gal_field)
        ests = {"hessian": spines.hessian_ridgeness(gal_field, 1.5)}
        for beta in BETAS:
            ests[f"lift_b{beta:g}"] = lifted_ridgeness_weighted(
                gal_field, e3_sparse, beta)
        for mname, R in ests.items():
            skel = spines.extract_matched(R, N_TARGET, lo_frac=1.0)
            pts = spines.skeleton_points(skel)
            rec = {"seed": seed, "n_gal": n_gal, "method": mname}
            for rname, ref in refs.items():
                m1 = metrics.spine_metrics(ref, pts, R0)
                rec[f"C_{rname}"] = m1["completeness"]
                rec[f"P_{rname}"] = m1["purity"]
            rec["align_e3"] = alignment(pts, spine_tangents(pts), e3_clean)
            recs.append(rec)
    return recs


def main():
    t0 = time.time()
    with Pool(6) as pool:
        all_recs = [r for rs in pool.map(run_seed, SEEDS) for r in rs]
    print(f"{len(SEEDS)} seeds in {time.time()-t0:.0f}s")
    out = ROOT / "artifacts" / "e1_results.json"
    out.write_text(json.dumps(all_recs, indent=1))
    report(all_recs)


def report(recs):
    from scipy.stats import wilcoxon
    md = ["# E1 — gravity-shaped fields (Zel'dovich, D=1.0): H1 transfer "
          "and first H2 test\n",
          f"Setup: {len(SEEDS)} Zel'dovich boxes ({N}³, L={L:.0f} h⁻¹Mpc, "
          "BBKS spectrum, σ₈=0.8·D, truncated ZA R_t=2), full 2.1M-particle density as clean "
          "reference, sparse galaxy subsamples as input. All skeletons at "
          f"matched length {N_TARGET} vox. Completeness/purity vs the clean "
          "reference of EACH method (2×2, conservative). M3 alignment: mean "
          "|tangent·e3| of spine tangents vs clean-field tidal eigenframe "
          "(isotropic null 0.5). H2 weight: w = 1 + β(⟨n,e3_sparse⟩² − 1/3)."
          "\n"]
    md.append("| n_gal | method | C vs ref_hess | C vs ref_lift "
              "| P vs ref_hess | align e3 |")
    md.append("|---|---|---|---|---|---|")
    methods = ["hessian"] + [f"lift_b{b:g}" for b in BETAS]
    for n_gal in LEVELS:
        for m in methods:
            rs = [r for r in recs if r["n_gal"] == n_gal and r["method"] == m]
            md.append(
                f"| {n_gal} | {m} "
                f"| {np.mean([r['C_ref_hessian'] for r in rs]):.3f} ± "
                f"{np.std([r['C_ref_hessian'] for r in rs]):.3f} "
                f"| {np.mean([r['C_ref_lift'] for r in rs]):.3f} ± "
                f"{np.std([r['C_ref_lift'] for r in rs]):.3f} "
                f"| {np.mean([r['P_ref_hessian'] for r in rs]):.3f} "
                f"| {np.mean([r['align_e3'] for r in rs]):.3f} |")

    md.append("\n## Paired tests\n")
    for n_gal in LEVELS:
        by = {m: {r["seed"]: r for r in recs
                  if r["n_gal"] == n_gal and r["method"] == m}
              for m in methods}
        d_h1 = np.array([by["lift_b0"][s]["C_ref_hessian"]
                         - by["hessian"][s]["C_ref_hessian"] for s in SEEDS])
        md.append(f"- **H1 transfer, n_gal={n_gal}** (lift β=0 vs hessian, "
                  f"judged on the hessian's own clean reference): "
                  f"ΔC = {d_h1.mean():+.3f}, wins {int((d_h1>0).sum())}"
                  f"/{len(d_h1)}, Wilcoxon p = {wilcoxon(d_h1).pvalue:.2g}")
        for b in BETAS[1:]:
            d = np.array([by[f"lift_b{b:g}"][s]["C_ref_hessian"]
                          - by["lift_b0"][s]["C_ref_hessian"] for s in SEEDS])
            md.append(f"- **H2, n_gal={n_gal}, β={b:g}** (tidal weight vs "
                      f"β=0, same reference): ΔC = {d.mean():+.3f}, wins "
                      f"{int((d>0).sum())}/{len(d)}, "
                      f"Wilcoxon p = {wilcoxon(d).pvalue:.2g}")

    out = ROOT / "docs" / "E1-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")
    print("\n".join(md[-8:]))


if __name__ == "__main__":
    main()
