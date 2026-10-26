# Reference laws for boundary projection

The boundary reader separates function heads, recorded proof arguments and other arguments. Its source pool groups proof-valued positions while retaining each original use. The [reference model](Boundary.lean) makes the preservation laws independent of the particular finite examples used to test the reader.

## General result

For any finite original table, arbitrary payload type and source-key type with lawful equality, Lean checks:

- The three position lanes are a permutation of the original positions, without repetition. Every position occurs exactly once.
- The proof pool contains exactly the positions carrying the supplied proof label, including proof-valued function heads.
- Every proof-labeled position belongs to exactly one source bucket. Two proof-labeled positions share a bucket exactly when their supplied source keys agree. Bucket uses retain their original order.
- Dereferencing the projected positions against the immutable original table recovers the complete ordered cells, including arbitrary payloads.

Source keys are ordered by first appearance among proof arguments followed by proof-valued heads. Uses within each bucket are ordered by original position. These are separate orders. A source may occur in both roles.

Recovery requires the original table. This is a reference-preserving projection, not a self-contained archive or a proof of lossless compression without external storage.

## Connection to the reader

The [encoder](export-cases.cjs) reads the pinned compiled pages through the bounded runtime sessions. It independently constructs original cells from each region's raw ports. Each cell retains its original slot, recorded role, fully qualified original source key and opaque JSON metadata. The source key includes packet/declaration hashes, occurrence route, original binder or producer identity, original context, native owner and finite inventory identity. Printed type text is never the source key.

The runtime supplies the projected references and source groups. The [verification driver](verify.py) interns complete source keys into a per-case dictionary using exact string equality, retaining the full strings separately. Lean checks the resulting numeric keys. This coding step and JSON parsing remain external to the theorem; key hashes are not used for equality. Metadata strings are opaque constants during the finite projection check.

The driver emits closed Lean equalities between these encoded outputs and the reference projection. Each equality is proved using ordinary `decide`; recovery follows from the general theorem. The driver checks every theorem's transitive axioms and rejects evaluation oracles and `sorryAx`. For deliberately damaged projections it kernel-checks the inequality, then separately requires Lean to reject an attempted equality proof. Cases run sequentially with one compiler thread and a 2,048 MiB compiler memory limit. These are configured component limits, not a total process-memory measurement.

The [machine-readable report](kernel-check.json.gz) records individual case identities, table/output hashes, theorem names, producer and loaded-asset hashes, axiom dependencies and negative controls. Generated closed cases and compiler logs remain in the temporary reproduction directory; they are regenerated from the pinned public compiled data. No private proof script or raw native execution log is added.

The finite bridge covers all 106 selected native cuts across 42 profiles, three source-only cuts and two authored scalar controls. A separate 512-position scalar certificate exceeds the configured compiler memory limit and is **not certified**. This is a limit of the closed decision procedure under that budget, not a counterexample to the general theorem or a runtime-reader memory measurement. The failed case remains in the reproducible input and report.

The completed check contains **23 general theorems and 111 projection/recovery certificate pairs**, covering 1,065 position appearances. Transitive axiom inspection finds `propext`, `Quot.sound` and `Classical.choice`; the latter occurs in two general proof-pool lemmas through the standard list library. Eight damaged projections have kernel-checked inequality certificates: a dropped head, duplicate head, proof argument moved to the other lane, wrong source key, merged shadowed sources, reordered source uses, value classified as proof and proof head omitted from its source pool. These mutations keep the original input table fixed.

Reproduce from the repository with:

```sh
python3 research/proof-atlas/boundary-kernel/verify.py
```

The driver requires Lean 4.33.1 and Node. It imports only `Std` for the reference model and `Lean` for axiom inspection. It does not restore Mathlib or the original research modules. An alternative Lean executable can be supplied with `--lean`.

## Scope

The general theorem assumes the table, roles and source keys. It does not prove that native extraction assigned them correctly. The finite certificates check encoded runtime outputs; they do not prove all executions of the JavaScript implementation or correctness of the encoder itself. Artifact hashes bind the supplied inputs to the recorded corpus, while the earlier [native and runtime checks](../rule-support/README.md) provide separate evidence about those inputs.

In source-only cases, the model can partition recorded positions, but the reader's native proof counts remain unknown. No proof label is inferred from missing evidence.

The result supplies a general preservation rule for a visual abstraction. It does not prove common-context typing, mathematical premise necessity, graph quotient acyclicity, semantic compression or improved human comprehension. Those require separate evidence. There is no new visual design or research blog claim in this record. The general program remains active. This work is local and unpublished.

The [local presentation check](presentation-check.json.gz) covers the built program link, keyboard access, desktop/mobile layouts in both themes and byte-for-byte evidence/source downloads. The production site was built before the final report/source refresh; those static reference files were then copied to the local built preview. Application assets remain the production-build outputs and are compared with their recorded hashes. This is not a public deployment.
