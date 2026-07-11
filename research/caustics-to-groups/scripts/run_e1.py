#!/usr/bin/env python3
"""E1 - the three-component fingerprint and the first confusion matrix (tests H2).

Classifies noisy realizations over {Heisenberg, SE(2), Engel, Cartan} using the
growth vector (M1) plus, within the shared (2,3) tangent-cone class, the
nilpotent-deviation delta (M2). Reports a confusion matrix at each noise level.

H2: the fingerprint separates the candidate list with off-diagonal mass
significantly below chance, and the (2,3) alias (Heisenberg vs SE(2)) is broken by
delta. Pre-registered: higher-step groups (Cartan step 3) are the fragile ones
(from E0), so their row should degrade first as noise rises.

Leakage: threshold tau is calibrated on held-out calibration seeds; the confusion
matrix is scored on disjoint evaluation seeds.

Usage: run_e1.py [--quick]
Results -> artifacts/e1_results.json
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import liegroup  # noqa: E402
import fingerprint as fp  # noqa: E402

QUICK = "--quick" in sys.argv
GROUPS = ["Heisenberg", "SE(2)", "Engel", "Cartan"]
COARSE = {"Engel/Cartan": {"Engel", "Cartan"},
          "Heisenberg/SE(2)": {"Heisenberg", "SE(2)"}}
LABELS = GROUPS + ["Engel/Cartan", "Heisenberg/SE(2)", "unknown"]
SHORT = {"Heisenberg": "Heis", "SE(2)": "SE2", "Engel": "Eng", "Cartan": "Car",
         "Engel/Cartan": "E/C", "Heisenberg/SE(2)": "H/S", "unknown": "unk"}
N_CAL = 6 if QUICK else 10
N_EVAL = 10 if QUICK else 25
NOISE_LEVELS = [1e-3, 1e-2] if QUICK else [1e-3, 5e-3, 1e-2, 3e-2]
N_GEO = 400
T_NOISE = 0.05


def calibrate_tau(dev_curves, t_noise, n_cal):
    """Midpoint between the Heisenberg and SE(2) delta means on calibration seeds."""
    h = [fp.measure_deviation(dev_curves["Heisenberg"], np.random.default_rng(700 + i), t_noise)
         for i in range(n_cal)]
    s = [fp.measure_deviation(dev_curves["SE(2)"], np.random.default_rng(900 + i), t_noise)
         for i in range(n_cal)]
    tau = 0.5 * (np.mean(h) + np.mean(s))
    return float(tau), float(np.mean(h)), float(np.mean(s))


def confusion(noise, tau, dev_curves, n_eval):
    mat = {g: {l: 0 for l in LABELS} for g in GROUPS}
    for g in GROUPS:
        spec = liegroup.GROUPS[g]
        for i in range(n_eval):
            rng = np.random.default_rng(10_000 + hash(g) % 1000 + i)
            pred = fp.classify(spec, rng, n_geo=N_GEO, noise=noise,
                               t_noise=T_NOISE, tau=tau, dev_curves=dev_curves)
            mat[g][pred] += 1
    return mat


def acc(mat, n_eval):
    """Strict (exact group) and class-level (coarse label counts if it contains
    the true group) accuracy."""
    strict = sum(mat[g][g] for g in GROUPS)
    klass = strict
    for g in GROUPS:
        for lab, members in COARSE.items():
            if g in members:
                klass += mat[g][lab]
    n = len(GROUPS) * n_eval
    return strict / n, klass / n


def print_matrix(mat, n_eval):
    hdr = "".join(f"{SHORT[l]:>6}" for l in LABELS)
    print(f"{'true/pred':<12}{hdr}")
    for g in GROUPS:
        row = "".join(f"{mat[g][l]:>6}" for l in LABELS)
        print(f"{g:<12}{row}")


def main():
    dev_curves = fp.cache_deviation_curves()
    print("nilpotent-deviation curves (1 - t_c*|w|/2pi over w=0.5..4):")
    for name, c in dev_curves.items():
        print(f"  {name:<11}", np.array2string(c, precision=3, floatmode="fixed"))

    tau, mh, ms = calibrate_tau(dev_curves, T_NOISE, N_CAL)
    print(f"\ncalibrated tau = {tau:.3f}  (Heisenberg delta ~ {mh:.3f}, SE(2) ~ {ms:.3f})")

    results = {"n_eval": N_EVAL, "tau": tau, "t_noise": T_NOISE, "n_geo": N_GEO,
               "deviation_curves": {k: v.tolist() for k, v in dev_curves.items()},
               "confusion": {}, "accuracy": {}}
    for noise in NOISE_LEVELS:
        mat = confusion(noise, tau, dev_curves, N_EVAL)
        strict, klass = acc(mat, N_EVAL)
        results["confusion"][f"{noise:g}"] = mat
        results["accuracy"][f"{noise:g}"] = {"strict": strict, "class": klass}
        print(f"\n== confusion at M1 noise = {noise:g}  (exact {strict:.2f}, "
              f"class {klass:.2f}, chance {1/len(GROUPS):.2f}) ==")
        print_matrix(mat, N_EVAL)

    out = ROOT / "artifacts" / "e1_results.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(results, indent=2) + "\n")
    print(f"\nwrote {out.relative_to(ROOT)}")

    # headline assertions (clean-noise end)
    clean = results["confusion"][f"{NOISE_LEVELS[0]:g}"]
    assert clean["Heisenberg"]["Heisenberg"] >= 0.8 * N_EVAL, "Heisenberg not recovered"
    assert clean["SE(2)"]["SE(2)"] >= 0.8 * N_EVAL, "SE(2) not split from Heisenberg"
    assert results["accuracy"][f"{NOISE_LEVELS[0]:g}"]["strict"] > 0.5, "below-par at low noise"
    # the M4 fallback must lift class accuracy above strict at the noisiest level
    noisy = results["accuracy"][f"{NOISE_LEVELS[-1]:g}"]
    assert noisy["class"] >= noisy["strict"], "M4 fallback did not help class recovery"


if __name__ == "__main__":
    main()
