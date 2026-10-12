# Frozen multi-survey association and temporal-support audit

12 October 2026. This is the next bounded preparation unit of the accepted
multi-survey program, not a model experiment or reopening of E22/E28. The
eligibility checkpoint established identities but not one-to-one associations.

## Question and decision

Can the cached nearest-counterpart products be treated as distinct clumps with
one unambiguous molecular record and a usable anchored temporal view? The
falsifiable geometric hypothesis is that every nearby-parent clump with MALT90
support has exactly one record within 30 arcsec and that record's position has
no other reliable Hi-GAL clump within 30 arcsec. One counterexample rejects this
hypothesis. This is a deterministic statement about the cached catalogues, not
a random-sky significance test or a test of physical protostar membership.
Report the full denominator, multiple velocity records, shared positions and
neighbouring catalogue objects rather than silently selecting nearest rows.

Temporal quality/visit counts and view intersections are secondary readiness
diagnostics. They have no model pass threshold or claimed population recall.
They will define missing-view and grouping requirements for a later frozen
comparison; they do not authorize a fit by themselves. No outcomes are opened.

## Population, inputs and roles

Retain every one of the 19,328 exact designation strings in the verified nearby
Hi-GAL catalogue-prestellar ledger. Reconstruct evol_flag=1 and finite 0<dist<=4
from the cached parent. Other reliable catalogue rows (evol_flag 0,1,2), regardless
of distance, form the neighbour/confusion context. Exact input/code/doc hashes
are in the separate registration. Goal/program policy is bound to Git revision
9bbd4924, preserving that historical scope if later policy text changes.

Read MALT90 recno, ID, Name, GLON and GLAT only. Preserve every native string and
source row ordinal, including repeated coordinates and multiple components.
Do not read S, Vc, line intensities, detection flags, old activity, fragmentation,
CLIP scores or SPICY classes. Read only IDs from historical E22 membership via
the prior eligibility ledger. The source paper describes separate A/B velocity
components at the same sky location; do not collapse these to independent beams
or pick a velocity component by ordering. No old chemistry outcome is evaluated.

Retain derived AllWISE coordinates, their input row ordinal and separation only;
native IDs, position errors and discarded alternatives are absent. The original
cache builder already deduplicated its chunk products, so this audit cannot
recover alternatives or certify unique WISE identity. No WISE colours are used.

NEOWISE input is the exact historical target order plus all cached single-exposure
rows. Query target coordinates must agree to 1e-6 degree. Detection identity is
an input hash and 1-based data-row ordinal, not an invented native source ID.
Retain raw bytes as the complete alternatives record; export compact per-target
counts and visit summaries, not a duplicate 113 MB observation table.

## Fixed association and quality rules

1. Use great-circle distances, not a planar RA subtraction. MALT90 and Hi-GAL
   matching uses native Galactic coordinates. Export *every* reliable catalogue
   neighbour within 30 arcsec for every MALT90 record, including outside-parent
   neighbours. Also report all neighbours within 19 arcsec, half the nominal
   38-arcsec beam FWHM. These are geometric radii, not beam edges or ownership
   probabilities. Same-coordinate molecular rows share a sky-position group;
   distinct velocity components stay separate. Link parent clumps sharing any
   molecular sky-position group within 30 arcsec into a deterministic connected
   component for subsequent leakage prevention. Position errors are unknown.
2. AllWISE separation is recomputed from the retained celestial coordinates.
   A retained match within 3 arcsec is an anchor only. Missing alternatives and
   native IDs remain explicit. Neither a nearest anchor nor agreement between
   epochs establishes clump membership.
3. A NEOWISE row passes the *available-field screen* iff valid finite RA/Dec,
   MJD, W2 magnitude and positive finite magnitude error; W2 SNR>=5; qual_frame>0;
   nb=1; and cc_flags has four characters with its W2 character equal to '0'.
   These choices are conservative analysis rules, not a complete reliability
   certificate. Missing reduced chi-square, moon/solar-system/saturation flags
   and positional uncertainties remain unverified. Count each failure predicate
   separately (they overlap), including upper-limit-like SNR<2 rows.
4. For an existing anchor within 3 arcsec of its clump, screen-passing detections
   within 2 arcsec of the anchor form the anchored sample. Report passing rows
   outside that radius as competing/unanchored evidence, without declaring them
   different stars. A 2-arcsec rule is geometric, not a fitted astrometric sigma.
5. Deduplicate anchored measurements by the exact (MJD,RA,Dec,W2 magnitude,
   error) string tuple; do not call this proof of unique exposure identity. Sort
   by numeric MJD and start a new visit when the successive gap exceeds 30 days.
   A supported visit contains >=5 retained tuples. Temporal support requires
   >=3 supported visits and an overall anchored time span >=365 days. The span
   uses all retained anchored tuples. Do not compute variability, events or a
   classifier in this unit. Export visit counts, time span and observed MJD
   endpoints so the rule is independently reconstructible.
6. Four-band FIR/error support reuses the prior presence states OOOOEE;
   350/500 errors remain absent. Intersections include all anchored temporal
   support, any molecular support, unique-record/unshared molecular support and
   four-band/error presence, with all missing cases retained. No missing view is
   a negative physical label. Do not impute or use 70-micron stage as input.

## Estimator, checks and limits

Primary is the exact number of molecular-supported parent clumps violating the
one-record/unshared-position hypothesis, divided by all molecular-supported
parent clumps. No confidence interval is appropriate for this exhaustive cached
geometry test. Report each condition separately and at 19 versus 30 arcsec;
retain all alternatives and same-position component multiplicity. Recompute
edges independently using Astropy spherical separation against each catalogue
position, independently stream temporal screens and visits, and verify all
output hashes. The checker imports no generator or historical research module.
Use synthetic boundary/RA-wrap/component/duplicate tests before real readout.

One offline worker and one independent checker, each <=600 seconds, one CPU
thread, <=256 MiB sampled RSS, no GPU. Combined worker/checker/report stages <=4
MiB, below the program's 64 MiB ceiling; live resource guard enforces each stage
and the final combined check. Keep 5 GiB free. No network observations, downloads,
input deletion, cloud jobs, fitting, model sweep, N20/c6828 restart or archive
work. A missing input, identity mismatch, resource violation or failed verification
stops that attempt; preserve its logs before any separately frozen repair.

## Sources and limitations

[Rathborne et al., MALT90 line catalogue, sections 2 and 4](https://researchonline.ljmu.ac.uk/id/eprint/4139/1/MALT90_catalog.pdf)
describes the 38-arcsec resolution and distinct A/B velocity entries. The
[official NEOWISE schema](https://irsa.ipac.caltech.edu/data/WISE/docs/release/NEOWISE/expsup/sec2_1a.html)
defines magnitudes/errors, MJD, nb, frame quality and W2 flag position.
[IRSA reliability notes](https://irsa.ipac.caltech.edu/data/WISE/docs/release/NEOWISE/expsup/sec2_3.html)
identify additional checks absent from this cache. No physical validation cohort
is introduced. Old consumed labels cannot become fresh by a spatial split.
The 333/800 occurrence gate stays failed and unopened. No detector, occurrence
fraction, physical lifetime or stellar birth is established by this audit.
