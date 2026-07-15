#!/usr/bin/env python3
"""P4-S4b -- the null collider, surgical version: DRIVE a real close pair
into its fold with the IMF Bz dial (pre-registered H-S4a/b/c).

Two lessons from the failed global sweeps are baked in:
(1) The Dst dial is the WRONG knob out in the tail: probing showed the
    flank/lobe null population barely responds to Dst (max |dB| = 0.03 nT
    for a 30-nT swing) because much of it sits OUTSIDE the T96 model
    magnetopause, where the external field is frozen by construction.
    Every null here is filtered by geopack's own boundary test (t96_mgnp,
    inside + >= 1 RE margin), and the dial is IMF Bz -- the tail-field
    driver every interior null responds to.
(2) Track-level "events" of a stepped sweep are finder-discovery
    artifacts; certification must be by CONTINUATION of one pair with
    dedup-free warm Newton and the full fold certificate:

  H-S4b: opposite degrees; separation = C sqrt(|Bz - Bz_c|);
         det gradB -> 0 for both members at Bz_c.
  H-S4c: the SR 2-jet at the collision reads the fold -- w4(r) crossover
         collapsing onto the plateau-4, growth vector Q = 7.

Base state: 2012-03-07 00:00 UT, Pdyn = 3 nPa, Dst = -50 nT, IMF By = 0,
Bz = -5 nT (the P4-S3 storm state). Drive: Bz northward toward +8 nT (the
calming direction), fallback southward to -10 nT; both inside T96's
stated |Bz| <= 10 nT validity.

Out: artifacts/s4_collider.json -- the certified event, the
inside-magnetopause phase portrait at the base state, and an inside-only
census along the Bz path.
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
import nulltopo              # noqa: E402
import bifurcation as bif    # noqa: E402

UT = datetime(2012, 3, 7, 0, 0, tzinfo=timezone.utc).timestamp()
BZ0, PDYN, DST = -5.0, 3.0, -50.0
CORE = dict(x=40.0, y=30.0, z=25.0, r=3.0)
TOL = 0.5                                     # nT, matched to the census hunt


def field_at(bz):
    return ms.Magnetosphere(UT, [PDYN, DST, 0.0, float(bz), 0, 0, 0, 0, 0, 0])


def interior(p):
    return (abs(p[0]) < CORE["x"] and abs(p[1]) < CORE["y"]
            and abs(p[2]) < CORE["z"] and np.linalg.norm(p) > CORE["r"])


def inside_mgnp(p, margin=1.0):
    """Inside the T96 model magnetopause (its own boundary test), with margin."""
    from geopack import geopack as gp
    xm, ym, zm, dist, iid = gp.t96_mgnp(PDYN, -1.0, p[0], p[1], p[2])
    return iid == 1 and dist >= margin


def newton_one(fld, seed, tol_nT=TOL, max_iter=80):
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


def state(nl):
    M = nl["gradB"]
    Mn = M / np.abs(np.linalg.eigvals(M)).max()
    Mn = Mn - np.eye(3) * np.trace(Mn) / 3
    cls = nulltopo.classify_null(Mn)
    fan = np.asarray(cls["fan_vals"])
    return {"sign": int(np.sign(np.linalg.det(M))),
            "type": cls["type"],
            "det": float(np.linalg.det(M)),
            "det_hat": float(np.linalg.det(Mn)),
            "disc_hat": float(np.real((fan[0] - fan[1]) ** 2))}


def pair_step(fld, qa, qb, gate=2.0):
    a = newton_one(fld, qa)
    b = newton_one(fld, qb)
    if a is None or b is None:
        return None
    if np.linalg.norm(a["p"] - qa) > gate or np.linalg.norm(b["p"] - qb) > gate:
        return None
    if np.linalg.norm(a["p"] - b["p"]) < 4e-3:
        return None
    if np.sign(np.linalg.det(a["gradB"])) * np.sign(np.linalg.det(b["gradB"])) != -1:
        return None
    return a, b


def jet2(fld, p0, h=0.08):
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


def drive_pair(a0, b0, bz_stop, d0):
    """Continue the pair in Bz from BZ0 toward bz_stop; return path + bracket."""
    qa, qb = a0["p"].copy(), b0["p"].copy()
    path = [(BZ0, qa.copy(), qb.copy(), state(a0), state(b0))]
    bz = BZ0
    direction = 1.0 if bz_stop > BZ0 else -1.0
    step = 0.25
    merged = lost = False
    while direction * (bz_stop - bz) > 1e-9:
        bz_try = bz + direction * step
        got = pair_step(field_at(bz_try), qa, qb)
        if got is None:
            if step > 0.035:
                step /= 2.0
                continue
            lost = True
            break
        qa, qb = got[0]["p"], got[1]["p"]
        sep = np.linalg.norm(qa - qb)
        path.append((bz_try, qa.copy(), qb.copy(), state(got[0]), state(got[1])))
        bz = bz_try
        if sep < 0.15:
            merged = True
            break
        step = min(0.25, max(0.03, sep / 12.0))
    sep0 = float(np.linalg.norm(path[0][1] - path[0][2]))
    sep1 = float(np.linalg.norm(path[-1][1] - path[-1][2]))
    print(f"pair d0={d0:.2f} RE at ({a0['p'][0]:.1f},{a0['p'][1]:.1f},"
          f"{a0['p'][2]:.1f}) -> Bz {bz_stop:+.0f}: drove to {bz:+.2f}, "
          f"sep {sep0:.2f}->{sep1:.2f}"
          f"{'  MERGING' if (merged or lost) and sep1 < 0.7 * sep0 else ''}")
    approaching = sep1 < 0.7 * sep0
    return path, bz, step, (merged or lost) and approaching and len(path) > 6


def main():
    t0 = time.time()
    fld0 = field_at(BZ0)
    census = json.loads((ROOT / "artifacts" / "p4_magnetosphere.json").read_text())
    nulls, n_outside = [], 0
    for rec in census["nulls"]:
        nl = newton_one(fld0, rec["p_gsm_re"])
        if nl is None or not interior(nl["p"]):
            continue
        if not inside_mgnp(nl["p"]):
            n_outside += 1
            continue
        if not any(np.linalg.norm(nl["p"] - m["p"]) < 0.3 for m in nulls):
            nl.update(state(nl))
            nulls.append(nl)
    n_spiral = sum(n["type"] == "spiral" for n in nulls)
    print(f"base census (interior, INSIDE model magnetopause): {len(nulls)} "
          f"nulls ({n_spiral} spiral); {n_outside} interior nulls sit outside "
          f"the model boundary  [{time.time() - t0:.0f} s]")

    pairs = []
    for i, a in enumerate(nulls):
        for b in nulls[i + 1:]:
            if a["sign"] * b["sign"] != -1:
                continue
            d = np.linalg.norm(a["p"] - b["p"])
            if d < 10.0:
                pairs.append((float(d), a, b))
    pairs.sort(key=lambda r: r[0])
    print(f"opposite-degree pairs closer than 10 RE: {len(pairs)}")

    event = None
    for d0, a0, b0 in pairs[:14]:
        for bz_stop in (+8.0, -10.0):
            path, bz_last, step_last, hit = drive_pair(a0, b0, bz_stop, d0)
            if not hit:
                continue
            # ---- bisect to Bz_c ------------------------------------------------
            lo = path[-1][0]
            hi = lo + np.sign(bz_stop - BZ0) * max(step_last, 0.05)
            qa_l, qb_l = path[-1][1].copy(), path[-1][2].copy()
            for _ in range(30):
                mid = 0.5 * (lo + hi)
                got = pair_step(field_at(mid), qa_l, qb_l, gate=1.0)
                if got is not None:
                    qa_l, qb_l = got[0]["p"], got[1]["p"]
                    lo = mid
                else:
                    hi = mid
            bz_c = 0.5 * (lo + hi)
            side = 1.0 if lo > bz_c else -1.0          # pair side sign
            side = np.sign(path[-1][0] - bz_c) or -np.sign(bz_stop - BZ0)
            p_star = 0.5 * (qa_l + qb_l)
            print(f"  fold: Bz_c = {bz_c:.5f} nT, collision at GSM "
                  f"({p_star[0]:.2f}, {p_star[1]:.2f}, {p_star[2]:.2f}) RE, "
                  f"residual sep {np.linalg.norm(qa_l - qb_l):.4f} RE")
            if not inside_mgnp(p_star):
                print("  collision outside model magnetopause -- rejected")
                continue

            # ---- certificate: sqrt ladder --------------------------------------
            deltas = np.array([0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 4.0])
            seps, dets = [], []
            qa2, qb2 = qa_l.copy(), qb_l.copy()
            for d in deltas:
                got = pair_step(field_at(bz_c + side * d), qa2, qb2, gate=3.0)
                if got is None:
                    seps.append(np.nan); dets.append((np.nan, np.nan)); continue
                qa2, qb2 = got[0]["p"], got[1]["p"]
                seps.append(float(np.linalg.norm(qa2 - qb2)))
                dets.append((float(np.linalg.det(got[0]["gradB"])),
                             float(np.linalg.det(got[1]["gradB"]))))
            seps_a = np.array(seps); okm = np.isfinite(seps_a)
            if okm.sum() < 5:
                print("  ladder too short -- next"); continue
            slope = float(np.polyfit(np.log(deltas[okm]),
                                     np.log(seps_a[okm]), 1)[0])
            print(f"  separations: {np.round(seps_a, 4).tolist()}")
            print(f"  log-log slope = {slope:.3f}  (fold predicts 0.500)")
            if not (0.38 < slope < 0.62):
                print("  NOT a clean fold -- next"); continue

            # ---- certificate: SR read ------------------------------------------
            rng = np.random.default_rng(7)
            radii = np.geomspace(0.015, 1.2, 9)
            w4 = {}
            for d in [0.0, 0.2, 1.0, 4.0]:
                fld = field_at(bz_c + side * d)
                if d > 0:
                    got = pair_step(fld, qa2, qb2, gate=4.0)
                    base = 0.5 * (got[0]["p"] + got[1]["p"]) if got else p_star
                else:
                    base = p_star
                B0j, Mj, Tj = jet2(fld, base)
                st = bif.jet_structure(B0j, Mj, Tj, f"jet({d:g})")
                Bm = bif.jet_model_B(B0j, Mj, Tj)
                Pchk = rng.uniform(-0.3, 0.3, (24, 3))
                assert np.allclose(st.B(Pchk), Bm(Pchk),
                                   atol=1e-3 * max(1.0, np.abs(Bm(Pchk)).max()))
                curve = bif.flux_exponent_curve(st, [0, 0, 0, 0], radii,
                                                3200, rng)
                w4[f"{d:g}"] = np.round(curve, 3).tolist()
                print(f"  w4(r) at |Bz-Bz_c|={d:4g}: "
                      f"{np.round(curve, 2).tolist()}")
            _, Q = bif.jet_structure(*jet2(field_at(bz_c), p_star), "jet@c") \
                .weights_Q([0, 0, 0, 0], np.geomspace(0.02, 0.3, 7), 4000, rng)
            print(f"  growth vector at collision: Q = {Q}  (fold predicts 7)")

            event = {
                "kind": "annihilation", "dial": "IMF Bz", "driven": True,
                "lam_c": round(float(bz_c), 5), "side": float(side),
                "base": {"pdyn": PDYN, "dst": DST, "bz0": BZ0},
                "p_star": [round(float(v), 3) for v in p_star],
                "signs": [a0["sign"], b0["sign"]],
                "types_at_end": [path[-1][3]["type"], path[-1][4]["type"]],
                "deltas": deltas.tolist(),
                "seps": [None if not np.isfinite(v) else round(float(v), 4)
                         for v in seps_a],
                "dets": [[None if not np.isfinite(v) else round(v, 6)
                          for v in pr] for pr in dets],
                "sqrt_slope": round(slope, 4),
                "w4_radii": radii.tolist(), "w4": w4, "Q_at_c": int(Q),
                "path_a": {"lam": [round(r[0], 4) for r in path],
                           "p": [[round(float(v), 3) for v in r[1]]
                                 for r in path]},
                "path_b": {"lam": [round(r[0], 4) for r in path],
                           "p": [[round(float(v), 3) for v in r[2]]
                                 for r in path]},
                "portrait_a": [[round(r[3]["det_hat"], 4),
                                round(r[3]["disc_hat"], 4)] for r in path],
                "portrait_b": [[round(r[4]["det_hat"], 4),
                                round(r[4]["disc_hat"], 4)] for r in path]}
            break
        if event:
            break

    # ---- inside-only census along the Bz path -----------------------------------
    print("\ninside-magnetopause census along the Bz path:")
    bz_census = []
    for bz in (-9.0, -7.0, -5.0, -3.0, -1.0, +1.0, +3.0):
        fld = field_at(bz)
        found = fld.find_nulls(ms.cusp_and_tail_seeds())
        core = [n for n in found if interior(n["p"]) and inside_mgnp(n["p"])]
        dsum = int(sum(np.sign(np.linalg.det(n["gradB"])) for n in core))
        bz_census.append({"bz": bz, "n_inside": len(core), "degree_sum": dsum})
        print(f"  Bz {bz:+5.1f}: inside nulls {len(core):3d}, degree sum {dsum:+d}"
              f"  [{time.time() - t0:.0f} s]")

    results = {
        "base": {"pdyn": PDYN, "dst": DST, "bz0": BZ0,
                 "epoch": "2012-03-07T00:00Z"},
        "census_note": (f"{len(nulls)} interior nulls inside the model "
                        f"magnetopause at the base state ({n_spiral} spiral); "
                        f"{n_outside} interior nulls of the P4-S3 census sit "
                        f"OUTSIDE the T96 model boundary (t96_mgnp) and are "
                        f"excluded"),
        "n_inside": len(nulls), "n_spiral_inside": n_spiral,
        "n_outside_boundary": n_outside,
        "bz_census": bz_census,
        "phase_portrait": [{
            "lam": BZ0,
            "pts": [{"det_hat": round(n["det_hat"], 4),
                     "disc_hat": round(n["disc_hat"], 4),
                     "type": n["type"], "sign": n["sign"], "interior": True}
                    for n in nulls]}],
        "events": [event] if event else []}
    (ROOT / "artifacts" / "s4_collider.json").write_text(
        json.dumps(results, indent=1) + "\n")
    if event:
        print(f"\nVERDICT H-S4a: CONFIRMED — driven pair annihilates at "
              f"IMF Bz_c = {event['lam_c']} nT")
        print(f"VERDICT H-S4b: degrees {event['signs']}, sqrt slope "
              f"{event['sqrt_slope']} (predict 0.5)")
        print(f"VERDICT H-S4c: Q at collision = {event['Q_at_c']} (predict 7)")
    else:
        print("\nVERDICT: no driven pair merged on the Bz dial — hypothesis open")
    print(f"saved artifacts/s4_collider.json  [{time.time() - t0:.0f} s]")


if __name__ == "__main__":
    main()
