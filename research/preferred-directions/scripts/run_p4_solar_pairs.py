#!/usr/bin/env python3
"""P4-S2 -- near-degenerate null PAIRS on the real Sun (H-P4c).

Census: scan the three real SDO/HMI days (R3 pipeline, more windows, ALL interior
nulls), list every same-volume null pair with its separation. Then take the closest
measurable pair and read the S1 scale crossover ON THE REAL FIELD: the SR structure is
built from the real extrapolation's own vector potential (trilinear-interpolated), and
the scale-resolved flux exponent w4(r) is measured at the pair midpoint. Prediction
(S1): plateau ~2 below the half-separation, rising toward 4 as the probe swallows the
pair. Resolution floor: r below ~1.5 px is not meaningful on a gridded field.

Usage: run_p4_solar_pairs.py
Out:   artifacts/p4_solar_pairs.json, public/img/posts/forbidden-directions-solar-pair.png
"""
import json
import sys
from itertools import combinations
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
sys.path.insert(0, str(ROOT / "src"))
sys.path.insert(0, str(ROOT / "scripts"))
sys.path.insert(0, str(ROOT.parent / "caustics-to-groups" / "src"))

import solar                 # noqa: E402
import mfield3d as m3        # noqa: E402
import bifurcation as bf     # noqa: E402
from run_r3_real_gallery import load_magnetograms, best_windows, WIN, CUT, NZ  # noqa: E402


def trilinear_batch(F, P):
    """Vectorized trilinear on F (ny,nx,nz,3) at P (m,3) with p = (ix,iy,iz)."""
    ny, nx, nz = F.shape[:3]
    x = np.clip(P[:, 0], 0, nx - 1.001)
    y = np.clip(P[:, 1], 0, ny - 1.001)
    z = np.clip(P[:, 2], 0, nz - 1.001)
    i0, j0, k0 = x.astype(int), y.astype(int), z.astype(int)
    fx, fy, fz = x - i0, y - j0, z - k0
    out = np.zeros((len(P), 3))
    for di in (0, 1):
        wx = fx if di else 1 - fx
        for dj in (0, 1):
            wy = fy if dj else 1 - fy
            for dk in (0, 1):
                wz = fz if dk else 1 - fz
                out += (wx * wy * wz)[:, None] * F[j0 + dj, i0 + di, k0 + dk]
    return out


def real_structure(Agrid, name):
    """SR structure whose A is the real extrapolation's interpolated potential."""
    def A(P):
        return trilinear_batch(Agrid, np.atleast_2d(np.asarray(P, float)))
    return m3.MagneticStructure3D(A, name)


def main():
    rng = np.random.default_rng(7)
    mags = load_magnetograms()
    from scipy.ndimage import zoom

    census, volumes = [], {}
    for date, bz in mags:
        for (cy, cx) in best_windows(bz, k=4):
            cut = zoom(bz[cy - WIN // 2:cy + WIN // 2, cx - WIN // 2:cx + WIN // 2],
                       CUT / WIN, order=1)
            B, A = solar.potential_field(cut, NZ, dz=1.0)
            ny, nx, nz, _ = B.shape
            nulls = [nl for nl in solar.find_nulls(B, seeds_per_axis=10)
                     if 6 < nl["p"][0] < nx - 6 and 6 < nl["p"][1] < ny - 6
                     and 3 < nl["p"][2] < nz - 3]
            key = f"{date}@({cy},{cx})"
            volumes[key] = (B, A)
            for a, b in combinations(nulls, 2):
                census.append({"vol": key,
                               "sep_px": float(np.linalg.norm(a["p"] - b["p"])),
                               "pa": a["p"].tolist(), "pb": b["p"].tolist()})
            print(f"  {key}: {len(nulls)} interior nulls")

    census.sort(key=lambda r: r["sep_px"])
    print(f"\npair census: {len(census)} same-volume pairs across "
          f"{len(volumes)} regions x 3 days")
    for r in census[:6]:
        print(f"  sep = {r['sep_px']:5.1f} px   {r['vol']}")

    measurable = [r for r in census if r["sep_px"] >= 6.0]
    assert measurable, "no measurable pair (sep >= 6 px) found"
    pair = measurable[0]
    B, A = volumes[pair["vol"]]
    pa, pb = np.array(pair["pa"]), np.array(pair["pb"])
    mid = (pa + pb) / 2
    half = pair["sep_px"] / 2
    print(f"\nmeasuring the crossover at the midpoint of the closest measurable pair:")
    print(f"  {pair['vol']}  sep = {pair['sep_px']:.1f} px, midpoint {np.round(mid,1)}")

    st = real_structure(A, pair["vol"])
    radii = np.geomspace(1.5, min(4.0 * half, 28.0), 10)
    w4 = bf.flux_exponent_curve(st, [mid[0], mid[1], mid[2], 0.0], radii, 6000, rng)
    for r, w in zip(radii, w4):
        print(f"  r = {r:5.1f} px ({r/half:4.2f} sep/2)   w4 = {w:.2f}")

    below = w4[radii < half]
    above = w4[radii > 1.6 * half]
    verdict = (below.mean() < 2.8 and above.mean() > below.mean() + 0.5) \
        if len(below) and len(above) else False
    print(f"\nH-P4c: plateau <sep/2 mean w4 = {below.mean() if len(below) else float('nan'):.2f}, "
          f"beyond 1.6*sep/2 mean w4 = {above.mean() if len(above) else float('nan'):.2f}  "
          f"=> crossover {'DETECTED' if verdict else 'NOT detected'} on the real Sun")

    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "artifacts" / "p4_solar_pairs.json").write_text(json.dumps(
        {"n_pairs": len(census), "closest_pairs": census[:8],
         "measured_pair": pair, "radii_px": radii.tolist(), "w4": w4.tolist(),
         "crossover_detected": bool(verdict)}, indent=2) + "\n")
    print("wrote artifacts/p4_solar_pairs.json")

    # ---- figure -------------------------------------------------------------------------
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except Exception as e:                              # pragma: no cover
        print("figure skipped:", e)
        return
    fig, ax = plt.subplots(figsize=(5.6, 4.0), dpi=150)
    ax.semilogx(radii / half, w4, "o-", color="#e65100", ms=4.5, lw=1.5,
                label=f"real pair, sep = {pair['sep_px']:.1f} px\n({pair['vol'].split('@')[0]})")
    ax.axvline(1.0, color="k", lw=0.8, ls=":")
    ax.text(1.03, 1.62, "half-separation", rotation=90, fontsize=7, color="0.3")
    for yv, t in ((2, "uniform (w=2)"), (3, "single null (w=3)"), (4, "degenerate (w=4)")):
        ax.axhline(yv, color="0.85", lw=0.8, ls="--")
        ax.text(ax.get_xlim()[0] * 1.1 if False else radii[0] / half, yv + 0.05, t,
                fontsize=6.6, color="0.45")
    ax.set_xlabel("probe radius / half-separation", fontsize=9)
    ax.set_ylabel("local flux exponent $w_4(r)$", fontsize=9)
    ax.set_ylim(1.5, 4.6); ax.tick_params(labelsize=7.5); ax.legend(fontsize=7)
    fig.tight_layout()
    out = REPO / "public/img/posts/forbidden-directions-solar-pair.png"
    fig.savefig(out, bbox_inches="tight", dpi=150)
    print(f"rendered {out.relative_to(REPO)}")


if __name__ == "__main__":
    main()
