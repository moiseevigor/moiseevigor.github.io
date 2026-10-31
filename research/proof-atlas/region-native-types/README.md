# Native typing of selected context projections

All **150 predetermined queries** pass direct Lean kernel checks in their original and reconstructed reduced contexts. The queries cover the 22 selected proof-body regions of the [lexical projection census](../region-context-projection/README.md), together with all 128 retained header type/value fields in those views. They span the same eleven definition-boundary plans: seven on `JacobiData.slope_bound_abs` and four on `lean_workbook_plus_6206`. No failed query was replaced or removed.

This is a finite typing result for those exact regions. The [existing projection view](/projects/proof-atlas/manual/binder-blocks/#lexical-context-projection) attaches these records only to matching region/header roots. Other selections continue to report typing unavailable. No blog article is added.

## Construction and judgments

Here `Γ` belongs to the addressed compiled component. For a computed interface, “original” means before this projection; links retain the computed namespace and do not acquire original Lean-source occurrences.

For a selected expression `e` in its exact original ordered lexical context `Γ`, the checker:

1. Reconstructs `Γ` from the component-qualified occurrence path, checking every context type and local definition value.
2. Obtains the type `T` of `e` through `Kernel.check`, abstracts the original free variables, and checks the exact abstraction/instantiation roundtrip.
3. Computes the closure of the loose variables of both `e` and `T` through context types and local definition values. Every needed entry must be in the query's predetermined retained set `K`.
4. Projects `e`, `T` and retained headers into the ordered context `Γ′`. Internal binders remain protected. Both projected expression and type must embed back into their original raw syntax literally.
5. Checks the projected expression directly at its projected expected type in the reconstructed open context `Γ′`. This is separate from checking the closed function.
6. Closes the projected expression with lambdas and local definitions, and checks it against the corresponding closed type. Specialization at original context arguments must convert to the original selected expression.
7. Checks an `Eq.refl` recovery witness, including its closure over the complete original context. Literal reconstruction is checked separately from kernel conversion, which can identify different proof syntax.

Reconstructed context lets and closure wrappers use `nondep = false`. They are computed binders, not copied original context headers. Original header addresses and the interior expression's original let annotations remain intact. Retained header queries use only the retained prefix before their own binder; a binder does not scope over its own type or value.

The nine roots in each native `graph` are, in order:

| Root | Expression |
|---:|---|
| 0 | Original selected expression |
| 1 | Original inferred type, abstracted over `Γ` |
| 2 | Projected expression |
| 3 | Projected type |
| 4 | Closed projected function |
| 5 | Closed expected type |
| 6 | Actual inferred type of the closed function |
| 7 | Closed recovery witness |
| 8 | Closed recovery equality type |

The smaller `types` graph contains roots 1 and 3. Root 6 may be convertible to root 5 without literal equality. Raw types have at most 246 stored rows in this sample; a complete native query graph has at most 126,260 rows. These are stored DAG sizes, not expanded proof sizes or comprehension measurements.

## Independent reconstruction

`check.cjs` reads one native record at a time and checks compressed-file, raw-stream, per-record, query-plan and producer-source hashes. Its separate constructor model reconstructs:

- The exact original selected subtree and lexical frames from the earlier compiled joint graph.
- Term/type support, fixed-point context closure, ordered projections and **300 literal inverses**.
- Both complete closures per query: **300 exact closure reconstructions**.
- The application arguments and wrappers of all **150 recovery witnesses**.
- Postorder storage, constructor arities, universe/Name payload identity, lexical requirements and exact expanded counts for all retained graphs.

It does not infer types in JavaScript or independently prove kernel correctness. The typing judgments remain the recorded native checks. `plan.json.gz` fixes all queries from the earlier frozen census before native evaluation.

## Provenance and limits

The native producer uses Lean 4.33.1 and imports kernel constant data with `trustLevel = 0` and `loadExts = false`. It performs direct kernel operations, not `MetaM` operations against uninitialized environment extensions. The small checker is compiled separately and linked to fingerprinted Lean shared libraries; Mathlib executable IR is not restored or executed.

Dependency artifacts are verified before and after the run and attributed to the cache revision `mathlib4@0df444a360eaa60ab8c11dca51a86af692955474`. Exact pinned Riccati support binaries are reused; their imported original theorem type and entire body match the compiled packet literally. The AI target declaration/module is absent from the imported environment and its closed compiled term is checked directly. Every plan also passes five whole-root assignments and rejects a natural-number literal supplied as the original proof.

This is not an independent dependency rebuild or verification of the original extraction environment. Original research proof scripts and support binaries are not published here. Fresh native replay requires the fingerprinted dependency artifacts, reference cache inventories and existing private Riccati support binaries; it is not a self-contained public replay. Public structural replay uses only the committed compiled data and tools. AI attribution remains that of the [dataset publisher](../../../public/data/proof-atlas/goedel-sample/NOTICE.txt).

The 150 queries do not cover arbitrary descendant expressions, every region of these two proofs, other corpus proofs, general typing preservation, minimal mathematical premises or human understanding. A matching declaration/section name is insufficient to transfer these judgments to another occurrence. The UI attachment must match the original component, complete path, retained context, selected part and native owner. A type graph is a derived object and must not acquire an invented source occurrence.

## Evidence and reproduction

### Geometric reader

“Inspect recorded type” follows the type relation in the same four-vertex constructor view. The type is a derived expression in a separate namespace; its own fields receive no new inferred-type judgment. Enclosing references return to exact original binders, while a type-local binder remains inside the type view. Returning to the projected expression preserves its selected header/term part. The optional raw preview keeps explicit arguments and variable indices, caps output at 640 characters plus a truncation marker and visits at most 512 expression occurrences. It does not recover Lean notation or hide implicit arguments.

The consumer matches the native owner, original region address, complete retained context, part, original selected expression and empty relative path. A descendant, adjacent header or changed context does not inherit its enclosing query. Packet failures leave the syntax projection available. Navigation cancels stale requests; one active request and the latest pending request share one retained packet. Releasing the projection clears that packet.

The generated registry is 118,467 bytes; the largest current type packet is 19,818 decoded bytes and 246 stored rows. The input caps are 512 KiB for the registry, 1 MiB/32,768 rows for a packet and 512 constructor fields per path. A visible cut has at most four vertices, with exact hidden occurrence accounting. These are representation/cache bounds, not a browser-process memory theorem. Full native record archives are not fetched by the reader.

The consumer audit checks all 150 queries, both raw/projected type roots and 11,324 constructor cuts, including 218 enclosing-reference selections. No reference in this finite sample targets a binder introduced inside its recorded type; two separately labelled structural fixture cuts check that route-qualified case. They are not additional native judgments.

```sh
node research/proof-atlas/region-native-types/pack.cjs --check
node research/proof-atlas/region-native-types/check-types.cjs --check
```

[Packet inventory](packets.json.gz) · [Consumer checks](consumer.json.gz) · [Production browser checks](browser.json.gz) · [Predecessor compatibility](compatibility.json.gz)

The production browser checks all 150 attachments, 22 original-binder jumps and 118 type-constructor navigation steps. They check unsupported descendants, corrupted packets/retry, stale controls and release during an actual pending request. Four desktop/phone, light/dark layouts pass keyboard, overflow and WCAG A/AA checks. The seven predecessor browser suites and the original 88-component page-model checks retain their original assertions and frozen reports; only output destinations change.

After building the production site and serving `_site_production`, run with the repository's Playwright environment:

```sh
node research/proof-atlas/region-native-types/check-browser.cjs
node research/proof-atlas/region-native-types/check-compatibility.cjs
```


### Native and structural replay

Run from the repository root:

```sh
node --max-old-space-size=4096 research/proof-atlas/region-native-types/check.cjs --check
```

This reproduces the deterministic [independent report](model.json.gz) without loading Lean dependencies. It does not overwrite evidence. `--write` explicitly regenerates that report.

Native tooling is split into explicit stages, each requiring a fresh output directory:

```sh
python3 research/proof-atlas/region-native-types/recover.py --help
python3 research/proof-atlas/region-native-types/build.py --help
node research/proof-atlas/region-native-types/prepare.cjs /absolute/fresh/query-directory
python3 research/proof-atlas/region-native-types/verify.py --help
python3 research/proof-atlas/region-native-types/freeze.py --help
```

`recover.py` accepts the existing archive index and hash-inventoried reference restoration; it restores only the three kernel-data facets into its own directory. `build.py` compiles the authored checker. `verify.py` consumes the prepared query directory, restored runtime and existing support directory, verifies input identities and streams bounded native outputs. `freeze.py` verifies and copies the completed compiled evidence into this folder. Native runs retain a 30 GiB free-disk reserve, an 8 GiB RSS bound, a 120-second process bound and 64 MiB limits for individual native records and files written by the child process. The compressed archive is written separately by the parent. These are operational reproduction limits, not scientific findings.

- [Predetermined queries](plan.json.gz)
- [Native verification and fingerprints](native-check.json.gz)
- [Support/library attribution](freeze.json.gz)
- Complete native record streams: `native-0.ndjson.gz` through `native-10.ndjson.gz`, with exact hashes in the native verification report.
