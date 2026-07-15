"""Jupiter's internal magnetic field from Juno-era spherical-harmonic models
(J1). Coefficients come from the `planetmagfields` package (JRM33/JRM09,
Connerney et al. 2022/2018); this module turns them into a VECTOR field at
arbitrary points -- the package itself only maps components on lat-lon grids.

Conventions: Schmidt semi-normalised associated Legendre functions WITHOUT
the Condon-Shortley phase (the planetary-magnetism standard), planetocentric
System III coordinates, radii in planet radii R_J, field in nT:

    V = a Sum_{l,m} (a/r)^{l+1} [g_lm cos(m phi) + h_lm sin(m phi)] P_lm(cos theta)
    B = -grad V   (vacuum exterior)

Golden check in _demo(): Br on the r=1 grid against planetmagfields' own map.
Dependency: numpy, scipy, planetmagfields.
"""
from __future__ import annotations

import numpy as np
from scipy.special import assoc_legendre_p_all


class JupiterField:
    def __init__(self, model="jrm33", lmax=None):
        import planetmagfields as pm
        p = pm.Planet(name="jupiter", model=model, r=1.0)
        self.model = model
        self.lmax = int(lmax if lmax is not None else p.lmax)
        # package layout: flat arrays over (l, m), l = 0..L, m = 0..l
        L_arr = int((np.sqrt(8 * len(p.glm) + 1) - 3) / 2)
        g = np.zeros((self.lmax + 1, self.lmax + 1))
        h = np.zeros((self.lmax + 1, self.lmax + 1))
        k = 0
        for l in range(L_arr + 1):
            for m in range(l + 1):
                if l <= self.lmax:
                    g[l, m] = p.glm[k]
                    h[l, m] = p.hlm[k]
                k += 1
        self.g, self.h = g, h
        # Schmidt semi-normalisation factors S_lm (and cancel scipy's
        # Condon-Shortley (-1)^m)
        from math import factorial
        S = np.zeros_like(g)
        for l in range(self.lmax + 1):
            for m in range(l + 1):
                f = np.sqrt((2.0 if m > 0 else 1.0)
                            * factorial(l - m) / factorial(l + m))
                S[l, m] = f * (-1.0) ** m
        self._S = S

    # ---- spherical components at one point ---------------------------------------
    def B_sph(self, r, theta, phi):
        """(Br, Btheta, Bphi) [nT] at r [R_J], colatitude theta, longitude phi."""
        L = self.lmax
        ct = np.cos(theta)
        st = max(np.sin(theta), 1e-12)
        A = np.asarray(assoc_legendre_p_all(L, L, ct, diff_n=1))
        P = A[0][:, : L + 1] * self._S             # P[l, m], Schmidt, no CS phase
        dPdth = -st * (A[1][:, : L + 1] * self._S)  # dP/dtheta = -sin(theta) dP/dx
        m_arr = np.arange(L + 1)
        cmp_ = np.cos(m_arr * phi)
        smp = np.sin(m_arr * phi)
        gc_hs = self.g * cmp_[None, :] + self.h * smp[None, :]
        gs_hc = self.g * smp[None, :] - self.h * cmp_[None, :]
        rl = r ** (-(np.arange(L + 1) + 2.0))      # (1/r)^(l+2), a = 1
        Br = 0.0
        Bt = 0.0
        Bp = 0.0
        for l in range(1, L + 1):
            Br += (l + 1) * rl[l] * np.dot(gc_hs[l, : l + 1], P[l, : l + 1])
            Bt += -rl[l] * np.dot(gc_hs[l, : l + 1], dPdth[l, : l + 1])
            Bp += rl[l] / st * np.dot(m_arr[: l + 1] * gs_hc[l, : l + 1],
                                      P[l, : l + 1])
        return np.array([Br, Bt, Bp])

    # ---- Cartesian field for the null hunt ----------------------------------------
    def B(self, p):
        """Cartesian B [nT] at p = (x, y, z) [R_J], System III axes."""
        x, y, z = float(p[0]), float(p[1]), float(p[2])
        r = np.sqrt(x * x + y * y + z * z)
        theta = np.arccos(np.clip(z / r, -1, 1))
        phi = np.arctan2(y, x)
        Br, Bt, Bp = self.B_sph(r, theta, phi)
        st, ct = np.sin(theta), np.cos(theta)
        sp, cp = np.sin(phi), np.cos(phi)
        return np.array([
            Br * st * cp + Bt * ct * cp - Bp * sp,
            Br * st * sp + Bt * ct * sp + Bp * cp,
            Br * ct - Bt * st])

    def A_cart(self, P):
        """EXACT toroidal vector potential of the internal field, vectorised.

        Per harmonic, A = -(1/l) r^{-(l+1)} (rhat x grad_s S_lm) satisfies
        curl A = B exactly (calibrated and golden-checked in _demo): in
        components A_r = 0, A_theta = (1/(l sin th)) dS/dphi * r^{-(l+1)},
        A_phi = -(1/l) dS/dtheta * r^{-(l+1)}. Input P (n,3) Cartesian
        [R_J]; output (n,3) Cartesian [nT * R_J].
        """
        from scipy.special import assoc_legendre_p_all
        P = np.atleast_2d(np.asarray(P, float))
        x, y, z = P[:, 0], P[:, 1], P[:, 2]
        r = np.sqrt(x * x + y * y + z * z)
        ct = np.clip(z / r, -1, 1)
        st = np.sqrt(np.maximum(1 - ct * ct, 1e-24))
        ph = np.arctan2(y, x)
        L = self.lmax
        Aall = np.asarray(assoc_legendre_p_all(L, L, ct, diff_n=1))
        Pl = Aall[0][:, : L + 1] * self._S[:, :, None]          # (l, m, n)
        dPdth = -st[None, None, :] * (Aall[1][:, : L + 1] * self._S[:, :, None])
        m = np.arange(L + 1)
        cmp_ = np.cos(m[:, None] * ph[None, :])                 # (m, n)
        smp = np.sin(m[:, None] * ph[None, :])
        A_th = np.zeros_like(r)
        A_ph = np.zeros_like(r)
        for l in range(1, L + 1):
            fl = -(1.0 / l) * r ** (-(l + 1.0))
            gc = (self.g[l, : l + 1, None] * cmp_[: l + 1]
                  + self.h[l, : l + 1, None] * smp[: l + 1])    # (m, n)
            gs = (-self.g[l, : l + 1, None] * smp[: l + 1]
                  + self.h[l, : l + 1, None] * cmp_[: l + 1])
            dS_dph = np.einsum("m,mn,mn->n", m[: l + 1].astype(float),
                               gs, Pl[l, : l + 1])
            dS_dth = np.einsum("mn,mn->n", gc, dPdth[l, : l + 1])
            A_th += fl * (-dS_dph / st)
            A_ph += fl * dS_dth
        sp, cp = np.sin(ph), np.cos(ph)
        return np.stack([A_th * ct * cp - A_ph * sp,
                         A_th * ct * sp + A_ph * cp,
                         -A_th * st], axis=1)

    def jac(self, p, h=2e-4):
        J = np.empty((3, 3))
        for a in range(3):
            e = np.zeros(3); e[a] = h
            J[:, a] = (self.B(np.asarray(p) + e) - self.B(np.asarray(p) - e)) / (2 * h)
        return J


def _demo():
    import planetmagfields as pm
    jf = JupiterField("jrm33")
    p = pm.Planet(name="jupiter", model="jrm33", r=1.0)
    # golden check: Br at r=1 against the package's own map (p.Br is in muT
    # on the (nphi, ntheta) grid given by th2D/p2D)
    errs = []
    rng = np.random.default_rng(0)
    for _ in range(40):
        i = rng.integers(2, p.Br.shape[0] - 2)
        j = rng.integers(2, p.Br.shape[1] - 2)
        mine = jf.B_sph(1.0, float(p.th2D[i, j]), float(p.p2D[i, j]))[0]
        theirs = p.Br[i, j] * 1e3                  # muT -> nT
        errs.append(abs(mine - theirs) / max(abs(theirs), 1.0))
    errs = np.array(errs)
    print(f"golden Br check: median rel err {np.median(errs):.2e}, "
          f"max {errs.max():.2e}  (40 random grid points)")
    assert errs.max() < 1e-8, "Br mismatch vs planetmagfields"
    # divergence-free sanity
    q = np.array([1.4, 0.5, 1.1])
    hh = 1e-4
    div = sum((jf.B(q + hh * e)[k] - jf.B(q - hh * e)[k]) / (2 * hh)
              for k, e in enumerate(np.eye(3)))
    print(f"div B at test point: {div:.3e} (|B| = {np.linalg.norm(jf.B(q)):.1f} nT)")
    assert abs(div) < 1e-2 * np.linalg.norm(jf.B(q))
    # exact vector potential: curl A_cart == B at random points
    rng2 = np.random.default_rng(3)
    for _ in range(6):
        p = rng2.uniform(-1.5, 1.5, 3)
        if np.linalg.norm(p) < 0.9:
            continue
        hh = 2e-4
        J = np.empty((3, 3))
        for a in range(3):
            e = np.zeros(3); e[a] = hh
            J[:, a] = (jf.A_cart((p + e)[None])[0]
                       - jf.A_cart((p - e)[None])[0]) / (2 * hh)
        curl = np.array([J[2, 1] - J[1, 2], J[0, 2] - J[2, 0], J[1, 0] - J[0, 1]])
        B = jf.B(p)
        assert np.linalg.norm(curl - B) < 1e-4 * max(np.linalg.norm(B), 1.0), (curl, B)
    print("A_cart golden check passed: curl A = B (toroidal closed form)")
    print("jupfield golden checks passed")


if __name__ == "__main__":
    _demo()
