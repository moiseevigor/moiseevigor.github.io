# Native GLIMPSE projected-counterpart study for three temporal-support cases

12 October 2026. A distinct study within the accepted multi-survey program, after
the consumed-proxy model comparison and temporal diagnosis concluded. Those
outcomes stay frozen. Selection of these three positive references is consumed,
post-read selection, not fresh physical validation or a representative cohort.

## Question and decision

Can at least one of the three original-query cadence cases be linked to a single,
isolated, reliability-screened GLIMPSE 4.5-micron catalogue counterpart under a
fixed projected-position test? This would supply an explicit native counterpart
for inspection, not establish the WISE emitter, clump membership or youth.
The primary endpoint is the number of cases meeting the full rule below;
**at least one of three** constitutes scoped projected-counterpart support.
Zero means no such support demonstrated, not absence of a star. A failed transport,
schema or identity gate means incomplete evidence, not a scientific negative.

The three exact designations and fixed ICRS query centres are:

| Case | RA degrees | Dec degrees | GLIMPSE release |
| --- | ---: | ---: | --- |
| HIGALBM330.8814-0.3656 | 242.585210 | -52.099141 | I Spring 2007 |
| HIGALBM351.2258+0.6937 | 260.038850 | -35.912856 | II Spring 2008 |
| HIGALBM353.4272-0.3734 | 262.634300 | -34.688756 | II Spring 2008 |

All three retain their original clump IDs, native proxy-state strings, unknown
physical stage and source-selection history. All 19,328 requested parent IDs and
19,066 unknown proxy states remain in the prior all-parent ledger; this focused
study neither changes that denominator nor supplies a new ranking evaluation.

## Cached evidence first, then a bounded existing-survey excerpt

Inspection of `research/e13_cutouts.py` shows that the retained 32x32 products
store only `img`, `bands` and `fov_deg`, discarding FITS headers and noise. They
are not native astrometric/calibrated image evidence; do not fit their pixels or
reconstruct absent WCS/PSF/error/epoch metadata by assuming ideal geometry.
The three existing NPZ files are hash-bound as historical products only.

The accepted research program includes GLIMPSE as an existing stream. This new
registration explicitly bounds a read-only native catalogue excerpt, following
the cache-contract inspection. It is not acquisition authorized by the earlier
failed test alone, survey expansion, image downloading, paid computation or a
restart of a stopped unit. No TAP_UPLOAD, uploaded source list, E121 route,
private Atlas or E155 operation is used. Requests are public HTTPS GETs with
fixed literal coordinates, through IRSA TAP. The metadata-only preflight has
already inspected table/column definitions, not source measurements.

Make exactly six planned requests, Catalog and Archive for each case, at most
once each, in case designation order and Catalog before Archive. Use the release
appropriate to the published footprint: `glimpse_s07`, `glimpse_s07_ar`,
`glimpse2_v2cat`, `glimpse2_v2arc`. Request every native entry within **12 arcsec**
of its query centre. This is an association-alternative region, not an occurrence
aperture or new clump-membership radius. Retain all alternatives and quality
failures. Select the exact frozen columns/units listed in registration, including
native string designation/counters, positional errors, four IRAC fluxes/errors,
quality flags, close-source flag, density and band-2 detection counts.

Use `SELECT TOP 1001` and `MAXREC=1001`; >=1001 rows is a truncation failure.
Require HTTP 200, unredirected IRSA HTTPS, a complete CSV with the exact native
header and finite valid source positions within the frozen cone. Save complete
response bytes, URL, query, status, time, row count, SHA and source ordinals.
IDs stay strings, never floating-point numbers. Duplicate native IDs within a
response fail closed; Catalog and Archive aliases are distinct retained records.

Per response cap **1 MiB**, cumulative acquisition cap **6 MiB**, timeout
**90 seconds** per request, whole worker **600 seconds**. Keep a 5 GiB reserve
plus the planned stage budget before each request. On any first failure, retain
its prefix/error receipt and stop; no retry, fallback endpoint or larger cone.
No replacement data or source-selection changes after readout.

## Frozen projected-position test

Use only previously retained NEOWISE query-pass rows for each case; independently
recompute the original quality and 6-arcsecond cone decisions, exact five-string
deduplication and >30-day visit grouping. A supported visit has >=5 unique
measurements. Take its coordinate-wise median local angular offsets relative
to the fixed clump centre: x=(wrapped RA-clump RA)*cos(clump Dec)*3600,
y=(Dec-clump Dec)*3600. Invert to ICRS for great-circle separations. This centroid
is a diagnostic of the query's detections, not a PSF fit or physical single source.

A Catalog record qualifies if coordinates and positive dra/ddec <=1 arcsec are
finite, f4_5 and df4_5 are finite positive, sn_4_5>=5, m4_5>=2, csf==0 and
sqf_4_5==0. The all-zero band flag is deliberately conservative; no loosening
if it rejects useful rows. Retain every failure/reason and other-band values.
Do not use colours to assign a stage or fit new model features.

For every Catalog and Archive record count supported visit medians within
**2 arcsec**, retaining all visit/source edges and separations. A candidate must
cover >=ceil(0.90*V) of the V supported visits, where V>=3; their first-to-last
visit-mean epoch span must also be >=365 days. No fraction or tolerance tuning.

Require exactly one qualifying Catalog candidate with that coverage. It must
have exactly one Archive positional alias within **0.5 arcsec**, and that alias
must have exactly one Catalog record within 0.5 arcsec (reciprocal uniqueness).
Every other Archive record is a competitor, regardless of photometric flags.
No competitor may cover >=ceil(0.10*V) supported visit medians within 2 arcsec.
All candidates, aliases and competitors stay in output; no nearest-only collapse.

No WISE positional uncertainties or exposure/source IDs are restored by this
catalogue. GLIMPSE and WISE epochs differ; proper motion is not propagated in
this fixed test. Native GLIMPSE quoted errors alone do not calibrate the match.
There is no association probability, confidence interval, full-reliability or
unique-emitter claim. Alternative off-cone objects and diffuse/background emission
are not excluded. The Catalog/Archive distinction is not independent validation.
Physical clump ownership, extinction, distance and stage remain unknown.

## Verification, outputs and stopping

Write three case rows, all native source records with aliases/quality decisions,
every supported-visit/source edge, a summary and checkpoint. Preserve the raw
responses and metadata definitions, original input hashes, failure receipts and
exact IDs. Check the old all-parent and original 3/27 temporal result unchanged.
The new native catalogue data cannot be fed into the completed model comparison.

An independent checker imports no generator functions, verifies complete raw
responses and all hashes, reconstructs visits from exact tuple sets, uses
Astropy great-circle geometry instead of haversine, and independently enumerates
all pairs, aliases, competitors and case decisions. Synthetic tests precede native
readout. Independent software replay is not independent physical truth.

One CPU thread, no GPU; worker/checker each <=600 seconds, sampled RSS<=256 MiB;
acquisition stage <=8 MiB, analysis/check stages <=4 MiB each, **16 MiB combined**
including source metadata, prefixes, logs and report. Monitor disk/pressure live.
Keep original data and coherent additive Git snapshots: protocol before native
requests, terminal acquisition receipt before readout, independently verified
result afterward. Stop the unit at its conclusion; no automatic successor,
new images, model sweep or weaker test. The full detector goal remains unmet.
333/800, unopened occurrence, N20/c6828, E29–E160 and Atlas/E155/E121 boundaries
remain intact. Logistics alone is not a scientific result or reason to publish.

## Primary source definitions

- [GLIMPSE footprint and product roles](https://irsa.ipac.caltech.edu/data/SPITZER/GLIMPSE/overview.html)
- [Native columns, errors and Catalog/Archive filtering](https://irsa.ipac.caltech.edu/data/SPITZER/GLIMPSE/gator_docs/GLIMPSE_colDescriptions.html)
- [IRSA read-only catalogue APIs](https://irsa.ipac.caltech.edu/docs/program_interface/api_catalogs.html)
- Dataset DOI [10.26131/IRSA405](https://www.ipac.caltech.edu/doi/10.26131/IRSA405).
