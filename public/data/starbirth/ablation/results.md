# Ablation result: capacity is not the main demonstrated bottleneck

Human-requested retrospective diagnostic, 14 October 2026. Sixteen fixed contrasts,
spatial folds, nested label curves and ten tile-preserving permutation controls
were executed using cached data. An independent implementation replays every
score, selection, fit, curve and exact source identity. All original four methods'
review lists are unchanged. No new observations, candidate discoveries, calibrated
birth probabilities or physical truth were produced.

## Answer to overfitting / underfitting

**No clear global underfitting or severe uniform overfitting is demonstrated on
these consumed chemistry proxies.** The fixed conventions return mixed/inconclusive
for both original models. This is not a finding of reliable physical generalization.
The embedding shows localized generalization loss and substantially more label-count
sensitivity than the raw nonlinear baseline. Selection, missing-view support and
lack of independent physical validation are the stronger demonstrated limitations.

The representation learns without class labels, but the downstream ranker learns
from labels. The two stages must not be called an entirely unsupervised detector.
Unknowns remain unknown; dust and embedded stars can coexist.

## Fixed contrasts

Every row uses the same 27 positive proxies and 235 proxy negatives, with 19,066
unknowns retained in the 19,328-parent ledger. The qualifying cost is exactly 18
reviews: ceil(5% per tile), actually 6.87% of 262. All-parent cost is 982 per method.
AUC/AP are unweighted means of five within-fold metrics, never pooled fold scores.
Training AUC is apparent fit. Proxy-negative is not physically starless.

| Fixed method | Train AUC | Spatial held-out AUC | Positive proxies recovered /27 | Unknowns in 982 reviews |
|---|---:|---:|---:|---:|
| embedding | 0.990 | 0.954 | 14 | 884 |
| linear | 0.992 | 0.971 | 14 | 833 |
| nonlinear | 0.998 | 0.973 | 15 | 869 |
| infrared_embedding | 0.989 | 0.945 | 13 | 898 |
| physical | 0.968 | 0.938 | 13 | 897 |
| availability | 0.760 | 0.780 | 7 | 780 |
| infrared_raw | 0.989 | 0.939 | 13 | 902 |
| no_molecular | 0.989 | 0.939 | 13 | 899 |
| no_temporal | 0.998 | 0.974 | 15 | 871 |
| molecular | 0.996 | 0.984 | 14 | 815 |
| latent_only | 0.991 | 0.942 | 14 | 863 |
| embedding_no_masks | 0.991 | 0.957 | 14 | 903 |
| rank2 | 0.977 | 0.957 | 14 | 891 |
| rank12 | 0.996 | 0.965 | 15 | 886 |
| ridge01 | 0.999 | 0.954 | 13 | 903 |
| ridge10 | 0.966 | 0.936 | 12 | 879 |

The shared representation recovers 14/27; raw nonlinear recovers 15/27. The original
+10 percentage-point improvement gate remains failed. Rank 12 also recovers 15;
it does not beat the raw baseline. This exploratory family cannot be used to choose
a new winner. No additional unconsumed test set was used.

Physical covariates alone recover 13/27. Availability flags alone recover **7/27**,
with held-out AUC 0.780. Observation patterns predict the proxy label, which makes
selection confounding concrete; it does not prove that all measured signal is bias.
Molecular-only recovers 14/27 (AUC 0.984), but its inputs and withheld outcome flags
come from the same telescope/catalogue. Withholding target columns prevents direct
field leakage, not independence of ascertainment or physical validation.

Removing the temporal view leaves raw nonlinear recovery at 15/27. **Zero of the
27 positive proxies has the registered temporal input**, so this cannot establish
that variability is useless. It shows the current experiment cannot fairly test
its proposed contribution. Infrared raw and no-molecular raw both recover 13/27.
Different feature sets use the same bandwidth rule, not an identical numerical
bandwidth; these are pipeline contrasts, not causal decompositions of information.
Removing masks from the embedding still recovers 14; neither mask nor physical
bypass removal establishes an incremental unsupervised advantage.

## Capacity, regularization and label scarcity

The embedding's macro train/held AUC is 0.990/0.954, a 0.035 gap. Only one of five
folds has a gap >=0.10 (0.993 versus 0.880); raw nonlinear has no such fold and a
0.024 mean gap. Test folds contain only **12, 3, 3, 7 and 2 positive proxies**.
The two apparently perfect held-out folds have just three and two positives.
These small, selected counts do not establish survey-wide precision or recall.

Rank 2 gives AUC 0.957 and 14 recoveries; rank 12 gives 0.965 and 15. Ridge 0.1
raises training AUC to 0.999 but held-out stays 0.954 and recovery drops to 13.
Ridge 10 lowers both (0.966/0.936) and recovers 12. Neither tested direction
establishes a capacity cure, and no hyperparameter is promoted from this readout.

At 50% of training association components, embedding train AUC is 0.998 and held
AUC 0.877 in the four eligible folds. On those **same four** folds at 100%, held
AUC is 0.973: +0.096, with the gap shrinking 0.104. The raw model improves only
0.010 on that paired comparison. One half-label fold has only two training
positives and is explicitly invalid; it is not redrawn or silently omitted from
the ledger. Thus the comparison excludes the fold with seven held-out positives
and relatively weak full-data embedding performance. This single deterministic
subset sequence has no repeated-subset uncertainty estimate. It measures label
support conditional on a fixed label-free representation and fixed scales, not
a whole-pipeline training-size curve.

Ten within-training-tile label permutations give mean held-out AUC 0.524 for the
embedding and 0.530 for raw nonlinear. The ten macro-fold means span 0.320–0.660
and 0.307–0.706. These sanity controls preserve tile prevalence and selection;
all five folds have four training tiles with mixed labels. They are not formal
p-values or proof against every leakage path. Reused outcomes and shared survey
ascertainment remain limitations even when a control behaves near chance.

## Revised search priority

The next scientific target is **incremental evidence beyond physical covariates
and observation availability, verified on independent spatially held-out outcomes**.
Build an eligibility ledger and a source-bound adjudication plan before another
fit: establish physical clump/source ownership, complementary-view coverage,
mass/temperature/distance/surface-density and sky support, and validation independence.
Keep independent youth evidence distinct from novelty and an observed transition.
Audit below-threshold sources as well as shortlisted ones; a shortlist alone cannot
measure recall. Use paired-disagreement and spatial clustering in a prospective
power/review-cost calculation before fixing the validation cohort size.

Do not enlarge the architecture, pick rank 12, relax quality gates or reuse these
27 positives as a fresh test. If independently eligible outcomes or temporal-view
support cannot be established within the next bounded week, report the specific
coverage/validation failure rather than another model win. No acquisition or new
experiment automatically follows this diagnostic. The end goal of a robust physical
newborn-star detector remains unmet.

## Integrity and resource record

The original protocol was frozen after the earlier experiment's outcomes were
already known. It is a fixed retrospective diagnostic, not outcome-blind registration.
Three memory stops in analysis/checker allocation and a further streamed-ledger
memory stop were preserved. The independent checker also caught a numerical tie
bug: duplicate vectors received up to 1.78e-15 batch jitter. Scores now canonicalize
identical inputs; exact ID ties are reproducible. This post-read correction changed
the availability diagnostic (initial unverified 5/27 became correct 7/27); original
four methods' lists did not change. No fit formula, thresholds, seeds or outcomes
were adapted. Every failed attempt and correction registration remains available.

Independent verification includes all 80 main fold/method models and 128 eligible
auxiliary fold models, all 19,328 exact string IDs, 19,066 unknowns, every stored
score/selection, training-only transforms and completion, kernel stationarity,
label subsets/permutations, and unchanged source hashes. Per-contrast spatial
bootstrap intervals in the CSV are descriptive conditional sensitivity with many
comparisons, not confidence in physical classes or multiplicity-adjusted victories.

See [the fixed protocol](ABLATION_PROTOCOL_20261014.md), the execution,
verification and numerical-tie amendments, and the checkpoint/hash inventory below.
Methodological references: [training/validation curves](https://scikit-learn.org/stable/modules/learning_curve.html)
and [preprocessing leakage](https://scikit-learn.org/stable/common_pitfalls.html).
These references motivate diagnostics; their illustrative thresholds do not define
our physical success criterion. No claim of independent physical validation is made.

Total guarded work including failures: 136.57 seconds; minimum observed free space 48.02 GiB. Final analysis/checker sampled RSS peaks: 254.50 / 247.45 MiB. Sampling may miss sub-interval peaks. Worker stages aggregate 10.83 MiB, including failed outputs; originals are preserved.
