# Bounded source-expression and inferred-type captions

Status: implemented for the complete and paged occurrence readers, with the finite checks below. The general geometric-language program remains active. This transport introduces no native judgment or mathematical theorem.

A caption identifies either an original source header expression or an existing inferred type in a computed namespace. These are different objects: for `p : ℝ`, the source domain is `ℝ`, while its inferred type is `Type`. For `hab : 0 < a*b`, the source domain is the proposition, while its inferred type is `Prop`. Neither the sort of a domain nor the proof role of the enclosing lambda classifies the introduced variable. Frame labels name the whole lambda or let when displaying that role.

## Origins and presentation

`public/js/proof-atlas-recorded-captions.js` defines `ProofAtlasRecordedCaption/1`. Its origin binds the packet and source graph, native evidence and type table, owner route/node, selected field and occurrence/context/role, inferred type root where applicable, and original recording. A parent's body and a child's conclusion keep different identities even when their source routes coincide. Equal text or a shared DAG node is insufficient for attachment.

Construction-component captions describe the existing kernel observations. Separately recorded position captions retain the position's original observation, including its original argument/Meta provenance where applicable. They do not become kernel argument-type observations or acquire a construction. The separate Meta argument action keeps its existing interface. A typed boundary can therefore show its recorded type while still reporting that its construction rule is unavailable. An unrecorded source position gains neither a captioned type nor a construction.

Text is limited to 240 Unicode scalar values and 512 UTF-8 bytes, including an explicit truncation marker. The whole envelope has a 2,048-byte limit. Native text may already contain omissions or an unreduced motive; the transport neither normalizes nor supplies prose explanations. Constructor summaries are explicitly labelled. The renderer preserves line breaks, keyboard source/type controls, zoom/pan and exact occurrence selection.

The producer adapter in `captions.cjs` accepts an already validated native case and an explicit loader of compiled native-evidence bytes. Each source header is compared with the original evidence hash, source node, exact field route, pre-binder context and structurally identical source expression. One decoded native archive is retained at a time; each input is capped at 64 MiB. Complete source/type/native references remain separately resident offline. These input and output bounds are not a whole-process memory bound.

## Optional delivery

Paged construction records reference separate immutable `.caption.gz` packages. Reading a source/construction/type record does not load a caption. The cursor holds at most one decoded caption package, bounded by 16 KiB. Presentation visits points by their exact recording owner so a valid cut needs at most one caption fetch per represented recording. This changes delivery order only; diagram order and source geometry are unchanged.

`public/js/proof-atlas-construction-captions.js` validates the source route/node/context/role, evidence identity, type table/root and recording query/stage against the selected cut. It produces a sealed annotation map bound to that exact scene, under a separate 256 KiB metadata limit. Both reader modes use the same provider and annotation rule. Source/type controls and structural previews remain usable when optional code, caption bytes or caption origins fail. Caption retry does not replace the cut or selected type. Retired views cannot be restored by a late caption response.

The consumer derives expected origins from authenticated records. Digests and transport checks do not independently prove native-archive membership, pretty-printer correctness, semantic equivalence or human comprehension. A re-authored producer and manifest could change presentation text; these are not portable kernel certificates.

## Finite checks

The current inventory has 26 profiles, 2,442 recorded positions, 1,084 constructions and 269 context-frame starts. Caption data retain all 2,442 recorded position texts, 3,312 construction type components and 269 source headers. The position texts include 54 explicitly labelled constructor summaries and 173 budget truncations; the construction components include 60 summaries and, with the headers, 338 truncations. The largest observed envelope is 936 bytes.

`node scripts/test-proof-atlas-recorded-captions.cjs` compares production caption files with original accepted native records and exact source headers. It checks foreign attachments/archives, changed origins/envelopes, equal text at different origins, Unicode boundaries and unchanged source packets.

`node scripts/test-proof-atlas-construction-captions.cjs` checks every recorded construction and context-frame start, all 1,358 recorded-only positions and 24 grouped-application cuts. The finite comparison contains 16,884 caption appearances, checks unchanged geometry and refuses 5,470 cloned/foreign scene presentations. It fetches 8,778 caption packages against an 8,823-recording upper bound using the one-package cache; the largest presentation is 47,326 bytes. Separate altered-caption controls retain usable core construction records. An unrecorded-root control stays without typing.

`node scripts/test-proof-atlas-recorded-captions-browser.cjs` compares finite genuine envelopes under Node and browser WebCrypto, with separate Unicode controls. It is an engine-parity check.

`node scripts/test-proof-atlas-construction-captions-browser.cjs` uses the normal production files: all 26 paged profiles, both modes for both Riccati packets, 124 exact caption comparisons and source selections, type/source jumps, a genuine application group, missing code/data and retry, a late response, same-document mode transitions and eight accessibility audits. The paged interactions request no complete source/native archive. These are finite correspondence and interaction checks, not proof completeness or measured comprehension.

For browser commands set `ATLAS_ORIGIN` to the production preview and provide the usual Playwright/Chromium environment. The production publisher is reproduced with `node scripts/build-proof-atlas-construction-pages.cjs --check`. Original source/native archives and prior immutable assets are retained.
