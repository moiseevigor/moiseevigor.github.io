# Proof Atlas — public research record

**Introduction:** [The Geometry of a Formal Proof](https://moiseevigor.github.io/mathematics/2026/10/11/proof-atlas-research-program/)  
**Interactive visualization:** [Proof Atlas](https://moiseevigor.github.io/projects/proof-atlas/)  
**Public structural data:** [crossing-structure.js](../../public/data/proof-atlas/crossing-structure.js)

## What is public

This directory documents a measurable experiment converting a real Lean 4 theorem's elaborated **type and proof expression** into a structural graph. The structural dataset retains anonymized labels for graph navigation. Since the authorized 12 October release, `crossing-terms.js` additionally publishes the complete exported payloads of all 7,288 occurrences in the crossing type and proof, with actual declaration names and structural paths. The original tactic script and private SE(2) manuscript source are not included.

The measured benchmark:

| Statistic | Value |
|:--|--:|
| Expression occurrences | 7,288 |
| Structural child edges | 7,286 |
| Bound variable to binder links | 431 |
| Constant-reference occurrences | 2,892 |
| Distinct directly referenced declarations | 42 |
| Longest root-to-expression path | 49 |

The private Lean exporter and validation workflow regenerated the benchmark directly from the theorem. This public projection alone is **not a standalone formal proof certificate**, and a public reader cannot fully reproduce Lean kernel validity from it.

Run `python3 research/proof-atlas/verify_public_data.py` from the site repository root to audit graph topology independently.

## Data contract

The public `crossing-structure.js` assigns a single `window.PROOF_ATLAS_DATA` object. Fields:

- `parent[i]` is the parent occurrence index, or -1 for one of two roots.
- `kind[i]` is a one-character index into `kinds`, retaining the Lean constructor class but omitting payload.
- `size[i]` is the number of occurrences below and including occurrence `i`.
- `binder` contains directed pairs from each bound-variable occurrence to its enclosing binder occurrence.
- `deps` contains direct declaration-use counts and occurrence indices, with most declaration names anonymized.
- `stats` is a verified summary from the original exporter.

The index is **not** a stable Lean source location. The term release reconstructs the original CoreGIR paths from parents and ordered constructor fields; its builder checks every path against the original export.

## Scope and next research step

- The expression graph is real, but its layout (radial coordinates and node colors) is not a mathematical invariant.
- A dependency appearing as one constant reference does not reveal the structure of the referenced lemma's internal proof.
- The diagram `endpoint coverage + monotonicity → existence + uniqueness` is manually annotated and must not be presented as an automatically certified compression.
- Structural fingerprints are counts of similar serialized syntax shapes, not mathematical equivalences.
- The next step is to export transitive local lemma certificates, preserve binder/assumption scope, and test certified semantic module boundaries.

This directory is intended for **significant research artifacts** and stable methodology, not a daily experiment log.


## Lean language reference — 12 October 2026

The existing [diagram explorer](https://moiseevigor.github.io/projects/proof-atlas/grammar/)
is expanded into an eight-layer reference, using the **Lean 4.33.1** baseline from
`moiseevigor/se2-conjugate-locus`’s `lean/SE2Conjugate/lean-toolchain`.

| Layer | Entries | Scope |
|:--|--:|:--|
| Expr | 12 | All constructor tags and semantic arguments |
| Level | 6 | All constructor tags |
| Syntax | 4 | All constructors; node kinds remain extensible |
| Surface terms | 16 | Major families, not every parser form |
| Tactics | 11 | Major families, not a tactic registry or trace |
| Commands | 13 | Major families, including environment/diagnostic effects |
| Macros / notation | 6 | Major families, not installed library extensions |
| Elaborator data | 6 | Selected structures and related fields, not full layouts |

`lean-expr-grammar.js` stores shared constructor fields; `lean-syntax-reference.js`
stores the other layers. Solid links indicate recursive children **in the named
language**; dashed links indicate payload/scope/context/environment connections.
Diagrams of syntactic families indicate processing paths, not logical implication.
`Expr.data` is a cached computed implementation field and is excluded from the
semantic constructor ports. The `Literal` argument has no source parameter name;
the reference labels its payload `literal`.

### Reproduce validation

```sh
python3 research/proof-atlas/verify_public_data.py
python3 research/proof-atlas/verify_lean_reference.py --lean /path/to/Lean-4.33.1/bin/lean
npm install --no-save playwright@1.57.0 axe-core@4.11.0
npx playwright install chromium
docker compose --profile build run --rm build
python3 -m http.server 8833 --bind 127.0.0.1 --directory _site_production
# In a second terminal:
node scripts/test-proof-atlas-browser.cjs
node scripts/test-proof-atlas-decoder.cjs
node scripts/test-proof-atlas-subtree.cjs
node scripts/test-proof-atlas-grammar.cjs
node scripts/test-proof-atlas-reference.cjs
```

`ATLAS_CHROMIUM_PATH` can select an already installed Chromium executable.
`ATLAS_SCREENSHOTS` sets the screenshot/audit output directory. The hosted workflow
builds Jekyll too; serving raw front-matter files misses shared CSS interactions.

The Lean verifier compares the 12 Expr argument lists and finite Level/Syntax
inventories with version-pinned compiler sources, compiles 40 complete source
examples, and runs `KernelExamples.lean`: ten closed kernel-checked terms and an
invalid-projection rejection control. Other snippets are intentionally illustrative
fragments, holes or internal forms. This does **not** establish that all 74 entries
have a certified source-to-AST translation.

The reference browser test exercises every entry, field links, URL restoration,
search/empty states and keyboard focus, and checks layouts at 390, 768, 1280 and
1440 pixels. Its scoped axe audit reports no WCAG A/AA violations in light or dark
mode; manual assistive-technology testing remains open. The repaired landing-page
code panel has measured contrast 11.02:1. The original released graph topology and
interaction regression pass; its payloads and evidence files are not changed.

### Remaining coverage

This is not all Lean syntax: installed libraries can extend all surface categories.
Detailed subforms of patterns, do-control flow, quotation splices, module visibility,
all registered tactic/command handlers, complete elaborator record layouts, and
source-info export/trace replay remain outside this iteration. Semantic module
certification, proof construction, reader comprehension studies and general
mathematical explanation remain research targets. Existing witness integrity work
is separate; this UI change does not certify every public witness path.


## Selected-subtree reader — 12 October 2026

The right reader now follows the selected expression and shows its actual term,
not a generic constructor lesson. Read mode decodes known notation and displays
variables and assumptions from enclosing binders. Full term retains all arguments,
universe parameters and an occurrence listing with field roles and binding IDs.
Selecting a row selects that exact graph occurrence. Large listings load 200 rows
at a time; both the term text and downloadable listing include the entire subtree.
The standalone language reference remains separate.

For example, [occurrence 1852](https://moiseevigor.github.io/projects/proof-atlas/app/#expr-1852)
has 105 occurrences and states `C.branch σ p = ψ + (2 : Real) * C.K * (↑n : Real)`.
It is an equality proposition, not itself a proof of that equality. The proof root
has 7,085 occurrences; the separate type root has 203.

`crossing-terms.js` has format `ProofAtlasTermPayload/1`: aligned `payloads`,
`rootPaths`, declaration kinds, the original export SHA-256 and artifact run.
`build_term_data.py` verifies constructors, ordered children and all reconstructed
paths against the original CoreGIR export before producing this file. Payload
publication was explicitly authorized by the repository owner. The release uses
export SHA-256 `43fbca52cefe9158d5859de6c8ef0e7f379ffce18015e3577d1a3a168bdfbfc8`.

This is a deterministic display decoder, not Lean's pretty-printer or a new kernel
check. Display names simplify compiler hygiene suffixes; original payloads and
paths remain in the download. Recognized notation hides type and instance arguments
only in Read mode. Unrecognized terms retain their arguments. The export lacks
metadata key/value payloads, original tactics, inferred types for every occurrence,
and transitive dependency proof bodies. No missing information is invented.

Decoder checks cover every released occurrence and an independent incomplete
application control. Browser checks verify the example's full 105-row listing,
text-to-graph navigation, local hypothesis scope, complete 7,085-row download,
shareable occurrence link, mobile overflow and a scoped automated accessibility
audit. This does not establish general mathematical explanation or reconstruction
of arbitrary Lean source programs.

## Lean ↔ article index — 12 October 2026

The Article tab displays exact passages from the **already public 7 October
manuscript snapshot** of `conjugate_times_se2.tex`. The index covers the crossing
principle only: six passages, ten named declarations and three exact expression
anchors. It does not index the whole article or assign a sentence to every kernel
node. The existing article's theorem table explicitly names `crossing` as the
counting clause of `lem:crossing`; other links are curated formula, hypothesis or
supporting-argument correspondences. They are not kernel-certified equivalences.

`build_article_index.py` extracts literal source slices and records article and
excerpt SHA-256 hashes, stable LaTeX labels, source line ranges, PDF pages, the
CoreGIR hash and exact occurrence paths. Changes to either source require review
of the correspondence. The resolver rejects mismatched expression exports or
paths. Declaration identity and structural ancestry provide context; it does not
infer correspondence from keyword similarity. Small descendants inherit a clearly
labelled enclosing passage, rather than claiming an individual sentence match.

Expression 1852 maps to the phase equation, with Lean's integer period shift
explained separately. Both directions work: select Lean to read its passage, or
choose an indexed passage and open its mapped declarations/occurrences. The
analytic-scope passage has no mapped proof: zero orders and finite tangency phases
are explicitly outside the formalization in this article snapshot.

Validation:

```sh
python3 research/proof-atlas/build_article_index.py
node scripts/test-proof-atlas-article-index.cjs
# After building and serving the site as above:
node scripts/test-proof-atlas-article-browser.cjs
```

The independent index audit checks literal excerpt identity, hashes, line ranges,
all declaration names, reverse links and stale-map rejection. Browser checks cover
rendered equations, bidirectional navigation, inherited context, unsupported analytic
claims, deep links, responsive layouts and scoped automated accessibility. The
published article snapshot remains unchanged. Original tactic/source-span export,
coverage of other manuscript statements, one-to-many source proof steps and formal
certification of these editorial links remain open.
