"""Generic caustic / first-conjugate-time detection for a parametrized geodesic.

Given a geodesic map  gamma(theta, w, t) -> R^3  (a family launched from a base
point, indexed by launch angle `theta` and vertical momentum `w`), the conjugate
locus is the critical-value set of the exponential map: the points where nearby
geodesics refocus. For a 3D contact structure the exponential map is a map from
the (theta, w, t) chart into R^3, and a conjugate point is where its Jacobian

    J(t) = det[ d(gamma)/d(theta) | d(gamma)/d(w) | d(gamma)/dt ]

drops rank, i.e. J(t) = 0. The first positive zero is the first conjugate time.

This detector is finite-difference based so it works for *any* geodesic map,
closed-form or numerically integrated -- the same routine will grade SE(2),
Engel, and Cartan once their forward models land. It is validated in
scripts/smoke_test.py against the Heisenberg closed form (t_c = 2*pi/|w|).

Dependency-light: numpy only.
"""
from __future__ import annotations

import numpy as np


def jacobian_det(geodesic_fn, theta, w, t, h=1e-6):
    """Determinant J(t) of the exponential map's differential at (theta, w, t).

    Central finite differences in theta, w, t. Scalar inputs -> scalar out.
    """
    def col(dtheta, dw, dt):
        plus = geodesic_fn(theta + dtheta, w + dw, t + dt)
        minus = geodesic_fn(theta - dtheta, w - dw, t - dt)
        return (np.asarray(plus) - np.asarray(minus)) / (2.0 * h)

    c_theta = col(h, 0.0, 0.0)
    c_w = col(0.0, h, 0.0)
    c_t = col(0.0, 0.0, h)
    m = np.stack([c_theta, c_w, c_t], axis=-1)  # (..., 3, 3)
    return np.linalg.det(m)


def first_conjugate_time(geodesic_fn, theta, w, t_max, n_scan=400, t_lo=1e-3,
                         h=1e-6, tol=1e-9):
    """First t in (t_lo, t_max] where the Jacobian J(t) changes sign.

    Coarse scan for the first sign change, then bisection to `tol`. Returns None
    if J holds one sign throughout (no conjugate point below t_max).
    """
    ts = np.linspace(t_lo, t_max, n_scan)
    j = np.array([jacobian_det(geodesic_fn, theta, w, t, h=h) for t in ts])
    sign = np.sign(j)
    crossings = np.where(sign[:-1] * sign[1:] < 0)[0]
    if crossings.size == 0:
        return None
    i = crossings[0]
    a, b = ts[i], ts[i + 1]
    ja = jacobian_det(geodesic_fn, theta, w, a, h=h)
    while b - a > tol:
        mid = 0.5 * (a + b)
        jm = jacobian_det(geodesic_fn, theta, w, mid, h=h)
        if ja * jm <= 0:
            b = mid
        else:
            a, ja = mid, jm
    return 0.5 * (a + b)


def first_conjugate_time_contact(spec, theta, w, t_max, n_scan=300, h=1e-5,
                                 steps_per_unit=120):
    """Fast first conjugate time for a 3D contact GroupSpec via the batched engine.

    Integrates the covector and its (theta, w) perturbations together over a time
    grid, forms the Jacobian columns [d/dtheta, d/dw, d/dt] of the exponential map
    at every grid time, and returns the first sign change of the determinant
    (linearly interpolated). ~5 ODE integrations total, vs thousands for the
    finite-difference `first_conjugate_time` on `exp_map`. Requires dim == 3.
    """
    import liegroup
    assert spec.dim == 3, "contact routine expects a 3D structure"
    t_grid = np.linspace(t_max / n_scan, t_max, n_scan)
    c, s = np.cos, np.sin
    covs = np.array([
        [c(theta),     s(theta),     w],
        [c(theta + h), s(theta + h), w],
        [c(theta - h), s(theta - h), w],
        [c(theta),     s(theta),     w + h],
        [c(theta),     s(theta),     w - h],
    ])
    pos = liegroup.geodesic_batch(spec, covs, t_grid, steps_per_unit)  # (5, n_scan, 3)
    d_theta = (pos[1] - pos[2]) / (2 * h)
    d_w = (pos[3] - pos[4]) / (2 * h)
    d_t = np.gradient(pos[0], t_grid, axis=0)
    M = np.stack([d_theta, d_w, d_t], axis=-1)   # (n_scan, 3, 3)
    J = np.linalg.det(M)
    sign = np.sign(J)
    idx = np.where(sign[:-1] * sign[1:] < 0)[0]
    if idx.size == 0:
        return None
    i = idx[0]
    t0, t1, j0, j1 = t_grid[i], t_grid[i + 1], J[i], J[i + 1]
    return float(t0 - j0 * (t1 - t0) / (j1 - j0))


def conjugate_locus(geodesic_fn, ws, thetas, t_max_factor=None):
    """Sample the first conjugate point over grids of (w, theta).

    Returns an array of shape (len(ws), len(thetas), 3). `t_max_factor(w)` gives
    the scan horizon per w; defaults to 4*pi/|w| (two turns for a contact model).
    """
    if t_max_factor is None:
        t_max_factor = lambda w: 4.0 * np.pi / max(abs(w), 1e-6)
    out = np.full((len(ws), len(thetas), 3), np.nan)
    for i, w in enumerate(ws):
        for k, th in enumerate(thetas):
            tc = first_conjugate_time(geodesic_fn, th, w, t_max_factor(w))
            if tc is not None:
                out[i, k] = np.asarray(geodesic_fn(th, w, tc))
    return out
