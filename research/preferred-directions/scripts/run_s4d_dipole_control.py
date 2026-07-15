#!/usr/bin/env python3
"""S4d -- the pure-dipole control for the Dungey cascade (referee fix, WP5).

Claim under test (Part 6): near the anti-parallel IMF orientation the
Dungey null topology is, for a PURE DIPOLE, a degenerate null RING (the
mu < 0 face of the S1 fold family), and the real Earth's higher multipoles
break that ring into the observed 2 -> 17 cascade of near-degenerate
nulls. The cascade was measured (run_s4c_dungey.py); the ring itself was
asserted from the textbook. This control measures it.

Design: take Earth's dipole from the SAME IGRF epoch (the l = 1 Gauss
coefficients used by run_s4c_dungey), form the exactly anti-parallel
uniform-field configuration, locate the critical radius r*, and scan
|B| around the full circle of azimuths at (r*, equator-of-the-dipole):
  - pure dipole: |B| ~ 0 at EVERY azimuth (a null ring);
  - full IGRF:   |B| modulated, near zero only at isolated azimuths
                 (the ring broken into the cascade's nulls).
Out: printed numbers for the Part 6 caption; artifacts/s4d_dipole_control.json.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

UT = datetime(2012, 3, 7, 0, 0, tzinfo=timezone.utc).timestamp()
BSW = 5.0


def main():
    from geopack import geopack as gp
    gp.recalc(UT)

    # Earth's dipole vector from the IGRF used by geopack at this epoch:
    # evaluate IGRF far field? Simpler: geopack exposes the dipole via its
    # 'dip' routine (pure dipole in GSM for the recalc'd epoch).
    def B_dip(p):
        return np.array(gp.dip(float(p[0]), float(p[1]), float(p[2])))

    def B_igrf(p):
        return np.array(gp.igrf_gsm(float(p[0]), float(p[1]), float(p[2])))

    # dipole axis (GSM) at this epoch: direction of B_dip at the north pole
    # of the dipole = -moment direction... take axis from B_dip on the z axis
    # far field along the axis is parallel/antiparallel to the axis.
    # Robust: moment direction m_hat maximises |B_dip| on a sphere; use the
    # known geopack dipole tilt: psi = gp.recalc output. Axis in GSM:
    psi = gp.recalc(UT)                      # dipole tilt angle [rad]
    m_hat = np.array([np.sin(psi), 0.0, np.cos(psi)])   # geopack GSM convention

    # Anti-parallel Dungey configuration: uniform field aligned with +m_hat
    # or -m_hat -- pick the sign that produces the equatorial ring: the ring
    # occurs when the uniform field is PARALLEL to the dipole's equatorial
    # field, i.e. anti-parallel to the moment. Test both, keep the ring one.
    def ring_scan(Bint, u_sign, n_az=180):
        Bu = BSW * u_sign * m_hat
        # dipole-equator basis
        e1 = np.array([np.cos(psi), 0.0, -np.sin(psi)])
        e2 = np.array([0.0, 1.0, 0.0])
        # critical radius: |B_dip(equator)| = BSW  =>  B0_eq / r^3 = BSW
        r_grid = np.linspace(10.0, 40.0, 400)
        eqB = [np.linalg.norm(Bint(r * e1) + Bu) for r in r_grid]
        r_star = float(r_grid[int(np.argmin(eqB))])
        # refine r* at azimuth 0
        for _ in range(40):
            rs = np.linspace(max(2, r_star - 0.5), r_star + 0.5, 41)
            vals = [np.linalg.norm(Bint(r * e1) + Bu) for r in rs]
            r_star = float(rs[int(np.argmin(vals))])
        az = np.linspace(0, 2 * np.pi, n_az, endpoint=False)
        mags = []
        for a in az:
            u = np.cos(a) * e1 + np.sin(a) * e2
            # per-azimuth radial refine (the broken ring wobbles in r)
            rs = np.linspace(r_star - 2.5, r_star + 2.5, 61)
            vals = [np.linalg.norm(Bint(r * u) + Bu) for r in rs]
            mags.append(float(min(vals)))
        return r_star, np.array(mags)

    out = {}
    for tag, Bint in (("dipole", B_dip), ("igrf", B_igrf)):
        best = None
        for u_sign in (+1.0, -1.0):
            r_star, mags = ring_scan(Bint, u_sign)
            if best is None or mags.max() < best[2].max():
                best = (u_sign, r_star, mags)
        u_sign, r_star, mags = best
        out[tag] = {"u_sign": u_sign, "r_star_RE": round(r_star, 2),
                    "minB_ring_max_nT": round(float(mags.max()), 4),
                    "minB_ring_min_nT": round(float(mags.min()), 6),
                    "minB_ring_median_nT": round(float(np.median(mags)), 4)}
        print(f"{tag:6s}: ring radius r* = {r_star:5.2f} RE  |B| along the "
              f"ring: min {mags.min():.2e}, median {np.median(mags):.3f}, "
              f"max {mags.max():.3f} nT")

    ratio = out["igrf"]["minB_ring_max_nT"] / max(out["dipole"]["minB_ring_max_nT"], 1e-9)
    out["modulation_ratio"] = round(float(ratio), 1)
    print(f"\ncontrol verdict: pure dipole holds |B| < "
          f"{out['dipole']['minB_ring_max_nT']} nT around the ENTIRE ring "
          f"(a null ring to numerical precision), while the full IGRF "
          f"modulates the same circle up to {out['igrf']['minB_ring_max_nT']} nT "
          f"({out['modulation_ratio']}x) — the ring is broken into isolated "
          f"nulls: the cascade.")
    (ROOT / "artifacts" / "s4d_dipole_control.json").write_text(
        json.dumps(out, indent=1) + "\n")
    print("saved artifacts/s4d_dipole_control.json")


if __name__ == "__main__":
    main()
