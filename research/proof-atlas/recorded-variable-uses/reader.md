# Recorded uses in source and mixed-interface readers

Candidate integration; deployment is a separate check. Open the occurrence
reader with `diagram=construction&group=interfaces`, then select **Recorded
variable uses** or **Recorded uses of …** on a context extension. It uses the
same source inspector, type geometry, loading switch and navigation history.

The optional panel lists bounded batches of recorded source uses within the
current frame. Each row preserves the use's own context and observed role.
Binder names are compiled presentation payloads; source routes determine
identity. **Inspect use** and **Inspect binder** select those exact occurrences.
The diagram pans to the selected region or binder reference within its viewport.
Each **Type** button opens one original native observation, preserving separate
direct-query and construction-premise origins even when their types agree.
**Focus source use** returns to its original occurrence geometry.

The dashed reference link joins an existing source region to a retained binder
slot or an explicit context-reference label. A binder inside the hidden region
is labelled internal and does not become an outer-context requirement. The
reference contributes zero source occurrences. Selecting an ordinary source
port clears that reference selection; changing frames retires its controls.

Every retained context unit has two separate coverage measures after the panel
loads: recorded typed uses and original expanded syntax occurrences. A complete
syntax count is not additional typing coverage. An unavailable syntax count is
displayed as unavailable, including the seven current large-proof cases. Empty
recorded batches do not establish absence of source uses. The list remains
explicitly sparse; counts do not claim logical necessity.

`public/js/proof-atlas-variable-uses.js` is the portable consumer and bounded
gzip transport. Its reference results are compared with `index.cjs` across all
51 calibration/extraction profiles. The published delivery covers 26 extraction
profiles: 152 uses, 304 existing observations and 269 binder counts. Core
calibrations remain reference tests. Both complete and paged readers use this
sparse delivery; paged mode does not fall back to complete source/type archives.

`public/js/proof-atlas-variable-use-view.js` places the controls and references
inside the existing mixed-interface view. The source/type bridge validates the
actual source occurrence, lexical target, original context, evidence hash,
type-table/component identity and native recording before displaying an
observation. Lookup entries and supplemental construction owners stay distinct.
Bounded input bytes are copied before asynchronous hashing, so later mutation of
a caller's buffer cannot change the parsed catalogue after its hash was checked.
Late observations cannot replace a newer selection. Optional use-data failure
keeps the original interface and source navigation available for retry.

## Checks

From the repository root:

```sh
node scripts/build-proof-atlas-variable-uses.cjs
node scripts/test-proof-atlas-variable-uses.cjs
node scripts/test-proof-atlas-variable-uses-paged.cjs
```

The producer's default checks the exact canonical decoded metadata and its
content address. Gzip encodings may differ across runtimes; existing compressed
assets are retained byte for byte, and their compressed hashes are recorded
separately for deployment checks. Portable compression controls accept three
equivalent encodings and reject changed decoded content, damaged/truncated gzip
and output exceeding the expected byte bound. `--write` generates only missing
compiled metadata under `variable-use-pages` and its inventory.
It neither reads private mathematical source nor adds a native Lean job.

After the production site build, run
`scripts/test-proof-atlas-variable-uses-browser.cjs` with Playwright/axe and the
existing `ATLAS_ORIGIN` setting. Its default covers all 269 current mixed-frame
starts and each reachable distinct recorded use/observation, source and binder
selection, exact partitions, reference geometry, both loading modes, keyboard
access, four theme/viewport configurations and optional-data/stale-response
controls. Recorded uses outside these admitted context frames remain outside
this browser scope. The current admitted frames reach 124 of the 152 catalogued
uses; the remaining 28 are excluded from this browser coverage. The optional
`ATLAS_VARIABLE_USES_FOCUSED=1` run writes a
separate report with `fullCorpus:false`; it does not establish corpus coverage.

These checks establish finite correspondence and application behavior. They
add no native judgments, verified codec/renderer, general preservation theorem,
semantic abstraction or measured human inspection benefit. The general program
remains active; no blog result is claimed.


## Ordinary source cuts

In **Source occurrences**, **Recorded variable uses** opens the same optional
panel for the current source cut. Each use belongs either to one retained
`bvar` occurrence or one disjoint hidden frontier. A retained use highlights
its existing lexical edge; it adds no duplicate arrow. A hidden use links its
original region to a retained binder, an explicit original-context reference,
or a labelled binder inside that hidden region. Reference labels contribute
zero occurrences and do not change the cut's retained/hidden partition.

Retained `lam`, `forallE` and `letE` binders can filter the list. These are source
constructors; `forallE` is not reclassified as a proof introduction. Syntax
counts are available only for the binders included in the existing count
inventory. The source scene and its other nodes keep `typing: not-queried`.
Each type button attaches only the use's selected direct or kernel-premise
observation, preserving its recording owner. Alternate Meta observations remain
outside this catalogue.

Source, binder and recorded-type actions use the existing inspector. Changing
source cuts, representations or declarations retires the panel and pending
loads. Selecting an ordinary source card clears the reference selection. Both
source loading modes use the same sparse catalogue; paged mode reads bounded
source and type pages without loading complete archives. Unsupported profiles
keep their source graph available and report the missing use inventory.

The independent reference rule is `source-cuts.cjs`. Reproduce its comparison
with `node scripts/test-proof-atlas-source-variable-uses.cjs`. The finite model
checks 1,209 cuts across 51 profiles, all 170 indexed uses and 13,923 reference
placements, including the 28 public uses outside mixed frames. The browser test
`scripts/test-proof-atlas-source-variable-uses-browser.cjs` exercises all 152
public uses, retained lexical-edge reuse, actual source/binder/type selections,
failure recovery, stale controls and accessibility. `ATLAS_SOURCE_USES_FOCUSED=1`
selects one Riccati profile and produces a separate `fullCorpus: false` report.
A test description is not a passing result; inspect its emitted report.
