# Equality transport as a typed square

The branch-method notation was insufficient for transport between equal types or dependent fibers. A transport has a base value, an equality witness and a motive; presenting its base value as an ordinary case method hides this relationship.

The new rule represents

`C : (b : A) → a = b → Sort v`, `p : C a rfl`, `h : a = b`

and the resulting term of type `C b h`. The family may depend on the witness. `Eq.ndrec` supplies a witness-insensitive family; `Eq.mp` and `Eq.mpr` transport between equal types. Reversed transport retains the original equality separately from its generated `Eq.symm` witness.

[Interactive rule](/projects/proof-atlas/manual/equality-transport/) · [Evidence bundle](/research/proof-atlas/equality-transport/equality-transport-evidence.json) · [Research program](/projects/proof-atlas/program/)

## Finite results

| Input | Selection | Checked result |
|---|---|---|
| Published Lemma 3.2, `JacobiData.slope_bound_abs` | One canonical occurrence per stored complete `Eq.mp`/`Eq.mpr` application | 34 applications: 7 forward, 27 reverse. All packet fields and both roots match the pinned compiled declaration. |
| Fixed twenty-profile AI-attributed inventory | The same 34 recorded elimination candidates used before this rule | 16 transport occurrences in six profiles, identifying 13 exact source cores. The other 18 candidates are not transports supported by this rule. |
| Nine authored controls | Ten contextual queries | Eight checked occurrences; ordinary application and partial transport remain unavailable. |

The largest checked AI packet has 91,424 stored kernel nodes and represents 31,753,364 expression occurrences across its type/proof roots. The experiment retains its shared DAG, not the expanded tree; its transport interface still has at most seven cards. This finite scale check does not establish general memory or comprehension performance.

The earlier method rule checks nine of the AI inventory's other candidates. Combining those two finite classifications leaves nine candidates unavailable: eight partial `Or.casesOn` calls and one `False.elim` call. This is not a complete inventory of all elimination occurrences in those proofs.

Four AI selections are successive applications of the same `Eq.ndrec` core. Their selected result types differ, but their exact original core route is identical. They are not reported as four independent proof steps. Counts of stored Riccati applications likewise do not count mathematical proof steps or all expanded occurrence paths.

The authored controls include arbitrary and proof-dependent families, a polymorphic carrier, reordered `Eq.recOn` arguments, reversed transport, repeated equal type arguments, and a transport whose result is subsequently applied. The source arguments in the repeated-type control share a DAG node; wrapper slots and occurrence paths retain their distinct positions.

## Native rule

1. Unfold at most eight literal definition heads, with their actual universe arguments, stopping at the compiler's `Eq.rec`. Opaque theorem bodies, arbitrary normalization and partial applications are not accepted by this projection.
2. Verify the kernel recursor's actual family metadata. Build a fresh, typed wrapper template from the source head's telescope. Check its type and definitional conversion using the kernel.
3. Derive source slots from the generic template, not from equality of actual arguments. Require the value to be directly forwarded. The equality must be directly forwarded or use the literal, kernel-typed `Eq.symm` recipe.
4. Check literal template instantiation and any unchanged trailing application arguments. Retain the exact original core prefix separately from the selected occurrence.
5. Kernel-check the equality, base value, endpoint result and source-core conversion. Abstract computed expressions over the exact original context, with an exact round trip.

The browser independently checks source routes and scope, forwarding slots, template substitution, endpoint applications, equality endpoints and the symmetry recipe. Hashes attach those observations to the native record. The browser is not a Lean kernel and does not independently prove the recorded typing/conversion attestations.

## Provenance

Riccati uses the published packet and the existing hash-pinned private compiled modules. Its original declaration and module are present. This is a compiled-module comparison, **not** source-free replay or a fresh reconstruction of the historical build. `verify_riccati.py` reads compiled binaries and their prior verification manifest, not original private Lean/tactic sources. Only compiled packets, derived records and verification metadata are copied into website assets.

AI and authored-control checks decode the closed packet with the original theorem and original module absent. Private Riccati modules are absent. All seven AI packets also pass the existing fresh kernel proof replay and its wrong-proof/ill-typed-binder negative controls, with no `sorryAx`. Dataset attribution is supplied by `Goedel-LM/Lean-workbook-proofs` at revision `b731852af8d8ab11498fda27bce9020738c01c59`; it is not independently established AI authorship.

The recovered Mathlib/Aesop checking binaries are individually hash-verified. Their Mathlib revision is cache attribution, not an independently verified Git checkout or source rebuild.

Every source card carries the original packet SHA, node and exact occurrence route. Every computed card uses the `equality-transport` namespace, native-record SHA, source query and computed component/root. It receives no invented original source occurrence. Pretty-printed Lean strings are bounded presentation, not canonical serialization. The downloadable graphs retain exact constructor payloads, universe levels and context indices.

## Geometry and bounds

The square connects equality endpoints above the typed value/result connection. Dashed sides denote family/type association. Cards provide the concrete expressions and distinct source/computed selections. A continuation gets a separate seventh card. At most seven vertices are shown; these are typed interfaces, not the entire proof graph.

One source packet and one native record are loaded at a time. Bounds are 16 MiB decoded source, 131,072 source nodes, 8 MiB decoded native record, 64 queries per record, 65,536 computed nodes per query, 32 source-core arguments and 512 route slots. Independent source/template comparison has a bounded memo/work set. These are separate artifact/traversal limits, **not a bound on total browser heap**. Unlike the main paged library, this finite experiment retains the complete bounded source DAG. It does not claim paged transport over arbitrary massive proofs.

## Reproduction

Use Lean 4.33.1, the existing recovered checking cache and a private work directory. The drivers enforce the existing eight-GiB native process limit and thirty-GiB free-space reserve.

```sh
python3 research/proof-atlas/equality-transport/verify.py \
  --lean PATH_TO_LEAN --cache CHECKING_CACHE --workdir NEW_PRIVATE_WORKDIR
python3 research/proof-atlas/equality-transport/verify_riccati.py \
  --lean PATH_TO_LEAN --cache CHECKING_CACHE \
  --riccati-build PINNED_COMPILED_BUILD --workdir NEW_RICCATI_WORKDIR
node research/proof-atlas/equality-transport/publish.cjs PRIVATE_WORKDIR RICCATI_WORKDIR
ATLAS_EQUALITY_CHECK=1 node scripts/test-proof-atlas-equality-transport.cjs
node scripts/test-proof-atlas-equality-transport-browser.cjs
node scripts/build-proof-atlas-equality-evidence.cjs --check
```

The checks include source/computed address selection, continuation deduplication, changed profiles during loading, damaged downloads, explicit unavailable states, release, keyboard activation and desktop/mobile light/dark accessibility. The evidence bundle records actual counts and fingerprints. Earlier method evidence remains immutable at its recorded revisions; current compatibility is checked separately.

## Limits and next question

This is a typed structural extension, not a theorem of general visual-language adequacy. Other equality wrappers, computed value/equality recipes, arbitrary eliminators, tactic histories and all Lean surface syntax remain outside the tested scope. The experiment does not claim semantic compression or improved human understanding.

The next useful evaluation is a tracing task: distinguish an original equality from its reversed witness, identify the source value, and separate a transport core from its continuation. Compare correctness and time against the compiled-term reader before claiming a comprehension benefit. Bounded source delivery for transport is a separate implementation question.

No research-blog post or public deployment is part of this local experiment.
