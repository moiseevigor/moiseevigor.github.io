# Occurrence paths through substitution

The [existing reader](/projects/proof-atlas/manual/substitution/) uses source paths until an external reference is replaced, then an image-local suffix. [Paths.lean](Paths.lean) states and proves the corresponding rules on actual `Lean.Expr`. No new article tool or research post is added.

## General laws

`follow e path = some (u,d)` selects expression `u` at a valid ordered Expr-field path and counts local binders below the selected root. A substitution `S : Nat → Expr` is indexed by de Bruijn position. For the reader's source-ordered images `a`, `S(j)` is `a[m-1-j]` when `j<m`, and `bvar (j-m)` otherwise.

1. **Valid source paths.** Following the same valid source path after substitution returns `subst (liftSubst S d) u`, at depth `d`. This is conditional on a valid source path; substitution can create new paths inside an image.
2. **Image suffixes.** If source path `p` reaches `bvar i` at depth `d ≤ i`, and image path `q` selects `v` at image-local depth `k`, result path `p ++ q` selects `rename (liftRen (+d) k) v` at depth `d+k`.
3. **Graph refinement.** `selectGraph` follows postorder rows without expanding shared syntax. Its entire Option-valued result agrees with following the interpreted Expr, including invalid paths. The graph is fixed and each child has type `Fin parent`.
4. **Binder owners.** `Owns e usePath binderPath` records an exact binder-body field and a variable whose index equals the number of intervening binders. Renaming and substitution preserve source-local ownership. Under insertion at `p`, image-local use and owner paths both acquire prefix `p`. Names are payloads, not owner identities.
5. **Reference indices.** An image reference below its own local binders is preserved. An external image index increases by the destination depth. A source reference beyond all supplied images decreases by the map size; its target-context index is `(index-depth)-m`.
6. **Successful executor outputs.** Source-path and image-suffix laws apply to successful outputs of the preceding proof-carrying memoized executor, retaining its existing correctness premise.

The [theory record](theory.json.gz) reports **28 theorems**: 26 general/helper laws and two concrete counterexamples, in 33 reported declarations. Dependencies are contained in `{propext, Quot.sound}`. Four altered field roles or claims are rejected by Lean. These are structural laws; there is no mathematical typing-preservation theorem.

The two counterexamples explain the coordinate rule. Replacing a leaf with an application creates result children absent from the source. Reusing one image twice gives the same image suffix two distinct result addresses. Neither a source/result path bijection nor image-only provenance is valid in general.

## Finite implementation bridge

The [inputs](inputs.json.gz) retain all **2,835** preceding substitution queries and their **7,410** selected scenes. Three additional authored syntax controls test a created image field, repeated image uses and residual target context both at the root and below a lambda. They are calibration data, not mathematical proofs or extra AI samples. The interactive catalogue remains the preceding 2,835-query corpus; the three new controls have separate reproducible native/model records.

Fresh Lean core checks cover **2,838 queries**, **26,834 path observations** and **438 local-owner witnesses**. The native checker independently follows actual Expr paths, checks the postorder selector, compares selected substitutions/renamings with the complete result and resolves exact local-binder witnesses. Source/type/let-value queries keep their original owners. All six Riccati openings remain separate. The corpus still includes only one publisher-attributed AI proof.

Production-serializer roundtrips cover **3,331,147 batch-local rows**, including repeated syntax across batches. Four field positions per row give **13,324,588 field probes** across all twelve constructors. The JSON decoder, field convention and JavaScript origins have finite calibration, not a general compiler-refinement proof. Names, levels, metadata and literals retain their payloads; level substructure is outside this Expr-field path grammar.

The finite decoder accepts Boolean and string metadata, as in the parent experiment. Other metadata kinds refuse explicitly. The general Expr laws are not restricted to those two payload kinds.

The [native results](native.json.gz) and [verification record](verification.json.gz) preserve input, source, runtime and core identities. Native substitution also matches `instantiateRev` for every query. Return proofs are erased during native execution; no independent proof term is rechecked for each input.

The rejection gates keep theory and data agreement distinct:

- Swapping both Expr and graph application-port conventions still satisfies the general path laws, but fails the independent immutable-wire check. Internal coherence does not establish agreement with the published port labels and compiled routes.
- A wrong recorded depth is rejected.
- A different valid source use of the same image is rejected despite equal image values.
- A different valid binder with the same name is rejected by the owner witness.

The residual-context control corrected a previously unexercised label branch: the source remainder keeps its original relative index separately while naming the target slot after subtracting the supplied map size. The preceding corpus contains no source-remainder observations, so it did not expose this error. Existing recorded-scene counts are unchanged.

## Reproduce

With Lean 4.33.1 core installed:

```sh
python3 research/proof-atlas/substitution-path-laws/verify_theory.py \
  --lean /absolute/path/to/lean/bin/lean --workdir /tmp/atlas-path-theory
node research/proof-atlas/substitution-path-laws/prepare.cjs \
  --output /tmp/atlas-path-inputs
python3 research/proof-atlas/substitution-path-laws/verify.py \
  --lean /absolute/path/to/lean/bin/lean --workdir /tmp/atlas-path-native \
  --inputs /tmp/atlas-path-inputs
node research/proof-atlas/substitution-path-laws/check.cjs
```

Use fresh directories. Preparation reconstructs parent inputs from public compiled packets by default. `--inputs` on the preparer accepts a certified-substitution cache only after decoded SHA checks. Native commands use the existing macOS no-network confinement, 20 GiB free-space reserve, 256 MiB scratch ceiling, 64 MiB file bound, 8 GiB process-group RSS limit and 120-second command timeout. Portable theory CI uses `--reserve-gib 5`, the same core compiler, a 2 GiB Lean allocation limit and 120-second commands. No private proof project, original proof script or dependency cache is restored. Raw tables and logs remain local; `--publish` saves compiled-data summaries and verification metadata only.

After building the production site, run the existing [browser check](../substitution-geometry/browser.cjs), then both `check.cjs --integration` commands for `substitution-geometry` and `substitution-path-laws`. The browser evidence includes the new equations and records, all six Riccati openings, the existing scope controls, a separate residual-context model check, both themes, mobile layout, keyboard links, saved addresses and request failures. General JavaScript/JSON refinement, arbitrary typing preservation, diverse AI benchmarking and measured comprehension remain open.
