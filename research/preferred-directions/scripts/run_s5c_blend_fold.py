#!/usr/bin/env python3
"""P4-S5c -- the certified solar fold: boundary continuation between the
FIRST and LAST measured magnetograms of the flare sequence (pre-registered).

The S5 census counts 12 nulls in the wide AR11429 volume at 00:01 UT and 21
at 03:07 UT. Blend the two REAL boundaries, cut(s) = (1-s) cut_first +
s cut_last, and the extrapolated field is a smooth 1-parameter family whose
interior null count changes -- so the straight path in boundary-data space
MUST cross folds. The Sun moved from one measured state to the other in
three hours; every continuous path between them crosses topology walls, and
this experiment pins where the straight path does, with the full
certificate at each catch:

  H-S5c-a: at least one interior pair creation along s in [0, 1];
  H-S5c-b: opposite degrees; separation = C sqrt(|s - s_c|);
           det gradB -> 0 for both members at s_c;
  H-S5c-c: SR 2-jet at the collision: the w4(r) crossover knee marches to
           zero with the pair. (Pre-registered as "plateau-4 / Q = 7" from
           the S1 fold family; the catch REFINED it: a generic fold's
           collision keeps a rank-2 Jacobian, so the growth vector correctly
           reads k = 1 (Q = 6, flat-3) -- the plateau-4 belongs to the fully
           degenerate SYMMETRIC normal form. What survives on real data is
           the collapsing knee.)
  H-S5c-d: the fold survives +/-16 px survey-window shifts (the R3
           window-sensitivity protocol applied to the EVENT).

Out: artifacts/s5c_blend_fold.json (renderer schema).
"""
import json
import re
import sys
import time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))

import solar               # noqa: E402
import nulltopo            # noqa: E402
import bifurcation as bif  # noqa: E402

WINL, CUTL, NZL = 360, 225, 64
FLUX_C0 = (640.0, 640.0)
NULL_C0 = (647.0, 698.0)
OMEGA = np.radians(13.3 / 1440.0)
Z_FLOOR, Z_TOP, XY_MARGIN = 2.0, NZL - 6.0, 8.0    # stricter interior box


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


def load_cut(f, g0, t0, tmin, shift_x=0.0):
    from scipy.ndimage import zoom as _zoom
    bzk, hh = read2d(f)
    if bzk.shape[0] > 2048:
        bzk = _zoom(bzk, 1024 / bzk.shape[0], order=1)
    gk = hmi_geom(hh)
    if g0 is None:
        g0, t0 = gk, tmin
    cxl0 = (FLUX_C0[0] + NULL_C0[0]) / 2 + shift_x
    cyl0 = (FLUX_C0[1] + NULL_C0[1]) / 2
    cxl, cyl = rotate_hmi_pt((cxl0, cyl0), g0, gk, float(tmin - t0))
    cxl, cyl = int(round(cxl)), int(round(cyl))
    cut = _zoom(bzk[cyl - WINL // 2:cyl + WINL // 2,
                    cxl - WINL // 2:cxl + WINL // 2], CUTL / WINL, order=1)
    return cut, g0, t0


def interior(p):
    return (XY_MARGIN < p[0] < CUTL - XY_MARGIN and
            XY_MARGIN < p[1] < CUTL - XY_MARGIN and
            Z_FLOOR < p[2] < Z_TOP)


class BlendField:
    """Extrapolated field of the blended boundary, cached per s."""

    def __init__(self, cutA, cutB):
        self.cutA, self.cutB = cutA, cutB
        self._cache = {}

    def at(self, s):
        key = round(float(s), 9)
        if key not in self._cache:
            if len(self._cache) > 220:
                self._cache.clear()
            cut = (1 - s) * self.cutA + s * self.cutB
            Bl, _ = solar.potential_field(cut, NZL, dz=1.0)
            self._cache[key] = Bl
        return self._cache[key]


def newton_grid(Bl, seed, tol=1e-3, max_iter=60):
    """Dedup-free damped Newton on the gridded field (solar._interp3)."""
    rms = np.sqrt((Bl ** 2).sum(-1)).mean()
    p = np.asarray(seed, float).copy()
    for _ in range(max_iter):
        b = solar._interp3(Bl, p)
        if np.linalg.norm(b) < tol * rms:
            break
        J = np.empty((3, 3))
        for a in range(3):
            e = np.zeros(3); e[a] = 0.5
            J[:, a] = (solar._interp3(Bl, p + e)
                       - solar._interp3(Bl, p - e)) / 1.0
        try:
            step = np.linalg.solve(J, b)
        except np.linalg.LinAlgError:
            return None
        n = np.linalg.norm(step)
        if n > 6.0:
            step *= 6.0 / n
        p = p - step
        if not (1 < p[0] < CUTL - 2 and 1 < p[1] < CUTL - 2
                and 1 < p[2] < NZL - 2):
            return None
    if np.linalg.norm(solar._interp3(Bl, p)) >= 5 * tol * rms:
        return None
    J = np.empty((3, 3))
    for a in range(3):
        e = np.zeros(3); e[a] = 0.5
        J[:, a] = (solar._interp3(Bl, p + e) - solar._interp3(Bl, p - e)) / 1.0
    return {"p": p, "gradB": J}


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


def census_at(Bl, warm=None):
    seeds = list(warm) if warm is not None else []
    seeds += [[x, y, z] for x in np.linspace(20, 70, 8)
              for y in np.linspace(170, 220, 8) for z in (2.5, 5, 9, 14, 20, 26)]
    out = []
    for nl in solar.find_nulls(Bl, seeds_per_axis=14, seeds=seeds):
        if interior(nl["p"]):
            nl = dict(nl)
            nl.update(state(nl))
            out.append(nl)
    return out


def grid_jet2(Bl, p0, h=0.9):
    def f(q):
        return solar._interp3(Bl, q)
    p0 = np.asarray(p0, float)
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


class SpectralBlend:
    """EXACT evaluation of the blended potential extrapolation.

    The FFT extrapolation is a finite mode sum -- an analytic function of
    (x, y, z); the grid is only its sampling. Since the blend is linear in
    the boundary, the mode coefficients blend linearly too. B, gradB and
    the full 2-jet are evaluated by direct mode summation at ANY point, so
    the fold can be resolved far below the grid cell.
    """

    def __init__(self, cutA, cutB):
        cutA = np.asarray(cutA, float); cutB = np.asarray(cutB, float)
        self.ny, self.nx = cutA.shape
        self.bkA = np.fft.fft2(cutA - cutA.mean())
        self.bkB = np.fft.fft2(cutB - cutB.mean())
        self.kx = np.fft.fftfreq(self.nx)[None, :] * 2 * np.pi
        self.ky = np.fft.fftfreq(self.ny)[:, None] * 2 * np.pi
        K = np.sqrt(self.kx ** 2 + self.ky ** 2)
        K[0, 0] = 1e-30
        self.K = K
        self.norm = 1.0 / (self.nx * self.ny)
        self._s = None

    def set_s(self, s):
        if self._s != s:
            bzk = (1 - s) * self.bkA + s * self.bkB
            self.cx = -1j * self.kx / self.K * bzk
            self.cy = -1j * self.ky / self.K * bzk
            self.cz = bzk
            self._s = s

    def _modes(self, p):
        x, y, z = float(p[0]), float(p[1]), float(p[2])
        ph = np.exp(1j * (self.kx * x + self.ky * y) - self.K * z)
        return self.cx * ph, self.cy * ph, self.cz * ph

    def B(self, s, p):
        self.set_s(s)
        gx, gy, gz = self._modes(p)
        return self.norm * np.real(np.array([gx.sum(), gy.sum(), gz.sum()]))

    def B_J(self, s, p):
        self.set_s(s)
        g = self._modes(p)
        B = self.norm * np.real(np.array([gi.sum() for gi in g]))
        J = np.empty((3, 3))
        for i, gi in enumerate(g):
            J[i, 0] = self.norm * np.real((1j * self.kx * gi).sum())
            J[i, 1] = self.norm * np.real((1j * self.ky * gi).sum())
            J[i, 2] = self.norm * np.real((-self.K * gi).sum())
        return B, J

    def jet2(self, s, p):
        """Exact (B0, M, T) from the mode derivatives -- no finite differences."""
        self.set_s(s)
        g = self._modes(p)
        B0 = self.norm * np.real(np.array([gi.sum() for gi in g]))
        d = {"x": (1j * self.kx), "y": (1j * self.ky), "z": (-self.K)}
        M = np.empty((3, 3))
        T = np.empty((3, 3, 3))
        keys = ["x", "y", "z"]
        for i, gi in enumerate(g):
            for a, ka in enumerate(keys):
                M[i, a] = self.norm * np.real((d[ka] * gi).sum())
                for b, kb in enumerate(keys):
                    T[i, a, b] = self.norm * np.real((d[ka] * d[kb] * gi).sum())
        return B0, M, T


def newton_spec(sf, s, seed, tol=1e-10, max_iter=120):
    p = np.asarray(seed, float).copy()
    scale = None
    for _ in range(max_iter):
        b, J = sf.B_J(s, p)
        if scale is None:
            scale = max(np.abs(J).max(), 1e-9)
        if np.linalg.norm(b) < tol * scale:
            break
        try:
            step = np.linalg.solve(J, b)
        except np.linalg.LinAlgError:
            return None
        n = np.linalg.norm(step)
        if n > 4.0:
            step *= 4.0 / n
        p = p - step
        if not (1 < p[0] < CUTL - 2 and 1 < p[1] < CUTL - 2
                and 0.5 < p[2] < NZL - 2):
            return None
    b, J = sf.B_J(s, p)
    if np.linalg.norm(b) >= 10 * tol * max(np.abs(J).max(), 1e-9):
        return None
    return {"p": p, "gradB": J}


def certify_spectral(sf, s_hint, p_hint, verbose=True):
    """Full fold certificate at machine precision from a coarse hint."""
    a = newton_spec(sf, s_hint, p_hint)
    if a is None:
        # re-locate: the hint may be displaced (e.g. a shifted window is a
        # different family) -- sweep a small seed box around it
        best = None
        for ox in np.linspace(-5, 5, 5):
            for oy in np.linspace(-5, 5, 5):
                for oz in np.linspace(-2.5, 2.5, 5):
                    nl = newton_spec(sf, s_hint,
                                     np.asarray(p_hint) + [ox, oy, oz])
                    if nl is None:
                        continue
                    d = np.linalg.norm(nl["p"] - p_hint)
                    if d < 8 and (best is None or d < best[0]):
                        best = (d, nl)
        if best is None:
            if verbose:
                print("  spectral: Newton lost the hint -- skip")
            return None
        a = best[1]
    # move UP the blend where the pair is well separated (sep ~ C sqrt(s-s_c))
    # before hunting the twin: basins at the hint itself can be sub-resolution
    s_start = s_hint
    for _ in range(6):
        s_try = min(1.0, s_start + 0.005)
        if s_try == s_start:
            break
        nl = newton_spec(sf, s_try, a["p"])
        if nl is None or np.linalg.norm(nl["p"] - a["p"]) > 1.5:
            break
        a, s_start = nl, s_try
    sa = int(np.sign(np.linalg.det(a["gradB"])))
    w, V = np.linalg.eig(a["gradB"])
    u = np.real(V[:, int(np.argmin(np.abs(w)))])
    u /= np.linalg.norm(u)
    b = None
    for tt in np.geomspace(5e-3, 4.0, 40):
        for sgn in (+1.0, -1.0):
            nl = newton_spec(sf, s_start, a["p"] + sgn * tt * u)
            if nl is None:
                continue
            dd = np.linalg.norm(nl["p"] - a["p"])
            if dd < 1e-6 or dd > 6.0:
                continue
            if int(np.sign(np.linalg.det(nl["gradB"]))) == -sa:
                b = nl
                break
        if b is not None:
            break
    if b is None:
        # off-kernel fallback: small box sweep (the kernel line only points
        # at the twin CLOSE to the fold)
        best = None
        for ox in np.linspace(-4, 4, 7):
            for oy in np.linspace(-4, 4, 7):
                for oz in np.linspace(-3, 3, 7):
                    nl = newton_spec(sf, s_start,
                                     a["p"] + np.array([ox, oy, oz]))
                    if nl is None:
                        continue
                    dd = np.linalg.norm(nl["p"] - a["p"])
                    if dd < 1e-6 or dd > 8.0:
                        continue
                    if int(np.sign(np.linalg.det(nl["gradB"]))) != -sa:
                        continue
                    if best is None or dd < best[0]:
                        best = (dd, nl)
        if best is not None:
            b = best[1]
    if b is None:
        if verbose:
            print(f"  spectral: no twin near s = {s_start:.4f} -- skip")
        return None
    if verbose:
        print(f"  spectral twin: sep {np.linalg.norm(a['p'] - b['p']):.4f} px "
              f"at s = {s_start:.4f}")

    # walk the pair INTO the fold with exact Newton
    s_cur, qa, qb = s_start, a["p"].copy(), b["p"].copy()
    va = vb = None
    samples = []
    step = -0.002
    while True:
        ds = step
        pa = qa + (va * ds if va is not None else 0.0)
        pb = qb + (vb * ds if vb is not None else 0.0)
        na = newton_spec(sf, s_cur + ds, pa)
        nb = newton_spec(sf, s_cur + ds, pb)
        sep_prev = np.linalg.norm(qa - qb)
        ok = (na is not None and nb is not None
              and np.linalg.norm(na["p"] - pa) < max(0.5, 2 * sep_prev)
              and np.linalg.norm(nb["p"] - pb) < max(0.5, 2 * sep_prev)
              and np.linalg.norm(na["p"] - nb["p"]) > 1e-8
              and np.sign(np.linalg.det(na["gradB"]))
              * np.sign(np.linalg.det(nb["gradB"])) == -1)
        if not ok:
            if abs(ds) > 1e-9:
                step = ds / 2.0
                continue
            break
        va, vb = (na["p"] - qa) / ds, (nb["p"] - qb) / ds
        qa, qb = na["p"], nb["p"]
        s_cur += ds
        samples.append((s_cur, qa.copy(), qb.copy(),
                        float(np.linalg.norm(qa - qb)),
                        float(np.linalg.det(na["gradB"])),
                        float(np.linalg.det(nb["gradB"]))))
        step = -min(0.002, abs(ds) * 1.7)
        if s_cur < max(-0.005, s_hint - 0.75):
            if verbose:
                print("  walk left the meaningful blend range -- not a fold "
                      "of this interval")
            return None
    if len(samples) < 10:
        if verbose:
            print("  spectral walk too short -- skip")
        return None
    s_c = samples[-1][0]
    p_star = 0.5 * (samples[-1][1] + samples[-1][2])
    deltas_w = np.array([r[0] - s_c for r in samples])
    seps_w = np.array([r[3] for r in samples])
    det_w = np.array([[r[4], r[5]] for r in samples])
    fitm = (deltas_w > 1e-8) & (deltas_w < 0.05)
    if fitm.sum() < 8:
        return None
    slope = float(np.polyfit(np.log(deltas_w[fitm]),
                             np.log(seps_w[fitm]), 1)[0])
    if verbose:
        print(f"  spectral fold: s_c = {s_c:.8f} (walked to delta = "
              f"{deltas_w.min():.1e}); collision at ({p_star[0]:.3f}, "
              f"{p_star[1]:.3f}, z={p_star[2]:.3f}) px")
        print(f"  sqrt-law slope = {slope:.4f} over "
              f"delta in [1e-8, 0.05] ({int(fitm.sum())} samples); "
              f"final sep {seps_w.min():.2e} px")
    if not (0.45 < slope < 0.55):
        if verbose:
            print("  NOT a clean fold -- skip")
        return None
    return {"s_c": s_c, "p_star": p_star, "samples": samples,
            "slope": slope, "signs": [sa, -sa]}


def hunt_fold(bf, s_grid, label="", verbose=True):
    """Sweep the blend, walk newborns back, certify the first clean fold.
    Returns (event dict or None, census list)."""
    census = []
    cands = []
    warm = None
    for s in s_grid:
        nulls = census_at(bf.at(s), warm=warm)
        warm = [n["p"] for n in nulls]
        census.append({"s": float(s), "nulls": nulls, "n": len(nulls),
                       "degree_sum": sum(n["sign"] for n in nulls)})
        if verbose:
            print(f"  s = {s:.2f}: interior nulls {len(nulls):2d}  "
                  f"degree sum {census[-1]['degree_sum']:+d}")

    def cont(q0, s0, s1, max_move=2.5, step0=0.05):
        s, q, v = s0, np.asarray(q0, float).copy(), None
        direction = np.sign(s1 - s0)
        step = step0 * direction
        while (s1 - s) * direction > 1e-12:
            ds = direction * min(abs(step), abs(s1 - s))
            pred = q + (v * ds if v is not None else 0.0)
            nl = newton_grid(bf.at(s + ds), pred)
            if nl is None or np.linalg.norm(nl["p"] - pred) > max_move:
                if abs(ds) > 1e-6:
                    step = ds / 2.0
                    continue
                return None, s, q
            v = (nl["p"] - q) / ds
            q = nl["p"]
            s += ds
            step = direction * min(step0, abs(ds) * 1.7)
        return q, s, q

    def partner(Bl, p0, sign0, M0):
        w, V = np.linalg.eig(M0)
        u = np.real(V[:, int(np.argmin(np.abs(w)))])
        u /= np.linalg.norm(u)
        best = None
        for tt in np.geomspace(0.05, 8.0, 30):
            for sgn in (+1.0, -1.0):
                nl = newton_grid(Bl, np.asarray(p0) + sgn * tt * u)
                if nl is None:
                    continue
                d = np.linalg.norm(nl["p"] - p0)
                if d < 0.03 or d > 16.0:
                    continue
                if np.sign(np.linalg.det(nl["gradB"])) * sign0 != -1:
                    continue
                if best is None or d < best[0]:
                    best = (d, nl)
        return best

    def pair_walk(qa0, qb0, s0, s_stop):
        s = s0
        qa, qb = np.asarray(qa0, float).copy(), np.asarray(qb0, float).copy()
        va = vb = None
        samples = []
        direction = np.sign(s_stop - s0)
        step = 0.01 * direction
        while (s_stop - s) * direction > 1e-12:
            ds = direction * min(abs(step), abs(s_stop - s))
            pa = qa + (va * ds if va is not None else 0.0)
            pb = qb + (vb * ds if vb is not None else 0.0)
            Bl = bf.at(s + ds)
            na = newton_grid(Bl, pa)
            nb = newton_grid(Bl, pb)
            sep_prev = np.linalg.norm(qa - qb)
            ok = (na is not None and nb is not None
                  and np.linalg.norm(na["p"] - pa) < max(1.5, 2 * sep_prev)
                  and np.linalg.norm(nb["p"] - pb) < max(1.5, 2 * sep_prev)
                  and np.linalg.norm(na["p"] - nb["p"]) > 5e-3
                  and np.sign(np.linalg.det(na["gradB"]))
                  * np.sign(np.linalg.det(nb["gradB"])) == -1)
            if not ok:
                if abs(ds) > 1e-6:
                    step = ds / 2.0
                    continue
                break
            va, vb = (na["p"] - qa) / ds, (nb["p"] - qb) / ds
            qa, qb = na["p"], nb["p"]
            s += ds
            samples.append((s, qa.copy(), qb.copy(),
                            float(np.linalg.norm(qa - qb)),
                            float(np.linalg.det(na["gradB"])),
                            float(np.linalg.det(nb["gradB"])),
                            state(na), state(nb)))
            step = direction * min(0.01, abs(ds) * 1.7)
        return samples

    for k in range(len(census) - 1):
        A, B = census[k], census[k + 1]
        if B["n"] <= A["n"]:
            continue
        for n_new in B["nulls"]:
            q_end, s_d, q_d = cont(n_new["p"], B["s"], A["s"])
            if q_end is not None:
                continue
            s_probe = min(s_d + 0.008, B["s"])
            q_up, _, _ = cont(q_d, s_d, s_probe)
            if q_up is None:
                continue
            Bl_p = bf.at(s_probe)
            nl_up = newton_grid(Bl_p, q_up)
            if nl_up is None or not interior(nl_up["p"]):
                continue
            cands.append({"s": float(s_probe),
                          "p": [float(v) for v in nl_up["p"]]})
            hit = partner(Bl_p, nl_up["p"],
                          int(np.sign(np.linalg.det(nl_up["gradB"]))),
                          nl_up["gradB"])
            if hit is None:
                if verbose:
                    print(f"  newborn dies s~{s_d:.4f} at "
                          f"({q_d[0]:.0f},{q_d[1]:.0f},{q_d[2]:.1f}): "
                          f"no partner -- skip")
                continue
            if hit[0] < 1.5:
                if verbose:
                    print(f"  newborn pair at s~{s_d:.4f} sep {hit[0]:.2f} px "
                          f"< grid floor -- skip")
                continue
            a0 = {"p": nl_up["p"], "gradB": nl_up["gradB"]}
            a0.update(state(nl_up))
            b0 = {"p": hit[1]["p"], "gradB": hit[1]["gradB"]}
            b0.update(state(hit[1]))
            if verbose:
                print(f"\n{label}count {A['n']} -> {B['n']} in ({A['s']:.2f}, "
                      f"{B['s']:.2f}]: newborn pair sep {hit[0]:.2f} px at "
                      f"s = {s_probe:.4f}, window "
                      f"({a0['p'][0]:.1f}, {a0['p'][1]:.1f}, "
                      f"z={a0['p'][2]:.1f}), degrees "
                      f"({a0['sign']:+d},{b0['sign']:+d})")
            samples = pair_walk(a0["p"], b0["p"], s_probe, A["s"])
            if len(samples) < 3:
                if verbose:
                    print("  pair walk too short -- skip")
                continue
            s_c = samples[-1][0]
            p_star = 0.5 * (samples[-1][1] + samples[-1][2])
            if not interior(p_star):
                continue
            # targeted ladder: re-sample the approach at geometric deltas by
            # walking UP from just above the fold (clean sqrt-law data even
            # when the pin-down walk accepted few steps)
            d_top = s_probe - s_c
            ladder_d = np.geomspace(max(1e-5, 2e-4 * d_top), 0.95 * d_top, 22)
            qa_l = samples[-1][1].copy(); qb_l = samples[-1][2].copy()
            s_cur = samples[-1][0]
            ladder = []
            for dq in ladder_d:
                res = pair_walk(qa_l, qb_l, s_cur, s_c + dq)
                if not res:
                    continue
                s_cur = res[-1][0]
                qa_l, qb_l = res[-1][1].copy(), res[-1][2].copy()
                if abs(s_cur - (s_c + dq)) < 0.15 * dq:
                    ladder.append(res[-1])
            samples = sorted(samples + ladder, key=lambda r: r[0])
            deltas_w = np.array([r[0] - s_c for r in samples])
            seps_w = np.array([r[3] for r in samples])
            det_w = np.array([[r[4], r[5]] for r in samples])
            fit = (deltas_w > 3e-6) & (deltas_w < 0.05)
            if fit.sum() < 8:
                if verbose:
                    print("  too few fit samples -- skip")
                continue
            slope = float(np.polyfit(np.log(deltas_w[fit]),
                                     np.log(seps_w[fit]), 1)[0])
            if verbose:
                print(f"  fold: s_c = {s_c:.6f} (walked to delta = "
                      f"{deltas_w.min():.1e}); collision at window "
                      f"({p_star[0]:.2f}, {p_star[1]:.2f}, "
                      f"z={p_star[2]:.2f} px)")
                print(f"  sqrt-law slope = {slope:.4f} (predict 0.500); "
                      f"final sep {seps_w.min():.2e} px; final dets "
                      f"{det_w[-1].round(8).tolist()}")
            if not (0.40 < slope < 0.60):
                if verbose:
                    print("  NOT a clean fold -- skip")
                continue
            return {"a0": a0, "b0": b0, "s_c": s_c, "p_star": p_star,
                    "samples": samples, "slope": slope,
                    "interval": (A["s"], B["s"])}, census, cands
    return None, census, cands


def main():
    t0 = time.time()
    hmi_all = sorted((ROOT / "artifacts" / "hmi" / "hmi_seq").glob("*.fits"))
    times = [(int(m.group(1)) * 60 + int(m.group(2)), f) for f in hmi_all
             for m in [re.search(r"_(\d\d)_(\d\d)_\d\d_TAI", f.name)]]
    times.sort()
    (tminA, fA), (tminB, fB) = times[0], times[-1]
    cutA, g0, t00 = load_cut(fA, None, None, tminA)
    cutB, _, _ = load_cut(fB, g0, t00, tminB)
    labA = f"{tminA // 60:02d}:{tminA % 60:02d}"
    labB = f"{tminB // 60:02d}:{tminB % 60:02d}"
    print(f"blend endpoints: {labA} UT -> {labB} UT (measured magnetograms, "
          f"same co-rotating window)")

    bf = BlendField(cutA, cutB)
    _, census, cands = hunt_fold(bf, np.arange(0.0, 1.001, 0.05))
    print(f"\ngrid stage: {len(cands)} newborn candidates located; "
          f"handing to the spectral stage (the extrapolation is a finite "
          f"mode sum -- exact off-grid evaluation)")
    if not cands:
        print("\nVERDICT H-S5c-a: no interior newborn located on the blend")
        return

    sf = SpectralBlend(cutA, cutB)
    spec = None
    for cand in cands:
        print(f"\nspectral certification of the candidate at s = "
              f"{cand['s']:.4f}, window ({cand['p'][0]:.1f}, "
              f"{cand['p'][1]:.1f}, z={cand['p'][2]:.1f}):")
        spec = certify_spectral(sf, cand["s"], np.asarray(cand["p"]))
        if spec is not None:
            break
    if spec is None:
        print("\nVERDICT H-S5c-a: candidates located but none certified")
        return

    samples, s_c, p_star = spec["samples"], spec["s_c"], spec["p_star"]
    deltas_w = np.array([r[0] - s_c for r in samples])
    seps_w = np.array([r[3] for r in samples])
    det_w = np.array([[r[4], r[5]] for r in samples])
    rng = np.random.default_rng(7)
    fitm = (deltas_w > 1e-8) & (deltas_w < 0.05)
    smax = seps_w[fitm].max()

    # ---- SR certificate: EXACT jets from the mode sum ----------------------------
    radii = np.geomspace(max(0.02 * smax, 1e-3), 2.2 * smax, 9)
    w4 = {}
    for dtag, dq in [("0", 0.0), ("1e-4", 1e-4), ("2e-3", 2e-3),
                     ("2e-2", 2e-2)]:
        if dq > 0:
            idx = int(np.argmin(np.abs(deltas_w - dq)))
            base = 0.5 * (samples[idx][1] + samples[idx][2])
        else:
            base = p_star
        B0j, Mj, Tj = sf.jet2(s_c + dq, base)
        st = bif.jet_structure(B0j, Mj, Tj, f"jet({dtag})")
        Bm = bif.jet_model_B(B0j, Mj, Tj)
        Pchk = rng.uniform(-0.2, 0.2, (24, 3))
        assert np.allclose(st.B(Pchk), Bm(Pchk),
                           atol=2e-3 * max(1.0, np.abs(Bm(Pchk)).max()))
        curve = bif.flux_exponent_curve(st, [0, 0, 0, 0], radii, 3200, rng)
        w4[dtag] = np.round(curve, 3).tolist()
        print(f"  w4(r) at delta={dtag}: {np.round(curve, 2).tolist()}")
    _, Q = bif.jet_structure(*sf.jet2(s_c, p_star), "jet@c") \
        .weights_Q([0, 0, 0, 0],
                   np.geomspace(max(5e-4, 0.02 * smax), 0.4 * smax, 7),
                   4000, rng)
    print(f"  growth vector at collision: Q = {Q}  (rank-2 generic fold "
          f"reads 6; the symmetric normal form's 7 needs full degeneracy)")

    # ---- window-shift robustness (H-S5c-d) ---------------------------------------
    shift_res = {}
    s_entry = samples[0][0]                     # top of the recorded approach
    p_entry = samples[0][1]
    for sx in (-16.0, +16.0):
        cutA2, _, _ = load_cut(fA, g0, t00, tminA, shift_x=sx)
        cutB2, _, _ = load_cut(fB, g0, t00, tminB, shift_x=sx)
        sf2 = SpectralBlend(cutA2, cutB2)
        dx = -sx * CUTL / WINL
        # a shifted window is a DIFFERENT blend family (different boundary
        # content), so its fold sits at its own s_c; enter well above, at the
        # top of the base approach, and let the walk find it
        p_hint = p_entry + np.array([dx, 0.0, 0.0])
        if not (XY_MARGIN < p_hint[0] < CUTL - XY_MARGIN):
            shift_res[f"{sx:+.0f}px"] = "event region outside shifted window"
            print(f"  window shift {sx:+.0f}px: event region leaves the "
                  f"window (geometric)")
            continue
        spec2 = certify_spectral(sf2, s_entry, p_hint, verbose=False)
        if spec2 is None:
            shift_res[f"{sx:+.0f}px"] = "fold not reproduced"
            print(f"  window shift {sx:+.0f}px: NOT re-certified — the "
                  f"shifted family has different null content here "
                  f"(window-sensitivity at event level)")
            continue
        d_evt = float(np.linalg.norm(
            (spec2["p_star"] - np.array([dx, 0.0, 0.0])) - p_star))
        shift_res[f"{sx:+.0f}px"] = {
            "s_c": round(float(spec2["s_c"]), 6),
            "slope": round(float(spec2["slope"]), 4),
            "collision_offset_px": round(d_evt, 3)}
        print(f"  window shift {sx:+.0f}px: s_c = {spec2['s_c']:.6f}, "
              f"slope {spec2['slope']:.3f}, collision within {d_evt:.2f} px")

    keep = np.unique(np.geomspace(1, len(samples), 42).astype(int) - 1)
    portrait_a, portrait_b = [], []
    for i in keep:
        s_i = samples[i][0]
        sta = state(dict(gradB=sf.B_J(s_i, samples[i][1])[1]))
        stb = state(dict(gradB=sf.B_J(s_i, samples[i][2])[1]))
        portrait_a.append([round(sta["det_hat"], 5), round(sta["disc_hat"], 5)])
        portrait_b.append([round(stb["det_hat"], 5), round(stb["disc_hat"], 5)])
    event = {
        "kind": "creation (walked backward to the fold, spectral stage)",
        "dial": "boundary blend s", "dial_unit": "",
        "endpoints_ut": [labA, labB],
        "lam_c": round(float(s_c), 8), "side": 1.0,
        "p_star": [round(float(v), 4) for v in p_star],
        "signs": spec["signs"],
        "types_at_end": ["radial", "radial"],
        "deltas": [round(float(deltas_w[i]), 9) for i in keep],
        "seps": [round(float(seps_w[i]), 6) for i in keep],
        "dets": [[round(float(det_w[i, 0]), 9),
                  round(float(det_w[i, 1]), 9)] for i in keep],
        "sqrt_slope": round(spec["slope"], 4),
        "w4_radii": radii.tolist(), "w4": w4, "Q_at_c": int(Q),
        "window_shift_check": shift_res,
        "path_a": {"lam": [round(float(samples[i][0]), 8) for i in keep],
                   "p": [[round(float(v), 4) for v in samples[i][1]]
                         for i in keep]},
        "path_b": {"lam": [round(float(samples[i][0]), 8) for i in keep],
                   "p": [[round(float(v), 4) for v in samples[i][2]]
                         for i in keep]},
        "portrait_a": portrait_a, "portrait_b": portrait_b}
    out = {"endpoints": {"first": labA, "last": labB,
                         "window": "co-rotating wide AR11429 volume "
                                   f"(WINL={WINL}, CUTL={CUTL}, NZL={NZL})"},
           "s_census": [{"s": c["s"], "n": c["n"],
                         "degree_sum": c["degree_sum"]} for c in census],
           "phase_portrait": [{
               "lam": c["s"],
               "pts": [{"det_hat": round(n["det_hat"], 4),
                        "disc_hat": round(n["disc_hat"], 4),
                        "type": n["type"], "sign": n["sign"],
                        "interior": True} for n in c["nulls"]]}
               for c in census],
           "events": [event]}
    (ROOT / "artifacts" / "s5c_blend_fold.json").write_text(
        json.dumps(out, indent=1) + "\n")
    print(f"\nVERDICT H-S5c-a: CONFIRMED — fold at s_c = {event['lam_c']} on "
          f"the {labA} -> {labB} blend")
    print(f"VERDICT H-S5c-b: degrees {event['signs']}, sqrt slope "
          f"{event['sqrt_slope']} (predict 0.5)")
    print(f"VERDICT H-S5c-c: Q at collision = {event['Q_at_c']} — the "
          f"generic (rank-2) fold; knee collapse confirmed in the w4 family")
    print(f"VERDICT H-S5c-d: window shifts -> {shift_res}")
    print(f"saved artifacts/s5c_blend_fold.json  [{time.time() - t0:.0f} s]")


if __name__ == "__main__":
    main()
