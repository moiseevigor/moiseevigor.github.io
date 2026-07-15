#!/usr/bin/env python3
"""J1b -- score each Jupiter envelope null's dome against ITS OWN patch.

Refines H-J2: the J1 headline metric pooled every reversed patch north of
30N against pooled footprints. Here each null is associated with the
connected Br<0 region (at the dynamo surface R_SURF) beneath it, and its
dome is scored two ways (boundary -> nearest footprint, footprint ->
nearest boundary). Also records where the two spine lines land, and runs
the co-robustness check for H-J4: does the PATCH itself (not just the
null) survive truncation to lmax = 13 and the switch to JRM09?

Out: artifacts/j1b_dome.json.
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import jupfield  # noqa: E402

R_SURF = 0.85


def br_grid(fld, n_th=241, n_ph=481, colat_max=120.0):
    th = np.radians(np.linspace(0.5, colat_max, n_th))
    ph = np.radians(np.linspace(0, 360, n_ph))
    Br = np.empty((n_th, n_ph))
    for i, t in enumerate(th):
        for j, p_ in enumerate(ph):
            Br[i, j] = fld.B_sph(R_SURF, t, p_)[0]
    return th, ph, Br


def flood_patch(Br, i0, j0):
    """Connected Br<0 region containing (i0, j0); wraps in longitude."""
    n_th, n_ph = Br.shape
    mask = Br < 0
    seen = np.zeros_like(mask, bool)
    stack = [(i0, j0)]
    if not mask[i0, j0]:
        return seen
    while stack:
        i, j = stack.pop()
        if i < 0 or i >= n_th or seen[i, j] or not mask[i, j]:
            continue
        seen[i, j] = True
        stack += [(i + 1, j), (i - 1, j),
                  (i, (j + 1) % n_ph), (i, (j - 1) % n_ph)]
    return seen


def boundary_pts(patch, th, ph):
    """(colat_deg, lon_deg) of patch-edge pixels."""
    import scipy.ndimage as ndi
    edge = patch & ~ndi.binary_erosion(patch)
    ii, jj = np.where(edge)
    return np.column_stack([np.degrees(th[ii]), np.degrees(ph[jj])])


def ang_dist(colat1, lon1, colat2, lon2):
    t1, t2 = np.radians(colat1), np.radians(colat2)
    dp = np.radians(lon1 - lon2)
    c = np.cos(t1) * np.cos(t2) + np.sin(t1) * np.sin(t2) * np.cos(dp)
    return np.degrees(np.arccos(np.clip(c, -1, 1)))


def main():
    d = json.loads((ROOT / "artifacts" / "j1_jupiter.json").read_text())
    npz = np.load(ROOT / "artifacts" / "j1_maps.npz", allow_pickle=True)
    feet = npz["feet"]                      # (colat, lon) pooled
    feet_id = npz["feet_null_id"]
    nulls = d["models"]["jrm33_l18"]["nulls"]

    fld = jupfield.JupiterField("jrm33", lmax=18)
    th, ph, Br = br_grid(fld)
    out = {"nulls": []}
    for k, nl in enumerate(nulls):
        colat_n = 90 - nl["lat"]
        i0 = int(np.argmin(np.abs(np.degrees(th) - colat_n)))
        j0 = int(np.argmin(np.abs(np.degrees(ph) - nl["lon"])))
        # search a small neighbourhood for the patch (the null need not sit
        # exactly over the deepest negative pixel)
        best = None
        for di in range(-12, 13, 2):
            for dj in range(-12, 13, 2):
                i, j = i0 + di, (j0 + dj) % len(ph)
                if 0 <= i < len(th) and Br[i, j] < 0:
                    dd = abs(di) + abs(dj)
                    if best is None or dd < best[0]:
                        best = (dd, i, j)
        if best is None:
            out["nulls"].append({"null": nl, "patch": None})
            print(f"null {k} (lat {nl['lat']}): no reversed patch beneath")
            continue
        patch = flood_patch(Br, best[1], best[2])
        bd = boundary_pts(patch, th, ph)
        area_frac = patch.mean()
        fk = feet[feet_id == k]
        d_b2f = np.array([ang_dist(b[0], b[1], fk[:, 0], fk[:, 1]).min()
                          for b in bd])
        d_f2b = np.array([ang_dist(f[0], f[1], bd[:, 0], bd[:, 1]).min()
                          for f in fk])
        rec = {"lat": nl["lat"], "lon": nl["lon"], "r": nl["r"],
               "patch_n_px": int(patch.sum()),
               "patch_colat_range": [round(float(np.degrees(th[np.where(patch)[0]]).min()), 1),
                                     round(float(np.degrees(th[np.where(patch)[0]]).max()), 1)],
               "boundary_to_foot_deg": {
                   "median": round(float(np.median(d_b2f)), 2),
                   "p90": round(float(np.percentile(d_b2f, 90)), 2),
                   "max": round(float(d_b2f.max()), 2)},
               "foot_to_boundary_deg": {
                   "median": round(float(np.median(d_f2b)), 2),
                   "p90": round(float(np.percentile(d_f2b, 90)), 2),
                   "max": round(float(d_f2b.max()), 2)}}
        out["nulls"].append(rec)
        print(f"null {k}: lat {nl['lat']:+.1f} lon {nl['lon']:.1f} "
              f"r={nl['r']}  patch px {patch.sum()} "
              f"(colat {rec['patch_colat_range']})")
        print(f"  boundary->footprint deg: {rec['boundary_to_foot_deg']}")
        print(f"  footprint->boundary deg: {rec['foot_to_boundary_deg']}")

        # spine endpoints
        spines = npz["spines"]
        sid = npz["spine_null_id"]
        ends = []
        for ln in spines[sid == k]:
            e = np.asarray(ln)[-1]
            r = float(np.linalg.norm(e))
            colat = float(np.degrees(np.arccos(np.clip(e[2] / r, -1, 1))))
            lon = float(np.degrees(np.arctan2(e[1], e[0])) % 360)
            inside = False
            if r <= R_SURF + 0.02:
                ii = int(np.argmin(np.abs(np.degrees(th) - colat)))
                jj = int(np.argmin(np.abs(np.degrees(ph) - lon)))
                inside = bool(patch[ii, jj])
            ends.append({"r": round(r, 3), "colat": round(colat, 1),
                         "lon": round(lon, 1),
                         "lands": ("surface-inside-patch" if inside
                                   else "surface-outside" if r <= R_SURF + 0.02
                                   else "escapes")})
        rec["spine_ends"] = ends
        print(f"  spine ends: {ends}")

    # ---- co-robustness: does the PATCH survive l13 / JRM09? ---------------------
    rob = {}
    for tag, model, lmax in (("jrm33_l13", "jrm33", 13),
                             ("jrm09_l10", "jrm09", 10)):
        f2 = jupfield.JupiterField(model, lmax=lmax)
        checks = []
        for k, nl in enumerate(nulls):
            colat_n = 90 - nl["lat"]
            vals = []
            for dth in (-4, 0, 4):
                for dph in (-6, 0, 6):
                    vals.append(f2.B_sph(R_SURF, np.radians(colat_n + dth),
                                         np.radians(nl["lon"] + dph))[0])
            checks.append({"null": k,
                           "min_Br_G": round(min(vals) * 1e-5, 2),
                           "reversed_flux_present": bool(min(vals) < 0)})
        rob[tag] = checks
        print(f"{tag}: patch presence under the l18 nulls -> {checks}")
    out["patch_robustness"] = rob

    (ROOT / "artifacts" / "j1b_dome.json").write_text(
        json.dumps(out, indent=1) + "\n")
    print("saved artifacts/j1b_dome.json")


if __name__ == "__main__":
    main()
