# Matched-control study: insufficient evidence after native-access stop

**Terminal outcome, 11 October 2026:** the registered comparison could not be
measured because suitable controls were not established. This is insufficient
evidence, not a measured zero excess, a precise null, a deficit, or evidence that
hidden protostars are absent. No infrared occurrence difference or follow-up
candidate list was produced. The unit stops under its prospective transport
rule; it has no automatically authorized retry or successor.

## What was frozen and what passed

Registration `ab969cc3` fixes the cached nearby Hi-GAL catalogue-prestellar parent
(19,328 exact designations), buffered MIPSGAL domain (10,136), deterministic
1,000-clump draw, 15-arcsecond apertures, 24 possible controls, column/profile/
uncertainty/completeness/crowding tolerances, spatial-bootstrap uncertainty,
missingness rules and positive/precise-null/insufficient-evidence decisions.
These preceded new column pixels and source rows. The CAR-format amendment
`33831cba` changed no statistical rule and preserved the TAN-only stopped worker.

The necessary central-column gate passed: **941/1,000** targets had a
geometrically eligible control within 0.15 dex central column, representing
12,676 possible pairs. An independent raw-byte and Cartesian-geometry replay
verified all 25,000 requested centres, 65 native tiles and 21,309 unique native
column pixels. This establishes one input-feasibility gate, not matched controls
or a scientific excess.

## Why the registered study stopped

The profile worker `1286eff2` first stopped before any new HTTP request because
a NumPy byte index could not be serialized to JSON. Its zero-request journal
and original readout remain immutable. The explicitly registered correction
`81ca0933` converted native indices to Python integers and carried forward the
entire earlier acquisition budget. Tests included an independent FITS-byte
fixture using NumPy indices; the correction changed no measurement or decision.

The corrected worker's first profile-pixel request asked for 100 exact four-byte
ranges in the native `l000_cdens.fits`. The server returned **HTTP 200**, with the
whole 8,297,280-byte image declared, rather than HTTP 206 partial ranges. Its
resource validator still matched the cached image. The worker refused the body
before reading any bytes and stopped. There was **one failed new request, zero
received new body bytes, and no retry**. No full image was downloaded. The saved
headers establish the failure; its underlying server cause is not inferred.

Independent verification checked that request against the first 100 outstanding
ranges reconstructed from the frozen sample, native FITS layout and separate
sky rotations. It verified zero failed-body bytes, the version validator, all
prior hashes and the absence of a second request. A separate offline audit then
reconstructed the 177,021 requested profile points around 13,617 relevant centres:
**163,323 points lack cached native bytes**, and **zero centres have all thirteen
valid cached column values**. Therefore no complete profile match can be certified
from the retained inputs. No twelve-bin uncertainty, sensitivity, crowding,
balance or central-sensitivity gate was completed. All 1,000 requested identities
remain in `cached_profile_support_at_stop.csv`; final control support is unknown.

## Inference and deliverables

Neither arm's compact-source outcome was opened. The paired difference and its
spatial-bootstrap interval are **unmeasured**. All 1,000 paired differences are
unknown, so the registered unrestricted missingness bounds are **[-100,+100]
percentage points**. These are logical worst-case bounds, not a sampling interval
or an estimated effect. The supported-positive condition was not met; consequently
the condition for producing up to twenty source-specific follow-up candidates
was not met. No stars, stellar births, physical lifetimes or detector performance
were established. The historical E15 enrichment and reviewed failures stand.

The outcome is a reproducible input-support failure of this bounded study, not
an astronomical finding of no hidden activity. Finishing the unit with an honest
insufficient-evidence outcome does not achieve the long-term birth-detector goal.
Any future study requires a separately accepted, prospectively frozen plan; do
not silently change ranges, acquisition route, sample or thresholds to pursue
this stopped comparison.

## Exact evidence and verification

* `artifacts/matched_control_study_20261011/profile_uncertainty_gate_integer_amendment.json`:
  immutable producer stop, source-code revision and cumulative budgets.
* `profile_uncertainty_verification.json`: independent raw-byte, request-identity
  and complete cached-profile support audit.
* `cached_profile_support_at_stop.csv`: all 1,000 requested exact string identities,
  central support, cached profile missingness and unknown final control support.
* `integer_range_amendment.json` and `profile_uncertainty_gate.json`: sealed local
  code stop and correction, preserved separately from the real HTTP failure.
* `profile_responses_integer_amendment.sqlite`: retained local exact compressed
  headers and empty-body failure record; SHA-256
  `ed1e43ea634d9b0b19f4519ab51567760cf52e52b69bef04f2d74295a8eaf740`.

Replay offline with one numerical thread:

    OPENBLAS_NUM_THREADS=1 OMP_NUM_THREADS=1 .venv/bin/python research/verify_matched_control_profiles.py

The final acquisition use is 310 cumulative requests, 2,319,232 body bytes and
31.5284 seconds. Scientific-stage files total approximately 6 MiB, including
preserved journals; free disk remains approximately 51 GiB. Full raw databases
remain local and ignored with complete hashes; no external backup is asserted.
Additive Git snapshots preserve registration, implementation, corrections and
verified stopping evidence. No archived experiment or restricted Atlas action
was resumed.
