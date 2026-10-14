# Execution correction, with the scientific protocol unchanged

The first guarded attempt stopped after 3.135 seconds at a sampled 291,520,512
bytes RSS, above the frozen 256 MiB ceiling. Preserve the full partial stage at
artifacts/ablation_diagnostic_20261014; it cannot support any scientific claim.
No individual performance output was inspected before this amendment.

The worker now constructs one method's feature array at a time and releases
fold arrays before the next fold. This fixes simultaneous allocation; data,
models, contrasts, metrics, random seeds, diagnostic conventions and memory ceiling
are unchanged. Repeat controls, commit the correction and use a fresh stage
artifacts/ablation_diagnostic_execution2_20261014. The independent checker uses
the corresponding new registration. The original registration/code remain in
Git snapshot 394f7ff4 and are not represented as current code hashes.

Time caps for the corrected attempt: controls 50 s, worker 1,130 s, checker 530 s,
with <=1,740 seconds total including previous executed time. Aggregate new
controls <=1 MiB, worker stages <=12 MiB, checker <=4 MiB; preserve the 5 GiB
reserve. A scientific/memory failure stops claims; no threshold or capacity is
adapted to observed performance and no automatic scientific successor is run.
