# Tight counterpart positions do not supply red Class-I colours

12 October 2026. The registered, retrospective IRAC diagnostic is independently
verified. For the same three consumed positional counterparts, the central
[3.6]-[4.5] colours are **-0.089, +0.134 and -0.011 mag**. None exceeds the
**>0.7 mag** necessary colour cut in the declared Gutermuth et al. (2009) Phase-I
scheme. Under the frozen three-times-sum-of-quoted-errors sensitivity, the first
and third remain below this cut; the second is unresolved. **Zero of three has
the four-band photometric availability needed to apply that full scheme.**

This is no physical Class-I exclusion, field-star classification, independent
truth or probability. The selection and magnitudes were consumed before this
registration; the diagnostic is not a preregistered discovery. A lack of red
colour support for a particular point source does not exclude another protostar
inside its Hi-GAL clump. The earlier tight 21/21 positional alignment stays valid.

## Fixed records and measured colours

| Clump | Fixed best geometric Catalog record | [3.6]-[4.5] mag | Upper 3x quoted-error sensitivity | Missing bands | Assessment |
| --- | --- | ---: | ---: | --- | --- |
| HIGALBM330.8814-0.3656 | SSTGLMC G330.8829-00.3661 | -0.089 | 0.292 | 8.0 micron | Below the necessary cut throughout the declared sensitivity |
| HIGALBM351.2258+0.6937 | SSTGLMC G351.2258+00.6940 | +0.134 | 1.124 | 5.8, 8.0 micron | Unresolved under quoted-error sensitivity |
| HIGALBM353.4272-0.3734 | SSTGLMC G353.4273-00.3723 | -0.011 | 0.208 | 8.0 micron | Below the necessary cut throughout the declared sensitivity |

The first record has native 3.6/4.5 magnitudes 8.027/8.116 and quoted magnitude
errors 0.055/0.072. Its known catalogue position is 0.168–0.336 arcsec from all 21
supported query-visit medians and 5.719 arcsec from the clump centre. Positionally
it remains a strong inspection case. Its short-wave colour **does not supply the
red infrared support required by this chosen Class-I colour component**.
Its evolutionary stage and clump membership still remain unknown.

The first and third also have measured [4.5]-[5.8] colours +0.194 and +0.268 mag;
the second lacks that colour. All twelve native product records (six Catalog
records and their six Archive aliases) and all alternative colours are retained.
The full record table includes 34 calculable band pairs and every unavailable
pair as null. Archive/Catalog agreement is not independent observational truth.

## What the published comparator does and what we implemented

[Gutermuth et al. (2009), Appendix A.1](https://arxiv.org/pdf/0906.0201v1),
[DOI 10.1088/0067-0049/184/1/18](https://doi.org/10.1088/0067-0049/184/1/18),
uses four IRAC detections with magnitude errors <0.2, contaminant screening,
and two Class-I colour inequalities: [3.6]-[4.5]>0.7 and [4.5]-[5.8]>0.7.
This diagnostic implements only availability and those necessary colour checks,
not the complete classifier. Other phases require additional near-IR or
24-micron evidence not established here. The rule is not a universal physical
protostar definition, nor a consensus class for these particular sources.

The missing 8-micron values cannot be converted into upper limits or physical
nondetections. Extinction, per-band reliability, calibration/covariance,
decomposition, epoch differences and emitter ownership remain unresolved.
A corrected-photometry flag need not invalidate the source, but it does not
establish calibrated colour errors either. No full standard Class-I/II decision
is reported and no physical starless label is assigned.

## Unknown covariance and the exact conditional scope

For c=m_a-m_b, quoted marginal errors s_a,s_b and unknown correlation rho,

    Var(c) = s_a^2 + s_b^2 - 2*rho*s_a*s_b
    |s_a-s_b| <= sigma(c) <= s_a+s_b, for -1 <= rho <= 1.

The frozen primary diagnostic is c +/- 3*(s_a+s_b); the one-times envelope and
independent-error reference sqrt(s_a^2+s_b^2) are secondary. The upper c12 values
are 0.292, 1.124 and 0.208 mag. They are **quoted-error sensitivity values, not
confidence bounds, physical exclusion limits or calibrated probabilities**.
Unmodelled systematics, non-Gaussian errors and extraction problems may exceed
these envelopes. The two colours share 4.5-micron measurements; separate
marginal envelopes do not supply joint probabilities or a jointly compatible fit.

No source is newly admitted to the earlier strict zero-flag association test.
That original 0/3 gate, the 21/21 positional geometry, the failed 3/27 cadence
majority gate and the 14/27 versus 15/27 ranking result all remain unchanged.
The old 333/800 uncertainty gate also remains failed; occurrence is unmeasured.

## Our system and the source-level physical question

All three clumps were already selected by all four old ranking methods at the
982-review all-requested budget. The embedding scores remain 0.9564869181,
0.6959411573 and 1.3350584606. They rank **clump chemistry proxies**, not the youth
of a particular Spitzer point source, and they are not probabilities. No model
was fitted, changed or rerun and no new colour input was added to it.

The new comparison cards retain those historical ranks beside the published
colour-component assessment, the original geometry, every native alternative,
and physical class/membership unknown. It would be incorrect to interpret a
high clump rank as a high probability that the matched blue point source is a
protostar. Conversely, that point source's colour does not rule out an embedded
object elsewhere within the molecular beam or dust clump.

All 19,328 parent identities and 19,066 unknown qualifying proxy states remain
unchanged. These three selected, chemistry-positive cases provide neither
representative physical precision/recall nor independent held-out validation.
No new star, birth, robust detector or improved ranking is established.

## Verification, resources and stopped preflight

The registration and synthetic controls were committed at `a2eb4d5b` before the
new diagnostic worker. The first guard stopped with elevated memory pressure
**before spawning a worker**; its terminal receipt is retained at `4880314a`.
A separate Proof Atlas Lean build finished on its own. No other project was
cancelled. Resumption amendment `c889cc5e` then bound fresh stages after normal
memory pressure and sufficient free disk space returned. All inputs, rules and
limits stayed fixed. This operational stop/resumption is not a scientific result.

The resumed analysis and independent verifier both completed under the original
one-CPU, ten-minute, 256-MiB sampled-RSS, 1-MiB stage guards. Each took about
1.05 seconds including monitoring. Minimum observed free space was about
40.59 GiB. Their very short lifetimes mean small sampled RSS does not establish
actual transient peaks. No guard violation, new observations, network worker,
model fit or paid computation occurred. The combined exact evidence/report/code
packet is below 4 MiB; original observations remain intact.

The checker imports no generator functions. It reads all six original native
responses directly, uses exact Fraction arithmetic instead of the worker's
decimal differences/envelopes, and verifies every source/counter/ordinal, native
field, available and missing colour, sensitivity, case/card linkage and count.
It checked all twelve records and 34 calculable pairs. This is independent
software recomputation, not fresh physical validation or human adjudication.

## Conclusion and stop

The important change in interpretation is that **tight positional agreement and
a high clump-chemistry rank do not provide red protostar-colour evidence for the
best-aligned point source**. Its geometric lead remains useful, while physical
youth remains unestablished. The other cases also provide no robust necessary
red-colour support under this diagnostic; incomplete bands prevent full
classification. The physical detector objective remains active and unmet.

This bounded diagnostic stops here. Native-image ownership and independent
membership/stage evidence are still needed; no automatic source substitution,
weaker colour/flag cuts, band acquisition, new model fit or successor test follows.
