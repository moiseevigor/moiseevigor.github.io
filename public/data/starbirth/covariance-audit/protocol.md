# Cached covariance sufficiency audit

User-directed continued research, 11 October 2026. Freeze this distinct bounded
unit before executing the audit. Earlier 939/333 gates and five illustrative
covariance scenarios are consumed evidence, not new evaluation. The original
1,000-object primary comparison and its failed uncertainty gate remain intact.

Question: do the inspected cached products and published curvature formulation
supply a defensible total-column random uncertainty, and does positivity of a
linear response alone justify quadrature of marginal bin errors?

Inspect only the cached native-header tables in
`native_responses_car_amendment.sqlite` and `profile_responses_coalesced.sqlite`,
binding their complete hashes to existing independently verified gate records.
Verify complete header hashes and FITS END, axes, units and keyword inventories.
Search header keys/comments for covariance/correlation, an integrated error map,
response matrix, observational noise and prior/occupation conversion information.
Inspect the already cached archive README and first-tile file index. Report the
actual inspected scope; absence in these products is not an all-archive claim.
No additional header/pixel acquisition, source rows, model fits or downloads.

From Marsh et al. (2015) eqs. 15–17, the covariance approximation depends on
the full response/noise curvature and prior scale. Diagonal marginal errors do
not specify its off-diagonal entries. Check the weaker mathematical shortcut
that nonnegative response entries force summed variance <= diagonal trace:
freeze the constructed 2x3 witness A=[[1,10,0],[0,10,1]], noise I and eta=1.
Compute C=(I+A^T A)^-1 with exact rational Gauss–Jordan elimination, verify
positive definiteness, and compare 1^T C 1 with trace(C). Independently verify
using a cofactor inverse and exact principal minors. This is a preconstructed
algebraic witness, not an unseen astrophysical prediction or an actual Herschel
response. It tests only the general positivity shortcut, not the physically
constrained PPMAP operator or the validity of PPMAP itself.

Decision: a fully bound integrated-error/covariance/operator-and-noise product
can motivate a separately frozen uncertainty validation. Marginal-only cached
products or incomplete operator/prior information cannot unlock occurrence
readout. A positive shortcut counterexample rejects that general justification
for quadrature; a failed witness supplies no proof of universality. Preserve all
unknowns and the unchanged 333/800 primary gate, and state exactly what additional
evidence would be needed. Do not pick independence because 814 clears 800.

Limits: one offline unit, <=10 minutes, <=1 MiB new outputs, <=256 MiB worker RSS,
one numerical thread at lowered priority, <=1-second resource polling, >=5 GiB
disk reserve. Stop only this spawned worker group if its limits or system memory
pressure warning/critical gate trips. Resource telemetry is operational evidence,
not a scientific finding. Commit registration/code before readout; independently
verify the outcome and snapshot it. No private Atlas/E155/E121 actions, archival
tranche research, cutoff changes or automatic successor experiments.

Primary context: https://arxiv.org/html/1509.08699v1 (eqs. 15–17) and
https://arxiv.org/html/1707.03808v1 (sections 3–4). The 2017 initial eta values do
not alone fix posterior replacement eta-hat, the released occupation-to-column
normalisation, observational noise or spatial response for each archived tile.
