---
layout: distill
title: "Why matching dust clouds needs an error model"
subtitle: >
  We found possible profile matches for 939 clumps. Only 333 pass the frozen
  uncertainty gate. The difference tells us what to investigate next.
date: 2026-10-11 20:00:00 +0200
categories: [astrophysics]
tags: [star-formation, infrared, Hi-GAL, uncertainty]
series: hidden-protostars
series_title: "Hidden protostars"
series_part: 2
permalink: /astrophysics/2026/10/11/hidden-protostars-column-uncertainty/
image: /public/img/posts/hidden-protostars.svg
published: true
comments: false
description: >
  A verified control-support failure and a separate covariance diagnosis:
  why dust-column error assumptions matter before counting embedded sources.
---

<link rel="stylesheet" href="/public/css/starbirth-program.css?v=20261011-2">

<div class="l-body sb-program" markdown="1">

<div class="sb-status"><strong>Verified progress · 11 October 2026.</strong> Data access is repaired. The registered uncertainty gate failed: 333 of 1,000 clumps qualify, against a required 800. The infrared occurrence comparison remains unmeasured. No stellar birth or validated detector is established.</div>

Before counting young stars inside dark clouds, we need a credible background comparison. Our [research program](/astrophysics/2026/10/11/hidden-protostars-research-program/) asks whether apparently prestellar Hi-GAL clumps contain more compact mid-infrared sources than dusty sightlines with comparable observing conditions. Today's result concerns **whether we can build those controls**, rather than the source excess itself.

The study froze a nearby parent of **19,328 clumps**, a buffered survey domain of **10,136**, and an outcome-blind draw of **1,000**. These are new-study denominators; the historical 19,219-clump result remains a separate cohort. Every requested identity and failure is retained in the [1,000-row support table](/public/data/starbirth/matched-control/profile-support.csv). [Frozen protocol](/public/data/starbirth/matched-control/protocol.md), [registration](/public/data/starbirth/matched-control/starbirth-mc-registration.json).

<nav class="sb-jump" aria-label="On this page"><a href="#gates">The measured gates</a><a href="#errors">Why errors add differently</a><a href="#scenarios">The diagnosis</a><a href="#cache-audit">The cache audit</a><a href="#next">What comes next</a><a href="#evidence">Evidence</a></nav>

<h2 id="gates">The controls mostly match. Their uncertainty does not.</h2>

The column maps supply a way to compare dust along both sightlines. Matching only the central pixel is insufficient: the study also compares thirteen-point profile summaries. Independently replaying the native pixels gave the following results. These are possible controls; sensitivity, crowding and final balance have not been certified.

<div class="sb-ledger" role="region" aria-label="Measured control gates" tabindex="0" markdown="1">

| Necessary gate | Clumps with a possible control | Interpretation |
|:--|--:|:--|
| Central dust column | **941 / 1,000** | A central-pixel match is usually available. |
| Central column and profile summaries | **939 / 1,000** | Matching the local profile removes two more targets; 12,648 possible pairs remain. |
| Both arms satisfy the frozen uncertainty bound | **333 / 1,000** | Fails the minimum of **800**. The primary source comparison must stop. |

</div>

[Native gate output](/public/data/starbirth/matched-control/starbirth-mc-profile-gate.json), [independent verification](/public/data/starbirth/matched-control/starbirth-mc-profile-verification.json). The verifier decoded complete saved responses and reconstructed the sky geometry separately. Verification of these counts does not establish a physical excess.

This is an **insufficient-evidence result**, not a measured null. We have not opened the new infrared source rows or estimated a clump-minus-control occurrence difference. Selecting just the 333 survivors or loosening the error threshold after seeing this failure would change the original question.

<h2 id="errors">A dust column is a sum—with correlated errors</h2>

PPMAP separates the inferred column into twelve temperature bins. Their columns add to a total, but their errors need not behave independently. The published method obtains marginal posterior uncertainties from the diagonal of an inverse curvature matrix; an independent prior does not establish independent posterior bins. The Hi-GAL release describes uncertainty cubes for differential columns and distinguishes random errors from systematic calibration and opacity errors. [Marsh et al. (2015), equations 15–16](https://arxiv.org/html/1509.08699v1), [Marsh et al. (2017)](https://arxiv.org/html/1707.03808v1).

Think of adding twelve measurements. If their errors vary independently, some fluctuations cancel. If the errors move together, adding the measurements also adds their errors. Marginal standard deviations alone do not tell us which situation applies. We need the correlations to compute the uncertainty of the total.

The frozen gate used the conservative bound **sum of bin standard deviations / total column ≤ 0.30** at both positions. That bound allows arbitrary bin covariance, conditional on the marginal errors being valid. It does not include the omitted systematic effects.

<h2 id="scenarios">A separately registered diagnostic</h2>

After seeing the failed gate, we froze a distinct offline diagnosis: keep the same targets, profile pairs and 0.30 threshold, but examine five hypothetical common correlations between temperature-bin errors. This is explicitly a **post-read diagnostic**, not the preregistered primary comparison and not an estimate of the actual correlations.

For bin standard deviations σ and common correlation ρ, the illustrative model gives

$$\operatorname{Var}(N)= (1-\rho)\sum_i\sigma_i^2 + \rho\left(\sum_i\sigma_i\right)^2.$$

The independent check used full positive-semidefinite 12 × 12 covariance matrices and the quadratic form for the summed column, rather than this reduced formula.

<div class="sb-ledger" role="region" aria-label="Hypothetical covariance scenarios" tabindex="0" markdown="1">

| Hypothetical bin correlation ρ | Clumps with a possible qualifying control | Against the required 800 |
|--:|--:|:--|
| **0 · independent** | **814 / 1,000** | Clears the numerical threshold only under this unvalidated assumption. |
| 0.25 | 650 / 1,000 | Below threshold. |
| 0.50 | 514 / 1,000 | Below threshold. |
| 0.75 | 418 / 1,000 | Below threshold. |
| **1 · conservative bound** | **333 / 1,000** | Reproduces the failed original gate. |

</div>

[Diagnostic rules](/public/data/starbirth/matched-control/covariance-protocol.md), [scenario output](/public/data/starbirth/matched-control/starbirth-mc-covariance-diagnostic.json), [independent matrix replay](/public/data/starbirth/matched-control/starbirth-mc-covariance-verification.json).

The useful finding is that **control support depends strongly on the error model**. The 814 figure supplies no permission to assume independence. These rows are descriptive scenarios, not confidence bounds, fitted correlations, counts of embedded stars, or certified final controls. Under the original bound, 568 profile-supported targets fail their own error limit; another 38 have acceptable target error but lack an acceptable control.

<h2 id="cache-audit">What the cached error products actually supply</h2>

A subsequent, separately frozen offline audit verified **125 distinct cached native files**: 65 integrated-column headers and 60 uncertainty-cube headers. The uncertainty headers contain a dilution parameter (`ETA=10`), but the inspected products do not provide a full temperature-bin covariance or the response/noise information needed to validate it. This describes the inspected cache, not every possible archive product. [Audit report](/public/data/starbirth/covariance-audit/results.md), [frozen scope](/public/data/starbirth/covariance-audit/protocol.md).

We also checked a narrower mathematical shortcut: does a nonnegative emission response alone guarantee that errors added in quadrature overestimate the error of the sum? **No.** A preconstructed positive-definite three-variable example has summed variance 182/101 and diagonal-only variance 152/101. Independent exact-rational methods agree. This is a generic linear-model counterexample, not an actual Herschel response, a measured correction for these clumps, or a failure of PPMAP.

The result strengthens the need for a validated integrated-column uncertainty product or a source-bound covariance calculation reproducing the released marginal errors. Neither the known prior metadata nor the hypothetical 814 count unlocks the primary readout. [Exact certificate and cache inventory](/public/data/starbirth/covariance-audit/starbirth-covariance-audit.json), [independent verification](/public/data/starbirth/covariance-audit/starbirth-covariance-verification.json), [source bindings](/public/data/starbirth/covariance-audit/source-inventory.csv).

<h2 id="next">The next target is the total-column uncertainty</h2>

The immediate task is to establish whether a defensible total-column uncertainty or covariance model can be obtained for this population. Any new model and validation rule must be frozen before its readout; the failed primary gate remains in the record. If that information cannot be justified, the occurrence comparison stays unresolved. Embeddings cannot supply the missing error model or physical truth.

The earlier technical block is also preserved: the archive returned an entire file instead of the first requested profile ranges, so that attempt stopped without accepting the body. The user then authorized continuation. A registered transport repair coalesced adjacent requested bytes without reading additional pixels, preserving the sample, scientific thresholds and cumulative acquisition caps. That enabled the verified gate above. [Original stopped attempt](/public/data/starbirth/matched-control/historical-first-attempt.md), [original response stop](/public/data/starbirth/matched-control/starbirth-mc-historical-profile-stop.json), [repair record](/public/data/starbirth/matched-control/starbirth-mc-range-amendment.json).

The resumed acquisition used 3,685 cumulative requests and 29,761,115 response-body bytes, with about 339 seconds of acquisition time. The scientific stage occupies about 23 MiB and retained about 51 GiB free disk at verification. These are operational accounting, not discoveries. Complete native responses remain local; the public evidence is compact.

We still have no confirmed stellar birth, physical hidden-protostar fraction, lifetime measurement or population-level detector precision/recall. What changed today is our understanding of the comparison's limiting evidence.

<h2 id="evidence">A reproducible, bounded record</h2>

The [source inventory](/public/data/starbirth/matched-control/source-inventory.csv) binds twelve byte-identical files to research revision `b0bbc8d89e06cfa812a5b91e5d863b7355750bd9`. The [results report](/public/data/starbirth/matched-control/results.md) retains the success, failure and interpretation limits together. Native inputs are hash-bound in those records but are not copied into the blog. The original producer receipt says verification was pending when emitted; its linked later independent receipt records completion.

This public update is separate from the restricted private Atlas. Earlier failed studies, the historical gallery and the original formation explorer are preserved. [Explore the stages of star formation](/astrophysics/2026/10/11/hidden-protostars-research-program/#star-formation).

<p class="sb-return"><a href="/astrophysics/2026/10/11/hidden-protostars-research-program/">← Research program and formation explorer</a> · <a href="/lab/">All research programs</a></p>

</div>
