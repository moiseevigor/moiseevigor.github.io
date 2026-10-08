# SE(2): one program, three article companions

This blog draft imports the standard left-invariant SE(2) research program from
`https://github.com/moiseevigor/se2-conjugate-locus`, snapshot `5c304fd` (27 September
2026), for review on 7 October 2026. The canonical research remains in that repository.

- Program: `_posts/2026-10-07-se2-geodesics-research-program.md`.
- Three reader companions: `_articles/2026-10-07-se2-*.md`.
- Complete manuscript PDFs and TeX snapshots: `public/research/se2/`.
- Source/PDF/math hashes and audited scope: `public/research/se2/se2-provenance.json`.
- Interactive numerical kernel: unchanged snapshot in `public/js/se2/se2math.js`.
- Figure UI: `public/js/se2/program.js`; shared markup in `_includes/se2-figure.html`.
- Numerical figure checks: `node research/se2/check-figures.mjs`.

The pages use the existing Distill layout and belong to one `se2-geodesics` entry
in `_data/series.yml`. The program entry and article pages are review drafts.
Production excludes the manuscript/data asset directory; the development overlay
includes it. The existing `docker compose` preview sees these unpublished pages.

This import covers SE(2) only: no SH(2), SE(3), magnetic or cosmic-web article is
added. Existing programs and source manuscripts remain independent.

The five figures show source flow, bracket crossings, a caustic projection, bounded
rotating inversion and ray thresholds. The last two use explicit numerical bounds
and equality qualifications. They do not constitute interval or formal certificates.
The camera uses equal spatial-axis scales. Playback is user initiated and stops
when the figure or page is hidden; expensive figures initialize near the viewport.

The full-grid audit records 38,400 validated checkpoints and 304 residual boxes in
32 cells under its original exclusions. The current manuscript adds those cells
as a fifth excluded set. This domain change does not prove them. The explorer's
summary counters were stale; the snapshot manifest uses the actual audit JSON.
The current PDFs have 16, 31 and 75 pages, superseding older registry descriptions.

No manuscript proof is changed by this web adaptation. The 13-hypothesis Lean
reduction is reported from the current source record, not freshly rebuilt here.
Literature reading/edition limits and all publication gates remain in force.
