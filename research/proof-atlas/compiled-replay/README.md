# Recovering Lean proofs from compiled packets

The frozen `goedel-sample-4331` inventory contains 20 compiled theorems from a predetermined 24-script sample. Their 268,356 stored expression nodes can be reconstructed from the public `ExprDAG/1` packets and checked by Lean 4.33.1 without importing their original theorem or proof modules. The four scripts that did not compile are not covered. AI attribution comes from the dataset publisher; the generation process was not independently observed.

## What is checked

The decoder reconstructs ordered constructor fields, structured names, binder visibility, let flags, literals, universe levels and Boolean metadata. Serializing the reconstructed roots through the production exporter must reproduce all six expression-table fields exactly: `kind`, `children`, `payloads`, `expanded`, `neededScope` and `roots`. This rejects changed names/annotations, altered indices or counts, unreachable extra nodes and changed sharing/order. It is stricter than alpha equivalence or definitional equality.

For each theorem, the native command checks its expected type, its proof value, and a typed identity application forcing the proof's conversion to the expected type. Every referenced constant must already exist in the pinned baseline environment. The original theorem and module must be absent. Transitive axiom dependencies are collected from those baseline constants and must match the published inventory. The observed dependencies are `propext`, `Classical.choice` and `Quot.sound`; `sorryAx` is rejected.

The runner imports Mathlib and Aesop from the existing compiled dependency paths, verified against the environment revisions and lock-file digest already recorded in the sample manifest. Its child sandbox can read those compiled libraries, the Lean toolchain and the new workdir. It cannot read the original project or proof modules. No project or dependency build is run. Imported compiled dependencies remain trusted; this does not independently recheck every Mathlib declaration.

## Coverage and controls

All 20 theorem packets pass reconstruction, native typing and expected-type conversion. Their 25 metadata entries are Boolean. The decoder accepts exact Boolean metadata, including both values in the own controls. Other metadata value kinds are explicitly unsupported and rejected; they are never erased.

Twenty own structural controls exercise all twelve expression constructors, all four binder visibility values, both let flags, numeric versus string name components, raw/shared universe levels, literals and metadata. Open free variables, expression/universe metavariables and loose bound variables are structural controls only. Four additional closed control terms have native type/term/conversion checks. Ten malformed packet controls are rejected by the decoder, and three invalid closed-expression controls are rejected by the kernel. Each theorem also rejects `Nat` zero at its expected proof type and an invalid binder; the same invalid-binder control is repeated across packets, not twenty distinct cases.

The published package contains compiled observations, own compiled control graphs, environment and producer digests. It excludes original Lean scripts, source projects, private request paths and compiler logs. These are archived native attestations, not a browser kernel or a portable standalone proof certificate. Complete-root checks give no additional inferred types to displayed descendants and do not certify an article passage or geometric interpretation.

## Reproduction

The public artifact audit needs Node and the checked-out site data:

```sh
node scripts/test-proof-atlas-compiled-replay.cjs
```

Fresh kernel replay currently uses the bounded macOS runner. Supply Lean 4.33.1 and an existing dependency reference containing `lake-manifest.json` and `lean-env-path.txt`. The latter lists the compiled `.../.lake/packages/<package>/.lake/build/lib/lean` directories. Revisions and the lock digest must match `goedel-sample-manifest.js`. The runner does not provision these dependencies or load the original project's own compiled path. Use a new workdir:

```sh
python3 research/proof-atlas/compiled-replay/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean \
  --dependency-reference /path/to/dependency-reference \
  --workdir /path/to/new-private-workdir --all
```

`--name lean_workbook_49456` selects a single recorded theorem instead of `--all`. The local runner enforces the existing fixed native resource limits. Raw logs and resource records stay in the workdir. Native replay uses the complete stored packet and compiled dependency environment; the paged browser's finite-cut bounds do not describe this separate process.

The publisher rechecks packet identities, native output hashes and current producer files before extracting the public metadata:

```sh
python3 research/proof-atlas/compiled-replay/publish.py \
  --verification /path/to/new-private-workdir/verification.json --publish
```

Omitting `--publish` compares with the frozen public generation. The public audit independently checks the package digest, all packet identities/counts, native-row and control-output fingerprints, current producer files and compiled control structure. Its nine altered-attestation controls preserve internal output digests while changing source identities, coverage, assumptions or claimed results. It checks consistency and provenance; fresh native replay remains a separate command.
