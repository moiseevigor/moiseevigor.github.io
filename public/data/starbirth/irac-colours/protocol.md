# Retrospective IRAC colour evidence for the three positional cases

12 October 2026. This is a distinct, bounded physical-evidence diagnostic under
`RESEARCH_GOAL.md`, not another run of the failed native association or ranking
comparison. It asks whether the retained counterpart photometry supplies the
necessary red colours of one established IRAC Class-I selection scheme. A stable
position and a chemistry rank are not youth evidence. This check addresses that
specific interpretation gap before any further fitting or observations.

## Consumption and exact scope

The three cases and the best positional Catalog records are already selected,
consumed and read. Their magnitudes were inspected before this diagnostic was
registered and appear near zero colour. The selection is not representative,
untouched validation or a preregistered physical discovery. Freeze this diagnostic
implementation, exact inputs, literature contract and reporting rules in Git
before execution. No new photometry, source choice, flag exemption or old rule is
permitted. Keep all six Catalog records and six Archive aliases as alternatives,
not twelve independent objects. Best records remain those in the verified cards:

- HIGALBM330.8814-0.3656 — SSTGLMC G330.8829-00.3661
- HIGALBM351.2258+0.6937 — SSTGLMC G351.2258+00.6940
- HIGALBM353.4272-0.3734 — SSTGLMC G353.4273-00.3723

Retain exact IDs, native magnitudes/errors/fluxes and missing values, the original
rank scores, flags, membership/stage unknowns and all earlier failed gates. The
19,328-clump parent and its 19,066 unknown proxy states stay unchanged. Results
concern these counterpart records, never every emitter inside their dust clumps.

## Published comparator and applicability

Gutermuth et al. (2009), Appendix A.1, pp.27–29 (PDF pages indexed 26–28),
[arXiv:0906.0201v1](https://arxiv.org/pdf/0906.0201v1),
[DOI 10.1088/0067-0049/184/1/18](https://doi.org/10.1088/0067-0049/184/1/18),
specifies four IRAC detections with magnitude uncertainties <0.2 mag and
contaminant rejection before Class-I colour selection. The two colour conditions
are [3.6]-[4.5] >0.7 mag and [4.5]-[5.8] >0.7 mag. These are a necessary colour
component of that scheme, not a universal definition of a physical protostar.
Other phases require additional near-IR or 24-micron evidence.

Implement only this declared applicability/necessary-colour component, not the
full contaminant or Class-I/II classifier. Missing near-IR/24-micron evidence
means those alternative routes are not evaluated; identifiers are not photometry.
Missing 8-micron photometry is not an upper limit or physical nondetection.
Missing per-band quality flags, extinction, deblending and ownership also remain
unresolved. Do not call this a complete standard-consensus classification.

## Frozen calculation and sensitivity

Use native Vega magnitudes directly. A band is calculable only if magnitude and
positive quoted magnitude error are finite, and native flux and error are finite
and positive. Preserve blank strings and invalid reasons; never impute a missing
band as zero, derive a flux limit from absence or pool Catalog/Archive aliases.
Compute all six band-pair colours for every retained record, especially c12 and
c23. Four-band photometric availability requires four valid bands, each quoted
magnitude error <0.2. This is necessary availability, not full quality eligibility.

For colour c=m_a-m_b and unknown correlation rho in [-1,1], linear quoted-error
propagation gives Var(c)=s_a^2+s_b^2-2*rho*s_a*s_b. Its standard deviation range
is [|s_a-s_b|,s_a+s_b]. Record the independent-error reference sqrt(s_a^2+s_b^2)
but do not assume it is validated. Compute c +/- k*(s_a+s_b) for fixed k=1 and 3.
These are quoted-error sensitivity envelopes, not calibrated confidence bounds,
physical exclusion regions, upper limits or posterior probabilities. Corrected
photometry, unmodelled systematics and non-Gaussian error may lie outside them.
Shared bands induce joint colour covariance; do not multiply marginal probabilities
or infer a joint compatible solution just because two marginal envelopes overlap.

For each of the three fixed best records, record:
1. four-band photometric availability and exact missing/invalid bands;
2. central c12/c23 >0.7 necessary condition, or unknown when missing;
3. robust necessary-colour support if both lower 3x envelopes exceed 0.7;
4. quoted-error incompatibility if at least one available upper 3x envelope is
   <=0.7; otherwise unresolved, never classify the source as starless/field star;
5. 1x and independent-error-reference values as explicitly secondary diagnostics.

The endpoint is a three-row decision table and counts for those fixed states.
The red-colour support criterion is both robust inequalities, not a post-read
new astrophysical threshold. Missing/inapplicable full classification remains
unknown even when a necessary central colour fails. No primary ranking gain,
physical precision, population recall, birth, membership or occurrence is measured.

## Reproducibility, controls and stopping

Hash-bind the six complete original responses, native-source CSV, verified cards,
association summary and independent receipt, final native checkpoint, literature
contract and new protocol/code. Verify each card's chosen native source against
response key and exact ordinal/counter and retain every alternative. Generator
uses decimal differences/envelopes with floating square-root reporting; the
independent verifier reads raw responses directly, uses exact Fraction arithmetic, derives all pair values independently and verifies
card/native links, all outputs and endpoint counts without importing the worker.
Synthetic checks cover missing bands, strict > boundaries, equality, unknown
covariance extremes, invalid errors and shared-band covariance.

Offline only, one CPU, no GPU, no network worker or model rerun. Guard each
worker at 256 MiB sampled RSS, ten minutes and 1 MiB of outputs including resource
receipts. Combined report/registration/analysis/verification/code <=4 MiB; maintain
5 GiB free. Stop on hash, schema, identity or resource failure; retain failed
attempts. Do not automatically substitute sources, acquire bands or retune cuts.
Finish with a source-bound positive, incompatible or insufficient colour-evidence
assessment and its physical limitations; verify independently and snapshot in Git.
The full detector goal remains unmet. A further unit needs distinct justification.
