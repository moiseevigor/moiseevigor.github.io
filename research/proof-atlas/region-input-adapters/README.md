# Explicit adapters at region inputs

All thirty preceding region/policy candidates have a checked conditional
extension. Three require nine additional proof functions: six for the Riccati
region, one for the AI-source region and two for the dependent branching
control. The other twenty-seven functions and their binding directories are
literally unchanged. No earlier failed candidate is removed or reclassified.

[![Explicit Riccati proof adapters](adapter-wires.svg)](adapter-wires.svg)

The diagram selects two of the Riccati adapters. `A` and `C` alias the actual
computed propositions; `P` and `Q` identify particular supplied proposition
arguments. Ten links retain exact source connections and separate computed
fields. The formula shows all arguments of this application, while only its
two adapted argument wires are drawn. Layout has no mathematical metric.

## Rule and meaning

At an ordered application input, let the rebuilt producer have type `A` and
the current callable telescope require type `B`, in the same computed context.
The original direct rule remains unchanged when kernel conversion succeeds.
When the application fails and a separate strict comparison reports
non-conversion, add a new function input

```text
adapter : A → B
```

and apply it to the producer before supplying the consumer argument. The
domain retains every earlier computed binder used in `A` or `B`. The function
binder in this arrow is fresh; `B` is lifted beneath it. `A` and `B` are not
identified and no equality proposition between them is asserted. For the nine
observed inputs they are propositions, so the adapters are extra proof
implications. Value-valued adapters have not yet been calibrated.

Each adapter is an additional assumption. The constructor does not find a
proof of that assumption, establish that arbitrary adapters exist, or preserve
the original meaning under arbitrary new inputs. This is ordinary function
application used as a visual composition rule, not a new logical principle.

The original specialization supplies every original boundary value and an
identity function at each added adapter. The complete specialized result tuple
must type-check and convert to the original tuple. A closed typed equality
witness and every original result portal are checked separately. This tests
that original source values recover the original proof; merely obtaining a
well-typed new function is insufficient.

Conversion remains separate from literal source reconstruction. These nine
adapters act on proofs, where kernel conversion can use proof irrelevance.
The independent audit therefore checks source positions, application order
and identity lambda bodies separately; a conversion witness alone would not
establish those correspondences.

## Fixed candidates and observed cost

The regions and three policies are exactly those of
[region input functions](../region-input-functions/README.md) and
[dependent domains](../dependent-region-inputs/README.md): two corpus regions
and eight authored controls, thirty overlapping candidates. The added rule
does not change their members, order, source-use inventory or source contexts.

| All-position candidate | Direct rule | Additional adapters | Boundary inputs | Retained original context |
|---|---|---:|---:|---:|
| Riccati seven-call region | Rejected | 6 | 35 | 0 of 10 |
| `lean_workbook_plus_6206`, two calls | Rejected | 1 | 11 | 0 of 13 |
| Dependent proof diamond, four calls | Rejected | 2 | 11 | 0 of 3 |

All thirty extensions pass closed typing, source specialization and typed
recovery witnesses. Twenty-seven need no adapter and match the preceding
functions literally. The 93 result-portal checks count appearances across
policies, not independent source results or theorems.

The Riccati all-position interface has **41 supplied inputs**, versus five
facts and retained `J,p` for its earlier proof-argument interface. Generalizing
more positions increases the explicit conditions. This is not interface or
semantic compression. The original direct-rule rejections remain useful and
stay the reader's default.

## Provenance and independent checks

- [Native functions](native.json.gz) and [verification](verification.json.gz)
  retain source, executable, shared-library and kernel-data fingerprints.
- [Independent reconstruction](model-check.json.gz) checks every complete
  raw, reduced and closed function, original-value specialization, result tuple
  and adapter domain/body. Eighty-one damaged adapter records are rejected.
- [Paged consumer checks](pages-check.json.gz) compare all 281,756 stored-row
  appearances, 300 components and 555 binding-field portals against complete
  native graphs. Independent scope cuts and reference targets are checked;
  120 malformed/lifecycle cases refuse.
- [Figure provenance](figure.json.gz), [presentation](presentation.json.gz),
  [production browser](browser-check.json.gz), [compatibility](compatibility.json.gz)
  and [aggregate evidence](evidence.json.gz) record separate delivery checks.

Native inferred domains, original identity domains and tuple universe levels
are observations supplied to the independent constructor audit. It does not
independently infer Lean types. The finite comparison is not a general
JavaScript/Lean refinement theorem.

Fresh Lean 4.33.1 checks compare the complete Riccati type/body to its pinned
compiled module. Other original declarations and modules are absent from
packet replay. Dependency binaries are hash-verified and attributed to the
recorded Mathlib cache, not independently rebuilt. Original private scripts,
projects and raw logs remain unpublished. Only compiled terms, authored
tooling and verification records are added.

## Geometry and bounds

Choose **Additional adapter inputs** inside the existing checked-function
reader. Produced type, required type and adapter domain have exact computed
addresses. An adapter has no invented source occurrence: its source link is
explicitly the original input connection requiring adaptation. Selecting that
input leaves the computed selection intact. **Direct inputs** retains the
preceding rule, including its three rejected candidates.

Production checks select all 300 component roots, nine adapter domains,
eighteen produced/required endpoints, nine original source connections and
ten figure links. Rule switching retains all three direct rejections. Stale
controls, pending-rule retirement, missing-record retry and three malformed
links are checked separately. Four desktop/phone and light/dark audits report
no scoped accessibility violations. Six compatibility model suites and five
compatibility browser suites pass; their earlier reports remain unchanged.

The versioned page protocol keeps one 64-row cache, two index pages and one
active plus one pending navigation operation. Constructor cuts contain at
most four vertices. Complete graphs and their 131,072-row cap belong to the
offline audit; they are not loaded as whole browser tables. Source inspectors
retain their separate bounds. These are component limits, not a total browser
or process-memory theorem.

Required local-lambda closure, callable aliases without literal Pi telescopes,
value-adapter calibration, inference of useful compatibility conditions,
arbitrary dependent-region interfaces, general typing preservation and
measured human benefit remain open. The article and blog are unchanged.
The general geometric-language goal remains active.

## Reproduction

```sh
node research/proof-atlas/region-input-adapters/prepare.cjs /private/tmp/new-adapter-plan
python3 research/proof-atlas/region-input-adapters/build.py \
  --lean /path/to/lean-4.33.1/bin/lean --workdir /private/tmp/new-adapter-build
# Recover the hash-inventoried kernel data using region-native-types/recover.py.
python3 research/proof-atlas/region-input-adapters/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean --build /private/tmp/new-adapter-build \
  --plan /private/tmp/new-adapter-plan --runtime /path/to/kernel-data \
  --support /path/to/checked-riccati-support --workdir /private/tmp/new-adapter-native
node research/proof-atlas/region-input-adapters/check.cjs
node research/proof-atlas/region-input-adapters/pack-functions.cjs --check
node research/proof-atlas/region-input-adapters/check-pages.cjs
node research/proof-atlas/region-input-adapters/figure.cjs --check
# After an actual production Jekyll build:
node research/proof-atlas/region-input-adapters/check-browser.cjs
node research/proof-atlas/region-input-adapters/check-compatibility.cjs
node research/proof-atlas/region-input-adapters/evidence.cjs --check
```

Use fresh native directories. `--publish` deliberately regenerates native
records. Native resource guards remain 30 GiB free reserve, 8 GiB monitored RSS,
120 seconds per process and 64 MiB output. Temporary kernel data can be retired
after terminal checking; executable Mathlib IR is never needed here. Build
application HTML, scripts, styles and SVG normally; only finished technical
reports may be synchronized afterwards.
