# S3 — new worlds: the Earth's magnetosphere, and the first real spiral nulls

Reproduce: `../cosmic-web/.venv/bin/python scripts/run_p4_magnetosphere.py` (~3 min;
needs `geopack`, pip). Results → `artifacts/p4_magnetosphere.json`, figure →
`public/img/posts/forbidden-directions-magnetosphere.png`.

## Why the magnetosphere

The R5 theorem closed a door: any force-free field ($\mathbf J = \alpha\mathbf B$,
bounded $\alpha$) has only radial nulls, so solar extrapolations can never show the
spiral class on real data. The Earth's magnetosphere is the natural place the door is
open: the magnetopause, tail, and ring **current systems are genuinely non-force-free**,
and the empirical field models that encode them (internal IGRF + external Tsyganenko
T96) are fitted to decades of real spacecraft measurements. Epoch used: 2012-03-07
00:00 UT — the program's solar storm day — under moderately disturbed conditions
(`Pdyn = 3` nPa, `Dst = −50` nT, IMF `Bz = −5` nT).

## Result (H-P4d): **149 nulls, 79 spiral — the spiral class exists in real physics**

Newton descent from cusp/tail seeds finds **149 nulls** (deduped, $|B| < 0.5$ nT,
outside $2.5\,R_E$). Standard classification: **79 spiral, 70 radial** — the first
spiral nulls of the entire program on a field with observational pedigree, exactly where
the theorem said they must live: in the non-force-free current regions. The SR
growth-vector detector returns $\mathbf{Q = 6}$ at every null (tangent-cone
measurement), radial and spiral alike — the fourth world (after the synthetic battery,
the ABC dynamo, and the solar corona) in which the detector is grounded.

## Honest caveats

1. **These are nulls of an empirical model, not directly measured zeros.** T96 is fitted
   to data, but a null's existence is a delicate topological property; the population we
   find sits off the noon–midnight plane at $|y| \approx 17\!-\!25\,R_E$, $x \approx
   -12\ldots-32\,R_E$ (nightside flank / lobe boundary), where the model's current
   closure is its least-constrained part. In-situ confirmation is the business of
   multi-spacecraft missions (Cluster/MMS null catalogues) — matching against those is
   the natural next step.
2. **No dayside cusp nulls converged** in this model/state: the classical
   Chapman–Ferraro neutral points belong to closed-magnetosphere idealisations; T96's
   soft magnetopause under southward IMF does not produce exact dayside zeros along the
   seeded meridian.
3. The census depends on storm state (`parmod`); this is one epoch, not a climatology.

## The rest of the "new worlds" ledger (scoped honestly)

- **Planetary internal fields** (Uranus/Neptune vacuum multipoles from mission-fitted
  Gauss coefficients): curl-free ⇒ the R5 theorem again forbids spirals; their exterior
  nulls (if any within validity) would extend the radial gallery — left as the program's
  next cheap data extension.
- **Magnetars / black holes**: no observational field *maps* exist — magnetar fields are
  inferred scalars, and black-hole magnetospheres are GR objects whose sub-Riemannian
  treatment needs the flux lift rebuilt on curved spacetime. Recorded as a genuine
  frontier, not attempted with toy stand-ins here.
