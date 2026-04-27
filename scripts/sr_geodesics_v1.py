#!/usr/bin/env python3
"""
sr_geodesics_v1.py — pre-compute SE(2) sub-Riemannian geodesics for Figure 2
of "The Visual Cortex as a Contact Manifold".

Solves the *tangent-matching* boundary-value problem:

    Given source neuron (x0, y0, theta0) and target neuron (xt, yt, theta_t),
    find inflectional-elastica parameters (k, omega, phase, L) such that the
    SE(2) horizontal flow

        dx/ds = cos theta,  dy/ds = sin theta,  dtheta/ds = kappa(s)

    starting at the source with kappa(s) = 2*k*omega*cn(omega*s + phase | k^2)
    terminates AT the target with TANGENT matching the target neuron's
    preferred orientation (mod pi).

Three curve families:
    inflectional   kappa(s) = 2*k*omega*cn(omega*s + phase | k^2)
    non-inflect    kappa(s) = 2*omega*dn(omega*s + phase | k^2)
    separatrix     kappa(s) = 2*omega*sech(omega*(s - shift))

Maxwell pair (Sachkov, "Maxwell strata in Euler's elastic problem", ESAIM:COCV
2008, Fig. 34) — sigma-symmetric closed pair on the source-tangent axis:

    Curve A:  kappa_A(s) = +2*k*omega*cn(omega*s | m)
    Curve B:  kappa_B(s) = -kappa_A(s)             (sigma-mirror)

    Integrated over s in [0, L] with L = N_periods * 4*K(m)/omega.
    Both end at the IDENTICAL group element (X_end, 0, 0) on the source axis;
    arc lengths are equal by construction.  k > 1/sqrt(2) makes each curve
    have visible loops/cusps; N_periods >= 2 yields >= 4 cusps per curve.

Output: public/data/v1_geodesics.json (consumed by the front-end JS).
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
from scipy.special import ellipj as sp_ellipj
from scipy.special import ellipk, ellipe
from scipy.optimize import least_squares, brentq


# =============================================================================
# V1 GRID (must match _drafts/2026-04-25-...-se2.md)
# =============================================================================
W, H = 680.0, 460.0
ROWS = 22
COLS = int(ROWS * W / H)        # 32
cellW, cellH = W / COLS, H / ROWS
cx, cy = W / 2, H / 2


def theta_field(x: float, y: float) -> float:
    phi1 = math.atan2(y - cy, x - cx)
    phi2 = math.atan2(y - cy * 1.3, x - cx * 0.5)
    sumRe = math.cos(phi1) + 0.35 * math.cos(phi2)
    sumIm = math.sin(phi1) + 0.35 * math.sin(phi2)
    return math.atan2(sumIm, sumRe) / 2


def cell_center(c: int, r: int):
    return (c + 0.5) * cellW, (r + 0.5) * cellH


# =============================================================================
# SOURCE
# =============================================================================
SRC_COL = int(COLS * 0.45)
SRC_ROW = int(ROWS * 0.50)
srcX, srcY = cell_center(SRC_COL, SRC_ROW)
srcTheta = theta_field(srcX, srcY)
srcHeading = srcTheta if math.cos(srcTheta) >= 0 else srcTheta + math.pi
PX_PER_UNIT = 78.0
THETA0_MATH = -srcHeading


# =============================================================================
# RK4 INTEGRATOR (math frame, single trajectory, vectorised midpoint)
# =============================================================================
def integrate_math(kappa_fn, L: float, theta0: float = THETA0_MATH,
                   N: int = 400) -> np.ndarray:
    """Returns (N+1, 3) array of (x, y, theta) along arc length [0, L].

    Pre-evaluates kappa on a uniform grid (vectorised) then runs RK4.  This is
    far faster than calling kappa_fn from a Python inner loop for each step.
    """
    s_nodes = np.linspace(0.0, L, N + 1)
    s_mids = 0.5 * (s_nodes[:-1] + s_nodes[1:])
    k_node = kappa_fn(s_nodes)        # (N+1,)
    k_mid = kappa_fn(s_mids)          # (N,)
    out = np.empty((N + 1, 3))
    out[0] = (0.0, 0.0, theta0)
    x = y = 0.0
    th = theta0
    ds = L / N
    cos = math.cos
    sin = math.sin
    for i in range(N):
        f1t = k_node[i]
        f2t = k_mid[i]
        f3t = k_mid[i]
        f4t = k_node[i + 1]
        f1x, f1y = cos(th), sin(th)
        t2 = th + 0.5 * ds * f1t
        f2x, f2y = cos(t2), sin(t2)
        t3 = th + 0.5 * ds * f2t
        f3x, f3y = cos(t3), sin(t3)
        t4 = th + ds * f3t
        f4x, f4y = cos(t4), sin(t4)
        x  += ds / 6 * (f1x + 2 * f2x + 2 * f3x + f4x)
        y  += ds / 6 * (f1y + 2 * f2y + 2 * f3y + f4y)
        th += ds / 6 * (f1t + 2 * f2t + 2 * f3t + f4t)
        out[i + 1] = (x, y, th)
    return out


def math_to_svg(pts_math: np.ndarray) -> np.ndarray:
    out = np.empty_like(pts_math)
    out[:, 0] = srcX + pts_math[:, 0] * PX_PER_UNIT
    out[:, 1] = srcY - pts_math[:, 1] * PX_PER_UNIT
    out[:, 2] = -pts_math[:, 2]
    return out


# =============================================================================
# CURVATURE PROFILES (vectorised — accept numpy arrays)
# =============================================================================
def kappa_inflect(k: float, omega: float, phase: float):
    m = k * k

    def kf(s):
        s_arr = np.asarray(s)
        sn, cn, dn, _ = sp_ellipj(omega * s_arr + phase, m)
        return 2 * k * omega * cn

    return kf


def kappa_noninflect(k: float, omega: float, phase: float):
    m = k * k

    def kf(s):
        s_arr = np.asarray(s)
        sn, cn, dn, _ = sp_ellipj(omega * s_arr + phase, m)
        return 2 * omega * dn

    return kf


def kappa_separatrix(omega: float, shift: float):
    def kf(s):
        s_arr = np.asarray(s)
        return 2 * omega / np.cosh(omega * (s_arr - shift))

    return kf


# =============================================================================
# BATCH FORWARD-SHOOT (vectorised over many seeds simultaneously)
# =============================================================================
def batch_endpoints_inflect(ks, omegas, phases, Ls, theta0=THETA0_MATH, N=100):
    """Compute endpoint (x, y, theta) for a batch of inflectional configs.

    ks, omegas, phases, Ls — 1D arrays of equal length M.
    Uses vectorised midpoint rule with N steps each.  ~50x faster than calling
    integrate_math M times in Python.
    """
    ks = np.asarray(ks); omegas = np.asarray(omegas)
    phases = np.asarray(phases); Ls = np.asarray(Ls)
    M = len(ks)
    ms = ks ** 2
    x = np.zeros(M); y = np.zeros(M); th = np.full(M, theta0)
    ds = Ls / N                          # (M,)
    for i in range(N):
        s_mid = (i + 0.5) * ds           # (M,)
        u_mid = omegas * s_mid + phases  # (M,)
        # ellipj is vectorised: returns sn, cn, dn, ph for each (u, m) pair.
        # scipy's ellipj broadcasts arrays — m must be array of same shape.
        sn, cn, dn, _ = sp_ellipj(u_mid, ms)
        kappa_mid = 2 * ks * omegas * cn
        dth = kappa_mid * ds
        # midpoint advance
        th_mid = th + 0.5 * dth
        x += np.cos(th_mid) * ds
        y += np.sin(th_mid) * ds
        th += dth
    return x, y, th


def batch_endpoints_noninflect(ks, omegas, phases, Ls, theta0=THETA0_MATH, N=100):
    ks = np.asarray(ks); omegas = np.asarray(omegas)
    phases = np.asarray(phases); Ls = np.asarray(Ls)
    M = len(ks)
    ms = ks ** 2
    x = np.zeros(M); y = np.zeros(M); th = np.full(M, theta0)
    ds = Ls / N
    for i in range(N):
        s_mid = (i + 0.5) * ds
        u_mid = omegas * s_mid + phases
        sn, cn, dn, _ = sp_ellipj(u_mid, ms)
        kappa_mid = 2 * omegas * dn
        dth = kappa_mid * ds
        th_mid = th + 0.5 * dth
        x += np.cos(th_mid) * ds
        y += np.sin(th_mid) * ds
        th += dth
    return x, y, th


def batch_endpoints_separatrix(omegas, shifts, Ls, theta0=THETA0_MATH, N=100):
    omegas = np.asarray(omegas); shifts = np.asarray(shifts); Ls = np.asarray(Ls)
    M = len(omegas)
    x = np.zeros(M); y = np.zeros(M); th = np.full(M, theta0)
    ds = Ls / N
    for i in range(N):
        s_mid = (i + 0.5) * ds
        kappa_mid = 2 * omegas / np.cosh(omegas * (s_mid - shifts))
        dth = kappa_mid * ds
        th_mid = th + 0.5 * dth
        x += np.cos(th_mid) * ds
        y += np.sin(th_mid) * ds
        th += dth
    return x, y, th


# =============================================================================
# BVP RESIDUAL + REFINE
# =============================================================================
def angle_diff_modpi(a, b):
    d = (a - b) % math.pi
    if d > math.pi / 2:
        d -= math.pi
    return d


def cell_target_math(col: int, row: int):
    xsvg, ysvg = cell_center(col, row)
    th_svg = theta_field(xsvg, ysvg)
    return ((xsvg - srcX) / PX_PER_UNIT,
            -(ysvg - srcY) / PX_PER_UNIT,
            -th_svg)


def refine_inflect(target, seed):
    Tx, Ty, Tth = target

    def res(p):
        k, omega, phase, L = p
        if not (0.05 <= k <= 0.95 and 0.05 <= omega and 0.2 <= L):
            return [1e3, 1e3, 1e3]
        pts = integrate_math(kappa_inflect(k, omega, phase), L, THETA0_MATH, 250)
        x, y, th = pts[-1]
        return [x - Tx, y - Ty, angle_diff_modpi(th, Tth)]

    return least_squares(
        res, seed,
        bounds=([0.05, 0.05, -2 * math.pi, 0.2],
                [0.95, 4.00,  2 * math.pi, 12.0]),
        method='trf', max_nfev=120, xtol=1e-10, ftol=1e-10)


def refine_noninflect(target, seed):
    Tx, Ty, Tth = target

    def res(p):
        k, omega, phase, L = p
        pts = integrate_math(kappa_noninflect(k, omega, phase), L,
                             THETA0_MATH, 250)
        x, y, th = pts[-1]
        return [x - Tx, y - Ty, angle_diff_modpi(th, Tth)]

    return least_squares(
        res, seed,
        bounds=([0.05, 0.05, -2 * math.pi, 0.2],
                [0.95, 4.00,  2 * math.pi, 10.0]),
        method='trf', max_nfev=120, xtol=1e-10, ftol=1e-10)


def refine_separatrix(target, seed):
    Tx, Ty, Tth = target

    def res(p):
        omega, shift, L = p
        pts = integrate_math(kappa_separatrix(omega, shift), L, THETA0_MATH, 250)
        x, y, th = pts[-1]
        return [x - Tx, y - Ty, angle_diff_modpi(th, Tth)]

    return least_squares(
        res, seed,
        bounds=([0.05, -10.0, 0.3], [3.0, 10.0, 10.0]),
        method='trf', max_nfev=120, xtol=1e-10, ftol=1e-10)


# =============================================================================
# SOLVE BVP: batch screen + refine top-K
# =============================================================================
def solve_inflect(target, top_k=12):
    Tx, Ty, Tth = target
    ks = np.linspace(0.10, 0.92, 8)
    omegas = np.linspace(0.30, 3.0, 8)
    phases = np.linspace(-math.pi, math.pi, 7, endpoint=False)
    Ls = np.linspace(0.5, 10.0, 8)
    K, OM, PH, LL = np.meshgrid(ks, omegas, phases, Ls, indexing='ij')
    K = K.ravel(); OM = OM.ravel(); PH = PH.ravel(); LL = LL.ravel()
    x, y, th = batch_endpoints_inflect(K, OM, PH, LL, N=80)
    dth = np.mod(th - Tth + math.pi / 2, math.pi) - math.pi / 2
    err = (x - Tx) ** 2 + (y - Ty) ** 2 + (0.4 * dth) ** 2
    idx = np.argsort(err)[:top_k]
    best = None
    best_kappa_max = math.inf
    for j in idx:
        seed = (float(K[j]), float(OM[j]), float(PH[j]), float(LL[j]))
        try:
            sol = refine_inflect(target, seed)
        except Exception:
            continue
        if sol.cost < 5e-4:
            # Among converged candidates, prefer the SMOOTHEST one — i.e. the
            # smallest peak curvature 2*k*omega.  Visually this means the
            # curve doesn't jerk away from the source/target tangents within
            # the first/last cell.  (Compared to "shortest L" criterion, this
            # gives geometrically nicer pictures at slight L cost.)
            kappa_max = 2 * sol.x[0] * sol.x[1]
            if kappa_max < best_kappa_max:
                best_kappa_max = kappa_max
                best = sol
    return best


def solve_noninflect(target, top_k=12):
    Tx, Ty, Tth = target
    ks = np.linspace(0.10, 0.92, 6)
    omegas = np.linspace(0.30, 2.5, 6)
    phases = np.linspace(-math.pi, math.pi, 5, endpoint=False)
    Ls = np.linspace(0.4, 6.0, 6)
    K, OM, PH, LL = np.meshgrid(ks, omegas, phases, Ls, indexing='ij')
    K = K.ravel(); OM = OM.ravel(); PH = PH.ravel(); LL = LL.ravel()
    x, y, th = batch_endpoints_noninflect(K, OM, PH, LL, N=80)
    dth = np.mod(th - Tth + math.pi / 2, math.pi) - math.pi / 2
    err = (x - Tx) ** 2 + (y - Ty) ** 2 + (0.4 * dth) ** 2
    idx = np.argsort(err)[:top_k]
    best = None
    best_kappa_max = math.inf
    for j in idx:
        seed = (float(K[j]), float(OM[j]), float(PH[j]), float(LL[j]))
        try:
            sol = refine_noninflect(target, seed)
        except Exception:
            continue
        if sol.cost < 5e-4:
            # Non-inflectional kappa = 2*omega*dn ranges between 2*omega*sqrt(1-m)
            # and 2*omega.  Prefer smallest peak.
            kappa_max = 2 * sol.x[1]
            if kappa_max < best_kappa_max:
                best_kappa_max = kappa_max
                best = sol
    return best


def solve_separatrix(target, top_k=12):
    Tx, Ty, Tth = target
    # Wider seed grid: separatrix has only one peaked bend, so the (omega,
    # shift, L) basin can be narrow.  Probe densely.
    omegas = np.linspace(0.10, 3.0, 14)
    shifts = np.linspace(-6.0, 6.0, 12)
    Ls = np.linspace(0.5, 9.0, 12)
    OM, SH, LL = np.meshgrid(omegas, shifts, Ls, indexing='ij')
    OM = OM.ravel(); SH = SH.ravel(); LL = LL.ravel()
    x, y, th = batch_endpoints_separatrix(OM, SH, LL, N=80)
    dth = np.mod(th - Tth + math.pi / 2, math.pi) - math.pi / 2
    err = (x - Tx) ** 2 + (y - Ty) ** 2 + (0.4 * dth) ** 2
    idx = np.argsort(err)[:top_k]
    best = None
    for j in idx:
        seed = (float(OM[j]), float(SH[j]), float(LL[j]))
        try:
            sol = refine_separatrix(target, seed)
        except Exception:
            continue
        if sol.cost < 5e-3 and (best is None or sol.x[2] < best.x[2]):
            best = sol
    return best


# =============================================================================
# MAXWELL PAIR (Sachkov Fig. 34 — closed figure-8 at the Bernoulli modulus)
# =============================================================================
# The Bernoulli figure-8: at the unique modulus k_c where 2*E(k_c^2) = K(k_c^2),
# the inflectional elastica returns to its starting group element after one
# curvature period L_0 = 4*K(k_c^2)/omega.  In source-aligned coords:
#     x_aligned(L_0) = 4*(2E - K)/omega = 0
#     y_aligned(L_0) = 0
#     theta_aligned(L_0) = 0
# i.e. the curve is a CLOSED LOOP (figure-eight shape with two lobes, one in
# +y, one in -y, sharing the source as the crossing point).
def bernoulli_modulus():
    m_c = brentq(lambda m: 2 * float(ellipe(m)) - float(ellipk(m)), 0.5, 0.99)
    return m_c, math.sqrt(m_c)


def maxwell_pair_figure8(omega: float, n_loops: int = 1, N_pts: int = 900):
    """Sachkov Fig. 34 Maxwell pair: two CLOSED figure-8 inflectional loops.

    Both loops start at the source tangent to the source neuron's preferred
    orientation.  Curve A starts in the +heading direction; curve B starts in
    the -heading direction (= same line orientation mod pi, but opposite
    direction along it).  Each is a closed inflectional elastica at the
    Bernoulli modulus k_c, so both return to the source after one period
    L_0 = 4*K(k_c^2)/omega.  The two loops are geometrically distinct (180-deg
    rotated), share the source as start/end, and have IDENTICAL arc length L.
    Length L = n_loops * L_0 lets the user request multiple traversals
    (multi-cusp loops).
    """
    m_c, k_c = bernoulli_modulus()
    K_c = float(ellipk(m_c))
    E_c = float(ellipe(m_c))
    L_0 = 4 * K_c / omega
    L = n_loops * L_0
    kf = kappa_inflect(k_c, omega, 0.0)
    pts_A = integrate_math(kf, L, THETA0_MATH,           N=N_pts)
    pts_B = integrate_math(kf, L, THETA0_MATH + math.pi, N=N_pts)
    return pts_A, pts_B, L, k_c, m_c, K_c, E_c


# =============================================================================
# MAIN
# =============================================================================
def main():
    print(f"V1 grid: {COLS}x{ROWS}, cell {cellW:.3f}x{cellH:.3f}")
    print(f"src cell ({SRC_COL}, {SRC_ROW}) at SVG ({srcX:.3f}, {srcY:.3f})")
    print(f"src heading SVG: {math.degrees(srcHeading):+.3f} deg "
          f"(theta0_math = {math.degrees(THETA0_MATH):+.3f} deg)")
    print()

    out = {
        'src': {'col': SRC_COL, 'row': SRC_ROW,
                'x': srcX, 'y': srcY, 'heading': srcHeading},
        'grid': {'W': W, 'H': H, 'ROWS': ROWS, 'COLS': COLS,
                 'cellW': cellW, 'cellH': cellH,
                 'PX_PER_UNIT': PX_PER_UNIT},
        'curves': [],
    }

    # Inflectional has both kappa signs (oscillating cn) — can reach any side.
    # Non-inflectional and separatrix have kappa>0 always — they only bend
    # one way; from this source they sweep up-and-to-the-left in SVG.
    targets = [
        ('inflectional',    SRC_COL + 7,  SRC_ROW - 4, '#1565c0'),
        ('inflectional',    SRC_COL + 9,  SRC_ROW + 4, '#1e88e5'),
        ('noninflectional', SRC_COL - 5,  SRC_ROW - 5, '#2e7d32'),
        ('noninflectional', SRC_COL - 4,  SRC_ROW - 2, '#43a047'),
        # Separatrix: chosen empirically as a cell that the kappa>0 sech-bend
        # can sweep into, in a region distinct from the other families'
        # targets, and whose neuron's preferred orientation is close enough
        # that the BVP can match the tangent under the separatrix's nearly
        # 180-deg sweep.
        ('separatrix',      20,           19,           '#c62828'),
    ]

    for family, tcol, trow, color in targets:
        target = cell_target_math(tcol, trow)
        Tx, Ty, Tth = target
        target_xsvg, target_ysvg = cell_center(tcol, trow)
        target_theta_svg = theta_field(target_xsvg, target_ysvg)
        print(f"[{family}] cell ({tcol}, {trow}):")
        print(f"  math frame target: ({Tx:+.3f}, {Ty:+.3f}, "
              f"theta={math.degrees(Tth):+.2f} deg)")

        if family == 'inflectional':
            sol = solve_inflect(target)
        elif family == 'noninflectional':
            sol = solve_noninflect(target)
        else:
            sol = solve_separatrix(target)

        if sol is None:
            print(f"  *** no convergence ***\n")
            continue

        if family in ('inflectional', 'noninflectional'):
            k_, om, ph, L = sol.x
            kf = (kappa_inflect if family == 'inflectional'
                  else kappa_noninflect)(k_, om, ph)
            params = {'k': float(k_), 'omega': float(om),
                      'phase': float(ph), 'L': float(L)}
            print(f"  k={k_:+.4f}, omega={om:+.4f}, "
                  f"phase={math.degrees(ph):+.2f} deg, L={L:.4f}, "
                  f"cost={sol.cost:.2e}")
        else:
            om, sh, L = sol.x
            kf = kappa_separatrix(om, sh)
            params = {'omega': float(om), 'shift': float(sh), 'L': float(L)}
            print(f"  omega={om:+.4f}, shift={sh:+.4f}, L={L:.4f}, "
                  f"cost={sol.cost:.2e}")

        pts_math = integrate_math(kf, L, THETA0_MATH, N=400)
        pts_svg = math_to_svg(pts_math)
        end_x, end_y, end_th = pts_svg[-1]
        target_dpx = math.hypot(end_x - target_xsvg, end_y - target_ysvg)
        dth_svg = ((end_th - target_theta_svg + math.pi / 2) % math.pi
                   - math.pi / 2)
        print(f"  endpoint SVG: ({end_x:.2f}, {end_y:.2f}, "
              f"theta={math.degrees(end_th):+.2f} deg)")
        print(f"  target SVG:   ({target_xsvg:.2f}, {target_ysvg:.2f}, "
              f"theta={math.degrees(target_theta_svg):+.2f} deg)")
        print(f"  position miss: {target_dpx:.3f} px,  "
              f"orientation miss: {math.degrees(dth_svg):+.3f} deg\n")

        out['curves'].append({
            'family': family, 'color': color,
            'target_cell': {
                'col': tcol, 'row': trow,
                'x': target_xsvg, 'y': target_ysvg,
                'theta_svg': target_theta_svg,
            },
            'params': params,
            'L': float(L),
            'L_pixels': float(L * PX_PER_UNIT),
            'cost': float(sol.cost),
            # 4-decimal precision keeps each polyline segment's chord direction
            # accurate to <0.01 deg even on the finest (sub-pixel) segments.
            'polyline': [[round(p[0], 4), round(p[1], 4)] for p in pts_svg],
            # SVG-frame theta and arc-length s at every sample, so the JS
            # frame-along-geodesic figure can index in without recomputing.
            'theta_svg_samples': [round(float(p[2]), 6) for p in pts_svg],
            's_samples': [round(float(L * i / (len(pts_svg) - 1)), 6)
                          for i in range(len(pts_svg))],
            'start_theta_svg': float(-THETA0_MATH),
            'end_theta_svg': float(end_th),
        })

    # ── Maxwell pair: closed figure-8 loops at the Bernoulli modulus ─────
    OMEGA = 1.4
    N_LOOPS = 1            # 1 = single figure-8 each; 2 = traversed twice
    print(f"[maxwell pair] Bernoulli closed figure-8, omega={OMEGA}, "
          f"n_loops={N_LOOPS}")
    pts_A_m, pts_B_m, L_max, k_c, m_c, K_c, E_c = maxwell_pair_figure8(
        OMEGA, n_loops=N_LOOPS, N_pts=1200)
    pts_A_svg = math_to_svg(pts_A_m)
    pts_B_svg = math_to_svg(pts_B_m)

    end_A = pts_A_m[-1]
    end_B = pts_B_m[-1]
    miss_A_to_src = math.hypot(end_A[0], end_A[1]) * PX_PER_UNIT
    miss_B_to_src = math.hypot(end_B[0], end_B[1]) * PX_PER_UNIT
    print(f"  k_c = {k_c:.6f}  m_c = {m_c:.6f}  K(m_c) = {K_c:.6f}  "
          f"E(m_c) = {E_c:.6f}")
    print(f"  L = {L_max:.6f}  (= {N_LOOPS} * 4K(m_c)/omega)")
    print(f"  end A (math): ({end_A[0]:+.6f}, {end_A[1]:+.6f}, "
          f"theta={math.degrees(end_A[2]):+.4f} deg)")
    print(f"  end B (math): ({end_B[0]:+.6f}, {end_B[1]:+.6f}, "
          f"theta={math.degrees(end_B[2]):+.4f} deg)")
    print(f"  closure miss A->src: {miss_A_to_src:.3e} px,  "
          f"B->src: {miss_B_to_src:.3e} px (RK4 truncation)\n")

    NA = pts_A_svg.shape[0]
    out['maxwell'] = {
        'k': k_c, 'omega': OMEGA, 'n_loops': N_LOOPS,
        'L': float(L_max), 'L_pixels': float(L_max * PX_PER_UNIT),
        # Both curves close back to src (this IS the meeting point):
        'meeting_point_svg': [srcX, srcY],
        'polyline_A': [[round(p[0], 4), round(p[1], 4)] for p in pts_A_svg],
        'polyline_B': [[round(p[0], 4), round(p[1], 4)] for p in pts_B_svg],
        # Frame data: theta_svg(s) along each polyline plus arc length samples,
        # so the moving-frame figure can show TWO synchronised frames on the
        # sigma-mirror pair.  The orientations at s = L are intentionally
        # different (theta_A_end - theta_B_end = pi mod 2*pi) — that is the
        # whole point of the pair: same point, opposite tangent direction =
        # same V1 line-orientation (mod pi).
        'theta_svg_samples_A': [round(float(p[2]), 6) for p in pts_A_svg],
        'theta_svg_samples_B': [round(float(p[2]), 6) for p in pts_B_svg],
        's_samples': [round(float(L_max * i / (NA - 1)), 6)
                      for i in range(NA)],
        'color_A': '#e65100',
        'color_B': '#bf360c',
    }

    # Emit as a JavaScript file (NOT .json) that assigns to window.__v1Data.
    # Jekyll's site-wide "*.json" exclude rule would otherwise swallow the
    # asset; .js files are served as static.  The page reads window.__v1Data
    # synchronously when the <script> finishes loading — no fetch, no parse.
    out_path = (Path(__file__).resolve().parent.parent
                / 'public' / 'data' / 'v1_geodesics.js')
    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(out, separators=(',', ':'))
    out_path.write_text(
        f"// Auto-generated by scripts/sr_geodesics_v1.py — do not edit.\n"
        f"window.__v1Data = {payload};\n"
    )
    print(f"Wrote {out_path} ({out_path.stat().st_size:,} bytes)")


if __name__ == '__main__':
    main()
