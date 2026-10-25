# Bounded source delivery for computed method interfaces

Status: local checked research iteration. No deployment or blog post.

## Problem and rule

The method-interface rule derived from Lemma 3.2's Riccati proof retains exact
source methods and separate computed eta inputs. The previous viewer loaded
the complete stored source packet to check those links. That delivery method
scales with the whole packet even when the displayed interface is small.

The new loader builds a bounded **source closure**. It retains original ancestor
paths, application spines and argument endpoints, then the stored DAG closure
of the recorded method expressions. It never enumerates their expanded
occurrence trees. The original full native record is authenticated and passed
to the **unchanged** method validator. No native query is deleted, no query
inventory is rewritten and no computed node acquires a source occurrence.

The closure is limited to 4,096 source rows and 4 MiB of serialized row JSON.
A separate one-page fetch cache holds at most 256 source rows; its Merkle index
cache holds two index records. The method record has a separate 8 MiB decoded
JSON limit. Type and computed graphs remain fully resident within the existing
record/graph limits. These are storage and JSON bounds, not a whole-browser heap
measurement. Exceeding a bound produces an unavailable interface; there is no
automatic complete-source fallback.

## Finite result

All **26 methods in 16 recorded calls across four live profiles** produce the
same scenes and source-type agreements as the complete-source implementation.

| Profile | Stored packet nodes | Expanded type/proof occurrences | Retained source rows | Row JSON bytes |
|---|---:|---:|---:|---:|
| `JacobiData.slope_bound_abs` | 3,251 | 165,921 | 1,355 | 51,907 |
| `lean_workbook_20418` | 86,587 | 29,795,398 | 1,386 | 60,747 |
| `lean_workbook_plus_6206` | 91,424 | 31,753,364 | 1,169 | 42,822 |
| `lean_workbook_plus_62755` | 2,159 | 147,823 | 1,075 | 41,664 |

The complete packets exist on the independent reference side of the tests.
The client requests hash-checked pages and the compiled native method record,
with **zero complete-source archive requests**. All fetched tuple fields are
compared with the validated complete packets. All 26 source methods, contexts,
actual/expected types and constructor identities agree with earlier recorded
typing observations. The native derivations themselves are unchanged; this
iteration performs no new Lean replay.

Test-only pages of five existing native authored controls add eight scene
comparisons. These include six methods without source lambda prefixes, a
dependent computed-input reference, two zero-input methods and two
function-valued results. These pages are generated in the test process; they
are not additional live corpus profiles or new native observations.

## Interactive inspection

Open the [Riccati sign split](/projects/proof-atlas/library/?loading=paged&edition=published-15&proof=JacobiData.slope_bound_abs&route=1:1.1.1.1.1.1.2.2.2.2.2.1)
and choose **Show paged method interface**. Constructor cases share the same
validated source closure. Each original-method or original-context reference
opens its exact packet-qualified occurrence in the graph. Computed inputs keep
their native evidence owner and computed addresses.

At a different source occurrence, the interface states that there is no exact
recorded method match and offers the recorded call selector. It does not attach
the last method to an unrelated source node. Hiding the interface, changing
source selection or switching proof releases its source closure and fetch
cache. Late or failed preparations cannot restore an older source selection.

The browser checks all 16 calls, 26 method scenes, 32 input selections and 26
agreements with the current paged native typing provider. Original-method and
context jumps are checked in each profile. Desktop/mobile checks cover both
themes. A broken native package remains unavailable while the source graph
stays usable; a changed source selection cancels the old method preparation.

## Provenance and limits

The [previous native interface result](../branch-interfaces/README.md) and
[public-packet replay](../method-replay/README.md) retain their original bytes
and qualification. `predecessors.json` pins both evidence bundles at the
preceding Git revision. Source pages use the existing producer attestations and
hash chain; the client does not independently rebuild a complete source packet
or run Lean. Compiled terms and derived records are used; original private
proof scripts are not read or published by this iteration.

The three AI-source profiles retain the dataset publisher's attribution and
source hashes. Their nine checked calls all use `Or.rec`. The fixed twenty-profile
AI inventory still has 25 unavailable candidates across its seven queried profiles. This delivery change adds no recursor coverage,
semantic compression or measured comprehension benefit.

The closure covers all methods in one authenticated native record. A larger
record or a single method whose stored source closure exceeds the bounds still
needs a different delivery/representation rule. Native method-query paging and
bounded comparison of larger method bodies remain open. The main graph's source
cache, native-query/type caches and this method closure have separate bounds;
their sum is not claimed to be a measured heap limit.

## Evidence and reproduction

The [scoped verification bundle](method-source-evidence.json) contains model,
browser, regression and predecessor checks with source fingerprints. Routine
execution and resource logs are not research blog entries.

```sh
ATLAS_METHOD_SOURCE_CHECK=1 node scripts/test-proof-atlas-method-source.cjs
node scripts/test-proof-atlas-method-source-browser.cjs
node scripts/build-proof-atlas-method-source-evidence.cjs --check
```

Run the browser test against the production build, setting `ATLAS_ORIGIN` when
needed and using the repository's Playwright configuration. Eleven refusal
controls exercise bounds, cancellation, corrupted records/pages and foreign
descriptors. Caller metadata is copied before asynchronous work. Disposal clears
retained source rows, native record ownership and page/index caches.
