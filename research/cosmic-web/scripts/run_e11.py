#!/usr/bin/env python3
"""E11: the hybrid — MUSCLE's Lagrangian trigger + directional damping.

E9 showed MUSCLE ties the frozen model with complementary strengths. The
principled hybrid keeps our directional (transverse-only) damping but
replaces the ad-hoc Eulerian trigger (rho > 5) with MUSCLE's Lagrangian
multiscale collapse condition: particle q crosses when D * delta_R(q) >=
3/2 at any smoothing scale R — precomputable per particle as D_cross(q).

Models: MUSCLE | damp (frozen, Eulerian trigger) | damp_msc (hybrid).
Seeds {4,5,6}; transport + field metrics. Report -> docs/E11-report.md.
"""
import json, sys, time
from multiprocessing import Pool
from pathlib import Path
import numpy as np
from scipy.ndimage import gaussian_filter
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src")); sys.path.insert(0, str(ROOT / "scripts"))
import fields, lift, pm, spines  # noqa: E402
from run_e5 import D_STEPS, N, gather, jk  # noqa: E402
from run_e8 import KBINS, evolve as evolve_damp, spectra  # noqa: E402

SEEDS = [4, 5, 6]
BETA, SMOOTH = 0.6, 2.0
SCALES = (0.0, 1.0, 2.0, 4.0, 8.0)


def d_cross_field(N_, L, seedseq):
    """Per-Lagrangian-cell first-collapse growth factor (MUSCLE trigger)."""
    dk, _, _ = fields._delta_k_of(N_, L, np.random.default_rng(seedseq))
    delta = np.fft.irfftn(dk, s=(N_, N_, N_))
    dcross = np.full(delta.shape, np.inf)
    for R in SCALES:
        dR = gaussian_filter(delta, R, mode="wrap") if R > 0 else delta
        with np.errstate(divide="ignore"):
            dc = np.where(dR > 0, 1.5 / dR, np.inf)
        dcross = np.minimum(dcross, dc)
    return dcross.ravel()


def evolve_hybrid(q_grid, psi_full, dcross):
    x = (q_grid + D_STEPS[0] * psi_full) % N
    v = psi_full.copy()
    crossed = np.zeros(len(x), bool)
    e3f = None
    for i in range(1, len(D_STEPS)):
        D = D_STEPS[i]
        dD = D - D_STEPS[i - 1]
        x = (x + v * dD) % N
        rho = fields.cic_deposit(x, N)
        if e3f is None or i % 3 == 0:
            clean = gaussian_filter(np.log1p(rho), 1.0, mode="wrap")
            e3f = fields.tidal_frame(clean, smooth=SMOOTH)
        hit = (~crossed) & (dcross <= D)
        if hit.any():
            idx = np.clip(np.round(x[hit]).astype(int), 0, N - 1) % N
            e = e3f[idx[:, 0], idx[:, 1], idx[:, 2]]
            par = e * np.sum(v[hit] * e, axis=1, keepdims=True)
            v[hit] = par + (1 - BETA) * (v[hit] - par)
            crossed |= hit
    return x


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
    web = cKDTree(sp).query(truth)[0] < 2.0

    models = {
        "muscle": fields.muscle_positions(N, 128.0, np.random.default_rng(seedseq)),
        "damp": evolve_damp(pos_q, psi_full, "damp"),
        "damp_msc": evolve_hybrid(pos_q, psi_full,
                                  d_cross_field(N, 128.0, seedseq)),
    }
    rec = {"seed": seed}
    for name, xf in models.items():
        err = xf[tidx] - truth
        err -= N * np.round(err / N)
        err = np.linalg.norm(err, axis=1)
        rec[f"{name}_all"] = float(np.median(err))
        rec[f"{name}_web"] = float(np.median(err[web]))
        r, t = spectra(fields.cic_deposit(xf, N) - 1.0, d_truth)
        rec[f"{name}_r"], rec[f"{name}_T"] = r, t
    return rec


def main():
    t0 = time.time()
    with Pool(3) as pool:
        recs = pool.map(run_seed, SEEDS)
    print(f"{len(SEEDS)} seeds in {time.time()-t0:.0f}s")
    (ROOT / "artifacts" / "e11_results.json").write_text(json.dumps(recs, indent=1))
    kc = np.sqrt(KBINS[:-1] * KBINS[1:])
    names = ["muscle", "damp", "damp_msc"]
    md = ["# E11 — hybrid: Lagrangian (MUSCLE) trigger + directional damping\n"]
    md.append("| model | transport all | web | r(k=0.53) | T(k=0.34) |")
    md.append("|---|---|---|---|---|")
    for n in names:
        a, ae = jk([r[f"{n}_all"] for r in recs])
        w, we = jk([r[f"{n}_web"] for r in recs])
        rr = np.mean([r[f"{n}_r"][5] for r in recs])
        tt = np.mean([r[f"{n}_T"][4] for r in recs])
        md.append(f"| {n} | {a:.2f} ± {ae:.2f} | {w:.2f} ± {we:.2f} "
                  f"| {rr:.3f} | {tt:.3f} |")
    (ROOT / "docs" / "E11-report.md").write_text("\n".join(md) + "\n")
    print("\n".join(md[1:]))


if __name__ == "__main__":
    main()
