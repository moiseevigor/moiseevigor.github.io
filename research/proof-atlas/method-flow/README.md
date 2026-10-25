# Typed dependency wires for recursor methods

Status: local geometric-language iteration. No research post or deployment.

## Representation problem

A branch method is already shown as a checked computed eta interface, even
when its source is a function reference without matching source lambdas.
The interface previously listed input types without drawing their lexical
connections. Its coarse `proof`/`value`/`type` labels also did not distinguish a
constructor field from a recursive premise. These are different relationships.

The view retains the recorded native typing judgment from the computed
application to its body type as a short dotted wire. It adds three explicit
relations:

1. **Computed application ports:** the eta application uses its input in
   the checked argument position. A solid arrow points to that computed input
   or the original function. It describes eta syntax, not source-body usage.
2. **Type reference:** an input domain or the computed body's type refers to
   a binder. A dashed arrow points to the exact original context binder or an
   earlier computed input. Result types may refer to any of the method inputs;
   input domains may refer only to earlier ones.
3. **Kernel input role:** the recorded reduction schema identifies a directly
   forwarded constructor field or a recursive premise for that field. The
   schema's expression and call paths belong to `kernel-rule`, not to the
   original proof. Other patterns remain unclassified.

These are compositional lexical/type relations, not a recovered tactic script,
proof strategy, data-flow execution or mathematical implication.

## Concrete check

For `JacobiData.slope_bound_abs` (Lemma 3.2), all eight recorded method frames
across seven calls retain their original source/computed owners. Their type
references point to the original Riccati context rather than invented copies
of its binders.

The dependent-recursion control has step inputs `n : Nat` and `a : P n`,
with result type `P (n + 1)`. The first input is a constructor field; the second
is a recursive premise for that field. The second domain refers to the earlier
computed input `n` and original context binder `P`. The result type also refers
to `n` and `P`. Its lack of a reference to `a` does **not** establish that the
proof can omit `a`. Type support and proof-premise necessity are distinct.

The same view covers the existing non-lambda and function-valued method
controls and the previously kernel-checked large computational control. No
new Lean extraction, theorem or AI proof is claimed in this iteration.

## Provenance and exactness

Flow data can only be created from the validated method provider. It is frozen
and registered privately; a JSON clone cannot authorize a new view. Source
ports retain their compiled packet and exact root/slot route. Computed input
ports retain the original native record, query, minor, eta root and binder
path. Body types retain their computed graph root and context length. Kernel
role addresses identify the metadata graph's rule root and local path.
Delivery pages do not become new native evidence owners.

A bound-variable reference is resolved with its local binder depth and ambient
context length. Targets are deduplicated by binder, so arrows count distinct
referenced binders, not occurrences. Every type wire retains its `domain` or
`body-type` origin port, computed graph root and context length; binder and
argument ports are separate. Type previews use the recorded native rendering;
implicit syntax may be elided there, while wire targets follow the stored Expr. These are direct lexical references in the selected Expr. They do not follow
the referenced binders’ types or values transitively and do not compute a
reduced typing context. Input domains exclude later inputs. A
selected input and the corresponding existing interface control stay
synchronized. Original-context nodes open their exact source occurrences;
computed-reference nodes select the corresponding computed input.

The kernel role classification recognizes the existing direct-field and
unchanged self-recursion patterns. It does not classify arbitrary recursor
schemes by declaration-name guessing. A recursion edge in kernel metadata is
not added as a call in the source proof.

## Finite evaluation and bounds

The model audit covers **36 method frames and 44 inputs** in ten profiles:
the original Riccati case, five authored controls, three separately attributed
AI-source proofs and one authored large computational control. An independent
symbolic reader of the kernel reduction RHS checks input roles. A separate
lexical traversal checks all input-domain and body-type binder targets.
There are 54 domain-reference and 77 body-type-reference endpoints, including
three recursive premises. The audit checks 440 bounded diagram cuts and
305 rejection/disposal controls. These are finite observations.

Original/computed provenance and complete-model parity are also checked
through source paging for 28 frames across 17 calls. Complete source and native
archives are forbidden on that path. The five small authored examples retain
their complete bounded source reader.

A diagram shows at most four computed inputs and eight type-reference targets
at once: at most 15 vertices and 14 wires. Visible plus hidden input/reference
counts are exact for the selected interface/type. They are **not source DAG
occurrence counts**. Hidden references are recoverable by pagination. The
native call and its type/computed graphs still load fully under their existing
limits; no whole-browser memory bound is added.

The [manual](/projects/proof-atlas/manual/#method-type-wires) and
[paged Riccati reader](/projects/proof-atlas/library/?loading=paged&proof=JacobiData.slope_bound_abs&route=1:1.1.1.1.1.1.2.2.2.2.2.1)
provide the view through **Show method dependency wires** inside a loaded
method interface. The complete elimination reader uses the same renderer.
Diagram positions and distances carry no mathematical meaning.

## Evidence and limitations

[Verification bundle](method-flow-evidence.json). Earlier reports and bundles
remain frozen at their original revisions in `checkpoints.json`; current
compatibility checks are separate. The prior streamed method checkpoint is
`cf37bb6f6`. Its published compiled data and native observations are unchanged.

```sh
ATLAS_FLOW_CHECK=1 node scripts/test-proof-atlas-method-flow.cjs
node scripts/test-proof-atlas-method-flow-browser.cjs
node scripts/build-proof-atlas-method-flow-evidence.cjs --check
```

Browser checks cover source/computed selections, control synchronization,
release, optional-renderer failure/retry, late loading after a source change,
keyboard access, zoom and desktop/mobile themes. Drawn paths are sampled for
card intersections, and card text is checked for vertical clipping. These are
finite rendered-layout checks, not a proof for arbitrary diagram layouts. The browser does not run
Lean. All native checks remain producer attestations in their version-pinned
records, with the original dependency-cache qualifications. The AI sample's
attribution and unavailable-candidate inventory are unchanged. General
elimination, source-body premise usage, semantic compression and improved
human comprehension remain unproved.
