# NEOWISE delivery completed; native quality interpretation unresolved

14 October 2026. Explicit human approval resumed exactly the three frozen Gator
requests. All three completed: **874 rows** (312, 273, 289), with complete raw VO
and exact string-valued CSV. Independent transport parsing and the unchanged
native Decimal/vector-angle checker passed. New acquisition took 14.61 seconds;
together with the original failed TAP request it used 105.80 seconds of the
600-second acquisition allowance. There were exactly three new/four cumulative
requests, no literal retries, no images, fitting or additional observations.

The unchanged frozen implementation returns **0/3 supported fixed-best cases**,
against required 2/3. However, **all 874 native ph_qual values contain two
characters**, whereas both frozen implementations require four. The official
[NEOWISE supplement](https://irsa.ipac.caltech.edu/data/WISE/docs/release/NEOWISE/expsup/sec2_1a.html)
describes four band characters and X in the unused third/fourth positions. Native
VO metadata uses variable-length character arrays and preserves these two-letter
values. The cause of this delivery/documentation discrepancy is unknown. No X
padding, flag coercion or corrected scientific rerun was performed.

Consequently 0/3 is a verified **computational outcome under the frozen string
contract**, not a scientifically established absence of usable temporal support.
The scientifically validated quality count/gate remains **unmeasured**. This is
an insufficient-evidence outcome. Independent implementations can agree while
sharing an incompatible input contract; that agreement alone does not validate
its scientific meaning. The mismatch qualifies, rather than overwrites, the
original computational files and independent receipt.

| Fixed case | Native rows | Unique literal rows at fixed best | Strict accepted | Supported epochs |
|---|---:|---:|---:|---:|
| HIGALBM330.8814-0.3656 | 312 | 307 | 0 | 0 |
| HIGALBM351.2258+0.6937 | 273 | 75 | 0 | 0 |
| HIGALBM353.4272-0.3734 | 289 | 68 | 0 | 0 |

All six catalogue alternatives remain in the downloadable assessment. The first
and third best points also fail the frozen profile-fit criterion in every
matched row (307 and 68); the second best fails SNR in 61/75 and fit quality in
24/75. These rejection tallies overlap and are descriptive results of the
unchanged rule, not revised quality/cadence verdicts or physical negatives.
The separate red third alternative has zero unique literal rows and must not
inherit the blue point's time series. 251 native extraction rows join retained
image exposure keys; none for the first case. This does not establish ownership.

The new four-stage packet is about 1.3 MiB. Guarded acquisition peaked at 34.94
MiB sampled worker RSS, with at least 50.65 GiB free. Sub-second peaks can be
missed by sampling; this is process-group monitoring, not whole-machine telemetry.
No resource stop occurred. Original native images, failed TAP evidence and all
historical model/control/gas/radio gates remain intact. No physical membership,
youth, population precision/recall, new star or birth is established.

This bounded unit is complete and stops here. A prospective field-contract repair
would require a separate explicit amendment, using these now-consumed data and
fresh validation controls; it does not follow automatically. The detector goal
remains unmet. Publish this qualified result and exact evidence only; maintain
separate deployment receipts for the existing app and blog.

Sources: `artifacts/native_profile_resumption_assessment_20261014.json`, the
original quality registration, Gator amendment/authorization, all three raw VO
and CSV files, frozen summary/detections, both independent verifications, their
resource receipts and `research/build_native_profile_resumption_assessment_20261014.py`.
