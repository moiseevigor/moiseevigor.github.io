# Reversible application regions

A structural region rule for the existing paged source-use reader. It allows branches and joins rather than requiring a unique-consumer path. The region is a grouping of original application occurrences, not a new Lean term or a checked function from displayed inputs to conclusions. The earlier checked context-module rule remains a separate operation.

## Rule and accounting

Partition the retained cut into disjoint nonempty sets of exact call occurrences. Each region must be connected by retained source-use edges. Contracting the regions must leave an acyclic quotient **of the retained edges**. Reject a partition that fails either test; a cycle refusal retains the original input-position witnesses.

Every call belongs to one region. For each region, an actual input position is either an internal source use or an input across the region boundary. Function heads, implicit/type/instance arguments, repeated arguments and local-definition paths remain distinct. Results are never deduplicated by their type or stored expression ID. Every constituent result stays an exposed original portal, even when no outside use occurs in the finite inventory.

For a region R, retained cut S and crossing uses X:

    actual inputs in R = internal input uses in R + boundary input positions of R
    sum(region boundary inputs) = incoming cut uses + unrecorded cut inputs + |X|
    sum(inventoried result uses outside each region) = outgoing cut uses + |X|

The inverse recovers the original cut with every call record, input, visibility, role, original context, full binding path and nondependent flag. Region/partition identities have separate `source-use-region` and `source-use-partition` namespaces. Hashes qualify the rule, source/native owner, inventory and canonical original records. A region never acquires an invented source expression address.

Merging legal regions agrees with folding their combined original members directly. Splitting into singleton regions recovers the original partition. Changing the supplied record-list or group-list order does not change canonical identities; actual argument positions remain ordered. These laws apply when the intermediate partitions satisfy the connectedness and retained-quotient tests. This is a tested implementation rule, not a Lean metatheory theorem or an arbitrary equivalence of proofs.

## A connected fold can be wrong

The authored `shortcut` control has the exact uses `0 → 1`, `0 → 2` and `1 → 2`. Folding calls `{0, 2}` is connected, but the quotient is `region → 1 → region`. The rule rejects it and provides the two original consumer input positions as a witness. The proof-valued control exhibits the same failure with native proof roles; classifying calls as proofs does not repair the fold.

A two-call cut containing only `{0, 2}` cannot see the path through hidden call 1. Its local fold is permitted with **outside paths unverified**. Revealing call 1 makes that proposed grouping fail. This counterexample limits the guarantee: the rule does not establish global convexity, a closed module or an acyclic whole-proof quotient. This remains the guarantee of the local codec. The subsequent [inventory-wide check](../inventory-region-checks/README.md) now gates displayed folds against every indexed source use, including hidden return paths. It is a separate finite graph check, not a portable Lean certificate or complete-use coverage. All original result portals and external counts remain available.

## Native controls and scope

Four authored controls pass fresh Lean 4.33.1 root checks and packet-only native port replay, without importing their original declarations: a four-call diamond, a three-call shortcut, two ports using one result, and a proof-valued shortcut. They contain 12 calls, 28 actual ports and 12 source-use connections; eight connections retain local-definition witnesses. The 28 native observations include original producer/consumer contexts and type bridges. Native typing belongs to the individual original calls and ports, not to the region box.

The existing 31-profile native inventory and all its data remain unchanged. New controls are a separate manifest. The larger source-only packet remains source-only. Its result/use degrees supply exact inventoried counts; kernel replay of its closed packet does not supply per-call types.

In the Riccati case, a connected seven-call region containing the four-stage AM–GM path and three equality helpers has 41 actual input positions: 6 internal uses and 35 boundary inputs. Its results retain contexts Γ10 and Γ13 at their original call routes. Adding the helpers increases the boundary from the earlier path's 17 side inputs. Fewer call boxes therefore do not establish a smaller mathematical interface or better comprehension.

## Delivery and checks

The region model borrows an authenticated cut of at most eight calls, then retains its own copy of at most 4 MiB of original records. Its derived serialization is capped at 8 MiB. The underlying four-row call cache, 32-row reverse cache and two branch records per cursor are unchanged. Source/native inspectors keep their separate bounds. These are component limits, not a total heap measurement.

The interface pages four boundary inputs, two result portals and eight internal uses. A bounded internal shape keeps original call/result buttons and labelled directions. Parallel positions sharing the same producer, consumer and relation use one drawn bus with an explicit position list or count; their records and input controls stay separate. Solid and local-definition connections remain distinct. The default result filter shows calls with no further use inside the region; every original result remains selectable through **All original results**. Expanding or changing the underlying cut retires the fold. Switching folded/separate presentation preserves its identity and current source/type selection.

The model checker uses an independent connectedness and topological-sort oracle, exhaustive partitions of the small native controls, sampled larger cuts, inverse checks, legal merge/split orders, native source/type selections, tampering refusals and bounded source-only cuts. Browser checks cover the actual production build, proof/value controls, precise port selections, cycle witnesses, both themes, mobile, keyboard, stale/missing components and source-only type refusal. Original evidence remains historical; current compatibility checks are recorded separately here.

Only the authored synthetic source and derived compiled observations are added. No private research proof scripts or execution logs are published. This is a local research experiment; no blog entry or comprehension result is claimed.
