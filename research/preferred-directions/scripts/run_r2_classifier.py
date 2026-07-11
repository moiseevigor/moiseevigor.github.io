#!/usr/bin/env python3
"""R2 -- the decisive experiment: integrated-flow vs finite-difference null classification
under noise (PROGRAM-P3, hypotheses H-R1 and H-R2).

Protocol (pre-registered in docs/PROGRAM-P3-real-null-grounding.md):
  * Ground truth from nullfields.linear_null / nulltopo (Parnell scheme).
  * CALIBRATION battery (p,q)=(1.0,0.4) at sigma=0 sets the flow winding threshold W_crit
    once (geometric midpoint of worst radial / best spiral winding); then FROZEN.
  * TEST battery: (p,q) in {(0.8,0.3),(1.2,0.5)} x j/j_thr in {0,.5,.9,1.1,1.5,3} x sign
    flips, each in its own rotated frame -- disjoint from calibration.
  * Noise sigma in {0,.05,.1,.2,.35,.5} (relative to RMS |B| over the info ball), N draws;
    per draw the SAME noisy grid goes to all three classifiers (paired comparison):
      flow      -- integrated trajectories only (src/flowclass.classify_flow)
      fd-plain  -- central differences at the null (standard practice)
      fd-lsq    -- least-squares linear fit over the info ball (strong baseline ~ MLE)
  * Metrics: 4-class accuracy vs sigma (all configs and the boundary subset j/j_thr in
    {.9,1.1}); sigma* = noise beyond which flow beats a baseline (if any); confusion.

Honest framing: the flow classifier reads the kernel foliation of the SR curvature form
(= field lines); its operational content is trajectory winding + escape asymmetry. What is
tested is the MECHANISM claim "integration is better conditioned than differentiation" --
against a strong baseline chosen to be nearly optimal, so a null result is meaningful.

Usage: run_r2_classifier.py [--fast]     (--fast: N=6 for a smoke run)
Out:   artifacts/r2_results.json, public/img/posts/forbidden-directions-r2-noise.png
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))

import flowclass as fc   # noqa: E402
import nullfields as nf  # noqa: E402
import nulltopo          # noqa: E402

SIGMAS = [0.0, 0.05, 0.1, 0.2, 0.35, 0.5]
FLOW_KW = dict(rho_seed=0.10, rho_out=0.5, k=48, dt=0.02, max_steps=2500)


def battery(pq_list, rot_seed):
    """Configs: (name, M, truth_label, boundary?) for each (p,q) x j-ratio x flip."""
    rng = np.random.default_rng(rot_seed)
    out = []
    for (p, q) in pq_list:
        jthr = (p - q) / 2
        for jr in (0.0, 0.5, 0.9, 1.1, 1.5, 3.0):
            for flip in (+1.0, -1.0):
                R = nf.rot_from_axis_angle(rng.standard_normal(3), rng.uniform(0, np.pi))
                d = nf.linear_null(p, q, jr * jthr, rot=R)
                M = flip * d["M"]
                truth = nulltopo.classify_null(M)["label"]
                out.append({"name": f"p{p}q{q}_jr{jr}_f{int(flip)}", "M": M,
                            "truth": truth, "boundary": jr in (0.9, 1.1)})
    return out


def calibrate_Wcrit():
    """sigma=0 windings on the calibration battery -> frozen W_crit."""
    Wr, Ws = [], []
    for cfg in battery([(1.0, 0.4)], rot_seed=7):
        F, L = fc.make_grid(cfg["M"], sigma=0.0)
        d = fc.flow_diagnostics(F, L, **FLOW_KW)
        (Ws if cfg["truth"].startswith("spiral") else Wr).append(d["W"])
    W_crit = float(np.sqrt(max(Wr) * min(Ws)))
    print(f"calibration (p,q)=(1.0,0.4): radial W max={max(Wr):.3f}, "
          f"spiral W min={min(Ws):.3f}  ->  W_crit={W_crit:.3f} (frozen)")
    if max(Wr) >= min(Ws):
        print("  WARNING: calibration windings overlap -- boundary types genuinely merge")
    return W_crit


METHODS = ["flow", "fd_plain", "fd_lsq", "fd_lsq_small"]
LEGS = [("clean", 0.0), ("curved", 0.3)]        # quad = RMS(quadratic)/RMS(linear) on ball
LABELS4 = ["radial+", "radial-", "spiral+", "spiral-"]


def run_leg(test, W_crit, quad, N):
    hits = {m: np.zeros((len(SIGMAS), len(test), N), bool) for m in METHODS}
    confusion = {}
    for si, sig in enumerate(SIGMAS):
        conf = {m: np.zeros((4, 4), int) for m in METHODS}
        for ci, cfg in enumerate(test):
            ti = LABELS4.index(cfg["truth"])
            for dr in range(N):
                rng = np.random.default_rng(hash((quad, si, ci, dr)) % 2 ** 31)
                F, L = fc.make_grid(cfg["M"], sigma=sig, quad=quad, rng=rng)
                got = {
                    "flow": fc.classify_flow(F, L, W_crit, **FLOW_KW)["label"],
                    "fd_plain": fc.classify_fd_plain(F, L)["label"],
                    "fd_lsq": fc.classify_fd_lsq(F, L, rho=0.5)["label"],
                    "fd_lsq_small": fc.classify_fd_lsq(F, L, rho=0.25)["label"],
                }
                for m in METHODS:
                    hits[m][si, ci, dr] = (got[m] == cfg["truth"])
                    if got[m] in LABELS4:
                        conf[m][ti, LABELS4.index(got[m])] += 1
        confusion[sig] = {m: conf[m].tolist() for m in METHODS}
        acc = {m: hits[m][si].mean() for m in METHODS}
        print(f"  [quad={quad}] sigma={sig:4.2f}   " +
              "   ".join(f"{m}={acc[m]:.3f}" for m in METHODS))
    return hits, confusion


def main(fast=False):
    N = 6 if fast else 25
    W_crit = calibrate_Wcrit()
    test = battery([(0.8, 0.3), (1.2, 0.5)], rot_seed=13)
    print(f"test battery: {len(test)} configs x {len(SIGMAS)} sigmas x {N} draws "
          f"x {len(LEGS)} legs (clean / curved field)")

    bmask = np.array([c["boundary"] for c in test])
    res = {"W_crit": W_crit, "sigmas": SIGMAS, "N": N, "n_configs": len(test),
           "labels4": LABELS4, "legs": {}}
    for leg, quad in LEGS:
        hits, confusion = run_leg(test, W_crit, quad, N)
        res["legs"][leg] = {
            "quad": quad,
            "accuracy": {m: [float(hits[m][si].mean()) for si in range(len(SIGMAS))]
                         for m in METHODS},
            "accuracy_boundary": {m: [float(hits[m][si, bmask].mean())
                                      for si in range(len(SIGMAS))] for m in METHODS},
            "confusion": {str(k): v for k, v in confusion.items()},
        }

    # ---- verdicts ---------------------------------------------------------------------
    acc0 = res["legs"]["clean"]["accuracy"]["flow"][0]
    print(f"\nH-R1 (recovery, sigma=0, clean): flow accuracy = {acc0:.3f} "
          f"({'CONFIRMED' if acc0 >= 0.9 else 'PARTIAL/REFUTED'})")
    res["verdict_H_R1"] = f"flow sigma=0 accuracy {acc0:.3f}"
    for leg, _ in LEGS:
        A = res["legs"][leg]["accuracy"]
        line = []
        for m in METHODS[1:]:
            wins = [SIGMAS[si] for si in range(len(SIGMAS))
                    if A["flow"][si] > A[m][si] + 1e-9]
            line.append(f"vs {m}: flow ahead at sigma in {wins if wins else 'NONE'}")
        print(f"H-R2 ({leg}): " + "; ".join(line))
        res[f"verdict_H_R2_{leg}"] = "; ".join(line)

    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "artifacts" / "r2_results.json").write_text(json.dumps(res, indent=2) + "\n")
    print("wrote artifacts/r2_results.json")

    # ---- figure -----------------------------------------------------------------------
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except Exception as e:                                    # pragma: no cover
        print("figure skipped:", e)
        return
    BLUE, ORANGE, GREY, GREEN = "#1565c0", "#e65100", "#5f6368", "#2e7d32"
    names = {"flow": ("integrated flow (SR)", ORANGE, "o-"),
             "fd_plain": ("finite difference", BLUE, "s--"),
             "fd_lsq": ("linear fit $\\rho$=0.5 (strong)", GREY, "d-."),
             "fd_lsq_small": ("linear fit $\\rho$=0.25", GREEN, "^:")}
    err = lambda a: 1.96 * np.sqrt(np.maximum(a * (1 - a), 1e-9) / (len(test) * N))

    fig, axes = plt.subplots(2, 2, figsize=(9.4, 7.4), dpi=150)
    panels = ((axes[0, 0], "clean", "accuracy", "A · exactly linear field — all nulls"),
              (axes[0, 1], "curved", "accuracy", "B · curved field (30% quadratic) — all nulls"),
              (axes[1, 0], "curved", "accuracy_boundary",
               "C · curved field, near the radial/spiral boundary"))
    for ax, leg, key, ttl in panels:
        for m in METHODS:
            a = np.array(res["legs"][leg][key][m])
            lab, col, st = names[m]
            ax.errorbar(SIGMAS, a, yerr=err(a), fmt=st, color=col, label=lab,
                        ms=4, lw=1.3, capsize=2.2)
        ax.axhline(0.25, color="0.75", lw=0.8, ls=":")
        ax.text(SIGMAS[-1], 0.26, "chance", fontsize=6.5, ha="right",
                va="bottom", color="0.5")
        ax.set_xlabel("field noise $\\sigma$ (rel. RMS $|B|$, info ball)", fontsize=8.5)
        ax.set_ylabel("4-class accuracy", fontsize=8.5)
        ax.set_title(ttl, fontsize=8.8)
        ax.set_ylim(0.0, 1.04)
        ax.tick_params(labelsize=7.5)
        ax.legend(fontsize=6.6, loc="lower left")

    ax = axes[1, 1]
    sK = 0.2
    C = np.array(res["legs"]["curved"]["confusion"][str(sK)]["flow"], float)
    C = C / np.maximum(C.sum(1, keepdims=True), 1)
    im = ax.imshow(C, cmap="Blues", vmin=0, vmax=1)
    ax.set_xticks(range(4), LABELS4, fontsize=7, rotation=45)
    ax.set_yticks(range(4), LABELS4, fontsize=7)
    ax.set_xlabel("flow classifier says", fontsize=8.5)
    ax.set_ylabel("truth", fontsize=8.5)
    ax.set_title(f"D · flow confusion, curved field, $\\sigma$ = {sK}", fontsize=8.8)
    for i in range(4):
        for j in range(4):
            ax.text(j, i, f"{C[i, j]:.2f}", ha="center", va="center", fontsize=7,
                    color="white" if C[i, j] > 0.6 else "#123")
    fig.colorbar(im, ax=ax, fraction=0.046).ax.tick_params(labelsize=6.5)
    fig.suptitle("R2 — classifying magnetic nulls under noise: integrate or differentiate?",
                 fontsize=10.5, fontweight="bold")
    fig.tight_layout(rect=[0, 0, 1, 0.95])
    out = REPO / "public/img/posts/forbidden-directions-r2-noise.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print(f"rendered {out.relative_to(REPO)}")


if __name__ == "__main__":
    main(fast="--fast" in sys.argv)
