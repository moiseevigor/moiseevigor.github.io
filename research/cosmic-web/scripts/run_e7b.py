#!/usr/bin/env python3
"""E7b: two more high-res seeds to convert the 0.5 Mpc row from n=1 to n=3."""
import json, sys
from multiprocessing import Pool
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts")); sys.path.insert(0, str(ROOT / "src"))
from run_e7 import run_job

JOBS = [dict(name=f"hires_s{s}", N=256, L=128.0, omega_m=1.0, seed=s)
        for s in (5, 6)]

if __name__ == "__main__":
    with Pool(2) as pool:
        recs = pool.map(run_job, JOBS)
    (ROOT / "artifacts" / "e7b_results.json").write_text(json.dumps(recs, indent=1))
    for r in recs:
        print(r["name"], "ZA", r["za_all"], "model", r["model_all"])
