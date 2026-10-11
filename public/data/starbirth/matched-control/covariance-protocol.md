# Post-read diagnosis: column-error covariance and control support

User-directed continued iteration, 11 October 2026. This is a diagnosis of the
already observed uncertainty-gate failure, not a preregistered primary result.
Freeze its code and five scenarios before executing this diagnostic. No infrared
occurrence outcome, new observation, transport request or model fit is allowed.

Question: does the loss of control support remain under independent temperature
bins, or does it depend on the conservative sum-of-sigmas bound used when bin
covariance is unknown? The original gate remains failed at 333/1,000; this
diagnostic never changes the original matching rules or primary sample.

Reuse the hash-verified column profile/support and twelve-bin uncertainty
tables from the coalesced attempt. Preserve all 1,000 requested clumps and all
12,648 profile-matched possible controls. Do not change the 0.30 relative-error
threshold. At rho = 0, 0.25, 0.5, 0.75 and 1, use the illustrative covariance
matrix C = diag(sigma) [(1-rho)I + rho 11^T] diag(sigma). For twelve bins it is
positive semidefinite for -1/11 <= rho <= 1; the chosen scenarios are admissible.
The integrated standard deviation is sqrt((1-rho)sum(sigma^2) + rho(sum sigma)^2).
These are hypothetical correlation scenarios, not estimated covariances.

For each scenario report (a) valid target centres within the limit, (b) targets
with at least one profile-matched control where both arms pass, (c) control
combinations, and (d) attrition from the 1,000 requested identities. The rho=1
scenario must independently reproduce 333. Also report target-only versus
control-only failures under that original bound. Include relative-error quartiles
for target and control centres, without outcome selection or inferred truth.

Independently verify scenario counts with explicit covariance matrices and the
quadratic form 1^T C 1 rather than the producer's reduced formula. Verify all
native-input table hashes, sample identities and profile-pair membership. Save
compact diagnostic JSON only; no duplicate per-pixel exports. One numerical
thread, <=30 minutes offline, <=1 MiB new outputs, original cumulative 64-MiB
science stage and >=5 GiB free. Stop if any binding or arithmetic fails.

If independence would clear the support threshold but the original bound fails,
the gate is covariance-sensitive. This does not justify assuming independence.
If independence also fails, the marginal errors themselves remain prohibitive
under these scenarios. Neither result certifies final controls, changes the
failed registered test, estimates infrared excess or identifies hidden births.
The next research decision must concern defensible total-column uncertainty,
not a post-hoc threshold that happens to produce a larger candidate list.
