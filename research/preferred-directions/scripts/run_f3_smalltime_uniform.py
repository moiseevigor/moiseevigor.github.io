#!/usr/bin/env python3
"""F3 -- UNIFORM small-time factorization of the perturbed Jacobian (final
re-review, section 3: the missing step of Prop 4.2's first-root window (i)).

CLAIM (structural): for the reduced flow
    x' = cos(theta), y' = sin(theta), theta' = (1+h) B(x), phi' = A(x) sin(theta)
with B analytic, B(0) = 1, A' = B, A(0) = 0 (the launch gauge), the
exponential-map Jacobian J(t) = det d(x,y,phi)/d(theta0,h,t) satisfies

    J(t) = t^4 ( a(jets, h, theta0) + t R(...) ),

with the t^0..t^3 coefficients IDENTICALLY ZERO in ALL profile jets, h and
theta0 -- not merely at eps = 0 (which is what the reviewer's counterexample
J = t^4/12 - eps t^3 shows smooth dependence alone cannot exclude). Order
counting behind it: the endpoint variations obey, in (x, y, phi) components,
d/dtheta0 = (O(t), O(t), O(t^2)), d/dh = (O(t^2), O(t^2), O(t^3)),
d/dt = (O(1), O(1), O(t)); every determinant term uses the phi-row once,
which costs exactly one extra order (A(0) = 0), so every term is O(t^4).

METHOD (exact, fast): formal derivation operator D = sum_v (d/dv) f_v on the
state (X, Y, TH, PH, AA) with AA(t) := A(x(t)) tracked by AA' = B(X) cos(TH)
-- the potential enters only through A' = B, never an integral. Taylor
coefficients at t = 0 are exact polynomials in (sin/cos theta0, l1, l2, l3, h)
where B = exp(l1 x + l2 x^2/2 + l3 x^3/6); no series-of-composition machinery
(the tarpit that killed v1 of this script and v1 of the O6 run).

Out: artifacts/f3_smalltime_uniform.json (vanishing checks + the exact
a-coefficient + a(0) = 1/12).
"""
import json
import time
from pathlib import Path

import sympy as sp

ROOT = Path(__file__).resolve().parents[1]
T0 = time.time()
ORDER = 6           # Taylor order in t (t^0 .. t^6): enough for J through t^5


def main():
    t, th0, h = sp.symbols('t theta0 h', real=True)
    l1, l2, l3 = sp.symbols('l1 l2 l3', real=True)
    X, Y, TH, PH, AA = sp.symbols('X Y TH PH AA', real=True)

    Bx = sp.exp(l1 * X + l2 * X**2 / 2 + l3 * X**3 / 6)
    f = {X: sp.cos(TH), Y: sp.sin(TH), TH: (1 + h) * Bx,
         PH: AA * sp.sin(TH), AA: Bx * sp.cos(TH)}
    init = {X: 0, Y: 0, TH: th0, PH: 0, AA: 0}

    def D(e):
        return sp.expand(sum(sp.diff(e, v) * f[v] for v in f))

    # k-th t-derivatives at 0: d0 = state, d1 = f, d_{k+1} = D(d_k)
    ders = {v: [sp.Symbol(str(v))] for v in f}     # placeholder, replaced below
    cur = {v: f[v] for v in f}
    vals = {v: [init[v], sp.expand(f[v].subs(init))] for v in f}
    for k in range(2, ORDER + 1):
        cur = {v: D(cur[v]) for v in f}
        for v in f:
            vals[v].append(sp.expand(cur[v].subs(init)))
        print(f"  derivative order {k} done  [{time.time()-T0:.0f} s]", flush=True)

    def taylor(v):
        return sum(vals[v][k] * t**k / sp.factorial(k) for k in range(ORDER + 1))

    xs, ys, phs = taylor(X), taylor(Y), taylor(PH)
    print(f"Taylor polynomials assembled  [{time.time()-T0:.0f} s]", flush=True)

    M = sp.Matrix([
        [sp.diff(xs, th0), sp.diff(xs, h), sp.diff(xs, t)],
        [sp.diff(ys, th0), sp.diff(ys, h), sp.diff(ys, t)],
        [sp.diff(phs, th0), sp.diff(phs, h), sp.diff(phs, t)],
    ])
    J = sp.expand(M.det())
    print(f"J expanded  [{time.time()-T0:.0f} s]", flush=True)

    out = {"claim": "J(t) = t^4 (a + t R): t^0..t^3 coefficients vanish "
                    "IDENTICALLY in (l1,l2,l3,h,theta0)"}
    ok = True
    for k in range(4):
        ck = sp.simplify(J.coeff(t, k))
        vanish = (ck == 0)
        ok &= bool(vanish)
        out[f"coeff_t{k}_zero"] = bool(vanish)
        print(f"  coeff t^{k}: {'0 identically' if vanish else ck}", flush=True)

    a = sp.simplify(J.coeff(t, 4))
    a0 = sp.simplify(a.subs({l1: 0, l2: 0, l3: 0, h: 0}))
    a_is = sp.simplify(a0 - sp.Rational(1, 12)) == 0
    print(f"  a(jets, h, theta0) = {a}", flush=True)
    print(f"  a at l = h = 0: {a0}   (must be 1/12, theta0-free: "
          f"{sp.simplify(sp.diff(a0, th0)) == 0})", flush=True)
    out["a_coefficient"] = str(a)
    out["a_at_zero"] = str(a0)
    out["a_at_zero_is_one_twelfth"] = bool(a_is)
    out["verdict"] = "PASS" if (ok and a_is) else "FAIL"
    print(f"UNIFORM SMALL-TIME FACTORIZATION: {out['verdict']} "
          f"[{time.time()-T0:.0f} s]", flush=True)

    (ROOT / "artifacts" / "f3_smalltime_uniform.json").write_text(
        json.dumps(out, indent=1) + "\n")
    print("saved artifacts/f3_smalltime_uniform.json", flush=True)


if __name__ == "__main__":
    main()
