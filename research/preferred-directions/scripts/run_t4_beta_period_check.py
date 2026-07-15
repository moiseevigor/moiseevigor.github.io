"""T4 -- the profile law c2 = 1 - beta/2 (article Prop 4.1), period-average check.

PREDICTION (derived before this run): the period-averaged deviation obeys
delta = -(1 - beta/2) eps^2 + O(eps^4), with beta = L''(0)/L'(0)^2 the
dimensionless profile curvature (L = ln B). Exponential profile: beta = 0,
c2 = 1 (the series' calibration). Linear profile B = B0(1+gx): beta = -1,
c2 = 3/2 -- the deviation statistic is NOT a pure gradient meter; and at
beta = +2 (B ~ (1-2gx)^{-1/2}) the leading deviation vanishes entirely.

Reduced flow: dX/dtau = cos(theta), dtheta/dtau = f(X) = exp(L(X)),
L = eps*X + (beta/2) eps^2 X^2.  Period T(theta0) = time for theta to
advance 2pi; delta = 1 - <T>/2pi, theta0 uniform.  Also checks the exact
linear profile against -delta = (3/2)eps^2 + (315/32)eps^4 and the
exponential control against the closed form 1 - (2/pi)K(2eps).

NOTE: this verifies the PERIOD AVERAGE only. The caustic pipeline (V1,
run_v1_linear_profile.py) subsequently REFUTED the naive caustic reading:
the measured caustic law is c2 = 1 - (3/4) beta, and t_c = theta-period
holds only on the exponential profile.
"""
import numpy as np
from scipy.integrate import solve_ivp
from scipy.special import ellipk

def period(f, theta0, rtol=1e-12):
    # integrate in theta: dtau/dtheta = 1/f(X), dX/dtheta = cos(theta)/f(X)
    def rhs(th, y):
        tau, X = y
        v = f(X)
        return [1.0 / v, np.cos(th) / v]
    sol = solve_ivp(rhs, [theta0, theta0 + 2 * np.pi], [0.0, 0.0],
                    rtol=rtol, atol=1e-14, dense_output=False)
    return sol.y[0, -1]

def mean_delta(f, n=64):
    th0 = np.linspace(0, 2 * np.pi, n, endpoint=False)
    T = np.array([period(f, t) for t in th0])
    return 1.0 - T.mean() / (2 * np.pi)

print("beta-family f = exp(eps X + beta/2 eps^2 X^2), eps=0.02:")
eps = 0.02
for beta in (0.0, -1.0, 1.0, 2.0, -2.0):
    f = lambda X, b=beta: np.exp(eps * X + 0.5 * b * eps**2 * X**2)
    d = mean_delta(f)
    print(f"  beta={beta:+.0f}: -delta/eps^2 = {-d/eps**2:.4f}   "
          f"predicted 1-beta/2 = {1-beta/2:.4f}")

print("\nexact linear f = 1 + eps X (all higher orders of the profile):")
for eps in (0.02, 0.05, 0.10):
    f = lambda X, e=eps: 1.0 + e * X
    d = mean_delta(f)
    pred = 1.5 * eps**2 + (315 / 32) * eps**4
    print(f"  eps={eps}: -delta = {-d:.8f}   pred 1.5e^2+9.84e^4 = {pred:.8f}   "
          f"ratio {-d/pred:.5f}")

print("\nexponential control vs closed form 1-(2/pi)K(2eps):")
for eps in (0.05, 0.2):
    f = lambda X, e=eps: np.exp(e * X)
    d = mean_delta(f)
    closed = 1 - (2 / np.pi) * ellipk((2 * eps) ** 2)  # scipy: parameter m=k^2
    print(f"  eps={eps}: delta_num = {d:.10f}   closed = {closed:.10f}")
