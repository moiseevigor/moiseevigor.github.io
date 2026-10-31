# Lexical context projection at a selected region

The compiled-interface reader can project a selected expression region into a smaller lexical context without loading a complete projected graph. The operation is optional and uses the same constructor fields and original binder portals. It is available in the 88 closed components of eleven recorded interface plans: seven Riccati plans and four plans for the separately attributed released AI-source proof. These are two original declarations, not 88 independent proofs.

In the Riccati `promote-10` interface, choose **Remaining body**, then its **fn** field, then **Project into required lexical context**. The selected region retains two of twelve enclosing context entries. Its 1,436 expression occurrences are unchanged. Other regions need their complete context: the remaining body of that same interface retains all twelve entries after header dependencies are included. This is context reduction at a selected subtree, not compression of the whole proof.

## Rule and geometry

The selected occurrence owns an ordered directory of its enclosing lambda, Pi and let binders. An entry's type and a let's value use the context strictly before that entry. Exact nonzero de Bruijn coefficients of the selected term seed the retained set. A descending pass adds every earlier entry referenced by a retained header's type or value. Retained lets stay definitions. The operation does not seed an inferred type for the selected descendant; no such type is invented.

For original context depth `d`, retained outermost-first slots `K`, and `c` internal binders, a variable index `i<c` stays `i`. Otherwise its original context entry is `s=d−1−(i−c)`. If `s` has position `q` in `K`, the projected index is `c+|K|−1−q`; an absent required slot is rejected. Header fields use their own original depth and the strictly earlier retained prefix. Only binder bodies increment `c`; domains and let values do not.

The reader draws one projected constructor and at most three ordered child fields. Solid connections are constructor fields. Original and projected indices are shown together at variables. Retained context entries are paged four at a time. **Inspect projected type/value** applies the same rule in the header's earlier prefix. **Open original constructor/binder** follows the exact original occurrence; **Return to region** returns to the selected source cut. It does not silently keep a derived selection as an original one.

The `region-context-projection` address identifies the original selected region, coefficient/native owners, retained slots, a term or header-field part, a relative field path and the exact original expression. Internal projected binders and external retained entries remain distinct. A source row reused under two contexts does not identify one binder. No name matching, proof-step heuristic or article index is used.

The earlier [ordered closure theory](../context-closure/README.md), [structural projection laws](../context-projection/README.md) and [projection/substitution compatibility laws](../projection-substitution/README.md) describe the reference operations. The new JavaScript implementation is checked finitely against independent complete-graph references. It does not acquire a general implementation proof from those theorems.

## Coverage and limits

An independent fixed-point closure oracle checks 924 selected regions across all 88 components. It uses complete compiled graphs and independently computed support, separately from the paged consumer's descending pass. The census includes 22 regions chosen inside the two proof bodies, alongside constructor, header and whole-root selections.

| Finite check | Result |
|---|---:|
| Selected regions | 924 |
| Projected term cuts | 5,488 |
| Retained headers | 2,099 |
| Projected header-field cuts | 3,128 |
| Displayed changed term / header indices | 100 / 8 |
| Regions with fewer context entries | 273 |
| Nonempty contexts with no reduction | 563 |
| Empty original contexts | 88 |
| Entries added through header dependencies | 80 |

These counts include repeated source syntax in different plans and contexts. They are not independent theorem counts, a corpus-wide reduction rate or measured human comprehension. All original coefficient rows were audited in the earlier [region-boundary package](../region-binding-ports/README.md); the new census does not claim to enumerate every expanded occurrence.

The browser checks 22 proof-body regions in all eleven plans, projected variable references and original binder/header navigation. Type and let-value previews retain their header-field parts. Separate controls check stale handlers, corrupted coefficient data/retry and release while a real page request is pending. Four desktop/phone, light/dark layouts check keyboard access, overflow and accessibility. Six predecessor browser suites and the original component-page model checks run with output paths redirected; their assertions and frozen evidence remain unchanged.

The optional view retains one context directory with at most 512 entries, at most 512 header records and first-retention witnesses, and at most 4 MiB of serialized header/witness metadata. It keeps one projected cut with at most four vertices; paths are bounded at 512 fields. Constructor and coefficient providers each retain 64 rows and two index pages, with one active operation and only the latest pending request. Headers use their captured row addresses, avoiding repeated traversal of the selected source path during closure. No complete projected expression table or occurrence tree is built. Input manifests, source pages, current DOM/JSON text and transient copies have separate residency; these are component limits, not a total-browser memory theorem. The finite census reaches 25,673 header/witness bytes and the 64-row/two-index cache limits. It does not exercise the maximum 512-entry context.

Unresolved or missing data, mismatched owners, invalid fields, exceeded bounds and cancelled/disposed views are unavailable. Native typing stays attached to the original closed component records. Every projected term and header field is explicitly **typing unavailable**, even if its original component had native evidence. This is not an arbitrary typed graph-region module, a minimal set of mathematical premises, semantic compression, a general evaluator/codec refinement or a comprehension result. Original private proof scripts are not included. Blog and public deployment are unchanged.

## Reproduction

From the repository root:

```sh
node --max-old-space-size=2048 research/proof-atlas/region-context-projection/check.cjs --check
```

After an actual production Jekyll build, serve `_site_production` and run the browser checks with Playwright/axe-core available through `NODE_PATH`, `ATLAS_ORIGIN` for that server and `ATLAS_CHROMIUM_PATH` for Chromium:

```sh
node research/proof-atlas/region-context-projection/check-browser.cjs
node research/proof-atlas/region-context-projection/check-compatibility.cjs
node research/proof-atlas/region-context-projection/check-production.cjs
node research/proof-atlas/region-context-projection/evidence.cjs --check
```

Development browser runs set `ATLAS_DEV=1`, write only private temporary records and explicitly report source overrides. They do not establish a production build. A fresh timestamped production build needs fresh browser records. Generated technical records may be copied and checked byte for byte after the build; application HTML, JavaScript and CSS must come from the actual build.
