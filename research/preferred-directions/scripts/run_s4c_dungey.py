#!/usr/bin/env python3
"""P4-S4c -- the null collider on the Dungey field: real IGRF + uniform IMF,
with the IMF direction as the dial (pre-registered H-S4a/b/c, third design).

Why this family: the S4b boundary audit showed the T96 magnetosphere model
is NULL-FREE inside its own magnetopause -- its advertised null population
lives in a < 1 RE shell OUTSIDE the boundary, where the model is not
calibrated (that correction is carried in this artifact). The classical
first model of the outer magnetosphere -- the vacuum superposition of the
planet's internal field and a uniform interplanetary field (Chapman-Ferraro
1931; Dungey 1961) -- genuinely owns magnetic nulls: the polar cusp neutral
points. For a PURE DIPOLE the null topology versus IMF direction is
textbook degenerate (an equatorial null RING at the parallel orientation --
the mu < 0 face of the S1 fold family). The real Earth is not a dipole:
IGRF's higher multipoles break the symmetry, so the topology transition
must resolve into GENERIC folds. We sweep the IMF direction and certify
one.

Field: B = B_IGRF(2012-03-07) + B_sw u(theta), |B_sw| = 5 nT (the IMF
magnitude used for the storm day throughout P4), u(theta) in the GSM x-z
plane, theta = angle from +z (northward): theta = 0 northward, 180
southward.

Certificates (as S4/S4b):
  H-S4b: opposite degrees; separation = C sqrt(|theta - theta_c|);
         det gradB -> 0 at theta_c.
  H-S4c: SR 2-jet at the collision: w4(r) crossover collapsing onto
         plateau-4; growth vector Q = 7.

Out: artifacts/s4_collider.json (event + theta census + phase portrait +
the T96 boundary-audit correction from S4b).
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

import nulltopo              # noqa: E402
import bifurcation as bif    # noqa: E402

UT = datetime(2012, 3, 7, 0, 0, tzinfo=timezone.utc).timestamp()
BSW = 5.0                                     # nT, uniform IMF magnitude
RMIN, RMAX = 3.5, 30.0                        # hunt shell [RE]; the 5-nT
# Dungey neutral points sit at r ~ (2 B0/Bsw)^(1/3) ~ 18-23 RE
TOL = 0.05                                    # nT (vacuum field is clean)


class Dungey:
    """Real IGRF internal field + uniform IMF at angle theta from +z (GSM)."""

    def __init__(self, theta_deg):
        from geopack import geopack as gp
        gp.recalc(UT)
        self._igrf = gp.igrf_gsm
        th = np.radians(theta_deg)
        self.bu = BSW * np.array([np.sin(th), 0.0, np.cos(th)])
        self.theta = float(theta_deg)

    def B(self, p):
        x, y, z = float(p[0]), float(p[1]), float(p[2])
        return np.array(self._igrf(x, y, z)) + self.bu

    def jac(self, p, h=0.02):
        J = np.empty((3, 3))
        for a in range(3):
            e = np.zeros(3); e[a] = h
            J[:, a] = (self.B(p + e) - self.B(p - e)) / (2 * h)
        return J


def in_shell(p):
    r = np.linalg.norm(p)
    return RMIN < r < RMAX


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
        if n > 2.0:
            step *= 2.0 / n
        p = p - step
        if not (2.0 < np.linalg.norm(p) < 45.0):
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
            "det_hat": float(np.linalg.det(Mn)),
            "disc_hat": float(np.real((fan[0] - fan[1]) ** 2))}


def hunt(fld, warm=None):
    seeds = [] if warm is None else [np.asarray(w, float) for w in warm]
    for r in (8.0, 12.0, 16.0, 19.0, 22.0, 25.0, 28.0):
        for cth in np.linspace(-0.95, 0.95, 9):
            for ph in np.linspace(0, 2 * np.pi, 12, endpoint=False):
                sth = np.sqrt(1 - cth ** 2)
                seeds.append(r * np.array([sth * np.cos(ph),
                                           sth * np.sin(ph), cth]))
    found = []
    for s in seeds:
        nl = newton_one(fld, s)
        if nl is None or not in_shell(nl["p"]):
            continue
        if any(np.linalg.norm(nl["p"] - f["p"]) < 0.25 for f in found):
            continue
        nl.update(state(nl))
        found.append(nl)
    return found


def pair_step(fld, qa, qb, gate=1.5):
    a = newton_one(fld, qa)
    b = newton_one(fld, qb)
    if a is None or b is None:
        return None
    if np.linalg.norm(a["p"] - qa) > gate or np.linalg.norm(b["p"] - qb) > gate:
        return None
    if np.linalg.norm(a["p"] - b["p"]) < 2e-3:
        return None
    if np.sign(np.linalg.det(a["gradB"])) * np.sign(np.linalg.det(b["gradB"])) != -1:
        return None
    return a, b


def jet2(fld, p0, h=0.05):
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


def main():
    t0 = time.time()
    print(f"Dungey collider: IGRF(2012-03-07) + {BSW} nT uniform IMF; "
          f"dial = theta (angle from +z, x-z plane)")

    thetas = np.arange(0.0, 180.1, 5.0)
    census, warm = [], None
    for th in thetas:
        fld = Dungey(th)
        nulls = hunt(fld, warm=warm)
        warm = [n["p"] for n in nulls]
        dsum = sum(n["sign"] for n in nulls)
        census.append({"theta": float(th), "nulls": nulls,
                       "n": len(nulls), "degree_sum": dsum})
        print(f"theta {th:6.1f}: nulls {len(nulls):2d}  degree sum {dsum:+d}"
              f"   [{time.time() - t0:4.0f} s]")

    # ---- continuation primitives (nulls SPRINT near the cascade: dp/dtheta ~
    # 1/sqrt(delta) diverges at a fold, so all walking is predictor-corrector
    # with adaptive theta-steps; death = failure even at a 1e-5 deg step) -----
    def cont_null(q0, th0, th1, max_move=0.3, step0=0.25):
        """Continue one null th0 -> th1. Returns (q_at_th1 or None, trace)."""
        th = th0
        q = np.asarray(q0, float).copy()
        v = None
        trace = [(th, q.copy())]
        direction = np.sign(th1 - th0)
        step = step0 * direction
        while (th1 - th) * direction > 1e-12:
            s = direction * min(abs(step), abs(th1 - th))
            pred = q + (v * s if v is not None else 0.0)
            nl = newton_one(Dungey(th + s), pred)
            if nl is None or np.linalg.norm(nl["p"] - pred) > max_move:
                if abs(s) > 1e-5:
                    step = s / 2.0
                    continue
                return None, trace
            v = (nl["p"] - q) / s
            q = nl["p"]
            th += s
            trace.append((th, q.copy()))
            step = direction * min(step0, abs(s) * 1.7)
        return q, trace

    def local_partner(fld, p0, sign0, M0=None, ball=0.6):
        """The fold partner lies along the kernel direction of gradB (the
        fold axis) -- seed Newton on that line first, blind ball second."""
        best = None

        def try_seed(s):
            nonlocal best
            nl = newton_one(fld, s)
            if nl is None:
                return
            d = np.linalg.norm(nl["p"] - p0)
            if d < 0.003 or d > 2.0:
                return
            if np.sign(np.linalg.det(nl["gradB"])) * sign0 != -1:
                return
            if best is None or d < best[0]:
                best = (d, nl)

        M = M0 if M0 is not None else fld.jac(np.asarray(p0, float))
        w, V = np.linalg.eig(M)
        u = np.real(V[:, int(np.argmin(np.abs(w)))])
        u /= np.linalg.norm(u)
        for tt in np.geomspace(0.004, 0.9, 30):
            for sgn in (+1.0, -1.0):
                try_seed(np.asarray(p0) + sgn * tt * u)
        if best is not None:
            return best
        for dx in np.linspace(-ball, ball, 9):
            for dy in np.linspace(-ball, ball, 9):
                for dz in np.linspace(-ball, ball, 9):
                    try_seed(np.asarray(p0) + np.array([dx, dy, dz]))
        return best

    def pair_walk_to_fold(qa0, qb0, th0, th_stop):
        """Walk BOTH members down in theta until they die together; record
        (theta, qa, qb, sep, det_a, det_b, states) along the way."""
        th = th0
        qa, qb = np.asarray(qa0, float).copy(), np.asarray(qb0, float).copy()
        va = vb = None
        samples = []
        direction = np.sign(th_stop - th0)
        step = 0.05 * direction
        while (th_stop - th) * direction > 1e-12:
            s = direction * min(abs(step), abs(th_stop - th))
            pa = qa + (va * s if va is not None else 0.0)
            pb = qb + (vb * s if vb is not None else 0.0)
            na = newton_one(Dungey(th + s), pa)
            nb = newton_one(Dungey(th + s), pb)
            sep_prev = np.linalg.norm(qa - qb)
            ok = (na is not None and nb is not None
                  and np.linalg.norm(na["p"] - pa) < max(0.3, 2 * sep_prev)
                  and np.linalg.norm(nb["p"] - pb) < max(0.3, 2 * sep_prev)
                  and np.linalg.norm(na["p"] - nb["p"]) > 1e-4
                  and np.sign(np.linalg.det(na["gradB"]))
                  * np.sign(np.linalg.det(nb["gradB"])) == -1)
            if not ok:
                if abs(s) > 1e-5:
                    step = s / 2.0
                    continue
                break                                  # the fold, to 1e-5 deg
            va = (na["p"] - qa) / s
            vb = (nb["p"] - qb) / s
            qa, qb = na["p"], nb["p"]
            th += s
            samples.append((th, qa.copy(), qb.copy(),
                            float(np.linalg.norm(qa - qb)),
                            float(np.linalg.det(na["gradB"])),
                            float(np.linalg.det(nb["gradB"])),
                            state(na), state(nb)))
            step = direction * min(0.05, abs(s) * 1.7)
        return samples

    event = None
    for k in range(len(census) - 1):
        A, B = census[k], census[k + 1]
        if B["n"] <= A["n"] or event is not None:
            continue
        for n_new in B["nulls"]:
            q_end, trace = cont_null(n_new["p"], B["theta"], A["theta"])
            if q_end is not None:
                continue                               # survived: not newborn
            th_d, q_d = trace[-1]
            # back off from the fold to where the pair is RESOLVABLE, and find
            # the partner there (at th_d itself the separation is below any
            # Newton/dedup resolution -- that is what a fold means)
            th_probe = min(th_d + 0.35, B["theta"])
            q_up, _ = cont_null(q_d, th_d, th_probe)
            if q_up is None:
                continue
            fldP = Dungey(th_probe)
            nl_up = newton_one(fldP, q_up)
            if nl_up is None:
                continue
            hit = local_partner(fldP, nl_up["p"],
                                int(np.sign(np.linalg.det(nl_up["gradB"]))),
                                M0=nl_up["gradB"])
            if hit is None:
                print(f"  newborn dies at theta~{th_d:.3f} "
                      f"({q_d[0]:.1f},{q_d[1]:.1f},{q_d[2]:.1f}): no partner "
                      f"at +0.35 deg -- skip")
                continue
            a0 = {"p": nl_up["p"], "gradB": nl_up["gradB"]}
            a0.update(state(nl_up))
            b0 = {"p": hit[1]["p"], "gradB": hit[1]["gradB"]}
            b0.update(state(hit[1]))
            print(f"\ncount {A['n']} -> {B['n']} in ({A['theta']}, "
                  f"{B['theta']}]: newborn pair, sep {hit[0]:.3f} RE at "
                  f"theta = {th_probe:.3f} (dies ~{th_d:.3f}), GSM "
                  f"({a0['p'][0]:.1f}, {a0['p'][1]:.1f}, {a0['p'][2]:.1f}), "
                  f"degrees ({a0['sign']:+d},{b0['sign']:+d})")

            # ---- walk the pair INTO the fold; the walk is the ladder --------
            samples = pair_walk_to_fold(a0["p"], b0["p"], th_probe,
                                        A["theta"])
            if len(samples) < 12:
                print("  pair walk too short -- skip")
                continue
            th_c = samples[-1][0]                      # +- 1e-5 deg
            p_star = 0.5 * (samples[-1][1] + samples[-1][2])
            deltas_w = np.array([s[0] - th_c for s in samples])
            seps_w = np.array([s[3] for s in samples])
            det_w = np.array([[s[4], s[5]] for s in samples])
            fit = (deltas_w > 1e-4) & (deltas_w < 2.0)
            if fit.sum() < 8:
                print("  too few fit samples -- skip")
                continue
            slope = float(np.polyfit(np.log(deltas_w[fit]),
                                     np.log(seps_w[fit]), 1)[0])
            print(f"  fold: theta_c = {th_c:.5f} deg  (walked to "
                  f"delta = {deltas_w.min():.2e}), collision at GSM "
                  f"({p_star[0]:.2f}, {p_star[1]:.2f}, {p_star[2]:.2f}) RE, "
                  f"r = {np.linalg.norm(p_star):.2f}")
            print(f"  separation at delta 1e-4..2: sqrt-law slope = "
                  f"{slope:.4f}  (fold predicts 0.500); final sep "
                  f"{seps_w.min():.2e} RE; final dets {det_w[-1].round(6)}")
            if not (0.42 < slope < 0.58):
                print("  NOT a clean fold -- skip")
                continue

            # ---- SR certificate --------------------------------------------
            rng = np.random.default_rng(7)
            smax = seps_w[fit].max()
            radii = np.geomspace(max(2e-3, 0.02 * smax), 2.2 * smax, 9)
            w4 = {}
            for dtag, dq in [("0", 0.0), ("0.05", 0.05), ("0.4", 0.4),
                             ("1.6", 1.6)]:
                th_probe = th_c + dq
                if dq > 0:
                    idx = int(np.argmin(np.abs(deltas_w - dq)))
                    base = 0.5 * (samples[idx][1] + samples[idx][2])
                else:
                    base = p_star
                B0j, Mj, Tj = jet2(Dungey(th_probe), base)
                st = bif.jet_structure(B0j, Mj, Tj, f"jet({dtag})")
                Bm = bif.jet_model_B(B0j, Mj, Tj)
                Pchk = rng.uniform(-0.1, 0.1, (24, 3))
                assert np.allclose(st.B(Pchk), Bm(Pchk),
                                   atol=1e-3 * max(1.0,
                                                   np.abs(Bm(Pchk)).max()))
                curve = bif.flux_exponent_curve(st, [0, 0, 0, 0], radii,
                                                3200, rng)
                w4[dtag] = np.round(curve, 3).tolist()
                print(f"  w4(r) at delta={dtag}: {np.round(curve, 2).tolist()}")
            _, Q = bif.jet_structure(*jet2(Dungey(th_c), p_star), "jet@c") \
                .weights_Q([0, 0, 0, 0],
                           np.geomspace(max(1e-3, 0.01 * smax),
                                        0.35 * smax, 7), 4000, rng)
            print(f"  growth vector at collision: Q = {Q}  (fold predicts 7)")

            keep = np.unique(np.geomspace(1, len(samples), 40).astype(int) - 1)
            event = {
                "kind": "creation (walked backward to the fold)",
                "dial": "IMF direction theta", "dial_unit": "deg",
                "driven": True,
                "lam_c": round(float(th_c), 6), "side": 1.0,
                "base": {"bsw_nT": BSW, "epoch": "2012-03-07T00:00Z"},
                "p_star": [round(float(v), 4) for v in p_star],
                "signs": [a0["sign"], b0["sign"]],
                "types_at_end": [a0["type"], b0["type"]],
                "deltas": [round(float(deltas_w[i]), 6) for i in keep],
                "seps": [round(float(seps_w[i]), 6) for i in keep],
                "dets": [[round(float(det_w[i, 0]), 6),
                          round(float(det_w[i, 1]), 6)] for i in keep],
                "sqrt_slope": round(slope, 4),
                "w4_radii": radii.tolist(), "w4": w4, "Q_at_c": int(Q),
                "path_a": {"lam": [round(float(samples[i][0]), 5)
                                   for i in keep],
                           "p": [[round(float(v), 4) for v in samples[i][1]]
                                 for i in keep]},
                "path_b": {"lam": [round(float(samples[i][0]), 5)
                                   for i in keep],
                           "p": [[round(float(v), 4) for v in samples[i][2]]
                                 for i in keep]},
                "portrait_a": [[round(samples[i][6]["det_hat"], 5),
                                round(samples[i][6]["disc_hat"], 5)]
                               for i in keep],
                "portrait_b": [[round(samples[i][7]["det_hat"], 5),
                                round(samples[i][7]["disc_hat"], 5)]
                               for i in keep]}
            break
        if event:
            break

    # ---- carry the T96 boundary-audit correction over -----------------------------
    try:
        prev = json.loads((ROOT / "artifacts" / "s4_collider.json").read_text())
        t96_audit = {"census_note": prev.get("census_note"),
                     "n_inside": prev.get("n_inside"),
                     "n_outside_boundary": prev.get("n_outside_boundary"),
                     "bz_census_inside": prev.get("bz_census")}
    except FileNotFoundError:
        t96_audit = None

    results = {
        "family": f"IGRF(2012-03-07) + uniform IMF {BSW} nT (Dungey/"
                  "Chapman-Ferraro vacuum superposition)",
        "dial": "theta = IMF angle from +z (GSM), x-z plane, degrees",
        "theta_census": [{"theta": c["theta"], "n": c["n"],
                          "degree_sum": c["degree_sum"]} for c in census],
        "phase_portrait": [{
            "lam": c["theta"],
            "pts": [{"det_hat": round(n["det_hat"], 4),
                     "disc_hat": round(n["disc_hat"], 4),
                     "type": n["type"], "sign": n["sign"], "interior": True}
                    for n in c["nulls"]]} for c in census],
        "t96_boundary_audit": t96_audit,
        "events": [event] if event else []}
    (ROOT / "artifacts" / "s4_collider.json").write_text(
        json.dumps(results, indent=1) + "\n")
    if event:
        print(f"\nVERDICT H-S4a: CONFIRMED — pair annihilates at "
              f"theta_c = {event['lam_c']} deg")
        print(f"VERDICT H-S4b: degrees {event['signs']}, sqrt slope "
              f"{event['sqrt_slope']} (predict 0.5)")
        print(f"VERDICT H-S4c: Q at collision = {event['Q_at_c']} (predict 7)")
    else:
        print("\nVERDICT: no certified fold on the theta dial — open")
    print(f"saved artifacts/s4_collider.json  [{time.time() - t0:.0f} s]")


if __name__ == "__main__":
    main()
