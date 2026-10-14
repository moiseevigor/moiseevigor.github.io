---
layout: distill
last_modified_at: 2026-10-14
title: "A shared embedding did not beat the stronger baseline"
subtitle: >
  At eighteen reviews, the embedding recovers 14 of 27 chemistry positives and the nonlinear baseline 15. Coverage and counterpart checks leave physical classification unresolved.
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
<link rel="stylesheet" href="/public/css/starbirth-ranking.css?v=20261012-4">

<div class="l-body sb-program sb-ranking" markdown="1">

<div class="sb-status"><strong>Verified result · 12 October 2026.</strong> The shared embedding recovered <b>14 of 27</b> qualifying chemistry positives; the nonlinear baseline recovered <b>15 of 27</b>, at the same <b>18 reviews</b>. The frozen improvement gate failed. These are previously consumed chemistry proxies, not confirmed protostars. No physical precision, population recall or stellar birth is established.</div>

A representation can learn common patterns across surveys. The useful test is whether those patterns improve the decisions we make. Our first registered comparison learned from infrared emission, supported variability measurements and molecular-line features, retaining clumps that lack a view. **It did not demonstrate an improvement over the stronger tabular baseline.**

That result has a sharper limitation: **none of the 27 qualifying chemistry-positive cases has the registered temporal input view**. The learning procedure can handle a missing observation, but it cannot supply the absent observation. [Verified result](/public/data/starbirth/missing-view/results.md).

<nav class="sb-jump" aria-label="On this page"><a href="#equal-cost">The comparison</a><a href="#learning">What learned without labels</a><a href="#coverage">The coverage gap</a><a href="#temporal-diagnosis">Why the temporal view is missing</a><a href="#native-counterparts">Three native counterpart cases</a><a href="#irac-colours">The physical-colour check</a><a href="#radio-context">Nearby radio activity</a><a href="#gas-velocity">Gas–radio comparison</a><a href="#flag-repair">Native quality gate</a><a href="#unknowns">The unknown denominator</a><a href="#next-evidence">Interpretation limits</a><a href="#evidence">Exact evidence</a></nav>

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

<h2 id="temporal-diagnosis">The anchor is only part of the gap</h2>

**New, independently checked post-read diagnosis.** We asked whether removing the anchor requirement would uncover sufficient cached cadence for a majority of the same 27 positive references. This was a separate diagnostic, frozen after the original comparison. It kept the original quality and visit rules, and tested the original six-arcsecond query cone rather than claiming a new source association.

Only **3 / 27** had query-level cadence support, below the frozen **14-of-27 majority gate**. The original anchored view remains absent in all 27. The exact decomposition is:

<div class="sb-ledger sb-temporal-diagnosis" role="region" aria-label="Why the 27 positive references lack temporal support" tabindex="0" markdown="1">

| Where support stops | Positive references |
|:--|--:|
| Requested, no cached rows | 11 |
| Rows exist, none passes the unchanged screen in the query | 9 |
| Screened query rows, insufficient cadence | 4 |
| Query cadence supported, qualifying retained anchor absent | 2 |
| Query cadence supported, anchored cadence insufficient | 1 |
| Original anchored cadence supported | 0 |
| **Total** | **27** |

</div>

**The gap is not merely an anchor artefact.** Dropping the anchor would still leave 24 cases without sufficient screened query cadence. And a query cone can contain several emitters: repeated detections within it are **not a single-source light curve**. Missing cached rows do not prove that the survey never observed the location. No variability event, replacement temporal feature or new model result follows from these counts.

Across all 19,328 clumps, **3,013** have query-level cadence and **761** have the original anchored support. Only three of those query-supported cases are qualifying positives. All 27 positives are above the parent medians for mass and surface density, underscoring how selected the chemistry-reference cohort is. Its lower-mass and lower-surface-density validity remains unestablished. [Verified report](/public/data/starbirth/temporal-missingness/results.md), [full selection/support tables](/public/data/starbirth/temporal-missingness/starbirth-tmd-summary.json).

The three consumed support cases are `HIGALBM330.8814-0.3656`, `HIGALBM351.2258+0.6937` and `HIGALBM353.4272-0.3734`. They are **evidence cases, not discoveries**: emitter identity and full reliability remain unresolved. Download [all 1,072 raw query rows for the 27 positives, failures included](/public/data/starbirth/temporal-missingness/positive-raw-evidence.csv.gz) and [every parent identity and failure path](/public/data/starbirth/temporal-missingness/sources.csv.gz).

Independent geometry and cadence recomputation agree with the readout. [Protocol and full packet](/public/data/starbirth/temporal-missingness/README.md), [independent verification](/public/data/starbirth/temporal-missingness/starbirth-tmd-verification.json), [source hashes](/public/data/starbirth/temporal-missingness/source-inventory.csv). The packet binds research revision `3332eb8530fafcf442d191f96efe5149ca989ac8`.

<h2 id="native-counterparts">One tight infrared alignment, three unresolved physical cases</h2>

**New cross-survey evidence.** A separately registered native GLIMPSE catalogue inspection asked whether the three query-supported positive references have a unique, isolated infrared counterpart under a frozen geometric and quality rule. **Zero of three passes every condition.** Yet one existing Spitzer source agrees closely with all **21 / 21** supported query-visit medians. The failed conservative test and positive positional evidence answer different questions; neither establishes a protostar.

<div class="sb-status"><strong>What is interesting.</strong> For <code>HIGALBM330.8814-0.3656</code>, the known record <code>SSTGLMC G330.8829-00.3661</code> is only <b>0.168–0.336 arcseconds</b> from those 21 visit medians, but <b>5.719 arcseconds</b> from the dust-clump centre. It sits outside the original 3-arcsecond counterpart search. This supports a missed-centre-association explanation for this case, while emitter identity, clump membership and physical stage remain unknown.</div>

The frozen test required at least 90% of supported visit medians within two arcseconds of one qualified Catalog record, at least three visits spanning a year, a unique reciprocal Archive alias and no qualifying geometric competitor. It also required signal-to-noise ≥5, at least two detections, finite positive coordinate errors ≤1 arcsecond, a clear close-source flag and **an all-zero 4.5-micron quality flag**. No rule was changed after readout. [Exact frozen protocol](/public/data/starbirth/native-glimpse/protocol.md).

That last requirement matters. The first record's flag is **1536**, or one-based bits **10 and 11**: positive/negative PSF-photometry adjustments. IRSA explains that such adjustments can increase photometric uncertainty without compromising source reliability. The conservative zero-flag rule still rejects it; rejection does **not** demonstrate a false detection or physical absence. Future protocols should distinguish instrument corrections from fatal problems before freezing a gate. We have applied no post-read exemption. [Official GLIMPSE flag definitions](https://irsa.ipac.caltech.edu/data/SPITZER/GLIMPSE/gator_docs/GLIMPSE_colDescriptions.html), [prospective flag-policy lesson](/public/data/starbirth/native-glimpse/flag-policy.md).

<h3>Inspect the three evidence cases</h3>

These are consumed chemistry-positive references selected before the native readout. Each card keeps the historical system ranking separate from catalogue statements and unresolved physical interpretation. The named counterpart is the best geometric coverage record, **not an admitted candidate under a replacement rule**.

<details class="sb-native-card" open markdown="1">
<summary>HIGALBM330.8814-0.3656 · 21 / 21 visits align</summary>

**Known positional record:** `SSTGLMC G330.8829-00.3661`. Clump-centre separation **5.719 arcseconds**. All 21 visits align; nonzero PSF-photometry adjustment flags fail the frozen rule.

**Our historical system:** embedding rank score **0.956487** (not a probability). All four frozen methods already selected this clump at the original **982-review** all-requested budget. The new GLIMPSE data were not model inputs; no rank or model was recomputed.

**Catalogue evidence:** Hi-GAL labels the clump catalogue-prestellar. The consumed MALT90 proxy record is `AG1532`, with tracer flags `Y|N|Y|Y` in native field order `DHC3N`, `DHNCO404`, `DCH3CN` and `DSIO`. Those detections support molecular activity, not a physical class decision. GLIMPSE supplies a previously catalogued point-source record; it supplies no consensus youth or clump-membership classification.

**Published colour component:** [3.6]−[4.5] = **−0.089 mag**; its frozen 3× quoted-error upper sensitivity is **0.292 mag**, below the named necessary cut within the declared quoted-error sensitivity. Missing native 8-micron photometry prevents the full four-band scheme. This is a conditional colour check, not a physical classification or confidence bound. [Comparator scope and exact evidence](#irac-colours).

**Assessment remains unknown:** single-emitter ownership, physical membership, evolutionary stage and temporal birth. This is not a newly discovered star or an independent validation case.

[Download all three complete assessment cards, original scores and every native alternative](/public/data/starbirth/native-glimpse/starbirth-ng-evidence-cards.json).

</details>

<details class="sb-native-card" markdown="1">
<summary>HIGALBM351.2258+0.6937 · 14 / 19 visits align</summary>

**Known positional record:** `SSTGLMC G351.2258+00.6940`. Clump-centre separation **1.780 arcseconds**. Only 14 of 19 visits align; the frozen coverage requirement is 18. Quality flag 1024 is also nonzero.

**Our historical system:** embedding rank score **0.695941** (not a probability). All four frozen methods already selected this clump at the original **982-review** all-requested budget. The new GLIMPSE data were not model inputs; no rank or model was recomputed.

**Catalogue evidence:** Hi-GAL labels the clump catalogue-prestellar. The consumed MALT90 proxy record is `AG3005`, with tracer flags `Y|N|N|N` in native field order `DHC3N`, `DHNCO404`, `DCH3CN` and `DSIO`. Those detections support molecular activity, not a physical class decision. GLIMPSE supplies a previously catalogued point-source record; it supplies no consensus youth or clump-membership classification.

**Published colour component:** [3.6]−[4.5] = **+0.134 mag**; its frozen 3× quoted-error upper sensitivity is **1.124 mag**, unresolved under the declared quoted-error sensitivity. Missing native 8-micron photometry prevents the full four-band scheme. This is a conditional colour check, not a physical classification or confidence bound. [Comparator scope and exact evidence](#irac-colours).

**Assessment remains unknown:** single-emitter ownership, physical membership, evolutionary stage and temporal birth. This is not a newly discovered star or an independent validation case.

[Download all three complete assessment cards, original scores and every native alternative](/public/data/starbirth/native-glimpse/starbirth-ng-evidence-cards.json).

</details>

<details class="sb-native-card" markdown="1">
<summary>HIGALBM353.4272-0.3734 · 4 / 6 visits align</summary>

**Known positional record:** `SSTGLMC G353.4273-00.3723`. Clump-centre separation **3.910 arcseconds**. Only 4 of 6 visits align; all six are required. Quality flag 512 is also nonzero. The separate zero-flag Catalog record matches 0/6 visits.

**Our historical system:** embedding rank score **1.335058** (not a probability). All four frozen methods already selected this clump at the original **982-review** all-requested budget. The new GLIMPSE data were not model inputs; no rank or model was recomputed.

**Catalogue evidence:** Hi-GAL labels the clump catalogue-prestellar. The consumed MALT90 proxy record is `AG3227`, with tracer flags `Y|N|N|N` in native field order `DHC3N`, `DHNCO404`, `DCH3CN` and `DSIO`. Those detections support molecular activity, not a physical class decision. GLIMPSE supplies a previously catalogued point-source record; it supplies no consensus youth or clump-membership classification.

**Published colour component:** [3.6]−[4.5] = **−0.011 mag**; its frozen 3× quoted-error upper sensitivity is **0.208 mag**, below the named necessary cut within the declared quoted-error sensitivity. Missing native 8-micron photometry prevents the full four-band scheme. This is a conditional colour check, not a physical classification or confidence bound. [Comparator scope and exact evidence](#irac-colours).

**Assessment remains unknown:** single-emitter ownership, physical membership, evolutionary stage and temporal birth. This is not a newly discovered star or an independent validation case.

[Download all three complete assessment cards, original scores and every native alternative](/public/data/starbirth/native-glimpse/starbirth-ng-evidence-cards.json).

</details>

The other two best records match **14 / 19** and **4 / 6** supported visit medians. A different zero-flag record matches **0 / 6** in the third field. The packet retains **six Catalog records and six reciprocal Archive aliases**, not twelve independent objects. Both products come from shared observations. Missing WISE positional errors and exposure/source identifiers, blending, epoch differences and proper motion limit interpretation; Spitzer errors alone cannot turn this into a calibrated association probability. No native-image PSF ownership test was performed.

Download [the verified report](/public/data/starbirth/native-glimpse/results.md), [all native alternatives](/public/data/starbirth/native-glimpse/sources.csv), [visit medians](/public/data/starbirth/native-glimpse/visits.csv), [180 visit/source edges](/public/data/starbirth/native-glimpse/visit-source-edges.csv), [independent verification](/public/data/starbirth/native-glimpse/starbirth-ng-verification.json), [final checkpoint](/public/data/starbirth/native-glimpse/starbirth-ng-checkpoint.json) and [packet guide with complete source hashes](/public/data/starbirth/native-glimpse/README.md). The source revision is `4e4a9b13c199a7d035a3728d7390d754d9773e89`; its creation-time unpublished flags remain historical, with live publication checked separately. **No new star, confirmed birth or validated physical detector follows from this result.**

<h2 id="irac-colours">A good position does not make a young star</h2>

**New, independently checked retrospective colour diagnosis.** The same three fixed counterparts have short-wave IRAC colours **−0.089, +0.134 and −0.011 mag**. None of the measured central values exceeds the **>0.7 mag** necessary [3.6]−[4.5] colour cut in the named Gutermuth et al. (2009) Phase-I scheme. **Zero of three has usable photometry in all four bands**, so we cannot apply its full classifier.

That published method requires four-band detections with magnitude errors below 0.2, contaminant screening and red [3.6]−[4.5] and [4.5]−[5.8] colours. We tested only its availability and necessary-colour component. We did not run a Class-I/II classifier, use its other phases or validate it for our Hi-GAL population. [Primary method, Appendix A.1](https://arxiv.org/pdf/0906.0201v1).

<div class="sb-ledger sb-irac-colours" role="region" aria-label="Measured short-wave colours of the three fixed positional counterparts" tabindex="0" markdown="1">

| Known counterpart | Colour (mag) | 3× upper (mag) |
|:--|--:|--:|
| `SSTGLMC G330.8829-00.3661` | **−0.089** | **0.292** |
| `SSTGLMC G351.2258+00.6940` | **+0.134** | **1.124** |
| `SSTGLMC G353.4273-00.3723` | **−0.011** | **0.208** |

</div>

The last column is the measured colour plus three times the sum of its two quoted magnitude errors. It spans the largest linear propagated error under unknown inter-band correlation. It is **quoted-error sensitivity, not a confidence bound or physical exclusion**. Two sources stay below the named short-wave cut within this sensitivity; the second remains unresolved. Corrections, unmodelled systematics and non-Gaussian errors can exceed it. The two classification colours share a band, so we do not combine them as independent probabilities.

**The strongest positional case therefore lacks this named red-colour support.** Its 21/21 alignment stays correct. This does not classify it as a field star, rule out a protostar, determine clump membership, or exclude a different embedded object inside the dust clump. All three lack usable native 8-micron values; the second also lacks 5.8-micron photometry. Missing entries are **not upper limits or physical nondetections**. Near-IR/24-micron alternatives and source ownership remain unverified.

Our old scores rank **clump chemistry proxies**, not the evolutionary class of a nearby Spitzer point source. All four methods already selected these clumps; scores, inputs and review budgets stay unchanged. The magnitudes and case selection had already been inspected before this separately frozen diagnostic, so this is **consumed, post-read evidence**, not a preregistered discovery or independent physical validation.

<h3 id="red-alternative">A different red source deserves its own assessment</h3>

The retained alternatives also contain **`SSTGLMC G353.4284-00.3731`** in the third field. Its central colours are **1.000 and 0.790 mag**, both above the named necessary cuts, and it has usable four-band photometry. It is a previously catalogued **red inspection alternative**, not a new discovery or confirmed young star. Its second colour's frozen sensitivity spans **0.529–1.051**, so it lacks robust necessary-colour support. Only its 4.5-micron quality flag is verified zero; other-band flags and the full classifier remain unassessed.

Crucially, this source matches **0 / 6** supported visit medians and lies **4.490 arcseconds** from the clump centre. It is different from the blue best positional counterpart. We do not assign it that source's time-series measurements or replace the frozen source after readout. A red neighbour, a clump chemistry rank and an emitting source are different pieces of evidence. [Exact retained source, uncertainty and prior geometry](/public/data/starbirth/irac-colours/alternative-note.md).

Download [the three system/comparator cards with every alternative](/public/data/starbirth/irac-colours/starbirth-ic-comparison-cards.json), [verified interpretation](/public/data/starbirth/irac-colours/results.md), [all available and missing colours](/public/data/starbirth/irac-colours/starbirth-ic-all-records.json), [independent verification](/public/data/starbirth/irac-colours/starbirth-ic-verification.json) and [protocol and exact source hashes](/public/data/starbirth/irac-colours/README.md). The 23 primary compact source exports bind research revision `106e2f842a903469f7529c54272cbf033509ba43`; five additive secondary-note exports bind `2d098311d6cb089455bc83bbad895fab635c8d8e`. **No new observations, model fit, physical stage, discovery or birth is established.**

<h2 id="radio-context">Nearby radio activity belongs to a different position</h2>

**Native-position check · 13 October 2026.** A historical radio maser record, **330.878-0.367**, lies **12.520 arcseconds** from the first dust-clump centre. But it is **17.501 arcseconds** from the best infrared counterpart, `SSTGLMC G330.8829-00.3661`. A region can contain a useful radio marker without that marker supporting the infrared point selected by a clump-level rank.

The separately frozen comparison used original equatorial positions for **707** historical MMB catalogue records, the same three consumed cases and **all six** retained infrared Catalog alternatives. **0 / 3** fixed best points meet the declared one-arcsecond radio criterion; **0 / 6** alternatives have any catalogue maser position within that radius. The criterion required at least one of the three best points. It failed.

<div class="sb-ledger" role="region" aria-label="Native radio-marker separations for the three fixed counterpart cases" tabindex="0" markdown="1">

| Fixed best infrared record | Nearest catalogue maser | Point-to-maser separation |
|:--|:--|--:|
| `SSTGLMC G330.8829-00.3661` | `330.878-0.367` | **17.501″** |
| `SSTGLMC G351.2258+00.6940` | `351.242+0.670` | **104.881″** |
| `SSTGLMC G353.4273-00.3723` | `353.410-0.360` | **76.937″** |

</div>

The separate red alternative `SSTGLMC G353.4284-00.3731` is **81.837 arcseconds** from its nearest catalogue maser. It remains distinct from the blue temporal counterpart. **No close radio association is established, and absence of one does not establish starlessness.** This historical snapshot is not a complete census of modern masers. Positional agreement alone would not establish emitter ownership, clump membership, stellar stage or birth. Neither the nearby marker nor the infrared record is a new discovery.

There is also a coverage limit: the first radio position falls just outside the earlier **12-arcsecond infrared query** centred on the clump. A counterpart outside that cone was not tested by the earlier selection. This is **post-read coverage context**, not a relaxed match radius or a substitute candidate. The 15/30-arcsecond context circles are not physical clump boundaries. No new infrared counterpart was acquired or assigned the existing time series.

Independent recomputation verified **all 707 records and 6,363 angular pairs**, preserving literal coordinates, names, native flags and every alternative. It verifies the software geometry, not physical association probabilities. The frozen selection and historical MMB references are consumed evidence; no fresh representative physical validation was supplied. All earlier ranking, colour, cadence and uncertainty gates stay unchanged.

Download [the verified source assessment](/public/data/starbirth/radio-context/results.md), [every nearest match and contextual pair](/public/data/starbirth/radio-context/starbirth-mmb-analysis-summary.json), [all native radio records](/public/data/starbirth/radio-context/radio_records.json.gz), [independent verification](/public/data/starbirth/radio-context/starbirth-mmb-verification-verification.json) and [frozen protocol, original catalogue, code and complete hashes](/public/data/starbirth/radio-context/README.md). The packet binds research revision `70c33bcc9017f994e1a51c2dfe8d150ef7614650`. **No new star, confirmed stellar birth or validated detector follows from this result.**

<h2 id="gas-velocity">A narrow velocity overlap is not a shared object</h2>

**Verified gas–radio comparison · 13 October 2026.** Could the nearby historical maser belong to the first dust region even though it is separated from the best infrared point? The fixed primary case, **`HIGALBM330.8814-0.3656`**, has only **0.1970 km/s** of common overlap between the declared maser band and both broadened molecular-gas bands. The literal overlap rule passes, but the declared **+1 km/s** radio-shift sensitivity removes that overlap. **Physical membership remains unestablished.**

The cached molecular record is **`AG1532` / `AGAL330.879-00.367_S`**; the historical radio record is **`330.878-0.367`**, native row `VIII/96/catalog.dat:000307`. These are previously inspected references, not newly discovered objects or fresh validation cases. The gas centroids, **−62.443** and **−62.566 km/s**, agree closely with each other. The maser’s native range is **−60.0 to −58.0 km/s**, with catalogue peaks **−59.2 / −59.3 km/s**. Its peak lies outside both declared gas bands. The statistic is **wing overlap, not agreement of peak or systemic velocities**.

<div class="sb-ledger" role="region" aria-label="Declared velocity bands of the fixed primary region, in kilometres per second" tabindex="0" markdown="1">

| Primary record | Declared band (km/s) |
|:--|:--|
| N₂H⁺ gas fit | **−64.9430 to −59.9430** |
| H¹³CO⁺ gas fit | **−65.4620 to −59.6700** |
| Historical maser, padded native range | **−60.1400 to −57.8600** |
| Common intersection of all three | **−60.1400 to −59.9430** |

</div>

The frozen gas half-width is FWHM/2 + 3 × quoted centroid error + 1.5 × quoted width error + 0.06 km/s; the native radio range is padded by 0.14 km/s. These are **declared linewidth/error/channel conventions, not confidence bounds**. The separately declared shifts are **sensitivity scenarios, not measured calibration offsets**. No stellar velocity or independently calibrated relative velocity was measured.

<div class="sb-ledger" role="region" aria-label="Primary velocity overlap and its preread sensitivity scenarios" tabindex="0" markdown="1">

| Radio shift | Primary outcome |
|:--|:--|
| −1 km/s | overlap **1.1970 km/s** |
| 0 km/s, fixed primary convention | overlap **0.1970 km/s** |
| +1 km/s | gap **0.8030 km/s** |

</div>

The other two fixed fields remain **secondary context**, not substitute primaries or verified unrelated controls. The second has no overlap in any declared scenario. The third has a tiny **0.0685 km/s** zero-shift overlap, yet its nearest radio marker is **79.066 arcseconds** from the clump centre. This illustrates why a velocity match cannot replace positional and physical association; missing overlap does not establish starlessness either.

The native `Vc` is the catalogue’s **consensus gas velocity**; the component designation is the **S/A/B suffix of the native Name**. The additive corrected assessment retains the original output and fixes that meaning. `Vc` did not enter the test: no measurement, selection, equation or decision changed. The N₂H⁺ three-component fit resolves hyperfine structure; it is not three distinct gas clouds. [Native catalogue definitions, sections 3–4](https://researchonline.ljmu.ac.uk/id/eprint/4139/1/MALT90_catalog.pdf).

An independent check used exact original fields, Decimal interval arithmetic and separate position calculations, verifying **three native records, six tracer fits and nine shift scenarios**. This verifies the calculation, not the physical association. The gas catalogue’s beam does not assign emission to the best infrared point, which remains **17.501 arcseconds** from the radio marker. **No ownership, stellar youth, birth, new model benefit or physical precision/recall is established.** All earlier failed gates, source alternatives and unknowns remain intact.

Download the [final gas–radio assessment](/public/data/starbirth/gas-velocity/results.md), [corrected field meanings](/public/data/starbirth/gas-velocity/starbirth-rgv-corrected_assessment.json), and [protocol, native records and checks](/public/data/starbirth/gas-velocity/README.md). The correction distinguishes consensus gas velocity from component identity; the measured intervals and decision are unchanged. Source revision: `dc8d8ca3349d68f6c1d9b0aa5431ac894383ac10`.

<span id="native-quality"></span>

<h2 id="flag-repair">The final native quality gate fails</h2>

The approved offline repair reads the W2 grade from the same 874 downloaded rows. Two-character W1/W2 values and four-character W1/W2XX values expose the same active slots; raw strings stay unchanged. No missing bands were imputed, no new observations requested, and no numerical cut relaxed.

**645 rows lose an erroneous flag-shape rejection. Zero rows become accepted.** A separate checker recomputes all identities, geometry, quality cuts and epochs; a raw-VO delta audit confirms every field except that single rejection and its resulting boolean is unchanged.

<div class="sb-result sb-result--negative"><strong>Corrected quality/cadence gate: failed, 0/3 versus required 2/3.</strong> The contract ambiguity is repaired for this packet. Other quality cuts still reject every matched extraction. This does not establish an absence of protostars, physical membership, youth or stellar birth.</div>

| Fixed clump | Unique rows at best point | Corrected accepted rows | Supported epochs |
|---|---:|---:|---:|
| G330.8814−0.3656 | 307 | 0 | 0 |
| G351.2258+0.6937 | 75 | 0 | 0 |
| G353.4272−0.3734 | 68 | 0 | 0 |

The first and third best points fail the declared reduced profile-fit criterion in 307/307 and 68/68 matched rows. The second fails SNR in 61/75, profile fit in 24/75, image quality in 45/75 and the now correctly read W2 grade in 60/75. Counts overlap; they are not independent failure probabilities. All six alternatives remain separate, including the red third point with zero unique matched rows.

This is a **post-read repair on consumed cases**, not fresh physical validation. The parser contract is corrected; the fixed measurement criteria still fail. The [original contract readout](/public/data/starbirth/native-quality/results.md) and unchanged native rows remain in the evidence packet. The numerical cuts were not relaxed.



Read [the corrected result](/public/data/starbirth/flag-repair/results.md), [the checked conclusion](/public/data/starbirth/flag-repair/checkpoint.json), and [all corrected rows, independent checks, exact delta, protocol, code and hashes](/public/data/starbirth/flag-repair/README.md). Source revision: `b38a93adaf95f3ee38fad04610ccfca061cfb3fa`.

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

<h2 id="next-evidence">Interpretation limits</h2>

Source ownership, complementary positive-case coverage and independent physical truth are absent. Additional scores on these same incomplete chemistry proxies would not constitute physical validation.

The earlier occurrence study remains unchanged: its **333-of-800 uncertainty gate failed**, its primary infrared comparison remains **unmeasured**, and the hypothetical 814-support independence scenario is unvalidated. The descriptive 9–25% estimator spread and 45–55% share scenarios are not confidence bounds or measured lifetimes. [Earlier control and uncertainty results](/astrophysics/2026/10/11/hidden-protostars-column-uncertainty/).

The physical birth question remains stricter than activity ranking. A new protostar interpretation needs ownership and physical evidence; a birth claim additionally needs a temporal transition that excludes an already-existing protostar, an accretion burst and instrumental alternatives. [Research program and formation explorer](/astrophysics/2026/10/11/hidden-protostars-research-program/#star-formation). **No new star, confirmed stellar birth or robust detector is established.**

<h2 id="evidence">Exact evidence and reproducibility</h2>

The independent checker reconstructed all raw feature values, masks, proxies, joins and splits. It replayed the completion by a different linear-algebra route and verified model equations, every source score and the full paired readout. This is independent software recomputation, not fresh physical validation or a separate human review. The frozen methods remain linked in the evidence packet.

The source packet binds research revision `6a44759b5a5948d9177335ef9a25b51d68ff9309`. It retains the failed ranking-improvement gate and every requested unknown proxy state.

Download the [packet guide](/public/data/starbirth/missing-view/README.md), [complete source inventory and hashes](/public/data/starbirth/missing-view/source-inventory.csv), [source-bound KG supplement](/public/data/starbirth/missing-view/starbirth-mvr-knowledge-supplement.json), [final checkpoint](/public/data/starbirth/missing-view/starbirth-mvr-checkpoint.json) and [independent verification](/public/data/starbirth/missing-view/starbirth-mvr-verification.json). The guide links all five fold models, feature arrays, unaligned coordinates, bootstrap, source code and association alternatives.

<div class="sb-return"><a href="/astrophysics/2026/10/11/hidden-protostars-research-program/">← Back to the Hidden protostars program</a></div>

</div>
