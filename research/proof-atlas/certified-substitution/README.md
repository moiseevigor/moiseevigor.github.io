# A certified memoized substitution executor

`execute_correct` proves a successful-output property for a **total executable implementation**, rather than only an equation about a recursive specification. For any postorder row graph G, finite image map σ, root r, fuel and table budget, an accepted output is equal to capture-avoiding substitution on the actual `Lean.Expr` denoted by r:

```text
execute G images limit fuel r = ok output
  → subst (substitution G images) (interpret G r) = output
```

[Implementation and theorem](Certified.lean). All twelve Expr constructors retain their payloads and ordered fields. This is a syntax theorem. Validity of the represented mathematical term and its free/metavariable contexts is not a premise that the executor checks.

## Cache rule

Depth is measured below the selected substitution root, independently of the original proof depth. Each graph row refers only to earlier rows, represented by `Fin parent`. The model interpreter is well founded on the row number. It is a mathematical specification; the native run does not evaluate that interpreter on an expanded shared tree.

The executor constructs results from the rows and stores them in dependent hash maps. A substitution cache entry at `(row, depth)` carries the equality between its result and the specified substitution at that exact row and binder depth. The graph and image map are fixed parameters of the cache family. Natural-number key equality suffices; the invariant does not depend on Lean's opaque Expr structural comparison. Source copying and image renaming have their own proof-carrying caches. Zero-shift copying preserves sharing without traversing a row separately for every enclosing depth.

For one source row `bvar 0` and image `a`, the depth-zero result is `a`, while the depth-one result is still `bvar 0`. An enclosing local binder must not be replaced by the external argument. Lambda/Pi bodies and let bodies increment depth; domains and let values do not. Shifted images preserve their own local binders too.

These caches share computed syntax. They do not identify original proof occurrences or their binder owners. Source packet hashes, canonical module uses, original slots and occurrence routes stay in the separate provenance record.

## Finite bridge

The [input manifest](inputs.json.gz) contains 2,835 substitution queries in 38 bounded batches. It retains every preceding module probe: 1,376 overlapping full/reduced uses and seven authored cases, including all 29 cases whose recursive specification had not been evaluated. Term bodies, expected-type bodies and 51 retained let values are separate queries. These repeated views cover one publisher-attributed AI proof and own controls; they are not independent mathematical proofs or a diverse AI benchmark.

Sixteen additional queries cover both context openings of every frozen source/template instance from the [constructor-recovery experiment](../source-template-laws/README.md). Six are the three Riccati source functions in `JacobiData.slope_bound_abs` and their templates. Their original ten-entry contexts, binding keys, native record identities and source hashes remain attached. This does not extend mathematical typing coverage to arbitrary replacements in the Riccati proof.

Two further authored expression-data controls test a shared row at different binder depths and a large open substitution image beneath destination and image-local binders. The latter distinguishes an external reference shifted to index two from the image's own index-zero binder. Typing is not asserted for these scale controls. The large result has exactly **2⁹²+3 expanded occurrences and 96 reachable stored rows**. Its full input table has 194 rows; the executor retains 292 cache entries, including the preloaded source copies. This is a sharing/scope stress test, not a large AI-generated proof or a semantic compression measurement.

The [native results](native.json.gz) and [verification record](verification.json.gz) record successful proof-carrying execution and independent native `instantiateRev` comparisons for every query. Exact production-serializer roundtrips cover 3,331,136 batch-local rows, including repeated input syntax and expected results. These are not 3,331,136 distinct corpus expressions. The largest batch has 151,815 rows. The finite metadata decoder supports Boolean and string values; other kinds refuse explicitly.

Four implementation mutations are rejected by Lean: a wrong row cache key, a wrong depth cache key, an unshifted open image and a let value moved inside its new binder. These are proof/type failures, not parser failures or resource stops. The eleven reported declarations include the executor functions, helper laws and successful-output theorem; their dependencies are contained in `{propext, Quot.sound}`.

The compiler checks the executor and its return proofs. **Those proofs are erased during native execution; a separate proof term is not rechecked for each input.** The generic successful-output theorem is proved, while a general decoder/serializer refinement theorem remains open. The finite roundtrip/oracle checks provide the current data bridge. The earlier unverified native/JavaScript executors are not retroactively given this proof.

Fuel exhaustion and table exhaustion return explicit errors. Successful execution does not establish that every possible graph fits the chosen budget, mathematical typing preservation, minimal interfaces, semantic compression or improved human comprehension.

## Reproduce

From the repository root, using an installed Lean 4.33.1 core:

```sh
node research/proof-atlas/certified-substitution/check.cjs
python3 research/proof-atlas/certified-substitution/verify_theory.py \
  --lean /absolute/path/to/lean-4.33.1/bin/lean \
  --workdir /tmp/atlas-certified-theory
```

The full native bridge uses the existing macOS confinement protocol:

```sh
python3 research/proof-atlas/certified-substitution/verify.py \
  --lean /absolute/path/to/lean-4.33.1/bin/lean \
  --workdir /tmp/atlas-certified-substitution
```

Use a fresh directory. Parent inputs are reconstructed from public compiled packets. An optional `--source` cache is accepted only after every decoded input hash and the pinned producer files are checked. No private proof project or dependency cache is restored. Native commands retain the 20 GiB free-space reserve, 256 MiB scratch ceiling, 64 MiB file bound, 8 GiB process-group RSS limit and 120-second command timeout. These describe verification, not total browser memory. Raw logs and generated tables remain local. `--publish` saves compiled-data result summaries and verification metadata only.

After building and serving the production website, run the [browser checks](browser.cjs):

```sh
ATLAS_ORIGIN=http://127.0.0.1:8877 node research/proof-atlas/certified-substitution/browser.cjs
```

[Integration checks](integration.json.gz) retain the browser, production-build and link-check results. Screenshots and raw logs remain local.
