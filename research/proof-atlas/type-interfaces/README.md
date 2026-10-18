# Recorded type interfaces at local expansions

A shared term node does not identify a typing judgment. An interface retains the
compiled packet hash, exact source root and route, original lexical context,
recorded proof/type/value role and a reference to the recorded type expression.
The parent premise and child's own observation can identify that type through
different queries or graph roots. Their reference objects need not be identical.
The type syntax must agree in the same original context.

The independent checker reads hash-pinned source packets and native-record
packages directly. It imports neither the scene producer nor its expression
comparator. It reconstructs each source context, resolves the exact native query
and construction component, and compares the two type DAGs. Application head and
argument interfaces, lambda domain/body interfaces and let type/value/body
interfaces are distinguished. Domains and let values retain the preceding
context; bodies extend it by their original binder occurrence.

The comparison is conservative: constructor fields and all stored payload fields
must match. It performs no alpha renaming, reduction or general Lean definitional
equality. A rejection does not establish that two types are inequivalent.
Computed `source-reference-view` interfaces and unresolved free/metavariable type
objects are explicitly unsupported by this checker.

An unrecorded parent edge remains a source-field relation even when its child has
a separate checked type observation. A type at the child does not establish a
parent construction rule or a logical-premise relation.

## Finite evidence

The exporter produces 1,227 actual local expansions from 34 compiled inventories:
the existing 1,224-expansion matrix over three selection policies, three grouping
settings and source fallback on/off, two predetermined shared-node uses and one
control withholding the child query while retaining its parent observation.
The checker resolves 657 parent/child type interfaces. The remaining 570 parent
fields have no recorded premise type; 30 expanded children have a separate type
observation. All recorded parent/child type expressions match structurally in
their exact source contexts.

In `JacobiCore.E_pos`, node 17 at `1:1.1.0.0.0.1` is a value in context `[J]`,
with recorded type `JacobiCore`. At `1:1.2.1` it is a proof in `[J, this]`, with
recorded type `J.eps 0 < J.eps J.K`. The checker resolves both original records.
Its 112 changed-interface controls reject swapped source uses, omitted contexts,
changed roles, wrong roots/hashes and invented premise edges. Another swap uses
the same term node and identical stored type root at two different occurrences;
source identity still distinguishes the judgments.

Twelve additional syntax/scope controls reject malformed graphs, changed payloads,
unresolved elaborator objects and variables in binder domains or let values that
are only bound in the body. A 385-node shared syntax DAG represents `2^385 - 1`
expanded occurrences and compares in 385 memoized states. This last control tests
shared syntax traversal; it has no mathematical typing claim.

Native `PASS` fields remain existing extraction attestations. This audit adds no
kernel typing judgment, verified decoder/renderer theorem, general type
preservation theorem, semantic abstraction or measured comprehension result.
The original source-module digest is an identifier here; private module bytes
are not verified. Compiled packet and type-package bytes are hash-checked.

## Reproduction and bounds

Run from the repository root:

```sh
node scripts/export-proof-atlas-type-interface-cases.cjs
python3 research/proof-atlas/type-interfaces/check.py
```

Generated cases and the independent report stay under `/tmp/atlas-type-interfaces/`.
The report includes the case-file hash, decoded input hashes, counts and every
negative control's rejection reason. Original mathematical Lean source and native
execution logs are not copied into these artifacts.

The checker holds one source packet and at most two cached decoded inputs. Each
input and the case file have a 64 MiB decoded-byte bound; the case file contains
at most 4,096 expansions. Source routes and local binder depth are limited to 512.
Type comparison visits at most 131,072 `(left node, right node, depth)` states
without expanding shared occurrences. These are input/traversal bounds, not a
measurement or bound on total Python heap usage.

## Connection geometry

`ProofAtlasRecordedTypeInterface/1` retains the packet identity, exact source
occurrence, lexical context and role alongside separate expected and observed
type references. A structural match records the producer's existing comparison.
If no child observation is available, the parent reference is retained and the
observed endpoint is absent. Local expansion and undo preserve these records.

Selecting a region shows its judgment and recording endpoints. A matched pair
uses a solid connection labelled **Structural match**; a retained observation
uses **Record retained**. A source-field connection stays dashed and explicitly
lacks parent construction typing, even when the child has a recorded proof type.
The two recording-source actions select the original query routes, which may
differ from the selected child's route. Original binder names remain qualified
by the displayed context and exact source occurrence.

The independent audit also checks all 657 interface records, including the one
retained-parent control. The browser checks actual node selection and exact
recording-source navigation in both complete and paged readers, source-field
status, the retained-observation case, phone/desktop layout and both themes.
This visual distinction supplies no additional kernel checks or comprehension
measurement.

```sh
# Against a production build served locally:
node scripts/test-proof-atlas-type-interface-browser.cjs
```
