#!/usr/bin/env python3
"""Self-checks + golden-file regression for the Phase 0 forward model.

Fails loudly if the Heisenberg forward model or the generic caustic detector
breaks. The golden facts (all convention-independent):

  * unit-speed geodesics, horizontality  z' = (x y' - y x') / 2;
  * rotational Jacobi field d(gamma)/d(theta) = (-y, x, 0);
  * first conjugate time  t_c = 2*pi / |w|  (analytic AND via the generic
    Jacobian-determinant detector, which must agree -- this validates the
    detector that will later grade SE(2)/Engel/Cartan);
  * conjugate point on the z-axis at |z| = pi / w^2;
  * regression: the conjugate locus over a w-grid matches tests/golden/.

Usage:
    smoke_test.py                 # run all checks
    smoke_test.py --update-golden # regenerate the golden file, then check
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import heisenberg as H  # noqa: E402
import caustics  # noqa: E402
import liegroup  # noqa: E402
import growth  # noqa: E402
import fingerprint as fp  # noqa: E402
import lagrangian as lag  # noqa: E402
import grf  # noqa: E402
import magnetic as magf  # noqa: E402

GOLDEN = ROOT / "tests" / "golden" / "heisenberg_conjugate_locus.json"
WS = [0.5, 1.0, 1.5, 2.0, 3.0]

# --- metadata sanity
assert H.GROWTH_VECTOR == (2, 3)
assert H.HOMOGENEOUS_DIMENSION == 4
assert H.HAS_ABNORMAL_MINIMIZERS is False

# --- unit speed and horizontality on a dense (theta, w, t) sample
rng = np.random.default_rng(0)
for _ in range(200):
    th = rng.uniform(-np.pi, np.pi)
    w = rng.uniform(-3, 3)
    t = rng.uniform(0.1, 5.0)
    v = H.velocity(th, w, t)
    assert abs(v[0] ** 2 + v[1] ** 2 - 1.0) < 1e-9, "not unit horizontal speed"
    p = H.geodesic(th, w, t)
    # horizontality: z' = (x y' - y x') / 2
    zdot_geom = 0.5 * (p[0] * v[1] - p[1] * v[0])
    assert abs(v[2] - zdot_geom) < 1e-9, "horizontality violated"

# --- rotational Jacobi field equals (-y, x, 0)
th, w, t = 0.7, 1.3, np.linspace(0.05, 4.0, 50)
p = H.geodesic(th, w, t)
jac = H.d_theta(th, w, t)
assert np.allclose(jac[:, 0], -p[:, 1]) and np.allclose(jac[:, 1], p[:, 0])
assert np.allclose(jac[:, 2], 0.0)

# --- |d(gamma)/d(theta)| first vanishes exactly at t_c = 2*pi/|w|
for w in WS:
    tc = H.conjugate_time(w)
    mag = np.linalg.norm(H.d_theta(0.4, w, np.linspace(0.05, tc - 1e-3, 300)), axis=1)
    assert mag.min() > 1e-6, "Jacobi field vanished before t_c"
    assert np.linalg.norm(H.d_theta(0.4, w, tc)) < 1e-9, "Jacobi field nonzero at t_c"

# --- generic Jacobian-determinant detector agrees with the analytic t_c
for w in WS:
    tc_true = float(H.conjugate_time(w))
    tc_num = caustics.first_conjugate_time(H.geodesic, 0.4, w, t_max=1.4 * tc_true)
    assert tc_num is not None, f"detector found no conjugate point for w={w}"
    rel = abs(tc_num - tc_true) / tc_true
    assert rel < 2e-3, f"detector t_c off by {rel:.1e} for w={w}"

# --- conjugate point sits on the z-axis with |z| = pi / w^2
for w in WS:
    cp = H.conjugate_point(w)
    assert abs(cp[0]) < 1e-9 and abs(cp[1]) < 1e-9, "conjugate point off z-axis"
    assert abs(abs(cp[2]) - np.pi / w ** 2) < 1e-9, "wrong |z| at conjugate point"
    assert np.sign(cp[2]) == np.sign(w), "wrong sign of z"

# --- straight geodesic (w = 0) has no conjugate point
assert np.isinf(H.conjugate_time(0.0))
assert caustics.first_conjugate_time(H.geodesic, 0.4, 0.0, t_max=50.0) is None

# --- generic Lie-Poisson integrator reproduces the Heisenberg closed form
heis = liegroup.GROUPS["Heisenberg"]
for (th, w) in [(0.3, 1.0), (-0.8, 2.0), (1.7, 0.5)]:
    cov0 = [np.cos(th), np.sin(th), w]           # h1, h2, h3
    tg = np.linspace(0.0, 1.9 * np.pi / abs(w), 40)[1:]
    q_num, _ = liegroup.normal_geodesic(heis, cov0, tg)
    q_exact = H.geodesic(th, w, tg)
    assert np.allclose(q_num, q_exact, atol=1e-6), "integrator disagrees with closed form"

# --- SE(2) short-time tangent cone is Heisenberg: sideways coord grows ~ t^2
se2 = liegroup.GROUPS["SE(2)"]
cov0 = [np.cos(0.0), np.sin(0.0), 0.0]           # pure steer start (h2=... ) -> curve
cov0 = [0.6, 0.8, 0.0]
small = np.array([0.02, 0.04])
qa = liegroup.exp_map(se2, cov0, small[0])
qb = liegroup.exp_map(se2, cov0, small[1])
# y (index 1, weight 2) ratio ~ (0.04/0.02)^2 = 4; x (index 0, weight 1) ratio ~ 2
assert abs(qb[0] / qa[0] - 2.0) < 0.3, "SE(2) forward coord not weight 1"
assert abs(qb[1] / qa[1] - 4.0) < 0.8, "SE(2) sideways coord not weight 2"

# --- growth-vector estimator (M1) recovers the true vectors on clean data
radii = np.geomspace(0.15, 1.0, 6)
for name, truth in [("Heisenberg", (2, 3)), ("SE(2)", (2, 3)), ("Engel", (2, 3, 4)),
                    ("Cartan", (2, 3, 5)), ("SE(3)-cone", (3, 6))]:
    vec, Q, _ = growth.estimate_growth_vector(
        liegroup.GROUPS[name], radii, 400, np.random.default_rng(1), noise=0.0)
    assert vec == truth, f"M1 growth vector for {name}: {vec} != {truth}"

# --- Cartan structure constants agree with the frame (finite-diff brackets)
ca = liegroup.GROUPS["Cartan"]
qc = np.array([0.3, -0.2, 0.15, 0.1, -0.05])
eC = np.eye(5)
for (i, j) in [(0, 1), (0, 2), (1, 2), (0, 3), (1, 4)]:
    Ji = np.column_stack([(ca.frame(qc + 1e-5 * eC[a])[:, i]
                           - ca.frame(qc - 1e-5 * eC[a])[:, i]) / 2e-5 for a in range(5)])
    Jj = np.column_stack([(ca.frame(qc + 1e-5 * eC[a])[:, j]
                           - ca.frame(qc - 1e-5 * eC[a])[:, j]) / 2e-5 for a in range(5)])
    brk = Jj @ ca.frame(qc)[:, i] - Ji @ ca.frame(qc)[:, j]
    exp = sum(ca.C[i, j, k] * ca.frame(qc)[:, k] for k in range(5))
    assert np.allclose(brk, exp, atol=1e-4), f"Cartan [X{i+1},X{j+1}] wrong"

# --- every registered group's frame brackets match its structure constants C
#     (guards against invalid specs: an inconsistent frame/C is not a real SR flow)
for _name, _spec in liegroup.GROUPS.items():
    _q = 0.3 * np.random.default_rng(7).standard_normal(_spec.dim)
    assert liegroup.structure_constants_consistent(_spec, _q), \
        f"{_name}: frame brackets disagree with structure constants C"

# --- fingerprint classifier labels each group correctly on clean data
_curves = fp.cache_deviation_curves()
# the (2,3) alias is broken: Heisenberg delta ~ 0, SE(2) delta clearly positive
assert abs(np.nanmean(_curves["Heisenberg"])) < 1e-4
assert np.nanmean(_curves["SE(2)"]) > 0.05
for name in ["Heisenberg", "SE(2)", "Engel", "Cartan"]:
    pred = fp.classify(liegroup.GROUPS[name], np.random.default_rng(3),
                       n_geo=300, noise=1e-3, t_noise=0.02, tau=0.07,
                       dev_curves=_curves)
    assert pred == name, f"classifier: {name} -> {pred}"

# --- abnormal-stratum leg (M4): corank + abnormal bit correct on clean data
for name, exp_corank, exp_abn in [("Heisenberg", 1, False), ("SE(2)", 1, False),
                                  ("Engel", 2, True), ("Cartan", 3, True)]:
    corank, abn = growth.estimate_corank_abnormal(
        liegroup.GROUPS[name], np.geomspace(0.15, 1.0, 6), 300,
        np.random.default_rng(2), noise=0.0)
    assert corank == exp_corank and abn is exp_abn, \
        f"M4 for {name}: corank={corank}, abnormal={abn}"

# --- golden-file regression
locus = {f"{w:.4f}": H.conjugate_point(w).tolist() for w in WS}
if "--update-golden" in sys.argv:
    GOLDEN.parent.mkdir(parents=True, exist_ok=True)
    GOLDEN.write_text(json.dumps(locus, indent=2, sort_keys=True) + "\n")
    print(f"golden updated: {GOLDEN.relative_to(ROOT)}")
assert GOLDEN.exists(), "golden file missing; run with --update-golden once"
ref = json.loads(GOLDEN.read_text())
assert ref.keys() == locus.keys(), "golden w-grid changed"
for k in ref:
    assert np.allclose(ref[k], locus[k], atol=1e-9), f"conjugate locus drift at w={k}"

# --- Lagrangian-map exponent estimator (E5): reads degeneracy order from a map
_r = np.geomspace(1e-3, 2e-2, 6)
_I = np.eye(3)
for _fn, _expQ, _label in [(lag.linear_map(np.diag([1.0, 0.7, 0.5])), 3, "linear"),
                           (lag.fold_map, 4, "fold x1=q1^2"),
                           (lag.cusp_map, 5, "cusp x1=q1^3")]:
    _reach = lag.image_reach(_fn, np.zeros(3), _I, _r, 2000, np.random.default_rng(4))
    _Q = int(np.rint(growth.estimate_weights(_reach, _r)).sum())
    assert _Q == _expQ, f"E5 exponent estimator on {_label}: Q={_Q} != {_expQ}"

# --- a Zel'dovich flow is regular (Q = n = 3) away from its folds
_flow = lag.ZeldovichFlow(n_modes=10, seed=3, amp=0.05)
_q0 = np.array([1.0, 2.0, 3.0])
_lam, _E = lag.eigenframe(_flow, _q0)
if _lam.max() > 0:
    _Dsafe = 0.5 / _lam.max()
    _reach = lag.image_reach(lambda z: _flow.map(z, _Dsafe), _q0, _E, _r, 2000,
                             np.random.default_rng(5))
    _Q = int(np.rint(growth.estimate_weights(_reach, _r)).sum())
    assert _Q == 3, f"regular Zel'dovich point should give Q=3, got {_Q}"

# --- E6: deformation tensor of a GRF, and the Doroshkevich (1970) covariance
_rng = np.random.default_rng(6)
_d, _kv, _k2, _dk = grf.gaussian_field(32, 32.0, _rng, n_index=0.0, r_smooth=1.2)
_T = grf.deformation_tensor(_dk, _kv, _k2)
assert np.abs(np.trace(_T, axis1=-2, axis2=-1) - _d).max() < 1e-10 * max(_d.std(), 1e-12), \
    "trace of the deformation tensor must equal delta"
# theory ensemble has the analytic covariance <T_ij T_kl> = (s^2/15)(dd+dd+dd)
_s = 0.7
_A = np.random.default_rng(7).standard_normal((200000, 3, 3))
_S = (_A + np.transpose(_A, (0, 2, 1))) / np.sqrt(2.0)
_Gt = _S - (np.trace(_S, axis1=1, axis2=2) / 3.0)[:, None, None] * np.eye(3)
_dl = _s * np.random.default_rng(8).standard_normal(200000)
_Tt = (_dl / 3.0)[:, None, None] * np.eye(3) + (_s / np.sqrt(15.0)) * _Gt
assert abs(_Tt[:, 0, 0].var() / _s ** 2 - 0.2) < 0.01, "theory Var(T00) should be s^2/5"
assert abs(_Tt[:, 0, 1].var() / _s ** 2 - 1 / 15) < 0.005, "theory Var(T01) should be s^2/15"
# eigenvalues sorted descending; min_gap is zero exactly on the degeneracy locus
_lam = grf.doroshkevich_sample(2000, _s, np.random.default_rng(9))
assert np.all(np.diff(_lam, axis=1) <= 1e-12), "eigenvalues must be descending"
assert np.all(grf.min_gap(_lam) >= -1e-12)
assert np.all(grf.discriminant(_lam) >= -1e-12)

# --- E8: the magnetic contact structure (Q=4 where B!=0; Martinet Q=5 at a null)
_rad = np.geomspace(0.02, 0.25, 6)
_uni = magf.uniform_field(1.0)
assert abs(_uni.B(0.3, -0.2) - 1.0) < 1e-6, "uniform field B should be 1"
_w = growth.estimate_weights(_uni.reach([0.0, 0.0, 0.0], _rad, 800,
                                        np.random.default_rng(11)), _rad)
assert int(np.rint(_w).sum()) == 4, f"uniform magnetic contact should give Q=4, got {_w}"
_nul = magf.null_field()
assert abs(_nul.B(0.0, 0.5)) < 1e-6 and abs(_nul.B(1.0, 0.5) - 1.0) < 1e-5
_w = growth.estimate_weights(_nul.reach([0.0, 0.0, 0.0], _rad, 800,
                                        np.random.default_rng(12)), _rad)
assert int(np.rint(_w).sum()) == 5, f"at a magnetic null expect Martinet Q=5, got {_w}"
# anisotropic Riemannian is NOT sub-Riemannian: every semi-axis linear in r
_w = growth.estimate_weights(np.outer(_rad, np.array([1.0, 1e-4, 1e-4])), _rad)
assert int(np.rint(_w).sum()) == 3, "anisotropic Riemannian must have Q = n"

# --- E9: curvature vanishing to order k gives Q = k + 4 (2D unifying law)
_rad9 = np.geomspace(0.03, 0.30, 7)
for _k in [0, 2]:
    _w = growth.estimate_weights(
        magf.power_law_field(_k).reach([0.0, 0.0, 0.0], _rad9, 1500,
                                       np.random.default_rng(13)), _rad9, w_max=8.0)
    assert int(np.rint(_w).sum()) == _k + 4, f"Q != k+4 for k={_k}: got {_w}"

print("OK: Heisenberg forward model + caustic detector pass all checks "
      f"({len(WS)} momenta, golden-file matched).")
