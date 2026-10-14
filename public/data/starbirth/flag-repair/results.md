# Flag repair verified; the registered NEOWISE quality gate still fails

14 October 2026. The human-authorized offline repair is complete. It uses the
same **874 downloaded rows**, three fixed cases and six alternatives, with **zero
new observation requests**. Recognized two-character W1/W2 values and four-character
W1/W2XX values expose the same W2 slot. Literal flags remain unchanged; no missing
characters or bands are manufactured. All numerical cuts, geometry, duplicate
checks, exposure joins, epoch grouping and the required **2/3** remain unchanged.
The delivery/documentation discrepancy's cause remains unknown.

Fifty valid synthetic encodings, fourteen malformed/null encodings and nine other
quality boundary controls passed before repaired execution. The independent
Decimal/vector checker, which imports neither the decoder nor producer, reproduced
every native row and all counterpart counts. A separate raw-VO delta checker
confirmed that **645 rows lose only the erroneous flag-shape rejection**. **Zero
rows become accepted**: every candidate extraction still has another rejection.
All raw fields, IDs, positions, geometry and exposure joins remain exact.

| Fixed case | Native rows | Unique rows at best point | Accepted rows | Supported epochs |
|---|---:|---:|---:|---:|
| HIGALBM330.8814-0.3656 | 312 | 307 | 0 | 0 |
| HIGALBM351.2258+0.6937 | 273 | 75 | 0 | 0 |
| HIGALBM353.4272-0.3734 | 289 | 68 | 0 | 0 |

The corrected primary result is **K=0/3**, below required **2/3**: the specified
conservative pipeline-quality/cadence gate fails under the explicitly amended
flag interpretation. Its verdict is now measured for this packet. That is not
physical validation, a claim that all observations are intrinsically unusable,
or evidence that the clumps contain no protostars. Other extraction methods,
calibrated ownership, youth, population precision/recall and birth remain unknown.

The first and third best points fail reduced profile-fit chi-square in **307/307**
and **68/68** matched rows. The second fails SNR in **61/75**, profile fit in
**24/75**, image quality in **45/75**, and the correctly decoded W2 grade in
**60/75**; these counts overlap. The separate red third alternative retains zero
uniquely matched rows. It cannot inherit the blue point's measurements. No model,
feature, source identity, threshold, scientific population or physical truth changed.

This is a **post-read repair on consumed data**, not fresh evaluation or an
outcome-blind experiment. The original computational readout and unresolved
contract qualification remain intact historical attempts. Their null scientific
verdict describes the state before this separately authorized repair. Current
presentation must lead with the corrected measured failure and label the old
null as historical. A parser fix has succeeded; the measurement route has failed.

Resource guards passed for permitted controls, analyzer, independent checker and
delta audit; about **4.3 seconds** of guarded execution, one CPU, 256 MiB sampled
RSS ceiling and at least **48.34 GiB** observed free. Sub-second workers mean RSS
samples can miss most of their lifetime; do not advertise the sampled few MiB as
an actual peak bound. The initial sandbox priority-setup refusal occurred before
worker creation; its operational receipt is preserved separately. No science
rerun, network retry, image request, fit, training or automatic successor follows.

The bounded repair unit stops here. The effective seven-day and long-term detector
objectives remain unmet; the previous 333/800 control gate, no embedding gain,
missing temporal support, colour and radio/gas limits stay visible. Atlas/E155/E121,
N20/c6828 and the unmerged E29–E160 archive are untouched. Publication is separate
from scientific success and needs its own exact deployment receipts.
