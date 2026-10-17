# Exact size accounting for context projection

For a recorded context header, define its weight as one wrapper occurrence, plus the expanded occurrences of its type, plus those of its let value when present. Closing a term with ordered headers adds exactly their total weight. The same identity holds for the expected-type closure: assumptions produce Pi wrappers and lets produce let wrappers.

For successful body and retained-header projections:

```text
full recorded closure = required-context closure + sum(omitted header weights)
```

The selected term or recorded type keeps its expanded constructor count. A strict decrease occurs exactly when at least one header is omitted. This explains a size difference between context closures. It is not whole-theorem compression, a reduction of displayed vertices, logical minimality or a typing-preservation theorem.

## Definitions and proofs

`Accounting.lean` extends the explicit projection function in `context-projection/Projection.lean`. Its `Header` stores a Lean name, binder visibility, type and optional let value. `close` constructs actual `Lean.Expr.lam`, `forallE` and `letE` expressions. `projectHeader` projects both header fields in their pre-binder environment. The `Selection` relation records retained projected headers and omitted original headers in source order. Each retained header may use its own renaming; neither the relation nor the counting theorem asserts well-formedness or typing of that context.

Nine laws are kernel-checked: positive header weight, exact wrapper size, exact closure size, projected-header weight preservation, the retained/omitted partition, exact closure difference, nonincrease, positive omitted sum exactly for a nonempty omitted list, and strict decrease exactly for a nonempty omitted list. They depend only on the recorded standard axioms `propext` and `Quot.sound`; the evidence lists the dependencies of each theorem separately. No admitted proof is accepted.

The theory counts expanded constructor occurrences, including annotations and repeated occurrences of shared DAG nodes. Stored nodes, context entries, construction records and drawn vertices are different measures. Metadata and universe payloads remain opaque and unchanged by the underlying projection; unresolved variables are not resolved by this theorem.

## Finite implementation comparison

The public fixture package contains 713 synthetic rows using all twelve kernel constructor families, internal binders, shadowing, let fields, metadata and universe payloads. In 421 rows projection succeeds; 292 rows are withheld because their partial variable map does not cover the selected body. These open synthetic expressions carry no kernel-typing claim. Separate controls reject omitted support in a dependent header type and a let value. The browser arithmetic agrees with every successful native closure count, including exact arithmetic above JavaScript's safe-integer range.

The source-backed accounting model is also compared with 743 existing native observations: 594 own controls and all 149 replay routes in one frozen AI-attributed proof. Its reduced term/type sizes agree with recorded native closed-root counts. It checks 814 header source maps and identifies 143 strictly smaller recorded closures, including 93 in the AI proof. These are overlapping selected contexts, not distinct proof steps or smaller theorems.

For the selected type-valued region at `1:1.1.1.1.1.1.1.2.0`, the source body has 93 occurrences. Full recorded context adds 9,439,663, giving 9,439,756. The retained header adds two, giving 95. The omitted headers account for exactly 9,439,661 occurrences. The term itself was not simplified.

The reader's **Closure size accounting** disclosure displays this use-specific identity, pages omitted headers eight at a time, and opens each original binder, type or let value. Canonical module geometry remains shared; the ledger belongs to the selected original use. Native judgments still cover complete closed roots only. Unsupported counts or mismatched native sizes are rejected.

## Reproduction

```sh
python3 research/proof-atlas/context-accounting/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean \
  --workdir /path/to/fresh-private-workdir --check
node scripts/test-proof-atlas-context-accounting.cjs
node scripts/test-proof-atlas-context-accounting-browser.cjs
```

The native driver uses core Lean only, checks theorems and regenerates the frozen fixture package. No Mathlib or mathematical proof project is built or imported. It records producer hashes and fixed resource bounds; raw logs remain private. `--publish` creates an immutable compiled generation. Finite browser comparisons do not prove the JavaScript implementation or general typing preservation. No measured comprehension claim follows.
