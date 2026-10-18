# Source-cut refinement

A source cut should distinguish **reselecting a view** from **refining one of its
hidden regions**. The latter preserves every retained constructor at its original
occurrence path. Correct totals alone do not establish that property.

## Structural laws

`Cut e` is indexed by an actual `Lean.Expr`. It either hides the complete original
expression or retains its constructor and gives a cut for each ordered child.
All twelve constructors are represented, including metadata, universe/name
payloads, literals and unresolved variables. This is a syntactic model; it does
not assert that an arbitrary `e` is a well-typed proof.

`Refines coarse fine` permits replacement of a hidden region while preserving
already retained constructors and their original expression fields. The pinned
Lean kernel checks six laws:

1. Retained plus hidden constructor occurrences equal the original expression's
   expanded occurrence count.
2. Every cut refines itself.
3. Refinement cannot decrease the retained occurrence count.
4. Refinement cannot increase the hidden occurrence count.
5. Every visible source path remains visible under refinement.
6. The exact increase in retained occurrences equals the decrease in hidden
   occurrences.

The path law is stronger than the count law. It distinguishes different
occurrences of a shared expression and preserves the ordered kernel child slots.
The model does not reindex variables or rewrite the original expression. It does
not prove a browser decoder, lexical-link implementation, typing preservation,
semantic importance or a comprehension benefit. The proofs use `propext` and
`Quot.sound`; reflexivity has no axioms.

## Renderer comparison

The current browser depth control **reselects** a cut at a fixed vertex budget.
Across 34 frozen initial-root inventories, 315 of 5,508 tested depth transitions
fail the pointwise refinement criterion. All such failures use the proof-focus
policy. Increasing the vertex budget preserves refinement in all 1,836 tested
budget transitions; this finite comparison is not a universal monotonicity proof.

An independent reconstruction of retained source paths confirms two small
counterexamples. In `JacobiCore.E_pos`, increasing depth two to three at budget
eight hides a previously displayed proof application and its source application
spine: retained source occurrences change from fifteen to fourteen. In the own
`AtlasExamples.nat_self` control, the count stays eleven while one retained source
path is replaced by another. Original source counts stay 186 and 53 respectively.
The native observations already attached to these expressions are unchanged; no
new construction or proof-typing checks are inferred from this comparison.

The proposed local-refinement operation is not yet implemented in the browser.
It should replace one exact hidden root, keep the other regions, and refuse a
replacement that exceeds the existing vertex/path/boundary limits. Scope links
and native attestations require separate checks when such components are joined.

## Evidence and reproduction

Two fresh core-only runs reproduce the same six theorem records and all nineteen
small syntactic fixtures. The independent comparison checks 95 cuts, 1,670 path
visibility observations and sixteen altered-record controls. Fixtures cover all
twelve constructors and small shared/mixed-binding shapes. They do not receive
proof-typing claims. The finite control's depth rule has no fixed vertex budget
and is distinct from the browser's proof-focus selector.

```sh
python3 research/proof-atlas/cut-refinement/verify.py \
  --lean /absolute/path/to/lean-4.33.1/bin/lean \
  --workdir /absolute/path/to/new-private-workdir --check
node scripts/test-proof-atlas-source-cut-laws.cjs
node scripts/test-proof-atlas-depth-counterexamples.cjs
node scripts/test-proof-atlas-depth-selection.cjs
```

Native checks inspect each theorem's type, proof and expected-type conversion.
They import only core Lean, under the existing 120-second, 8-GiB RSS, 64-MiB output
and local 30-GiB free-space limits. CI uses its separately specified free-space
reserve. Producer source hashes and the published JSON checksum are checked;
raw native logs stay private. The public records are reproduction evidence, not a
standalone serialized kernel certificate. No original private mathematical proof
script is published.
