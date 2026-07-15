#!/usr/bin/env python3
"""T2 step-2 proof check: the elliptic reduction of the period average.

Verifies, at machine precision and symbolically, every link of the chain

    (1/2pi) INT_0^{2pi} dth [(1 - eps sin th)^2 - eps^2]^{-1/2}
      = (t = tan(th/2), phase-shifted)
    (2/pi q) INT_0^inf dt [(t^2 + p^2)(t^2 + q^{-2})]^{-1/2}
      = (Gauss, a = 1/q > p, k^2 = 1 - p^2 q^2 = 4 eps^2)
    (2/pi) K(2 eps)          [modulus convention]

with p^2 = 1 - 2 eps, q^2 = 1 + 2 eps. The factorisation identity
  [(1 - eps cos th)^2 - eps^2](1+t^2)^2 = [t^2 + p^2][1 + q^2 t^2]
is checked symbolically with sympy. See appendix D5 and docs/T2-closed-form.md.
"""
import numpy as np
from scipy.special import ellipk          # parameter convention: ellipk(k^2)
from scipy.integrate import quad


def main():
    print("eps    direct mean       (2/pi)K(2eps)     chain             max|diff|")
    worst = 0.0
    for eps in (0.02, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.49):
        direct = quad(lambda th: ((1 - eps * np.sin(th)) ** 2 - eps ** 2) ** -0.5,
                      0, 2 * np.pi, limit=400)[0] / (2 * np.pi)
        kform = (2 / np.pi) * ellipk(4 * eps ** 2)
        p, q = np.sqrt(1 - 2 * eps), np.sqrt(1 + 2 * eps)
        a, b = max(p, 1 / q), min(p, 1 / q)
        chain = (4 / q) * ellipk(1 - (b / a) ** 2) / a / (2 * np.pi)
        d = max(abs(direct - kform), abs(direct - chain))
        worst = max(worst, d)
        print(f"{eps:.2f}   {direct:.12f}   {kform:.12f}   {chain:.12f}   {d:.1e}")
    assert worst < 1e-9, worst

    import sympy as sp
    t, e = sp.symbols("t epsilon", positive=True)
    cosf = (1 - t ** 2) / (1 + t ** 2)
    lhs = sp.expand(((1 - e * cosf) ** 2 - e ** 2) * (1 + t ** 2) ** 2)
    rhs = sp.expand((t ** 2 + (1 - 2 * e)) * (1 + (1 + 2 * e) * t ** 2))
    assert sp.simplify(lhs - rhs) == 0
    assert sp.simplify(1 - (1 - 2 * e) * (1 + 2 * e)) == 4 * e ** 2
    print("sympy: factorisation identity exact; k^2 = 4 eps^2 exact")
    print("T2 step-2 reduction: PROVEN chain verified")


if __name__ == "__main__":
    main()
