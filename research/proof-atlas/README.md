# Proof Atlas — public research record

**Introduction:** [The Geometry of a Formal Proof](https://moiseevigor.github.io/mathematics/2026/10/11/proof-atlas-research-program/)  
**Interactive visualization:** [Proof Atlas](https://moiseevigor.github.io/projects/proof-atlas/)  
**Public structural data:** [crossing-structure.js](../../public/data/proof-atlas/crossing-structure.js)

## What is public

This directory documents a measurable experiment converting a real Lean 4 theorem's elaborated **type and proof expression** into a structural graph. The anonymized dataset exposes expression occurrence topology and direct reference counts, not proof-term payloads or the Lean source of the private SE(2) manuscript.

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

The index is **not** a stable Lean source location. Internal provenance remains private until a deliberate release.

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
