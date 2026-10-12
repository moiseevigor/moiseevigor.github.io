# Temporal support: the anchor is only part of the missingness

12 October 2026. The separately frozen post-comparison diagnostic is complete
and independently recomputed. Only **3 of 27** consumed qualifying
chemistry-positive cases have sufficient available-field-screened cadence in
their original NEOWISE query cone. The descriptive majority gate, **14 of 27**,
failed. None has the original anchored temporal view. Removing the anchor alone
would therefore leave **24 of 27** without this query-level support, and would
not validate even the remaining three as single-emitter light curves.

This is a selected-cache missingness diagnosis, not a new protostar classifier,
physical validation, variability event or birth. The completed embedding result
remains 14/27 versus the nonlinear baseline's 15/27 at 18 equal-cost reviews.
No fit, original threshold, input feature or ranking score was changed.

## Exact positive-cohort decomposition

All 27 are requested by the original temporal query. The failures partition
without overlap:

| Diagnostic outcome | Positive-reference cases |
| --- | ---: |
| Requested, no cached rows | 11 |
| Cached rows, none passing the unchanged screen inside the query | 9 |
| Screened query rows, insufficient original cadence/span | 4 |
| Query cadence supported, retained qualifying anchor absent | 2 |
| Query cadence supported, anchored cadence insufficient | 1 |
| Original anchored cadence supported | 0 |
| Total | **27** |

The new primary count is 3/27 = 11.11%, a deterministic count of these consumed,
selected references; it is not a sky-population rate or confidence bound. No
physical precision, population recall or stellar occurrence fraction is measured.
Missing cached rows do not prove absence of observations in the survey, nor do
failed screens prove a starless clump. No new observations were acquired.

The diagnostic used the original 6-arcsecond query cone, SNR >= 5, positive
quoted error, qual_frame > 0, nb == 1 and a clear retained W2 artifact flag,
with valid coordinates/epochs/magnitudes. Exact five-string tuples were
deduplicated. A gap > 30 days separated visits; each supported visit required
at least five tuples, with three supported visits and >=365-day total span.
The original <=3-arcsecond AllWISE anchor and <=2-arcsecond measurement-to-anchor
path was separately reproduced and unchanged for every parent object.

Query-level cadence can mix emitters and artefacts. Missing positional errors,
native source/exposure IDs, alternative AllWISE counterparts, chi-square, moon,
saturation and solar-system fields remain unverified. These counts cannot be
used directly as temporal features for a repaired classifier.

## All requested identities, selected support and controls

The ledger retains all **19,328** nearby catalogue-prestellar parent designations,
including 109 not requested in the original query. The original 1,250,385 cached
measurement rows are hash-bound and preserved. The exact original proxy-state
strings and an explicitly separate semantic group are both recorded.

| Consumed proxy group | Objects | Query-level cadence supported | Original anchored support |
| --- | ---: | ---: | ---: |
| Qualifying chemistry positive | 27 | 3 | 0 |
| Qualifying proxy negative | 235 | 14 | 3 |
| Unknown qualifying proxy state | 19,066 | 2,996 | 758 |
| Entire requested parent | **19,328** | **3,013** | **761** |

Across the parent, query cadence is broader than anchored support. That does
not establish ownership, physical classes or complementary information in an
independently evaluated positive sample. Unknowns remain unknown; the 3,013
are not a new list of young stars. The original 761 anchored-support cases are
exactly reproduced, including their duplicate counts, visit counts and spans.

Descriptive support tables were frozen for longitude tiles and parent-median
mass, temperature, distance, surface density and diameter. The parent medians
are `mass=43.8`, `temp=11.0`, `dist=2.21`, `surf_dens=0.14` and `diam=0.28`
in the untransformed source fields. **All 27 positives exceed both the mass and
surface-density medians**; 22/27 exceed the temperature median. None of their
low-mass/low-surface-density analogue coverage is established. Chemistry proxy support
therefore cannot represent the whole requested population without further
evidence. These are selection diagnostics, not causal adjustment or validated
extinction/column-error controls. Molecular sharing indicators remain in each
source row; emitter crowding and physical clump membership remain unresolved.

## Three evidence cases, not new candidate discoveries

These three consumed positive references have query-level cadence. Their original
raw rows, including failures, are retained in the 1,072-row positive-evidence
export alongside the other 24 positives. No event or photometric fit was made.

| Hi-GAL designation | Query unique screened tuples | Supported query visits | Why original anchored support is absent |
| --- | ---: | ---: | --- |
| HIGALBM330.8814-0.3656 | 201 | 21 | No qualifying retained anchor |
| HIGALBM351.2258+0.6937 | 145 | 19 | Only one retained measurement matches the qualifying anchor |
| HIGALBM353.4272-0.3734 | 90 | 6 | No qualifying retained anchor |

Their query spans are about 3,651–3,653 days. That is observing support in a
cone, not the duration or measured variability of an identified star. They
may inform a future source-identity assessment, but no such assessment, new
ranking test, acquisition or successor experiment follows automatically here.

## Preserved failed attempt, independent check and resources

The first implementation stopped before reading native epochs because it
expected semantic proxy labels instead of the ledger's native labels. The
original freeze `ed114aad`, failure log and resource receipt are preserved.
A separately committed lossless schema amendment, `e75ad9ed`, retained native
labels and added an aggregation-only group. Population, screen, association,
cadence and primary majority gate were unchanged before the new readout.

The independent checker imported no worker functions. It streamed the original
rows in four ordinal shards, used unit-vector atan2 geometry instead of
haversine and exact tuple sets/gap-index boundaries instead of packed buffers.
It verified all 19,328 IDs and every ledger field, membership hash, original
anchored metric, covariate/longitude table and all 1,072 positive raw rows.
This is independent software recomputation, not independent physical truth.

The worker completed in 9.30 seconds with peak sampled RSS 210,337,792 bytes
(200.59 MiB). The checker completed in 15.48 seconds at 189,595,648 bytes
(180.81 MiB). Every recorded memory-pressure sample was normal. Their minimum
observed free disk space was about 53.94 GiB, above the 5 GiB reserve. RSS samples
can miss short peaks. Combined output is under 2 MiB, below the frozen 16 MiB
cap; the final checkpoint inventories exact bytes. No observations were deleted,
downloaded or uploaded; no GPU, paid cloud job or private Atlas action occurred.

## Conclusion and stopping

The completed diagnostic rejects the hypothesis that original-query cadence
exists in a majority of these 27 positives. The missing temporal view is not
merely an AllWISE-anchor artefact: cached absence, available-field screening and
cadence account for 24 cases. In the remaining three, identity and reliability
still require evidence before temporal/gas complementarity can be tested.
The fixed comparison stays negative; weaker association rules cannot supply
its missing information or independent physical validation.

This unit stops here. A defensible next scientific decision concerns source
ownership and a representative independent validation route, not a model sweep
on these same proxy labels. Any distinct evidence test needs its own prospective
protocol; no acquisition, relaxed cuts or automatic successor is authorized by
this result. The week-long program and full detector goal remain unachieved.
No new star, confirmed birth, hidden fraction, lifetime or robust detector exists.
The 333/800 occurrence gate, unopened readout, N20/c6828 stops, E29–E160 archive
and private Atlas/E155/E121 restrictions are unchanged.

## Source-bound outputs

- [Original protocol](TEMPORAL_MISSINGNESS_PROTOCOL_20261012.md)
- [Lossless schema amendment](TEMPORAL_MISSINGNESS_SCHEMA_AMENDMENT_20261012.md)
- [All-parent ledger](../artifacts/temporal_missingness_schema_adapted_20261012/sources.csv.gz)
- [All raw rows for the 27 positives](../artifacts/temporal_missingness_schema_adapted_20261012/positive_raw_evidence.csv.gz)
- [Summary and all descriptive support tables](../artifacts/temporal_missingness_schema_adapted_20261012/summary.json)
- [Independent verification](../artifacts/temporal_missingness_verification_schema_adapted_20261012/verification.json)
- [Final checkpoint](../artifacts/temporal_missingness_checkpoint_20261012.json)

Summary SHA-256: `0a7e7b8ef76f550e7baeebdd699dc964d063bf3f0f550e28b3d05dafcbf61144`.
Historical generation-time pending flags remain preserved; the independent
receipt and final checkpoint establish completed checking. This local scientific
result is unpublished until a separate exact public deployment receipt exists.
