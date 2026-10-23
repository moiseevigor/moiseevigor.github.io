# Bounded source-expression and inferred-type captions

Status: experimental transport and producer adapter. The existing manifests and reader do not yet carry these captions. This work is separate from PR120's recorded Riccati context extension. It introduces no native judgment or new mathematical result.

A caption identifies either an original source header expression or an existing inferred type in a computed namespace. These are different objects: for `p : ℝ`, the source domain is `ℝ`, while its inferred type is `Type`. For `hab : 0 < a*b`, the source domain is the proposition, while its inferred type is `Prop`. Neither the sort of a domain nor the proof role of the enclosing lambda classifies the introduced variable.

`public/js/proof-atlas-recorded-captions.js` defines `ProofAtlasRecordedCaption/1`. Its origin binds the packet and source graph, native evidence and type table, construction route/node, selected field and occurrence/context/role, inferred type root where applicable, and original recording. A parent's body and a child's conclusion keep different recording identities even when their source routes coincide. Equal text or a shared DAG node is insufficient for attachment.

Text is limited to 240 Unicode scalar values and 512 UTF-8 bytes, including an explicit truncation marker. The whole envelope has a 2,048-byte limit. Native pretty-print text may already contain omissions or an unreduced motive; this transport neither normalizes nor supplies a prose explanation. Constructor summaries are explicitly labelled. The first adapter covers kernel observations; separate Meta observations keep their existing interfaces and have no caption from this adapter.

The producer adapter in `captions.cjs` accepts an already validated native case and an explicit loader of compiled native-evidence bytes. It checks each source header against the original evidence hash, source node, exact field route, pre-binder context and structurally identical source expression. One decoded evidence archive is retained at a time; each input is capped at 64 MiB. Complete source/type/native inputs remain separately resident in this offline adapter. The caption bounds are not a whole-process memory bound.

The consumer must derive the expected origin from its authenticated construction record, rather than trust an origin supplied with arbitrary text. Digests and transport checks do not independently prove native-archive membership, pretty-printer correctness, semantic equivalence or human comprehension. A re-authored producer and manifest could change presentation text; this module is not a kernel certificate.

## Reproduction

`node scripts/test-proof-atlas-recorded-captions.cjs` compares emitted captions with all existing immutable construction records. It covers 26 profiles, 1,084 constructions, 3,312 inferred components and 269 original headers. It checks foreign attachments and archives, changed origins and envelopes, equal text at different origins, Unicode boundaries and unchanged source packets. No existing public asset is rewritten.

`node scripts/test-proof-atlas-recorded-captions-browser.cjs` compares finite genuine envelopes under Node and browser WebCrypto, with separate Unicode controls. Set `ATLAS_ORIGIN` to an existing production preview and provide Playwright/Chromium through the usual test environment. This is browser-engine parity, not reader integration or an accessibility/comprehension result.

Next integration work is to carry optional captions in paged construction records, validate them against their original component interfaces, and display source expressions separately from inferred types in both reader modes. Missing captions must leave geometry, recorded judgments and source/type navigation usable. No complete native archive should be fetched by the paged browser for presentation.
