# Paged equality transport

The [transport square](/projects/proof-atlas/manual/equality-transport/) now loads one original native query and the source pages needed to check its paths and literal substitutions. The same interface is available at recorded occurrences in the paged proof explorer. Source cards select their exact original occurrences; computed cards leave the source selection unchanged.

The native rule and its original owners are unchanged. [Evidence bundle](/research/proof-atlas/equality-streaming/equality-streaming-evidence.json) · [Earlier complete-source result](/research/proof-atlas/equality-transport/README.md).

## Finite result

All 58 earlier transport scenes are identical to the complete-data scenes, including source routes, computed addresses, native evidence owners and continuation/core distinctions. A fresh authored control adds one checked query. It has 40,985 stored source nodes; the compared dependent-family closure contains 28,682 distinct nodes. Its interface retains 13 source-path rows and at most 256 cached source rows, and checks the family under two added binders.

Across the 59 tested queries, the largest retained source-path set has 54 rows. The comparison memo has at most 1,024 entries and the pending frontier at most 2,237 entries, within its 4,096-entry limit. These are separate logical storage bounds, not measurements of total browser heap. The selected native graph still loads fully; the stress query has 41,016 computed nodes.

Eighteen original native records are partitioned into headers and query pages. Offline reassembly reproduces every original record byte-for-byte, including its original SHA-256 owner. The client checks one selected query. Other queries remain explicitly unvisited; unavailable candidates retain their recorded reasons. No complete source or native archive is requested automatically. Download links remain explicit user actions.

The AI-source sample retains its publisher attribution and earlier kernel replay evidence. The largest affected packet has 91,424 shared nodes representing 31,753,364 type/proof expression occurrences. The new balanced control is authored kernel data, not an AI-source proof. No private original Lean/tactic sources are read or published in this iteration.

## Traversal result

The new control exposes a scheduling limitation in the earlier source comparison:

| Order, with the same memo/frontier/cache limits | Result on this control |
|---|---|
| Highest source node first | Refused at the 4,096-entry frontier bound. |
| Depth first, constructor fields in order | Checked, with 8,495 source-page loads. |
| Depth first, preferring pending pairs on the current page | Checked, with 247 source-page loads. |

The page preference changes traversal order, not the comparison relation. Every constructor, payload, ordered child, expansion count and scope must still match. Shared terms under different binder depths retain separate comparison keys. Memo eviction repeats work; exceeding any bound fails without downloading a complete archive. Earlier method clients retain their previous default order; the transport client explicitly selects the new order.

This is a finite workload result. There is no claim that the new order completes every graph under fixed bounds or minimizes page loads in general.

## Provenance and storage contract

- Source pages have their original packet SHA, normalized-source attestation and authenticated page/index hashes. Full source validation occurs in the offline producer. Fetched pages are checked locally by hash and shape.
- A header retains all original metadata and outcome inventory. A query page retains one original entry and its content hash. The delivery manifest records the original native owner and the verified offline reassembly hash.
- Computed addresses continue to use the **original native record SHA**, not a delivery-page SHA. No generated source occurrence is introduced.
- Native/template structure determines which source comparisons are required. Planning is explicitly unvalidated. Only live, sealed comparison receipts for the exact cursor, graph, source root, target root and lift discharge those comparisons.
- Retained source paths/spines: at most 4,096 rows and 4 MiB of serialized row tuples. The independent fetch cache holds one 256-row page and at most two index pages. Comparison limits are 1,024 memo entries, 4,096 pending entries and 262,144 visited pairs per comparison.
- Header: at most 1 MiB decoded. Delivery manifest: at most 128 KiB. Selected query: at most 8 MiB decoded and 65,536 computed nodes. The client allows original-record descriptors up to 64 MiB without loading them; the current offline emitter accepts original records up to 8 MiB. The tested original records are smaller than that emitter limit. Browser heap is not bounded by these byte counts alone.

Riccati observations remain compiled-module comparisons with the original declaration/module present. AI/control observations remain closed-packet replay with their original declarations/modules absent. Delivery does not add a new kernel theorem, verify dataset authorship or reconstruct a missing tactic history.

## Checks

The unit audit compares all 59 scenes and source/computed selections with complete-data results, reassembles all 18 native records, checks release and unvisited states, exercises missing/foreign comparison receipts, malformed delivery, wrong content hashes and forced storage/work failures, and reproduces the traversal comparison above.

Browser checks exercise the manual chapter and proof-explorer integration: exact source navigation, computed selection preserving the proof selection, changed selections during loading, release, failure of optional components, responsive layout, both themes and keyboard access. Earlier method/manual checks are rerun against the current runtime. Historical reports are not overwritten.

```sh
python3 research/proof-atlas/equality-streaming/verify_stress.py \
  --lean PATH_TO_LEAN --cache CHECKING_CACHE --workdir NEW_PRIVATE_WORKDIR
node research/proof-atlas/equality-streaming/publish.cjs PRIVATE_WORKDIR
ATLAS_EQUALITY_STREAM_CHECK=1 node scripts/test-proof-atlas-equality-streaming.cjs
node scripts/test-proof-atlas-equality-streaming-browser.cjs
node scripts/build-proof-atlas-equality-streaming-evidence.cjs --check
```

The first two steps reproduce authored compiled data and its delivery partition. They do not compile private source projects. Existing native owners and source pages remain immutable.

## Remaining questions

The finite transport inventory is not complete Lean coverage. The native graph for one selected query is not paged. Other wrapper computations and arbitrary elimination remain unsupported. Neither semantic compression nor a human comprehension benefit is measured here.

A next evaluation should ask readers to locate the source value, distinguish an equality from its reversed witness and separate a transport core from its continuation. Those tasks need measured reader outcomes; passing navigation checks is not a substitute.

No blog post or public deployment is part of this local iteration.
