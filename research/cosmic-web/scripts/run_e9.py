#!/usr/bin/env python3
"""E9 (referee point 1): the literature baselines — 2LPT and MUSCLE.

The decisive comparison the program lacked: the frozen transverse-damping
model against the field's actual improved-transport methods, on identical
initial conditions, both per-particle and field-level.

Models: ZA | 2LPT (Bouchet/Scoccimarro EdS coefficients) | MUSCLE
(Neyrinck 2016 multiscale spherical collapse) | transverse damping
(frozen recipe). Truth: PM N-body. Seeds {4,5,6}.
Report -> docs/E9-report.md.
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
sys.path.insert(0, str(ROOT / "scripts"))

import fields, lift, pm, spines  # noqa: E402
from run_e5 import D_STEPS, N, gather, jk  # noqa: E402
from run_e8 import KBINS, evolve as evolve_damp, spectra  # noqa: E402

SEEDS = [4, 5, 6]
KSHOW = [2, 4, 5, 6]      # k-bin indices to tabulate


def run_seed(seed):
    rng = np.random.default_rng(seed)
    x_pm, v_pm, tidx, ta, tpos, q_tr, psi_tr = pm.pm_sim(
        N, 128.0, rng, n_steps=90, track=50000)
    seedseq = np.random.default_rng(seed).integers(0, 2 ** 32)
    _, pos_q = fields.zeldovich_box(N, 128.0, 0.0, np.random.default_rng(seedseq))
    _, pos_d = fields.zeldovich_box(N, 128.0, 1.0, np.random.default_rng(seedseq))
    psi_full = pos_d - pos_q
    psi_full -= N * np.round(psi_full / N)

    truth = tpos[-1].astype(float)
    d_truth = fields.cic_deposit(x_pm, N) - 1.0
    clean = gaussian_filter(np.log1p(1 + d_truth), 1.0, mode="wrap")
    sp = spines.skeleton_points(spines.extract_matched(
        spines.lifted_ridgeness(lift.orientation_score(clean, lift.hemisphere_axes(42), 6.0, 1.5)),
        2400, lo_frac=1.0))
    d_spine = cKDTree(sp).query(truth)[0]
    web = d_spine < 2.0

    models = {
        "za": (pos_q + D_STEPS[-1] * psi_full) % N,
        "lpt2": fields.lpt2_positions(N, 128.0, np.random.default_rng(seedseq)),
        "muscle": fields.muscle_positions(N, 128.0, np.random.default_rng(seedseq)),
        "damp": evolve_damp(pos_q, psi_full, "damp"),
    }
    rec = {"seed": seed}
    for name, xf in models.items():
        xm = xf[tidx]
        err = xm - truth
        err -= N * np.round(err / N)
        err = np.linalg.norm(err, axis=1)
        rec[f"{name}_all"] = float(np.median(err))
        rec[f"{name}_web"] = float(np.median(err[web]))
        r, t = spectra(fields.cic_deposit(xf, N) - 1.0, d_truth)
        rec[f"{name}_r"] = r
        rec[f"{name}_T"] = t
    return rec


def main():
    t0 = time.time()
    with Pool(3) as pool:
        recs = pool.map(run_seed, SEEDS)
    print(f"{len(SEEDS)} seeds in {time.time()-t0:.0f}s")
    (ROOT / "artifacts" / "e9_results.json").write_text(json.dumps(recs, indent=1))
    report(recs)


def report(recs):
    kc = np.sqrt(KBINS[:-1] * KBINS[1:])
    names = ["za", "lpt2", "muscle", "damp"]
    labels = {"za": "ZA", "lpt2": "2LPT", "muscle": "MUSCLE",
              "damp": "transverse damp"}
    md = ["# E9 — literature baselines: 2LPT and MUSCLE vs the frozen model\n",
          f"Identical initial conditions, PM truth, {len(SEEDS)} seeds. "
          "Transport errors in voxels (= h⁻¹Mpc); web = within 2 of the "
          "spine network.\n",
          "## Per-particle transport error (median)\n"]
    md.append("| model | all | web |")
    md.append("|---|---|---|")
    for n in names:
        a, ae = jk([r[f"{n}_all"] for r in recs])
        w, we = jk([r[f"{n}_web"] for r in recs])
        md.append(f"| {labels[n]} | {a:.2f} ± {ae:.2f} | {w:.2f} ± {we:.2f} |")
    for stat, title in [("r", "Cross-correlation r(k)"),
                        ("T", "Transfer T(k)")]:
        md.append(f"\n## {title}\n")
        md.append("| k (h/Mpc) | " + " | ".join(labels[n] for n in names) + " |")
        md.append("|---|" + "---|" * len(names))
        for i in KSHOW:
            row = [f"| {kc[i]:.2f} "]
            for n in names:
                row.append(f"| {np.mean([r[f'{n}_{stat}'][i] for r in recs]):.3f} ")
            md.append("".join(row) + "|")
    out = ROOT / "docs" / "E9-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")
    print("\n".join(md[3:12]))


if __name__ == "__main__":
    main()
