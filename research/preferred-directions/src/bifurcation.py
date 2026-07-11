"""The magnetic fold (saddle-node) family: null pair <-> degenerate null (P4-S1).

    B_mu = (x z,  y z,  mu - z^2 + (x^2 + y^2)/2),      div B = z + z - 2z = 0.

mu > 0 : two point nulls at (0, 0, +/-sqrt(mu)) with Jacobians
         diag(z0, z0, -2 z0), z0 = +/-sqrt(mu) -- a RADIAL PAIR OF OPPOSITE SIGN,
         the canonical pair-creation topology.
mu = 0 : one isolated degenerate null at the origin, grad B = 0, |B| ~ r^2 (k = 2).
         The law Q = 3 + (k+2) predicts Q = 7 there -- its first 3D k=2 test.
mu < 0 : a null ring of radius sqrt(2|mu|) in z = 0 (the div-free fold's third face).

Exact vector potential (curl A = B, verified in _demo):

    A = (y z^2 / 2,  -x z^2 / 2 + mu x + x^3/6 + x y^2 / 2,  0).

Dependency-light: numpy; mfield3d from the same src dir.
"""
from __future__ import annotations

import numpy as np

import mfield3d as m3


def fold_field(mu):
    """B_mu as a callable P (n,3) -> (n,3)."""
    def B(P):
        P = np.atleast_2d(np.asarray(P, float))
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        return np.stack([x * z, y * z, mu - z ** 2 + (x ** 2 + y ** 2) / 2], 1)
    return B


def fold_structure(mu, name=None):
    """The SR magnetic structure of B_mu (exact A)."""
    def A(P):
        P = np.atleast_2d(np.asarray(P, float))
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        return np.stack([y * z ** 2 / 2,
                         -x * z ** 2 / 2 + mu * x + x ** 3 / 6 + x * y ** 2 / 2,
                         np.zeros(len(P))], 1)
    return m3.MagneticStructure3D(A, name or f"fold(mu={mu:g})")


def flux_exponent_curve(struct, q0, radii, n, rng, pairs=4):
    """Local flux-reach exponent w4(r): d log(reach_4) / d log(r) by centered pairs.

    Measures the flux coordinate's reach at radii r*(1 +/- eps_pair) and returns the
    per-radius log-slope -- the scale-resolved version of the growth-vector weight.
    """
    q0 = np.asarray(q0, float)
    A0, S = struct.gauge_terms(q0[:3])                  # full first-order gauge fix
    out = np.empty(len(radii))
    f = 1.25                                            # half-decade pair spacing
    for i, r in enumerate(radii):
        reach = []
        for rr in (r / f, r * f):
            ends = struct._horizontal_curves(q0, float(rr), n, rng)
            d = ends - q0
            d[:, 3] -= d[:, :3] @ A0 + 0.5 * np.einsum("ni,ij,nj->n",
                                                       d[:, :3], S, d[:, :3])
            reach.append(np.quantile(np.abs(d[:, 3]), 0.98))
        out[i] = np.log(reach[1] / reach[0]) / np.log(f ** 2)
    return out


def _demo():
    rng = np.random.default_rng(0)
    P = rng.uniform(-0.7, 0.7, (40, 3))
    for mu in (0.0, 0.09, -0.08):
        st, Bf = fold_structure(mu), fold_field(mu)
        assert np.allclose(st.B(P), Bf(P), atol=1e-4), f"curl A != B at mu={mu}"
    # pair positions and signs (mu > 0)
    mu = 0.09
    Bf = fold_field(mu)
    for z0 in (np.sqrt(mu), -np.sqrt(mu)):
        assert np.linalg.norm(Bf([[0, 0, z0]])[0]) < 1e-12
        J = np.diag([z0, z0, -2 * z0])                  # analytic Jacobian
        h = 1e-6
        Jn = np.stack([(Bf([[h, 0, z0]])[0] - Bf([[-h, 0, z0]])[0]) / (2 * h),
                       (Bf([[0, h, z0]])[0] - Bf([[0, -h, z0]])[0]) / (2 * h),
                       (Bf([[0, 0, z0 + h]])[0] - Bf([[0, 0, z0 - h]])[0]) / (2 * h)], 1)
        assert np.allclose(Jn, J, atol=1e-5)
    # degenerate point: isolated, |B| ~ r^2
    Bf0 = fold_field(0.0)
    r = np.array([1e-2, 1e-3])
    v = np.array([0.4, 0.5, 0.77]); v /= np.linalg.norm(v)
    mag = [np.linalg.norm(Bf0([(ri * v).tolist()])[0]) for ri in r]
    slope = np.log(mag[0] / mag[1]) / np.log(r[0] / r[1])
    assert abs(slope - 2) < 1e-3, slope                 # quadratic vanishing (k = 2)
    print("bifurcation golden checks passed (curl A = B; pair signs; k = 2 at fold)")


if __name__ == "__main__":
    _demo()
