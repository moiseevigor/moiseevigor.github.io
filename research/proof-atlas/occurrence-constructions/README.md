# Composing recorded constructions at original occurrences

This experiment extends the construction vocabulary to the compact original-path
representation. It records **Π introduction** and one stage of **Π application**
in their original lexical contexts. This directory retains the Node reference
model and its frozen native experiment. A separate [reader adapter](reader.md)
uses the same rule interfaces inside the existing occurrence view, including
the existing project/AI extraction profiles. Neither component supplies complete
construction coverage or a general typing-preservation theorem.

The representation problem is specific: a small construction cut can repeat a
very long source address for every premise, type origin and external binder.
Copying all ancestor paths for every context entry would also grow quadratically.
The model keeps a query address once, records binder depths, and encodes displayed
points relative to the authenticated query inventory. This reduces repeated
address metadata without changing the selected proof term.

## Rules and interfaces

The two rules use the same ordered source fields as the kernel vocabulary:

| Construction | Original source | Recorded premises and contexts | Native checks |
| --- | --- | --- | --- |
| Π introduction | `lam x A t` | `binderType = A` in Γ; `body = t` in Γ, x : A | Domain is a type; binder domain conversion; body against the expected Π body; complete lambda against the normalized Π type |
| Π application | `app f a` | `fn = f` and `arg = a`, both in Γ | Function against its normalized Π type; argument against its domain; result against the capture-avoiding substituted body |

These are dependent-function rules. An application can return a proof, type or
value. Its constructor alone does not establish a logical implication. Native
roles are retained for the selected expression and each explicitly observed
premise. A frontier records the type observation made by its parent query; it
does not gain a recursively checked construction. A `forallE` expression is a
type former, not a lambda introduction.

The native driver decodes the exact source DAG and checks the whole closed
type/value pair first. For a query it follows original fields, checking each
domain/let value before extending Γ. It checks selected terms and premises in
that context, abstracts the resulting types and requires exact reopening.
Opening and closing each source expression must also recover its original
structure. The earlier contextual-query implementation must agree on source,
context depths, recorded type and role.

Computed types have a **computed-native-type** namespace. A type reference
retains the type-graph hash, root, original context route and recording query.
It is not assigned a source node or source type-occurrence that did not exist.
The introduction's body type uses the extended context; its domain and complete
function type use the prior context.

A recorded child construction composes only at the parent's exact premise
route with the same original context, role and structurally identical recorded
type. The model refuses a disagreement. It does not decide arbitrary
definitional equality in JavaScript. Composing different recordings must not
borrow a role or type from another use of the same DAG node.

Each retained construction accounts for its one source constructor. Each
unexpanded premise accounts for its exact expanded source subtree. The
frontiers form an antichain and partition every omitted source occurrence:

`retained constructors + sum(frontier occurrence counts) = selected subtree size`.

External binder references contribute zero to that count. In particular a
domain is outside its new binder and a body is inside it; sharing a source
node never overrides those different contexts.

## Query-relative addresses

`ProofAtlasCompactConstructionPrototype/2` uses
`source.addressing = native-query-relative/1`. Its source identity includes
the case, complete input hash, native-result hash and source-graph hash. A query
number has meaning only inside that authenticated case inventory.

| Reference | Meaning |
| --- | --- |
| `{query: i}` | Exact original route of query i |
| `{query: i, slots: [s]}` | Its original binary source child, s = 0 or 1 |
| `{query: i, prefixDepth: d}` | Original ancestor prefix ending at depth d |

A suffix cannot be attached to a shortened prefix. Other fields, unknown queries
and invalid depths/slots are rejected. The same references identify source
premises, original context binders and type origins. Type-local roots retain
their separate namespace. The decoder recovers the older packed-route scene
exactly; it validates all scene fields against the sealed native observations
before accepting a received scene. This is a recoverable view against existing
evidence, not a standalone certificate or a formally verified codec.

## Finite evidence

The frozen test set has eight core-only source packets and twelve selected
construction observations: seven introductions and five applications. Six
packets reuse source graphs from the earlier deep contextual experiment,
including the independent replay of the already-public `deepSucc` syntax
control. Their original producer metadata and bytes remain unchanged. Two
additional controls are authored here:

- `λ A : Type, (λ B : Type, λ x : B, x) A` checks dependent application and
  substitution under an inner Π binder. Inserting the ambient `A` requires
  lifting its free de Bruijn index.
- An outer `A : Type` followed by 10,000 `x : A` binders returns the first x.
  In the final lambda, the same source `bvar 9999` is a domain **type** in
  Γ10,000 and a body **value** in Γ10,001, with different original binders.
  The body's inferred type is `bvar 10000`, referring back to A.

The independent reader walks source paths and contexts directly, recomputes
every source field, checks exact frontier partitioning and recovers original
binder targets. A separate iterative substitution checks the five application
results, including the lifted variable. It compares 108 packed and 108 relative
cuts over three display budgets and three depths. The deepest query is at
10,001 and its premise at 10,002; the largest original premise context has
10,001 entries. The largest tested packed scene is 60,493 bytes and the largest
relative scene 4,774 bytes. These are maxima across this finite set, not an
arbitrary-proof compression bound.

Five native negative controls reject wrong domain/body conversions, invalid
surrounding binder/let contexts and a Π type misclassified as an introduction.
The independent reader also rejects altered source/context/type records,
fabricated entries, changed namespaces and provenance, invalid relative
addresses, and a wrong **genuine same-typed binder**. Input buffers and expected
hashes are captured before preparation; later caller mutations cannot change
the accepted scene. The audit reports its actual rejection count.

## Bounds, reproduction and limitations

The consumer caps each raw native input/output at 64 MiB, source tables at
262,144 stored nodes, computed type tables at 131,072 nodes, 32 cases and 256
observations per case. A cut retains at most thirteen construction vertices,
depth four and 64 KiB serialized metadata. The frozen package has an 8 MiB
decoded limit. Complete source/type tables and the query inventory are still
resident. These are component limits, not total-browser or arbitrary-corpus
memory guarantees. The native decoder retains its separate 131,072-node bound.

Only Lean core and this repository's own tooling are used. Lean 4.33.1 is pinned
to commit `819816b2e0a3bf405af45ae5c7af2491d8f5bee6`; the prior core-only runtime
is hash-pinned. Native jobs have 8 GiB RSS, 120-second and 64 MiB file guards,
with a default 30 GiB free-space reserve. Logs, absolute work paths, process
resources and platform-specific compiler descriptions stay in the local work
directory and are omitted from public evidence.

```sh
python3 research/proof-atlas/occurrence-constructions/run.py \
  --lean /absolute/path/to/lean-4.33.1 \
  --workdir /tmp/atlas-occurrence-constructions
node research/proof-atlas/occurrence-constructions/check.cjs \
  /tmp/atlas-occurrence-constructions
python3 research/proof-atlas/occurrence-constructions/pack.py \
  /tmp/atlas-occurrence-constructions
node research/proof-atlas/occurrence-constructions/check.cjs
```

For an independent native reproduction of the frozen evidence, supply a fresh
work directory and `run.py --compare`, then run the independent reader and
`pack.py --check`. Fresh input and native output must match byte for byte.
Producer sources, input bytes, generated entry and preceding compiled evidence
are captured before execution and checked again afterward. The package retains
exact raw JSON strings so reserialization does not silently change their hashes.

The kernel checks the finite emitted judgments. The query/codec/consumer
algorithms are not formally verified. These controls do not establish complete
proof coverage, project/AI corpus construction coverage, original private-module
verification, all Lean syntax, semantic abstraction or improved comprehension.
These commands verify the native/reference experiment, not a browser deployment.
The [reader adapter](reader.md) retains its own source/type correspondence and
browser checks, with shared extraction type tables stored once per declaration.
This experiment creates no new blog result.
