---
layout: distill
last_modified_at: 2026-10-14
title: "More model capacity is not the missing evidence"
subtitle: >
  Sixteen ablations separate physical features, observation availability and learned representations. The bottleneck is validation and coverage, with label-sensitive embeddings.
date: 2026-10-14 20:00:00 +0200
categories: [astrophysics]
tags: [star-formation, unsupervised-learning, Hi-GAL, validation]
series: hidden-protostars
series_title: "Hidden protostars"
series_part: 4
permalink: /astrophysics/2026/10/14/hidden-protostars-ablation/
image: /public/img/posts/hidden-protostars-v2.svg
published: true
listed: false
comments: false
description: >
  Verified retrospective ablations, training-versus-spatial-validation gaps,
  label-count sensitivity, selection confounding and the next validation target.
---

<link rel="stylesheet" href="/public/css/starbirth-program.css?v=20261011">
<link rel="stylesheet" href="/public/css/starbirth-ranking.css?v=20261012-4">

<div class="l-body sb-program sb-ranking" markdown="1">

<div class="sb-status"><strong>Verified retrospective diagnosis.</strong> The shared embedding remains <b>14/27</b> versus <b>15/27</b> for raw nonlinear ranking at the same <b>18 reviews</b>. Sixteen fixed comparisons do not establish a capacity cure. These are consumed chemistry proxies, not independent protostar truth or newborn-star detection.</div>

A disappointing model comparison can mean several things. A model can be too simple to learn useful structure, flexible enough to memorize a small sample, or learning a signal that does not answer the physical question. We tested those possibilities separately, keeping the existing data, spatial splits and review budget.

**Our strongest demonstrated problems are selective validation and missing complementary observations.** We do see a label-sensitive embedding and a weak sky fold. We do not establish clear global underfitting or uniform severe overfitting on these reused labels.

<h2 id="comparisons">Sixteen fixed comparisons, one review budget</h2>

All **19,328** parents remain: **27** positive chemistry proxies, **235** proxy negatives and **19,066 unknowns**. Unknown is not physically starless. The qualifying budget is exactly **18** reviews; all-parent review cost is **982** per method. AUC is the mean of within-fold comparisons, not pooled scores or a probability of youth.

<div class="sb-ledger sb-ranking-comparison" role="region" aria-label="All fixed ablations" tabindex="0" markdown="1">

| Fixed contrast | Train AUC | Spatial held-out AUC | Positive proxies /27 |
|:--|--:|--:|--:|
| embedding | 0.990 | 0.954 | 14 |
| linear | 0.992 | 0.971 | 14 |
| nonlinear | 0.998 | 0.973 | 15 |
| infrared embedding | 0.989 | 0.945 | 13 |
| physical | 0.968 | 0.938 | 13 |
| availability | 0.760 | 0.780 | 7 |
| infrared raw | 0.989 | 0.939 | 13 |
| no molecular | 0.989 | 0.939 | 13 |
| no temporal | 0.998 | 0.974 | 15 |
| molecular | 0.996 | 0.984 | 14 |
| latent only | 0.991 | 0.942 | 14 |
| embedding no masks | 0.991 | 0.957 | 14 |
| rank2 | 0.977 | 0.957 | 14 |
| rank12 | 0.996 | 0.965 | 15 |
| ridge01 | 0.999 | 0.954 | 13 |
| ridge10 | 0.966 | 0.936 | 12 |

</div>

Physical covariates alone recover **13/27**. Availability alone, with no measured values, recovers **7/27** and reaches held-out AUC **0.780**. That is a concrete warning about observation and label selection. It does not show that all measured signal is spurious.

Molecular-only inputs recover **14/27**, with AUC **0.984**. Their measurements and the withheld outcome flags come from the same telescope/catalogue. Hiding the target columns avoids direct field leakage; it does not make the two sources of evidence independent. This result cannot establish stellar youth, ownership or birth.

Removing the temporal view leaves the raw model at **15/27**. **None of the 27 positive proxies has the registered temporal input.** That does not mean variability is useless. This cohort does not test its intended contribution fairly.

<h2 id="fit">Are we overfitting or underfitting?</h2>

Embedding train/held-out AUC is **0.990/0.954**; raw nonlinear is **0.998/0.973**. Only one embedding fold has a gap of at least 0.10. Its train/held-out AUC is **0.993/0.880**. Test folds contain only **12, 3, 3, 7 and 2** positive proxies; the two perfect held-out folds contain just three and two positives.

More dimensions do not establish a solution. Rank two recovers **14**, rank twelve **15**, and the raw baseline already recovers **15**. We do not select rank twelve from reused outcomes. Weaker regularization raises apparent fit to AUC **0.999**, while held-out stays **0.954** and recovery drops to **13**. Stronger regularization lowers both and recovers **12**.

The embedding is sensitive to how many training labels it receives. On the same four eligible folds, moving from half to all training association components raises held-out AUC from **0.877 to 0.973**; the train/held gap shrinks **0.104**. Raw nonlinear improves only **0.010** on that paired comparison. One half-label fold has just two training positives and is explicitly invalid. It is retained in the evidence, not redrawn; this comparison consequently excludes the difficult fold with seven held-out positives.

This is one deterministic downstream label-count curve. The label-free representation and scaling stay fixed; we have not measured a full-pipeline training-size curve or repeated-subset uncertainty. The fixed diagnostic conventions return **mixed/inconclusive**, not a certificate against overfitting and not evidence of physical generalization.

<h2 id="controls">Controls and a numerical correction</h2>

Ten training-label shuffles within each sky tile give mean held-out AUC **0.524** for the embedding and **0.530** for raw nonlinear. They preserve tile prevalence and selection; they are sanity controls, not formal p-values or proof against every leakage path. No held-out label was shuffled.

An independent checker caught a subtle error: identical input vectors acquired tiny score differences from batch arithmetic, changing which tied rows entered a review list. We now score identical vectors once and use exact source IDs to break ties. The initial unverified availability result was **5/27**; the corrected, independently verified result is **7/27**. All original four methods' review lists stay unchanged. The failed attempts and post-read correction are preserved; no threshold, feature, label or model formula was tuned.

The full independent replay checks all identities, scores, selections, model fits, label subsets and controls. Guarded work, including failed attempts, took about **137 seconds** and kept at least **48.0 GiB** free. Memory sampling can miss brief peaks; the successful runs obey the fixed sampled-RSS ceiling. Four memory stops remain in the record.

<h2 id="next">The revised research target</h2>

**Establish incremental evidence beyond physical covariates and observation availability using independent, spatially held-out outcomes.** Before another fit, make a source-bound eligibility and adjudication ledger: ownership, usable complementary measurements, physical covariates and independent validation. Audit below-threshold sources as well as shortlisted ones; a shortlist cannot measure recall. Freeze a power and review-cost calculation before fixing the validation cohort.

The learned representation is unsupervised; the downstream proxy ranker is supervised. Dust emission and an embedded star can coexist. Association, proxy activity, physical youth, discovery and an observed stellar transition remain distinct claims.

If suitable validation or temporal support cannot be established within the next bounded week, the result should state that limitation. A larger architecture, a relaxed quality cut or another consumed-label win would not resolve it. The original ranking improvement gate and the earlier **333-of-800** control gate remain failed. The corrected NEOWISE quality/cadence support remains **0/3**. **No new star or birth is confirmed.**

<h2 id="evidence">Exact evidence and scope</h2>

This study was frozen after the earlier outcomes were already known. It is a retrospective diagnostic with disclosed implementation corrections, not fresh outcome-blind confirmation. All sixteen contrasts and negative findings are published; no winner is promoted.

Read [the complete report](/public/data/starbirth/ablation/results.md), [all contrasts](/public/data/starbirth/ablation/comparison.csv), [fold metrics, label curves and permutations](/public/data/starbirth/ablation/summary.json), and [exact source mappings, protocols, amendments, code and verification](/public/data/starbirth/ablation/README.md). Source revision: `a173e8ab187a11ea58b4e67f2c7293450b71cd52`.

[Earlier ranking and counterpart evidence](/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/). [The program and formation explorer](/astrophysics/2026/10/11/hidden-protostars-research-program/).

</div>
