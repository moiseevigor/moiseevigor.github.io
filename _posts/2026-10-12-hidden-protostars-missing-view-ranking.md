---
layout: distill
title: "A shared embedding did not beat the stronger baseline"
subtitle: >
  Equal review budgets gave 14 chemistry-positive recoveries for the embedding
  and 15 for the nonlinear baseline. The missing observations matter next.
date: 2026-10-12 20:40:00 +0200
categories: [astrophysics]
tags: [star-formation, unsupervised-learning, Hi-GAL, validation]
series: hidden-protostars
series_title: "Hidden protostars"
series_part: 3
permalink: /astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/
image: /public/img/posts/hidden-protostars-v2.svg
published: true
listed: false
comments: false
description: >
  A frozen missing-view embedding comparison, its failed improvement gate,
  all 19,328 source identities, and the observational gaps that remain.
---

<link rel="stylesheet" href="/public/css/starbirth-program.css?v=20261011">
<link rel="stylesheet" href="/public/css/starbirth-ranking.css?v=20261012-1">

<div class="l-body sb-program sb-ranking" markdown="1">

<div class="sb-status"><strong>Verified result · 12 October 2026.</strong> The shared embedding recovered <b>14 of 27</b> qualifying chemistry positives; the nonlinear baseline recovered <b>15 of 27</b>, at the same <b>18 reviews</b>. The frozen improvement gate failed. These are previously consumed chemistry proxies, not confirmed protostars. No physical precision, population recall or stellar birth is established.</div>

A representation can learn common patterns across surveys. The useful test is whether those patterns improve the decisions we make. Our first registered comparison learned from infrared emission, supported variability measurements and molecular-line features, retaining clumps that lack a view. **It did not demonstrate an improvement over the stronger tabular baseline.**

That result has a sharper limitation: **none of the 27 qualifying chemistry-positive cases has the registered temporal input view**. The learning procedure can handle a missing observation, but it cannot supply the absent observation. [Verified result](/public/data/starbirth/missing-view/results.md).

<nav class="sb-jump" aria-label="On this page"><a href="#equal-cost">The comparison</a><a href="#learning">What learned without labels</a><a href="#coverage">The coverage gap</a><a href="#unknowns">The unknown denominator</a><a href="#next-evidence">What would change the conclusion</a><a href="#evidence">Exact evidence</a></nav>

<h2 id="equal-cost">The same eighteen reviews</h2>

We retained all **19,328** nearby Hi-GAL clumps labelled catalogue-prestellar. Geometry and flag rules yielded a smaller evaluation cohort: **262** unambiguous clump/record associations, containing **27** qualifying chemistry positives and **235** qualifying proxy negatives. A positive means at least one of four withheld chemical tracers carries a well-detected flag. A proxy negative means all four carry non-detection flags; it does not prove the clump contains no protostar. Marginal flags, missing measurements and ambiguous ownership stay unknown.

<div class="sb-ledger sb-ranking-comparison" role="region" aria-label="Equal-cost consumed chemistry-proxy comparison" tabindex="0" markdown="1">

| Method | Reviews | Chemistry positives recovered |
|:--|--:|--:|
| **Shared missing-view embedding** | **18** | **14 / 27 · 51.85%** |
| Linear tabular baseline, same inputs | 18 | 14 / 27 · 51.85% |
| **Nonlinear tabular baseline, same inputs** | **18** | **15 / 27 · 55.56%** |
| Infrared-only embedding ablation | 18 | 13 / 27 · 48.15% |

</div>

The review rule was fixed before the new readout: select the highest-scoring **ceil(5% × cohort size)** in each held-out ten-degree sky tile, with exact designation strings breaking ties. Small tiles round up. The resulting **18 / 262 = 6.87%** budget is equal for all methods; it is not silently presented as exactly 5%.

The primary statistic is the smaller of the embedding's two recovery differences against the linear and nonlinear baselines. It was **−3.70 percentage points**, with a conditional paired spatial-bootstrap interval of **−11.11 to 0.00 points**. The frozen success rule required at least **+10 points** and a positive interval lower endpoint. It failed. The common-prediction, sample-count and bootstrap adequacy checks passed. [Complete readout](/public/data/starbirth/missing-view/starbirth-mvr-summary.json), [frozen decision rules](/public/data/starbirth/missing-view/protocol.md).

This is **no retrospective gain demonstrated**, not an equivalence result or a statement that every unsupervised method will fail. The percentages measure recovery of the selected chemistry proxies; they are not survey-wide protostar recall. The chemistry indicator has already been examined in historical work, and its labels remain consumed.

<h2 id="learning">What learned without class labels</h2>

The shared representation has six coordinates. It summarizes **28 input features**: far-infrared measurements and clump properties, available WISE colours, screened temporal behaviour and four non-withheld dense-gas line measurements. Missing entries have explicit masks. Training-only low-rank completion estimates a representation from the available columns; held-out observations do not fit the scaling, completion or basis.

**The embedding learns without class labels. The downstream ranker uses training-reference chemistry labels.** The whole assessment is therefore a retrospective proxy-ranking pipeline, with an unsupervised representation stage. The four evaluation tracer columns are excluded from embedding inputs. Input and outcome lines still share the same telescope and environment, so this separation does not establish statistical independence or physical truth.

The two comparators see the same raw measurements, missingness masks and reference labels. One is regularized linear logistic ranking; the other is nonlinear Gaussian kernel ranking. Mass, temperature, distance, surface density and diameter also enter the embedding ranker directly. An infrared-only embedding is a fixed diagnostic ablation, not a substitute primary chosen after seeing results.

Five spatial folds keep shared molecular positions and identical retained WISE anchors together. A one-degree longitude buffer separates training from nominal held-out tile intervals. All five models fitted, and all requested source scores are held out from their own training fold. Their six-dimensional coordinates are **fold-specific**, not one aligned global map. Scores are ranking values, not calibrated physical class probabilities. [Implementation and exact feature contract](/public/data/starbirth/missing-view/protocol.md), [independent reconstruction](/public/data/starbirth/missing-view/starbirth-mvr-verification.json).

This prototype uses an explicit low-rank completion procedure. It is not a deep network or a claim of a new dimensionality-reduction method. Missing-data subspaces have a long methodological history; [Roweis (1997)](https://papers.nips.cc/paper_files/paper/1997/hash/d9731321ef4e063ebbee79298fa36f56-Abstract.html) is relevant background, not a claim that our implementation reproduces its probabilistic algorithm.

<h2 id="coverage">Three qualifying cases have the temporal view. Zero is positive.</h2>

The support audit used fixed quality, positional-anchor and visit rules. In the full parent, **761** clumps have at least three supported anchored temporal visits spanning a year. Only **four** clumps have the registered far-IR/error, temporal and molecular views together; **three** meet the one-record/unshared molecular rule.

In the 262-object qualifying-proxy cohort, only **three** have supported temporal features. **None of those three is a qualifying chemistry positive.** All 27 positives lack that view. This comparison cannot establish a gain from complementary variability and molecular evidence in positive cases. The missing-view method retains the population, but the tested data do not contain that positive-case contrast.

Source matching also needed care. **32 of 308** molecular-supported parent clumps violate the simple one-record, unshared-position assumption at the frozen 30-arcsecond radius. Some positions have separate molecular velocity records; some have neighbouring Hi-GAL clumps. Every alternative remains in the edge ledger. A geometric nearest match is not proof that the emission belongs to the target clump. [Association report](/public/data/starbirth/missing-view/association-results.md), [complete alternatives](/public/data/starbirth/missing-view/molecular-edges.csv.gz).

The source catalogue describes those separate velocity components and the roughly 38-arcsecond molecular beam. WISE quality flags and quoted errors also leave important limitations: this cached subset lacks some positional and photometric reliability fields. [Rathborne et al., catalogue section 4](https://researchonline.ljmu.ac.uk/id/eprint/4139/1/MALT90_catalog.pdf), [official NEOWISE column descriptions](https://irsa.ipac.caltech.edu/data/WISE/docs/release/NEOWISE/expsup/sec2_1a.html).

<h2 id="unknowns">The full catalogue keeps the difficult denominator</h2>

Outside the qualifying chemistry cohort, **19,066 / 19,328** objects have unknown qualifying proxy status. Unknown is not a starless label. Every source retains its exact string identity, observed-view masks, proxy role and review flags in the [complete ranking ledger](/public/data/starbirth/missing-view/sources.csv.gz).

The separate all-requested review rule selects **982** clumps per method, about 5.08% after tile-wise rounding:

<div class="sb-ledger sb-ranking-denominator" role="region" aria-label="All-requested review burden including unknowns" tabindex="0" markdown="1">

| Method | Selected proxy positives | Selected proxy negatives | Selected unknowns |
|:--|--:|--:|--:|
| Shared embedding | 24 | 74 | **884** |
| Linear baseline | 27 | 122 | **833** |
| Nonlinear baseline | 26 | 87 | **869** |
| Infrared-only ablation | 23 | 61 | **898** |

</div>

Those unknowns stay in the review burden. Removing them would inflate an apparent precision. We have no physical class truth for the whole selected set and report **no physical precision or population recall**. A finite score outside the qualifying-proxy support domain is clearly marked outside that evaluation support. The source ledger is a catalogue for assessment, not a catalogue of discoveries.

<h2 id="next-evidence">What would change the conclusion</h2>

The next useful evidence route must establish **source ownership, complementary positive-case coverage and independent physical truth**. It needs known references, provisional candidates and unknowns kept separate, with a prospective rule before new readout. More scores on these same incomplete proxies would not establish the missing physical validation.

The earlier occurrence study remains unchanged: its **333-of-800 uncertainty gate failed**, its primary infrared comparison remains **unmeasured**, and the hypothetical 814-support independence scenario is unvalidated. The descriptive 9–25% estimator spread and 45–55% share scenarios are not confidence bounds or measured lifetimes. [Earlier control and uncertainty results](/astrophysics/2026/10/11/hidden-protostars-column-uncertainty/).

The physical birth question remains stricter than activity ranking. A new protostar interpretation needs ownership and physical evidence; a birth claim additionally needs a temporal transition that excludes an already-existing protostar, an accretion burst and instrumental alternatives. [Research program and formation explorer](/astrophysics/2026/10/11/hidden-protostars-research-program/#star-formation). **No new star, confirmed stellar birth or robust detector is established.**

<h2 id="evidence">Exact evidence and reproducibility</h2>

The independent checker reconstructed all raw feature values, masks, proxies, joins and splits. It replayed the completion by a different linear-algebra route and verified model equations, every source score and the full paired readout. This is independent software recomputation, not fresh physical validation or a separate human review. The original frozen methods and successful resource receipts remain downloadable.

The source packet comes from inspected research revision `6a44759b5a5948d9177335ef9a25b51d68ff9309`. It preserves the association audit's memory stop and separately frozen repair, the failed ranking-improvement gate, and all requested unknowns. These operational records support reproducibility; they do not count as discoveries. Execution stayed under its resource guards, with roughly 54 GiB free and about 4 MiB of comparison outputs.

Download the [packet guide](/public/data/starbirth/missing-view/README.md), [complete source inventory and hashes](/public/data/starbirth/missing-view/source-inventory.csv), [source-bound KG supplement](/public/data/starbirth/missing-view/starbirth-mvr-knowledge-supplement.json), [final checkpoint](/public/data/starbirth/missing-view/starbirth-mvr-checkpoint.json) and [independent verification](/public/data/starbirth/missing-view/starbirth-mvr-verification.json). The guide links all five fold models, feature arrays, unaligned coordinates, bootstrap, source code and association alternatives. Source-snapshot “unpublished” flags describe the state before this blog release; live publication is checked by a separate deployment receipt.

<div class="sb-return"><a href="/astrophysics/2026/10/11/hidden-protostars-research-program/">← Back to the Hidden protostars program</a></div>

</div>
