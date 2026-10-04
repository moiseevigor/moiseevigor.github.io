#!/usr/bin/env python3
"""Render the CAMELS z=0 dark-matter cosmic-web slice for the blog from the
cached E6-real artifact (artifacts/e6_real_slice.npy, log10 projected density,
25 Mpc/h box). No in-figure title: figures carry their description in the post
caption below the plot."""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]

sl = np.load(ROOT / "artifacts" / "e6_real_slice.npy")
fig, ax = plt.subplots(figsize=(5.0, 4.9), dpi=150)
ax.imshow(sl, origin="lower", cmap="magma", extent=[0, 25, 0, 25],
          interpolation="bicubic")
ax.set_xlabel("x  [Mpc/h]")
ax.set_ylabel("y  [Mpc/h]")
fig.tight_layout()
out = REPO / "public/img/posts/cosmic-web-real-camels-slice.png"
fig.savefig(out, bbox_inches="tight", dpi=150)
print("rendered", out.relative_to(REPO))
