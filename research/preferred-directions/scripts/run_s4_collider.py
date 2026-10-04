#!/usr/bin/env python3
"""P4-S4 -- the null collider: catch a fold bifurcation in Earth's
magnetosphere by sweeping a storm parameter (pre-registered H-S4a/b/c).

The empirical IGRF + Tsyganenko T96 field is a continuous family: dial the
ring-current index Dst from quiet (-5 nT) to storm (-100 nT, the edge of
T96's stated validity; the exploratory -100..-150 leg lives in
artifacts/s4_sweep_extended.json) with the other drivers held at the P4-S3
epoch values (Pdyn = 3 nPa, IMF By = 0, Bz = -5 nT), and the null
constellation must rearrange. Generic 1-parameter families cross fold
(saddle-node) bifurcations at isolated parameter values -- nowhere else can
the null COUNT change in the interior of the domain. The v1 full sweep
showed the census EXPLODING as the storm deepens (143 -> 1830 nulls), so
the interior events are overwhelmingly pair CREATIONS -- the detector
handles both orientations.

H-S4a (existence): at least one interior pair creation/annihilation along
       the path.
H-S4b (fold signature): the two participating nulls have opposite
       topological degree sign(det gradB); their separation obeys
       s(Dst) = C |Dst - Dst_c|^(1/2); det gradB -> 0 for both at Dst_c.
H-S4c (SR read): at the collision point the measured 2-jet of the real
       field carries the S1 fold structure -- the flux-reach exponent
       w4(r) of pairs near Dst_c shows the 2 -> 4 crossover with knee
       marching to 0 like sqrt(|Dst - Dst_c|), and AT Dst_c the plateau-4
       tangent cone (Q = 7). The vector potential of the local model is
       exact (Poincare gauge of the divergence-corrected 2-jet).

Out: artifacts/s4_collider.json. Figures: render_s45_figures.py.
"""
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))

import magnetosphere as ms   # noqa: E402
import mfield3d as m3        # noqa: E402
import nulltopo              # noqa: E402
import bifurcation as bif    # noqa: E402

UT = datetime(2012, 3, 7, 0, 0, tzinfo=timezone.utc).timestamp()
DSTS = np.arange(-5.0, -101.0, -5.0)          # storm-deepening path, capped at
                                              # T96 stated validity (~ -100 nT)
CORE = dict(x=40.0, y=30.0, z=25.0, r=3.0)    # interior trust region
GATE = 2.0                                    # RE, tracking gate per 5-nT step


def field_at(dst):
    return ms.Magnetosphere(UT, [3.0, float(dst), 0.0, -5.0, 0, 0, 0, 0, 0, 0])


def interior(p):
    return (abs(p[0]) < CORE["x"] and abs(p[1]) < CORE["y"]
            and abs(p[2]) < CORE["z"] and np.linalg.norm(p) > CORE["r"])


def hunt(fld, warm):
    seeds = ms.cusp_and_tail_seeds()
    if len(warm):
        seeds = np.vstack([np.asarray(warm, float), seeds])
    nulls = fld.find_nulls(seeds)
    out = []
    for nl in nulls:
        M = nl["gradB"]
        Mn = M / np.abs(np.linalg.eigvals(M)).max()
        Mn = Mn - np.eye(3) * np.trace(Mn) / 3
        cls = nulltopo.classify_null(Mn)
        fan = np.asarray(cls["fan_vals"])
        disc = (fan[0] - fan[1]) ** 2                  # real >= 0, complex < 0
        out.append({"p": nl["p"], "M": M,
                    "sign": int(np.sign(np.linalg.det(M))),
                    "type": cls["type"],
                    "det_hat": float(np.linalg.det(Mn)),
                    "disc_hat": float(np.real(disc))})
    return out


def _newton_one(fld, seed, tol_nT=0.3, max_iter=60):
    """Damped Newton to B = 0 from one seed -- NO dedup, unlike find_nulls."""
    p = np.asarray(seed, float).copy()
    for _ in range(max_iter):
        b = fld.B(p)
        if np.linalg.norm(b) < tol_nT:
            break
        try:
            step = np.linalg.solve(fld.jac(p), b)
        except np.linalg.LinAlgError:
            return None
        n = np.linalg.norm(step)
        if n > 3.0:
            step *= 3.0 / n
        p = p - step
        if np.linalg.norm(p) < 2.5 or np.abs(p).max() > 60.0:
            return None
    if np.linalg.norm(fld.B(p)) >= tol_nT:
        return None
    return {"p": p, "gradB": fld.jac(p)}


def newton_pair(fld, p_a, p_b, gate=3.0):
    """Warm Newton for both members; None if either fails, wanders past the
    gate, merges, or the degrees stop being opposite."""
    a = _newton_one(fld, p_a)
    b = _newton_one(fld, p_b)
    if a is None or b is None:
        return None
    if (np.linalg.norm(a["p"] - p_a) > gate or np.linalg.norm(b["p"] - p_b) > gate):
        return None
    if np.linalg.norm(a["p"] - b["p"]) < 5e-3:
        return None
    sa = np.sign(np.linalg.det(a["gradB"]))
    sb = np.sign(np.linalg.det(b["gradB"]))
    if sa * sb != -1:
        return None
    return a, b


# ------------------------------------------------------------------ SR 2-jet

def jet2(fld, p0, h=0.08):
    """(B0, M, T): value, Jacobian, symmetric quadratic tensor of B at p0."""
    p0 = np.asarray(p0, float)
    B0 = fld.B(p0)
    e = np.eye(3)
    M = np.stack([(fld.B(p0 + h * e[j]) - fld.B(p0 - h * e[j])) / (2 * h)
                  for j in range(3)], axis=1)
    T = np.zeros((3, 3, 3))
    for j in range(3):
        T[:, j, j] = (fld.B(p0 + h * e[j]) - 2 * B0 + fld.B(p0 - h * e[j])) / h ** 2
    for j in range(3):
        for k in range(j + 1, 3):
            v = (fld.B(p0 + h * (e[j] + e[k])) - fld.B(p0 + h * (e[j] - e[k]))
                 - fld.B(p0 - h * (e[j] - e[k])) + fld.B(p0 - h * (e[j] + e[k])))
            T[:, j, k] = T[:, k, j] = v / (4 * h ** 2)
    return B0, M, T


def jet_structure(B0, M, T, name):
    """Poincare-gauge SR structure of the divergence-corrected 2-jet.

    For a homogeneous degree-m solenoidal term v_m, A_m(d) = v_m(d) x d / (m+2)
    satisfies curl A_m = v_m. Solenoidality is enforced exactly: M is made
    traceless, and the quadratic part v2(d) = T[d,d]/2 gets the correction
    v2 - (D.d) d / 4 with D_k = sum_i T[i,i,k] (div of the corrected part = 0).
    """
    M = np.asarray(M, float)
    M = M - np.eye(3) * np.trace(M) / 3
    D = np.einsum("iik->k", T)

    def A(P):
        P = np.atleast_2d(np.asarray(P, float))
        a0 = np.cross(np.tile(B0, (len(P), 1)), P) / 2.0
        a1 = np.cross(P @ M.T, P) / 3.0
        v2 = 0.5 * np.einsum("ijk,nj,nk->ni", T, P, P)
        v2 = v2 - 0.25 * (P @ D)[:, None] * P
        a2 = np.cross(v2, P) / 4.0
        return a0 + a1 + a2
    return m3.MagneticStructure3D(A, name)


def main():
    t_start = time.time()
    print(f"collider path: Dst {DSTS[0]:.0f} -> {DSTS[-1]:.0f} nT "
          f"({len(DSTS)} steps), Pdyn=3, IMF Bz=-5 (epoch 2012-03-07 00:00 UT)")

    sweep, warm = [], []
    for dst in DSTS:
        fld = field_at(dst)
        nulls = hunt(fld, warm)
        warm = [n["p"] for n in nulls]
        core = [n for n in nulls if interior(n["p"])]
        dsum = sum(n["sign"] for n in core)
        sweep.append({"dst": float(dst), "nulls": nulls})
        print(f"Dst {dst:6.1f}: nulls {len(nulls):3d} (core {len(core):3d}, "
              f"degree sum {dsum:+d})  [{time.time() - t_start:5.0f} s]")

    # ---- identity tracking along the path -----------------------------------
    tracks = []
    for i, st in enumerate(sweep):
        unmatched = list(range(len(st["nulls"])))
        for tr in tracks:
            if tr["last_i"] != i - 1:
                continue
            p_last = tr["p"][-1]
            best, best_d = None, GATE
            for j in unmatched:
                n = st["nulls"][j]
                d = np.linalg.norm(n["p"] - p_last)
                if d < best_d and n["sign"] == tr["sign"]:
                    best, best_d = j, d
            if best is not None:
                n = st["nulls"][best]
                tr["p"].append(n["p"]); tr["i"].append(i); tr["last_i"] = i
                tr["type"].append(n["type"])
                tr["det_hat"].append(n["det_hat"])
                tr["disc_hat"].append(n["disc_hat"])
                unmatched.remove(best)
        for j in unmatched:
            n = st["nulls"][j]
            tracks.append({"sign": n["sign"], "p": [n["p"]], "i": [i],
                           "last_i": i, "type": [n["type"]],
                           "det_hat": [n["det_hat"]],
                           "disc_hat": [n["disc_hat"]]})

    # type flips (radial <-> spiral) along tracks: the OTHER codim-1 wall
    flips = sum(sum(1 for a, b in zip(tr["type"], tr["type"][1:]) if a != b)
                for tr in tracks)

    # ---- interior pair events: annihilations AND creations --------------------
    events = []
    for a in range(len(tracks)):
        ta = tracks[a]
        if len(ta["i"]) < 3:
            continue
        for b in range(a + 1, len(tracks)):
            tb = tracks[b]
            if tb["sign"] * ta["sign"] != -1 or len(tb["i"]) < 3:
                continue
            # annihilation: both die at the same interior step (not the last)
            if (ta["i"][-1] == tb["i"][-1] < len(sweep) - 1
                    and interior(ta["p"][-1]) and interior(tb["p"][-1])):
                d = np.linalg.norm(ta["p"][-1] - tb["p"][-1])
                if d < 6.0:
                    events.append({"a": a, "b": b, "kind": "annihilation",
                                   "i_edge": ta["i"][-1], "d_edge": float(d)})
            # creation: both born at the same interior step (not the first)
            if (ta["i"][0] == tb["i"][0] > 0
                    and interior(ta["p"][0]) and interior(tb["p"][0])):
                d = np.linalg.norm(ta["p"][0] - tb["p"][0])
                if d < 6.0:
                    events.append({"a": a, "b": b, "kind": "creation",
                                   "i_edge": ta["i"][0], "d_edge": float(d)})
    # dedup pairs, keep tightest first
    seen, uniq = set(), []
    for ev in sorted(events, key=lambda e: e["d_edge"]):
        key = (tuple(sorted((ev["a"], ev["b"]))), ev["kind"])
        if key not in seen:
            seen.add(key); uniq.append(ev)
    events = uniq
    n_cre = sum(e["kind"] == "creation" for e in events)
    print(f"\ntracks: {len(tracks)}  type flips along path: {flips}  "
          f"interior candidates: {len(events)} "
          f"({n_cre} creations, {len(events) - n_cre} annihilations)")

    results = {"path": {"dsts": DSTS.tolist(), "pdyn": 3.0, "bz": -5.0,
                        "epoch": "2012-03-07T00:00Z"},
               "sweep": [{"dst": st["dst"],
                          "n": len(st["nulls"]),
                          "n_core": sum(interior(n["p"]) for n in st["nulls"]),
                          "degree_sum_core": sum(n["sign"] for n in st["nulls"]
                                                 if interior(n["p"]))}
                         for st in sweep],
               "phase_portrait": [
                   {"dst": st["dst"],
                    "pts": [{"det_hat": round(n["det_hat"], 4),
                             "disc_hat": round(n["disc_hat"], 4),
                             "type": n["type"], "sign": n["sign"],
                             "interior": bool(interior(n["p"]))}
                            for n in st["nulls"]]} for st in sweep],
               "n_tracks": len(tracks), "type_flips": int(flips),
               "events": []}

    # ---- refine each candidate: bisection to Dst_c + sqrt law + SR read -----
    for ev in events[:4]:                                # at most 4 refined
        ta, tb = tracks[ev["a"]], tracks[ev["b"]]
        i_e = ev["i_edge"]
        if ev["kind"] == "annihilation":
            dst_exists, dst_absent = sweep[i_e]["dst"], sweep[i_e + 1]["dst"]
            pa, pb = ta["p"][-1].copy(), tb["p"][-1].copy()
        else:                                            # creation
            dst_exists, dst_absent = sweep[i_e]["dst"], sweep[i_e - 1]["dst"]
            pa, pb = ta["p"][0].copy(), tb["p"][0].copy()
        lo, hi = dst_exists, dst_absent
        for _ in range(24):
            mid = 0.5 * (lo + hi)
            got = newton_pair(field_at(mid), pa, pb)
            if got is not None:
                pa, pb = got[0]["p"], got[1]["p"]
                lo = mid
            else:
                hi = mid
        dst_c = 0.5 * (lo + hi)
        side = 1.0 if dst_exists >= dst_c else -1.0      # pair side of the fold
        if abs(dst_exists - dst_c) < 1e-4:               # bisection collapsed:
            print('  bisection collapsed onto the exists-side grid point -- '
                  'discovery artifact, not a fold; skipping')
            continue
        p_star = 0.5 * (pa + pb)
        print(f"\nevent tracks ({ev['a']},{ev['b']}): {ev['kind']} at "
              f"Dst_c = {dst_c:.4f} nT, collision at GSM "
              f"({p_star[0]:.2f}, {p_star[1]:.2f}, {p_star[2]:.2f}) RE")

        # sqrt law: separation on a delta ladder on the pair side
        deltas = np.array([0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0])
        seps, dets = [], []
        qa, qb = pa.copy(), pb.copy()
        for d in deltas:
            got = newton_pair(field_at(dst_c + side * d), qa, qb)
            if got is None:
                seps.append(np.nan); dets.append((np.nan, np.nan)); continue
            qa, qb = got[0]["p"], got[1]["p"]
            seps.append(float(np.linalg.norm(qa - qb)))
            dets.append((float(np.linalg.det(got[0]["gradB"])),
                         float(np.linalg.det(got[1]["gradB"]))))
        seps = np.array(seps)
        okm = np.isfinite(seps)
        if okm.sum() < 3:
            print('  ladder empty -- skipping')
            continue
        slope = np.polyfit(np.log(deltas[okm]), np.log(seps[okm]), 1)[0]
        print(f"  separation ladder: {np.round(seps, 3).tolist()}")
        print(f"  log-log slope = {slope:.3f}  (fold predicts 0.500)")

        # SR read: w4(r) at the collision midpoint for pairs at delta, and at Dst_c
        rng = np.random.default_rng(7)
        radii = np.geomspace(0.03, 2.5, 9)
        w4 = {}
        for d in [0.0, 0.5, 2.0, 8.0]:
            fld = field_at(dst_c + side * d)
            if d > 0:
                got = newton_pair(fld, qa, qb)
                base = 0.5 * (got[0]["p"] + got[1]["p"]) if got else p_star
            else:
                base = p_star
            B0, M, T = jet2(fld, base)
            st = jet_structure(B0, M, T, f"jet(dst_c+{d:g})")
            # golden check: curl A of the local model reproduces the model field
            Pchk = rng.uniform(-0.4, 0.4, (24, 3))
            Bmodel = (np.tile(B0, (24, 1)) + Pchk @ (M - np.eye(3) * np.trace(M) / 3).T
                      + 0.5 * np.einsum("ijk,nj,nk->ni", T, Pchk, Pchk)
                      - 0.25 * (Pchk @ np.einsum("iik->k", T))[:, None] * Pchk)
            assert np.allclose(st.B(Pchk), Bmodel, atol=1e-3 * max(
                1.0, np.abs(Bmodel).max())), "curl A != 2-jet field"
            curve = bif.flux_exponent_curve(st, [0, 0, 0, 0, ], radii, 3200, rng)
            w4[f"{d:g}"] = np.round(curve, 3).tolist()
            print(f"  w4(r) at Dst_c+{d:4g}: {np.round(curve, 2).tolist()}")
        _, Q = jet_structure(*jet2(field_at(dst_c), p_star),
                             "jet@c").weights_Q([0, 0, 0, 0],
                                                np.geomspace(0.05, 0.5, 7),
                                                4000, rng)
        print(f"  growth vector at collision: Q = {Q}  (fold predicts 7)")

        results["events"].append({
            "tracks": [ev["a"], ev["b"]], "kind": ev["kind"],
            "dst_c": round(float(dst_c), 4), "side": side,
            "p_star": [round(float(v), 3) for v in p_star],
            "signs": [ta["sign"], tb["sign"]],
            "types_at_end": [ta["type"][-1], tb["type"][-1]],
            "deltas": deltas.tolist(),
            "seps": [None if not np.isfinite(s) else round(float(s), 4)
                     for s in seps],
            "dets": [[None if not np.isfinite(v) else round(v, 6) for v in pr]
                     for pr in dets],
            "sqrt_slope": round(float(slope), 4),
            "w4_radii": radii.tolist(), "w4": w4, "Q_at_c": int(Q),
            "path_a": {"dst": [sweep[i]["dst"] for i in ta["i"]],
                       "p": [[round(float(v), 3) for v in q] for q in ta["p"]]},
            "path_b": {"dst": [sweep[i]["dst"] for i in tb["i"]],
                       "p": [[round(float(v), 3) for v in q] for q in tb["p"]]}})

    def _np_safe(o):
        if isinstance(o, np.integer):
            return int(o)
        if isinstance(o, np.floating):
            return float(o)
        raise TypeError(f"not JSON serializable: {type(o)}")
    (ROOT / "artifacts" / "s4_collider.json").write_text(
        json.dumps(results, indent=1, default=_np_safe) + "\n")
    ok = [e for e in results["events"] if abs(e["sqrt_slope"] - 0.5) < 0.08]
    print(f"\nVERDICT H-S4a: {'CONFIRMED' if events else 'REFUTED on this path'}"
          f" ({len(events)} interior pair event[s])")
    if results["events"]:
        e0 = results["events"][0]
        print(f"VERDICT H-S4b: sqrt slope {e0['sqrt_slope']} "
              f"{'CONFIRMED' if ok else 'CHECK'}; degrees {e0['signs']}")
        print(f"VERDICT H-S4c: Q at collision = {e0['Q_at_c']} (predict 7)")
    print(f"saved artifacts/s4_collider.json  [{time.time() - t_start:.0f} s]")


if __name__ == "__main__":
    main()
