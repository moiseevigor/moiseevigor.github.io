# Exact source comparison for large method interfaces

Status: local research iteration. No deployment or research post.

The Riccati bound, `JacobiData.slope_bound_abs` (Lemma 3.2), exposes a general
weakness in branch-method geometry: checking its computed method interface
previously retained the complete source subtree. Paging the complete proof or
loading one native call did not remove this per-method retention requirement.

## Rule and invariant

The visible rule remains the same checked eta interface:

\[
f \equiv \lambda x_1\ldots x_n,\;f\,x_1\ldots x_n.
\]

Inputs follow the recursor's recorded expected telescope; a function-valued
result is not mistaken for additional constructor inputs. Source expressions
keep their packet hash and exact root/slot route. Computed binders keep their
original native-record owner and computed graph path. Delivery pages do not
become new evidence owners.

Two source comparisons now stream: the method versus its original source, and
the literal eta-body head versus that source under lifting by `n` binders.
Every visited constructor, canonical payload, ordered child, expanded count and
scope requirement is compared. At binder depth `d`, a source bound index `i`
becomes `i+n` exactly when `i >= d`. Needed scope becomes `s+n` exactly when
`s > d`. Other native checks, including typing, telescope dependencies, literal
eta argument order and graph structure, remain in the existing validator.
Definitional equality alone would be insufficient here, especially for proofs.

Source children precede their parents in the stored DAG. A descending-node
worklist processes queued comparison obligations. Equal source/native/depth
obligations can share work, but every ordered child obligation is queued.
Memo eviction may repeat work; it cannot omit a comparison. A mismatch or
exceeded bound fails the operation. This is an exact syntax algorithm over
hash-checked source pages, not a semantic summary.

Correctness follows from a worklist invariant: each encountered pair is either still queued, or its local fields have matched and all its ordered child obligations have been queued. A memo entry records that local expansion; pending child obligations are not removed when the parent is memoized. Deduplication identifies only the same source node, native node and binder depth. The source DAG is acyclic, so an empty successful worklist establishes every reachable local comparison; exceeding the work limit refuses a result. This is an algorithmic argument, not a Lean formalization of the JavaScript implementation.

The native graph is privately cloned and frozen before comparison. A receipt
is bound by object identity to that frozen graph, the sealed source cursor,
source/native roots and shift. Cloned receipts, a different graph, changed
roots/shift, foreign owners and disposed cursors are rejected. The receipt is
an in-process validation artifact, not a portable Lean kernel certificate.

## Finite result

Four existing live profiles reproduce **26 complete-record method scenes**
across 16 recorded calls and 32 inputs. This includes all eight Riccati method
interfaces and the three supported AI-attributed profiles. Their original
source/computed addresses are unchanged. Only 19–32 source skeleton rows are
retained per call, compared with the earlier 569–1,386-row method closures.
Complete source and native archives are forbidden by the streamed tests.
This does not extend the fixed AI candidate inventory or resolve its previously
unavailable observations.

A fresh authored computational control has **8,215 stored packet nodes**. Its
`Nat.rec` step performs nontrivial lifting of an outer offset variable and
requires **8,207 comparison states**. The old 4,096-row retained closure fails;
the streamed reader succeeds with **11 retained skeleton rows**, the same two
method scenes and the same exact addresses as the complete model. This is a
large computational control, not a new mathematical theorem or AI-source proof.
The fixture is separate from the main proof corpus. The
[manual control](/projects/proof-atlas/manual/#method-streaming-lab) exposes its
original compiled address and packet download rather than claiming an indexed
main-corpus occurrence.

The native run uses Lean 4.33.1. It compiles and kernel-checks the definition,
checks native method typing and eta conversion, and verifies literal eta-body
round-trip structure. Its environment imports Mathlib and Aesop; private
Riccati modules are absent. The 43,450 recovered dependency binaries have
verified hashes and Mathlib-cache attribution to revision
`0df444a360eaa60ab8c11dca51a86af692955474`; the original Git checkouts and an
independent dependency rebuild were not verified. These qualifications remain
part of the native provenance.

## Storage and work limits

The source page cache holds at most 256 rows and two index records. Retained
ancestor paths, call spines and argument endpoints keep the existing 4,096-row
and 4 MiB serialized-JSON caps. Each comparison has at most 1,024 memo entries,
4,096 queued obligations and 262,144 processed pairs. Tests also pass the large
control with a one-entry memo. Memo/frontier state is cleared after success,
failure and cancellation. The large control peaks at 18 queued obligations
and makes 70 source-page loads for its selected call.

These are separate logical bounds, not total heap measurements. The selected
native call still has an 8 MiB decoded limit; its type and computed graphs
remain resident and the comparison clones the selected computed graph. The
source manifest/header and provider metadata have their own bounds. A large
native graph, long source route or broad comparison frontier may still be
refused. There is no unrestricted fallback to a whole packet. There is no
claim of general elimination, whole-corpus streaming, semantic compression,
improved comprehension or a memory bound for the whole browser.

## Reproduction and evidence

[Verification bundle](method-streaming-evidence.json). It binds the native
control, exact source comparisons, browser observations and current
compatibility reports. Earlier reports and bundles remain frozen at their
original revisions in `checkpoints.json`; implementation fingerprints are
compared separately from historical functional observations.

```sh
ATLAS_STREAM_CHECK=1 node scripts/test-proof-atlas-method-streaming.cjs
node scripts/test-proof-atlas-method-source-browser.cjs
node scripts/test-proof-atlas-method-streaming-browser.cjs
node scripts/build-proof-atlas-method-streaming-evidence.cjs --check
```

The native control can be regenerated with `verify.py` using the pinned Lean
compiler and a hash-verified dependency cache, then packaged with `publish.cjs`.
The generated source hash, extraction drivers and environment are recorded.
Only compiled packet data and derived native observations are added to public
assets; private project proof scripts were not read or published. Browser checks
validate original/computed selections, release, failure/retry, cancellation,
mobile/desktop layout and both themes. These checks establish software behavior
on the stated finite sample; they do not run Lean in the browser.
