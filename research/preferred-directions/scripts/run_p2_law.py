#!/usr/bin/env python3
"""P2 - the 3D law Q = k + 5, and null detection by the growth vector.

docs/PROGRAM.md Phase 2 (part 1). Confirms the charter's one untested prediction:
in d = 3 the flux lift has frame X_i = d/dx_i + A_i d/dphi, growth vector (3,4) where
B = curl A is nonzero, so

    Q = 1*3 + 2*(4-3) = 5 = d + k + 2   (k = 0).

At a magnetic null B vanishes; a generic (linear) null has k = 1, so the flux weight is
k+2 = 3 and Q = 6. The growth vector therefore jumps 5 -> 6 exactly on the null set.

The finer null TYPE (proper/improper/spiral) lives in the eigenvalues of grad B -- the
standard classifier -- which the growth vector does NOT see (every linear null is k=1).
So on the growth-vector leg the SR method AGREES with "where does B vanish, to what
order" and does not refine the eigenvalue type. Whether the MODULI carry the type is
the open Phase-2 question (P1 showed the 2D moduli read grad B).

Usage: run_p2_law.py [--quick]
Results -> artifacts/p2_results.json
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))

import mfield3d as m3  # noqa: E402

QUICK = "--quick" in sys.argv
RADII = np.geomspace(0.02, 0.20, 7)
NP = 3000 if QUICK else 5000


def report(struct, q0, n, rng, expect):
    w, Q = struct.weights_Q(q0, RADII, n, rng)
    ws = "(" + ",".join(f"{x:.2f}" for x in w) + ")"
    ok = "OK" if Q == expect else f"<-- expected {expect}"
    print(f"  {ws:<24} Q={Q}  {ok}")
    return {"weights": w.tolist(), "Q": Q}


def main():
    rng = np.random.default_rng(0)
    res = {"radii": RADII.tolist(), "law": "Q = d + k + 2, d=3 => Q = k+5"}

    print("== uniform Bz : contact everywhere, Q = 5 ==")
    res["uniform"] = report(m3.uniform3d(1.0), [0, 0, 0, 0], NP, rng, 5)

    print("\n== proper linear null  B = (x, y, -2z) ==")
    nul = m3.linear_null()
    gb = nul.grad_B([0, 0, 0])
    ev = np.linalg.eigvals(gb)
    print(f"  grad B at null, eigenvalues = {np.round(ev.real,3)}  "
          f"(all real => proper/radial null)")
    res["null_grad_B_eigs"] = [float(e.real) for e in ev]

    print("  generic point (B != 0):")
    res["null_generic"] = report(nul, [0.7, 0.3, -0.4, 0], NP, rng, 5)
    print("  AT the null (B = 0):")
    res["null_at"] = report(nul, [0, 0, 0, 0], NP + 2000, rng, 6)

    assert res["uniform"]["Q"] == 5
    assert res["null_generic"]["Q"] == 5
    assert res["null_at"]["Q"] == 6, "growth vector must jump to 6 at a linear null"

    # ---- a null-detection profile: Q along a line crossing the null
    print("\n== Q along a line through the null (x-axis) ==")
    xs = np.array([-0.6, -0.3, -0.12, 0.0, 0.12, 0.3, 0.6])
    prof = []
    for x in xs:
        _, Q = nul.weights_Q([x, 0.0, 0.0, 0.0], RADII, NP, np.random.default_rng(7))
        prof.append(Q)
        print(f"  x={x:+.2f}  Q={Q}")
    res["profile_x"] = {"x": xs.tolist(), "Q": prof}
    # Q is elevated only within a small neighbourhood of the null (measure-zero set,
    # blurred by the finite smallest radius)
    assert prof[3] == 6 and prof[0] == 5 and prof[-1] == 5, "null profile wrong"
    print("  -> Q = 6 marks the null; Q = 5 away from it. The growth vector locates nulls.")

    out = ROOT / "artifacts" / "p2_results.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(res, indent=2) + "\n")
    print(f"\nwrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
