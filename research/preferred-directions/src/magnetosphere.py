"""Earth's magnetosphere as a real-physics magnetic field (P4-S3).

Field = IGRF (internal, real Gauss coefficients) + Tsyganenko T96 (external current
systems -- magnetopause, tail, ring current -- an empirical model fitted to decades of
spacecraft data), via the `geopack` package. Coordinates GSM in Earth radii, field in nT.

This is the program's first REAL field with genuinely non-force-free currents, i.e. the
first place the R5 theorem permits SPIRAL nulls. The classical closed-magnetosphere
topology has two dayside high-latitude neutral points (the polar-cusp nulls); the tail
current sheet is the other candidate habitat.

Null hunt: Newton descent on the callable field from physically seeded starting points
(cusp regions, tail sheet), with dedup and a domain guard -- no grid, geopack is
per-point. Dependency: geopack (pip), numpy.
"""
from __future__ import annotations

import numpy as np


class Magnetosphere:
    def __init__(self, ut, parmod, name="IGRF+T96"):
        from geopack import geopack, t96 as t96mod
        self._t96 = t96mod.t96
        self._igrf = geopack.igrf_gsm
        self.ps = geopack.recalc(ut)                    # dipole tilt for this epoch
        self.parmod = list(parmod)
        self.name = name

    def B(self, p):
        """Field at GSM point p = (x, y, z) [RE] in nT."""
        x, y, z = float(p[0]), float(p[1]), float(p[2])
        bi = self._igrf(x, y, z)
        be = self._t96(self.parmod, self.ps, x, y, z)
        return np.array(bi) + np.array(be)

    def jac(self, p, h=0.02):
        J = np.empty((3, 3))
        for a in range(3):
            e = np.zeros(3); e[a] = h
            J[:, a] = (self.B(p + e) - self.B(p - e)) / (2 * h)
        return J

    def find_nulls(self, seeds, tol_nT=0.5, max_iter=60, r_min=2.5, box=60.0):
        """Newton descent to B = 0 from each seed. Returns deduped null dicts.

        r_min keeps the hunt outside the Earth (IGRF diverges inward); box bounds the
        domain. A null is accepted when |B| < tol_nT.
        """
        found = []
        for s in np.atleast_2d(seeds):
            p = np.asarray(s, float).copy()
            ok = True
            for _ in range(max_iter):
                b = self.B(p)
                if np.linalg.norm(b) < tol_nT:
                    break
                try:
                    step = np.linalg.solve(self.jac(p), b)
                except np.linalg.LinAlgError:
                    ok = False; break
                step_n = np.linalg.norm(step)
                if step_n > 3.0:                        # damp wild Newton steps
                    step *= 3.0 / step_n
                p = p - step
                if np.linalg.norm(p) < r_min or np.abs(p).max() > box:
                    ok = False; break
            if ok and np.linalg.norm(self.B(p)) < tol_nT:
                if not any(np.linalg.norm(p - f["p"]) < 0.5 for f in found):
                    found.append({"p": p.copy(), "gradB": self.jac(p),
                                  "Bmag": float(np.linalg.norm(self.B(p)))})
        return found


def cusp_and_tail_seeds():
    """Physically motivated starting points: dayside cusp funnels + tail sheet."""
    seeds = []
    for zs in (+1, -1):                                  # both cusps
        for x in np.linspace(2.0, 10.0, 9):
            for z in np.linspace(3.0, 11.0, 9):
                seeds.append([x, 0.0, zs * z])
    for x in np.linspace(-35.0, -8.0, 16):               # tail current sheet
        for z in np.linspace(-2.0, 2.0, 5):
            seeds.append([x, 0.0, z])
            seeds.append([x, 5.0, z]); seeds.append([x, -5.0, z])
    return np.array(seeds)
