# Response to the post-revision re-review (REVIEW-SR-ASTROPHYSICS-REREVIEW-2026-07-14)

Point-by-point disposition of the seven release blockers and the eight minimum
changes. **Done** = implemented and verifiable at the pointer. The re-review's central
criticism — that the previous response document said **Done** while the old claims
survived verbatim — is answered structurally: the regression guard is rewritten as
scientific invariants with a fixtures self-test containing every sentence both reviews
caught (`scripts/check_retracted_claims.py` v2: 30 banned patterns, 3 file-level
context requirements, 2 near-context rules, 2 positive invariants, 15 fixtures; the
guard FAILS if any fixture would no longer be flagged).

## Release blockers

| # | Finding | Disposition |
|---|---|---|
| R1 | Lorentz-force sign: with $F_{ij}=\partial_iA_j-\partial_jA_i$, $\dot u_i=-wF_{ij}u_j$, not $+$ | **Done.** Lemma 1.3 statement, proof and 2D remark corrected; $J$ defined explicitly as the counterclockwise rotation ($Je_1=e_2$), $\ddot x = wB\,J\dot x$ re-derived consistently; a parenthetical records the earlier inconsistency and why the launch-averaged results are orientation-blind. Guard bans the wrong-sign forms. |
| R2 | Prop 4.2: nearby root ≠ first root; scope; $\sqrt{\lvert 1-\tfrac34\beta\rvert}$ | **Done.** (a) First-root status argued in the proof via three windows (uniform small-time nonvanishing of the Jacobian; uniform convergence to $J_0$ on compacts where $\lvert J_0\rvert \ge c$; IFT at the simple zero at $2\pi$; compactness in $\theta_0$). (b) Statement now hypothesises a sufficiently smooth **one-dimensional** $B(x)=B_0e^{L(x)}$, $L'(0)\ne0$, bounded higher jets, with an explicit scope note that nothing covers 2-D $B(x,y)$; "arbitrary profiles" qualified as one-dimensional in the article (2 sites), ledger, V1 doc, D5. (c) Inversion written with $\lvert 1-\tfrac34\beta\rvert^{-1/2}$ and the sign of $\delta$ carrying the regime; the $\beta=2$ example explicitly placed in the negative-radicand regime (article §4, V1 doc, D5). |
| R3 | Supercritical claim exceeds the computation | **Done.** All five sites (article B2, Part 7 body + glossary, D5 ×2, T2 doc) now say "no conjugate point detected within the integration window (eight reference periods)" with an explicit finite-horizon caveat; Part 7's bold claim reworded ("on any horizon we integrated"); "loses its conjugate point" and "never come back" are banned patterns. |
| R4 | Corrected claims still present verbatim | **Done — every named instance.** Part 4 body + glossary and Parts 1/2 reconnection language → "candidate site" with the non-ideal-evolution scope and Pontin & Priest 2022 cited (refs added to Parts 1/2/4, Part 6 inline, article); Part 2 ball-growth "actual detector" → directional-reach estimator + consistency check; Part 1 ball-volume definition qualified at singular points (body + glossary); V1 two-radius sentence replaced by the retraction; README: eight-part list incl. Part 8, Part 6 summary corrected (fold reads Q=6 generically), P2-solar row → independent local confirmation + methods demonstration, inversion qualified; Part 8 "0 spirals out of 2" → 0/3 with the third root classified; article closing disambiguated (period-average law derived-first; caustic law measured-first). |
| R5 | J2 census not exhaustive / Haynes–Parnell | **Done.** Renamed "two-resolution cell-prefiltered root census" everywhere (Part 8, J1 doc, both scripts' docstrings and prints); explicit non-completeness statement (necessary-only prefilter, centre-started Newton can fail). New evidence (`run_j2b_sensitivity.py`): shell-floor moved to 0.80 → identical three nulls in the 0.855–1.0 shell (the 0.857 find is not a boundary artifact) + a root-dense, truncation-sensitive continuation layer below 0.85 exposed (39 more roots; cause not diagnosed; no completeness claimed there); net-charge degree cross-check: deg $\mathbf B/\lvert\mathbf B\rvert$ numerically consistent with zero at $r=0.885/0.94/0.999$ ⇒ no unexplained net topological charge above 0.885 (index-cancelling missed pairs not excluded — corrected per the post-response review). Third root classified: radial, degree $-1$. |
| R6 | Ensemble ≠ probability / error bar | **Done.** Language everywhere: "survival fraction under the chosen stress ensemble", "sample position range" (Part 8, J1 doc; "survival probability" and "error bar" banned in Jupiter scope). Ensemble extended to **all three** roots (N=40: polar 32/40, low-lat 15/40 and 19/40 — the polar structure is the robust one) with knob sensitivity measured: amplitude ×0.5/×2 (16/20, 9/20 for the polar null), patch threshold 0.25/0.5/1 G (40/40 at all three), capture radius 0.10/0.15/0.25 (29–32/40), shell floor 0.856/0.80 (32→35/40). |
| R7 | Solar claim unvalidated | **Done (status held, not upgraded).** All solar results remain labelled methods demonstrations on LOS convenience products; README P2-solar row says so explicitly and points at G1; no discovery or external-validation claim anywhere in the current layer; null ≠ reconnection site with the P&P citation in every post that touches it. G1 execution remains the gate for any astrophysical claim. |

## Minimum changes for release (review §6)

1. Lorentz sign — done (R1).
2. Prop 4.2 statement/first root/absolute value — done (R2).
3. Supercritical → finite horizon — done (R3).
4. Stale reconnection/two-radius/ball-volume/detector/part-count/inversion/fold/Jupiter-count claims — done (R4).
5. Regression guard expansion — done: invariants + fixtures self-test (v2 described above); the guard cannot pass while missing a review-caught sentence.
6. Jupiter census rename + probability language — done (R5, R6).
7. Solar at methods-demonstration status — done (R7).
8. Build + visual inspection — done: article 586 KaTeX formulas / 0 errors with all new blocks live; all 8 posts HTTP 200, 0 KaTeX errors on live-DOM checks, no stale phrasing in served HTML; the three re-rendered anatomy sheets inspected as images.

## Also in this revision (user-directed)

The null-anatomy figures (Sun, Earth, Jupiter) were redesigned in the visual grammar
of Pontin & Priest 2022 — adopted conceptually, not copied: null-frame views (3D
skeleton with translucent ideal fan disc; view *down the spine* where the fan's real
traced lines radiate; side view with the spine vertical), colour = topological role
(orange spine, blue fan, gray ambient; lines passing the null split at closest
approach so the fan→null→spine X carries both colours), and the null marked by an
open circle coloured by topological degree (blue $+1$, red $-1$ — matching the
tables). Captions updated in Parts 6 and 8. Renderer: `_anatomy_rows` in
`scripts/render_real_assets.py` (shared by all three sheets), using the null's own
(generally oblique) eigenframe in dual coordinates so the fan plane and spine are
exact by construction.

## Residue the re-review should still weigh

- Prop 4.2's first-root argument is a standard continuity argument stated in the
  proof, not formalised; the computer-assisted trace itself is still the derivation
  of record (O6's hand-written proof remains open).
- The census completeness evidence for the 0.855–0.885 layer (where all three nulls
  live) is two-resolution + floor-move agreement + the degree check *above* 0.885 —
  a trilinear/Poincaré per-cell census is specified in G1 and not implemented here.
- The stress ensemble remains a proxy; formal JRM33 covariances are still
  undistributed. Nothing stronger is claimed.
- G1 has not run; the solar layer's status is unchanged by design.
