---
layout: distill
title: "Hidden protostars: a research program"
subtitle: >
  A dark dust clump can already contain a young star. What can survey data
  actually tell us—and what would it take to observe a stellar birth?
date: 2026-10-11 12:00:00 +0200
categories: [astrophysics]
tags: [star-formation, infrared, Hi-GAL, inference]
series: hidden-protostars
series_title: "Hidden protostars"
series_part: 1
permalink: /astrophysics/2026/10/11/hidden-protostars-research-program/
image: /public/img/posts/hidden-protostars.svg
published: true
comments: false
reference_style: bibliography
description: >
  The physics of embedded star formation, a reviewed results ledger, and a
  seven-day matched-control study of nearby Hi-GAL prestellar clumps.
---

<link rel="stylesheet" href="/public/css/starbirth-program.css?v=20261011">
<link rel="stylesheet" href="/public/css/starbirth-formation.css?v=20261011-1">

<div class="l-body sb-program" markdown="1">

<div class="sb-status"><strong>Program opened · 11 October 2026.</strong> Historical results are separated from the proposed seven-day comparison. No confirmed stellar birth or validated birth detector has been established by this project. The new comparison has not yet been measured.</div>

Stars form inside clouds that hide the process from view. A patch of cold dust can look quiet while a compact object is already accreting material inside it. Our immediate question is therefore observational: **do apparently prestellar clumps contain more compact mid-infrared sources than comparable dusty sightlines?**

The eventual ambition is a detector of physical stellar births across large surveys. The next useful step is smaller: establish what the present data can distinguish before asking a machine-learning model to classify it.

<nav class="sb-jump" aria-label="On this page"><a href="#physics">The physics</a><a href="#star-formation">Explore formation</a><a href="#ledger">What we found</a><a href="#comparison">Why controls matter</a><a href="#week">The seven-day test</a><a href="#birth">From activity to birth</a><a href="#sources">Sources &amp; evidence</a></nav>

<h2 id="physics">What is born, and what a telescope sees</h2>

In the standard picture of low-mass star formation, gravity contracts a dense molecular core. Radiation initially carries away much of the heat; increasing opacity then allows a pressure-supported **first hydrostatic core** to form. At sufficiently high central temperatures, molecular hydrogen dissociation enables a second collapse and formation of a **second hydrostatic core**, the nascent protostar. This program uses that second-core formation as its physical definition of birth. It precedes sustained main-sequence hydrogen burning. Rotation, magnetic fields and radiative transfer affect the detailed predictions; a simple sequence is not a complete model for every massive clump. [Young (2023)](https://arxiv.org/abs/2312.03039), [Ahmad et al. (2023)](https://arxiv.org/abs/2310.01516).

{% include starbirth-formation.html %}

A telescope measures radiation escaping through the envelope, rather than the central state directly. In the models discussed by Young, second-core formation need not cause an immediate, distinctive change in the emerging spectrum. A brightening can also be an accretion burst from an older protostar. **A new infrared appearance does not uniquely date a birth.** [Young (2023), §4.1](https://arxiv.org/abs/2312.03039).

There is also a scale distinction. A **clump** can contain several smaller cores and sources. In the Hi-GAL catalogue, “prestellar” is an operational label for a gravitationally bound, starless candidate without a detected 70 μm counterpart. A survey non-detection depends on depth, background and resolution; it cannot guarantee that every embedded object is absent. Dust and stars are consequently not mutually exclusive classes. [Elia et al. (2017)](https://academic.oup.com/mnras/article/471/1/100/3868791), [Elia et al. (2021)](https://academic.oup.com/mnras/article/504/2/2742/6228892).

This is already supported by targeted observations: Traficante and colleagues found faint 24 μm sources in half of a selected sample of 18 massive, 70 μm-quiet clumps. That small, selected sample does not determine the fraction in all nearby Hi-GAL clumps. [Traficante et al. (2017)](https://academic.oup.com/mnras/article/470/4/3882/3865141).

<h2 id="ledger">What survived the research review</h2>

The following are **our historical measurements and checks**, reviewed through 8 October 2026. They are not results of the new matched-control study. Each row links to a compact source snapshot; the [evidence inventory](/public/data/starbirth/source-inventory.csv) records original paths, byte counts, hashes and the source revision.

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

We need column-density evidence **at both positions**, not just the clump's catalogue surface density. PPMAP provides model-derived Hi-GAL column maps and corresponding uncertainties at 12-arcsecond resolution. Their dust-opacity and radiative-transfer assumptions remain relevant. MIPSGAL provides catalogue and completeness products useful for checking mid-infrared sensitivity. These are prospective inputs: suitability for the frozen sample has not yet been established. [Marsh et al. (2017)](https://arxiv.org/abs/1707.03808), [IRSA MIPSGAL documentation](https://irsa.ipac.caltech.edu/data/SPITZER/MIPSGAL/).

<h2 id="week">One week, one falsifiable question</h2>

<blockquote class="sb-goal">Determine whether nearby Hi-GAL clumps labelled prestellar and undetected at 70 μm contain an excess of compact mid-infrared sources compared with sightlines matched for dust column, sensitivity and crowding.</blockquote>

The intended seven-day window starts on 11 October 2026. This page states the research program; **it is not yet a frozen measurement protocol**. The exact eligible footprint, band, apertures, quality cuts, matching tolerances, minimum useful sample and statistical thresholds must be fixed before examining the new clump-versus-control outcome. We will not choose them because they produce the largest excess.

<ol class="sb-plan">
  <li><b>Day 1 · Establish feasibility.</b> Check calibrated column maps, uncertainties and comparable mid-infrared coverage at both clump and potential control positions. Prefer cached inputs. Catalogue-only clump columns and display images are insufficient substitutes.</li>
  <li><b>Day 2 · Freeze the comparison.</b> Define one nearby population, using the historical ≤4 kpc cohort as the starting reference. Select controls without using their outcome. Register the estimator, spatial dependence treatment, missing-data rules, minimum useful precision and decision thresholds.</li>
  <li><b>Days 3–4 · Measure once.</b> Estimate compact-source occurrence at clumps and matched controls on common observational support. Report the excess in percentage points, its uncertainty, match quality, exclusions and unknown denominators. Account for spatial correlations rather than treating every neighbouring clump as independent.</li>
  <li><b>Days 5–6 · Challenge the inference.</b> Independently recompute the primary result from frozen inputs. Check registered sensitivity to resolution, column errors and crowding. If supported, assemble up to 20 source-specific follow-up candidates, retaining projection and blend alternatives.</li>
  <li><b>Day 7 · Conclude and stop.</b> Publish a positive, null or insufficient-evidence outcome with code and compact evidence. If suitable controls are unavailable, stop at that failure. A wide interval is not evidence of no effect.</li>
</ol>

An excess that passes the frozen uncertainty and robustness criteria would support **additional compact-source activity in this observed population**. It would not automatically identify a physical hidden fraction: even matched columns do not establish source distance, ownership or tracer efficiency. A precise null would constrain the defined observable effect. Inadequate support or failed controls would yield an explicit insufficient-evidence result.

Each execution unit initially has a 30-minute limit and a 64 MiB output cap, with at least 5 GiB free disk space. Git snapshots preserve verified logical changes. The failed N20 and c6828 studies and the E29–E160 historical archive remain closed; this program does not revive them.

<h2 id="birth">From an activity candidate to a birth detector</h2>

The long-term target requires several distinct kinds of evidence. A real, persistent change must first be localized to a source. Its association with the clump must be established. Pre-event observations must constrain an already-existing protostar. Finally, a physical interpretation must distinguish second-core formation from accretion bursts, extinction and instrumental changes. Representative independent evaluation would then measure precision, recall and human review cost across the stated observable domain.

<div class="sb-ladder"><span>Compact-source excess</span><span>Source ownership</span><span>Physical stage</span><span>Temporal transition</span><span>Independent detector validation</span></div>

These are evidence requirements, not accomplished milestones or an automatically authorized sequence of experiments. The current week addresses only the first step and follow-up associations.

**Unsupervised learning remains an optional tool.** An embedding could summarize spectral shapes or temporal behaviour, but it cannot create missing physical truth. Any later use must improve over simple flux, colour and clump-property baselines on the same objects and support. Unknowns remain unknown; an anomaly score is not a calibrated birth probability.

<h2 id="sources">Sources and reproducibility</h2>

The theoretical account draws on the linked collapse review and simulations; the catalogue definitions come from the Hi-GAL papers. [SPICY's primary paper](https://arxiv.org/abs/2011.12961) explains why its entries are candidate YSOs. These published sources establish context; the project measurements above remain author research results, not independently peer-reviewed discoveries.

Download the [evidence inventory](/public/data/starbirth/source-inventory.csv), the [scope and provenance note](/public/data/starbirth/README.md), or inspect the [program source and checks](https://github.com/moiseevigor/moiseevigor.github.io/tree/master/research/starbirth). The snapshot binds compact original outputs to research revision `3ae8c22bbd4bf73c68074e0cc44d63094c509e0e`; it is not a backup of the bulk survey inputs. The reviewed limitations are preserved beside the positive findings.

<p class="sb-return"><a href="/lab/">← All research programs</a></p>

</div>

<script src="/public/js/starbirth-program.js?v=20261011" defer></script>
<script src="/public/js/starbirth-formation.js?v=20261011-1" defer></script>
