# Cached multi-survey evidence eligibility: verified inventory

12 October 2026. The first checkpoint of the accepted
[multi-survey program](MULTISURVEY_RESEARCH_PROGRAM_20261012.md) is complete.
The [protocol](MULTISURVEY_ELIGIBILITY_PROTOCOL_20261012.md), generator, original
checker and 23 full input hashes were frozen at `d041663d` before source-metadata
readout. The separately frozen dependency-free verification amendment is
`ed6b45f7`. This is operational data readiness, not a scientific detection or
ranking result. The long-term detector goal remains unachieved.

## What the audit establishes

All 19,328 cached Hi-GAL catalogue-prestellar clumps at finite `0 < dist <= 4`
remain in the exact-ID ledger. Their parent catalogue has 94,604 rows and is
itself a cached subset; these are not counts of all survey stars. Every parent
designation and coordinate is reproduced independently. Historical temporal
indices bind to the original 19,219-target row order, not the new ledger order.

| Retained evidence or historical membership | Parent clumps | Meaning |
| --- | ---: | --- |
| Far-IR positive finite values in all four 160/250/350/500 μm columns | 13,339 | Value presence; no new photometry/quality or flux-error validation |
| Positive finite quoted 160/250 μm errors | 13,297 | Separate count; not necessarily the same four-band subset |
| Positive 70 μm upper limit | 19,328 | Parent label context, not training input |
| AllWISE feature rows | 19,328 | Requested rows include missing counterparts |
| Finite retained AllWISE counterpart coordinates | 1,231 | Projected catalogue match, not physical membership |
| Historical NEOWISE targets | 19,219 | Query history, not complete usable epoch coverage |
| Targets with retained NEOWISE rows | 11,845 | No SNR, completeness, deblending or event-classification cut |
| WISE counterpart coordinates and NEOWISE rows | 1,098 | Small common support; no new physical classification |
| Historical SPICY association records | 293 | Native IDs preserved; photometric candidates, not independent truth |
| E13 sample membership | 3,000 | Previously used embedding sample, not fresh evaluation |
| Retained E13 cutout files | 3,294 | Complete current-byte hashes; pixels/calibration unverified |
| E22/E28 MALT90 check membership | 303 | Previously consumed chemistry check |
| E26/E27 ALMAGAL check membership inside this parent | 52 | Original check has 98 objects; 46 are outside the current parent |
| Both consumed MALT90 and ALMAGAL memberships | 22 | Cross-survey overlap, not independent protostar labels |
| Frozen matched-control sample membership | 1,000 | Identity only; its occurrence readout remains unopened |

The 1,250,385 retained NEOWISE rows all carry query coordinates agreeing with
the saved target to within the registered 1e-6 degree tolerance. This confirms
the row-number join geometry, not the identity of the changing emitter. The
four consumed membership tables have unique designation strings. No class,
activity, fragmentation, quintile or model-score outcome was evaluated.

The audit binds 85,469,057 existing cutout bytes to complete SHA-256 values.
It creates no replacement images. These new hashes certify current bytes only;
they do not reconstruct original native WCS/PSF, acquisition provenance,
per-band coverage, calibration or noise.

## Implication for the proposed learning study

A source-bound development inventory exists. Requiring a retained WISE
counterpart and NEOWISE rows would retain only 1,098/19,328 (about 5.7%) of this
parent, even before quality or association checks. Complete-case selection would
therefore change the research population substantially. A later method needs
explicit missing-view handling and an all-requested denominator, with separate
common-support comparisons. These presence counts are not probabilities or
evidence that the remaining objects physically lack infrared sources.

The registered inputs supply no fresh, independently adjudicated physical-truth
cohort. That statement concerns this bounded input inventory, not the absence
of useful observations elsewhere. Old MALT90 activity and ALMAGAL fragmentation
checks are consumed proxies. Previously inspected labels do not become fresh
when repartitioned by sky position. Fragmentation, chemistry, SPICY selection and
absence of a maser do not supply representative physical positives/negatives.
Independent scientific detector evaluation is consequently unestablished.

Further concrete gaps are native flux/error/upper-limit contracts for the image
views; missing quoted errors in the 350/500 μm schema; native WISE-source-ID,
positional-error and epoch bindings in the derived feature table; PSF/astrometric
and alternative-association evidence for source ownership; and representative
physical truth and its consumption history. Historical MALT90/ALMAGAL score
tables preserve clump IDs but omit the full selected native source and competing
association records. MMB/ATLASGAL and raw molecular/core tables were hash/header
bound only: no new crossmatch, line-value readout or N20 restart occurred.

The next design decision is between a separately frozen retrospective
multi-view feasibility comparison and a new independently justified evaluation
evidence route. Either requires an explicit association/error contract and
scientific protocol before model execution. The current checkpoint does not
fit a model, generate a ranked shortlist or automatically start either option.

## Verification, resources and preserved failure

The original pandas checker stopped during import before any data read because
pandas is absent from the current native venv. Its log and receipt remain under
`artifacts/multisurvey_eligibility_verification_20261012/`. No dependency was
downloaded, and the failing checker was not rerun. The separately frozen
[implementation amendment](MULTISURVEY_ELIGIBILITY_VERIFICATION_AMENDMENT_20261012.md)
introduced an independent standard-library checker.

That checker reconstructs every source field directly from raw tables, recomputes
counts by set intersections, checks every temporal query geometry, and verifies
all input/ledger/cutout hashes. It imports no generator or historical acquisition
code. Complete verification passed. This is an independently implemented replay,
not fresh scientific validation or a separate human review.

The primary worker completed in 6.20 seconds; the successful checker in 5.22
seconds; the preserved import stop in 1.06 seconds. Peak sampled worker RSS was
53,968,896 bytes (about 51.5 MiB). Both completed workers retained normal system
memory-pressure readings; no resource limit tripped. Sampling can miss short
peaks. The minimum observed free space across all three runs was about 56.4 GiB,
well above the 5 GiB reserve. Combined stages before the report were 592,043 bytes;
the final compact report/checkpoint remains within the 1 MiB combined limit.
No observations, model training, GPU work, network acquisition or cloud jobs ran.

## Exact evidence

- [Pre-read input inventory](../artifacts/multisurvey_eligibility_registration_20261012.json)
- [Source ledger, gzip CSV](../artifacts/multisurvey_eligibility_20261012/sources.csv.gz)
- [Audit summary](../artifacts/multisurvey_eligibility_20261012/summary.json)
- [Independent verification](../artifacts/multisurvey_eligibility_verification_stdlib_20261012/verification.json)
- [Primary resource receipt](../artifacts/multisurvey_eligibility_20261012/resource_monitor.json)
- [Verification resource receipt](../artifacts/multisurvey_eligibility_verification_stdlib_20261012/resource_monitor.json)

Ledger SHA-256: `7b4a902d69a121c4716eb378603c40f5099c925333bc49d86536adda1cc11379`.
Summary SHA-256: `a7c3ea14d40eeea876a62fea99997adc1c5d2ffd743870a1e91af26256bcd3d6`.
Registration SHA-256: `41f5a6bec70c239f9cfc1ede4482cfb6b8e8af95b8460fe27c5f383cdc520487`.

The original 333/1,000 control-support gate against 800 stays failed and its
MIPSGAL occurrence comparison remains unopened. No new stars, stellar births,
hidden-protostar fraction, physical lifetimes or robust detector are established.
N20/c6828 stops and the E29–E160 archive remain intact. No private Atlas or public
blog update is claimed; this inventory is operational evidence, not a new
scientific result for publication.
