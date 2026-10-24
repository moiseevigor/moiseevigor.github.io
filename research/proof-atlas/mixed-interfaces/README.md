# Mixed introduction / definition interfaces

[Rule specification and connection semantics](rules.md).

Local next-rule experiment. It reads the released PR122 compiled records and canonical let-interface model. PR122 is deployed; the mixed-rule experiment does not change the public reader or blog.

## Constraint found in the recorded corpus

The26 extraction profiles contain209 recorded lambda introductions. All209 recorded result types have a Pi root; their domains match the source lambda domains, and the recorded expected body components match the Pi codomains. Actual inferred body types match those codomains structurally in202 cases. The other7 have recorded successful kernel body conversions.

Thus the rule must retain actual body type C and expected Pi codomain D separately, with the native conversion C ≡ D. Replacing D by C as if their syntax always agreed is refuted by7 finite examples, including Riccati and crossing positions. Whole lambda roles are197proof/12value; the introduced variable's role cannot be copied from that classification.

The original source domain A also differs structurally from its own inferred type in all209 cases. A source-domain port and a type-of-domain port are different objects.

## Prototype contract

`model.cjs` adds an introduction interface alongside the canonical let interface. It retains source domain A, inferred type of A, source body b, actual inferred body type C, expected codomain D, and the whole lambda's result type R. The context extension is an assumption declaration with no newly invented source occurrence or native variable judgment.

The expected D port retains the exact native `expectedBody` component root, interpreted in the original extended source context. A separate codomain port retains R's actual type-expression descendant at its exact codomain path, under a type-local Pi binder. These are separate objects even when their syntax or table node IDs coincide. Both retain the native evidence/table and original recorded owner; the codomain also retains its enclosing recorded type root and type route. Neither acquires an additional typing judgment. A table/root ID alone cannot identify its original context.

The source lambda binder and the computed Pi binder are explicitly linked by a correspondence, and remain in different namespaces. Their original positions, owner record, contexts and binder payloads are retained. Actual body typing and the native expected component use the original extended source context; the observed Pi codomain's type-local binder is related through that correspondence. The model keeps actual body type, expected native component and observed type codomain as separate ports. Exact native component roots are retained independently of structurally equal Pi subexpressions. No scope objects are identified from equal text or node IDs.

Mixed frames use the existing source context-frame cut and compose only at identical source body/next-whole positions with matching original context, role and **actual** recorded types. The expected codomain D is never substituted for the actual body judgment at a join. Header counts depend on the source rule: one domain for an introduction; type and value for a let. All retained constructors, disjoint headers and final body account for the selected original subtree exactly. Whole-unit subtrees overlap and are not added.

## Finite check

From the repository root:

```sh
node --max-old-space-size=4096 research/proof-atlas/mixed-interfaces/check.cjs
```

`verification.json` records26profiles,269starts,807frames at budgets1/4/8,71mixed frames,1639joins,209distinct introduction positions and60let positions. Seven actual/expected codomains differ structurally. The largest frame metadata is132,486bytes under the512KiB cap. Refusal checks cover wrong context, invented variable roles, source/computed namespace confusion, wrong recorded owner, domain/type aliasing and changed occurrence accounting. Starts and frames overlap; these are not807 independent proofs.

Complete source/type tables and cached unit metadata remain offline inputs. The bounded output does not establish a paged browser or total-process memory bound. Broader introduction calibration under shadowing/shared contexts, visual integration, general preservation arguments and user inspection tasks remain to do. The bounded cursor adapter below is a separate implementation; its own evidence does not give the complete model a memory bound. The7 conversion cases are preserved in the retained local probe report. No new native extraction or semantic/comprehension result is claimed.

## Original versus computed binder correspondence

`check-correspondence.cjs` checks de Bruijn indices independently of the frame builder. The recorded expected D is interpreted in original Γ+x, while the observed codomain belongs below a computed Pi binder in R. For a variable below t additional local binders, index t selects the original x on one side and the computed Pi binder on the other. An index greater than t selects the same original Γ ordinal after accounting for the extra Pi binder. Nested domain and let-value fields do not acquire their own binders.

The finite audit checks209introductions,127984memoized scope states,341introduced-binder states,3696outer-context states and5110inner-binder states. In123introductions, D and the observed codomain share the same table root while references to the introduced binder use different namespaces. Shared graph IDs therefore cannot identify the original source binder with the computed type binder. This audit memoizes repeated node/depth states; it does not enumerate all expanded occurrences or establish a general preservation theorem.

## Rechunking law and conversion-sensitive joins

`check-composition.cjs` compares the same eight-unit prefix split as4+4 and1+3+4. Across303starts in26corpus+25calibration profiles,606partitions retain identical units, final boundary, disjoint header/body regions and exact occurrence accounting. The1126chunks include90mixed partitions and520seams; seam types keep their distinct native origins. A parent subtree and its child are not summed as disjoint regions.

Two of the seven actual/expected type differences have a recorded next construction at the body: two published crossing positions, each followed by a Pi application. In both, actual body type C matches the next recorded conclusion structurally, whereas expected D does not. Composition must use C and keep C ≡ D as a separate recorded conversion. This is a finite counterexample to joining through D as if it were the actual body judgment; the next application is still outside the mixed context-frame rule.

The local paged implementation is `cursor.cjs`; `check-cursor.cjs` compares it with the complete model using the released compiled source, native and type pages. It uses released source/native/type cursors and one64-node scratch type page, with a65536syntax-pair comparison cap and no complete-archive fallback. Successful output is limited to8units/512KiB. The completed paged comparison passes909frames from269corpus+34calibration starts across51profiles, with71mixed frames and1657joins. All seven actual/expected differences remain separate. Under one-page test caches, observed peaks are256source nodes and64scratch type nodes; zero complete archives are requested by the candidate. Its largest frame is132486bytes. The report is `cursor-verification.json`; a process or report marked RUNNING would not establish this result.


## Reproduction and status

Run each audit from the repository root:

```sh
node --max-old-space-size=4096 research/proof-atlas/mixed-interfaces/check.cjs
node --max-old-space-size=4096 research/proof-atlas/mixed-interfaces/check-correspondence.cjs
node --max-old-space-size=4096 research/proof-atlas/mixed-interfaces/check-composition.cjs
node --max-old-space-size=4096 research/proof-atlas/mixed-interfaces/check-cursor.cjs
```

The tests use committed compiled inputs, not original mathematical source projects. The complete audits load their explicit source/type graphs. The paged audit's reference side also loads complete graphs; its candidate side receives only allowed page URLs and one-page cursors. Cache limits describe that candidate component, not the memory of the whole comparison process or browser. Reports are written beside the experiment; the verification manifest binds exact code, input-manifest and report hashes.

The reader deployed by PR122 continues to show local definitions. This candidate mixed rule has no public view or UI evaluation yet. It supports recorded introductions whose result has an observed Pi root, with structurally matching domain and source/Pi binder payloads. Other result shapes, changed binder presentation, missing captions or absent records require an explicit unavailable boundary rather than an inferred match. In particular, agreement on the209current introductions is not a claim that these restrictions hold for all Lean lambdas. Expected D and the observed codomain remain expression ports, with no new typing judgment. Explicit introduced-variable witnesses, generic elimination interfaces and measured proof-inspection tasks remain open. The research goal stays active. No blog entry is added for this local experiment.
