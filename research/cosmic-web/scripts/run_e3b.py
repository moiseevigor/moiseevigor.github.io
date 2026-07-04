#!/usr/bin/env python3
"""E3b: second-pass tests of the E3 Compton-y detection.

H3a (foreground robustness): re-test the stack against nulls that PRESERVE
    the galactic-latitude distribution — control points are drawn uniformly
    inside the survey footprint but rejection-matched to the spine points'
    b-histogram (2 deg bins). A latitude-dependent y foreground can no
    longer inflate the SNR.
H3b (WHIM component): mask all sky within theta_mask of ANY shell galaxy
    (the tracer halos) and stack only surviving spine points; nulls masked
    identically. A surviving excess is gas between halos.
H3c (extended profile): mean y vs angular distance from the spine network
    (rings at random azimuth around each spine point), signal minus
    b-matched null, per bin. Filament signature = extended profile.

Uses the spine sets regenerated exactly as in run_e3 (same tiles, same
methods). Report -> docs/E3b-report.md, figure -> docs/figures/e3b_profile.png.
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

import run_e3 as e3  # noqa: E402  (reuse loaders, tiling, spine sets)

N_NULLS = 200
THETA_MASK_ARCMIN = 7.0
PROFILE_BINS_ARCMIN = [0, 5, 10, 20, 40, 80]
RNG = np.random.default_rng(11)


def to_gal(ra, dec):
    from astropy.coordinates import SkyCoord
    import astropy.units as u
    g = SkyCoord(ra=ra * u.deg, dec=dec * u.deg, frame="icrs").galactic
    return g.l.deg, g.b.deg


def gal_to_vec(l, b):
    th, ph = np.radians(90 - b), np.radians(l)
    return np.stack([np.sin(th) * np.cos(ph), np.sin(th) * np.sin(ph),
                     np.cos(th)], axis=1)


def footprint_pool(ra_g, dec_g, n_pool=400000, nside=64):
    """Uniform random sky points inside the galaxy-occupied footprint."""
    import healpy as hp
    lg, bg = to_gal(ra_g, dec_g)
    occ = np.unique(hp.ang2pix(nside, np.radians(90 - bg), np.radians(lg)))
    pix = occ[RNG.integers(0, len(occ), n_pool)]
    th, ph = hp.pix2ang(nside, pix)
    # jitter within ~pixel scale
    scale = np.sqrt(hp.nside2pixarea(nside))
    th = np.clip(th + RNG.normal(0, scale / 2, n_pool), 1e-4, np.pi - 1e-4)
    ph = (ph + RNG.normal(0, scale / 2, n_pool)) % (2 * np.pi)
    keep = np.isin(hp.ang2pix(nside, th, ph), occ)
    return 90 - np.degrees(th[keep]), np.degrees(ph[keep])  # b, l


def b_matched_controls(b_sig, pool_b, pool_l, n_nulls, bin_deg=2.0):
    """Draw n_nulls control sets from the pool, matching the signal's
    b-histogram."""
    edges = np.arange(pool_b.min() - bin_deg, pool_b.max() + 2 * bin_deg, bin_deg)
    sig_counts, _ = np.histogram(b_sig, edges)
    pool_bin = np.digitize(pool_b, edges) - 1
    by_bin = {i: np.where(pool_bin == i)[0] for i in range(len(edges) - 1)
              if (pool_bin == i).any()}
    controls = []
    for _ in range(n_nulls):
        idx = []
        for i, c in enumerate(sig_counts):
            if c == 0 or i not in by_bin:
                continue
            idx.append(RNG.choice(by_bin[i], size=c, replace=True))
        idx = np.concatenate(idx)
        controls.append((pool_b[idx], pool_l[idx]))
    return controls


def mean_y(ymap, b, l):
    import healpy as hp
    return float(np.mean(hp.get_interp_val(
        ymap, np.radians(90 - b), np.radians(l))))


def ring_points(b, l, theta_deg):
    """One random-azimuth point at angular distance theta from each (b,l)."""
    v = gal_to_vec(l, b)
    # random orthogonal direction
    r = RNG.normal(size=v.shape)
    r -= v * np.sum(r * v, axis=1, keepdims=True)
    r /= np.linalg.norm(r, axis=1, keepdims=True)
    w = v * np.cos(np.radians(theta_deg)) + r * np.sin(np.radians(theta_deg))
    b2 = 90 - np.degrees(np.arccos(np.clip(w[:, 2], -1, 1)))
    l2 = np.degrees(np.arctan2(w[:, 1], w[:, 0])) % 360
    return b2, l2


def main():
    t0 = time.time()
    print("galaxies + tiles + spines (as in E3)...")
    ra_g, dec_g, z_g, xyz = e3.load_galaxies()
    tiles = e3.tile_origins(xyz)
    sky = {"hessian": [[], []], "se3_lift": [[], []]}
    for origin, n in tiles:
        field, _ = e3.build_field(xyz, origin)
        for mname, pts in e3.spine_sets(field).items():
            ra_s, dec_s = e3.vox_to_radec(pts, origin)
            sky[mname][0].append(ra_s)
            sky[mname][1].append(dec_s)
    print(f"  {len(tiles)} tiles done")

    print("maps + pools...")
    maps = e3.load_maps()
    ymap = maps["y"]
    pool_b, pool_l = footprint_pool(ra_g, dec_g)
    lg_gal, bg_gal = to_gal(ra_g, dec_g)
    gal_tree = cKDTree(gal_to_vec(lg_gal, bg_gal))
    chord_mask = 2 * np.sin(np.radians(THETA_MASK_ARCMIN / 60) / 2)

    results = {}
    for mname in sky:
        ra_s = np.concatenate(sky[mname][0])
        dec_s = np.concatenate(sky[mname][1])
        l_s, b_s = to_gal(ra_s, dec_s)
        controls = b_matched_controls(b_s, pool_b, pool_l, N_NULLS)

        # H3a: b-matched stack
        sig = mean_y(ymap, b_s, l_s)
        nulls = np.array([mean_y(ymap, cb, cl) for cb, cl in controls])
        h3a = {"snr": float((sig - nulls.mean()) / nulls.std()),
               "stack": sig, "null_mean": float(nulls.mean()),
               "null_std": float(nulls.std())}

        # H3b: tracer-halo masking (same mask on signal and nulls)
        def unmasked(b_, l_):
            d, _ = gal_tree.query(gal_to_vec(l_, b_))
            return d > chord_mask
        keep = unmasked(b_s, l_s)
        sig_m = mean_y(ymap, b_s[keep], l_s[keep])
        nulls_m = []
        for cb, cl in controls:
            k = unmasked(cb, cl)
            nulls_m.append(mean_y(ymap, cb[k], cl[k]))
        nulls_m = np.array(nulls_m)
        h3b = {"snr": float((sig_m - nulls_m.mean()) / nulls_m.std()),
               "kept_frac": float(keep.mean()),
               "stack": sig_m, "null_mean": float(nulls_m.mean()),
               "null_std": float(nulls_m.std())}

        # H3c: radial profile (signal - null, per ring)
        prof = []
        for i in range(len(PROFILE_BINS_ARCMIN) - 1):
            theta = 0.5 * (PROFILE_BINS_ARCMIN[i] + PROFILE_BINS_ARCMIN[i + 1]) / 60
            if theta == 0:
                theta = PROFILE_BINS_ARCMIN[1] / 2 / 60
            bs, ls = (b_s, l_s) if i == 0 else ring_points(b_s, l_s, theta)
            v_sig = mean_y(ymap, bs, ls)
            v_nul = []
            for cb, cl in controls[:60]:
                cbb, cll = (cb, cl) if i == 0 else ring_points(cb, cl, theta)
                v_nul.append(mean_y(ymap, cbb, cll))
            v_nul = np.array(v_nul)
            prof.append({"theta_arcmin": theta * 60,
                         "excess": float(v_sig - v_nul.mean()),
                         "err": float(v_nul.std()),
                         "snr": float((v_sig - v_nul.mean()) / v_nul.std())})
        results[mname] = {"H3a": h3a, "H3b": h3b, "profile": prof,
                          "n_points": len(b_s)}
        print(f"  {mname}: H3a SNR={h3a['snr']:.2f}  "
              f"H3b SNR={h3b['snr']:.2f} (kept {h3b['kept_frac']:.0%})")

    (ROOT / "artifacts" / "e3b_results.json").write_text(
        json.dumps(results, indent=1))
    report(results)
    profile_figure(results)
    print(f"total {time.time()-t0:.0f}s")


def profile_figure(results):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(7.5, 4.6))
    for mname, color in [("hessian", "tab:orange"), ("se3_lift", "tab:blue")]:
        p = results[mname]["profile"]
        th = [q["theta_arcmin"] for q in p]
        ax.errorbar(th, [q["excess"] for q in p], yerr=[q["err"] for q in p],
                    marker="o", color=color, label=mname, capsize=3)
    ax.axhline(0, color="k", lw=0.8)
    ax.set_xlabel("angular distance from spine network (arcmin)")
    ax.set_ylabel("Compton-y excess over b-matched null")
    ax.set_title("E3b: radial y profile around spine networks "
                 "(errors = null scatter)")
    ax.legend()
    fig.tight_layout()
    fig.savefig(ROOT / "docs" / "figures" / "e3b_profile.png", dpi=130)
    plt.close(fig)


def report(res):
    md = ["# E3b — second-pass tests of the Compton-y detection\n",
          f"Nulls: {N_NULLS} control sets drawn inside the survey footprint "
          "and rejection-matched to the spine points' galactic-latitude "
          "histogram (2° bins) — a latitude-dependent foreground cannot "
          f"inflate these. Tracer mask: {THETA_MASK_ARCMIN}′ around every "
          "shell galaxy, applied identically to signal and nulls.\n"]
    md.append("| spine set | H3a: b-matched SNR | H3b: halo-masked SNR "
              "(kept) | n spine points |")
    md.append("|---|---|---|---|")
    for m, r in res.items():
        md.append(f"| {m} | **{r['H3a']['snr']:.2f}** "
                  f"| **{r['H3b']['snr']:.2f}** ({r['H3b']['kept_frac']:.0%}) "
                  f"| {r['n_points']} |")
    md.append("\n![Radial Compton-y excess profile around spine networks, "
              "signal minus latitude-matched null vs angular distance, "
              "both methods](figures/e3b_profile.png)\n")
    md.append("Reading: H3a tests foreground robustness; H3b isolates gas "
              "away from the tracer halos (WHIM candidate); the profile "
              "shape (H3c) separates extended filament gas from "
              "point-source-like halo gas.\n")
    out = ROOT / "docs" / "E3b-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
