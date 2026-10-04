#!/usr/bin/env python3
"""E2 - rigidity / aliasing map and the abnormal-stratum leg (tests H3, exercises M4).

Which fingerprint components separate each pair of candidate groups, and which
pairs collapse if a component is removed? Plus: is the coarse abnormal bit (M4)
more noise-robust than the full growth vector, since it asks a coarser question?

Pre-registered expectations:
  * Heisenberg vs SE(2): same growth vector (2,3), same abnormal bit (none) ->
    separated ONLY by the nilpotent deviation delta. Drop delta and they alias.
  * Engel vs Cartan: differ in growth vector, but BOTH have abnormals ->
    separated ONLY by the growth vector. Drop M1 and they alias.
  * every other pair: separated by the growth vector (and by the abnormal bit).
  * no pair is fully aliased under the complete kit.

Usage: run_e2.py [--quick]
Results -> artifacts/e2_results.json
"""
import json
import sys
from itertools import combinations
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import liegroup  # noqa: E402
import growth  # noqa: E402
import fingerprint as fp  # noqa: E402

QUICK = "--quick" in sys.argv
GROUPS = ["Heisenberg", "SE(2)", "Engel", "Cartan"]
RADII = fp.RADII
N_GEO = 400
N_TRIALS = 8 if QUICK else 20
NOISES = [1e-3, 1e-2, 3e-2, 1e-1]
DELTA_MARGIN = 0.03


def clean_observables():
    """Growth vector, mean delta (nan if not (2,3)), abnormal bit -- clean data."""
    curves = fp.cache_deviation_curves()
    obs = {}
    for g in GROUPS:
        spec = liegroup.GROUPS[g]
        vec, Q, _ = growth.estimate_growth_vector(spec, RADII, 800,
                                                  np.random.default_rng(0), 0.0)
        corank, abn = growth.estimate_corank_abnormal(spec, RADII, 800,
                                                     np.random.default_rng(0), 0.0)
        delta = float(np.nanmean(curves[g])) if vec == (2, 3) else float("nan")
        obs[g] = {"growth": vec, "Q": Q, "delta": delta, "corank": corank,
                  "abnormal": abn}
    return obs, curves


def separators(a, b, obs):
    """Which single observables separate groups a, b (clean)."""
    seps = []
    if obs[a]["growth"] != obs[b]["growth"]:
        seps.append("growth")
    da, db = obs[a]["delta"], obs[b]["delta"]
    if not (np.isnan(da) or np.isnan(db)) and abs(da - db) > DELTA_MARGIN:
        seps.append("delta")
    if obs[a]["abnormal"] != obs[b]["abnormal"]:
        seps.append("abnormal")
    return seps


def main():
    obs, curves = clean_observables()
    print("== clean observables ==")
    for g in GROUPS:
        o = obs[g]
        d = "  n/a" if np.isnan(o["delta"]) else f"{o['delta']:.3f}"
        print(f"  {g:<11} growth={str(o['growth']):<10} delta={d:<7} "
              f"corank={o['corank']} abnormal={o['abnormal']}")

    # --- aliasing map
    print("\n== aliasing map: minimal separating observable(s) per pair ==")
    amap = {}
    for a, b in combinations(GROUPS, 2):
        seps = separators(a, b, obs)
        amap[f"{a} vs {b}"] = seps
        tag = "+".join(seps) if seps else "ALIASED (none in kit)"
        note = ""
        if seps == ["delta"]:
            note = "  <- collapses without delta"
        elif seps == ["growth"]:
            note = "  <- collapses without M1 growth vector"
        print(f"  {a:<11} vs {b:<9} : {tag}{note}")

    assert amap["Heisenberg vs SE(2)"] == ["delta"], "H/SE2 should separate only by delta"
    assert amap["Engel vs Cartan"] == ["growth"], "Engel/Cartan should separate only by growth"
    assert all(len(s) >= 1 for s in amap.values()), "a pair is fully aliased"

    # --- rigidity under noise: the two load-bearing single-observable pairs
    print("\n== rigidity under noise: separation rate of the load-bearing pairs ==")
    print(f"{'pair (via)':<26}" + "".join(f"{n:>9.0e}" if n else f"{'0':>9}" for n in NOISES))
    rigidity = {}

    # Heisenberg vs SE(2), via delta (classifier gets both right)
    tau, _, _ = 0.071, 0, 0
    hs_rates = []
    for noise in NOISES:
        ok = 0
        for i in range(N_TRIALS):
            rh = np.random.default_rng(300 + i)
            rs = np.random.default_rng(600 + i)
            ph = fp.classify(liegroup.GROUPS["Heisenberg"], rh, N_GEO, noise, 0.05, tau, curves)
            ps = fp.classify(liegroup.GROUPS["SE(2)"], rs, N_GEO, noise, 0.05, tau, curves)
            ok += int(ph == "Heisenberg" and ps == "SE(2)")
        hs_rates.append(ok / N_TRIALS)
    rigidity["Heisenberg/SE(2) via delta"] = hs_rates
    print(f"{'Heisenberg/SE(2) (delta)':<26}" + "".join(f"{r:>9.2f}" for r in hs_rates))

    # Engel vs Cartan, via growth vector
    ec_rates = []
    for noise in NOISES:
        ok = 0
        for i in range(N_TRIALS):
            re = np.random.default_rng(400 + i)
            rc = np.random.default_rng(500 + i)
            ve, _, _ = growth.estimate_growth_vector(liegroup.GROUPS["Engel"], RADII, N_GEO, re, noise)
            vc, _, _ = growth.estimate_growth_vector(liegroup.GROUPS["Cartan"], RADII, N_GEO, rc, noise)
            ok += int(ve == (2, 3, 4) and vc == (2, 3, 5))
        ec_rates.append(ok / N_TRIALS)
    rigidity["Engel/Cartan via growth"] = ec_rates
    print(f"{'Engel/Cartan (growth)':<26}" + "".join(f"{r:>9.2f}" for r in ec_rates))

    # --- M4 vs M1 robustness: does the coarse abnormal bit survive better?
    print("\n== abnormal bit (M4) vs full growth vector (M1): correct-recovery rate ==")
    print(f"{'group / metric':<26}" + "".join(f"{n:>9.0e}" if n else f"{'0':>9}" for n in NOISES))
    m4_vs_m1 = {}
    for g in ["Engel", "Cartan"]:
        spec = liegroup.GROUPS[g]
        truth_vec = obs[g]["growth"]
        m1r, m4r = [], []
        for noise in NOISES:
            c1 = c4 = 0
            for i in range(N_TRIALS):
                r = np.random.default_rng(800 + i)
                vec, _, _ = growth.estimate_growth_vector(spec, RADII, N_GEO, r, noise)
                r2 = np.random.default_rng(800 + i)
                _, abn = growth.estimate_corank_abnormal(spec, RADII, N_GEO, r2, noise)
                c1 += int(vec == truth_vec)
                c4 += int(abn is True)     # truth: Engel/Cartan have abnormals
            m1r.append(c1 / N_TRIALS)
            m4r.append(c4 / N_TRIALS)
        m4_vs_m1[g] = {"M1": m1r, "M4": m4r}
        print(f"{g + ' (M1 growth)':<26}" + "".join(f"{r:>9.2f}" for r in m1r))
        print(f"{g + ' (M4 abnormal)':<26}" + "".join(f"{r:>9.2f}" for r in m4r))

    results = {"observables": obs, "aliasing_map": amap, "noises": NOISES,
               "rigidity": rigidity, "m4_vs_m1": m4_vs_m1, "delta_margin": DELTA_MARGIN}
    out = ROOT / "artifacts" / "e2_results.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(results, indent=2, default=str) + "\n")
    print(f"\nwrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
