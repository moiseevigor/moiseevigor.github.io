# Sparse source-cut records

Status: prototype adapter, reader export and independent checker. Native
reconstruction of these records is not yet implemented.

The adapter reconstructs a cut of the original expression directly from a
judgment scene's hidden roots. It follows every literal kernel child slot until
a hidden root is reached. Each retained constructor belongs to the nearest
enclosing displayed card in the source tree. The adapter does not infer that
ownership from a label such as "application" or "proof".

A record has separate entries for separate occurrence paths, even when they
refer to the same shared DAG node. Retained constructors have all their ordered
source children. A hole identifies its complete source root and exact expanded
count. A source packet hash binds the constructor payloads; the record does not
duplicate them. Each card's retained count must match its owned source entries,
and the retained plus hidden counts must equal the selected source region.

The adapter also checks card contexts, source-port edges and displayed bound-variable
links against the original lexical paths. Binder domains use the old context;
lambda/forall bodies and let bodies extend it. Bindings outside the selected cut
refer to an explicit enclosing-context table. Folded binders remain identifiable
at their original source paths and display slots. Computed type namespaces are
outside this source-only operation. Views that merge source occurrences or omit
source ancestors require a different relation; they are not source cuts.
Here variable means `Expr.bvar`; the
record does not reconstruct elaborator `FVarId` or `MVarId` contexts.

## Reader control

In either the complete or paged compiled reader, open **Source cut record** below
the composed diagram and select **Check current source cut**. The optional adapter
loads only on request. The control checks the current cut against its source
fields, then offers its bounded JSON record. An independent check also needs the
original packet and separately pinned inventory metadata.

Selecting another displayed card reuses the same cut record. Expanding, undoing,
changing policy/grouping/depth or focusing another region clears it. Closing a
pending check or leaving the proof cancels the operation; stale results cannot
restore a download. A failed component or unavailable source page leaves the
diagram and exact-source controls usable. The paged reader uses its existing
4,096-node source cache; the export does not fetch the complete source index.
There is one cached record and one revocable download URL per displayed cut.

## Wire format and checking

`ProofAtlasSourceCutRecord/1` contains the pinned packet/source identities, the
selected source route, displayed-card roots, enclosing binders and a sparse
preorder list of retained nodes and holes. Child references and relative routes
identify occurrences; a shared node number alone does not. `domain` in a human
display path is the exporter's alias for Lean's `binderType`; numeric child slots
retain the original kernel order.

The JavaScript producer returns an immutable record. Its validator compares it
with the current scene. The separate Python checker imports no browser modules:
it verifies the original packet bytes against an independently supplied inventory
hash, recomputes the DAG's size/scope recurrences, then reconstructs each cut's
literal fields, ownership and variable targets. Refinement checks compare visible
source paths as well as counts. Matching totals alone are insufficient.

The Python request pins `expected` metadata from a trusted inventory, rather than
deriving that trust anchor from an unchecked record:

```json
{
  "expected": {"name": "...", "indexSha256": "...", "sourceSha256": "...", "uniqueNodes": 123},
  "packetFile": "/absolute/path/to/original-index.json.gz",
  "records": ["replace with complete exported record objects"],
  "refinements": [[0, 1]]
}
```

Source module bytes are not read or independently verified. The source hash is
retained as inventory metadata. The checker validates the serialized structural
record; it does not prove that the browser rendered that record correctly.
Native typing, semantic interpretation, native reconstruction as an actual
`Cut e`, and a formally verified decoder remain separate work.

## Bounds and evidence

A record has at most 32 displayed cards, 3,072 retained/hole entries, route depth
512 and eight MiB of encoded data. Decimal counts have at most 4,096 digits.
Crossing a bound rejects the record; it does not truncate the cut. These are
component/data budgets, not a measurement of total browser heap. The independent
checker streams one source packet at a time, with a 64 MiB decoded packet bound;
it never enumerates expanded occurrences below holes.

The initial matrix covers 612 cuts over 34 inventories and 1,224 local
replacements. It also covers 1,288 recorded selections within declarations, including
variable references into the surrounding context. Both known depth-reselection
counterexamples reject as refinements; one keeps the same retained total while
losing an old path. These finite checks do not prove the producer generally.

An additional manually authored source-field control uses the same bound-variable
node in a domain and body, with different binder targets. Its generator is hashed;
it has no native typing claim. The separate published core projection control
selects 9,671,406,556,917,033,397,649,412 source occurrences from a 177-node DAG.
Its before/after source records preserve the exact count without expanding the
hidden terms. This is a controlled amplification example, not an AI benchmark.

```sh
node scripts/test-proof-atlas-cut-certificate.cjs
python3 research/proof-atlas/cut-records/check.py /tmp/atlas-cut-records/source-*.json
python3 research/proof-atlas/cut-records/test_check.py /tmp/atlas-cut-records/source-*.json
```

[Producer](/public/js/proof-atlas-cut-certificate.js) · [Source audit](/scripts/test-proof-atlas-cut-certificate.cjs)
· [Independent checker](check.py) · [Changed-record controls](test_check.py)
· [Formal cut model](../cut-refinement/README.md) · [Locality laws](../local-cut-context/README.md)
