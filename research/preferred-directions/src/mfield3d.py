"""3D magnetic contact structure (Phase 2): total space (x, y, z, flux).

In 3D the flux lift adjoins the holonomy phi = int A.dl to position, with horizontal
frame

    X_i = d/dx_i + A_i d/dphi   (i = 1,2,3),     [X_i, X_j] = (curl A)_k eps_ijk d/dphi.

Since the three brackets give the three components of B = curl A, one bracket already
reaches the flux direction wherever B != 0: growth vector (3,4), step 2,

    Q = 1*3 + 2*(4-3) = 5 = d + k + 2   with d = 3, k = 0.

Where B vanishes to order k (e.g. a linear magnetic null, k = 1), the flux is reached
only at order k+2, so Q = 3 + (k+2) = k + 5. A generic 3D null therefore shows Q = 6.

This module measures Q by geodesic reach: it shoots horizontal curves whose velocity
direction rotates in a random plane at a wide-band rate (so loops of every size are
sampled, accumulating flux), plus straight curves (for the spatial reach), and fits the
exponent of each coordinate's reach vs curve length. The flux coordinate is gauge-fixed
to A(q0) = 0 at the base point (subtract the weight-1 leak), exactly as in 2D.

Dependency-light: numpy only.
"""
from __future__ import annotations

import numpy as np


class MagneticStructure3D:
    """A 3D magnetic field given by its vector potential A(x) = (A_x, A_y, A_z)."""

    def __init__(self, A, name="A"):
        self.A = A                      # A(P) : (n,3) -> (n,3)
        self.name = name

    def B(self, P, h=1e-5):
        """B = curl A at points P (n,3), by central differences."""
        P = np.atleast_2d(np.asarray(P, dtype=float))
        e = np.eye(3)
        d = {}
        for j in range(3):
            d[j] = (self.A(P + h * e[j]) - self.A(P - h * e[j])) / (2 * h)  # dA/dx_j
        Bx = d[1][:, 2] - d[2][:, 1]
        By = d[2][:, 0] - d[0][:, 2]
        Bz = d[0][:, 1] - d[1][:, 0]
        return np.stack([Bx, By, Bz], axis=1)

    def grad_B(self, P, h=1e-4):
        """Jacobian dB_i/dx_j at a single point (3,3): the standard null classifier."""
        P = np.asarray(P, dtype=float).reshape(1, 3)
        e = np.eye(3)
        J = np.empty((3, 3))
        for j in range(3):
            J[:, j] = (self.B(P + h * e[j])[0] - self.B(P - h * e[j])[0]) / (2 * h)
        return J

    def _horizontal_curves(self, q0, r, n, rng, w_lo=0.4, w_hi=40.0, steps=300):
        """Endpoints of n horizontal curves of length r from q0=(x,y,z,phi).

        Velocity u(t) = cos(om t) a + sin(om t) b for a random orthonormal plane (a,b);
        om = w/r with w log-uniform (wide band) and, for a fraction, w = 0 (straight).
        phi accumulates A(x).u. Returns (n, 4).
        """
        q0 = np.asarray(q0, dtype=float)
        # random orthonormal planes
        a = rng.standard_normal((n, 3)); a /= np.linalg.norm(a, axis=1, keepdims=True)
        b = rng.standard_normal((n, 3))
        b -= (np.sum(a * b, axis=1, keepdims=True)) * a
        b /= np.linalg.norm(b, axis=1, keepdims=True)
        w = 10.0 ** rng.uniform(np.log10(w_lo), np.log10(w_hi), n)
        w[: n // 4] = 0.0                           # a quarter go straight (spatial reach)
        om = w / r
        s = np.tile(q0, (n, 1))
        dt = r / steps
        t = 0.0
        for _ in range(steps):
            for _sub in range(1):
                c, sn = np.cos(om * t), np.sin(om * t)
                u = c[:, None] * a + sn[:, None] * b        # unit velocity (n,3)
                Aq = self.A(s[:, :3])
                s = s + dt * np.concatenate([u, np.sum(Aq * u, axis=1, keepdims=True)], axis=1)
                t += dt
        return s

    def weights_Q(self, q0, radii, n, rng):
        """(weights[4], Q) at base point q0 via reach-exponent scaling."""
        import growth  # shared core (../caustics-to-groups/src on sys.path)
        q0 = np.asarray(q0, dtype=float)
        A0 = self.A(q0[None, :3])[0]
        reach = np.empty((len(radii), 4))
        for i, r in enumerate(radii):
            ends = self._horizontal_curves(q0, float(r), n, rng)
            d = ends - q0
            d[:, 3] -= A0 @ d[:, :3].T                       # gauge-fix phi at q0
            reach[i] = np.quantile(np.abs(d), 0.98, axis=0)
        w = growth.estimate_weights(reach, np.asarray(radii), w_max=8.0)
        return w, int(np.rint(w).sum())


# ---------------------------------------------------------------- example fields

def uniform3d(B0=1.0):
    """A = B0*(-y/2, x/2, 0) -> B = (0,0,B0). Contact everywhere: Q = 5."""
    def A(P):
        P = np.atleast_2d(np.asarray(P, float))
        return np.stack([-B0 * P[:, 1] / 2, B0 * P[:, 0] / 2, np.zeros(len(P))], 1)
    return MagneticStructure3D(A, "uniform Bz")


def linear_null(kind="proper"):
    """A = (yz, -xz, 0) -> B = (x, y, -2z): a proper linear 3D null at the origin.

    grad B = diag(1,1,-2), all-real eigenvalues (a proper/radial null). k = 1 => Q = 6
    at the origin, Q = 5 elsewhere.
    """
    def A(P):
        P = np.atleast_2d(np.asarray(P, float))
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        return np.stack([y * z, -x * z, np.zeros(len(P))], 1)
    return MagneticStructure3D(A, "proper null B=(x,y,-2z)")
