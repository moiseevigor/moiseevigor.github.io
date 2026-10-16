# Source-backed substitution experiment

Status: native-checked source-backed type transport, integrated as an optional
layer in the compiled proof reader. Earlier projection packages remain immutable.

The previous projection extractor copies the complete structure operand into a
second expression table. A synthetic operand with 196,617 stored nodes exceeds
that table's 32,768-node bound even though the selected field has type `Nat`.
This is a serialization boundary, not rejection of the term by Lean.

## Representation

`ProofAtlasSourceReferences/2` stores ordinary kernel-expression templates and
ordered substitution slots bound to exact source occurrences. Slots are extra
de Bruijn variables in the template environment, after the original context.
They are not another `Expr` constructor, an inferred type, or a new proof step.
The original source packet stays separate.

For a primitive projection, the anchors are the structure operand and its
application-spine arguments, in source order. Collection crosses no binder.
Lean 4.33.1 checks the selected projection, its normalized structure type,
constructor parameters, preceding projections and selected field conversion.
It then replaces exact contextual anchor expressions with fresh variables.
Substituting the original expressions back must recover every native expression
**structurally**, including binder names and annotations. Each anchor must also
roundtrip through the original lexical context. A changed packet fails native
comparison before producing any evidence.

`source_reference_view.cjs` performs delayed, simultaneous, capture-avoiding
substitution. Its indexed graph interface exposes only the twelve existing
kernel kinds. Source subgraphs stay borrowed. External variables are lifted
under template binders; their internal binders stay intact. Source counts and
scope requirements come from the already validated source table. Template
counts are computed over memoized states. Borrowed identities let comparison
skip an identical source region without enumerating its occurrences or copying
its stored nodes.

`ProofAtlasGeometricScene/9` gives this transport its own namespace. Template
roots and hashes, arguments, explicit anchor routes and original context remain
attached. Computed parent routes never become source occurrences. Borrowed
descendants resolve through an anchor route plus their local source path.
Without supplied anchor routes, occurrence provenance is explicitly unavailable.
The ordinary cut, binder and application rules retain exact frontier accounting.
Template descendants acquire no new kernel typing judgment.

## Checked finite cases

| Own synthetic case | Source nodes | Template nodes | Virtual nodes during checks |
| --- | ---: | ---: | ---: |
| Independent value field | 196,617 | 4 | 34 |
| Dependent proof field | 196,626 | 8 | 35 |
| Dependent function field | 196,627 | 12 | 39 |
| Dependent function capturing the outer variable | 196,634 | 12 | 41 |

The native suite checks 20 projection occurrences in 19 declarations, 124
bounded cuts, 47 scope-link appearances and two contexts for a shared projection
node. All 98 comparisons with materialized native expression roots from the
existing extractor pass. The validator rejects 205 altered evidence records;
Lean independently rejects a changed source packet. Thirty-five small delayed
substitutions match an independent tree implementation, including shadowing,
external variables and let scopes. A separate guarded access trap checks that
an identical borrowed root can be counted and compared without a source scan;
that mock graph is not a native proof or a corpus-size benchmark.

These measurements establish that this prototype avoids the observed second
table copy in these finite cases, including dependent fields and an open
context. They do not establish general asymptotics, human comprehension or
performance on AI theorem-solving proofs. The large operands contain balanced
arithmetic data; their proofs are reflexivity constructions.

## Bounds and remaining work

This transport currently supplies projection observations. Source-backed lambda
and application judgments are not yet implemented; their existing type-table
bounds remain. The source packet is still loaded and validated in full. This experiment does
not implement packet paging. Templates and metadata each retain a 32,768-node
bound; views default to 65,536 virtual descriptors, 131,072 property evaluations
and depth 512. Comparison defaults to 131,072 pairs. Limits fail explicitly.
Anchor discovery is currently limited to a projection operand and at most 128
application arguments; a large unmatched native type can still exceed the
template bound. Success does not imply arbitrary sharing/context coverage.

The reader loads immutable sidecars with a 16 MiB decoded limit, verifies the
package and template/metadata hashes, and serializes loads. Aborted or stale
selections are discarded. Ordinary type records supply enclosing introductions
and applications. A source-backed projection supplies its exact result and
structure-input observations; fields without this evidence retain source layout.

The released inventory has 241 sidecars: 222 frozen-corpus packets with 229
projection representatives, plus nineteen selected own control packets with 20
projection queries. The control edition is a predetermined subset of its fixture
module, not a complete fixture-module inventory. Its large open-context case is
[available in the compiled reader](/projects/proof-atlas/library/?edition=source-reference-controls&proof=AtlasReferenceControl.largeOpenFunction&geometry=scoped&fold=binders,applications).

Selecting a field exposes optional source-backed result, expected-field and
structure-type views. Native text is collapsed separately from the bounded
diagram. A borrowed node opens its exact original occurrence; external variables
retain their recorded lift under computed binders. Local inspection retains the
source selection. Computed parents have no invented source route or additional
inferred type. Syntax comparisons require aligned contexts; they do not establish
semantic equality between different environments.

The package audit checks all 249 selected projection queries, 996 bounded type
cuts, 392 source-jump appearances and 1,245 corruptions. The native control suite
independently replays all compiled fields for the nineteen public controls.
Browser checks cover exact source navigation under a dependent function binder,
corrupt metadata, cancellation, desktop/mobile layout and both themes. These are
finite representation and interaction checks. Broader context coverage, source
paging and independently sourced AI proof evaluation remain open.

## Reproduction

From the repository root:

```
node scripts/test-proof-atlas-source-references.cjs
node scripts/test-proof-atlas-source-reference-packages.cjs
node scripts/test-proof-atlas-reference-loading.cjs
python3 research/proof-atlas/verify_source_references.py /path/to/lean-4.33.1 --reserve-gib 30
```

The native runner builds only the repository's own synthetic fixture. It does
not read or rebuild private Lean projects. It writes native outputs, source and
module hashes, check results and operational records to its private temporary
directory. The portable finite check summary is in `source-reference-results.json`.
