# What the cached column errors can establish

11 October 2026. A separately frozen offline audit examined whether the existing
PPMAP cache can justify replacing the conservative uncertainty rule. It cannot
yet supply a validated total-column covariance. The primary 1,000-clump comparison
remains stopped at 333 uncertainty-supported targets against the required 800.
No infrared source occurrence, physical hidden fraction or stellar birth was read.

## Native evidence and its limits

Complete hashes and independent FITS-card scans verified 190 saved header records
across two immutable databases: 65 in the central journal and 125 in the profile
journal. These are **125 distinct native files**, comprising 65 integrated-column
headers and 60 temperature-bin uncertainty headers; duplicated central headers
were counted separately only in the journal audit, not as extra observations.

The uncertainty headers provide twelve temperature bins and `ETA=10` (dilution).
Their complete inspected keyword/comment inventories contain no full bin
covariance, response/noise operator or occupation-to-column conversion. The
cached archive description and first-tile index describe differential columns,
their marginal errors, total column and mean temperature; they do not provide
a separate integrated-error file in that inspected index. This is a statement
about the **inspected cache and index**, not a claim that no useful product or
implementation exists elsewhere.

The known ETA is useful metadata, but it does not identify the missing matrix.
[Marsh et al. (2015), equations 15–17](https://arxiv.org/html/1509.08699v1)
construct a covariance approximation from the full response, observational noise
and prior scale; the paper also permits posterior replacement of that scale.
[Marsh et al. (2017), sections 3–4](https://arxiv.org/html/1707.03808v1) describe
marginal uncertainty cubes and excluded systematic effects. A header prior value
alone is insufficient to certify the uncertainty of their summed column.

## Exact scoped counterexample

One tempting shortcut is that nonnegative emission responses imply enough
anticorrelation that the sum's variance cannot exceed the sum of marginal
variances. Positivity alone does **not** establish that claim.

For the preconstructed generic response A=[[1,10,0],[0,10,1]], identity noise
and eta=1, the inverse-curvature covariance is

    gamma = [[2,10,0],[10,201,10],[0,10,2]]
    C = (1/404) * [[302,-20,100],[-20,4,-20],[100,-20,302]]

The curvature's leading principal minors are 2, 302 and 404, so it is positive
definite. The covariance is positive definite too. Exact rational elimination
and an independent cofactor/principal-minor calculation agree:

* Quadrature variance, trace(C) = 152/101.
* Integrated variance, 1^T C 1 = 182/101.
* Excess variance = 30/101; the ratio is 91/76.

This rejects only the **general nonnegative-response shortcut**. The witness is
not an actual Herschel/Planck/PSF response, does not identify the covariance of
the real clumps, and does not show that the PPMAP algorithm is invalid. It supplies
no measured error correction or permission to replace the original primary rule.

## Decision and next evidence needed

Do not adopt independence because its hypothetical 814 supported targets clear
800. Do not substitute the 333 survivors or lower the 0.30 threshold.
A defensible continuation needs one of:

1. A source-bound integrated-column uncertainty/covariance product whose units,
   release, sample coverage and systematic scope are validated; or
2. The appropriate response/noise/prior normalisation and a validated covariance
   calculation reproducing the released marginal errors on the same sightlines.

Any actual validation or replacement measurement needs its own frozen protocol,
same-object support accounting and independent check before occurrence readout.
The goal remains unresolved; this audit ends at that specific evidential limit.
The archive, earlier failed attempts and all native bytes are preserved.

## Resource enforcement and reproduction

The worker and independent verifier ran in the resource guard as one process
group, at lowered priority and with numerical threads fixed to one. The run
completed in 0.288 seconds, with no limit violation. Sampled peak worker-group
RSS was 32,915,456 bytes (31.4 MiB), and minimum observed free space was
54,649,901,056 bytes (50.9 GiB). RSS sampling can miss sub-interval peaks; it is
not an exact peak-memory certificate. The stage was 229,494 bytes at readout,
below 1 MiB. No survey acquisition or full-cube reconstruction ran.
Cleaning only regenerable interpreter bytecode removed 15,417,895 bytes (14.7 MiB).
Resource telemetry and cleanup are operational accounting, not scientific findings.

Registration/code commit: `af75b655`. Inputs, per-header hashes and exact rational
values are in `artifacts/column_covariance_audit_20261011/audit.json`.
The independent receipt is `verification.json`; live samples are in
`resource_monitor.json`. Existing readouts are immutable; use a reviewed distinct
output path for any future protocol. The frozen producer used Gauss–Jordan
elimination; the verifier used cofactors and separate native-card parsing.
