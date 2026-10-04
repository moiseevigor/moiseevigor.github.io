#!/usr/bin/env python3
"""Figures for J1 (Jupiter): field maps, the buried skeleton, the dome
overlay, and the null anatomy sheet. House rules: no in-figure titles,
real data everywhere, captions carry the description.

Renders
  public/img/posts/forbidden-directions-jupiter-field.png
  public/img/posts/forbidden-directions-jupiter-skeleton.png
  public/img/posts/forbidden-directions-jupiter-dome.png
  public/img/posts/forbidden-directions-jupiter-anatomy.png
"""
import json
import sys
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "scripts"))

import jupfield  # noqa: E402

R_SURF = 0.85
BLUE, ORANGE = "#1565c0", "#e65100"


def load_all():
    d = json.loads((ROOT / "artifacts" / "j1_jupiter.json").read_text())
    db = json.loads((ROOT / "artifacts" / "j1b_dome.json").read_text())
    npz = np.load(ROOT / "artifacts" / "j1_maps.npz", allow_pickle=True)
    return d, db, npz


def sph_grid(fld, r, n_th=181, n_ph=361):
    th = np.radians(np.linspace(0.5, 179.5, n_th))
    ph = np.radians(np.linspace(0, 360, n_ph))
    Br = np.array([[fld.B_sph(r, t, p)[0] for p in ph] for t in th])
    return th, ph, Br * 1e-5                       # -> Gauss


def fig_field(fld):
    from matplotlib.gridspec import GridSpec
    th1, ph1, Br1 = sph_grid(fld, 1.0)
    th085, ph085, Br085 = sph_grid(fld, R_SURF)
    fig = plt.figure(figsize=(11.6, 4.4), dpi=150)
    gs = GridSpec(1, 3, width_ratios=[1.9, 1, 1], wspace=0.25)

    ax = fig.add_subplot(gs[0])
    v = 18
    im = ax.pcolormesh(np.degrees(ph1), 90 - np.degrees(th1), Br1,
                       cmap="RdBu_r", vmin=-v, vmax=v, shading="auto")
    ax.contour(np.degrees(ph1), 90 - np.degrees(th1), Br1, levels=[0],
               colors="k", linewidths=0.5)
    ax.annotate("Great Blue Spot", xy=(275, 2), xytext=(210, -35),
                fontsize=7.5, arrowprops=dict(arrowstyle="->", lw=0.8))
    ax.set_xlabel("System III longitude [deg]", fontsize=8.5)
    ax.set_ylabel("latitude [deg]", fontsize=8.5)
    ax.set_title("A · the 1-bar surface (r = 1 $R_J$)", fontsize=9)
    ax.tick_params(labelsize=7.5)
    cb = fig.colorbar(im, ax=ax, fraction=0.03, pad=0.02)
    cb.set_label("$B_r$ [G]", fontsize=7.5); cb.ax.tick_params(labelsize=6.5)

    for col, (rr, thx, phx, Brx, ttl) in enumerate(
            [(1.0, th1, ph1, Br1, "B · north pole, r = 1: one polarity"),
             (R_SURF, th085, ph085, Br085,
              "C · north pole, r = 0.85: the reversed patch")]):
        ax = fig.add_subplot(gs[col + 1], projection="polar")
        sel = thx < np.radians(45)
        P, R = np.meshgrid(phx, np.degrees(thx[sel]))
        v2 = 12 if rr == 1.0 else 22
        ax.pcolormesh(P, R, Brx[sel], cmap="RdBu_r", vmin=-v2, vmax=v2,
                      shading="auto")
        ax.contour(P, R, Brx[sel], levels=[0], colors="k", linewidths=0.7)
        ax.set_title(ttl, fontsize=8.6, pad=12)
        ax.set_yticks([15, 30, 45])
        ax.set_yticklabels(["75°N", "60°N", "45°N"], fontsize=5.5)
        ax.tick_params(labelsize=5.5)
        ax.grid(alpha=0.3, lw=0.4)
    out = REPO / "public/img/posts/forbidden-directions-jupiter-field.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print("rendered", out.name)
    plt.close(fig)


def fig_dome(fld, db, npz):
    feet = npz["feet"]; fid = npz["feet_null_id"]
    d = json.loads((ROOT / "artifacts" / "j1_jupiter.json").read_text())
    nulls = d["models"]["jrm33_l18"]["nulls"]
    th, ph, Br = sph_grid(fld, R_SURF, n_th=241, n_ph=481)
    fig, axes = plt.subplots(1, 2, figsize=(10.8, 4.9), dpi=150,
                             subplot_kw=dict(projection="polar"))
    panels = [(1, axes[0], 40, "A · the polar patch and its dome footprint"),
              (0, axes[1], 90, "B · the low-latitude twin")]
    for k, ax, colat_max, ttl in panels:
        nl = nulls[k]
        sel = th < np.radians(colat_max)
        P, R = np.meshgrid(ph, np.degrees(th[sel]))
        v = 20
        ax.pcolormesh(P, R, Br[sel], cmap="RdBu_r", vmin=-v, vmax=v,
                      shading="auto")
        ax.contour(P, R, Br[sel], levels=[0], colors="k",
                   linewidths=0.8, linestyles="--")
        fk = feet[fid == k]
        ax.plot(np.radians(fk[:, 1]), fk[:, 0], "o", ms=3.2, mfc=ORANGE,
                mec="#7a2d00", mew=0.4, ls="none",
                label="fan (dome) footprints")
        ax.plot(np.radians(nl["lon"]), 90 - nl["lat"], marker="*", ms=15,
                mfc="#ffd34d", mec="#442200", mew=0.9, ls="none",
                label=f"null (r = {nl['r']:.3f} $R_J$)")
        rec = db["nulls"][k]
        for se in rec.get("spine_ends", []):
            if se["lands"] == "surface-inside-patch":
                ax.plot(np.radians(se["lon"]), se["colat"], marker="P",
                        ms=8, mfc="#2e7d32", mec="#0f3311", mew=0.6,
                        ls="none", label="inner spine footpoint")
        ax.set_title(ttl, fontsize=8.8, pad=13)
        ax.set_ylim(0, colat_max)
        ticks = [15, 30] if colat_max == 40 else [30, 60, 90]
        ax.set_yticks(ticks)
        ax.set_yticklabels([f"{90 - t}°N" if t < 90 else "equator"
                            for t in ticks], fontsize=5.5)
        ax.tick_params(labelsize=5.5)
        ax.grid(alpha=0.3, lw=0.4)
        ax.legend(fontsize=6, loc="lower left", bbox_to_anchor=(-0.08, -0.12))
    out = REPO / "public/img/posts/forbidden-directions-jupiter-dome.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print("rendered", out.name)
    plt.close(fig)


def fig_skeleton(fld, npz):
    """3D: the dynamo sphere textured with Br(0.85), the buried dome + spine,
    the translucent 1-bar shell."""
    d = json.loads((ROOT / "artifacts" / "j1_jupiter.json").read_text())
    nulls = d["models"]["jrm33_l18"]["nulls"]
    th, ph, Br = sph_grid(fld, R_SURF, n_th=121, n_ph=241)

    fig = plt.figure(figsize=(8.6, 7.6), dpi=150)
    ax = fig.add_subplot(111, projection="3d")
    ax.set_facecolor("#06080f"); fig.patch.set_facecolor("#06080f")
    ax.set_axis_off()
    ax.set_position([0, 0, 1, 1])

    # dynamo sphere, data-textured
    TH, PH = np.meshgrid(th, ph, indexing="ij")
    X = R_SURF * np.sin(TH) * np.cos(PH)
    Y = R_SURF * np.sin(TH) * np.sin(PH)
    Z = R_SURF * np.cos(TH)
    v = 20
    cols = plt.cm.RdBu_r(np.clip((Br + v) / (2 * v), 0, 1))
    ax.plot_surface(X, Y, Z, facecolors=cols, rstride=1, cstride=1,
                    linewidth=0, antialiased=False, shade=False, zorder=1)

    cam = np.array([np.cos(np.radians(35)) * np.cos(np.radians(-60)),
                    np.cos(np.radians(35)) * np.sin(np.radians(-60)),
                    np.sin(np.radians(35))])

    def visible(P):
        return (P @ cam) > 0.15 * np.linalg.norm(P, axis=-1)

    # dome fan lines + spines of the polar null (id 1), occlusion-culled
    lines = npz["fan_lines"]; lid = npz["fan_null_id"]
    for ln in lines[lid == 1][::2]:
        ln = np.asarray(ln, float)
        m = visible(ln)
        if m.sum() < 4:
            continue
        idx = np.where(m)[0]
        ax.plot(ln[idx, 0], ln[idx, 1], ln[idx, 2], color="#ff8b2e",
                lw=0.8, alpha=0.75, zorder=5)
    spines = npz["spines"]; sid = npz["spine_null_id"]
    for ln in spines[sid == 1]:
        ln = np.asarray(ln, float)
        rr = np.linalg.norm(ln, axis=1)
        ln = ln[rr < 1.32]                          # fade out, never hard-cut
        if len(ln) < 4:
            continue
        m = visible(ln)
        idx = np.where(m)[0]
        rr = np.linalg.norm(ln, axis=1)
        for a in range(0, len(idx) - 6, 6):
            seg = idx[a:a + 7]
            fade = float(np.clip((1.30 - rr[seg].max()) / 0.22, 0.05, 1.0))
            ax.plot(ln[seg, 0], ln[seg, 1], ln[seg, 2], color="#ffd34d",
                    lw=1.7, alpha=0.95 * fade, zorder=6)
    p1 = np.array(nulls[1]["p"])
    ax.scatter(*p1, s=200, c="#ffd34d", marker="*", edgecolor="#442200",
               linewidth=0.9, zorder=7, depthshade=False)

    # translucent 1-bar shell
    ths = np.linspace(0, np.pi, 41)
    phs = np.linspace(0, 2 * np.pi, 81)
    TS, PS = np.meshgrid(ths, phs, indexing="ij")
    ax.plot_surface(np.sin(TS) * np.cos(PS), np.sin(TS) * np.sin(PS),
                    np.cos(TS), color="#c9d4e8", alpha=0.08, linewidth=0,
                    shade=False, zorder=3)
    # a thin great-circle rim to make the shell legible
    tt = np.linspace(0, 2 * np.pi, 200)
    n_rim = np.cross(cam, [0, 0, 1]); n_rim /= np.linalg.norm(n_rim)
    e1 = np.cross([0, 0, 1], n_rim); e1 /= np.linalg.norm(e1)
    e2 = np.cross(n_rim, e1)
    rim = np.outer(np.cos(tt), e1) + np.outer(np.sin(tt), e2)
    ax.plot(rim[:, 0], rim[:, 1], rim[:, 2], color="#c9d4e8", lw=0.7,
            alpha=0.5, zorder=3)

    ax.set_box_aspect((1, 1, 1))
    lim = 1.12
    ax.set_xlim(-lim, lim); ax.set_ylim(-lim, lim); ax.set_zlim(-lim, lim)
    ax.view_init(elev=35, azim=-60)
    fig.text(0.035, 0.05, "dynamo surface r = 0.85 $R_J$ (data: JRM33 $B_r$) · "
             "orange = fan separatrix dome · gold = spine · faint shell = the "
             "1-bar cloud surface", color="#8a93a3", fontsize=7.4)
    out = REPO / "public/img/posts/forbidden-directions-jupiter-skeleton.png"
    fig.savefig(out, facecolor="#06080f", dpi=150)
    print("rendered", out.name)
    plt.close(fig)


def fig_anatomy(fld, npz):
    import render_real_assets as rra
    d = json.loads((ROOT / "artifacts" / "j1_jupiter.json").read_text())
    nulls = d["models"]["jrm33_l18"]["nulls"]
    rng = np.random.default_rng(4)
    fig, axes = plt.subplots(2, 4, figsize=(11.4, 6.2), dpi=150)
    for row, k in zip(axes, (1, 0)):
        nl = nulls[k]
        p0 = np.array(nl["p"])
        M = fld.jac(p0)

        def trace_cb(seed, sgn, _p0=p0):
            ln, q = [np.asarray(seed, float)], np.asarray(seed, float).copy()
            for _ in range(700):
                b = fld.B(q); nb = np.linalg.norm(b)
                if nb < 1e-7:
                    break
                q = q + sgn * 0.0012 * b / nb
                if np.linalg.norm(q - _p0) > 0.055 or \
                   np.linalg.norm(q) < R_SURF:
                    break
                ln.append(q.copy())
            return np.array(ln)

        lines = []
        for _ in range(26):
            u = rng.standard_normal(3); u /= np.linalg.norm(u)
            for sgn in (+1.0, -1.0):
                ln = trace_cb(p0 + 0.004 * u, sgn)
                if len(ln) > 8:
                    lines.append(ln)
        tag = "polar null" if k == 1 else "low-latitude null"
        rra._anatomy_rows(fig, row, lines, p0, M, 0.045, "$R_J$",
                          f"{tag} · r = {nl['r']:.3f} $R_J$, "
                          f"lat {nl['lat']:+.0f}°", tracer=trace_cb)
    fig.tight_layout()
    out = REPO / "public/img/posts/forbidden-directions-jupiter-anatomy.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print("rendered", out.name)
    plt.close(fig)


if __name__ == "__main__":
    d, db, npz = load_all()
    fld = jupfield.JupiterField("jrm33", lmax=18)
    if "--anatomy" not in sys.argv:
        fig_field(fld)
        fig_dome(fld, db, npz)
        fig_skeleton(fld, npz)
    fig_anatomy(fld, npz)
