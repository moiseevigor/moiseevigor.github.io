# Contextual typing at deep source occurrences

This experimental checker reconstructs a lexical context along an original
source path, then asks the pinned Lean kernel to type the selected expression
in that context. Domains and let values are instantiated only when needed;
the traversal keeps the original source expression. It does not repeatedly
instantiate the complete remaining proof body.

Each context entry retains its depth along the one original query path.
Its complete original route is that path's prefix, rather than a copied path
stored at every binder. Names do not identify binders: fresh local identifiers
distinguish shadowed declarations. Binder domains use the prior context;
lambda/forall bodies use an extended context; let types and values precede
the new let declaration. Domains must be types and let values must check
against their declared type before the context is extended.

The finite controls serialize and decode the exact source DAG, including all
constructor payloads and ordered fields, before checking its type/value pair.
Typed identity application asks the kernel to check the value against its
expected type. A query checks its selected term and abstracts the inferred
type over the original ordered context; reopening it must reproduce the native
type structurally. That type has a **computed-native-type** namespace, not an
invented original source occurrence. This is executable native replay evidence,
not a quoted kernel certificate for the query algorithm.

The role is **proof** if the checked type has kernel-normalized type `Prop`,
**type** if the checked type itself normalizes to a sort, and **value** otherwise.
These labels use the native context, not the selected constructor or node name.

Eight self-contained controls cover a deep equality proof, a deep shadowed
context, shared variables with different binders, dependent binder domains,
let values before their new binder, forall scope, Boolean metadata and a
structure projection. Eight native rejection cases cover invalid fields,
ill-formed contexts, loose indices, missing constants, a wrong root type and
an unresolved metavariable. The independent reader recomputes source paths,
binding targets, scope requirements and counts, compares observations and
passes the original selections through the existing occurrence geometry.

The source-only scene does not acquire a native type from these checks.
Browser attachment, complete proof-corpus typing, source syntax recovery,
formal verification of the query/codec/renderer, semantic abstraction and
measured comprehension remain separate work. The full research program
remains active. No blog result is published for this prototype.

The driver also replays the existing public `AtlasLargeCutControl.deepSucc`
packet in core Lean. Its source bytes, hash and original `not-claimed`
producer metadata remain unchanged. A separate record checks the type/value
pair and three selected positions, including the variable at depth 10,001.
Missing baseline constants and admitted dependencies cannot acquire a checked
record. This adds evidence for that fixed synthetic packet; it does not replay
the project snapshots or the Goedel corpus.

## Bounds and reproduction

The frozen decoder accepts at most 131,072 stored nodes. Queries have an
explicit 262,144-slot path limit; this control generator accepts depths
1–20,000. The default test uses depth 10,000. Native processes have the
existing 8 GiB RSS, 120-second and 64 MiB output-file limits. The local
free-space reserve defaults to 30 GiB; CI explicitly uses its existing
5 GiB reserve. These are runtime guards and finite tests,
not arbitrary-size or whole-browser memory guarantees.

```sh
python3 research/proof-atlas/deep-typing/verify.py \
  --lean /absolute/path/to/lean-4.33.1 \
  --workdir /tmp/atlas-deep-typing
node scripts/test-proof-atlas-deep-typing.cjs /tmp/atlas-deep-typing
python3 research/proof-atlas/deep-typing/pack.py /tmp/atlas-deep-typing
node scripts/test-proof-atlas-deep-typing.cjs
```

The packaged evidence retains nine fixed packets, 27 contextual judgments and
54 source cuts, with depth 10,002 and a context of 10,000 binders. Eight native
rejections and nine altered-correspondence rejections are finite controls.
The last command checks the hash-bound compiled artifact without invoking Lean.
`verify.py --compare` reruns Lean and requires exact agreement of its emitted
terms and judgments with that artifact; platform-specific compiler descriptions
and resource observations are outside that byte comparison.

Only Lean's core library and this repository's own extraction tooling are
used. Original mathematical projects and their dependencies are not rebuilt.
Raw compiler output and resource records remain in the private work directory.
No live reader typing or deployment follows from running these commands.
