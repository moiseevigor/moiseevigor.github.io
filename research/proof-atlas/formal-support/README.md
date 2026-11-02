# Exact formal references in shared types

Status: candidate implementation in the complete and paged application readers. Original native observations and context owners are unchanged. Three authored kernel-typed controls are available in the existing [application inspector](/projects/proof-atlas/manual/equality-transport/#application-ports), after the original profiles. No blog post or public deployment is included.

## Representation problem and rule

Dashed type-reference links identify earlier formal positions referenced by an argument's literal domain. A depth-indexed walk can exceed its work bound when the domain is a small shared graph with many binder paths. This prevented the full application view of the [typed shared scope control](../scope-comparison/native/README.md), even after its separate weakening comparison passed.

The reader now computes an exact set `F(v)` of free de Bruijn indices for each reachable stored row. A variable `bvar i` contributes `{i}`. Other leaves contribute the empty set. An ordinary child edge preserves its set; a binder-body edge removes zero and subtracts one from every remaining index. A parent takes the union of these transformed child sets.

Only lambda/forall body slot 1 and let body slot 2 introduce a binder. Domains and let values do not. For `n` preceding formal positions, the displayed references are the ordered positions `n-i` for `i ∈ F(root)` and `0 ≤ i < n`. Older ambient references remain outside that formal-position list.

This is a compositional specification for literal syntax. It does not normalize a type, discard an unused let value, infer argument-value use or establish mathematical premise necessity. Source links and recorded typing/conversion remain separate checks. No new general Lean theorem or implementation/decoder refinement is asserted.

The exact sets matter. A shared `bvar 2` reached at depths 0 and 2 references positions 1 and 3 in a three-position context. Position 2 is absent. Replacing the depth set by its interval would invent that reference; the new rule keeps the gap.

## Finite evidence

- **28,800 generated cases** cover ordered fields of all twelve constructors and agree with a separate occurrence/depth-sensitive oracle. These are structural controls without a typing claim.
- **Twelve fixed cases** cover binder fields and the 64-position boundary. They reject five compilable mutations: dropping lambda binding, binding a forall domain, binding a let value, binding a projection field and filling a support-set gap.
- The **1,026-row mixed-reference control** exceeds the preceding 262,144-state depth-walk budget. The new scan visits 1,026 rows, retains 1,537 support entries and returns exactly formal positions 3 and 4. This control is untyped.
- The **kernel-typed closed shared domain** visits 1,545 rows and retains one support entry. Its first-argument application scene now succeeds. Additional structural scans with 1, 4 and 64 preceding positions also return the empty set; they do not invent additional native typing queries.
- The actual paged provider matches all **three complete native scenes**, including the shared control. Its **27 type selections** retain the original/lifted/expected namespaces and their original contexts; 24 original source selections match their exact compiled paths.
- Reduced node/support budgets return unavailable. Invalid bounds, cyclic/non-postorder children, bad arities, negative indices, cancellation and missing rows are refused. Exhaustion never yields an empty dependency list.

[Finite rule checks](model.json.gz) · [Paged scene and selection checks](views.json.gz) · [Compiled delivery](publication.json.gz).

The prior failure is preserved in [commit 0899c8504](https://github.com/moiseevigor/moiseevigor.github.io/tree/0899c8504b3b5a4809c03b9638484e7f131e3c31/research/proof-atlas/scope-comparison/native), including the then-unavailable scene. The native declaration checks and original data owners are retained; the current reader replaces that scanner limitation.

## Resource and provenance boundaries

The scan retains one support reference per reachable row and an explicit traversal stack, without retaining full constructor payload tables. Unchanged vectors are reused through nonbinding wrappers; a 10,063-row control with 10,000 metadata wrappers preserves 32 references without copying the same vector at every wrapper. At most 65,536 input rows, 262,144 visited states and **262,144 stored support entries** are allowed. Smaller independent node/support limits can be requested. Support-set growth can still make a valid graph unavailable. This bound is separate from the existing type-page, source-path, metadata and comparison bounds.

The inspector loads a hash-addressed catalog, an exact native call and its individual type pages. Each port has one 64-row type cache and one 256-row source cache. Complete recorded type graph arrays are not reconstructed. Kernel zeta-check probe tables remain complete inside bounded metadata and are counted separately by the reader; this is not a total-memory guarantee. The finite reference checker retains complete oracle graphs outside those runtime components.

The three controls are authored Lean-core definitions, not an AI-source benchmark. Their source packets, native observation owners and original contexts are unchanged. The supplemental catalog leaves the existing 42-profile/877-input inventory intact. No original private mathematical Lean project, tactic script or extraction log is published.

General semantic abstraction, arbitrary region typing and measured comprehension remain open. This change removes a demonstrated structural-composition limit; it does not complete the geometric-language program.

The large control's printed type preview remains difficult to read: repeated parenthesized fragments and native pretty-printer omissions do not explain its repeated structure. Exact ordered-field inspection is available, but a readable sharing fold for such types remains a presentation problem. Accessibility checks do not establish clarity or comprehension.

## Reproduction

```sh
node --max-old-space-size=256 research/proof-atlas/formal-support/check.cjs /tmp/formal-support.json
node research/proof-atlas/formal-support/publish.cjs --check
node --max-old-space-size=256 research/proof-atlas/formal-support/check-views.cjs /tmp/formal-support-views.json
```

The compiled fixtures and their earlier kernel replay are in [the scope-control record](../scope-comparison/native/README.md). The current reader checks require no private imports, Mathlib cache or new Lean installation.
