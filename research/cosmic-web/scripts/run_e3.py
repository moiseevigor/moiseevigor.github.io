#!/usr/bin/env python3
"""E3 (first pass): real data — BOSS CMASS galaxies x Planck lensing / tSZ.

Pipeline
--------
1. CMASS-North galaxies, redshift shell z in [0.45, 0.55] -> comoving
   Cartesian (flat LCDM, Om=0.31, units Mpc/h), voxelized into a 512 Mpc/h
   cube at 4 Mpc/h voxels (128^3), CIC + log + adaptive smoothing.
2. Spines at matched length with BOTH methods (Hessian, SE(3) lift).
3. M3-real: alignment of spine tangents with the tidal eigenframe of the
   observed field (isotropic null 0.5).
4. Mass/gas cross-signal: stack the Planck 2018 lensing convergence map and
   the Planck MILCA Compton-y map at the sky positions of the spine voxels;
   null distribution from RA-rotated controls constrained to the survey
   footprint; SNR = (stack - mean_null) / std_null.

First-pass honesty: no systematics weights, single redshift shell,
footprint approximated by galaxy-occupied HEALPix cells, projection through
a ~250 Mpc/h shell dilutes the signal. A detection is a bonus; the primary
readout is M3-real and the lift-vs-Hessian comparison at equal length.

Report -> docs/E3-report.md.
"""

import json
import sys
import tarfile
import time
from pathlib import Path

import numpy as np
from scipy.integrate import quad
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
sys.path.insert(0, str(ROOT / "src"))

import fields, lift, spines  # noqa: E402

OM, H0 = 0.31, 100.0  # Mpc/h units
Z_RANGE = (0.45, 0.55)
BOX = 512.0           # Mpc/h
NGRID = 128           # -> 4 Mpc/h voxels
N_TARGET = 2400
N_CONTROLS = 200
_AXES = lift.hemisphere_axes(42)


def comoving_distance(z):
    integrand = lambda zz: 1.0 / np.sqrt(OM * (1 + zz) ** 3 + 1 - OM)
    return 299792.458 / H0 * quad(integrand, 0, z)[0]


def load_galaxies():
    from astropy.io import fits
    with fits.open(DATA / "galaxy_DR12v5_CMASS_North.fits.gz") as f:
        d = f[1].data
        ra, dec, z = d["RA"], d["DEC"], d["Z"]
    m = (z > Z_RANGE[0]) & (z < Z_RANGE[1])
    ra, dec, z = ra[m], dec[m], z[m]
    zg = np.linspace(Z_RANGE[0] - 0.01, Z_RANGE[1] + 0.01, 60)
    chi_i = np.array([comoving_distance(zz) for zz in zg])
    chi = np.interp(z, zg, chi_i)
    th, ph = np.radians(90 - dec), np.radians(ra)
    xyz = np.stack([chi * np.sin(th) * np.cos(ph),
                    chi * np.sin(th) * np.sin(ph),
                    chi * np.cos(th)], axis=1)
    return ra, dec, z, xyz


def tile_origins(xyz, min_gal=5000):
    """Non-overlapping BOX^3 tiles covering the sample; keep tiles with at
    least min_gal galaxies."""
    lo = xyz.min(axis=0)
    idx = np.floor((xyz - lo) / BOX).astype(int)
    origins = []
    for key in {tuple(i) for i in idx}:
        origin = lo + np.array(key) * BOX
        n = int(np.all((xyz >= origin) & (xyz < origin + BOX), axis=1).sum())
        if n >= min_gal:
            origins.append((origin, n))
    return origins


def build_field(xyz, origin):
    """BOX^3 cube at origin -> CIC density field."""
    inbox = np.all((xyz >= origin) & (xyz < origin + BOX), axis=1)
    pos_vox = (xyz[inbox] - origin) / (BOX / NGRID)
    n_gal = int(inbox.sum())
    field = fields.cic_deposit(pos_vox, NGRID)
    from scipy.ndimage import gaussian_filter
    sig = max(1.0, 0.35 * (NGRID ** 3 / n_gal) ** (1 / 3))
    field = gaussian_filter(np.log1p(field), sig, mode="nearest")
    return field, n_gal


def spine_sets(field):
    out = {}
    out["hessian"] = spines.skeleton_points(spines.extract_matched(
        spines.hessian_ridgeness(field, 1.5), N_TARGET, lo_frac=1.0))
    U = lift.orientation_score(field, _AXES, 6.0, 1.5)
    out["se3_lift"] = spines.skeleton_points(spines.extract_matched(
        spines.lifted_ridgeness(U), N_TARGET, lo_frac=1.0))
    return out


def spine_tangent_alignment(pts, field):
    e3 = fields.tidal_frame(field)
    tree = cKDTree(pts)
    tans, keep = [], []
    for i, p in enumerate(pts):
        nb = pts[tree.query_ball_point(p, 3.0)]
        if len(nb) < 3:
            continue
        c = nb - nb.mean(0)
        tans.append(np.linalg.svd(c, full_matrices=False)[2][0])
        keep.append(i)
    tans = np.array(tans)
    idx = np.clip(np.round(pts[keep]).astype(int), 0, field.shape[0] - 1)
    e = e3[idx[:, 0], idx[:, 1], idx[:, 2]]
    return float(np.mean(np.abs(np.sum(tans * e, axis=1))))


def vox_to_radec(pts, origin):
    xyz = pts * (BOX / NGRID) + origin
    r = np.linalg.norm(xyz, axis=1)
    dec = 90 - np.degrees(np.arccos(xyz[:, 2] / r))
    ra = np.degrees(np.arctan2(xyz[:, 1], xyz[:, 0])) % 360
    return ra, dec


def radec_to_gal_vec(ra, dec):
    from astropy.coordinates import SkyCoord
    import astropy.units as u
    g = SkyCoord(ra=ra * u.deg, dec=dec * u.deg, frame="icrs").galactic
    return np.radians(90 - g.b.deg), np.radians(g.l.deg)


def load_maps():
    import healpy as hp
    maps = {}
    # lensing: klm alms -> smoothed kappa map
    tgz = DATA / "COM_Lensing_4096_R3.00.tgz"
    lens_dir = DATA / "lensing"
    if not lens_dir.exists():
        with tarfile.open(tgz) as t:
            t.extractall(DATA)
    klm_file = next(DATA.glob("**/dat_klm.fits"))
    klm = hp.read_alm(str(klm_file))
    kappa = hp.alm2map(klm, nside=1024, lmax=2048)
    maps["kappa"] = hp.smoothing(kappa, fwhm=np.radians(10 / 60), lmax=2048)
    # Compton-y (MILCA full) from the YSZ component-map tarball
    ycands = list(DATA.glob("**/*milca*ymap*.fits")) + \
        list(DATA.glob("**/*ymaps*milca*.fits"))
    if not ycands:
        ytgz = next(DATA.glob("COM_CompMap_YSZ_*.tgz"))
        with tarfile.open(ytgz) as t:
            t.extractall(DATA)
        ycands = list(DATA.glob("**/*milca*.fits"))
    maps["y"] = hp.read_map(str(ycands[0]), field=0)
    return maps


def footprint_mask(ra, dec, nside=64):
    import healpy as hp
    th, ph = radec_to_gal_vec(ra, dec)
    pix = hp.ang2pix(nside, th, ph)
    mask = np.zeros(hp.nside2npix(nside), bool)
    mask[np.unique(pix)] = True
    return mask


def stack(map_, ra, dec, footprint, rng, n_controls=N_CONTROLS):
    import healpy as hp
    nside = hp.get_nside(map_)

    def sample(ra_, dec_):
        th, ph = radec_to_gal_vec(ra_, dec_)
        ok = footprint[hp.ang2pix(64, th, ph)]
        if ok.mean() < 0.9:
            return None
        return float(np.mean(hp.get_interp_val(map_, th[ok], ph[ok])))

    signal = sample(ra, dec)
    nulls = []
    tries = 0
    while len(nulls) < n_controls and tries < n_controls * 10:
        tries += 1
        v = sample((ra + rng.uniform(5, 355)) % 360,
                   dec if rng.random() < 0.5 else
                   dec.mean() * 2 - dec)  # RA rotation +/- DEC reflection
        if v is not None:
            nulls.append(v)
    nulls = np.array(nulls)
    return {"stack": signal, "null_mean": float(nulls.mean()),
            "null_std": float(nulls.std()), "n_controls": len(nulls),
            "snr": float((signal - nulls.mean()) / nulls.std())}


def main():
    t0 = time.time()
    print("loading galaxies...")
    ra_g, dec_g, z_g, xyz = load_galaxies()
    print(f"  {len(ra_g)} CMASS-N galaxies in z {Z_RANGE}")

    tiles = tile_origins(xyz)
    print(f"  {len(tiles)} tiles with >= 5000 galaxies "
          f"({sum(n for _, n in tiles)} galaxies used)")

    all_sky = {"hessian": [[], []], "se3_lift": [[], []]}
    aligns = {"hessian": [], "se3_lift": []}
    for i, (origin, n) in enumerate(tiles):
        field, n_gal = build_field(xyz, origin)
        sets = spine_sets(field)
        for mname, pts in sets.items():
            aligns[mname].append(spine_tangent_alignment(pts, field))
            ra_s, dec_s = vox_to_radec(pts, origin)
            all_sky[mname][0].append(ra_s)
            all_sky[mname][1].append(dec_s)
        print(f"  tile {i+1}/{len(tiles)} ({n} gal) done")

    align = {m: float(np.mean(v)) for m, v in aligns.items()}
    align_sd = {m: float(np.std(v)) for m, v in aligns.items()}
    print("  alignment (mean over tiles):", align)

    print("loading Planck maps...")
    maps = load_maps()
    fp = footprint_mask(ra_g, dec_g)
    rng = np.random.default_rng(1)

    results = {"n_gal_shell": len(ra_g), "n_tiles": len(tiles),
               "n_gal_used": int(sum(n for _, n in tiles)),
               "alignment_e3": align, "alignment_e3_sd": align_sd,
               "stacks": {}}
    for mname in all_sky:
        ra_s = np.concatenate(all_sky[mname][0])
        dec_s = np.concatenate(all_sky[mname][1])
        for mapname in ("kappa", "y"):
            key = f"{mname}_{mapname}"
            results["stacks"][key] = stack(maps[mapname], ra_s, dec_s, fp, rng)
            print(f"  {key}: SNR = {results['stacks'][key]['snr']:.2f} "
                  f"({len(ra_s)} spine points)")

    (ROOT / "artifacts" / "e3_results.json").write_text(
        json.dumps(results, indent=1))
    report(results)
    print(f"total {time.time()-t0:.0f}s")


def report(res):
    md = ["# E3 — BOSS CMASS × Planck lensing/tSZ (tiled shell)\n",
          f"Setup: CMASS-North, z ∈ [{Z_RANGE[0]}, {Z_RANGE[1]}] "
          f"({res['n_gal_shell']} galaxies; {res['n_gal_used']} used across "
          f"{res['n_tiles']} tiles of {BOX:.0f} Mpc/h at "
          f"{BOX/NGRID:.0f} Mpc/h voxels). "
          f"Spines at matched length ({N_TARGET} vox per tile), both methods. "
          "Stacks: mean map value at spine sky positions vs "
          f"{N_CONTROLS} footprint-constrained RA-rotated/DEC-reflected "
          "controls. First pass: no systematics weights, single shell, "
          "projected through the full shell depth.\n"]
    md.append("## M3 on real data (spine–tidal-frame alignment, null 0.5)\n")
    for m, a in res["alignment_e3"].items():
        md.append(f"- **{m}**: {a:.3f} ± {res['alignment_e3_sd'][m]:.3f} "
                  f"(mean ± sd over tiles)")
    md.append("\n## Cross-signal stacks\n")
    md.append("| spine set | map | stack | null mean ± std | SNR |")
    md.append("|---|---|---|---|---|")
    for key, s in res["stacks"].items():
        mname, mapname = key.rsplit("_", 1)
        md.append(f"| {mname} | {mapname} | {s['stack']:.3e} "
                  f"| {s['null_mean']:.3e} ± {s['null_std']:.3e} "
                  f"| **{s['snr']:.2f}** |")
    md.append("\nReading: positive SNR means the spine network sits on "
              "more lensing convergence / hot gas than footprint-matched "
              "random placements. H3 asks whether the lift's spines carry "
              "at least the Hessian's signal at equal length.\n")
    out = ROOT / "docs" / "E3-report.md"
    out.write_text("\n".join(md) + "\n")
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
