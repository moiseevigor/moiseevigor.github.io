# Seven-day program: multi-survey embedded-protostar candidate ranking

Accepted 12 October 2026 after the user requested combining surveys through
unsupervised embeddings and then said “Proceed and update goal”. This supersedes
the immediate schedule in the 11 October program, preserving its frozen control
study and every failed result. Governing documents: [effective goal](RESEARCH_GOAL.md),
[adversarial review](ADVERSARIAL_REVIEW_20261006.md),
[Git snapshots](GIT_SNAPSHOT_WORKFLOW.md), and [resources](STORAGE_POLICY.md).

## Falsifiable objective

Test whether a shared representation of infrared emission, variability and
molecular activity ranks candidate embedded protostars in nearby Hi-GAL
catalogue-prestellar clumps better than strong physical-feature baselines, at
identical review cost in held-out sky regions. Training uses no class labels;
evaluation uses separately held-out evidence. Compare multi-view learning against
single-view learning as well as physical/tabular baselines on the same support.

Deliver an exact-ID evidence ledger, a bounded review shortlist if justified,
and a verified positive, null or insufficient-evidence conclusion. Claim physical
precision/recall only with representative independent physical adjudication;
otherwise report the specific proxy-conditioned metrics and unresolved cases.
Neither similarity, anomaly rank nor catalogue-label recovery proves youth,
clump membership, novelty or a prestellar-to-protostellar transition.

## Existing evidence and survey roles

Nine main survey/data streams are documented in the reviewed core; this is a
counting convention, not a claim of nine independent sensors or complete joint
coverage. AllWISE and NEOWISE share WISE; GLIMPSE and MIPSGAL share Spitzer.

| Data stream | Candidate input or contextual role | Evaluation limitation |
| --- | --- | --- |
| Hi-GAL | Parent clumps, far-IR, mass, temperature, column, distance | Catalogue stage is not independent physical truth |
| AllWISE | Mid-IR fluxes, colours, quality | Reddening and unrelated counterparts |
| NEOWISE | Multi-epoch emission and variability | Existing-protostar bursts, confusion and cadence |
| GLIMPSE | Higher-resolution mid-IR context | Footprint, sensitivity and blends |
| MIPSGAL | Compact 24 μm counterparts and sensitivity products | Current matched-control occurrence readout stays unopened |
| ATLASGAL | Submillimetre clump context/classification | Selected massive-clump population and shared evidence |
| MMB | Methanol-maser association evidence | Selection window; a missing maser is not a physical negative |
| MALT90 | Molecular-line activity | Chemistry is a proxy; mass, sensitivity and coverage |
| ALMAGAL | Resolved compact cores/context | Fragmentation alone is not protostar truth |

SPICY is derived from Spitzer data; PPMAP is derived from Herschel data. Retain
these products but do not count them as independent observations. Use a modality
as model input or an independent evaluation signal under a frozen role; do not
train on the same source evidence that defines its alleged independent truth.

E12 already combined Hi-GAL/AllWISE; E13 aligned far-/mid-IR images for 5,935
complete-view clumps. E27/E28 found no demonstrated increment in their external
checks beyond physical covariates. Those models and conclusions remain frozen.
The new design must justify complementary information and correct those baseline
and evidence limitations, rather than rerun the closed CLIP branch.

## First registered checkpoint: cached evidence eligibility

Question: can the existing reviewed-core products support an explicit,
source-bound multi-view development ledger and a defensible separate evaluation
route? This is an operational eligibility audit, not a physical finding.

Freeze this registration in Git before execution. Allowed input scope is the
reviewed core E-1–E28 registrations and their exact named cached/artifact files,
plus metadata for existing Hi-GAL, matched-control and covariance products.
E29–E160, their trained models and optical/extragalactic references are excluded.
Do not import/execute historical acquisition or training modules. Read identity,
coordinate, coverage, units/error/epoch metadata and prior role manifests only;
do not open the stopped MIPSGAL occurrence rows, choose cases by positive labels,
fit a model or reinterpret previously consumed labels as untouched outcomes.

Record source path, complete SHA-256, exact native string IDs and identity
cardinality/duplicates for bounded tabular inputs. Resolve linked core artifacts
before expanding the allowed file list in a pre-read inventory. For each view
record observed, upper limit, no coverage, missing/error metadata and ambiguous
association separately. File existence alone is unverified content, not usable
photometry. Keep original cutout hashes/provenance; display/shape-normalised
images cannot substitute for calibrated flux, native WCS/PSF or noise.

Produce compact coverage and overlap counts for the documented domain, without
silently dropping incomplete cases, and a consumption ledger distinguishing
development, calibration, previously evaluated and genuinely unopened evidence.
Missing consumption history is unknown, not fresh. Report available association
alternatives and missing PSF/epoch/position uncertainty. A nearby molecular source,
clump and compact star are different physical entities, not interchangeable IDs.

Eligibility outcome: either demonstrate a source-bound route with documented
separate evaluation evidence, or name the exact missing identity, calibration,
association or validation evidence. This audit cannot itself authorize a fit or
claim independent physical performance. No minimum cohort is chosen after seeing
outcomes; useful sample size and uncertainty must be frozen in the later test.
Stop this checkpoint after its independently recomputed inventory/role report.

Execution ceiling: one CPU thread, no GPU, at most ten minutes, 256 MiB sampled
worker RSS and 1 MiB new outputs, including resource receipts; no network requests,
new observations, bulk copies or input deletion. Use the live research resource
guard with a fresh stage and retain failed stops. Keep 5 GiB free. Unavailable
inputs yield an explicit partial/insufficient-evidence audit, not an automatic
acquisition loop. Hash large files streaming; do not load all cutouts into RAM.

## Sequence within the week

1. Audit the existing source identities, view support, errors and validation roles
   under the checkpoint above; independently reproduce counts and hashes.
2. If eligible, freeze an exact experiment protocol before any new outcome:
   source population and its hash, association model/rules, angular scale and PSF,
   features, missingness/censoring treatment, training architecture and seed,
   fixed spatial development/calibration/evaluation splits, proxy/physical truth
   definitions, negative evidence and unknown denominators, estimator, uncertainty,
   review budget and pass/null/insufficient-evidence criteria. Freeze useful sample
   size and power justification. If no fresh validation exists, identify a bounded
   new evidence requirement or register a clearly retrospective feasibility test;
   do not relabel it independent validation.
3. Run one registered comparison, retaining flux/error/upper-limit information
   alongside morphology and using missing-view handling. No sweep or tuning on
   test labels. Align reliable associations without forcing a one-to-one clump
   to star mapping. Existing fold-specific embedding coordinates are not one
   global latent space and must not be pooled unaligned.
4. Compare at a prospectively fixed review fraction (proposed 5%, to be frozen
   with the exact cohort and tie rule) against a strong physical-feature baseline
   including mass, temperature, distance, surface density, colours, variability
   and availability where supported. Include matched single-view ablations and
   spatial uncertainty. Report qualified positives, negatives and unknowns for
   every requested source; report both common-support and all-requested recovery.
   Suggested primary test is the paired difference in qualifying-positive recovery
   at identical review cost, with a predeclared spatial interval. Its exact
   decision threshold and independent proxy definition must be registered before
   readout. No physical metric is implied by success on a proxy.
5. Recompute independently, conclude, and prepare at most 20 candidate evidence
   cards if support warrants them. Preserve conflicting catalogue interpretations,
   association alternatives, missing views, rank/model/source revision and why
   each case merits inspection. Candidates are not newly discovered objects.

Steps 2–5 are a program design, not an already frozen model experiment. Advance
through registered checkpoints within the user's accepted scope; do not skip
eligibility or silently substitute a different target after a failed test.
Each model work unit remains at most 30 minutes, 64 MiB outputs and one CPU
thread with live resource monitoring; exceeding these limits requires a written
resource amendment before execution. No new paid cloud jobs or acquisitions are
registered here. Close the week with the strongest supported conclusion even
if a validated ranking improvement cannot be measured.

## Preserved boundaries and communication

The 333/1,000 matched-control gate against the required 800 stays failed; its
occurrence comparison stays unopened. The hypothetical 814 independence scenario
is not a validated covariance model. No occurrence excess, hidden fraction,
physical lifetime, robust detector or confirmed stellar birth is established.
The 9–25% spread and 45–55% share scenarios remain descriptive sensitivity.
N20 and c6828 retain their stops; E29–E160 stay an unmerged historical archive.
No Atlas restoration, E155 cancellation/readback, E121 upload or queued publication
is authorized by this update. The native goal entry still holds the older blocked
objective; do not falsely mark it complete to replace it.

Commit coherent verified changes additively, with explicit staging. Keep original
observations, exact IDs and failed artifacts. Publish only meaningful verified
results through the existing blog workflow, keeping progress posts under the
program and preserving the formation explorer; registration alone is not a
scientific result or a claim that a public page was updated. Publication staging
remains capped at 16 MiB. Upkeep heartbeats do not run this research program.
