#!/usr/bin/env python3
"""Blog figure for the closed form: delta(eps) = 1 - (2/pi) K(2 eps).

Panel A: the angle-averaged deviation -delta measured by the geodesic code (dots)
against the exact curve, log scale, with the critical gradient eps = 1/2 marked.
Panel B: the per-angle refocusing time t_c(theta0) (dots) against the pendulum-period
formula 2pi/sqrt((1 - eps sin theta0)^2 - eps^2) (curves) at three gradients.

Usage: render_closed_form.py -> public/img/posts/forbidden-directions-closed-form.png
"""
import sys
from pathlib import Path

import numpy as np
from scipy.special import ellipk

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
sys.path.insert(0, str(ROOT / "src"))

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

import mfield  # noqa: E402

BLUE, ORANGE, GREY = "#1565c0", "#e65100", "#5f6368"


def main():
    # ---- panel A data: mean deviation across eps --------------------------------------
    eps_pts = np.array([0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.48])
    meas = []
    for e in eps_pts:
        st = mfield.exp_gradient_field(1.0, g=float(e))
        tmax = 1.0 / np.sqrt(max((1 - e) ** 2 - e ** 2, 1e-9)) + 0.5
        d, _, nn = st.delta([0, 0, 0], 1.0, n_theta=32, n_scan=12000,
                            t_max_factor=tmax)
        assert nn == 0
        meas.append(-d)
        print(f"eps={e:4.2f}  -delta = {-d:.6f}")
    ee = np.linspace(0.005, 0.4995, 400)
    curve = (2 / np.pi) * ellipk((2 * ee) ** 2) - 1.0

    # ---- panel B data: per-angle t_c at three gradients --------------------------------
    th = np.linspace(0, 2 * np.pi, 24, endpoint=False)
    perangle = {}
    for e in (0.2, 0.35, 0.45):
        st = mfield.exp_gradient_field(1.0, g=e)
        tmax = 2 * np.pi * (1.0 / np.sqrt((1 - e) ** 2 - e ** 2) + 0.4)
        tc = st.conjugate_times([0, 0, 0], th, 1.0, t_max=tmax, n_scan=12000)
        perangle[e] = tc / (2 * np.pi)

    # ---- figure -----------------------------------------------------------------------
    fig, (axA, axB) = plt.subplots(1, 2, figsize=(9.8, 4.0), dpi=150)

    axA.semilogy(ee, curve, "-", color=ORANGE, lw=1.8,
                 label=r"$\frac{2}{\pi}K(2\varepsilon)-1$  (exact)")
    axA.semilogy(eps_pts, meas, "o", color=BLUE, ms=5, mfc="white", mew=1.4,
                 label="geodesic code (measured)")
    axA.axvline(0.5, color=GREY, lw=1.0, ls=":")
    axA.text(0.492, 3e-3, "critical gradient  $\\varepsilon = 1/2$", rotation=90,
             fontsize=7.5, color=GREY, ha="right")
    axA.set_xlabel(r"$\varepsilon = |\nabla \ln B|\, r_L$", fontsize=9)
    axA.set_ylabel(r"$-\delta$  (mean refocusing delay)", fontsize=9)
    axA.set_title("A · the exact law, against the measurement", fontsize=9)
    axA.tick_params(labelsize=7.5)
    axA.legend(fontsize=7.5, loc="upper left")
    axA.set_xlim(0, 0.52)

    thf = np.linspace(0, 2 * np.pi, 600)
    for e, col in ((0.2, "#9ec5e8"), (0.35, "#4a90d9"), (0.45, BLUE)):
        pred = 1.0 / np.sqrt((1 - e * np.sin(thf)) ** 2 - e ** 2)
        axB.plot(thf, pred, "-", color=col, lw=1.4)
        axB.plot(th, perangle[e], "o", color=col, ms=3.6, mfc="white", mew=1.1,
                 label=f"$\\varepsilon = {e}$")
    axB.set_xlabel(r"launch angle $\theta_0$", fontsize=9)
    axB.set_ylabel(r"$t_c(\theta_0) / 2\pi$", fontsize=9)
    axB.set_title("B · per-angle refocusing = the pendulum period", fontsize=9)
    axB.set_xticks([0, np.pi / 2, np.pi, 3 * np.pi / 2, 2 * np.pi],
                   ["0", "$\\pi/2$", "$\\pi$", "$3\\pi/2$", "$2\\pi$"])
    axB.tick_params(labelsize=7.5)
    axB.legend(fontsize=7.5)

    fig.suptitle("The magnetic caustic in closed form:  "
                 r"$\delta(\varepsilon) = 1 - \frac{2}{\pi}K(2\varepsilon)$"
                 "   (curves = formula, dots = geodesic integration)",
                 fontsize=10, fontweight="bold")
    fig.tight_layout(rect=[0, 0, 1, 0.91])
    out = REPO / "public/img/posts/forbidden-directions-closed-form.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print(f"rendered {out.relative_to(REPO)}")


if __name__ == "__main__":
    main()
