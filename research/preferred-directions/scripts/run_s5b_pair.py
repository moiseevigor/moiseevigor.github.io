#!/usr/bin/env python3
"""P4-S5b -- the solar transition-state pair, and the fold pinned by
boundary-data continuation (follow-up to the S5 census; pre-registered).

The S5 census exposed two things in the AR11429 wide volume:
(a) a persistent opposite-degree null pair near window (33, 194) at healthy
    heights (z ~ 8-12 px) with separation ~ 1.6 px -- at the finder's dedup
    radius, so the raw census kept half-erasing it;
(b) a candidate pair annihilation near (28, 190, z~3) bracketed by the
    measured frames 01:01 and 01:13 UT (its two members' co-death is
    ambiguous at 6-min cadence).

H-S5b-1 (the inhabited transition state): a fine-dedup census of the small
subvolume around (a) tracks ONE opposite-degree pair through all 32 frames;
its separation stays of order a few px through both X-flares -- a stable
nearly-degenerate configuration, i.e. the fold's neighbourhood is inhabited
but not crossed. Falsified if the pair loses identity or its separation is
finder noise (window-shift test).

H-S5b-2 (the fold, pinned): linearly blending the two measured boundary
magnetograms that bracket (b), cut(s) = (1-s) cut_A + s cut_B, and tracking
the pair through s in [0,1] catches a genuine fold: separation
C sqrt(s_c - s), opposite degrees, det gradB -> 0, and the SR 2-jet at the
collision reads the fold plateau. The path is a straight line in
boundary-data space between two MEASUREMENTS 12 minutes apart -- the real
Sun crossed from one side to the other; the blend exhibits where.

Out: artifacts/s5b_pair.json. Figures: render_s45_figures.py.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))

import solar          # noqa: E402
import bifurcation as bif  # noqa: E402

WINL, CUTL, NZL = 360, 225, 64
FLUX_C0 = (640.0, 640.0)
NULL_C0 = (647.0, 698.0)
OMEGA = np.radians(13.3 / 1440.0)
BOX = dict(x=(22.0, 45.0), y=(183.0, 206.0), z=(2.0, 20.0))   # pair subvolume


def read2d(f):
    from astropy.io import fits
    hdul = fits.open(f); hdul.verify("silentfix")
    h = next(h for h in hdul if getattr(h, "data", None) is not None
             and h.data.ndim == 2)
    return np.nan_to_num(np.asarray(h.data, float)), h.header


def hmi_geom(hdr):
    s4 = 1024.0 / hdr["NAXIS1"]
    return ((hdr["CRPIX1"] - 1) * s4, (hdr["CRPIX2"] - 1) * s4,
            hdr["RSUN_OBS"] / hdr["CDELT1"] * s4)


def rotate_hmi_pt(p0_xy, g0, gk, dmin):
    (hcx0, hcy0, hR0), (hcxk, hcyk, hRk) = g0, gk
    rx = -(p0_xy[0] - hcx0) / hR0
    ry = -(p0_xy[1] - hcy0) / hR0
    rz = np.sqrt(max(1 - rx * rx - ry * ry, 0.0))
    a = OMEGA * dmin
    rx2 = rx * np.cos(a) + rz * np.sin(a)
    return (hcxk - rx2 * hRk, hcyk - ry * hRk)


def window_cut(bzk, gk, g0, dmin, shift_x=0.0):
    from scipy.ndimage import zoom as _zoom
    cxl0 = (FLUX_C0[0] + NULL_C0[0]) / 2 + shift_x
    cyl0 = (FLUX_C0[1] + NULL_C0[1]) / 2
    cxl, cyl = rotate_hmi_pt((cxl0, cyl0), g0, gk, dmin)
    cxl, cyl = int(round(cxl)), int(round(cyl))
    return _zoom(bzk[cyl - WINL // 2:cyl + WINL // 2,
                     cxl - WINL // 2:cxl + WINL // 2], CUTL / WINL, order=1)


def in_box(p, pad=0.0):
    return (BOX["x"][0] - pad < p[0] < BOX["x"][1] + pad and
            BOX["y"][0] - pad < p[1] < BOX["y"][1] + pad and
            BOX["z"][0] - pad < p[2] < BOX["z"][1] + pad)


def box_nulls(Bl, warm=None):
    seeds = list(warm) if warm is not None else []
    seeds += [[x, y, z]
              for x in np.linspace(*BOX["x"], 7)
              for y in np.linspace(*BOX["y"], 7)
              for z in np.linspace(*BOX["z"], 7)]
    out = []
    for nl in solar.find_nulls(Bl, seeds_per_axis=2, seeds=seeds, dedup=0.6):
        if in_box(nl["p"]):
            M = nl["gradB"]
            Mn = M / np.abs(np.linalg.eigvals(M)).max()
            Mn = Mn - np.eye(3) * np.trace(Mn) / 3
            out.append({"p": nl["p"], "M": M, "sign": int(np.sign(np.linalg.det(M))),
                        "det_hat": float(np.linalg.det(Mn))})
    return out


def closest_pair(nulls):
    best = (np.inf, None)
    for i, a in enumerate(nulls):
        for b in nulls[i + 1:]:
            if a["sign"] * b["sign"] != -1:
                continue
            d = np.linalg.norm(a["p"] - b["p"])
            if d < best[0]:
                best = (d, (a, b))
    return best


def grid_jet2(Bl, p0, h=0.9):
    """2-jet of the gridded field at p0 by central differences on _interp3."""
    p0 = np.asarray(p0, float)

    def f(q):
        return solar._interp3(Bl, q)
    B0 = f(p0)
    e = np.eye(3)
    M = np.stack([(f(p0 + h * e[j]) - f(p0 - h * e[j])) / (2 * h)
                  for j in range(3)], axis=1)
    T = np.zeros((3, 3, 3))
    for j in range(3):
        T[:, j, j] = (f(p0 + h * e[j]) - 2 * B0 + f(p0 - h * e[j])) / h ** 2
    for j in range(3):
        for k in range(j + 1, 3):
            v = (f(p0 + h * (e[j] + e[k])) - f(p0 + h * (e[j] - e[k]))
                 - f(p0 - h * (e[j] - e[k])) + f(p0 - h * (e[j] + e[k])))
            T[:, j, k] = T[:, k, j] = v / (4 * h ** 2)
    return B0, M, T


def main():
    hmi_all = sorted((ROOT / "artifacts" / "hmi" / "hmi_seq").glob("*.fits"))
    times = [(int(m.group(1)) * 60 + int(m.group(2)), f) for f in hmi_all
             for m in [re.search(r"_(\d\d)_(\d\d)_\d\d_TAI", f.name)]]
    times.sort()
    from scipy.ndimage import zoom as _zoom

    cuts, labels, g0 = [], [], None
    for tmin, f in times:
        bzk, hh = read2d(f)
        if bzk.shape[0] > 2048:
            bzk = _zoom(bzk, 1024 / bzk.shape[0], order=1)
        gk = hmi_geom(hh)
        if g0 is None:
            g0, t0 = gk, tmin
        cuts.append(window_cut(bzk, gk, g0, float(tmin - t0)))
        labels.append(f"{tmin // 60:02d}:{tmin % 60:02d}")

    # ---- H-S5b-1: the persistent pair, fine-dedup tracking -------------------
    print("H-S5b-1: fine-dedup pair track through all frames")
    series, warm = [], None
    for k, cut in enumerate(cuts):
        Bl, _ = solar.potential_field(cut, NZL, dz=1.0)
        nulls = box_nulls(Bl, warm=warm)
        warm = [n["p"] for n in nulls]
        sep, pair = closest_pair(nulls)
        rec = {"k": k, "t": labels[k], "n_box": len(nulls),
               "sep": None if pair is None else round(float(sep), 3)}
        if pair is not None:
            a, b = pair
            rec["pa"] = [round(float(v), 2) for v in a["p"]]
            rec["pb"] = [round(float(v), 2) for v in b["p"]]
            rec["det_hat"] = [round(a["det_hat"], 4), round(b["det_hat"], 4)]
            rec["signs"] = [a["sign"], b["sign"]]
        series.append(rec)
        print(f"  {labels[k]}  box nulls {len(nulls):2d}  "
              f"closest opp pair sep {rec['sep']}")

    # window-shift robustness at three sample frames
    shifts_ok = 0
    for kf in (5, 18, 29):
        tmin, f = times[kf]
        bzk, hh = read2d(f)
        if bzk.shape[0] > 2048:
            bzk = _zoom(bzk, 1024 / bzk.shape[0], order=1)
        for sx in (-16.0, +16.0):
            cut = window_cut(bzk, hmi_geom(hh), g0, float(tmin - times[0][0]),
                             shift_x=sx)
            Bl, _ = solar.potential_field(cut, NZL, dz=1.0)
            # box shifts with the window: -sx in window coords
            dx = -sx * CUTL / WINL
            nulls = [n for n in box_nulls(Bl, warm=[[p[0] + dx, p[1], p[2]]
                                                    for p in
                                                    ([series[kf]["pa"],
                                                      series[kf]["pb"]]
                                                     if series[kf]["sep"]
                                                     else [])])
                     if in_box(n["p"] - np.array([dx, 0, 0]), pad=3)]
            sep, pair = closest_pair(nulls)
            if pair is not None and abs(sep - (series[kf]["sep"] or 1e9)) < 1.5:
                shifts_ok += 1
    print(f"  window-shift check: {shifts_ok}/6 shifted windows reproduce "
          f"the pair separation within 1.5 px")

    # ---- H-S5b-2: the fold pinned by boundary blend ---------------------------
    # bracket from the S5 census: last both-alive k=11 (01:07), both gone by
    # k=13 (01:19)
    kA, kB = 11, 13
    print(f"\nH-S5b-2: boundary blend {labels[kA]} -> {labels[kB]}")
    pa0 = np.array([29.8, 192.1, 4.2])       # track 1 (+1) at 01:07
    pb0 = np.array([26.8, 187.5, 2.8])       # track 38 (-1) at 01:07

    def pair_at(s, qa, qb):
        cut = (1 - s) * cuts[kA] + s * cuts[kB]
        Bl, _ = solar.potential_field(cut, NZL, dz=1.0)
        nulls = box_nulls(Bl, warm=[qa, qb])
        if len(nulls) < 2:
            return None, Bl
        a = min(nulls, key=lambda n: np.linalg.norm(n["p"] - qa))
        b = min(nulls, key=lambda n: np.linalg.norm(n["p"] - qb))
        if (np.linalg.norm(a["p"] - b["p"]) < 0.05
                or a["sign"] * b["sign"] != -1
                or np.linalg.norm(a["p"] - qa) > 4 or np.linalg.norm(b["p"] - qb) > 4):
            return None, Bl
        return (a, b), Bl

    got, _ = pair_at(0.0, pa0, pb0)
    if got is None:
        print("  pair not re-found at s=0 -- abort blend"); s_c = None
    else:
        qa, qb = got[0]["p"], got[1]["p"]
        lo, hi = 0.0, 1.0
        qa_l, qb_l = qa.copy(), qb.copy()
        for _ in range(22):
            mid = 0.5 * (lo + hi)
            got, _ = pair_at(mid, qa_l, qb_l)
            if got is not None:
                qa_l, qb_l = got[0]["p"], got[1]["p"]
                lo = mid
            else:
                hi = mid
        s_c = 0.5 * (lo + hi)
        p_star = 0.5 * (qa_l + qb_l)
        print(f"  fold pinned at s_c = {s_c:.5f} "
              f"(between the two measured magnetograms), collision at window "
              f"({p_star[0]:.2f}, {p_star[1]:.2f}, z={p_star[2]:.2f} px)")

        # sqrt law + dets on the pair side
        ds = np.array([0.004, 0.008, 0.016, 0.032, 0.064, 0.128, 0.256, 0.5])
        seps, dets, qa2, qb2 = [], [], qa_l.copy(), qb_l.copy()
        for d in ds:
            s = s_c - d
            if s < 0:
                seps.append(np.nan); dets.append((np.nan, np.nan)); continue
            got, _ = pair_at(s, qa2, qb2)
            if got is None:
                seps.append(np.nan); dets.append((np.nan, np.nan)); continue
            qa2, qb2 = got[0]["p"], got[1]["p"]
            seps.append(float(np.linalg.norm(qa2 - qb2)))
            dets.append((float(np.linalg.det(got[0]["M"])),
                         float(np.linalg.det(got[1]["M"]))))
        seps = np.array(seps); okm = np.isfinite(seps)
        slope = np.polyfit(np.log(ds[okm]), np.log(seps[okm]), 1)[0]
        print(f"  separations: {np.round(seps, 3).tolist()}")
        print(f"  log-log slope = {slope:.3f}  (fold predicts 0.500)")

        # SR 2-jet read at the collision
        rng = np.random.default_rng(11)
        cut = (1 - s_c) * cuts[kA] + s_c * cuts[kB]
        Bl, _ = solar.potential_field(cut, NZL, dz=1.0)
        B0, M, T = grid_jet2(Bl, p_star)
        st = bif.jet_structure(B0, M, T, "solar-fold-jet")
        Bmodel = bif.jet_model_B(B0, M, T)
        Pchk = rng.uniform(-0.8, 0.8, (24, 3))
        assert np.allclose(st.B(Pchk), Bmodel(Pchk),
                           atol=2e-3 * max(1.0, np.abs(Bmodel(Pchk)).max()))
        radii = np.geomspace(0.35, 6.0, 9)
        w4_c = bif.flux_exponent_curve(st, [0, 0, 0, 0], radii, 3200, rng)
        w4_off = {}
        for d in (0.05, 0.25):
            got, Bl2 = pair_at(s_c - d, qa_l, qb_l)
            if got is None:
                continue
            mid2 = 0.5 * (got[0]["p"] + got[1]["p"])
            B0b, Mb, Tb = grid_jet2(Bl2, mid2)
            stb = bif.jet_structure(B0b, Mb, Tb, f"jet(s_c-{d})")
            w4_off[f"{d:g}"] = np.round(
                bif.flux_exponent_curve(stb, [0, 0, 0, 0], radii, 3200, rng),
                3).tolist()
        _, Q = st.weights_Q([0, 0, 0, 0], np.geomspace(0.5, 3.0, 7), 4000, rng)
        print(f"  w4(r) at s_c: {np.round(w4_c, 2).tolist()}")
        print(f"  growth vector at collision: Q = {Q}  (fold predicts 7)")

        # window-shift robustness of the blend fold
        sc_shift = {}
        for sx in (-16.0, +16.0):
            cutsA, cutsB = [], []
            for kk, tag in ((kA, cutsA), (kB, cutsB)):
                tmin, f = times[kk]
                bzk, hh = read2d(f)
                if bzk.shape[0] > 2048:
                    bzk = _zoom(bzk, 1024 / bzk.shape[0], order=1)
                tag.append(window_cut(bzk, hmi_geom(hh), g0,
                                      float(tmin - times[0][0]), shift_x=sx))
            dx = -sx * CUTL / WINL
            qa3 = pa0 + [dx, 0, 0]; qb3 = pb0 + [dx, 0, 0]
            lo2, hi2 = 0.0, 1.0
            found_any = False
            for _ in range(16):
                mid = 0.5 * (lo2 + hi2)
                cut2 = (1 - mid) * cutsA[0] + mid * cutsB[0]
                Bl3, _ = solar.potential_field(cut2, NZL, dz=1.0)
                nulls = box_nulls(Bl3, warm=[qa3, qb3])
                nulls = [n for n in nulls
                         if np.linalg.norm(n["p"] - qa3) < 5
                         or np.linalg.norm(n["p"] - qb3) < 5]
                sgns = sorted(n["sign"] for n in nulls)
                if len(nulls) >= 2 and sgns[0] == -1 and sgns[-1] == 1:
                    found_any = True
                    a = min(nulls, key=lambda n: np.linalg.norm(n["p"] - qa3))
                    b = min(nulls, key=lambda n: np.linalg.norm(n["p"] - qb3))
                    qa3, qb3 = a["p"], b["p"]
                    lo2 = mid
                else:
                    hi2 = mid
            sc_shift[f"{sx:+.0f}px"] = round(0.5 * (lo2 + hi2), 4) if found_any else None
        print(f"  fold s_c under +/-16 px window shifts: {sc_shift}")

    out = {"series": series,
           "shifts_ok": int(shifts_ok),
           "blend": None if s_c is None else {
               "frames": [kA, kB], "times": [labels[kA], labels[kB]],
               "s_c": round(float(s_c), 5),
               "p_star": [round(float(v), 3) for v in p_star],
               "deltas": ds.tolist(),
               "seps": [None if not np.isfinite(v) else round(float(v), 4)
                        for v in seps],
               "dets": [[None if not np.isfinite(v) else round(v, 6)
                         for v in pr] for pr in dets],
               "sqrt_slope": round(float(slope), 4),
               "w4_radii": radii.tolist(),
               "w4_at_c": np.round(w4_c, 3).tolist(),
               "w4_off": w4_off, "Q_at_c": int(Q),
               "s_c_shifted_windows": sc_shift}}
    (ROOT / "artifacts" / "s5b_pair.json").write_text(
        json.dumps(out, indent=1) + "\n")
    print("\nsaved artifacts/s5b_pair.json")


if __name__ == "__main__":
    main()
