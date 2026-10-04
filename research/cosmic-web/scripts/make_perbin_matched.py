#!/usr/bin/env python3
"""Per-bin transport error on ONE matched seed set (held-out seeds 4-6).

Recomputed from existing artifacts only (no simulation): Zel'dovich (ZA) and
the oracle-frame bound from E5b, the beta=0.75 stage model from E5c
validation, the frozen model (beta=0.6, 2 h^-1 Mpc frames) overall from E5d
and at the web from E6. Quantity: median transport error in voxels
(1 voxel = 1 h^-1 Mpc); mean over the three seeds, sem = std(ddof=1)/sqrt(3).
gap_closed = (ZA - frozen) / (ZA - oracle), all on seeds 4-6.
Feeds the per-bin figure in Part 2 and the MODEL-CARD per-segment table.
-> artifacts/e5_perbin_seeds4-6.json
"""
import json
from pathlib import Path
import numpy as np

ART = Path(__file__).resolve().parents[1] / "artifacts"
SEEDS, BINS = (4, 5, 6), ("0_2", "2_4", "4_8", "8_64", "all")
load = lambda n: json.load(open(ART / f"{n}_results.json"))
ms = lambda v: {"mean": float(np.mean(v)), "sem": float(np.std(v, ddof=1) / np.sqrt(len(v)))}

e5b = [r for r in load("e5b") if r["seed"] in SEEDS]
e5c = [r for r in load("e5c")["validation"] if r["seed"] in SEEDS]
e5d = [r for r in load("e5d")["validation"] if r["seed"] in SEEDS]
e6 = [r for r in load("e6") if r["cond"] == "base" and r["seed"] in SEEDS]
assert len(e5b) == len(e5c) == len(e5d) == len(e6) == 3

out = {"seeds": list(SEEDS), "unit": "median transport error, voxels (1 h^-1 Mpc)",
       "za": {b: ms([r[f"za_err_{b}"] for r in e5b]) for b in BINS},
       "oracle": {b: ms([r[f"damp_oracle_err_{b}"] for r in e5b]) for b in BINS},
       "model_b075_e5c": {b: ms([r[f"C_self_b075_r5_{b}"] for r in e5c]) for b in BINS},
       "model_frozen_e5d": {"all": ms([r["b0.6_s2_all"] for r in e5d]),
                            "0_2": ms([r["model_web"] for r in e6])}}
za, orc, mod = (out[k]["all"]["mean"] for k in ("za", "oracle", "model_frozen_e5d"))
out["gap_closed_frozen_all"] = (za - mod) / (za - orc)
assert 0.85 < out["gap_closed_frozen_all"] < 0.87  # matched-seed value, 86%
json.dump(out, open(ART / "e5_perbin_seeds4-6.json", "w"), indent=1)
for k in ("za", "model_b075_e5c", "oracle", "model_frozen_e5d"):
    print(k, {b: round(v["mean"], 2) for b, v in out[k].items()})
print("gap closed (frozen, seeds 4-6):", round(out["gap_closed_frozen_all"], 3))
