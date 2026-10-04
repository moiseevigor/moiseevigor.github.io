"""Tangent-cone growth-vector estimator (metric M1) via geodesic spreading.

Ball-Box theorem: in coordinates graded-adapted at the base point, a coordinate
of homogeneous weight `w` reaches distance ~ `r^w` along geodesics of length `r`.
So the log-log slope of each coordinate's *reach* versus geodesic length recovers
its weight; the multiset of weights gives the growth vector

    n_k = #{ coords with weight <= k }      (cumulative),      Q = sum of weights.

This is the "local geodesic spreading / ball-volume growth" leg of the fingerprint
(METHODS §3). It fixes the tangent-cone *class* and therefore cannot separate
groups that share a tangent cone (Heisenberg vs. SE(2), both (2,3)); that split is
left to the conjugate-locus moduli (METHODS §4).

Why *reach* over a *wide* momentum range, not the spread of a fixed distribution:
a weight-2 coordinate behaves as `z = r^2 f(w r)`. With a fixed momentum law the
front at small r only samples `w r -> 0`, where `f` is linear, giving a spurious
extra power of r (measured ~2.8 instead of 2 for Heisenberg -- see docs/E0). The
true weight appears only when the momenta explore the coordinate's full range at
*every* radius, i.e. under the intrinsic anisotropic dilation. Sampling vertical
momenta log-uniformly across a wide band and taking a high quantile of |coord|
realises that: at each r some geodesic hits the peak of `f`, so reach ~ r^w.

Assumption (calibration): the ambient coordinates are graded-adapted at the base
point. True by construction for the nilpotent models and near the identity for the
curved groups; in the wild the data would first be put in SR-normal coordinates.

Dependency-light: numpy only.
"""
from __future__ import annotations

import numpy as np

import liegroup


def wide_covectors(spec, n, rng, w_lo=0.5, w_hi=60.0):
    """`n` covectors: unit horizontal part, vertical momenta log-uniform in
    magnitude over [w_lo, w_hi] with random sign (spanning the anisotropic
    dilation so every radius samples each coordinate's full reach)."""
    dim, nh = spec.dim, len(spec.horiz)
    cov = np.zeros((n, dim))
    hor = rng.standard_normal((n, nh))
    hor /= np.linalg.norm(hor, axis=1, keepdims=True)
    for j, a in enumerate(spec.horiz):
        cov[:, a] = hor[:, j]
    vert = [i for i in range(dim) if i not in spec.horiz]
    for i in vert:
        mag = 10.0 ** rng.uniform(np.log10(w_lo), np.log10(w_hi), n)
        cov[:, i] = mag * rng.choice([-1.0, 1.0], n)
    return cov


def coordinate_reach(spec, radii, n_geo, rng, noise=0.0, quantile=0.98):
    """Per-coordinate reach (high quantile of |coord|) at each radius.

    Returns array (len(radii), dim). One wide covector set is integrated over the
    whole radius grid; `noise` adds absolute Gaussian jitter to endpoints.
    """
    radii = np.asarray(radii, dtype=float)
    cov = wide_covectors(spec, n_geo, rng)
    ends = liegroup.geodesic_batch(spec, cov, radii)   # (n_geo, len(radii), dim)
    reach = np.empty((radii.size, spec.dim))
    for i in range(radii.size):
        pts = ends[:, i, :]
        if noise:
            pts = pts + noise * rng.standard_normal(pts.shape)
        reach[i] = np.quantile(np.abs(pts), quantile, axis=0)
    return reach


def _slope(reach_col, radii, eps=1e-12):
    logr = np.log(radii) - np.log(radii).mean()
    logs = np.log(np.maximum(reach_col, eps))
    logs = logs - logs.mean()
    return float((logr * logs).sum() / (logr ** 2).sum())


def estimate_weights(reach, radii, eps=1e-12, w_max=4.0):
    """Homogeneous weight of each coordinate via a noise-floor-aware reach fit.

    Models the measured reach as  m(r) = sqrt( (a r^w)^2 + b^2 ):  a clean power
    law contaminated by a constant floor b (absolute position noise). Fitting b
    explicitly lets the exponent w survive even when the small-radius, high-weight
    coordinates are swamped -- so the noise-robustness curve degrades gracefully
    instead of cliff-collapsing. Falls back to the plain log-log slope if the
    nonlinear fit fails. See docs/E0.
    """
    from scipy.optimize import curve_fit

    radii = np.asarray(radii, dtype=float)
    model = lambda r, a, w, b: np.sqrt((a * r ** w) ** 2 + b ** 2)
    out = np.empty(reach.shape[1])
    for i in range(reach.shape[1]):
        m = reach[:, i]
        w0 = max(0.5, _slope(m, radii, eps))
        a0 = max(m[-1] / radii[-1] ** w0, eps)
        b0 = max(m.min(), eps)
        try:
            popt, _ = curve_fit(model, radii, m, p0=[a0, w0, b0], maxfev=20000,
                                bounds=([0.0, 0.5, 0.0], [np.inf, w_max, np.inf]))
            out[i] = popt[1]
        except Exception:
            out[i] = w0
    return out


def growth_vector_from_weights(weights):
    """Round weights to positive integers and build (growth_vector, Q)."""
    w = np.maximum(1, np.rint(np.asarray(weights)).astype(int))
    steps = int(w.max())
    vector = tuple(int((w <= k).sum()) for k in range(1, steps + 1))
    return vector, int(w.sum())


def estimate_growth_vector(spec, radii, n_geo, rng, noise=0.0, quantile=0.98):
    """Full M1 estimate: (growth_vector, Q, weights) from geodesic reach scaling."""
    reach = coordinate_reach(spec, radii, n_geo, rng, noise, quantile)
    weights = estimate_weights(reach, radii)
    vector, Q = growth_vector_from_weights(weights)
    return vector, Q, weights


def estimate_corank_abnormal(spec, radii, n_geo, rng, noise=0.0, quantile=0.98):
    """Coarse abnormal-stratum leg (metric M4): corank of D and whether abnormal
    minimizers must exist.

    Uses only the *number of weight-1 coordinates* (the rank of D) and the ambient
    dimension of the data — a coarser question than the full growth vector, so it
    can survive noise that defeats the fine weight estimates. For a rank-2
    distribution, nontrivial abnormal extremals exist iff corank = dim - rank >= 2
    (contact 3D structures have none; Engel/Cartan do). Returns
    (corank, has_abnormal_bit).
    """
    reach = coordinate_reach(spec, radii, n_geo, rng, noise, quantile)
    weights = estimate_weights(reach, radii)
    rank = int((np.rint(weights) <= 1).sum())
    corank = spec.dim - rank
    return corank, bool(corank >= 2)
