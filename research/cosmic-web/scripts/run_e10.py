#!/usr/bin/env python3
"""E10 (referee point 2, local part): truth convergence.

Step-doubling test on the PM truth: same ICs, 90 vs 180 KDK steps.
Reports (a) the truth's own convergence (median per-particle shift between
the two runs) and (b) the stability of the model-vs-ZA comparison when
evaluated against each truth. The grid axis is covered by E7/E7b (256^3
runs, advantage persists). External-simulation cross-check (Quijote)
remains open pending data download approval.
Report -> docs/E10-report.md.
"""
import json, sys, time
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src")); sys.path.insert(0, str(ROOT / "scripts"))
import fields, pm  # noqa: E402
from run_e5 import D_STEPS, N  # noqa: E402
from run_e8 import evolve  # noqa: E402

SEED = 4

def main():
    t0 = time.time()
    truths = {}
    for steps in (90, 180):
        rng = np.random.default_rng(SEED)
        x, v, tidx, ta, tpos, q_tr, psi_tr = pm.pm_sim(
            N, 128.0, rng, n_steps=steps, track=50000)
        truths[steps] = tpos[-1].astype(float)
    d = truths[180] - truths[90]
    d -= N * np.round(d / N)
    conv = float(np.median(np.linalg.norm(d, axis=1)))

    seedseq = np.random.default_rng(SEED).integers(0, 2 ** 32)
    _, pos_q = fields.zeldovich_box(N, 128.0, 0.0, np.random.default_rng(seedseq))
    _, pos_d = fields.zeldovich_box(N, 128.0, 1.0, np.random.default_rng(seedseq))
    psi_full = pos_d - pos_q
    psi_full -= N * np.round(psi_full / N)
    xz = ((pos_q + D_STEPS[-1] * psi_full) % N)[tidx]
    xm = evolve(pos_q, psi_full, "damp")[tidx]

    lines = [f"truth self-convergence (90 vs 180 steps): median shift {conv:.3f} vox"]
    for steps, truth in truths.items():
        errs = {}
        for name, xmod in (("za", xz), ("damp", xm)):
            e = xmod - truth; e -= N * np.round(e / N)
            errs[name] = float(np.median(np.linalg.norm(e, axis=1)))
        lines.append(f"vs truth({steps} steps): ZA {errs['za']:.3f}, damp "
                     f"{errs['damp']:.3f}, advantage "
                     f"{100*(errs['damp']-errs['za'])/errs['za']:+.1f}%")
    md = ["# E10 — truth convergence (step doubling)\n", ""] + \
         [f"- {l}" for l in lines] + \
         ["", "Grid-axis convergence: covered by E7/E7b (256³ truths; "
          "advantage persists at −9% to −12%). External-simulation "
          "cross-check (Quijote snapshot) remains open pending download "
          "approval.", ""]
    (ROOT / "docs" / "E10-report.md").write_text("\n".join(md))
    (ROOT / "artifacts" / "e10_results.json").write_text(json.dumps(
        {"conv_vox": conv, "lines": lines}, indent=1))
    print("\n".join(lines))
    print(f"total {time.time()-t0:.0f}s")

if __name__ == "__main__":
    main()
