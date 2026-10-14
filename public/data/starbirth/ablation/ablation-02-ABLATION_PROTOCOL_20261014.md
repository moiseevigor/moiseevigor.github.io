# Fixed retrospective ablation and generalization diagnostic

Frozen before this study's readout, 14 October 2026, following the human's explicit
request. Original outcomes are already consumed. This is an exploratory diagnostic,
not fresh confirmation, a new primary gate, a model-selection contest or a physical
birth test. The original failed ranking gate remains unchanged.

## Inputs and splits

Reuse only hash-bound verified 19,328-by-28 feature/mask arrays, exact string IDs,
proxy states, saved five spatial folds and original training buffers/components.
All 27 qualifying positive, 235 qualifying proxy-negative and 19,066 unknown rows
remain. Do not convert unknown to negative. Input fields and exclusions are exactly
MULTISURVEY_MISSING_VIEW_PROTOCOL_20261012.md. No observations or catalogue labels
are acquired. Preprocessing and completion fit training parents only; supervised
feature scales and kernel widths fit training references only.

## Sixteen fixed methods

Replay the original embedding, linear raw baseline, nonlinear raw baseline and
infrared-only embedding. Compare scores to the saved original arrays within 1e-7.
Add six Gaussian kernel ridge raw-feature contrasts, each including its own masks:
physical columns 0:5; mask-only (all 28 availability flags, no values); infrared 0:16;
no molecular view 0:20; no temporal view 0:16 plus 20:28; molecular-only 20:28.
Add rank-six latent-only coordinates (no physical bypass or masks), and original
rank-six plus physical bypass without masks. Add embedding ranks two and twelve,
with original physical bypass and all masks. Add original rank-six embedding with
ridge 0.1 and 10 (original ridge 1). Completion remains 20 iterations, view weights
and observed-value encoding ridge 0.01 unchanged. All original formulas are retained.
No tuning or choosing the best capacity, method, threshold or bandwidth afterward.

## Metrics and diagnosis

For each fold report reference/test class counts, training and held-out ROC AUC,
AP with prevalence, and their differences. Never pool unaligned fold scores for
ROC/AP. Macro-average eligible folds. Training is apparent fit, not validation.
For each method preserve original per-tile ceil(0.05*n) and lexicographic ID ties:
18 qualifying reviews and 982 all-parent reviews. Report recovered positive proxies,
proxy negatives, unknown review load, and paired differences vs the original full
embedding with 2,000 resampled 10-degree qualifying tiles (seed 20261014). Intervals
are conditional descriptive spatial sensitivity with many dependent contrasts;
no multiplicity-adjusted claim or physical precision interval is made.

Use explicitly conventional, non-universal diagnostics. Evidence consistent with
overfit requires train-minus-test ROC AUC >=0.10 in at least four eligible folds,
and either ridge 10 improves macro held-out AUC by >=0.02 over ridge 1, or the
50%-to-100% label curve reduces its macro gap by >=0.03 while improving held-out
AUC by >=0.02 (at least four paired eligible folds). Evidence consistent with
underfit requires train and held-out AUC <=0.70 in at least four folds, and rank 12
or ridge 0.1 improves both macro train and held-out AUC by >=0.05 with gap increase
<=0.03. Otherwise report mixed/inconclusive; describe actual gaps even if these
conventions do not trigger. Small positive counts, spatial shift and selective
proxy ascertainment prevent a definitive physical diagnosis.

## Label curves and negative controls

For original embedding and nonlinear raw models use nested 50%, 75%, 100% subsets
of training association components ordered by SHA256('20261014:'+group), taking
ceil(fraction*component_count). No stratification, redraw or label-based selection.
Keep every member of each selected component. At least five positives and twenty
proxy negatives are required; invalid points remain explicitly invalid. This is
a downstream label-count curve: the label-free representation and feature scales
stay fixed from the full training fold, not a full-pipeline sample-size curve.

Ten fixed training-label permutations within each training 10-degree tile per fold
(seed 20261014 + fold) for the original embedding and raw nonlinear model, preserving
within-tile class counts; evaluate unchanged held-out outcomes. These are sanity
controls, not a formal p-value or proof of no leakage. Report tile label diversity:
permutation cannot destroy geographic prevalence/selection effects. Never permute
held-out labels or cross the original train/test groups.

## Verification and stopping

Run synthetic tied-score AUC/AP, review budgets/ties, unknown preservation,
completion, class balancing and kernel solver controls before real fitting.
An independent checker must not import the worker/model modules: validate hashes,
IDs/groups/buffers, training-only robust scales, learned capacity/bases, coefficient
stationarity, all held-out predictions, metrics and exact selections, learning
subsets/permutations and input immutability. Preserve failed attempts.
One execution, no adaptive follow-up or choosing a winner. Any failure stops claims.
Use native NumPy/SciPy, one CPU, no GPU/downloads; monitored reserve >=5 GiB,
controls <=60s/1 MiB, worker <=1140s/12 MiB, checker <=540s/4 MiB, cumulative <=1740s,
maximum sampled RSS 256 MiB each. No extra data or archive experiments. Registered
output budgets exclude existing scientific input bytes; final publication staging
has its own <=16 MiB cap. Preserve all originals and additive Git snapshots.
