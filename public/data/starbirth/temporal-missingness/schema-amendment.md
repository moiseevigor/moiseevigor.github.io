# Temporal diagnosis: lossless proxy-state schema correction

12 October 2026, separately frozen before native query-cadence readout. The
original worker in commit `ed114aad` stopped at its proxy-state cardinality
assertion before reading the raw NEOWISE epoch rows or writing scientific output.
Its log and resource stop remain in `artifacts/temporal_missingness_20261012/`.

The native ranking ledger uses `qualifying_positive`,
`qualifying_proxy_negative`, `unknown`; the original implementation expected
`positive`, `negative`, `unknown`. Inspection of the original ranking generator
at line 141 and the bound ledger verifies a one-to-one, lossless mapping with
27, 235 and 19,066 entries, and 19,328 unique original IDs. No missing association,
changed population or new scientific result was found. This was an avoidable
implementation-contract error, not an evidence gate failure.

Preserve the original registration and both original implementations. Freeze
separate adapted copies and fresh output stages. The adapter adds `proxy_group`
for internal descriptive aggregation and retains the exact native string in
`proxy_state`. It changes no target, consumed labels, quality/association rule,
deduplication, visit/span criterion, primary numerator or >=14/27 majority gate.
The query-level support count remains unread. No inference, fit or classifier
repair is implied by this technical correction. All original restrictions and
resource ceilings apply; do not rerun the stopped original stage.

The new registration binds the original inputs/protocol/source, failed log and
resource receipt, this amendment and both adapters. Its two fresh stages are
`artifacts/temporal_missingness_schema_adapted_20261012/` and
`artifacts/temporal_missingness_verification_schema_adapted_20261012/`.
The combined **16 MiB** cap includes the preserved failed stage and final report.
A further stop ends this amended attempt; no automatic retry is authorized.
