# A navigable witness of literal type difference

The producer-to-input bridge distinguishes structural equality from recorded kernel conversion. Its difference label now includes one paired occurrence path and two exact computed addresses. This addresses a concrete inspection task: locate a difference hidden by type pretty printing, without changing the original selected proof call.

## Rule

Compare the lifted producer type and expected input type in their recorded common consumer context. Visit ordered fields depth first, starting with slot zero. At the first unequal constructor, canonical payload or field count, retain the shared slot path, its constructor-field labels, the number of local binders crossed, and the two constructor records. Payload previews are explicitly truncated after 1,024 UTF-16 code units. Constructor payload identity uses the existing canonical universe-level representation.

The endpoints retain the native owner, source index, original call query, input slot, component, root and exact computed route. They remain in separate `producerTypeInConsumer` and `inputType` components even if their node identifiers happen to agree. Opening either endpoint leaves the original source occurrence unchanged. The paged network reader and individual application reader use the same visual component; the compiled library embeds the latter.

This is one syntactic inequality witness. Matching ordered ancestors and an unequal endpoint establish literal root inequality under the existing representation. Pair memoization is safe here because both roots are already in the same context and no variable shifting is performed. The witness does not align arbitrary subterms, enumerate every difference, identify an error, reconstruct kernel reduction, or attest a conversion between the selected subexpressions. The recorded kernel conversion relates the original type roots. Binder names, metadata and other serialized payload fields can differ without indicating a failed typing check.

## Bounds

The existing comparison bound remains 262,144 distinct stored node pairs. An exceeded pair budget gives an unavailable comparison, independently of the recorded conversion. Predecessors retain at most one record per visited pair; pending frames are bounded by twice the pair limit plus one for constructor arity at most three. No occurrence tree is expanded.

A selectable witness has at most 512 fields, matching the existing computed selector limit, and two payload previews of at most 1,024 code units each. A deeper detected mismatch still establishes structural difference but has an explicit unavailable selection path. These are component bounds, not a total browser heap bound. The selected native graphs still load within their existing limits. Source-only inputs acquire no witness or typing claim.

## Finite evaluation

The model checker compares runtime paths against an independent bottom-up digest calculation on the pinned native batches. It checks all 877 native inputs in 42 profiles. All 85 different pairs have selectable witnesses: 58 constructor differences and 27 payload differences. Thirty-seven of those pairs have identical recorded printed text. The longest observed witness has 12 fields. The other 792 pairs retain equal-structure results and no invented mismatch.

All 170 endpoint selections are resolved through the actual query provider and checked for component, context source owner, local binder count and native ownership. Ten authored graph controls test root and nested differences, the 512/513-field boundary, ambient and local variable indices, universe and literal payloads, bounded previews and exhausted comparison budgets. These controls are structurally validated; they add no native proof or AI benchmark claim.

In the Riccati bound, input `25:3` differs at `root.fn.arg.fn` (`lam` versus `app`). Input `26:4` has identical printed type strings but differs at a 12-field path (`const` versus `app`). Input `1:4` exposes different declaration payloads, `Distrib.toAdd` and `AddSemigroup.toAdd`, beneath identical printed type strings. These examples describe the recorded expressions; they do not attribute a mathematical role to the differences.

## Reproduction

From the repository root:

```sh
node research/proof-atlas/type-difference/check-model.cjs /tmp/type-difference-model.json
node research/proof-atlas/input-type-bridge/check-model.cjs /tmp/type-bridge-regression.json
# After the actual production build is served locally:
ATLAS_ORIGIN=http://127.0.0.1:8866 node research/proof-atlas/type-difference/check-browser.cjs /tmp/type-difference-browser
```

Browser dependencies are Playwright and axe-core; the existing `ATLAS_CHROMIUM_PATH` option selects an installed browser. Reports identify the tested producer hashes. Historical type-bridge reports remain evidence for their earlier source versions. The earlier browser checker now counts formula blocks inside the type flow, separately from the new payload previews.

This remains a local research prototype. The blog is unchanged. Improved human comprehension, error-localization performance and semantic compression remain unmeasured.

## Current local checks

The actual Jekyll production build and five browser suites passed with no source overrides: the new witness reader, the existing type bridge, all 207 application windows and 115 library calls, paged network navigation, and current-call boundary inspection. Eight new phone/desktop and light/dark accessibility audits passed. Five paired browser examples exercised ten exact difference-endpoint selections. The library checks retained its original source selection. Six malformed witness presentations were refused; deep-path and legacy-data fixtures retained explicit missing witnesses.

- [Model report](model-check.json.gz).
- [Production browser report](browser-check.json.gz).
- [Compatibility reports and source identities](compatibility.json.gz).
- [Evidence and local build environment](evidence.json.gz).

The local build uses Jekyll 3.9.2 and the repository dependency versions on Ruby 3.4.4, with the former standard libraries supplied separately and a no-op taint-method compatibility shim for Liquid 4.0.3. The temporary environment changes no repository dependencies. The evidence records those exact compatibility additions. Static reports and this reproduction text are copied after the production build; served files are then checked against source bytes. This does not establish a hosted deployment or a CI result.
