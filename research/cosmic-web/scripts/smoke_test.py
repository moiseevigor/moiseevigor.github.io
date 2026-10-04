#!/usr/bin/env python3
"""Minimal self-checks that fail loudly if core logic breaks."""

import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import fields, lift, spines, metrics  # noqa: E402

rng = np.random.default_rng(0)

# --- Voronoi truth exists and lies in the box
segs, verts = fields.voronoi_web(64, 16, rng)
assert len(segs) > 10 and len(verts) > 4, "voronoi web too sparse"
pts = fields.sample_segments(segs)
assert pts.min() >= 0 and pts.max() <= 64

# --- metrics are perfect on identical sets
m = metrics.spine_metrics(pts, pts, r0=2.0)
assert m["completeness"] == 1.0 and m["purity"] == 1.0
j = metrics.junction_metrics(verts, verts, r0=3.0)
assert j["f1"] == 1.0

# --- orientation score peaks at the correct axis on a straight ridge
N = 48
field = np.zeros((N, N, N))
field[N // 2, N // 2, :] = 1.0  # bright line along z
from scipy.ndimage import gaussian_filter
field = gaussian_filter(field, 1.0, mode="wrap")
axes = lift.hemisphere_axes(42)
U = lift.orientation_score(field, axes, sig_par=6.0, sig_perp=1.5, scales=(1.0,))
best_axis = axes[np.argmax(U[:, N // 2, N // 2, N // 2])]
assert abs(best_axis[2]) > 0.95, f"score not aligned with ridge: {best_axis}"

# --- skeleton of a clean ridge recovers the line
R = spines.lifted_ridgeness(U)
skel = spines.extract_matched(R, n_target=N)
sk_pts = spines.skeleton_points(skel)
d = np.abs(sk_pts[:, :2] - N // 2).max()
assert d <= 2, f"skeleton strays {d} voxels from a clean straight ridge"

print("all smoke checks passed")
