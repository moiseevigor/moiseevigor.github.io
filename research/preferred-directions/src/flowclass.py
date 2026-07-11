"""R2 -- null-type classifiers that consume the SAME noisy gridded field.

Three classifiers for the four-class null problem {radial+, radial-, spiral+, spiral-}:

  classify_flow     -- the integrated (sub-Riemannian) read-out. Field lines are the
                       kernel foliation of the SR curvature 2-form dA (in 3D, dA = i_B vol,
                       so the field-line flow IS the curvature-kernel flow). The classifier
                       integrates trajectories r' = B(r) from a small sphere and reads:
                         type  : winding of trajectories about the coherent rotation axis
                                 (spiral -> unbounded/coherent, radial -> bounded < pi)
                         sign  : median escape time forward vs backward (div B = 0 forces
                                 the spine rate |p+q| to beat the fan rate max Re mu, so
                                 the fast-escape side is the spine side)
                         chi   : sign of the net angular circulation (the J|| chirality)
                       NO derivative of the field is ever taken -- integration only.

  classify_fd_plain -- the standard practice: central-difference Jacobian at the null,
                       eigenvalues, Parnell classification (nulltopo).

  classify_fd_lsq   -- the strong baseline: least-squares linear fit B ~ M r + b over all
                       grid nodes in the info ball (near the maximum-likelihood M under
                       white Gaussian noise), then Parnell classification.

Fairness protocol (pre-registered in PROGRAM-P3): all methods get the true null location
(origin) and the same information ball of radius rho_info; noise is white per grid node,
sigma is relative to the RMS |B| over the info ball; per draw the SAME grid instance goes
to all three classifiers.

Dependency-light: numpy; nulltopo from the same src dir.
"""
from __future__ import annotations

import numpy as np

import nulltopo


# ------------------------------------------------------------------ gridded field

def make_grid(M, L=1.0, n=33, sigma=0.0, quad=0.0, rng=None):
    """Gridded null field B = M r (+ optional quadratic curvature) + white noise.

    sigma is relative to the RMS |B| over the nodes with |r| <= L/2 (the info ball).
    quad is the RMS ratio (over the same ball) of a divergence- and current-free
    quadratic contaminant B_q ~ grad(xyz) = (yz, xz, xy) to the linear part -- it keeps
    the null at the origin and the physics valid, but misspecifies any linear model.
    Returns (F, L) with F shape (n, n, n, 3), axes (ix, iy, iz).
    """
    M = np.asarray(M, float)
    g = np.linspace(-L, L, n)
    X, Y, Z = np.meshgrid(g, g, g, indexing="ij")
    P = np.stack([X, Y, Z], axis=-1)                      # (n,n,n,3)
    F = P @ M.T
    rr = np.linalg.norm(P, axis=-1)
    ball = rr <= L / 2
    if quad > 0:
        Fq = np.stack([Y * Z, X * Z, X * Y], axis=-1)     # grad(xyz): div-free, curl-free
        s = (np.sqrt((np.linalg.norm(F, axis=-1)[ball] ** 2).mean()) /
             np.sqrt((np.linalg.norm(Fq, axis=-1)[ball] ** 2).mean()))
        F = F + quad * s * Fq
    if sigma > 0:
        rms = np.sqrt((np.linalg.norm(F, axis=-1)[ball] ** 2).mean())
        F = F + (rng or np.random.default_rng()).normal(0.0, sigma * rms, F.shape)
    return F, L


def trilinear(F, L, P):
    """Vectorized trilinear interpolation of F (n,n,n,3) on [-L,L]^3 at P (m,3)."""
    n = F.shape[0]
    h = 2 * L / (n - 1)
    U = np.clip((np.atleast_2d(P) + L) / h, 0, n - 1.000001)
    I = U.astype(int)
    f = U - I
    out = np.zeros((len(U), 3))
    for di in (0, 1):
        wi = (1 - f[:, 0]) if di == 0 else f[:, 0]
        for dj in (0, 1):
            wj = (1 - f[:, 1]) if dj == 0 else f[:, 1]
            for dk in (0, 1):
                wk = (1 - f[:, 2]) if dk == 0 else f[:, 2]
                w = (wi * wj * wk)[:, None]
                out += w * F[I[:, 0] + di, I[:, 1] + dj, I[:, 2] + dk]
    return out


# ------------------------------------------------------------------ the flow classifier

def _fibonacci_sphere(k):
    i = np.arange(k) + 0.5
    phi = np.arccos(1 - 2 * i / k)
    theta = np.pi * (1 + 5 ** 0.5) * i
    return np.stack([np.sin(phi) * np.cos(theta),
                     np.sin(phi) * np.sin(theta), np.cos(phi)], 1)


def _integrate(F, L, seeds, direction, dt, rho_out, max_steps):
    """RK4 r' = +/-B(r) from seeds until |r| >= rho_out. Returns (history list, t_exit)."""
    s = seeds.copy()
    active = np.ones(len(s), bool)
    t_exit = np.full(len(s), max_steps * dt)
    hist = [s.copy()]

    def f(P):
        return direction * trilinear(F, L, P)

    for step in range(max_steps):
        if not active.any():
            break
        a = np.where(active)[0]
        p = s[a]
        k1 = f(p); k2 = f(p + 0.5 * dt * k1)
        k3 = f(p + 0.5 * dt * k2); k4 = f(p + dt * k3)
        s[a] = p + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
        out = np.linalg.norm(s, axis=1) >= rho_out
        newly = active & out
        t_exit[newly] = (step + 1) * dt
        active &= ~out
        hist.append(s.copy())
    return np.array(hist), t_exit                        # (T+1, k, 3), (k,)


def flow_diagnostics(F, L, rho_seed=0.15, rho_out=0.5, k=48, dt=0.02, max_steps=2000):
    """Integrated-flow observables: winding W, coherence chi_c, escape asymmetry, axis."""
    seeds = rho_seed * _fibonacci_sphere(k)
    Hf, tf = _integrate(F, L, seeds, +1.0, dt, rho_out, max_steps)
    Hb, tb = _integrate(F, L, seeds, -1.0, dt, rho_out, max_steps)

    # rotation axis + coherence from r x dr, both directions pooled
    Sm = np.zeros((3, 3))
    net = np.zeros(3)
    tot = 0.0
    for H in (Hf, Hb):
        r, dr = H[:-1], np.diff(H, axis=0)
        c = np.cross(r, dr).reshape(-1, 3)
        inside = (np.linalg.norm(r.reshape(-1, 3), axis=1) < rho_out)
        c = c[inside]
        Sm += c.T @ c
        net += c.sum(0)
        tot += np.linalg.norm(c, axis=1).sum()
    w_ax, V_ax = np.linalg.eigh(Sm)
    axis = V_ax[:, -1]
    chi_c = float(net @ axis / (tot or 1.0))             # signed coherence in [-1,1]

    # winding about the axis (per trajectory, unwrapped; both directions pooled)
    e1 = np.array([1.0, 0, 0]) if abs(axis[0]) < 0.9 else np.array([0, 1.0, 0])
    e1 = e1 - (e1 @ axis) * axis; e1 /= np.linalg.norm(e1)
    e2 = np.cross(axis, e1)
    winds = []
    for H in (Hf, Hb):
        q1, q2 = H @ e1, H @ e2                          # (T+1, k)
        rho = np.hypot(q1, q2)
        rr = np.linalg.norm(H, axis=2)
        th = np.unwrap(np.arctan2(q2, q1), axis=0)
        ok = (rho > 0.25 * rr) & (rr < rho_out) & (rr > 1e-4)
        for j in range(H.shape[1]):
            m = ok[:, j]
            if m.sum() > 5:
                winds.append(abs(th[m, j][-1] - th[m, j][0]))
    W = float(np.median(winds)) if winds else 0.0

    sign = "+" if np.median(tf) < np.median(tb) else "-"
    return {"W": W, "chi_c": chi_c, "sign": sign, "axis": axis,
            "t_fwd": float(np.median(tf)), "t_bwd": float(np.median(tb))}


def classify_flow(F, L, W_crit, **kw):
    d = flow_diagnostics(F, L, **kw)
    d["type"] = "spiral" if d["W"] > W_crit else "radial"
    d["label"] = d["type"] + d["sign"]
    return d


# ------------------------------------------------------------------ baselines

def classify_fd_plain(F, L, h=None):
    """Central differences at the null (standard practice)."""
    n = F.shape[0]
    h = h or 2 * (2 * L / (n - 1))                       # two grid cells
    M = np.empty((3, 3))
    e = np.eye(3)
    for j in range(3):
        M[:, j] = (trilinear(F, L, h * e[j][None]) -
                   trilinear(F, L, -h * e[j][None]))[0] / (2 * h)
    return nulltopo.classify_null(M)


def classify_fd_lsq(F, L, rho=0.5):
    """Least-squares linear fit B ~ M r + b over all nodes in the info ball (strong)."""
    n = F.shape[0]
    g = np.linspace(-L, L, n)
    X, Y, Z = np.meshgrid(g, g, g, indexing="ij")
    P = np.stack([X, Y, Z], -1).reshape(-1, 3)
    Bv = F.reshape(-1, 3)
    m = np.linalg.norm(P, axis=1) <= rho
    D = np.concatenate([P[m], np.ones((m.sum(), 1))], 1)
    coef, *_ = np.linalg.lstsq(D, Bv[m], rcond=None)     # (4,3)
    return nulltopo.classify_null(coef[:3].T)


def _demo():
    rng = np.random.default_rng(0)
    Mr = np.array([[1.0, -0.1, 0], [0.1, 0.4, 0], [0, 0, -1.4]])   # radial- (j<jthr=0.3)
    Ms = np.array([[1.0, -0.6, 0], [0.6, 0.4, 0], [0, 0, -1.4]])   # spiral- (j>jthr)
    for M, want_type in ((Mr, "radial"), (Ms, "spiral")):
        F, L = make_grid(M, sigma=0.0, rng=rng)
        assert classify_fd_plain(F, L)["type"] == want_type
        assert classify_fd_lsq(F, L)["type"] == want_type
        d = flow_diagnostics(F, L)
        assert d["sign"] == "-", d
        print(f"  {want_type:6s}: W={d['W']:.2f} chi_c={d['chi_c']:+.2f} "
              f"t_f={d['t_fwd']:.2f} t_b={d['t_bwd']:.2f}")
    print("flowclass demo done (W should separate: radial small, spiral large)")


if __name__ == "__main__":
    _demo()
