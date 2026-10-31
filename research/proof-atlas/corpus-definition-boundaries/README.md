# Typed definition boundaries on two compiled proofs

All eleven previously frozen definition-boundary plans now pass fresh Lean checks: seven plans on the Riccati bound `JacobiData.slope_bound_abs` and four on `lean_workbook_plus_6206`. The selected source positions are unchanged. Each function checks at a signature ending in the original declared conclusion, and supplying the original source values specializes back to the original complete proof.

[Inspect the checked interfaces](/projects/proof-atlas/manual/binder-blocks/#compiled-definition-boundaries).

This supersedes the unavailable typing of the same eleven plans in the [earlier structural record](../definition-boundaries/corpus-probe.json.gz). That record remains frozen; the six differently scoped exchanged **output closures** from the older experiment are not certified by this run.

## Construction and judgments

The unchanged local-definition rule turns selected lets into independent lambda inputs, retaining their original values and annotations for recovery. The unchanged exchange rule puts inputs before retained computations. Two deterministic schedules must agree literally. Every intermediate term is checked at the promoted function type and converts to the promoted term.

The real-proof extension also reconstructs the **original declared-goal signature**: its domains follow the normalized input telescope, and its result is the original declared conclusion lifted under the new inputs. Kernel checking verifies the complete function at this signature and conversion from its inferred type. This does not infer a fixed goal merely from the fact that the selected inputs are proofs.

Specialization supplies the actual original source variables/definitions, closes over the original spine and clears unverified let annotations on that computed adapter. It must check at the original declared theorem type, convert to the original proof and admit a typed equality witness. Literal promotion recovery, both exchange inverses and exact adapter reconstruction are checked separately; proof irrelevance and conversion alone do not identify the original syntax.

| Compiled proof | Plans | Distinct selected definitions | Selected appearances | Largest joint native table |
|---|---:|---:|---:|---:|
| Riccati bound | 7 | 6 | 12 | 3,931 |
| Released AI-source proof | 4 | 3 | 6 | 124,355 |

Each individual let and the complete let set on the primary body spine are included. Every plan passes; no failed plan was replaced. All eighteen selected appearances are **proof-valued**, established in their exact original contexts. The Riccati inputs are `hz`, `hD`, `hds`, `hprod`, `amgm` and `hsum`. The AI-source inputs are the three coordinate dichotomies `h₄`, `h₅`, `h₆`. This is not native corpus evidence for arbitrary value/type inputs; those remain covered by the separately labelled authored controls and rejection examples.

There are 36 native intermediate exchange checks, eleven declared-goal bridges and eleven source-specialization checks. All 108 true-flag observations on the checked source/promoted/normalized primary spines pass lambda-expansion typing and conversion; the computed specialization spines retain no true let flags. The native cases contain one shared constructor table each, rather than expanding the occurrence tree.

## Provenance

The Riccati run reuses three previously fingerprinted support modules. Its imported original theorem type and entire body match the public packet structurally. The AI-source run imports neither its original declaration/module nor the private Riccati modules; its complete closed packet is checked directly. The source packets, exact selected routes, compiler executable, runtime producers, binary dependency inventory and each native output are fingerprinted.

The dependency binaries are individually checked before and after the run and attributed to the pinned Mathlib cache revision. This is not an independent dependency rebuild or verification of the original extraction environment. AI-generation attribution remains that of the dataset publisher. [Dataset notice](/public/data/proof-atlas/goedel-sample/NOTICE.txt).

The independent JavaScript constructor model reproduces all eleven promoted and normalized functions, original values, both exchange schedules, declared-goal signatures and complete specialization adapters. All normal-form and specialization hashes agree with the preceding structural plans. It checks 33 complete source inverses and rejects 22 changed source/selection requests at the structural layer. Those refusals are distinct from kernel-negative judgments.

## Paged geometric reader

The checked functions are in the existing exchange page. The two columns show the original and normalized binder spines, with proof statements as the primary labels and optional bounded value previews. The selected definitions become proof inputs; the other definitions remain computations. This ordering is lexical structure, not evaluation time or mathematical distance.

Eight closed components are navigable per case: original term and declared type; promoted term and inferred type; normalized term, inferred type and declared-goal type; and the source-specialization adapter. A constructor field follows its ordered port; a bound variable follows its exact lexical binder. Original selections retain their original packet root/path/node and link to the existing compiled library. Computed selections have a separate case/component/path namespace.

The producer verifies the complete mapping from copied original rows to the original source table, using both original roots. A row reused by a computed component does **not** acquire an original occurrence. Its component and path still determine its scope. Unqualified stored row IDs never identify binders.

One 64-row page and at most two index pages are cached. A field neighborhood retains at most four vertices, with exact visible/hidden occurrence accounting. Paths stop at 512 fields; the binder spine is capped at 128 frames. The manifest is capped at 256 KiB, each row page at 1 MiB and each index page at 16 KiB. Full proof-value strings remain in the native evidence; display previews explicitly record truncation. These are cache, input and view bounds, not a total-process/browser-memory theorem.

The largest AI-source body has 91,424 stored source rows and 31,752,787 expanded occurrences. Its largest joint native table has 124,355 rows, including intermediate states and signatures. This differs from the preceding structural normalizer's 98,826-row computed pool: they retain different components. Neither number measures semantic compression or human understanding.

## Coverage and remaining work

The scope is eleven fixed primary-spine plans in two proofs. Metadata or other constructors stop this spine. The rule does not automatically identify arbitrary application-region boundaries, remove unused inputs, find mathematically minimal premises, infer the author's strategy or measure comprehension. A general verified Expr compiler and broader corpus evaluation remain open. The general research goal remains active; the article application and blog are unchanged.

## Evidence and reproduction

- [Native inventory](native-check.json.gz): source packets, original/import ownership, complete components and all fresh judgments.
- [Independent construction check](model-check.json.gz): exact source/promoted/normalized terms, two schedules, declared-goal signatures, adapters and original plan hashes.
- [Paged consumer check](pages-check.json.gz): finite field/binder cuts on all 88 components. The packer separately compares every encoded row and source mapping against the complete native table.
- [Production browser checks](browser-check.json.gz), [compatibility](compatibility.json.gz) and [aggregate fingerprints](evidence.json.gz).

```sh
node research/proof-atlas/corpus-definition-boundaries/prepare.cjs /tmp/new-corpus-boundaries
python3 research/proof-atlas/corpus-definition-boundaries/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean --cache /path/to/hash-inventoried-runtime \
  --support /path/to/checked-riccati-support --workdir /tmp/new-corpus-boundaries
node --max-old-space-size=2048 research/proof-atlas/corpus-definition-boundaries/check.cjs --freeze /tmp/new-corpus-boundaries
node research/proof-atlas/corpus-definition-boundaries/pack.cjs
# Frozen checks, without restoring the native runtime:
node --max-old-space-size=2048 research/proof-atlas/corpus-definition-boundaries/check.cjs
node research/proof-atlas/corpus-definition-boundaries/pack.cjs --check
node research/proof-atlas/corpus-definition-boundaries/check-pages.cjs --check
# After the production Jekyll build:
node research/proof-atlas/corpus-definition-boundaries/check-browser.cjs
node research/proof-atlas/corpus-definition-boundaries/evidence.cjs --check
```

Native processes use Lean 4.33.1, a 6,144 MiB compiler allocation limit, the existing 8 GiB RSS ceiling, 120-second timeout, 64 MiB output-file limit and 30 GiB free-space guard. One raw native output is retained at a time; compressed results remain. Runtime facets can be restored from the hash-inventoried cache archives and retired after the post-run inventory check. These operational guards belong to reproduction, not to a scientific blog result.

Only compiled term data, authored tooling and evidence are public. Original private proof scripts, support binaries, compiler entries and raw logs are not published. Technical reproduction records may be refreshed in the static reproduction directory; tested application HTML/scripts/styles remain actual production outputs. A feature-branch push is not a merge or deployment.
