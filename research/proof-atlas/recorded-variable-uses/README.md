# Recorded variable-use references

Local reference model for the next geometric rule. It is not integrated into
the reader. The deployed mixed interfaces are a separate result. This package
uses existing public compiled records and owned calibration controls; it
contains no original private mathematical source or new native Lean run.

## Representation problem

A context extension does not establish a typing judgment for a new source
variable occurrence. A shared variable node can also refer to different original
binders and have different recorded roles. A useful reference link therefore
needs an exact source occurrence, its lexical target and its own native owner.

`index.cjs` extracts existing direct and construction-premise observations of
bound variables. A source use keeps its packet/graph hashes, original route,
node, context length and binder route/ordinal. Repeated observations at that
same occurrence retain separate evidence hashes, original recording owners,
fields, type components and roles. They are not counted as independent uses.
Agreement is checked against the accepted records, not inferred from a node ID
or binder name. The catalogue does not infer missing observations.

## Geometric rule

A **recorded-use reference** points from one original source use to its exact
original binder. Within a mixed context frame it belongs to exactly one of the
disjoint header/body regions. There are three cases:

1. The target is a retained binder slot in the current frame.
2. The target precedes the frame and remains an original-context boundary.
3. Both target and use are inside a hidden region. This is an internal reference,
   not a requirement on the region's enclosing context.

The reference contributes **zero source occurrences**. It is a link/badge for
an occurrence already counted inside its region, not a second retained source
vertex. Its native observations type that particular use in its own original
context. They do not type the region or create a fresh variable judgment.
If a later view exposes that use as a retained vertex, its ordinary source cut
must be refined as well; the same occurrence cannot stay hidden and be added
again. Reference links express lexical use, not mathematical necessity.

`references(frame, result)` preserves the frame's original source partition.
Selecting a reference can recover its source route and every original native
observation. Choosing between multiple observations remains explicit.

## Bounded delivery

Source pages contain full use records once. Binder-order pages contain only
references back to those rows. Both orders and their shared source identity are
bound by an expected manifest hash. Each page has an expected hash and decoded
byte count. This authenticates the producer's catalogue; it does not make the
producer, codec or renderer formally verified.

The consumer retains at most one source and one binder page. A page has at most
8 rows and 64 KiB; a manifest has at most 64 KiB. A query returns at most 8 uses
and 128 KiB, scans at most 32 rows and reads at most 8 pages. Continuation is tied
to the same issued consumer, immutable catalogue and query. Changed queries,
foreign cursors, wrong source identities, damaged pages and secondary references
to another occurrence are refused. Oversized records/manifests fail explicitly.
Disposal releases both page caches and prevents further use.

The finite audit covers 51 profiles: 26 project/AI extraction profiles and 25
owned calibration declarations. Its 340 observations describe 170 distinct uses;
36 uses target original binders outside the current typed-interface inventory.
The audit checks 131 binder queries, 575 source-region queries, 909 mixed frames
and 12,642 reference placements. Its storage-depth control is synthetic and
does not claim a native judgment at that deep position. Input identities and
reproducible catalogue hashes are in `verification.json`.

These are delivery-component bounds. The producer and reference tests load the
accepted source/native tables. Decoded JSON sizes and page-cache counts do not
measure whole-process or browser memory. Browser selection, refinement history,
optional-data failure and accessibility tests remain necessary for integration.

## Syntax counts are a separate measure

`support.cjs` counts syntactic occurrences of one original binder in its body.
For a selected binder, start its body at target index zero. At a nested binder,
the target index increases only in its body; domains and let values keep their
prior context. For each `(node, targetIndex)` pair, a matching bound variable
contributes one and other constructors sum their original child contributions.
Shared nodes may contribute through several paths, so these are expanded
occurrence counts, not unique DAG-node counts.

The dynamic traversal retains at most 65,536 states. Validated `neededScope`
metadata and conservative 64-residue free-index masks prune impossible matches.
The masks never drop residue zero when it might also stand for index 64 or
larger. They add one fixed-width value per accepted source node. A budget refusal
returns **unavailable**, with no partial or zero count. This reference counter
uses a complete source table; it is not yet a paged browser counter.

The finite check completes 296 of 303 binder counts; seven counts in the large
working-snapshot polynomial proof remain unavailable. Ninety-five small counts
match an independent original-path/binder enumeration; 274 match an evaluation
without either pruning rule. Scope-only pruning reproduces 278 completed counts;
residue pruning completes 18 more at the same state limit. Shadowing, let-value
scope, index-64 wraparound and forced-budget controls are separate checks.
`support-verification.json` retains each packet, original binder route and result.

In 229 completed cases, the syntax count exceeds the recorded typed-use count.
Consequently a future display must distinguish **recorded typed uses** from
**all syntactic occurrences**, and keep an unavailable syntax count separate
from both. A syntactically unused binder is not a proof that an assumption is
mathematically unnecessary. None of these comparisons adds native judgments or
establishes semantic abstraction, general preservation or human comprehension.

## Reproduction

From the repository root, using the existing compiled fixtures:

```sh
node --max-old-space-size=4096 research/proof-atlas/recorded-variable-uses/check.cjs
node --max-old-space-size=4096 research/proof-atlas/recorded-variable-uses/check-support.cjs
```

No compiler build, Mathlib download or new private source publication is required.
The general research program remains active. No blog result is claimed here.
