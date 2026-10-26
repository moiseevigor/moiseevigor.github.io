# Mixed interfaces in the existing proof reader

The integrated candidate uses the same source inspector, recorded-type geometry, original occurrence history and complete/paged loading switch as the existing reader. Select **Typed interfaces → Introductions + definitions**, or use `?view=occurrence&loading=paged&diagram=construction&group=interfaces`. Four units form the default chunk; eight is the maximum. The **Local definitions** option and `group=definitions` retain the definition-only rule.

An introduction displays source domain A and its recorded inferred type, the original context extension, actual body type C and whole-expression result type R. Expected D is an expression port with its native owner and original extended context, not an additional typing judgment. The codomain button opens the exact descendant inside the recorded type R. Its computed Pi binder stays distinct from the original source lambda binder. The binder-correspondence control exposes both origins. No introduced-variable typing judgment is invented.

Definitions use the existing value/A/B/context/body/result interface. Both rules join through the actual source body and recorded type, preserving the parent's body-type origin and the child's conclusion-type origin. The C ≡ D conversion is separate from this structural join. Source ports update the ordinary inspector; type ports open their own recorded components. Missing or unsupported records keep original source navigation and an explicit boundary.

`public/js/proof-atlas-mixed-interfaces.js` is the complete-reader model; `public/js/proof-atlas-cursor-mixed-interfaces.js` reads bounded source/native/type pages. Their frame data are compared with the retained reference model. Expected/codomain expression fields are refused by the typing API; the codomain geometry is navigation inside R's existing typing record. The candidate's scratch type cursor retains one64-node page, comparisons stop at65536pairs and metadata is limited to8units/512KiB. These are component bounds; the reference audit loads complete graphs and does not measure whole-browser RAM.

The view is `public/js/proof-atlas-mixed-interface-view.js`. A source-root or mode transition retires the previous construction view before asynchronous loading. Old DOM controls cannot apply to the new frame. The remaining-body link navigates to its exact original route; chunk headers and final body partition the selected source region without adding overlapping whole-unit subtree counts.

## Checks

From the repository root:

```sh
node --max-old-space-size=4096 scripts/test-proof-atlas-mixed-interfaces.cjs
node --max-old-space-size=4096 scripts/test-proof-atlas-cursor-mixed-interfaces.cjs
node --max-old-space-size=4096 research/proof-atlas/mixed-interfaces/check-correspondence.cjs
node --max-old-space-size=4096 research/proof-atlas/mixed-interfaces/check-composition.cjs
```

After a production build, run `scripts/test-proof-atlas-mixed-interfaces-browser.cjs` with the existing Playwright/axe dependencies and `ATLAS_ORIGIN`. Its default audit checks all269 recorded corpus starts, both Riccati snapshots in complete mode, source snapshots and native origins, codomain cuts, distinct C/D cases, exact joins, continuation/history, mode changes, phone/desktop themes, optional failures and stale/retired interactions. The optional `ATLAS_MIXED_INTERACTIONS_ONLY=1` run writes a separate focused report with `fullCorpus:false`; it does not establish corpus coverage. Existing definition, context-frame, construction, application and source-window browser regressions remain separate.

This is finite recorded source/context/type correspondence. The reference controls include value-, type- and proof-valued definitions. Broader introduction calibration, other result shapes, generic elimination interfaces, deeper compact addressing, general preservation and measured inspection benefits remain open. Current source/Pi domain and binder-payload restrictions are explicit in [the rule specification](rules.md). The program remains active. No new native kernel judgments, original private source publication or blog result is claimed.
