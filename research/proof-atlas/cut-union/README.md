# Union of source cuts

Two inspections of the same source occurrence can retain different parts of its
expression. Their union preserves both inspected parts without counting an
overlap twice. This is a structural rule for composing inspections.

`Union.lean` defines union and intersection on the existing `Cut e`, indexed by
one fixed actual `Lean.Expr`. Fifteen kernel-checked laws establish:

- Union has the empty cut as identity and is idempotent, commutative and associative.
- A path is visible in the union exactly when visible in either input; intersection uses both inputs.
- Union is the least common refinement under the existing `Refines` relation.
- Retained and hidden constructor counts obey inclusion–exclusion, as do visible
  and hidden free de Bruijn reference counts. Binder bodies adjust the reference
  index; domains and let values do not.
- Union commutes with plugging two cuts into the same retained surrounding
  context. Filling its distinguished hole retains that context unchanged.

The source index fixes constructor payloads and ordered fields. It does not
authenticate an external packet, distinguish equal expressions in different
original contexts, or establish mathematical premise necessity.

## Finite implementation checks

`public/js/proof-atlas-source-cut-union.js` implements ordinary source-cut
records with one explicit owner, source root and occurrence path. It projects
the existing recoverable type notation to those records, combines records and
embeds a descendant inspection in its source context. Shared storage rows do
not merge occurrence paths. Records retain hidden-subtree boundaries and exact
decimal occurrence counts.

The caller must supply an already validated immutable source graph and the full
source owner. The module checks equality of those supplied owners; it does not
authenticate their hashes or infer missing provenance. It rejects conflicting
owners, malformed preorder records, missing path prefixes and nonexistent
retained children. Limits are 8,192 record entries, 512 path slots and 4 MiB per
record. Those are record bounds, not total process-memory bounds.

`model.json.gz` records independent source traversals for 11,324 notation cuts
from both type roots of all 150 existing native type packets, 1,009 cut pairs,
732 descendant embeddings and fourteen rejection controls. Small authored
trees exercise all twelve constructors. A separate 61-row shared structural
DAG represents 2,305,843,009,213,693,951 occurrences; joining its two selected
branches needs seven record entries. It is neither a native proof nor an AI
benchmark. The largest record observed in these checks has 219 entries and
17,906 bytes.

`native.json.gz` records the fifteen theorem checks, including proof assignment
to each declared type and the collected axiom sets. `verification.json.gz`
records the Lean executable and source hashes. Only core Lean is imported;
original private proof scripts and Mathlib artifacts are not needed. The
existing compiled type packets are reused unchanged.

These are general laws for the Lean reference model and finite checks of a
separate JavaScript implementation. They do not constitute a general
JavaScript-to-Lean refinement proof, a typing-preservation theorem, a semantic
compression result or a human-comprehension measurement. The new module is not
yet connected to reader controls; this change does not alter the public UI.

## Reproduction

From the repository root, with Lean 4.33.1:

```sh
python3 research/proof-atlas/cut-union/verify.py \
  --lean /absolute/path/to/lean \
  --workdir /private/tmp/atlas-cut-union-fresh --check
node research/proof-atlas/cut-union/check.cjs --check
node research/proof-atlas/type-notation/check.cjs --check
```

The work directory must not already exist. Omit `--check` only when deliberately
regenerating the new evidence. No site build or deployment is part of these
structural checks.
