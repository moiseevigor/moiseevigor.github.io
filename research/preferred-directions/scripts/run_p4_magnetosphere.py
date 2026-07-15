#!/usr/bin/env python3
"""P4-S3 -- null hunt in Earth's real magnetosphere (IGRF + Tsyganenko T96), H-P4d.

The first field in the program with genuinely NON-force-free currents (magnetopause,
tail, ring current) -- the only real-physics regime where the R5 theorem allows spiral
nulls. Hunts nulls by Newton descent from cusp/tail seeds, classifies each with the
standard scheme, runs the SR growth-vector detector on its tangent cone, and renders
the meridional |B| map with the detected nulls.

Epoch 2012-03-07 00:00 UT (the program's solar storm day) under moderately disturbed
conditions (Pdyn = 3 nPa, Dst = -50 nT, IMF Bz = -5 nT southward).

Usage: run_p4_magnetosphere.py
Out:   artifacts/p4_magnetosphere.json, public/img/posts/forbidden-directions-magnetosphere.png
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))

import magnetosphere as ms  # noqa: E402
import nulltopo             # noqa: E402
import mfield3d as m3       # noqa: E402

PARMOD = [3.0, -50.0, 0.0, -5.0, 0, 0, 0, 0, 0, 0]   # Pdyn nPa, Dst, IMF By, Bz


def tangent_cone_structure(M):
    """Exact SR structure of the null's linearization: A = -(1/3) r x (M r)."""
    M = np.asarray(M, float)

    def A(P):
        P = np.atleast_2d(np.asarray(P, float))
        return -np.cross(P, P @ M.T) / 3.0
    return m3.MagneticStructure3D(A, "tangent-cone")


def main():
    rng = np.random.default_rng(5)
    ut = datetime(2012, 3, 7, 0, 0, tzinfo=timezone.utc).timestamp()
    field = ms.Magnetosphere(ut, PARMOD)
    print(f"field: {field.name}, 2012-03-07 00:00 UT, "
          f"Pdyn={PARMOD[0]} nPa, Dst={PARMOD[1]} nT, IMF Bz={PARMOD[3]} nT")

    nulls = field.find_nulls(ms.cusp_and_tail_seeds())
    print(f"nulls found: {len(nulls)}")
    records = []
    for nl in nulls:
        p, M = nl["p"], nl["gradB"]
        Mn = M / np.abs(np.linalg.eigvals(M)).max()
        Mn = Mn - np.eye(3) * np.trace(Mn) / 3          # traceless (div B = 0)
        cls = nulltopo.classify_null(Mn)
        _, Q = tangent_cone_structure(Mn).weights_Q(
            [0, 0, 0, 0], np.geomspace(0.02, 0.2, 7), 5000, rng)
        rec = {"p_gsm_re": [round(float(v), 2) for v in p],
               "label": cls["label"], "type": cls["type"],
               "J_parallel": round(float(cls["J_parallel"]), 3),
               "Q": int(Q), "Bmag_nT": round(nl["Bmag"], 3),
               "eigs": [str(np.round(v, 3)) for v in cls["eigs"]]}
        records.append(rec)
        print(f"  null at GSM ({p[0]:6.2f},{p[1]:6.2f},{p[2]:6.2f}) RE  "
              f"{cls['label']:8s}  J||={cls['J_parallel']:+.3f}  Q={Q}  "
              f"|B|={nl['Bmag']:.2f} nT")

    n_spiral = sum(r["type"] == "spiral" for r in records)
    print(f"\nspiral nulls: {n_spiral}/{len(records)} "
          f"(non-force-free currents make them possible here; R5 forbids them "
          f"in any force-free extrapolation)")

    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "artifacts" / "p4_magnetosphere.json").write_text(json.dumps(
        {"epoch": "2012-03-07T00:00Z", "parmod": PARMOD, "n_nulls": len(records),
         "n_spiral": n_spiral, "nulls": records}, indent=2) + "\n")
    print("wrote artifacts/p4_magnetosphere.json")

    # ---- meridional figure ---------------------------------------------------------------
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        from matplotlib.colors import LogNorm
    except Exception as e:                              # pragma: no cover
        print("figure skipped:", e)
        return
    nx, nz = 180, 120
    xs = np.linspace(-35, 12, nx)
    zs = np.linspace(-14, 14, nz)
    Bx = np.zeros((nz, nx)); Bz = np.zeros((nz, nx)); Bm = np.zeros((nz, nx))
    for i, z in enumerate(zs):
        for j, x in enumerate(xs):
            if np.hypot(x, z) < 2.0:
                Bm[i, j] = np.nan; continue
            b = field.B([x, 0.0, z])
            Bx[i, j], Bz[i, j] = b[0], b[2]
            Bm[i, j] = np.linalg.norm(b)
    fig, ax = plt.subplots(figsize=(9.6, 5.6), dpi=150)
    im = ax.imshow(Bm, origin="lower", extent=[xs[0], xs[-1], zs[0], zs[-1]],
                   cmap="magma", norm=LogNorm(vmin=1.0, vmax=2e3), aspect="equal")
    ax.streamplot(xs, zs, Bx, Bz, color="white", density=1.5, linewidth=0.5,
                  arrowsize=0.6)
    earth = plt.Circle((0, 0), 1.0, color="#25d0ff", zorder=6)
    ax.add_patch(earth)
    for r in records:
        p = r["p_gsm_re"]
        if abs(p[1]) < 3.0 and xs[0] < p[0] < xs[-1] and zs[0] < p[2] < zs[-1]:
            col = "#e65100" if r["type"] == "spiral" else "#ffd000"
            ax.plot(p[0], p[2], marker="*", ms=16, mfc=col, mec="k", mew=1.1, zorder=7)
            ax.annotate(f"{r['label']} · Q={r['Q']}", (p[0], p[2]),
                        (p[0] + 1.5, p[2] + 1.5), fontsize=7.5, fontweight="bold",
                        color="k", bbox=dict(boxstyle="round,pad=0.25", fc="white",
                                             ec="k", alpha=0.9),
                        arrowprops=dict(arrowstyle="->", color="k"))
    ax.set_xlim(xs[0], xs[-1]); ax.set_ylim(zs[0], zs[-1])
    ax.text(0.015, 0.03,
            f"census: {len(records)} nulls, {n_spiral} spiral — the population sits "
            f"off-plane at $|y|\\approx17\\!-\\!25\\,R_E$ (nightside flank / lobe "
            f"boundary);\nspirals are possible here because the tail current is "
            f"genuinely non-force-free — exactly what the force-free theorem forbids "
            f"on the Sun's extrapolations",
            transform=ax.transAxes, fontsize=6.8, va="bottom", color="white")
    cb = fig.colorbar(im, ax=ax, fraction=0.03, pad=0.02)
    cb.set_label("$|B|$ [nT, log]", fontsize=8); cb.ax.tick_params(labelsize=7)
    ax.set_xlabel("$x_{GSM}$ [$R_E$]  (Sun →)", fontsize=9)
    ax.set_ylabel("$z_{GSM}$ [$R_E$]", fontsize=9)
    ax.tick_params(labelsize=7.5)
    fig.tight_layout()
    out = REPO / "public/img/posts/forbidden-directions-magnetosphere.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print(f"rendered {out.relative_to(REPO)}")


if __name__ == "__main__":
    main()
