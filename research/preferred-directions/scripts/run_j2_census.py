#!/usr/bin/env python3
"""J2 -- Jupiter: two-resolution cell-prefiltered root census + coefficient ensemble.

Two legs, upgrading Part 8's seed-based hunt to the review's standard:

LEG A -- cell-prefiltered root census (l<=18 JRM33 continuation, shell 0.855-1.0 R_J).
  Haynes-Parnell-style pre-filter: a spherical cell is a candidate iff EVERY
  Cartesian component of B changes sign among its 8 corners; Newton descent
  from candidate-cell centres; dedup. Run at two grid resolutions -- the
  candidate/confirmed counts must agree for the census to be called converged.
  This replaces "~3,000 seeds found two nulls" with two-resolution convergence
  evidence. NOT a completeness theorem: the corner-sign filter is necessary-only
  and centre-started Newton can fail or leave its cell (see run_j2b_sensitivity
  for the degree cross-check and floor sensitivity).

LEG B -- model-difference coefficient ensemble (uncertainty proxy).
  JRM33 formal covariances are not distributed with the coefficients. Proxy:
  per-degree rms coefficient difference between JRM33 and JRM09 (l <= 10),
  log-linear extrapolated in l to 11..18 (capped at 100%), scales i.i.d.
  Gaussian perturbations of every (g,h). Honest label: model-to-model change
  as an uncertainty PROXY, not a posterior. For each of N members: does the
  polar reversed patch survive at r = 0.85? does the polar null survive in the
  envelope, and where does it move? Output: survival fractions + position
  scatter -- the uncertainty statement Part 8's prediction was missing.

Out: artifacts/j2_census.json + printed verdicts.
"""
import json
import sys
import time
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

import jupfield  # noqa: E402

R_IN, R_OUT = 0.855, 1.0
T0 = time.time()


def sph_to_cart(r, th, ph):
    st, ct = np.sin(th), np.cos(th)
    return np.stack([r * st * np.cos(ph), r * st * np.sin(ph), r * ct], axis=-1)


def B_cart_many(jf, P, chunk=20_000):
    """Vectorised mirror of jf.B for (n,3) Cartesian points; golden-checked."""
    from scipy.special import assoc_legendre_p_all
    P = np.asarray(P, float)
    out = np.empty_like(P)
    L = jf.lmax
    m_arr = np.arange(L + 1)
    for a in range(0, len(P), chunk):
        x, y, z = P[a:a + chunk, 0], P[a:a + chunk, 1], P[a:a + chunk, 2]
        r = np.sqrt(x * x + y * y + z * z)
        ct = np.clip(z / r, -1, 1)
        st = np.maximum(np.sqrt(1 - ct * ct), 1e-12)
        ph = np.arctan2(y, x)
        A = np.asarray(assoc_legendre_p_all(L, L, ct, diff_n=1))
        Pl = A[0][:, : L + 1, :] * jf._S[:, :, None]          # (L+1, L+1, n)
        dP = -st[None, None, :] * (A[1][:, : L + 1, :] * jf._S[:, :, None])
        cmp_ = np.cos(m_arr[:, None] * ph[None, :])            # (L+1, n)
        smp = np.sin(m_arr[:, None] * ph[None, :])
        gc_hs = jf.g[:, :, None] * cmp_[None, :, :] + jf.h[:, :, None] * smp[None, :, :]
        gs_hc = jf.g[:, :, None] * smp[None, :, :] - jf.h[:, :, None] * cmp_[None, :, :]
        ls = np.arange(L + 1)
        rl = r[None, :] ** (-(ls[:, None] + 2.0))              # (L+1, n)
        t_br = (gc_hs * Pl).sum(axis=1)                        # (L+1, n)
        t_bt = (gc_hs * dP).sum(axis=1)
        t_bp = (gs_hc * (m_arr[None, :, None] * Pl)).sum(axis=1)
        Br = ((ls + 1)[:, None] * rl * t_br)[1:].sum(axis=0)
        Bt = (-rl * t_bt)[1:].sum(axis=0)
        Bp = ((rl / st[None, :]) * t_bp)[1:].sum(axis=0)
        sp, cp = np.sin(ph), np.cos(ph)
        out[a:a + chunk, 0] = Br * st * cp + Bt * ct * cp - Bp * sp
        out[a:a + chunk, 1] = Br * st * sp + Bt * ct * sp + Bp * cp
        out[a:a + chunk, 2] = Br * ct - Bt * st
    return out


def newton(jf, p0, tol=1e-10, itmax=40):
    p = np.array(p0, float)
    for _ in range(itmax):
        Bv = jf.B(p)
        if np.linalg.norm(Bv) < tol:
            break
        try:
            step = np.linalg.solve(jf.jac(p), Bv)
        except np.linalg.LinAlgError:
            return None
        n = np.linalg.norm(step)
        if n > 0.05:
            step *= 0.05 / n
        p = p - step
        if not np.isfinite(p).all() or np.linalg.norm(p) > 1.5:
            return None
    if np.linalg.norm(jf.B(p)) > 1e-7:
        return None
    r = np.linalg.norm(p)
    if not (R_IN + 0.001 < r < R_OUT - 0.001):
        return None
    return p


def census(jf, n_r, n_th, n_ph, chunk=120_000):
    """Corner-sign cell-prefiltered census. Returns (n_candidates, confirmed nulls)."""
    r_e = np.linspace(R_IN, R_OUT, n_r + 1)
    th_e = np.linspace(0.02, np.pi - 0.02, n_th + 1)
    ph_e = np.linspace(0.0, 2 * np.pi, n_ph + 1)
    R, TH, PH = np.meshgrid(r_e, th_e, ph_e, indexing="ij")
    P = sph_to_cart(R, TH, PH).reshape(-1, 3)
    B = B_cart_many(jf, P, chunk=chunk).reshape(n_r + 1, n_th + 1, n_ph + 1, 3)

    def corners(A):
        return np.stack([A[i:i + n_r, j:j + n_th, k:k + n_ph]
                         for i in (0, 1) for j in (0, 1) for k in (0, 1)])

    cand = np.ones((n_r, n_th, n_ph), bool)
    for c in range(3):
        cc = corners(B[..., c])
        cand &= (cc.min(0) < 0) & (cc.max(0) > 0)
    idx = np.argwhere(cand)
    print(f"  census {n_r}x{n_th}x{n_ph}: {len(idx)} candidate cells "
          f"[{time.time()-T0:.0f} s]", flush=True)

    nulls = []
    for (i, j, k) in idx:
        p0 = sph_to_cart((r_e[i] + r_e[i + 1]) / 2, (th_e[j] + th_e[j + 1]) / 2,
                         (ph_e[k] + ph_e[k + 1]) / 2)
        p = newton(jf, p0)
        if p is None:
            continue
        if all(np.linalg.norm(p - q) > 1e-3 for q in nulls):
            nulls.append(p)
    return len(idx), nulls


def null_latlon(p):
    r = float(np.linalg.norm(p))
    lat = float(np.degrees(np.arcsin(p[2] / r)))
    lon = float(np.degrees(np.arctan2(p[1], p[0])) % 360)
    return r, lat, lon


def main():
    out = {}
    jf = jupfield.JupiterField("jrm33", lmax=18)

    # golden check: vectorised evaluator vs the pointwise reference
    rng0 = np.random.default_rng(0)
    Pg = rng0.uniform(-1, 1, (50, 3))
    Pg = Pg / np.linalg.norm(Pg, axis=1)[:, None] * rng0.uniform(0.86, 1.4, 50)[:, None]
    ref = np.array([jf.B(p) for p in Pg])
    vec = B_cart_many(jf, Pg)
    rel = np.abs(vec - ref).max() / np.abs(ref).max()
    print(f"golden check B_cart_many vs jf.B: max rel {rel:.2e}", flush=True)
    assert rel < 1e-9, "vectorised evaluator disagrees with reference"

    # -------------- LEG A: cell-prefiltered census, two resolutions ------------
    print("== LEG A: cell-prefiltered root census (l<=18) ==", flush=True)
    resA = {}
    for (nr, nt, np_) in [(24, 72, 144), (36, 108, 216)]:
        ncand, nulls = census(jf, nr, nt, np_)
        entries = [dict(zip(("r", "lat", "lon"), np.round(null_latlon(p), 3)))
                   for p in nulls]
        resA[f"{nr}x{nt}x{np_}"] = {"candidates": ncand,
                                    "confirmed": len(nulls), "nulls": entries}
        for e in entries:
            print(f"    null: r={e['r']}, lat={e['lat']:+.1f}, lon={e['lon']:.1f}",
                  flush=True)
    out["census"] = resA
    counts = [v["confirmed"] for v in resA.values()]
    out["census_converged"] = bool(len(set(counts)) == 1)
    print(f"  confirmed counts across resolutions: {counts} "
          f"({'CONVERGED' if out['census_converged'] else 'NOT converged'})",
          flush=True)

    # ---------------- LEG B: model-difference coefficient ensemble -------------
    print("\n== LEG B: coefficient ensemble (JRM33-JRM09 difference proxy) ==",
          flush=True)
    j09 = jupfield.JupiterField("jrm09", lmax=10)
    Lmax = jf.lmax
    a_l = np.zeros(Lmax + 1)
    f_l = np.zeros(Lmax + 1)
    for l in range(1, Lmax + 1):
        m = np.arange(0, l + 1)
        a_l[l] = np.sqrt(np.mean(jf.g[l, :l + 1] ** 2 + jf.h[l, :l + 1] ** 2))
        if l <= 10:
            dg = jf.g[l, :l + 1] - j09.g[l, :l + 1]
            dh = jf.h[l, :l + 1] - j09.h[l, :l + 1]
            f_l[l] = np.sqrt(np.mean(dg ** 2 + dh ** 2)) / max(a_l[l], 1e-12)
    ls = np.arange(2, 11)
    slope, icpt = np.polyfit(ls, np.log(f_l[2:11]), 1)
    for l in range(11, Lmax + 1):
        f_l[l] = min(1.0, float(np.exp(icpt + slope * l)))
    out["ensemble_sigma_frac"] = {int(l): round(float(f_l[l]), 4)
                                  for l in range(1, Lmax + 1)}
    print("  per-degree sigma fraction (l: f):",
          {l: round(float(f_l[l]), 3) for l in (2, 5, 10, 14, 18)}, flush=True)

    d = json.loads((ROOT / "artifacts" / "j1_jupiter.json").read_text())
    nl = d["models"]["jrm33_l18"]["nulls"][1]            # the polar null
    p_ref = np.array(nl["p"], float)
    g0, h0 = jf.g.copy(), jf.h.copy()
    rng = np.random.default_rng(11)
    N = 40
    surv_patch, surv_null, positions = 0, 0, []
    th_cap = np.radians(np.linspace(1, 35, 35))          # colat < 35 deg = lat > 55
    ph_cap = np.radians(np.linspace(0, 360, 91))
    cloud = np.array([[dx, dy, dz] for dx in (-0.02, 0, 0.02)
                      for dy in (-0.02, 0, 0.02) for dz in (-0.02, 0, 0.02)])
    for n in range(N):
        jf.g = g0 + rng.normal(0, 1, g0.shape) * (f_l[:, None] * a_l[:, None])
        jf.h = h0 + rng.normal(0, 1, h0.shape) * (f_l[:, None] * a_l[:, None])
        jf.h[:, 0] = 0.0
        # patch survival: min Br over the polar cap at r = 0.85
        brmin = min(jf.B_sph(0.85, float(t), float(p))[0]
                    for t in th_cap[::2] for p in ph_cap[::3])
        patch = brmin < -0.5e4                            # -0.5 G in nT
        surv_patch += patch
        # null survival: warm-started Newton cloud around the reference null
        found = None
        for dp in cloud:
            p = newton(jf, p_ref + dp)
            if p is not None and np.linalg.norm(p - p_ref) < 0.15:
                found = p
                break
        if found is not None:
            surv_null += 1
            positions.append(null_latlon(found))
    jf.g, jf.h = g0, h0
    pos = np.array(positions) if positions else np.zeros((0, 3))
    out["ensemble"] = {
        "members": N, "patch_survival": surv_patch / N,
        "null_survival": surv_null / N,
        "r_spread": [float(pos[:, 0].min()), float(pos[:, 0].max())] if len(pos) else None,
        "lat_spread": [float(pos[:, 1].min()), float(pos[:, 1].max())] if len(pos) else None,
        "lon_spread": [float(pos[:, 2].min()), float(pos[:, 2].max())] if len(pos) else None,
    }
    print(f"  ensemble (N={N}): patch survives {surv_patch}/{N}, "
          f"polar null survives {surv_null}/{N}", flush=True)
    if len(pos):
        print(f"  null position spread: r {pos[:,0].min():.3f}-{pos[:,0].max():.3f}, "
              f"lat {pos[:,1].min():+.1f}..{pos[:,1].max():+.1f}, "
              f"lon {pos[:,2].min():.1f}..{pos[:,2].max():.1f}", flush=True)

    (ROOT / "artifacts" / "j2_census.json").write_text(json.dumps(out, indent=1) + "\n")
    print(f"saved artifacts/j2_census.json  [{time.time()-T0:.0f} s]", flush=True)


if __name__ == "__main__":
    main()
