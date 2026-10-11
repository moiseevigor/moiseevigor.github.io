# Implementation evidence for the column-uncertainty bottleneck

11 October 2026. The separately registered static audit found a concrete internal
covariance route, but **no release-bound integrated-column uncertainty** for our
cached Hi-GAL maps. The original uncertainty gate remains 333/1,000 against the
required 800; the infrared occurrence comparison stays unopened. No new physical
fraction, birth or detector validation follows from this implementation result.

## What the pinned implementation actually does

The repository linked by the [PPMAP installation documentation](https://ppmap.readthedocs.io/en/latest/installation.html)
was pinned to `30445cabe3416c6ca0acc33d2138cf80f531442c`, dated 14 November 2020.
Only seven small source/license files and commit/tree metadata were fetched.
No repository install, external code execution, PSF or observation acquisition ran.
The saved MIT license accompanies the complete source bytes.

In [pperr.f90, lines 170–250](https://github.com/ahoward-cf/ppmap/blob/30445cabe3416c6ca0acc33d2138cf80f531442c/src/pperr.f90#L170-L250),
states include neighbouring spatial cells, temperature and beta. A noise-scaled
response constructs a full Gram matrix, augmented by a beta entry and a diagonal
posterior-prior term, then inverted. This is more than a diagonal-only calculation.

However, [lines 260–283](https://github.com/ahoward-cf/ppmap/blob/30445cabe3416c6ca0acc33d2138cf80f531442c/src/pperr.f90#L260-L283)
return central marginal errors with floors, fallback conditions and kernel
scaling, then discard the matrices. [ppmosaic.f90, lines 660–737](https://github.com/ahoward-cf/ppmap/blob/30445cabe3416c6ca0acc33d2138cf80f531442c/src/ppmosaic.f90#L660-L737)
uses one selected peak tile and interpolates background/peak errors over the
mosaic. Its [output block, lines 841–914](https://github.com/ahoward-cf/ppmap/blob/30445cabe3416c6ca0acc33d2138cf80f531442c/src/ppmosaic.f90#L841-L914)
writes differential-error cubes and summed column, not a full covariance product.
Released interpolated marginals cannot simply be treated as the raw inverse's
diagonal entries or used to recover its missing off-diagonal terms.

## Binding and implementation limits

`readrho.f:26–33` reads `OBJCD` and `N_POST`; `pperr.f90:67–69,239–243`
uses them as the occupation-to-column scale and posterior occupancy. `ETA=10`
alone does not recover those terms. `writerho.f:56–60,110–116` writes a four-axis
cube with these metadata, whereas the inspected archival uncertainty headers
have three axes and lack those normalization cards. This schema difference does
not identify the archive's generating version. No explicit release/commit
binding was established; the currently inspected repository is not a certified
generator of the older Hi-GAL products.

A separate static concern occurs at `pperr.f90:222,242–247`: `gamma0` is allocated,
only its diagonal is assigned, then the full array is passed for inversion.
Complete-file inspection finds no pre-inverse off-diagonal initialization.
`inversep.f90` does not initialize its input matrix. This prevents treating the
pinned code as an unvalidated covariance oracle. It is **not evidence that the
archived errors are wrong**: neither their implementation binding nor numerical
impact was established. The audit does not execute or repair third-party code.

## Scientific decision

The useful result is an explicit route to test, with explicit missing evidence.
A future independently registered validation would need the archive's source
version, matching PSFs/noise and prior/column normalization. It would propagate
the relevant central-state covariance as `w^T C w` and separately validate the
marginal floors, fallback and mosaic interpolation on the same frozen sightlines.
The internal matrix alone does not certify the released total-column error.

Until that binding and validation exist, real-clump covariance remains unknown.
Do not use the hypothetical independent-bin count of 814 to replace the failed
333 primary result, reduce the denominator or tune the 0.30 bound. This bounded
audit ends with insufficient release-bound uncertainty; it launches no automatic
reconstruction or successor experiment. It preserves the [cached-product audit](COLUMN_COVARIANCE_AUDIT_RESULTS_20261011.md)
and every earlier failed gate.

## Evidence and resource accounting

Registration/fetcher commit: `856a4463`. `artifacts/ppmap_source_audit_20261011/`
contains complete pinned source, request hashes, `readout.json` and independent
`verification.json`. The verifier independently reconstructs the recursive Git
tree, checks blob SHA-1 and response SHA-256, and checks ten source-line ranges
and the pre-inverse assignment inventory. These establish static source claims,
not numerical validity or physical measurements.

Nine requests returned 124,017 body bytes; the stage at verification was 160,401
bytes, below the 2 MiB cap. Three guarded acquisitions completed without a limit
violation. The largest sampled process-group RSS was 49,283,072 bytes (47.0 MiB);
minimum observed free disk was 55,376,297,984 bytes (51.6 GiB). Sampling can miss
short memory peaks. The response fetcher enforces cumulative byte limits; the
nested guards monitor their own stages, and the independent verifier checks the
entire audit-stage size. No bulk observations were downloaded or deleted.
