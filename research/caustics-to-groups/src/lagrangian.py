"""Lagrangian-map machinery for the astrophysics phase (experiment E5).

The sub-Riemannian estimators elsewhere in this repo consume a *structure* (a frame
plus structure constants) and shoot geodesics from it. This module instead consumes a
**map** — the Zel'dovich/Lagrangian map of gravitational structure formation, or any
explicit test map — and measures the exponents with which the image of a small ball
extends along a fixed frame. Those exponents are the analogue of the graded weights
of `growth.py`, and their sum is an analogue of the homogeneous dimension Q.

Why this matters. Gravitational structure formation is a *deterministic flow*, not a
*control system*: a dark-matter particle may move in any direction, so there is no
distribution of allowed directions and hence no growth vector. The natural question
one can still ask of a map is how a small Lagrangian ball is stretched — and that is
what this module measures. The E5 experiment uses it to show:

  * at a generic (regular) point of the Zel'dovich map, all exponents are 1, so
    "Q" = n = 3 -- no sub-Riemannian structure, as expected;
  * at a **fold caustic** (where an eigenvalue of I - D*T vanishes) one exponent
    becomes 2 and "Q" = 4 -- numerically identical to the Heisenberg group, though
    the mechanism is a Lagrangian catastrophe, not a bracket-generating distribution.

That coincidence is the ADE-universality trap appearing at the level of the growth
vector, and it refutes the naive criterion "Q > n implies sub-Riemannian". The
corrected criterion is measure-theoretic: genuine SR structure has Q > n on a set of
*full measure*; a Lagrangian fold has Q > n only on a codimension-1 caustic (a null
set).

Dependency-light: numpy only.
"""
from __future__ import annotations

import numpy as np


class ZeldovichFlow:
    """Zel'dovich map x(q) = q - D grad(Phi)(q) for an analytic Gaussian potential.

    Phi is a random superposition of Fourier modes with a LCDM-like potential
    amplitude (~ k^-2), so grad and the deformation tensor Hess(Phi) are exact at any
    q -- no grid interpolation, and the fold locations are computable in closed form.
    """

    def __init__(self, n_modes=10, seed=0, amp=0.05, kmax=2):
        rng = np.random.default_rng(seed)
        ks = []
        while len(ks) < n_modes:
            k = rng.integers(-kmax, kmax + 1, size=3)
            if np.any(k != 0):
                ks.append(k)
        self.k = np.asarray(ks, dtype=float)              # (m, 3)
        kn = np.linalg.norm(self.k, axis=1)
        self.a = amp * rng.standard_normal(n_modes) / kn ** 2   # potential ~ k^-2
        self.phase = rng.uniform(0, 2 * np.pi, n_modes)

    def _arg(self, q):
        return np.asarray(q, dtype=float) @ self.k.T + self.phase   # (..., m)

    def grad(self, q):
        """grad Phi = sum_m a_m k_m cos(k_m . q + phase_m)  -> (..., 3)"""
        c = np.cos(self._arg(q))                                     # (..., m)
        return (c * self.a) @ self.k

    def hess(self, q):
        """Deformation tensor T_ij = d2 Phi / dq_i dq_j -> (..., 3, 3)"""
        s = np.sin(self._arg(q))                                     # (..., m)
        w = -(s * self.a)                                            # (..., m)
        # sum_m w_m * (k_m outer k_m)
        return np.einsum("...m,mi,mj->...ij", w, self.k, self.k)

    def map(self, q, D):
        """The Zel'dovich map at growth factor D."""
        return np.asarray(q, dtype=float) - D * self.grad(q)

    def fold_growth_factor(self, q0):
        """Growth factor D at which q0 first becomes a fold: D = 1 / lambda_max."""
        lam = np.linalg.eigvalsh(self.hess(q0))
        lmax = lam.max()
        if lmax <= 0:
            return np.inf
        return 1.0 / lmax


def eigenframe(flow, q0):
    """Eigenvalues and eigenvectors (columns) of the deformation tensor at q0."""
    lam, E = np.linalg.eigh(flow.hess(q0))
    return lam, E


def image_reach(map_fn, q0, frame, radii, n_samples, rng, quantile=0.98):
    """Reach of the image of a Lagrangian ball, along each column of `frame`.

    For each radius r: sample `n_samples` points uniformly in the ball of radius r
    about q0, map them, subtract the image of q0, project onto `frame`, and take a
    high quantile of |projection| per direction. Returns (len(radii), 3).
    """
    q0 = np.asarray(q0, dtype=float)
    radii = np.asarray(radii, dtype=float)
    x0 = np.asarray(map_fn(q0), dtype=float)
    reach = np.empty((radii.size, 3))
    for i, r in enumerate(radii):
        u = rng.standard_normal((n_samples, 3))
        u /= np.linalg.norm(u, axis=1, keepdims=True)
        s = rng.random(n_samples) ** (1.0 / 3.0)          # uniform in the ball
        q = q0 + r * u * s[:, None]
        d = np.asarray(map_fn(q), dtype=float) - x0
        c = d @ frame                                     # project onto frame columns
        reach[i] = np.quantile(np.abs(c), quantile, axis=0)
    return reach


# ---------------------------------------------------------------- test maps

def linear_map(A):
    """Regular (invertible) linear map: every exponent should be 1."""
    A = np.asarray(A, dtype=float)
    return lambda q: np.asarray(q, dtype=float) @ A.T


def _power_in_first_coord(q, p):
    a = np.asarray(q, dtype=float)
    single = (a.ndim == 1)
    Q = np.atleast_2d(a)
    out = Q.copy()
    out[:, 0] = Q[:, 0] ** p
    return out[0] if single else out


def fold_map(q):
    """Exact fold (A2): x1 = q1^2. Exponent 2 in the degenerate direction -> 'Q' = 4."""
    return _power_in_first_coord(q, 2)


def cusp_map(q):
    """Exact cusp-like degeneracy: x1 = q1^3. Exponent 3 in the degenerate direction."""
    return _power_in_first_coord(q, 3)
