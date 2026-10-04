#!/usr/bin/env python3
"""R1 -- baseline classification + the first detection gallery across all null types.

Builds synthetic nulls of every type with KNOWN ground truth (nullfields.linear_null) in
generic (rotated) frames, runs the sub-Riemannian growth-vector detector on each -- checking
that Q = 6 (the null jump) fires for radial AND spiral nulls, not just the ABC-field spirals
of Phase 2 -- and classifies each with the standard eigenvalue scheme (nulltopo). It renders a
gallery: each null's fan-plane field topology (X for radial, O for spiral), its Parnell label,
and its measured Q. The real SDO/HMI null (its measured Jacobian) anchors the panel.

Result the gallery makes visible and honest: the detector is TYPE-AGNOSTIC -- Q = 6 at every
null regardless of type -- so radial vs spiral must come from the flow topology, not Q. That
motivates R2 (the SR classifier + its noise-robustness test).

Reproduce: ../cosmic-web/.venv/bin/python scripts/run_r1_gallery.py
Output: artifacts/r1_gallery.json, public/img/posts/forbidden-directions-null-gallery.png
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))

import nulltopo          # noqa: E402
import nullfields as nf  # noqa: E402


def fan_basis(spine):
    """Orthonormal (u, v) spanning the fan plane (perpendicular to the spine)."""
    spine = np.asarray(spine, float)
    spine = spine / np.linalg.norm(spine)
    seed = np.array([1.0, 0.0, 0.0]) if abs(spine[0]) < 0.9 else np.array([0.0, 1.0, 0.0])
    u = seed - (seed @ spine) * spine
    u /= np.linalg.norm(u)
    v = np.cross(spine, u)
    return u, v


def detector_Q(struct, rng, n=4000):
    radii = np.geomspace(0.02, 0.2, 7)
    _, Q = struct.weights_Q([0, 0, 0, 0], radii, n, rng)
    return int(Q)


def main():
    rng = np.random.default_rng(1)
    R1 = nf.rot_from_axis_angle([0.3, 1.0, 0.5], 0.6)
    R2 = nf.rot_from_axis_angle([1.0, 0.2, 0.7], 1.1)
    R3 = nf.rot_from_axis_angle([0.4, 0.4, 1.0], 0.9)

    ev_real = np.array([-0.763, -0.237, 1.0])          # measured HMI null (run_p2_solar)
    battery = [
        ("radial+", "synthetic", nf.linear_null(-1.0, -1.0, 0.0, rot=R1)),
        ("radial-", "synthetic", nf.linear_null(1.0, 1.0, 0.0, rot=R2)),
        ("spiral+", "synthetic", nf.linear_null(-0.5, -0.5, 1.2, rot=R3)),
        ("spiral-", "synthetic", nf.linear_null(0.5, 0.5, 1.2, rot=R1)),
        ("real",    "SDO/HMI 2011-06-07",
         nf.linear_null(float(ev_real[0]), float(ev_real[1]), 0.0)),
    ]

    rows = []
    for tag, origin, d in battery:
        cls = nulltopo.classify_null(d["M"])
        Q = detector_Q(d["struct"], rng)
        rows.append({"tag": tag, "origin": origin, "d": d, "cls": cls, "Q": Q})
        ev = np.round(np.real_if_close(cls["eigs"], tol=1e6), 3)
        print(f"  {tag:8s} [{origin:20s}]  standard={cls['label']:8s}  "
              f"J||={cls['J_parallel']:+.2f}  SR growth vector Q={Q}  eigs={ev}")

    detected = sum(r["Q"] == 6 for r in rows)
    print(f"\ndetection recall (Q=6 at the null): {detected}/{len(rows)}")

    # --- gallery figure -----------------------------------------------------------------
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except Exception as e:                              # pragma: no cover
        print("figure skipped (no matplotlib):", e)
    else:
        BLUE, ORANGE = "#1565c0", "#e65100"
        fig, axes = plt.subplots(2, 3, figsize=(10.5, 7.0), dpi=150)
        axes = axes.ravel()
        g = np.linspace(-1.0, 1.0, 26)
        AA, BB = np.meshgrid(g, g)                      # AA = fan-u coord, BB = fan-v coord
        for ax, r in zip(axes, rows):
            cls, M = r["cls"], r["d"]["M"]
            u, v = fan_basis(cls["spine"])
            P = AA[..., None] * u + BB[..., None] * v   # (n,n,3) points in the fan plane
            Bvec = P.reshape(-1, 3) @ M.T
            Bu = (Bvec @ u).reshape(AA.shape)
            Bv = (Bvec @ v).reshape(AA.shape)
            spd = np.hypot(Bu, Bv)
            spiral = cls["type"] == "spiral"
            col = ORANGE if spiral else BLUE
            ax.streamplot(g, g, Bu, Bv, color=col, density=1.1, linewidth=0.7,
                          arrowsize=0.8)
            ax.plot(0, 0, marker="*", ms=17, mfc="#ffd000", mec="k", mew=1.1, zorder=5)
            ax.set_xlim(-1, 1); ax.set_ylim(-1, 1); ax.set_aspect("equal")
            ax.set_xticks([]); ax.set_yticks([])
            shape = "O-type (spiral)" if spiral else "X-type (radial)"
            ax.set_title(f"{cls['label']}   ·   Q = {r['Q']}", fontsize=10,
                         color=col, fontweight="bold")
            ax.text(0.5, -0.10, f"{r['origin']} — {shape}", transform=ax.transAxes,
                    ha="center", va="top", fontsize=7.6, color="0.25")
            for s in ax.spines.values():
                s.set_edgecolor(col); s.set_linewidth(1.4)

        # summary cell
        ax = axes[5]; ax.axis("off")
        ax.text(0.02, 0.97,
                "The detector is type-agnostic.", fontsize=10.5, fontweight="bold",
                va="top", transform=ax.transAxes, color="#111")
        ax.text(0.02, 0.85,
                f"Growth vector Q = 6 at every null\n"
                f"({detected}/{len(rows)} detected), radial and\n"
                f"spiral alike — the jump 5→6 says\n"
                f"“a null is here”, not which kind.\n\n"
                f"Radial vs spiral is in the fan\n"
                f"topology (X vs O), i.e. whether the\n"
                f"∇B eigenvalues are real or complex.\n"
                f"Reading that from the SR flow, and\n"
                f"testing if it beats a noisy eigenvalue\n"
                f"estimate, is R2.",
                fontsize=8.4, va="top", transform=ax.transAxes, color="#222")
        ax.text(0.02, 0.06, "fan-plane field lines; ★ = null",
                fontsize=7.2, va="bottom", transform=ax.transAxes, color="0.4")

        fig.tight_layout()
        out = REPO / "public/img/posts/forbidden-directions-null-gallery.png"
        fig.savefig(out, bbox_inches="tight", dpi=150)
        print(f"rendered {out.relative_to(REPO)}")

    # --- persist ------------------------------------------------------------------------
    res = {"recall": f"{detected}/{len(rows)}",
           "nulls": [{"tag": r["tag"], "origin": r["origin"], "label": r["cls"]["label"],
                      "type": r["cls"]["type"], "sign": r["cls"]["sign"],
                      "J_parallel": r["cls"]["J_parallel"], "Q": r["Q"]} for r in rows]}
    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "artifacts" / "r1_gallery.json").write_text(json.dumps(res, indent=2) + "\n")
    print("wrote artifacts/r1_gallery.json")


if __name__ == "__main__":
    main()
