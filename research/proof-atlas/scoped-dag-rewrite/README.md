# Shared rewrites retain binder context

The row/depth evaluator now rewrites a heavily shared expression without expanding its occurrence tree. An authored value program has 107,044 rows in its joint source/result table and **2,417,851,639,229,258,349,412,357 source occurrences**. Complete outputs match native Lean operations and independent JavaScript reconstruction. Four closed functions pass kernel typing; three recovery/specialization pairs pass kernel conversion with typed equality witnesses.

This is a structural and typing result on one deliberately shared program, not an AI theorem-solving benchmark or a comprehension result. The same evaluator also matches all 100 existing local exchanges across 29 accepted authored/Riccati/AI-source constructions. Original corpus typing evidence remains inherited; those theorems were not rechecked in this run.

[Reference laws](../expr-reference-laws/README.md) · [Protected-subtree proofs](Pruning.lean) · [Evaluator](NodeRewrite.lean) · [Native controls](controls.json.gz) · [Shared-program evidence](stress.json.gz) · [Corpus replay](corpus.json.gz) · [Independent audit](model-check.json.gz).

## Rule for a shared visual region

A stored expression row identifies syntax, not its binder meaning. A local rewrite is qualified by **one immutable source table, one selected root/context, one operation and replacement, the row, and the current binder depth**. The cache belongs to that operation. Entering a lambda/forall body or let body increments depth; domains and let values keep the old depth. Reusing resulting syntax does not merge occurrence paths or their binder targets.

The maximum loose index plus one is `scope e`, defined compositionally over all twelve `Lean.Expr` constructors. If `scope e ≤ d`, the expression contains no reference at or above the rewrite boundary. Three general structural theorems prove that lifting at cutoff `d`, swapping at depth `d`, and substitution at depth `d` leave this subtree literally unchanged. Names, annotations and payloads remain part of the equality. These proofs use `propext` and `Quot.sound`; their fresh kernel checks and transitive axiom lists are recorded separately from executable tests.

A collapsed region can therefore retain the original root when protected. An exposed region must keep occurrence context even when two occurrences share the same row. The executable evaluator validates the packet's complete postorder scope/count recurrences before using this shortcut. The bridge from wire data and the evaluator to the structural definitions is finite; a general evaluator/codec refinement theorem remains open.

## Why output equality alone missed the cache defect

The preceding evaluator placed `return` inside a match bound by `let result ← …`. In Lean 4.33.1 that return leaves the surrounding function, bypassing its later composite-cache insertion. A small control computes the correct lifted application while retaining only its variable entry. The repaired evaluator retains both variable and application entries. A separate two-branch control records the early-return behavior directly.

Consequently, the earlier finite output comparisons remain valid, but their retained-state counts did not bound traversal work. They must not be used as evidence that massive shared rewrites were cached. The frozen preceding evidence is unchanged. The current implementation uses an explicit postorder work stack and explicit monadic branch values; all unfinished dependencies must have completed cache entries before a parent is constructed.

## Same type, wrong binding

An independent deliberately wrong evaluator caches by row alone. The shared small term is equivalent to this notation:

```lean
fun (y x : Nat) => (x + y, fun (z : Nat) => z + x)
```

Inserting an unused input should give

```lean
fun (y x t : Nat) => (x + y, fun (z : Nat) => z + x)
```

The row-only cache instead gives

```lean
fun (y x t : Nat) => (x + y, fun (z : Nat) => t + x)
```

Both computed closed functions pass kernel typing at the same type. Lean rejects their definitional equality and separately checks a proof that they are unequal: applying the second component at `y = x = t = 0`, `z = 1` gives `1` and `0`. The full raw roots are reconstructed independently; this is not a comparison of pretty-printed strings. The example demonstrates that a type badge alone cannot validate a scope wire or transport rule.

The small native graph in `controls.json.gz → observation.regressions.graph` has roots 0–3: raw source, source closed over two inputs, correct result closed over three inputs, and wrong result closed over three inputs. Fresh typing/conversion observations concern the two computed closed roots. In the closed source (root 1), paths `1.1.0.1` and `1.1.1.1` reach the same shared addition row in different binder contexts. These are paths within this authored control artifact, not occurrences in a private research declaration.

## Complete checks

- **476 raw transforms:** 204 lifts, 68 swaps and 204 substitutions spanning all twelve constructors, including domains, let fields, shadowing, annotations, structured names, universe payloads, and unresolved free/metavariable syntax. All complete outputs match the preceding frozen constructor controls; independent reconstruction checks 5,712 scalar reference coefficients. These raw fixtures are not asserted to be typed proofs.
- **Eight refusals:** wrong packet format, false scope metadata, false count metadata, oversized count, invalid root, cyclic child, invalid rewrite address, and excessive rewrite depth.
- **100 exchanges in 29 profiles:** the complete preceding census, both recorded schedules and zero-exchange profiles. Every computed domain/type/value/body and complete local block matches the native operations and recorded graph. Peak retained rewrite states: 24,313; peak pending work: 195. Unsupported/rejected interface candidates are not added to the accepted census.
- **One shared typed program:** 8,192 distinct leaves, a balanced addition tree and 64 shared doublings. The identical amplified term appears both outside and inside a lambda. Each of four rewrites/recoveries retains 24,706 states, visits 74,117 work items and needs at most 239 pending items. The fixed fixture was not reduced to obtain a pass.

The shared program has `H = 8192 × 2^64 = 151115727451828646838272` free references and the same number of local references. Its original size is `16H + 5`; substitution by `Nat.add #0 #1` produces `20H + 5`. Independent bottom-up and weighted top-down reference counts agree. The independent model reconstructs all thirteen complete native roots, including closures and adapters, not just counts or hashes.

The shared-program joint graph in `stress.json.gz → observation.graph` contains:

| Root | Component | Native observation |
|---|---|---|
| 0 | Raw source | Native transform input; one free input |
| 1 | Replacement | Two free inputs |
| 2–4 | Lifted, swapped, substituted expressions | Literal agreement with native operations |
| 5–8 | Closed source, lift, swap, substitution | Four kernel typing checks |
| 9 | Lift recovery adapter | Converts to root 5 |
| 10 | Swap recovery adapter | Converts to root 5 |
| 11 | Source specialized at the replacement | Converts to root 8 |
| 12 | Pair result type | Expected result used in the closed-function checks |

The three conversion pairs also have freshly kernel-checked equality witnesses. These witness values are not additional roots in this graph. A literal swap inverse and lift recovery are checked separately.

## Bounds and scope

One source table has at most 131,072 rows and 512 roots. Rewrite depth is at most 512, retained `(row, depth)` states at most 262,144, pending work at most 4,096 items, visits at most 1,048,577, and count strings at most 4,096 digits. These are explicit component guards, not a theorem about total process memory. Native runs retain the existing 4,096-MiB Lean allocation limit, 8-GiB RSS ceiling, 120-second timeout, 64-MiB output bound and 30-GiB free-space reserve. Raw logs and generated compiler entries stay private.

The native driver imports core Lean 4.33.1. It does not restore Mathlib or import the original research declarations. The existing decoder still supports exact Boolean metadata only. Native externs, the wire codec, the new evaluator and kernel implementation are not collectively verified by the structural theorems. General typing preservation, arbitrary graph-region interfaces, semantic compression and measured usefulness remain open. No browser implementation or blog content changes in this result.

## Reproduction

Use fresh work directories for each command:

```sh
python3 research/proof-atlas/scoped-dag-rewrite/verify-controls.py \
  --lean /path/to/lean-4.33.1/bin/lean --workdir /tmp/new-scoped-controls
python3 research/proof-atlas/scoped-dag-rewrite/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean --workdir /tmp/new-scoped-stress
python3 research/proof-atlas/scoped-dag-rewrite/verify-corpus.py \
  --lean /path/to/lean-4.33.1/bin/lean --workdir /tmp/new-scoped-corpus
node --max-old-space-size=2048 research/proof-atlas/scoped-dag-rewrite/check.cjs \
  --freeze /tmp/new-scoped-controls /tmp/new-scoped-stress /tmp/new-scoped-corpus
# Check the frozen evidence without running Lean:
node --max-old-space-size=2048 research/proof-atlas/scoped-dag-rewrite/check.cjs
node research/proof-atlas/scoped-dag-rewrite/evidence.cjs --check
```

After the production Jekyll build, run `check-compatibility.cjs` and then `check-production.cjs` with Playwright and axe-core available and `ATLAS_ORIGIN` set to that build's local server. The original four reader suites write new reports without changing their frozen predecessors. Program links, exact downloadable evidence, keyboard focus and phone/desktop light/dark text are checked on the actual generated pages.

Native records retain producer, executable, input, output and runtime hashes. The [aggregate](evidence.json.gz) qualifies the current technical package. Authored controls/tooling and compiled observations are public; original private scripts are not included.
