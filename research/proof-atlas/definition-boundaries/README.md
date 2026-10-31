# Typed boundaries over local definitions

Selected local definitions can become independent inputs to a compiled function. Retained definitions remain computations inside it. Unlike a single source-occurrence replacement, this rule changes the selected binder: every original use of that binder refers to the same new input, including uses on separate branches.

[Inspect the boundary rule in the existing exchange page](/projects/proof-atlas/manual/binder-blocks/#definition-boundaries).

## Construction

Start with a closed source term and its primary lambda/let spine. Select exact let positions by ordinal and original field path. Replace each selected let with a lambda of the same name and domain, remove its value from the function and retain that value and the original annotation in a source-owned residual. The body indices are unchanged because one binder replaces one binder. Retained lambdas, implicit flags, lets and other constructor fields remain intact.

Kernel-check the complete promoted function. If it fails, retain the source and candidate records with `KERNEL_REJECTED`; do not fabricate an interface type. Otherwise apply the preceding let/input exchange sequence to put all inputs before retained computations. Input domains are transported by substitution, and the complete normalized function is checked at the promoted type after every exchange.

The resulting type is an inferred dependent family over arbitrary boundary inputs. It is not asserted to end in the original fixed theorem statement for arbitrary new values. Specialization supplies the original values in the actual original source context, leaves retained computations internal, then closes over the original spine. This complete adapter must kernel-check at the **original declared type**, convert to the original source and admit a typed equality witness.

The computed specialization adapter clears its wrapper let flags to false. Reusing source flags is not justified when the body is a new application: the native audit finds two lambda-expansion failures in the `interleaved` adapter despite its kernel typing. All 29 true annotations on the checked source/promoted/normalized primary spines pass independent lambda-expansion typing and conversion. The original flags remain unchanged in the source and inverse residuals.

Literal recovery is separate: reverse the exchange sequence, then restore each promoted let from its original value and annotation. Verify the complete original syntax and source owner. Supplying a proof that converts to another proof does not establish this literal correspondence.

## Fresh native evidence

Twelve authored compiled declarations were replayed without importing their original declarations or module. Ten interfaces pass. Two source programs pass their original kernel checks but their promoted functions fail:

- `fixedIndex` uses a supplied proof of `0 < 1` to construct `Fin k` under `k := 1`. An arbitrary `k : Nat` is not justified by that proof.
- `typeAlias` applies `Nat.succ` to a variable under `T := Nat`. An arbitrary `T : Type` does not make that application well typed.

The accepted controls include a branched computation and join, interleaved retained/promoted definitions, dependent value and proof domains, two dependent boundary inputs, repeated names and a universe-polymorphic type input. Every accepted interface has fresh closed typing and specialization judgments. The two normalization schedules have **16 intermediate kernel checks** and agree literally in all accepted cases.

The compiler generated one auxiliary proof for the multiple-input fixture. Its complete compiled packet is retained, checked and admitted as a theorem with its actual proof before replaying the main fixtures. It is not replaced with an axiom. The original main declarations remain absent. This finite helper replay is not a general environment reconstruction procedure or an independent compiler rebuild.

The independent JavaScript model reconstructs all twelve promoted functions, thirteen selected original values, sixteen exchanged intermediate terms and ten complete specialization adapters. It checks 32 complete promotion/sequence inverses. A separate pooled implementation matches the native intermediate terms and has twenty complete inverses. Ninety ordinary-input refusals test residual/source ownership, source annotations, duplicate selections and pool row/memo/step limits. These refusals are distinct from the two native typing rejections.

### The original values cannot be recovered from the interface

The programs

```text
let k := 1; fun i : Fin k => k + i.val
let k := 2; fun i : Fin k => k + i.val
```

have literally identical promoted functions and interface types. Their original values and declared result types differ. Both use the input and computed value; this does not rely on erasing an unused definition. Swapping their residual owners is refused. Even after spoofing the owner label, substituting the other value fails the expected literal source hash. The original values therefore remain necessary recovery data; the new interface alone does not identify its source program.

## Shared-node normalization on compiled proofs

The structural probe selects each individual let and the complete let set on the primary body spine of the pinned Riccati bound and `lean_workbook_plus_6206`. These are **eleven plans over nine exact original definition positions**: seven plans on six Riccati lets and four plans on three AI-source lets. Metadata and other constructors stop this spine; the probe does not search every subtree or infer a minimal interface.

Both schedules normalize and reverse exactly in all eleven plans. The largest selected proof has 91,424 stored source rows and 31,752,787 expanded body occurrences. The shared computed pool peaks at **98,826 rows**, below its 131,072-row cap, without enumerating the expanded tree. Original source packets and original-value residuals remain separately referenced; this number is not total resident memory or semantic compression.

The earlier whole-table sequence model stops on one AI-source plan at its 262,144 retained-row guard. With an explicitly larger offline allowance, it retains 310,448 row appearances and its result matches the shared-pool result literally. All eleven plans match that older reference. A guard stop is an implementation resource boundary, not a kernel rejection.

**New interface typing, specialization typing and source conversion are unavailable for all eleven corpus plans.** Their original compiled provenance is pinned, and their literal transformations/inverses are checked, but native evidence from the original proof does not certify these new functions. The AI attribution is that of the released dataset, not a classification made by this experiment. [Dataset notice](/public/data/proof-atlas/goedel-sample/NOTICE.txt).

## Representation and bounds

The existing exchange page now contains the boundary view; no separate application entry point is added. Original cards and values identify their compiled source routes. Computed cards, type fields and specialization adapters have a separate namespace, evidence hash and component path. Source binder targets and computed binder targets remain distinct. Rejected candidates show their actual untyped constructor graph and offer no typed-interface or specialization controls.

One small authored control loads on request (256 KiB decoded, at most 4,096 source/native rows). A column has at most 128 binder cards. Constructor inspection shows a selected vertex and at most three children, with exact lexical links. Source packets, computed graphs and temporary decoding buffers have separate lifetimes; this is not a whole-browser heap theorem. The large corpus plans are offline evidence, not paged into this view.

The offline pool has a 131,072-row cap, 262,144 transformation-memo cap, 128-frame spine cap and 4,096-step cap. Unchanged subgraphs keep their computed pool identity. Scope-aware memo keys distinguish the same stored node under different binder depths. These guards apply to the computed pool and transformation memo, not every Python/JavaScript/compiler allocation. Native checks retain the existing allocation/RSS/time/output/free-space guards and use Lean core only.

The rule keeps the whole original primary input telescope, even unused inputs. It does not establish minimal premises, independent parameters for every graph-region boundary, a general verified Expr compiler, semantic equivalence of article prose or improved human comprehension. The general research goal remains active. The blog is unchanged.

## Evidence and reproduction

- [Native packets and judgments](native-check.json.gz).
- [Independent and pooled finite models](model-check.json.gz).
- [Corpus plans, exact source positions and reference comparisons](corpus-probe.json.gz).
- [Production browser checks](browser-check.json.gz) and [aggregate fingerprints](evidence.json.gz).

```sh
python3 research/proof-atlas/definition-boundaries/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean --workdir /tmp/new-definition-boundaries
node research/proof-atlas/definition-boundaries/check.cjs --freeze /tmp/new-definition-boundaries
node research/proof-atlas/definition-boundaries/check.cjs
node --max-old-space-size=2048 research/proof-atlas/definition-boundaries/check-corpus.cjs --check
# After the production Jekyll build:
node research/proof-atlas/definition-boundaries/check-browser.cjs
node research/proof-atlas/definition-boundaries/evidence.cjs --check
```

Only authored controls/tooling, compiled term data and evidence are added. Private original proof scripts, runtime dependencies, compiler entries and raw logs are not published. Technical reproduction records may be refreshed in the static reproduction directory after a build; tested application HTML/scripts/styles remain actual production outputs. Feature-branch publication is not a merge or deployment.
