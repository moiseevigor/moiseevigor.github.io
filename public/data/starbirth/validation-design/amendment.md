# Population design-probability correction

Final publication audit identified a reporting defect in the original population
ledger. All 223 selected rows/weights and the frozen stratum allocation are correct,
but unsampled eligible rows have `sampled_stratum_groups=0`, numerator zero and
blank inverse weight. These encode realization, not the design probability.
Every eligible group in a stratum must have the same design inclusion fraction
`min(30,N)/N`, whether selected or not. Excluded groups keep zero/zero and blank
weight. `review_sample` alone records realized selection.

Preserve the original ledger, queue, summary, checker and publication records.
Produce a separately named corrected population ledger by changing exactly
`sampled_stratum_groups`, `inclusion_numerator` and `inverse_inclusion_weight` on
unsampled eligible rows. No IDs, group, stratum, exclusion, selected case, outcome,
threshold, score or measurement changes. The original queue remains byte-identical.
The earlier independent checker mirrored the realization convention; its receipt
does not establish the corrected population interpretation.

Freeze input hashes and this amendment before transformation. Separately verify
every original field, uniform group/stratum design probability, selected queue
identity and complete hashes. Worker/checker each <=60 seconds, one CPU, sampled
RSS <=256 MiB, outputs <=2 MiB/1 MiB, reserve 5 GiB. No model or acquisition.
Add corrected downloads to existing releases without overwriting original
scientific bytes. Current Git/GCS release revisions remain immutable snapshots.
