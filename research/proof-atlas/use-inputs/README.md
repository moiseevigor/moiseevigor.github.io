# From a binding wire to a recorded input

Status: local research prototype. No new blog post or public deployment.

## Representation problem

[Use discovery](../use-navigation/README.md) locates an exact binder use, but a
syntactic reference does not identify a mathematical inference. This operator
continues the existing wire to an available **recorded Π-application input**.
It reuses the native application judgments already in the compiled corpus.

There are two relations:

- **Direct input:** the selected occurrence is the exact function or argument
  operand of the recorded application stage. Its native input judgment applies
  to that occurrence.
- **Inside an input:** the occurrence is strictly below that operand. The input
  has a recorded judgment, while the intervening C[p] remains a source relation.
  No intermediate typing or inner proof step is inferred.

The operator preserves proof, type and value input roles from native evidence.
A proof variable inside a value operand does not turn the operand into a proof
premise. A binder introduced inside a lambda argument is distinguished from a
binder in the input's ambient context. The result is a particular **curried
application stage**, not a claim of saturation, logical necessity or a completed
mathematical lemma application.

## Riccati case

The published `JacobiData.slope_bound_abs` packet has three raw uses of the
hypothesis `hd : 0 < J.d p`. In source order:

| Source head | Recorded stage | Input | Gap from input to use |
|---|---:|---|---:|
| `mul_pos` | 7 of 8 | proof argument | 0 fields: direct input |
| `Or.casesOn` | 4 of 6 | proof argument | 2 source fields |
| `Eq.mpr` | 3 of 4 | proof argument | 3 source fields |

The second and third rows identify containing recorded arguments. They do not
name the unrecorded inner construction that immediately consumes `hd`. In the
first row, stage 7 remains a partial application: one further argument follows.
The source head `Or.casesOn` remains distinct from a separately recorded recursor
wrapper interpretation such as `Or.rec`.

The stored variable node e50 occurs both as `hd` in a direct `mul_pos` input and
as `hab` in a let value under a different context. The audit distinguishes the
two occurrences and rejects transferring one binder identity to the other.
Node identity alone cannot select the proof meaning.

The [audit](audit.json) stores the three full scenes, original source hashes,
native query digests, six type roots and source-context packets. Each visible
object opens its original source occurrence. Inspecting this diagram preserves
the selected binder and the article application's selection.

## Protocol

`open` owns a hash-validated complete packet and its available native providers.
`paged` borrows the sealed source cursor and native-query cursor. A source use
is checked by walking its packed route and resolving its original lexical binder.
An optional expected binder and packet identity must match exactly. Shared node
IDs and pretty names do not establish this relation.

Only original native query records are searched. Derived prefix observations
are attributed to their original query and actual application stage. For each
query containing the use, source function/argument regions are compared with the
use route. The deepest containing input wins. Equal-depth ties retain the first
original query in descending prefix-depth order and deterministic evidence-hash
order. The result means nearest **among the loaded searched records**; it does
not establish the nearest actual inference in the full proof.

The existing application-rule validator checks the selected stage. The protocol
retains its original query, provider digest/file, stage number, source ports,
recorded context depth, callee parameter/visibility/dependence, all six type roots
and three kernel-conversion flags.
Type-root numbers belong to that evidence package; they are not source node IDs.
Type text is bounded presentation, with explicit truncation markers.

The source gap retains its C[p] decomposition where that protocol permits it.
Its context extensions and original variable index are checked independently
of the native input judgment. A use introduced inside the input and a use of an
ambient hypothesis have different recorded scope relations.

## Finite evaluation

The [independent checker](../../../scripts/test-proof-atlas-use-inputs.cjs)
reconstructs each original application spine directly from source child links,
rather than treating a supplied argument route as an oracle. It independently
enumerates candidate function/argument sockets, checks deepest containment,
native origin, type-root identities, roles, context lengths and source binding.

- 469 selected use occurrences in 35 recorded profiles, including the twenty
  publisher-attributed AI profiles. The selection starts from the earlier
  317-binder sample and includes all three Riccati `hd` uses.
- 44 are exact recorded inputs; 290 are strictly inside recorded inputs.
- Together, 334 have a containing recorded application input; 135 have no matching trace
  in the searched original packages. The latter are **not recorded**, not a
  claim that no construction consumes the use.
- Complete and bounded paged consumers agree on every sampled result.
- Both function and argument sockets occur, with proof, type and value roles.
- The existing native proof-under-value boundary control is checked separately.
  A deliberately filtered term-only provider supplies a negative control:
  keeping term typing while withholding application traces cannot create a
  Π-input connection. This filtering is a test control, not new native evidence.

The [browser check](browser-audit.json) exercises all three Riccati use relations,
exact keyboard source jumps, both themes, mobile layout, a let-value use outside this application-only relation, stale preparation and the article application. It checks software behavior;
it does not measure comprehension. The underlying native application evidence
is reused; this iteration does not run a new corpus-wide Lean extraction.

## Bounds and remaining weaknesses

Source-use validation walks at most 32,768 fields. Packed routes retain their
own 262,144-slot/32-root limits. Original native query lookup is limited to
prefix depth 512, at most six providers and 4,096 lookups. One best candidate is
retained. Scene JSON is capped at 256 KiB, and each displayed type text at 512
characters plus a truncation marker.

The finite paged audit permits 16 source pages (4,096 source rows), two source
index pages, one native query of at most 2 MiB and eight native index pages.
Shared native type graphs retain their existing separate residency and decoder
bounds. These limits are not a measurement of total browser/process memory.

The C[p] protocol still has a 512-slot absolute-route limit. A longer packed
source gap therefore retains exact source positions but reports its context
diagram unavailable. The finite native sample here does not exercise that
long-gap branch. Extending the source-context protocol is still required.

No arbitrary-construction search, new typing of intermediate expressions,
premise necessity, semantic compression or comprehension improvement is claimed.
The 135 unrecorded sampled uses are an evidence-coverage boundary, not a measure
of failed Lean proofs. Among those 135, 132 are immediate application function/argument
children and three meet local-definition fields. Additional native queries at
those application sites are needed to identify the immediate input directly. In particular, the first use of the Riccati `hab` binder
is a let-value alias, not an application input. Connecting local-definition and
introduction interfaces is still needed for a continuous proof-flow view. Original private source projects and tactic scripts are
unchanged and remain unpublished.

## Reproduction

Run `node scripts/test-proof-atlas-use-inputs.cjs`; set `ATLAS_USE_INPUT_REPORT`
to write JSON. `ATLAS_USE_INPUT_CHECK_REPORT=1` compares a fresh audit with the
committed record, as CI does. The browser test is `scripts/test-proof-atlas-use-inputs-browser.cjs`
and uses the existing Playwright environment and `ATLAS_ORIGIN`. The existing
`scripts/test-proof-atlas-application-judgments.cjs` independently checks the
underlying recorded application rules and all six type components.
