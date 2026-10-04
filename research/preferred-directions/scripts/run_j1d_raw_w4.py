#!/usr/bin/env python3
"""J1d -- the NON-CIRCULAR growth-vector reading at Jupiter (referee fix, WP8).

Part 8's Q = 6 values were computed on the nulls' tangent cones (a
consistency check of the law given the measured Jacobian -- the referee's
M1). This experiment removes the circularity for the fourth world: the
flux-reach exponent w4(r) is measured on the FULL JRM33 field itself,
through the exact closed-form toroidal vector potential of the internal
harmonics (jupfield.A_cart, golden-checked curl A = B), with no Jacobian
input anywhere. The field is analytic (no grid floor), so the reading can
probe arbitrarily small radii around the located nulls.

Prediction: w4(r) -> 3 (the k = 1 weight) at both envelope nulls at radii
below their structure scale, and -> 2 at a generic control point.

Out: artifacts/j1d_raw_w4.json.
"""
import json
import sys
import time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))

import jupfield             # noqa: E402
import mfield3d as m3       # noqa: E402
import bifurcation as bif   # noqa: E402


def main():
    t0 = time.time()
    jf = jupfield.JupiterField("jrm33", lmax=18)
    st = m3.MagneticStructure3D(jf.A_cart, "JRM33 (exact toroidal A)")
    d = json.loads((ROOT / "artifacts" / "j1_jupiter.json").read_text())
    rng = np.random.default_rng(7)
    radii = np.geomspace(0.003, 0.06, 6)
    out = {"radii_RJ": radii.tolist(), "curves": {}}

    for k, nl in enumerate(d["models"]["jrm33_l18"]["nulls"]):
        p = np.array(nl["p"], float)
        q0 = np.array([p[0], p[1], p[2], 0.0])
        curve = bif.flux_exponent_curve(st, q0, radii, 1600, rng)
        out["curves"][f"null{k}_lat{nl['lat']:+.0f}"] = np.round(curve, 3).tolist()
        print(f"null {k} (lat {nl['lat']:+.1f}, r={nl['r']}): w4(r) = "
              f"{np.round(curve, 2).tolist()}  [{time.time() - t0:.0f} s]")

    # generic control: same shell, away from both nulls
    ctrl = np.array([0.6, -0.4, 0.5])
    ctrl = ctrl / np.linalg.norm(ctrl) * 0.9
    curve = bif.flux_exponent_curve(st, [*ctrl, 0.0], radii, 1600, rng)
    out["curves"]["generic_control"] = np.round(curve, 3).tolist()
    print(f"generic control (r=0.9): w4(r) = {np.round(curve, 2).tolist()}  "
          f"[{time.time() - t0:.0f} s]")

    (ROOT / "artifacts" / "j1d_raw_w4.json").write_text(
        json.dumps(out, indent=1) + "\n")
    print("saved artifacts/j1d_raw_w4.json")


if __name__ == "__main__":
    main()
