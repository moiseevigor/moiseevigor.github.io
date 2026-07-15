"""Real solar magnetic field: potential-field extrapolation of an SDO/HMI magnetogram.

Pipeline for the Phase-2 real-data test (docs/PROGRAM.md). A line-of-sight HMI
magnetogram gives the normal field B_z on the photospheric boundary (near disk centre).
The current-free (potential) coronal field above it is the harmonic extension

    B = -grad psi,   lap psi = 0,   B_z(z=0) = given,   psi -> 0 as z -> inf,

solved by Fourier (Schmidt/Green): with Bz0_k the 2D transform of the boundary,

    Bz_k(z) = Bz0_k exp(-|k| z),
    Bx_k(z) = -i (kx/|k|) Bz0_k exp(-|k| z),   By_k(z) = -i (ky/|k|) Bz0_k exp(-|k| z).

This B is divergence-free by construction. For the sub-Riemannian detector we also need a
vector potential A with curl A = B; in Coulomb gauge A_k = i (k x B_k)/|k|^2 (verified
numerically). Magnetic nulls (B=0) are found by Newton descent and classified by the
eigenvalues of grad B -- the standard solar null-finder -- to validate the SR growth-vector
detector against.

Dependency-light: numpy (+ astropy/sunpy only to fetch the FITS, done in the driver).
"""
from __future__ import annotations

import numpy as np


def potential_field(bz, nz, dz=1.0):
    """Potential (current-free) extrapolation of boundary B_z. Flux is balanced first.

    Returns B (ny, nx, nz, 3) and A (ny, nx, nz, 3) with curl A = B (Coulomb gauge).
    """
    bz = np.asarray(bz, float)
    bz = bz - bz.mean()                                   # flux balance (kills k=0)
    ny, nx = bz.shape
    bzk = np.fft.fft2(bz)
    ky = np.fft.fftfreq(ny)[:, None] * 2 * np.pi
    kx = np.fft.fftfreq(nx)[None, :] * 2 * np.pi
    K = np.sqrt(kx ** 2 + ky ** 2)
    K[0, 0] = 1e-30
    B = np.empty((ny, nx, nz, 3))
    A = np.empty((ny, nx, nz, 3))
    for iz in range(nz):
        att = np.exp(-K * (iz * dz))
        Bzk = bzk * att
        Bxk = -1j * kx / K * bzk * att
        Byk = -1j * ky / K * bzk * att
        Bx = np.real(np.fft.ifft2(Bxk))
        By = np.real(np.fft.ifft2(Byk))
        Bz = np.real(np.fft.ifft2(Bzk))
        B[:, :, iz, 0] = Bx
        B[:, :, iz, 1] = By
        B[:, :, iz, 2] = Bz
        # A = i (k x B)/|k|^2  (Coulomb gauge). k=(kx,ky,0).
        k2 = kx ** 2 + ky ** 2
        k2[0, 0] = 1e-30
        Axk = 1j * (ky * Bzk - 0) / k2          # (k x B)_x = ky Bz - kz By, kz=0
        Ayk = 1j * (0 - kx * Bzk) / k2          # (k x B)_y = kz Bx - kx Bz
        Azk = 1j * (kx * Byk - ky * Bxk) / k2   # (k x B)_z = kx By - ky Bx
        A[:, :, iz, 0] = np.real(np.fft.ifft2(Axk))
        A[:, :, iz, 1] = np.real(np.fft.ifft2(Ayk))
        A[:, :, iz, 2] = np.real(np.fft.ifft2(Azk))
    return B, A


def find_nulls(B, dz=1.0, seeds_per_axis=8, tol=1e-3, max_iter=40, seeds=None,
               dedup=1.5):
    """Newton descent to B=0 in the extrapolated volume. Returns list of null dicts.

    Field magnitude is normalised by its box RMS; a null is |B| < tol * rms. Coordinates
    are in grid units (ix, iy, iz), iz in units of dz. Skips the z=0 boundary layer.
    Explicit `seeds` (n,3) run BEFORE the regular grid -- warm starts for tracking.
    """
    ny, nx, nz, _ = B.shape
    rms = np.sqrt((B ** 2).sum(-1)).mean()

    def field(p):
        return _interp3(B, p)

    def jac(p, h=0.5):
        J = np.empty((3, 3))
        for a in range(3):
            e = np.zeros(3); e[a] = h
            J[:, a] = (_interp3(B, p + e) - _interp3(B, p - e)) / (2 * h)
        return J

    found = []
    zs = np.linspace(2, nz - 2, seeds_per_axis)
    xs = np.linspace(2, nx - 3, seeds_per_axis)
    ys = np.linspace(2, ny - 3, seeds_per_axis)
    seed_list = ([np.asarray(s, float).copy() for s in seeds]
                 if seeds is not None else [])
    seed_list += [np.array([ix, iy, iz], float)
                  for iz in zs for iy in ys for ix in xs]
    for p in seed_list:
        ok = True
        for _ in range(max_iter):
            b = field(p)
            if np.linalg.norm(b) < tol * rms:
                break
            try:
                p = p - np.linalg.solve(jac(p), b)
            except np.linalg.LinAlgError:
                ok = False; break
            if not (1 < p[0] < nx - 2 and 1 < p[1] < ny - 2 and 1 < p[2] < nz - 2):
                ok = False; break
        if ok and np.linalg.norm(field(p)) < 5 * tol * rms:
            if not any(np.linalg.norm(p - f["p"]) < dedup for f in found):
                found.append({"p": p.copy(), "gradB": jac(p)})
    for f in found:
        ev = np.linalg.eigvals(f["gradB"])
        f["eigs"] = ev
        f["type"] = "spiral" if np.sum(np.abs(ev.imag) > 1e-6 * np.abs(ev).max()) >= 2 else "radial"
    return found


def _interp3(F, p):
    """Trilinear interpolation of a (ny,nx,nz,3) field at grid point p=(ix,iy,iz)."""
    ny, nx, nz = F.shape[:3]
    x = np.clip(p[0], 0, nx - 1.001); y = np.clip(p[1], 0, ny - 1.001); z = np.clip(p[2], 0, nz - 1.001)
    i0, j0, k0 = int(x), int(y), int(z)
    fx, fy, fz = x - i0, y - j0, z - k0
    out = np.zeros(3)
    for di in (0, 1):
        for dj in (0, 1):
            for dk in (0, 1):
                w = (abs(1 - di - fx) * abs(1 - dj - fy) * abs(1 - dk - fz))
                out += w * F[(j0 + dj), (i0 + di), (k0 + dk)]
    return out
