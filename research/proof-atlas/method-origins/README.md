# Kernel origins of method inputs

Status: local research iteration. No blog post or deployment.

## Why the schema is needed

Two fresh controls supply the same function

\[
\mathit{step}:\mathbb N\to\mathbb N\to\mathbb N
\]

to `Nat.rec` and `Prod.rec`, under the same four-parameter context. The actual
method expressions, method types, complete computed eta graphs and context
types agree exactly, including their serialized binder names. In the natural
successor case, the second input is a recursive premise for the predecessor
field. In the product case, it is the second constructor field.

The [counterexample](method-origins-evidence.json) checks equality of the whole
method graph bytes, not just the printed types. Therefore the projected local
method/interface data do not determine input origin. A classifier using only
that common data cannot classify both cases correctly. The recursor reduction
schema supplies additional information. This is an adequacy constraint for
the visual language, not a novelty claim about type theory.

## Visual rule

The existing computed method diagram keeps its function, ordered arguments,
recorded body typing and direct type references. **Inspect kernel input
origin** adds a separate channel:

- A dash-dot bridge maps a computed input to its argument position in the
  recorded constructor reduction rule. It is a positional correspondence,
  not expression equality across contexts.
- A double-border schema node identifies the exact rule expression. A direct
  constructor-field argument points to its binder in that schema.
- A recursive-premise argument exposes the recorded recursive call, its major
  premise and the referenced constructor-field binder. A functional recursive
  family retains its enclosing schema lambda separately from the inner call.
- When the same field is directly forwarded to another method input, a second
  positional bridge identifies that computed input. If it is outside the
  visible window, an explicit computed boundary opens its window. Missing or
  nonunique field counterparts are unavailable, rather than guessed.

Source expressions, computed inputs and kernel-schema binders/calls retain
three different namespaces. A schema recursion edge is not added to the
original proof as another source call. Names, equal types and shared graph
node IDs do not determine these relations.

Clicking a schema node opens its bounded kernel Expr view. It uses the existing
field/scope/cut renderer, including metadata-context boundaries, reversible
folding and exact retained/hidden occurrence accounting. Its local root/slot
route and original native-record owner remain visible. Navigating this view
performs no new typing query and leaves the selected source proof occurrence
unchanged.

## Controls and native evidence

Fresh Lean 4.33.1 checks cover three authored definitions and four method
frames: natural recursion, product elimination and a functional recursive
field. Each definition's body/type and eta method observations are checked in
the kernel. The functional-field control has four constructor fields and a
fifth, recursive-family input. Its recursive call lies beneath one schema
lambda; its originating field lies outside the four-input method window.
This exercises a real cross-window boundary rather than a synthetic scene.

The functional control is marked `noncomputable`: this Lean code generator
does not emit the higher-order recursor directly. Its kernel term remains
available and checked. No executable-code or execution benchmark is claimed.

The environment imports Mathlib and Aesop, with private Riccati modules absent.
The dependency cache has verified binary hashes and attribution to Mathlib
revision `0df444a360eaa60ab8c11dca51a86af692955474`; original Git checkouts and an
independent dependency rebuild are not verified. The generated source,
extractor and environment hashes are retained in the native record. Public
assets contain compiled packets and native observations, not original private
proof scripts. The new controls have their own manual inventory; they are not
silently added to the main proof corpus.

## Finite coverage

The combined model audit covers **40 frames and 53 inputs**, including all eight
recorded Riccati frames, the earlier authored/AI-attributed samples and the
three new controls. Riccati's recorded methods have constructor-field origins;
the view does not invent recursive premises for that proof.

An independent symbolic interpretation checks direct fields and unchanged
self-recursion, including the functional family. An independent lexical walk
resolves the field binder through the rule's lambda scopes. The model checks
106 origin views, 224 bounded kernel cuts, six cross-window computed boundaries
and explicit refusal of origin mode for four zero-input methods. Source paging
reproduces 32 complete-model frames across 20 calls without requesting complete
source or native archives on that path.

The origin diagram has at most 12 vertices and 11 wires. Its optional kernel
cut has a separate 32-vertex budget and exact metadata occurrence accounting.
These bounds concern two views of an already resident native call. The existing
8 MiB call limit, source-path/page/memo bounds and complete native/type graph
retention still apply; no whole-browser heap bound is added. Interface-port
counts, schema occurrences and source-proof occurrences remain separate.

## Reproduction and limits

[Verification bundle](method-origins-evidence.json). Earlier checkpoints remain
immutable, including `238b5e52e` for the type-reference view. Current functional
compatibility is recorded separately from source fingerprints.

```sh
ATLAS_ORIGINS_CHECK=1 node scripts/test-proof-atlas-method-origins.cjs
node scripts/test-proof-atlas-method-origins-browser.cjs
node scripts/build-proof-atlas-method-origins-evidence.cjs --check
```

Regenerate native data with `verify.py` using the pinned compiler and verified
cache, then package it with `publish.cjs`. Raw compiler/resource logs stay in
the private work directory. The browser does not run Lean.

The origin classifier recognizes direct constructor fields and the recorded
unchanged self-recursion pattern. Other recursor schemes remain unclassified.
A family containment edge follows literal kernel-rule lambda paths. These are
neither proof-body usage counts nor premise-necessity judgments. There is no
claim of general elimination, semantic compression or improved human
comprehension. AI attribution and unavailable-candidate coverage remain those
of the earlier frozen dataset.
