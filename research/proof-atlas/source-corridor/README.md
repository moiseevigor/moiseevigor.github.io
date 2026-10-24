# Source context paths

Status: local research implementation. The blog and public deployment are
unchanged. The general geometric-language program remains active.

## Representation problem

A recorded proof interface can lie below introductions, local definitions,
applications, type fields or value fields. An ordinary small source cut may stop
before reaching it. The preceding [case-composition experiment](../case-composition/README.md)
draws the seven recorded Riccati eliminations once their starting occurrence is
selected; it does not represent that occurrence's entire surrounding proof.

The candidate is a **source context path**. It compresses the unchanged context
between two exact source occurrences, retains every off-path sibling as a
separate region, and preserves the original lexical context at each port.
This is a source relation. It does not infer a chain of typing rules or logical
premises through intervening expressions.

The existing [one-hole context model](../local-cut-context/README.md) supplies
the structural basis. This iteration implements a compact protocol, bounded
source consumer, transfer operation and integrated reader. It adds no new Lean
theorem and does not prove the JavaScript implementation in Lean.

## Rule C[p]

For a source expression t and an ordered child path p, write t = C[p][s].
Retain each constructor on p, each of its off-path children, and the endpoint s.
The eleven structural child positions of the twelve Expr constructors are
supported. Atomic constructors can be endpoints. Source names, binder flags,
literal/universe/metadata payloads remain recoverable in the unchanged packet.

```
size(t) = length(p) + sum(size(off-path children)) + size(s)
```

A lambda or forall body extends the preceding lexical context; its domain does
not. A let body extends it; its type and value do not. This rule is applied
separately to every sibling port, including a body that is off the selected path.
Repeated names and shared source nodes do not identify binders: the original
packet and occurrence route do.

The display uses C[n] for a path containing n constructors. The count n is not a
context identity. Original routes, field slots and source hashes supply identity.
Binder names are bounded presentation labels; their complete original payloads
remain in the source packet. Γ labels count the original enclosing term binders;
they are not assertions of a newly checked typing environment.

The protocol stores one root route and ordered member records. A member, its
sibling or an external binder has a relative address, from which its original
node, route and field-qualified path can be recovered. Full ancestor paths and
contexts are not copied onto every member. A shared-node ID alone is insufficient.

## Composition and transfer

Adjacent paths compose when their packet identities, source endpoint, lexical
context and original outer binder identities agree. Their field sequences
concatenate. Rechunking a fixed source path must recover the identical protocol.
These are source-context seams, not matches between inferred types.

`plug` replaces only the endpoint source cut. It checks the inner source identity,
its exact root and all retained/hidden source positions. An independent trie
check rejects missing fields, overlapping regions and relocated shared positions.
For an inner cut S:

```
retained(C[S]) = length(p) + retained(S)
hidden(C[S])   = sum(size(off-path children)) + hidden(S)
```

All outside source positions are unchanged. The transfer deliberately copies
only source positions, states and counts. It does not turn an arbitrary input's
`role` or `nativeTypeRoot` field into evidence. A native interface keeps its
original validator and evidence owner separately; its presence does not type the
surrounding path. No term is normalized or reindexed.

## Riccati proof

For `JacobiData.slope_bound_abs`, published-15, the path from the complete proof
body to the recorded `Or.rec` occurrence has twelve constructors: six lambda
bodies, five let bodies and the value of `hsum`. That value uses Γ11, before its
own let binder. The off-path `hsum` body uses Γ12.

The path alone accounts for the whole body as
`12 retained + 165,582 hidden = 165,594 occurrences`.
The separately validated case interface retains 50 constructors and 55,365
hidden occurrences in its 55,415-occurrence region. Transferring that cut gives
`62 retained + 165,532 hidden = 165,594 occurrences`.

This is complete **source accounting**, not complete typing or explanation of
all 165,594 positions. The seven recursors and fourteen branch inputs retain
their existing native records. Other proof subterms remain hidden regions.
The working snapshot retains a separate packet identity and has no corresponding
elimination inventory; the published evidence is not extended to it by node ID.

## Why a source path is distinct from a proof edge

The existing native [frontier counterexample](../frontier-boundary/README.md)
contains a proof application below a value-valued structure operand. A closed
proof-premise frontier does not discover this proof. The source context path
reaches the original witness at `1:1.0.1` through two constructors while
preserving the original one-binder context. Its selected source region has
9,671,406,556,917,033,397,649,412 occurrences; only two constructors are retained.

The endpoint has its own existing native proof-type observation. Intermediate
constructors acquire no role or typing from that observation. This example does
not show that the omitted proof is important, that the context is a logical
dependency or that target discovery is solved. The user or an evidence index
must still supply the endpoint route.

## Bounds and source delivery

The compact protocol permits at most 512 path members, a 512-slot original route
and 128 KiB of serialized metadata. A bound violation refuses the view while
preserving source navigation. Source-cut transfer is separately limited to 4,096
entries, an 8,192-node validation trie and 512 KiB of inner-cut metadata, with a
preflight before copying or serializing the input.

The complete owner requires an already hash-validated immutable source packet.
The paged owner is bound to the existing source cursor. It reads one source row
at a time, plus immediate child rows for counts and scope checks, and does not
enumerate or fetch hidden subtrees. Tests configure a one-page source cache and
one index page; the normal reader retains its existing independent cache limits.
These are representation and cache bounds, not a whole-process memory theorem.

## Evidence

The [audit](audit.json) retains implementation/checker hashes and all 35 packet
identities. It checks 1,300 recorded endpoint routes, including 204 in the
twenty-profile attributed AI sample. Query routes serve as test seeds; this
iteration does not newly replay all their native judgments. The corpus includes
a 121,568-node project packet and synthetic shared proofs with much larger
expanded occurrence counts. Synthetic and AI-attributed provenance remain
separate.

The independent checker rebuilds source cuts from original ordered children and
recomputes source masses from the shared DAG. It separately rebuilds lexical
contexts from original routes and compares every member, sibling and endpoint.
The audit also checks the 156 existing small structural fixtures, all eleven
child fields, rechunking, a 512-member synthetic path and refusal controls.
The report gives the exact counts. Overlapping path appearances are not distinct
proofs or a corpus-wide native typing inventory.

The paged and complete protocols agree at every tested endpoint. The source
cache retains at most 256 rows in this configuration, with no original complete
source archive request. The largest synthetic protocol is 49,024 bytes. Per-packet
metadata and source-cache measurements are retained in the audit; they do not
measure semantic compression or comprehension.

The [browser audit](browser-audit.json) covers both existing readers, source and
binder jumps, let-value/body contexts, member paging, an attributed AI profile,
a large project packet, cancelled preparations and missing optional components. Route-only links resolve through the supplied
source route. A rejected node/route mismatch preserves the previous complete
selection; declaration loading exposes no selected occurrence until its source
and records are ready. These are reader-state checks, not new mathematical
results.
The manual now includes C[p] beside telescopes, application spines and source
cuts. The article remains an application of the same source selection.

## Reproduction

```sh
ATLAS_CORRIDOR_REPORT=/tmp/source-corridor-audit.json \
  node scripts/test-proof-atlas-source-corridor.cjs
node scripts/test-proof-atlas-local-cut-context.cjs
node scripts/test-proof-atlas-structure.cjs
node scripts/test-proof-atlas-manual.cjs
# After the production build, with Playwright and axe-core available:
ATLAS_ORIGIN=http://127.0.0.1:8866 \
  node scripts/test-proof-atlas-source-corridor-browser.cjs
```

At a non-root source occurrence, choose **Show source context path**. Local
member inspection preserves the source selection; source/binder buttons select
the exact original occurrence through the existing reader. No original private
Lean source project, tactic script or new native compiler output is published.
Arbitrary elimination interpretation, target discovery, semantic abstraction,
broader paged corpus delivery and measured proof-inspection benefits remain open.
