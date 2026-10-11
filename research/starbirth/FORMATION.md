# Interactive formation sequence

Added to the existing hidden-protostars article on 11 October 2026. A native
range input scrubs a deterministic canvas illustration from molecular cloud to
main-sequence star. Nine milestone buttons, optional 24-second playback, reset
and an explicitly labelled central cutaway support exploring the sequence.

The article includes `_includes/starbirth-formation.html` and the scoped
`public/css/starbirth-formation.css` and `public/js/starbirth-formation.js`.
No framework, external drawing library, image download, research observation or
model training is used. Rendering is idle unless the reader scrubs, resizes or
chooses playback; hidden-page playback pauses. Reduced-motion preference disables
playback, retaining manual navigation. Canvas coordinates use one scale for both
axes. The visual zoom changes as the cloud contracts; it is not a physical size
axis, numerical collapse model or calibrated stellar clock.

## Physics and scope

This is a representative low-mass/Sun-like pathway. It includes a contracting
prestellar core, first hydrostatic core, molecular-hydrogen dissociation/second
collapse, second-core formation, envelope accretion/clearing, disk evolution,
pre-main-sequence contraction and sustained hydrogen fusion. First-core slow
flows are possible/model-dependent. Class 0–III are approximate observational
descriptions, not unambiguous ages or separate universal physical milestones.
Fragmentation, inclination, stellar mass and overlapping processes prevent a
universal one-dimensional clock. Deuterium burning can precede main-sequence
hydrogen burning. The project's birth definition remains second-core formation.
Nothing in the illustration is a newly detected star or research result.

Sources are linked in the phase panel and caption:

* Young (2023), https://arxiv.org/abs/2312.03039 — first/second-core physics.
* Dunham et al. (2014), https://arxiv.org/abs/1401.1809 — protostars and envelopes.
* Ercolano & Pascucci (2017), https://arxiv.org/abs/1704.00214 — disk dispersal.
* Furlan et al. (2016), https://arxiv.org/abs/1602.07314 — classes/viewing angle.
* NASA stars, https://science.nasa.gov/universe/stars/ — main-sequence context.

## Verification

    docker compose run --rm build
    node research/starbirth/check-formation.cjs _site_production
    python3 research/starbirth/check_publication.py _site_production

The numerical checks cover bounded drawing parameters, all slider values,
continuous transitions and inclusion/accessibility/asset wiring; they do not
validate an astrophysical simulation. Supplement them with real pointer dragging,
keyboard Home/End/arrows, all nine phase buttons, cutaway/reset, playback/pause,
mobile layout, theme contrast and browser-console checks. Preserve the original
compact-evidence inventory and unrelated user changes. Keep Git snapshots for
implementation and verified publication separately.
