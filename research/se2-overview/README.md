# SE(2) overview draft — 8 October 2026

This is a standalone popular-science overview of the classical, homogeneous,
reversible sub-Riemannian problem on SE(2). It has no research-program registry
entry and does not replace the published research program or manuscript companions.

Post: `_posts/2026-10-08-shortest-paths-se2-overview.md`.
Route: `/mathematics/se2-explained/`. `published: false` keeps it out of production.
Preview with the repository development configuration and unpublished posts enabled.
The local review checkout is `/private/tmp/se2-overview-20261008`, branch
`draft/se2-explained`, based on master `805dd4e`.

Three reading depths expand optional details: visual story, geometric mechanism,
and mathematics. Eight chapters cover the model, group, applications, history,
pendulum, Maxwell/conjugate/cut distinction, optimal synthesis, and further questions.
The twelve bibliography entries stay at the bottom through the opt-in
`reference_style: bibliography`; existing posts keep their margin references.

Four new bounded figures demonstrate elementary control composition, motion order,
normal pendulum dynamics, and a rotating Maxwell pair. The fifth reuses the
reviewed source-flow explorer. New figures initialize near the viewport and do
not animate continuously. The existing animation is user initiated and stops
when hidden. No cloud jobs or large simulations were run.

## Validation

- `node research/se2-overview/check-model.mjs`: 18 construction/conservation/source
  comparisons. Maximum energy drift 2.29e-12 over time 10, endpoint error against
  the existing rotating formulas 6.44e-13, and symmetric cut meeting residual
  8.89e-16. The Maxwell checks use three moduli and three nonexceptional phases;
  the source phases remain distinct modulo 4K.
- `check-independent.py`: three exact symbolic canonical-Hamiltonian identities;
  four independent SciPy DOP853 integrations of canonical position/momentum
  equations, including the separatrix. Maximum pose discrepancy 7.09e-10.
  Saved `canonical-fixtures.json` inputs contain gamma=1, c=0.8, 2*cos(0.5), 2.5, 4 and travel time 10,
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
- Development and production builds pass; the new post stays out of the production
  page and feed, and internal overview notes stay out of the public site.
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

For the next pass: collect the author's feedback on voice, pacing, and whether
more application illustrations are wanted. A possible expansion is a separate
visual atlas of the cut locus and a general boundary-value solver; neither is
implemented or promised by the current illustrations. Before publication, rerun
the build and math/link checks, verify screenshots, then change the draft flag
only with publication authorization. No canonical research manuscript changed.
