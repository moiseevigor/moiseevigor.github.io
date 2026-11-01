# Context modules as applications

An open source subterm cannot become an argument-free capture without accounting for its enclosing binders. The existing checked context-module operation provides that interface: assumptions become lambda/Pi wrappers and ordered arguments; local definitions remain let wrappers. The application diagram exposes this operation in the existing compiled reader. It does not introduce a new native typing operation or replace the source term.

[Open the recorded AI-source region](/projects/proof-atlas/library/?edition=goedel-sample-4331&proof=lean_workbook_plus_6206&loading=paged&route=1:1.1.1.1.1.1.1.2.2), then choose **Show checked context module**. **Required syntactic context** selects the separate public-packet replay evidence. This example has seven assumption arguments and two retained lets.

## Rule and provenance

Each row pairs an exact original context header with its computed module wrapper. An assumption has a zero-based argument position, separate from its original context slot and its position among all retained wrappers. The original slot includes any unused prefix omitted from the native recipe; recipe indices remain separate. A retained let has no argument position. Its original type and value belong to the pre-binder context. Its computed let retains `nondep=false`, as in the existing native module construction.

The term and expected-type wrappers have different computed roots and constructors: assumptions become `lam` in the term and `forallE` in its expected type. Definitions remain `letE` in both. The diagram retains both addresses and follows the currently inspected component. Original source headers retain their packet hash and exact occurrence route, even when two uses share closed module syntax.

Dashed connections are **derived closure arguments**, not original application-use edges. The diagram permits navigation, not arbitrary replacement of arguments. Retained let values are fixed; making them independent parameters can invalidate later dependent types. The earlier [let-to-lambda counterexample](../dependent-region-inputs/README.md) remains applicable.

Reduced-context observations record application typing and kernel conversion to the original selected term. Some full-context alternate uses also have explicit native application queries. Full-context representatives without such a query are labelled **structurally derived**. Closed-root typing alone is not relabelled as a separate native application check. A target query must belong to the displayed canonical module and the selected original use. Native environments for imported modules and public-packet replay remain distinct.

Kernel conversion is distinct from literal constructor recovery in the [source-template laws](../source-template-laws/README.md). No descendants acquire new typing judgments. Universe parameters remain part of the recorded environment, not additional term-argument ports.

## Finite checks

The [model audit](module-use-check.json.gz) checks 1,376 overlapping representations: 633 full-recorded-context observations, 594 reduced own-control observations and 149 public-packet reduced observations in the frozen publisher-attributed AI proof `lean_workbook_plus_6206`. These cover sixteen source declarations; the two modes are not independent mathematical proofs or new AI samples.

The audit resolves 1,130 original headers and their domain fields: 1,080 argument ports and fifty retained definitions. It compares 890 computed wrapper targets with recorded native graphs or independently reconstructed graphs whose roots match the native fingerprints. Seventy-seven repeated uses have different original binder targets and retain those targets. There are 982 recorded application conversions and 394 structurally derived uses. Seventeen damaged metadata/page cases are refused.

The model retains at most 512 header descriptions and shows four rows per page. The largest actual interface in this audit has nine entries. It reads prepared header metadata without fetching new source rows after sealing. Existing source/scope cursors, computed cuts and native packages keep their separate bounds; this is not a whole-browser memory guarantee. Source references are validated and authenticated by the existing provider before the application model is constructed.

[Production browser checks](module-use-browser.json.gz) cover nine exact source jumps, six term/type wrapper jumps, keyboard paging, retired controls, missing-code retry and four responsive theme audits with no WCAG A/AA violations. The [seven compatibility suites](module-use-compatibility.json.gz) cover existing own/source/projected/replay modules, body focus, accounting and article proof-step links. The mathematical article and blog are unchanged. No typing-preservation metatheorem, minimal interface, semantic compression or improved comprehension is claimed.

## Reproduction

From the repository root:

```sh
node scripts/test-proof-atlas-context-module-use.cjs --check
node scripts/test-proof-atlas-context-module-use.cjs --evidence
```

After a production build, serve the output and run the browser checker with Playwright and axe-core available:

```sh
ATLAS_ORIGIN=http://127.0.0.1:8877 node scripts/test-proof-atlas-context-module-use-browser.cjs
```

`ATLAS_CHROMIUM_PATH` can select an installed Chromium executable; `ATLAS_SCREENSHOTS` selects the report and screenshot directory. Existing context-module, source-context, public-packet replay and article readers remain compatibility checks. Original private proof scripts, source projects and raw native logs are not needed or published by this interface.
