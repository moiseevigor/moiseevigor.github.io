"""Generic left-invariant sub-Riemannian normal-geodesic engine (vectorized).

One integrator for every candidate group. A group is a `GroupSpec`: an ambient
dimension, a left-invariant frame `X_1..X_n` (as columns of `frame(q)`, batched),
the structure constants `C[i,j,k]` with `[X_i, X_j] = sum_k C[i,j,k] X_k`, and the
horizontal index set (which `X_i` span the distribution `D`).

Normal geodesics follow the Pontryagin/Lie-Poisson flow of `H = 1/2 sum_{a in
horiz} h_a^2`:

    q'   = sum_{a in horiz} h_a X_a(q)
    h_i' = sum_{a in horiz} sum_k C[a,i,k] h_a h_k          (Lie-Poisson)

integrated with fixed-step RK4, vectorized over a batch of covectors (the front).
This "fall back to ODE integration" path covers the curved groups (SE(2), SE(3))
whose closed forms need elliptic functions; it is validated against the
Heisenberg closed form in scripts/smoke_test.py.

Dependency-light: numpy only.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

import numpy as np


@dataclass(frozen=True)
class GroupSpec:
    name: str
    dim: int
    frame: Callable[[np.ndarray], np.ndarray]  # q (...,dim) -> (...,dim,dim), col i = X_i
    C: np.ndarray                              # (dim, dim, dim)
    horiz: tuple
    growth_vector: tuple
    Q: int
    has_abnormal: bool
    coord_weights: tuple


def _rhs_batch(spec: GroupSpec, s: np.ndarray) -> np.ndarray:
    dim = spec.dim
    q, h = s[:, :dim], s[:, dim:]
    X = spec.frame(q)                                   # (n, dim, dim)
    qdot = np.zeros_like(q)
    hdot = np.zeros_like(h)
    for a in spec.horiz:
        qdot += h[:, a:a + 1] * X[:, :, a]
        hdot += h[:, a:a + 1] * (h @ spec.C[a].T)
    return np.concatenate([qdot, hdot], axis=1)


def geodesic_batch(spec: GroupSpec, cov: np.ndarray, times, steps_per_unit=120):
    """Integrate a batch of normal geodesics from the identity.

    `cov` is (n, dim) initial covectors; `times` an increasing 1-D array. Returns
    positions of shape (n, len(times), dim).
    """
    cov = np.atleast_2d(np.asarray(cov, dtype=float))
    times = np.asarray(times, dtype=float)
    n = cov.shape[0]
    s = np.concatenate([np.zeros((n, spec.dim)), cov], axis=1)
    out = np.empty((n, times.size, spec.dim))
    t_prev = 0.0
    for idx, t_target in enumerate(times):
        span = t_target - t_prev
        m = max(1, int(np.ceil(abs(span) * steps_per_unit)))
        dt = span / m
        for _ in range(m):
            k1 = _rhs_batch(spec, s)
            k2 = _rhs_batch(spec, s + 0.5 * dt * k1)
            k3 = _rhs_batch(spec, s + 0.5 * dt * k2)
            k4 = _rhs_batch(spec, s + dt * k3)
            s = s + (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)
        out[:, idx, :] = s[:, :spec.dim]
        t_prev = t_target
    return out


def normal_geodesic(spec: GroupSpec, cov0, t, **kw):
    """Single geodesic. `t` scalar or array; returns (positions, covectors_final)."""
    scalar = np.isscalar(t) or np.ndim(t) == 0
    times = np.array([float(t)]) if scalar else np.asarray(t, dtype=float)
    pos = geodesic_batch(spec, np.asarray(cov0, dtype=float)[None, :], times, **kw)[0]
    # covector at final time: re-run cheaply is overkill; return positions + None-like
    if scalar:
        return pos[0], None
    return pos, None


def exp_map(spec: GroupSpec, cov0, t, **kw) -> np.ndarray:
    """Endpoint exp_e(cov0) at time t (scalar)."""
    return geodesic_batch(spec, np.asarray(cov0, dtype=float)[None, :],
                          np.array([float(t)]), **kw)[0, 0]


# ----------------------------------------------------------------------------
# Candidate-group specifications (batched frames: q (...,dim) -> (...,dim,dim))
# ----------------------------------------------------------------------------

def _heisenberg() -> GroupSpec:
    def frame(q):
        q = np.asarray(q, dtype=float)
        x, y = q[..., 0], q[..., 1]
        X = np.zeros(q.shape[:-1] + (3, 3))
        X[..., 0, 0] = 1.0
        X[..., 1, 1] = 1.0
        X[..., 2, 0] = -y / 2
        X[..., 2, 1] = x / 2
        X[..., 2, 2] = 1.0
        return X
    C = np.zeros((3, 3, 3))
    C[0, 1, 2] = 1.0
    C[1, 0, 2] = -1.0
    return GroupSpec("Heisenberg", 3, frame, C, (0, 1), (2, 3), 4, False, (1, 1, 2))


def _se2() -> GroupSpec:
    def frame(q):
        q = np.asarray(q, dtype=float)
        th = q[..., 2]
        c, s = np.cos(th), np.sin(th)
        X = np.zeros(q.shape[:-1] + (3, 3))
        X[..., 0, 0] = c
        X[..., 1, 0] = s
        X[..., 2, 1] = 1.0
        X[..., 0, 2] = s
        X[..., 1, 2] = -c
        return X
    C = np.zeros((3, 3, 3))
    C[0, 1, 2] = 1.0
    C[1, 0, 2] = -1.0
    C[1, 2, 0] = 1.0
    C[2, 1, 0] = -1.0
    return GroupSpec("SE(2)", 3, frame, C, (0, 1), (2, 3), 4, False, (1, 2, 1))


def _engel() -> GroupSpec:
    def frame(q):
        q = np.asarray(q, dtype=float)
        x1 = q[..., 0]
        X = np.zeros(q.shape[:-1] + (4, 4))
        X[..., 0, 0] = 1.0
        X[..., 1, 1] = 1.0
        X[..., 2, 1] = x1
        X[..., 3, 1] = x1 * x1 / 2
        X[..., 2, 2] = 1.0
        X[..., 3, 2] = x1
        X[..., 3, 3] = 1.0
        return X
    C = np.zeros((4, 4, 4))
    C[0, 1, 2] = 1.0
    C[1, 0, 2] = -1.0
    C[0, 2, 3] = 1.0
    C[2, 0, 3] = -1.0
    return GroupSpec("Engel", 4, frame, C, (0, 1), (2, 3, 4), 7, True, (1, 1, 2, 3))


def _cartan() -> GroupSpec:
    # Free nilpotent rank-2 step-3 group (2,3,5). Faithful vector-field model with
    # [X1,X2]=X3, [X1,X3]=X4, [X2,X3]=X5 (all higher brackets zero).
    def frame(q):
        q = np.asarray(q, dtype=float)
        x1, x3 = q[..., 0], q[..., 2]
        X = np.zeros(q.shape[:-1] + (5, 5))
        X[..., 0, 0] = 1.0
        X[..., 1, 1] = 1.0
        X[..., 2, 1] = x1
        X[..., 3, 1] = x1 * x1 / 2
        X[..., 4, 1] = -x3
        X[..., 2, 2] = 1.0
        X[..., 3, 2] = x1
        X[..., 3, 3] = 1.0
        X[..., 4, 4] = 1.0
        return X
    C = np.zeros((5, 5, 5))
    C[0, 1, 2] = 1.0; C[1, 0, 2] = -1.0
    C[0, 2, 3] = 1.0; C[2, 0, 3] = -1.0
    C[1, 2, 4] = 1.0; C[2, 1, 4] = -1.0
    return GroupSpec("Cartan", 5, frame, C, (0, 1), (2, 3, 5), 10, True, (1, 1, 2, 3, 3))


def _se3_cone() -> GroupSpec:
    # Tangent cone of the SE(3) fibre-tracking structure (Duits et al.): the rank-3
    # distribution {forward, two axis-rotations} on SE(3) has growth (3,6) (its three
    # brackets fill all six dimensions: roll + two sideways translations). Its
    # nilpotentisation is the free 2-step group on 3 generators, realised here with a
    # Heisenberg-style polynomial frame. This is exactly what M1 recovers for SE(3);
    # the curved SE(3) (Euler-angle frame, elliptic geodesics) is the real-data step.
    def frame(q):
        q = np.asarray(q, dtype=float)
        x1, x2, x3 = q[..., 0], q[..., 1], q[..., 2]
        X = np.zeros(q.shape[:-1] + (6, 6))
        X[..., 0, 0] = 1.0; X[..., 3, 0] = -x2 / 2; X[..., 4, 0] = -x3 / 2
        X[..., 1, 1] = 1.0; X[..., 3, 1] = x1 / 2;  X[..., 5, 1] = -x3 / 2
        X[..., 2, 2] = 1.0; X[..., 4, 2] = x1 / 2;  X[..., 5, 2] = x2 / 2
        X[..., 3, 3] = 1.0
        X[..., 4, 4] = 1.0
        X[..., 5, 5] = 1.0
        return X
    C = np.zeros((6, 6, 6))
    C[0, 1, 3] = 1.0; C[1, 0, 3] = -1.0     # [X1,X2]=X4
    C[0, 2, 4] = 1.0; C[2, 0, 4] = -1.0     # [X1,X3]=X5
    C[1, 2, 5] = 1.0; C[2, 1, 5] = -1.0     # [X2,X3]=X6
    return GroupSpec("SE(3)-cone", 6, frame, C, (0, 1, 2), (3, 6), 9, True,
                     (1, 1, 1, 2, 2, 2))


GROUPS = {g.name: g for g in (_heisenberg(), _se2(), _engel(), _cartan(), _se3_cone())}


def bracket_finite_diff(spec, i, j, q, h=1e-5):
    """Numerical [X_i, X_j](q) from the frame, for validating structure constants.

    A guard against invalid specs: the frame's actual brackets must equal
    sum_k C[i,j,k] X_k. (Learned the hard way — a frame whose real brackets
    disagree with C is not the geodesic flow of any SR structure.)
    """
    e = np.eye(spec.dim)
    def col(qq, k):
        return spec.frame(qq)[:, k]
    def jac(k):
        return np.column_stack([(col(q + h * e[a], k) - col(q - h * e[a], k)) / (2 * h)
                                for a in range(spec.dim)])
    return jac(j) @ col(q, i) - jac(i) @ col(q, j)


def structure_constants_consistent(spec, q, atol=1e-4):
    """True iff every finite-difference bracket matches C at point q."""
    for i in range(spec.dim):
        for j in range(spec.dim):
            brk = bracket_finite_diff(spec, i, j, q)
            exp = sum(spec.C[i, j, k] * spec.frame(q)[:, k] for k in range(spec.dim))
            if not np.allclose(brk, exp, atol=atol):
                return False
    return True

