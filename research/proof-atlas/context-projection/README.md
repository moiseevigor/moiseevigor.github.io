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

## Exact free-index support

`Support.lean` adds four kernel-checked laws about the same projection function. Its `support` list contains the free de Bruijn indices of an expression. Application combines both children. Lambda/Pi bodies remove index zero and decrement the remaining indices; their domains do not. Let types and values stay in the original scope; only the body removes its new binder. Repeated indices are harmless for these membership statements. The published fixtures additionally sort and deduplicate them.

- `project_supported`: projection succeeds exactly when the partial map is defined on every index in `support`. This holds for every expression and every partial map, including failure cases.
- `needed_bound`: the structural scope maximum is at most `d` exactly when every support index is below `d`.
- `needed_zero_iff`: a zero scope maximum is equivalent to empty free-index support. This justifies the corresponding empty-support shortcut for a correctly computed scope field, even if a child summary exceeds the bit-width bound.
- `maximum_is_not_support`: equal positive scope maxima do not imply equal support or equal projection eligibility.

The last result uses independent ambient variables `a b c : Nat`. The expression `a` has free indices `{2}`; `Nat.add a c` has `{0, 2}`. Both need a scope of depth three. Retaining only `a` permits the first projection and rejects the second. A maximum-index check cannot replace the exact support set. Under a new lambda, an internal variable remains internal and does not become an ambient dependency.

The general laws are checked at their declared types. Recorded dependencies are `propext` and `Quot.sound`, with `Classical.choice` also used by the scope-bound and empty-support proofs. There are no additional axioms or admitted proofs. Free-variable identifiers, expression metavariables and universe metavariables are separate from free de Bruijn indices: empty support does not establish kernel closure, a well-formed context or typing. Opaque metadata is unchanged and receives no semantic interpretation.

### Comparison with bounded summaries

Fresh core Lean produces 115 source cases (23 patterns at each ambient depth zero through four), all 713 retained-context selections, and five additional controls. These include a closed 513-binder expression whose internal scope exceeds the summary width, shared structure, the equal-maximum counterexample and an unresolved universe. Each serialized node has a native free-index set, scope maximum and unresolved-term flag. All twelve constructors occur. These expression fixtures have no kernel typing claim.

The JavaScript audit compares the existing summary producer at widths 1, 2, 4 and 512. Across 875 source nodes it checks 1,180 available summaries and 2,320 conservative withholdings, plus 3,500 unresolved-term flags. Exact support agrees with all 713 native projection decisions: 421 accept and 292 reject. Withholding a nonzero summary remains allowed; it is not interpreted as an empty set.

One deliberately forged summary retains the correct maximum but omits a required lower index. It passes the coarse root maximum check and fails when that missing variable is expanded. The correct summary rejects the same projection before expansion. This is an explicit counterexample to maximum-only validation, not a production failure with valid authenticated inputs. The browser API requires exact summaries from its authenticated producer and validated source fields. The finite comparisons do not prove that producer or the lazy JavaScript implementation correct for all inputs.

The new compiled generation and driver are separate from the seven-law generation above; its original producer hashes remain unchanged. No source project, private proof script or raw execution log is added to the public package.

## Reproduction

```sh
node scripts/test-proof-atlas-projection-theory.cjs
python3 research/proof-atlas/context-projection/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean \
  --workdir /path/to/new-private-workdir --check
```

The second command uses only core Lean, recompiles the own theory and regenerates the compiled fixtures before comparing the frozen generation. It imports no research project or Mathlib. The existing fixed native resource limits apply; raw logs stay in the workdir. `--publish` deliberately creates a new immutable compiled generation when the producer changes. The source proofs are own implementation research, separate from the original private mathematical proof projects.

Regenerate the additional support laws and compare their separate frozen generation with:

```sh
node scripts/test-proof-atlas-projection-support.cjs
python3 research/proof-atlas/context-projection/verify_support.py \
  --lean /path/to/lean-4.33.1/bin/lean \
  --workdir /path/to/another-new-private-workdir --check
```

This driver also imports only core Lean. It compiles the parent projection definition and the new support theory together, verifies theorem types/proofs, and compares freshly computed per-node support and selection decisions with the hash-addressed compiled fixture package.
