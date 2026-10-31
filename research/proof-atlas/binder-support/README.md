# Reference accounting through binder exchange

The binder-spine reader now separates **references in a type**, **references in a defining value**, and **fields using a binder**. Selecting a binder shows at most four labelled links. Counts include implicit arguments in the compiled expression. The link opens the exact binder or containing field; it does not pretend that one field root identifies a particular repeated use.

[Open the checked Riccati reader](/projects/proof-atlas/manual/binder-blocks/#compiled-definition-boundaries).

## The representation problem

Moving a dependent input past a definition is not just moving a card:

```text
let y : A := v; fun x : B(y) => r
fun x : B(v) => let y : A := v; r′
```

The moved input's type loses its reference to `y`. Substitution introduces the references of `v` at every replaced position. For an earlier original binder `z`, the coefficient rule is

```text
uses_z(B[v/y]) = uses_z(B) + uses_y(B) * uses_z(v)
size(B[v/y])   = size(B) + uses_y(B) * (size(v) − 1).
```

Here size counts Expr constructor occurrences, and the use counts refer to the original enclosing binder identities. Binders internal to the selected field are counted separately. The rule includes references beneath lambdas and in dependent types. Bound-variable numbers are not global identities.

For example, the existing authored `dependentLets` control has `a := f n`, `b := Nat.succ a`, and `i : Fin b`. After moving `i` across `b`, the input type is `Fin (Nat.succ a)`; after moving it across `a`, it is `Fin (Nat.succ (f n))`. The old domain remains in the exchange residual. The diagram must distinguish these new references from the original domain's reference to `b`.

The formulas are standard substitution accounting. Two general identities in [Coefficients.lean](Coefficients.lean) have fresh kernel checks for a tree with named reference atoms and replacement holes. Their transitive axiom lists are `[propext, Quot.sound]`; no `sorryAx` occurs. Constructor tags are opaque, and the size identity uses an additive form to avoid truncated natural-number subtraction.

This general algebra starts **after** reference identity and replacement holes have been identified. It does not prove lexical resolution, de Bruijn substitution or the Expr compiler correct. The bridge to those operations is the finite audit over the frozen native graphs below.

## Checks on the compiled graphs

The audit covers all fields in the original, promoted and normalized primary spines and every intermediate exchange in three preceding native inventories:

| Existing inventory | Accepted constructions | Rejected candidates | Exchange steps, both schedules |
|---|---:|---:|---:|
| Composed binder controls | 8 | 0 | 48 |
| Definition-boundary controls | 10 | 2 | 16 |
| Riccati and AI-source boundaries | 11 | 0 | 36 |

The original kernel verdicts remain unchanged. Rejected candidates receive no normalized checked interface.

Two independent algorithms agree on **469 distinct field-root appearances**, covering **159,410,130 expression occurrences** in total. This total counts repeated fields in separate cases; it is not a unique corpus size. The bottom-up algorithm builds sparse free-index coefficient maps. The top-down oracle propagates weighted visits to `(stored row, binder depth)` states without expanding the occurrence tree. Both use arbitrary-precision integers. Original/source and computed addresses remain separate.

All **100 exchange steps** satisfy the coefficient and size formulas. Fifty steps in the authored controls change type references; the thirty-six steps in the selected corpus plans have zero references to the crossed definition in the moved input's type. Definition domain/value support, other primary fields and the remaining body's support retain their original binder targets. Both schedules yield the same original-binder permutation. Identity follows exact exchange paths, independently corroborated by a stable partition; names are labels only, including in shadowing controls.

The Riccati `amgm` input type refers to `J` and `p` four times each. Its original defining proof and its later uses remain different relations. These literal counts do not establish which mathematical assumptions are necessary. Unused original inputs are retained.

The shared-variable structural control distinguishes one stored variable used freely from the same row beneath a new lambda. A second control has 104 stored rows and `2^101 − 1` represented occurrences; its one free variable occurs `2^100` times. It has no kernel typing claim.

## Reader, bounds and provenance

The reader loads one content-addressed support record per selected native case, capped at 128 KiB decoded. Eleven records total 117,464 decoded bytes. The existing native constructor reader retains its separate 64-row/two-index-page cache and four-vertex field view. Reference lists page four entries; selecting a link retires the previous field controls. Support failure leaves checked constructor navigation available with an explicit unavailable message.

A support record binds the immutable source packet and native case/inventory hashes. Original frame routes and computed frame routes remain distinct. The browser validates ordered scopes and the free-index-to-original-binder map. No native typing is added to descendant fields, and a transport hash is not a Lean certificate.

The offline producer retains complete native graphs and sparse coefficients, with a 262,144-state guard, 512 distinct coefficients per row, at most 1,048,576 retained coefficients and 8,388,608 retained decimal digits. Individual integers are capped at 4,096 digits. The weighted oracle separately bounds pending states and retained weight digits. The largest observed cache contains 124,255 stored-row states, 228,284 coefficients and 841,789 decimal digits. These are component bounds and measurements, not a total-process memory theorem. Reference counts do not unfold definitions, infer strategy, identify minimal premises or establish semantic compression or comprehension.

The prior native inventories, reports and screenshots remain frozen. Their production fingerprints describe the earlier page. Current browser compatibility reports rerun their original assertions against the new actual production build, redirecting output paths only. No source HTML or application assets are overlaid for browser checks.

Only compiled metadata and authored tools are added. No original private proof scripts, runtime dependencies or raw execution logs are published. The blog and article application are unchanged. Arbitrary graph-region interfaces and the general research goal remain open.

## Reproduction

```sh
# Core-only native algebra; use a new work directory:
python3 research/proof-atlas/binder-support/verify-laws.py \
  --lean /path/to/lean-4.33.1/bin/lean --workdir /tmp/new-reference-laws
node research/proof-atlas/binder-support/freeze-laws.cjs --freeze /tmp/new-reference-laws
# Frozen checks:
node research/proof-atlas/binder-support/freeze-laws.cjs
node --max-old-space-size=2048 research/proof-atlas/binder-support/check.cjs
node research/proof-atlas/binder-support/check-consumer.cjs --check
# After the actual production Jekyll build and local server:
node research/proof-atlas/binder-support/check-browser.cjs
node research/proof-atlas/binder-support/check-compatibility.cjs
node research/proof-atlas/binder-support/evidence.cjs --check
```

`check.cjs --freeze` writes a new generation from the three pinned native inventories. [All constructions](constructions.json.gz), [independent counting audit](model-check.json.gz), [consumer checks](consumer-check.json.gz), [browser checks](browser-check.json.gz), [current compatibility](compatibility.json.gz), and [aggregate fingerprints](evidence.json.gz) retain separate evidence layers. The Expr bridge reuses existing native judgments. The separate [native algebra check](native-laws.json.gz) uses only core Lean 4.33.1 under the existing timeout, output, memory and free-space guards. No independent dependency rebuild is claimed. Raw execution logs remain private.
