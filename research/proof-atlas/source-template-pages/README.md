# Paged source-specializing interfaces

This reader applies the [recorded source-lambda rule](../source-template-inputs/README.md) to the existing bounded function inspector. Choose **Source-specializing inputs** in the [paged network reader](/projects/proof-atlas/manual/paged-network/#ns-lab), then **All boundary positions** for the Riccati example. The other two policies retain their separate recorded functions.

## Visual rule

An independent input is a parameter with a domain. A derived input is a local definition with a domain and a value. A result is a separate local computation. These three roles retain distinct labels and constructor fields; a derived value is not presented as a supplied assumption.

Stable binding keys identify the declarations across the two list orders. **Port creation order** follows the recorded construction sequence, not tactic lines or execution history. **Computed declaration order** is the final dependency order. Changing the list order does not change the inspected expression or original source port. The Riccati record moves the definition associated with source input `77:4` after the new input `78:3` on which it depends.

Each derived definition offers its original value, specialized value, original domain, source-recovery equality and witness as separate components. These observations belong to the original source context. The definition inside the final function belongs to its actual preceding declaration context, which can differ from the context used when the native assignment was recorded. The reader does not relabel one context as the other.

Three source lambdas additionally expose their complete original function, rebuilt function and captured source values. A captured-value correspondence is a recorded constructor rewrite, not an original application-use edge. Selecting a capture identifies its stable binder key in the computed function.

Selecting an original result or inventoried input in the source graph selects its exact rebuilt value or input occurrence in the function. The application spine retains every supplied position, including types and instances. A computed counterpart has a separate manifest, native case and component route; it never acquires a source occurrence. An unrecorded source selection clears the preceding computed field. The binding list shows four entries at a time; recovery observations load through the same page cursor.

## Evidence and scope

The [evidence bundle](evidence.json.gz) records hashes for the native inventory, executed checks, production runtime and screenshots.

- [Frozen native result](../source-template-inputs/verification.json.gz): 30 fixed region/policy candidates; 23 derived positions, three source lambdas and one declaration permutation. The Riccati all-position interface retains `J,p`, with 17 independent inputs and 18 derived positions, without adapter assumptions. This delivery extension adds no native judgments.
- [Independent page and notation comparison](model-check.json.gz): 281,933 rows, including all 281,866 unchanged original function rows; 424 component roots; 2,652 lexical cuts; 339 exact source-port counterparts. All 207 variable counterparts resolve to the intended lexical declaration; the other 132 are fixed source positions. Counts overlap across the three policies.
- The same comparison checks 669 complete-table versus paged notation scenes and 117 refusal/lifecycle cases. The page consumer retains at most 64 rows and two index pages. Its separate notation cache retains at most 8,192 rows / 4 MiB of decoded rows, and the existing notation scene limit remains 192 objects. Offline reference checks retain complete graphs; these are component limits, not a whole-process heap bound.
- [Recorded environment comparison](notation-environment.json.gz) binds the existing literal notation signatures to the new native inventory using the recorded compiler, shared-library, support-module and 26,070 compiled-file identities. [Compiled dependency metadata](constant-data.json.gz) are published without source projects or binary caches. This compares stored identities; it is not a new kernel replay or signature export.
- [Production browser replay](browser-check.json.gz) checks source/result selection, recovery fields, captured binders and declaration order through the actual interface. [Prior model checks](compatibility-models.json.gz) and [prior browser checks](compatibility-browsers.json.gz) retain their existing assertions and redirect only new reports and screenshots; historical reports remain unchanged.

Keyboard Enter/Space paging preserves the inspected address. Native-dropdown keyboard operation remains unverified in the macOS headless browser: the same key sequence also failed to change a plain HTML select without application scripts. Four theme/layout axe checks report no WCAG A/AA violations; they are not a complete accessibility assessment.

No general higher-order matching theorem, minimal interface theorem, arbitrary-eliminator coverage, semantic compression or improved human comprehension is established here. Native source recovery and page/notation equality remain distinct evidence. The examples include two corpus regions and eight authored controls; they are not a representative benchmark of massive AI proofs.

## Reproduction

From the repository root, with Node supporting `fetch`, `Response` and `DecompressionStream`:

```sh
node research/proof-atlas/source-template-pages/pack.cjs --check
node research/proof-atlas/source-template-pages/registry.cjs --check
node research/proof-atlas/source-template-pages/check.cjs --check
node research/proof-atlas/source-template-pages/check-compatibility.cjs --models-only
```

`pack.cjs` checks the frozen parent reconstruction before producing content-addressed pages. Original native graph rows and IDs remain an unchanged prefix; only required original-context observation rows are appended. Content-addressed storage reuses existing pages and keeps the earlier protocols available. Every component records its actual native graph/root owner. The browser authenticates decoded assets and checks selected constructor paths and lexical references; it does not run Lean.

Build the production site and serve `_site_production` over HTTP. With Playwright and axe-core available to Node, run:

```sh
ATLAS_ORIGIN=http://127.0.0.1:8877 node research/proof-atlas/source-template-pages/check-browser.cjs
ATLAS_ORIGIN=http://127.0.0.1:8877 node research/proof-atlas/source-template-pages/check-compatibility.cjs --browsers-only
```

`ATLAS_CHROMIUM_PATH` can select an installed Chromium executable. These checkers compare served runtime and HTML bytes with the actual production output. Their reports are technical reproduction records, not new mathematical results. After replay, `node research/proof-atlas/source-template-pages/verify.cjs --write` binds them to the current source and production bytes; omit `--write` to compare with the saved bundle.
