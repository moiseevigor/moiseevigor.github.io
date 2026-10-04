#!/usr/bin/env python3
"""E5c: refinement campaign for the transverse-damping model (declared
optimization, per program owner's direction).

E5b showed frame estimation is the binding constraint (oracle bound 4.47
vs proxy 4.93 median voxel error). Levers, in evidence order:

1. SELF-density frames: evolve the FULL particle set under the model and
   compute crossing density + tidal frames from the model's own particles
   (damped particles pile onto the web -> sharper late-time frames than
   the pure-ZA proxy).
2. Partial damping beta (v_perp *= 1-beta).
3. Crossing threshold rho_c.
4. Sequential damping (pancake physics): first crossing removes only the
   e1 component, second crossing removes e2.

Protocol: 6 configs selected on seeds {2,3}; the best two validated on
held-out seeds {4,5,6} against ZA, the E5 proxy model, and the E5b oracle
bound. Report -> docs/E5c-report.md.
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
from run_e5 import D_BINS, D_STEPS, N, L, _AXES, gather, jk  # noqa: E402

SEL_SEEDS = [2, 3]
VAL_SEEDS = [4, 5, 6]

CONFIGS = {
    "A_proxy_b1_r5":   dict(frames="za",   beta=1.0,  rho_c=5.0, seq=False),
    "B_self_b1_r5":    dict(frames="self", beta=1.0,  rho_c=5.0, seq=False),
    "C_self_b075_r5":  dict(frames="self", beta=0.75, rho_c=5.0, seq=False),
    "D_self_b1_r3":    dict(frames="self", beta=1.0,  rho_c=3.0, seq=False),
    "E_self_b1_r5_sq": dict(frames="self", beta=1.0,  rho_c=5.0, seq=True),
    "F_self_b075_r3_sq": dict(frames="self", beta=0.75, rho_c=3.0, seq=True),
}


def evolve_full(q_grid, psi_full, cfg):
    """Evolve the FULL particle set under one model config; returns final
    positions of all particles."""
    x = (q_grid + D_STEPS[0] * psi_full) % N
    v = psi_full.copy()
    n_cross = np.zeros(len(x), np.int8)
    e_frames = None
    for i in range(1, len(D_STEPS)):
        dD = D_STEPS[i] - D_STEPS[i - 1]
        x = (x + v * dD) % N
        # density for crossing detection (and frames if self)
        if cfg["frames"] == "self":
            rho = fields.cic_deposit(x, N)
        else:
            rho = fields.cic_deposit((q_grid + D_STEPS[i] * psi_full) % N, N)
        if e_frames is None or i % 3 == 0:
            clean = gaussian_filter(np.log1p(rho), 1.0, mode="wrap")
            evals_dirs = fields.tidal_frame_full(clean) \
                if cfg["seq"] else (None, fields.tidal_frame(clean))
            e1f, e3f = (evals_dirs[0], evals_dirs[1]) if cfg["seq"] \
                else (None, evals_dirs[1])
        max_cross = 2 if cfg["seq"] else 1
        hit = (n_cross < max_cross) & (gather(rho, x) > cfg["rho_c"])
        if hit.any():
            idx = np.clip(np.round(x[hit]).astype(int), 0, N - 1) % N
            if not cfg["seq"]:
                e = e3f[idx[:, 0], idx[:, 1], idx[:, 2]]
                par = e * np.sum(v[hit] * e, axis=1, keepdims=True)
                v[hit] = par + (1 - cfg["beta"]) * (v[hit] - par)
            else:
                first = hit & (n_cross == 0)
                second = hit & (n_cross == 1)
                for mask, ef in ((first, e1f), (second, None)):
                    if not mask.any():
                        continue
                    jdx = np.clip(np.round(x[mask]).astype(int), 0, N - 1) % N
                    if ef is not None:      # remove e1 component only
                        e = ef[jdx[:, 0], jdx[:, 1], jdx[:, 2]]
                        comp = np.sum(v[mask] * e, axis=1, keepdims=True)
                        v[mask] = v[mask] - cfg["beta"] * comp * e
                    else:                   # second crossing: keep only e3
                        e = e3f[jdx[:, 0], jdx[:, 1], jdx[:, 2]]
                        par = e * np.sum(v[mask] * e, axis=1, keepdims=True)
                        v[mask] = par + (1 - cfg["beta"]) * (v[mask] - par)
            n_cross[hit] += 1
    return x


def run_seed(args):
    seed, config_names = args
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
    sp = spines.skeleton_points(spines.extract_matched(
        spines.lifted_ridgeness(lift.orientation_score(clean_pm, _AXES, 6.0, 1.5)),
        2400, lo_frac=1.0))
    d_spine = cKDTree(sp).query(truth)[0]

    rec = {"seed": seed}
    # ZA baseline (tracked subset analytic)
    xz = (q_tr + D_STEPS[-1] * psi_tr) % N
    err = xz - truth; err -= N * np.round(err / N)
    err = np.linalg.norm(err, axis=1)
    rec["za_all"] = float(np.median(err))
    for name in config_names:
        xf = evolve_full(pos_q, psi_full, CONFIGS[name])
        xm = xf[tidx]
        err = xm - truth; err -= N * np.round(err / N)
        err = np.linalg.norm(err, axis=1)
        rec[f"{name}_all"] = float(np.median(err))
        for lo, hi in D_BINS:
            m = (d_spine >= lo) & (d_spine < hi)
            rec[f"{name}_{lo}_{hi}"] = float(np.median(err[m]))
    return rec


def main():
    t0 = time.time()
    names = list(CONFIGS)
    print("selection on seeds", SEL_SEEDS)
    with Pool(2) as pool:
        sel = pool.map(run_seed, [(s, names) for s in SEL_SEEDS])
    scores = {n: np.mean([r[f"{n}_all"] for r in sel]) for n in names}
    for n, v in sorted(scores.items(), key=lambda kv: kv[1]):
        print(f"  {n}: {v:.3f}")
    top2 = sorted(scores, key=scores.get)[:2]
    print("validating", top2, "on seeds", VAL_SEEDS)
    with Pool(3) as pool:
        val = pool.map(run_seed, [(s, top2) for s in VAL_SEEDS])
    (ROOT / "artifacts" / "e5c_results.json").write_text(json.dumps(
        {"selection": sel, "scores": scores, "top2": top2,
         "validation": val}, indent=1))
    report(scores, top2, val)
    print(f"total {time.time()-t0:.0f}s")


def report(scores, top2, val):
    md = ["# E5c — refinement campaign (declared optimization)\n",
          "Config grid over frame source (ZA proxy vs model self-density), "
          "damping fraction β, crossing threshold ρ_c, and sequential "
          "(pancake-ordered) damping. Selection on seeds {2,3}; the top two "
          "configs validated on held-out seeds {4,5,6}. References: ZA and "
          "the E5b oracle bound (4.47 overall).\n",
          "## Selection scores (median voxel error, seeds 2–3)\n"]
    md.append("| config | overall error |")
    md.append("|---|---|")
    for n, v in sorted(scores.items(), key=lambda kv: kv[1]):
        md.append(f"| {n} | {v:.3f} |")
    md.append("\n## Held-out validation (seeds 4–6)\n")
    md.append("| quantity | ZA | " + " | ".join(top2) + " |")
    md.append("|---|---|" + "---|" * len(top2))
    za, zae = jk([r["za_all"] for r in val])
    row = [f"| **all** | {za:.2f} ± {zae:.2f} "]
    for n in top2:
        m, e = jk([r[f"{n}_all"] for r in val])
        row.append(f"| {m:.2f} ± {e:.2f} ")
    md.append("".join(row) + "|")
    for lo, hi in D_BINS:
        cells = [f"| {lo}–{hi} | — "]
        for n in top2:
            m, e = jk([r[f"{n}_{lo}_{hi}"] for r in val])
            cells.append(f"| {m:.2f} ± {e:.2f} ")
        md.append("".join(cells) + "|")
    out = ROOT / "docs" / "E5c-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
