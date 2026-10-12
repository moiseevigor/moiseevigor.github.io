"""Present an already independently checked result with its failed sensitivity; no research."""
from pathlib import Path
B=Path('/Users/igor/Work/me/moiseevigor.github.io')
p=B/'_posts/2026-10-12-hidden-protostars-missing-view-ranking.md';s=p.read_text();assert 'id="gas-velocity"' not in s
s=s.replace('<a href="#radio-context">Nearby radio activity</a>','<a href="#radio-context">Nearby radio activity</a><a href="#gas-velocity">Does the gas velocity agree?</a>')
section='''<h2 id="gas-velocity">A narrow velocity overlap is not a shared object</h2>

**Verified gas–radio comparison · 13 October 2026.** Could the nearby historical maser belong to the first dust region even though it is separated from the best infrared point? The fixed primary case, **`HIGALBM330.8814-0.3656`**, has only **0.1970 km/s** of common overlap between the declared maser band and both broadened molecular-gas bands. The literal overlap rule passes, but the declared **+1 km/s** radio-shift sensitivity removes that overlap. **Physical membership remains unestablished.**

The cached molecular record is **`AG1532` / `AGAL330.879-00.367_S`**; the historical radio record is **`330.878-0.367`**, native row `VIII/96/catalog.dat:000307`. These are previously inspected references, not newly discovered objects or fresh validation cases. The gas centroids, **−62.443** and **−62.566 km/s**, agree closely with each other. The maser’s native range is **−60.0 to −58.0 km/s**, with catalogue peaks **−59.2 / −59.3 km/s**. Its peak lies outside both declared gas bands. The statistic is **wing overlap, not agreement of peak or systemic velocities**.

<div class="sb-ledger" role="region" aria-label="Declared velocity bands of the fixed primary region, in kilometres per second" tabindex="0" markdown="1">

| Primary record | Declared band (km/s) |
|:--|:--|
| N₂H⁺ gas fit | **−64.9430 to −59.9430** |
| H¹³CO⁺ gas fit | **−65.4620 to −59.6700** |
| Historical maser, padded native range | **−60.1400 to −57.8600** |
| Common intersection of all three | **−60.1400 to −59.9430** |

</div>

The frozen gas half-width is FWHM/2 + 3 × quoted centroid error + 1.5 × quoted width error + 0.06 km/s; the native radio range is padded by 0.14 km/s. These are **declared linewidth/error/channel conventions, not confidence bounds**. The separately declared shifts are **sensitivity scenarios, not measured calibration offsets**. No stellar velocity or independently calibrated relative velocity was measured.

<div class="sb-ledger" role="region" aria-label="Primary velocity overlap and its preread sensitivity scenarios" tabindex="0" markdown="1">

| Radio shift | Primary outcome |
|:--|:--|
| −1 km/s | overlap **1.1970 km/s** |
| 0 km/s, fixed primary convention | overlap **0.1970 km/s** |
| +1 km/s | gap **0.8030 km/s** |

</div>

The other two fixed fields remain **secondary context**, not substitute primaries or verified unrelated controls. The second has no overlap in any declared scenario. The third has a tiny **0.0685 km/s** zero-shift overlap, yet its nearest radio marker is **79.066 arcseconds** from the clump centre. This illustrates why a velocity match cannot replace positional and physical association; missing overlap does not establish starlessness either.

There is an explicit metadata correction. The original worker wrongly called native `Vc` a velocity component. It is the catalogue’s **consensus gas velocity**; the component designation is the **S/A/B suffix of the native Name**. The additive corrected assessment retains the original output and fixes that meaning. `Vc` did not enter the test: no measurement, selection, equation or decision changed. The N₂H⁺ three-component fit resolves hyperfine structure; it is not three distinct gas clouds. [Native catalogue definitions, sections 3–4](https://researchonline.ljmu.ac.uk/id/eprint/4139/1/MALT90_catalog.pdf).

An independent check used exact original fields, Decimal interval arithmetic and separate position calculations, verifying **three native records, six tracer fits and nine shift scenarios**. This verifies the calculation, not the physical association. The gas catalogue’s beam does not assign emission to the best infrared point, which remains **17.501 arcseconds** from the radio marker. **No ownership, stellar youth, birth, new model benefit or physical precision/recall is established.** All earlier failed gates, source alternatives and unknowns remain intact.

Download [the verified assessment](/public/data/starbirth/gas-velocity/results.md), [corrected field meanings and all three cases](/public/data/starbirth/gas-velocity/starbirth-rgv-corrected_assessment.json), [unchanged original readout](/public/data/starbirth/gas-velocity/starbirth-rgv-analysis-summary.json), [three complete native molecular records](/public/data/starbirth/gas-velocity/starbirth-rgv-analysis-native_records.json.gz), [independent verification](/public/data/starbirth/gas-velocity/starbirth-rgv-verification-verification.json) and [frozen protocol, code and full source hashes](/public/data/starbirth/gas-velocity/README.md). Exact exports bind research revision `dc8d8ca3349d68f6c1d9b0aa5431ac894383ac10`. The native NEOWISE quality retry remains stopped pending explicit human approval; this publication acquired no observations or measurements.

'''
assert s.count('<h2 id="unknowns">')==1
p.write_text(s.replace('<h2 id="unknowns">',section+'<h2 id="unknowns">'))
p=B/'_posts/2026-10-11-hidden-protostars-research-program.md';s=p.read_text()
para='''The fixed first-field gas–radio comparison adds only **0.1970 km/s** of common velocity-band overlap. The literal criterion passes, but the declared **+1 km/s sensitivity removes overlap**; maser peaks lie outside both gas bands. This is marginal regional context, not confirmed membership or support for the infrared point. All earlier failed gates remain. [Read the measured bands, failed sensitivity and metadata correction](/astrophysics/2026/10/12/hidden-protostars-missing-view-ranking/#gas-velocity).

'''
assert s.count('<h3 id="historical-week">')==1
p.write_text(s.replace('<h3 id="historical-week">',para+'<h3 id="historical-week">'))
p=B/'_data/series.yml';s=p.read_text();needle='No confirmed birth or validated physical detector; the earlier 333/800 occurrence gate remains failed.';assert s.count(needle)==1
p.write_text(s.replace(needle,'First-field gas/radio bands overlap by only 0.1970 km/s; +1 km/s sensitivity removes overlap, and physical membership is unestablished. '+needle))
print('Added verified one-case result with failed sensitivity, original output and corrected metadata; preserved program-only listing and historical findings.')
