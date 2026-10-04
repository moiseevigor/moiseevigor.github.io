#!/usr/bin/env python3
"""E3e: validity battery for the 5.2-sigma bridge detection.

A. Sky-patch jackknife errors: pairs overlap on the sky, so pair-bootstrap
   underestimates the variance. Split pairs into ~50 RA patches and use
   delete-one-patch jackknife. Gate: ACT SNR >= 3 with honest errors.
B. Unconnected-pairs null: same transverse window (6-14 Mpc/h) but
   line-of-sight separation 25-40 Mpc/h — same sky geometry, no physical
   bridge. A real signal vanishes; leakage/systematics would not.
C. Transverse-separation bins (connected pairs, ACT): a physical bridge
   declines gently with separation; second-halo leakage falls steeply.

Report -> docs/E3e-report.md.
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
import run_e3d as d1  # noqa: E402
import run_e3d2 as d2  # noqa: E402
from run_e3c import CarMap  # noqa: E402

Z_FULL = (0.43, 0.70)
LOS_NULL = (25.0, 40.0)
N_PATCH = 50


def find_pairs_window(xyz, sep_t, los_lo, los_hi):
    tree = cKDTree(xyz)
    cand = tree.query_pairs(r=np.hypot(sep_t[1], los_hi), output_type="ndarray")
    a, b = xyz[cand[:, 0]], xyz[cand[:, 1]]
    mid = 0.5 * (a + b)
    los_hat = mid / np.linalg.norm(mid, axis=1, keepdims=True)
    d = b - a
    d_los = np.abs(np.sum(d * los_hat, axis=1))
    d_t = np.sqrt(np.maximum(np.sum(d * d, axis=1) - d_los ** 2, 0))
    keep = (d_los >= los_lo) & (d_los < los_hi) & \
           (d_t > sep_t[0]) & (d_t < sep_t[1])
    return cand[keep], mid[keep], d_t[keep]


def jackknife(est, ra_mid, n_patch=N_PATCH):
    """Delete-one-RA-patch jackknife mean and error."""
    edges = np.quantile(ra_mid, np.linspace(0, 1, n_patch + 1))
    patch = np.clip(np.searchsorted(edges, ra_mid) - 1, 0, n_patch - 1)
    total, n = est.sum(), len(est)
    means = []
    for p in range(n_patch):
        m = patch == p
        if m.sum() == 0:
            continue
        means.append((total - est[m].sum()) / (n - m.sum()))
    means = np.array(means)
    k = len(means)
    mean = float(est.mean())
    err = float(np.sqrt((k - 1) / k * np.sum((means - means.mean()) ** 2)))
    return mean, err


def measure(sampler, g1v, g2v, midv, ra_mid, label):
    est = d2.bridge_v2(sampler, g1v, g2v, midv)
    ok = ~np.isnan(est)
    mean, err = jackknife(est[ok], ra_mid[ok])
    print(f"  {label}: {int(ok.sum())} pairs, bridge = {mean:.3e} "
          f"± {err:.3e} (jackknife SNR {mean/err:.2f})")
    return {"n_pairs": int(ok.sum()), "bridge": mean, "err": err,
            "snr": float(mean / err)}


def main():
    t0 = time.time()
    e3.Z_RANGE = Z_FULL
    print("galaxies + pair sets...")
    ra_g, dec_g, z_g, xyz = e3.load_galaxies()
    pc, mid_c, dt_c = find_pairs_window(xyz, d1.SEP_T, 0.0, d1.SEP_LOS)
    pu, mid_u, _ = find_pairs_window(xyz, d1.SEP_T, *LOS_NULL)
    print(f"  connected: {len(pc)}  unconnected(null): {len(pu)}")

    sets = {}
    for name, pairs, mid, dt in [("connected", pc, mid_c, dt_c),
                                 ("null", pu, mid_u, None)]:
        g1v = d1.sky_vec(xyz[pairs[:, 0]])
        g2v = d1.sky_vec(xyz[pairs[:, 1]])
        midv = d1.sky_vec(mid)
        ra_mid, _ = d1.vec_to_radec(midv)
        sets[name] = (g1v, g2v, midv, ra_mid, dt)

    results = {"n_connected": int(len(pc)), "n_null": int(len(pu)),
               "los_null": LOS_NULL, "n_patch": N_PATCH}
    print("ACT DR6...")
    act = CarMap(ROOT / "data" / "ilc_actplanck_ymap.fits")
    for name in ("connected", "null"):
        g1v, g2v, midv, ra_mid, _ = sets[name]
        results[f"act_{name}"] = measure(act.sample, g1v, g2v, midv, ra_mid,
                                         f"ACT {name}")
    # C: separation bins on ACT, connected pairs
    g1v, g2v, midv, ra_mid, dt = sets["connected"]
    est = d2.bridge_v2(act.sample, g1v, g2v, midv)
    bins = [(6, 8), (8, 10), (10, 12), (12, 14)]
    results["act_sep_bins"] = []
    for lo, hi in bins:
        m = (dt >= lo) & (dt < hi) & ~np.isnan(est)
        mean, err = jackknife(est[m], ra_mid[m])
        results["act_sep_bins"].append(
            {"sep": f"{lo}-{hi}", "bridge": mean, "err": err,
             "snr": float(mean / err), "n": int(m.sum())})
        print(f"  ACT sep {lo}-{hi} Mpc/h: {mean:.3e} ± {err:.3e}")
    del act

    print("Planck MILCA...")
    import healpy as hp
    ymap = hp.read_map(str(next(ROOT.glob("data/**/*milca*.fits"))), field=0)
    from run_e3b import to_gal

    def planck_sample(ra, dec):
        l, b = to_gal(ra, dec)
        return hp.get_interp_val(ymap, np.radians(90 - b), np.radians(l))
    for name in ("connected", "null"):
        g1v, g2v, midv, ra_mid, _ = sets[name]
        results[f"planck_{name}"] = measure(planck_sample, g1v, g2v, midv,
                                            ra_mid, f"Planck {name}")

    (ROOT / "artifacts" / "e3e_results.json").write_text(
        json.dumps(results, indent=1))
    report(results)
    print(f"total {time.time()-t0:.0f}s")


def report(res):
    md = ["# E3e — validity battery for the bridge detection\n",
          f"Jackknife errors over {res['n_patch']} RA patches (pairs overlap "
          "on the sky, so pair-bootstrap is too optimistic). Null pairs: "
          f"same transverse window, line-of-sight separation "
          f"{res['los_null'][0]:.0f}–{res['los_null'][1]:.0f} Mpc/h — same "
          "sky geometry, no physical bridge.\n"]
    md.append("| map | pair set | n | bridge (y) | jackknife err | SNR |")
    md.append("|---|---|---|---|---|---|")
    for m in ("act", "planck"):
        for s in ("connected", "null"):
            r = res[f"{m}_{s}"]
            md.append(f"| {m.upper()} | {s} | {r['n_pairs']} "
                      f"| {r['bridge']:.3e} | {r['err']:.3e} "
                      f"| **{r['snr']:.2f}** |")
    md.append("\n## ACT bridge vs transverse separation (connected pairs)\n")
    md.append("| separation (Mpc/h) | n | bridge (y) | err | SNR |")
    md.append("|---|---|---|---|---|")
    for b in res["act_sep_bins"]:
        md.append(f"| {b['sep']} | {b['n']} | {b['bridge']:.3e} "
                  f"| {b['err']:.3e} | {b['snr']:.2f} |")
    out = ROOT / "docs" / "E3e-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
