# Recorded constructions in the occurrence reader

The optional **Proof constructions** lens shares the existing compiled-source
occurrence reader. It expands recorded Π introductions, individual Π application stages and
source-bound local definitions where their native metadata are available. **Source occurrences** retains the expression view. Both
lenses use the same selected original occurrence, source fields, binder links
and recorded-type panel. The human-readable article remains the default article
view; this lens is independent of its passage index.

## Rule interfaces and provenance

An introduction retains its original `binderType` and `body` fields. The domain
uses Γ and the body uses Γ, x : A. An application retains `fn` and `arg`, both in
Γ. Proof, type and value roles come from the recorded native judgments, not the
constructor glyph or declaration name. The same stored variable can consequently
have different roles and binders at different original occurrences.

A normalized record keeps the source packet/graph identity, original route,
lexical context, shared type-table root, native conversion checks and original
recording query/stage. A separately recorded child composes only at that exact
source field, with the same context and role and structurally equal recorded
type syntax. Structural disagreement leaves an explicit boundary; JavaScript
does not decide general definitional equality.

Each retained constructor contributes one original source occurrence. Omitted
premise subtrees form an antichain with exact expanded counts. Their sum plus
the retained count equals the selected subtree's count. Original Γ references
are outside this partition and contribute zero. A visible boundary can have a
recorded type without having its own checked construction rule. Constants,
context variables, type expressions and missing application/introduction records
are labelled separately. Other rule families remain outside this lens even when
the older complete reader has a dedicated representation for them.

The type panel uses the recorded component's native pretty-print text when it
exists, and its actual graph component otherwise. It never substitutes the
parent conclusion's text for a premise type. Printed text is presentation.
Computed types have their own namespace; internal type nodes acquire no new
typing judgments. Type-local binders and original-source Γ references remain
different links.

The extraction profile records both Meta-inferred argument types and kernel
application-stage argument types. Three fixed source positions have different
stored syntax for those observations. The lens preserves both, with a separate
**Meta-inferred argument type** action. That action does not display the kernel
component's printed text as if it described the Meta component. Provenance and
**Go to recording query** retain the actual original extraction query, including
when the selected construction is an observed application prefix.

## Compact addresses and bounds

The reader's `ProofAtlasOccurrenceConstructionCut/1` stores one original packed
root route. In version 1, descendant points use at most five binary source-field suffix slots;
external ancestor targets use their original prefix depths. A suffix cannot
follow a shortened prefix. Source/type origins and original recording-query
addresses use this same encoding. It recovers original paths without rebasing
their lexical context. This selected-root encoding is distinct from the frozen
reference experiment's query-relative format; the audit compares their recovered
source fields and type origins.

The cut retains at most thirteen construction constructors, depth four and
64 KiB of serialized metadata. It can additionally show at most fourteen source
boundaries and their distinct binder references. Metadata overflow is refused.
Source and type tables remain resident under their existing profile limits;
shared extraction type arrays are stored once per declaration. Context records
retain binder depths along the original query, not a copied full ancestor route
at every context slot. Component type views reuse their existing thirteen-node,
depth-three cut bounds. These are component bounds, not an arbitrary-proof or
whole-browser memory guarantee.

Native extraction retains its existing 512-entry context/path profile. The
separate synthetic core replay supplies the deep-context controls. The reader
does not extend native project/AI typing to other source positions merely
because source navigation can reach them.

## Finite checks

The control inventory retains all 27 previous contextual queries and their
original producer metadata. It adds nine distinct construction-query positions
and thirteen further explicit premise positions, yielding 49 typed source
positions in eleven controls. The twelve native construction records are the
frozen experiment's seven introductions and five applications; these additions
are record transport and normalization, not new browser kernel judgments.

In the deep dependent control, one source `bvar 9999` denotes A in Γ10,000 and
the first x in Γ10,001. Their source binders are at depths zero and one. The
body's recorded type is `bvar 10000`, referring back to the original A. Graph
selection, type inspection and Γ jumps preserve these different relationships.

For the existing extraction profiles the adapter normalizes 203 introductions
and 815 application positions across five project and twenty publisher-attributed
AI-source declarations. It retains shared type storage and original extraction
provenance. This finite inventory is not complete construction coverage of those
declarations or independent verification of original private module bytes or AI
generation.

The project records cover four declarations in **published-15**
(`JacobiCore.E_pos`, `JacobiData.slope_bound_abs`, `SBracket.mk.inj` and
`CrossingData.crossing`) and one declaration in **working-26**
(`JacobiConcrete.AmplitudeChart.midpoint_polynomial`). These are finite recorded
positions, not complete typing coverage of either snapshot. Matching names or
node numbers cannot transfer records to another source: for example, the
published Riccati record does not attach to its working-snapshot counterpart.
The exact source index and source provenance must match.

The independent source audit compares 108 control cuts with the frozen reference
model and checks 3,054 corpus cuts. It walks original source fields and contexts,
checks complete frontier partitioning and original binder targets, and compares
all 2,036 premise text components with the original native fields. It checks the
three distinct Meta/kernel observations and rejects altered/foreign scenes,
entries, addresses and source attachments. Failed control supplements cannot
partially attach earlier construction records.

Browser checks select all 49 control positions and sample both available rule
families in every recorded declaration: 49 corpus examples in 25 declarations.
They compare actual scene data, source selection, type roots, printed premise
types, recording-query and binder jumps. They also exercise source/construction
switching, keyboard focus, phone/desktop layouts, both themes, accessibility,
missing renderers, corrupt supplemental data, retry and late-load cancellation.
These checks do not establish general typing preservation, all Lean/source/tactic
coverage, semantic abstraction or improved comprehension.

```sh
node scripts/test-proof-atlas-occurrence-constructions.cjs
node scripts/test-proof-atlas-deep-context.cjs
node scripts/test-proof-atlas-recorded-context.cjs
# Build and serve the production site; configure the browser origin/executable.
node scripts/test-proof-atlas-occurrence-constructions-browser.cjs
node scripts/test-proof-atlas-deep-context-browser.cjs
node scripts/test-proof-atlas-recorded-context-browser.cjs
```

Native controls remain reproducible with the [core experiment](README.md).
Its immutable `browserIntegrated: false` describes that producer's extraction
stage. The reader attachment and its checks are separate evidence. No private
mathematical source projects or raw compiler/resource logs are added here, and
no blog result is published for the attachment.

[Deep context example](/projects/proof-atlas/library/?view=occurrence&control=checked-context&case=AtlasConstructionControl.deep_dependent_context&diagram=construction) ·
[Riccati declaration](/projects/proof-atlas/library/?view=occurrence&proof=JacobiData.slope_bound_abs&diagram=construction) ·
[Representation](/public/js/proof-atlas-occurrence-constructions.js) ·
[Independent audit](/scripts/test-proof-atlas-occurrence-constructions.cjs)

The optional [application groups](application-fold.md) retain the same primitive
cut and expose its application stages in one call card, with ordered ports and
separate per-stage source and type actions. The actual Lean.Expr reassembly laws
and the finite JavaScript/browser checks establish different guarantees.

Recorded [local definitions](local-definitions.md) add ordered type/value/body
ports in a versioned ternary cut. Their body retains the original local-definition
context; the reader does not load or execute the separately pooled ζ results.
