# Structural context projection

`Projection.lean` defines a partial variable renaming on the actual `Lean.Expr` type. It covers all twelve constructors. Application fields keep their order. Lambda and Pi domains use the current map; their bodies use its lift under one new binder. Let types and values use the current map; only the body uses the lifted map. Names, visibility, let flags, constants, literals, universe levels and opaque metadata are unchanged.

The variable map is `ρ : Nat → Option Nat`. A missing entry rejects the expression. Under a binder, `lift ρ 0 = some 0` and `lift ρ (i+1) = (ρ i).map Nat.succ`. This protects internal variables and shifts references to the ambient context. The mathematical function operates on expressions; it does not model a heap, DAG node identity or a browser cache.

## Checked laws

Seven theorems are kernel-checked in Lean 4.33.1:

- `project_roundtrip`: if `σ` reverses every defined entry of `ρ`, a successful projection by `ρ` is restored exactly by `σ`.
- `project_occurrences`: a successful projection preserves the expanded constructor count.
- `selected_context_roundtrip`: selecting retained ambient indices and restoring their recorded original indices recovers the original expression.
- `project_compose`: projecting by `ρ` and then `σ` equals projection by their composed partial map, including failure cases.
- `project_injective`: with the inverse-map condition, two different expressions cannot have the same successful projected expression.
- `liftN_below`: indices below an internal binder cutoff remain unchanged.
- `liftN_above`: above that cutoff, only the ambient index is remapped, then shifted back under the internal binders.

Equality here is equality of `Lean.Expr`, retaining constructor payloads, not alpha equivalence, definitional equality or proof irrelevance. The recorded axiom dependencies are `propext` and `Quot.sound`; there are no additional axioms or admitted proofs. Fresh checks test each theorem's type, proof value and conversion to its declared type. Core Lean imports remain trusted.

The count theorem concerns a borrowed expression region before context wrappers are added or removed. It does not say that the full and reduced closed context modules have equal sizes. The inverse condition is explicit; arbitrary many-to-one variable maps do not acquire a recovery guarantee.

## Relation to the bounded browser model

The browser accepts an outermost-first ordered subset of context slots. The Lean selector uses the corresponding innermost-first original de Bruijn indices. The bridge converts between those conventions explicitly and compares the existing lazy projection with the Lean result.

For context depth `d` and retained slots `S`, the selector list is `reverse(S).map(s => d-1-s)`. Under `c` internal binders, an ambient variable at index `i` is looked up at `i-c`, then shifted back by `c`. An absent entry rejects the projection.

For example, with independent `a b c : Nat`, remove unused `b` from `fun x : Nat => (a, x, c)`. The bindings remain the same:

| Variable | Original index under `x` | Reduced index under `x` |
|---|---:|---:|
| `a` | 3 | 2 |
| `x` | 0 | 0 |
| `c` | 1 | 1 |

Own generated cases cover all retained subsets at ambient depths zero through four, with 23 expression patterns per subset: 713 primary cases. They include shared nodes used inside and outside a binder, shadowing, dependent domains, pre-binder let values, all visibility flags, both let flags, universe payloads and opaque metadata. All twelve expression constructors occur. Open expression cases remain structural objects and receive no typing claim.

The finite comparison has 421 successful and 292 rejected primary projections. It also checks 1,969 second-stage selections against both sequential and directly composed projections; 1,369 succeed. It checks 266 ambient variable occurrences, 121 internal variable occurrences and 148 changed indices. Four invalid ordered-context maps are rejected. Every compared constructor, payload, ordered child, expanded count and scope maximum matches the native reference. Prepared tuple snapshots remain readable after sealing.

These are finite checks of the JavaScript implementation against a separately proved function. They are not a machine-checked proof that the JavaScript implements that function. The reader's fixed source/depth/state budgets may withhold a case for which the mathematical function succeeds. Source and type residency bounds remain separate from these small fully resident test fixtures.

## Boundaries

These laws do not prove typing preservation, logical necessity of retained assumptions, context well-formedness after deletion, metadata interpretation or semantic compression. In particular, retaining a term variable does not suffice to retain its type dependencies. The native module construction still checks closed types, proof/value typing and instantiation at each recorded use. The theorem says nothing about the correctness of a serialized support summary; authenticated support inputs and independent scope checks remain required.

The browser reuses its existing constructor, binding and context notation. No additional article mapping, node typing or proof interpretation follows from this theory.

## Reproduction

```sh
node scripts/test-proof-atlas-projection-theory.cjs
python3 research/proof-atlas/context-projection/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean \
  --workdir /path/to/new-private-workdir --check
```

The second command uses only core Lean, recompiles the own theory and regenerates the compiled fixtures before comparing the frozen generation. It imports no research project or Mathlib. The existing fixed native resource limits apply; raw logs stay in the workdir. `--publish` deliberately creates a new immutable compiled generation when the producer changes. The source proofs are own implementation research, separate from the original private mathematical proof projects.
