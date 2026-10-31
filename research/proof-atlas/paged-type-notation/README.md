# Recoverable notation through bounded pages

The checked region-function reader now exposes its types as mathematical
notation, using the existing literal grammar. The Riccati fact-input domains
include `0 ≤ |T1(J,p)|`, the product identity and the square-root identities.
Operators, operands, implicit arguments and binder references retain exact
addresses. [Open the working example](/projects/proof-atlas/manual/paged-network/#readable-fields).

This addresses a presentation gap: the constructor reader previously showed
types mainly as local expression IDs. It adds no new typing judgments or
mathematical interpretation. Improved human comprehension has not been
measured. The article and blog are unchanged.

## Same grammar, different delivery

`proof-atlas-paged-notation.js` feeds the unchanged
[recoverable grammar](../type-notation/README.md) through a bounded decoded-row
map. When the grammar requests a missing row, the adapter reads its aligned
batch of at most 64 rows and retries. It never constructs sparse arrays sized
to the complete table. A batch may contain neighboring rows that the visible
formula does not use; this is not a minimal-fetch claim.

The row map has independent caps of **8,192 rows and 4 MiB of serialized tuple
data**. The existing region cursor retains its separate 64-row page cache and
two index pages. One initial notation scene has at most 48 objects; in-place
opening can grow it to 192 objects and 4 MiB of scene metadata. Paths and
contexts retain their 512-entry bounds. A row or object limit leaves the
previous inspected scene unchanged, or reports notation unavailable while
constructor fields remain usable.

These are component limits. Tuple bytes do not measure JavaScript object
overhead, DOM memory, the catalogue, other inspectors or total browser heap.
A bounded map can cover a complete small table; a no-archive-request result
does not imply that every small table is only partially resident.

## Identity and scope

Each notation address retains the source packet, native inventory, native
case, delivery manifest, component and component-root ordinal, plus catalogue
and environment identities. It belongs to `region-input-notation`, separate
from original source occurrences and the underlying computed expression.
Selecting it resolves to that expression's exact `region-input-components`
path. Counts belong to the selected **computed** expression.

Original context names come from the authenticated compiled packet and retain
their original binder addresses. Computed binders are resolved along the
ordered component path. Duplicate names are disambiguated by the existing
grammar; storage-row equality never merges lexical contexts. Binder domains
and let values remain outside their newly declared binder's scope.

An operator retains its complete head/spine record and all supplied arguments.
Only the catalogue's literal structured names, universe arities and supplied
arities receive specialized glyphs. Unknown or partial calls remain generic.
Type and instance arguments are separate selectable ports. Two preceding,
kernel-checked `(7+2)` controls retain different instances and have results 9
and 5; the glyph string is not an operation or proof identity. Clipped labels
carry a visible ellipsis and retain their exact constructor location.

## Catalogue compatibility

The preceding catalogue contains 53 declaration signatures. Twenty core
signatures, the earlier structural laws and the typed instance controls have
a fresh core-only replay that is byte-identical to their original export.
Installed core constant-data hashes agree with the dependent-control run;
shared-library identities agree with all three region inventories.

For the additional signatures, the catalogue and two region runs record the
same 26,070 constant-data files, bytes and hashes, the same cache attribution
and the same private support manifest. This compares **recorded inventories**;
the retired Mathlib data are not restored or freshly rehashed here. Extra
signatures are reused from those matching records, not freshly re-exported.
Dependency binaries are not independently rebuilt.

The binding registry admits only the three matching native inventories. The
core-only dependent-control inventory receives the twenty core signatures.
The other two receive the complete catalogue. Source context directories are
checked against their compiled packets. Foreign catalogue objects, unknown
native owners and mismatched context metadata refuse without replacing the
underlying constructor view.

## Finite checks

- **150 earlier type packets, 11,324 cuts:** paged and complete-table scenes
  agree exactly, including metadata/spines, hidden arguments and counts.
  All 82 earlier in-place openings agree as well.
- **57 accepted recorded variants:** all 570 component roots, 383 binding
  domains and eighteen adapter endpoints agree with complete-table notation.
  These are overlapping policies/versions in two corpus proofs and eight
  authored controls, not 57 independent proofs or expanded AI coverage.
- **272 region-field openings:** the page-fed result matches the complete
  source-cut union operation. Across the comparisons, 25,348 reference
  appearances resolve to their exact binders; this is not a premise-necessity
  count.
- **Bounds:** the checked scenes retain at most 960 decoded rows and 36,800
  serialized row bytes. A 61-row shared structural control represents
  2,305,843,009,213,693,951 occurrences; an exhausted object budget preserves
  the previous scene. A separate 10,000-row sparse storage control checks a
  later row-budget refusal. Neither is a kernel-typed proof or AI benchmark.
- **Refusals:** fourteen cancellation, lifecycle, foreign-scene, catalogue,
  context and budget checks accompany the raw-constructor and instance
  controls. All twelve raw constructor forms are checked separately from
  native typing.
- **Production browser:** five Riccati domains and 36 keyboard symbol
  selections preserve the source selection and focus the new expression.
  One local opening retains 41 outside symbols. Three failure/retry cases,
  actual request cancellation, two adapter endpoints and a dependent domain
  retain the constructor fallback and qualified scope. A 90,774-row AI-source
  component uses 448 decoded rows for the inspected scene, without requesting
  its complete archive. Four desktop/phone and light/dark audits report no
  scoped automated accessibility violations or page overflow. Typography
  metrics and screenshots accompany those finite interaction checks.

The preceding general `Lean.Expr` spine and source-cut laws remain the
reference rules. Exact agreement on these inputs is a finite bridge, not a
general proof of the asynchronous evaluator or wire codec. The offline model
retains complete fixture graphs; browser delivery uses the bounded accessor.

## Reader

Select a domain or component, then **Read field notation**. A symbol selects
its recorded computed region; selecting a variable still allows its original
or computed binder to be inspected. **+** opens a frontier in place, keeping
the surrounding inspection. **Constructor fields** restores the kernel view.
Original graph/source selections remain independent and qualified. Shared
links can request `presentation=notation` for an exact field.

Inline symbols retain natural text widths and the article's serif face;
bound variables are italic. Expansion and argument-list controls retain
their full-size targets. Keyboard symbol navigation focuses the new formula,
and the separate source-term preview is a focusable scroll region.

Native types, unknown heads and boundary assumptions retain their existing
scope. The notation does not reconstruct tactics, explain a proof strategy,
remove additional adapter assumptions or establish semantic compression.

## Evidence and reproduction

[Environment replay/comparison](environment.json.gz) ·
[Catalogue/context bindings](bindings.json.gz) · [Model](model-check.json.gz) ·
[Five exact examples](examples.json.gz) · [Production browser](browser-check.json.gz) ·
[Compatibility](compatibility.json.gz) · [Aggregate evidence](evidence.json.gz).

```sh
node research/proof-atlas/paged-type-notation/bindings.cjs --check
node research/proof-atlas/paged-type-notation/check.cjs
node research/proof-atlas/paged-type-notation/examples.cjs --check
# After an actual production Jekyll build:
node research/proof-atlas/paged-type-notation/check-browser.cjs
node research/proof-atlas/paged-type-notation/check-compatibility.cjs
node research/proof-atlas/paged-type-notation/evidence.cjs --check
```

`verify.py --help` lists paths for a fresh core replay and the three retained
recovery manifests. Native guards remain 30 GiB free reserve, 8 GiB monitored
RSS, 120 seconds and 64 MiB output. No Mathlib restoration or original private
proof-script publication occurs. Earlier reports stay unchanged; new technical
reports may be synchronized after the build, while application HTML, scripts,
styles and the generated include must be actual build inputs/outputs.
