"""Synthetic cosmic-web fields for E0.

Two generators:
- Voronoi filament model: exact ground-truth spines/junctions (E0a, accuracy).
- Zel'dovich box: realistic gravity-shaped web, no exact truth (E0b, robustness).

Units: box of size N voxels = L h^-1 Mpc, so 1 voxel = L/N h^-1 Mpc.
All positions are in voxel coordinates.
"""

import numpy as np
from scipy.spatial import Voronoi


# ---------------------------------------------------------------- Voronoi model

def voronoi_web(N, n_seeds, rng):
    """Voronoi filament network in an N^3 box.

    Filaments of the cosmic-web Voronoi model are the *edges* of the Voronoi
    polyhedra (segments shared by >= 3 cell faces); nodes are the vertices.
    Returns (segments [n,2,3], vertices [m,3]) in voxel coords, clipped to
    a margin so no infinite/boundary artefacts enter the truth.
    """
    seeds = rng.uniform(0, N, size=(n_seeds, 3))
    # mirror-pad seeds across each face so interior cells are bounded
    pads = []
    for dim in range(3):
        lo = seeds.copy(); lo[:, dim] = -lo[:, dim]
        hi = seeds.copy(); hi[:, dim] = 2 * N - hi[:, dim]
        pads += [lo, hi]
    vor = Voronoi(np.vstack([seeds] + pads))

    # collect polygon edges of every finite ridge (face); an edge shared by
    # >= 3 faces lies where three cells meet -> filament segment
    edge_count = {}
    for face in vor.ridge_vertices:
        if -1 in face:
            continue
        m = len(face)
        for i in range(m):
            a, b = face[i], face[(i + 1) % m]
            edge_count[(min(a, b), max(a, b))] = edge_count.get((min(a, b), max(a, b)), 0) + 1

    margin = 0.02 * N
    inside = lambda p: np.all(p > margin) and np.all(p < N - margin)
    segments, vert_ids = [], set()
    for (a, b), c in edge_count.items():
        if c < 3:
            continue
        pa, pb = vor.vertices[a], vor.vertices[b]
        if inside(pa) and inside(pb):
            segments.append((pa, pb))
            vert_ids.update((a, b))
    segments = np.array(segments)
    vertices = vor.vertices[sorted(vert_ids)]
    vertices = vertices[[inside(v) for v in vertices]]
    return segments, vertices


def sample_segments(segments, step=0.25):
    """Densely sample polyline points along segments (voxel coords)."""
    pts = []
    for pa, pb in segments:
        n = max(2, int(np.linalg.norm(pb - pa) / step))
        t = np.linspace(0, 1, n)[:, None]
        pts.append(pa + t * (pb - pa))
    return np.vstack(pts)


def curve_polylines(segments, bend_frac, rng, n_pts=24):
    """Bend each straight segment into a quadratic Bezier whose control point
    is offset perpendicular to the chord by ~bend_frac * length. bend_frac=0
    returns the straight segments as 2-point polylines. Endpoints (junctions)
    are preserved."""
    polys = []
    for pa, pb in segments:
        if bend_frac == 0:
            polys.append(np.array([pa, pb]))
            continue
        d = pb - pa
        L = np.linalg.norm(d)
        u = rng.normal(size=3)
        u -= (u @ d) / L ** 2 * d
        u /= np.linalg.norm(u)
        ctrl = (pa + pb) / 2 + u * bend_frac * L * rng.uniform(0.5, 1.0)
        t = np.linspace(0, 1, n_pts)[:, None]
        polys.append((1 - t) ** 2 * pa + 2 * t * (1 - t) * ctrl + t ** 2 * pb)
    return polys


def sample_polylines(polys, step=0.25):
    """Arclength-uniform dense points along each polyline; returns
    (points [n,3], total_length)."""
    pts, total = [], 0.0
    for p in polys:
        seg = np.diff(p, axis=0)
        seglen = np.linalg.norm(seg, axis=1)
        total += seglen.sum()
        for (a, d), l in zip(zip(p[:-1], seg), seglen):
            n = max(1, int(l / step))
            t = np.arange(n)[:, None] / n
            pts.append(a + t * d)
    return np.vstack(pts), total


def polyline_galaxies(polys, vertices, N, n_gal, bg_frac, sigma_perp, rng,
                      node_frac=0.15):
    """Galaxies along (possibly curved) filaments + node clumps + background.
    Arclength-uniform sampling, isotropic Gaussian scatter sigma_perp."""
    dense, _ = sample_polylines(polys, step=0.2)
    n_bg = int(n_gal * bg_frac)
    n_node = int(n_gal * node_frac)
    n_fil = n_gal - n_bg - n_node
    pos = dense[rng.integers(0, len(dense), n_fil)] + \
        rng.normal(0, sigma_perp, (n_fil, 3))
    node_pos = vertices[rng.integers(0, len(vertices), n_node)] + \
        rng.normal(0, 1.5 * sigma_perp, (n_node, 3))
    bg_pos = rng.uniform(0, N, (n_bg, 3))
    return np.vstack([pos, node_pos, bg_pos]) % N


def voronoi_galaxies(segments, vertices, N, n_gal, bg_frac, sigma_perp, rng,
                     node_frac=0.15):
    """Galaxies: along filament edges (transverse Gaussian scatter sigma_perp
    voxels), clumps at nodes, and a uniform background fraction."""
    lengths = np.linalg.norm(segments[:, 1] - segments[:, 0], axis=1)
    n_bg = int(n_gal * bg_frac)
    n_node = int(n_gal * node_frac)
    n_fil = n_gal - n_bg - n_node

    seg_idx = rng.choice(len(segments), size=n_fil, p=lengths / lengths.sum())
    t = rng.uniform(0, 1, n_fil)[:, None]
    pos = segments[seg_idx, 0] + t * (segments[seg_idx, 1] - segments[seg_idx, 0])
    pos = pos + rng.normal(0, sigma_perp, pos.shape)

    node_pos = vertices[rng.integers(0, len(vertices), n_node)] + \
        rng.normal(0, 1.5 * sigma_perp, (n_node, 3))
    bg_pos = rng.uniform(0, N, (n_bg, 3))
    return np.vstack([pos, node_pos, bg_pos]) % N


# ---------------------------------------------------------------- Zel'dovich

def _bbks_pk(k, gamma=0.21):
    """BBKS transfer-function power spectrum shape, n_s = 1 (arbitrary norm)."""
    q = np.maximum(k, 1e-8) / gamma
    T = np.log(1 + 2.34 * q) / (2.34 * q) * \
        (1 + 3.89 * q + (16.1 * q) ** 2 + (5.46 * q) ** 3 + (6.71 * q) ** 4) ** -0.25
    return k * T ** 2


def zeldovich_box(N, L, D, rng, trunc=0.0, sigma8=0.8):
    """Zel'dovich-evolved density: delta_lin normalised to sigma(R=8)=0.8,
    particles displaced by D * psi, CIC-deposited. trunc > 0 (Mpc/h) applies
    Gaussian truncation to the displacement field (truncated ZA; avoids
    post-shell-crossing washout). Returns density/mean and particle
    positions (voxel coords)."""
    kf = 2 * np.pi / L
    k1 = np.fft.fftfreq(N, d=1.0 / N) * kf
    kx, ky, kz = np.meshgrid(k1, k1, k1[: N // 2 + 1], indexing="ij")
    k2 = kx ** 2 + ky ** 2 + kz ** 2
    k = np.sqrt(k2)

    amp = np.sqrt(_bbks_pk(k))
    noise = rng.normal(size=k.shape) + 1j * rng.normal(size=k.shape)
    dk = amp * noise
    dk[0, 0, 0] = 0

    # normalise: sigma(delta smoothed with Gaussian R = 8 Mpc/h) = 0.8
    dk_s = dk * np.exp(-0.5 * k2 * 8.0 ** 2)  # k in h/Mpc
    delta_s = np.fft.irfftn(dk_s, s=(N, N, N))
    dk *= sigma8 / delta_s.std()

    tk = np.exp(-0.5 * k2 * trunc ** 2) if trunc else 1.0
    with np.errstate(divide="ignore", invalid="ignore"):
        psi_kx, psi_ky, psi_kz = (1j * kj / np.where(k2 == 0, 1, k2) * dk * tk
                                  for kj in (kx, ky, kz))
    # displacement in Mpc/h -> voxels
    to_vox = N / L
    q = np.arange(N) + 0.5
    qx, qy, qz = np.meshgrid(q, q, q, indexing="ij")
    pos = np.stack([
        qx + D * np.fft.irfftn(psi_kx, s=(N, N, N)) * to_vox,
        qy + D * np.fft.irfftn(psi_ky, s=(N, N, N)) * to_vox,
        qz + D * np.fft.irfftn(psi_kz, s=(N, N, N)) * to_vox,
    ], axis=-1).reshape(-1, 3) % N
    return cic_deposit(pos, N), pos


# ---------------------------------------------------------------- deposit

def cic_deposit(pos, N):
    """Cloud-in-cell mass deposit onto an N^3 periodic grid; returns rho/mean."""
    grid = np.zeros((N, N, N))
    p = pos % N
    i0 = np.floor(p - 0.5).astype(int)
    f = (p - 0.5) - i0
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (np.abs(1 - dx - f[:, 0]) * np.abs(1 - dy - f[:, 1])
                     * np.abs(1 - dz - f[:, 2]))
                np.add.at(grid, ((i0[:, 0] + dx) % N, (i0[:, 1] + dy) % N,
                                 (i0[:, 2] + dz) % N), w)
    return grid / grid.mean()


def galaxy_field(pos, N, n_gal, rng, smooth_sigma=1.0, adaptive=False):
    """Poisson-subsample positions to n_gal 'galaxies', CIC-deposit, and apply
    log transform + Gaussian smoothing. adaptive=True sets the smoothing to
    ~0.35x the mean galaxy separation (floor smooth_sigma) — necessary for
    volume-filling samples where fixed light smoothing leaves shot noise."""
    from scipy.ndimage import gaussian_filter
    if adaptive:
        smooth_sigma = max(smooth_sigma, 0.35 * (N ** 3 / n_gal) ** (1 / 3))
    sel = rng.choice(len(pos), size=min(n_gal, len(pos)), replace=False)
    field = cic_deposit(pos[sel], N)
    return gaussian_filter(np.log1p(field), smooth_sigma, mode="wrap")


# ------------------------------------------------------------- tidal frame

def tidal_frame(field, smooth=4.0):
    """e3 (min-eigenvalue eigenvector of T = Hess phi) per voxel, from a
    density field via FFT Poisson solve; T_ij(k) = k_i k_j delta_k / k^2."""
    delta = field / field.mean() - 1 if field.min() >= 0 else field
    dk = np.fft.rfftn(delta)
    N = field.shape[0]
    k1 = np.fft.fftfreq(N) * 2 * np.pi
    kx, ky, kz = np.meshgrid(k1, k1, k1[: N // 2 + 1], indexing="ij")
    k2 = kx ** 2 + ky ** 2 + kz ** 2
    k2[0, 0, 0] = 1.0
    sm = np.exp(-0.5 * k2 * smooth ** 2)
    ks = [kx, ky, kz]
    T = np.empty((N, N, N, 3, 3), dtype=np.float32)
    for i in range(3):
        for j in range(i, 3):
            tij = np.fft.irfftn(ks[i] * ks[j] / k2 * dk * sm, s=(N, N, N))
            T[..., i, j] = T[..., j, i] = tij
    vals, vecs = np.linalg.eigh(T)      # ascending eigenvalues
    return vecs[..., :, 0]              # e3: min-eigenvalue eigenvector


def tidal_frame_full(field, smooth=4.0):
    """(e1, e3): max- and min-eigenvalue eigenvectors of the tidal tensor
    per voxel — e1 is the first-collapse direction, e3 the filament axis."""
    delta = field / field.mean() - 1 if field.min() >= 0 else field
    N = field.shape[0]
    dk = np.fft.rfftn(delta)
    k1 = np.fft.fftfreq(N) * 2 * np.pi
    kx, ky, kz = np.meshgrid(k1, k1, k1[: N // 2 + 1], indexing="ij")
    k2 = kx ** 2 + ky ** 2 + kz ** 2
    k2[0, 0, 0] = 1.0
    sm = np.exp(-0.5 * k2 * smooth ** 2)
    ks = [kx, ky, kz]
    T = np.empty((N, N, N, 3, 3), dtype=np.float32)
    for i in range(3):
        for j in range(i, 3):
            tij = np.fft.irfftn(ks[i] * ks[j] / k2 * dk * sm, s=(N, N, N))
            T[..., i, j] = T[..., j, i] = tij
    vals, vecs = np.linalg.eigh(T)
    return vecs[..., :, 2], vecs[..., :, 0]
