# Native GLIMPSE counterparts: one tight alignment, no flag-free case

12 October 2026. The separately frozen native-catalogue study and independent
recomputation are complete. **Zero of three** selected cases passes every frozen
condition, including the deliberately strict `sqf_4_5 == 0` requirement. This
is not a physical negative or evidence that all returned counterparts are bad.
One known Spitzer source lies within **0.168–0.336 arcsec of all 21** supported
NEOWISE query-visit medians, but carries nonzero photometry-adjustment flags.
The positive positional evidence and failed primary gate must be read together.

No criterion, candidate, tolerance or quality flag was changed after readout.
The original missing-view comparison remains 14/27 versus 15/27 at 18 reviews;
this three-case inspection neither improves that metric nor validates physical
precision/recall. Its selected chemistry labels and query-support status are
consumed selection evidence. No new star, protostar stage or birth is confirmed.

## Frozen test and native acquisition

Commit `b408f9e3` froze the three exact clump IDs, six requests, 35 native fields,
source/unit definitions, geometric and quality rules before native-source queries.
Public IRSA GET queries returned Catalog and Archive entries within 12 arcsec
for each fixed field: six Catalog records and six Archive records, **not twelve
independent objects**. All six Catalog/Archive positional aliases are reciprocal
within the frozen 0.5-arcsecond rule. Exact native designation/counter strings,
all competing records, fluxes/errors, quality flags and response bytes survive.

The six responses total **4,696 bytes**. No coordinate list was uploaded, request
retried, new survey introduced, image downloaded or paid cloud job run. The two
metadata-only preflight requests were separate table/column-definition reads,
not source measurements. Existing scale-normalised E13 cutouts discard FITS
headers/noise and were not fitted or treated as native astrometric images.

The test required exactly one isolated Catalog counterpart passing finite
positive positional errors <=1 arcsec, positive 4.5-micron flux/error, SNR>=5,
>=2 detections, clear close-source flag and an all-zero band quality flag. It
also required >=ceil(90% of supported visit medians) within 2 arcsec, a >=365-day
visit-mean span, reciprocal Catalog/Archive alias uniqueness, and no other
Archive record meeting the frozen 10% competitor coverage. Archive alternatives
were retained irrespective of photometric quality. All 180 visit/source edges
and all 14 possible Catalog/Archive pairs were checked independently.

## Positive geometry and the three different limitations

| Selected clump | Best positional Catalog record | Matched supported visits | Primary limitation |
| --- | --- | ---: | --- |
| HIGALBM330.8814-0.3656 | SSTGLMC G330.8829-00.3661 | **21/21** | Nonzero quality flags; otherwise this is a tight projected alignment |
| HIGALBM351.2258+0.6937 | SSTGLMC G351.2258+00.6940 | **14/19** | Below the required 18/19; nonzero quality flag |
| HIGALBM353.4272-0.3734 | SSTGLMC G353.4273-00.3723 | **4/6** | Below the required 6/6; nonzero quality flag |

These are maximum geometric coverage records, not substitute candidates admitted
by a new primary rule. All other Catalog/Archive records remain in the ledger.
The only zero-flag Catalog record, `SSTGLMC G353.4284-00.3731`, matches **0/6**
supported visit medians. Close-source flags are zero for all six Catalog records;
that alone does not establish the emitter of the WISE measurements.

For the first case, the clump is at ICRS (242.585210, -52.099141) degrees. The
Spitzer record is at (242.587533, -52.098443), **5.7189 arcsec** from the clump
centre, with quoted coordinate errors of 0.3 arcsec. Its 4.5-micron flux is
101.900002 mJy with quoted error 6.743000 mJy. All 21 visit medians are near that
Spitzer position, **0.1684–0.3357 arcsec**, rather than the dust-clump centre.
There is one Catalog record and one reciprocal Archive alias in this fixed cone.

The position is outside the original <=3-arcsecond AllWISE-to-clump search.
This supports a concrete missed-centre-association interpretation for this case;
it does not prove that an AllWISE source exists there, identify the WISE emitter,
establish clump membership or justify expanding the old model's matching rule.
A dust-clump peak and a possible compact emitter are different coordinates.
The prior native catalogue source is also an existing-emitter alternative to
any future claim of novelty; catalogue presence alone cannot determine its age.

## A quality-flag lesson, not a repaired result

The first counterpart has `sqf_4_5=1536`, the sum of one-based bits **10 and 11**.
IRSA documents these as positive and negative PSF-photometry adjustments. Its
explanation explicitly distinguishes such adjustments from reliability-compromising
artifacts: they can increase flux uncertainty without invalidating the source.
The other geometrically matched records carry bit 11 (value 1024) and bit 10
(value 512), respectively. [Official flag definitions](https://irsa.ipac.caltech.edu/data/SPITZER/GLIMPSE/gator_docs/GLIMPSE_colDescriptions.html).

The frozen all-zero rule therefore excludes a source with very strong positional
agreement for a **conservative rule choice**, not a demonstrated false detection.
We retain the failed 0/3 primary result; no post-read bit exemption or new pass
count is asserted. Future protocols should interpret instrument-specific flag
semantics before freezing a quality gate, and distinguish fatal problems from
uncertainty-increasing corrections. A blanket zero flag is a stricter subset,
not a physical definition of a trustworthy or untrustworthy source.

The Catalog and Archive are filtered products from shared observations, not
independent validation. The larger Archive cannot recover every unresolved or
diffuse component. Native quoted Spitzer errors do not supply missing WISE
positional uncertainties, native exposure/source IDs or a calibrated association
probability. Epoch differences, unmodelled proper motion and systematic offsets
remain limits. These caveats prevent an emitter-ownership or physical-stage claim.
[Product roles and footprint](https://irsa.ipac.caltech.edu/data/SPITZER/GLIMPSE/overview.html),
dataset DOI [10.26131/IRSA405](https://www.ipac.caltech.edu/doi/10.26131/IRSA405).

## Historical system rankings and catalogue statements

All three clumps were already selected by **all four** frozen methods at the
all-requested budget of 982 reviews, before the new GLIMPSE readout. The existing
embedding scores are 0.9564869181, 0.6959411573 and 1.3350584606 in case order.
They are fold-specific ranking scores, **not probabilities**; the value above
one makes that distinction particularly visible. The native counterparts have
not been fed into those models and no ranking was recomputed.

Hi-GAL's catalogue-prestellar label, consumed molecular-tracer detections and a
GLIMPSE point-source record answer different questions. None is representative,
independent physical protostar truth. A catalogue-labelled prestellar clump can
have a projected infrared source; dust and stars are not mutually exclusive
classes. The three local evidence cards preserve those statements separately,
with existing system scores/review decisions, all native alternatives and the
actual unresolved physical stage. They are assessment cases, not discoveries.

## Independent verification and resources

The independent checker imported no generator functions. It verified every input
and native-response byte hash, source ID/ordinal, native field, original query
screen, deduplication, visit median, source edge, reciprocal alias and case result.
It used Astropy great-circle separations instead of haversine and NumPy medians
instead of the worker's statistics implementation. The full 19,328-ID original
parent and 19,066 unknown proxy states remain unchanged. Software recomputation
is not independent physical truth or a separate human adjudication.

Acquisition took 72.11 seconds, analysis 1.09 seconds and independent checking
2.08 seconds. Peak sampled RSS was 32,358,400 bytes for acquisition and
99,467,264 bytes for checking; the fast analysis's 2,048,000-byte sample does
**not** establish its actual transient peak. All recorded system-pressure samples
were normal, with minimum observed free space about 53.98 GiB. No resource
violation occurred. Sampling can miss short peaks. Combined outputs, metadata,
source cards and the final checkpoint remain below the 16 MiB cap.

## Conclusion and stopping

This unit supplies native, source-bound cross-survey evidence: one known infrared
counterpart is tightly aligned with every supported query-visit median despite
being offset from the dust centre. It also demonstrates why the other two
projected associations are not stable under the fixed coverage rule. The primary
strict flag-free gate still failed, and none is physically classified or confirmed.

Do not treat 0/3 as absence of useful counterparts, or 21/21 as certain emitter
identity, clump membership, detector precision or a stellar birth. The next
physical evidence need is controlled native-image/PSF association and independent
membership/stage evidence; one promising positional case is not a representative
validation set. No new fit, relaxed flag rule, image acquisition or successor
experiment follows automatically. This unit ends here; the full goal stays unmet.

The original comparison, 3/27 query-support diagnosis, 333/800 gate and unopened
occurrence readout stay fixed. N20/c6828, E29–E160 and Atlas/E155/E121 restrictions
remain unchanged. Local outputs are unpublished until a separate matching public
receipt exists. Acquisition/replay alone is not counted as a scientific finding.

## Evidence

- [Frozen protocol](NATIVE_GLIMPSE_ASSOCIATION_PROTOCOL_20261012.md)
- [Registration](../artifacts/native_glimpse_registration_20261012.json)
- [All six raw responses and acquisition receipt](../artifacts/native_glimpse_acquisition_20261012/acquisition.json)
- [Every native source and quality decision](../artifacts/native_glimpse_association_20261012/sources.csv)
- [All visit/source edges](../artifacts/native_glimpse_association_20261012/visit_source_edges.csv)
- [Catalog/Archive aliases](../artifacts/native_glimpse_association_20261012/catalog_archive_aliases.csv)
- [Three fixed case decisions](../artifacts/native_glimpse_association_20261012/cases.csv)
- [Summary](../artifacts/native_glimpse_association_20261012/summary.json)
- [Independent verification](../artifacts/native_glimpse_verification_20261012/verification.json)

Summary SHA-256: `8d619970a4a55c9bf90437a23cd8aa0978e964492be2c0c36f50d3b1fe2cec2b`.
