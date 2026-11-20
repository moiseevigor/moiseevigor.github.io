# Selecting a variable use by ordinal

A query begins at the body of one binder occurrence in a validated original packet. It orders direct references by depth-first traversal in stored field order. Ordinals start at one. Distinct expanded occurrences count separately, including edges that share a stored child. The result gives the original root, field slots and stored row. The caller must retain the packet identity with that address.

The builder counts reachable pairs of stored row and intervening binder depth in source DAG order. A subtree total stays live until its last consumer. For navigation, each positive internal state retains a field mask and counts for the positive children preceding the last one. The last child receives the remaining total. A single positive child needs only its field position. To descend an edge, it subtracts the exact use counts of preceding siblings. The inverse sums those counts along the supplied path. A body field extends the lexical context of a lambda, dependent function or local definition. The local definition's type and value use the enclosing context.

Run from the repository root with Node:

```sh
node --max-old-space-size=256 research/proof-atlas/use-rank/check.cjs
```

The [record](results.json) covers every leading proof lambda in the 35-declaration typing inventory. It includes refusals, exact routes and maximum observed counts by inventory. The check follows first, middle and last references where available, resolves their lexical binders and verifies the inverse ordinal. For small bodies it independently expands every occurrence in field order. A separate binary sharing fixture supplies an independent 240-bit path oracle. That fixture is syntax data. The largest recorded example is an authored recursion control. AI results are reported separately.

All 190 binder totals agree with the independent free-index multiplicity evaluator. For the largest total in each inventory the checker also recovers the middle ordinal by independently counting every preceding sibling subtree along the selected path. Bounds on state count, coefficient slots and coefficient digits still refuse oversized queries.

The original all-rows count table reached its coefficient limit on 18 of the 190 binders. Retaining branch splits resolves all 18. The measured peaks across the 190 queries are 116,630 requested row/depth states, 59,407 retained coefficient slots and 99,801 retained decimal digits. These units exclude the source packet, maps, masks, reference counts, temporary arithmetic and JavaScript object overhead. Each query used the existing caps of 262,144 states, 65,536 coefficient slots and 524,288 decimal digits. The complete-packet implementation retains the original source. The page-based implementation below has a separate delivery cost. No new Lean build or typing judgment was performed.

## Paged construction

The first pass visits demanded source rows in descending order, sending each request to the children at the appropriate lexical depth. A row’s scope bound can retire a request when its page arrives. The second pass visits the surviving rows in ascending order to build the same branch counts. Ordinal selection and inversion then read just the field paths they traverse. All three operations use the original source cursor and its authenticated pages.

The [paired measurements](paged-results.json) take the highest-use binder in each of the four inventories in the complete-packet experiment. For each, the test compares the total, middle occurrence address, and recovered ordinal to the saved reference. Its runtime fetcher accepts only the selected source-page directory. The source cache retains at most two pages of 256 rows each, with a separate one-page index cache. Construction still retains demanded row/depth metadata and count splits. It also walks numeric row IDs up to the selected body in both directions. On the working midpoint proof it loaded 948 source pages during construction, then 36 to select the middle use. Small source residency can therefore carry a substantial initial transfer cost.

Run the paged check from the repository root.

```sh
node --max-old-space-size=256 research/proof-atlas/use-rank/check-paged.cjs
```

The byte measurements cover retained decoded source pages. Total process memory, end-to-end network latency and reader comprehension were not measured. The four cases do not establish all-binder paged coverage.

## From one inference to its variable uses

The [Riccati reader](riccati.html) opens at the two nonnegativity premises of the arithmetic–geometric mean application. Its conclusion and each of its five input positions link to the original compiled occurrence. Expanding the rule and implicit arguments exposes the two quantities passed to the lemma. Under the outer proof binder for J, those quantities contain uses 432 and 433. The two proofs of nonnegativity contain uses 434 and 435. The function head contains zero. These four occurrences exhaust direct references to J in the selected call subtree. The result's recorded type is displayed separately and does not enter this count.

Rebuild from the repository root with `node research/proof-atlas/use-rank/riccati-view.cjs` and compare its output to the saved HTML. The generator checks the source and native observation hashes, the six occurrence addresses and the round trip for every one of the 2,204 variable uses in this binder body. The argument partition is by root and ordered field path. Only this application has a curated mathematical caption. These checks establish neither minimal hypotheses nor reader comprehension.


## One binder across the arguments of an application

A subtree inside the selected binder body occupies a contiguous interval of variable-use ordinals in field order. Descending one field adds the weights of its earlier siblings and replaces the current count with the selected child's weight. An empty subtree has count zero and no first ordinal. After building the index this query reads the field path without enumerating any uses. The ordered function head and actual argument subtrees partition the uses inside an application.

The [reproducible check](check-ports.cjs) tests all six AI declarations with native call records in the network-streaming manifest. Their 28 recorded calls and 35 leading proof binders give 162 within-declaration binder/call comparisons and 1,024 individual input comparisons, including function heads and zero counts. Each count agrees with a separate free-variable multiplicity evaluator. Each nonempty interval's first and last ordinals resolve to the original binder inside the recorded input path. In 13 comparisons across four declarations the same binder has uses inside both value and proof arguments. Two declarations have no such pair among their recorded calls. The inventory samples applications within the proofs. Its frequencies do not estimate a population proportion.

### Clearing denominators

In [one recorded application](https://moiseevigor.github.io/projects/proof-atlas/library/?edition=goedel-sample-4331&proof=lean_workbook_plus_15068&route=1%3A1.1.1.1.1.1.1.1.1.1.1.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.1.1.0.1#expr-17775) in `lean_workbook_plus_15068`, Lean applies `Mathlib.Tactic.FieldSimp.eq_eq_cancel_eq` to relate a rational equality to a denominator-cleared equality. The outer binder has 668 uses below this application. Nine occur within four value arguments. The other 659 occur within the proof terms supplied at three positions.

| Actual proof input | Uses inside this input | Ordinals in the enclosing proof body |
| --- | ---: | --- |
| [Left-side factorization](https://moiseevigor.github.io/projects/proof-atlas/library/?edition=goedel-sample-4331&proof=lean_workbook_plus_15068&route=1%3A1.1.1.1.1.1.1.1.1.1.1.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.1.1.0.1.0.0.1#expr-17600) | 543 | 21,552–22,094 |
| [Right-side factorization](https://moiseevigor.github.io/projects/proof-atlas/library/?edition=goedel-sample-4331&proof=lean_workbook_plus_15068&route=1%3A1.1.1.1.1.1.1.1.1.1.1.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.1.1.0.1.0.1#expr-17741) | 108 | 22,095–22,202 |
| [Nonzero common factor](https://moiseevigor.github.io/projects/proof-atlas/library/?edition=goedel-sample-4331&proof=lean_workbook_plus_15068&route=1%3A1.1.1.1.1.1.1.1.1.1.1.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.1.1.0.1.1#expr-17774) | 8 | 22,203–22,210 |

The role belongs to the enclosing input. The count includes all direct binder references anywhere inside its term, including embedded types. It measures neither distinct hypotheses nor difficulty. [Per-declaration results and original addresses](port-results.json).

## Opening a single folded input

A caller can supply a binder occurrence and an input occurrence in its body to the paged index. The reader follows the original field path to the input, accumulating the lexical depth of the binder. Count construction then starts at the input row and that inherited depth. Local use numbers run from one to the input count. Selection returns the full original occurrence address. The caller needs no whole-binder ordinal offset. Index construction still reads pages containing demanded descendants and keeps separate row/depth metadata.

[Cold-cache measurements](local-port-results.json) cover every input, including the function head, of one example call in each of the four AI proofs with a measured value/proof split. The 33 inputs include 17 with zero direct references. For all 941 remaining references, the [checker](check-local-ports.cjs) compared the exact selected path with the whole-binder index, independently resolved its lexical binder, and recovered its input-local ordinal. The whole source packet is available only to the comparison. The paged reader's fetcher allows only the selected declaration's page directory.

For the left-side factorization in the denominator example, building the input index took 21 source-page loads against 141 for the whole binder with the same cold cache. Selecting the middle of its 543 uses took two additional page loads. The right-side factorization and nonzero input took 22 and 13 loads to index. All 33 scoped constructions used fewer source-page loads than their respective whole-binder constructions. These measurements count loads, including repeats, with two source pages and one index page allowed. They exclude native input discovery and network latency. Reopening many different inputs can repeat work. No break-even point for repeated navigation or reader comprehension was measured.

## Visiting several inputs of one inference

The paged index now returns the ordinal interval below any original descendant route inside its selected region. When built at an application, it can serve every argument of that occurrence. For a nonempty input interval starting at application-local ordinal *f*, the input's *k*th use is application-local use *f + k − 1*. A zero interval has no first ordinal. Both strategies return the original full occurrence path.

The [comparison](check-visit.cjs) opens each of the 33 inputs once in each of two orders, using the same four applications and binders as the single-input experiment. Each visit requests the input count and, when positive, the middle occurrence. One strategy builds an index for each input. The other builds one application index and requests intervals from it. Both start cold, reuse one two-source-page cursor across the visit sequence, and have the same one-page index cache. The check compares every count and full occurrence address and records cumulative source-page loads and compressed file bytes read after each visit. Bytes include repeated reads and page-directory metadata. The experiment starts with known input addresses and roles.

| AI proof | Visit order | All inputs, separate indices | All inputs, shared application index | First visit at which sharing has fewer cumulative loads |
| --- | --- | ---: | ---: | ---: |
| 20418 | Field / proof first | 26 / 27 | 22 / 23 | 7 / 4 |
| 4274 | Field / proof first | 18 / 18 | 13 / 13 | 3 / 3 |
| plus 15068 | Field / proof first | 128 / 128 | 79 / 79 | 10 / 3 |
| plus 39831 | Field / proof first | 51 / 51 | 36 / 35 | 7 / 2 |

In the denominator-clearing case, the shared index reduced the complete traversal from 440,374 to 267,574 compressed bytes in both orders. The first visit alone cost 5 source-page loads with its own index and 23 with the application index. Visiting proof-valued inputs first changed **when** the application index started saving loads. This ordering includes proof-valued instance arguments; its labels come from the recorded argument roles. The four applications were selected for mixed value/proof uses. This comparison does not establish a universal switching threshold, measure elapsed browser time, or test which visit sequence people naturally choose. [Complete measurements by input](visit-results.json).

## Four inferences in the browser

The [standalone inference reader](inferences.html) opens on denominator clearing. Switch proofs to inspect equality transport and two congruence applications. The proof inputs and conclusion stay visible together. Expand the function, types and values to inspect the remaining positions. Each printed premise links to the original argument term supplying that evidence. Choose a nonempty input and enter a local use number to open its exact variable occurrence. The denominator example includes an editorial reading of the two factorizations and the nonzero condition. All four display their native type summaries.

The [generator](inference-view.cjs) embeds one branch table per application. It computes those tables offline using the authenticated complete source packets. Each table contains just the positive variable-use paths under its application, retaining the original field path prefix and sharing repeated states. All 941 positive selections agree with the whole-binder index and independently resolve to the selected binder. The initial page embeds all four tables. Previous paged-transfer measurements describe a separate runtime. The [Chrome check](check-inference-browser.cjs) exercises proof switches, input links, local upper endpoints and out-of-range values at 320 and 1280 CSS pixels. Reader comprehension remains unmeasured.

## Which earlier arguments occur in a premise?

Open **Earlier arguments in the expected type** beneath any actual argument in the [inference reader](inferences.html). Each link selects the earlier actual argument at its original proof address. Beside it, a second address identifies a bound-variable occurrence in the recorded type of the function at input zero. The native observation owner is listed under compiled provenance. The two addresses belong to different formal objects.

The generator walks the uninstantiated binder domain in the native function type, tracking local binder depth. It retains one occurrence per distinct earlier formal argument, compares that set against the recorded dependency list and requires the recorded instantiated-domain check to have passed. The [checker](check-formal-edges.cjs) replays each saved path and reconstructs the lexical binder stack to verify its target. Across the 28 sampled calls in six AI proofs, 143 argument domains yielded 171 earlier-argument links; 46 domains had no such reference. All 143 had formal-domain records. These are direct syntactic references in the recorded domain. They do not enumerate every use in the supplied proof term or establish that every premise is mathematically necessary. [Per-proof counts](formal-edge-results.json).

## Comparing the premises with the conclusion

Open **Arguments in the rule’s result type** below the conclusion. The reader walks the body of the function's recorded type once for each supplied argument and collects references to those binders in the remaining expression. Additional binders of a partially applied function retain their own scope. Each displayed witness identifies one occurrence in the recorded function type and links to the corresponding actual argument of this call. The selected result term and its displayed instantiated type remain separate from this pre-substitution evidence.

For denominator clearing, the two factorization premises and the nonzero premise all reference the formal factor L. The rule's result references M, e₁, e₂, f₁ and f₂. L disappears from the result as a separate formal parameter. This describes the rule's signature; instantiated expressions may themselves contain shared quantities.

Across 28 sampled AI calls, an independent bottom-up free-variable calculation agreed with all 65 result edges and their absences. None of these 65 edges targeted a proof-valued argument. The authored equality-recursion control gives a positive case: the result C b h refers to the supplied proof h in slot 6. A partial function composition gives a scope check: its result A → B refers to two supplied type arguments and binds its own remaining input. Both use previously recorded compiled observations. [Measurements and exact control witnesses](formal-edge-results.json).

## One diagram across the inference

The argument-reference matrix in the [reader](inferences.html) places a formal argument on each row and a proof-valued argument domain or residual result on each column. A mark means the row binder occurs in that type. Selecting it reveals the witness path inside the recorded function type and links to both original term occurrences. Empty cells outside lexical scope are distinct from in-scope arguments whose binders are absent. An unavailable formal type receives a question mark. The matrix projects onto proof domains and the result; other argument domains remain in the detailed reader.

The four diagrams contain 41 marked, 35 absent and 21 out-of-scope cells. The browser check visits all 97 positions at both widths, checking both endpoints and the stored function-type occurrence of every mark. In the denominator example read the L row across the left factorization, right factorization, nonzero condition and conclusion. The first three cells are marked and the conclusion cell is absent. These marks encode binder references before substitution. The four cases do not test reader comprehension.

## Coverage across the six native AI profiles

The standalone reader now includes all 28 application occurrences recorded in these six profiles. These are selected calls within each compiled declaration. The application picker groups them by declaration; its default is the denominator-clearing example. The selected binder is held fixed within a declaration: the earlier mixed-use example's binder if available, otherwise the outer proof binder. With this choice, two calls contain zero direct uses of the binder and two further calls contain uses exclusively outside proof arguments. The interface keeps their matrices visible and presents variable navigation only where a use exists.

The build checks 4,059 local selections across 171 input positions (function heads included). This is a sum over call/input queries, which can overlap in the proof. The expanded diagrams contain 184 direct references, 158 in-scope absences and 91 out-of-scope positions. These figures supersede the four-example reader counts above; the earlier experiments retain their original scope.

For 16 input positions the recorded producer is itself an inventoried application in the same packet. **Read producing call** follows that exact occurrence; browser Back returns to the consuming application. Three links pass through one recorded local definition. In the denominator proof, input 3 of call 0 (`Eq.mp`) opens call 2, whose result equates the fractional and polynomial statements. Two applications of the same equality-transport rule in this proof open different producing calls. The join uses the original proof root and field path plus row within the same packet. A missing link means that the producer has no matching call record in this inventory.

## Following a shared result

Under a conclusion, **Recorded uses of this result** lists the consuming call and input position. These links focus the exact input and encode the packet, consuming call and slot in the fragment, so reloading preserves the destination. The enclosing application retains its own provenance. An empty list is scoped to the recorded call inventory. The [reverse-use check](check-consumers.cjs) compares every displayed consumer against the separately packed outgoing pages, including the source route, target slot and route, and number of local-definition hops. It finds 13 results with no inventoried consumers, 14 with one, and one with two.

In `lean_workbook_4274`, call 2 applies the hypothesis h₁. Its result feeds input 4 in two different applications of Eq.mp, each through a local definition. Both consumers have the same displayed conclusion, and both argument occurrences have stored row 174. Their field paths from the compiled proof root differ. Grouping by rule, conclusion, argument position and stored row together would still lose a use. The two links remain distinct and their exact targets survive a reload. These are two occurrences of consumption in the formal object; the observation does not establish two distinct mathematical ideas.

## Resolving a local name across a call boundary

**Follow local definition** shows the actual bound-variable reference, the let expression that binds it, and the defining value in its original context. All three link to occurrence paths. The reader extracts binder names from the compiled let payload and displays the native term summaries at both ends. In the six AI profiles, three input positions have a recorded let step. Two consume h₃ from the same definition in `lean_workbook_4274`. Both resolve to h₁ 0; the reference is under nine enclosing binders and the defining value under four. The third resolves h₂ to h₀ 0 0 under contexts of eight and four binders. Fourteen other positions link directly to a lexical binder. The build checks source resolution and context against the original packet for all 171 positions. These are source-navigation checks on existing observations.

The authored two-definition [control](definition-path-control.json) follows copyOfQ to q and then to Eq.mp h p. The two successive variable references occupy the same stored row 20 in different scopes. Row 20 is simultaneously the first definition's value and the next reference. The binder occurrences are distinct. The [checker](check-definition-path.cjs) resolves both lexical binders, verifies their value fields, and rejects a substituted reference path even though the stored row is unchanged. This control tests a two-step chain; the sampled AI inputs have at most one step.

## From an input occurrence to the theorem statement

For an input taken directly from a lexical binder, **Declared type** opens the original type field at that binder. If it is paired with a leading theorem quantifier, the reader also links to the matching type in the statement root. The pairing follows the existing clause-navigation rule: all preceding paired domains and the selected domain share the same stored rows. A proof-local binder keeps its proof-side address.

Inside the declared type the reader counts direct references to each enclosing variable and links its first occurrence back to the earlier binder. Nested binders inside the type have their own scope. In the denominator-clearing proof, the supplied hypothesis h leads to the fractional equation in the theorem statement. Its type refers twice to a and twice to b. In contrast, input 4 of call 3 in lean_workbook_plus_6206 takes its equality from a nested proof binder.

Of 14 bound input positions, 12 have a paired statement domain and two have proof-local domains. A separate [exhaustive occurrence check](check-declared-domains.cjs) visited 1,824 expressions in those domains, including repeated queries of the same binder. It recovered all first witnesses and counts, distinguishing 41 references to surrounding binders from 10 references bound within the type itself. [Per-input measurements](declared-domain-results.json). The calculation describes the original expression's lexical dependencies. It adds no typing judgment and measures no improvement in comprehension.

## From a statement binder to recorded calls

**Trace a theorem parameter or hypothesis** starts with the paired statement telescope of the selected declaration. An input is direct here when the original input expression is the bound reference itself. The reader also follows a reached call's result into every recorded consuming position. Each link selects the exact target input. Separately, for each call subtree containing any lexical reference to the binder, the reader gives the expanded reference count and a link to its first original occurrence. Call subtrees can overlap. A result-use chain describes term construction; it does not establish logical necessity.

Across six declarations and 28 recorded calls, nine of the 35 paired statement binders supplied at least one direct input, sixteen appeared only inside call subtrees, and ten had no lexical reference inside the recorded calls. Twelve direct input positions and four subsequent result-use positions were reached, summed by binder. For example, in lean_workbook_4274 the hypothesis h₁ supplies the function of call 2. That result reaches input 4 of calls 0 and 1 through the same local definition. Both target occurrences remain navigable.

The [checker](check-statement-flow.cjs) identifies direct inputs by resolving their bound variables from original occurrence paths. It computes result reachability from incoming ports to compare with forward traversal. An independent multiplicity calculation checks the positive and zero counts for every one of the 162 within-declaration binder/call pairs. A zero concerns the recorded call subtrees only. [Results by declaration](statement-flow-results.json).

## How much of the proof do the recorded calls cover?

For a paired statement binder, the reader reports the number of its direct lexical occurrences anywhere in its proof body and the number inside the union of the recorded call subtrees. Occurrences in type fields count. The builder takes the union of half-open use-ordinal intervals per binder. An uncovered use opens at its exact source address. An unused binder has a separate display.

Across 35 paired binders in six AI proofs, the 28 sampled call subtrees cover **4,256 of 580,845** expanded direct binder uses (0.73%). Summing the individual call counts gives 8,437 because some call occurrences contain others. In lean_workbook_plus_19617, for example, the recorded subtrees contain 51 distinct uses of f out of 76. Adding their counts gives 192, exceeding even the whole-body total. Of the ten binders with zero uses in sampled calls, eight have uses elsewhere and two have zero uses in their entire proof bodies. This measures lexical coverage for these binders and this sample. It does not measure proof-step coverage or the fraction of the mathematical argument explained.

The [independent checker](check-statement-flow.cjs) removes contained call roots by exact source-path prefixes, then adds counts only for disjoint roots. It checks whole-body totals with a separate free-variable evaluator. For every uncovered witness it resolves the original binder, excludes all recorded call roots, and proves that all earlier sibling subtrees have their full binder-use count covered. The [per-binder results](statement-flow-results.json) include both the union and the uncorrected sum. No fresh Lean build was needed for this query over compiled packets.

## Opening the largest uncovered branches

For a selected binder, **Largest uncovered branches** lists up to three disjoint original subtrees that contain the most uses outside the recorded calls. Each branch links to its root and its first lexical reference. The builder follows a trie of excluded call routes inside the binder body. A child with no recorded call in or above it starts a maximal uncovered subtree. Zero-use branches drop out. Counts use source field order, with earliest occurrence breaking ties. This partitions binder references, including those in type fields. It does not propose new mathematical lemma boundaries.

Across 35 binders in six AI proofs, 31 had uncovered uses. Their 332 positive binder/branch pairs contain all 576,589 uncovered uses counted previously. The 92 displayed pairs contain 566,196 uses (98.2% pooled). This fraction is weighted by occurrence count: two declarations contribute 520,227 uncovered uses. For f in lean_workbook_plus_19617 the three heaviest branches account for only 12 of 25 uses across seven branches. There is no uniform three-branch coverage guarantee.

The [independent check](check-uncovered-branches.cjs) constructs candidate roots as siblings along original call paths, discards any prefix overlap with a call, and evaluates free-variable multiplicity at the resulting roots. It checks partition totals, all displayed ranks including ties, branch addresses and binder resolution for witnesses. [Per-binder results](uncovered-branch-results.json). The reader embeds only the three largest positive regions per binder. These measurements assess where lexical occurrences are concentrated and do not assess reader understanding.

## Size and field structure of the largest branches

A branch now reports its expanded expression count and its number of distinct reachable stored rows. In **Inspect structural fields** each immediate child retains its source link, expanded size and use count for the selected binder. For applications, a separate link follows the function fields to the original head occurrence and reports the number of supplied arguments. This syntactic head may itself be a local variable. A constant at the head does not explain the constructions inside its arguments.

The 92 displayed binder/branch pairs represent 36 distinct packet-qualified branch occurrences. Of the 92 pairs, 68 concentrate every use of the selected binder in one immediate child. In lean_workbook_plus_6206 an application of Iff.mpr expands to 11,433,633 expression occurrences from 33,742 reachable rows. Its function field contains 283 occurrences and zero uses of a. Its final argument field contains 11,433,349 occurrences and all 26,278 uses of a. The application constructor accounts for the remaining occurrence. A single named head can thus locate a large argument while giving very little detail about its contents.

[Per-branch measurements](uncovered-branch-results.json) use field triples in the order field name, expanded occurrences, binder uses. The [checker](check-uncovered-branches.cjs) propagates multiplicities from root to children in descending source order, counts reachable rows, and checks the field targets and binder-use counts against a separate free-variable evaluator. Expanded size and row count describe the stored representation; neither is a readability score or a count of distinct mathematical inferences.

## First split of a binder's uses

A positive subtree occupies a contiguous interval in source field order. The longest common field prefix of its first and last binder uses therefore leads to the deepest occurrence containing them all. A single use ends at the original bound-variable reference. Otherwise at least two immediate fields of the destination contain references. **First split** links to this occurrence and displays each positive field's share of the original count. Intermediate nodes and zero-use fields remain accessible through the original root. This operation preserves every selected binder use; other proof content along the path can still matter.

Among 92 displayed binder/branch pairs, 68 allow a descent of at least one field before any selected use separates. The longest descent is nine fields. Fifteen pairs terminate at one variable occurrence; 77 have a split. Twelve of those splits place at least 99% of the uses in one child. The first split therefore provides a faithful navigation boundary without guaranteeing a balanced division.

For the 26,278 uses of a in the large Iff.mpr branch, three fields lead to an application whose function subtree contains 12,628 uses and whose argument subtree contains 13,650. This node still contains 11,433,057 expanded expression occurrences. The count measures where references lie, not whether this application is a comprehensible mathematical step. The [independent checker](check-uncovered-branches.cjs) descends by calculating the free-variable multiplicity of each child until a reference or split is reached. It agrees on the endpoint, depth, subtree size and ordered child counts for all 92 cases. [Recorded splits](uncovered-branch-results.json).

## A four-subtree limit on the diagram

The optional partition below a branch displays up to four disjoint original subtrees whose union contains every use of the selected binder in that branch. It repeatedly splits the largest eligible group at its first separating field, retaining all positive children. Ties follow source order. A split is eligible only if the full replacement fits within four groups. Each group shows its field path relative to the original root, exact count, proportional bar and source link. The cap is a display choice.

For all 92 displayed binder/branch cases the largest resulting group was as small as possible under this constraint. An [independent exhaustive search](check-four-groups.cjs) considers each possible split order up to four groups, contracting paths with only one positive child because they preserve the group count and weight. It counts child weights using free-index multiplicity, checks disjointness and exact coverage, and compares the best attainable maximum with the reader's choice. This is a finite result for this sample and objective.

The largest group shrinks relative to the first split in 75 of the 77 cases with more than one use. Sixty-seven cases have four groups. In ten, the largest group reaches the unconstrained integer lower bound (the ceiling of one quarter of the use count). In 27, one group still carries more than half of all uses. In the Iff.mpr branch with 26,278 uses of a, the four source-ordered groups contain 12,628, 42, 12,850 and 758 uses. The minimum possible maximum is 12,850, compared with 13,650 after the first split. Exact links and complete binder-use coverage constrain how evenly a fixed-size diagram can divide a proof. [Per-case counts and exhaustive optima](four-group-results.json).

## Lexical inputs of a folded group

Open **Enclosing binders** below a partition member to see which variables bound outside that subtree occur inside it. Each row gives an expanded direct use count and two original occurrence links: the binder and its first use in source field order. Internally bound references drop out when computing the interface. References inside type fields count. The named declaration and full root/slot route identify a group; different partitions can contain the same group. This describes direct lexical references, including local definitions. It does not close their types transitively or identify a minimal set of mathematical hypotheses.

Across six AI proofs the 311 group appearances correspond to 230 distinct source occurrences. Of those, 189 reference at least two enclosing binders. The largest observed interface has eight. In the Iff.mpr example, the group with 12,850 uses of a mentions three enclosing binders (a, b and c), while the group with 758 uses of a mentions eight. Balancing by one binder's frequency can therefore put the larger lexical interface in the smaller group.

The [independent checker](check-group-bindings.cjs) propagates occurrence multiplicities down the authenticated DAG, recording the number of binders entered inside each group. It verifies the complete set of external indices, counts, source targets and witness bindings for all 230 groups, then compares every selected-binder count with the original partition. The reader's bottom-up computation reports unavailable when its configured limits prevent a complete interface. All 230 succeeded here. [Per-proof measurements](group-binding-results.json).

## Function heads inside arguments

The reader applies the same [function-field traversal](../step-reading/input-head.cjs) used in the article call index. For a compound input it links to the end of its function spine in the original proof. For a lambda it also links to the body. Both links retain the declaration, root, complete occurrence route and original row. A direct input already has its own occurrence link.

Across all 143 supplied positions in the 28 recorded calls from six AI proofs, the head is a constant at 114 positions, a bound variable at 15, a universe sort at 10 and a lambda at four. All 97 arguments with an application at their root lead to a constant. This count uses argument positions, so repeated terms at different inputs count separately. The 28 calls are the existing recorded selection, not a random sample of these proofs.

The native roles show a limit of using a head shape as an explanation. At call 0 in lean_workbook_20418, input 3 is a lambda with a value role and input 4 is a lambda with a proof role. Across the sample three lambda positions are value inputs and one is a proof input. The reader takes the role from the recorded observation and the body link from the compiled term. The browser check resolves every input head against its packet and checks generated links at both supported test widths.
