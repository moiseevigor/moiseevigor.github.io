#!/usr/bin/env python3
"""E3d-v2: the powered pair-bridge measurement.

Three upgrades over E3d, each attacking a specific weakness:
1. Full CMASS-N redshift range (0.43-0.70) -> ~2.5x the pairs.
2. Disc-averaged sampling: each evaluation point becomes the mean of a
   7-point hexagonal patch (radius 2') -> beats down small-scale map
   noise without washing out a >=6 Mpc/h-wide bridge.
3. Ring controls: off-axis points at +/-60, +/-90, +/-120 degrees around
   EACH galaxy (12 controls/pair) -> lower estimator variance AND less
   second-halo leakage than the +/-90-only version.

Gate: ACT bridge SNR >= 3 -> Model B established at ACT depth;
2-3 sigma -> supported-but-not-decisive; < 2 -> bounded again.
Report -> docs/E3d2-report.md.
"""

import json
import sys
import time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "scripts"))

import run_e3 as e3  # noqa: E402
import run_e3d as d1  # noqa: E402
from run_e3c import CarMap  # noqa: E402

Z_FULL = (0.43, 0.70)
DISC_ARCMIN = 2.0
RING_ANGLES = np.radians([60, 90, 120, -60, -90, -120])
N_BOOT = 500
RNG = np.random.default_rng(23)


def disc_offsets(v, radius_rad):
    """7-point hexagonal patch around each unit vector v."""
    out = [v]
    r = RNG.normal(size=v.shape)  # fixed random tangent frame per point
    r -= v * np.sum(r * v, axis=1, keepdims=True)
    r /= np.linalg.norm(r, axis=1, keepdims=True)
    s = np.cross(v, r)
    for k in range(6):
        a = k * np.pi / 3
        w = v * np.cos(radius_rad) + (r * np.cos(a) + s * np.sin(a)) * np.sin(radius_rad)
        out.append(w)
    return out


def disc_sample(sampler, v):
    vals = np.zeros(len(v))
    for w in disc_offsets(v, np.radians(DISC_ARCMIN / 60)):
        ra, dec = d1.vec_to_radec(w)
        vals += sampler(ra, dec)
    return vals / 7


def bridge_v2(sampler, g1, g2, mid):
    y_mid = disc_sample(sampler, mid)
    y_off = np.zeros_like(y_mid)
    for g in (g1, g2):
        for ang in RING_ANGLES:
            y_off += disc_sample(sampler, d1.unit(d1.rotate_about(mid, g, ang)))
    return y_mid - y_off / (2 * len(RING_ANGLES))


def run(name, sampler, g1v, g2v, midv):
    est = bridge_v2(sampler, g1v, g2v, midv)
    ok = ~np.isnan(est)
    est = est[ok]
    n = len(est)
    boot = np.array([np.mean(est[RNG.integers(0, n, n)]) for _ in range(N_BOOT)])
    mean, err = float(est.mean()), float(boot.std())
    print(f"  {name}: {n} pairs, bridge = {mean:.3e} ± {err:.3e} "
          f"(SNR {mean/err:.2f})")
    return {"n_pairs": n, "bridge": mean, "err": err, "snr": float(mean / err)}


def main():
    t0 = time.time()
    e3.Z_RANGE = Z_FULL          # widen the shell before loading
    print(f"galaxies (z {Z_FULL}) + pairs...")
    ra_g, dec_g, z_g, xyz = e3.load_galaxies()
    print(f"  {len(ra_g)} galaxies")
    pairs, mid_xyz = d1.find_pairs(xyz)
    print(f"  {len(pairs)} pairs")

    g1v = d1.sky_vec(xyz[pairs[:, 0]])
    g2v = d1.sky_vec(xyz[pairs[:, 1]])
    midv = d1.sky_vec(mid_xyz)

    results = {"n_pairs_total": int(len(pairs)), "z_range": Z_FULL,
               "disc_arcmin": DISC_ARCMIN,
               "ring_angles_deg": [60, 90, 120, -60, -90, -120]}
    print("ACT DR6...")
    act = CarMap(ROOT / "data" / "ilc_actplanck_ymap.fits")
    results["act"] = run("ACT", act.sample, g1v, g2v, midv)
    del act

    print("Planck MILCA...")
    import healpy as hp
    ymap = hp.read_map(str(next(ROOT.glob("data/**/*milca*.fits"))), field=0)
    from run_e3b import to_gal

    def planck_sample(ra, dec):
        l, b = to_gal(ra, dec)
        return hp.get_interp_val(ymap, np.radians(90 - b), np.radians(l))
    results["planck"] = run("Planck", planck_sample, g1v, g2v, midv)

    (ROOT / "artifacts" / "e3d2_results.json").write_text(
        json.dumps(results, indent=1))
    report(results)
    print(f"total {time.time()-t0:.0f}s")


def report(res):
    md = ["# E3d-v2 — powered pair-bridge measurement\n",
          f"CMASS-N z {res['z_range'][0]}–{res['z_range'][1]} "
          f"({res['n_pairs_total']} pairs, transverse {d1.SEP_T[0]}–"
          f"{d1.SEP_T[1]} Mpc/h, LOS < {d1.SEP_LOS}). Estimator: "
          f"{res['disc_arcmin']}′-disc-averaged y at the midpoint minus "
          "the mean over ring controls at ±60/±90/±120° around each "
          "galaxy. Bootstrap errors over pairs.\n"]
    md.append("| map | pairs used | bridge excess (y) | error | SNR |")
    md.append("|---|---|---|---|---|")
    for m in ("act", "planck"):
        r = res[m]
        md.append(f"| {m.upper()} | {r['n_pairs']} | {r['bridge']:.3e} "
                  f"| {r['err']:.3e} | **{r['snr']:.2f}** |")
    out = ROOT / "docs" / "E3d2-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
