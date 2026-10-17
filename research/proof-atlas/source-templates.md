# Parametric source shapes

A shared source DAG node can denote different binders at different occurrences. The reader therefore shares a relative source shape and retains a separate instantiation for each use. This is a syntactic construction. It does not merge native typing records or establish type equality or semantic proof compression.

`ProofAtlasSourceTemplate/1` retains the immutable packet hashes and source node. Its geometry uses the existing constructor, binder-telescope and application-spine rules. Free term references become formal ports `v_i`, where `i` is the de Bruijn index relative to the whole template root. Internal binders keep relative template routes. These routes occupy the `source-template` namespace and are not invented original source occurrences.

`ProofAtlasSourceTemplateUse/1` binds each formal port to its exact surrounding source binder. It maps displayed template nodes and internal binder links to the original occurrence by prefixing that occurrence's source route. Each use retains its original source identity. Recorded roles, types and their provenance belong to the individual original root occurrence; template descendants receive no new typing observations.

Every selected region can open relative source geometry with its binder ports. Repeated nonterminal regions exposed in the current paged scene can also be compared, including displayed proof regions and collapsed frontiers. Collapsed frontiers require known source-scope evidence; displayed roots request their authenticated summaries when opened. Unknown context data remains explicitly unavailable. The original proof scene, source accounting and typing records remain unchanged.

Ordered source fields, hidden header regions, binder continuations and retained constructor occurrences have direct local navigation controls. The selected original use stays fixed during local refinement. Exact source jumps continue to use that occurrence's original route and binder assignments. Rendered labels are captured during bounded source loading so later source-cache eviction does not require synchronous reads of missing source rows.

The view retains at most one template cut with 64 vertices (default 32), relative depth at most six and four instantiated occurrences at a time. Occurrence paging exposes further uses. Formal support has at most 512 ports; the diagram shows one selected formal port and its assignments while retaining the complete interface. Closed term-binder interfaces do not assert independence from declarations or universes. Unknown free/metavariables or support exceeding the authenticated summary bound are unavailable.

Refining the displayed template keeps the whole-template formal interface, including ports unused in that smaller cut. Internal template binders outside the focused cut remain explicit context boundaries. Every displayed original-source jump uses the selected occurrence's route and binder assignment. Neither a template path nor a different occurrence's route is used as its source identity.

Source and scope data use the existing bounded queues. Each occurrence is instantiated separately, so the reader does not require all occurrence paths to be resident at once. Discovery inspects at most 4,096 source ports in the current scene. The comparison does not build a whole-source support table in the browser. Source tuples, summaries, native-query records and shared type graphs have separate bounds; these are not total browser-memory measurements.

Across the finite 34-packet inventory, 1,288 recorded routes under three priorities and three grouping modes give 11,592 views. The independent audit checks 10,693 family appearances, 23,198 uses, 25,362 formal assignments and 8,582 visible variable links. There are 1,881 uses with a recorded proof role; types, values and unrecorded roles remain distinct. These are overlapping appearances, not proof-size or semantic-compression counts. Another 128 local refinements retain the whole-template interface; synthetic invalid-input controls are checked separately.

In the released AI-source example `lean_workbook_20418`, three proof-valued uses of `Classical.or_iff_not_imp_left` share source expression e166. Its 93 syntax occurrences depend on one formal port, `v6`, instantiated with different original variables. Each use retains its own recorded proof type and provenance. A separate type-expression family, e154, has six uses. The same source geometry also supports a closed selected proof body; its original term-binder interface has no free ports. This does not make its declaration or universe dependencies disappear.

The closed AI-source body represents 29,794,821 expanded source occurrences. At the maximum API cut bounds (64 vertices, depth six), the tested cut has nineteen vertices and agrees with an independent full-source reference. The consumer's source cache peaks at 1,595 tuples and requests no complete source packet. The browser additionally checks hidden-field and binder-continuation navigation through the selected body. These are source-cache and structural-navigation results; native query/type-graph residency is separate, and no semantic compression or total browser-memory measurement is claimed.

Reproduction:

```
node scripts/test-proof-atlas-source-template-controls.cjs
node scripts/test-proof-atlas-source-templates.cjs
# After the production site build:
node scripts/test-proof-atlas-source-template-browser.cjs
```

The corpus audit uses independent finite sets and original-source lexical traversal to check formal assignments, restored nodes and binder links. Paged source templates must equal full-source references. Refinement retains the formal interface, and comparing uses must leave the original scene unchanged. Synthetic controls cover known constructor payloads, shadowing, dependent lambda/Pi/let headers, gapped formal ports, unused ambient binders and invalid requests. They do not constitute additional kernel certificates.

The browser checks the same integrated reader rather than a separate application. The prototype and current finite corpus do not establish general semantic abstraction, universal Lean coverage, arbitrary-context typing or a measured benefit to human proof inspection.
