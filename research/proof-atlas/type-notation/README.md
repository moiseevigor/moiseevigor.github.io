# Recoverable notation for recorded types

The recorded-type reader can show a bounded mathematical notation while retaining the complete compiled expression. Select **Inspect recorded type → Read type notation** in the [context projection view](/projects/proof-atlas/manual/binder-blocks/#recoverable-type-notation). Operators, operands, variables and collapsed frontiers select exact paths in the same recorded type. **Constructor fields** returns to its raw kernel structure.

This is a syntax-preserving presentation rule. It is not a new inferred typing judgment, a reconstruction of the author's tactics or evidence of improved human comprehension. The article application and blog are unchanged.

## Rule and guarantees

The rule folds a left application spine, including metadata wrappers interspersed along its function path. A residual retains the exact head, ordered argument roots, every application occurrence and every wrapper payload. An operator may display its explicit operands while retaining implicit/instance arguments as separate ports. A recognized numeral retains its type, instance and literal-index argument. Nothing is deleted from the immutable compiled packet.

[Four general laws on actual `Lean.Expr`](Spines.lean) prove:

1. Rebuilding a peeled spine recovers the original expression literally.
2. Equal complete spine records imply equal original expressions.
3. Rebuilding accounts for the head, all application/wrapper occurrences and all argument regions.
4. The corresponding count identity holds for every original expression.

These are structural laws. They do not prove a general refinement theorem for the JavaScript evaluator. The JavaScript checks retain serialized payloads; the finite native decoder comparison uses Boolean metadata. General metadata/codec refinement remains open. The finite independent reconstruction below checks its current implementation. A notation record remains recoverable **against its immutable, qualified packet**, not from the printed formula alone.

For each scene:

\[
\text{source occurrences retained in records}
+\text{collapsed source occurrences}
=\text{original expanded occurrences}.
\]

The number of displayed notation objects is separate from the number of represented source occurrences. Storage sharing never merges occurrence paths or lexical contexts.

## Declaration signatures and supported notation

The catalogue contains **53 literal declaration signatures**. Twenty come from a core-only Lean 4.33.1 run. A second run checks every one of the 43 applied heads in the frozen type packets; ten overlap with the core catalogue and their complete literal signatures agree. It reuses pinned Mathlib constant data and the existing fingerprinted Riccati support. The imported original Riccati type and body must match the compiled source exactly. No original proof scripts are read or published.

Recognition requires the exact structured Lean Name, universe-argument count and complete supplied arity. Argument visibility comes from the declaration's literal Pi telescope, including its original binder information. Partial/extra applications, name mismatches, universe-arity mismatches and unknown heads retain generic application structure. A declaration fingerprint includes its structured name, universe parameters and type; identical declaration types do not identify the same connective (`And` and `Or` are a control).

The specialized forms cover equality, conjunction/disjunction/equivalence, order comparisons, basic overloaded arithmetic, negation, casts, natural-number notation, absolute value and the recorded real square root. Other catalogued functions use their explicit argument ports. `JacobiData` constants have short display aliases; full names remain in signature/head records. A binder keeps its domain/body fields; a let keeps type/value/body. Open references, sorts, projections and unknown forms retain generic constructor notation. This is not a complete Lean surface-syntax grammar: macros, commands and tactic histories are not recovered from kernel terms.

## Why instance ports remain

Two authored, kernel-checked values use the same `HAdd.hAdd` head, Nat type arguments and operands 7 and 2. One supplied instance uses `Nat.add`; the other uses `Nat.sub`. Both can display the glyph string **`(7+2)`**, while their proved results are **9** and **5**. Their retained instance ports and complete reconstruction records differ. The source and native proofs are in [Spines.lean](Spines.lean) and [native.json.gz](native.json.gz).

A glyph, rendered formula or identical function type therefore cannot serve as an operation/proof identity. Selecting a symbol exposes its retained arguments and exact head. A displayed formula is not standalone Lean source that can be re-elaborated without its residual and context.

## Bounds and evaluation

A scene has at most **48 notation objects**, 16 displayed nesting levels, a 64-frame spine and a 512-field source path. Each later port reserves at least one frontier; unused capacity from a small operand returns to subsequent ports. Labels are bounded and a clipped label retains its exact original address. Serialized scene metadata is capped at 4 MiB; an exceeded bound returns a recoverable frontier. The existing type packet remains capped at 1 MiB/32,768 rows. No complete expanded occurrence tree is constructed.

Independent JavaScript reconstruction checks **11,324 type cuts in all 150 recorded query packets**, using both original/projected type roots. It validates visible operands, retained implicit/instance arguments, folded numeral indices, metadata order, qualified scope targets and exact source accounting. Controls separately cover partial/extra applications, structured-name and universe mismatches, identical types with different heads and interspersed metadata. A 364-row shared structural DAG represents **13,835,058,055,282,163,701 occurrences**; its bounded scene remains recoverable. That stress graph is not a native proof or an AI benchmark.

The native sample remains the same eleven definition-boundary plans in **two proofs**. These checks do not supply arbitrary-region typing, a general evaluator proof, semantic compression or a reader-study result. The consumer attaches this catalogue only to its matching native verification inventory. Other type inventories need their own signature/provenance check.

## Reproduction and evidence

From the repository root:

```sh
node research/proof-atlas/type-notation/catalog.cjs --check
node --max-old-space-size=4096 research/proof-atlas/type-notation/check.cjs --check
```

Fresh core-only replay needs Lean 4.33.1 and a fresh private work directory:

```sh
python3 research/proof-atlas/type-notation/verify.py \
  --lean /absolute/path/to/lean --workdir /absolute/fresh/directory --check
```

`verify-extra.py` regenerates the additional signatures from the separately restored, hash-inventoried kernel-data runtime and the existing support binaries. Its `--help` lists the four required paths. It checks input artifacts before/after execution and retires only its owned recovered runtime after the native process is terminal. Original cache archives and support binaries remain untouched. The dependency attribution is a pinned cache revision, **not an independent dependency rebuild or reconstruction of the original extraction environment**. The native drivers retain the established disk, memory, time and output limits in technical records; they are not scientific findings.

After the production site build, use the repository's Playwright environment:

```sh
node research/proof-atlas/type-notation/check-browser.cjs
node research/proof-atlas/type-notation/check-compatibility.cjs
node research/proof-atlas/type-notation/check-production.cjs
```

- [Core laws, signatures and counterexample](native.json.gz), [verification](verification.json.gz), [fresh replay](replay.json.gz)
- [All applied-head signatures](extra-native.json.gz), [verification and dependency attribution](extra-verification.json.gz)
- [Catalogue build](catalog.json.gz), [independent reconstruction](model.json.gz)
- [Production browser checks](browser.json.gz), [predecessor compatibility](compatibility.json.gz), [served artifact verification](production.json.gz)
