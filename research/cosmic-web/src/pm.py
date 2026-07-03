"""Minimal particle-mesh N-body (Einstein-de Sitter), enough to give
beyond-Zel'dovich curved trajectories for the E2 dynamical test.

Conformal-time formulation, code units (grid cells, H0 = 1, Omega = 1):
    da/dtau = sqrt(a)          (EdS; tau = 2 sqrt(a))
    dx/dtau = p / a
    dp/dtau = -a grad(phi),    lap(phi) = (3 / 2a) * delta
Initial conditions: Zel'dovich positions and growing-mode momenta
p = a^{3/2} psi at a_init, from the same BBKS linear field as fields.py.
Kick-drift-kick leapfrog, CIC deposit/gather, spectral Poisson solve.

ponytail: EdS only (D = a), 128^3-scale boxes, no adaptive steps — this is
an instrument for trajectory *shape*, not precision cosmology.
"""

import numpy as np

import fields


def _cic_gather(grid, pos):
    """Trilinear (CIC) interpolation of a grid at particle positions."""
    N = grid.shape[0]
    p = pos % N
    i0 = np.floor(p - 0.5).astype(int)
    f = (p - 0.5) - i0
    out = np.zeros(len(p))
    for dx in (0, 1):
        wx = np.abs(1 - dx - f[:, 0])
        for dy in (0, 1):
            wy = np.abs(1 - dy - f[:, 1])
            for dz in (0, 1):
                w = wx * wy * np.abs(1 - dz - f[:, 2])
                out += w * grid[(i0[:, 0] + dx) % N, (i0[:, 1] + dy) % N,
                                (i0[:, 2] + dz) % N]
    return out


def _forces(pos, N, a, kx, ky, kz, k2):
    delta = fields.cic_deposit(pos, N) - 1.0
    phi_k = np.fft.rfftn(delta) * (-1.5 / a) / k2
    phi_k[0, 0, 0] = 0
    return np.stack([
        _cic_gather(np.fft.irfftn(-1j * kj * phi_k, s=(N, N, N)), pos)
        for kj in (kx, ky, kz)], axis=1)


def pm_sim(N, L, rng_master, a_init=0.1, a_final=1.0, n_steps=90, trunc=0.0,
           track=50000, track_from=0.5):
    """Run the PM simulation.

    ICs: the same linear field the Zel'dovich generator draws (obtained by
    running it at D=0 and D=1 and differencing the positions — avoids
    refactoring its internals). Returns (pos_final [Np,3] voxels,
    vel_final = p/a [Np,3], track_idx, track_a, track_pos [n_a, track, 3]);
    tracked-subset positions stored every step once a >= track_from.
    """
    seedseq = rng_master.integers(0, 2 ** 32)
    r1 = np.random.default_rng(seedseq)
    r2 = np.random.default_rng(seedseq)
    _, pos_q = fields.zeldovich_box(N, L, D=0.0, rng=r1, trunc=trunc)
    _, pos_d = fields.zeldovich_box(N, L, D=1.0, rng=r2, trunc=trunc)
    psi = pos_d - pos_q
    psi -= N * np.round(psi / N)                    # unwrap periodicity

    x = (pos_q + a_init * psi) % N
    p = a_init ** 1.5 * psi                          # growing mode momenta

    k1 = np.fft.fftfreq(N) * 2 * np.pi
    kx, ky, kz = np.meshgrid(k1, k1, k1[: N // 2 + 1], indexing="ij")
    k2 = kx ** 2 + ky ** 2 + kz ** 2
    k2[0, 0, 0] = 1.0

    tau_i, tau_f = 2 * np.sqrt(a_init), 2 * np.sqrt(a_final)
    dtau = (tau_f - tau_i) / n_steps
    track_idx = np.random.default_rng(0).choice(len(x), track, replace=False)
    track_a, track_pos = [], []

    tau = tau_i
    F = _forces(x, N, a_init, kx, ky, kz, k2)
    for _ in range(n_steps):
        a = (tau / 2) ** 2
        p += a * F * (dtau / 2)                     # kick (F = -grad phi)
        a_half = ((tau + dtau / 2) / 2) ** 2
        x = (x + p / a_half * dtau) % N              # drift
        tau += dtau
        a_new = (tau / 2) ** 2
        F = _forces(x, N, a_new, kx, ky, kz, k2)
        p += F * (dtau / 2) * a_new
        if a_new >= track_from:
            track_a.append(a_new)
            track_pos.append(x[track_idx].astype(np.float32))
    vel = p / a_new
    return x, vel, track_idx, np.array(track_a), np.array(track_pos)
