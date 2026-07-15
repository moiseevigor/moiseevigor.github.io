#!/usr/bin/env python3
"""P4-S5 -- temporal fold hunt on the real Sun (H-S5, pre-registered).

HYPOTHESIS H-S5: somewhere in the 32-frame, 6-min-cadence AR11429 sequence
(2012-03-07 00:00-03:06 UT, through the X5.4 and X1.3 flares) an
opposite-degree coronal null pair of the windowed potential extrapolation
annihilates or is born -- a fold bifurcation in TIME on measured data.
Prediction: a pair of tracked nulls with sign(det gradB) = +/- whose
separation decreases over >= 3 consecutive frames to below the tracking
gate, after which BOTH vanish away from the volume walls (annihilation),
or the time-mirror of that (creation). Folds conserve total degree, so the
census degree sum changes only when a null crosses the volume boundary.

Census machinery: the same co-rotating wide window as the flare GIF
(WINL = 360 px of HMI_0 around the fixed midpoint of the arcade/null
windows, resampled to CUTL = 225, NZL = 64 levels), potential
re-extrapolation per frame, ALL in-volume nulls per frame, identity
tracking in window coordinates (the window co-rotates with the Sun, so
coordinates are quasi-Lagrangian).

Deaths/births are attributed: 'floor' (null submerges through the
photospheric height filter), 'wall' (leaves the lateral/top margins --
window-domain artifacts, not physics), 'interior' (fold candidate).
Window-sensitivity (the R3 caveat): every interior event is re-run with
the survey window shifted +/-16 px in x; only events persisting in >= 2 of
the 3 windows are accepted.

Out: artifacts/s5_solar_fold.json (census, tracks, events). Figure is
rendered separately by render_s45_figures.py.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))

import solar  # noqa: E402

WINL, CUTL, NZL = 360, 225, 64
FLUX_C0 = (640.0, 640.0)                 # arcade window centre, HMI_0 px
NULL_C0 = (647.0, 698.0)                 # null window centre, HMI_0 px
OMEGA = np.radians(13.3 / 1440.0)        # synodic solar rotation, rad/min
GATE = 6.0                               # px, identity-tracking gate
Z_FLOOR, Z_TOP, XY_MARGIN = 1.4, NZL - 4.0, 6.0


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


def frame_nulls(bzk, gk, g0, dmin, shift_x=0.0, warm=None):
    """Extrapolate the co-rotating wide window of one frame; return its nulls.

    `warm` (n,3) window-coordinate seeds from the previous frame make the
    census reliable: persistent nulls are re-found by warm Newton even where
    the fixed seed grid loses their basin; the grid then covers births.
    A dense auxiliary patch covers the null-rich cluster the first pass
    exposed (x 20-70, y 170-220 px).
    """
    from scipy.ndimage import zoom as _zoom
    cxl0 = (FLUX_C0[0] + NULL_C0[0]) / 2 + shift_x
    cyl0 = (FLUX_C0[1] + NULL_C0[1]) / 2
    cxl, cyl = rotate_hmi_pt((cxl0, cyl0), g0, gk, dmin)
    cxl, cyl = int(round(cxl)), int(round(cyl))
    cutl = _zoom(bzk[cyl - WINL // 2:cyl + WINL // 2,
                     cxl - WINL // 2:cxl + WINL // 2], CUTL / WINL, order=1)
    Bl, _ = solar.potential_field(cutl, NZL, dz=1.0)
    seeds = list(warm) if warm is not None else []
    seeds += [[x, y, z] for x in np.linspace(20, 70, 8)
              for y in np.linspace(170, 220, 8) for z in (2.5, 5, 9, 14, 20, 26)]
    out = []
    for nl in solar.find_nulls(Bl, seeds_per_axis=14, seeds=seeds):
        x, y, z = nl["p"]
        if not (Z_FLOOR < z < Z_TOP):
            continue
        if not (XY_MARGIN < x < CUTL - XY_MARGIN and
                XY_MARGIN < y < CUTL - XY_MARGIN):
            continue
        M = nl["gradB"]
        out.append({"x": float(x), "y": float(y), "z": float(z),
                    "sign": int(np.sign(np.linalg.det(M))),
                    "near_floor": bool(z < Z_FLOOR + 1.2)})
    return out


def track(census):
    """Greedy nearest-neighbour identity tracking, 1-frame miss allowed."""
    tracks = []                                        # each: dict with pts {k: null}
    for k, fr in enumerate(census):
        unmatched = list(range(len(fr["nulls"])))
        for tr in tracks:
            last_k = max(tr["pts"])
            if k - last_k > 2 or tr.get("dead"):
                tr["dead"] = True
                continue
            p_last = tr["pts"][last_k]
            best, best_d = None, GATE * (k - last_k)
            for j in unmatched:
                nl = fr["nulls"][j]
                d = np.hypot(nl["x"] - p_last["x"], nl["y"] - p_last["y"])
                if d < best_d and nl["sign"] == tr["sign"]:
                    best, best_d = j, d
            if best is not None:
                tr["pts"][k] = fr["nulls"][best]
                unmatched.remove(best)
        for j in unmatched:
            tracks.append({"sign": fr["nulls"][j]["sign"],
                           "pts": {k: fr["nulls"][j]}})
    return tracks


def classify_end(tr, n_frames):
    ks = sorted(tr["pts"])
    k0, k1 = ks[0], ks[-1]
    p0, p1 = tr["pts"][k0], tr["pts"][k1]

    def where(p):
        if p["z"] < Z_FLOOR + 1.0:
            return "floor"
        if not (XY_MARGIN + 4 < p["x"] < CUTL - XY_MARGIN - 4 and
                XY_MARGIN + 4 < p["y"] < CUTL - XY_MARGIN - 4):
            return "wall"
        return "interior"
    birth = "start" if k0 == 0 else where(p0)
    death = "end" if k1 == n_frames - 1 else where(p1)
    return k0, k1, birth, death


def pair_events(tracks, n_frames):
    """Interior deaths/births with an opposite-degree partner ending together."""
    events = []
    ends = []
    for i, tr in enumerate(tracks):
        if len(tr["pts"]) < 3:
            continue
        k0, k1, birth, death = classify_end(tr, n_frames)
        ends.append((i, k0, k1, birth, death))
    for (i, k0, k1, b, d) in ends:
        for (j, l0, l1, b2, d2) in ends:
            if j <= i:
                continue
            ti, tj = tracks[i], tracks[j]
            if ti["sign"] * tj["sign"] != -1:
                continue
            # annihilation: both die interior at the same frame
            if d == d2 == "interior" and abs(k1 - l1) <= 1:
                kk = sorted(set(ti["pts"]) & set(tj["pts"]))[-3:]
                if len(kk) >= 2:
                    seps = [np.hypot(ti["pts"][k]["x"] - tj["pts"][k]["x"],
                                     ti["pts"][k]["y"] - tj["pts"][k]["y"])
                            for k in kk]
                    if seps[-1] < 2.5 * GATE and seps[-1] <= min(seps) + 1e-9:
                        events.append({"kind": "annihilation", "tracks": [i, j],
                                       "frame": int(max(k1, l1)),
                                       "seps": [round(s, 2) for s in seps]})
            # creation: both born interior at the same frame
            if b == b2 == "interior" and abs(k0 - l0) <= 1:
                kk = sorted(set(ti["pts"]) & set(tj["pts"]))[:3]
                if len(kk) >= 2:
                    seps = [np.hypot(ti["pts"][k]["x"] - tj["pts"][k]["x"],
                                     ti["pts"][k]["y"] - tj["pts"][k]["y"])
                            for k in kk]
                    if seps[0] < 2.5 * GATE:
                        events.append({"kind": "creation", "tracks": [i, j],
                                       "frame": int(min(k0, l0)),
                                       "seps": [round(s, 2) for s in seps]})
    return events


def main():
    hmi_all = sorted((ROOT / "artifacts" / "hmi" / "hmi_seq").glob("*.fits"))
    assert len(hmi_all) >= 8, "fetch hmi_seq first"
    times = [(int(m.group(1)) * 60 + int(m.group(2)), f) for f in hmi_all
             for m in [re.search(r"_(\d\d)_(\d\d)_\d\d_TAI", f.name)]]
    times.sort()
    from scipy.ndimage import zoom as _zoom

    census, g0, warm = [], None, None
    for k, (tmin, f) in enumerate(times):
        bzk, hh = read2d(f)
        if bzk.shape[0] > 2048:
            bzk = _zoom(bzk, 1024 / bzk.shape[0], order=1)
        gk = hmi_geom(hh)
        if g0 is None:
            g0, t0 = gk, tmin
        nulls = frame_nulls(bzk, gk, g0, float(tmin - t0), warm=warm)
        warm = [[n["x"], n["y"], n["z"]] for n in nulls]
        dsum = sum(n["sign"] for n in nulls)
        census.append({"k": k, "t": f"{tmin // 60:02d}:{tmin % 60:02d}",
                       "nulls": nulls, "degree_sum": dsum})
        print(f"frame {k + 1}/{len(times)} {census[-1]['t']}  "
              f"nulls {len(nulls)}  degree sum {dsum:+d}")

    tracks = track(census)
    n_frames = len(census)
    summary = []
    for i, tr in enumerate(tracks):
        k0, k1, birth, death = classify_end(tr, n_frames)
        if len(tr["pts"]) >= 2:
            summary.append({"id": i, "sign": tr["sign"], "k0": k0, "k1": k1,
                            "birth": birth, "death": death,
                            "n_seen": len(tr["pts"]),
                            "pts": {str(k): {kk: round(vv, 2) if isinstance(vv, float)
                                             else vv for kk, vv in p.items()}
                                    for k, p in tr["pts"].items()}})
    events = pair_events(tracks, n_frames)
    print(f"\ntracks (seen >= 2 frames): {len(summary)}")
    for s in summary:
        print(f"  track {s['id']:3d} sign {s['sign']:+d}  frames "
              f"{s['k0']:2d}-{s['k1']:2d} ({s['n_seen']:2d} seen)  "
              f"birth={s['birth']:8s} death={s['death']}")
    print(f"candidate interior pair events: {len(events)}")

    # window-robustness on candidates
    robust = []
    for ev in events:
        kk = ev["frame"]
        ok = 1                                          # the base window found it
        for sx in (-16.0, +16.0):
            frs = []
            for k in range(max(0, kk - 2), min(n_frames, kk + 2)):
                tmin, f = times[k]
                bzk, hh = read2d(f)
                if bzk.shape[0] > 2048:
                    bzk = _zoom(bzk, 1024 / bzk.shape[0], order=1)
                frs.append({"k": k, "nulls": frame_nulls(
                    bzk, hmi_geom(hh), g0, float(tmin - times[0][0]), shift_x=sx)})
            # does a comparable opposite-sign close pair exist and end here too?
            i, j = ev["tracks"]
            pi = tracks[i]["pts"][max(tracks[i]["pts"])]
            near = [n for n in frs[0]["nulls"]
                    if np.hypot(n["x"] - pi["x"] - (-sx * CUTL / WINL),
                                n["y"] - pi["y"]) < 4 * GATE]
            signs = sorted(n["sign"] for n in near)
            if len(near) >= 2 and signs[0] == -1 and signs[-1] == +1:
                ok += 1
        ev["windows_confirming"] = ok
        if ok >= 2:
            robust.append(ev)
        print(f"  event {ev['kind']} @frame {ev['frame']}: "
              f"windows confirming {ok}/3")

    out = {"n_frames": n_frames,
           "frames": [{"k": c["k"], "t": c["t"], "n": len(c["nulls"]),
                       "degree_sum": c["degree_sum"],
                       "nulls": [{k2: (round(v2, 2) if isinstance(v2, float) else v2)
                                  for k2, v2 in n.items()} for n in c["nulls"]]}
                      for c in census],
           "tracks": summary, "events": events,
           "robust_events": robust}
    (ROOT / "artifacts" / "s5_solar_fold.json").write_text(
        json.dumps(out, indent=1) + "\n")
    print(f"\nVERDICT H-S5: {'CONFIRMED -- ' + str(len(robust)) + ' robust fold event(s)'
          if robust else ('candidates found but none window-robust'
                          if events else 'NO interior pair event in this sequence')}")
    print("saved artifacts/s5_solar_fold.json")


if __name__ == "__main__":
    main()
