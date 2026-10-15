# Released AI-source evaluation

The dataset publisher attributes these scripts to Goedel-Prover-SFT. The pinned
release is `Goedel-LM/Lean-workbook-proofs` at
`b731852af8d8ab11498fda27bce9020738c01c59`. Its README lists 29,750 records and its
LICENSE declares MIT. Both document hashes and the Parquet hash are retained in
`goedel-selection.json` and the public manifest. See the public data's NOTICE.txt
for the original license declaration and attribution.

The sample was fixed before compilation: the 16 smallest values of
`SHA256("ProofAtlasGoedel/1:" + problem_id)`, followed by the eight longest UTF-8
`full_proof` scripts, with length ties resolved by problem ID. This selects 24
distinct records. Length includes comments and is not a proxy for kernel size.
The selection script independently recovers every recorded identity and source
hash from the pinned 16,165,753-byte Parquet file.

Twenty scripts compiled unchanged under Lean 4.33.1 and Mathlib revision
`0df444a360eaa60ab8c11dca51a86af692955474`. Four failed. Two reported unsolved
goals, one reported missing identifiers and one rejected legacy sum syntax.
These outcomes belong to the stated environment. The original model run,
original environment and population-level proof success rate are not reproduced.
No failed script was repaired or replaced to improve the denominator.

Native export kernel-checks every owned type and complete body. A typed identity
also forces each body at its declared type through the kernel, beyond the Meta
unification check. Axiom dependencies are restricted to `propext`,
`Classical.choice` and `Quot.sound`. The 20 source modules own exactly 20 theorem
declarations. Their full graphs contain 268,356 stored nodes and 82,348,388 type
and body expression occurrences. External Lean/Mathlib declarations remain named
boundaries. Native attestations are relative to the imported environment; the
browser and CI do not rebuild all of Mathlib and these are not portable kernel
certificates or certifications of the source comments' mathematics.

## Reproduction

Use Python 3.12 with pyarrow 19.0.1 for Parquet selection, Node.js 22 or later,
Lean 4.33.1 and an existing compatible compiled Mathlib dependency environment.
Original scripts and logs must remain outside the website repository.

Download the pinned `data/train-00000-of-00001.parquet` from the release's
`resolve/<revision>/` URL into a private directory. The scripts verify SHA-256
`24fcb50eecc2ccbcc52a58c6412c6d10edbeaa9483a97d30e207fb20ef6e2677` before using it.
Do not use an unpinned dataset-server row response as the source of record.

```sh
python3 research/proof-atlas/prepare_goedel_sample.py --parquet /tmp/atlas-ai/train-00000-of-00001.parquet --output /tmp/atlas-ai/selected.json
python3 research/proof-atlas/evaluate_goedel.py --dataset-dir /tmp/atlas-ai --snapshot /path/to/pinned-dependency-metadata --workdir /tmp/atlas-ai/evaluation --lean /path/to/lean
python3 research/proof-atlas/export_goedel.py --evaluation-dir /tmp/atlas-ai/evaluation --snapshot /path/to/pinned-dependency-metadata --lean /path/to/lean
python3 research/proof-atlas/type_goedel.py --evaluation-dir /tmp/atlas-ai/evaluation --snapshot /path/to/pinned-dependency-metadata --lean /path/to/lean
node research/proof-atlas/enrich_goedel_types.cjs /tmp/atlas-ai/evaluation /tmp/atlas-ai/evaluation/type-requests-02.json
python3 research/proof-atlas/type_goedel.py --evaluation-dir /tmp/atlas-ai/evaluation --snapshot /path/to/pinned-dependency-metadata --lean /path/to/lean --requests /tmp/atlas-ai/evaluation/type-requests-02.json
python3 research/proof-atlas/run_binding_oracle.py --evaluation-dir /tmp/atlas-ai/evaluation --snapshot /path/to/pinned-dependency-metadata --lean /path/to/lean
```

Dependency metadata consists of a pinned `lake-manifest.json` and a
`lean-env-path.txt` listing existing compiled package paths. No original private
project module is needed. The driver verifies dependency Git revisions and
imports only the approved Mathlib/Aesop libraries and these sample modules.
Its macOS sandbox denies networking, child processes and writes outside the
private evaluation directory, and limits reads to compiler/dependency/system
paths plus that directory. The fixed sample hashes and source command policy
are checked before compilation. This is a driver for this reviewed sample,
not a general-purpose executor for arbitrary Lean submissions.

Compiler stages have fixed memory, time, file-size and work-directory limits,
and retain a 30 GiB free-space reserve. Source checks allow 60 seconds per
script; extraction stages allow 240 seconds. No dependencies are rebuilt.
Resource records and full logs remain private and are not research posts.

The first type phase queries statement/body roots, consecutive outer lambda
and let bindings, their continuation, and each outer let value. The binding
prefix is capped at 64 entries. The second phase adds six exact source lambda
queries required by native-checked recursor minors. All 175 final queries pass;
no binding prefix reaches its limit. This is finite route coverage. Internal
descendants do not inherit inferred types or tactic history.

The publisher strips optional elimination traces from the primary type package
and publishes separately checked case packages. Three complete Or eliminations
have six exact source input frames. One candidate has unsupported eta forwarding
and remains explicitly unavailable while retaining its ordinary typing record.
Source, compiled-module and packet hashes are rechecked across native phases.

```sh
node research/proof-atlas/publish_goedel.cjs /tmp/atlas-ai/evaluation
node scripts/test-proof-atlas-ai-sample.cjs
```

The publisher validates all outputs before writing public compiled packets and
native evidence. It copies neither original scripts nor logs. The public audit
compares all 744 lambda/forall/let binding counts against native Expr results,
checks 864 source cuts and 500 independently resolved scope links, and rejects altered source/environment records.

## Binding-use projection

`proof-atlas-binding-uses.js` presents one source binder, its collapsed body and
before-binder header regions. The only scope relation summarized is reference
to that selected binder. Its original body and every header retain exact source
routes. The retained binder plus hidden headers plus the collapsed body account
for the complete selected term. Counts include references inside type
annotations. They do not establish semantic necessity or permit source erasure.

For applications, free-variable support is the union of child supports. A lambda
or forall keeps its domain support unchanged and drops/shifts the body's index
zero. A let keeps type/value supports unchanged and drops/shifts only its body.
The implementation stores these supports as bounded BigInt bitsets over the
immutable postorder DAG. The support table is capped at 131,072 source nodes
and 512 free-variable slots; unsupported entries fall back to bounded traversal.
Reference counting retains its 65,536-state and depth-512 limits. A failed count
is unavailable, never zero. Shared nodes used under different outer contexts
still have the same relative use of their own binder; occurrence routes remain
necessary for all source navigation and outer-binder meaning.

The native oracle reads original Expr objects before serialization and uses
Lean's own `hasLooseBVar` predicate for independent absence checks. Its memoized
multiplicity counts agree with all 744 browser results. Of 48 stored let nodes,
33 have zero body references. Twelve counts previously exceeded the older
traversal budget and now complete with the support table. This measures count
coverage on this corpus, not general runtime improvement or human comprehension.

Fresh core-only controls separately cover pre-binder values, shadowing,
dependent domains, nondep flags, a 513-binder scope, an 80-level shared proof,
and rejection of a body at a wrong declared type. They do not require Mathlib:

```sh
python3 research/proof-atlas/verify_binding_uses_controls.py /path/to/lean
```

CI also downloads the pinned official Parquet file, verifies its complete hash,
and recovers all 24 exact source identities with the same sampling rule. It does
not upload those original scripts or compile Mathlib.


## One-step let reduction

`type_let_reductions.py` reopens the same compiled modules and verifies every source/module hash before and after extraction. It queries one representative route for each of the 48 stored let nodes in seven declarations, without changing the original 175-query package. `ExportLetReduction.lean` records domain, value, body and result judgments. All 48 exact queries pass. The private raw attestation is projected by `publish_let_reductions.cjs` into separate compiled-only sidecars.

```sh
python3 research/proof-atlas/type_let_reductions.py --evaluation-dir /tmp/atlas-ai/evaluation --snapshot /path/to/pinned-dependency-metadata --lean /path/to/lean
node research/proof-atlas/publish_let_reductions.cjs /tmp/atlas-ai/evaluation/native-lets-01.json
node scripts/test-proof-atlas-let-reductions.cjs
python3 research/proof-atlas/verify_let_controls.py /path/to/lean
```

If a compiler probe fails, use a fresh `--tag` to preserve its inputs and logs. Extraction uses the same fixed memory, disk and execution limits. The sidecars contain compiled graphs and native evidence only. One representative route does not establish typed coverage of every occurrence of a shared node. Exact independent substitution and occurrence accounting supplement native conversion, which alone cannot establish proof-term provenance in the presence of proof irrelevance. The computed DAG/node bounds and audit scope are recorded in the research program.
