#!/usr/bin/env python3
"""E3d: galaxy-pair bridge stack at ACT depth — the small-scale WHIM design.

E3c showed our shell-projection signal lives at degree scales that the ACT
DR6 ILC map filters out. This is the design matched to ACT instead:

1. Select close CMASS pairs: comoving transverse separation 6-14 Mpc/h,
   line-of-sight separation < 6 Mpc/h (physically-connected candidates;
   the de Graaff/Tanimura geometry).
2. For each pair, sample y at the sky MIDPOINT (the bridge), and subtract
   the halo-symmetric estimate: the mean of y at the four points obtained
   by rotating the midpoint by +/-90 deg around EACH galaxy (same angular
   distance from that halo, off the bridge axis). A circularly symmetric
   halo contributes identically on- and off-axis, so Model A (halo-only)
   predicts zero by construction.
3. Errors: bootstrap over pairs; plus a rotation null (whole-pair-set
   azimuthal scrambling) as a cross-check.
4. Run on BOTH maps (ACT DR6 ILC and Planck MILCA) for the same pairs.

Report -> docs/E3d-report.md.
"""

import json
import sys
import time
from pathlib import Path

import numpy as np
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "scripts"))

import run_e3 as e3  # noqa: E402
from run_e3c import CarMap  # noqa: E402

SEP_T = (6.0, 14.0)      # transverse comoving separation, Mpc/h
SEP_LOS = 6.0            # max line-of-sight separation, Mpc/h
N_BOOT = 500
RNG = np.random.default_rng(17)


def find_pairs(xyz):
    """Pairs by 3D distance then split into transverse/LOS components."""
    tree = cKDTree(xyz)
    cand = tree.query_pairs(r=np.hypot(SEP_T[1], SEP_LOS), output_type="ndarray")
    a, b = xyz[cand[:, 0]], xyz[cand[:, 1]]
    mid = 0.5 * (a + b)
    los_hat = mid / np.linalg.norm(mid, axis=1, keepdims=True)
    d = b - a
    d_los = np.abs(np.sum(d * los_hat, axis=1))
    d_t = np.sqrt(np.maximum(np.sum(d * d, axis=1) - d_los ** 2, 0))
    keep = (d_los < SEP_LOS) & (d_t > SEP_T[0]) & (d_t < SEP_T[1])
    return cand[keep], mid[keep]


def unit(v):
    return v / np.linalg.norm(v, axis=1, keepdims=True)


def sky_vec(xyz):
    return unit(xyz)


def rotate_about(p, axis, ang):
    """Rodrigues rotation of unit vectors p about unit vectors axis."""
    c, s = np.cos(ang), np.sin(ang)
    cross = np.cross(axis, p)
    dot = np.sum(axis * p, axis=1, keepdims=True)
    return c * p + s * cross + (1 - c) * dot * axis


def vec_to_radec(v):
    dec = np.degrees(np.arcsin(np.clip(v[:, 2], -1, 1)))
    ra = np.degrees(np.arctan2(v[:, 1], v[:, 0])) % 360
    return ra, dec


def bridge_estimator(car, g1, g2, mid):
    """y(mid) - mean of off-axis rotations about each galaxy.
    Returns per-pair estimate (NaN where any sample leaves coverage)."""
    est_pts = []
    for g in (g1, g2):
        for ang in (np.pi / 2, -np.pi / 2):
            est_pts.append(rotate_about(mid, g, ang))
    ra_m, dec_m = vec_to_radec(mid)
    y_mid = car.sample(ra_m, dec_m)
    y_off = np.zeros_like(y_mid)
    for p in est_pts:
        ra_o, dec_o = vec_to_radec(unit(p))
        y_off += car.sample(ra_o, dec_o)
    return y_mid - y_off / 4


def run_map(name, car, g1v, g2v, midv):
    est = bridge_estimator(car, g1v, g2v, midv)
    ok = ~np.isnan(est)
    est = est[ok]
    n = len(est)
    boot = np.array([np.mean(est[RNG.integers(0, n, n)]) for _ in range(N_BOOT)])
    mean = float(est.mean())
    err = float(boot.std())
    print(f"  {name}: {n} pairs in coverage, bridge = {mean:.3e} "
          f"± {err:.3e}  (SNR {mean/err:.2f})")
    return {"n_pairs": n, "bridge": mean, "err": err,
            "snr": float(mean / err)}


def main():
    t0 = time.time()
    print("galaxies + pairs...")
    ra_g, dec_g, z_g, xyz = e3.load_galaxies()
    pairs, mid_xyz = find_pairs(xyz)
    print(f"  {len(pairs)} pairs "
          f"(transverse {SEP_T[0]}-{SEP_T[1]} Mpc/h, LOS < {SEP_LOS})")

    g1v = sky_vec(xyz[pairs[:, 0]])
    g2v = sky_vec(xyz[pairs[:, 1]])
    midv = sky_vec(mid_xyz)

    results = {"n_pairs_total": int(len(pairs))}
    print("ACT DR6...")
    act = CarMap(ROOT / "data" / "ilc_actplanck_ymap.fits")
    results["act"] = run_map("ACT", act, g1v, g2v, midv)
    del act

    print("Planck MILCA (healpy)...")
    import healpy as hp
    ymap = hp.read_map(str(next(ROOT.glob("data/**/*milca*.fits"))), field=0)

    class HP:
        def sample(self, ra, dec):
            from run_e3b import to_gal
            l, b = to_gal(ra, dec)
            return hp.get_interp_val(ymap, np.radians(90 - b), np.radians(l))
    results["planck"] = run_map("Planck", HP(), g1v, g2v, midv)

    (ROOT / "artifacts" / "e3d_results.json").write_text(
        json.dumps(results, indent=1))
    report(results)
    print(f"total {time.time()-t0:.0f}s")


def report(res):
    md = ["# E3d — galaxy-pair bridge stack (small-scale WHIM design)\n",
          f"Setup: CMASS-N z 0.45–0.55 pairs with transverse separation "
          f"{SEP_T[0]}–{SEP_T[1]} Mpc/h and line-of-sight separation "
          f"< {SEP_LOS} Mpc/h ({res['n_pairs_total']} pairs). Estimator: "
          "y at the pair midpoint minus the mean of the four off-axis "
          "points at identical angular distance from each galaxy "
          "(±90° rotations) — a circularly symmetric halo contributes "
          "zero by construction, so any positive mean is gas that lives "
          "preferentially ON the inter-pair axis. Errors: bootstrap over "
          f"pairs ({N_BOOT} resamples).\n"]
    md.append("| map | pairs used | bridge excess (y) | error | SNR |")
    md.append("|---|---|---|---|---|")
    for m in ("act", "planck"):
        r = res[m]
        md.append(f"| {m.upper()} | {r['n_pairs']} | {r['bridge']:.3e} "
                  f"| {r['err']:.3e} | **{r['snr']:.2f}** |")
    out = ROOT / "docs" / "E3d-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
