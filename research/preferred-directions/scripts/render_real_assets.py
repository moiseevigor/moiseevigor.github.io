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


def _plot_faded(ax, P, d, color, lw, alpha, zorder, fade=0.22, wpt=None):
    """Occlusion-culled polyline whose ends FADE OUT instead of cutting hard.

    wpt (optional, len(P)): per-POINT alpha weights in [0,1] -- e.g. proximity to an
    artificial domain wall. Bundles of lines all hitting the same wall stack their
    faded ends back to opacity unless the whole bundle dims coherently; wpt is how.
    """
    from mpl_toolkits.mplot3d.art3d import Line3DCollection
    vis = _visible(P, d)
    cut = np.flatnonzero(np.diff(vis.astype(int))) + 1
    for run in np.split(np.arange(len(P)), cut):
        if not vis[run[0]] or len(run) < 4:
            continue
        Q = P[run]
        segs = np.stack([Q[:-1], Q[1:]], axis=1)
        n = len(segs)
        idx = np.arange(n)
        nf = max(2, int(fade * n))
        a = np.minimum(np.minimum(idx + 1, n - idx) / nf, 1.0) * alpha
        if wpt is not None:
            wr = wpt[run]
            a = a * 0.5 * (wr[:-1] + wr[1:])
        rgba = np.tile(np.asarray(matplotlib.colors.to_rgba(color)), (n, 1))
        rgba[:, 3] = np.clip(a, 0, 1)
        lc = Line3DCollection(segs, colors=rgba, linewidths=lw, zorder=zorder,
                              capstyle="round")
        ax.add_collection3d(lc)


def _edge_weight(P_box, nx, ny, nz, w_px=9.0):
    """Per-point fade weight ~ distance to the ARTIFICIAL box walls (sides + top).

    The bottom (photosphere) is a physical boundary -- lines may end there crisply.
    """
    dx = np.minimum(P_box[:, 0] - 1, nx - 2 - P_box[:, 0])
    dy = np.minimum(P_box[:, 1] - 1, ny - 2 - P_box[:, 1])
    dz = nz - 2 - P_box[:, 2]
    return np.clip(np.minimum(np.minimum(dx, dy), dz) / w_px, 0.0, 1.0)


def _ar11429_volume():
    """The AR11429 survey volume, RECENTERED on its null so traced lines have room
    in every direction (the flux-centred window put the null 14 px from a wall).
    Verifies the null survives the shifted window (window-sensitivity is real --
    see R3); falls back to the flux-centred window if not.
    Returns (cut, B, nulls_sorted_by_height, p0, (cy, cx))."""
    from scipy.ndimage import zoom
    bz = dict(load_magnetograms())["2012-03-07"]

    def build(cy, cx):
        cut = zoom(bz[cy - WIN // 2:cy + WIN // 2, cx - WIN // 2:cx + WIN // 2],
                   CUT / WIN, order=1)
        B, _A = solar.potential_field(cut, NZ, dz=1.0)
        ny, nx, nz, _ = B.shape
        nulls = [nl for nl in solar.find_nulls(B, seeds_per_axis=12)
                 if 6 < nl["p"][0] < nx - 6 and 6 < nl["p"][1] < ny - 6
                 and 3 < nl["p"][2] < nz - 3]
        nulls.sort(key=lambda nl: nl["p"][2])
        return cut, B, nulls

    cy0, cx0 = 640, 640
    cut, B, nulls = build(cy0, cx0)
    p_ref = nulls[0]["p"]
    # shift the window so the null lands mid-box
    cxn = int(round(cx0 + (p_ref[0] - (CUT - 1) / 2) * (WIN / CUT)))
    cyn = int(round(cy0 + (p_ref[1] - (CUT - 1) / 2) * (WIN / CUT)))
    cut2, B2, nulls2 = build(cyn, cxn)
    c = (CUT - 1) / 2
    if nulls2 and np.linalg.norm(nulls2[0]["p"][:2] - c) < 25:
        print(f"AR volume recentered on null: window ({cyn},{cxn}), "
              f"null at {np.round(nulls2[0]['p'],1)}")
        return cut2, B2, nulls2, nulls2[0]["p"], (cyn, cxn)
    print("recentering lost the null -- falling back to the flux-centred window")
    return cut, B, nulls, p_ref, (cy0, cx0)


def skeleton(fast=False):
    """The stage as the actual Sun: full-disk magnetogram on a sphere, the AR11429
    extrapolation patch embedded at its true disk position (tangent/exponential map,
    true height scale), field lines occlusion-culled, null close-up inset."""
    from scipy.ndimage import zoom, map_coordinates, gaussian_filter
    bz = dict(load_magnetograms())["2012-03-07"]
    # null-recentered survey volume: the null sits mid-box, so its lines have room
    # in every direction before the honest wall fade (see _ar11429_volume)
    cut, B, nulls, p0, (cy, cx) = _ar11429_volume()
    ny, nx, nz, _ = B.shape
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
        ln = _trace(B, np.array([ix[j], iy[j], 1.5]), sgn, ds=0.35, steps=1600)
        if len(ln) > 10:
            arcade.append((ln, w[j] / w.max()))
    skel = []
    for _ in range(26):
        u = rng.standard_normal(3); u /= np.linalg.norm(u)
        for sgn in (+1.0, -1.0):
            ln = _trace(B, p0 + 1.2 * u, sgn, ds=0.3, steps=2600)
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
    # NB (matplotlib 3.11): Axes3D clips artists to its centred square viewport, and
    # an opaque axes patch draws over sibling-axes content -- hence facecolor "none"
    # and clip_on=False throughout.
    BG, FAR, INK = "#0b0e14", "#191308", "#c7cdd8"
    ARC, NUL, STAR = "#7aa8dc", "#ff8b2e", "#ffd34d"
    VDISP = 550.0                                  # display range [G]
    # the Sun we are used to: warm yellow quiet disk, dark-brown negative polarity,
    # near-white positive; one colormap drives sphere, patch and inset alike
    _SOLAR = matplotlib.colors.LinearSegmentedColormap.from_list("solar", [
        (0.00, "#160b00"), (0.26, "#7a4d0e"), (0.42, "#d99e2b"),
        (0.50, "#f3bf4a"), (0.58, "#ffd97e"), (0.74, "#fff0c3"), (1.00, "#fffdf2")])
    grey = lambda val: _SOLAR(np.clip(val / (2 * VDISP) + 0.5, 0.02, 0.98))
    ELEV, AZIM = 17, -38
    d = _cam_dir(ELEV, AZIM)

    fig = plt.figure(figsize=(10.2, 7.0), dpi=110 if fast else 165)
    fig.patch.set_facecolor(BG)
    ax = fig.add_axes([0, 0, 1, 1], projection="3d", computed_zorder=False)
    ax.set_facecolor("none"); ax.set_axis_off(); ax.set_proj_type("ortho")

    # base sphere textured with the real full-disk magnetogram (smoothed against
    # mesh aliasing; dark past the limb where HMI has no data)
    bz_s = gaussian_filter(bz, 2.0)
    nlat, nlon = (120, 240) if fast else (360, 720)
    th = np.linspace(0, np.pi, nlat)[:, None]     # colatitude from +z (observer axis)
    ph = np.linspace(0, 2 * np.pi, nlon)[None, :]
    N = np.stack([np.sin(th) * np.cos(ph) + 0 * ph,
                  np.sin(th) * np.sin(ph) + 0 * ph,
                  np.cos(th) + 0 * ph], axis=-1)
    U = cx0 + N[..., 0] * Rpx
    V = cy0 + N[..., 1] * Rpx
    tex = map_coordinates(bz_s, [V.ravel(), U.ravel()], order=1,
                          mode="nearest").reshape(V.shape)
    C = grey(tex)
    t = np.clip(N[..., 2] / 0.10, 0, 1)[..., None]          # no data past the limb
    C = t * C + (1 - t) * np.array(matplotlib.colors.to_rgba(FAR))
    s1 = ax.plot_surface(N[..., 0], N[..., 1], N[..., 2], rstride=1, cstride=1,
                         facecolors=C, shade=False, antialiased=False, linewidth=0,
                         zorder=1)
    s1.set_clip_on(False)

    # crisp overlay over the framed foreground (same true texture mapping, tiny
    # radial lift), blended to the smoothed texture at its rim
    npq = 200 if fast else 320
    HW = 160.0
    g = np.linspace(-HW, HW, npq)                 # CUT px around the patch centre
    GX, GY = np.meshgrid(g + (nx - 1) / 2, g + (ny - 1) / 2)
    Pg = embed(np.column_stack([GX.ravel(), GY.ravel(), np.zeros(GX.size)]))
    S = 1.0006 * Pg.reshape(npq, npq, 3)
    Uo = cx0 + Pg[:, 0].reshape(npq, npq) * Rpx
    Vo = cy0 + Pg[:, 1].reshape(npq, npq) * Rpx
    texo = map_coordinates(bz_s, [Vo.ravel(), Uo.ravel()], order=1,
                           mode="nearest").reshape(npq, npq)
    texf = map_coordinates(bz, [Vo.ravel(), Uo.ravel()], order=1,
                           mode="nearest").reshape(npq, npq)
    r_edge = np.maximum(np.abs(GX - (nx - 1) / 2), np.abs(GY - (ny - 1) / 2)) / HW
    blend = np.clip((r_edge - 0.5) / 0.4, 0, 1)   # crisp core -> smooth rim
    Co = grey((1 - blend) * texf + blend * texo)
    to = np.clip(Pg[:, 2].reshape(npq, npq) / 0.10, 0, 1)[..., None]  # same limb fade
    Co = to * Co + (1 - to) * np.array(matplotlib.colors.to_rgba(FAR))
    Co[..., 3] = 1.0
    Co[~_visible(Pg, d).reshape(npq, npq)] = (0, 0, 0, 0)   # hide beyond the horizon
    s2 = ax.plot_surface(S[..., 0], S[..., 1], S[..., 2], rstride=1, cstride=1,
                         facecolors=Co, shade=False, antialiased=False, linewidth=0,
                         zorder=2)
    s2.set_clip_on(False)

    # field lines (occlusion-culled, ends fading out, bundles dimming toward the
    # artificial box walls so shared exits cannot stack back into a hard cut)
    for ln, wgt in arcade:
        _plot_faded(ax, embed(ln), d, color=ARC, lw=1.0 + 1.2 * wgt,
                    alpha=0.40 + 0.35 * wgt, zorder=3,
                    wpt=_edge_weight(ln, nx, ny, nz))
    for ln in skel:
        _plot_faded(ax, embed(ln), d, color=NUL, lw=1.7, alpha=0.95, zorder=4,
                    fade=0.30, wpt=_edge_weight(ln, nx, ny, nz, w_px=12.0))
    star = embed(np.array([p0]))[0]
    for s_, a_ in ((1500, 0.06), (650, 0.16)):    # soft glow behind the star
        ax.scatter(*star, s=s_, c=STAR, marker="o", alpha=a_, linewidth=0,
                   zorder=5, depthshade=False, clip_on=False)
    ax.scatter(*star, s=230, c=STAR, marker="*", edgecolor="#442200",
               linewidth=0.9, zorder=6, depthshade=False, clip_on=False)

    # framing: tight on the midpoint between the arcade and the null, limb in view
    c = 0.97 * embed(np.array([[41.0, 60.0, 12.0]]))[0]
    h = 0.30
    ax.set_xlim(c[0] - h, c[0] + h); ax.set_ylim(c[1] - h, c[1] + h)
    ax.set_zlim(c[2] - h, c[2] + h)
    ax.set_box_aspect((1, 1, 1))
    ax.view_init(elev=ELEV, azim=AZIM)

    # ---- inset: the null close up, in its own card ---------------------------------
    fig.add_artist(matplotlib.patches.FancyBboxPatch(
        (0.018, 0.035), 0.285, 0.40, boxstyle="round,pad=0.008,rounding_size=0.012",
        transform=fig.transFigure, facecolor="#10141d", edgecolor="#2a3242",
        linewidth=0.9, zorder=0.5))
    axi = fig.add_axes([0.018, 0.025, 0.285, 0.375], projection="3d",
                       computed_zorder=False)
    axi.set_zorder(1)                              # inset content above its card
    axi.set_facecolor("none"); axi.set_axis_off(); axi.set_proj_type("ortho")
    L, ZT = 16.0, 24.0
    gi = np.linspace(-L, L, 48)
    GXi, GYi = np.meshgrid(gi + p0[0], gi + p0[1])
    txi = map_coordinates(cut, [GYi.ravel(), GXi.ravel()], order=1,
                          mode="nearest").reshape(GXi.shape)
    re_ = np.maximum(np.abs(GXi - p0[0]), np.abs(GYi - p0[1])) / L
    fade = (0.88 * np.clip((0.98 - re_) / 0.25, 0, 1))[..., None]
    Ci = fade * grey(txi) + (1 - fade) * np.array(matplotlib.colors.to_rgba("#10141d"))
    Ci[..., 3] = 1.0                               # opaque blend: no per-quad seams
    axi.plot_surface(GXi, GYi, 0 * GXi, rstride=1, cstride=1, facecolors=Ci,
                     shade=False, antialiased=False, linewidth=0, zorder=1)
    inl = lambda q: ((np.abs(q[:, 0] - p0[0]) < L) & (np.abs(q[:, 1] - p0[1]) < L)
                     & (q[:, 2] < ZT))
    from mpl_toolkits.mplot3d.art3d import Line3DCollection
    for ln in skel:
        ok = inl(ln)
        # fade toward the CROP boundary (and box walls) instead of hard-clipping;
        # bundles that leave the crop together dim together
        wcrop = np.clip(np.minimum.reduce([
            (L - np.abs(ln[:, 0] - p0[0])), (L - np.abs(ln[:, 1] - p0[1])),
            (ZT - ln[:, 2])]) / 3.5, 0.0, 1.0)
        wcrop *= _edge_weight(ln, nx, ny, nz, w_px=6.0)
        cutpts = np.flatnonzero(np.diff(ok.astype(int))) + 1
        for run in np.split(np.arange(len(ln)), cutpts):
            if not ok[run[0]] or len(run) < 3:
                continue
            Q = ln[run]
            segs = np.stack([Q[:-1], Q[1:]], axis=1)
            a = 0.9 * 0.5 * (wcrop[run][:-1] + wcrop[run][1:])
            rgba = np.tile(np.asarray(matplotlib.colors.to_rgba(NUL)), (len(segs), 1))
            rgba[:, 3] = np.clip(a, 0, 1)
            axi.add_collection3d(Line3DCollection(segs, colors=rgba, linewidths=1.4,
                                                  zorder=3, capstyle="round"))
    axi.plot([p0[0]] * 2, [p0[1]] * 2, [0, p0[2]], color="#777f8c", lw=0.8,
             ls=(0, (2, 2)), zorder=2)
    for s_, a_ in ((1300, 0.07), (550, 0.16)):
        axi.scatter(*p0, s=s_, c=STAR, marker="o", alpha=a_, linewidth=0,
                    zorder=4, depthshade=False)
    axi.scatter(*p0, s=190, c=STAR, marker="*", edgecolor="#442200", linewidth=0.9,
                zorder=5, depthshade=False)
    axi.set_xlim(p0[0] - L, p0[0] + L); axi.set_ylim(p0[1] - L, p0[1] + L)
    axi.set_zlim(0, ZT)
    axi.set_box_aspect((1, 1, 0.75))
    axi.view_init(elev=18, azim=-52)

    # ---- annotations ----------------------------------------------------------------
    from mpl_toolkits.mplot3d import proj3d
    x2, y2, _ = proj3d.proj_transform(star[0], star[1], star[2], ax.get_proj())
    sxy = fig.transFigure.inverted().transform(ax.transData.transform((x2, y2)))
    fig.text(0.017, 0.965, "The real coronal skeleton — AR11429 on the actual Sun",
             color=INK, fontsize=11.5, fontweight="bold")
    fig.text(0.017, 0.938, "SDO/HMI full-disk magnetogram, 2012-03-07 00:01 UT (X5.4-"
             "flare day) · potential-field extrapolation · every curve is a field line",
             color="#8a93a3", fontsize=8.2)
    fig.text(0.161, 0.415, "the null, close up — spine & fan", color=INK, fontsize=8.4,
             ha="center", zorder=21)
    fig.add_artist(matplotlib.lines.Line2D(
        [0.308, sxy[0] - 0.006], [0.43, sxy[1] - 0.010],
        color="#566070", lw=0.9, zorder=0.6))
    out = REPO / "public/img/posts/forbidden-directions-coronal-skeleton.png"
    fig.savefig(out, facecolor=BG, dpi=fig.dpi)
    print("rendered", out.name)


# ---------------------------------------------------------------- null anatomy

def _fan_basis(M, cls):
    """Orthonormal (u1, u2) spanning the fan plane of a null with Jacobian M."""
    w, V = np.linalg.eig(M)
    ri = int(np.argmin(np.abs(w - cls["spine_val"])))
    fi = [k for k in range(3) if k != ri]
    if cls["type"] == "spiral":
        u1, u2 = np.real(V[:, fi[0]]), np.imag(V[:, fi[0]])
    else:
        u1, u2 = np.real(V[:, fi[0]]), np.real(V[:, fi[1]])
    u1 = u1 / np.linalg.norm(u1)
    u2 = u2 - (u2 @ u1) * u1
    u2 = u2 / np.linalg.norm(u2)
    return u1, u2


def _draw_glyph(ax, cls):
    """Type schematic (X-type radial / O-type spiral) in axes coords."""
    ax.set_xlim(0, 1); ax.set_ylim(0, 1)
    c, r = np.array([0.5, 0.62]), 0.17
    if cls["type"] == "radial":
        for sgn in (+1, -1):
            ax.annotate("", xy=c + [0, sgn * r * 1.45], xytext=c,
                        arrowprops=dict(arrowstyle="-|>", color="#e65100", lw=2.0))
        th = np.linspace(0, 2 * np.pi, 60)
        ax.plot(c[0] + r * 1.25 * np.cos(th), c[1] + r * 0.45 * np.sin(th),
                color="#1565c0", lw=1.6, ls="--")
        for sgn in (+1, -1):
            ax.annotate("", xy=c + [sgn * r * 1.7, 0], xytext=c + [sgn * r * 0.6, 0],
                        arrowprops=dict(arrowstyle="-|>", color="#1565c0", lw=1.4))
    else:
        th = np.linspace(0, 3.6 * np.pi, 200)
        rr = 0.03 + 0.045 * th
        ax.plot(c[0] + rr * np.cos(th) * 1.15, c[1] + rr * np.sin(th) * 0.55,
                color="#1565c0", lw=1.7)
        for sgn in (+1, -1):
            ax.annotate("", xy=c + [0, sgn * r * 1.5], xytext=c,
                        arrowprops=dict(arrowstyle="-|>", color="#e65100", lw=2.0))
    ax.plot(*c, marker="*", ms=15, mfc="#ffd34d", mec="#442200", mew=0.8)


def _anatomy_rows(fig, axesrow, lines, p0, M, L, unit, row_title):
    """One null's row: three orthogonal projections + the info/schematic panel."""
    import nulltopo
    Mn = M / np.abs(np.linalg.eigvals(M)).max()
    Mn = Mn - np.eye(3) * np.trace(Mn) / 3
    cls = nulltopo.classify_null(Mn)
    sp = cls["spine"]
    u1, u2 = _fan_basis(Mn, cls)
    th = np.linspace(0, 2 * np.pi, 90)
    ring = (p0[None, :] + 0.62 * L * (np.outer(np.cos(th), u1)
                                      + np.outer(np.sin(th), u2)))
    pairs = [((0, 1), "x–y  (top view)"), ((0, 2), "x–z  (side)"), ((1, 2), "y–z  (front)")]
    for ax, ((i, j), pt) in zip(axesrow[:3], pairs):
        for ln in lines:
            ax.plot(ln[:, i], ln[:, j], color="#7aa0c4", lw=0.55, alpha=0.55, zorder=1)
        ax.plot(ring[:, i], ring[:, j], color="#1565c0", lw=1.5, ls="--", zorder=3,
                label="fan plane")
        for sgn in (+1, -1):
            tip = p0 + sgn * 0.85 * L * sp
            ax.annotate("", xy=(tip[i], tip[j]), xytext=(p0[i], p0[j]),
                        arrowprops=dict(arrowstyle="-|>", color="#e65100", lw=2.2),
                        zorder=4)
        for u in (u1, u2):
            for sgn in (+1, -1):
                tip = p0 + sgn * 0.62 * L * u
                ax.plot([p0[i], tip[i]], [p0[j], tip[j]], color="#1565c0", lw=1.0,
                        ls=":", zorder=3)
        # no marker at the null: the centre stays clean so the singularity itself
        # (the field lines' X) is visible; spine arrows + fan ellipse locate it
        ax.set_xlim(p0[i] - L, p0[i] + L); ax.set_ylim(p0[j] - L, p0[j] + L)
        ax.set_aspect("equal"); ax.tick_params(labelsize=6.5)
        ax.set_title(pt, fontsize=8)
        ax.set_xlabel(f"{'xyz'[i]} [{unit}]", fontsize=7)
        ax.set_ylabel(f"{'xyz'[j]} [{unit}]", fontsize=7)
    ax = axesrow[3]; ax.set_axis_off()
    _draw_glyph(ax, cls)
    ev = np.array2string(np.round(np.real_if_close(cls["eigs"], tol=1e6), 2),
                         separator=", ")
    ax.text(0.5, 0.985, row_title, transform=ax.transAxes, ha="center", va="top",
            fontsize=8.6, fontweight="bold")
    info = (f"{cls['label']}\n$\\nabla B$ eigs (norm.): {ev}\n"
            f"$J_\\parallel$ = {cls['J_parallel']:+.2f} · SR growth vector Q = 6\n"
            "orange = spine (principal axis)\nblue dashed = fan plane")
    ax.text(0.5, 0.30, info, transform=ax.transAxes, ha="center", va="top",
            fontsize=6.9)


def null_anatomy_sun():
    """Anatomy crops of the AR11429 coronal nulls: projections + principal axes."""
    cut, B, nulls, _p0, _cyx = _ar11429_volume()
    ny, nx, nz, _ = B.shape
    rng = np.random.default_rng(4)
    fig, axes = plt.subplots(len(nulls), 4, figsize=(11.4, 3.1 * len(nulls)), dpi=150)
    axes = np.atleast_2d(axes)
    for row, nl in zip(axes, nulls):
        p0 = nl["p"]
        lines = []
        for _ in range(30):
            u = rng.standard_normal(3); u /= np.linalg.norm(u)
            for sgn in (+1.0, -1.0):
                ln = _trace(B, p0 + 1.1 * u, sgn, ds=0.25, steps=260)
                if len(ln) > 8:
                    lines.append(ln)
        _anatomy_rows(fig, row, lines, p0, nl["gradB"], 12.0, "px",
                      f"coronal null · h = {p0[2]:.0f} px  (AR11429, real)")
    fig.suptitle("Null anatomy on the real Sun — AR11429 (SDO/HMI 2012-03-07, "
                 "potential extrapolation): field lines, principal axes, type schematic",
                 fontsize=10, fontweight="bold")
    fig.tight_layout(rect=[0, 0, 1, 0.945])
    out = REPO / "public/img/posts/forbidden-directions-null-anatomy-sun.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print("rendered", out.name)


def null_anatomy_earth():
    """Anatomy crops of two magnetospheric nulls (one radial, one spiral)."""
    from datetime import datetime, timezone
    import magnetosphere as ms
    import nulltopo
    data = json.loads((ROOT / "artifacts" / "p4_magnetosphere.json").read_text())
    # core census only (|x| <= 40 RE) -- same trust region as the constellation figure
    cand = [n for n in data["nulls"]
            if abs(n["p_gsm_re"][0]) <= 40 and abs(n["p_gsm_re"][1]) < 25]
    radial = min((n for n in cand if n["type"] == "radial"),
                 key=lambda n: abs(n["J_parallel"]))
    spiral = max((n for n in cand if n["type"] == "spiral"),
                 key=lambda n: min(abs(n["J_parallel"]), 3.0))
    ut = datetime(2012, 3, 7, 0, 0, tzinfo=timezone.utc).timestamp()
    field = ms.Magnetosphere(ut, [3.0, -50.0, 0.0, -5.0, 0, 0, 0, 0, 0, 0])

    def trace_cb(p_start, direction, ds=0.06, steps=420, box=3.0, p_ref=None):
        pts = [np.asarray(p_start, float)]
        q = pts[0].copy()
        for _ in range(steps):
            b = field.B(q); nb = np.linalg.norm(b)
            if nb < 1e-4:
                break
            q = q + direction * ds * b / nb
            if np.linalg.norm(q - p_ref) > box:
                break
            pts.append(q.copy())
        return np.array(pts)

    rng = np.random.default_rng(6)
    fig, axes = plt.subplots(2, 4, figsize=(11.4, 6.2), dpi=150)
    for row, rec, tag in ((axes[0], radial, "radial"), (axes[1], spiral, "spiral")):
        p0 = np.array(rec["p_gsm_re"], float)
        M = field.jac(p0)
        # fan-adapted seeding: a ring in the fan plane (shows the straight fan of a
        # radial null and the WINDING fan of a spiral one) + a few spine offsets
        import nulltopo as _nt
        Mn = M / np.abs(np.linalg.eigvals(M)).max()
        cls0 = _nt.classify_null(Mn - np.eye(3) * np.trace(Mn) / 3)
        v1, v2 = _fan_basis(Mn - np.eye(3) * np.trace(Mn) / 3, cls0)
        lines = []
        for thseed in np.linspace(0, 2 * np.pi, 14, endpoint=False):
            s0 = p0 + 0.16 * (np.cos(thseed) * v1 + np.sin(thseed) * v2)
            for sgn in (+1.0, -1.0):
                ln = trace_cb(s0, sgn, ds=0.028, steps=900, p_ref=p0)
                if len(ln) > 8:
                    lines.append(ln)
        for soff in (+0.3, -0.3):
            for sgn in (+1.0, -1.0):
                ln = trace_cb(p0 + soff * np.asarray(cls0["spine"]), sgn,
                              ds=0.028, steps=900, p_ref=p0)
                if len(ln) > 8:
                    lines.append(ln)
        _anatomy_rows(fig, row, lines, p0, M, 1.6, "$R_E$",
                      f"magnetospheric {tag} null · GSM ({p0[0]:.0f}, {p0[1]:.0f}, "
                      f"{p0[2]:.0f}) $R_E$")
    fig.suptitle("Null anatomy in Earth's magnetosphere (IGRF + Tsyganenko T96, "
                 "2012-03-07 storm): the radial null's straight fan vs the spiral "
                 "null's winding fan", fontsize=10, fontweight="bold")
    fig.tight_layout(rect=[0, 0, 1, 0.95])
    out = REPO / "public/img/posts/forbidden-directions-null-anatomy-earth.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print("rendered", out.name)


def aia_overlay():
    """The corona seen vs the corona computed: real SDO/AIA 171 A EUV emission of
    AR11429 (the plasma lighting up the true field lines) with OUR potential-field
    extrapolation's lines overlaid at the correct plate position -- the classic
    loops-vs-extrapolation comparison, on the skeleton's exact day and region."""
    from astropy.io import fits
    from scipy.ndimage import zoom
    import sunpy.visualization.colormaps  # registers 'sdoaia171'  # noqa: F401

    aia_files = sorted((ROOT / "artifacts" / "hmi").glob("*aia*171*"))
    assert aia_files, "no AIA 171 file -- run scripts/fetch_aia.py"
    hdul = fits.open(aia_files[0])
    hdul.verify("silentfix")
    h = next(h for h in hdul if getattr(h, "data", None) is not None
             and h.data.ndim == 2)
    aia, ahdr = np.nan_to_num(np.asarray(h.data, float)), h.header
    # AIA plate geometry from its own header
    acx, acy = float(ahdr["CRPIX1"]) - 1, float(ahdr["CRPIX2"]) - 1
    arsun = float(ahdr["RSUN_OBS"]) / float(ahdr["CDELT1"])   # px per R_sun

    # HMI disk geometry from the FITS HEADER (exact; the data-driven limb estimate
    # overshoots the radius by ~2.5% -- off-limb noise -- enough to shift the AR by
    # ~15 AIA px), scaled 4096 -> 1024
    hmi_f = sorted((ROOT / "artifacts" / "hmi").glob("hmi.m_45s.2012*"))[0]
    hh = fits.open(hmi_f); hh.verify("silentfix")
    hhdr = next(x.header for x in hh if getattr(x, "data", None) is not None
                and x.data.ndim == 2)
    s4 = 1024.0 / hhdr["NAXIS1"]
    hcx = (hhdr["CRPIX1"] - 1) * s4
    hcy = (hhdr["CRPIX2"] - 1) * s4
    hR = hhdr["RSUN_OBS"] / hhdr["CDELT1"] * s4
    bz = dict(load_magnetograms())["2012-03-07"]

    def hmi_to_aia(xh, yh):
        """HMI 1024-px coords -> AIA px via normalised disk coordinates.

        HMI level-1 frames are camera-rotated 180 deg (CROTA2 ~ 179.93) while AIA is
        upright (CROTA2 ~ 0.02), so disk-relative coordinates NEGATE across
        instruments. (Our survey pipeline works in raw HMI array coords throughout,
        which is self-consistent; only this cross-instrument overlay must correct.)
        """
        return (acx - (np.asarray(xh) - hcx) / hR * arsun,
                acy - (np.asarray(yh) - hcy) / hR * arsun)

    # TWO volumes of the same magnetogram: the null and its fan live in the
    # null-recentered window (room in every direction); the arcade is traced in the
    # flux-centred window, which fully contains the AR loop system the EUV shows.
    from scipy.ndimage import zoom as _zoom
    cut, B, nulls, p0, (cy, cx) = _ar11429_volume()
    ny, nx, nz, _ = B.shape
    cyf, cxf = 640, 640
    cutf = _zoom(bz[cyf - WIN // 2:cyf + WIN // 2, cxf - WIN // 2:cxf + WIN // 2],
                 CUT / WIN, order=1)
    Bf, _Af = solar.potential_field(cutf, NZ, dz=1.0)
    rng = np.random.default_rng(2)
    # PHYSICAL seed threshold (250 G): roots the arcade in real plage/spot flux --
    # a percentile threshold on the null-centred window scatters seeds across weak
    # network field and draws arcs over quiet regions the EUV does not light up
    iy, ix = np.where(np.abs(cutf) >= 250.0)
    w = np.abs(cutf)[iy, ix]
    sel = rng.choice(len(ix), size=min(140, len(ix)), replace=False, p=w / w.sum())
    arcade = []
    for j in sel:
        sgn = +1.0 if cutf[iy[j], ix[j]] > 0 else -1.0
        ln = _trace(Bf, np.array([ix[j], iy[j], 1.5]), sgn, ds=0.35, steps=1600)
        if len(ln) > 10:
            arcade.append((ln, w[j] / w.max()))
    skel = []
    for _ in range(22):
        u = rng.standard_normal(3); u /= np.linalg.norm(u)
        for sgn in (+1.0, -1.0):
            ln = _trace(B, p0 + 1.2 * u, sgn, ds=0.3, steps=2600)
            if len(ln) > 8:
                skel.append(ln)

    def box_to_aia(ln, cyw=None, cxw=None):
        """Box coords (cut px + height) -> AIA px, incl. line-of-sight parallax."""
        cyw = cy if cyw is None else cyw
        cxw = cx if cxw is None else cxw
        xh = cxw - WIN / 2 + ln[:, 0] * (WIN / CUT)
        yh = cyw - WIN / 2 + ln[:, 1] * (WIN / CUT)
        ax_, ay_ = hmi_to_aia(xh, yh)
        # apparent shift of height h toward the limb, in the AIA frame's orientation
        rx = (ax_ - acx) / arsun; ry = (ay_ - acy) / arsun
        hpx = ln[:, 2] * (WIN / CUT) / hR * arsun
        return ax_ + hpx * rx, ay_ + hpx * ry

    # crop the AIA frame around BOTH structures: centre on the midpoint of the
    # null window and the flux window, so neither the arcade nor the fan clips
    axn, ayn = hmi_to_aia(cx, cy)
    axf, ayf = hmi_to_aia(cxf, cyf)
    ax0, ay0 = (axn + axf) / 2, (ayn + ayf) / 2
    half = int(1.35 * WIN / hR * arsun / 2) + 100
    x_lo, y_lo = int(ax0 - half), int(ay0 - half)
    crop = aia[y_lo:y_lo + 2 * half, x_lo:x_lo + 2 * half]

    fig, ax = plt.subplots(figsize=(8.6, 8.2), dpi=150)
    vmax = np.percentile(crop, 99.85)
    ax.imshow(np.clip(crop, 0, vmax) ** 0.5, origin="lower", cmap="sdoaia171")
    ax.set_xticks([]); ax.set_yticks([])
    for ln, wgt in arcade:
        xa, ya = box_to_aia(ln, cyf, cxf)
        ax.plot(xa - x_lo, ya - y_lo, color="#a9cdf0", lw=1.3,
                alpha=0.30 + 0.40 * wgt)
    for ln in skel:
        xa, ya = box_to_aia(ln)
        ax.plot(xa - x_lo, ya - y_lo, color="#ff8b2e", lw=1.7, alpha=0.8)
    xn, yn = box_to_aia(p0[None, :])
    ax.plot(xn - x_lo, yn - y_lo, marker="*", ms=15, mfc="#ffd34d",
            mec="#442200", mew=0.9)
    ax.set_xlim(0, crop.shape[1]); ax.set_ylim(0, crop.shape[0])   # clamp to image
    ax.set_title("AR11429, 2012-03-07 00:00 UT — our potential-field lines (blue: "
                 "arcade; orange: null) over the real SDO/AIA 171 Å corona",
                 fontsize=9.5, fontweight="bold")
    fig.tight_layout()
    out = REPO / "public/img/posts/forbidden-directions-aia-overlay.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print("rendered", out.name)


def render_aia_gif():
    """The flare GIF: 16 real AIA 171 A frames across the X5.4 flare of 2012-03-07
    (onset 00:02, peak ~00:24, X1.3 at ~01:14) with the static pre-flare skeleton
    (computed from the 00:01 magnetogram) overlaid. Per-frame header registration;
    counts normalised by EXPTIME (AIA shortens exposure during flares)."""
    from astropy.io import fits
    from scipy.ndimage import zoom as _zoom
    from PIL import Image
    import io
    import sunpy.visualization.colormaps  # noqa: F401

    frames_f = sorted((ROOT / "artifacts" / "hmi" / "aia_seq").glob("*.fits"))
    assert len(frames_f) >= 8, "run scripts/fetch_aia_seq.py first"

    # HMI geometry + the two volumes + lines (same construction as aia_overlay)
    hmi_f = sorted((ROOT / "artifacts" / "hmi").glob("hmi.m_45s.2012*"))[0]
    hh = fits.open(hmi_f); hh.verify("silentfix")
    hhdr = next(x.header for x in hh if getattr(x, "data", None) is not None
                and x.data.ndim == 2)
    s4 = 1024.0 / hhdr["NAXIS1"]
    hcx = (hhdr["CRPIX1"] - 1) * s4
    hcy = (hhdr["CRPIX2"] - 1) * s4
    hR = hhdr["RSUN_OBS"] / hhdr["CDELT1"] * s4
    bz = dict(load_magnetograms())["2012-03-07"]
    cut, B, nulls, p0, (cy, cx) = _ar11429_volume()
    cyf, cxf = 640, 640
    cutf = _zoom(bz[cyf - WIN // 2:cyf + WIN // 2, cxf - WIN // 2:cxf + WIN // 2],
                 CUT / WIN, order=1)
    Bf, _Af = solar.potential_field(cutf, NZ, dz=1.0)
    rng = np.random.default_rng(2)
    iy, ix = np.where(np.abs(cutf) >= 250.0)
    w = np.abs(cutf)[iy, ix]
    sel = rng.choice(len(ix), size=min(140, len(ix)), replace=False, p=w / w.sum())
    arcade = []
    for j in sel:
        sgn = +1.0 if cutf[iy[j], ix[j]] > 0 else -1.0
        ln = _trace(Bf, np.array([ix[j], iy[j], 1.5]), sgn, ds=0.35, steps=1600)
        if len(ln) > 10:
            arcade.append((ln, w[j] / w.max()))
    skel = []
    for _ in range(22):
        u = rng.standard_normal(3); u /= np.linalg.norm(u)
        for sgn in (+1.0, -1.0):
            ln = _trace(B, p0 + 1.2 * u, sgn, ds=0.3, steps=2600)
            if len(ln) > 8:
                skel.append(ln)

    vmax = None
    ims = []
    for k, f in enumerate(frames_f):
        hdul = fits.open(f); hdul.verify("silentfix")
        h = next(h for h in hdul if getattr(h, "data", None) is not None
                 and h.data.ndim == 2)
        aia = np.nan_to_num(np.asarray(h.data, float)) / max(
            float(h.header.get("EXPTIME", 2.9)), 0.1)
        ahdr = h.header
        acx, acy = ahdr["CRPIX1"] - 1, ahdr["CRPIX2"] - 1
        arsun = ahdr["RSUN_OBS"] / ahdr["CDELT1"]
        tstamp = str(ahdr.get("T_OBS") or ahdr.get("DATE-OBS"))[11:16]

        def h2a(xh, yh):
            return (acx - (np.asarray(xh) - hcx) / hR * arsun,
                    acy - (np.asarray(yh) - hcy) / hR * arsun)

        def b2a(ln, cyw, cxw):
            xh = cxw - WIN / 2 + ln[:, 0] * (WIN / CUT)
            yh = cyw - WIN / 2 + ln[:, 1] * (WIN / CUT)
            xa, ya = h2a(xh, yh)
            rx = (xa - acx) / arsun; ry = (ya - acy) / arsun
            hpx = ln[:, 2] * (WIN / CUT) / hR * arsun
            return xa + hpx * rx, ya + hpx * ry

        # SOLAR ROTATION: the magnetic skeleton co-rotates with the plasma. Rigid
        # rotation about the solar y-axis (AIA CROTA2 ~ 0 => rotation axis ~ image
        # y up to the small B0/P angles; differential rotation over 90 min is
        # negligible). Applied to every overlay point AND the crop centre, so the
        # region and its skeleton stay locked together in frame.
        mins_k = int(tstamp[:2]) * 60 + int(tstamp[3:5])
        ang = np.radians(13.3 / 1440.0) * mins_k       # synodic ~13.3 deg/day

        def corot(xa, ya):
            xr = np.asarray(xa) - acx
            yr = np.asarray(ya) - acy
            zr = np.sqrt(np.maximum(arsun ** 2 - xr ** 2 - yr ** 2, 0.0))
            return acx + xr * np.cos(ang) + zr * np.sin(ang), ya

        axn, ayn = corot(*h2a(cx, cy))
        axf_, ayf_ = corot(*h2a(cxf, cyf))
        ax0, ay0 = (axn + axf_) / 2, (ayn + ayf_) / 2
        half = int(1.35 * WIN / hR * arsun / 2) + 100
        x_lo, y_lo = int(ax0 - half), int(ay0 - half)
        crop = aia[y_lo:y_lo + 2 * half, x_lo:x_lo + 2 * half]
        if vmax is None:
            vmax = 1.6 * np.percentile(crop, 99.85)   # headroom for the flare

        fig, ax = plt.subplots(figsize=(6.4, 6.55), dpi=100)
        ax.imshow(np.clip(crop, 0, vmax) ** 0.5, origin="lower", cmap="sdoaia171",
                  vmin=0, vmax=vmax ** 0.5)
        for ln, wgt in arcade:
            xa, ya = corot(*b2a(ln, cyf, cxf))
            ax.plot(xa - x_lo, ya - y_lo, color="#a9cdf0", lw=1.0,
                    alpha=0.25 + 0.35 * wgt)
        for ln in skel:
            xa, ya = corot(*b2a(ln, cy, cx))
            ax.plot(xa - x_lo, ya - y_lo, color="#ff8b2e", lw=1.4, alpha=0.8)
        xn, yn = corot(*b2a(p0[None, :], cy, cx))
        ax.plot(xn - x_lo, yn - y_lo, marker="*", ms=13, mfc="#ffd34d",
                mec="#442200", mew=0.9)
        ax.set_xlim(0, crop.shape[1]); ax.set_ylim(0, crop.shape[0])
        ax.set_xticks([]); ax.set_yticks([])
        ax.text(0.02, 0.975, f"2012-03-07  {tstamp} UT", transform=ax.transAxes,
                color="white", fontsize=10, va="top", fontweight="bold")
        mins = mins_k
        if 20 <= mins <= 34:
            ax.text(0.02, 0.925, "X5.4 flare", transform=ax.transAxes,
                    color="#ff6644", fontsize=11, va="top", fontweight="bold")
        elif 70 <= mins <= 80:
            ax.text(0.02, 0.925, "X1.3 flare", transform=ax.transAxes,
                    color="#ff6644", fontsize=11, va="top", fontweight="bold")
        ax.set_title("the pre-flare skeleton (00:01 extrapolation) as the region "
                     "detonates", fontsize=8.6)
        fig.tight_layout(pad=0.4)
        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=100)
        plt.close(fig)
        buf.seek(0)
        ims.append(Image.open(buf).convert("P", palette=Image.ADAPTIVE, colors=160))
        print(f"frame {k+1}/{len(frames_f)}  {tstamp}")

    out = REPO / "public/img/posts/forbidden-directions-aia-flare.gif"
    ims[0].save(out, save_all=True, append_images=ims[1:], duration=260, loop=0,
                optimize=True)
    print(f"rendered {out.relative_to(REPO)} "
          f"({out.stat().st_size / 1e6:.1f} MB, {len(ims)} frames)")


if __name__ == "__main__":
    fast = "--fast" in sys.argv
    if not fast:
        triptych()
        constellation()
    skeleton(fast=fast)
    if not fast:
        null_anatomy_sun()
        try:
            null_anatomy_earth()
        except Exception as e:
            print("earth anatomy skipped:", e)
