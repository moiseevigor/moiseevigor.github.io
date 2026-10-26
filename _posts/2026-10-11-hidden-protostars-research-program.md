---
layout: distill
last_modified_at: 2026-10-26
title: "Hidden Protostars: Survey Evidence and Its Limits"
subtitle: >
  Infrared counterparts identify a useful search population. What can multiple surveys establish about the objects hidden inside dust clumps?
date: 2026-10-11 12:00:00 +0200
categories: [astrophysics]
tags: [star-formation, infrared, Hi-GAL, inference]
series: hidden-protostars
series_title: "Hidden protostars"
series_part: 1
permalink: /astrophysics/2026/10/11/hidden-protostars-research-program/
image: /public/img/posts/hidden-protostars-1.svg
result: '2,465 infrared counterparts · 12.8% of 19,219 clumps'
published: true
comments: false
reference_style: bibliography
description: >
  Measured limits of dust-cloud controls and multi-survey ranking, with source-specific positional and colour evidence kept distinct from physical classification.
---

<link rel="stylesheet" href="/public/css/starbirth-program.css?v=20261026">
<link rel="stylesheet" href="/public/css/starbirth-formation.css?v=20261011-2">

<div class="l-body sb-program" markdown="1">

<div class="sb-status"><strong>Current conclusion.</strong> Infrared catalogue associations identify a useful follow-up population. Physical clump membership, the hidden-protostar fraction and a reliable detector remain unestablished. <a href="#results">Explore the measured results.</a></div>

A cold dust clump can hide an accreting protostar. Finding one requires connecting evidence at different wavelengths, angular resolutions and epochs—and checking that the observations belong to the same physical system.

**Our research question is whether a general cross-survey representation can make that search more comprehensive and efficient.** Specialized physical methods provide interpretation and refinement. Learned integration must show useful retrieval, coverage, transfer or review-cost gains against simple joins using the same data. A richer embedding alone is not a result.

<nav class="sb-jump" aria-label="On this page"><a href="#results">Results</a><a href="#program">Research question</a><a href="#physics">The physics</a><a href="#star-formation">Explore formation</a><a href="#comparison">Why controls matter</a><a href="#week">Detailed studies</a><a href="#sources">Sources &amp; evidence</a></nav>

{% include starbirth-results.html %}

<h2 id="program">What a general cross-survey method could contribute</h2>

The goal is to connect far-infrared dust emission, mid-infrared sources, molecular gas and time-domain observations without forcing them into a one-source-per-clump table. A clump may contain several cores; a beam can blend several emitters; a missing measurement can mean no coverage, poor sensitivity or an unresolved source.

A useful method would retrieve complementary evidence across surveys, preserve uncertain associations, and transfer to other sky regions or epochs. We will compare learned representations with non-learned integration of the same inputs. Better coverage or lower review cost could be valuable even where a specialized physical method is more accurate. These are research hypotheses: an independently validated benefit has not yet been demonstrated.

Physical confirmation is a separate step. Candidate ranking, source membership, stellar youth and the observation of a birth need different evidence. The [fixed ablations](/astrophysics/2026/10/14/hidden-protostars-ablation/) explain why independent outcomes and usable complementary views matter before another fit.

<h2 id="physics">What is born, and what a telescope sees</h2>

In the standard picture of low-mass star formation, gravity contracts a dense molecular core. Radiation initially carries away much of the heat; increasing opacity then allows a pressure-supported **first hydrostatic core** to form. At sufficiently high central temperatures, molecular hydrogen dissociation enables a second collapse and formation of a **second hydrostatic core**, the nascent protostar. This program uses that second-core formation as its physical definition of birth. It precedes sustained main-sequence hydrogen burning. Rotation, magnetic fields and radiative transfer affect the detailed predictions; a simple sequence is not a complete model for every massive clump. [Young (2023)](https://arxiv.org/abs/2312.03039), [Ahmad et al. (2023)](https://arxiv.org/abs/2310.01516).

</div>

<div class="l-page sbf-wide">
{% include starbirth-formation.html %}
</div>

<div class="l-body sb-program" markdown="1">

A telescope measures radiation escaping through the envelope, rather than the central state directly. In the models discussed by Young, second-core formation need not cause an immediate, distinctive change in the emerging spectrum. A brightening can also be an accretion burst from an older protostar. **A new infrared appearance does not uniquely date a birth.** [Young (2023), §4.1](https://arxiv.org/abs/2312.03039).

There is also a scale distinction. A **clump** can contain several smaller cores and sources. In the Hi-GAL catalogue, “prestellar” is an operational label for a gravitationally bound, starless candidate without a detected 70 μm counterpart. A survey non-detection depends on depth, background and resolution; it cannot guarantee that every embedded object is absent. Dust and stars are consequently not mutually exclusive classes. [Elia et al. (2017)](https://academic.oup.com/mnras/article/471/1/100/3868791), [Elia et al. (2021)](https://academic.oup.com/mnras/article/504/2/2742/6228892).

This is already supported by targeted observations: Traficante and colleagues found faint 24 μm sources in half of a selected sample of 18 massive, 70 μm-quiet clumps. That small, selected sample does not determine the fraction in all nearby Hi-GAL clumps. [Traficante et al. (2017)](https://academic.oup.com/mnras/article/470/4/3882/3865141).

<h2 id="ledger">What survived the research review</h2>

The following are **our historical measurements and checks**, reviewed through 8 October 2026. They are not results of the stopped matched-control study or the new multi-survey ranking program. Each row links to a compact source snapshot; the [evidence inventory](/public/data/starbirth/source-inventory.csv) records original paths, byte counts, hashes and the source revision.

<details class="sb-history" markdown="1">
<summary>Full historical findings and exact sources</summary>

<div class="sb-ledger" role="region" aria-label="Reviewed findings" tabindex="0" markdown="1">

| Result | What it supports | What remains unresolved |
|:--|:--|:--|
| **2,465 / 19,219 = 12.8%** of nearby catalogue-prestellar clumps have a 22/24 μm counterpart. **230 / 2,465 = 9.3%** match SPICY candidate YSOs, against **63 / 16,754 = 0.38%** in the remainder. [E15 evidence](/public/data/starbirth/starbirth-e15.json) | A useful population for investigating embedded activity. | A projected counterpart is not established clump membership. SPICY contains candidate YSOs and uses infrared information; this enrichment is corroboration, not independent birth truth. |
| Offset-based estimators span approximately **9–25%**; corrected-share scenarios span **45–55%**. [Reviewed replay](/public/data/starbirth/starbirth-core-verification.json) | Strong sensitivity to estimator and control choices. | These ranges are descriptive scenarios, not confidence bounds, a measured hidden-protostar fraction, or physical lifetimes. |
| CLIP image scores showed **no demonstrated increment** beyond mass, temperature, surface density and distance in two external checks. [E27](/public/data/starbirth/starbirth-e27.json), [E28](/public/data/starbirth/starbirth-e28.json) | A reason to require simple physical baselines. | This does not rule out every future image representation. |
| The 19,219-clump W2 turn-on search retained **zero birth events**: its four detections were pre-existing YSO outbursts. [Reviewed evidence](/public/data/starbirth/core-conclusion.md) | A tested distinction between variability and birth. | Absence of retained W2 events does not exclude births too obscured or faint to detect. |
| N20 failed its empirical identity gate; an exact counterexample also showed that distinct hidden fractions can give identical indicators when dependence is allowed. [N20 report](/public/data/starbirth/n20-results.md) | Additional tracers need justified identification assumptions. | No complete joint-support matrix or physical fraction was fitted. |
| The separate c6828 source-association study found **one eligible local reference where two were required**. [c6828 report](/public/data/starbirth/c6828-results.md) | A reproducible insufficient-evidence stopping decision. | No source-separation fit or physical birth conclusion was produced. |

</div>

</details>

The strongest positive evidence here is the first row: a defined infrared-associated population with SPICY enrichment. Neither the catalogue association nor a red colour establishes physical membership.

<h2 id="comparison">The sky is not a neutral background</h2>

Dust can redden an unrelated background star. Crowding can blend neighbours into one apparent source. Bright nebulosity changes which faint objects a catalogue detects. A control placed 60 arcseconds away can encounter less dust than the clump centre. An excess against that control can mix embedded activity with these environmental differences.

<figure class="sb-demo" id="sb-control-demo">
  <div class="sb-kicker">Illustration · invented values, not survey measurements</div>
  <h3>The same clump count, a different comparison</h3>
  <p>Keep the illustrative clump occurrence at 20%. Move the control occurrence to see how the apparent excess changes.</p>
  <label for="sb-control">Control sightlines with a compact source: <output id="sb-control-value" for="sb-control">8%</output></label>
  <input type="range" id="sb-control" min="0" max="25" step="1" value="8">
  <div class="sb-bar-row"><span>Clump sightlines</span><div class="sb-track"><span class="sb-bar sb-on"></span></div><b>20%</b></div>
  <div class="sb-bar-row"><span>Control sightlines</span><div class="sb-track"><span class="sb-bar sb-off" id="sb-control-bar"></span></div><b id="sb-control-percent">8%</b></div>
  <div class="sb-demo-result" aria-live="polite" aria-atomic="true" id="sb-delta">Apparent excess: +12 percentage points.</div>
  <figcaption>Bars share a 0–25% scale. The arithmetic is Δ = occurrence at clumps − occurrence at controls. This example supplies no uncertainty interval or estimate of a hidden-protostar fraction. Matching is an attempt to make the comparison credible, not proof that every confounder disappears.</figcaption>
  <noscript><p>The initial example is 20% − 8% = 12 percentage points. Enable JavaScript to vary the control.</p></noscript>
</figure>

We need column-density evidence **at both positions**, not just the clump's catalogue surface density. PPMAP provides model-derived Hi-GAL column maps and corresponding uncertainties at 12-arcsecond resolution. Their dust-opacity and radiative-transfer assumptions remain relevant. MIPSGAL provides catalogue and completeness products useful for checking mid-infrared sensitivity. Column profiles have now been independently checked for the frozen sample, but uncertainty support failed and sensitivity/crowding suitability remains unestablished. [Current evidence](/astrophysics/2026/10/11/hidden-protostars-column-uncertainty/). [Marsh et al. (2017)](https://arxiv.org/abs/1707.03808), [IRSA MIPSGAL documentation](https://irsa.ipac.caltech.edu/data/SPITZER/MIPSGAL/).

<h2 id="week">Measured ranking and observational support</h2>

<span id="multisurvey"></span>

<h3 id="ranking-result">The embedding did not beat the stronger baseline</h3>

At the same **18 reviews**, the shared embedding recovered **14/27** qualifying chemistry positives, the linear baseline **14/27**, the nonlinear baseline **15/27** and the infrared-only ablation **13/27**. The frozen benefit gate failed. This is a retrospective chemistry-proxy comparison, not physical protostar recall. All **19,328** requested identities and **19,066** unknown proxies remain in the ledger. None of the 27 positives has the registered temporal view. [Comparison and support limits](/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/).

The later native-quality check likewise fails: **0/3** fixed counterparts pass the quality/cadence gate, below the required **2/3**. Correcting the flag-format contract adds no accepted measurements. This failure concerns the fixed observational criteria; it does not demonstrate physical starlessness. [Current quality result](/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/#flag-repair), [original contract evidence](/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/#native-quality).

One known infrared source agrees with **21/21** query-visit medians, but positional agreement does not establish emitter ownership, clump membership or stellar youth. The <a href="/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/#irac-colours">colour</a>, <a href="/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/#radio-context">radio</a> and <a href="/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/#gas-velocity">gas</a> probes add no confirmed physical classification. Their final outcomes and retained alternatives are in the [source assessment](/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/#native-counterparts). No confirmed stellar birth follows.

**14 October ablation:** sixteen fixed contrasts do not establish clear underfitting or uniform severe overfitting on consumed proxies. The embedding remains 14/27 versus raw nonlinear 15/27; availability alone recovers 7/27 and no positive proxy has temporal support. Independent validation and coverage now take priority over model capacity. [Read every contrast, learning-curve limitation and numerical correction](/astrophysics/2026/10/14/hidden-protostars-ablation/).

**Independent-evidence cohort (14 October snapshot):** a frozen 223-clump sample includes agreements, disagreements and sources selected by neither method. In that published snapshot, zero had certified independent truth or retained molecular support. It documents the validation design; it does not establish present physical membership. [The cohort and its limits](/astrophysics/2026/10/14/hidden-protostars-ablation/#validation-cohort).

<details markdown="1">
<summary>Data coverage and retained history</summary>

The original offline inventory preserves all **19,328** requested clumps and every missing view. **No model was fitted.** This describes the initial inventory audit, before the later ranking study. Data readiness is not a detector result. [Exact historical inventory, source revision and coverage counts](/public/data/starbirth/multisurvey/README.md).

The subsequent query-level cadence diagnosis has only **3/27** supported positive references against a required **14/27**; query-level support does not assign emission to a single source. [Temporal coverage and ownership limits](/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/#temporal-diagnosis). The model's stricter registered temporal input remains absent from all 27 positive proxies.

</details>

<h3 id="historical-week">The original control study: frozen and stopped</h3>

<blockquote class="sb-goal">Determine whether nearby Hi-GAL clumps labelled prestellar and undetected at 70 μm contain an excess of compact mid-infrared sources compared with sightlines matched for dust column, sensitivity and crowding.</blockquote>

The frozen study drew 1,000 clumps without reading the infrared outcome. Profile matches were available for **939**, but only **333** met the conservative uncertainty bound at both positions, below the required **800**. The primary compact-source excess remains **unmeasured**. This failure is an insufficient-evidence outcome, not a measured null; the later ranking experiment does not repair it. [Frozen protocol](/public/data/starbirth/matched-control/protocol.md), [counts and uncertainty diagnosis](/astrophysics/2026/10/11/hidden-protostars-column-uncertainty/).

<h2 id="birth">What the findings do not establish</h2>

A positional counterpart is not automatically the source of the measured emission, a clump member or a young star. Chemistry-proxy ranking is not physical classification. No observed temporal transition has been shown to exclude an already-existing protostar, an accretion burst, extinction or an instrumental change. Consequently these results establish no new star, confirmed stellar birth or independently validated birth detector.

<h2 id="sources">Sources and reproducibility</h2>

The theoretical account draws on the linked collapse review and simulations; the catalogue definitions come from the Hi-GAL papers. [SPICY's primary paper](https://arxiv.org/abs/2011.12961) explains why its entries are candidate YSOs. These published sources establish context; the project measurements above remain author research results, not independently peer-reviewed discoveries.

Download the [evidence inventory](/public/data/starbirth/source-inventory.csv), the [scope and provenance note](/public/data/starbirth/README.md), or inspect the [program source and checks](https://github.com/moiseevigor/moiseevigor.github.io/tree/master/research/starbirth). The snapshot binds compact original outputs to research revision `3ae8c22bbd4bf73c68074e0cc44d63094c509e0e`; it is not a backup of the bulk survey inputs. The reviewed limitations are preserved beside the positive findings.

<p class="sb-return"><a href="/lab/">← All research programs</a></p>

</div>

<script src="/public/js/starbirth-program.js?v=20261026" defer></script>
<script src="/public/js/starbirth-formation.js?v=20261011-2" defer></script>
