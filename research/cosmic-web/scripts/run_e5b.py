#!/usr/bin/env python3
"""E5b (H-E5b): is the 2-4 vox deficit of the transverse-damping model an
estimation artifact or a physics failure?

E5 attributed the model's small outskirts deficit (+4% vs ZA at 2-4 vox)
to noisy tidal frames from the evolving ZA proxy density. Test: rerun the
SAME model with oracle frames — the tidal eigenframe of the true PM final
field — for the damping decisions. If the deficit closes, the term's
physics is validated and the error is in frame estimation; if it persists,
the damping condition itself over-fires in the outskirts.

Modes: za | damp (E5, proxy frames) | damp_oracle (PM-final frames).
rho_c frozen at the E5-calibrated value. Report -> docs/E5b-report.md.
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
from run_e5 import (D_BINS, D_STEPS, FRAME_EVERY, N, L, _AXES,  # noqa: E402
                    gather, jk, za_density)

SEEDS = [2, 3, 4, 5, 6]
RHO_C = 5.0


def evolve(q_tr, psi_tr, q_grid, psi_full, rho_c, mode, oracle_e3=None):
    x = (q_tr + D_STEPS[0] * psi_tr) % N
    v = psi_tr.copy()
    crossed = np.zeros(len(x), bool)
    e3 = oracle_e3
    for i in range(1, len(D_STEPS)):
        D = D_STEPS[i]
        dD = D_STEPS[i] - D_STEPS[i - 1]
        x = (x + v * dD) % N
        if mode == "za":
            continue
        rho = za_density(q_grid, psi_full, D)
        if mode == "damp" and (e3 is None or i % FRAME_EVERY == 0):
            clean = gaussian_filter(np.log1p(rho), 1.0, mode="wrap")
            e3 = fields.tidal_frame(clean)
        new = (~crossed) & (gather(rho, x) > rho_c)
        if new.any():
            idx = np.clip(np.round(x[new]).astype(int), 0, N - 1) % N
            e = e3[idx[:, 0], idx[:, 1], idx[:, 2]]
            v[new] = e * np.sum(v[new] * e, axis=1, keepdims=True)
            crossed |= new
    return x


def run_seed(seed):
    rng = np.random.default_rng(seed)
    x_pm, v_pm, tidx, ta, tpos, q_tr, psi_tr = pm.pm_sim(
        N, L, rng, n_steps=90, track=50000)
    seedseq = np.random.default_rng(seed).integers(0, 2 ** 32)
    _, pos_q = fields.zeldovich_box(N, L, 0.0, np.random.default_rng(seedseq))
    _, pos_d = fields.zeldovich_box(N, L, 1.0, np.random.default_rng(seedseq))
    psi_full = pos_d - pos_q
    psi_full -= N * np.round(psi_full / N)

    truth = tpos[-1].astype(float)
    clean_pm = gaussian_filter(np.log1p(fields.cic_deposit(x_pm, N)), 1.0,
                               mode="wrap")
    e3_oracle = fields.tidal_frame(clean_pm)
    U = lift.orientation_score(clean_pm, _AXES, 6.0, 1.5)
    sp = spines.skeleton_points(spines.extract_matched(
        spines.lifted_ridgeness(U), 2400, lo_frac=1.0))
    d_spine = cKDTree(sp).query(truth)[0]

    rec = {"seed": seed}
    for mode in ("za", "damp", "damp_oracle"):
        xm = evolve(q_tr, psi_tr, pos_q, psi_full, RHO_C,
                    "za" if mode == "za" else
                    ("damp" if mode == "damp" else "oracle"),
                    oracle_e3=e3_oracle if mode == "damp_oracle" else None)
        err = xm - truth
        err -= N * np.round(err / N)
        err = np.linalg.norm(err, axis=1)
        for lo, hi in D_BINS:
            m = (d_spine >= lo) & (d_spine < hi)
            rec[f"{mode}_err_{lo}_{hi}"] = float(np.median(err[m]))
        rec[f"{mode}_err_all"] = float(np.median(err))
    return rec


def main():
    t0 = time.time()
    with Pool(5) as pool:
        recs = pool.map(run_seed, SEEDS)
    print(f"{len(recs)} sims in {time.time()-t0:.0f}s")
    (ROOT / "artifacts" / "e5b_results.json").write_text(
        json.dumps(recs, indent=1))
    report(recs)


def report(recs):
    md = ["# E5b — oracle-frame test of the transverse-damping deficit\n",
          f"Same protocol as E5 (rho_c = {RHO_C}, {len(recs)} held-out "
          "seeds); 'oracle' uses the tidal frame of the true PM final field "
          "for damping decisions instead of the evolving ZA proxy.\n"]
    md.append("| d to spine (vox) | ZA | damp (proxy frames) "
              "| damp (oracle frames) | oracle vs ZA |")
    md.append("|---|---|---|---|---|")
    for key in [f"{lo}_{hi}" for lo, hi in D_BINS] + ["all"]:
        za, zae = jk([r[f"za_err_{key}"] for r in recs])
        dm, dme = jk([r[f"damp_err_{key}"] for r in recs])
        do, doe = jk([r[f"damp_oracle_err_{key}"] for r in recs])
        lab = key.replace("_", "–") if key != "all" else "**all**"
        md.append(f"| {lab} | {za:.2f} ± {zae:.2f} | {dm:.2f} ± {dme:.2f} "
                  f"| {do:.2f} ± {doe:.2f} | {100*(do-za)/za:+.0f}% |")
    md.append("\nReading: if the oracle closes the 2–4 vox gap to ZA, the "
              "E5 deficit was frame-estimation error and the damping "
              "physics is validated; if the gap persists, the crossing "
              "condition itself over-fires in the outskirts.\n")
    out = ROOT / "docs" / "E5b-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")
    print("\n".join(md[3:]))


if __name__ == "__main__":
    main()
