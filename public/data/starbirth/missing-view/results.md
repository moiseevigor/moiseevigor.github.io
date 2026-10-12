# Missing-view embedding comparison: no retrospective gain demonstrated

12 October 2026. The first frozen missing-view model comparison is complete and
independently recomputed. The representation learned without chemistry class
labels and used infrared/context, screened variability and non-withheld gas
features. Its downstream ranker used training-only **consumed chemistry proxies**.
This is a retrospective selected-proxy comparison, not an independently validated
protostar detector, physical classification or stellar birth result.

Protocol, source hashes, implementations, synthetic checks and outcome-blind
spatial splits were frozen at `8b9decb2` before new measurement/proxy readout.
No threshold, cohort, feature, architecture or hyperparameter was changed after
readout. The long-term goal remains unachieved and active. This bounded unit
ends with a negative result; no automatic model sweep or successor is justified.

## Primary comparison

The known-proxy cohort contains 262 unambiguous clump/record associations:
27 qualifying chemistry positives and 235 qualifying proxy negatives. All
19,328 requested clumps remain in the source ledger; **19,066 have unknown
qualifying proxy status**, including absence, ambiguous association and marginal
or missing flags. A proxy negative means four selected tracers have 'N' flags;
it does not mean a physically starless clump. The new exact cohort is not the
historical 303-object cutout/nearest-row cohort, so its count need not equal the
historical 26-positive result. No additional object is declared a discovery.

| Method | Equal-cost reviews | Qualifying positives recovered | Recovery of the 27 qualifying positives |
| --- | ---: | ---: | ---: |
| Shared missing-view embedding | 18 | 14 | 51.85% |
| Linear tabular baseline, same inputs | 18 | 14 | 51.85% |
| Nonlinear tabular baseline, same inputs | 18 | 15 | 55.56% |
| Infrared-only embedding ablation | 18 | 13 | 48.15% |

The frozen primary statistic is the **minimum** paired recovery difference
against the two primary baselines: **−3.70 percentage points**. Its conditional
paired spatial-bootstrap percentile interval is **−11.11 to 0.00 points**.
There were 1,999 retained draws and one zero-positive draw discarded, above
the frozen 1,900 requirement. Eight 10-degree tiles contained qualifying proxies.
The population/count, common-prediction and bootstrap adequacy checks passed.
The required gain of at least +10 points with a positive interval lower endpoint
failed. Conclusion: **no retrospective gain demonstrated by this frozen method**.
This is not an equivalence test or a physical population null.

Review counts use ceil(5% of eligible objects) separately in each tile, so the
actual rounded common-cohort budget is 18/262 = 6.87%, identical for all methods.
The chosen rule was frozen before readout. Scores are ordered within held-out
tiles; fold-specific coordinates or raw scores are not treated as a single
calibrated probability space. Do not relabel these recovery values population
recall or call a selected chemistry-positive fraction physical precision.

## Important limitation: the temporal/molecular positive overlap is absent

Only **three qualifying-proxy objects** have the supported temporal input view,
and **none is a qualifying chemistry positive**. All 27 qualifying positives
lack the registered anchored temporal view. The comparison therefore cannot
establish a benefit from joint variability and molecular evidence for positive
cases. Missing-view learning preserves the population but does not create
observations. Lowering the anchor/visit/quality criteria after this result would
change the scientific question and is not an acceptable repair.

Of the 262 qualifying proxies, 235 have at least one valid input gas feature;
27 have none, and those 27 have no qualifying positive. This availability itself
can encode selection and sensitivity. Both baselines receive the same inputs
and masks. Mass, temperature, distance, surface density and diameter are direct
controls in the embedding ranker as well as the comparators; descriptive
stratified counts and cohort domains are retained in the summary. These controls
do not validate total-column uncertainties, physical membership or causal effects.

The withheld four chemical tracers are absent from embedding features. However,
input and outcome lines share the same telescope, environment and selection.
Holding out tracer columns prevents direct feature leakage, not conditional
dependence or selection bias. All outcome flags are historically consumed and
remain labelled that way. Spatial withholding does not make them fresh truth.

## Every requested source, and the unknown review burden

All five spatial folds fitted successfully; all 19,328 sources have out-of-fold
ranking scores under each method. Groups sharing a molecular position or an
identical retained WISE anchor stay together, and a one-degree longitude buffer
separates training from the nominal held-out tile intervals. Preprocessing,
completion and the basis use training-only rows. The four withheld flags are
used only for training-reference rankers and held-out proxy readout.

The separate all-requested review rule selects **982** clumps per method (about
5.08% after tile-wise rounding):

| Method | Selected qualifying proxy positives | Selected qualifying proxy negatives | Selected unknowns |
| --- | ---: | ---: | ---: |
| Shared embedding | 24 | 74 | **884** |
| Linear baseline | 27 | 122 | **833** |
| Nonlinear baseline | 26 | 87 | **869** |
| Infrared-only ablation | 23 | 61 | **898** |

These unknown selections remain in the ledger and review burden. Neither their
scores nor the observed selected proxies establish their physical classes.
Dropping unknowns would inflate any apparent precision; no physical precision
or survey recall is reported. Scores outside the qualifying chemistry-support
domain are explicitly marked outside that evaluation support, even when finite.
A complete candidate ledger is not a confirmed-object catalogue.

The six-dimensional coordinates are saved with their fold assignments, not
merged into a global latent map. This is a fixed low-rank completion prototype,
not a deep network or a new astrophysical theory. The result does not show that
all unsupervised methods fail; it gives no reason to prefer this method over
strong physical-feature baselines on these cached proxies. The infrared-only
ablation's one-object difference is diagnostic and was not selected as a primary
endpoint after readout. The old CLIP branch remains closed; it was not executed.

## Verification and resource evidence

The independent checker reconstructed all 28 features, masks, exact proxy states,
native record joins and outcome-blind spatial splits from raw bytes. It replayed
completion using covariance eigendecomposition instead of full SVD, checked
subspace projectors, encoded rows using augmented least squares instead of
normal equations, checked logistic gradients and kernel linear-system residuals,
and reproduced every review flag, paired draw, headline, stratum and source score.
It imported no generator/model/data module. This is independent software
recomputation, not a fresh physical-truth validation or separate human review.

The worker completed in **9.31 seconds**, the checker in **11.37 seconds**.
Peak sampled RSS was 266,797,056 bytes (254.44 MiB) and 258,179,072 bytes
(246.22 MiB), respectively, both below the 256 MiB ceiling. The worker came close
to that limit; no margin or unobserved peak is claimed. All recorded system
pressure samples were normal. RSS sampling can miss short peaks. The minimum
observed free space was 58,015,264,768 bytes (about 54.0 GiB), above the 5 GiB
reserve. Both stages total 4,152,179 bytes before this report/final checkpoint,
below the registered 16 MiB combined limit. No native observations were deleted,
acquired or uploaded; no GPU, paid cloud job or private Atlas action occurred.

## What this changes, and what remains

A source-bound, missing-view candidate-ranking implementation and a fair
retrospective comparison now exist. This particular learned representation did
not outperform the stronger same-input baseline. The key limitation for the
requested physical goal is evidence: independent physical truth is missing,
and the evaluated positive cases have no registered temporal/molecular overlap.
More fitting on the same caches cannot repair either fact by itself.

The next scientific decision needs a distinct, justified and prospectively
registered evidence route: establish emitter/clump association and physical
validation for cases with complementary temporal/infrared/gas coverage, keeping
known references, provisional candidates and unknowns separate. Existing cached
independent observations may be assessed under such a protocol; no new
observations, relaxed cuts, paid jobs, MIPSGAL occurrence readout or generic-star
branch are authorized by this negative result. Publication/review tools can
communicate these findings but cannot count as scientific validation.

The full long-term detector and physical birth objective remains unachieved.
The 333/800 matched-control gate and its unopened occurrence comparison stay
unchanged. No hidden-protostar fraction, physical lifetime, new star, confirmed
stellar birth or robust detector is established. E29–E160, N20/c6828 and the
private Atlas/E155/E121 restrictions remain intact. No blog/app deployment is
claimed for this new result yet; local verified outputs are marked unpublished.

## Source-bound artifacts

- [Frozen protocol](MULTISURVEY_MISSING_VIEW_PROTOCOL_20261012.md)
- [Registration](../artifacts/multisurvey_missing_view_registration_20261012.json)
- [Outcome-blind spatial assignments](../artifacts/multisurvey_missing_view_splits_20261012.csv.gz)
- [All 19,328 source scores, proxy states and review flags](../artifacts/multisurvey_missing_view_20261012/sources.csv.gz)
- [Complete summary, failed benefit gate and strata](../artifacts/multisurvey_missing_view_20261012/summary.json)
- [Feature/mask/proxy arrays](../artifacts/multisurvey_missing_view_20261012/features.npz)
- [Out-of-fold scores, unaligned fold coordinates and bootstrap](../artifacts/multisurvey_missing_view_20261012/predictions.npz)
- [Independent verification](../artifacts/multisurvey_missing_view_verification_20261012/verification.json)
- [Final checkpoint](../artifacts/multisurvey_missing_view_checkpoint_20261012.json)

Summary SHA-256: `993d45a986c6da462743111ec635aa73f70c4173e95db4ac5c24f5557da4b99d`.
Source-ledger SHA-256: `6872b22eed45d6e001d0363c3a05e864702b86adc46f20baaf7b4f1c0a7d24c0`.
The generation checkpoint's pending-verification flag records generation time;
the separate verification receipt and final checkpoint record completed checking.
Keep all five fold-model NPZ files and original resource logs for reproduction.
