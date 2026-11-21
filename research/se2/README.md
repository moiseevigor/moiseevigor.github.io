# SE(2): one program, three article companions

This blog edition imports the standard left-invariant SE(2) research program from
`https://github.com/moiseevigor/se2-conjugate-locus`, snapshot `5c304fd` (27 September
2026), for review on 7 October 2026. The canonical research remains in that repository.

- Program: `_posts/2026-10-07-se2-geodesics-research-program.md`.
- Three reader companions: `_articles/2026-10-07-se2-*.md`.
- Complete manuscript PDFs and TeX snapshots: `public/research/se2/`.
- Source/PDF/math hashes and audited scope: `public/research/se2/se2-provenance.json`.
- Interactive numerical kernel: derived module in `public/js/se2/se2math.js`.
- Figure UI: `public/js/se2/program.js`; shared markup in `_includes/se2-figure.html`.
- Numerical figure checks: `node research/se2/check-figures.mjs`.

The pages use the existing Distill layout and belong to one `se2-geodesics` entry
in `_data/series.yml`. The author approved web publication on 8 October 2026. The program and three
article companions are published with their manuscript status and open questions
preserved. Production includes the manuscript/data assets; internal review
records and screenshots under `research/se2/` remain excluded.

This import covers SE(2) only: no SH(2), SE(3), magnetic or cosmic-web article is
added. Existing programs and source manuscripts remain independent.

The five figures show source flow, bracket crossings, a caustic projection, bounded
rotating inversion and ray thresholds. The last two use explicit numerical bounds
and equality qualifications. They do not constitute interval or formal certificates.
The camera uses equal spatial-axis scales. Playback is user initiated and stops
when the figure or page is hidden; expensive figures initialize near the viewport.

## November 2026 research update

The conjugate-times companion reports the verified local fixed-cell splitting and signed modulus limit. The downloadable proof package contains pinned dependencies, the project imports and a theorem audit. The October PDF, TeX, figure hashes and numerical checks remain a historical snapshot.

The October interval audit retained 304 residual boxes in 32 cells. Later reviews repaired the domain description and closed all of those boxes. Analytic arguments cover both corners and a local double-flip neighborhood. The finite tube, the remaining slab and regimes outside the grid still limit the global incidence count. The former total exclusion-volume estimate was withdrawn.
