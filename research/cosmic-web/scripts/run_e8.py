#!/usr/bin/env python3
"""E8 (H-field): does the frozen model deliver better DENSITY FIELDS,
not just better particle positions?

The model card's stated downstream use is mock-catalogue generation, which
consumes fields, not trajectories. Transport error and field fidelity can
dissociate. Per seed: evolve the FULL particle set under ZA, isotropic
sticking, and the frozen transverse-damping model; deposit densities;
compare each with the PM truth field via
    r(k)  = P_cross / sqrt(P_model P_truth)     (phase fidelity)
    T(k)  = sqrt(P_model / P_truth)             (amplitude fidelity)
in logarithmic k bins to half-Nyquist. Report -> docs/E8-report.md.
"""

import json
import sys
import time
from multiprocessing import Pool
from pathlib import Path

import numpy as np
from scipy.ndimage import gaussian_filter

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "scripts"))

import fields, pm  # noqa: E402
from run_e5 import D_STEPS, N, gather  # noqa: E402

SEEDS = [4, 5, 6]
BETA, SMOOTH, RHO_C = 0.6, 2.0, 5.0
KBINS = np.geomspace(2 * np.pi / 128, np.pi / 2, 9)  # h/Mpc, to half-Nyquist


def evolve(q_grid, psi_full, mode):
    x = (q_grid + D_STEPS[0] * psi_full) % N
    v = psi_full.copy()
    crossed = np.zeros(len(x), bool)
    e3f = None
    for i in range(1, len(D_STEPS)):
        dD = D_STEPS[i] - D_STEPS[i - 1]
        x = (x + v * dD) % N
        if mode == "za":
            continue
        rho = fields.cic_deposit(x, N)
        if mode == "damp" and (e3f is None or i % 3 == 0):
            clean = gaussian_filter(np.log1p(rho), 1.0, mode="wrap")
            e3f = fields.tidal_frame(clean, smooth=SMOOTH)
        hit = (~crossed) & (gather(rho, x) > RHO_C)
        if hit.any():
            if mode == "stick":
                v[hit] = 0.0
            else:
                idx = np.clip(np.round(x[hit]).astype(int), 0, N - 1) % N
                e = e3f[idx[:, 0], idx[:, 1], idx[:, 2]]
                par = e * np.sum(v[hit] * e, axis=1, keepdims=True)
                v[hit] = par + (1 - BETA) * (v[hit] - par)
            crossed |= hit
    return x


def spectra(delta_a, delta_b):
    """Binned cross r(k) and transfer T(k) of field a against truth b."""
    fa, fb = np.fft.rfftn(delta_a), np.fft.rfftn(delta_b)
    k1 = np.fft.fftfreq(N, d=1.0) * 2 * np.pi   # voxel = 1 Mpc/h here
    kx, ky, kz = np.meshgrid(k1, k1, k1[: N // 2 + 1], indexing="ij")
    k = np.sqrt(kx ** 2 + ky ** 2 + kz ** 2)
    r_out, t_out = [], []
    for lo, hi in zip(KBINS[:-1], KBINS[1:]):
        m = (k >= lo) & (k < hi)
        paa = float(np.mean(np.abs(fa[m]) ** 2))
        pbb = float(np.mean(np.abs(fb[m]) ** 2))
        pab = float(np.mean((fa[m] * np.conj(fb[m])).real))
        r_out.append(pab / np.sqrt(paa * pbb))
        t_out.append(np.sqrt(paa / pbb))
    return r_out, t_out


def run_seed(seed):
    rng = np.random.default_rng(seed)
    x_pm, *_ = pm.pm_sim(N, 128.0, rng, n_steps=90, track=1)
    seedseq = np.random.default_rng(seed).integers(0, 2 ** 32)
    _, pos_q = fields.zeldovich_box(N, 128.0, 0.0, np.random.default_rng(seedseq))
    _, pos_d = fields.zeldovich_box(N, 128.0, 1.0, np.random.default_rng(seedseq))
    psi_full = pos_d - pos_q
    psi_full -= N * np.round(psi_full / N)

    d_truth = fields.cic_deposit(x_pm, N) - 1.0
    rec = {"seed": seed}
    for mode in ("za", "stick", "damp"):
        d_m = fields.cic_deposit(evolve(pos_q, psi_full, mode), N) - 1.0
        r, t = spectra(d_m, d_truth)
        rec[f"{mode}_r"] = r
        rec[f"{mode}_T"] = t
    return rec


def main():
    t0 = time.time()
    with Pool(3) as pool:
        recs = pool.map(run_seed, SEEDS)
    print(f"{len(SEEDS)} seeds in {time.time()-t0:.0f}s")
    (ROOT / "artifacts" / "e8_results.json").write_text(json.dumps(recs, indent=1))
    report(recs)


def report(recs):
    kc = np.sqrt(KBINS[:-1] * KBINS[1:])
    md = ["# E8 — field-level fidelity (the mock-catalogue criterion)\n",
          f"Full-set density fields vs PM truth, {len(SEEDS)} seeds, "
          "1 Mpc/h voxels. r(k): phase/structure fidelity (1 = perfect); "
          "T(k): amplitude fidelity (1 = unbiased).\n"]
    for stat in ("r", "T"):
        md.append(f"\n## {'Cross-correlation r(k)' if stat=='r' else 'Transfer T(k)'}\n")
        md.append("| k (h/Mpc) | ZA | isotropic stick | transverse damp |")
        md.append("|---|---|---|---|")
        for i, k in enumerate(kc):
            row = [f"| {k:.2f} "]
            for mode in ("za", "stick", "damp"):
                vals = [r[f"{mode}_{stat}"][i] for r in recs]
                row.append(f"| {np.mean(vals):.3f} ")
            md.append("".join(row) + "|")
    out = ROOT / "docs" / "E8-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")
    print("\n".join(md[3:16]))


if __name__ == "__main__":
    main()
