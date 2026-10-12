# Post-comparison temporal missingness diagnosis

12 October 2026. This is a separately frozen, **post-read diagnostic**, prompted
by the already known absence of supported temporal input in all 27 qualifying
chemistry-positive cases of the completed missing-view comparison. Those labels,
selection and the prior negative result are consumed. Registration precedes
this new query-level cadence computation, not historical outcome inspection.

## Question and decision

Do at least half of the 27 consumed qualifying positives contain cached,
available-field-screened measurements with the original cadence requirements
inside the original 6-arcsecond NEOWISE query, despite lacking the original
AllWISE-anchored temporal view? The primary endpoint is the exact count with
query-level support and no anchored support; the descriptive majority gate is
**at least 14 of the fixed 27**. If met, the next evidence need is source identity
and reliability for measurements excluded by the anchor path, rather than an
assumption that temporal observations are wholly absent in these cases. If not
met, report the exact failure decomposition; do not automatically obtain data,
change a threshold or start another fit. This question tests data-selection
support, not astrophysical variability, emitter association or classifier gain.

The original comparison (14/27 versus 15/27) and its benefit gate remain frozen.
Removing an anchor does not repair its missing view or supply a new light curve.
No model, event or flux fit occurs in this unit. No occurrence readout is opened.

## Population, control and exact measurements

Retain all 19,328 nearby Hi-GAL catalogue-prestellar parent designations, including
109 not requested by the original temporal query. Reconstruct the parent from
`evol_flag == '1'` and finite `0 < dist <= 4`. Use the bound independently verified
ranking ledger's positive/negative/unknown proxy states without relabelling
physical truth. The primary positive cohort has exactly 27; the 235 consumed
proxy-negative and 19,066 unknown cases are descriptive comparison groups.
Neither a missing temporal view nor four 'N' tracer flags means a starless clump.

Validate query target ordinal, unique designation and target coordinates against
the native parent and each returned `t_ra/t_dec` to 1e-6 degrees. Raw measurements
retain original 1-based data-row ordinals and string fields; native exposure and
source IDs were not retained. All input bytes and identities are hash-bound.

Use the **unchanged available-field screen**: valid ICRS coordinates, finite MJD
and W2 magnitude, finite positive W2 error, W2 SNR >= 5, qual_frame > 0, nb == 1,
and exactly four artifact-flag characters with W2 character (index 1) '0'. This
is not complete reliability screening: chi-square, moon, saturation, solar-system
flags and positional uncertainties are absent. These unknowns remain explicit.

For the new **query-level** diagnostic, retain screened rows whose great-circle
separation from the clump query centre is <= 6 arcseconds. Retain and count raw
out-of-cone and invalid-position rows; do not drop their requested sources.
This cone is the original acquisition region, not a new association threshold.
Several emitters, blends or artefacts can occupy it. No coherent single-emitter
identity is inferred, even when detections recur.

Separately reproduce the original anchored path: a finite retained AllWISE
position <= 3 arcseconds from the clump, then screened NEOWISE measurements
<= 2 arcseconds from that anchor. Do not choose new anchors or use flux matching.
Missing AllWISE alternatives/native IDs remain unknown. Compare all original
per-source anchored counts, duplicates, visits and support to the bound audit.

In each path, deduplicate the exact five **string** values (MJD, RA, Dec, W2
magnitude, quoted error), retaining all raw ordinals in membership hashes. Sort
unique tuples by numeric MJD; a gap > 30 days starts a visit. A supported visit
has >= 5 unique tuples. Support requires >= 3 supported visits and an overall
first-to-last retained-tuple span >= 365 days, precisely the prior rules. Span
may include unsupported visits; do not reinterpret it as duration of one star.

## Estimator, failure partition and confounding

Enumerate this fixed cache rather than infer a sky population. No statistical
confidence interval or event probability is appropriate to these deterministic,
selected-support counts; association and reliability uncertainty is structural
and unquantified. Report the exact numerator/denominator and all missing states.
No class precision, population recall, occurrence fraction or physical null.

Assign one mutually exclusive path outcome per requested source, in order:
not_requested; requested_no_rows; no_screened_in_query;
query_cadence_insufficient; query_supported_anchor_missing;
query_supported_anchor_cadence_insufficient; anchored_supported.
The last three require query-level support; a reproducible anchored-supported
case without query support is a containment error and stops verification.

Summarize each outcome and both support paths separately for positive, negative
and unknown proxy states. Give descriptive cross-tables by 10-degree longitude
tile and by parent-median low/high mass, temperature, distance, surface density
and diameter, with nonfinite/nonpositive values retained as unknown (temperature
uses finite values). Parent medians use no outcome labels. These are selection
checks, not causal adjustment or independence certificates. Column/extinction
uncertainties and source crowding are not validated by this table; the original
association ledger's molecular-sharing indicators remain visible per source.

## Outputs, verification and stopping

Write a compact all-parent gzip ledger with physical metadata, original anchor
and geometry flags, requested/raw/screened/cone/anchored counts, deduplication,
visit/span/support, mutually exclusive outcome and exact membership hashes.
For all 27 consumed positives, retain **every raw query row**, failures included,
in a separate gzip evidence table with native string fields, raw ordinals and
path decisions. These are evidence cases, not new candidate discoveries.
Original raw bytes remain available for every other requested case; membership
hashes plus generating code reconstruct their rows without duplicating the cache.

Write a summary, source/output hashes, checkpoint and resource receipts. An
independent implementation imports no generator functions: stream raw inputs in
four target-ordinal shards, use vector atan2 separation instead of haversine,
exact tuple sets instead of packed per-target buffers, and independently group
epochs and recompute every ledger field, path count, stratum and positive row.
Verify all input/output hashes, original anchored metrics and full 19,328 IDs.
Run synthetic boundary/deduplication checks before native readout.

One CPU thread, no GPU; worker and independent checker each <= 600 seconds,
256 MiB sampled RSS, **8 MiB per stage and 16 MiB combined final outputs**, including
resource logs and final report. Guard disk/pressure live and keep 5 GiB free.
No downloads, paid jobs, model sweep, observation deletion or historical branch
restart. A hash/identity/geometry/resource failure yields an explicit stop;
no automatic retry or rule change. Snapshot the registration/source in Git
before running and the verified outcome in a separate additive commit. Keep
E29–E160, N20, c6828, 333/800 and Atlas/E155/E121 restrictions intact. The full
physical detector objective stays unmet irrespective of this diagnostic outcome.
