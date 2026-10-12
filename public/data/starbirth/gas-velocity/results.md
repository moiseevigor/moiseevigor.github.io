# A marginal gas-velocity overlap does not establish the radio marker's membership

13 October 2026. The independently checked frozen **one-case literal velocity
criterion passes**, but its scientific interpretation is weak: only **0.1970 km/s**
of common overlap connects the historical maser interval and both broadened
dense-gas bands. The declared +1 km/s radio-shift scenario removes that overlap.
This is tentative regional gas context, not confirmed physical association,
source ownership, a young-star classification or independent detector validation.

## Fixed primary and measured values

The primary remains HIGALBM330.8814-0.3656, its original molecular record
AG1532 (`AGAL330.879-00.367_S`) and known maser 330.878-0.367, ordinal
`VIII/96/catalog.dat:000307`. The maser is 12.520 arcsec from the Hi-GAL centre
and 17.501 arcsec from the fixed best infrared point. AG1532 is
10.635 arcsec from the centre. Neither this context radius
nor the molecular beam establishes a physical clump boundary or ownership.

The maser's native range is [-60.0, -58.0] km/s; its MX/SC peaks are -59.2/-59.3.
N2H+ and H13CO+ centroids are **-62.443 and -62.566 km/s** with quoted errors
0.077 and 0.133; widths are 4.004 and 3.938 km/s. The peaks differ from the
centroids by 3.243/3.366 km/s. Both tracer centroids agree closely with each other,
but the maser peak lies outside both registered gas bands. The passing statistic
is **edge overlap**, not equality of peak or systemic velocities.

| Native molecular ID | Tracer | Centroid km/s | Quoted error | FWHM km/s | Width error | Declared band km/s |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| AG1532 | N2HP | -62.443 | 0.077 | 4.004 | 0.138 | [-64.9430, -59.9430] |
| AG1532 | H13COP | -62.566 | 0.133 | 3.938 | 0.312 | [-65.4620, -59.6700] |
| AG3005 | N2HP | -4.579 | 0.016 | 2.018 | 0.039 | [-5.7545, -3.4035] |
| AG3005 | H13COP | -4.478 | 0.078 | 1.676 | 0.183 | [-5.8845, -3.0715] |
| AG3227 | N2HP | -17.128 | 0.021 | 3.618 | 0.04 | [-19.1200, -15.1360] |
| AG3227 | H13COP | -16.791 | 0.071 | 3.231 | 0.166 | [-18.9285, -14.6535] |

All six fixed-case line fits meet the registered availability/fit rules: native
Y detections, resolved-hyperfine NG=3 for N2H+ and single-Gaussian NG=1 for
H13CO+. Resolved hyperfine structure is not three separate gas clouds.
Every nearby molecular row and full original native field remains retained;
**3** distinct native rows enter the context ledger.
The third/second cases remain secondary; they were never substituted as primary.

## Primary versus sensitivity and secondary context

The frozen gas halfwidth was FWHM/2 + 3×quoted centroid error + 1.5×quoted width
error + 0.06 km/s. The radio range was padded by 0.14 km/s. These are declared
linewidth/error/channel/rounding conventions, **not confidence bounds** or
validated systematic errors. We require a common intersection of all three
bands, not merely two pairwise radio matches. In the first field the common
interval is [-60.1400, -59.9430] km/s. All original comparison rules remain fixed.

| Case | Radio-centre offset arcsec | Radio shift -1 km/s | Zero shift (primary convention) | Radio shift +1 km/s |
| --- | ---: | --- | --- | --- |
| HIGALBM330.8814-0.3656 | 12.520 | overlap 1.1970 | overlap 0.1970 | gap 0.8030 |
| HIGALBM351.2258+0.6937 | 103.458 | gap 4.2635 | gap 5.2635 | gap 6.2635 |
| HIGALBM353.4272-0.3734 | 79.066 | gap 0.9315 | overlap 0.0685 | overlap 1.0685 |

The ±1 shifts were declared sensitivity scenarios before readout; they are
**not measured calibration offsets or guaranteed uncertainty bounds**. The first
field fails the +1 scenario, so no all-scenario robustness is established. The
third field shows a tiny 0.0685-km/s zero-shift overlap, despite its nearest marker
being 79.066 arcsec from the centre. That secondary result illustrates why a
velocity overlap cannot replace spatial or physical association. The second
field's bands do not overlap in any declared scenario; this is no starlessness
result or exclusion of unobserved radio/young sources.

No stellar velocity was measured. Doppler/LSR zero points, source errors,
rest-frequency/epoch conventions, gas displacement, distance and chance
alignment were not independently calibrated. The catalogue fits summarize a
large beam and cannot assign gas to the selected infrared point. No spectrum,
new observation or native image ownership measurement was acquired or fitted.

## Explicit metadata correction, original output retained

The frozen worker labelled literal `Vc` as `native_velocity_component`; that
name is wrong. Rathborne et al., catalogue section 4, defines Vc as **consensus
gas velocity**, while the S/A/B component designation is the native Name suffix.
The report generator independently checks exact raw fields and supplies an
[additive corrected assessment](../artifacts/radio_gas_velocity_corrected_assessment_20261013.json): consensus values remain the same
literal strings and suffixes are reported separately. Original summary/code/check
bytes remain intact. This post-read label correction changes no measurement,
selection, band, scenario, primary decision or model. Vc did not enter the test.
It is a correction of presentation semantics, not a new scientific amendment.

## Verification, resources and place against the goal

The registration and both implementations were committed at `74a45269cb91cb56d4fa9761c677517e0339e030` before
this new velocity join. All inputs remain hash-identical. Cases, historical
radio fields, chemistry references and line-width features are consumed evidence;
this is a retrospective source-specific diagnosis, not untouched physical truth.
The worker used raw cached CSV and floating-point arithmetic. A separate checker
used original fixed-width radio fields, raw molecular rows, Decimal interval
arithmetic and independent Astropy angles, importing no worker. It verified all
3 retained native rows, six line assessments and nine shift scenarios.
This establishes software reproduction, not new physical validation.

Controls/readout/check guards completed with exit zero and no resource stop.
Observed minimum free disk was 62.33 GiB;
independent checking took 3.10 seconds with
78.97 MiB sampled RSS.
Short-worker samples may miss transient peaks. Each stage stayed below 1 MiB;
the complete code/report/evidence packet is below 4 MiB. No network acquisition,
paid cloud work, model fit, other-process cancellation or original-input deletion
occurred. The NEOWISE transport stop, N20/c6828 and E29–E160 remain closed.

All old results remain: embedding 14/27 versus nonlinear 15/27 at equal 18
reviews on consumed chemistry proxies; original Spitzer 0/3, cadence 3/27 versus
14 and uncertainty 333/800 failed gates. All 19,328 IDs and 19,066 unknowns,
models/scores and every prior alternative remain unchanged. Infrared occurrence
is unmeasured; hypothetical 814 support is unvalidated; 9–25%/45–55% scenarios
remain descriptive sensitivity, not confidence bounds or physical lifetimes.
**No new star, confirmed birth, physical precision/recall or robust detector**
is established. The full goal remains active and unmet.

This unit ends with the verified marginal-overlap conclusion and semantic
correction. It authorizes no relaxed threshold, tracer substitution, acquisition,
fit or automatic successor. Results are local/unpublished until a separate
publication or app receipt exists; the earlier radio-position article stays valid.

Evidence: [frozen protocol](RADIO_GAS_VELOCITY_PROTOCOL_20261013.md),
[registration](../artifacts/radio_gas_velocity_registration_20261013.json), [all original nearby native rows](../artifacts/radio_gas_velocity_analysis_20261013/native_records.json.gz),
[unchanged original readout](../artifacts/radio_gas_velocity_analysis_20261013/summary.json),
[independent verification](../artifacts/radio_gas_velocity_verification_20261013/verification.json),
[corrected field semantics](../artifacts/radio_gas_velocity_corrected_assessment_20261013.json), [final checkpoint](../artifacts/radio_gas_velocity_checkpoint_20261013.json).
Definitions: [MALT90 catalogue sections 3–4](https://researchonline.ljmu.ac.uk/id/eprint/4139/1/MALT90_catalog.pdf),
[MMB III](https://doi.org/10.1111/j.1365-2966.2011.19383.x),
[native field contract](https://cdsarc.cds.unistra.fr/viz-bin/ReadMe/VIII/96?format=html&tex=true).
