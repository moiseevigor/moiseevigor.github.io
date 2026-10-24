# Following a collapsed binding wire

Status: local research implementation. No new public deployment or blog result.
The general geometric-language research goal remains active.

## Question and representation

A collapsed binder interface can report a use count without identifying a use.
The preceding [source-context operator](../source-corridor/README.md) retains an
exact path once its endpoint is supplied. Here the endpoint is discovered from
the selected binder, without expanding its complete occurrence tree.

The existing binding wire gains four operations: **first, last, next, previous**.
Order means lexicographic source-field order. It does not mean evaluation order,
tactic order or importance in the mathematical argument. A selected wire joins
one original `bvar` occurrence to its original binder occurrence. The same stored
variable node can refer to different binders at different routes.

For a selected binder, search its body at free index zero. A lambda/forall body
increments the queried index; its domain does not. A let body increments it; its
type and value do not. All eleven structural fields participate. Metadata and
projection children are literal source fields. Free variables, metavariables and
their external assignments remain separate; no assignment is followed here.

## Search and provenance

The owner is an immutable, hash-validated compiled packet, or the sealed source
page cursor. A receipt contains the packet name, index and source hashes, the
selected binder's packed original route, its body port, the witness node/index,
and a packed **body-relative** suffix. That suffix has an explicit namespace; it
does not become an original route until it is appended to the original prefix.
Receipts are issued to one navigation session. Cloned/foreign receipts cannot
drive successor/predecessor operations or source jumps.

Iterative traversal prunes a subtree when the queried index is outside its exact
scope bound or absent from an available exact support bitset. Negative states
are cached by `(stored node, free index)`, not by a shared node alone. A successor
search skips earlier source branches but must not cache this partial search as
global absence. The finite audit exercises first/last again after exhaustion.

The maximum free index can certify its own presence, but cannot decide whether
a smaller index occurs. The previous `maximum_is_not_support` counterexample
already establishes this distinction. In the [fixed search control](maximum-only-control.json),
binder e86579 in the AI-attributed `lean_workbook_20418` packet reaches the
65,536-visit budget with maximum-only traversal; exact support finds the
independently rank-checked use in eleven visits. This is a limitation of this
bounded traversal, not a theorem excluding every other maximum-only algorithm. A missing bitset
falls back to bounded traversal. Exhaustion, missing data and fetch failures are
**unavailable**, never an assertion of zero uses.

Source support remains meaningful as raw `bvar` syntax when unresolved `fvar` or
`mvar` atoms are also present. Their assignments are not part of this relation.
This narrower guarantee differs from a complete elaborator-context interface.

## Evidence

The [finite audit](audit.json) records each sampled binder and first/last original
route. Independent counting recomputes multiplicities from source children and
index shifts; independent rank reconstruction sums uses in preceding siblings.
Each returned occurrence is also resolved independently to its original binder.
The complete consumer derives its support directly from the complete source;
the paged consumer uses authenticated support pages. Their results agree.

- 156 small constructor fixtures are enumerated exhaustively.
- 317 selected binder occurrences across 35 recorded profiles are checked,
  including twenty profiles attributed by their publisher to AI generation.
- 4,413 rank/binding checks and 1,084 compositions with C[p] pass.
- All eleven structural child fields occur in tested source paths.
- Riccati: 32 sampled binders in the published packet and twelve in the current
  packet. The hypothesis `hd : 0 < J.d p` has three raw source uses. The public
  packet and current packet retain different identities despite shared terms.
- A synthetic shared-induction control has
  `2,379,629,985,508,532,158,464` uses of its most-used sampled binder. The largest
  search in that profile visits 198 source states; it does not enumerate those
  uses. This is a synthetic scaling control, not an AI benchmark.
- A separate source control finds its outer binder's use through 10,000 nested
  binders. Its receipt occupies 4,046 bytes. The traversed path exceeds the
  512-bit support width; maximum-index bounds suffice for that particular path.
- Discovered endpoints compose with the existing C[p] protocol where the complete
  original path fits that protocol's separate 512-slot limit. The endpoint's
  original lexical context resolves back to the selected binder.

The [six new Lean facts](../context-projection/UseNavigation.lean) prove upper-bound
absence, maximum-index presence, the unbind membership relation, and the three
binder field rules over actual `Lean.Expr`. A fresh Lean 4.33.1 run checks each
theorem's type, proof, expected-type conversion and transitive assumptions.
[Verification](native-verification.json) pins the theory and driver hashes.
These general structural theorems do **not** verify this JavaScript algorithm,
prove typing preservation, or extend native observation coverage.

## Bounds and integration

Each search has a 65,536-visit and 16,384-relative-depth limit. Packed original
routes retain their separate 262,144-slot bound. Navigation retains at most 128
copied structural rows and 4,096 negative states, plus an explicit traversal
stack/path bounded by depth. Receipts are limited to 128 KiB. Very large paths
are navigated through the packed occurrence reader rather than truncated.

The paged audit uses one source page (at most 256 rows), one source index page,
32 scope entries plus the transport's one transient 256-row scope page, and one
scope index page. These are separate from the navigator's caches. The complete
consumer already has the entire source packet and may lazily derive one support
row per stored node. Its memory claim is not the paged consumer's claim. Neither
is a measurement of complete browser/process memory.

The feature belongs to the existing complete binding-reference view, paged proof
reader and synchronized article application. It adds no new top-level tool.
The native-use inventory, article mapping and inferred types remain separate.

## Reproduction and remaining weaknesses

Run `node scripts/test-proof-atlas-use-navigation.cjs`, then
`node scripts/test-proof-atlas-use-navigation-maximum.cjs`. Set `ATLAS_USE_REPORT` to
write its JSON. `ATLAS_USE_CHECK_REPORT=1` compares a fresh finite audit with the
committed record, as CI does. Set `ATLAS_USE_MAXIMUM_REPORT` to save the fixed negative control.
The production-browser test is
`scripts/test-proof-atlas-use-navigation-browser.cjs`; it uses the existing
Playwright environment and `ATLAS_ORIGIN`. Its separate
[browser record](browser-audit.json) covers source jumps, selection preservation,
unavailable states, both themes, keyboard access and mobile layout. The
[regression record](regressions.json) retains the five existing reader/theme suite outputs.

Fresh theory replay:

```
python3 research/proof-atlas/context-projection/verify_use_navigation.py \
  --lean /path/to/lean-4.33.1/bin/lean --workdir /new/temporary/directory
```

This is source-use discovery, not semantic abstraction. The audit samples 317
binders; it does not establish all-binder/all-position coverage. Arbitrary rank
selection, direct semantic relevance, arbitrary elimination, compiled-to-tactic
recovery and comprehension improvements are not established. No original private
source project or tactic script is added to the public data.
