#!/usr/bin/env python3
"""P4-S1 -- the magnetic fold: Q = 7 at the degenerate null, and the pair-separation
scale crossover (hypotheses H-P4a, H-P4b of PROGRAM-P4).

(a) H-P4a: growth-vector weights at the fold point mu = 0 (predict (1,1,1,4), Q = 7 --
    the law's first k = 2 test in 3D) and at a split null for mu > 0 (predict Q = 6),
    with the pair's opposite signs from the standard classifier.
(b) H-P4b (heavy): the scale-resolved flux exponent w4(r) at the PAIR MIDPOINT for a
    grid of mu: predict w4 -> 2 for r << sqrt(mu) (uniform-dominated), w4 -> 4 for
    r >> sqrt(mu) (the degenerate parent), with all curves collapsing in r/sqrt(mu)
    (dilation). Plus the at-null curve (predict 3 -> 4). The SR detector thereby reads
    an unresolved pair's SEPARATION off one scaling curve -- no pointwise method can.

Usage: run_p4_fold.py            Output: artifacts/p4_fold.json,
       public/img/posts/forbidden-directions-fold-crossover.png
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))

import bifurcation as bf  # noqa: E402
import nulltopo           # noqa: E402

RADII = np.geomspace(0.012, 1.0, 16)
N_CURVES = 8000
MUS = [0.01, 0.04, 0.09, 0.16]


def main():
    rng = np.random.default_rng(11)

    # ---- H-P4a: the law at the fold ---------------------------------------------------
    st0 = bf.fold_structure(0.0)
    w0, Q0 = st0.weights_Q([0, 0, 0, 0], np.geomspace(0.02, 0.2, 7), 6000, rng)
    print(f"fold point (mu=0):    weights = {np.round(w0, 2)}  Q = {Q0}   (predict (1,1,1,4), 7)")

    mu = 0.09
    z0 = np.sqrt(mu)
    stp = bf.fold_structure(mu)
    wn, Qn = stp.weights_Q([0, 0, z0, 0], np.geomspace(0.02, 0.2, 7) * z0, 6000, rng)
    print(f"split null (mu={mu}): weights = {np.round(wn, 2)}  Q = {Qn}   (predict (1,1,1,3), 6)")
    for z in (z0, -z0):
        J = np.diag([z, z, -2 * z])
        c = nulltopo.classify_null(J)
        print(f"  standard classifier at z0={z:+.2f}: {c['label']}")
    assert Q0 == 7 and Qn == 6, "H-P4a failed"

    # ---- H-P4b: the crossover (heavy) --------------------------------------------------
    curves = {}
    print("\nscale-resolved flux exponent w4(r) at the pair midpoint:")
    for m in [0.0] + MUS:
        st = bf.fold_structure(m)
        w4 = bf.flux_exponent_curve(st, [0, 0, 0, 0], RADII, N_CURVES, rng)
        curves[f"mid_mu{m:g}"] = w4
        lab = "degenerate control" if m == 0 else f"pair sep 2*sqrt(mu) = {2*np.sqrt(m):.2f}"
        print(f"  mu={m:<5g} [{lab:>28s}]  w4 = " +
              " ".join(f"{v:4.2f}" for v in w4))
    print("at the split null itself (mu=0.09):")
    w4n = bf.flux_exponent_curve(bf.fold_structure(0.09), [0, 0, 0.3, 0],
                                 RADII, N_CURVES, rng)
    curves["null_mu0.09"] = w4n
    print(f"  w4 = " + " ".join(f"{v:4.2f}" for v in w4n))

    res = {"radii": RADII.tolist(), "n_curves": N_CURVES,
           "H_P4a": {"fold_weights": w0.tolist(), "fold_Q": int(Q0),
                     "split_weights": wn.tolist(), "split_Q": int(Qn)},
           "curves": {k: v.tolist() for k, v in curves.items()}}
    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "artifacts" / "p4_fold.json").write_text(json.dumps(res, indent=2) + "\n")
    print("wrote artifacts/p4_fold.json")

    print(f"fold figure: fold point Q = {Q0}; split null Q = {Qn}")
    render(res)


def render(res):
    """Figure from the results dict (= artifacts/p4_fold.json). Panel letters only;
    reference levels are labelled on the right margin, clear of the data."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    BLUE, ORANGE = "#1565c0", "#e65100"
    radii = np.array(res["radii"]); curves = res["curves"]
    cols = plt.cm.viridis(np.linspace(0.15, 0.85, len(MUS)))
    fig, axes = plt.subplots(1, 3, figsize=(11.6, 4.3), dpi=150, sharey=True)

    ax = axes[0]
    ax.semilogx(radii, curves["mid_mu0"], "-", color=ORANGE, lw=2,
                label="$\\mu=0$ (fold point)")
    for c, m in zip(cols, MUS):
        ax.semilogx(radii, curves[f"mid_mu{m:g}"], "o-", color=c, ms=3, lw=1.2,
                    label=f"$\\mu={m}$")
        ax.axvline(np.sqrt(m), color=c, lw=0.9, ls=":", alpha=0.7)
    ax.set_xlabel("probe radius $r$ [model units, log scale]", fontsize=9.5)
    ax.set_ylabel("local flux exponent $w_4(r)$ [dimensionless, linear]", fontsize=9.5)

    ax = axes[1]
    for c, m in zip(cols, MUS):
        ax.semilogx(radii / np.sqrt(m), curves[f"mid_mu{m:g}"], "o-", color=c, ms=3,
                    lw=1.2)
    ax.axvline(1.0, color="k", lw=0.9, ls=":")
    ax.set_xlabel("$r/\\sqrt{\\mu}$ [half-separations, log scale]", fontsize=9.5)

    ax = axes[2]
    ax.semilogx(radii / 0.3, curves["null_mu0.09"], "s-", color=BLUE, ms=3, lw=1.2,
                label="centred on a split null ($\\mu=0.09$)")
    ax.semilogx(radii, curves["mid_mu0"], "-", color=ORANGE, lw=2)
    ax.set_xlabel("blue: $r/\\sqrt{\\mu}$; orange: $r$ [log scale]", fontsize=9.5)

    for ax, letter in zip(axes, "ABC"):
        for yv in (2, 3, 4):
            ax.axhline(yv, color="0.8", lw=0.8, ls="--", zorder=0)
        ax.set_title(letter, loc="left", fontsize=11, fontweight="bold")
        ax.set_ylim(1.5, 4.6); ax.tick_params(labelsize=9)
    sec = axes[2].secondary_yaxis("right")               # reference levels, off the data
    sec.set_yticks([2, 3, 4], ["uniform\n$w_4=2$", "single null\n$w_4=3$",
                               "fold point\n$w_4=4$"], fontsize=9)
    sec.tick_params(length=0)
    h0, l0 = axes[0].get_legend_handles_labels()
    h2, l2 = axes[2].get_legend_handles_labels()
    fig.legend(h0 + h2, l0 + l2, loc="upper center", ncol=6, fontsize=9, frameon=False,
               bbox_to_anchor=(0.5, 1.0))
    fig.tight_layout(rect=(0, 0, 1, 0.93))
    out = REPO / "public/img/posts/forbidden-directions-fold-crossover.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print(f"rendered {out.relative_to(REPO)}")


if __name__ == "__main__":
    if "--render" in sys.argv:
        render(json.loads((ROOT / "artifacts" / "p4_fold.json").read_text()))
    else:
        main()
