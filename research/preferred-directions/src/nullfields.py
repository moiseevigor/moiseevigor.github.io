"""Synthetic magnetic nulls with KNOWN ground-truth type, to validate the SR detector.

`linear_null(p, q, j, rot)`  --  an exact linear null B = M(r-r0) whose type is set by
construction: the fan block [[p,-j],[j,q]] with spine eigenvalue s = -(p+q). The fan
eigenvalues are (p+q)/2 +/- sqrt(((p-q)/2)^2 - j^2): real (radial) while |j| < |p-q|/2,
complex (spiral) beyond. A matching vector potential with curl A = B is built in closed
form, so the SR growth-vector detector runs on a genuine structure, not a fit:

    A0 = ((j x + q y) z,  (-p x + j y) z,  0)   =>   curl A0 = (p x - j y, j x + q y, s z).

An optional rotation R carries the block to a generic frame (B, A both conjugated by R),
so the classifier cannot cheat on axis alignment.

`charge_field(charges)` -- potential field of point 'magnetic charges' (curl-free); its
nulls are realistic and generically radial, a stand-in for extrapolated coronal fields.

Dependency-light: numpy; imports mfield3d + nulltopo from the same src dir.
"""
from __future__ import annotations

import numpy as np

import mfield3d as m3
import nulltopo


def rot_from_axis_angle(axis, angle):
    axis = np.asarray(axis, float)
    axis = axis / np.linalg.norm(axis)
    K = np.array([[0, -axis[2], axis[1]],
                  [axis[2], 0, -axis[0]],
                  [-axis[1], axis[0], 0]])
    return np.eye(3) + np.sin(angle) * K + (1 - np.cos(angle)) * (K @ K)


def linear_null(p, q, j, rot=None, r0=(0.0, 0.0, 0.0), name=None):
    """Exact linear null of controllable type. Returns dict: struct (MagneticStructure3D),
    A, M (Jacobian in the working frame), cls (ground-truth classification), params."""
    s = -(p + q)
    M0 = np.array([[p, -j, 0.0], [j, q, 0.0], [0.0, 0.0, s]])
    R = np.eye(3) if rot is None else np.asarray(rot, float)
    M = R @ M0 @ R.T
    r0 = np.asarray(r0, float)

    def A(P):
        P = np.atleast_2d(np.asarray(P, float)) - r0
        Ql = P @ R                                    # rows = R^T (P - r0): into block frame
        x, y, z = Ql[:, 0], Ql[:, 1], Ql[:, 2]
        A0 = np.stack([(j * x + q * y) * z, (-p * x + j * y) * z, np.zeros(len(Ql))], 1)
        return A0 @ R.T                               # rotate back to the working frame

    cls = nulltopo.classify_null(M0)                  # type is frame-independent
    struct = m3.MagneticStructure3D(A, name or f"null[{cls['label']}]")
    return {"struct": struct, "A": A, "M": M, "cls": cls, "params": (p, q, j)}


def null_from_eigs(l1, l2, l3, rot=None, name=None):
    """A radial null whose fan eigenvalues are (l1, l2) and spine is l3 = -(l1+l2)."""
    assert abs(l1 + l2 + l3) < 1e-6, "eigenvalues must be traceless (div B = 0)"
    return linear_null(l1, l2, 0.0, rot=rot, name=name)


def charge_field(charges):
    """B(P) = sum q_i (P - r_i)/|P - r_i|^3. charges: list of (q, (x,y,z)). Curl-free."""
    ch = [(float(q), np.asarray(r, float)) for q, r in charges]

    def B(P):
        P = np.atleast_2d(np.asarray(P, float))
        out = np.zeros((len(P), 3))
        for q, r in ch:
            d = P - r
            rr = np.maximum(np.linalg.norm(d, axis=1, keepdims=True), 1e-9)
            out += q * d / rr ** 3
        return out
    return B


def _demo():
    # standard classifier recovers the constructed type
    assert linear_null(-1.0, -1.0, 0.0)["cls"]["label"] == "radial+"
    assert linear_null(1.0, 1.0, 0.0)["cls"]["label"] == "radial-"
    assert linear_null(-0.5, -0.5, 1.2)["cls"]["label"] == "spiral+"
    assert linear_null(0.5, 0.5, 1.2)["cls"]["label"] == "spiral-"
    # the built A really has curl A = B = M r (block frame and rotated)
    P = np.array([[0.11, -0.07, 0.05]])
    for rot in (None, rot_from_axis_angle([1, 1, 0.3], 0.7)):
        d = linear_null(1.0, 0.4, 0.15, rot=rot)
        assert np.allclose(d["struct"].B(P)[0], d["M"] @ P[0], atol=1e-3)
    # radial->spiral threshold at |j| = |p-q|/2 (here p-q = 0.6 -> 0.3)
    assert linear_null(0.8, 0.2, 0.25)["cls"]["type"] == "radial"
    assert linear_null(0.8, 0.2, 0.35)["cls"]["type"] == "spiral"
    print("nullfields golden checks passed")


if __name__ == "__main__":
    _demo()
