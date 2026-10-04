#!/usr/bin/env python3
"""P5-T3 -- the null census of AR11158 through its emergence day (2011-02-13).

Five real HMI frames at 6-hour cadence. Per frame: lock onto the strongest bipolar
window (AR11158 dominates the disk that day), potential-field extrapolate, run the
Newton null finder, and record the census -- null count, heights, types, and pair
separations. A pair appearing between frames is a birth candidate; if one is present
in consecutive frames, the knee migration of S1 becomes measurable on a real forming
pair.

Honest expectations (pre-registered): at 1024^2-scale resolution with 6-hour cadence,
catching a birth is not guaranteed; the minimum deliverable is the time series.

Usage: run_p5_sequence.py
Out:   artifacts/p5_sequence.json, public/img/posts/forbidden-directions-emergence.png
"""
import json
import sys
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))

import solar             # noqa: E402
import nulltopo          # noqa: E402

WIN, CUT, NZ = 160, 100, 56


def load_frames():
    from astropy.io import fits
    from scipy.ndimage import zoom
    out = []
    for f in sorted((ROOT / "artifacts" / "hmi" / "seq").glob("hmi.m_45s.*.fits")):
        hdul = fits.open(f)
        hdul.verify("silentfix")
        for h in hdul:
            d = getattr(h, "data", None)
            if d is not None and getattr(d, "ndim", 0) == 2:
                bz = np.nan_to_num(np.asarray(d, float))
                if bz.shape[0] > 2048:
                    bz = zoom(bz, 1024 / bz.shape[0], order=1)
                t = str(h.header.get("DATE-OBS") or h.header.get("T_OBS"))[:16]
                out.append((t, bz))
                break
    return out


def strongest_window(bz):
    """Best bipolar window, then RE-CENTERED on the flux concentration it contains
    (the coarse grid search alone can leave the active region in a corner)."""
    from scipy.ndimage import gaussian_filter
    S = gaussian_filter(bz, 4)
    best = None
    h = WIN // 2
    for cy in range(120, bz.shape[0] - 120, 20):
        for cx in range(120, bz.shape[1] - 120, 20):
            w = S[cy - h:cy + h, cx - h:cx + h]
            if (w == 0).mean() > 0.2:
                continue
            score = min(w.max(), -w.min())
            if best is None or score > best[0]:
                best = (score, cy, cx)
    cy, cx = best[1], best[2]
    for _ in range(3):                                  # recenter on |S|^2 centroid
        w = S[cy - h:cy + h, cx - h:cx + h] ** 2
        gy, gx = np.mgrid[0:WIN, 0:WIN]
        cy = int(np.clip(cy - h + (w * gy).sum() / w.sum(), 120, bz.shape[0] - 120))
        cx = int(np.clip(cx - h + (w * gx).sum() / w.sum(), 120, bz.shape[1] - 120))
    return cy, cx


def main():
    from scipy.ndimage import zoom
    frames = load_frames()
    print(f"{len(frames)} frames: " + ", ".join(t for t, _ in frames))

    census, panels = [], []
    for t, bz in frames:
        cy, cx = strongest_window(bz)
        cut = zoom(bz[cy - WIN // 2:cy + WIN // 2, cx - WIN // 2:cx + WIN // 2],
                   CUT / WIN, order=1)
        B, _A = solar.potential_field(cut, NZ, dz=1.0)
        ny, nx, nz, _ = B.shape
        nulls = [nl for nl in solar.find_nulls(B, seeds_per_axis=10)
                 if 6 < nl["p"][0] < nx - 6 and 6 < nl["p"][1] < ny - 6
                 and 3 < nl["p"][2] < nz - 3]
        seps = []
        for i in range(len(nulls)):
            for j in range(i + 1, len(nulls)):
                seps.append(float(np.linalg.norm(nulls[i]["p"] - nulls[j]["p"])))
        rec = {"t": t, "window_yx": [int(cy), int(cx)], "n_nulls": len(nulls),
               "heights_px": [round(float(nl["p"][2]), 1) for nl in nulls],
               "types": [nulltopo.classify_null(nl["gradB"])["label"] for nl in nulls],
               "pair_seps_px": sorted(round(s, 1) for s in seps),
               "peak_G": round(float(np.abs(cut).max()), 0)}
        census.append(rec)
        panels.append((t, cut, [nl["p"] for nl in nulls]))
        print(f"  {t}  window({cy},{cx})  peak {rec['peak_G']:.0f} G  "
              f"nulls: {rec['n_nulls']}  heights {rec['heights_px']}  "
              f"types {rec['types']}  seps {rec['pair_seps_px']}")

    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "artifacts" / "p5_sequence.json").write_text(
        json.dumps(census, indent=2) + "\n")
    print("wrote artifacts/p5_sequence.json")

    # ---- figure -------------------------------------------------------------------------
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except Exception as e:                              # pragma: no cover
        print("figure skipped:", e)
        return
    n = len(panels)
    fig, axes = plt.subplots(1, n, figsize=(2.55 * n, 3.3), dpi=150)
    for ax, (t, cut, ps), rec in zip(np.atleast_1d(axes), panels, census):
        v = np.percentile(np.abs(cut), 99)
        ax.imshow(cut.T, origin="lower", cmap="RdBu_r", vmin=-v, vmax=v)
        for p in ps:
            ax.plot(p[0], p[1], marker="*", ms=11, mfc="#ffd000", mec="k", mew=0.9)
        ax.set_title(f"{t[5:]}\nnulls: {rec['n_nulls']}", fontsize=7.6)
        ax.set_xticks([]); ax.set_yticks([])
    fig.tight_layout()
    out = REPO / "public/img/posts/forbidden-directions-emergence.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print(f"rendered {out.relative_to(REPO)}")


if __name__ == "__main__":
    main()
