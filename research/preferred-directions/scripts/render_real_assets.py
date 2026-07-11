#!/usr/bin/env python3
"""Blog enrichment: three renderings built purely from the program's REAL data.

  1. hmi-triptych      -- the three full-disk SDO/HMI magnetograms (2011-06-07 sample;
                          2012-03-07 and 2014-10-22 fetched from VSO), with the
                          analysed active-region windows outlined.
  2. null-constellation-- the 149 magnetospheric nulls of the IGRF+T96 census
                          (artifacts/p4_magnetosphere.json) in 3D GSM, radial vs spiral.
  3. coronal-skeleton  -- 3D field lines of the real 2012-03-07 extrapolation threading
                          the detected coronal null: spine, fan, and the arcade above
                          the active region.

Usage: render_real_assets.py     Output: public/img/posts/forbidden-directions-{...}.png
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "scripts"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

import solar  # noqa: E402
from run_r3_real_gallery import load_magnetograms, best_windows, WIN, CUT, NZ  # noqa: E402

BLUE, ORANGE = "#1565c0", "#e65100"


def triptych():
    mags = load_magnetograms()
    fig, axes = plt.subplots(1, 3, figsize=(11.7, 4.3), dpi=150)
    notes = {"2011-06-07": "quiet-ish disk, one AR",
             "2012-03-07": "AR11429 — X5.4 flare day",
             "2014-10-22": "AR12192 — largest AR of cycle 24"}
    for ax, (date, bz) in zip(axes, mags):
        v = np.percentile(np.abs(bz), 99.7)
        ax.imshow(bz, origin="lower", cmap="RdBu_r", vmin=-v, vmax=v)
        for (cy, cx) in best_windows(bz, k=4):
            ax.add_patch(plt.Rectangle((cx - WIN // 2, cy - WIN // 2), WIN, WIN,
                                       fill=False, ec="#111", lw=1.0, ls="--"))
        ax.set_title(f"{date} — {notes.get(date, '')}", fontsize=8.6)
        ax.set_xticks([]); ax.set_yticks([])
        ax.text(0.02, 0.02, f"peak $|B|$ = {np.abs(bz).max():.0f} G",
                transform=ax.transAxes, fontsize=7,
                bbox=dict(boxstyle="round,pad=0.25", fc="white", ec="0.6", alpha=0.85))
    fig.suptitle("The raw material: three days of the real Sun (SDO/HMI line-of-sight "
                 "magnetograms; red/blue = field out of/into the surface; dashed boxes = "
                 "analysed regions)", fontsize=9.6, fontweight="bold")
    fig.tight_layout(rect=[0, 0, 1, 0.93])
    out = REPO / "public/img/posts/forbidden-directions-hmi-triptych.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print("rendered", out.name)


def constellation():
    """Two equal-aspect projections read far better than a 3D scatter."""
    data = json.loads((ROOT / "artifacts" / "p4_magnetosphere.json").read_text())
    nulls = data["nulls"]
    P = np.array([n["p_gsm_re"] for n in nulls])
    spiral = np.array([n["type"] == "spiral" for n in nulls])
    core = np.abs(P[:, 0]) <= 40                       # drop 4 far-tail model-edge nulls
    n_drop = int((~core).sum())
    P, spiral = P[core], spiral[core]

    fig, axes = plt.subplots(1, 2, figsize=(10.6, 4.6), dpi=150)
    for ax, (i, j, xl, yl, ttl) in zip(axes, [
            (0, 1, "$x_{GSM}$ [$R_E$]", "$y_{GSM}$ [$R_E$]",
             "A · from above (ecliptic projection)"),
            (0, 2, "$x_{GSM}$ [$R_E$]", "$z_{GSM}$ [$R_E$]",
             "B · from the side (noon–midnight projection)")]):
        ax.scatter(P[~spiral, i], P[~spiral, j], s=18, c=BLUE, alpha=0.85,
                   label=f"radial ({int((~spiral).sum())})")
        ax.scatter(P[spiral, i], P[spiral, j], s=26, c=ORANGE, marker="^", alpha=0.9,
                   label=f"spiral ({int(spiral.sum())})")
        ax.add_patch(plt.Circle((0, 0), 1.0, color="#25d0ff", zorder=5))
        ax.annotate("Earth", (0, 1.2), fontsize=7, ha="center", color="0.3")
        ax.annotate("", xy=(12, 0), xytext=(5, 0),
                    arrowprops=dict(arrowstyle="->", color="0.55"))
        ax.text(12.6, 0, "Sun", fontsize=7.5, color="0.4", va="center")
        ax.set_xlabel(xl, fontsize=8.5); ax.set_ylabel(yl, fontsize=8.5)
        ax.set_title(ttl, fontsize=9)
        ax.set_aspect("equal"); ax.tick_params(labelsize=7.5)
        ax.grid(alpha=0.25, lw=0.5)
        ax.legend(fontsize=7.5, loc="lower left")
    fig.suptitle("The null constellation of Earth's magnetosphere (IGRF + Tsyganenko "
                 "T96, 2012-03-07 storm conditions):\nspiral nulls (orange) cluster in "
                 "the nightside flank current regions — non-force-free territory, where "
                 f"the theorem permits them ({n_drop} far-tail nulls beyond "
                 "$|x|=40\\,R_E$ omitted)", fontsize=9.3, fontweight="bold")
    fig.tight_layout(rect=[0, 0, 1, 0.90])
    out = REPO / "public/img/posts/forbidden-directions-null-constellation.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print("rendered", out.name)


def _trace(B, p0, direction, ds=0.35, steps=900):
    """RK4 field-line trace on the gridded real field (unit-speed, +/- B-hat)."""
    ny, nx, nz, _ = B.shape
    pts = [np.asarray(p0, float)]
    p = pts[0].copy()

    def f(q):
        b = solar._interp3(B, q)
        n = np.linalg.norm(b)
        return direction * b / n if n > 1e-9 else np.zeros(3)

    for _ in range(steps):
        k1 = f(p); k2 = f(p + 0.5 * ds * k1)
        k3 = f(p + 0.5 * ds * k2); k4 = f(p + ds * k3)
        p = p + (ds / 6) * (k1 + 2 * k2 + 2 * k3 + k4)
        if not (1 < p[0] < nx - 2 and 1 < p[1] < ny - 2 and 0.5 < p[2] < nz - 2):
            break
        pts.append(p.copy())
    return np.array(pts)


def skeleton():
    from scipy.ndimage import zoom
    mags = dict(load_magnetograms())
    bz = mags["2012-03-07"]
    cy, cx = 640, 640
    cut = zoom(bz[cy - WIN // 2:cy + WIN // 2, cx - WIN // 2:cx + WIN // 2],
               CUT / WIN, order=1)
    B, _A = solar.potential_field(cut, NZ, dz=1.0)
    ny, nx, nz, _ = B.shape
    nulls = [nl for nl in solar.find_nulls(B, seeds_per_axis=10)
             if 6 < nl["p"][0] < nx - 6 and 6 < nl["p"][1] < ny - 6
             and 3 < nl["p"][2] < nz - 3]
    nulls.sort(key=lambda nl: nl["p"][2])
    p0 = nulls[0]["p"]
    print(f"skeleton null at {np.round(p0, 1)} of {len(nulls)} in the volume")

    fig = plt.figure(figsize=(9.4, 6.6), dpi=150)
    ax = fig.add_subplot(111, projection="3d")
    # photospheric magnetogram as the floor
    Xg, Yg = np.meshgrid(np.arange(nx), np.arange(ny))
    v = np.percentile(np.abs(cut), 99)
    ax.plot_surface(Xg, Yg, np.zeros_like(Xg), rstride=1, cstride=1,
                    facecolors=plt.cm.RdBu_r(np.clip(cut.T / (2 * v) + 0.5, 0, 1)),
                    shade=False, alpha=0.9, linewidth=0)
    # arcade field lines from strong-flux footpoints
    iy, ix = np.where(np.abs(cut.T) > np.percentile(np.abs(cut), 96.5))
    sel = np.linspace(0, len(ix) - 1, 70).astype(int)
    for j in sel:
        seed = np.array([ix[j], iy[j], 1.5])
        sgn = +1.0 if cut.T[iy[j], ix[j]] > 0 else -1.0
        ln = _trace(B, seed, sgn)
        if len(ln) > 8:
            ax.plot(ln[:, 0], ln[:, 1], ln[:, 2], color="0.45", lw=0.5, alpha=0.7)
    # spine & fan through the null (seeded on a small sphere around it)
    rng = np.random.default_rng(2)
    for _ in range(26):
        d = rng.standard_normal(3); d /= np.linalg.norm(d)
        for sgn in (+1.0, -1.0):
            ln = _trace(B, p0 + 1.2 * d, sgn, ds=0.3, steps=700)
            if len(ln) > 8:
                ax.plot(ln[:, 0], ln[:, 1], ln[:, 2], color=ORANGE, lw=0.75, alpha=0.85)
    ax.scatter([p0[0]], [p0[1]], [p0[2]], s=140, c="#ffd000", marker="*",
               edgecolor="k", linewidth=1.0, zorder=10)
    ax.set_xlim(0, nx); ax.set_ylim(0, ny); ax.set_zlim(0, nz * 0.85)
    ax.set_xlabel("x [px]", fontsize=8); ax.set_ylabel("y [px]", fontsize=8)
    ax.set_zlabel("height [px]", fontsize=8)
    ax.tick_params(labelsize=6.5)
    ax.set_box_aspect((1, 1, 0.55))
    ax.view_init(elev=24, azim=-63)
    ax.set_title("The real coronal skeleton (SDO/HMI 2012-03-07, AR11429, potential "
                 "extrapolation):\ngrey — the active-region arcade; orange — field lines "
                 "threading the detected null (★): its spine and fan",
                 fontsize=9)
    fig.tight_layout()
    out = REPO / "public/img/posts/forbidden-directions-coronal-skeleton.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print("rendered", out.name)


if __name__ == "__main__":
    triptych()
    constellation()
    skeleton()
