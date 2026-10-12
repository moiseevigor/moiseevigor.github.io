# Frozen cached multi-survey eligibility checkpoint

This implements the first checkpoint in the accepted
[program](MULTISURVEY_RESEARCH_PROGRAM_20261012.md). Freeze this protocol, its
input inventory and implementation in Git before audit execution. This is an
identity/availability/consumption audit, not an embedding experiment.

## Exact domain, inputs and joins

Use all cached Hi-GAL rows with `evol_flag == 1` and finite `0 < dist <= 4`:
the expected parent is 19,328 exact designation strings. Do not select by any
physical proxy, model score or counterpart brightness. Bind the parent and
input files to complete SHA-256 values in
`artifacts/multisurvey_eligibility_registration_20261012.json` before readout.
The inventory lists the exact allowed tables and header-only provenance inputs.

Join core tables by exact designation without trimming, rounding or fuzzy name
matching. Duplicate parent, far-IR or AllWISE feature identities fail closed.
Keep the raw CSV strings for source names and SPICY IDs. Historical temporal
`tid` indexes refer to the saved E1-full target row order: require canonical
integer indices in range, unique target designations and agreement of every
returned query position with the saved target within 1e-6 degree. Report all
geometry mismatches; never silently treat those rows as usable observations.
SPICY `tid` uses that same historical target table, not the new parent ordering.
Its historical deduplication may have discarded competing matches; no new
association or physical membership is established by this join.

Read catalogue stage only to reproduce the already accepted parent definition.
Read unlabelled presence/error/epoch metadata, source IDs and coordinates. Ignore
all `active`, `frag`, `class`, `class_on`, `class_off`, quintile and score values.
E22/E26 memberships identify consumed checks, not new outcomes. Count known
consumed catalogue geometry for every parent source, even outside the E13 sample.
No absent role manifest is promoted to untouched truth. MALT90 line values,
ALMAGAL core counts and MMB classifications are not read; their raw files are
hash/header-bound context only. No N20 fit/association worker is restarted.

## Availability states and evidence limits

For the cached far-IR catalogue, encode positive finite flux presence for
160/250/350/500 μm and positive finite quoted-error presence for 160/250 μm.
Record absent values as missing, not physical nondetections. Missing quoted
350/500 μm errors are a schema limitation, not zero noise. Encode presence of a
positive 70 μm upper limit as label-domain context, never a training feature.
WISE feature rows and finite counterpart coordinates are distinct: a requested
row can contain no retained counterpart. Raw WISE magnitude/colour values are
not ranked or exported; SNR cannot substitute for a full flux-error contract.

Temporal row, quoted-error and epoch presence are counted without SNR cuts,
light-curve fitting or event classifications. A target queried with no rows is
not equivalent to verified nondetection. A sequence of positions is not a
source-ownership/deblending solution. Retain legacy ambiguity and native-source-ID
limitations in the report.

Hash every retained E13 cutout for the parent ledger, without decoding pixels or
claiming native WCS/PSF, units/noise or finite bands. `file_unverified` is different
from `not_retained`; neither establishes usable common-support photometry. The
display/shape cutouts are not calibrated flux substitutes. Newly computed file
hashes bind current bytes, not original acquisition provenance.

Every requested parent source remains in a deterministic gzip CSV ledger with
coordinates, presence states, historical memberships, original SPICY IDs and
cutout hashes. Count overlaps on this parent only; preserve global table counts
and duplicates separately. Exclude all E29–E160 tables/models. Do not open the
stopped MIPSGAL occurrence comparison or lower its 333/800 gate.

## Decision and resource rules

The audit answers whether exact source-bound development inputs and separately
documented evaluation evidence exist. A source ledger is operational progress;
no development-source count is a scientific success threshold. Independent
evaluation is unestablished unless a frozen independent physical-truth manifest
and consumption/association evidence are present. No such manifest is supplied
as an input to this checkpoint; therefore it cannot certify detector validation.
Identify concrete missing evidence, not an invented fresh split of old outcomes.
No performance metric, candidate rank, model fit or physical assertion is made.

Use `research/audit_multisurvey_eligibility.py` once in a fresh stage under
`scripts/run_guarded_research.py`: one CPU, no GPU/network, 600 seconds,
256 MiB sampled RSS, 1 MiB total new stage outputs and 5 GiB free. Hash input
files streaming. Preserve failures; do not automatically rerun a failed worker.
Independent verification is a separate bounded worker under the same ceilings;
combined products, both resource receipts and report must fit 1 MiB total.
The verifier must independently reconstruct parent IDs, joins, presence counts,
query geometry and all cutout hashes, and check complete input/output bytes.
Stop this audit after verification. A later retrospective or fresh test requires
its own frozen scientific registration; this audit does not execute it.
