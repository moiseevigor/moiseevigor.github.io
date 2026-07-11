"""Geodesics, conjugate locus, and nilpotent deviation of a magnetic contact structure.

Phase 1 of docs/PROGRAM.md. The structure (from the caustics-to-groups E8 result):

    X1 = d/dx + A_x d/dz,  X2 = d/dy + A_y d/dz,   [X1,X2] = B(x,y) d/dz

with (X1, X2) orthonormal. Its normal geodesics have a purely physical form. Writing
h1 = cos(th), h2 = sin(th) for the unit horizontal momentum and w = p_z (conserved, since
A and B do not depend on z):

    x' = cos th,   y' = sin th,   z' = A_x cos th + A_y sin th,   th' = B(x,y) * w

i.e. **unit-speed curves whose curvature is B(x,y)*w** -- Larmor motion in a
position-dependent field. For uniform B0 the orbit is a circle of radius 1/(B0|w|) that
closes at

    t_c = 2*pi / (B0 |w|)                         (the Heisenberg conjugate time)

so the tangent cone at q0 is Heisenberg with the constant field B0 = B(q0), and the
**nilpotent deviation** of the true structure from its own tangent cone is

    delta(th0, w) = 1 - t_c(th0, w) * B0 * |w| / (2*pi),

averaged over the launch angle th0. delta vanishes identically for uniform B.

The conjugate time is the first zero of the Jacobian determinant of the exponential map,
det[ d(gamma)/d(th0) | d(gamma)/dw | d(gamma)/dt ], computed by integrating the base
geodesic together with its (th0 +/- h, w +/- h) perturbations in one batch.

Gauge note: t_c is gauge-invariant. A gauge change z -> z + chi(x,y) is a diffeomorphism
of the target, and a diffeomorphism cannot move the set where a map's Jacobian drops rank.

Dependency-light: numpy only.
"""
from __future__ import annotations

import numpy as np


class MagneticStructure:
    """A planar magnetic field given by its vector potential (A_x, A_y) and field B."""

    def __init__(self, A_x, A_y, B, name="B"):
        self.A_x, self.A_y, self.B = A_x, A_y, B
        self.name = name

    # ---- geodesic flow -----------------------------------------------------
    def _rhs(self, s, w):
        x, y, th = s[:, 0], s[:, 1], s[:, 3]
        c, sn = np.cos(th), np.sin(th)
        return np.stack([c, sn,
                         self.A_x(x, y) * c + self.A_y(x, y) * sn,
                         self.B(x, y) * w], axis=1)

    def _integrate(self, q0, th0, w, t_grid):
        """RK4 for a batch of (th0, w). Returns positions (n, T, 3) and angles (n, T)."""
        n = th0.size
        s = np.zeros((n, 4))
        s[:, 0], s[:, 1], s[:, 2] = q0[0], q0[1], q0[2]
        s[:, 3] = th0
        pos = np.empty((n, t_grid.size, 3))
        ang = np.empty((n, t_grid.size))
        t_prev = 0.0
        for i, t in enumerate(t_grid):
            dt = t - t_prev
            k1 = self._rhs(s, w)
            k2 = self._rhs(s + 0.5 * dt * k1, w)
            k3 = self._rhs(s + 0.5 * dt * k2, w)
            k4 = self._rhs(s + dt * k3, w)
            s = s + (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)
            pos[:, i, :] = s[:, :3]
            ang[:, i] = s[:, 3]
            t_prev = t
        return pos, ang

    # ---- conjugate time ----------------------------------------------------
    def conjugate_times(self, q0, thetas, w, t_max, n_scan=2000, h=1e-5):
        """First conjugate time for each launch angle, via the Jacobian determinant.

        Integrates, for each th0, the base geodesic plus the four perturbations
        (th0 +/- h) and (w +/- h) in a single batch. Returns (len(thetas),) with NaN
        where no conjugate point was found below t_max.
        """
        q0 = np.asarray(q0, dtype=float)
        thetas = np.asarray(thetas, dtype=float)
        m = thetas.size
        t_grid = np.linspace(t_max / n_scan, t_max, n_scan)

        th_all = np.concatenate([thetas, thetas + h, thetas - h, thetas, thetas])
        w_all = np.concatenate([np.full(m, w), np.full(m, w), np.full(m, w),
                                np.full(m, w + h), np.full(m, w - h)])
        pos, ang = self._integrate(q0, th_all, w_all, t_grid)
        pos = pos.reshape(5, m, n_scan, 3)
        th_base = ang[:m]                                    # (m, n_scan)

        d_th = (pos[1] - pos[2]) / (2 * h)                   # (m, n_scan, 3)
        d_w = (pos[3] - pos[4]) / (2 * h)
        xb, yb = pos[0][..., 0], pos[0][..., 1]
        c, sn = np.cos(th_base), np.sin(th_base)
        d_t = np.stack([c, sn, self.A_x(xb, yb) * c + self.A_y(xb, yb) * sn], axis=-1)

        M = np.stack([d_th, d_w, d_t], axis=-1)              # (m, n_scan, 3, 3)
        J = np.linalg.det(M)
        out = np.full(m, np.nan)
        for i in range(m):
            sgn = np.sign(J[i])
            cross = np.where(sgn[:-1] * sgn[1:] < 0)[0]
            if cross.size:
                j = cross[0]
                t0, t1, j0, j1 = t_grid[j], t_grid[j + 1], J[i, j], J[i, j + 1]
                out[i] = t0 - j0 * (t1 - t0) / (j1 - j0)
        return out

    # ---- nilpotent deviation ----------------------------------------------
    def delta(self, q0, w, n_theta=12, n_scan=2000, t_max_factor=1.6):
        """Mean nilpotent deviation over launch angles: 1 - t_c * B0 * |w| / (2 pi)."""
        q0 = np.asarray(q0, dtype=float)
        B0 = float(self.B(q0[0], q0[1]))
        t_nil = 2.0 * np.pi / (B0 * abs(w))
        thetas = np.linspace(0.0, 2 * np.pi, n_theta, endpoint=False)
        tc = self.conjugate_times(q0, thetas, w, t_max_factor * t_nil, n_scan=n_scan)
        dev = 1.0 - tc / t_nil
        return float(np.nanmean(dev)), float(np.nanstd(dev)), int(np.isnan(tc).sum())


def exp_gradient_field(B0=1.0, g=0.0):
    """B = B0 * exp(g x): the unique family with EXACTLY constant grad(ln B) = (g, 0).

    Gauge chosen so A(0,0) = 0 (graded-adapted at the origin).
    """
    if abs(g) < 1e-14:
        A_y = lambda x, y: B0 * x
        B = lambda x, y: B0 * np.ones_like(np.asarray(x, dtype=float))
    else:
        A_y = lambda x, y: (B0 / g) * (np.exp(g * x) - 1.0)
        B = lambda x, y: B0 * np.exp(g * x)
    A_x = lambda x, y: np.zeros_like(np.asarray(x, dtype=float))
    return MagneticStructure(A_x, A_y, B, name=f"B={B0}exp({g}x)")
