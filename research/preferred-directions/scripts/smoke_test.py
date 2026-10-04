#!/usr/bin/env python3
"""Self-checks for the preferred-directions program. Fails loudly if the core breaks.

Anchored facts (each checkable independently of this code):
  * uniform B: the magnetic contact structure IS Heisenberg, t_c = 2*pi/(B0|w|);
  * the conjugate time is gauge-invariant (a gauge change is a target diffeomorphism,
    and a diffeomorphism cannot move where a Jacobian drops rank);
  * uniform B => delta = 0 (the structure is its own tangent cone);
  * the dilation theorem: delta depends on (g,w) only through eps = g/(B0|w|);
  * P1's law: delta = -eps^2 + O(eps^4), leading coefficient 1;
  * E9's law (sibling toolkit): Q = d + k + 2.
"""
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))  # shared core

import mfield as mf  # noqa: E402
import magnetic as magf  # noqa: E402
import growth  # noqa: E402

TWO_PI = 2.0 * np.pi

# --- uniform B reproduces the Heisenberg conjugate time
for B0, w in [(1.0, 1.0), (1.0, 2.0), (2.0, 1.0), (1.0, 8.0)]:
    t_nil = TWO_PI / (B0 * abs(w))
    tc = mf.exp_gradient_field(B0, 0.0).conjugate_times(
        [0, 0, 0], np.array([0.3]), w, 1.6 * t_nil, n_scan=1500)
    assert abs(tc[0] - t_nil) / t_nil < 1e-6, f"uniform t_c off: {tc[0]} vs {t_nil}"

# --- the conjugate time is gauge-invariant
sym = mf.MagneticStructure(lambda x, y: -0.5 * np.asarray(y, float),
                           lambda x, y: 0.5 * np.asarray(x, float),
                           lambda x, y: np.ones_like(np.asarray(x, float)), "symmetric")
lan = mf.exp_gradient_field(1.0, 0.0)                     # Landau gauge A = (0, x)
t_sym = sym.conjugate_times([0, 0, 0], np.array([0.3]), 1.0, 1.6 * TWO_PI, n_scan=1500)[0]
t_lan = lan.conjugate_times([0, 0, 0], np.array([0.3]), 1.0, 1.6 * TWO_PI, n_scan=1500)[0]
assert abs(t_sym - t_lan) < 1e-7, f"conjugate time is gauge-dependent: {t_sym} vs {t_lan}"

# --- uniform B => delta at the numerical floor
d, _, _ = mf.exp_gradient_field(1.0, 0.0).delta([0, 0, 0], 4.0, n_theta=8, n_scan=1500)
assert abs(d) < 1e-7, f"uniform field must give delta ~ 0, got {d:.2e}"

# --- dilation theorem: same eps from different (g, w) gives the same delta
d1, _, _ = mf.exp_gradient_field(1.0, 0.1).delta([0, 0, 0], 4.0, n_theta=8, n_scan=1500)
d2, _, _ = mf.exp_gradient_field(1.0, 0.2).delta([0, 0, 0], 8.0, n_theta=8, n_scan=1500)
assert abs(d1 - d2) / abs(d1) < 1e-3, "dilation theorem violated (eps=0.025 both)"

# --- P1's law: delta = -eps^2 at small eps, leading coefficient 1
eps = 0.00625
d, _, _ = mf.exp_gradient_field(1.0, 0.05).delta([0, 0, 0], 8.0, n_theta=8, n_scan=2000)
assert d < 0, "a field gradient must DELAY refocusing (delta < 0)"
assert abs(abs(d) / eps ** 2 - 1.0) < 0.01, f"|delta|/eps^2 = {abs(d)/eps**2:.4f} != 1"

# --- E9's law from the shared toolkit: Q = d + k + 2  (d = 2)
_rad = np.geomspace(0.03, 0.30, 7)
for _k in [0, 2]:
    _w = growth.estimate_weights(
        magf.power_law_field(_k).reach([0.0, 0.0, 0.0], _rad, 1200,
                                       np.random.default_rng(3)), _rad, w_max=8.0)
    assert int(np.rint(_w).sum()) == _k + 4, f"Q != k+4 for k={_k}"

# --- P2: the 3D law Q = k+5, and the null jump 5 -> 6
import mfield3d as m3  # noqa: E402
_rad3 = np.geomspace(0.02, 0.20, 7)
_, _Q = m3.uniform3d(1.0).weights_Q([0, 0, 0, 0], _rad3, 2500, np.random.default_rng(4))
assert _Q == 5, f"uniform 3D field should give Q=5, got {_Q}"
_nul = m3.linear_null()
assert abs(_nul.B([[0, 0, 0]])[0]).max() < 1e-9, "linear_null must vanish at origin"
_, _Q5 = _nul.weights_Q([0.7, 0.3, -0.4, 0], _rad3, 2500, np.random.default_rng(5))
_, _Q6 = _nul.weights_Q([0, 0, 0, 0], _rad3, 4000, np.random.default_rng(6))
assert _Q5 == 5 and _Q6 == 6, f"null field: generic Q={_Q5} (want 5), at-null Q={_Q6} (want 6)"

# --- P2 external validation: SR null detection vs the eigenvalue finder (ABC field)
import nullfield as nf  # noqa: E402
_nulls = nf.find_nulls([(a, b, c) for a in (1.5, 4.7) for b in (1.5, 4.7) for c in (1.5, 4.7)])
assert len(_nulls) == 8, f"ABC field must have 8 nulls, found {len(_nulls)}"
assert all(np.linalg.norm(nf.B(p[None, :])[0]) < 1e-6 for p in _nulls), "a 'null' has B!=0"
_abc = nf.abc_structure()
_, _Qn = _abc.weights_Q(list(_nulls[0]) + [0.0], _rad3, 3000, np.random.default_rng(8))
_, _Qg = _abc.weights_Q([0.5, 0.5, 0.5, 0.0], _rad3, 2500, np.random.default_rng(9))
assert _Qn == 6 and _Qg == 5, f"SR null detection failed: Q(null)={_Qn}, Q(generic)={_Qg}"

print("OK: magnetic contact structure, gauge invariance, dilation theorem, "
      "delta = -eps^2, Q = d+k+2 (2D & 3D), null jump 5->6, and ABC null "
      "detection (Q=6 at nulls vs 5 generic) all check out.")
