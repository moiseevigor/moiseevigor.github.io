# Reading a construction through its result and input uses

The compact region diagram identifies application occurrences and exact input-use wires. A name such as `Eq.mp` does not state the proposition at that occurrence. The reader now keeps a selected call's recorded result summary beside the diagram, together with navigable incoming sources and consumer inputs.

## View rule

Selecting a graph node, result portal or boundary input updates the same call readout. Reading a result brings its statement into view, including on narrow screens. Unfolding and refolding retains the active call and any existing source/computed-type selection. **Open original result** selects that call's exact compiled occurrence. An internal connection has two actions: read the original source/consumer result, or inspect its exact consumer input slot. These are different selections. A link through a recorded local definition retains its hop count and original producer/consumer contexts.

The readout preserves each input position. Repeated uses of the same producer in two slots remain two rows. Function slot zero remains a function input. The selected call's total input count is the sum of its internal input positions and its boundary positions; the existing boundary sheets retain the latter. Consumer lists describe this retained region, with inventoried outside counts stated separately. Selecting a retained call outside the region clears the region-local use lists.

At most four incoming and four outgoing positions are displayed at once. The view uses only the existing retained call records and source-use edges. It adds no type inference or source-graph fetch. Opening an original result or input uses the existing bounded inspector. The selected recorded summary is bounded by the existing 1,024-character call-summary contract; the original result/type inspector remains available for the underlying observation.

Source-only calls have no native result summary. The reader displays their original occurrence and source-use links with **per-call type unobserved**. An empty local list is not a statement that a proof has no other uses. Each call and port retains its own original context; this view does not construct a common-context typing judgment.

## Riccati case

In the seven-call Riccati region, call 75 records

    2 * √(|J.T1 p| * |J.T2 p|) ≤ |J.T1 p| + |J.T2 p|

Its result feeds input `25:4` through one recorded local definition, from original Γ10 to consumer Γ13. Call 25 also receives the equality from call 76 at input `25:3`. Reading result 25 displays the resulting inequality with the product identity substituted under the square root. The subsequent result uses are `25 → 26:4` and `26 → 27:4`; equality helpers 77 and 78 feed their third arguments. All six connections are original source-use witnesses, rather than arrows added from a mathematical narrative.

The statements are the existing native display summaries. They are not independently generated prose, normalized replacements for original expressions, or a minimal mathematical premise set. The native observation owner is `7a995a4a5559be0a3f1778357ac9a9b696cc0bf446e7513f6a3d52822035af35` in the `published-15` edition of `JacobiData.slope_bound_abs`. Complete source, native-owner and inventory identities remain in the report.

## Checks and limits

The [browser checker](check-browser.cjs) separates isolated view tests from real-reader selections. The isolated tests render all 106 selected cuts from 42 native profiles, comparing 282 native result-summary appearances. Each retained result summary, role, context and occurrence anchor is compared with its pinned native observation before rendering. Node/result selection, ordered source-use windows and exact input callbacks are checked against the original records without modifying them. A partial diamond tests outside-region selection; an eight-call source-only fanout tests paging beyond four consumer positions without inventing types.

Real-reader checks traverse the Riccati constructions through the live inventory gate and original native inspector. They check all seven results, the six original connections, two repeated input positions, the source-only boundary and stale-profile clearing. Desktop/mobile and both themes have accessibility and document-overflow checks. These are finite source/interaction tests. They do not measure improved human comprehension, proof-inspection speed or semantic compression.

- [Production-browser and native-summary report](browser-check.json.gz).
- [Existing region, proof-input, rule-head and inventory compatibility checks](compatibility.json.gz).
- [Earlier boundary preservation laws](../boundary-kernel/README.md) and [native source/role checks](../rule-support/README.md).

The production build precedes the final static report copies; application assets are checked byte for byte against the tested source. Historical reports retain their original hashes. This is a local prototype; no blog result or public deployment is claimed.

## Coverage of article-linked calls in the occurrence-type manifest

In the published-15 article index, 24 application anchors identify a callee across 16 passages. This includes the individually indexed And.intro occurrence. Matching the declaration, packet hashes, node and full occurrence path against the occurrence-type manifest gives one complete checked application trace. Two other anchors have a native declaration record without a checked trace at the selected call. The remaining 21 have no declaration entry in this manifest. Other evidence collections are outside this count.

The matched call is the AM–GM helper in the scalar slope proof. Its first two inputs are implicit real values. The third and fourth inputs, at nodes 1224 and 1226, prove nonnegativity of the two absolute values. The result is at node 1227. All four argument routes agree with their positions in the original application spine. This establishes an answer key for locating the premises of this call. Reader accuracy and search time remain unmeasured.

[Per-anchor report](article-call-traces.json) · [Reproduce from the repository root](check-article-calls.cjs)

[Open the ordered input index for all 24 calls](article-inputs.md). Reconstructing each call from its enclosing declaration gives 92 exact argument positions. Of these, 67 are direct bound-variable references, each linked to the binder at its original occurrence. The generator checks the number of intervening binding bodies against the stored de Bruijn index. In the Riccati proof this identifies J and p as the two inputs to the product identity and J, p, hab, hz1, hd and hs as the six inputs to the common-sign lemma. These links remain available when the native manifest has no type trace at the selected call. [Reproduce the index](article-inputs.cjs).

For the 25 inputs that are not direct bound variables, the reader index follows the function fields of each application to its head. This yields 22 constant heads, two bound-variable heads and one lambda. The λ links to its body, and each bound-variable head links to its binder. For the AM–GM helper, inputs 1 and 2 are headed by abs, while inputs 3 and 4 are headed by abs_nonneg. In the cumulative-count proof, inputs 3 and 4 of two_per_cell_of_ne apply the local functions hL and hR. Following only declaration names would miss these two connections. The [browser check](check-input-links.cjs) opens every link in the generated index and compares the reader selection with its edition, declaration, expression number and occurrence route.

[Follow the result of each of the 24 article-linked calls](article-consumers.md). Twenty results enter an application directly, three supply local definitions and one is the body of a lambda. Each of the three local definitions has one bound-variable use in its body. The generator counts uses by occurrence, including beneath nested binders, and resolves each use back to the exact introducing binder. For AM–GM the path goes from result 1227 through local definition 3240 to use 37 at argument 4 of Eq.mp (application 3221). This gives a source-backed answer to where this inequality is used. It measures immediate compiled uses in this article sample. Mathematical necessity and reader comprehension require other evidence.

Regenerate with `node research/proof-atlas/step-reading/article-consumers.cjs`. Passing `--json` includes the owner, packet digest, routes and node numbers.

### Can a shared application row identify its consumer?

Across all 20 Goedel sample theorem bodies, 16,240,679 occurrences are applications at the end of a function spine (intermediate function prefixes excluded). Of those, 16,236,908 occur directly in another application's argument field. This includes type, instance and value terms inside the proof body. The count describes syntax and gives no estimate of the number of mathematical inferences.

Of 80,824 distinct rows occurring at such endpoints (summed within declarations), 31,222 enter at least two different immediate parent-row/field pairs. Together these account for 7,833,155 endpoint occurrences. Selecting only the shared row therefore leaves even the immediate destination ambiguous for these occurrences. Repetitions of a single parent-row/field pair can have different enclosing routes too, so this is a lower bound on occurrence ambiguity. A folded glyph can represent a shared expression, but following a particular consumer requires a selected occurrence or a choice of destinations.

[Per-proof counts and packet identities](ai-call-destinations.json). Run `node research/proof-atlas/step-reading/call-destinations.cjs` from the repository root. The checker weights edges by path multiplicity while holding one proof packet at a time, verifies the total against the packet's expanded body size, and checks its destination counts against explicit enumeration of one bounded subterm per proof. A shared-row control exercises the same expression as both a function prefix and two separate arguments.

### How much enclosing context identifies one occurrence?

Fix a declaration and a shared application row. Restrict its candidate occurrences to endpoints of function spines inside the theorem body. Reveal the exact parent row and field, then the grandparent row and field, continuing outward. Count a selection as resolved when exactly one candidate has that suffix. An exact parent row is more specific than a displayed lemma name and argument number.

| Enclosing fields revealed | Occurrences still ambiguous, out of 16,240,679 |
|---:|---:|
| 0 | 16,206,339 |
| 1 | 16,097,207 |
| 4 | 15,472,515 |
| 16 | 5,818,631 |
| 32 | 447,890 |
| 64 | 842 |
| 69 | 3 |
| 70 | 0 |

The 20 Goedel proofs have a substantial tail of repeated contexts. Even the exact immediate parent and slot identify only 143,472 occurrences uniquely. A compact reader can display a short context for orientation while carrying the full occurrence route through every interaction. Resolving the route from the visible labels alone would require arbitrarily choosing among candidates in many of these cases. These numbers apply to compiled expression occurrences, including type and instance terms. They measure uniqueness under this particular suffix rule; a human may recognize a mathematical step with less information.

[Per-proof depth curves](ai-context-depth.json) · [Reproduction script](context-depth.cjs). A fixed field suffix beneath a particular ancestor repeats once per occurrence of that ancestor. The calculation weights suffix counts by these multiplicities and retains two successive depth layers for one declaration at a time. Direct enumeration on a bounded subtree of each proof reproduces its entire depth curve. Depth is counted in kernel fields, including the function fields inside curried applications.

### Grouping an application changes how many enclosing steps a reader needs

Treat a complete application as one call with a function port and an ordered port for every argument, including implicit ones. Keep the original fields for all other constructors. On the same 16,240,679 endpoints, the following number of enclosing steps identifies each indicated fraction uniquely. Each step supplies the exact enclosing row and occupied port.

| Fraction identified | Kernel fields | Grouped call ports and other fields |
|---|---:|---:|
| 50% | 13 | 9 |
| 90% | 25 | 16 |
| 99% | 40 | 25 |
| 100% | 70 | 40 |

The change helps most at greater depth. One whole-call port still leaves 16,069,418 occurrences ambiguous. Grouping shortens an exact navigation path while retaining the need to carry the selected occurrence. These are logical steps in a representation. The experiment does not compare screen area, reading time, or comprehension.

[Per-proof grouped curves](ai-whole-call-depth.json). Reproduce with `node research/proof-atlas/step-reading/context-depth.cjs --whole-calls`. For each proof the checker compares endpoint multiplicities row by row before and after grouping, replays every argument and head against the original function spine, and compares the grouped depth curve with explicit enumeration for a bounded subterm. The ungrouped command still reproduces the earlier report byte for byte.

### How many argument ports must a group show?

At a call, expose its last *k* arguments in order and give the remaining function prefix one separate port. Following the prefix repeats the rule. Thus a group with *k* = 3 has at most four outgoing choices. This groups consecutive fields without discarding implicit arguments. The unbounded case exposes every argument at once and reaches 18 ports in this sample.

| Argument limit | Median depth | 90th percentile | 99th percentile | Maximum | Mean extra steps vs. unbounded |
|---:|---:|---:|---:|---:|---:|
| 1 | 13 | 25 | 40 | 70 | 5.27 |
| 2 | 10 | 18 | 27 | 40 | 1.40 |
| 3 | 9 | 16 | 25 | 40 | 0.30 |
| 4 | 9 | 16 | 25 | 40 | 0.16 |
| 8 | 9 | 16 | 25 | 40 | 0.02 |
| All | 9 | 16 | 25 | 40 | 0 |

Three is the smallest tested integer limit matching the four reported depth thresholds of whole calls. The full distributions differ. Summing unresolved counts over depths gives the total minimum identifying depth across occurrences; dividing its difference by 16,240,679 gives the final column. This comparison measures an explicit width/depth tradeoff for this AI sample. Port labels, layout and retrieval time remain untested.

[Arity counts and grouped results](ai-call-widths.json). Reproduce with `node research/proof-atlas/step-reading/context-depth.cjs --compare-widths`. Each grouping preserves all endpoint multiplicities row by row and is checked by explicit traversal on a bounded subterm of every proof.

### Does the width result transfer to the SE(2) proofs?

Applying the same six argument limits to all 561 published SE(2) theorem bodies gives 9,800,418 application endpoints. At the corpus median, 90th percentile, 99th percentile and maximum, three arguments per group and unbounded calls both require 8, 14, 23 and 42 enclosing steps respectively. With two arguments per group the depths are 9, 16, 24 and 43. Three arguments cost 0.34 extra steps per endpoint on average compared with unbounded calls (0.30 in the Goedel sample).

The corpus thresholds conceal individual differences. Of 490 theorem bodies with at least one call, 295 agree at all four thresholds. The other 195 differ on at least one. The remaining 71 bodies have zero endpoints and their quantiles are undefined. In the Riccati proof, the median and 90th percentile agree at 6 and 10. The 99th percentile and maximum increase from 12 and 14 for whole calls to 13 and 15 for bounded groups. The width rule is a candidate for compact presentation with a measured local cost.

[Per-declaration results](se2-call-widths.json). Run `node research/proof-atlas/step-reading/context-depth.cjs --published --compare-widths`. The checker independently counts endpoints from the leaves upward in each packet and checks the count against the forward path-multiplicity traversal. Each grouping also has a bounded expanded-tree check. Counts include value and type expressions occurring inside proof bodies.

In the complete occurrence reader, choose **Proof constructions → Group applications**. Each group now shows up to three retained argument stages. **Earlier application** opens the original partially applied function. **Show all retained arguments** restores the full grouping within the same construction cut. The URL retains this setting and the cut keeps its original size and depth limits. The [browser check](check-group-width.cjs) opens the four-input AM–GM application, follows all four compact ports and all five expanded ports, and checks that switching width preserves the selected fourth argument at 360 and 1280 pixels. This interaction check covers one recorded construction and does not measure reading speed.

Grouped argument ports also show the formal parameter name when the recorded function type at that exact application stage has a single named binder component. In the Riccati AM–GM call the labels are x, y, hx and hy at slots 1 through 4. These identify parameters of the function being applied. The caller can supply an expression of any complexity at the linked input. Generated multipart names and anonymous binders keep the positional label. The [label check](check-parameter-labels.cjs) covers 500 named stages among 684 recorded applications in published-15, 163/241 in working-26, 814/1,176 in the Goedel sample and 56/58 in recursion controls. These denominators describe the native application records available in the tested profiles.

A grouped port carrying a recorded proof argument shows its proposition beneath the argument label when the recorded display text is at most 120 UTF-16 code units. Longer statements have an action opening the original argument type. Of 417 recorded proof-argument stages across the four collections, 380 fit inline. The two Riccati AM–GM proof inputs display the distinct nonnegativity statements for T1 and T2. The browser check follows both in compact and expanded diagrams and opens a longer proposition from the AI proof lean_workbook_20418, checking its recorded type root and original occurrence. The display text comes from the recorded argument type; no new type inference or proof reconstruction is performed.

The paged construction diagram reuses the selected argument's verified type caption on its incoming application port. It copies short recorded native text only when the child has proof role and the caption belongs to the current cut. Missing captions, constructor summaries, budget-truncated text and strings over 120 UTF-16 units leave the original port label in place. No additional lookup is issued for the port. Browser checks compare both Riccati statements and origin keys with the original child cards, follow both ports to their exact routes, and check that this visit requests no full SE(2) declaration index. A longer AI premise remains selectable without an inline excerpt.

[Follow article inputs into the called lemma](callee-uses.md). For 84 of the 92 supplied argument positions in the article index, the edition contains the callee body and a corresponding leading lambda. In the proof of the AM–GM helper itself, the third parameter (hx) has two bound-variable occurrences and the fourth (hy) has one. The index links the caller input, callee binder and first callee use under their respective declaration owners. Every reported count agrees between direct occurrence traversal and an independent memoized de Bruijn count. A reference in a type contributes to these totals; they do not establish that a hypothesis is mathematically necessary. Regenerate with `node research/proof-atlas/step-reading/callee-uses.cjs`.

[Inspect the receiving calls inside each lemma](callee-consumers.md). In the compiled AM–GM helper, the nonnegativity proof hx feeds argument 2 of Real.sqrt_mul and argument 2 of Real.sq_sqrt. The other proof hy feeds argument 2 of a separate Real.sq_sqrt occurrence. Across the 21 available called bodies, 80 leading binders have 38,934 references in 363 groups of receiving positions. Repeated article calls to the same declaration are counted once here. Each group links one receiving expression and its exact bound-variable occurrence. The generator replays every application suffix and checks each representative against its original binder. Grouping by receiving position describes direct compiled uses and does not identify independent mathematical ideas. Reproduce with `node research/proof-atlas/step-reading/callee-uses.cjs --consumers`.

In a grouped published-15 construction, **Follow arguments into …** opens the indexed callee's leading parameters and their first bound-variable occurrences. Each link switches declaration owner and uses the callee's original proof route. The grouped reader checks the constant's name components, edition and destination index digest. It requests the 9,868-byte parameter index on first expansion. This version covers 80 parameters in 21 compiled declarations. Other indexed-edition declarations with a body report missing parameter-use evidence when opened. Regenerate the public index with `node research/proof-atlas/step-reading/callee-uses.cjs --reader-index`. The browser check follows hx from the Riccati caller into the helper body and exercises a missing-record control.

### Which calls can cross a declaration boundary?

In the 20 Goedel theorem bodies, all 16,240,202 maximal applications headed by a constant refer to declarations outside that edition; 477 more have nonconstant heads. None calls an available body in the same snapshot. A separate count restricted to recorded proof-producing application stages finds 747 constant-headed stages across 34 external names and 13 nonconstant stages. The most frequent external head there is sub_eq_zero_of_eq (100 stages). These stages are a selected set of native observations, not a random sample of proof steps.

In published SE(2), 376 of 561 theorem bodies contain at least one call to an available declaration body. There are 444,113 such maximal application occurrences among 9,800,418. Only 41 of these have a head in the current 21-declaration parameter-use index. The native proof-result sample includes 79 application stages calling available bodies, including 10 with indexed heads, and 219 calling external declarations. Indices curated around article passages cover a small portion of the formal development. For this AI sample, enlarging the index solely within its edition cannot improve cross-declaration coverage. An external body needs its own version-matched compiled evidence; an imported name or signature alone cannot supply body-use links.

[Full counts](callee-coverage.json) · [Reproduce the census](callee-coverage.cjs). Body availability includes local definitions as well as theorems. Maximal-call counts use original occurrence multiplicities and include expressions in types. Recorded stages require proof role, a proof-body route and an application construction. The two denominators answer different questions.

### Callee parameters across the complete published edition

The grouped reader now covers all 715 available declaration bodies in published-15. The index contains 2,763 literal leading lambda parameters. Of 733,210 supplied argument occurrences at maximal calls to these bodies from the 561 theorem proofs, 551,168 have a corresponding leading binder. Of these, 551,166 also have a bound-variable use. Two reach a binder with zero references. The remaining 182,042 positions lie beyond the literal lambda prefix. The reader reports this boundary explicitly. The native proof-result sample has 1,815 matched slots among 1,821 supplied to local bodies. Counts include implicit inputs.

Each parameter count was checked by direct occurrence traversal and memoized de Bruijn counting. The reader requests one of 16 index files on disclosure, selected by the callee packet digest. File sizes in this edition range from 13,393 to 39,688 bytes (400,190 combined). No callee packet is needed to display the links. The earlier 21-declaration artifact remains the article baseline. Regenerate the files with `node research/proof-atlas/step-reading/callee-uses.cjs --all-bodies` and the [coverage report](all-body-coverage.json) with `node research/proof-atlas/step-reading/callee-coverage.cjs --all-bodies`. The AI edition still has no calls to local declaration bodies.

### Declaration types cover most positions beyond the body parameters

For each indexed callee, the reader can also link argument *i* to the *i*th literal forall binder at the root of its compiled declaration type. Opening that link selects root 0; body parameters and their bound-variable uses select root 1. Of the 182,042 local-call argument occurrences beyond the leading body lambdas, 181,989 reach a declaration-type binder. The remaining 53 lie beyond both literal prefixes across eight declarations, listed in the coverage report. This adds access to the declared interface without asserting any new proof-body uses. It leaves six unmatched local slots in the sampled proof-result stages. The browser check follows argument 2 of JacobiCore.eps from JacobiCore.E_pos to the exact binder at row 2, route 0:1. With the additional binder rows, the largest index file is 41,128 bytes.

All 53 remaining local-call slots occur after a declared result headed by one of four monotonicity predicates: StrictMonoOn (15), StrictMono (9), StrictAntiOn (20) or Monotone (9). These are counts of supplied argument occurrences. At this boundary the grouped reader now links to the exact declared result, obtained by following the body fields of the literal forall prefix in the callee's type. For example, the call to JacobiCore.eps_strictMono inside JacobiCore.E_pos links to StrictMono at type row 11. The link preserves the residual result expression; matching each extra argument to a binder inside the predicate would additionally require version-matched unfolding evidence.

### Call-site evidence past a named result

Three distinct recorded application stages in published-15 lie beyond both literal callee prefixes. All occur in the same application of JacobiCore.eps_strictMono in JacobiCore.E_pos. Compiled slots 2 and 3 take real values; slot 4 takes the proof of 0 < J.K. Each native record contains a Pi node, its expected domain, the actual argument type and passing function, domain and result conversion checks. These three stage observations concern one application spine. The earlier 53-slot census counts expanded occurrences over all theorem bodies, so the counts have different units.

At this boundary the complete grouped reader offers the recorded caller argument type alongside the callee's declared result. In the browser test, slot 4 opens computed type row 68 at its caller argument occurrence; the separate result link opens source type row 11 of the called declaration. No source binder inside the imported predicate is asserted. [Recorded stages and owners](residual-stages.json) · [Reproduce](residual-stages.cjs).

### Unfolding the four monotonicity interfaces

[Four Lean theorems](MonotonicityInterfaces.lean) check the binder order of Monotone, StrictMono, StrictMonoOn and StrictAntiOn by definitional reflexivity. Lean 4.33.1 accepted all four and reported no axiom dependencies. The check imported Mathlib.Order.Monotone.Defs from the local build of Mathlib revision 0df444a360eaa60ab8c11dca51a86af692955474. Its source file matched the pinned upstream file byte for byte (SHA-256 7a443757a778d0ce5047be0441060dd2b9dcc8a81432330dc3a7dcc66496018e). Recheck with `lake env lean /absolute/path/to/MonotonicityInterfaces.lean` in the matching Mathlib environment.

The [compiled-term census](monotonicity-slots.cjs) checks the exact constant and argument count at the end of each of the eight affected signatures. Counting maximal calls by occurrence, the 53 additional slots comprise 26 point arguments, 14 membership proofs and 13 order premises. For restricted predicates the first point's membership precedes the second point. StrictAntiOn reverses the order of the images in the conclusion. [Counts by callee and role](monotonicity-slots.json). These are positions in the unfolded declared result; the checks give no additional bound-variable uses inside the eight proof bodies. The corpus count runs separately from the four generic Lean proofs.
