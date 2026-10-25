# Method interfaces from public compiled proof packets

Status: local checked research iteration. No deployment or blog post.

## Question and result

Does the method-interface rule developed using Lemma 3.2's Riccati proof
transfer to independently published compiled proof packets without importing
the private Riccati environment or the original proof declaration?

The unchanged native eta-interface rule passed for **nine recorded `Or.rec`
calls, 18 methods and 18 inputs in three public proof profiles**. The fixed
twenty-profile AI-source inventory has 34 recorded elimination candidates in
seven profiles. All nine previously checked calls remain checked; the other
25 remain explicitly unavailable. All seven closed proof packets passed fresh
kernel replay. The original theorem, original proof module and every
`SE2Conjugate` module were absent from the checking environment.

These calls all use disjunction elimination. This is transfer of the existing
rule, not new recursor-scheme coverage. None of the source methods in this
sample needs the missing-lambda repair isolated by the earlier authored
controls. No comprehension benefit has been measured.

## Representation and provenance

The original method retains its immutable source packet hash and occurrence
route. Eta binders, their dependent domains and the application body occupy
`computed-method-interface`, owned by the new native evidence hash. They never
become original source lambda occurrences. Actual and expected method types
remain distinct recorded conversion endpoints. The same geometry and source
jumps are available in the [manual](/projects/proof-atlas/manual/#method-interface-lab).
The complete library also exposes computed interfaces where a matching
elimination record is loaded. These views load the full bounded stored packet;
paged method-interface delivery remains open. The largest tested packet stores
91,424 nodes and represents 31,753,364 expanded occurrences. It is not expanded
into that occurrence tree.

Sources are attributed by the publisher to `Goedel-LM/Lean-workbook-proofs`,
revision `b731852af8d8ab11498fda27bce9020738c01c59`. Each profile retains its
original problem ID, publisher metadata and source/compiled hashes. Generation
attribution is not independently verified. This iteration reads and publishes
compiled terms and derived records; it neither reads nor republishes the
original proof scripts.

`prepare.cjs` inventories all existing elimination observations in the fixed
sample, including supplemental packet and use-site records, before extraction.
Every native metadata file and packet is hash-checked. Candidate status is not
inferred from declaration names. The six-field packet roundtrip preserves
`kind`, `children`, `payloads`, `expanded`, `neededScope` and `roots`.

`MethodReplay.lean` decodes each closed public packet, checks its proposition
and proof and queries exact contextual routes. The existing
`BranchInterfaces.lean` algorithm checks eta typing, term/type conversion and
abstraction roundtrip. Fresh baseline controls reject an unrelated proof and an
ill-typed binder, compare transitive axioms, and reject `sorryAx`.

Lean 4.33.1 checks run with Mathlib and Aesop imports. Dependency binaries are
verified against the restored inventory attributed to Mathlib revision
`0df444a360eaa60ab8c11dca51a86af692955474`. This is cache attribution, not an
independent dependency checkout or rebuild. Per-route extraction exceptions
remain unavailable outcomes; they do not become fabricated interfaces or a
claim that a candidate is mathematically invalid.

## Independent checks and evidence

The model checker compares all 18 method source routes, original contexts,
actual/expected types and constructors against earlier recorded judgments.
A separate lexical hash normalizes free variables by context ordinal and
compares the original method with the function under the computed eta binders.
Displayed domain references are independently reconstructed. Twenty new
refusal controls cover false imports, ownership, attribution, baseline checks
source/computed namespace substitution and inconsistent outcome inventories.

The earlier 16-method native/model/browser checkpoint is frozen at
`ec766430d7c71d024f733e06eff6cb17cd05499a`. `predecessor.json` pins its bundle
and audit hashes. All source fingerprints in that bundle were compared with
that Git revision when the checkpoint was made. Current compatibility is
recorded separately; original reports are not rewritten to look current.

The [scoped evidence bundle](method-replay-evidence.json) includes native,
model, browser and predecessor compatibility reports with tested file hashes.
It is a technical record, not a research blog entry.

## Reproduce

Run from the repository root with Lean 4.33.1 and a verified checking cache:

```sh
node research/proof-atlas/method-replay/prepare.cjs /private/tmp/fresh-method-plan
python3 research/proof-atlas/method-replay/verify.py --lean /path/to/lean \
  --cache /path/to/checking-cache --workdir /private/tmp/fresh-method-replay
node research/proof-atlas/method-replay/publish.cjs /private/tmp/fresh-method-replay
ATLAS_METHOD_CHECK=1 node scripts/test-proof-atlas-method-interfaces.cjs
ATLAS_REPLAY_CHECK=1 node scripts/test-proof-atlas-method-replay.cjs
```

The native driver uses the macOS sandbox, bounded processes and a disk reserve. Logs and resource
records stay outside the website. Replaying needs dependency binaries and the
existing public packets, not original private proof modules or source scripts.
Browser checks run against the production build using the two method browser
test scripts. `build-proof-atlas-method-replay-evidence.cjs --check` verifies the
saved scoped evidence and source fingerprints. No all-proof, all-occurrence,
semantic-compression or human-comprehension claim follows from these tests.
