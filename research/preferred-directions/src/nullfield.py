"""A divergence-free field with a lattice of mixed-type 3D nulls, and a standard
eigenvalue null-finder to validate the sub-Riemannian growth-vector detector against.

The ABC field (Arnold-Beltrami-Childress), a canonical divergence-free MHD/dynamo flow:

    A = (sin z, sin x, sin y)   =>   B = curl A = (cos y, cos z, cos x).

B is div-free by construction, and its nulls are the lattice
    x, y, z in { pi/2 + m pi } ,
i.e. 8 isolated 3D nulls in [0, 2 pi)^3. At each, grad B has the cyclic form and is
nondegenerate (a linear null, k = 1); the eigenvalue *type* alternates between
spiral (a complex-conjugate pair) and radial (all real) across the lattice.

This module provides:
  * the ABC MagneticStructure3D (for the SR growth-vector detector, src/mfield3d.py);
  * analytic B and grad B;
  * `find_nulls` -- Newton's method from grid seeds (the standard null-*locator*);
  * `classify` -- eigenvalues of grad B (the standard null-*typer*: radial / spiral,
    positive / negative).

The SR detector and this eigenvalue finder are independent computations. E6-style
external validation: do the growth-vector's Q = 6 points coincide with the nulls this
finder locates? (Location + order.) And, honestly, does the growth vector distinguish
the types this finder assigns? (It does not -- that is in the eigenvalues.)

Dependency-light: numpy only.
"""
from __future__ import annotations

import numpy as np

import mfield3d as m3


def abc_structure():
    """The ABC magnetic structure, for the SR growth-vector detector."""
    def A(P):
        P = np.atleast_2d(np.asarray(P, float))
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        return np.stack([np.sin(z), np.sin(x), np.sin(y)], axis=1)
    return m3.MagneticStructure3D(A, "ABC: B=(cos y, cos z, cos x)")


def B(P):
    """Analytic ABC field B = (cos y, cos z, cos x)."""
    P = np.atleast_2d(np.asarray(P, float))
    x, y, z = P[:, 0], P[:, 1], P[:, 2]
    return np.stack([np.cos(y), np.cos(z), np.cos(x)], axis=1)


def grad_B(p):
    """Analytic Jacobian dB_i/dx_j at a single point (3,3)."""
    x, y, z = np.asarray(p, float)
    return np.array([[0.0, -np.sin(y), 0.0],
                     [0.0, 0.0, -np.sin(z)],
                     [-np.sin(x), 0.0, 0.0]])


def find_nulls(seeds, tol=1e-10, max_iter=50, box=2 * np.pi):
    """Newton's method (r <- r - grad_B^{-1} B) from each seed; dedupe within the box.

    Returns an (m, 3) array of distinct nulls in [0, box)^3.
    """
    found = []
    for s in seeds:
        r = np.array(s, dtype=float)
        for _ in range(max_iter):
            b = B(r[None, :])[0]
            if np.linalg.norm(b) < tol:
                break
            J = grad_B(r)
            try:
                r = r - np.linalg.solve(J, b)
            except np.linalg.LinAlgError:
                break
        if np.linalg.norm(B(r[None, :])[0]) < 1e-7:
            r = np.mod(r, box)
            if not any(np.linalg.norm((r - f + box / 2) % box - box / 2) < 1e-4
                       for f in found):
                found.append(r)
    return np.array(found) if found else np.zeros((0, 3))


def classify(p):
    """Standard null classification from the eigenvalues of grad B at p."""
    ev = np.linalg.eigvals(grad_B(p))
    n_complex = int(np.sum(np.abs(ev.imag) > 1e-8))
    kind = "spiral" if n_complex >= 2 else "radial"
    sign = "positive" if float(np.sum(ev.real)) < 0 else "negative"  # trace(gradB)=0;
    # sign by the lone real eigenvalue's sign (fan-in vs fan-out along the spine)
    real_evs = ev.real[np.abs(ev.imag) < 1e-8]
    spine = float(real_evs[np.argmax(np.abs(real_evs))]) if real_evs.size else 0.0
    return {"eigs": [complex(e) for e in ev], "type": kind,
            "spine_sign": "A" if spine > 0 else "B",
            "spine": spine}
