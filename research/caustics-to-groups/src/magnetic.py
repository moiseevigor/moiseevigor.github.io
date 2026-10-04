"""The magnetic contact structure (experiment E8) — where sub-Riemannian geometry is real.

Two things are true of magnetized plasma and must not be confused:

1. **Transport across field lines is merely SLOW.** The diffusion tensor
   D = D_par b b + D_perp (I - b b) with D_perp << D_par is an *anisotropic Riemannian*
   metric. Its reachable set is an ellipsoid whose every semi-axis scales LINEARLY in
   the cost, so Q = n no matter how extreme the anisotropy. Coefficient anisotropy is
   not exponent anisotropy. The sub-Riemannian machinery does NOT apply here. And the
   singular limit D_perp -> 0 gives a rank-1 distribution, which is integrable
   (Frobenius) -- field lines -- not bracket-generating.

2. **Magnetic flux accumulation IS sub-Riemannian.** Adjoin to the plane the flux
   swept by the path, z = integral of A.dl (so that curl A = B z-hat). Then

       X1 = d/dx + A_x d/dz,     X2 = d/dy + A_y d/dz
       [X1, X2] = (dA_y/dx - dA_x/dy) d/dz = B(x,y) d/dz

   so the rank-2 distribution ker(dz - A_x dx - A_y dy) is **contact exactly where
   B != 0**, with growth vector (2,3) and Q = 4 > n = 3 on a set of FULL MEASURE. For
   uniform B in the symmetric gauge A = (-y/2, x/2) this frame is *literally* the
   Heisenberg frame of src/heisenberg.py, and the SR geodesics are the Larmor circles
   (equivalently, the isoperimetric problem).

   At a **magnetic null** (B = 0) the first bracket dies and flux accumulates only at
   third order: the structure degenerates to Martinet type, weights (1,1,3), Q = 5.
   So the growth vector jumps 4 -> 5 exactly on the null set -- the SR fingerprint is a
   magnetic-null (reconnection-site) detector.

Horizontal curves are integrated as a control system, q' = u1 X1(q) + u2 X2(q) with
(u1,u2) = (cos th, sin th) so that time = sub-Riemannian arclength. Controls are
constant-curvature arcs th = th0 + w t, with w sampled log-uniformly under the intrinsic
dilation (w ~ 1/r) so every radius samples each coordinate's full reach.

Dependency-light: numpy only.
"""
from __future__ import annotations

import numpy as np


class MagneticContact:
    """Contact structure of a planar magnetic field, given its vector potential."""

    def __init__(self, A_x, A_y, name="B-field"):
        self.A_x = A_x
        self.A_y = A_y
        self.name = name

    def B(self, x, y, h=1e-6):
        """B = dA_y/dx - dA_x/dy, by central differences."""
        dAy_dx = (self.A_y(x + h, y) - self.A_y(x - h, y)) / (2 * h)
        dAx_dy = (self.A_x(x, y + h) - self.A_x(x, y - h)) / (2 * h)
        return dAy_dx - dAx_dy

    def _rhs(self, s, th):
        """q' = (cos th, sin th, A_x cos th + A_y sin th)."""
        x, y = s[:, 0], s[:, 1]
        c, sn = np.cos(th), np.sin(th)
        return np.stack([c, sn, self.A_x(x, y) * c + self.A_y(x, y) * sn], axis=1)

    def endpoints(self, q0, r, th0, omega, steps=400):
        """Integrate horizontal arcs of SR length r with curvature `omega` (RK4).

        `th0`, `omega` are (n,) arrays. Returns endpoints (n, 3).
        """
        n = th0.size
        s = np.tile(np.asarray(q0, dtype=float), (n, 1))
        dt = r / steps
        t = 0.0
        for _ in range(steps):
            k1 = self._rhs(s, th0 + omega * t)
            k2 = self._rhs(s + 0.5 * dt * k1, th0 + omega * (t + 0.5 * dt))
            k3 = self._rhs(s + 0.5 * dt * k2, th0 + omega * (t + 0.5 * dt))
            k4 = self._rhs(s + dt * k3, th0 + omega * (t + dt))
            s = s + (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)
            t += dt
        return s

    def reach(self, q0, radii, n_paths, rng, quantile=0.98, w_lo=0.3, w_hi=30.0):
        """Reach of the displacement, in coordinates graded-adapted at q0.

        Curvature is drawn as omega = w / r with w log-uniform in [w_lo, w_hi] and
        random sign, so the dimensionless turning w = omega*r spans the same wide band
        at every radius (the intrinsic dilation).

        **Gauge/adaptation.** For an OPEN path the flux z = int A.dl is gauge-dependent:
        if A(q0) != 0 then z ~ A(q0).dx picks up a *linear* term and the flux coordinate
        reads as weight 1. We therefore gauge-transform to the symmetric gauge at the
        base point, A -> A - A(q0), i.e. subtract the weight-1 leak
            z_adapted = dz - A_x(q0) dx - A_y(q0) dy.
        This is a diffeomorphism of (x,y,z) leaving B and the growth vector unchanged;
        it simply makes the ambient coordinates graded-adapted at q0, which is the
        standing assumption of the reach estimator (see src/growth.py).
        """
        q0 = np.asarray(q0, dtype=float)
        radii = np.asarray(radii, dtype=float)
        ax0 = float(self.A_x(q0[0], q0[1]))
        ay0 = float(self.A_y(q0[0], q0[1]))
        out = np.empty((radii.size, 3))
        for i, r in enumerate(radii):
            th0 = rng.uniform(0, 2 * np.pi, n_paths)
            w = 10.0 ** rng.uniform(np.log10(w_lo), np.log10(w_hi), n_paths)
            w *= rng.choice([-1.0, 1.0], n_paths)
            ends = self.endpoints(q0, float(r), th0, w / r)
            d = ends - q0
            d[:, 2] -= ax0 * d[:, 0] + ay0 * d[:, 1]      # symmetric gauge at q0
            out[i] = np.quantile(np.abs(d), quantile, axis=0)
        return out


# ---------------------------------------------------------------- example fields

def uniform_field(B0=1.0):
    """Symmetric gauge A = B0 * (-y/2, x/2). Frame == Heisenberg. B = B0 everywhere."""
    return MagneticContact(lambda x, y: -B0 * y / 2.0,
                           lambda x, y: B0 * x / 2.0,
                           name=f"uniform B={B0}")


def modulated_field(eps=0.5):
    """B = 1 + eps*sin(x)*sin(y) > 0 everywhere (for eps < 1): contact on full measure."""
    return MagneticContact(lambda x, y: 0.0 * x,
                           lambda x, y: x - eps * np.cos(x) * np.sin(y),
                           name=f"modulated B=1+{eps}sin x sin y")


def null_field():
    """B = x, vanishing on the line x = 0: a magnetic NULL set (Martinet stratum)."""
    return MagneticContact(lambda x, y: 0.0 * x,
                           lambda x, y: x ** 2 / 2.0,
                           name="B = x (null at x=0)")


def power_law_field(k):
    """Curvature vanishing to order k at the origin: B = x^k, A = (0, x^(k+1)/(k+1)).

    Tests the unifying law: holonomy accumulates as (path length)^(k+2), so the flux
    coordinate has weight k+2 and the homogeneous dimension is Q = k + 4 (in 2D).
    k=0 is the uniform field (contact, Q=4); k=1 is Martinet (Q=5).
    """
    kk = int(k)
    return MagneticContact(lambda x, y: 0.0 * x,
                           lambda x, y: x ** (kk + 1) / (kk + 1.0),
                           name=f"B = x^{kk}")
