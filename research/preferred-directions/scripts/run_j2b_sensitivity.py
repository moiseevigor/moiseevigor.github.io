#!/usr/bin/env python3
"""J2b -- Jupiter census sensitivity + completeness checks (re-review R5/R6).

What the re-review demanded beyond run_j2_census.py:

1. CLASSIFY all three retained roots (eigenvalues of grad B: radial vs spiral,
   Poincare index = sign(det grad B)) -- fixes Part 8's spiral count (now 0/3).
2. NET-CHARGE degree cross-check: the topological degree of B/|B| over
   enclosing spheres. Equal degrees mean no unexplained NET topological charge
   in the intervening shell; index-cancelling missed pairs (exactly what a
   fold creates) are NOT excluded. Not a trilinear/Poincare cell census --
   the census is named "two-resolution cell-prefiltered root census"
   accordingly, and its two-grid/floor agreement is CONVERGENCE evidence.
3. SHELL-FLOOR sensitivity: the third root sits at r=0.857, 0.002 above the
   floor. Rerun the census with floor 0.80 (coarse grid): does the root
   persist, and does anything new appear in 0.80..0.855? (The sub-0.855 layer
   is a truncation-sensitive, poorly constrained continuation region -- root
   proliferation there is not diagnosed further.)
4. ENSEMBLE extended to ALL THREE roots with a PAIRED design: one set of
   standardized coefficient draws (seed 11, N=40), scaled by amplitude
   x0.5 / x1 / x2, so amplitude sensitivity is isolated from finite-ensemble
   variation. Raw (brmin, found position, warm-start distance) recorded per
   member so patch threshold, search radius and shell floor become a
   post-processed sensitivity TABLE; position ranges reported BOTH conditioned
   on the nominal acceptance (radius 0.15 + floor 0.856) and raw. Language:
   survival FRACTION under the chosen stress ensemble; sample position RANGE.
   Not a posterior.

Out: artifacts/j2b_sensitivity.json + printed verdicts.
"""
import json
import sys
import time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "scripts"))

import jupfield  # noqa: E402
import run_j2_census as j2  # noqa: E402  (reuses B_cart_many/newton/census)

T0 = time.time()


def classify(jf, p):
    """Eigenvalue anatomy of a nondegenerate null of B at p."""
    J = jf.jac(p)
    ev = np.linalg.eigvals(J)
    n_complex = int(np.sum(np.abs(ev.imag) > 1e-6 * np.abs(ev).max()))
    kind = "spiral" if n_complex == 2 else "radial"
    index = int(np.sign(np.linalg.det(J)))
    # solar convention: sign of the null = sign of the lone eigenvalue whose
    # real part differs in sign from the other two (the spine eigenvalue)
    re = np.sort(ev.real)
    spine_sign = int(np.sign(re[2]) if re[1] < 0 else np.sign(re[0]))
    return {"kind": kind, "index": index, "spine_sign": spine_sign,
            "eigs_real": [float(x) for x in np.round(ev.real, 6)],
            "eigs_imag": [float(x) for x in np.round(ev.imag, 6)]}


def sphere_degree(jf, r, n_th=400, n_ph=800):
    """Degree of B/|B| over the sphere of radius r (outward orientation).

    (1/4pi) int n . (d_th n x d_ph n) dth dph on a regular (th, ph) grid,
    central differences, poles excluded by the grid offset.
    """
    th = np.linspace(0, np.pi, n_th + 2)[1:-1]
    ph = np.linspace(0, 2 * np.pi, n_ph, endpoint=False)
    TH, PH = np.meshgrid(th, ph, indexing="ij")
    P = j2.sph_to_cart(r, TH, PH).reshape(-1, 3)
    B = j2.B_cart_many(jf, P).reshape(n_th, n_ph, 3)
    n = B / np.linalg.norm(B, axis=-1, keepdims=True)
    dth = th[1] - th[0]
    dph = ph[1] - ph[0]
    d_th = np.gradient(n, dth, axis=0)
    d_ph = (np.roll(n, -1, axis=1) - np.roll(n, 1, axis=1)) / (2 * dph)
    integrand = np.einsum("ijk,ijk->ij", n, np.cross(d_th, d_ph))
    return float(integrand.sum() * dth * dph / (4 * np.pi))


def ensemble_leg(jf, refs, a_l, f_l, amp, draws):
    """Paired design: one standardized draw set, scaled by `amp`."""
    g0, h0 = jf.g.copy(), jf.h.copy()
    N = len(draws)
    th_cap = np.radians(np.linspace(1, 35, 35))
    ph_cap = np.radians(np.linspace(0, 360, 91))
    cloud = np.array([[dx, dy, dz] for dx in (-0.02, 0, 0.02)
                      for dy in (-0.02, 0, 0.02) for dz in (-0.02, 0, 0.02)])
    members = []
    for k, (Zg, Zh) in enumerate(draws):
        jf.g = g0 + Zg * (amp * f_l[:, None] * a_l[:, None])
        jf.h = h0 + Zh * (amp * f_l[:, None] * a_l[:, None])
        jf.h[:, 0] = 0.0
        brmin = min(jf.B_sph(0.85, float(t), float(p))[0]
                    for t in th_cap[::2] for p in ph_cap[::3])
        rec = {"brmin_nT": float(brmin), "roots": []}
        for p_ref in refs:
            found = None
            for dp in cloud:
                p = j2.newton(jf, p_ref + dp)
                if p is not None:
                    if found is None or (np.linalg.norm(p - p_ref)
                                         < np.linalg.norm(found - p_ref)):
                        found = p
                    if np.linalg.norm(p - p_ref) < 0.15:
                        break
            if found is None:
                rec["roots"].append(None)
            else:
                r, lat, lon = j2.null_latlon(found)
                rec["roots"].append({"r": round(r, 4), "lat": round(lat, 2),
                                     "lon": round(lon, 2),
                                     "dist": round(float(np.linalg.norm(found - p_ref)), 4)})
        members.append(rec)
        if (k + 1) % 10 == 0:
            print(f"    member {k+1}/{N} (amp x{amp}) [{time.time()-T0:.0f} s]",
                  flush=True)
    jf.g, jf.h = g0, h0
    return members


def survival_table(members, refs):
    """Post-processed sensitivity: threshold x radius x floor grids."""
    out = {}
    N = len(members)
    for thr_G in (0.25, 0.5, 1.0):                       # patch |Br| threshold, gauss
        n = sum(m["brmin_nT"] < -thr_G * 1e4 for m in members)
        out[f"patch_thr_{thr_G}G"] = f"{n}/{N}"
    for i in range(len(refs)):
        for rad in (0.10, 0.15, 0.25):                   # warm-start capture radius
            for floor in (0.856, 0.80):                  # shell floor at acceptance
                n = sum(1 for m in members
                        if m["roots"][i] is not None
                        and m["roots"][i]["dist"] <= rad
                        and m["roots"][i]["r"] >= floor)
                out[f"root{i+1}_rad{rad}_floor{floor}"] = f"{n}/{N}"
    return out


def pos_range(members, i, rad=0.15, floor=None):
    """Sample position range; floor=None gives raw recaptures, floor=0.856
    conditions on the SAME acceptance set as the nominal survival count."""
    pos = [(m["roots"][i]["r"], m["roots"][i]["lat"], m["roots"][i]["lon"])
           for m in members if m["roots"][i] is not None
           and m["roots"][i]["dist"] <= rad
           and (floor is None or m["roots"][i]["r"] >= floor)]
    if not pos:
        return None
    a = np.array(pos)
    return {"n": len(pos),
            "r": [float(a[:, 0].min()), float(a[:, 0].max())],
            "lat": [float(a[:, 1].min()), float(a[:, 1].max())],
            "lon": [float(a[:, 2].min()), float(a[:, 2].max())]}


def main():
    out = {}
    jf = jupfield.JupiterField("jrm33", lmax=18)

    # golden check (same guard as run_j2_census)
    rng0 = np.random.default_rng(0)
    Pg = rng0.uniform(-1, 1, (50, 3))
    Pg = Pg / np.linalg.norm(Pg, axis=1)[:, None] * rng0.uniform(0.86, 1.4, 50)[:, None]
    ref = np.array([jf.B(p) for p in Pg])
    rel = np.abs(j2.B_cart_many(jf, Pg) - ref).max() / np.abs(ref).max()
    print(f"golden check: {rel:.2e}", flush=True)
    assert rel < 1e-9

    # ---- 1. classify the three nominal roots -------------------------------
    print("== 1. root anatomy (JRM33 nominal) ==", flush=True)
    prev = json.loads((ROOT / "artifacts" / "j2_census.json").read_text())
    key = sorted(prev["census"].keys())[-1]
    roots = []
    for e in prev["census"][key]["nulls"]:
        th = np.radians(90 - e["lat"])
        ph = np.radians(e["lon"])
        p = j2.newton(jf, j2.sph_to_cart(e["r"], th, ph))
        assert p is not None, f"nominal root refinement failed: {e}"
        roots.append(p)
    out["roots"] = []
    for p in roots:
        r, lat, lon = j2.null_latlon(p)
        c = classify(jf, p)
        c.update({"r": round(r, 4), "lat": round(lat, 2), "lon": round(lon, 2)})
        out["roots"].append(c)
        print(f"  r={r:.4f} lat={lat:+.1f} lon={lon:.1f}: {c['kind']}, "
              f"index {c['index']:+d}, spine sign {c['spine_sign']:+d}", flush=True)
    n_spiral = sum(c["kind"] == "spiral" for c in out["roots"])
    print(f"  spirals: {n_spiral}/{len(out['roots'])}", flush=True)

    # ---- 2. shell-floor census at 0.80 (coarse grid) ------------------------
    print("== 2. shell floor 0.80 census (24x72x144) ==", flush=True)
    j2.R_IN = 0.80
    ncand, nulls80 = j2.census(jf, 24, 72, 144)
    entries = []
    for p in nulls80:
        r, lat, lon = j2.null_latlon(p)
        c = classify(jf, p)
        entries.append({"r": round(r, 4), "lat": round(lat, 2),
                        "lon": round(lon, 2), "kind": c["kind"],
                        "index": c["index"]})
        print(f"    null: r={r:.4f}, lat={lat:+.1f}, lon={lon:.1f} "
              f"({c['kind']}, index {c['index']:+d})", flush=True)
    out["floor080_census"] = {"candidates": ncand, "confirmed": len(nulls80),
                              "nulls": entries}
    j2.R_IN = 0.855

    # ---- 3. topological degree at clearance radii ---------------------------
    # The degree integral resolves only when the sphere clears every null by
    # much more than the grid arc (~0.007 at 400x800). Census nulls sit at
    # r = 0.857..0.873, and the sub-0.855 layer is root-dense, so:
    #   0.999 / 0.94 / 0.885  -- clean spheres bracketing the outer zone.
    #     Numerically-zero and EQUAL degrees mean: no unexplained NET
    #     topological charge anywhere in 0.885..0.999. This does NOT exclude
    #     missed (+1,-1) pairs -- fold-created nulls come exactly in such
    #     pairs -- so it is a net-charge consistency check, not completeness.
    #   0.80                  -- inside the dense layer: reported for honesty;
    #                            non-integer value = under-resolved there, and
    #                            the corner-sign+Newton census is NOT complete
    #                            in that layer (which is why the census shell
    #                            starts at 0.855 and is not called exhaustive).
    print("== 3. topological degree at clearance radii ==", flush=True)
    degs = {r: sphere_degree(jf, r) for r in (0.999, 0.94, 0.885, 0.80)}
    for r, dg in degs.items():
        print(f"  deg(r={r}) = {dg:+.3f}", flush=True)
    clean = [degs[0.999], degs[0.94], degs[0.885]]
    net_charge_zero = bool(max(clean) - min(clean) < 0.05
                           and abs(clean[0] - round(clean[0])) < 0.05)
    out["degree"] = {"spheres": {str(r): round(dg, 3) for r, dg in degs.items()},
                     "net_charge_consistent_zero_above_0.885": net_charge_zero,
                     "note": ("numerically consistent with degree zero; excludes "
                              "unexplained NET charge above 0.885, not "
                              "index-cancelling missed pairs. 0.80 sphere sits in "
                              "the root-dense sub-0.855 layer: non-integer value = "
                              "under-resolved; no completeness claim there")}
    print(f"  net topological charge above 0.885 consistent with zero: "
          f"{net_charge_zero} (index-cancelling pairs not excluded)", flush=True)

    # ---- 4. ensemble: all three roots + amplitude legs ---------------------
    print("== 4. stress ensemble, all roots ==", flush=True)
    j09 = jupfield.JupiterField("jrm09", lmax=10)
    L = jf.lmax
    a_l, f_l = np.zeros(L + 1), np.zeros(L + 1)
    for l in range(1, L + 1):
        a_l[l] = np.sqrt(np.mean(jf.g[l, :l + 1] ** 2 + jf.h[l, :l + 1] ** 2))
        if l <= 10:
            dg = jf.g[l, :l + 1] - j09.g[l, :l + 1]
            dh = jf.h[l, :l + 1] - j09.h[l, :l + 1]
            f_l[l] = np.sqrt(np.mean(dg ** 2 + dh ** 2)) / max(a_l[l], 1e-12)
    ls = np.arange(2, 11)
    slope, icpt = np.polyfit(ls, np.log(f_l[2:11]), 1)
    for l in range(11, L + 1):
        f_l[l] = min(1.0, float(np.exp(icpt + slope * l)))

    # one standardized draw set (seed 11, N=40), reused across amplitude legs:
    # amp x1 reproduces the original leg exactly; x0.5/x2 are PAIRED with it
    rng = np.random.default_rng(11)
    draws = []
    for _ in range(40):
        Zg = rng.normal(0, 1, jf.g.shape)
        Zh = rng.normal(0, 1, jf.h.shape)
        draws.append((Zg, Zh))

    j2.R_IN = 0.75                       # wide acceptance; floors post-processed
    legs = {}
    for amp in (1.0, 0.5, 2.0):
        print(f"  leg amp x{amp}, N={len(draws)} (paired draws)", flush=True)
        members = ensemble_leg(jf, roots, a_l, f_l, amp, draws)
        legs[f"amp{amp}"] = {
            "members": len(draws),
            "survival_table": survival_table(members, roots),
            "position_range_nominal": {
                f"root{i+1}": pos_range(members, i, rad=0.15, floor=0.856)
                for i in range(len(roots))},
            "position_range_raw": {
                f"root{i+1}": pos_range(members, i, rad=0.15, floor=None)
                for i in range(len(roots))},
        }
    j2.R_IN = 0.855
    out["ensemble_legs"] = legs
    for name, leg in legs.items():
        t = leg["survival_table"]
        bits = [f"patch(0.5G) {t['patch_thr_0.5G']}"]
        for i, c in enumerate(out["roots"]):
            bits.append(f"root{i+1}(lat{c['lat']:+.0f}) "
                        f"{t[f'root{i+1}_rad0.15_floor0.856']}")
        print(f"  {name}: " + ", ".join(bits), flush=True)

    (ROOT / "artifacts" / "j2b_sensitivity.json").write_text(
        json.dumps(out, indent=1) + "\n")
    print(f"saved artifacts/j2b_sensitivity.json  [{time.time()-T0:.0f} s]",
          flush=True)


if __name__ == "__main__":
    main()
