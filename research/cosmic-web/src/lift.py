"""Orientation score on R^3 x S^2: lift a scalar field to position-orientation
space with elongated anisotropic ridge filters (Fourier-domain).

The score for axis n is  U_n = [ |k_perp|^2 * exp(-1/2 (s_par^2 k_par^2 +
s_perp^2 |k_perp|^2)) ] applied in Fourier space: minus the transverse
Laplacian of an n-elongated Gaussian smoothing — positive on bright ridges
aligned with n.  Angular selectivity grows with s_par / s_perp; a Hessian
(quadratic) score cannot exceed angular bandwidth 2, this can.
"""

import numpy as np


def hemisphere_axes(n_axes=42):
    """Quasi-uniform axes on the upper hemisphere (golden spiral).
    Orientations are axial (n ~ -n), so a hemisphere suffices."""
    i = np.arange(n_axes)
    z = (i + 0.5) / n_axes
    phi = i * np.pi * (3 - np.sqrt(5))
    r = np.sqrt(1 - z ** 2)
    return np.stack([r * np.cos(phi), r * np.sin(phi), z], axis=1)


def _kgrid(N):
    k1 = np.fft.fftfreq(N) * 2 * np.pi  # voxel units
    kx, ky, kz = np.meshgrid(k1, k1, k1[: N // 2 + 1], indexing="ij")
    return kx, ky, kz


def orientation_score(field, axes, sig_par=6.0, sig_perp=1.5, scales=(1.0, 1.6)):
    """U[a, x, y, z] float32, max over scales (scale-normalised by sig_perp^2)."""
    N = field.shape[0]
    F = np.fft.rfftn(field - field.mean())
    kx, ky, kz = _kgrid(N)
    k2 = kx ** 2 + ky ** 2 + kz ** 2
    U = np.zeros((len(axes),) + field.shape, dtype=np.float32)
    for s in scales:
        sp, st = sig_par * s, sig_perp * s
        for a, n in enumerate(axes):
            kpar = kx * n[0] + ky * n[1] + kz * n[2]
            kperp2 = k2 - kpar ** 2
            filt = st ** 2 * kperp2 * np.exp(-0.5 * ((sp * kpar) ** 2 + st ** 2 * kperp2))
            resp = np.fft.irfftn(F * filt, s=field.shape).astype(np.float32)
            np.maximum(U[a], resp, out=U[a])
    return U


def axis_adjacency(axes, k_nn=5):
    """Row-normalised adjacency among axes by axial angle (|dot|), for
    orientation diffusion. Returns (n_axes, n_axes) float32."""
    dots = np.abs(axes @ axes.T)
    np.fill_diagonal(dots, -1)
    W = np.zeros_like(dots, dtype=np.float32)
    idx = np.argsort(-dots, axis=1)[:, :k_nn]
    for i, row in enumerate(idx):
        W[i, row] = dots[i, row]
    W /= W.sum(axis=1, keepdims=True)
    return W


def hypoelliptic_diffuse(U, axes, W, sig_par=4.0, sig_perp=0.5, alpha=0.35,
                         n_iter=2):
    """Splitting scheme for left-invariant diffusion on R^3 x S^2:
    per-channel anisotropic Gaussian along its own axis (strong parallel,
    weak transverse), then orientation smoothing U <- (1-a)U + a W U."""
    N = U.shape[1]
    kx, ky, kz = _kgrid(N)
    k2 = kx ** 2 + ky ** 2 + kz ** 2
    kernels = []
    for n in axes:
        kpar = kx * n[0] + ky * n[1] + kz * n[2]
        kernels.append(np.exp(-0.5 * ((sig_par * kpar) ** 2
                                      + sig_perp ** 2 * (k2 - kpar ** 2))
                              ).astype(np.float32))
    for _ in range(n_iter):
        for a in range(len(axes)):
            U[a] = np.fft.irfftn(np.fft.rfftn(U[a]) * kernels[a],
                                 s=U.shape[1:]).astype(np.float32)
        U[:] = (1 - alpha) * U + alpha * np.tensordot(W, U, axes=(1, 0))
    return U
