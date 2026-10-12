# Prospective interpretation of instrument quality flags

12 October 2026. The native GLIMPSE inspection illustrates a concrete failure
mode: a blanket all-zero quality rule rejected a counterpart aligned with all
21 supported visit medians because of PSF-photometry adjustment flags. The
failed frozen test remains unchanged; positional agreement still cannot prove
physical emitter identity or a protostar.

For future registrations, interpret each instrument's flag definitions first.
Distinguish fatal/unreliable extraction, corrections that increase uncertainty,
context/diagnostic flags, missing information and unresolved meanings. Publish
that mapping, native columns/units and exact bit numbering before readout.
Do not reuse a similarly named field's semantics across surveys. An all-zero
subset may be intentionally conservative, but its rejection is not automatically
a false detection or physical non-detection. Retain native values and reasons.

If an observed flag has benign or diagnostic semantics, report that fact without
changing a frozen primary count. Exemptions, masks or sensitivity tests that
would admit rejected cases need a separate prospectively justified protocol;
do not tune them to yield a preferred result. Catalogue inclusion, flags,
projected association and physical class remain separate evidence statements.

[GLIMPSE native flag definitions](https://irsa.ipac.caltech.edu/data/SPITZER/GLIMPSE/gator_docs/GLIMPSE_colDescriptions.html)
explicitly identify PSF adjustments that can enlarge photometric uncertainty
without compromising source reliability. The [source-bound result](NATIVE_GLIMPSE_ASSOCIATION_RESULTS_20261012.md)
keeps that interpretation, the positive geometry and the failed 0/3 criterion
together. This lesson authorizes no new fit, acquisition or relaxed old rule.
