"""Evaluation metrics M1/M2 (defined in the scoping post, section 5).

M1 spine distance: directed median point-to-curve distances between truth
and estimate point sets, plus completeness (fraction of truth points within
r0 of the estimate) and purity (fraction of estimate points within r0 of
truth), at matched skeleton length.

M2 junction recovery: greedy one-to-one matching of junction points within
r0 -> precision, recall, F1.

All distances in voxels; the caller reports the voxel size.
"""

import numpy as np
from scipy.spatial import cKDTree


def spine_metrics(truth_pts, est_pts, r0=2.0):
    if len(est_pts) == 0:
        return {"median_d_truth_to_est": np.inf, "median_d_est_to_truth": np.inf,
                "completeness": 0.0, "purity": 0.0, "r0": r0, "n_est": 0}
    t_tree, e_tree = cKDTree(truth_pts), cKDTree(est_pts)
    d_te = e_tree.query(truth_pts)[0]   # truth -> estimate
    d_et = t_tree.query(est_pts)[0]     # estimate -> truth
    return {
        "median_d_truth_to_est": float(np.median(d_te)),
        "median_d_est_to_truth": float(np.median(d_et)),
        "completeness": float((d_te < r0).mean()),
        "purity": float((d_et < r0).mean()),
        "r0": r0,
        "n_est": len(est_pts),
    }


def junction_metrics(truth_j, est_j, r0=3.0):
    if len(est_j) == 0 or len(truth_j) == 0:
        return {"precision": 0.0, "recall": 0.0, "f1": 0.0,
                "n_true": len(truth_j), "n_est": len(est_j), "r0": r0}
    d = np.linalg.norm(truth_j[:, None] - est_j[None], axis=2)
    matched_t, matched_e = set(), set()
    for ti, ei in sorted(zip(*np.where(d < r0)), key=lambda p: d[p]):
        if ti not in matched_t and ei not in matched_e:
            matched_t.add(ti); matched_e.add(ei)
    tp = len(matched_t)
    prec = tp / len(est_j)
    rec = tp / len(truth_j)
    f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0.0
    return {"precision": prec, "recall": rec, "f1": f1,
            "n_true": len(truth_j), "n_est": len(est_j), "r0": r0}
