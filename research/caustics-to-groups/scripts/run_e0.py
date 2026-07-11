#!/usr/bin/env python3
"""E0 - tangent-cone growth-vector recovery (metric M1, tests hypothesis H1).

Predictions (from the graded structure, to be confirmed or refuted):
  Heisenberg  weights (1,1,2)   -> growth vector (2,3),   Q=4
  SE(2)       weights (1,2,1)   -> growth vector (2,3),   Q=4   [same tangent cone]
  Engel       weights (1,1,2,3) -> growth vector (2,3,4), Q=7

H1: the growth vector is recovered stably from noisy, finite geodesic samples,
with accuracy rising in sample size and degrading gracefully in noise. Heisenberg
and SE(2) MUST be indistinguishable here (both (2,3)) - that is the pre-registered
aliasing, resolved only by the conjugate-locus moduli in E1.

Calibration choices (fixed, shared across groups): radii grid, momentum band,
reach quantile.
Every reported recovery rate is over independent trial seeds (held-out).

Usage: run_e0.py [--quick]
Results -> artifacts/e0_results.json
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import liegroup  # noqa: E402
import growth  # noqa: E402

QUICK = "--quick" in sys.argv
RADII = np.geomspace(0.15, 1.0, 6)
TRUTH = {"Heisenberg": (2, 3), "SE(2)": (2, 3), "Engel": (2, 3, 4)}
TRUTH_Q = {"Heisenberg": 4, "SE(2)": 4, "Engel": 7}
NAMES = ["Heisenberg", "SE(2)", "Engel"]
NOISES = [0.0, 1e-3, 1e-2, 3e-2, 1e-1, 3e-1]
NGEOS = [50, 100, 200, 400, 800]
N_TRIALS = 6 if QUICK else 15


def recovery_rate(name, n_geo, noise, n_trials):
    spec = liegroup.GROUPS[name]
    hits, qs = 0, []
    for trial in range(n_trials):
        rng = np.random.default_rng(1000 + trial)
        vec, Q, _ = growth.estimate_growth_vector(spec, RADII, n_geo, rng, noise)
        hits += int(vec == TRUTH[name])
        qs.append(Q)
    return hits / n_trials, float(np.mean(qs)), float(np.std(qs))


def main():
    results = {"radii": RADII.tolist(), "n_trials": N_TRIALS, "truth": TRUTH, "clean": {},
               "noise_sweep": {}, "sample_sweep": {}}

    # --- clean recovery + measured weights (noise 0, large sample)
    print("== E0: clean growth-vector recovery (noise=0, n_geo=800) ==")
    print(f"{'group':<12}{'weights (measured)':<26}{'vector':<10}{'Q':<4}{'truth':<10}")
    for name in NAMES:
        spec = liegroup.GROUPS[name]
        rng = np.random.default_rng(0)
        vec, Q, w = growth.estimate_growth_vector(spec, RADII, 800, rng, 0.0)
        wr = "(" + ",".join(f"{x:.2f}" for x in w) + ")"
        ok = "OK" if vec == TRUTH[name] else "MISMATCH"
        print(f"{name:<12}{wr:<26}{str(vec):<10}{Q:<4}{str(TRUTH[name]):<10}{ok}")
        results["clean"][name] = {"weights": w.tolist(), "vector": list(vec), "Q": Q}
        assert vec == TRUTH[name], f"{name}: clean recovery {vec} != {TRUTH[name]}"
        assert Q == TRUTH_Q[name]

    # aliasing: Heisenberg and SE(2) recovered as the same vector
    assert results["clean"]["Heisenberg"]["vector"] == results["clean"]["SE(2)"]["vector"], \
        "expected Heisenberg and SE(2) to alias at the growth-vector level"
    print("\n-> Heisenberg and SE(2) both recovered as (2,3): aliased under M1 "
          "(as pre-registered).")

    # --- noise sweep (fixed n_geo=400)
    print("\n== noise sweep: recovery rate over trials (n_geo=400) ==")
    hdr = "".join(f"{s:>9.0e}" if s else f"{'0':>9}" for s in NOISES)
    print(f"{'group':<12}{hdr}")
    for name in NAMES:
        row, store = [], {}
        for s in NOISES:
            rate, qm, qs = recovery_rate(name, 400, s, N_TRIALS)
            row.append(rate)
            store[f"{s:g}"] = {"recovery": rate, "Q_mean": qm, "Q_std": qs}
        results["noise_sweep"][name] = store
        print(f"{name:<12}" + "".join(f"{r:>9.2f}" for r in row))

    # --- sample-size sweep (fixed noise=1e-2)
    print("\n== sample-size sweep: recovery rate (noise=1e-2) ==")
    hdr = "".join(f"{n:>8d}" for n in NGEOS)
    print(f"{'group':<12}{hdr}")
    for name in NAMES:
        row, store = [], {}
        for n in NGEOS:
            rate, qm, qs = recovery_rate(name, n, 1e-2, N_TRIALS)
            row.append(rate)
            store[str(n)] = {"recovery": rate, "Q_mean": qm, "Q_std": qs}
        results["sample_sweep"][name] = store
        print(f"{name:<12}" + "".join(f"{r:>8.2f}" for r in row))

    out = ROOT / "artifacts" / "e0_results.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(results, indent=2) + "\n")
    print(f"\nwrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
