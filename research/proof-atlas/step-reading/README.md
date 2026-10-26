# Reading a construction through its result and input uses

The compact region diagram identifies application occurrences and exact input-use wires. A name such as `Eq.mp` does not state the proposition at that occurrence. The reader now keeps a selected call's recorded result summary beside the diagram, together with navigable incoming sources and consumer inputs.

## View rule

Selecting a graph node, result portal or boundary input updates the same call readout. Reading a result brings its statement into view, including on narrow screens. Unfolding and refolding retains the active call and any existing source/computed-type selection. **Open original result** selects that call's exact compiled occurrence. An internal connection has two actions: read the original source/consumer result, or inspect its exact consumer input slot. These are different selections. A link through a recorded local definition retains its hop count and original producer/consumer contexts.

The readout preserves each input position. Repeated uses of the same producer in two slots remain two rows. Function slot zero remains a function input. The selected call's total input count is the sum of its internal input positions and its boundary positions; the existing boundary sheets retain the latter. Consumer lists describe this retained region, with inventoried outside counts stated separately. Selecting a retained call outside the region clears the region-local use lists.

At most four incoming and four outgoing positions are displayed at once. The view uses only the existing retained call records and source-use edges. It adds no type inference or source-graph fetch. Opening an original result or input uses the existing bounded inspector. The selected recorded summary is bounded by the existing 1,024-character call-summary contract; the original result/type inspector remains available for the underlying observation.

Source-only calls have no native result summary. The reader displays their original occurrence and source-use links with **per-call type unobserved**. An empty local list is not a statement that a proof has no other uses. Each call and port retains its own original context; this view does not construct a common-context typing judgment.

## Riccati case

In the seven-call Riccati region, call 75 records

    2 * √(|J.T1 p| * |J.T2 p|) ≤ |J.T1 p| + |J.T2 p|

Its result feeds input `25:4` through one recorded local definition, from original Γ10 to consumer Γ13. Call 25 also receives the equality from call 76 at input `25:3`. Reading result 25 displays the resulting inequality with the product identity substituted under the square root. The subsequent result uses are `25 → 26:4` and `26 → 27:4`; equality helpers 77 and 78 feed their third arguments. All six connections are original source-use witnesses, rather than arrows added from a mathematical narrative.

The statements are the existing native display summaries. They are not independently generated prose, normalized replacements for original expressions, or a minimal mathematical premise set. The native observation owner is `7a995a4a5559be0a3f1778357ac9a9b696cc0bf446e7513f6a3d52822035af35` in the `published-15` edition of `JacobiData.slope_bound_abs`. Complete source, native-owner and inventory identities remain in the report.

## Checks and limits

The [browser checker](check-browser.cjs) separates isolated view tests from real-reader selections. The isolated tests render all 106 selected cuts from 42 native profiles, comparing 282 native result-summary appearances. Each retained result summary, role, context and occurrence anchor is compared with its pinned native observation before rendering. Node/result selection, ordered source-use windows and exact input callbacks are checked against the original records without modifying them. A partial diamond tests outside-region selection; an eight-call source-only fanout tests paging beyond four consumer positions without inventing types.

Real-reader checks traverse the Riccati constructions through the live inventory gate and original native inspector. They check all seven results, the six original connections, two repeated input positions, the source-only boundary and stale-profile clearing. Desktop/mobile and both themes have accessibility and document-overflow checks. These are finite source/interaction tests. They do not measure improved human comprehension, proof-inspection speed or semantic compression.

- [Production-browser and native-summary report](browser-check.json.gz).
- [Existing region, proof-input, rule-head and inventory compatibility checks](compatibility.json.gz).
- [Earlier boundary preservation laws](../boundary-kernel/README.md) and [native source/role checks](../rule-support/README.md).

The production build precedes the final static report copies; application assets are checked byte for byte against the tested source. Historical reports retain their original hashes. This is a local prototype; no blog result or public deployment is claimed.
