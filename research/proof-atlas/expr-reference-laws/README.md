# Scope-aware reference laws for Lean expressions

Sixteen general structural laws now cover the actual `Lean.Expr` datatype in Lean 4.33.1. They establish reference-count and size accounting for lifting and capture-avoiding substitution, and an exact involution for swapping adjacent binders. This replaces the named-atom assumption of the preceding counting algebra with explicit de Bruijn binding on all twelve constructors.

[Notation in the manual](/projects/proof-atlas/manual/binder-blocks/#expr-reference-laws) · [Reference definitions and proofs](Reference.lean) · [Native observations](native-check.json.gz) · [Independent reconstruction](model-check.json.gz).

## Definitions and general guarantees

`uses e k` counts occurrences of loose bound variable `k`. Entering a lambda or forall **body** increments the target index; its domain keeps the original scope. Entering a let body increments the target, while its type and value stay outside the new binder. A shared variable row can therefore resolve differently in different occurrences. Names do not resolve binding.

`lift e amount cutoff` preserves indices below the cutoff and raises the others. The three reference laws cover protected indices, transported outer indices and the newly empty index interval. Size is unchanged.

`substitute e value depth` removes the selected binding, lifts the replacement beneath the intervening binders and decrements the remaining outer indices. For `k ≥ d`, the proved coefficient rule is

```text
uses (substitute e v d) k = uses e (k+1) + uses e d * uses v (k-d).
```

Indices below `d` are unchanged. The size law is stated additively, avoiding truncated natural subtraction:

```text
size (substitute e v d) + uses e d = size e + uses e d * size v.
```

`swap e d` exchanges indices `d` and `d+1` without changing the others. Its scalar index map is an involution, injective and compatible with entering a binder. The Expr operation is an exact involution, preserves size and transports reference multiplicities. The equality is equality of `Lean.Expr`, including constructor payloads and annotations, rather than alpha equivalence or kernel conversion.

The final size theorem applies to the complete local let/input block: the original and computed block sizes differ exactly by substitution into the moved input domain. The computed let annotation is cleared to false, following the existing checked construction rule.

The proofs use structural induction, simplification and arithmetic. Each proof value is freshly kernel-checked at its declared type. Transitive axiom lists are retained **per theorem**; their union is `propext`, `Classical.choice`, and `Quot.sound`. No `sorryAx` or native-decision axiom is admitted.

These laws are about syntax. They neither assert that every Expr is well typed nor infer a proof's necessary mathematical premises. `fvar` and `mvar` payloads are preserved, not solved or counted as de Bruijn references. Universe levels and metadata payloads are retained without being treated as Expr children. The structural definitions support arbitrary payloads; the existing wire decoder's finite metadata bridge still supports exact Boolean metadata only.

## Implementation bridge

Lean's native `liftLooseBVars` and `instantiate1` are opaque external operations. A theorem about our structural definitions is therefore **not** a general proof about those native functions. The current shared-DAG implementation is also a separate, bounded executable port.

The native audit compares all 100 previously frozen exchange steps across 29 accepted constructions: eight composed controls, ten definition-boundary controls, seven Riccati plans and four AI-source plans. Both recorded exchange schedules are included. Zero-exchange constructions remain in the census; rejected boundary candidates do not acquire an exchange judgment.

Every moved input domain is evaluated directly by the proved structural substitution function, compared literally with native `instantiate1`, and matched to its recorded computed domain. The largest original and computed domains both have 199 expression occurrences. The 65,536-occurrence direct-evaluation guard excludes none of these steps.

The whole block is independently reconstructed. Shared-DAG lifting of the definition's type and value and swapping of its body match both the native operations and the recorded block, retaining all names, annotations and payloads. Large body regions use this memoized port, not expanded recursive evaluation. The native memoized evaluator's refinement to the structural functions is still a finite bridge, not a general theorem. The largest local rewrite used 962 memo states. Large source tables are decoded in full, but this does not establish bounded rewriting of an entire large proof body. Extreme-sharing rewrite stress remains unverified and is excluded from this evidence package.

All source graphs are decoded and re-encoded exactly. Native case/inventory hashes, stage roots, routes and row indices qualify the computed occurrences. Original proof declarations and private modules are absent. This run treats compiled proofs as raw Expr data; it does **not** repeat their earlier theorem-typing judgments or rebuild Mathlib.

## Constructor and scope controls

Seventeen separately labelled raw syntax controls exercise all twelve constructors. They include lambda/forall domains, let types/values/bodies, both let flags, shadowing, nondefault binder information, structured numeric names, literals, metadata, projections, unresolved free/metavariable IDs and universe payloads.

There are 204 lifting, 68 swapping and 204 substitution cases. Native operations, direct structural functions and the shared-DAG implementation agree on their applicable complete outputs. Substitution at a protected depth is compared with native instantiation beneath an explicit lambda wrapper. The independent JavaScript model reconstructs all 476 output graphs and their reference counts. Raw equality rejects changed binder names and annotations that alpha equality can overlook; an excessive-depth request is rejected separately.

These are raw-syntax tests, not 17 new kernel-checked proofs or an AI theorem-solving benchmark. The existing Riccati/AI attribution and original typing provenance remain attached to their preceding inventories.

## Delivery and limits

The native driver uses only core Lean 4.33.1 and the existing exact packet codec. Each process retains a 4,096-MiB compiler allocation limit, the existing 8-GiB RSS ceiling, 120-second timeout, 64-MiB output-file limit and 30-GiB free-space reserve. One native output is compressed before the next profile. Raw logs and generated compiler entries remain private.

The memoized transformation keeps at most 262,144 `(Expr, depth)` states and refuses depths above 512. Source tables keep the 131,072-row bound. These are guarded component limits, not a total-process memory theorem. The general proofs do not depend on those implementation bounds, sharing or packet order.

The old native inventories, the preceding named-tree laws and reader reports remain frozen. The current evidence distinguishes general structural laws, finite native/model correspondence and the prior original-proof typing. The blog and article are unchanged. General memoization/codec refinement, typing preservation, arbitrary graph-region interfaces and measured comprehension remain open; the program goal remains active.

## Reproduction

```sh
node research/proof-atlas/expr-reference-laws/prepare.cjs /tmp/new-expr-reference
python3 research/proof-atlas/expr-reference-laws/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean --workdir /tmp/new-expr-reference
node --max-old-space-size=2048 research/proof-atlas/expr-reference-laws/check.cjs --freeze /tmp/new-expr-reference
# Frozen evidence checks:
node --max-old-space-size=2048 research/proof-atlas/expr-reference-laws/check.cjs
node research/proof-atlas/expr-reference-laws/evidence.cjs --check
```

[Native package](native-check.json.gz), [model audit](model-check.json.gz), [current production checks](production-check.json.gz) and [aggregate fingerprints](evidence.json.gz) are separate evidence layers. Authored proof/tooling source and compiled observations are public; original private research proofs and logs are not published.
