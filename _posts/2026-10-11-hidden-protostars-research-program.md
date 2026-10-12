---
layout: distill
last_modified_at: 2026-10-13
title: "Hidden Protostars: Failed Gates and Unresolved Counterparts"
subtitle: >
  A matched-control study fails its uncertainty gate, an embedding does not beat the stronger ranking baseline, and infrared alignments leave stellar identity unresolved.
date: 2026-10-11 12:00:00 +0200
categories: [astrophysics]
tags: [star-formation, infrared, Hi-GAL, inference]
series: hidden-protostars
series_title: "Hidden protostars"
series_part: 1
permalink: /astrophysics/2026/10/11/hidden-protostars-research-program/
image: /public/img/posts/hidden-protostars-v2.svg
published: true
comments: false
reference_style: bibliography
description: >
  Measured limits of dust-cloud controls and multi-survey ranking, with source-specific positional and colour evidence kept distinct from physical classification.
---

<link rel="stylesheet" href="/public/css/starbirth-program.css?v=20261011">
<link rel="stylesheet" href="/public/css/starbirth-formation.css?v=20261011-2">

<div class="l-body sb-program" markdown="1">

<div class="sb-status"><strong>Program updated · 12 October 2026.</strong> The first frozen missing-view ranking comparison is verified: the embedding recovered <b>14/27</b> qualifying chemistry positives, the nonlinear baseline <b>15/27</b>, at the same <b>18 reviews</b>. No retrospective gain was demonstrated. <a href="/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/">Read the comparison, coverage limits and full source ledger.</a> The first 19,328-clump inventory remains historical data readiness. The earlier control study also remains stopped: 939/1,000 profile matches, but only 333 pass the conservative uncertainty gate against 800. Its primary occurrence comparison remains unmeasured. <a href="/astrophysics/2026/10/11/hidden-protostars-column-uncertainty/">Read the failed control gate.</a> No confirmed stellar birth or validated birth detector has been established.</div>

Stars form inside clouds that hide the process from view. A patch of cold dust can look quiet while a compact object is already accreting material inside it. Our current question is observational and computational: **can infrared emission, variability and molecular evidence together rank embedded-protostar candidates better than simple physical features?** The earlier compact-source occurrence question remains unanswered after its frozen uncertainty gate failed.

<nav class="sb-jump" aria-label="On this page"><a href="#physics">The physics</a><a href="#star-formation">Explore formation</a><a href="#ledger">What we found</a><a href="#comparison">Why controls matter</a><a href="#week">Ranking and coverage</a><a href="#birth">Interpretation limits</a><a href="#sources">Sources &amp; evidence</a></nav>

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

The main positive result is the first row. It identifies a question worth investigating; it does not answer the physical membership question. The main negative lesson is that neither a red source nor a learned embedding repairs a mismatched comparison.

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

<h2 id="week">Multiple views: measured comparison and coverage</h2>

<h3 id="multisurvey">What the observed views support</h3>

**Data readiness · not a detector result.** A separately registered offline audit retains all **19,328** nearby catalogue-prestellar clumps, including missing views and unknown truth. An independently implemented checker reconstructed every ledger row and verified its byte bindings. That is reproducibility of the inventory, not independent physical validation.

| Retained record in the audited parent | Clumps | What it does not establish |
|:--|--:|:--|
| NEOWISE observation rows | **11,845** | Complete usable light curves or ownership of the emitter |
| WISE counterpart coordinates | **1,231** | Physical association with the clump |
| Both WISE coordinates and NEOWISE rows | **1,098** | Representative support for all requested clumps |
| Previously consumed MALT90 check | **303** | Fresh or definitive physical protostar labels |
| Previously consumed ALMAGAL check within this nearby parent | **52** | Birth truth from fragmentation |
| Both consumed molecular/core checks | **22** | Independent labels merely because surveys differ |

Requiring both retained WISE coordinates and NEOWISE rows would leave only **1,098 / 19,328 ≈ 5.7%** of this parent before quality and association checks. A complete-case model would change the population substantially. A useful method must handle missing views and report recovery for every requested object. Missing records are not verified physical non-detections.

The reviewed core already draws on Hi-GAL, AllWISE, NEOWISE, GLIMPSE, MIPSGAL, ATLASGAL, MMB, MALT90 and ALMAGAL. This is a count of nine main data streams, not nine independent sensors or full joint coverage. SPICY derives from Spitzer and PPMAP from Herschel. Evidence used as a model input cannot also serve as its allegedly independent evaluation truth without an explicitly separated design.

**Historical first-checkpoint scope: no fresh physical-truth cohort was supplied in that bounded audit. No model was fitted.** Existing catalogue-stage checks, chemistry and fragmentation outcomes have already been inspected; changing their spatial split does not make them untouched validation. Cutout file presence also does not establish calibrated fluxes, native resolution or noise. Full uncertainty and source-association contracts remain necessary.

Download the [complete exact-ID ledger (gzip CSV)](/public/data/starbirth/multisurvey/sources.csv.gz), [verified report](/public/data/starbirth/multisurvey/results.md), [independent verification](/public/data/starbirth/multisurvey/starbirth-mv-verification.json) and [source inventory](/public/data/starbirth/multisurvey/source-inventory.csv). These exact source bytes come from research revision `a1c389e90dde1aeb7539bc314ffa21963f551dbe`. The original failed checker stopped before reading data because its pandas dependency was absent; its attempt and the separately frozen dependency-free repair are preserved in the evidence packet. [Packet guide](/public/data/starbirth/multisurvey/README.md).

<ol class="sb-plan">
  <li><b>Audit support and identities.</b> The first source-ledger checkpoint is complete. Verify native flux/error, PSF, epoch and competing-counterpart evidence before treating a projected match as the same physical source.</li>
  <li><b>Freeze one comparison.</b> Specify the exact cohort, missing-view treatment, association rules, training/calibration/evaluation roles, review budget and decision criteria before outcome readout. Without fresh physical truth, label any comparison retrospective feasibility.</li>
  <li><b>Learn complementary views.</b> Use reliable associations to learn without class labels. Preserve fluxes, errors and upper limits alongside morphology; retain cases that lack one view. The separately frozen missing-view fit has now been verified; it did not demonstrate an improvement over the nonlinear baseline.</li>
  <li><b>Challenge the apparent gain.</b> Compare against mass, temperature, distance, surface density, colours and variability on equal support and review cost. Keep single-view ablations, spatial uncertainty and unknown denominators.</li>
  <li><b>Conclude with the supported scope.</b> Report a positive, null or insufficient-evidence result. If justified, prepare at most 20 source-specific review cards. Candidates, catalogue counterparts and confirmed births remain different categories.</li>
</ol>

<h3 id="ranking-result">First ranking result: the stronger baseline recovered one more</h3>

A prospectively frozen retrospective comparison now gives **14/27** qualifying chemistry-positive recoveries for the shared embedding, **14/27** for the linear comparator, **15/27** for the nonlinear comparator and **13/27** for the infrared-only ablation, all at **18 reviews**. The minimum paired gain is **−3.70 percentage points**, with a conditional spatial interval **−11.11 to 0.00**; the required +10-point gain and positive lower endpoint failed. These are consumed chemistry proxies, not independent physical truth or population recall.

All **19,328** requested source identities remain in the ranking ledger, including **19,066** unknown qualifying proxies. Only three qualifying cases have supported temporal inputs, and **none of the 27 positives** does. Source ownership, complementary positive-case coverage and independent physical validation remain absent. [Read the full result and exact evidence](/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/).

A separately frozen diagnosis now finds query-level cadence in only **3 / 27** of those positives, below its **14-of-27** majority gate. Eleven have no cached rows, nine no screened query rows and four insufficient cadence; the remaining three still lack emitter identity. The anchor is only part of the evidence gap. [Read the exact diagnosis](/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/#temporal-diagnosis). This is no repair of the ranking result and no physical detector validation.

A native GLIMPSE check now adds one concrete positional lead: an already catalogued source matches **21 / 21** supported visit medians within **0.168–0.336 arcseconds**, despite lying **5.719 arcseconds** from the clump centre. Its PSF-photometry adjustment flags fail the frozen all-zero rule; **zero of three** cases passes every criterion. This is useful source-association evidence with unknown physical stage, not a repaired ranking result or a birth. [Inspect all three source assessment cards and the failed gate](/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/#native-counterparts).

The same fixed counterparts now have an independently checked colour diagnosis: measured [3.6]−[4.5] colours are **−0.089, +0.134 and −0.011 mag**. None supplies robust necessary red-colour support under the declared published component, and all three lack usable 8-micron photometry for the full four-band method. The 21/21 positional lead is real; youth remains unknown. Our clump chemistry ranks are not probabilities for that point source's evolutionary stage. [Read the comparator and source assessment](/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/#irac-colours).

The native radio-position check now separates regional activity from a specific infrared point: historical maser **330.878-0.367** is **12.520″** from the first clump centre but **17.501″** from its best infrared counterpart. **0/3** fixed best points and **0/6** alternatives have a catalogue maser within the frozen one-arcsecond criterion. This limits point-specific interpretation; it does not establish starlessness, clump membership or a birth. [Read the radio context and coverage limit](/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/#radio-context).

The fixed first-field gas–radio comparison adds only **0.1970 km/s** of common velocity-band overlap. The literal criterion passes, but the declared **+1 km/s sensitivity removes overlap**; maser peaks lie outside both gas bands. This is marginal regional context, not confirmed membership or support for the infrared point. All earlier failed gates remain. [Read the measured bands, failed sensitivity and metadata correction](/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/#gas-velocity).

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

<script src="/public/js/starbirth-program.js?v=20261011" defer></script>
<script src="/public/js/starbirth-formation.js?v=20261011-2" defer></script>
