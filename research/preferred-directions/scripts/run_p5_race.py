#!/usr/bin/env python3
"""P5-T1 -- THE RACE: crossover vs quadratic-fit root-finder (PROGRAM-P5, decisive).

Same noisy gridded B to both methods. Legs: pure fold (the fit's exact model class --
pre-registered: fit wins) and contaminated (fold + smooth non-polynomial background at
25% ball RMS -- the open race). Separations {0.4, 0.2, 0.1} (8/4/2 grid cells on the
41^3 grid), noise sigma in {0, 0.1, 0.25}, N=8 draws. kappa = 3.579 frozen from the
single noiseless pure calibration (disclosed in the charter).

Metrics per cell: median relative separation error (NaN = failed to return a pair /
knee); the honest verdict per the charter's rule.

Usage: run_p5_race.py       Out: artifacts/p5_race.json, .../forbidden-directions-race.png
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))

import race               # noqa: E402
import bifurcation as bf  # noqa: E402
import nullfields as nf   # noqa: E402

KAPPA = 3.579
RADII = np.geomspace(0.06, 0.9, 10)
MUS = [0.04, 0.01, 0.0025]            # separations 0.4, 0.2, 0.1
SIGMAS = [0.0, 0.1, 0.25]
N_DRAWS = 8
CONTAM = 0.25


def make_field(mu, leg):
    """Callable total field + its TRUE null pair separation (Newton on the callable)."""
    fold = bf.fold_field(mu)
    if leg == "pure":
        total = fold
    else:
        bg = nf.charge_field([(+1.0, (2.5, 1.5, 2.0)), (-1.0, (-2.0, -2.5, 1.8))])
        # scale background to CONTAM x fold RMS over the half-ball
        rng = np.random.default_rng(0)
        P = rng.uniform(-0.5, 0.5, (4000, 3))
        s = CONTAM * (np.sqrt((fold(P) ** 2).sum(1).mean()) /
                      np.sqrt((bg(P) ** 2).sum(1).mean()))

        def total(Q, fold=fold, bg=bg, s=s):
            return fold(Q) + s * bg(Q)

    # true nulls of the total field by Newton from the fold seeds
    roots = []
    for z0 in (np.sqrt(mu), -np.sqrt(mu)):
        p = np.array([0.0, 0.0, z0])
        for _ in range(60):
            b = total(p[None])[0]
            if np.linalg.norm(b) < 1e-12:
                break
            J = np.empty((3, 3))
            for a in range(3):
                e = np.zeros(3); e[a] = 1e-6
                J[:, a] = (total((p + e)[None])[0] - total((p - e)[None])[0]) / 2e-6
            p = p - np.linalg.solve(J, b)
        if np.linalg.norm(total(p[None])[0]) < 1e-9:
            roots.append(p)
    assert len(roots) == 2, f"true pair lost (leg={leg}, mu={mu})"
    sep_true = float(np.linalg.norm(roots[0] - roots[1]))
    return total, sep_true


def main():
    results = []
    for leg in ("pure", "contam"):
        for mu in MUS:
            total, sep_true = make_field(mu, leg)
            print(f"[{leg}] mu={mu:g}  true sep = {sep_true:.3f}")
            for sig in SIGMAS:
                draws = 1 if sig == 0.0 else N_DRAWS
                errs_x, errs_f = [], []
                for d in range(draws):
                    rng = np.random.default_rng(hash((leg, mu, sig, d)) % 2 ** 31)
                    F, _ = race.field_grid(total, sigma=sig, rng=rng)
                    sx, _ = race.knee_separation(
                        race.ray_gauge_structure(F, 1.0), RADII, KAPPA, n=3000, rng=rng)
                    sf, nroots = race.quadfit_separation(F, 1.0)
                    errs_x.append(abs(sx - sep_true) / sep_true)
                    errs_f.append(abs(sf - sep_true) / sep_true
                                  if np.isfinite(sf) else np.nan)
                ex = float(np.nanmedian(errs_x)) if np.isfinite(errs_x).any() else None
                ef = float(np.nanmedian(errs_f)) if np.isfinite(errs_f).any() else None
                fx = float(np.mean(~np.isfinite(errs_x)))
                ff = float(np.mean(~np.isfinite(errs_f)))
                results.append({"leg": leg, "mu": mu, "sep_true": sep_true,
                                "sigma": sig,
                                "err_crossover": ex, "fail_crossover": fx,
                                "err_quadfit": ef, "fail_quadfit": ff})
                print(f"    sigma={sig:4.2f}  crossover err={ex if ex is None else round(ex,3)} "
                      f"(fail {fx:.0%})   quadfit err={ef if ef is None else round(ef,3)} "
                      f"(fail {ff:.0%})")

    # ---- verdict -------------------------------------------------------------------
    def cell(leg, mu, sig):
        return next(r for r in results
                    if r["leg"] == leg and r["mu"] == mu and r["sigma"] == sig)
    wins = [(r["leg"], r["mu"], r["sigma"]) for r in results
            if r["err_crossover"] is not None and r["err_quadfit"] is not None
            and r["err_crossover"] < r["err_quadfit"]]
    print(f"\ncells where the crossover beats the quad fit: {wins if wins else 'NONE'}")
    verdict = ("crossover survives as a TOOL (wins somewhere honest)"
               if any(l == "contam" and s > 0 for l, m, s in wins)
               else "crossover DEMOTED to conceptual observable (fit wins everywhere honest)")
    print("VERDICT:", verdict)

    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "artifacts" / "p5_race.json").write_text(json.dumps(
        {"kappa": KAPPA, "results": results, "wins": wins, "verdict": verdict},
        indent=2) + "\n")
    print("wrote artifacts/p5_race.json")

    # ---- figure ----------------------------------------------------------------------
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except Exception as e:                              # pragma: no cover
        print("figure skipped:", e)
        return
    BLUE, ORANGE = "#1565c0", "#e65100"
    fig, axes = plt.subplots(1, 2, figsize=(9.6, 3.9), dpi=150, sharey=True)
    for ax, leg, ttl in ((axes[0], "pure", "A · pure fold (the fit's exact model)"),
                         (axes[1], "contam",
                          "B · contaminated (25% non-polynomial background)")):
        for mi, mu in enumerate(MUS):
            sep = cell(leg, mu, 0.0)["sep_true"]
            alpha = 1.0 - 0.3 * mi
            for key, col, mk, lab in (("err_crossover", ORANGE, "o", "crossover"),
                                      ("err_quadfit", BLUE, "s", "quad fit")):
                ys = [cell(leg, mu, s)[key] for s in SIGMAS]
                ys = [np.nan if v is None else v for v in ys]
                ax.plot(SIGMAS, ys, mk + "-", color=col, alpha=alpha, ms=4, lw=1.2,
                        label=(f"{lab}, sep={sep:.2f}" if True else None))
        ax.set_xlabel("noise $\\sigma$ (rel. ball RMS)", fontsize=8.5)
        ax.set_title(ttl, fontsize=9)
        ax.set_yscale("log")
        ax.tick_params(labelsize=7.5)
        ax.grid(alpha=0.25, lw=0.5)
    axes[0].set_ylabel("median relative separation error", fontsize=8.5)
    axes[1].legend(fontsize=5.8, ncol=2, loc="upper left")
    fig.tight_layout()
    out = REPO / "public/img/posts/forbidden-directions-race.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print(f"rendered {out.relative_to(REPO)}")


if __name__ == "__main__":
    main()
