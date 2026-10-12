# Association-audit implementation amendment: bounded memory

12 October 2026. Original registration/code/protocol commit `0ea9be1c` remains
immutable. Its worker stopped under the live 256 MiB sampled-RSS limit at
6.18 seconds, before any output tables or summary completed. Peak sampled RSS
was 268,468,224 bytes; stop_reason=worker_memory. Only its initial hash-check log
and resource receipt were written. No scientific result, fit or outcome readout
is inferred from that partial attempt. It will not be rerun.

This separately frozen implementation repair keeps the full 19,328 population,
all inputs, scientific predicates, association radii, temporal/visit rules and
resource limits unchanged. It drops unused ledger/catalogue columns immediately
while streaming, stores exact deduplication keys as lossless bytes instead of
five separate Python strings, and streams the independent checker's output rows.
The worker's delimiter is forbidden inside each key value; the independent
checker uses JSON encoding. Thus both preserve equality of the original five
strings without a digest collision or lossy numeric rounding. They use different
spherical-geometry and graph algorithms as before.

The new worker and checker have separate filenames. The amendment registration
binds their hashes, this note and both original failure files before execution.
Each new stage retains its own log/resource record. The combined 4 MiB cap now
includes original failed-stage bytes, amended worker/checker stages and result
report; no failed artifacts are replaced. The worker stage cap is 3 MiB and the
checker cap 1 MiB, with a final stricter combined check. Keep 5 GiB reserve,
256 MiB sampled RSS, one CPU, 600 seconds per worker. No raised limit, altered
sample, quality relaxation, line-flag readout, training or observation acquisition
is authorized or performed by this repair.
