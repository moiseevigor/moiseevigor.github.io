# Shared-result use pages

A branch interface in the existing paged application reader. The earlier path fold stops at more than one inventoried use; it still does. The reader now shows those uses at that boundary, rather than requiring a switch back to separate applications and a mixed connection list.

## Visual rule

Draw the last result once. Attach a page of at most eight **input positions** to it. Group positions by their consumer occurrence on that page, retaining a separate row for every function or argument position. Grouping is local to the page; another page can contain further uses in the same consumer. Count positions, not distinct consumers. Each row retains its exact ordinal, source producer, source input route, recorded role, visibility and local-definition count. Original producer and consumer contexts can differ.

A consumer card has its original function label, result-type summary and context. Types and roles remain unobserved on source-only profiles. A summary is a presentation of a recorded observation; it is not a new composite typing judgment.

“Follow call … / argument …” checks the selected input witness again, then replaces the cut with that consumer and follows its unique-use path. The preceding result remains an incoming source reference and the entry input is directly inspectable. Other uses remain in the immutable index, rather than being treated as absent. There is no unbounded retained navigation history. Uses outside the finite application inventory remain unknown.

## Exact occurrence tests

The native inventory contains one producer with more than one inventoried use: call 2 in `lean_workbook_4274`. It feeds argument 4 of consumer occurrences 0 and 1, through their original local-definition witnesses. Those two consumers have the same stored node ID, **1428**, but different source routes. Their input uses likewise share stored node **174** and have different routes. They must remain two consumer cards and two positions, not one graph vertex selected by node ID.

A second existing control, `AtlasComposeControls.samePorts`, supplies two ports from two distinct occurrences of stored node 24. Each occurrence has one inventoried use. Storage sharing does not turn these into a two-use result. The earlier control named `AtlasComposeControls.shared` also shares storage at different routes; its name is not evidence of a source-result branch.

The larger source-only packet has a 14-use branch at call 4061. Its two pages test a branch beyond the eight-row display limit, with explicit unavailable per-call types. This is not an evaluation of mathematical comprehension.

A separate wire-format fixture tests two positions of one consumer fed by one producer. It has no Lean observation and is counted separately from native checks. Rehashed malformed fixtures test reverse/input disagreement, duplicated input ordinals, context mismatch and fabricated roles without modifying compiled artifacts.

## Delivery and validation

`uses(call, offset)` reads the requested consecutive reverse-index ordinals directly. It includes uses already inside the retained cut, unlike the general frontier list, which excludes internal edges. Each target call is checked sequentially, keeping only its card summary in the use page. Reverse and consumer records must agree on producer, input route, ordinal, slot, role, visibility, local-definition count and original producer context before a page becomes actionable. Source hashes and native owners remain unchanged.

The original eight-call / 4 MiB retained-cut bound, four-row call cache, 32-row reverse cache and two branch records per cursor remain. Use pages have at most eight edges and eight consumer summaries, with a 4 MiB serialized limit. One target record is read at a time; source/native inspectors keep separate limits. These are component and serialization bounds, not a total JavaScript heap measurement. A full eight-call cut can follow a selected use without first retaining a ninth call.

New pages revoke old page tickets. New focus, release and source selection invalidate pending operations; late pages and continuations cannot replace current data. Failed or damaged pages offer a retry and do not fall back to a full topology/source/native archive.

`model-check.json` records an independent enumeration of every original native input use, exact source and computed-context selections, the 14-use source-only branch, full-cut continuation, separate protocol controls and stale-operation refusals. Browser checks use the production build and cover both themes, mobile, keyboard, source-only refusal, exact entry selection and failure/retry. Historical evidence remains unchanged; compatibility checks for this revision are recorded here separately.

This interface addresses a concrete navigation dead end. It does not establish complete-use coverage, semantic compression, mathematical premise necessity or improved human comprehension. No scientific blog entry is added.
