# SE(2) interactive overview — 8 October 2026

This is a standalone popular-science overview of the classical, homogeneous,
reversible sub-Riemannian problem on SE(2). It has no research-program registry
entry and does not replace the published research program or manuscript companions.

Post: `_posts/2026-10-08-shortest-paths-se2-overview.md`.
Route: `/mathematics/se2-explained/`. The user authorized publication on
8 October 2026 after requesting a full proofreading and plot/formula review.
The post now has `published: true`.
Preview with the repository development configuration and unpublished posts enabled.
The local review checkout is `/private/tmp/se2-overview-20261008`, branch
`draft/se2-explained`, based on master `805dd4e`.

Three reading depths expand optional details: visual story, geometric mechanism,
and mathematics. Eight chapters cover the model, group, applications, history,
pendulum, Maxwell/conjugate/cut distinction, optimal synthesis, and further questions.
The twelve bibliography entries stay at the bottom through the opt-in
`reference_style: bibliography`; existing posts keep their margin references.

Four new bounded figures, each using equal data-unit axis scales, demonstrate elementary control composition, motion order,
normal pendulum dynamics, and a rotating Maxwell pair. The fifth reuses the
reviewed source-flow explorer. New figures initialize near the viewport and do
not animate continuously. The existing animation is user initiated and stops
when hidden. No cloud jobs or large simulations were run.

## Validation

- `node research/se2-overview/check-model.mjs`: 19 construction/conservation/source
  comparisons. Maximum energy drift 2.29e-12 over time 10, endpoint error against
  the existing rotating formulas 6.44e-13, and symmetric cut meeting residual
  8.89e-16. The Maxwell checks use three moduli and three nonexceptional phases;
  the source phases remain distinct modulo 4K.
- `check-independent.py`: three exact symbolic canonical-Hamiltonian identities;
  five independent SciPy DOP853 integrations of canonical position/momentum
  equations, including the separatrix. Maximum pose discrepancy 7.09e-10.
  Saved `canonical-fixtures.json` inputs contain gamma=1, c=0, 0.8, 2*cos(0.5), 2.5, 4 and travel time 10,
  generated with the new pure model. Pure-model default: 4,800 RK4 steps.
- `check-page.py SITE_OUTPUT KATEX_CJS`: 76 formulas survive Markdown unchanged
  and render with strict KaTeX 0.16.9; 63 local links/fragments and five figures
  verified. An absolute-value expression that Markdown interpreted as a table
  was replaced with explicit LaTeX delimiters before acceptance.
- Browser: all three reading-depth buttons, sequence scrub, order-angle control,
  pendulum family selection, Maxwell travel fraction, and shared explorer checked.
  Mathematical level opens all nine details. Bibliography retains 12 entries;
  no duplicated marginal citations. Desktop and actual 375-pixel layout have no
  document overflow or formula errors; the pendulum panels stack on narrow screens.
- Production build passes; the overview is present in the home feed and Atom
  feed. Internal overview notes stay out of the public site.
- Battery: 80%, AC attached at beginning and end of bounded verification.

The known synthesis is attributed to its published theorem, not independently
reproved in full here. The independent checks support the new pedagogical formulas
and illustrations. The history is a referenced, selective chronology rather than
an exhaustive priority claim.

## Source review and handoff

Consulted the research repository's own Obsidian Home, reading map, access gaps,
foundations concept, and SE(2)/vision/book notes. Rechecked the underlying published
Sachkov 2011 text: equations (1.6)–(1.12), cut-time formulas (2.1)–(2.5), Theorem 3.2,
and discussion of generic evaluation and special endpoints. Rechecked ABB's 2019
book draft, sections 3.2/3.7 and bibliography for the history. Its numbering is not
claimed to match the 2020 book.

Primary publisher/author records corroborate dates and applications. Chow is
conventionally cited as 1939, but Springer dates the issue to December 1940;
the draft records both. The original Rashevskii paper was not inspected.
Dubins' DOI did not resolve through the browser search tool in this session;
the reference is corroborated by the original Reeds–Shepp paper and relevant
published bibliography. No claim to have audited Dubins' full proof is made.

The author authorized publication after the complete web review. A visual atlas
of the cut locus and a general boundary-value solver remain optional future
extensions; neither is implemented or promised by the current illustrations.
No canonical research manuscript changed.

## Publication review — 8 October 2026

Read the entire overview, including the nine mathematical/geometric details,
seven historical entries, glossary, all captions, and twelve source notes.
Rechecked the bracket, group law, norm lower bounds, momentum-to-pendulum signs,
energy and modulus conventions, symmetry source phases, and five published cut
cases. The minimizing multiplicity statement matches Theorem 3.2 of the published
2011 synthesis, including unique conjugate cut endpoints and two regular Maxwell
minimizers. This is source verification, not a new proof of that synthesis.

The visual review covered all five figures on desktop and a narrow viewport,
with 76 rendered formulas and no document overflow. Checked control endpoints,
oscillating/rotating/separatrix presets, phase wraps, Maxwell cut equality, and
the critical conjugate preset. Numerical regression checks retain the 39 existing
explorer cases. Eight additional layout cases check equal pixels per data unit
at both desktop and stacked mobile sizes and preserve the phase bounds.

Publication corrections: fixed equal phase scales with principal-range framing;
added adaptive tick and readout precision for small maneuvers; tightened relative
spatial bounds; made the Maxwell curve end at the exact scrubbed pose; removed
draft wording and clarified the bibliography description. The post remains a
standalone overview, with no additional research-program registry entry.

## Plot preference correction — 8 October 2026

The pendulum phase portrait now uses equal data-unit scales on both axes,
matching the spatial panels. This remains true when the panels stack on mobile.
The portrait retains the principal angular bounds [-pi,pi] and fits a centered
plot rectangle to the viewport. Spatial panels may expand their bounds; neither
mode stretches the axes independently. The user requests equal axes as the default for plots generally.

## Plot correction release — 9 October 2026

The motion-order experiment now keeps a fixed frame and identifies coincident
endpoints at zero angle. The shared rotating flow ends its visible line at the
exact selected pose and retains analytical odd-K conjugate zeros at display
boundaries. The browser kernel hash and cache version are updated together.

The linked Geometry of Seeing figures correct reachability direction and final
pose, phase-portrait gaps and equal scales, hidden action clipping, family
parameter clamping, separatrix starting phase, and elapsed-time playback.
Heuristic wavefront bend markers are no longer described as certified conjugate
points. The family fan and distribution camera fit their actual bounds.

`node research/se2-overview/check-plot-regressions.mjs` adds 34 regression cases
and syntax checks for all nine legacy inline figure scripts. The existing model,
figure, and ray/join checks remain applicable. Five canonical Hamiltonian
integrations, 240 independent SciPy elliptic comparisons, and three elastica
mirror meetings were recomputed during the preceding audit. These bounded checks
do not certify arbitrary-target inversion or prove new manuscript theorems.

Remaining older SVG label clipping on narrow screens, the A3 radius-readout
ambiguity, and long-history AGM iteration numbering are outside this correction
patch. No full-series mobile visual-QA claim is made.
