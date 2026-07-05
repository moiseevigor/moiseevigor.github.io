#!/usr/bin/env python3
"""E3c: the WHIM question at ACT depth.

Repeat the E3b battery (latitude-matched nulls, tracer-halo masking, radial
profile) on the ACT DR6 + Planck ILC Compton-y map (CAR pixelization, 1.6'
beam) over the ACT x BOSS overlap. The decisive change vs Planck-only:
halo gas can be masked at ~3' instead of 7', and the profile resolves
scales an order of magnitude finer — if between-halo gas exists along the
spine networks at detectable levels, this is where it shows.

Report -> docs/E3c-report.md, figure -> docs/figures/e3c_profile.png.
"""

import json
import sys
import time
from pathlib import Path

import numpy as np
from scipy.ndimage import map_coordinates
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "scripts"))

import run_e3 as e3  # noqa: E402
from run_e3b import (b_matched_controls, footprint_pool, gal_to_vec,  # noqa: E402
                     ring_points, to_gal)

N_NULLS = 200
MASK_ARCMIN = [3.0, 7.0]
PROFILE_BINS_ARCMIN = [0, 2, 4, 8, 16, 32]
RNG = np.random.default_rng(13)


class CarMap:
    """Minimal CAR-map sampler (astropy WCS + bilinear interpolation)."""

    def __init__(self, path):
        from astropy.io import fits
        from astropy.wcs import WCS
        hdu = fits.open(path)[0]
        self.data = np.asarray(hdu.data, dtype=np.float32)
        if self.data.ndim > 2:
            self.data = self.data[0]
        self.wcs = WCS(hdu.header).celestial
        self.ny, self.nx = self.data.shape

    def sample(self, ra, dec):
        """Bilinear sample; NaN outside coverage (zeros or out of bounds)."""
        x, y = self.wcs.world_to_pixel_values(ra, dec)
        inside = (x > 0) & (x < self.nx - 1) & (y > 0) & (y < self.ny - 1)
        vals = np.full(len(np.atleast_1d(x)), np.nan)
        if inside.any():
            v = map_coordinates(self.data,
                                [np.atleast_1d(y)[inside],
                                 np.atleast_1d(x)[inside]], order=1)
            v[v == 0.0] = np.nan          # unobserved CAR pixels are 0
            vals[inside] = v
        return vals

    def covered(self, ra, dec):
        return ~np.isnan(self.sample(ra, dec))


def gal_to_radec(b, l):
    from astropy.coordinates import SkyCoord
    import astropy.units as u
    c = SkyCoord(l=l * u.deg, b=b * u.deg, frame="galactic").icrs
    return c.ra.deg, c.dec.deg


def mean_y_act(car, b, l):
    ra, dec = gal_to_radec(b, l)
    v = car.sample(ra, dec)
    return float(np.nanmean(v)), float(np.mean(~np.isnan(v)))


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

    print("loading ACT DR6 y-map...")
    car = CarMap(ROOT / "data" / "ilc_actplanck_ymap.fits")
    print(f"  map {car.ny} x {car.nx}")

    pool_b, pool_l = footprint_pool(ra_g, dec_g)
    # restrict control pool to ACT coverage
    pra, pdec = gal_to_radec(pool_b, pool_l)
    pk = car.covered(pra, pdec)
    pool_b, pool_l = pool_b[pk], pool_l[pk]
    print(f"  control pool in ACT coverage: {pk.mean():.0%}")

    lg_gal, bg_gal = to_gal(ra_g, dec_g)
    gal_tree = cKDTree(gal_to_vec(lg_gal, bg_gal))

    results = {}
    for mname in sky:
        ra_s = np.concatenate(sky[mname][0])
        dec_s = np.concatenate(sky[mname][1])
        l_s, b_s = to_gal(ra_s, dec_s)
        k = car.covered(ra_s, dec_s)
        l_s, b_s = l_s[k], b_s[k]
        print(f"{mname}: {k.mean():.0%} of spine points in ACT coverage "
              f"({k.sum()} used)")
        controls = b_matched_controls(b_s, pool_b, pool_l, N_NULLS)

        sig, _ = mean_y_act(car, b_s, l_s)
        nulls = np.array([mean_y_act(car, cb, cl)[0] for cb, cl in controls])
        rec = {"n_points": int(k.sum()),
               "H3a": {"snr": float((sig - nulls.mean()) / nulls.std()),
                       "stack": sig, "null_mean": float(nulls.mean()),
                       "null_std": float(nulls.std())}}

        for mask_am in MASK_ARCMIN:
            chord = 2 * np.sin(np.radians(mask_am / 60) / 2)

            def unmasked(b_, l_):
                d, _ = gal_tree.query(gal_to_vec(l_, b_))
                return d > chord
            keep = unmasked(b_s, l_s)
            sig_m, _ = mean_y_act(car, b_s[keep], l_s[keep])
            nulls_m = []
            for cb, cl in controls:
                km = unmasked(cb, cl)
                nulls_m.append(mean_y_act(car, cb[km], cl[km])[0])
            nulls_m = np.array(nulls_m)
            rec[f"H3b_{mask_am:g}am"] = {
                "snr": float((sig_m - nulls_m.mean()) / nulls_m.std()),
                "kept_frac": float(keep.mean())}
            print(f"  mask {mask_am:g}': SNR = {rec[f'H3b_{mask_am:g}am']['snr']:.2f} "
                  f"(kept {keep.mean():.0%})")

        prof = []
        for i in range(len(PROFILE_BINS_ARCMIN) - 1):
            theta = 0.5 * (PROFILE_BINS_ARCMIN[i] + PROFILE_BINS_ARCMIN[i + 1]) / 60
            if i == 0:
                theta = PROFILE_BINS_ARCMIN[1] / 2 / 60
            bs, ls = (b_s, l_s) if i == 0 else ring_points(b_s, l_s, theta)
            v_sig, _ = mean_y_act(car, bs, ls)
            v_nul = []
            for cb, cl in controls[:60]:
                cbb, cll = (cb, cl) if i == 0 else ring_points(cb, cl, theta)
                v_nul.append(mean_y_act(car, cbb, cll)[0])
            v_nul = np.array(v_nul)
            prof.append({"theta_arcmin": theta * 60,
                         "excess": float(v_sig - v_nul.mean()),
                         "err": float(v_nul.std()),
                         "snr": float((v_sig - v_nul.mean()) / v_nul.std())})
        rec["profile"] = prof
        results[mname] = rec
        print(f"  H3a SNR = {rec['H3a']['snr']:.2f}")

    (ROOT / "artifacts" / "e3c_results.json").write_text(
        json.dumps(results, indent=1))
    report(results)
    figure(results)
    print(f"total {time.time()-t0:.0f}s")


def figure(results):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(7.5, 4.6))
    for mname, color in [("hessian", "tab:orange"), ("se3_lift", "tab:blue")]:
        p = results[mname]["profile"]
        ax.errorbar([q["theta_arcmin"] for q in p],
                    [q["excess"] for q in p], yerr=[q["err"] for q in p],
                    marker="o", color=color, label=mname, capsize=3)
    ax.axhline(0, color="k", lw=0.8)
    ax.set_xlabel("angular distance from spine network (arcmin)")
    ax.set_ylabel("Compton-y excess over b-matched null")
    ax.set_title("E3c: radial y profile at ACT DR6 resolution (1.6′ beam)")
    ax.legend()
    fig.tight_layout()
    fig.savefig(ROOT / "docs" / "figures" / "e3c_profile.png", dpi=130)
    plt.close(fig)


def report(res):
    md = ["# E3c — the WHIM question at ACT DR6 depth\n",
          "ACT DR6 + Planck ILC Compton-y map (1.6′ beam, CAR), BOSS CMASS "
          "spine networks restricted to the ACT footprint. Same battery as "
          f"E3b: {N_NULLS} latitude-matched nulls; tracer-halo masks at "
          f"{MASK_ARCMIN} arcmin; radial profile bins "
          f"{PROFILE_BINS_ARCMIN} arcmin.\n"]
    md.append("| spine set | n pts in ACT | H3a SNR | H3b 3′ mask (kept) "
              "| H3b 7′ mask (kept) |")
    md.append("|---|---|---|---|---|")
    for m, r in res.items():
        md.append(
            f"| {m} | {r['n_points']} | **{r['H3a']['snr']:.2f}** "
            f"| **{r['H3b_3am']['snr']:.2f}** ({r['H3b_3am']['kept_frac']:.0%}) "
            f"| **{r['H3b_7am']['snr']:.2f}** ({r['H3b_7am']['kept_frac']:.0%}) |")
    md.append("\n![Radial Compton-y excess profile around spine networks at "
              "ACT resolution](figures/e3c_profile.png)\n")
    out = ROOT / "docs" / "E3c-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
