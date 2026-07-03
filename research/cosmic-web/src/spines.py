"""Spine extraction and the Hessian baseline.

Both methods produce a scalar 'ridgeness' field and then share the SAME
post-processing (hysteresis threshold -> 3D skeletonization -> junctions),
so the comparison isolates exactly one variable: the orientation lift +
hypoelliptic diffusion vs. the quadratic (Hessian) orientation response.

Baseline note: max_n of the quadratic score -(tr H - n^T H n)/2 over the
sphere is attained at the largest-eigenvalue eigenvector, giving ridgeness
-(l2 + l3)/2 — i.e. the Hessian baseline IS the angular-bandwidth-2 version
of the lifted score. That makes it the textbook-fair ablation.
"""

import numpy as np
from scipy.ndimage import gaussian_filter, label, center_of_mass
from skimage.filters import apply_hysteresis_threshold
from skimage.morphology import skeletonize


# ---------------------------------------------------------------- ridgeness

def hessian_ridgeness(field, sigma=2.0):
    """-(l2 + l3)/2 of the Hessian of the sigma-smoothed field (bright ridges),
    multi-scale-free single-sigma baseline; scale-normalised by sigma^2."""
    f = gaussian_filter(field, sigma, mode="wrap")
    grads = np.gradient(f)
    H = np.empty(field.shape + (3, 3))
    for i in range(3):
        gi = np.gradient(grads[i])
        for j in range(3):
            H[..., i, j] = gi[j]
    lam = np.linalg.eigvalsh(H)          # ascending: l3 <= l2 <= l1
    return np.clip(-(lam[..., 0] + lam[..., 1]) / 2, 0, None) * sigma ** 2


def lifted_ridgeness(U):
    """max over orientation channels of the (diffused) orientation score."""
    return np.clip(U.max(axis=0), 0, None)


# ---------------------------------------------------------------- extraction

def _mask(R, hi_val, lo_frac=0.5):
    return apply_hysteresis_threshold(R, lo_frac * hi_val, hi_val)


def extract_matched(R, n_target, tube_area=9.0, lo_frac=0.5, min_component=4):
    """Matched-length skeleton. Bisect the hi threshold VALUE so the mask
    volume ~ n_target * tube_area voxels (mask volume is strictly monotone
    in the threshold, unlike skeleton length), skeletonize, then correct
    tube_area from the measured skeleton length and repeat (<=3 rounds) so
    the SKELETON length itself lands near n_target. Components smaller than
    min_component voxels are dropped. Same procedure for every method keeps
    the comparison fair. lo_frac=1.0 disables hysteresis (plain threshold)
    — required on fully-connected webs where hysteresis floods."""

    def _bisect_mask(v_target):
        lo_v, hi_v = float(np.percentile(R, 50)), float(R.max())
        best_mid, best_err = lo_v, np.inf
        for _ in range(24):
            mid = 0.5 * (lo_v + hi_v)
            v = int(_mask(R, mid, lo_frac).sum())
            err = abs(v - v_target)
            if err < best_err:
                best_mid, best_err = mid, err
            if err <= 0.05 * v_target:
                break
            if v > v_target:
                lo_v = mid
            else:
                hi_v = mid
        return best_mid

    def _skel_at(v_target):
        skel = skeletonize(_mask(R, _bisect_mask(v_target), lo_frac))
        lab, nlab = label(skel, structure=np.ones((3, 3, 3)))
        if nlab:
            sizes = np.bincount(lab.ravel())
            skel &= (sizes[lab] >= min_component) & (lab > 0)
        return skel

    v_target = n_target * tube_area
    skel = _skel_at(v_target)
    for _ in range(3):
        n = int(skel.sum())
        if n == 0 or abs(n - n_target) <= 0.15 * n_target:
            break
        v_target *= n_target / n
        skel = _skel_at(v_target)
    return skel


def skeleton_points(skel):
    return np.argwhere(skel).astype(float)


def junction_points(skel, min_neighbors=3):
    """Skeleton voxels with >= min_neighbors skeleton neighbours (26-conn),
    clustered to centroids."""
    from scipy.ndimage import convolve
    kern = np.ones((3, 3, 3)); kern[1, 1, 1] = 0
    nn = convolve(skel.astype(np.int8), kern, mode="wrap")
    jmask = skel & (nn >= min_neighbors)
    lab, nlab = label(jmask, structure=np.ones((3, 3, 3)))
    if nlab == 0:
        return np.empty((0, 3))
    return np.array(center_of_mass(jmask, lab, range(1, nlab + 1)))
