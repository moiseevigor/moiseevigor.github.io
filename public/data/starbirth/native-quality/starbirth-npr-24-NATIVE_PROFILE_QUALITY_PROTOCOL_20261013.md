# Native NEOWISE PSF-fit reliability diagnostic for three consumed cases

13 October 2026. This distinct unit addresses the actual measurement quality
behind the three supportive catalogue-query sequences. The previous header
unit established image geometry but supplied no noise/mask/PSF ownership fit.
Before requesting ancillary images, use the native pipeline's published extraction
identities, PSF-fit diagnostics and quoted measurement fields. This acquires a
small catalogue excerpt from the already used NEOWISE survey, not new images,
another survey, a fresh physical-truth cohort or an embedding experiment.

## Fixed question, selection and primary

Do at least **two of the three fixed best Spitzer Catalog records** have
conservative isolated-pipeline-quality extractions, uniquely compatible literal
coordinates, in at least three epoch groups with five measurements each spanning
at least 365 reported days? This is a necessary data-quality/cadence test on the
same three consumed chemistry-positive cases, not a detection of variability,
independent source ownership, physical youth or a population success rate.

Retain HIGALBM330.8814-0.3656, HIGALBM351.2258+0.6937 and
HIGALBM353.4272-0.3734 in their current order. Keep their three prior fixed best
records and all six distinct Catalog alternatives; Archive aliases remain in the
hash-bound original cards, not six more physical objects. Never substitute the
red alternative if the blue best counterpart fails. Selection and previous
positions/colours are consumed; the new native quality fields are unread before
registration. All 19,328 parent IDs, 19,066 unknowns, original models, ranks and
old 0/3, 3/27, 14/27-versus-15/27 and 333/800 decisions stay unchanged.

## Exact acquisition and stopping contract

Freeze this document, the three implementations and the complete registration
before the three planned GET requests. Each queries the original clump centre
within exactly 12 arcsec in `neowiser_p1bs_psd`, requesting all registered fields
without server-side photometric cuts, ordered by native source_id. No coordinate
list is uploaded and no restricted E121/E155/Atlas route is used. No cloud job,
image request, archival E29–E160 implementation or closed N20/c6828 restart.

Exactly three requests, no retries, fallback, redirect, pagination or widened
cone. TOP/MAXREC 5001 is a truncation sentinel: >=5001 rows stops the unit, rather
than accepting a partial population. Response caps: 2 MiB each, 6 MiB total;
timeout 90 seconds each, acquisition at most 600 seconds. Preserve any partial
bytes and terminal receipt. TLS certificate validation stays enabled. Hash every
registered existing input before requesting data. Preserve all returned raw
strings, nulls, upper limits, native extraction identifiers and failure reasons.
Identity/schema/geometry contradiction or missing verification ends the unit.

## Native identity, literal geometry and reliability rules

The 16-character source_id is an **extraction identity**, formed from scan,
three-digit frame and six-digit extracted-source number; it is not a persistent
physical star ID. Require its scan/frame and documented integer cntr construction
to agree exactly, with strings preserved above 2^53. Reject duplicate native IDs.
For the 266 cached images, join only by exact case/scan/frame. Report nominal
database midpoint minus image MJD_OBS; permit at most 60 seconds for this
provenance consistency check, not true timing accuracy or exposure interchange.
No cached image for a particular extraction is an explicit missing join.

Require every returned position within the requested cone (0.001-arcsec rounding
tolerance). Map every native centroid to every registered Catalog alternative.
Uniquely compatible literal geometry means within <=1 arcsec of exactly one
alternative. Distances within 0.00001 arcsec of the boundary remain unqualified.
Two compatible extractions for one alternative/exposure are ambiguous and fail.
No proper-motion/frame transformation, calibrated astrometric probability or
emitter ownership is established by this literal positional criterion.

Strict pipeline-quality support requires all of: finite positive sigra/sigdec;
finite positional co-sigma with squared magnitude <=sigra*sigdec (1e-12 tolerance);
finite W2 magnitude, positive magnitude/flux uncertainties, positive raw flux and
fitting radius; W2 SNR>10, 0<reduced PSF chi-square<=2; nb=1, na=0, W2 saturation=0,
W2 artifact map=0, sso_flg=0, qi_fact=1, qual_frame>0, saa_sep>=5; W2 cc_flags='0',
W2 ph_qual='A', W2 moon_masked='0' and W2 transient-pixel string='0000'. Nulls,
limits and failures remain explicit. These deliberately conservative requirements
test an isolated measurement route; failing nb=1 does not invalidate all valid
deblended photometry, and a poor fit does not imply the source is unreal.

Group accepted reported MJDs by consecutive gaps >30 days. A supported group
has >=5 measurements; support requires >=3 such groups and >=365 days between
their first/last accepted measurements. Primary count is fixed-best support K/3,
with K>=2 the necessary pilot gate. Report every alternative's geometric rows,
strict-quality rows, supported epochs/span and rejection counts. These are no
population precision/recall, calibrated variability test or new membership labels.
Quoted fit errors and low reduced chi-square do not validate all systematic
errors or establish that all flux belongs to a chosen Spitzer source. Do not
fit flux changes, claim an event, calibrate errors from these cases, or add new
model inputs. Old query-visit counts and Spitzer strict-flag decisions stay fixed.

## Independent checks and resource caps

Synthetic controls precede requests: exact large IDs/contradictory cntr, null
upper-limit errors, quality boundaries, passive blends, covariance failure,
transient flags, RA wrap/poles and epoch count/span. The independent checker
imports no acquisition/analyzer code: raw CSV strings, ID slicing, Decimal
threshold arithmetic, vector cross-product spherical separation and independent
interval slicing must reproduce every row/reason, source and primary decision.
Geometry implementations must agree within 0.000002 arcsec. Check full raw/input/
output hashes and preserve both resource/terminal receipts.

One CPU, no GPU. Guard acquisition/analysis/check independently at 600 seconds,
256 MiB sampled RSS, 5 GiB reserve and fresh stage budgets 8/2/1 MiB; total unit
<=30 minutes and combined scripts/reports/receipts/data <=16 MiB. Sampling is
not a transient-peak guarantee. Keep all original observations and interrupted
responses. No paid compute or bulk data movement is registered.

The unit ends with its verified pass/fail/insufficient-evidence diagnostic.
Passing supports further source-assessment design only; it does not establish
the full goal, physical truth or authorize another experiment. Failing requires
the stated missing quality/identity evidence, not relaxed cuts or automatic
acquisition. No scientific blog claim until verified meaningful interpretation;
raw data readiness alone is not a discovery.

## Primary product sources consulted before requests

[IRSA single-exposure field contract](https://irsa.ipac.caltech.edu/data/WISE/docs/release/NEOWISE/expsup/sec2_1a.html)
documents native keys, quoted errors, PSF/deblending and reliability indicators.
[Catalogue use and cautions](https://irsa.ipac.caltech.edu/data/WISE/docs/release/NEOWISE/expsup/sec2_3.html)
explain why fit diagnostics and quoted errors do not establish full reliability.
[Native-image measurement guidance](https://irsa.ipac.caltech.edu/data/WISE/docs/release/NEOWISE/expsup/sec3_3.html)
recommends considering database PSF-fit measurements before one's own photometry.
This conservative design is not asserted to be a complete consensus classifier.
