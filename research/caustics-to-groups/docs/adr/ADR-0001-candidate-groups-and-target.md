# ADR-0001 — Candidate group list and the identifiability target

- **Status:** Accepted
- **Date:** 2026-07-15
- **Context:** Phase 0 kickoff. Before any flow code, fix *what* the inverse
  estimator is asked to distinguish and *what counts* as success, so later
  experiments cannot quietly move the goalposts.

## Decision

**Candidate list (frozen for Phases 0–2):**

| Group | Growth vector | Q | Corank | Abnormal minimizers | Ground truth available |
|---|---|---|---|---|---|
| Heisenberg `H³` | (2,3) | 4 | 1 | none | closed form (this repo, `src/heisenberg.py`) |
| SE(2) | (2,3) | 4 | 1 | none | Sachkov 2010 (closed / elliptic) |
| Engel | (2,3,4) | 7 | 2 | yes | Ardentov–Sachkov 2017 |
| Cartan | (2,3,5) | 10 | 3 | yes | Ardentov–Hakavuori 2022 |
| SE(3) | (added Phase 3) | — | ≥2 | yes | Duits et al. 2013 (elliptic-integral) |

Rationale: these are exactly the groups whose SR geodesics and conjugate loci are
known in closed or near-closed form, so the forward model is leakage-free ground
truth and the inverse can be *graded*, not asserted. The list deliberately
includes a pair sharing a tangent cone (Heisenberg vs. SE(2), both `(2,3)`) — the
hardest discrimination and the sharpest test of the moduli component (METHODS §4).

**Identifiability target (the definition of success):**

1. **Class recovery (necessary).** From noisy caustic samples, recover the growth
   vector with accuracy rising monotonically in sample size and degrading
   gracefully in noise — beating a majority-class baseline at realistic noise
   (metric M1). Failure here kills the tangent-cone leg (hypothesis H1).
2. **Group discrimination (headline).** A confusion matrix over the candidate
   list with off-diagonal mass significantly below chance, and the abnormal bit
   cleanly splitting {contact 3D} from {Engel, Cartan} (metrics M2, M5; H2).
3. **Honest aliasing map (guaranteed deliverable).** For each pair, the minimal
   observable subset that separates it, or "none in kit" — expected to flag
   Heisenberg/SE(2) and any projectively-equivalent pairs (metric M6; H3).

The estimator targets the **triple** `(growth vector, conjugate-locus
symmetry+moduli, abnormal bit)`, never a single ADE germ (METHODS §2). The
quantitative statistic is the nilpotent deviation `δ` (METHODS §6), not raw cusp
classification.

## Consequences

- Phase 0/1 exit is gated on M1 (class recovery) before any group-level claim.
- The Heisenberg/SE(2) pair is the canonical stress case; if `δ` cannot separate
  it at realistic noise, that is reported as aliasing, not hidden.
- SE(3) and all real-data work (Phase 3+) inherit this target unchanged; the
  cosmic-web stress test (Phase 4) succeeds by *abstaining*, not by classifying.

## Alternatives considered

- *Wider list (SU(2), SL(2), SH(2), free step-2 `(3,6)`)* — deferred; add only
  after the 4-group confusion matrix is understood, to keep the first result
  legible.
- *Learned end-to-end classifier from raw point clouds* — rejected as the primary
  method: not auditable, and prone to keying on ADE universals (the §2 trap). May
  appear later only as an auditable, realization-disjoint baseline.
