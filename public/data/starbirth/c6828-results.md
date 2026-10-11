# c6828 source association: insufficient evidence under the frozen protocol

The accepted offline unit is finished. Its registered prerequisite gate failed:
the consumed catalogue supplied **one** eligible local reference candidate,
where **two spatially separated references** were required. No new centroid,
PSF, difference-source separation or birth fit was performed. Separation of the
changing emitter from pre-existing emission remains **unestablished**. This
neither confirms a birth nor proves that the emission comes from one source.

The protocol was committed as `81e82fa4` before measurement readout; implementation
and missingness/geometry controls were committed as `efa3b115`. The one worker
finished with exit code 0 in 6.53 seconds, returning `insufficient_evidence`.
The independent verifier also finished with exit code 0. There was no restart,
changed threshold, acquisition, model training or automatic successor.

## What passed and what stopped the unit

| Registered requirement | Observed support | Consequence |
|---|---|---|
| Native intensity, uncertainty and mask inputs | All three channels existed for all 69 selected frames; 207 complete file hashes match the registration | Native pixels were available; display images were not used as photometry |
| Native central support | Producer classified 65/69 frames as usable; three failed the central valid-pixel threshold and one had a clipped target disk | Retain all four failures and their visits |
| Pre/post support | At least three usable frames in pre visits 0, 2, 4, 6 and post visits 8, 10, 12, 14, 16, 18, 20 | The registered minimum of three supported visits per window passed |
| Local reference candidates | 13,905 catalogue rows; 4,442 pass clean-W2/SNR filtering; 87 deterministic positional clusters; only cluster 5 qualifies in the 8–15 arcsec reference annulus with three pre and three post visits | Fewer than two separated candidates: stop before fitting |
| Independent check | 213 complete file hash checks, exact frame selection and independently reconstructed catalogue clusters; 68 independent native central-fraction checks | The terminal control-gate decision is reproduced |

The single reference candidate has catalogue median coordinates
(139.6176675, −52.26194615) degrees, 13.800801 arcsec from the target, and
502 retained catalogue observations. It remains a **candidate reference**:
no new PSF/astrometric stability measurement was made. A source at about
20.604099 arcsec appears in the consumed catalogue but is outside the frozen
control annulus; the annulus was not expanded after seeing the result.

The catalogue cluster about 0.522131 arcsec from the clump position contains
pre and post detections. That is consumed catalogue evidence consistent with
the already-known pre-event aperture emission. It does not resolve which blended
emitter varies, establish clump membership or exclude every physical birth.

## Limits and detector implications

This is a conditional failure of the registered source-association method,
not proof that source separation is impossible in every method or data set.
The two-reference criterion was frozen to control local position/PSF changes.
One candidate reference does not meet that criterion and cannot be silently
promoted into a measured pair. Native channel availability alone does not supply
the missing astrometric control.

The historical c6828 brightening and incomplete pre-event coverage remain
unchanged. No observing gap became a physical non-detection. The native WCS uses
FK5 and an obsolete RADECSYS header spelling; inputs were preserved. The numeric
coordinate convention was held fixed for this gate; no absolute cross-frame
astrometric accuracy is asserted. The verifier rechecked central fractions for
the 68 frames with that diagnostic; the producer's separately flagged clipped
disk was not counted as a certified central fraction.

The complete newborn-star detector objective remains unmet. This unit supplied
no physical-birth positive labels, source-ownership probabilities or population
precision/recall. No separation interval was computed, because the necessary
control gate failed. Stop this finite unit. Any further scientific action needs
a distinct justified prospective protocol and scope; the failed N20 worker and
E29–E160 archive remain closed. Atlas restoration/cancellation and the rejected
E155/E121 transfers were not approved by this study's acceptance and were not
attempted.

## Evidence and costs

- [Frozen protocol](C6828_SOURCE_ASSOCIATION_PROTOCOL_20261008.md)
- [Input registration](../artifacts/c6828_source_association_20261008/registration.json)
- [Complete prerequisite readout](../artifacts/c6828_source_association_20261008/prerequisites.json)
- [Independent verification](../artifacts/c6828_source_association_20261008/verification.json)

Five targeted controls passed before readout: RA wrapping, rejection of missing
contamination flags, rejection of references too close to count as an independent
pair, native channel translation/fatal masking, and refusal of misaligned
uncertainty WCS. An initial test exposed a pandas missing-boolean incompatibility;
it was corrected before the single scientific worker ran.

Worker plus compact evidence used about 120 KiB before this report. No large
arrays or images were generated. The 64 MiB output cap and 5 GiB reserve passed.
Git snapshots preserve code, protocol and compact evidence; the native survey
inputs remain local and hash-bound. These records do not establish an external
backup or a published Atlas update.
