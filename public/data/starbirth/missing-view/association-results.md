# Multi-survey associations: verified ambiguity and temporal support

12 October 2026. This preparation unit implements the accepted multi-survey
program's requirement to establish associations before fitting. It is a cached
geometry/support result, **not a new protostar detection, ranking comparison or
independent physical validation**. The active seven-day comparison remains open.

The original protocol/implementations were committed at `0ea9be1c` before readout.
A guarded memory stop is preserved. A separately frozen, lossless compact repair
at `cfa0b929` retained the exact population, predicates and resource ceilings.
The replacement worker and independently implemented checker both completed.

## Main result and consequence

The proposed one-record, unshared-position assumption fails for **32 of 308**
nearby-parent clumps with any cached MALT90 record within 30 arcsec (10.39%).
This exhaustively enumerates the cached geometry; it is not an estimated
population contamination rate and has no sampling confidence interval.
A nearest-row join would discard alternatives and can duplicate molecular
information across neighbouring clumps. Later spatial splits must account for
shared association groups and retain component ambiguity.

| Molecular geometric state | Parent clumps |
| --- | ---: |
| Any MALT90 record within 30 arcsec | 308 |
| More than one molecular record | 16 |
| More than one distinct molecular sky position | 6 |
| A matched position has another reliable Hi-GAL neighbour within 30 arcsec | 20 |
| A matched position has multiple reliable neighbours within 19 arcsec | 2 |
| Exactly one record, unshared at 30 arcsec | 276 |
| Violates one-record/unshared assumption | 32 |

The failure categories overlap; do not add 16 and 20. The 19-arcsec diagnostic
uses half the nominal 38-arcsec FWHM, not a hard beam edge. A 30-arcsec association
is not proof of membership, and lack of a second neighbour is not proof of
isolation. No velocity, line detection, intensity or historical activity outcome
was evaluated. All 3,047 edges to reliable catalogue neighbours are retained,
including objects outside the requested nearby-prestellar parent.

The frozen cached molecular table contains 3,556 distinct native ID strings at
3,246 distinct coordinate pairs; 310 positions have multiple records. The
source paper describes separate A/B velocity records and gives 3,557 total
entries. This audit certifies the cached bytes, not completeness relative to
that published catalogue or resolution of its one-entry count difference.

A concrete retained counterexample is `HIGALBM10.0319-0.3576`: three molecular
records at two sky positions, including a position shared with another reliable
Hi-GAL neighbour. `HIGALBM10.1055-0.4158` has two records at one sky position.
The full edge table preserves native recno/ID/Name and original data-row ordinals;
no arbitrary component is selected as physical truth.

## Temporal support and common views

All **19,328** parent clumps remain in the ledger, including unknowns. The input
still has 1,250,385 NEOWISE rows bound to the saved 19,219-target order. Every
query geometry is independently checked. Applying the prospectively frozen
available-field screen yields at least one passing row for 7,775 clumps.
This screen does not establish complete photometric or astrometric reliability.

| View support under the frozen rules | Parent clumps |
| --- | ---: |
| Retained AllWISE counterpart coordinates | 1,231 |
| At least one screened NEOWISE row within 2 arcsec of a retained anchor within 3 arcsec of the clump | 975 |
| At least three supported anchored visits and at least 365 days overall anchored span | 761 |
| Four positive far-IR values and positive quoted 160/250 errors | 13,297 |
| FIR/error and anchored temporal support | 593 |
| FIR/error, anchored temporal and any molecular support | **4** |
| Same three views with one-record/unshared molecular support | **3** |

A supported visit has at least five distinct exact measurement tuples; a gap
larger than 30 days starts a new visit. Deduplication is by cached
(MJD,RA,Dec,W2 magnitude,error) strings, not verified unique exposure IDs. The
span criterion uses all retained anchored tuples, as registered. No variability
amplitude, event significance, embedding, class probability or ranking is
computed here. Brightness/error values are used for screening/equality only.

The four common-view objects are `HIGALBM326.7968+0.5124`,
`HIGALBM330.6980-0.3941`, `HIGALBM339.5469-0.1290` and
`HIGALBM340.2883-0.3985`. The second has two molecular records at one position.
These are support examples, **not a shortlist of likely protostars**.

Three-view complete-case selection would keep only 4/19,328 clumps (about
0.021%), and the stricter geometric subset only three. This does not show that
the others physically lack these signals: the cached queries, anchor definition,
selection and missing fields constrain this support. No rule was relaxed after
seeing the count. The proposed population study must explicitly handle missing
views and compare methods on identical support/review costs. An all-view-only
embedding on these caches would not answer the requested population question.

## Missing evidence remains visible

Native AllWISE IDs, positional errors and competing catalogue matches were
omitted by the historical cache builder. Its per-chunk products were already
deduplicated, so they cannot recover discarded alternatives. The original
NEOWISE rows preserve their query alternatives but omit native detection IDs,
position covariance, reduced chi-square and some moon, solar-system and
saturation diagnostics. Original data-row ordinals plus complete input hashes
are reproducibility pointers, not replacement native IDs. Quoted 350/500-micron
errors remain absent. Catalogue stage, shared chemistry, fragmentation and
WISE proximity do not supply independent physical positives/negatives.

No fresh representative physical-truth cohort was introduced. A later model
comparison must be registered as retrospective/proxy-conditioned unless its
separate physical validation route is established. The prior 303-object
chemistry-check membership is consumed; the geometric count of 308 does not
make additional records fresh adjudicated physical truth. The old 333/800
matched-control uncertainty gate stays failed and its occurrence readout stays
unopened. N20/c6828 and E29–E160 remain stopped/frozen.

## Resources, verification and next action

The first worker stopped at 268,468,224 sampled RSS bytes after 6.18 seconds,
writing no completed source tables. Its log and resource receipt are preserved.
The compact worker completed in 7.23 seconds at a peak sampled 187,138,048 bytes
(178.5 MiB); the independent checker completed in 18.50 seconds at 213,450,752
bytes (203.6 MiB). Both completed without a resource violation and with normal
reported system pressure. Sampling may miss sub-interval peaks.

The checker uses Astropy all-pairs spherical separations instead of the
worker's Cartesian tree/haversine, independent graph traversal instead of
union-find, and separately implemented raw temporal screens/visit reconstruction.
It reproduces every requested source field, all 3,047 edges, visit records,
headlines and complete input/output hashes. This is independent software
recomputation, not fresh physical validation or a human adjudication.
The failed stage and both successful stages total 1,022,904 bytes before this
report/final checkpoint, below the combined 4 MiB ceiling. The minimum observed
free space in successful runs was 58,011,189,248 bytes (about 54.0 GiB), above
the 5 GiB reserve. No GPU, observation download, paid cloud job, input deletion,
old model execution or private Atlas action occurred.

The next justified unit is a prospectively frozen missing-view model/baseline
comparison with fixed spatial grouping, an explicit consumed-proxy evaluation
role and all-requested denominators, or a separately justified independent
physical-evidence route. Its useful sample size, withheld signal, confounding
checks and positive/null/insufficient-evidence threshold must be fixed before
outcome readout. This audit alone does not authorize choosing a favourable
endpoint or treating an embedding fit as success. The full active goal is
unachieved and remains active; these association checks supply its prerequisites.

## Exact evidence

- [Original protocol](MULTISURVEY_ASSOCIATION_PROTOCOL_20261012.md)
- [Memory amendment](MULTISURVEY_ASSOCIATION_MEMORY_AMENDMENT_20261012.md)
- [Frozen replacement registration](../artifacts/multisurvey_association_memory_amendment_20261012.json)
- [Every requested source](../artifacts/multisurvey_association_compact_20261012/sources.csv.gz)
- [All molecular association alternatives](../artifacts/multisurvey_association_compact_20261012/molecular_edges.csv.gz)
- [Anchored visits](../artifacts/multisurvey_association_compact_20261012/visits.csv.gz)
- [Summary](../artifacts/multisurvey_association_compact_20261012/summary.json)
- [Independent reconstruction](../artifacts/multisurvey_association_verification_compact_20261012/verification.json)
- [Final checkpoint](../artifacts/multisurvey_association_checkpoint_20261012.json)

Source-ledger SHA-256: `af865147df2ef2eb1556e33d4b66cc0b43b3bd231e0bfc58a91b06375514cb2e`.
Summary SHA-256: `f3dc21f326a10e9ffa87105599f9daec6cb95af2bb7a01c068ff7c7e163acef1`.
The worker checkpoint's pending flag describes generation time; the separate
verification receipt and final checkpoint record completed verification.
Public blog/app publication is not claimed for this new preparation result.

The [MALT90 source paper](https://researchonline.ljmu.ac.uk/id/eprint/4139/1/MALT90_catalog.pdf)
supports the beam/component interpretation. The
[official NEOWISE schema](https://irsa.ipac.caltech.edu/data/WISE/docs/release/NEOWISE/expsup/sec2_1a.html)
and [reliability notes](https://irsa.ipac.caltech.edu/data/WISE/docs/release/NEOWISE/expsup/sec2_3.html)
support the quality-field meanings and missing-check caveats.
