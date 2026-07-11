"""Gaussian random field and its deformation tensor (experiment E6).

Builds a cosmological Gaussian random field on a periodic grid and computes the
**deformation tensor** T_ij = d^2 Phi / dq_i dq_j of the displacement potential
(Poisson: lap(Phi) = delta), whose eigenvalues drive the Zel'dovich collapse and
whose degeneracies are the umbilic (D4) caustics of the cosmic web.

The external check this module enables (Doroshkevich 1970): at any point of a
Gaussian field the Hessian is a random symmetric matrix with the isotropic
covariance

    <T_ij T_kl> = (sigma^2 / 15) (d_ij d_kl + d_ik d_jl + d_il d_jk),   sigma^2 = <delta^2>

whose eigenvalue density carries a **Vandermonde factor**:

    p(l1,l2,l3)  ~  exp[ -3 I1^2/sigma^2 + 15 I2/(2 sigma^2) ] * (l1-l2)(l1-l3)(l2-l3)

for l1 >= l2 >= l3, with I1 = sum l_i and I2 = sum_{i<j} l_i l_j. The Vandermonde
forces **eigenvalue repulsion**: degeneracies (two equal eigenvalues -- the points of
enhanced local SO(2) symmetry, i.e. the umbilics) are strongly suppressed. This is a
published analytic prediction we did not generate, and E6 tests our measured field
against it.

Dependency-light: numpy only.
"""
from __future__ import annotations

import numpy as np


def gaussian_field(N, L, rng, n_index=-1.0, r_smooth=2.0):
    """Periodic Gaussian random field with P(k) ~ k^n_index, Gaussian-smoothed.

    Returns (delta, kvecs, k2) where kvecs is a tuple of broadcastable k arrays.
    The eigenvalue statistics of the deformation tensor are independent of the
    shape of P(k) (only sigma matters), so the spectrum here is a convenience.
    """
    kf = 2.0 * np.pi * np.fft.fftfreq(N, d=L / N)
    kx = kf[:, None, None]
    ky = kf[None, :, None]
    kz = kf[None, None, :]
    k2 = kx ** 2 + ky ** 2 + kz ** 2
    Pk = np.zeros_like(k2)
    nz = k2 > 0
    Pk[nz] = k2[nz] ** (n_index / 2.0)
    Pk *= np.exp(-k2 * r_smooth ** 2)                 # smooth so the Hessian is tame
    wn = rng.standard_normal((N, N, N))
    dk = np.fft.fftn(wn) * np.sqrt(Pk)
    dk[0, 0, 0] = 0.0                                  # zero mean
    delta = np.real(np.fft.ifftn(dk))
    return delta, (kx, ky, kz), k2, dk


def deformation_tensor(dk, kvecs, k2):
    """T_ij = IFFT[ k_i k_j / k^2 * delta_k ].  Its trace is delta."""
    kx, ky, kz = kvecs
    ks = [kx, ky, kz]
    N = dk.shape[0]
    inv = np.zeros_like(k2)
    nz = k2 > 0
    inv[nz] = 1.0 / k2[nz]
    T = np.empty(dk.shape + (3, 3))
    for i in range(3):
        for j in range(i, 3):
            tij = np.real(np.fft.ifftn(ks[i] * ks[j] * inv * dk))
            T[..., i, j] = tij
            T[..., j, i] = tij
    return T


def eigenvalues_sorted(T):
    """Eigenvalues at every grid point, sorted DESCENDING (l1 >= l2 >= l3)."""
    lam = np.linalg.eigvalsh(T.reshape(-1, 3, 3))      # ascending
    return lam[:, ::-1]                                 # descending


def doroshkevich_sample(n, sigma, rng):
    """Sample the theory ensemble directly: T = (delta/3) I + (sigma/sqrt15) * Gtilde.

    delta ~ N(0, sigma^2); G is GOE (<G_ij G_kl> = d_ik d_jl + d_il d_jk); Gtilde is
    its traceless part. Reproduces the Doroshkevich covariance exactly, hence the
    Vandermonde eigenvalue density. Returns eigenvalues sorted descending, (n, 3).
    """
    delta = sigma * rng.standard_normal(n)
    A = rng.standard_normal((n, 3, 3))
    S = (A + np.transpose(A, (0, 2, 1))) / np.sqrt(2.0)      # GOE
    tr = np.trace(S, axis1=1, axis2=2)
    Gt = S - (tr / 3.0)[:, None, None] * np.eye(3)
    T = (delta / 3.0)[:, None, None] * np.eye(3) + (sigma / np.sqrt(15.0)) * Gt
    lam = np.linalg.eigvalsh(T)
    return lam[:, ::-1]


def min_gap(lam_desc):
    """Smallest adjacent eigenvalue gap; zero exactly on the degeneracy locus."""
    return np.minimum(lam_desc[:, 0] - lam_desc[:, 1], lam_desc[:, 1] - lam_desc[:, 2])


def discriminant(lam_desc):
    """Basis-free degeneracy measure: prod_{i<j} (l_i - l_j)^2. Zero iff degenerate."""
    a = lam_desc[:, 0] - lam_desc[:, 1]
    b = lam_desc[:, 1] - lam_desc[:, 2]
    c = lam_desc[:, 0] - lam_desc[:, 2]
    return (a * b * c) ** 2
