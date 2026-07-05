#!/usr/bin/env python3
"""E12: external validation against CAMELS CV_0 (IllustrisTNG_DM, Arepo).

Tier 1 (referee M1): evolve our PM code from CAMELS' own 2LPT ICs
(z=127 -> z=0, LCDM Om=0.3) and compare to the official z=0 snapshot:
field-level r(k)/T(k) and matched-ID per-particle displacement.
Tier 2: score ZA and the frozen damping model against the EXTERNAL truth.
Caveat by design: the 25 Mpc/h box probes 0.1 Mpc cells — a 10x
extrapolation beyond the model's tested resolution range; tier 2 is a
stress test, tier 1 is the referee item. Report -> docs/E12-report.md.
"""
import json, sys, time
from pathlib import Path
import numpy as np
import h5py, hdf5plugin  # noqa: F401
from scipy.ndimage import gaussian_filter

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src")); sys.path.insert(0, str(ROOT / "scripts"))
import fields, pm  # noqa: E402
from run_e5 import D_STEPS, gather  # noqa: E402

N = 256
OM = 0.3
A_I, A_F, STEPS = 1.0 / 128.0, 1.0, 180
BETA, SMOOTH_MPC, RHO_C = 0.6, 2.0, 5.0
VOX = 25.0 / 256.0     # Mpc/h per voxel
import os
TAG = os.environ.get("E12_TAG", "camels")
DATA = ROOT / "data" / TAG


def read_ics():
    xs, ids = [], []
    for i in range(8):
        with h5py.File(DATA / "ICs" / f"ics.{i}.hdf5") as g:
            xs.append(np.asarray(g["PartType1"]["Coordinates"]))
            ids.append(np.asarray(g["PartType1"]["ParticleIDs"]))
    x = np.concatenate(xs) / (25000.0 / N)          # kpc -> voxels
    ids = np.concatenate(ids)
    q = np.round(x)                                  # ICs sit near grid nodes
    psi_ic = x - q
    psi_ic -= N * np.round(psi_ic / N)
    frac_far = float((np.abs(psi_ic) > 0.45).mean())
    D_i = pm.growth_factor([A_I], OM)[0]
    return q % N, psi_ic / D_i, ids, frac_far, D_i


def read_truth():
    with h5py.File(DATA / "snapshot_090.hdf5") as f:
        x = np.asarray(f["PartType1"]["Coordinates"]) / (25000.0 / N)
        ids = np.asarray(f["PartType1"]["ParticleIDs"])
    return x % N, ids


def run_pm(q, psi, D_i):
    Ha = lambda a: np.sqrt(OM * a ** -3 + 1 - OM)
    eps = 1e-5
    Dv = pm.growth_factor([A_I, A_I + eps], OM)
    dDda = (Dv[1] - Dv[0]) / eps
    x = (q + D_i * psi) % N
    p = A_I * dDda * A_I ** 2 * Ha(A_I) * psi
    k1 = np.fft.fftfreq(N) * 2 * np.pi
    kx, ky, kz = np.meshgrid(k1, k1, k1[: N // 2 + 1], indexing="ij")
    k2 = kx ** 2 + ky ** 2 + kz ** 2
    k2[0, 0, 0] = 1.0
    a_grid = np.linspace(A_I, A_F, STEPS + 1)
    F = pm._forces(x, N, A_I, kx, ky, kz, k2, OM)
    for i in range(STEPS):
        a, a_new = a_grid[i], a_grid[i + 1]
        a_half = 0.5 * (a + a_new)
        dtau = (a_new - a) / (a_half ** 2 * Ha(a_half))
        p += a * F * (dtau / 2)
        x = (x + p / a_half * dtau) % N
        F = pm._forces(x, N, a_new, kx, ky, kz, k2, OM)
        p += F * (dtau / 2) * a_new
    return x


def evolve_damp(q, psi):
    x = (q + D_STEPS[0] * psi) % N
    v = psi.copy()
    crossed = np.zeros(len(x), bool)
    e3f = None
    for i in range(1, len(D_STEPS)):
        dD = D_STEPS[i] - D_STEPS[i - 1]
        x = (x + v * dD) % N
        rho = fields.cic_deposit(x, N)
        if e3f is None or i % 3 == 0:
            clean = gaussian_filter(np.log1p(rho), 1.0, mode="wrap")
            e3f = fields.tidal_frame(clean, smooth=SMOOTH_MPC / VOX)
        hit = (~crossed) & (gather(rho, x) > RHO_C)
        if hit.any():
            idx = np.clip(np.round(x[hit]).astype(int), 0, N - 1) % N
            e = e3f[idx[:, 0], idx[:, 1], idx[:, 2]]
            par = e * np.sum(v[hit] * e, axis=1, keepdims=True)
            v[hit] = par + (1 - BETA) * (v[hit] - par)
            crossed |= hit
    return x


def spectra(da, db):
    fa, fb = np.fft.rfftn(da), np.fft.rfftn(db)
    k1 = np.fft.fftfreq(N) * 2 * np.pi / VOX      # physical h/Mpc
    kx, ky, kz = np.meshgrid(k1, k1, k1[: N // 2 + 1], indexing="ij")
    k = np.sqrt(kx ** 2 + ky ** 2 + kz ** 2)
    out = []
    for lo, hi in zip(KB[:-1], KB[1:]):
        m = (k >= lo) & (k < hi)
        paa, pbb = np.mean(np.abs(fa[m]) ** 2), np.mean(np.abs(fb[m]) ** 2)
        pab = np.mean((fa[m] * np.conj(fb[m])).real)
        out.append((float(pab / np.sqrt(paa * pbb)),
                    float(np.sqrt(paa / pbb))))
    return out


KB = np.geomspace(2 * np.pi / 25.0, 12.0, 7)


def main():
    t0 = time.time()
    q, psi, ids_ic, frac_far, D_i = read_ics()
    print(f"ICs: D(a_i)={D_i:.4f}, frac|psi_ic|>0.45vox={frac_far:.3f}")
    xt, ids_t = read_truth()
    order_t = np.argsort(ids_t)
    order_i = np.argsort(ids_ic)
    xt_m = xt[order_t]

    d_truth = fields.cic_deposit(xt, N) - 1.0
    results = {"frac_far": frac_far}

    print("our PM from CAMELS ICs...")
    x_pm = run_pm(q, psi, D_i)
    d = (x_pm[order_i] - xt_m)
    d -= N * np.round(d / N)
    results["pm_vs_arepo_median_mpc"] = float(
        np.median(np.linalg.norm(d, axis=1)) * VOX)
    results["pm_spectra"] = spectra(fields.cic_deposit(x_pm, N) - 1.0, d_truth)
    print(f"  matched-ID median offset: {results['pm_vs_arepo_median_mpc']:.3f} Mpc/h")

    for name, xm in [("za", (q + psi) % N), ("damp", evolve_damp(q, psi))]:
        d = xm[order_i] - xt_m
        d -= N * np.round(d / N)
        results[f"{name}_median_mpc"] = float(
            np.median(np.linalg.norm(d, axis=1)) * VOX)
        results[f"{name}_spectra"] = spectra(
            fields.cic_deposit(xm, N) - 1.0, d_truth)
        print(f"  {name}: median {results[f'{name}_median_mpc']:.3f} Mpc/h")

    (ROOT / "artifacts" / f"e12_{TAG}_results.json").write_text(
        json.dumps(results, indent=1))
    kc = np.sqrt(KB[:-1] * KB[1:])
    md = [f"# E12 ({TAG}) — external validation, LCDM CV_0\n",
          f"Our PM evolved from CAMELS' own 2LPT ICs (z=127→0, Ωm=0.3, "
          f"256³, 25 Mpc/h box). Node-rounding sanity: fraction of IC "
          f"displacements beyond 0.45 voxels = {frac_far:.3f}.\n",
          f"- **Tier 1 (truth quality):** our PM vs Arepo, matched IDs: "
          f"median offset {results['pm_vs_arepo_median_mpc']:.3f} Mpc/h.\n",
          f"- **Tier 2 (external stress test):** ZA "
          f"{results['za_median_mpc']:.3f} vs damping model "
          f"{results['damp_median_mpc']:.3f} Mpc/h median vs Arepo truth "
          f"(0.1 Mpc cells — 10× beyond tested resolution range).\n",
          "\n| k (h/Mpc) | r our-PM | T our-PM | r ZA | r damp |",
          "|---|---|---|---|---|"]
    for i, k in enumerate(kc):
        md.append(f"| {k:.2f} | {results['pm_spectra'][i][0]:.3f} "
                  f"| {results['pm_spectra'][i][1]:.3f} "
                  f"| {results['za_spectra'][i][0]:.3f} "
                  f"| {results['damp_spectra'][i][0]:.3f} |")
    (ROOT / "docs" / f"E12-{TAG}-report.md").write_text("\n".join(md) + "\n")
    print(f"total {time.time()-t0:.0f}s")

if __name__ == "__main__":
    main()
