"""Standard coronal-null classification (Parnell, Smith, Neukirch & Priest 1996).

The baseline / ground-truth labeller the sub-Riemannian detector is validated against.
A 3D magnetic null (B=0) has Jacobian M = grad B with tr M = 0 (div B = 0). Its
eigenvalues (l1, l2, l3), summing to zero, classify it:

  - all three real           -> radial null   (X-type in the 2D fan projection)
  - one real, two conjugate  -> spiral null   (O-type in the 2D fan projection)

The spine is the eigenvector of the odd-sign-out (radial) or the unique real (spiral)
eigenvalue; the fan is the plane of the other two. The null's sign (+/-, historically
A/B) is the sign of the spine eigenvalue. The spine-parallel current J|| = (curl B).spine
rotates the fan; past a threshold it turns a radial null spiral.

Convention here: sign = sign(spine eigenvalue). label in {radial+, radial-, spiral+, spiral-}.

Dependency-light: numpy only.
"""
from __future__ import annotations

import numpy as np


def current_of_linear(M):
    """Current J = curl B for the linear field B = M r (spatially constant)."""
    M = np.asarray(M, float)
    return np.array([M[2, 1] - M[1, 2], M[0, 2] - M[2, 0], M[1, 0] - M[0, 1]])


def classify_null(M, imag_tol=1e-6):
    """Classify a null from its field Jacobian M = grad B. Returns a dict:
    eigs, type (radial/spiral), sign (+/-), label, spine_val, fan_vals, spine (unit vec),
    J_parallel. Uses only M -- this is the standard scheme and the ground-truth labeller.
    """
    M = np.asarray(M, float)
    w, V = np.linalg.eig(M)
    scale = np.abs(w).max() or 1.0
    is_real = np.abs(w.imag) <= imag_tol * scale
    spiral = int(is_real.sum()) < 3

    if spiral:
        ri = int(np.where(is_real)[0][0])          # the unique real eigenvalue = spine
        spine_val = float(w[ri].real)
        fan_vals = w[~is_real]
    else:
        wr = w.real
        signs = np.sign(wr)
        pos, neg = np.where(signs > 0)[0], np.where(signs < 0)[0]
        if len(pos) == 1:                          # spine = the odd-sign-out eigenvalue
            ri = int(pos[0])
        elif len(neg) == 1:
            ri = int(neg[0])
        else:                                      # a near-zero eigenvalue: spine = largest |.|
            ri = int(np.argmax(np.abs(wr)))
        spine_val = float(wr[ri])
        fan_vals = np.delete(wr, ri).astype(complex)

    spine = np.real(V[:, ri]).astype(float)
    spine /= np.linalg.norm(spine) or 1.0
    sign = "+" if spine_val > 0 else "-"
    Jpar = float(current_of_linear(M) @ spine)
    return {
        "eigs": w,
        "type": "spiral" if spiral else "radial",
        "sign": sign,
        "label": ("spiral" if spiral else "radial") + sign,
        "spine_val": spine_val,
        "fan_vals": fan_vals,
        "spine": spine,
        "J_parallel": Jpar,
    }


def _demo():
    # radial-: diag(1,1,-2), spine = the lone negative (-2)
    c = classify_null(np.diag([1.0, 1.0, -2.0]))
    assert c["type"] == "radial" and c["label"] == "radial-", c
    assert abs(c["J_parallel"]) < 1e-9                       # symmetric => no current
    # radial+: diag(-1,-1,2), spine = the lone positive (+2)
    assert classify_null(np.diag([-1.0, -1.0, 2.0]))["label"] == "radial+"
    # spiral-: rotating fan [[.2,-1],[1,.2]] (evals .2 +/- i), spine -0.4
    M = np.array([[0.2, -1.0, 0.0], [1.0, 0.2, 0.0], [0.0, 0.0, -0.4]])
    c = classify_null(M)
    assert c["type"] == "spiral" and c["label"] == "spiral-", c
    assert abs(c["J_parallel"] - 2.0) < 1e-9, c["J_parallel"]  # curl_z = M_yx - M_xy = 2
    # the real solar null eigenvalues -> radial+
    assert classify_null(np.diag([-0.763, -0.237, 1.0]))["label"] == "radial+"
    # radial->spiral threshold: fan [[0,-j],[j,0]] symmetric evals collide at j=0+, so any
    # j>0 with equal diagonal is spiral; unequal diagonal p,q stays radial while j<|p-q|/2.
    assert classify_null(np.array([[1., -0.3, 0], [0.3, -1., 0], [0, 0, 0.]]))["type"] == "radial"
    assert classify_null(np.array([[1., -1.2, 0], [1.2, -1., 0], [0, 0, 0.]]))["type"] == "spiral"
    print("nulltopo golden checks passed")


if __name__ == "__main__":
    _demo()
