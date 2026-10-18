# Sparse source-cut records

Status: source-cut adapter, reader export, independent Python checker and native
source-cut/lexical checking. Native runs reconstruct `Cut e` values; they do not
type-check the mathematical source proofs or certify the browser renderer.

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
Mathematical source typing, semantic interpretation and a formally verified wire
decoder remain separate work. Native reconstruction and lexical checks are
described below; the browser button performs the JavaScript structural check.

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
node in a domain and body, with different binder targets. Its structured names
and source-node order roundtrip through the native serializer. Its generator is
hashed; it has no mathematical typing claim. The separate published core projection control
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


## Native reconstruction and lexical agreement

The native checker decodes the pinned original packet into `Lean.Expr` values and
compares all six serialized graph arrays against a fresh native roundtrip. It then
reconstructs every sparse record as an expression-indexed `Cut e`, preserving
literal constructor parameters and ordered source children. Holes retain their
original expressions. The checker never enumerates a hidden expanded tree.

[Binding.lean](Binding.lean) defines two separate recursive lookups: one follows
a source expression path; the other follows retained cut constructors. Binder
domains, let types and let values use the old context; lambda/forall bodies and
let bodies extend it. Both return original binder occurrence paths. Their generic
agreement theorem is kernel checked. Both sides use the same supplied outer
context and source-root prefix. The refinement theorem states that filling
holes preserves every previously visible variable's original target, including
when the displayed grouping or wire entry numbers change. The context is a list
of lexical binder paths, not an elaborator environment or a typing derivation.

The native wire adapter reconstructs the selected root's enclosing context from
the original packet. It checks the exported external table, every retained
`bvar` index and internal/external target, and variable statistics. A shared DAG
node can therefore have different targets on different occurrence paths. The
separate Python checker still checks complete schema, card ownership, original
packet hashes and hidden-count fields. Neither component proves the whole wire
decoder or actual pixel rendering correct.

The real `JacobiCore.E_pos` packet contains a concrete shared-node case. Node 17
is the same stored `bvar 0` at both occurrences below. In the let value it refers
to the outer lambda binder `J`; in the let body it refers to `this`.

| Exact occurrence | Original target |
| --- | --- |
| [1:1.1.0.0.0.1](/projects/proof-atlas/library/?edition=published-15&proof=JacobiCore.E_pos&route=1%3A1.1.0.0.0.1#expr-17) | Lambda `J`, source node 73, route `1:` |
| [1:1.2.1](/projects/proof-atlas/library/?edition=published-15&proof=JacobiCore.E_pos&route=1%3A1.2.1#expr-17) | Let binder `this`, source node 72, route `1:1` |

A diagram that merges those two occurrences into one variable-to-binder edge
would change the source binding. The native observations distinguish them by
route, including when the selected cut puts a target outside the displayed view.

Four additional source controls cover lambda/forall headers, name shadowing,
let values/bodies and focused cuts with external binders. They are manually
authored structural inputs, not claimed mathematical theorems. The native negative
checks include redirecting a reference to another genuine binder, as well as
forged external contexts and changed de Bruijn indices. All original private
mathematical source modules remain absent from the native environment.

```sh
node scripts/test-proof-atlas-cut-certificate.cjs
node scripts/test-proof-atlas-cut-binding-controls.cjs
python3 research/proof-atlas/cut-records/verify_native.py \
  --lean /absolute/path/to/lean-4.33.1 \
  --workdir /tmp/atlas-native-source-cuts \
  --legacy-control-header \
  --requests /tmp/atlas-cut-records/source-*.json /tmp/atlas-cut-records/binding-[0-9].json
python3 research/proof-atlas/cut-records/verify_native_controls.py \
  --lean /absolute/path/to/lean-4.33.1 \
  --workdir /tmp/atlas-native-cut-negatives \
  --requests /tmp/atlas-cut-records/binding-[0-9].json
```

Use a fresh work directory. The default local reserve is 30 GiB; compiler runs
are serial and limited to 120 seconds, 8 GiB RSS and 64 MiB per output. Requests,
source packets and individual native results have separate 64 MiB bounds. Full
native observations are written per packet; the aggregate metadata has a 16 MiB
limit and at most 4,096 requests. These are component/execution bounds, not a
whole-browser memory guarantee. Native reconstruction loads one source DAG in
full and currently accepts at most 131,072 unique nodes, independently of its
expanded occurrence count. Larger unique DAGs require further work.

The reproducible fixture matrix contains 3,156 cuts, 3,011 bound-variable
appearances and 1,592 external targets across 40 source requests. This includes
the four additional scope controls. The native checker rejects 88 altered
records (22 changes applied to each control), including wrong existing binders.
An additional 15 actual hosted-reader exports pass native reconstruction and
lexical checking. A separate Python audit imports neither native nor browser
code and compares every emitted target directly with the original DAG paths.
These finite checks supplement the general binding laws; they do not certify
arbitrary wire input or the renderer.

[Compiled evidence manifest](/public/data/proof-atlas/native-source-cuts-manifest.js)
· [Independent native-output audit](audit_native.py)

Metadata transport currently accepts exact Boolean entries only; unsupported
payloads reject. Free/metavariable elaborator contexts and mathematical proof
source typing are not reconstructed. The legacy amplification control lacks a
serialization header: its explicit opt-in adapter adds that header only, keeps
all original expression/declaration fields, and records original and adapted
input hashes separately. Ordinary source packets are not normalized. The native
executions are not individually quoted kernel certificates. No comprehension or
semantic proof-compression claim follows.

[Native reconstruction](NativeCut.lean) · [Lexical wire checks](NativeBindings.lean)
· [Reproducer](verify_native.py) · [Native rejection controls](verify_native_controls.py)
· [Compiled evidence manifest](/public/data/proof-atlas/native-source-cuts-manifest.js)

The separate [larger source-table profile](large-profile.md) accepts up to 262,144
stored nodes while preserving this frozen verifier. Two kernel-checked laws
establish agreement within the original kind-table bound. Its finite source,
rejection and deep-syntax checks have separate compiled evidence; they add no
mathematical typing or all-size guarantee.
