#!/usr/bin/env python3
"""'Three universes' figure for the reworked posts: the real sky (BOSS
wedge), a gravity simulation (PM), and the synthetic toy (Voronoi with
exact truth) — the modelling ladder from reality to controlled experiment.

Output: public/img/posts/cosmic-web/three_universes.png (+ individual
panels for flexible layout).
"""

import sys
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy.ndimage import gaussian_filter

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT.parents[1]
OUT = SITE / "public" / "img" / "posts" / "cosmic-web"
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "scripts"))

import fields, pm  # noqa: E402
import run_e3 as e3  # noqa: E402

plt.rcParams.update({"font.size": 11})


def real_panel(ax):
    """BOSS CMASS wedge: a 4-degree declination slab, comoving coords."""
    e3.Z_RANGE = (0.43, 0.70)
    ra, dec, z, xyz = e3.load_galaxies()
    m = (dec > 25) & (dec < 28)
    ra, xyz = ra[m], xyz[m]
    chi = np.linalg.norm(xyz, axis=1)
    sel = (ra > 130) & (ra < 230)
    th = np.radians(ra[sel] - 180.0)          # fan centred, opens upward
    chi = chi[sel]
    x = chi * np.sin(th)
    y = chi * np.cos(th)
    ax.scatter(x, y, s=1.3, c="#1a365d", alpha=0.45, lw=0)
    ax.set_aspect("equal")
    ax.set_title("A", loc="left", fontsize=13, fontweight="bold")
    # scale bar (comoving); no title, no prose -- the caption carries the description
    x0, y0 = x.min(), y.min() - 110          # below the wedge, clear of the dots
    ax.plot([x0, x0 + 500], [y0, y0], color="k", lw=2.5, solid_capstyle="butt")
    ax.text(x0 + 250, y0 + 25, "500 $h^{-1}$Mpc (comoving)", ha="center",
            va="bottom", fontsize=10)
    ax.set_xticks([]); ax.set_yticks([])
    for s in ax.spines.values():
        s.set_visible(False)


def _box_axes(ax, letter):
    """128 h^-1 Mpc box (1 voxel = 1 h^-1 Mpc): labelled axes, bold panel letter."""
    ax.set_xlim(0, 128); ax.set_ylim(0, 128)
    ax.set_xticks([0, 32, 64, 96, 128]); ax.set_yticks([0, 32, 64, 96, 128])
    ax.set_xlabel("x [$h^{-1}$Mpc, linear]", fontsize=11)
    ax.set_ylabel("y [$h^{-1}$Mpc, linear]", fontsize=11)
    ax.tick_params(labelsize=10)
    ax.set_title(letter, loc="left", fontsize=13, fontweight="bold")


def sim_panel(ax):
    """PM N-body slab (seed 4)."""
    rng = np.random.default_rng(4)
    x, *_ = pm.pm_sim(128, 128.0, rng, n_steps=90, track=1)
    rho = fields.cic_deposit(x, 128)
    sl = np.log10(1 + rho[:, :, 60:68].mean(axis=2))
    ax.imshow(sl.T, origin="lower", cmap="Blues", interpolation="bilinear",
              extent=[0, 128, 0, 128])
    _box_axes(ax, "B")


def toy_panel(ax):
    """Voronoi toy with exact truth network overlaid."""
    rng = np.random.default_rng(2)
    segments, vertices = fields.voronoi_web(128, 32, rng)
    polys = fields.curve_polylines(segments, 0.15, rng)
    truth, _ = fields.sample_polylines(polys)
    gal = fields.polyline_galaxies(polys, vertices, 128, 5000, 0.25, 0.8, rng)
    field = fields.galaxy_field(gal, 128, 5000, rng)
    z0 = 64
    sl = field[:, :, z0 - 4:z0 + 4].mean(axis=2)
    ax.imshow(sl.T, origin="lower", cmap="Blues", interpolation="bilinear",
              extent=[0, 128, 0, 128])
    tp = truth[(truth[:, 2] > z0 - 4) & (truth[:, 2] < z0 + 4)]
    ax.plot(tp[:, 0] + 0.5, tp[:, 1] + 0.5, ".", ms=1.4, color="#c53030", alpha=0.8)
    _box_axes(ax, "C")


def main():
    fig = plt.figure(figsize=(11.5, 9.0))
    gs = fig.add_gridspec(2, 2, height_ratios=[1.0, 1.35],
                          hspace=0.12, wspace=0.22)
    real_panel(fig.add_subplot(gs[0, :]))
    sim_panel(fig.add_subplot(gs[1, 0]))
    toy_panel(fig.add_subplot(gs[1, 1]))
    fig.savefig(OUT / "three_universes.png", dpi=150, bbox_inches="tight", pad_inches=0.25)
    print("wrote three_universes.png")


if __name__ == "__main__":
    main()
