"""P5-T1 -- the race: scale-crossover vs quadratic-fit root-finder on noisy gridded B.

Both methods consume the SAME gridded field (n,n,n,3) on [-L,L]^3; neither gets an
analytic potential.

  Crossover : builds its own vector potential by the ray (Poincare) gauge
                  A(r) = -r x int_0^1 s B(s r) ds        (curl A = B for div-free B),
              computed by Gauss-Legendre quadrature on the trilinear-interpolated grid;
              measures the flux reach Phi(r) at a ladder of radii, takes local log-log
              slopes w4(r), and reads the pair separation from where the slope crosses 3
              (the 2 -> 4 knee), scaled by a constant kappa calibrated ONCE on a single
              noiseless pure-fold configuration and then frozen.

  Quad fit  : least-squares fit of the 26-dim divergence-free polynomial model
              (3 constants + 8 traceless linears + 15 div-free quadratics) over the
              info ball, then Newton root-finding of the fitted field; separation =
              max pairwise distance of the roots found.

Dependency-light: numpy; flowclass (trilinear) + mfield3d from the same src dir.
"""
from __future__ import annotations

import numpy as np

import flowclass as fc
import mfield3d as m3

# --------------------------------------------------------------- gridded field + gauge

def field_grid(field, L=1.0, n=41, sigma=0.0, rng=None):
    """Evaluate a callable field on the grid + white noise (sigma rel. ball RMS)."""
    g = np.linspace(-L, L, n)
    X, Y, Z = np.meshgrid(g, g, g, indexing="ij")
    P = np.stack([X, Y, Z], -1).reshape(-1, 3)
    F = field(P).reshape(n, n, n, 3)
    rr = np.linalg.norm(P, axis=1).reshape(n, n, n)
    rms = np.sqrt((np.linalg.norm(F, axis=-1)[rr <= L / 2] ** 2).mean())
    if sigma > 0:
        F = F + (rng or np.random.default_rng()).normal(0, sigma * rms, F.shape)
    return F, rms


_GL_X, _GL_W = np.polynomial.legendre.leggauss(12)
_GL_S = 0.5 * (_GL_X + 1.0)                       # nodes on (0,1)
_GL_WS = 0.5 * _GL_W


def ray_gauge_structure(F, L, name="ray-gauge"):
    """SR structure whose A comes from the grid alone: A(r) = -r x int_0^1 s B(sr) ds."""
    def A(P):
        P = np.atleast_2d(np.asarray(P, float))
        acc = np.zeros_like(P)
        for s, w in zip(_GL_S, _GL_WS):
            acc += (w * s) * fc.trilinear(F, L, s * P)
        return -np.cross(P, acc)
    return m3.MagneticStructure3D(A, name)


# --------------------------------------------------------------- crossover estimator

def flux_reaches(struct, q0, radii, n, rng):
    """98th-percentile flux reach at each radius (gauge-adapted at q0)."""
    q0 = np.asarray(q0, float)
    A0, S = struct.gauge_terms(q0[:3])
    out = np.empty(len(radii))
    for i, r in enumerate(radii):
        ends = struct._horizontal_curves(q0, float(r), n, rng)
        d = ends - q0
        d[:, 3] -= d[:, :3] @ A0 + 0.5 * np.einsum("ni,ij,nj->n", d[:, :3], S, d[:, :3])
        out[i] = np.quantile(np.abs(d[:, 3]), 0.98)
    return out


def knee_separation(struct, radii, kappa, n=3000, rng=None):
    """Estimated pair separation: 2 * (radius where the local slope crosses 3) / kappa.

    Returns (sep_hat, slopes). NaN if the slope never crosses 3 within the ladder.
    """
    rng = rng or np.random.default_rng()
    phi = flux_reaches(struct, [0, 0, 0, 0], radii, n, rng)
    lr, lp = np.log(radii), np.log(phi)
    slopes = np.diff(lp) / np.diff(lr)                 # local w4 between rungs
    rmid = np.sqrt(radii[:-1] * radii[1:])
    for i in range(len(slopes) - 1):
        a, b = slopes[i], slopes[i + 1]
        if a < 3.0 <= b:
            t = (3.0 - a) / (b - a)
            r_b = rmid[i] * (rmid[i + 1] / rmid[i]) ** t
            return 2.0 * r_b / kappa, slopes
    return float("nan"), slopes


# --------------------------------------------------------------- quadratic-fit baseline

def _divfree_basis():
    """26 divergence-free polynomial fields: 3 const + 8 traceless linear + 15 quad."""
    basis = []
    for i in range(3):                                 # constants
        c = np.zeros(3); c[i] = 1.0
        basis.append(("c", c))
    L9 = []                                            # linear e_i x_j
    for i in range(3):
        for j in range(3):
            M = np.zeros((3, 3)); M[i, j] = 1.0
            L9.append(M)
    # traceless combinations: project out the identity direction
    I = np.eye(3) / np.sqrt(3)
    seen = []
    for M in L9:
        M = M - np.trace(M) * np.eye(3) / 3
        v = M.ravel()
        for s in seen:
            v = v - (v @ s) * s
        nv = np.linalg.norm(v)
        if nv > 1e-9:
            seen.append(v / nv)
            basis.append(("l", (v / nv).reshape(3, 3)))
    pairs = [(0, 0), (0, 1), (0, 2), (1, 1), (1, 2), (2, 2)]
    Q18, div = [], []
    for i in range(3):
        for (a, b) in pairs:
            Q18.append((i, a, b))
            d = np.zeros(3)                            # div(e_i x_a x_b) coeffs of (x,y,z)
            if i == a:
                d[b] += 1.0
            if i == b:
                d[a] += 1.0
            div.append(d)
    div = np.array(div)                                # (18, 3)
    _, _, Vt = np.linalg.svd(div.T @ div)              # hmm: need nullspace of div^T (3x18)
    # nullspace of the 3x18 map q -> sum q_k div_k
    U, s, Vt = np.linalg.svd(div.T, full_matrices=True)  # div.T is (3,18)
    null = Vt[3:]                                      # (15, 18)
    for row in null:
        basis.append(("q", (row, Q18)))
    return basis


_BASIS = _divfree_basis()


def _eval_basis(P):
    """(m, 3, 26): every basis field at every point."""
    P = np.atleast_2d(P)
    m = len(P)
    out = np.zeros((m, 3, len(_BASIS)))
    for k, (kind, data) in enumerate(_BASIS):
        if kind == "c":
            out[:, :, k] = data[None, :]
        elif kind == "l":
            out[:, :, k] = P @ data.T
        else:
            row, Q18 = data
            for coef, (i, a, b) in zip(row, Q18):
                if coef != 0.0:
                    out[:, i, k] += coef * P[:, a] * P[:, b]
    return out


def quadfit_separation(F, L, rho=0.75, seed_grid=5):
    """LSQ div-free quadratic fit over the ball + Newton roots -> (sep_hat, n_roots)."""
    n = F.shape[0]
    g = np.linspace(-L, L, n)
    X, Y, Z = np.meshgrid(g, g, g, indexing="ij")
    P = np.stack([X, Y, Z], -1).reshape(-1, 3)
    m = np.linalg.norm(P, axis=1) <= rho
    Pm, Bm = P[m], F.reshape(-1, 3)[m]
    D = _eval_basis(Pm).reshape(len(Pm) * 3, len(_BASIS))
    coef, *_ = np.linalg.lstsq(D, Bm.ravel(), rcond=None)

    def Bhat(p):
        return (_eval_basis(p[None]) @ coef)[0]

    def Jhat(p, h=1e-4):
        J = np.empty((3, 3))
        for a in range(3):
            e = np.zeros(3); e[a] = h
            J[:, a] = (Bhat(p + e) - Bhat(p - e)) / (2 * h)
        return J

    roots = []
    ax = np.linspace(-0.55, 0.55, seed_grid)
    for sx in ax:
        for sy in ax:
            for sz in ax:
                p = np.array([sx, sy, sz])
                ok = True
                for _ in range(40):
                    b = Bhat(p)
                    if np.linalg.norm(b) < 1e-9:
                        break
                    try:
                        step = np.linalg.solve(Jhat(p), b)
                    except np.linalg.LinAlgError:
                        ok = False; break
                    if np.linalg.norm(step) > 0.5:
                        step *= 0.5 / np.linalg.norm(step)
                    p = p - step
                    if np.linalg.norm(p) > 1.2:
                        ok = False; break
                if ok and np.linalg.norm(Bhat(p)) < 1e-7:
                    if not any(np.linalg.norm(p - q) < 0.03 for q in roots):
                        roots.append(p.copy())
    if len(roots) >= 2:
        R = np.array(roots)
        d = np.linalg.norm(R[:, None] - R[None, :], axis=-1)
        return float(d.max()), len(roots)
    return float("nan"), len(roots)
