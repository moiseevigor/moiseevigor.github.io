# Proof Atlas — public research record

**Program goal:** develop a consistent geometric language for Lean proofs, including massive AI-generated proofs, with faithful scope, composition, abstraction and provenance. The article reader is one application. The [saved research program](../../docs/proof-atlas-research-program.md) defines the questions, invariants and evidence requirements; it remains active across individual tool releases.

**Introduction:** [The Geometry of a Formal Proof](https://moiseevigor.github.io/mathematics/2026/10/11/proof-atlas-research-program/)  
**Interactive visualization:** [Proof Atlas](https://moiseevigor.github.io/projects/proof-atlas/)  
**Public structural data:** [crossing-structure.js](../../public/data/proof-atlas/crossing-structure.js)

## What is public

This directory documents a measurable experiment converting a real Lean 4 theorem's elaborated **type and proof expression** into a structural graph. The structural dataset retains anonymized labels for graph navigation. Since the authorized 12 October release, `crossing-terms.js` additionally publishes the complete exported payloads of all 7,288 occurrences in the crossing type and proof, with actual declaration names and structural paths. The compiled proof release additionally publishes every available type and body in two separately labeled extracted inventories. Original proof scripts and source projects remain private. The private working manuscript is not included. The already public 7 October manuscript snapshot has a full web edition.

The measured benchmark:

| Statistic | Value |
|:--|--:|
| Expression occurrences | 7,288 |
| Structural child edges | 7,286 |
| Bound variable to binder links | 431 |
| Constant-reference occurrences | 2,892 |
| Distinct directly referenced declarations | 42 |
| Longest root-to-expression path | 49 |

The private Lean exporter and validation workflow regenerated the benchmark directly from the theorem. The old structural projection alone is **not a standalone formal proof certificate**. The compiled-proof library publishes complete extracted type/body graphs and provenance hashes. Public packet audits verify their serialization; original source projects remain private.

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


## Live article selection and full Distill edition — 12 October 2026

Article is now the first and default reader tab. A graph click clears any browsed
passage and resolves the selected expression again. The index now has **84 explicit
expression anchors**: the two crossing roots and 82 lifted phase equalities or
winding-witness predicates. The builder recognizes their complete expression
shape and verifies original occurrence paths; it does not guess from nearby text.
The nearest mapped declaration application also provides context to its children.
[Occurrence 5830](https://moiseevigor.github.io/projects/proof-atlas/app/#expr-5830)
now shows the winding predicate's phase equation. The uniqueness application at
7259 shows the monotonicity argument. Several nodes can legitimately share a
passage; the reader always identifies the actual selection and inherited context.

[The full Distill web edition](https://moiseevigor.github.io/projects/proof-atlas/article/)
reproduces the public manuscript snapshot, including its abstract, all nine section
headings, nine lemma/theorem/remark statements, six proof blocks, 21 numbered
equations, four vector figures, three tables and twelve cited references. All
**916 mathematical expressions** are rendered, with original statement numbers,
equation references and source labels. Each graph passage link lands on and
highlights the exact excerpt in the full article, not the entire enclosing lemma.
The article provides reverse links to the indexed Lean selections.

`build_distill_article.py` uses Pandoc's AST and the local numeric citation style.
Its static output requires no Pandoc dependency at runtime or in the site build.
`distill-article-manifest.json` records the source hash, preserved mathematical
bodies, counts and labels. `verify_distill_article.py` independently checks every
preserved mathematical body against the output, every internal target, the figures,
tables, statement numbering and the six precise passage anchors. The PDF and TeX
snapshot remain unchanged. Vector figure assets and cited bibliography entries
come from the same published snapshot revision recorded in `se2-provenance.json`.

```sh
python3 research/proof-atlas/build_article_index.py
python3 research/proof-atlas/build_distill_article.py  # Pandoc 3.9 required to regenerate
python3 research/proof-atlas/verify_distill_article.py
# After building and serving the site:
node scripts/test-proof-atlas-distill.cjs
```

The browser regression uses actual canvas clicks on 5830, 7259, 7275 and 1852,
checks first/default Article behavior, follows graph-to-article links, visits all
six passage targets, and checks rendered formulas, loaded figures, references,
mobile overflow and light/dark WCAG A/AA accessibility. Scrollable formulas and
tables are keyboard accessible. Manual assistive-technology review remains open.

The **web edition covers the whole published manuscript**. The **Lean correspondence
index still covers only six crossing-principle passages and ten named declarations**.
Other manuscript results are not yet linked, and a kernel node does not necessarily
have its own article sentence. These are curated correspondences, not a formal
certification that the manuscript and Lean are equivalent.


## Centered reading and aligned Lean columns — 12 October 2026

The full manuscript defaults to a centered human-readable column. **Article + Lean**
opens a comparison layout with the prose on the left and corresponding original
Lean statement lines on the right. Screens at least 1,500 pixels wide also show
curved correspondence connections in the middle; narrower desktop screens use two
columns, and small screens stack each Lean excerpt below its article block. These
are curated passage-to-statement connections, not proof dependency edges. Hover or
keyboard focus on a source line identifies its exact article passage and graph node.
Clicking a source line or graph node opens the matching named declaration in the
full Proof Atlas via a shareable `#decl-NAME` link.

Comparison is optional and shareable with `?view=lean`; it is not stored as the
default for future visits. Lean comparison data load only when requested. The
published 916 mathematical expressions, source targets and manuscript text are
preserved when switching modes. The code excerpt view covers **ten declarations
and 19 original source lines**, adjacent to the six previously indexed passages.
The remaining article text is not yet aligned to Lean; the analytic-scope passage
explicitly has no mapped proof. An article sentence can correspond to several
statements, and a source line number is not an expression occurrence ID.

`crossing-article-lines.js` contains the original statement line breaks and starting
line numbers from `SE2Conjugate/Crossing.lean`. `build_article_lines.py` requires an
explicit source path and verifies each header against the already public declaration
text and starting line. Theorem proof bodies and their `:=` delimiters are excluded;
these excerpts add no private proof bodies to the public source projection. Source
and snippet hashes record provenance. The browser rejects comparison data that do
not match the article or released declaration headers.

```sh
python3 research/proof-atlas/build_article_lines.py --lean-source /path/to/SE2Conjugate/Crossing.lean
# After building and serving the actual website:
node scripts/test-proof-atlas-article-columns.cjs
```

The comparison regression checks exact source text, numbers and hashes; default
centering; two-column and middle-graph geometry; matching connector/statement heights;
keyboard correspondence; actual source-line-to-graph navigation; mode switching and
shareable comparison links; retained formulas; responsive overflow; light/dark WCAG
A/AA audits; and a deliberately mismatched article hash rejection. This remains a
statement correspondence interface, not a complete line-by-line alignment of the
whole manuscript with original Lean proof scripts.


## Every numbered statement audited — 12 October 2026

The comparison view now includes **all nine numbered lemmas, theorems and remarks**,
with explicit coverage statuses and checked counterpart clauses. The missing index
links for Theorems 3.4 and 4.1 have been added. Five article statements have partial,
conditional Lean counterparts; four remain unformalized. No complete article
statement is promoted to fully formalized. The current comparison contains
**49 declarations and 107 original source lines**, with 39 new declarations checked
against the exact research revision accompanying the published manuscript.

Read the [complete review](article-coverage-review.md),
[version-bound audit](article-coverage-audit.json), and
[actual compiler check log](article-coverage-lean-check.log). The fifteen pinned
modules rebuilt successfully with Lean 4.33.1 and matching Mathlib. The kernel
axiom lists use only the standard three dependencies; Jacobi structure fields and
finite-tangency parameters remain mathematical hypotheses. In particular, the
first-time results use `hfin`, the cell counts use `hL/hR`, and Lean cell `m` is
article cell `n = m + 1`.

The new source snippets retain module and header hashes, line numbers, checked
full types, and provenance. Theorem proof bodies are not newly published. For new
declarations, connection nodes and line links open the actual source header in
the article; they do not pretend that an expression graph for that theorem has
been released. Existing crossing expression and named-declaration links are
preserved. Unformalized results receive scope explanations without fabricated
proof links. Default centered reading and the entire manuscript conversion remain
unchanged.

`verify_article_coverage.py` independently checks completeness of the nine numbered
statement targets, literal excerpt hashes, module/check evidence, source lines,
standard axiom lists, conditional premises and exclusions. The expanded browser
checks verify the named examples, every target, Greek source fragments, uncovered
controls, stale-data rejection, all 916 formulas, responsive layout, original graph
navigation, and scoped light/dark accessibility. Public CI audits the evidence and
presentation; fresh private-source kernel replay remains a local reproducible audit.


## Complete compiled proof library and bounded extraction

[Coverage and checks](https://moiseevigor.github.io/projects/proof-atlas/coverage/) defines the finite denominators: 739 declarations / 715 available bodies in the published 15-module snapshot, and 1,359 / 1,335 in the current 26-module snapshot. Complete compiled types, available bodies, recursor rules and ordered expression links are public. Original project source, tactic scripts, source archives and extraction logs remain private.

`ExprDAG/1` preserves full structural equality, exact decimal counts and contextual binder paths. The browser loads one declaration at a time and paginates compact decoded subterm listings. The original 7,288-occurrence microscope remains a focused example.

```sh
python3 research/proof-atlas/verify_proof_library.py
node scripts/test-proof-atlas-library.cjs
```

Every original type and available body passed native kernel checking during private extraction. Public validation independently verifies packet hashes, graph closure, payloads, reference counts and completeness against the extracted inventory. It does not reproduce private native kernel validity or full mathematical article formalization. The native exporter and synthetic controls are tooling; no private project proof script is included.
