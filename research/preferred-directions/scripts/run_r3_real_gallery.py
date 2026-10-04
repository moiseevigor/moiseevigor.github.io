#!/usr/bin/env python3
"""R3 -- the REAL detection gallery: several SDO/HMI days, all coronal nulls (H-R3).

Data: the sunpy sample magnetogram (2011-06-07) plus any full-disk HMI magnetograms in
artifacts/hmi/ (fetched by fetch_hmi.py; 2012-03-07 X-flare day and 2014-10-22 / AR12192
in the reference run). Per magnetogram: the K most bipolar-balanced active-region windows
-> potential-field extrapolation -> Newton null finder -> per null:

  standard  : Parnell classification of the finder's measured grad B (nulltopo)
  SR        : growth vector Q on the null's tangent cone, built EXACTLY for any traceless
              Jacobian M (radial or spiral) via A(r) = -(1/3) r x (M r), curl A = M r
              (identity for homogeneous degree-1 div-free fields; asserted numerically)
  flow      : the R2 integrated-flow classifier run on a small cube RESAMPLED FROM THE
              RAW REAL GRID around the null -- the honest resolution-limited stress test
              (the null's linear zone is a few px; R2's clean-field advantage need not
              survive) -- plus fd-lsq on the same cube (the strong baseline, off-centre
              and nonlinear here: the regime R2 flagged as its open question).

Output: per-null agreement table (printed + artifacts/r3_real_gallery.json) and the
gallery figure public/img/posts/forbidden-directions-real-gallery.png -- one card per
null: the real coronal |B| on the vertical plane through the null, streamlines, star.

Reproduce: ../cosmic-web/.venv/bin/python scripts/run_r3_real_gallery.py
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
import flowclass as fc   # noqa: E402
import mfield3d as m3    # noqa: E402

WIN = 160                 # active-region window (px at 1024-scale)
CUT = 100                 # extrapolation base resolution
NZ = 56
K_REGIONS = 2             # windows per magnetogram
# Gallery cap: keep the strongest nulls per region (by |prod eig(grad B)|).
# Deliberately NOT a completeness census -- Newton seeding is not an exhaustive
# trilinear cell census (Haynes & Parnell 2007); prose must not claim "every
# interior null" (referee fix R9).
MAX_NULLS_PER_REGION = 2


def load_magnetograms():
    """(name, bz 1024-scale) for the sample + every fetched full-disk magnetogram."""
    from astropy.io import fits
    from scipy.ndimage import zoom
    out = []

    def read(path):
        hdul = fits.open(path)
        hdul.verify("silentfix")
        for h in hdul:
            d = getattr(h, "data", None)
            if d is not None and getattr(d, "ndim", 0) == 2:
                return np.nan_to_num(np.asarray(d, float)), h.header
        raise ValueError(f"no 2D HDU in {path}")

    from sunpy.data.sample import HMI_LOS_IMAGE
    bz, hdr = read(HMI_LOS_IMAGE)
    out.append((str(hdr.get("DATE-OBS", "2011-06-07"))[:10], bz))

    for f in sorted((ROOT / "artifacts" / "hmi").glob("hmi.m_*.fits")):
        bz, hdr = read(f)
        if bz.shape[0] > 2048:                          # full-res 4096 -> 1024
            bz = zoom(bz, 1024 / bz.shape[0], order=1)
        date = str(hdr.get("DATE-OBS") or hdr.get("T_OBS") or f.name)[:10]
        out.append((date, bz))
    return out


def best_windows(bz, k=K_REGIONS):
    """Centers of the k most bipolar-balanced, non-overlapping WINxWIN windows."""
    from scipy.ndimage import gaussian_filter
    S = gaussian_filter(bz, 4)
    cand = []
    h = WIN // 2
    for cy in range(120, bz.shape[0] - 120, 40):
        for cx in range(120, bz.shape[1] - 120, 40):
            w = S[cy - h:cy + h, cx - h:cx + h]
            if (w == 0).mean() > 0.2:                   # off-disk
                continue
            cand.append((min(w.max(), -w.min()), cy, cx))
    cand.sort(reverse=True)
    keep = []
    for s, cy, cx in cand:
        if all(max(abs(cy - y), abs(cx - x)) >= WIN for _, y, x in keep):
            keep.append((s, cy, cx))
        if len(keep) == k:
            break
    return [(cy, cx) for _, cy, cx in keep]


def tangent_cone_structure(M):
    """SR structure of the EXACT linear null B = M r via A = -(1/3) r x (M r)."""
    M = np.asarray(M, float)

    def A(P):
        P = np.atleast_2d(np.asarray(P, float))
        return -np.cross(P, P @ M.T) / 3.0
    st = m3.MagneticStructure3D(A, "tangent-cone")
    q = np.array([[0.13, -0.07, 0.11]])                 # assert curl A = M r
    assert np.allclose(st.B(q)[0], M @ q[0], atol=1e-4), "A = -(1/3) r x Mr failed"
    return st


def resample_cube(B, p, L=6.0, n=25):
    """Centered cube (n,n,n,3) on [-L,L]^3 px around null p, from the real grid."""
    g = np.linspace(-L, L, n)
    F = np.empty((n, n, n, 3))
    for i, dx in enumerate(g):
        for j, dy in enumerate(g):
            for k, dz in enumerate(g):
                F[i, j, k] = solar._interp3(B, np.array([p[0] + dx, p[1] + dy, p[2] + dz]))
    return F, L


def main():
    rng = np.random.default_rng(3)
    mags = load_magnetograms()
    print(f"{len(mags)} real magnetograms: " + ", ".join(d for d, _ in mags))

    from scipy.ndimage import zoom
    cards, records = [], []
    W_crit = 0.376                                       # frozen in R2
    for date, bz in mags:
        for (cy, cx) in best_windows(bz):
            cut = zoom(bz[cy - WIN // 2:cy + WIN // 2, cx - WIN // 2:cx + WIN // 2],
                       CUT / WIN, order=1)
            B, _A = solar.potential_field(cut, NZ, dz=1.0)
            ny, nx, nz, _ = B.shape
            nulls = [nl for nl in solar.find_nulls(B, seeds_per_axis=9)
                     if 8 < nl["p"][0] < nx - 8 and 8 < nl["p"][1] < ny - 8
                     and 4 < nl["p"][2] < nz - 4]
            nulls.sort(key=lambda nl: -abs(np.linalg.eigvals(nl["gradB"])).prod())
            for nl in nulls[:MAX_NULLS_PER_REGION]:
                p, M = nl["p"], nl["gradB"]
                Mn = M / np.abs(np.linalg.eigvals(M)).max()
                Mn = Mn - np.eye(3) * np.trace(Mn) / 3   # enforce traceless
                std = nulltopo.classify_null(Mn)
                _, Q = tangent_cone_structure(Mn).weights_Q(
                    [0, 0, 0, 0], np.geomspace(0.02, 0.2, 7), 4000, rng)
                Fc, Lc = resample_cube(B, p)
                fl = fc.classify_flow(Fc, Lc, W_crit, rho_seed=0.1 * Lc, rho_out=0.5 * Lc,
                                      k=48, dt=0.02 * Lc, max_steps=2500)
                lsq = fc.classify_fd_lsq(Fc, Lc, rho=0.5 * Lc)
                rec = {"date": date, "region_yx": [int(cy), int(cx)],
                       "null_xyh_px": [round(float(v), 1) for v in p],
                       "standard": std["label"], "Q": int(Q),
                       "flow_on_grid": fl["label"], "lsq_on_cube": lsq["label"],
                       "eigs": [round(float(v), 3) for v in np.real(std["eigs"])]}
                records.append(rec)
                cards.append({"date": date, "cut": cut, "B": B, "p": p, "std": std,
                              "Q": int(Q), "fl": fl["label"], "lsq": lsq["label"]})
                print(f"  {date} region({cy},{cx}) null h={p[2]:.0f}px: "
                      f"standard={std['label']:8s} Q={Q}  "
                      f"flow={fl['label']:8s} lsq={lsq['label']}")

    n_nulls = len(records)
    q_ok = sum(r["Q"] == 6 for r in records)
    fl_ok = sum(r["flow_on_grid"].rstrip("+-") == r["standard"].rstrip("+-")
                for r in records)
    lsq_ok = sum(r["lsq_on_cube"].rstrip("+-") == r["standard"].rstrip("+-")
                 for r in records)
    print(f"\nREAL GALLERY: {n_nulls} coronal nulls across {len(mags)} days")
    print(f"  SR detection Q=6:          {q_ok}/{n_nulls}")
    print(f"  flow-on-raw-grid type ok:  {fl_ok}/{n_nulls}  (resolution-limited regime)")
    print(f"  lsq-on-cube type ok:       {lsq_ok}/{n_nulls}")

    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "artifacts" / "r3_real_gallery.json").write_text(
        json.dumps({"n_nulls": n_nulls, "Q6": q_ok, "flow_type_ok": fl_ok,
                    "lsq_type_ok": lsq_ok, "nulls": records}, indent=2) + "\n")
    print("wrote artifacts/r3_real_gallery.json")

    # ---- the gallery figure -------------------------------------------------------------
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        from matplotlib.colors import LogNorm
    except Exception as e:                                # pragma: no cover
        print("figure skipped:", e)
        return
    cards = cards[:8]
    ncol = 4
    nrow = int(np.ceil(len(cards) / ncol))
    fig, axes = plt.subplots(nrow, ncol, figsize=(3.1 * ncol, 3.4 * nrow), dpi=150)
    axes = np.atleast_1d(axes).ravel()
    for ax in axes[len(cards):]:
        ax.axis("off")
    for ax, c in zip(axes, cards):
        B, p = c["B"], c["p"]
        ny, nx, nz, _ = B.shape
        jy = int(round(p[1]))
        sl = B[jy]                                        # (nx, nz, 3)
        mag = np.sqrt((sl ** 2).sum(-1)).T
        pos = mag[mag > 0]
        ax.imshow(np.maximum(mag, pos.min()), origin="lower", aspect="auto",
                  extent=[0, nx, 0, nz], cmap="magma",
                  norm=LogNorm(vmin=pos.min() * 3, vmax=np.percentile(mag, 99.5)))
        ax.streamplot(np.arange(nx), np.arange(nz), sl[:, :, 0].T, sl[:, :, 2].T,
                      color="white", density=0.85, linewidth=0.45, arrowsize=0.5)
        ax.plot(p[0], p[2], marker="*", ms=13, mfc="#25d0ff", mec="k", mew=1.0)
        spiral = c["std"]["type"] == "spiral"
        col = "#e65100" if spiral else "#1565c0"
        ax.set_title(f"{c['date']} · {c['std']['label']} · Q={c['Q']}",
                     fontsize=8.4, color=col, fontweight="bold")
        ax.set_xticks([]); ax.set_yticks([])
        for s in ax.spines.values():
            s.set_edgecolor(col); s.set_linewidth(1.3)
        ax.text(0.03, 0.04, f"h = {p[2]:.0f} px", transform=ax.transAxes,
                color="white", fontsize=7)
    print(f"gallery: {n_nulls} nulls, Q=6 at {q_ok}/{n_nulls}")
    fig.tight_layout()
    out = REPO / "public/img/posts/forbidden-directions-real-gallery.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print(f"rendered {out.relative_to(REPO)}")


if __name__ == "__main__":
    main()
