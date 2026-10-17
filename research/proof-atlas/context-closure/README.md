# Least syntactic context closure

The dependency interface for a proof fragment starts with the free context slots of its term and recorded type. Keeping a slot also requires the slots mentioned in its binder type and, for a let, its value. These dependencies must be closed transitively before building a reduced module. This is syntactic retention, not logical necessity or a new typing judgment.

## Definition and checked laws

`Closure.lean` defines an ordered dependency graph as `deps : Nat → List Nat`. Slot zero is the outermost binder. `Earlier deps` requires every `k ∈ deps j` to satisfy `k < j`, expressing the pre-binder scope of domains and let values. A bounded seed list contains only slots below context depth `d`.

The function visits slots `d−1, …, 0`. If the current slot is retained, its dependencies are added before visiting earlier slots. The working list may have duplicates. The laws concern membership; they do not claim literal list equality or prescribe a serialized node order. The browser separately returns retained slots in their original ascending context order.

Six theorems are kernel-checked in Lean 4.33.1:

| Law | Guarantee |
| --- | --- |
| `close_preserves` | Every seed remains retained. |
| `close_bounded` | Under the earlier-header and seed-bound conditions, no slot escapes the context. |
| `close_closed` | Under those conditions, every dependency of every retained slot is retained. |
| `close_minimal` | Any dependency-closed set containing the seeds contains the result. |
| `close_idempotent` | Closing an already computed closure changes no membership. |
| `close_union` | Closing the union of two bounded seed sets equals the union of their closures, for the same ordered dependency graph. |

The last two equalities are membership equivalences. Together, closure and leastness characterize the result as the least syntactically closed superset of the seeds. Recorded axiom dependencies are `propext` and `Quot.sound`, with no additional axioms or admitted proofs. The driver checks each theorem's type, proof value and conversion to its declared type using the kernel.

## Compositional interpretation

Two components in the same original context can retain their separately computed interfaces: the interface for their combined seed set is their union. For example, a term `h` may directly mention only `h`, while its recorded type mentions `p`, and the header `h : p` also depends on `p`. The interface retains both slots. This does not claim that `p` is logically necessary to prove some equivalent proposition.

The theorem does not merge different source contexts, equate different binders or infer a type for an unrecorded fragment. Original occurrence routes, source hashes, header order, universe context and native typing evidence remain separate parts of the module contract. A kernel typing-preservation theorem for arbitrary reduced contexts remains open. The existing three native reduced AI contexts and own checked modules keep their finite typing and instantiation checks.

## Implementation comparison

Core Lean generates all 76 dependency graphs respecting context order at depths zero through four, with all 1,099 seed selections. Domain and let-value fields remain separate in the compiled fixtures. Six further controls cover a 512-slot chain, an empty large context, disconnected dependencies, duplicate and reordered seeds, a let-value chain and a dense 32-slot graph. These are abstract own dependency fixtures, not serialized `Lean.Expr` graphs or new native typing observations.

The public comparison checks the existing `ProofAtlasDependentInterface.complete` against the native closures and an independent work-list reachability calculation. All 1,099 primary decisions and eight further selections agree. It checks 16,933 term/type seed pairs against the union rule and enumerates 3,024 closed supersets to check leastness on the small graphs. Reapplying the browser closure preserves every compared result. Five malformed support/provenance controls are rejected. The separate source-interface audit covers 743 existing recorded observations; this new comparison does not broaden that native inventory.

A counterexample checks why traversal order matters. With dependencies `2 → 1 → 0` and seed `{2}`, a single ascending pass retains `{1, 2}` and misses zero. The descending pass retains `{0, 1, 2}`. The current browser already uses descending order; this is a rejected alternative rule, not a reported production failure.

The general proofs concern the specified list function and its explicit graph conditions. The finite comparisons do not prove the JavaScript implementation, the support-summary producer, context well-formedness after deletion, semantic compression or human comprehension. Authenticated exact source summaries and validated recorded types remain preconditions. Constants, universe references, unresolved elaborator objects and opaque metadata are outside this slot-graph theorem.

## Reproduction

```sh
node scripts/test-proof-atlas-context-closure.cjs
python3 research/proof-atlas/context-closure/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean \
  --workdir /path/to/new-private-workdir --check
```

The second command imports only core Lean, checks the general laws and regenerates every fixture before comparing the frozen hash-addressed package. It does not import Mathlib or an original mathematical proof project. Raw logs remain in the workdir. `--publish` deliberately creates a new immutable compiled generation when the producer changes. Existing projection/support generations are unchanged.
