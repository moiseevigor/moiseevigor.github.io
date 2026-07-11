#!/usr/bin/env python3
"""Blog enrichment: three renderings built purely from the program's REAL data.

  1. hmi-triptych      -- the three full-disk SDO/HMI magnetograms (2011-06-07 sample;
                          2012-03-07 and 2014-10-22 fetched from VSO), with the
                          analysed active-region windows outlined.
  2. null-constellation-- the 149 magnetospheric nulls of the IGRF+T96 census
                          (artifacts/p4_magnetosphere.json) in 3D GSM, radial vs spiral.
  3. coronal-skeleton  -- the real Sun as a sphere: the full-disk 2012-03-07 magnetogram
                          textured on it (classic HMI grey), the AR11429 potential-field
                          extrapolation embedded at its true disk position (tangent map,
                          true height scale), arcade + null-threading field lines drawn
                          with sphere occlusion, and a close-up inset of the null's
                          spine and fan.

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


def _cam_dir(elev, azim):
    """Unit vector pointing from the scene toward the (orthographic) camera."""
    e, a = np.radians(elev), np.radians(azim)
    return np.array([np.cos(e) * np.cos(a), np.cos(e) * np.sin(a), np.sin(e)])

def _visible(P, d, R=1.0):
    """True where points P (n,3) are NOT occluded by the sphere |p|<R, camera dir d."""
    b = P @ d
    return ~((b < 0) & ((P * P).sum(1) - b * b < R * R))

def _plot_culled(ax, P, d, **kw):
    """Plot a polyline, split into its sphere-visible runs."""
    vis = _visible(P, d)
    cut = np.flatnonzero(np.diff(vis.astype(int))) + 1
    for run in np.split(np.arange(len(P)), cut):
        if vis[run[0]] and len(run) > 2:
            ax.plot(P[run, 0], P[run, 1], P[run, 2], **kw)

def skeleton(fast=False):
    """The stage as the actual Sun: full-disk magnetogram on a sphere, the AR11429
    extrapolation patch embedded at its true disk position (tangent/exponential map,
    true height scale), field lines occlusion-culled, null close-up inset."""
    from scipy.ndimage import zoom, map_coordinates
    bz = dict(load_magnetograms())["2012-03-07"]
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

    # ---- traces in box coords (x, y in CUT px; z in CUT px of height) ------------
    rng = np.random.default_rng(2)
    thr = np.percentile(np.abs(cut), 93.0)
    iy, ix = np.where(np.abs(cut) >= thr)
    w = np.abs(cut)[iy, ix]
    sel = rng.choice(len(ix), size=min(170, len(ix)), replace=False, p=w / w.sum())
    arcade = []
    for j in sel:
        sgn = +1.0 if cut[iy[j], ix[j]] > 0 else -1.0
        ln = _trace(B, np.array([ix[j], iy[j], 1.5]), sgn)
        if len(ln) > 10:
            arcade.append((ln, w[j] / w.max()))
    skel = []
    for _ in range(26):
        u = rng.standard_normal(3); u /= np.linalg.norm(u)
        for sgn in (+1.0, -1.0):
            ln = _trace(B, p0 + 1.2 * u, sgn, ds=0.3, steps=700)
            if len(ln) > 8:
                skel.append(ln)

    # ---- disk geometry & tangent-map embedding (units of R_sun) ------------------
    ys, xs = np.where(np.abs(bz) > 0)
    cy0, cx0 = (ys.min() + ys.max()) / 2, (xs.min() + xs.max()) / 2
    Rpx = ((ys.max() - ys.min()) + (xs.max() - xs.min())) / 4
    n0 = np.array([(cx - cx0) / Rpx, (cy - cy0) / Rpx, 0.0])
    n0[2] = np.sqrt(1 - n0[0] ** 2 - n0[1] ** 2)
    e1 = np.array([1.0, 0, 0]) - n0[0] * n0; e1 /= np.linalg.norm(e1)
    e2 = np.array([0, 1.0, 0]) - n0[1] * n0 - (e1[1]) * e1; e2 /= np.linalg.norm(e2)
    sig = (WIN / CUT) / Rpx                       # radians (=R units) per CUT px

    def embed(P):
        """Box points (n,3) -> sphere frame via the exponential map at n0."""
        P = np.atleast_2d(P)
        a = (P[:, 0] - (nx - 1) / 2) * sig
        b = (P[:, 1] - (ny - 1) / 2) * sig
        rho = np.hypot(a, b)
        s = np.where(rho > 1e-12, np.sin(rho) / np.maximum(rho, 1e-12), 1.0)
        nhat = (np.cos(rho)[:, None] * n0 +
                s[:, None] * (a[:, None] * e1 + b[:, None] * e2))
        return (1.0 + P[:, 2] * sig)[:, None] * nhat

    # ---- figure -------------------------------------------------------------------
    BG, FAR, INK = "#0b0e14", "#161a22", "#c7cdd8"
    ARC, NUL, STAR = "#7aa8dc", "#ff8b2e", "#ffd34d"
    VDISP = 600.0                                  # grey display range [G]
    grey = lambda val: plt.cm.gray(np.clip(val / (2 * VDISP) + 0.5, 0.04, 0.96))
    ELEV, AZIM = 17, -38
    d = _cam_dir(ELEV, AZIM)

    fig = plt.figure(figsize=(10.2, 7.0), dpi=110 if fast else 165)
    fig.patch.set_facecolor(BG)
    ax = fig.add_axes([0, 0, 1, 1], projection="3d", computed_zorder=False)
    ax.set_facecolor(BG); ax.set_axis_off(); ax.set_proj_type("ortho")

    # base sphere textured with the real full-disk magnetogram (far side dark)
    nlat, nlon = (110, 220) if fast else (230, 460)
    th = np.linspace(0, np.pi, nlat)[:, None]     # colatitude from +z (observer axis)
    ph = np.linspace(0, 2 * np.pi, nlon)[None, :]
    N = np.stack([np.sin(th) * np.cos(ph) + 0 * ph,
                  np.sin(th) * np.sin(ph) + 0 * ph,
                  np.cos(th) + 0 * ph], axis=-1)
    U = cx0 + N[..., 0] * Rpx
    V = cy0 + N[..., 1] * Rpx
    tex = map_coordinates(bz, [V.ravel(), U.ravel()], order=1,
                          mode="nearest").reshape(V.shape)
    C = grey(tex)
    t = np.clip(N[..., 2] / 0.12, 0, 1)[..., None]          # fade near the terminator
    C = t * C + (1 - t) * np.array(matplotlib.colors.to_rgba(FAR))
    ax.plot_surface(N[..., 0], N[..., 1], N[..., 2], rstride=1, cstride=1,
                    facecolors=C, shade=False, antialiased=False, linewidth=0, zorder=1)

    # crisp overlay patch around the AR (same true texture mapping, tiny radial lift)
    npq = 130 if fast else 220
    g = np.linspace(-88, 92, npq)                 # CUT px around the patch centre
    GX, GY = np.meshgrid(g + (nx - 1) / 2, g + (ny - 1) / 2)
    Pg = embed(np.column_stack([GX.ravel(), GY.ravel(), np.zeros(GX.size)]))
    S = 1.0015 * Pg.reshape(npq, npq, 3)
    Uo = cx0 + Pg[:, 0].reshape(npq, npq) * Rpx
    Vo = cy0 + Pg[:, 1].reshape(npq, npq) * Rpx
    texo = map_coordinates(bz, [Vo.ravel(), Uo.ravel()], order=1,
                           mode="nearest").reshape(npq, npq)
    Co = grey(texo)
    Co[~_visible(Pg, d).reshape(npq, npq)] = (0, 0, 0, 0)   # hide beyond the horizon
    ax.plot_surface(S[..., 0], S[..., 1], S[..., 2], rstride=1, cstride=1,
                    facecolors=Co, shade=False, antialiased=False, linewidth=0, zorder=2)

    # field lines (occlusion-culled against the sphere)
    for ln, wgt in arcade:
        _plot_culled(ax, embed(ln), d, color=ARC, lw=0.5 + 0.9 * wgt,
                     alpha=0.28 + 0.34 * wgt, zorder=3, solid_capstyle="round")
    for ln in skel:
        _plot_culled(ax, embed(ln), d, color=NUL, lw=1.5, alpha=0.9, zorder=4,
                     solid_capstyle="round")
    star = embed(np.array([p0]))[0]
    ax.scatter(*star, s=170, c=STAR, marker="*", edgecolor="#442200",
               linewidth=0.8, zorder=6, depthshade=False)

    # framing: zoom on the AR with the limb in view
    c = 0.86 * n0
    h = 0.52
    ax.set_xlim(c[0] - h, c[0] + h); ax.set_ylim(c[1] - h, c[1] + h)
    ax.set_zlim(c[2] - h, c[2] + h)
    ax.set_box_aspect((1, 1, 1))
    ax.view_init(elev=ELEV, azim=AZIM)

    # ---- inset: the null close up (local box coords, true data) -------------------
    axi = fig.add_axes([0.005, 0.015, 0.30, 0.42], projection="3d",
                       computed_zorder=False)
    axi.set_facecolor(BG); axi.set_axis_off(); axi.set_proj_type("ortho")
    fig.add_artist(matplotlib.patches.FancyBboxPatch(
        (0.008, 0.02), 0.292, 0.435, boxstyle="round,pad=0.004,rounding_size=0.01",
        transform=fig.transFigure, facecolor=BG, edgecolor="#2a3242",
        linewidth=1.0, zorder=1.5))
    axi.set_zorder(2)                              # inset content above its card
    L, ZT = 15.0, 24.0
    gi = np.linspace(-L, L, 40)
    GXi, GYi = np.meshgrid(gi + p0[0], gi + p0[1])
    txi = map_coordinates(cut, [GYi.ravel(), GXi.ravel()], order=1,
                          mode="nearest").reshape(GXi.shape)
    axi.plot_surface(GXi, GYi, 0 * GXi, rstride=1, cstride=1,
                     facecolors=grey(txi) * [1, 1, 1, 0.55], shade=False,
                     antialiased=False, linewidth=0, zorder=1)
    inl = lambda q: ((np.abs(q[:, 0] - p0[0]) < L) & (np.abs(q[:, 1] - p0[1]) < L)
                     & (q[:, 2] < ZT))
    for ln in skel:
        ok = inl(ln)
        cutpts = np.flatnonzero(np.diff(ok.astype(int))) + 1
        for run in np.split(np.arange(len(ln)), cutpts):
            if ok[run[0]] and len(run) > 2:
                axi.plot(ln[run, 0], ln[run, 1], ln[run, 2], color=NUL, lw=1.3,
                         alpha=0.9, zorder=3)
    axi.plot([p0[0]] * 2, [p0[1]] * 2, [0, p0[2]], color="#777f8c", lw=0.7,
             ls=(0, (2, 2)), zorder=2)
    axi.scatter(*p0, s=150, c=STAR, marker="*", edgecolor="#442200", linewidth=0.8,
                zorder=5, depthshade=False)
    axi.set_xlim(p0[0] - L, p0[0] + L); axi.set_ylim(p0[1] - L, p0[1] + L)
    axi.set_zlim(0, ZT)
    axi.set_box_aspect((1, 1, 0.8))
    axi.view_init(elev=16, azim=-55)

    fig.text(0.017, 0.965, "The real coronal skeleton — AR11429 on the actual Sun",
             color=INK, fontsize=11.5, fontweight="bold")
    fig.text(0.017, 0.938, "SDO/HMI full-disk magnetogram, 2012-03-07 00:01 UT (X5.4-"
             "flare day) · potential-field extrapolation · every curve is a field line",
             color="#8a93a3", fontsize=8.2)
    fig.text(0.155, 0.435, "the null, close up — spine & fan", color=INK, fontsize=8.4,
             ha="center")
    out = REPO / "public/img/posts/forbidden-directions-coronal-skeleton.png"
    fig.savefig(out, facecolor=BG)
    print("rendered", out.name)


if __name__ == "__main__":
    fast = "--fast" in sys.argv
    if not fast:
        triptych()
        constellation()
    skeleton(fast=fast)
