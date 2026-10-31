# Dependent input domains and definition wires

Four authored core-Lean controls fill a gap in the preceding region-function
inventory: later input domains now refer to earlier computed bindings.
Eleven of twelve predetermined input-policy candidates pass fresh kernel
typing and source specialization. Nine introduce new inputs; two retain
fixed inputs. One branching candidate fails strict input-type conversion.

[![Dependent input domain](dependent-domain.svg)](dependent-domain.svg)

The diagram uses the checked `finConstructor` all-position function. Its five
inputs are `f`, `u`, a constructor-like function `c`, `v` and `h : v < f u`.
The intermediate result is `r := f u`; the next call constructs `y : Fin r`.
The closed result type is `PProd Nat (Fin (f u))`. Every original result
position is retained. Original data variables are absent from the closed
function, while its five new inputs and dependent constraints remain.

Solid arrows are actual reconstructed value inputs. Dashed arrows are
literal references in computed type expressions, with their own binder
targets. They do not assert mathematical premise necessity. Cards select
original source ports and computed fields together; dashed arrows select
the exact computed variable use. Human aliases are attached to recorded
binding positions. Layout has no mathematical metric.

## A definition wire is not an independent input

In the original context `n a : Nat`, `h : a < Nat.succ n`, the expression

```lean
let k := Nat.succ n
@Fin.mk k a h
```

is well typed. Direct capture-avoiding substitution gives
`@Fin.mk (Nat.succ n) a h`, with fresh kernel typing and conversion checks.
The raw lambda candidate

```lean
(fun k : Nat => @Fin.mk k a h) (Nat.succ n)
```

is rejected: the fixed proof `h` does not have type `a < k` for arbitrary
lambda-bound `k`. In all five recorded let-use probes, both lambda and
application are rejected although the raw kernel conversion probe returns
true. That comparison is diagnostic raw-expression behavior; it does not
certify typing or an equality proposition containing the candidate.

The previous observer required this lambda expansion as a let-wire bridge
and withheld five otherwise valid ports. The refined observer uses direct
zeta substitution. New `ProofAtlasApplicationPort/2` records state
`direct-zeta/1` explicitly and retain optional beta probes separately; they
do not inherit the old lambda-expansion success flag. Earlier v1 records
and observer source remain unchanged.

Following an existing definition uses its fixed value. Introducing a new
input may require changing later dependent domains. The region constructor
already derives those domains from the rebuilt callable telescope; these
controls test that operation with actual computed-domain dependencies.

## Predetermined candidates

| Source control | All boundary positions | Proof arguments | Proofs and proof-valued heads |
|---|---|---|---|
| `finSuccessor` | 4 inputs; original context 2 → 0 | Fixed-input closure | Fixed-input closure |
| `finConstructor` | 5 inputs; context 3 → 0 | 1 input; context 3 → 2 | 1 input; context 3 → 2 |
| `proofAfter` | 5 inputs; context 3 → 0 | 1 input; context 3 → 2 | 2 inputs; context 3 → 2 |
| `proofDiamond` | Kernel rejected at `3:3` | 2 inputs; context 3 → 2 | 5 inputs; context 3 → 2 |

The failed diamond retains its original successful Lean proof. Independently
replacing the join's proposition arguments does not make its incoming
proofs inhabit the new propositions. No failed candidate is replaced;
interfaces with constraints or transport are not ruled out.

The inventory contains ten predetermined computational calls and 32 actual
input positions. Applications in type-expression fields are not additional
inventoried calls. This is an authored calibration, not new real-corpus or
AI-generation coverage.

## Evidence

- [Native functions](native.json.gz) and [verification](verification.json.gz).
- [Refined native ports](ports.json.gz) and [legacy refusals](legacy-ports.json.gz).
- [Independent model](model-check.json.gz): full function reconstruction,
  exact zeta/lambda/application syntax, 27 unchanged legacy type tables and
  45 malformed-record refusals.
- [Publication](publication.json.gz), [core-data fingerprints](core-data.json.gz)
  and [figure provenance](figure.json.gz).
- [Production browser checks](browser-check.json.gz), [compatibility](compatibility.json.gz)
  and [complete evidence manifest](evidence.json.gz).

Of 52 binding domains in the accepted functions, eleven input domains and
thirteen result domains reference earlier computed bindings. Their 27
recorded domain-to-binder references include three to earlier inputs and
24 to earlier results. Each has an exact occurrence and binder portal.
Counts overlap across policies; they are not independent proofs or minimal
mathematical premise measurements.

Fresh Lean 4.33.1 checks import core `Lean`, without Mathlib restoration or
private project imports. Original controls are absent from packet replay
and the region checker. Source, executable, shared library and constant-data
fingerprints are recorded; dependency binaries are not independently rebuilt.
Native-observed domains and tuple universes are inputs to the independent
constructor audit. It does not independently infer Lean types.

## Delivery and limits

Separate source, type-catalog and function-page registries preserve earlier
corpus manifests. The existing graph, native input inspector and function
reader share the controls. Function fields retain original/reduced/closed
scopes and a 64-row cache. Source links qualify packet, edition, proof, call
and input; computed links add native case, binding field and ordered path.
Missing records and out-of-bounds selections remain unavailable.

The actual production-browser audit exercises all 32 source inputs, 110
accepted component roots, 27 domain-reference selections and binder jumps,
and ten exact source/computed figure links. Four finite inventories fold
successfully. Eleven malformed source/computed links refuse without retaining
a previous computed selection; stale controls, missing-record retry and
pending-request retirement are checked separately. Four desktop/phone and
light/dark audits report no scoped accessibility violations. Five existing
model suites and four existing browser suites pass against the shared runtime,
with their historical reports preserved. These checks establish recorded
navigation and delivery behavior, not human comprehension.

Native type tables stay paged. Complete small let-probe tables reside in port
metadata, within its 2 MiB per-reader decoded cap. Their rows and six graph
arrays per table are counted separately. The inspector retains at most five
port readers per window. The offline audit holds complete fixture graphs.
These are component bounds, not a total-browser memory theorem.

Required suffix-lambda closure, arbitrary dependent-region interfaces,
callable aliases without a literal Pi, general evaluator/codec refinement,
typing preservation and measured human benefit remain open. Article and blog
are unchanged. The general geometric-language goal stays active.

## Reproduction

```sh
python3 research/proof-atlas/dependent-region-inputs/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean --workdir /private/tmp/fresh-dependent-regions --publish
node research/proof-atlas/dependent-region-inputs/publish.cjs /private/tmp/fresh-dependent-regions
node research/proof-atlas/dependent-region-inputs/pack-functions.cjs --check
node research/proof-atlas/dependent-region-inputs/check.cjs
node research/proof-atlas/dependent-region-inputs/figure.cjs --check
# After an actual production Jekyll build:
node research/proof-atlas/dependent-region-inputs/check-browser.cjs
node research/proof-atlas/dependent-region-inputs/check-compatibility.cjs
node research/proof-atlas/dependent-region-inputs/evidence.cjs --check
```

Use fresh work directories. Native runs retain existing disk-reserve, RSS,
output and time guards; raw logs stay private. Browser checks use Playwright
and axe-core via `NODE_PATH`, and `ATLAS_ORIGIN` / `ATLAS_CHROMIUM_PATH`.
Completed technical reports may be copied into the build afterwards;
application HTML, scripts, styles and source SVG must be actual build outputs.
