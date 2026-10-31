# Local opening without losing the inspected region

In the [recorded-type reader](/projects/proof-atlas/manual/binder-blocks/#recoverable-type-notation),
select **Inspect recorded type → Read type notation**. A **+** beside a collapsed
frontier opens that part inside the current expression. Selecting its ordinary
symbol still inspects that region separately. Constructor fields, exact heads,
implicit arguments and original binder links remain available.

The new operation preserves the selected source root, original query and all
notation objects outside the opened region. It requests no new data. Keyboard
focus moves to the opened symbol; controls belonging to the previous view no
longer act. The initial view has at most 48 notation objects. Successive openings
may retain at most 192 objects and 4 MiB of serialized notation metadata; an
opening that exceeds the bound leaves the current expression unchanged.

## Composition rule

Let `C` be the current source cut and `D` the cut opened at a frontier. Embed
`D` along its exact source path, retaining the surrounding constructor context
and leaving other branches as holes. The new source cut must be precisely
`join(C, embed(D))`. The runtime checks this equality before returning a view.
Source occurrences are counted separately from displayed notation objects.

The [fifteen source-cut laws](../cut-union/README.md) apply to a fixed actual
`Lean.Expr`: union is the least common refinement, commutes with a fixed source
context and obeys inclusion–exclusion for constructor/reference counts. Source
paths distinguish two uses of a shared storage row. An external owner envelope
retains the original packet/query/type-root identity; equality of supplied
owners is not authentication of their hashes.

A folded application can have more operands than fit in one local notation
window. Repeating that same window then makes no progress. The fallback opens
the ordinary kernel constructor, with at most three ordered fields. It keeps
the original expression recoverable and does not invent a smaller function
signature or omit operands.

## Checks and evidence

- [Model](model.json.gz): 11,353 initial cuts, comprising the 11,324 existing type
  cuts plus small all-constructor controls. It checks 82 openings and 28
  commuting pairs, retaining 4,288 outside object identities across those checks.
  An independent lexical walk verifies 2,120 binder targets after opening.
  Eight rejection controls cover non-frontiers, foreign owners, catalogue
  mismatch and zero progress.
- [Native reconstruction](verification.json.gz): 11,599 source-cut records and
  82 union/intersection comparisons are decoded into actual `Expr`-indexed
  cuts. Literal payloads, source counts and free-reference coefficients are
  checked by core Lean. These are finite codec comparisons, alongside the
  separate general source-cut laws.
- [Consumer](consumer.json.gz): the original 150-query assertions also check
  82 openings in 28 selected type cuts, exact owner retention, unchanged cache
  and native records, and foreign-query rejection.
- [Browser](browser.json.gz): the preceding reader assertions plus in-place
  keyboard opening, unchanged outside symbols, source accounting, no extra
  fetches and inactive stale controls. Production checks use the actual Jekyll
  build, without application-source overrides.

The corpus comprises the existing eleven definition-boundary interfaces of
the Riccati proof and one separately attributed AI-source proof. It provides
150 recorded expression/type queries; this is not general descendant typing.
The largest refined corpus/control scene observed has 74 notation objects,
207,515 serialized root bytes and 297 raw source-cut entries.

A separate 61-row structural sharing control represents
2,305,843,009,213,693,951 occurrences without expanding that tree. Opening stops
at 167 objects when the next selected local replacement would exceed 192. The
old view remains intact. This control is not a kernel-typed proof, an AI-scale
corpus benchmark or a bound on total process memory.

The finite native decoder supports Boolean metadata and canonical
JSON-compatible string representations, with a literal Lean reprint check.
Ten controls cover accepted values and explicit rejection of the remaining
`DataValue` constructors. Arbitrary Name, Nat, Int and Syntax metadata and
non-JSON string representations remain outside this native replay. JavaScript
keeps their original payloads; it does not elaborate metadata representations.
Original private proof scripts and Mathlib artifacts are not needed or published.

This work provides a locally compositional inspection rule. It does not prove
general JavaScript refinement, typing preservation of arbitrary regions,
semantic compression or improved human comprehension. Article content and the
blog are unchanged.

## Reproduction

From the repository root:

```sh
node research/proof-atlas/notation-refinement/check.cjs --check
node research/proof-atlas/notation-refinement/check-consumer.cjs
python3 research/proof-atlas/notation-refinement/verify.py \
  --lean /absolute/path/to/lean-4.33.1 \
  --workdir /private/tmp/atlas-notation-refinement-fresh --check
node research/proof-atlas/notation-refinement/check-browser.cjs
node research/proof-atlas/notation-refinement/check-compatibility.cjs
node research/proof-atlas/notation-refinement/check-production.cjs
```

The work directory must be new. Browser checks require Playwright, axe-core,
an installed Chromium and `ATLAS_ORIGIN` pointing at the actual production
preview. `ATLAS_DEV=1` is a separate, explicitly marked development overlay;
its results do not establish production delivery. Source/data fingerprints
before and after execution detect changed inputs. Verification logs and
resource limits belong to the technical evidence, not the blog.
