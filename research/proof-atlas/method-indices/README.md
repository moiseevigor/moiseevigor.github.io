# Recursive index ports

Status: local research iteration. No blog post or public deployment.

## Representation problem and rule

The preceding origin view exposed a recursive call and its major premise, but
its index arguments required opening the raw application spine. This leaves an
important distinction implicit for indexed inductive families: the recursive
major and the indices selecting its family member are separate arguments.

**Inspect recursive indices** opens an ordered port view for a recorded
recursive-premise input with indices. A dash-dot bridge identifies the computed
input position. For a functional recursive field, a separate schema-lambda
node contains the recursive call. Solid arrows connect that call to its index
arguments and major premise, with their original one-based argument slots.
Parameters, motives and minor methods remain available in the raw schema.

The view shows at most four index ports, with exact visible/hidden counts and
previous/next windows. Every schema port retains its native-record hash, exact
query/minor, reduction-schema root and occurrence route. Selecting a port opens
the existing 32-vertex kernel-expression cut with reversible folding, exact
retained/hidden occurrence accounting and visible lexical links. Hidden
subexpressions remain boundaries; the view does not claim to enumerate every
binder use in a folded expression. Schema navigation leaves the original proof
occurrence unchanged. Computed input positions are not expression equalities.

The index collar has at most eight vertices and seven wires. It displays one
method input, its schema family/call/major and one window of indices; its counts
are index-port counts, not source-proof occurrences. Native/type graphs remain
resident under the existing 8 MiB selected-call limit. This adds no whole-browser
heap bound.

## Native controls

Three authored Lean 4.33.1 definitions add six kernel-checked method frames:

- An indexed chain has one recursive index, referring to its constructor's
  numeric field rather than the recursive major field.
- An indexed grid has five recursive indices in a fixed order. The fifth index
  lies outside the first four-port window and refers to the fifth numeric
  constructor field.
- An indexed family has `children : (k : Fin n) → Stair k.val`. Its recursive
  index is inside the schema's recursive-family lambda. The literal compiled
  expression refers both to the local `k` and to the outer constructor field
  `n` through the implicit argument of `Fin.val`. These references have different
  exact binder routes; a shared node identifier would not resolve their scope.

The definitions are marked `noncomputable` because this compiler does not emit
these recursors directly. Their declarations and computed eta-method interfaces
passed fresh kernel checks. No executable-code benchmark is claimed.

The dependency cache has verified binary hashes and attribution to Mathlib
revision `0df444a360eaa60ab8c11dca51a86af692955474`; its original Git checkouts and
an independent dependency rebuild are not verified. The environment imports
Mathlib/Aesop and excludes private Riccati modules. Public assets contain compiled
packets and native observations, not original private project proof scripts.
The three controls remain separate from the main corpus inventory.

## Checks and limits

The [evidence bundle](method-indices-evidence.json) retains fresh native output
hashes, independent call-spine/lexical checks, exact native-page reassembly,
current compatibility reports and browser checks. Earlier evidence, including
`97ff928e2` for kernel origins, remains immutable.

The model audit covers 46 frames and 66 inputs. Three methods expose seven
recursive indices; the other 63 inputs refuse index mode explicitly. Fourteen
index windows produce 56 bounded kernel cuts. Eight literal variable references
resolve to their original schema binders, including the family-local reference.
All six new frames agree with complete-record models through paged source/native
query delivery, without requesting their complete archives on that path.

```sh
ATLAS_INDICES_CHECK=1 node scripts/test-proof-atlas-method-indices.cjs
node scripts/test-proof-atlas-method-indices-browser.cjs
node scripts/build-proof-atlas-method-indices-evidence.cjs --check
```

Regenerate the authored native controls with `verify.py` and the pinned compiler
and verified cache; package with `publish.cjs`. Compiler/resource logs remain in
the private work directory. The browser does not run Lean.

These three indexed controls have no inductive parameters. Indexed calls with
nonzero parameter counts have not received fresh native coverage in this
iteration; that remains an explicit extension of the test set.

This rule exposes literal arguments of the existing direct-field/unchanged
self-recursion pattern. It does not normalize indices, compare parent/output
indices, infer mathematical dependencies, cover arbitrary recursor schemes,
reconstruct tactic history or measure human comprehension. The eight recorded
Riccati methods remain nonrecursive constructor-field inputs and acquire no
invented index ports. AI-source attribution and unavailable-candidate coverage
remain those of the earlier dataset.
