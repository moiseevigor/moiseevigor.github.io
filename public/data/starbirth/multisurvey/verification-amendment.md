# Pre-read verifier implementation amendment

The primary metadata audit at registration revision `d041663d` completed once
under its resource limits. The separately monitored pandas verifier stopped at
`import pandas` with `ModuleNotFoundError` before its `verify` function ran or any
source/ledger was read. Preserve that attempt, log and resource receipt in
`artifacts/multisurvey_eligibility_verification_20261012/`.

No data or scientific criterion changes. Do not rerun either the primary audit
or the unavailable pandas worker. Instead, freeze a distinct, dependency-free
checker, `research/verify_multisurvey_eligibility_stdlib.py`, before execution.
It independently reconstructs every source field from raw frozen CSVs, binds
row-number geometry, recomputes summary counts via set intersections and verifies
every retained cutout's complete hash. It imports neither the generator nor
historical research modules. It uses only Python standard-library dependencies.

The original registration and its input hashes stay unchanged, including the
original verifier source. Bind the new checker, original registration and failed
attempt in `artifacts/multisurvey_eligibility_verification_amendment_20261012.json`.
Keep the ten-minute, one-CPU, 256 MiB sampled RSS and 5 GiB reserve limits. All
audit, failed-check, replacement-check and report products combined remain below
1 MiB. Use a fresh guarded stage. No observations, outcome readout, fitting,
threshold tuning or dependency download is authorized by this repair.

This fixes operational verification only. The audit does not establish a fresh
physical-truth cohort or a successful scientific ranking. A failed replacement
check ends verification with its explicit unresolved error; no automatic retries.
