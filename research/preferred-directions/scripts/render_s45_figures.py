#!/usr/bin/env python3
"""Figures for the bifurcation hunt (S4 Earth arm + S5/S5c solar arm).

Reads artifacts/s5c_blend_fold.json (the certified solar fold),
artifacts/s4_collider.json (Dungey theta census + portraits + T96 audit),
artifacts/s5_solar_fold.json + s5b_pair.json (temporal hunt); renders
  public/img/posts/forbidden-directions-collider.png          (paths, sqrt law, w4)
  public/img/posts/forbidden-directions-collider-anatomy.png  (before/at the fold)
  public/img/posts/forbidden-directions-stability-walls.png   (portrait + cascade)
  public/img/posts/forbidden-directions-solar-hunt.png        (census + impostor)
No in-figure titles: descriptions live in the post captions (repo rule).
"""
import json
import re
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

BLUE, ORANGE = "#1565c0", "#e65100"


def load(name):
    return json.loads((ROOT / "artifacts" / name).read_text())


# ------------------------------------------------------- the certified fold

def fig_collider(d):
    ev = d["events"][0]
    s_c = ev["lam_c"]
    fig, axes = plt.subplots(1, 3, figsize=(11.6, 3.9), dpi=150)

    # A - the two nulls' paths in the window, coloured by s
    ax = axes[0]
    pa = np.array(ev["path_a"]["p"]); la = np.array(ev["path_a"]["lam"])
    pb = np.array(ev["path_b"]["p"]); lb = np.array(ev["path_b"]["lam"])
    ps0 = np.array(ev["p_star"])
    var = np.vstack([pa, pb]).var(0)
    i, j = sorted(np.argsort(var)[-2:])
    lbl = ["window x [px]", "window y [px]", "height z [px]"]
    for P, L, sgn, c in ((pa, la, ev["signs"][0], BLUE),
                         (pb, lb, ev["signs"][1], ORANGE)):
        sc = ax.scatter(P[:, i], P[:, j], c=L, cmap="viridis", s=20, zorder=3,
                        vmin=min(la.min(), lb.min()),
                        vmax=max(la.max(), lb.max()))
        ax.plot(P[:, i], P[:, j], color=c, lw=1.0, alpha=0.7, zorder=2)
        far = P[np.argmax(np.linalg.norm(P - ps0, axis=1))]
        ax.annotate(f"degree {sgn:+d}", (far[i], far[j]),
                    textcoords="offset points", xytext=(6, 5),
                    fontsize=7.5, color=c, fontweight="bold")
    ax.plot(ps0[i], ps0[j], marker="*", ms=16, mfc="#ffd34d", mec="#442200",
            mew=1.0, zorder=5)
    ax.annotate(f"the fold\n$s_c$ = {s_c:.5f}", (ps0[i], ps0[j]),
                textcoords="offset points", xytext=(8, -20), fontsize=7.5)
    cb = fig.colorbar(sc, ax=ax, fraction=0.046)
    cb.set_label("blend $s$", fontsize=7.5); cb.ax.tick_params(labelsize=6.5)
    ax.set_xlabel(lbl[i], fontsize=8.5); ax.set_ylabel(lbl[j], fontsize=8.5)
    ax.set_title("A · the pair, walked into its fold", fontsize=9)
    ax.tick_params(labelsize=7.5); ax.grid(alpha=0.25, lw=0.5)

    # B - the square-root law + det -> 0
    ax = axes[1]
    dl = np.array(ev["deltas"], float)
    sp = np.array(ev["seps"], float)
    ok = (dl > 0) & np.isfinite(sp)
    ax.loglog(dl[ok], sp[ok], "o", color=BLUE, ms=4,
              label="pair separation [px]")
    C = np.exp(np.mean(np.log(sp[ok]) - 0.5 * np.log(dl[ok])))
    ax.loglog(dl[ok], C * np.sqrt(dl[ok]), "-", color=BLUE, lw=1.0, alpha=0.6,
              label=f"$C\\sqrt{{\\delta}}$ (fit slope {ev['sqrt_slope']:.4f})")
    dets = np.abs(np.array(ev["dets"], float))
    dmax = np.nanmax(dets)
    for col, mk in ((0, "^"), (1, "v")):
        okd = ok & np.isfinite(dets[:, col])
        ax.loglog(dl[okd], dets[okd, col] / dmax * sp[ok].max(), mk,
                  color=ORANGE, ms=3.5, alpha=0.75,
                  label="$|\\det\\nabla B|\\to 0$ (both, scaled)"
                  if col == 0 else None)
    ax.set_xlabel("$\\delta = s - s_c$", fontsize=8.5)
    ax.set_ylabel("separation [px] · scaled $|\\det|$",
                  fontsize=8.5)
    ax.set_title("B · the square-root law, four decades", fontsize=9)
    ax.legend(fontsize=6.4, loc="upper left")
    ax.tick_params(labelsize=7.5); ax.grid(alpha=0.25, lw=0.5, which="both")

    # C - the SR read: knee marches to zero; rank-2 collision reads flat 3
    ax = axes[2]
    radii = np.array(ev["w4_radii"])
    keys = sorted(ev["w4"], key=float, reverse=True)
    cmap = plt.cm.plasma(np.linspace(0.12, 0.75, len(keys)))
    for c, k in zip(cmap, keys):
        dk = float(k)
        lab = ("at $s_c$ (the collision)" if dk == 0
               else f"$\\delta$ = {k}")
        ax.semilogx(radii, ev["w4"][k], "o-", color=c, ms=3.5, lw=1.2,
                    label=lab)
    for yv, ls, lab in ((2, ":", "uniform (2)"), (3, "-.", "generic null (3)"),
                        (4, "--", "fully degenerate (4)")):
        ax.axhline(yv, color="0.62", lw=0.7, ls=ls)
        ax.text(radii[0] * 1.05, yv + 0.06, lab, fontsize=6.2, color="0.4")
    ax.set_xlabel("probe radius $r$ [px]", fontsize=8.5)
    ax.set_ylabel("local flux exponent $w_4(r)$", fontsize=8.5)
    ax.set_title(f"C · knee $\\to$ 0; rank-2 collision: Q = {ev['Q_at_c']}",
                 fontsize=9)
    ax.legend(fontsize=6.4, loc="lower right"); ax.set_ylim(1.6, 4.5)
    ax.tick_params(labelsize=7.5); ax.grid(alpha=0.25, lw=0.5)

    fig.tight_layout()
    out = REPO / "public/img/posts/forbidden-directions-collider.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print("rendered", out.name)
    return ev


def fig_anatomy(d):
    """Field lines in the fold plane: separated pair / near-merge / merged."""
    from run_s5c_blend_fold import (SpectralBlend, newton_spec, load_cut,
                                    BlendField)
    from render_real_assets import _trace
    ev = d["events"][0]
    s_c = ev["lam_c"]
    hmi_all = sorted((ROOT / "artifacts" / "hmi" / "hmi_seq").glob("*.fits"))
    times = sorted((int(m.group(1)) * 60 + int(m.group(2)), f) for f in hmi_all
                   for m in [re.search(r"_(\d\d)_(\d\d)_\d\d_TAI", f.name)])
    (tA, fA), (tB, fB) = times[0], times[-1]
    cutA, g0, t00 = load_cut(fA, None, None, tA)
    cutB, _, _ = load_cut(fB, g0, t00, tB)
    sf = SpectralBlend(cutA, cutB)
    bf = BlendField(cutA, cutB)
    p_star = np.array(ev["p_star"])

    # fold frame: kernel of gradB at the collision + steepest transverse
    _, M = sf.B_J(s_c, p_star)
    w, V = np.linalg.eig(M)
    order = np.argsort(np.abs(w))
    u = np.real(V[:, order[0]]); u /= np.linalg.norm(u)
    v = np.real(V[:, order[2]]); v -= (v @ u) * u; v /= np.linalg.norm(v)

    panels = [(0.05, "A · $s_c$ + 0.05 — two nulls"),
              (0.004, "B · $s_c$ + 0.004 — almost touching"),
              (0.0, "C · $s_c$ — the fold")]
    fig, axes = plt.subplots(1, 3, figsize=(11.4, 3.9), dpi=150)
    R = 6.0
    for ax, (dq, ttl) in zip(axes, panels):
        s = s_c + dq
        Bl = bf.at(s)
        # nulls of this state near the event
        stars = []
        for tt in np.geomspace(0.01, 4.0, 24):
            for sgn in (+1.0, -1.0):
                nl = newton_spec(sf, s, p_star + sgn * tt * u)
                if nl is None:
                    continue
                if np.linalg.norm(nl["p"] - p_star) > 8:
                    continue
                if any(np.linalg.norm(nl["p"] - q) < 0.05 for q, _ in stars):
                    continue
                stars.append((nl["p"],
                              int(np.sign(np.linalg.det(nl["gradB"])))))
        if dq == 0.0 and not stars:
            stars = [(p_star, 0)]                  # the degenerate point
        mid = (np.mean([q for q, _ in stars], axis=0)
               if stars else p_star)
        for th in np.linspace(0, 2 * np.pi, 18, endpoint=False):
            s0 = mid + R * 0.85 * (np.cos(th) * u + np.sin(th) * v)
            for sgn in (+1.0, -1.0):
                ln = _trace(Bl, s0, sgn, ds=0.25, steps=380)
                if len(ln) < 6:
                    continue
                lu = (ln - mid) @ u
                lv = (ln - mid) @ v
                keep = (np.abs(lu) < R) & (np.abs(lv) < R)
                if keep.sum() < 4:
                    continue
                ax.plot(lu[keep], lv[keep], color=BLUE, lw=0.6, alpha=0.5,
                        zorder=2)
        for q, sgn in stars:
            qu, qv = (q - mid) @ u, (q - mid) @ v
            ax.plot(qu, qv, marker="*", ms=15,
                    mfc="#ffd34d" if dq == 0 else
                    ("#8ec6ff" if sgn > 0 else "#ffb27a"),
                    mec="#442200", mew=0.9, zorder=5)
            if dq > 0 and len(stars) > 1:
                ax.annotate(f"{sgn:+d}", (qu, qv), textcoords="offset points",
                            xytext=(7, 6), fontsize=8, fontweight="bold",
                            color="#333")
        ax.set_title(ttl, fontsize=8.8)
        ax.set_xlabel("along the fold axis [px]", fontsize=8)
        ax.set_ylabel("transverse [px]", fontsize=8)
        ax.set_xlim(-R, R); ax.set_ylim(-R, R)
        ax.set_aspect("equal"); ax.tick_params(labelsize=7)
    fig.tight_layout()
    out = REPO / "public/img/posts/forbidden-directions-collider-anatomy.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print("rendered", out.name)


# ----------------------------------------------- stability walls + cascade

def fig_walls(d4, d5c):
    fig, axes = plt.subplots(1, 2, figsize=(10.8, 4.2), dpi=150,
                             gridspec_kw={"width_ratios": [1.3, 1]})
    # A - phase portrait: Dungey states + the solar pair's dive into the wall
    ax = axes[0]
    X, Y = [], []
    for st in d4["phase_portrait"]:
        for p in st["pts"]:
            X.append(p["det_hat"]); Y.append(np.clip(p["disc_hat"], -0.1, 3))
    ax.scatter(X, Y, s=10, c=BLUE, alpha=0.35,
               label=f"Dungey census states ({len(X)}; vacuum "
                     "$\\Rightarrow$ all radial)")
    if d5c["events"]:
        ev = d5c["events"][0]
        for key, c, lab in (("portrait_a", "#0b3d91", "solar pair, null A"),
                            ("portrait_b", "#b23c00", "solar pair, null B")):
            P = np.array(ev[key], float)
            ax.plot(P[:, 0], np.clip(P[:, 1], -0.1, 3), "-o", color=c, ms=2.5,
                    lw=1.0, alpha=0.9, label=lab)
        ax.annotate("the certified fold:\nboth dive into det = 0",
                    xy=(0.012, 0.55), xytext=(0.09, 0.30), fontsize=7.5,
                    arrowprops=dict(arrowstyle="->", color="0.3"))
    ax.axvline(0, color="#c62828", lw=1.4)
    ax.text(0.505, 0.985, "fold wall (det = 0: the null count changes)",
            fontsize=7, color="#c62828", transform=ax.transAxes,
            ha="left", va="top", rotation=90)
    ax.axhline(0, color="#6a1b9a", lw=1.1, ls="--")
    ax.text(0.02, 0.045, "type wall (disc = 0: radial ↔ spiral)",
            fontsize=7, color="#6a1b9a", transform=ax.transAxes)
    ax.set_ylim(-0.08, 1.06)
    ax.set_xlabel("normalised $\\det\\nabla B$ (sign = topological degree)",
                  fontsize=8.5)
    ax.set_ylabel("normalised fan discriminant (clipped)", fontsize=8.5)
    ax.set_title("A · null states and the walls between them", fontsize=9)
    ax.legend(fontsize=6.6, loc="upper left")
    ax.tick_params(labelsize=7.5); ax.grid(alpha=0.2, lw=0.5)

    # B - the Dungey cascade census
    ax = axes[1]
    th = [c["theta"] for c in d4["theta_census"]]
    ax.plot(th, [c["n"] for c in d4["theta_census"]], "o-", color=BLUE, ms=3,
            lw=1.1, label="null count")
    ax.plot(th, [c["degree_sum"] for c in d4["theta_census"]], "s-",
            color="#2e7d32", ms=3, lw=1.1, label="degree sum")
    ax.axvspan(160, 180, color="#f3e5f5", zorder=0)
    ax.text(170, max(c["n"] for c in d4["theta_census"]) * 0.75,
            "the ring face\nbreaks up", fontsize=7, color="#6a1b9a",
            ha="center")
    ax.set_xlabel("IMF angle $\\theta$ from northward [deg]", fontsize=8.5)
    ax.set_ylabel("count · degree sum", fontsize=8.5)
    ax.set_title("B · Earth's cusp pair vs the anti-parallel cascade",
                 fontsize=9)
    ax.legend(fontsize=7, loc="upper left"); ax.tick_params(labelsize=7.5)
    ax.grid(alpha=0.25, lw=0.5)
    fig.tight_layout()
    out = REPO / "public/img/posts/forbidden-directions-stability-walls.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print("rendered", out.name)


# ------------------------------------------------------------------ solar

def fig_solar(dc, db):
    fig, axes = plt.subplots(1, 2, figsize=(10.8, 3.8), dpi=150)
    ax = axes[0]
    tmins = [int(f["t"][:2]) * 60 + int(f["t"][3:]) for f in dc["frames"]]
    ax.plot(tmins, [f["n"] for f in dc["frames"]], "o-", color=BLUE, ms=3,
            lw=1.1, label="null count (wide volume)")
    ax.plot(tmins, [f["degree_sum"] for f in dc["frames"]], "s-",
            color="#2e7d32", ms=3, lw=1.1, label="degree sum")
    for t0, t1, lab in ((20, 34, "X5.4"), (70, 80, "X1.3")):
        ax.axvspan(t0, t1, color="#ff6644", alpha=0.14)
        ax.text((t0 + t1) / 2, -16.5, lab, fontsize=7.5, color="#c62828",
                ha="center")
    ax.set_xlabel("2012-03-07, minutes after 00:00 UT", fontsize=8.5)
    ax.set_ylabel("count · degree sum", fontsize=8.5)
    ax.set_title("A · the census churns — no certified pair event",
                 fontsize=9)
    ax.legend(fontsize=7, loc="center right"); ax.tick_params(labelsize=7.5)
    ax.grid(alpha=0.25, lw=0.5)

    ax = axes[1]
    bl = db["blend"]
    dl = np.array(bl["deltas"])
    sp = np.array([np.nan if v is None else v for v in bl["seps"]])
    ok = np.isfinite(sp)
    ax.loglog(dl[ok], sp[ok], "o", color=ORANGE, ms=5,
              label=f"candidate pair (slope {bl['sqrt_slope']:.3f})")
    ax.loglog(dl, sp[ok].max() * np.sqrt(dl / dl[ok].max()), "--",
              color="0.55", lw=1.1,
              label="what a fold would do ($\\propto\\sqrt{\\delta}$)")
    ax.set_xlabel("$\\delta = s_c - s$  (blend parameter)", fontsize=8.5)
    ax.set_ylabel("pair separation [px]", fontsize=8.5)
    ax.set_title("B · the impostor: flat separation, $w_4\\approx 2$, Q = 5",
                 fontsize=9)
    ax.legend(fontsize=7, loc="lower right"); ax.tick_params(labelsize=7.5)
    ax.grid(alpha=0.25, lw=0.5, which="both")
    fig.tight_layout()
    out = REPO / "public/img/posts/forbidden-directions-solar-hunt.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print("rendered", out.name)


if __name__ == "__main__":
    d5c = load("s5c_blend_fold.json")
    fig_collider(d5c)
    fig_anatomy(d5c)
    fig_walls(load("s4_collider.json"), d5c)
    fig_solar(load("s5_solar_fold.json"), load("s5b_pair.json"))
