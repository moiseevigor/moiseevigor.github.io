#!/usr/bin/env python3
"""E5d: final knob round around the E5c winner (declared optimization).

Two remaining levers near the optimum: damping fraction beta in
{0.6, 0.75, 0.9} x tidal-frame smoothing scale in {2, 4} Mpc/h (default
was 4). Self-density frames throughout, rho_c = 5, both-perp damping.
Selection on seeds {2,3}, winner validated on {4,5,6}.
Report -> docs/E5d-report.md.
"""

import json, sys, time
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
RHO_C = 5.0
CONFIGS = {f"b{b:g}_s{s:g}": dict(beta=b, smooth=s)
           for b in (0.6, 0.75, 0.9) for s in (2.0, 4.0)}


def evolve_full(q_grid, psi_full, beta, smooth):
    x = (q_grid + D_STEPS[0] * psi_full) % N
    v = psi_full.copy()
    crossed = np.zeros(len(x), bool)
    e3f = None
    for i in range(1, len(D_STEPS)):
        dD = D_STEPS[i] - D_STEPS[i - 1]
        x = (x + v * dD) % N
        rho = fields.cic_deposit(x, N)
        if e3f is None or i % 3 == 0:
            clean = gaussian_filter(np.log1p(rho), 1.0, mode="wrap")
            e3f = fields.tidal_frame(clean, smooth=smooth)
        hit = (~crossed) & (gather(rho, x) > RHO_C)
        if hit.any():
            idx = np.clip(np.round(x[hit]).astype(int), 0, N - 1) % N
            e = e3f[idx[:, 0], idx[:, 1], idx[:, 2]]
            par = e * np.sum(v[hit] * e, axis=1, keepdims=True)
            v[hit] = par + (1 - beta) * (v[hit] - par)
            crossed |= hit
    return x


def run_seed(args):
    seed, names = args
    rng = np.random.default_rng(seed)
    x_pm, v_pm, tidx, ta, tpos, q_tr, psi_tr = pm.pm_sim(
        N, L, rng, n_steps=90, track=50000)
    seedseq = np.random.default_rng(seed).integers(0, 2 ** 32)
    _, pos_q = fields.zeldovich_box(N, L, 0.0, np.random.default_rng(seedseq))
    _, pos_d = fields.zeldovich_box(N, L, 1.0, np.random.default_rng(seedseq))
    psi_full = pos_d - pos_q
    psi_full -= N * np.round(psi_full / N)
    truth = tpos[-1].astype(float)
    rec = {"seed": seed}
    xz = (q_tr + D_STEPS[-1] * psi_tr) % N
    err = xz - truth; err -= N * np.round(err / N)
    rec["za_all"] = float(np.median(np.linalg.norm(err, axis=1)))
    for name in names:
        cfg = CONFIGS[name]
        xf = evolve_full(pos_q, psi_full, cfg["beta"], cfg["smooth"])
        err = xf[tidx] - truth; err -= N * np.round(err / N)
        rec[f"{name}_all"] = float(np.median(np.linalg.norm(err, axis=1)))
    return rec


def main():
    t0 = time.time()
    names = list(CONFIGS)
    with Pool(2) as pool:
        sel = pool.map(run_seed, [(s, names) for s in SEL_SEEDS])
    scores = {n: float(np.mean([r[f"{n}_all"] for r in sel])) for n in names}
    for n, v in sorted(scores.items(), key=lambda kv: kv[1]):
        print(f"  {n}: {v:.3f}")
    best = min(scores, key=scores.get)
    print("validating", best)
    with Pool(3) as pool:
        val = pool.map(run_seed, [(s, [best]) for s in VAL_SEEDS])
    za, zae = jk([r["za_all"] for r in val])
    bm, bme = jk([r[f"{best}_all"] for r in val])
    (ROOT / "artifacts" / "e5d_results.json").write_text(json.dumps(
        {"scores": scores, "best": best, "validation": val}, indent=1))
    md = ["# E5d — final knob round (beta x frame smoothing)\n",
          f"Selection scores (seeds 2-3): " +
          ", ".join(f"{n}={v:.3f}" for n, v in
                    sorted(scores.items(), key=lambda kv: kv[1])) + "\n",
          f"\nHeld-out (seeds 4-6): ZA {za:.2f} +/- {zae:.2f}; "
          f"**{best}** {bm:.2f} +/- {bme:.2f} "
          f"({100*(bm-za)/za:+.0f}% vs ZA; oracle bound 4.47; "
          f"E5c winner 4.64).\n"]
    (ROOT / "docs" / "E5d-report.md").write_text("\n".join(md))
    print(f"held-out: ZA {za:.2f}, {best} {bm:.2f}")
    print(f"total {time.time()-t0:.0f}s")


if __name__ == "__main__":
    main()
