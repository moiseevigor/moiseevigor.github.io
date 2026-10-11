# Registration: matched compact-source occurrence

11 October 2026. This is a prospective scientific protocol, distinct from the
completed metadata/header checks and the closed N20/c6828 units. Its registration
commit, sample and input hashes must precede retrieval of new map values or
MIPSGAL source rows. No comparison has yet been read.

## Question, estimand and population

Test whether catalogue-prestellar Hi-GAL clumps at 0 < distance <= 4 kpc show
more compact 24-micron catalogue sources than nearby positions with comparable
column, sensitivity and surrounding crowding. The primary quantity is a paired
**observed source-occurrence difference**, not the fraction hosting protostars.
Catalogue detection, physical association, novelty and birth are different claims.

The parent is every unique designation in the cached `higal360clump.csv` with
`evol_flag == 1` and finite distance in (0, 4]. This gives 19,328 entries. The
historical 19,219-object E1 cohort omitted 109 of these; it is recorded as a
provenance flag, not inherited as a selection rule. The cached 94,604-row clump
table is itself a subset of the published catalogue. No inference to missing
published objects or the full sky is permitted.

The geometric domain is 0.1 < l < 68.9 or 292.1 < l < 359.9 degrees, with
|b| < 0.9 degrees. This buffer lies inside the nominal MIPSGAL disk footprint;
it does not certify local coverage. Draw exactly 1,000 entries by ascending
SHA-256 of `matched-control-20261011:` plus exact designation, with designation
as tie breaker. Freeze their native coordinates, distances and historical
membership in `sample.csv`; retain the parent, domain and omitted denominators
in `registration.json`. Do not select by infrared flux, an old score or a known
YSO match. All 1,000 requested objects remain in the readout, including failures.

## Apertures and possible controls

Use a fixed 15-arcsecond radius in both arms. This is an operational aperture,
not a clump boundary or a membership assertion. It avoids the conflicting
beam-convolved/deconvolved descriptions of DFWHM250 and samples more than one
12-arcsecond PPMAP resolution element. Catalogue-source centres count if their
great-circle separation is <= 15 arcseconds; there is no displacement tuning.

Each target has exactly 24 possible controls: offsets of 120, 180 and 240
arcseconds at bearings 0, 45, ..., 315 degrees, measured east of Galactic north
using spherical geometry. Reject centres outside the registered domain or
within 45 arcseconds of any of the 94,604 cached Hi-GAL centres. This fixed
exclusion keeps a 15-arcsecond measurement aperture outside a 30-arcsecond
catalogue-centre mask; it does not guarantee the absence of an uncatalogued
clump. Do not add farther controls after seeing failures. Save every rejection.

Choose one control using covariates only, before opening the on/off occurrence
table. Do not rematch after inspecting central completeness or source counts.
Reuse across targets is allowed and explicitly reported; it is one reason for
spatial rather than source-independent uncertainty estimates.

## Native measurements and column gate

Use the original PPMAP `lNNN_cdens.fits` and `lNNN_sigdiffcdens.fits` from
[the Cardiff archive](http://www.astro.cardiff.ac.uk/research/ViaLactea/), with
their actual per-file Galactic TAN WCS, units and FITS layout. The cached 32x32
display cutouts have no demonstrated native column/uncertainty planes and cannot
replace these inputs. Use nearest native pixels, retaining their indices and
all duplicated indices; no super-resolution or interpolation is inferred.
At overlaps choose the tile with the greatest minimum distance to its pixel
edges, then lexical tile name. Unknown coverage, nonfinite/nonpositive column,
unsupported WCS or incomplete transport is unknown, never zero.

Measure central column N and a fixed 13-point profile: offsets (i,j)*7.5 arcsec,
where i,j are integers in [-2,2] and i*i+j*j <= 4, with the same spherical
construction. Compare central N, profile median and profile 90th percentile
(linear order-statistic interpolation) between arms. Require absolute log10
ratios <= 0.15, 0.20 and 0.20 dex respectively, with all 13 values valid.

At each surviving centre acquire all 12 differential-column uncertainty bins.
Use U = sum(sigma_k), requiring every sigma finite and nonnegative and U/N <=
0.30 in both arms. This is a conservative upper bound on the standard deviation
of a sum for arbitrary bin covariance, conditional on the supplied sigmas. It
is not an empirical confidence bound and excludes opacity/calibration model
errors. Independent-bin quadrature is not assumed.

Perform the geometry/central-column gate first. If fewer than 800 targets have
any possible column-matched control, stop with independently verified
insufficient evidence before acquiring source rows. Profile/uncertainty checks
may only eliminate further controls. A stricter necessary gate can therefore
fail without reading an infrared outcome.

## Sensitivity and crowding: avoid conditioning away a source

The published MIPSGAL differential-completeness cube is derived from artificial
source tests and can be reduced by a bright source already in the cell. Matching
the central cube value can therefore remove the occurrence being tested. Select
controls using the **surrounding** completeness curve and crowding, then audit
central completeness without selecting a replacement.

Use native completeness-cube WCS and magnitude axes, not the nominal one-arcminute
cell size. For each centre sample the surrounding curve at radii 100 and 160
arcseconds and bearings 22.5, 67.5, ..., 337.5 degrees. Exclude any sample within
15 arcseconds of the target or any of its 24 possible control centres. Require
at least eight remaining samples with valid native coverage. At each of the
13 exact magnitude centres 0.75, 1.25, ..., 6.75, take the median completeness.
All values must be in [0,1], both medians >= 0.90 and their absolute difference
<= 0.05 at every magnitude. No extrapolation, missing-plane imputation or
monotonic repair is allowed. Preserve missing/invalid cells.

For surrounding crowding count high-reliability `mipsgalc` catalogue sources
with 0.75 <= MAG_24 <= 8.75 in the 90--180-arcsecond annulus, masking all 25
15-arcsecond primary apertures. Use exact spherical separations. Estimate the
remaining solid-angle area with 4,096 deterministic equal-area annulus points
(radial midpoint quantiles, golden-angle azimuth), applying the same masks.
Require at least half the nominal area and |log10[(n_on+1)/area_on] -
log10[(n_off+1)/area_off]| <= 0.20 dex. The +1 is registered smoothing, not a
hidden source; catalogue crowding remains an incomplete proxy for true crowding.

Among passing controls minimise the sum of squared differences divided by the
registered tolerances: central log N/0.15, profile-median log N/0.20,
profile-p90 log N/0.20, crowding log density/0.20, and mean completeness-curve
difference/0.05. Tie break by radius then bearing. Record all costs/covariates.
Before the occurrence readout require at least 800 chosen pairs, at least 20
occupied five-degree longitude blocks, and absolute standardised mean
differences <= 0.10 for each log-column feature, crowding and mean surrounding
completeness. Standardisation uses the pooled marginal sample SD; equal constant
features pass, unequal constants fail. Missing values cannot pass balance.

Central completeness is then evaluated at each arm, using the same 13 magnitude
centres. The primary cohort additionally requires both central curves >= 0.90
and pairwise differences <= 0.10 at every plane, with no rematching. It must
retain at least 800 pairs/20 blocks and pass the same covariate balance checks.
This produces an explicitly conditional common-sensitivity estimand. Report
attrition by arm and a mandatory result on the selected **surrounding-only**
cohort, without this central gate. Disagreement or unsupported sensitivity
prevents a robust positive/null conclusion. Neither completeness gate certifies
90% completeness for all catalogue quality cuts or for embedded protostars.

## Outcome, uncertainty and decisions

Use the IRSA high-reliability `mipsgalc` product, rather than mixing it with the
lower-reliability `mipsgala` archive. The product's published selection is part
of the estimand. Keep exact `mipsgal_name` and `cntr` strings, coordinates,
MAG_24, flux/error, FWHM and edge/confusion metadata; do not impose an invented
shape cut or require an external young-star counterpart. Do not interpret a
completeness curve as validation of this full quality selection.

For each retained aperture, Y is one if it contains at least one catalogue
source with 0.75 <= MAG_24 <= 6.75, otherwise zero only with verified complete
query support. Delta is mean(Y_on - Y_off), in percentage points. Also report
source counts and paired discordances, but neither is a substitute primary.

Use 20,000 bootstrap resamples of the occupied five-degree Galactic-longitude
blocks, with replacement, seed 20261011; calculate each resample as the ratio of
summed paired differences to summed pairs. Report the 2.5/97.5 percentile
interval. This represents variation across the sampled spatial blocks, not
systematic catalogue/model uncertainty or independence of every clump. Disclose
overlapping apertures and repeated controls. Repeat with ten-degree blocks as
a mandatory dependence diagnostic, requiring >= 10 occupied blocks.

Mandatory diagnostics also use (a) the surrounding-only cohort and (b) a
stricter column cohort with |Delta log10 N| + (U_on/N_on + U_off/N_off)/ln(10)
<= 0.15 dex. The latter requires >= 300 pairs and >= 10 five-degree blocks.
Freeze these diagnostics now; do not search aperture, flux or colour thresholds.

A supported positive requires primary interval lower endpoint > 0 and every
mandatory diagnostic supported with a positive interval lower endpoint.
A precise null requires every supported primary/diagnostic interval wholly
inside [-3,+3] percentage points. An interval wholly below zero refutes a
positive excess and is reported as a deficit, not equality. Otherwise report
insufficient evidence for the registered positive/precise-null decision,
including estimates and intervals when supported. Missing coverage or failed
matching yields insufficient evidence with exact failure denominators.

For the full requested 1,000 objects report the identification bounds obtained
by assigning each unmeasured paired difference any value in [-1,+1]; these
are worst-case missingness bounds, not sampling intervals. Do not generalise
a selected-cohort excess to all 19,328 clumps. No birth, lifetime, calibrated
class-probability, population precision or recall follows from this test.

Only after a supported positive prepare up to 20 source-specific follow-up
records from primary on-aperture sources. Rank by separation/15 arcsec, then
MAG_24, then exact source name. Preserve all clump alternatives, duplicate
source appearances, measured source metadata, local projected density and
published astrometric limitations. Proximity/density are not an ownership
probability. Known-reference/novelty status stays unknown unless separately
verified; a catalogue source is neither a newly discovered star nor a birth.

## Frozen acquisition, storage and stopping limits

Reuse the verified archive listing and three native headers. No all-sky source
download, full 95-MiB uncertainty cube, image gallery, new survey or ML training.
Only these public endpoints/products are allowed: Cardiff PPMAP native column
and uncertainty files; IRSA MIPSGAL native completeness cubes and TAP `mipsgalc`.
Use public GET queries over occupied two-degree longitude bins padded by
0.15 degrees and |b| <= 1.05, with the registered magnitude range. No coordinate
file upload or E121 action. Request all rows within each frozen bound, reject
truncation, and deduplicate overlapping queries only when native fields agree.

Native image access uses verified FITS headers and bounded exact byte ranges;
reject whole-file responses to range requests before reading their bodies.
At most 100 ranges per request, 64 KiB partial response, three 2,880-byte header
blocks per file. Individual completeness cubes may be read whole only if <=
512 KiB. TAP responses <= 4 MiB and 100,000 rows each. Total limits: 8,000 HTTP
requests, 512 MiB received body bytes, 30 minutes acquisition execution, one
CPU thread, 64 MiB new scientific outputs and >= 5 GiB free before each request.
Exact responses are compressed in one local database; retain all scientific
prefixes and hash inventories. Hash-bound evidence is never temporary cleanup.
Unsupported byte ranges, changed resources, transport failure, exhausted caps
or lost disk reserve stop acquisition without an automatic retry or alternative
route. A stopped acquisition cannot certify an absence or an excess.

The dependency runtime is separately budgeted at <= 250 MiB installed plus
100 MiB download/build peak, using only native Python/numerical/WCS/testing
packages needed for this study. No GPU runtime. This documented setup estimate
does not increase the 64-MiB scientific-output cap. Offline processing and
independent verification each have a 30-minute execution cap and one thread.
Freeze generation/analysis code before comparison; test geometric boundaries,
WCS/range decoding, unknown handling, spatial uncertainty and central-gate
selection on controlled fixtures. Independently regenerate sample membership,
native measurements, matches and headline arithmetic from frozen raw inputs.

Commit the registration first, then implementation/controls, then independently
verified scientific readout. No history rewrite, N20/c6828 restart, E29--E160
continuation or restricted Atlas/E155/E121 action. Publish actual terminal
evidence separately from the already published program; logistics are not results.

## Sources and known limitations

* [Hi-GAL physical catalogue](https://arxiv.org/abs/2104.04807): catalogue stage
  labels and the distinction between clumps and resolved physical objects.
* [PPMAP explanation](http://www.astro.cardiff.ac.uk/research/ViaLactea/PPMAP_Explanation.txt):
  native column, differential uncertainty, resolution and units.
* [MIPSGAL catalogue paper](https://arxiv.org/html/1412.4751v1): source products,
  quality selection, artificial-source completeness and its local crowding dependence.
* [IRSA column definitions](https://irsa.ipac.caltech.edu/data/SPITZER/MIPSGAL/gator_docs/mipsgal_colDescriptions.html)
  and checked-in TAP schemas: exact fields/units, not physical classifications.

Cached Hi-GAL coverage is incomplete; PPMAP calibration/dust assumptions,
coarse cells, catalogue incompleteness and unobserved environmental variables
remain. A matched observational excess supports targeted follow-up rather than
causal attribution to hidden protostars. Spatial bootstrap intervals cannot
remove these limitations.
