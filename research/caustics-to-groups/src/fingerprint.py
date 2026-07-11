"""The three-component fingerprint and the group classifier (metrics M2, M5).

Combines the structure-specific observables (METHODS §3-§6) into a posterior /
label over the candidate list:

  1. growth vector (M1, growth.py) -> the tangent-cone class:
        (2,3) = {Heisenberg, SE(2)},  (2,3,4) = Engel,  (2,3,5) = Cartan.
  2. nilpotent deviation delta (M2) -> splits the shared-tangent-cone (2,3) class:
        Heisenberg is the flat model (delta = 0 at every scale); SE(2) deviates,
        its first-conjugate-time law departing from the nilpotent 2*pi/|w| as the
        momentum drops (curvature kappa != 0). Confirmed in docs/E1.
  3. abnormal stratum (M4) -> corroborates: absent for contact (Heisenberg, SE(2)),
        present for Engel/Cartan. For the candidate list this is implied by the
        growth vector; a data-driven abnormal test is deferred (lower-confidence
        leg), so here it is used only as a consistency flag, never a hard gate.

Leakage discipline: the generator (liegroup/caustics on the true structure) and
the estimator are separate. The deviation observable is a *noisy measurement* of
the conjugate-time law; measurement noise is added to the generated curve, and the
estimator recomputes delta from the noisy observation (it is not handed the truth).

Dependency-light: numpy + the repo's own modules.
"""
from __future__ import annotations

import numpy as np

import liegroup
import caustics
import growth

RADII = np.geomspace(0.15, 1.0, 6)          # M1 reach-scaling radii
W_GRID = np.geomspace(0.5, 4.0, 5)          # momenta for the deviation law
THETA = 0.3                                  # fixed launch angle for the delta leg


def deviation_curve(spec, theta=THETA):
    """True nilpotent-deviation curve 1 - t_c(w)*|w|/(2*pi) over W_GRID (generator).

    Heisenberg law is t_c = 2*pi/|w|, so its curve is ~0; SE(2) departs at low w.
    Computed once per group (deterministic); the per-realization noise is added
    later by `measure_deviation`.
    """
    dev = []
    for w in W_GRID:
        tch = 2.0 * np.pi / abs(w)
        tc = caustics.first_conjugate_time_contact(spec, theta, w, t_max=1.7 * tch,
                                                   n_scan=300)
        dev.append(np.nan if tc is None else 1.0 - tc / tch)
    return np.array(dev)


def measure_deviation(dev_curve, rng, t_noise):
    """Noisy scalar delta from the deviation curve: multiplicative measurement
    noise on the observed conjugate times, then averaged."""
    eps = t_noise * rng.standard_normal(dev_curve.shape)
    d_obs = 1.0 - (1.0 - dev_curve) * (1.0 + eps)   # t_c_obs = t_c*(1+eps)
    return float(np.nanmean(d_obs))


def classify(spec, rng, n_geo=400, noise=1e-2, t_noise=0.05, tau=0.05,
             dev_curves=None, m4_fallback=True):
    """Predict the group label for one noisy realization from `spec`.

    `dev_curves` maps (2,3)-group name -> its true deviation curve (cached
    generator output). `tau` is the Heisenberg/SE(2) decision threshold on delta.

    When the growth vector is unresolved (matches no candidate) and `m4_fallback`
    is on, fall back to the coarse abnormal bit (corank from the weight-1 count):
    corank >= 2 -> the non-contact coarse label "Engel/Cartan"; corank 1 ->
    "Heisenberg/SE(2)". This recovers the class where E2 showed M4 outlasts the
    full growth vector, instead of dropping to "unknown".
    """
    vec, _Q, w = growth.estimate_growth_vector(spec, RADII, n_geo, rng, noise)
    if vec == (2, 3):
        curve = dev_curves[spec.name]
        delta = measure_deviation(curve, rng, t_noise)
        return "Heisenberg" if delta < tau else "SE(2)"
    if vec == (2, 3, 4):
        return "Engel"
    if vec == (2, 3, 5):
        return "Cartan"
    if m4_fallback:
        rank = int((np.rint(w) <= 1).sum())
        return "Engel/Cartan" if (spec.dim - rank) >= 2 else "Heisenberg/SE(2)"
    return "unknown"


def cache_deviation_curves():
    """Deviation curves for the two (2,3) groups (the only ones needing delta)."""
    return {name: deviation_curve(liegroup.GROUPS[name])
            for name in ("Heisenberg", "SE(2)")}
