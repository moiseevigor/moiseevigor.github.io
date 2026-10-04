#!/usr/bin/env python3
"""J1c -- bald-patch analysis of Jupiter's reversed patches (referee fix, WP6).

A polarity-inversion line (PIL) is always the footprint of SOME separatrix
structure in the connectivity sense; the substantive question is WHICH kind:
a null-fan DOME (the l = 18 story of Part 8) or a BALD PATCH -- PIL segments
where the field grazes the surface, (B . grad) B_r > 0, giving a separatrix
touching curve with NO null (Titov, Priest & Demoulin 1993). This script
classifies the actual PILs:

  1. JRM33 l = 18, polar patch (under the null at lat +69): BP fraction of
     its boundary -- does the dome coexist with grazing segments?
  2. JRM33 l = 13: the patch survives weakly but the null is GONE. If its
     boundary carries BP segments, the "combination of separatrices" answer
     survives truncation via bald-patch topology instead of a dome.
  3. l = 18 low-latitude patch (null 0), for completeness.

Convention: at a PIL point on the sphere r = R_SURF, B is tangent
(B_r = 0); the point is a bald patch iff the directional derivative of B_r
along B is positive -- field lines touch the surface from above and graze
outward. Numerically: s_bp = [B_r(p + h b_hat) - B_r(p - h b_hat)] / 2h
with b_hat the unit field direction at p.

Out: artifacts/j1c_baldpatch.json + printed fractions.
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
    n_th, n_ph = Br.shape
    mask = Br < 0
    seen = np.zeros_like(mask, bool)
    if not mask[i0, j0]:
        return seen
    stack = [(i0, j0)]
    while stack:
        i, j = stack.pop()
        if i < 0 or i >= n_th or seen[i, j] or not mask[i, j]:
            continue
        seen[i, j] = True
        stack += [(i + 1, j), (i - 1, j), (i, (j + 1) % n_ph), (i, (j - 1) % n_ph)]
    return seen


def boundary_pts(patch, th, ph):
    import scipy.ndimage as ndi
    edge = patch & ~ndi.binary_erosion(patch)
    ii, jj = np.where(edge)
    return np.column_stack([th[ii], ph[jj]])


def sph_to_cart(r, t, p):
    return np.array([r * np.sin(t) * np.cos(p), r * np.sin(t) * np.sin(p),
                     r * np.cos(t)])


def bp_fraction(fld, bd, h=1.5e-3):
    """Fraction of PIL points with (B.grad)Br > 0, plus the signed profile."""
    vals = []
    for t, p in bd:
        x = sph_to_cart(R_SURF, t, p)
        B = fld.B(x)
        nB = np.linalg.norm(B)
        if nB < 1e-9:
            continue
        bhat = B / nB
        # refine onto the PIL: slide along grad(Br) direction so Br ~ 0
        for _ in range(6):
            r_ = np.linalg.norm(x)
            tt = np.arccos(np.clip(x[2] / r_, -1, 1))
            pp = np.arctan2(x[1], x[0])
            br = fld.B_sph(r_, tt, pp)[0]
            # move along the horizontal gradient of Br (numeric, on-sphere)
            e_t = np.array([np.cos(tt) * np.cos(pp), np.cos(tt) * np.sin(pp),
                            -np.sin(tt)])
            e_p = np.array([-np.sin(pp), np.cos(pp), 0.0])
            g_t = (fld.B_sph(r_, tt + 1e-4, pp)[0] - fld.B_sph(r_, tt - 1e-4, pp)[0]) / 2e-4
            g_p = (fld.B_sph(r_, tt, pp + 1e-4)[0] - fld.B_sph(r_, tt, pp - 1e-4)[0]) / (2e-4 * max(np.sin(tt), 1e-6))
            g = g_t * e_t + g_p * e_p
            ng2 = g @ g
            if ng2 < 1e-12:
                break
            x = x - g * (br / ng2) * R_SURF * 1e-0 * 0 - g * (br / ng2)
            x = x * (R_SURF / np.linalg.norm(x))
        B = fld.B(x)
        nB = np.linalg.norm(B)
        if nB < 1e-9:
            continue
        bhat = B / nB
        def br_at(y):
            r_ = np.linalg.norm(y)
            return fld.B_sph(r_, np.arccos(np.clip(y[2] / r_, -1, 1)),
                             np.arctan2(y[1], y[0]))[0]
        s = (br_at(x + h * bhat) - br_at(x - h * bhat)) / (2 * h)
        vals.append(float(s))
    vals = np.array(vals)
    return (float((vals > 0).mean()), vals)


def main():
    out = {}
    # ---- l = 18: the two patches -------------------------------------------------
    f18 = jupfield.JupiterField("jrm33", lmax=18)
    th, ph, Br = br_grid(f18)
    d = json.loads((ROOT / "artifacts" / "j1_jupiter.json").read_text())
    for k, nl in enumerate(d["models"]["jrm33_l18"]["nulls"]):
        colat_n = np.radians(90 - nl["lat"])
        i0 = int(np.argmin(np.abs(th - colat_n)))
        j0 = int(np.argmin(np.abs(ph - np.radians(nl["lon"]))))
        best = None
        for di in range(-12, 13, 2):
            for dj in range(-12, 13, 2):
                i, j = i0 + di, (j0 + dj) % len(ph)
                if 0 <= i < len(th) and Br[i, j] < 0:
                    dd = abs(di) + abs(dj)
                    if best is None or dd < best[0]:
                        best = (dd, i, j)
        patch = flood_patch(Br, best[1], best[2])
        bd = boundary_pts(patch, th, ph)[:: max(1, patch.sum() // 400)]
        frac, vals = bp_fraction(f18, bd)
        tag = f"l18_null{k}_lat{nl['lat']:+.0f}"
        out[tag] = {"n_pil_pts": int(len(vals)), "bp_fraction": round(frac, 3),
                    "median_s": round(float(np.median(vals)), 4)}
        print(f"{tag}: PIL pts {len(vals)}, bald-patch fraction {frac:.3f}, "
              f"median (B.grad)Br {np.median(vals):+.4f}")

    # ---- l = 13: the surviving weak polar patch, null-free ------------------------
    f13 = jupfield.JupiterField("jrm33", lmax=13)
    th13, ph13, Br13 = br_grid(f13)
    nl = d["models"]["jrm33_l18"]["nulls"][1]           # the polar one
    i0 = int(np.argmin(np.abs(th13 - np.radians(90 - nl["lat"]))))
    j0 = int(np.argmin(np.abs(ph13 - np.radians(nl["lon"]))))
    best = None
    for di in range(-20, 21, 2):
        for dj in range(-20, 21, 2):
            i, j = i0 + di, (j0 + dj) % len(ph13)
            if 0 <= i < len(th13) and Br13[i, j] < 0:
                dd = abs(di) + abs(dj)
                if best is None or dd < best[0]:
                    best = (dd, i, j)
    if best is None:
        out["l13_polar"] = None
        print("l13: no polar reversed patch found near the l18 location")
    else:
        patch = flood_patch(Br13, best[1], best[2])
        bd = boundary_pts(patch, th13, ph13)[:: max(1, patch.sum() // 400)]
        frac, vals = bp_fraction(f13, bd)
        out["l13_polar"] = {"n_pil_pts": int(len(vals)),
                            "patch_px": int(patch.sum()),
                            "bp_fraction": round(frac, 3),
                            "median_s": round(float(np.median(vals)), 4)}
        print(f"l13_polar: patch px {patch.sum()}, PIL pts {len(vals)}, "
              f"bald-patch fraction {frac:.3f}, median (B.grad)Br "
              f"{np.median(vals):+.4f}")

    (ROOT / "artifacts" / "j1c_baldpatch.json").write_text(
        json.dumps(out, indent=1) + "\n")
    print("saved artifacts/j1c_baldpatch.json")


if __name__ == "__main__":
    main()
