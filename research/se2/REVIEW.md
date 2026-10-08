# Editorial review draft — 7 October 2026

Read the program first, then follow its three article links. The web companions
provide precise selected statements and proof explanations; the linked PDFs carry
the complete manuscripts and their bibliographies. This is an editorial import,
not a new theorem or external peer review.

Review priorities:

1. Narrative: does the one-map / three-questions structure explain why times,
   caustics and inverse counts belong to a single SE(2) program?
2. Mathematical scope: verify that every intended emphasis matches the manuscript
   hypotheses. In particular, keep distinct-count coalescence, source versus
   minimizing counts, chart seams, strict headings and non-effective onset scales.
3. Certificate: the fifth exclusion contains the remaining residual cells. The
   2.56% coordinate-volume label must not be read as global theorem completion.
4. Article depth: the online pages are reader companions, with full proofs in
   the attached manuscript PDFs. They do not purport to reproduce every page
   of the 16/31/75-page manuscripts inline.
5. Before release: synchronize final manuscript snapshots and their hashes,
   complete author/novelty review gates, and intentionally promote pages and
   assets together. None has been approved for submission or web publication.

Verified during this import:

- Jekyll 3.9.2 development and production rendering in an isolated temporary
  environment. Docker was unavailable; no repository dependency changes were made.
  The temporary native plugins are compatible, but this is not a rebuild of the
  entire Linux/Gemfile.lock environment.
- All three article entries and their manuscript links; copied hashes match.
- Production omits all four draft pages, the Lab entry, article-index links and
  manuscript/data assets. Development contains them.
- Eleven existing browser-math regression tests and 33 bounded figure checks pass.
- Browser controls: playback/pause, critical coalescence, caustic sheet choice,
  inverse reset, heading edit, target click and ray-radius changes. The nine-source
  preset has maximum forward residual about 3.87e-14; the critical cell has one
  distinct touching intersection. No browser console or KaTeX error was observed.
- Narrow and wider measured viewports showed no page-width overflow; controls
  wrap. Animations require an explicit click, and hide/visibility events stop them.

Provenance corrections discovered while onboarding:

- Explorer metadata contained stale certificate counts. Current audit totals
  were used instead; the research files were preserved.
- Older publication descriptions said 13/30/74 pages; current PDFs are 16/31/75.
- A draft persistence setting initially hid pages but retained previously copied
  production PDFs. Excluding the asset directory fixes this, including cleanup.
- Editing or clicking the inverse target now switches its selector to Custom
  target, so the nine-source preset label cannot describe a modified target.

Artifacts: `review-results.json`, the snapshot manifest, numerical check script
and saved preview images. These import findings describe the 7 October draft.

## Web publication — 8 October 2026

The author requested publication after PR #26 was merged. The program, three
article companions and manuscript/data assets are promoted together. Their
research qualifications and unresolved manuscript review gates remain explicit;
web publication does not imply journal peer review or submission approval.
Internal review records and screenshots remain excluded from production.
No new manuscript proof replay, cloud execution or heavy research sweep occurs
in this publication pass.

Publication validation: 33 figure checks passed. The production Jekyll 3.9.2
build passed; all four pages, home/Lab/Articles links, 94 local asset/page links,
six manuscript hashes and both data assets were verified. Internal review files
remain excluded. The same temporary dependency limitation recorded above applies.

## Formula proofreading — 8 October 2026

Reviewed the unified program and all three web companions against their manuscript
snapshots. Fixed two accidental Markdown tables caused by absolute-value bars and
inline derivative primes changed into curly quotes. Clarified normalized endpoint
amplitudes, the transverse coordinate, the physical period, positive-level count
hypotheses and the domain of the winding-zero asymptotic.

All 172 formula strings survive Markdown unchanged and render with strict KaTeX
0.16.9 without errors. The production build and browser checks pass; the three
articles contain no tables and the program retains only its intended status table.
Independent checks include five symbolic inverse identities, 12 Hamiltonian/
variational conjugate cases, nine independently integrated inverse sources, and
80-digit critical-contact checks in cells 1, 2 and 4. The 216-coefficient fold
certificate was rechecked with exact fractions, including reconstruction/digest.

Reproduction: `proofread-checks.py` (NumPy/SciPy/SymPy/mpmath) and
`proofread-rendering.py SITE_OUTPUT KATEX_CJS` (the site's pinned KaTeX version).
Results and source locators: `proofread-results-2026-10-08.json`. This is a bounded
review of web equations and qualifications, not a complete proof audit, Lean
rebuild or interval-grid replay. Canonical manuscript files remain untouched.
