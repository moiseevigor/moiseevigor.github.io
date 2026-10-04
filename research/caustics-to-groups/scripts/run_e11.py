#!/usr/bin/env python3
"""E11 - cusps (A3) on the first conjugate locus of SE(2), Engel, Cartan, and the E10
fold test in dimension 6 (SE(3) and its nilpotent tangent cone).

Hypotheses, kill criterion and tolerances are pre-registered in docs/E11-cusp-germs.md;
the constants below are those tolerances.

Notation. E(p) = exp_e(p) at time 1, p in R^n. Sigma = {det DE = 0}. v = ker DE on Sigma.
Tangency function  tau(p) = grad det DE . v / |grad det DE|  (E10's transversality,
signed). Fold: tau != 0. Cusp (Morin A3): corank 1, tau = 0, and d tau/ds != 0 along the
curve c(s) in Sigma with c'(0) = v; then E(c(s)) - E(p*) = a s^2 + b s^3 + ...

Part 1 (cusps). Loops u -> h0(u) = (cos u, sin u, fixed vertical momenta); first
conjugate time t_c(u) along each ray; tau along the loop; sign changes of tau are
bracketed and solved (Illinois), then each root is put through the A3 checks.
SE(2) is the calibration: >= 4 verified cusps per loop or the experiment is inconclusive.

Post-hoc descriptors (added after the first full run, reported separately from the
pre-registered checks): check (iii) on an 8x finer sigma ladder; the sign of tau on
both sides along the kernel curve (same sign = degenerate tangency, not A3); whether
t_c is a period of the covector (Lie-Poisson) orbit, whether that whole orbit at time
t_c is critical and maps to a single point; and whether the kernel lies in the span of
the phase-shift field (plus the rotation field on Cartan).

Part 2 (dimension 6). E10's fold criterion at the first conjugate point of 24 random
geodesics on (a) the SE(3) tangent cone (liegroup spec) and (b) the curved group SE(3),
integrated as a matrix group (validated on SE(2) against the E10 artifact).

Usage: run_e11.py [--quick]
Results -> artifacts/e11_results.json
"""
import json
import sys
import time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import liegroup  # noqa: E402

QUICK = "--quick" in sys.argv
SEED = 0
N_COV = 6 if QUICK else 24                 # part 2, as E10
M_LOOP = 48 if QUICK else 96               # covectors per loop
LOOPS = {                                  # fixed vertical momenta of each loop
    "SE(2)": [(1.0,), (1.5,), (2.0,), (3.0,)],
    "Engel": [(1, 1), (2, 1), (1, 2), (3, 1), (1, 3), (2, -2)],
    "Cartan": [(1, 1, 1), (2, 1, 1), (1, 2, 1), (1, 1, 2), (2, -1, 2), (3, 1, -2)],
}
if QUICK:
    LOOPS = {g: v[:2] for g, v in LOOPS.items()}
T_LO, T_MAX, N_SCAN, SCAN_SPU = 0.3, 12.0, 240, 300
STEPS = 2000                               # RK4 steps over unit time for E(p)
H_FD, H_DIR = 1e-4, 1e-3                   # FD steps: DE, and derivatives of det DE
K_REF, ROUNDS = 17, 4                      # conjugate-time refinement: 16x per round
N_ILL = 12                                 # Illinois iterations on the loop parameter
T_JUMP, V_DOT_MIN = 0.3, 0.5               # skip loop intervals where t_c or v jumps
# pre-registered tolerances (docs/E11-cusp-germs.md)
TAU_TOL = 1e-4
DU_SIDE = 1e-3
CORANK_TOL, RESID_TOL = 100.0, 1e-6
SIG_KAPPA, KAPPA_TOL = 0.02, 1e-2
SIGMAS = np.array([0.01, 0.02, 0.04, 0.08])
EVEN_RANGE, ODD_RANGE, COS_TOL = (1.8, 2.2), (2.6, 3.4), 0.9
FOLD_TOL = 1e-3                            # E10
# post-hoc descriptors (added after the first full run; see the doc)
N_ORB, PERIOD_TOL = 8, 1e-4


# ---------------------------------------------------------------------------
# models: liegroup.GroupSpec (coordinates) or MatGroup (matrix group, for SE(3))
# ---------------------------------------------------------------------------
class MatGroup:
    """Left-invariant SR structure on a matrix group: frame X_i(g) = g E_i.
    Structure constants are computed from the matrix commutators, so they cannot
    disagree with the frame."""

    def __init__(self, name, basis, horiz):
        self.name, self.basis, self.horiz = name, basis, tuple(horiz)
        self.dim, self.d = basis.shape[0], basis.shape[1]
        self.pinv = np.linalg.pinv(basis.reshape(self.dim, -1))      # (d*d, n)
        comm = np.einsum("iab,jbc->ijac", basis, basis)
        comm = (comm - comm.transpose(1, 0, 2, 3)).reshape(self.dim, self.dim, -1)
        self.C = comm @ self.pinv
        assert np.allclose(self.C @ basis.reshape(self.dim, -1), comm, atol=1e-12), "not closed"

    def integrate(self, cov, times, spu):
        n, hz = cov.shape[0], list(self.horiz)
        g = np.tile(np.eye(self.d), (n, 1, 1))
        h = cov.copy()

        def rhs(g, h):
            A = np.einsum("na,aij->nij", h[:, hz], self.basis[hz])
            hd = sum(h[:, a:a + 1] * (h @ self.C[a].T) for a in hz)
            return g @ A, hd

        out, t_prev = np.empty((n, len(times), self.d * self.d)), 0.0
        for idx, t in enumerate(times):
            m = max(1, int(np.ceil(abs(t - t_prev) * spu)))
            dt = (t - t_prev) / m
            for _ in range(m):
                a1, b1 = rhs(g, h)
                a2, b2 = rhs(g + 0.5 * dt * a1, h + 0.5 * dt * b1)
                a3, b3 = rhs(g + 0.5 * dt * a2, h + 0.5 * dt * b2)
                a4, b4 = rhs(g + dt * a3, h + dt * b3)
                g = g + dt / 6 * (a1 + 2 * a2 + 2 * a3 + a4)
                h = h + dt / 6 * (b1 + 2 * b2 + 2 * b3 + b4)
            out[:, idx], t_prev = g.reshape(n, -1), t
        return out


def _hat(w):
    return np.array([[0, -w[2], w[1]], [w[2], 0, -w[0]], [-w[1], w[0], 0.0]])


def se2_matrix():
    """Same basis as liegroup's SE(2) spec: X1 forward, X2 rotation, X3 = [X1, X2]."""
    E = np.zeros((3, 3, 3))
    E[0, 0, 2] = 1.0
    E[1, 0, 1], E[1, 1, 0] = -1.0, 1.0
    E[2, 1, 2] = -1.0
    return MatGroup("SE(2)-matrix", E, (0, 1))


def se3_matrix():
    """Curved SE(3), fibre-tracking distribution {forward translation T_z, R_x, R_y}
    (Duits et al.); verticals R_z, T_x, T_y. Growth vector (3, 6)."""
    E, I = np.zeros((6, 4, 4)), np.eye(3)
    E[0, :3, 3] = I[2]
    E[1, :3, :3], E[2, :3, :3], E[3, :3, :3] = _hat(I[0]), _hat(I[1]), _hat(I[2])
    E[4, :3, 3], E[5, :3, 3] = I[0], I[1]
    return MatGroup("SE(3)", E, (0, 1, 2))


def integrate(model, cov, times, spu):
    times = np.asarray(times, dtype=float)
    if isinstance(model, MatGroup):
        return model.integrate(cov, times, spu)
    return liegroup.geodesic_batch(model, cov, times, steps_per_unit=spu)


def flow_jac(model, H, times, spu):
    """J[m, T, i, j] = d q_i(t; h) / d h_j by central differences (for a matrix group,
    q-increments are read in the left-invariant coframe: g^-1 dg in the basis E)."""
    m, n = H.shape
    e = np.eye(n) * H_FD
    pert = np.concatenate([H[:, None] + e, H[:, None] - e], axis=1).reshape(-1, n)
    out = integrate(model, pert, times, spu).reshape(m, 2 * n, len(times), -1)
    d = (out[:, :n] - out[:, n:]) / (2 * H_FD)                      # (m, n, T, D)
    if isinstance(model, MatGroup):
        k = model.d
        g0 = out.mean(axis=1).reshape(m, 1, len(times), k, k)       # base point, O(h^2)
        d = (np.linalg.inv(g0) @ d.reshape(m, n, len(times), k, k)).reshape(
            m, n, len(times), -1) @ model.pinv
    return np.moveaxis(d, 1, -1)


def DE(model, P, steps=STEPS):
    return flow_jac(model, P, [1.0], steps)[:, 0]


def conj_time(model, H, c, r, pick="first", steps=STEPS):
    """Zero of det DE(t*H) for t in c*(1 +- r) (r a common scalar): ROUNDS rounds of
    K_REF-point bracketing, then one secant step. E(t*h) is the geodesic of h at time
    t, so one integration of c*H serves a whole time grid. nan where no sign change."""
    c = np.array(c, dtype=float)
    bad = np.isnan(c)
    c[bad] = 1.0
    rows = np.arange(len(c))
    for _ in range(ROUNDS):
        taus = 1 + r * np.linspace(-1, 1, K_REF)
        D = np.linalg.det(flow_jac(model, c[:, None] * H, taus, steps))
        chg = D[:, :-1] * D[:, 1:] < 0
        if pick == "first":
            k = chg.argmax(axis=1)
        else:                                  # nearest to the centre of the window
            k = np.where(chg, np.abs(np.arange(K_REF - 1) - (K_REF - 2) / 2), np.inf).argmin(axis=1)
        bad |= ~chg.any(axis=1)
        t0, t1, d0, d1 = taus[k], taus[k + 1], D[rows, k], D[rows, k + 1]
        root = c * (t0 - d0 * (t1 - t0) / np.where(d1 == d0, 1.0, d1 - d0))
        c = c * 0.5 * (t0 + t1)
        r = 1.1 * r / (K_REF - 1)
    return np.where(bad, np.nan, root)


def first_conj(model, H):
    """First sign change of det DE(t*h) for t in (T_LO, T_MAX], as in E10."""
    ts = np.linspace(T_LO, T_MAX, N_SCAN)
    D = np.linalg.det(flow_jac(model, H, ts, SCAN_SPU))
    chg = D[:, :-1] * D[:, 1:] < 0
    k = chg.argmax(axis=1)
    c = np.where(chg.any(axis=1), 0.5 * (ts[k] + ts[k + 1]), np.nan)
    return conj_time(model, H, c, 1.05 * 0.5 * (ts[1] - ts[0]) / T_LO)


def diag(model, P, v_ref=None, steps=STEPS):
    """E10's fold diagnostics at critical points P, with tau kept signed."""
    m, n = P.shape
    _, S, Vt = np.linalg.svd(DE(model, P, steps))
    v = Vt[:, -1, :]
    if v_ref is not None:
        v = v * np.where((v * v_ref).sum(1) < 0, -1.0, 1.0)[:, None]
    e = np.eye(n) * H_DIR
    pert = np.concatenate([P[:, None] + e, P[:, None] - e], axis=1).reshape(-1, n)
    d = np.linalg.det(DE(model, pert, steps)).reshape(m, 2 * n)
    grad = (d[:, :n] - d[:, n:]) / (2 * H_DIR)
    gnorm = np.linalg.norm(grad, axis=1)
    return {"gap": S[:, -2] / S[:, 0], "residual": S[:, -1] / S[:, 0],
            "grad_sigma_min": gnorm / np.prod(S[:, :-1], axis=1),
            "tau": (grad * v).sum(1) / gnorm, "v": v}


def tau_fast(model, P, v_ref=None):
    """Sign-correct, cheap tangency: derivative of det DE along v, scaled by the
    non-zero singular values (= derivative of the signed smallest singular value)."""
    _, S, Vt = np.linalg.svd(DE(model, P))
    v = Vt[:, -1, :]
    if v_ref is not None:
        v = v * np.where((v * v_ref).sum(1) < 0, -1.0, 1.0)[:, None]
    d = np.linalg.det(DE(model, np.concatenate([P + H_DIR * v, P - H_DIR * v])))
    m = len(P)
    return (d[:m] - d[m:]) / (2 * H_DIR) / np.prod(S[:, :-1], axis=1), v


def summarize(x):
    x = np.asarray(x, dtype=float)
    if x.size == 0:
        return None
    return {"min": float(np.min(x)), "median": float(np.median(x)), "max": float(np.max(x))}


# ---------------------------------------------------------------------------
# part 1: cusp search
# ---------------------------------------------------------------------------
def loop_cov(u, vert):
    return np.concatenate([np.cos(u)[:, None], np.sin(u)[:, None], vert], axis=1)


def slope(x, y):
    return float(np.polyfit(np.log(x), np.log(y), 1)[0])


def kernel_curve(spec, Ps, vs, sigmas):
    """Curve c(s) in Sigma through p* with c'(0) = v (p* + s v, rescaled onto Sigma),
    and the image test (iii): slopes of the even part and of the odd part orthogonal
    to it, and the cosine between the two image branches at the smallest sigma."""
    nc, ns = len(Ps), len(sigmas)
    sig = np.concatenate([sigmas, -sigmas])
    Q = (Ps[:, None, :] + sig[None, :, None] * np.linalg.norm(Ps, axis=1)[:, None, None]
         * vs[:, None, :]).reshape(-1, spec.dim)
    lam = conj_time(spec, Q, np.ones(len(Q)), 0.05, pick="nearest")
    Cs = np.where(np.isnan(lam), 1.0, lam)[:, None] * Q
    img = integrate(spec, np.concatenate([Ps, Cs]), [1.0], STEPS)[:, 0]
    D = (img[nc:].reshape(nc, 2 * ns, -1) - img[:nc, None, :]) * np.where(
        np.isnan(lam), np.nan, 1.0).reshape(nc, 2 * ns, 1)
    De, Do = 0.5 * (D[:, :ns] + D[:, ns:]), 0.5 * (D[:, :ns] - D[:, ns:])
    ahat = De[:, 0] / np.linalg.norm(De[:, 0], axis=1, keepdims=True)
    Dop = Do - (Do * ahat[:, None, :]).sum(-1, keepdims=True) * ahat[:, None, :]
    cosflip = (D[:, 0] * D[:, ns]).sum(1) / (np.linalg.norm(D[:, 0], axis=1)
                                            * np.linalg.norm(D[:, ns], axis=1))
    with np.errstate(all="ignore"):
        se = np.array([slope(sigmas, np.linalg.norm(x, axis=1)) for x in De])
        so = np.array([slope(sigmas, np.linalg.norm(x, axis=1)) for x in Dop])
    return Cs.reshape(nc, 2 * ns, -1), se, so, cosflip


def h_orbit(spec, H, T):
    """Covector (Lie-Poisson) flow of each row of H over [0, T_row], RK4, sampled at
    N_ORB + 1 equispaced times: (m, N_ORB + 1, n)."""
    def f(h):
        return T[:, None] * sum(h[:, a:a + 1] * (h @ spec.C[a].T) for a in spec.horiz)
    h, out, sub = H.copy(), [H.copy()], STEPS // N_ORB
    dt = 1.0 / (N_ORB * sub)
    for _ in range(N_ORB):
        for _ in range(sub):
            k1 = f(h); k2 = f(h + 0.5 * dt * k1); k3 = f(h + 0.5 * dt * k2); k4 = f(h + dt * k3)
            h = h + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        out.append(h.copy())
    return np.stack(out, axis=1)


def cusp_search(spec):
    loops = np.array(LOOPS[spec.name], dtype=float)
    L, du = len(loops), 2 * np.pi / M_LOOP
    u = np.tile(np.arange(M_LOOP) * du, L)
    vert = np.repeat(loops, M_LOOP, axis=0)
    H = loop_cov(u, vert)
    tc = first_conj(spec, H)
    ok = ~np.isnan(tc)
    tau, v = np.full(len(u), np.nan), np.zeros_like(H)
    tau[ok], v[ok] = tau_fast(spec, tc[ok, None] * H[ok])

    # neighbour pairs (i, j = i+1 on the same loop, cyclic)
    i = np.arange(len(u))
    j = (i // M_LOOP) * M_LOOP + (i % M_LOOP + 1) % M_LOOP
    vdot = (v[i] * v[j]).sum(1)
    usable = ok[i] & ok[j] & (np.abs(tc[i] - tc[j]) <= T_JUMP) & (np.abs(vdot) >= V_DOT_MIN)
    br = np.where(usable & (tau[i] * np.sign(vdot) * tau[j] < 0))[0]
    info = {"loops": loops.tolist(), "points_per_loop": M_LOOP, "n_searched": int(len(u)),
            "n_conjugate_found": int(ok.sum()), "n_intervals_skipped": int((~usable).sum()),
            "t_conj": summarize(tc[ok]), "abs_tau_sigma_on_grid": summarize(np.abs(tau[ok])),
            "n_brackets": int(len(br)), "cusps": []}
    if len(br) == 0:
        info.update(n_located=0, n_verified=0)
        return info

    # Illinois on the loop parameter, all brackets at once
    vt, vref = vert[br], v[br]
    a, b = u[br], u[br] + du
    fa, fb = tau[br], np.sign(vdot[br]) * tau[j[br]]
    ta, tb = tc[br], tc[j[br]]

    def f(x):
        c = 0.5 * (ta + tb)
        t = conj_time(spec, loop_cov(x, vt), c, float(np.max((np.abs(ta - tb) / 2 + 0.02) / c)))
        dead = np.isnan(t)
        fx, _ = tau_fast(spec, np.where(dead, c, t)[:, None] * loop_cov(x, vt), vref)
        return np.where(dead, np.nan, fx), t

    for _ in range(N_ILL):
        den = fb - fa
        x = np.where(den == 0, 0.5 * (a + b), (a * fb - b * fa) / np.where(den == 0, 1.0, den))
        fx, tx = f(x)
        cross = fx * fb < 0
        a, fa, ta = np.where(cross, b, a), np.where(cross, fb, fa / 2), np.where(cross, tb, ta)
        keep = np.isnan(fx) | (fx == 0)        # failed row, or exact root: freeze it
        b, fb, tb = np.where(keep, b, x), np.where(keep, fb, fx), np.where(keep, tb, tx)
    us, ts = b, tb

    # ---- A3 checks at each root ----
    nc = len(us)
    Hs = loop_cov(us, vt)
    Ps = ts[:, None] * Hs
    d0 = diag(spec, Ps, vref)
    vs = d0["v"]
    # sign change across the loop parameter
    side = []
    for sgn in (-1, 1):
        Hx = loop_cov(us + sgn * DU_SIDE, vt)
        tx = conj_time(spec, Hx, ts, 0.01)
        side.append(diag(spec, np.where(np.isnan(tx), ts, tx)[:, None] * Hx, vs)["tau"]
                    * np.where(np.isnan(tx), np.nan, 1.0))
    Cr, se_all, so_all, cosflip = kernel_curve(spec, Ps, vs, SIGMAS)
    ns = len(SIGMAS)
    # kappa: tau on c(+-s) at sigma = SIG_KAPPA
    ik = int(np.argmin(np.abs(SIGMAS - SIG_KAPPA)))
    tp = diag(spec, Cr[:, ik], vs)["tau"]
    tm = diag(spec, Cr[:, ns + ik], vs)["tau"]
    kappa = (tp - tm) / (2 * SIGMAS[ik])
    # resolution check: same point, RK4 steps doubled
    t2 = conj_time(spec, Hs, ts, 1e-3, steps=2 * STEPS)
    tau2 = diag(spec, np.where(np.isnan(t2), ts, t2)[:, None] * Hs, vs, steps=2 * STEPS)["tau"]

    tp2 = diag(spec, Cr[:, ik], vs, steps=2 * STEPS)["tau"]
    tm2 = diag(spec, Cr[:, ns + ik], vs, steps=2 * STEPS)["tau"]

    # ---- post-hoc descriptors (not part of the pre-registered checks) ----
    # (iii) again on a 8x finer sigma ladder, for roots whose local scale is small
    _, se_f, so_f, cos_f = kernel_curve(spec, Ps, vs, SIGMAS / 8)
    # covector (Lie-Poisson) orbit of h0 over [0, t_c]: is t_c a period, and is the
    # kernel the phase-shift direction W = dh/dt (or, on Cartan, in span{W, rotation})?
    orb = h_orbit(spec, Hs, ts)
    per = np.linalg.norm(orb[:, -1] - Hs, axis=1)
    sym = [sum(Hs[:, a:a + 1] * (Hs @ spec.C[a].T) for a in spec.horiz)]
    if spec.name == "Cartan":
        sym.append(np.stack([-Hs[:, 1], Hs[:, 0], 0 * ts, -Hs[:, 4], Hs[:, 3]], axis=1))
    symres = np.empty(nc)
    for q in range(nc):
        Qm = np.linalg.qr(np.array([b[q] for b in sym]).T)[0]
        symres[q] = np.linalg.norm(vs[q] - Qm @ (Qm.T @ vs[q]))
    # the orbit at time t_c, {t_c h(s)}: critical everywhere? mapped to one point?
    Po = (ts[:, None, None] * orb[:, :-1]).reshape(-1, spec.dim)
    So = np.linalg.svd(DE(spec, Po), compute_uv=False).reshape(nc, N_ORB, -1)
    orb_res = (So[:, :, -1] / So[:, :, 0]).max(axis=1)
    Eo = integrate(spec, Po, [1.0], STEPS)[:, 0].reshape(nc, N_ORB, -1)
    orb_spread = np.linalg.norm(Eo - Eo[:, :1], axis=2).max(axis=1)

    for q in range(nc):
        se, so = float(se_all[q]), float(so_all[q])
        t0 = abs(d0["tau"][q])
        chk = {
            "located": bool(t0 <= TAU_TOL),
            "sign_change": bool(side[0][q] * side[1][q] < 0
                                and min(abs(side[0][q]), abs(side[1][q])) >= 10 * t0),
            "corank1": bool(d0["gap"][q] > CORANK_TOL * d0["residual"][q]
                            and d0["residual"][q] <= RESID_TOL),
            "simple_zero": bool(tp[q] * tm[q] < 0 and abs(kappa[q]) >= KAPPA_TOL),
            "image_cusp": bool(EVEN_RANGE[0] <= se <= EVEN_RANGE[1]
                               and ODD_RANGE[0] <= so <= ODD_RANGE[1] and cosflip[q] > COS_TOL),
        }
        info["cusps"].append({
            "loop": vt[q].tolist(), "u": float(us[q]), "t_conj": float(ts[q]),
            "tau": float(d0["tau"][q]), "tau_double_steps": float(tau2[q]),
            "tau_minus": float(side[0][q]), "tau_plus": float(side[1][q]),
            "gap": float(d0["gap"][q]), "residual": float(d0["residual"][q]),
            "grad_sigma_min": float(d0["grad_sigma_min"][q]),
            "kappa": float(kappa[q]), "slope_even": se, "slope_odd_perp": so,
            "cos_flip": float(cosflip[q]), "checks": chk, "verified": all(chk.values()),
            "tau_curve_minus": float(tm[q]), "tau_curve_plus": float(tp[q]),
            "tau_curve_minus_double_steps": float(tm2[q]),
            "tau_curve_plus_double_steps": float(tp2[q]),
            "fine": {"slope_even": float(se_f[q]), "slope_odd_perp": float(so_f[q]),
                     "cos_flip": float(cos_f[q])},
            "period_defect": float(per[q]), "kernel_symmetry_residual": float(symres[q]),
            "orbit_max_residual": float(orb_res[q]), "orbit_image_spread": float(orb_spread[q]),
        })
        c = info["cusps"][-1]
        failed = {k for k, ok_ in chk.items() if not ok_}
        fine_ok = (EVEN_RANGE[0] <= se_f[q] <= EVEN_RANGE[1]
                   and ODD_RANGE[0] <= so_f[q] <= ODD_RANGE[1] and cos_f[q] > COS_TOL)
        if not failed:
            c["class"] = "A3"
        elif failed == {"image_cusp"} and fine_ok:
            c["class"] = "A3 on finer sigma (post hoc)"
        elif "simple_zero" in failed and tp[q] * tm[q] > 0 and tp2[q] * tm2[q] > 0:
            c["class"] = "degenerate tangency (tau does not change sign along the kernel curve)"
        elif failed == {"simple_zero"}:
            c["class"] = "simple zero with |kappa| below threshold"
        else:
            c["class"] = "unresolved"
    cs = info["cusps"]
    loc = [c for c in cs if c["checks"]["located"]]
    ver = [c for c in cs if c["verified"]]
    info.update(
        n_located=len(loc), n_verified=len(ver),
        verified_per_loop=[sum(c["loop"] == list(lp) and c["verified"] for c in cs)
                           for lp in loops.tolist()],
        failed_checks={k: sum(not c["checks"][k] for c in cs) for k in cs[0]["checks"]},
        verified_summary={k: summarize([abs(c[k]) for c in ver]) for k in
                          ("tau", "tau_double_steps", "gap", "residual", "kappa",
                           "slope_even", "slope_odd_perp", "cos_flip")},
        classes={k: sum(c["class"] == k for c in cs) for k in sorted({c["class"] for c in cs})},
    )
    deg = [c for c in cs if c["class"].startswith("degenerate")]
    info["degenerate_summary"] = {
        "n": len(deg), "abs_kappa": summarize([abs(c["kappa"]) for c in deg]),
        "n_periodic": sum(c["period_defect"] < PERIOD_TOL for c in deg),
        "n_periodic_orbit_collapsed": sum(
            c["period_defect"] < PERIOD_TOL and c["orbit_max_residual"] < 1e-5
            and c["orbit_image_spread"] < 1e-4 for c in deg),
        "n_kernel_in_symmetry_span": sum(c["kernel_symmetry_residual"] < 1e-3 for c in deg),
    }
    info["n_kernel_in_symmetry_span"] = sum(c["kernel_symmetry_residual"] < 1e-3 for c in cs)
    return info


# ---------------------------------------------------------------------------
# part 2: E10 fold test
# ---------------------------------------------------------------------------
def e10_covectors(model):
    rng = np.random.default_rng(SEED)
    n, nh = model.dim, len(model.horiz)
    H0 = np.zeros((N_COV, n))
    hor = rng.standard_normal((N_COV, nh))
    H0[:, list(model.horiz)] = hor / np.linalg.norm(hor, axis=1, keepdims=True)
    vert = [k for k in range(n) if k not in model.horiz]
    H0[:, vert] = rng.uniform(1, 3, (N_COV, len(vert))) * rng.choice([-1.0, 1.0],
                                                                     (N_COV, len(vert)))
    return H0


def fold_test(model):
    H0 = e10_covectors(model)
    tc = first_conj(model, H0)
    ok = ~np.isnan(tc)
    d = diag(model, tc[ok, None] * H0[ok])
    d["transversality"] = np.abs(d.pop("tau"))
    d.pop("v")
    corank1 = d["gap"] > CORANK_TOL * d["residual"]
    return {"n_cov": N_COV, "n_found": int(ok.sum()), "n_corank1": int(corank1.sum()),
            "n_fold": int((corank1 & (d["transversality"] > FOLD_TOL)).sum()),
            "t_conj": summarize(tc[ok]), **{k: summarize(x) for k, x in d.items()},
            "per_covector": {"t_conj": tc[ok].tolist(), **{k: x.tolist() for k, x in d.items()}}}


def main():
    t_start = time.time()
    res = {"quick": QUICK, "seed": SEED, "rk4_steps": STEPS, "h_fd": H_FD, "h_dir": H_DIR,
           "t_scan": [T_LO, T_MAX, N_SCAN],
           "tolerances": {"tau": TAU_TOL, "du_side": DU_SIDE, "corank": CORANK_TOL,
                          "residual": RESID_TOL, "sigma_kappa": SIG_KAPPA, "kappa": KAPPA_TOL,
                          "sigmas": SIGMAS.tolist(), "slope_even": EVEN_RANGE,
                          "slope_odd_perp": ODD_RANGE, "cos_flip": COS_TOL, "fold": FOLD_TOL,
                          "t_jump": T_JUMP, "v_dot_min": V_DOT_MIN},
           "cusps": {}, "fold6": {}}

    print("== E11 part 1: cusps (A3) on the first conjugate locus ==")
    print(f"{'group':<8}{'loops':>6}{'searched':>10}{'conj':>7}{'brackets':>10}{'located':>9}"
          f"{'verified':>10}  per loop")
    for g in ("SE(2)", "Engel", "Cartan"):
        t0 = time.time()
        r = cusp_search(liegroup.GROUPS[g])
        r["seconds"] = time.time() - t0
        res["cusps"][g] = r
        print(f"{g:<8}{len(r['loops']):>6}{r['n_searched']:>10}{r['n_conjugate_found']:>7}"
              f"{r['n_brackets']:>10}{r['n_located']:>9}{r['n_verified']:>10}  "
              f"{r.get('verified_per_loop')}  ({r['seconds']:.0f}s)")
        if r["cusps"]:
            print(f"        failed checks: {r['failed_checks']}")
            print(f"        post-hoc classes: {r['classes']}")
            print(f"        degenerate: {r['degenerate_summary']}; kernel in symmetry span: "
                  f"{r['n_kernel_in_symmetry_span']}/{len(r['cusps'])}")
            for k, s in r["verified_summary"].items():
                if s:
                    print(f"        |{k}|: {s['min']:.3g} .. {s['max']:.3g}")
    cal = res["cusps"]["SE(2)"]
    res["calibration_passed"] = bool(cal["n_brackets"] and min(cal["verified_per_loop"]) >= 4)
    print(f"calibration (SE(2) >= 4 verified cusps on every loop): "
          f"{'PASSED' if res['calibration_passed'] else 'FAILED -> experiment inconclusive'}")

    print("\n== E11 part 2: E10 fold test in dimension 6 ==")
    # validate the matrix-group engine on SE(2) against the E10 artifact
    v = fold_test(se2_matrix())
    e10 = ROOT / "artifacts" / "e10_results.json"
    if e10.exists() and json.loads(e10.read_text())["n_cov"] == N_COV:
        ref = json.loads(e10.read_text())["groups"]["SE(2)"]["per_covector"]
        v["max_abs_dt_vs_e10"] = float(np.max(np.abs(np.array(ref["t_conj"])
                                                     - v["per_covector"]["t_conj"])))
        v["max_abs_dtransversality_vs_e10"] = float(np.max(np.abs(
            np.array(ref["transversality"]) - v["per_covector"]["transversality"])))
        print(f"matrix engine vs E10 on SE(2): max |dt_c| = {v['max_abs_dt_vs_e10']:.1e}, "
              f"max |d transversality| = {v['max_abs_dtransversality_vs_e10']:.1e}")
        assert v["max_abs_dt_vs_e10"] < 1e-5 and v["max_abs_dtransversality_vs_e10"] < 1e-4
    res["fold6"]["SE(2)-matrix (validation)"] = v
    print(f"{'model':<26}{'found':>7}{'t_c med':>9}{'gap min':>10}{'s_n/s_1 max':>13}"
          f"{'transv. min':>13}{'median':>10}{'max':>10}{'corank1':>9}{'folds':>8}")
    for label, model in (("SE(3)-cone (nilpotent)", liegroup.GROUPS["SE(3)-cone"]),
                         ("SE(3) (curved group)", se3_matrix())):
        t0 = time.time()
        r = fold_test(model)
        r["seconds"] = time.time() - t0
        res["fold6"][label] = r
        if r["n_found"]:
            tr = r["transversality"]
            print(f"{label:<26}{r['n_found']:>4}/{N_COV:<2}{r['t_conj']['median']:>9.3f}"
                  f"{r['gap']['min']:>10.4f}{r['residual']['max']:>13.1e}{tr['min']:>13.1e}"
                  f"{tr['median']:>10.1e}{tr['max']:>10.1e}{r['n_corank1']:>6}/{r['n_found']}"
                  f"{r['n_fold']:>5}/{r['n_found']}")
        else:
            print(f"{label:<26}   0/{N_COV}")

    res["seconds_total"] = time.time() - t_start
    out = ROOT / "artifacts" / "e11_results.json"
    out.write_text(json.dumps(res, indent=2) + "\n")
    print(f"\nwrote {out.relative_to(ROOT)}  ({res['seconds_total']:.0f}s)")


if __name__ == "__main__":
    main()
