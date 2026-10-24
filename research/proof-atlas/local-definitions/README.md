# Local-definition interfaces and composition

Experimental general-language rule. The models are in the repository; the browser prototype is local and is not integrated into the public reader. The geometric-language program remains active.

For an original `let x : A := v; b`, keep five separate objects: declared expression A in Γ, value v with its own recorded type B in Γ, context extension x:A:=v, body b with recorded type C in Γ+x, and the whole let with recorded result type R in Γ. The binding is a context extension, not an invented source occurrence or variable typing judgment. Value, type and proof labels come from the value's own native record. They cannot be copied from the whole expression.

`public/js/proof-atlas-local-definition-unit.js` constructs this interface from an accepted native case and an explicit caption adapter. A and B may share a formula display only when structurally equal in the same original context; both formal ports retain their separate origins. Merely convertible expressions remain separate. C and R remain separate because their contexts differ. Original type/value/body regions and one let constructor partition the selected source subtree exactly.

`public/js/proof-atlas-local-definition-frame.js` composes consecutive let interfaces through the existing context-frame model. The parent's body and the child's whole expression must identify the same packet-bound occurrence, node, context and role. Their recorded types must agree structurally across the two construction-owned tables. Both native origins remain distinct. No rewriting or combined reduction is performed. The model has an eight-unit/512-KiB metadata bound; unsupported rules or unavailable/incompatible records stop composition explicitly.

The composed source partition is the context frame's disjoint cut: n retained lets, 2n header regions and one final body region. Whole-unit subtrees overlap and must not be summed. A continuation retains its exact original route, context and evidence boundary. Chunk navigation does not establish a new typing judgment or a semantic proof module.

`public/js/proof-atlas-definition-frame-delivery.js` checks the optional generated metadata contract. A catalog contains at most64 starts and at most256KiB; each four/eight-unit chunk is independently hash/size bound and capped at512KiB. The local viewer retains one frame payload, a catalog and scalar navigation addresses. These are component/cache bounds, not a whole-browser RAM guarantee. Hash correspondence and the delivery validator do not rerun Lean or independently prove the producer's claims.

## Finite evidence

- Current corpus:60 recorded lets across9 of26 extraction profiles. All60 values are proofs. This is not all let occurrences or complete type/construction coverage.
- Owned core calibration:34 selected let positions in25 declarations, with22 value-valued, six type-valued and six proof-valued definitions. In ten cases the value role differs from the whole-expression role. Mixed chains contain type, value and proof definitions in succession. These declarations are finite controls, not an independently generated AI benchmark or a complete inventory of every helper in their module.
- Both sharing policies are checked for94 selected definitions. Frames are checked at budgets1,2,4,8. The two JavaScript entry modes are compared on the mixed chains.
- A shared source DAG node used in two different contexts retains different routes and binder targets. A cross-context unit graft is rejected.
- Local corpus composition recovers a30-definition chain in four chunks at budget8 and eight chunks at budget4. Starts along that chain overlap; they are not independent proofs.

The calibration fixture contains only compiled source/type records and a native extraction attestation. Its descriptor binds source, compiled module, driver and native-result hashes from the completed core-only Lean4.33.1 extraction. The test verifies file hashes, adapter/environment scope and recorded correspondence. It does **not** compile those declarations or rerun the kernel. Original private mathematical source projects, scripts and logs are not part of the fixture.

Run from the repository root:

```sh
node --max-old-space-size=4096 scripts/test-proof-atlas-local-definitions.cjs
```

The report defaults to `/tmp/atlas-local-definitions.json`; `ATLAS_LOCAL_DEFINITION_REPORT` may select another path. Existing occurrence-type and recorded-context regressions remain separate checks.

## Remaining work

Integrate the interface and composition views through the reader's existing bounded source/type cursors. The local browser projection currently uses offline-produced optional metadata. General mixed introduction/definition units, broader native evidence coverage, explicit introduced-variable witnesses and proof-inspection user tasks remain open. No general typing-preservation theorem, semantic compression or human-comprehension improvement has been established. Keep routine implementation and execution records outside the research blog.
