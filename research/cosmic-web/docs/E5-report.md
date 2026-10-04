# E5 (H-T2) — transverse-damping adjustment vs ZA and isotropic sticking

Effective models evolved from PM initial conditions (rho_c = 5.0, calibrated on seed 1 by optimizing the ISOTROPIC competitor; 5 held-out seeds). Score: median per-particle distance to the PM-truth position at a=1 (voxels = h⁻¹Mpc), binned by distance to the web.

| d to spine (vox) | ZA | isotropic stick | transverse damp | damp vs ZA | damp vs stick |
|---|---|---|---|---|---|
| 0–2 | 6.95 ± 0.24 | 7.50 ± 0.10 | 6.46 ± 0.07 | -7% | -14% |
| 2–4 | 5.43 ± 0.18 | 6.19 ± 0.15 | 5.67 ± 0.14 | +4% | -8% |
| 4–8 | 3.74 ± 0.15 | 3.88 ± 0.13 | 3.78 ± 0.13 | +1% | -3% |
| 8–64 | 3.38 ± 0.13 | 3.43 ± 0.13 | 3.37 ± 0.12 | -0% | -2% |
| **all** | 5.00 ± 0.22 | 5.34 ± 0.15 | 4.91 ± 0.14 | -2% | -8% |

Reading: negative percentages mean the transverse-damping model is closer to the N-body truth. H-T2 asks for damp < ZA (the adjustment helps) and damp <= stick (keeping the along-filament component does not hurt, unlike full sticking).


## Verdict on H-T2

**Supported near the web, with an honest qualification in the outskirts.**
At 0–2 vox from spines the transverse-damping model beats plain ZA by 7%
and isotropic sticking by 14% (jackknife over 5 held-out seeds; the
crossing threshold was calibrated to favour the isotropic competitor). In
the 2–4 vox ring it slightly trails ZA (+4%) — plausibly premature damping
triggered by noisy tidal frames at moderate densities — while still
beating sticking by 8%. Far from the web all models agree. Net: best
overall model of the three (4.91 vs 5.00 vs 5.34).

Constructive conclusion of the program: the "lean-space geometry
adjustment" conjecture, corrected by E4 into its transverse form, is a
WORKING model term — an anisotropic, tidal-frame-aware sticking condition
that improves the classical adhesion proxy. Natural refinements (partial
damping beta < 1, lambda-dependent thresholds, better frame estimation in
the outskirts) are tuning, deliberately left out to keep this a
hypothesis test rather than a fit.
