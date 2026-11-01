# Instantiating a scoped module

The module boundary determines which binders are supplied as arguments. Assumptions consume one argument each, in source order. A retained let consumes none: its value is instantiated in the preceding environment. The operation stops at the declared boundary even when the selected result is another function.

The [general laws](../context-modules/Instantiation.lean) use actual `Lean.Expr`, retaining all twelve constructor forms and payloads. `term_recovery` relates sequential module application to simultaneous capture-avoiding substitution. `type_recovery` gives the separate operation on the expected-type telescope; a Pi expression is not applied as a term. `result_scoped` preserves explicit de Bruijn scope under its stated header, image and argument hypotheses. `evaluate_append` composes successive context groups through their intermediate environment.

For an ordered context Γ, selected body e, argument list a and initial substitution σ, let evaluation of Γ return τ. The equation is:

```text
applyTerm(plan Γ, subst σ (rebuild Γ e), a) = some (subst τ e)
```

The expected-type equation replaces `applyTerm` and `rebuild` by `instantiateType` and `closeType`. Scope and arity are separate theorems, rather than unstated assumptions of the syntax equation.

| Interface | Closed term | Arguments | Result |
|---|---|---|---|
| Empty | `λ x : Nat, x` | none | The entire function |
| One assumption | `λ x : Nat, x` | `a` | `a` |
| One assumption, one retained definition | `λ x : Nat, let k : Nat := x; k` | `a` | `a`; the let supplies no extra argument |

The first two rows also have identical closed expected-type syntax. Closed term/type equality therefore cannot recover the interface. The named boundary remains part of the geometric module. The capture control substitutes a target-context `bvar 0` beneath a new lambda: its index becomes one, so it still refers to the external target binder.

## Finite bridge

The [input manifest](inputs.json.gz) pins 29 public compiled-data packages and their source indices. There are **1,376 overlapping recorded uses across sixteen source declarations**: 633 full-context observations, 594 reduced own-control observations and 149 reduced public-packet observations. Both full/reduced views of all 149 frozen routes in `lean_workbook_plus_6206` are included. This is one publisher-attributed AI proof; repeated views and policies do not create independent proofs or a broader AI benchmark.

Each probe uses the recorded module syntax and fresh symbolic assumption arguments. It retains the original use, canonical module route, packet hashes, source slots and exact binder routes. The probes do not substitute new arguments into the original mathematical proof with a new typing claim. Original native typing/conversion records keep their existing owners and coverage.

All recorded uses and seven authored syntax controls pass three comparisons: an independent JavaScript substitution model, a memoized native evaluator, and Lean's `instantiateRev`/`instantiate1` primitives. Term results and expected-type results are checked separately. **1,354 cases also evaluate the recursive specification.** The remaining 28 AI-use representations and the exponential-sharing control exceed its expansion budget and are explicitly marked as not evaluated by that specification. General executable refinement remains unproved.

The production serializer roundtrips **3,329,385 stored rows across 29 batches**; this includes repeated batch-local syntax and probe outputs, not distinct corpus expressions. The largest batch has 151,815 rows. The native comparison covers structured names, binder information, let flags, levels, metadata and ordered fields. Metadata decoding in this finite inventory supports Boolean and string values; other kinds refuse explicitly. Batch inputs are regenerated privately from public compiled packets instead of adding duplicate source tables to the website.

Authored controls cover the boundary collision, argument order, lets, capture avoidance, all twelve constructors and a shared body with **2⁹¹−1 expanded occurrences**. The shared control is expression data, not a large mathematical proof. Eight native alterations are refused. Three false Lean equations—an extra let argument, a lost module boundary and a captured open image—fail elaboration without a resource stop. The 27 general/helper laws and six concrete boundary equations compile with dependencies contained in `{propext, Quot.sound}`; there are no admitted or custom axioms.

[Native results](native.json.gz) · [Compiler, axiom inventory and verification metadata](verification.json.gz) · [Existing source-linked module diagram](../context-modules/module-use.md) · [Production and browser checks](integration.json.gz)

## Reproduce

From the repository root:

```sh
node research/proof-atlas/context-instantiation/check.cjs --rebuild
python3 research/proof-atlas/context-instantiation/verify_theory.py \
  --lean /absolute/path/to/lean-4.33.1/bin/lean \
  --workdir /tmp/atlas-instantiation-theory
```

The full native bridge currently uses the macOS confinement protocol shared with the preceding source-template certificate experiment:

```sh
python3 research/proof-atlas/context-instantiation/verify.py \
  --lean /absolute/path/to/lean-4.33.1/bin/lean \
  --workdir /tmp/atlas-instantiation-native
```

Use a fresh directory. This restores no dependencies or private proof project. The installed-core protocol reserves 20 GiB free space and bounds scratch to 256 MiB, each file to 64 MiB, process-group RSS to 8 GiB and each native command to 120 seconds. Inputs are regenerated in bounded batches; these limits describe the verification process, not total browser memory. Raw compiler/native logs and generated instance inputs remain private. `--publish` saves compiled-data results and verification metadata only.

The result establishes explicit-binder syntax composition with a finite implementation bridge. It does **not** prove validity of free/metavariable contexts, mathematical typing preservation for arbitrary replacements, general serializer/executor refinement, minimal interfaces, semantic compression or improved human comprehension. The visual reader continues to use its existing recorded typing gates and exact source links.
