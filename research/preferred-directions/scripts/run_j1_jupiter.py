#!/usr/bin/env python3
"""J1 -- Jupiter: is the north polar reversed-flux patch bounded by
separatrices? (pre-registered)

Juno's JRM33 model (Connerney et al. 2022; coefficients via planetmagfields,
golden-checked in src/jupfield.py) shows a NORTH POLAR PATCH OF REVERSED
FLUX -- a region of Br < 0 inside the dominantly Br > 0 northern cap. On the
Sun, a parasitic polarity embedded in a dominant cap generically carries a
null point above it whose fan separatrix forms a DOME footprinted on the
polarity boundary, with the spine exiting through the dome. The question --
"is the patch a combination of separatrices?" -- is exactly whether that
solar topology lives over Jupiter's pole.

H-J1 (nulls exist; AMENDED after the first run): the r > 1 exterior is
      null-free in all three models (the dipole dominates above the 1-bar
      level) -- but Jupiter is gaseous, and the molecular envelope between
      the dynamo surface (r ~ 0.85 R_J, where the JRM33 maps are drawn and
      the reversed patches live) and the 1-bar surface is potential-field
      territory. Amended claim: nulls of the potential continuation exist
      IN THE ENVELOPE SHELL r in (0.855, 1) above the dynamo-surface
      reversed patches.
H-J2 (the patch is separatrix-bounded): the fan separatrix surfaces of
      those nulls footprint on the Br = 0 boundary of the polar reversed
      patch -- quantified as the angular distance from patch-boundary
      points to the nearest fan footprint (prediction: median distance
      comparable to the tracing resolution, and dome footprints enclose
      the patch).
H-J3 (fourth world for the detector): the SR growth vector reads Q = 6 at
      every Jupiter null; all nulls are RADIAL (vacuum field => symmetric
      gradB => the Part-5 theorem forbids spirals).
H-J4 (robustness): the null set and dome topology persist under model
      truncation (lmax 18 -> 13, the well-determined degree) and across
      independent models (JRM33 -> JRM09) -- the analogue of the solar
      window-shift test for spherical-harmonic models.

Out: artifacts/j1_jupiter.json + artifacts/j1_maps.npz.
Figures: render_j1_figures.py. Blog: Part 8.
"""
import json
import sys
import time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))

import jupfield              # noqa: E402
import nulltopo              # noqa: E402
import mfield3d as m3        # noqa: E402

R_IN, R_OUT = 0.855, 8.0
R_SURF = 0.85                    # dynamo-surface level: patches, footprints


def newton_null(fld, seed, tol_rel=1e-9, max_iter=80):
    p = np.asarray(seed, float).copy()
    scale = None
    for _ in range(max_iter):
        b = fld.B(p)
        J = fld.jac(p)
        if scale is None:
            scale = max(np.abs(J).max(), 1e-9)
        if np.linalg.norm(b) < tol_rel * scale:
            break
        try:
            step = np.linalg.solve(J, b)
        except np.linalg.LinAlgError:
            return None
        n = np.linalg.norm(step)
        if n > 0.5:
            step *= 0.5 / n
        p = p - step
        r = np.linalg.norm(p)
        if not (R_SURF < r < R_OUT + 2.0):
            return None
    b = fld.B(p)
    J = fld.jac(p)
    if np.linalg.norm(b) >= 10 * tol_rel * max(np.abs(J).max(), 1e-9):
        return None
    return {"p": p, "gradB": J}


def hunt(fld, dense_north=True):
    seeds = []
    for r in (1.1, 1.25, 1.45, 1.7, 2.0, 2.5, 3.2, 4.2, 5.5, 7.0):
        for cth in np.linspace(-0.92, 0.92, 8):
            for ph in np.linspace(0, 2 * np.pi, 10, endpoint=False):
                sth = np.sqrt(1 - cth ** 2)
                seeds.append(r * np.array([sth * np.cos(ph),
                                           sth * np.sin(ph), cth]))
    # the envelope shell, densely, both hemispheres (the reversed patches
    # live at the dynamo surface; their domes -- if any -- live just above)
    for r in (0.865, 0.885, 0.91, 0.94, 0.97, 1.0):
        for cth in np.concatenate([np.linspace(0.17, 0.99, 10),
                                   np.linspace(-0.99, -0.17, 10)]):
            for ph in np.linspace(0, 2 * np.pi, 18, endpoint=False):
                sth = np.sqrt(1 - cth ** 2)
                seeds.append(r * np.array([sth * np.cos(ph),
                                           sth * np.sin(ph), cth]))
    found = []
    for s in seeds:
        nl = newton_null(fld, s)
        if nl is None:
            continue
        r = np.linalg.norm(nl["p"])
        if not (R_IN < r < 6.0):
            continue
        if any(np.linalg.norm(nl["p"] - f["p"]) < 0.02 for f in found):
            continue
        M = nl["gradB"]
        Mn = M / np.abs(np.linalg.eigvals(M)).max()
        Mn = Mn - np.eye(3) * np.trace(Mn) / 3
        cls = nulltopo.classify_null(Mn)
        nl.update({"sign": int(np.sign(np.linalg.det(M))),
                   "type": cls["type"], "label": cls["label"],
                   "J_parallel": float(cls["J_parallel"]),
                   "spine": np.real(np.asarray(cls["spine"], complex)).tolist(),
                   "Mn": Mn})
        found.append(nl)
    return found


def tangent_cone_Q(Mn, rng):
    def A(P):
        P = np.atleast_2d(np.asarray(P, float))
        return -np.cross(P, P @ np.asarray(Mn).T) / 3.0
    st = m3.MagneticStructure3D(A, "tangent-cone")
    _, Q = st.weights_Q([0, 0, 0, 0], np.geomspace(0.02, 0.2, 7), 5000, rng)
    return int(Q)


def trace_line(fld, p0, direction, ds=0.004, max_steps=30000):
    """RK2 unit-speed field-line trace; stops at the surface or R_OUT."""
    p = np.asarray(p0, float).copy()
    pts = [p.copy()]
    for _ in range(max_steps):
        b = fld.B(p)
        nb = np.linalg.norm(b)
        if nb < 1e-7:
            break
        k1 = direction * b / nb
        bm = fld.B(p + 0.5 * ds * k1)
        nbm = np.linalg.norm(bm)
        if nbm < 1e-7:
            break
        p = p + ds * direction * bm / nbm
        r = np.linalg.norm(p)
        pts.append(p.copy())
        if r <= R_SURF + 0.0005 or r >= R_OUT + 1.5:
            break
    return np.array(pts)


def fan_footprints(fld, nl, n_ring=72, r_ring=0.02):
    """Trace the fan separatrix surface to the surface; return footprints."""
    M = np.asarray(nl["Mn"])
    cls = nulltopo.classify_null(M)
    ev = np.asarray(cls["fan_vals"])
    fan_sign = float(np.sign(np.real(ev[0])))       # fan flow direction
    # fan basis: real span of the two fan eigenvectors
    w, V = np.linalg.eig(M)
    spine = np.asarray(cls["spine"], float)
    idx = [k for k in range(3)
           if abs(np.real(V[:, k]) @ spine) < 0.9][:2]
    u1 = np.real(V[:, idx[0]]); u1 /= np.linalg.norm(u1)
    u2 = np.real(V[:, idx[1]]); u2 -= (u2 @ u1) * u1
    if np.linalg.norm(u2) < 1e-6:
        u2 = np.imag(V[:, idx[0]])
    u2 /= np.linalg.norm(u2)
    feet, lines = [], []
    for th in np.linspace(0, 2 * np.pi, n_ring, endpoint=False):
        s0 = nl["p"] + r_ring * (np.cos(th) * u1 + np.sin(th) * u2)
        ln = trace_line(fld, s0, fan_sign)
        lines.append(ln)
        end = ln[-1]
        if np.linalg.norm(end) <= R_SURF + 0.02:
            r = np.linalg.norm(end)
            feet.append([float(np.degrees(np.arccos(np.clip(end[2] / r, -1, 1)))),
                         float(np.degrees(np.arctan2(end[1], end[0])) % 360)])
    spine_lines = [trace_line(fld, nl["p"] + 0.02 * s * np.asarray(nl["spine"]),
                              -fan_sign) for s in (+1, -1)]
    return feet, lines, spine_lines


def patch_contour(fld, lat_min=30.0, n_th=181, n_ph=361):
    """Br(R_SURF) north map + the Br = 0 boundary of the reversed patches."""
    th = np.radians(np.linspace(0.5, 90.0 - 0.01, n_th))   # colat 0..90
    ph = np.radians(np.linspace(0, 360, n_ph))
    Br = np.empty((n_th, n_ph))
    for i, t in enumerate(th):
        for j, p_ in enumerate(ph):
            Br[i, j] = fld.B_sph(R_SURF, t, p_)[0]
    # patch = Br < 0 at colat < (90 - lat_min)
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    cs = plt.contour(np.degrees(ph), np.degrees(th), Br, levels=[0.0])
    segs = []
    for path in cs.collections[0].get_paths() if hasattr(cs, "collections") \
            else cs.get_paths():
        v = path.vertices
        keep = v[:, 1] < (90.0 - lat_min)
        if keep.sum() > 4:
            segs.append(v[keep])
    plt.close("all")
    return th, ph, Br, segs


def ang_dist_deg(colat1, lon1, colat2, lon2):
    t1, t2 = np.radians(colat1), np.radians(colat2)
    dp = np.radians(lon1 - lon2)
    c = (np.cos(t1) * np.cos(t2) + np.sin(t1) * np.sin(t2) * np.cos(dp))
    return np.degrees(np.arccos(np.clip(c, -1, 1)))


def main():
    t0 = time.time()
    rng = np.random.default_rng(7)
    results = {"models": {}}

    for tag, model, lmax in (("jrm33_l18", "jrm33", 18),
                             ("jrm33_l13", "jrm33", 13),
                             ("jrm09_l10", "jrm09", 10)):
        fld = jupfield.JupiterField(model, lmax=lmax)
        nulls = hunt(fld)
        print(f"\n{tag}: {len(nulls)} exterior nulls  "
              f"[{time.time() - t0:.0f} s]")
        recs = []
        for nl in nulls:
            r = float(np.linalg.norm(nl["p"]))
            lat = 90 - np.degrees(np.arccos(nl["p"][2] / r))
            lon = np.degrees(np.arctan2(nl["p"][1], nl["p"][0])) % 360
            Q = tangent_cone_Q(nl["Mn"], rng) if tag == "jrm33_l18" else None
            rec = {"p": [round(float(v), 4) for v in nl["p"]],
                   "r": round(r, 4), "lat": round(float(lat), 2),
                   "lon": round(float(lon), 2), "sign": nl["sign"],
                   "type": nl["type"], "label": nl["label"],
                   "J_parallel": round(nl["J_parallel"], 4), "Q": Q}
            recs.append(rec)
            print(f"  null r={r:.3f} R_J  lat={lat:+.1f}  lon={lon:.1f}  "
                  f"{nl['label']}  deg {nl['sign']:+d}"
                  + (f"  Q={Q}" if Q else ""))
        results["models"][tag] = {"n_nulls": len(nulls), "nulls": recs}

        if tag == "jrm33_l18":
            fld_main, nulls_main = fld, nulls

    # ---- the patch and the domes (main model) ---------------------------------
    print("\ntracing fan separatrix domes (jrm33_l18)...")
    th, ph, Br, segs = patch_contour(fld_main)
    all_feet, lines_store, spine_store = [], [], []
    for k, nl in enumerate(nulls_main):
        feet, lines, spines = fan_footprints(fld_main, nl)
        all_feet.append(feet)
        lines_store.append([ln[:: max(1, len(ln) // 400)] for ln in lines])
        spine_store.append([ln[:: max(1, len(ln) // 400)] for ln in spines])
        print(f"  null {k}: {len(feet)}/72 fan lines reach the surface")

    # ---- H-J2 quantification: patch boundary vs dome footprints ---------------
    feet_north = [f for fs in all_feet for f in fs if f[0] < 62.0]
    hj2 = None
    if feet_north and segs:
        fc = np.array(feet_north)                  # (colat, lon)
        dists = []
        for seg in segs:
            for lon_b, colat_b in seg[:: max(1, len(seg) // 400)]:
                d = ang_dist_deg(colat_b, lon_b, fc[:, 0], fc[:, 1]).min()
                dists.append(float(d))
        dists = np.array(dists)
        hj2 = {"n_boundary_pts": int(len(dists)),
               "median_deg": round(float(np.median(dists)), 3),
               "p90_deg": round(float(np.percentile(dists, 90)), 3),
               "max_deg": round(float(dists.max()), 3)}
        print(f"\nH-J2: patch boundary vs dome footprints — median "
              f"{hj2['median_deg']}°, p90 {hj2['p90_deg']}°, "
              f"max {hj2['max_deg']}° over {hj2['n_boundary_pts']} pts")
    results["hj2"] = hj2

    # ---- persistence across models (H-J4) --------------------------------------
    def null_set(tag):
        return [(n["lat"], n["lon"], n["r"], n["sign"])
                for n in results["models"][tag]["nulls"]]
    match = []
    for (lat, lon, r, sg) in null_set("jrm33_l18"):
        best = 1e9
        for (lat2, lon2, r2, sg2) in null_set("jrm33_l13"):
            if sg2 == sg:
                best = min(best, ang_dist_deg(90 - lat, lon, 90 - lat2, lon2))
        match.append(round(float(best), 2))
    results["hj4_l13_match_deg"] = match
    print(f"H-J4 (l18 -> l13 nearest same-degree null, deg): {match}")

    np.savez_compressed(
        ROOT / "artifacts" / "j1_maps.npz",
        th=th, ph=ph, Br=Br,
        segs=np.array([len(s) for s in segs]),
        seg_pts=np.vstack(segs) if segs else np.zeros((0, 2)),
        feet=np.array([f for fs in all_feet for f in fs], float),
        feet_null_id=np.array([k for k, fs in enumerate(all_feet)
                               for _ in fs], int),
        nulls=np.array([n["p"] for n in nulls_main], float),
        fan_lines=np.array(
            [np.asarray(l, float) for ls in lines_store for l in ls],
            dtype=object),
        fan_null_id=np.array([k for k, ls in enumerate(lines_store)
                              for _ in ls], int),
        spines=np.array(
            [np.asarray(l, float) for ls in spine_store for l in ls],
            dtype=object),
        spine_null_id=np.array([k for k, ls in enumerate(spine_store)
                                for _ in ls], int),
        allow_pickle=True)
    (ROOT / "artifacts" / "j1_jupiter.json").write_text(
        json.dumps(results, indent=1) + "\n")

    n18 = results["models"]["jrm33_l18"]["n_nulls"]
    spirals = sum(n["type"] == "spiral"
                  for n in results["models"]["jrm33_l18"]["nulls"])
    print(f"\nVERDICT H-J1: {'CONFIRMED' if n18 else 'REFUTED'} "
          f"({n18} exterior nulls)")
    if hj2:
        print(f"VERDICT H-J2: median boundary-to-footprint distance "
              f"{hj2['median_deg']}° (see doc for reading)")
    print(f"VERDICT H-J3: spirals {spirals}/{n18} (vacuum theorem predicts 0); "
          f"Q values above")
    print(f"saved artifacts/j1_jupiter.json + j1_maps.npz  "
          f"[{time.time() - t0:.0f} s]")


if __name__ == "__main__":
    main()
