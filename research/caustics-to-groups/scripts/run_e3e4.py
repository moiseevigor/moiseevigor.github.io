#!/usr/bin/env python3
"""E4 - the cosmic-web stress test: calibrated silence (tests H4, the "no" half).

A left-invariant group has ONE tangent cone at every point (homogeneity). An
*effective* flow -- the cosmic web, an adhesion/Zel'dovich field -- does not: its
caustic skeleton is sheets, filaments and nodes, i.e. a FIELD of different local
structures. Part 1's honest-scope claim is that the detector must then ABSTAIN
from a single global group label, reporting a field of tangent cones instead.

This test makes that concrete. We estimate the growth vector at many base points:
  * genuine group  -> the same vector everywhere -> confident global label;
  * effective flow -> the vector varies point to point -> ABSTAIN.

The effective flow is modelled as a field whose local tangent cone is drawn from
{contact (2,3), Engel (2,3,4), Cartan (2,3,5)} -- the analogue of sheet / filament
/ node having different local dimensionality. This is offline and uses only
validated structures; wiring a real caustic-skeleton adapter (Feldbrugge-style
shell-crossing surfaces) is the remaining real-data step.

H4 (no half): a confident group label on the effective flow would be a FAILURE
(the method fitting ADE universals, not geometry). Correct behaviour is silence.

Usage: run_e3e4.py [--quick]
Results -> artifacts/e3e4_results.json
"""
import json
import sys
from collections import Counter
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import liegroup  # noqa: E402
import growth  # noqa: E402

QUICK = "--quick" in sys.argv
RADII = np.geomspace(0.15, 1.0, 6)
K = 12 if QUICK else 30            # base points sampled across the field
N_GEO = 900                        # (3,6) SE(3) needs more geodesics than the 3D groups
NOISE = 3e-3                        # mild per-point measurement noise
CONSISTENCY = 0.9                   # >= this fraction agreeing -> "homogeneous"
VEC_CLASS = {(2, 3): "contact (Heisenberg/SE(2))", (2, 3, 4): "Engel",
             (2, 3, 5): "Cartan", (3, 6): "SE(3)-class (rank-3)"}


def scan(structures, seed0):
    """Estimate the growth vector at each base point's local structure."""
    vecs = []
    for i, spec in enumerate(structures):
        rng = np.random.default_rng(seed0 + i)
        vec, _, _ = growth.estimate_growth_vector(spec, RADII, N_GEO, rng, NOISE)
        vecs.append(vec)
    return vecs


def verdict(vecs):
    counts = Counter(vecs)
    top, n = counts.most_common(1)[0]
    frac = n / len(vecs)
    if frac >= CONSISTENCY:
        return "CONFIDENT", VEC_CLASS.get(top, str(top)), frac, counts
    return "ABSTAIN", "field of varying tangent cones", frac, counts


def main():
    G = liegroup.GROUPS
    scenarios = {
        "genuine Heisenberg (homogeneous group)": [G["Heisenberg"]] * K,
        "genuine Engel (homogeneous group)": [G["Engel"]] * K,
        "genuine SE(3) (DW-MRI-like, homogeneous)": [G["SE(3)-cone"]] * K,
        "effective flow (sheets/filaments/nodes)":
            list(np.random.default_rng(0).choice(
                [G["Heisenberg"], G["Engel"], G["Cartan"]],
                size=K, p=[0.45, 0.35, 0.20])),
    }

    results = {"K": K, "noise": NOISE, "consistency_threshold": CONSISTENCY,
               "scenarios": {}}
    print("== E4: homogeneity / abstention scan (growth vector at K base points) ==\n")
    for name, structs in scenarios.items():
        vecs = scan(structs, seed0=2000)
        verd, label, frac, counts = verdict(vecs)
        dist = {str(k): v for k, v in counts.items()}
        results["scenarios"][name] = {"verdict": verd, "label": label,
                                      "top_fraction": frac, "distribution": dist}
        print(f"{name}")
        print(f"   growth vectors seen: {dist}")
        print(f"   -> {verd}: {label}  (top vector {frac:.0%})\n")

    # H4 (no half): genuine groups confident & correct; effective flow abstains.
    r = results["scenarios"]
    assert r["genuine Heisenberg (homogeneous group)"]["verdict"] == "CONFIDENT"
    assert r["genuine Engel (homogeneous group)"]["verdict"] == "CONFIDENT"
    assert r["genuine Engel (homogeneous group)"]["label"] == "Engel"
    assert r["genuine SE(3) (DW-MRI-like, homogeneous)"]["verdict"] == "CONFIDENT", \
        "SE(3)-structured field should be confidently labelled (H4 yes-half mechanism)"
    assert r["effective flow (sheets/filaments/nodes)"]["verdict"] == "ABSTAIN", \
        "method must stay silent on the non-homogeneous effective flow"
    print("H4 confirmed: confident on genuine groups incl. SE(3) (yes-half mechanism), "
          "silent on the effective flow (no-half, calibrated silence).")

    out = ROOT / "artifacts" / "e3e4_results.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(results, indent=2) + "\n")
    print(f"\nwrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
