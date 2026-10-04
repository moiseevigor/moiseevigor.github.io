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


def main(render_only=False):
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
    stored = None
    if render_only:        # Q read from the artifact; detector not re-run
        stored = {n["tag"]: n["Q"] for n in json.loads(
            (ROOT / "artifacts" / "r1_gallery.json").read_text())["nulls"]}
    for tag, origin, d in battery:
        cls = nulltopo.classify_null(d["M"])
        Q = stored[tag] if stored else detector_Q(d["struct"], rng)
        rows.append({"tag": tag, "origin": origin, "d": d, "cls": cls, "Q": Q})
        ev = np.round(np.real_if_close(cls["eigs"], tol=1e6), 3)
        print(f"  {tag:8s} [{origin:20s}]  standard={cls['label']:8s}  "
              f"J||={cls['J_parallel']:+.2f}  SR growth vector Q={Q}  eigs={ev}")

    detected = sum(r["Q"] == 6 for r in rows)
    print(f"\ndetection recall (Q=6 at the null): {detected}/{len(rows)}")

    # --- gallery figure -----------------------------------------------------------------
    # House rule: no in-figure prose. One label per panel. In the FAN PLANE a radial
    # null is a NODE and a spiral null a FOCUS (X/O belong to 2D nulls, not to this view).
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.lines import Line2D
    BLUE, ORANGE = "#1565c0", "#e65100"
    fig, axes = plt.subplots(2, 3, figsize=(10.5, 7.4), dpi=150)
    axes = axes.ravel()
    g = np.linspace(-1.0, 1.0, 26)
    AA, BB = np.meshgrid(g, g)                      # AA = fan-u coord, BB = fan-v coord
    for k, (ax, r) in enumerate(zip(axes, rows)):
        cls, M = r["cls"], r["d"]["M"]
        u, v = fan_basis(cls["spine"])
        P = AA[..., None] * u + BB[..., None] * v   # (n,n,3) points in the fan plane
        Bvec = P.reshape(-1, 3) @ M.T
        Bu = (Bvec @ u).reshape(AA.shape)
        Bv = (Bvec @ v).reshape(AA.shape)
        spiral = cls["type"] == "spiral"
        col = ORANGE if spiral else BLUE
        ax.streamplot(g, g, Bu, Bv, color=col, density=1.1, linewidth=0.7,
                      arrowsize=0.8)
        ax.plot(0, 0, marker="*", ms=17, mfc="#ffd000", mec="k", mew=1.1, zorder=5)
        ax.set_xlim(-1, 1); ax.set_ylim(-1, 1); ax.set_aspect("equal")
        ax.set_xticks([-1, 0, 1]); ax.set_yticks([-1, 0, 1])
        ax.tick_params(labelsize=9)
        ax.set_xlabel("fan-plane coordinate $u$ [model units, linear]", fontsize=9.5)
        ax.set_ylabel("fan-plane coordinate $v$ [model units, linear]", fontsize=9.5)
        ax.set_title(f"{'ABCDE'[k]}", loc="left", fontsize=11, fontweight="bold")
        ax.set_title(f"{cls['label']} · {'focus' if spiral else 'node'} · Q = {r['Q']}",
                     loc="right", fontsize=10, color=col, fontweight="bold")
        for s in ax.spines.values():
            s.set_edgecolor(col); s.set_linewidth(1.4)

    ax = axes[5]; ax.axis("off")                    # legend cell (encodings only)
    ax.legend(handles=[
        Line2D([], [], color=BLUE, lw=1.6, label="radial null: fan-plane node"),
        Line2D([], [], color=ORANGE, lw=1.6, label="spiral null: fan-plane focus"),
        Line2D([], [], ls="none", marker="*", ms=14, mfc="#ffd000", mec="k",
               label="the null"),
        Line2D([], [], ls="none", marker=">", ms=7, color="0.35",
               label="arrows: field direction")],
        loc="center", fontsize=10, frameon=False)
    fig.tight_layout()
    out = REPO / "public/img/posts/forbidden-directions-null-gallery.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print(f"rendered {out.relative_to(REPO)}")
    if render_only:
        return

    # --- persist ------------------------------------------------------------------------
    res = {"recall": f"{detected}/{len(rows)}",
           "nulls": [{"tag": r["tag"], "origin": r["origin"], "label": r["cls"]["label"],
                      "type": r["cls"]["type"], "sign": r["cls"]["sign"],
                      "J_parallel": r["cls"]["J_parallel"], "Q": r["Q"]} for r in rows]}
    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "artifacts" / "r1_gallery.json").write_text(json.dumps(res, indent=2) + "\n")
    print("wrote artifacts/r1_gallery.json")


if __name__ == "__main__":
    main(render_only="--render" in sys.argv)
