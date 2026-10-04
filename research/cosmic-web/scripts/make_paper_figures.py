#!/usr/bin/env python3
"""Publication figures for PAPER-DRAFT.md -> docs/paper-figures/*.pdf(+png).

Fig 1  E4: direction of the beyond-ZA residual vs distance to the web.
Fig 2  Model ladder: median transport error vs the oracle bound,
       including literature baselines (2LPT, MUSCLE).
Fig 3  Frozen-knob transfer: advantage vs ZA across sigma8, resolution,
       cosmology (overall and web bins).
Fig 4  Field-level fidelity: r(k) and T(k) for ZA / MUSCLE / model.

All numbers read from artifacts/ where available; ladder/transfer values
are the frozen report numbers (sources in comments).
"""

import json
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "paper-figures"
OUT.mkdir(exist_ok=True)

plt.rcParams.update({"font.size": 9, "axes.titlesize": 9.5,
                     "figure.dpi": 150, "savefig.bbox": "tight"})
BLUE, ORANGE, RED, GREY, GREEN = ("#2b6cb0", "#dd6b20", "#c53030",
                                  "#666666", "#2f855a")


def save(fig, name):
    fig.savefig(OUT / f"{name}.pdf")
    fig.savefig(OUT / f"{name}.png", dpi=200)
    plt.close(fig)
    print("wrote", name)


# ---------------------------------------------------------------- fig 1: E4
recs = json.loads((ROOT / "artifacts" / "e4_results.json").read_text())
BINS = [(0, 2), (2, 4), (4, 8), (8, 16), (16, 64)]
labels = [f"{lo}–{hi}" for lo, hi in BINS]
pfR = [np.mean([r[f"pfR_{lo}_{hi}"] for r in recs]) for lo, hi in BINS]
pfV = [np.mean([r[f"pfV_{lo}_{hi}"] for r in recs]) for lo, hi in BINS]
rmsR = [np.mean([r[f"rmsR_{lo}_{hi}"] for r in recs]) for lo, hi in BINS]

fig, ax = plt.subplots(figsize=(4.6, 3.2))
ax2 = ax.twinx()
ax2.bar(labels, rmsR, color=GREY, alpha=0.25, width=0.55, zorder=1)
ax2.set_ylabel(r"RMS residual $|\mathbf{R}|$ ($h^{-1}$Mpc)", color=GREY)
ax2.tick_params(axis="y", colors=GREY)
ax.plot(labels, pfR, "o-", color=BLUE, label="position residual", zorder=3)
ax.plot(labels, pfV, "s-", color=ORANGE, label="velocity residual", zorder=3)
ax.axhline(1 / 3, ls="--", c="k", lw=1)
ax.text(4.1, 1 / 3 + 0.004, "isotropic (1/3)", ha="right", fontsize=8)
ax.set_xlabel(r"distance to filament spine ($h^{-1}$Mpc)")
ax.set_ylabel(r"$\langle(\hat{\mathbf{R}}\cdot e_3)^2\rangle$")
ax.set_ylim(0.15, 0.40)
ax.legend(frameon=False, loc="upper right", fontsize=8)
ax.set_zorder(2); ax.patch.set_visible(False)
ax.set_title("Direction of the beyond-Zel'dovich residual")
save(fig, "fig1_residual_direction")

# ------------------------------------------------------------ fig 2: ladder
# Sources: E5/E5c/E5d/E9 reports; oracle bound E5b.
MODELS = [
    ("2LPT", 8.07, 0.39, GREY),
    ("isotropic sticking", 5.34, 0.15, GREY),
    ("Zel'dovich", 4.98, 0.27, GREY),
    ("+ transverse damping (E5)", 4.91, 0.14, BLUE),
    ("+ self frames, $\\beta$=0.75 (E5c)", 4.64, 0.18, BLUE),
    ("frozen: $\\beta$=0.6, 2 Mpc frames (E5d)", 4.52, 0.14, BLUE),
    ("MUSCLE (Neyrinck 2016)", 4.49, 0.12, GREEN),
]
BOUND = 4.47
fig, ax = plt.subplots(figsize=(4.8, 3.2))
ys = np.arange(len(MODELS))[::-1]
for y, (name, v, e, c) in zip(ys, MODELS):
    ax.errorbar(v, y, xerr=e, fmt="o", color=c, capsize=3, ms=6)
    ax.text(v + (0.14 if v < 6.5 else -0.14), y, f"{v:.2f}",
            va="center", ha="left" if v < 6.5 else "right", fontsize=8)
ax.axvline(BOUND, ls="--", color=RED, lw=1.2)
ax.text(BOUND - 0.04, len(MODELS) - 0.6, "oracle bound 4.47",
        rotation=90, va="top", ha="right", fontsize=8, color=RED)
ax.set_yticks(ys)
ax.set_yticklabels([m[0] for m in MODELS], fontsize=8.5)
ax.set_xlabel(r"median transport error vs $N$-body truth ($h^{-1}$Mpc)")
ax.set_xlim(4.2, 8.7)
ax.set_title("Model ladder (held-out seeds)")
save(fig, "fig2_model_ladder")

# --------------------------------------------------------- fig 3: transfer
# Sources: E6-report, E7-report (frozen knobs).
CONDS = [(r"$\sigma_8$=0.6", -3, -10), (r"$\sigma_8$=0.8", -9, -17),
         (r"$\sigma_8$=1.0", -13, -22), ("2 Mpc vox", -2, -9),
         ("0.5 Mpc vox", -10, -15), (r"$\Lambda$CDM", -10, -17)]
fig, ax = plt.subplots(figsize=(4.8, 3.0))
xs = np.arange(len(CONDS))
w = 0.38
ax.bar(xs - w / 2, [c[1] for c in CONDS], w, color=BLUE, label="overall")
ax.bar(xs + w / 2, [c[2] for c in CONDS], w, color=ORANGE,
       label=r"web ($<2\,h^{-1}$Mpc)")
ax.axhline(0, color="k", lw=0.8)
ax.set_xticks(xs)
ax.set_xticklabels([c[0] for c in CONDS], fontsize=8)
ax.set_ylabel("error change vs Zel'dovich (%)")
ax.legend(frameon=False, fontsize=8)
ax.set_title("Frozen-parameter transfer (no re-calibration)")
save(fig, "fig3_transfer")

# ------------------------------------------------------ fig 4: field level
e9 = json.loads((ROOT / "artifacts" / "e9_results.json").read_text())
KBINS = np.geomspace(2 * np.pi / 128, np.pi / 2, 9)
kc = np.sqrt(KBINS[:-1] * KBINS[1:])
fig, axes = plt.subplots(1, 2, figsize=(7.2, 3.0), sharex=True)
for stat, ax, ylab in [("r", axes[0], "cross-correlation $r(k)$"),
                       ("T", axes[1], "transfer $T(k)$")]:
    for name, col, lab in [("za", GREY, "Zel'dovich"),
                           ("muscle", GREEN, "MUSCLE"),
                           ("damp", BLUE, "transverse damping")]:
        vals = np.mean([r[f"{name}_{stat}"] for r in e9], axis=0)
        ax.semilogx(kc, vals, "o-", ms=4, color=col, label=lab)
    ax.set_xlabel(r"$k$ ($h\,$Mpc$^{-1}$)")
    ax.set_ylabel(ylab)
    if stat == "T":
        ax.axhline(1, ls=":", c="k", lw=0.8)
axes[0].legend(frameon=False, fontsize=8)
fig.suptitle("Field-level fidelity vs $N$-body truth (3 seeds)", y=1.02)
save(fig, "fig4_field_level")
