# Context reduction and access to the selected body

## Rule and metric

A closed context module surrounds its selected term or recorded type with an ordered sequence of lambda/Pi/let wrappers. **Focus selected term** and **Focus recorded type** navigate directly through those wrappers to the existing body root. The wrapper sequence remains accessible through **Module root** and computed binding links. This changes the view root; it does not rewrite a term, discharge a hypothesis or add a typing judgment for a computed descendant.

The body route uses the module's checked ordered let-slot list: port `1` for a lambda or Pi wrapper and port `2` for a let wrapper. This rule is identical in the own small-proof reader and the source-backed reader. Full and reduced modules keep their distinct roots, context interfaces and original-use maps.

The evaluation counts **retained body constructor occurrences** in each cut, identified by their exact port path relative to the selected body. Members retained inside binder telescopes and application spines count individually even though they share a drawn vertex. Header regions outside the selected body do not count. This is neither a count of drawn vertices nor a count of checked proof steps. Query regions overlap; sums are not distinct theorem occurrences.

## Frozen inventory and comparison

The primary inventory is the existing 149-route context package for `lean_workbook_plus_6206`: 14 proof-, 38 type- and 97 value-valued observations. Its public index digest is `2e5bbcebb8129c823d4640a7c17f06b1a073c8a2df20889e65f4efc61f213bd6`. The full-context evidence digest is `a0ab7c262a0d72be5d6387276f0b66e5d3ae24cf095ff77d603a066829733de0`; public-packet reduced replay is `f3f771accec878e93f34f5f001fda0c4de7a7247a48ebac3098153a2e926fdfa`. This is one finite geometry-derived query inventory, not every occurrence, the full twenty-theorem sample or a representative human-inspection benchmark. AI attribution is the dataset publisher's.

For both term/type components at every route, four fixed vertex/depth budgets compare full root, reduced root, full body focus and reduced body focus. All cuts group binders and applications, with six term vertices per layer, four displayed application ports, and existing telescope/spine limits. The vertex budget counts term vertices; extra context-boundary markers are accounted for separately. There are 1,192 comparison rows and 4,768 cuts. The source cursor stays paged; neither an expanded occurrence tree nor a complete source index is fetched by the reader providers. Raw type metadata remains separately resident.

**Full-root and reduced-root cuts retain exactly the same relative body paths in every primary comparison.** The observed context-size reductions therefore provide no additional body-constructor coverage under these initial-cut settings. This result concerns these inputs and the current folding rule; it is not a universal invariance law.

| Vertex budget / depth | Body focus retains more / the same / fewer body constructors than the reduced root |
| --- | --- |
| 8 / 2 | 83 / 214 / 1 |
| 13 / 3 | 68 / 230 / 0 |
| 32 / 3 (reader default) | 68 / 230 / 0 |
| 64 / 6 | 34 / 264 / 0 |

The 32 / 3 proof-term subset contains fourteen observations: five retain more body constructors after focus and nine are unchanged. Retained constructors can include annotations and data; this is not a measurement of mathematical relevance or human comprehension.

Full and reduced **body-focused** cuts retain identical relative body paths throughout the primary comparison. All 19,008 retained body-constructor appearances are checked against the original component's constructor kind, port arity and non-variable payload. Independent lexical traversal checks 514 variable links; in 185 appearances a projected index differs while its original binder is preserved. Source/type namespaces and original-use maps stay separate. The largest focused preparation captures 59 source tuples and 74 projection states under the existing fixed bounds. These finite preparation counts are not a whole-browser memory bound.

## Counterexamples and scope

Body focus is not uniformly better. For the recorded type at route `1:1.1.1.1.1.1.1.1.1` (source node 30853), budget eight and depth two retain thirteen body constructors from the reduced root and twelve after body focus. Refocusing changes the telescope boundary and how the budget is spent. The ordinary root remains the default; focus is an explicit navigation action.

The equality of full/reduced initial body paths is also not general. An own structural control places a one-variable body under 193 independent Nat headers. With the 64-binder telescope limit and the reader's 32 / 3 budget, the full root retains no body constructor and the reduced one-header root retains the body variable. Focusing the body yields the same relative body path in both. This is a synthetic structural cutoff control, not an additional native observation or typing certificate.

These results distinguish smaller context closures, retained constructor access, checked proof structure and human comprehension. None implies the next without separate evidence. A typing-preservation theorem, broader proof coverage and measured inspection tasks remain open.

## Reproduction

```sh
node scripts/test-proof-atlas-context-body-focus.cjs
node scripts/test-proof-atlas-context-body-focus-browser.cjs
```

The first command authenticates the frozen packages, prepares all four cuts per row, compares relative paths, checks original constructor payloads and independently resolves lexical links. Its JSON report records exact input and implementation hashes. The second checks both reader implementations, term/type focus, original-use switching, computed-boundary and original-binder jumps, cached-root supersession, disabled controls for an already selected body and four accessibility audits. CI retains both reports. No original proof scripts or private logs are published.
