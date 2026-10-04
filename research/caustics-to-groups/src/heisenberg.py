"""Heisenberg group H^3 — sub-Riemannian forward model (Phase 0 ground truth).

Left-invariant orthonormal frame on R^3 = {(x, y, z)}:

    X1 = d/dx - (y/2) d/dz
    X2 = d/dy + (x/2) d/dz          [X1, X2] = d/dz =: X3

so the growth vector is (2, 3): rank-2, step-2, contact. Heisenberg is the
flat model (Agrachev-Barilari invariants chi = kappa = 0) and the metric
tangent cone of *every* 3D contact structure, which is exactly why the
tangent-cone growth vector alone cannot separate Heisenberg from SE(2), SL(2),
SH(2) (see docs/METHODS.md).

Normal geodesics from the identity, unit speed, with horizontal launch angle
`theta` and vertical momentum `w = h3` (constant along the flow):

    h1(t) = cos(theta + w t),   h2(t) = sin(theta + w t)
    x(t)  = (sin(theta + w t) - sin theta) / w
    y(t)  = (cos theta - cos(theta + w t)) / w
    z(t)  = (w t - sin(w t)) / (2 w^2)

The horizontal projection is a circle of radius 1/|w|; z(t) is half the signed
area it sweeps and is independent of theta. For w = 0 the geodesic is the
straight horizontal ray (no conjugate point).

Known conjugate locus (the golden facts this module is tested against):
  * first conjugate time    t_c = 2*pi / |w|,  independent of theta;
  * conjugate point         (0, 0, pi*sign(w)/w^2)  -- on the z-axis;
  * so the first conjugate locus = cut locus = z-axis minus the origin.

The certificate is the rotational Jacobi field d(gamma)/d(theta) = (-y, x, 0),
which vanishes at t=0 and first again at t_c.

Everything here is closed-form and dependency-light (numpy only); it is the
leakage-free ground truth the inverse estimator is graded against.
"""
from __future__ import annotations

import numpy as np

GROWTH_VECTOR = (2, 3)          # rank 2, then + [D,D] fills 3D
HOMOGENEOUS_DIMENSION = 4       # Q = 1*2 + 2*(3-2)
HAS_ABNORMAL_MINIMIZERS = False  # corank 1 (contact): no strictly abnormal minimizers


def geodesic(theta, w, t):
    """Point gamma_{theta,w}(t) on the unit-speed normal geodesic from the origin.

    Parameters are broadcast; `t` may be an array. Returns an array with the
    coordinate axis last, shape (..., 3). The w -> 0 (straight-line) limit is
    handled with the Taylor forms so the map is smooth through w = 0.
    """
    theta = np.asarray(theta, dtype=float)
    w = np.asarray(w, dtype=float)
    t = np.asarray(t, dtype=float)
    small = np.abs(w) < 1e-8
    w_safe = np.where(small, 1.0, w)          # avoid 0/0; masked out below
    a = theta + w_safe * t
    x = np.where(small, np.cos(theta) * t, (np.sin(a) - np.sin(theta)) / w_safe)
    y = np.where(small, np.sin(theta) * t, (np.cos(theta) - np.cos(a)) / w_safe)
    z = np.where(small, 0.0 * t, (w_safe * t - np.sin(w_safe * t)) / (2.0 * w_safe**2))
    return np.stack(np.broadcast_arrays(x, y, z), axis=-1)


def velocity(theta, w, t):
    """d(gamma)/dt = (cos(theta + w t), sin(theta + w t), (1 - cos(w t))/(2 w))."""
    theta = np.asarray(theta, dtype=float)
    w = np.asarray(w, dtype=float)
    t = np.asarray(t, dtype=float)
    small = np.abs(w) < 1e-8
    w_safe = np.where(small, 1.0, w)
    a = theta + w_safe * t
    dx = np.cos(a)
    dy = np.sin(a)
    dz = np.where(small, 0.0 * t, (1.0 - np.cos(w_safe * t)) / (2.0 * w_safe))
    return np.stack(np.broadcast_arrays(dx, dy, dz), axis=-1)


def d_theta(theta, w, t):
    """The rotational Jacobi field d(gamma)/d(theta) = (-y, x, 0).

    Vanishes at t = 0 and first again at the conjugate time; its modulus is the
    projection's distance from the z-axis, (2/|w|)|sin(w t / 2)|.
    """
    p = geodesic(theta, w, t)
    out = np.empty_like(p)
    out[..., 0] = -p[..., 1]
    out[..., 1] = p[..., 0]
    out[..., 2] = 0.0
    return out


def conjugate_time(w):
    """First conjugate time t_c = 2*pi / |w| (inf for the straight geodesic)."""
    w = np.asarray(w, dtype=float)
    with np.errstate(divide="ignore"):
        tc = 2.0 * np.pi / np.abs(w)
    return np.where(np.abs(w) < 1e-8, np.inf, tc)


def conjugate_point(w, theta=0.0):
    """Conjugate point (0, 0, pi*sign(w)/w^2). theta only sets a degenerate arg."""
    w = np.asarray(w, dtype=float)
    tc = conjugate_time(w)
    return geodesic(theta, w, tc)
