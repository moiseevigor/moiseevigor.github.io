# Recorded constructions in ordinary proof diagrams

Status: local research result; no new native extraction, blog post or deployment.

## Representation problem and rule

The [immediate-input records](../use-sites/README.md) identified exact typed
consumers of binder uses. Initially, the additional judgments were available
only in the binding inspector. Selecting the same application in an ordinary
library rule diagram could still show untyped source fields.

Both ordinary library readers now use the additional records in their existing
construction cuts. A native application is drawn with the same Π-input ports,
original context, source partition and conversion evidence regardless of
whether it was reached from a binder wire or selected directly. The complete
and paged readers start with the same context grouping, proof-focus policy
and explicit source fallback. Parent and operand source jumps retain their
original packet and occurrence route.

`proof-atlas-native-selection.js` defines the common selection policy.
Specialized checked projections, recursor cases, beta reductions and local
definitions retain their interpretation. Otherwise, checked introduction and
application traces precede plain term observations. Earlier generic packages
precede later supplements at an equal construction class. An original query
precedes a derived observation when neither supplies a construction. Provider
keys define this order; request completion or object insertion order does not.
The selected package and original recording query remain in every type and
construction reference. Missing-page errors propagate to the owning cursor.
Selection adds no native typing or conversion judgment.

## Finite result

All 283 immediate application sites in the two Riccati snapshots and twenty
released AI-attributed profiles have checked application frames in the ordinary
diagrams. The geometry gains **279 frames**: four sites already had application
records in the earlier public-packet replay package. Those records are retained.

The [audit](audit.json) compares 849 complete/paged cuts: one root-only cut,
an individual-rule cut and a grouped-context cut at every site. Each cut keeps
its exact source-occurrence accounting, port order and lexical interfaces.
The independent check reconstructs source spines and unfolds grouped frames;
5,709 visible context memberships are checked. Sixty-five overlapping recorded
observations have equal type expressions, roles and original contexts. At each
application site, all six type components of the chosen trace agree with the
additional native record. These are structural comparisons, not a new kernel
execution or a theorem about arbitrary future evidence.

The Riccati consumers `JacobiData.T1_T2_same_sign` and `abs_of_pos` now show
their application rules directly, including the proof input `hd : 0 < J.d p`.
They previously appeared as kernel-field layouts in this view.

## Applications of local functions and hypotheses

The sample includes 15 variable-headed applications: three in declaration
types, six in type regions within bodies and six in body-term/argument regions.
They are different occurrences even when storage is shared. Fourteen produce
values; one produces a proof. The notation uses the recorded function type,
not the presence of a declaration name, to classify the application.

For example, the proof-body occurrence e78 of `lean_workbook_plus_43987` applies
a local universal hypothesis. Its recorded function type is
`∀ (k : Fin n), ‖z k‖ = ‖omega k‖`; its argument has type `Fin n` and its result
has type `‖z k‖ = ‖omega k‖`. The diagram classifies this as ∀ elimination:
the function and result have proof roles, while the argument remains a value.
The function port retains its lexical link to the original hypothesis binder.
The selected routes, native digests and representative scenes are in the audit.

This demonstrates the existing Π rule on actual local-function occurrences in
the recorded corpus. It does not establish premise necessity, semantic
compression, general strategy recovery or improved human comprehension.

## Delivery, failure behavior and provenance

The complete source reader retains at most 32 additional queries and 512 KiB
of decoded additional evidence for the selected proof. The largest current
package is 282,255 bytes. The paged reader uses its existing LRU: at most 128
queries and 16 MiB of decoded query JSON, plus sixteen source pages/4,096 rows
in this audit. Shared type graphs have separate existing bounds. These are
cache/decoder bounds, not measurements of total browser memory. The complete
reader still loads its original source graph in full.

Rejected evidence is reported explicitly. An older usable package may still
supply a construction; otherwise, the source region remains unsupported.
Source containment does not acquire typing, and a value operand does not
acquire a proof role from its parent. Stale proof selections cannot publish
the former selection's diagram.

The additional native judgments and their cache-attributed dependency basis
are unchanged from the [native verification](../use-sites/native-verification.json).
The AI attribution is inherited from the frozen source corpus. Original private
source modules and proof scripts remain unpublished.

## Scope still open

This integration covers the ordinary complete and paged library rule diagrams
and their article application. The separate deep occurrence-window reader has
its own frozen sparse type/construction indexes; extending their union is still
required. Optional constructor-catalogue overlays in the complete reader are
separate from the primitive-cut comparisons here.

Evidence remains sparse outside the recorded sites. Local-definition aliases,
arbitrary elimination and measured inspection tasks remain research questions.
The 24 unrecorded uses and 118 source gaps in the earlier fixed use sample are
not removed by making the already recorded judgments visible elsewhere.

## Reproduction

`ATLAS_CONSTRUCTION_UNION_CHECK=1 node scripts/test-proof-atlas-construction-union.cjs`
compares a fresh finite audit with the committed record. Set
`ATLAS_CONSTRUCTION_UNION_REPORT` to write a report. This reuses authenticated
compiled records and does not import private Lean sources.

`scripts/test-proof-atlas-construction-union-browser.cjs` checks ordinary rule
diagrams for the two Riccati consumers and the universal-hypothesis example in
both readers, exact keyboard source jumps, explicit rejected evidence and
desktop/mobile accessibility in both themes. Existing source-page, native-page,
binding-input and article checks remain separate regressions.
