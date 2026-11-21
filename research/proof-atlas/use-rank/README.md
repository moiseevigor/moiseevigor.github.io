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

Open **Enclosing binders** below a partition member to see which variables bound outside that subtree occur inside it. Each row gives an expanded direct use count and two original occurrence links: the binder and its first use in source field order. Internally bound references drop out when computing the interface. References inside type fields count. The named declaration and full root/slot route identify a group; different partitions can contain the same group. This describes direct lexical references, including local definitions. The direct-use counts describe syntax inside the group. The separate binder-type expansion below follows dependencies outside it.

Across six AI proofs the 311 group appearances correspond to 230 distinct source occurrences. Of those, 189 reference at least two enclosing binders. The largest observed interface has eight. In the Iff.mpr example, the group with 12,850 uses of a mentions three enclosing binders (a, b and c), while the group with 758 uses of a mentions eight. Balancing by one binder's frequency can therefore put the larger lexical interface in the smaller group.

The [independent checker](check-group-bindings.cjs) propagates occurrence multiplicities down the authenticated DAG, recording the number of binders entered inside each group. It verifies the complete set of external indices, counts, source targets and witness bindings for all 230 groups, then compares every selected-binder count with the original partition. The reader's bottom-up computation reports unavailable when its configured limits prevent a complete interface. All 230 succeeded here. [Per-proof measurements](group-binding-results.json).

## Function heads inside arguments

The reader applies the same [function-field traversal](../step-reading/input-head.cjs) used in the article call index. For a compound input it links to the end of its function spine in the original proof. For a lambda it also links to the body. Both links retain the declaration, root, complete occurrence route and original row. A direct input already has its own occurrence link.

Across all 143 supplied positions in the 28 recorded calls from six AI proofs, the head is a constant at 114 positions, a bound variable at 15, a universe sort at 10 and a lambda at four. All 97 arguments with an application at their root lead to a constant. This count uses argument positions, so repeated terms at different inputs count separately. The 28 calls are the existing recorded selection, not a random sample of these proofs.

The native roles show a limit of using a head shape as an explanation. At call 0 in lean_workbook_20418, input 3 is a lambda with a value role and input 4 is a lambda with a proof role. Across the sample three lambda positions are value inputs and one is a proof input. The reader takes the role from the recorded observation and the body link from the compiled term. The browser check resolves every input head against its packet and checks generated links at both supported test widths.

## Whole-proof test of argument heads

The 28 recorded calls above contained 97 compound arguments, all headed by constants. Counting every argument position in the six compiled proof bodies gives a different result. Of 13,643,790 compound argument occurrences, 408 have a bound variable in function position. They occur in two proofs. The remaining 13,643,382 have constant heads. Here a compound argument is an application in the argument field of another application. The count includes type fields and implicit arguments inside the proof root, and counts each use of a shared row at its occurrence multiplicity.

| Proof | Expanded argument positions | Applied bound-variable heads | Example from original term |
|---|---:|---:|---|
| lean_workbook_20418 | 14,887,306 | 0 |  |
| lean_workbook_4274 | 33,234 | 334 | [Argument](https://moiseevigor.github.io/projects/proof-atlas/library/?edition=goedel-sample-4331&proof=lean_workbook_4274&route=1%3A1.1.1.1.2.2.2.2.1.1.0.1#expr-215) → [Function](https://moiseevigor.github.io/projects/proof-atlas/library/?edition=goedel-sample-4331&proof=lean_workbook_4274&route=1%3A1.1.1.1.2.2.2.2.1.1.0.1.0#expr-213) → [Binder b](https://moiseevigor.github.io/projects/proof-atlas/library/?edition=goedel-sample-4331&proof=lean_workbook_4274&route=1%3A1#expr-1449) |
| lean_workbook_plus_15068 | 3,536,537 | 0 |  |
| lean_workbook_plus_19617 | 3,473 | 74 | [Argument](https://moiseevigor.github.io/projects/proof-atlas/library/?edition=goedel-sample-4331&proof=lean_workbook_plus_19617&route=1%3A1.1.1.1.2.2.2.2.1.0.1.0.1.1.0.1.0.1.1.1#expr-318) → [Function](https://moiseevigor.github.io/projects/proof-atlas/library/?edition=goedel-sample-4331&proof=lean_workbook_plus_19617&route=1%3A1.1.1.1.2.2.2.2.1.0.1.0.1.1.0.1.0.1.1.1.0#expr-163) → [Binder f](https://moiseevigor.github.io/projects/proof-atlas/library/?edition=goedel-sample-4331&proof=lean_workbook_plus_19617&route=1%3A#expr-562) |
| lean_workbook_plus_39831 | 236,561 | 0 |  |
| lean_workbook_plus_6206 | 15,866,163 | 0 |  |

The six proof bodies contain 69,173,537 expanded expressions and 34,563,274 argument positions. Direct arguments also include 1,377,273 literal, 11,342 universal-binder and 13 metadata occurrences. None of these three shapes appeared among the 143 selected argument positions. Metadata is counted at its original constructor without silently unwrapping it.

The [census](full-input-heads.cjs) processes one checksum-verified packet at a time. It propagates incoming counts down the shared graph, then independently adds per-category counts up from children and verifies the total number of applications. It retains one exact argument and head route per observed category per proof. These structural counts do not assign proof roles or estimate frequencies beyond these six declarations. [Counts and occurrence witnesses](full-input-heads.json).

## Binding targets of the 408 local-function occurrences

[Explore the two binders and their argument rows](local-function-scopes.html). In lean_workbook_4274 all 334 occurrences lead to the same binder b. They occupy 16 argument rows, one of which accounts for 268 occurrences. In lean_workbook_plus_19617 all 74 occurrences lead to the same binder f across 27 argument rows. Its most frequent argument accounts for 22 occurrences. Binder identity here includes the declaration and the entire binder route.

Across this sample no shared compound argument with a local function head resolves to two different binder occurrences. A diagram can therefore group these particular inputs by binder without conflating their targets. It still needs to preserve distinct arguments and occurrence multiplicities. The finding applies to these selected input shapes in six proof bodies; it gives no general uniqueness guarantee for shared open Lean expressions.

The [scope check](local-function-scopes.cjs) prunes source rows that cannot reach a qualifying application, visits every surviving occurrence, and independently checks the binder by counting enclosing binding bodies outward from the function reference. Per-proof position counts agree with the whole-proof census. The [records](local-function-scopes.json) retain one original argument and function occurrence per argument-row/binder pair. The [figure generator](scope-figure.cjs) groups by full binder route within each declaration.

## A counterexample to folding by expression row

Among all 561 theorem declarations with an available body in published-15, 36 contain a compound argument headed by a bound variable. In 16 of those the same argument row occurs with two different introducing binder rows. These 16 witnesses are in generated structure theorems; the fraction is descriptive for this inventory. The stricter test requires distinct binder rows. Two occurrences of a single binder row can also differ by route, which this test does not count.

In JacobiCore.Sol.mk.inj, argument row 211 resolves to D at binder row 357 and C at binder row 358. In CrossingData.mk.inj, row 86 resolves to two binders both printed as u (rows 244 and 255). An expression-row key loses the former distinction; adding the printed binder name still loses the latter. Sharing the expression drawing remains valid if its outgoing binding link depends on the selected occurrence. [Inspect both pairs](local-function-scopes.html#scope-pairs).

The [existence test](check-fold-aliases.cjs) prunes branches without a matching argument, compares full occurrence routes and independently checks each witness against the binding bodies on its path. It stops at the first qualifying pair per declaration. The [report](fold-aliases.json) includes every theorem in the denominator and one pair for each positive result.

## When the binder row is shared as well

The second test keeps the argument row and the binder row fixed, then compares the complete binder routes. Exactly one of the 561 published theorem bodies has such a pair for a compound argument with a local function head. That theorem, JacobiCore.Sol.mk.congr_simp, also belongs to the 16 with distinct binder rows. The four identifiers agree at both sites: argument row 282, function row 4, binder row 398 and printed name D. The binder occurs at depth 34 down the argument branch of application 791 and depth 31 down its function branch. Depth is descriptive; identity uses the full occurrence route.

[Switch between the two occurrences](local-function-scopes.html#repeated-scope). The row labels stay fixed while the selection changes all three destination routes. The checker verifies the first diverging field and reconstructs both binding contexts from the original packet. This demonstrates a provenance distinction. It does not establish different mathematical meanings for the two copies.

## Reconstructing a binding link from a selected binder

The [relative-path experiment](relative-bindings.cjs) enumerates every compound argument with a bound-variable head in the 36 qualifying published theorem bodies. It records the child slots from binder to argument and from argument to function. For each binder row it applies every recorded suffix to every recorded copy of that binder, checks the input and head rows, and resolves the function back to the selected binder. The reconstructed set of occurrence paths exactly equals the enumerated set across all 780 positions.

There are 538 distinct (binder row, argument row) pairs within declarations. Of these, 81 require more than one binder-to-argument suffix. A row pair therefore cannot in general select a use inside the binder. The 766 distinct relative templates reconstruct 780 occurrences. Nine templates apply to more than one binder copy, all in JacobiCore.Sol.mk.congr_simp. In the [worked figure](local-function-scopes.html#repeated-scope), selecting a binder copy supplies the prefix and both links are generated from the same two suffixes.

Writing each full input route separately takes 30,231 child-slot entries. Storing one prefix per distinct binder occurrence and one input suffix per template takes 2,939 + 19,889 = 22,828 entries. This counts input path slots under the stated representations. It excludes identifiers, function suffixes, lookup tables and encoding overhead; it is not a serialized byte or memory benchmark. [Per-theorem measurements](relative-bindings.json).

### Serialized size of the input routes

We compared four encodings of the same sorted input-occurrence paths. Full stores one digit per child slot in a string per path. Relative stores one list of binder prefixes and one list of input suffixes per binder row; decoding takes their Cartesian product. The two delta variants encode each string relative to its predecessor within its own sorted list. Each declaration has its own JSON envelope with the same SHA-256 owner, proof root and a single-digit layout identifier. The table gives sums of independent declaration payload sizes, before and after gzip at level 9.

| Input path layout | Published · JSON bytes | Published · gzip bytes | AI · JSON bytes | AI · gzip bytes |
|---|---:|---:|---:|---:|
| Full | 36,603 | 6,896 | 13,730 | 1,756 |
| Relative to binder | 30,334 | 7,318 | 13,415 | 1,762 |
| Full with prefix deltas | 15,297 | 7,052 | 6,505 | 1,648 |
| Relative with prefix deltas | 21,364 | 7,650 | 6,529 | 1,658 |

The published set includes the 36 nonempty theorem bodies (780 positions); the AI set includes all six previously measured bodies (408 positions), including four empty lists. All four layouts reproduced the exact sorted paths after serialization, compression, decompression and decoding. The binder-relative layout saved raw JSON bytes in aggregate but increased the gzip total for both sets. The six-byte difference on the AI set is too small to motivate a transport choice. Binding-relative links remain useful for navigation; these measurements supply no size advantage for switching the existing transport to that layout.

Reproduce from the repository root with `node research/proof-atlas/use-rank/relative-bindings.cjs --bytes`. The benchmark includes route payloads and their envelope. Source packets, function suffixes, type evidence, renderer state and allocation costs are outside the comparison. [Encoder and round-trip check](path-bytes.cjs) · [Per-declaration results](path-bytes.json).


## Variables required to read binder types

In six of the 230 distinct folded subtrees, reading the declared types of the directly used variables introduces an additional variable. In lean_workbook_4274, rows 173, 189 and 208 each refer directly to h₁; its declared type mentions b. In lean_workbook_plus_19617, rows 235, 259 and 283 mention h₀ and x; the type of h₀ also mentions f. For the remaining 224 groups, following binder types to closure introduces no additional enclosing variable.

Open **Enclosing binders** in a partition member of the h₁ or h₀ statement flow to inspect these cases. Each added variable has links to the binder, the original type that uses it and the reference inside that type. The search follows type fields transitively, deduplicating by occurrence route, and keeps one discovery witness per addition. Its scope excludes dependencies in the values of local definitions and semantic necessity.

The independent check scans the enclosing binders from innermost to outermost, counting the external indices in each required domain by propagating multiplicities down the source DAG. It compares the complete set with the reader and resolves each displayed witness back to its binder. [Per-proof counts](group-binding-results.json) · [Reader](inferences.html).

A [structural control](check-type-context-control.cjs) uses h of type P x, where P has domain A and x has type A. Starting from h adds P and x, then A once. This exercises a second dependency step absent from the six measured additions. The control constructs expression rows locally; it is outside the compiled corpus.

## Local statements and their proof inputs in Lemma 3.2

Following the outer lambda bodies and successive let bodies of JacobiData.slope_bound_abs encounters six local definitions. For each one, the Riccati reader compares the enclosing binders referenced in its defining value with those referenced in its declared type. It matches exact binder routes and displays the set difference. Five definitions have additional inputs.

| Local definition | Binders used in its proof and absent from its statement |
|---|---|
| hz | hab |
| hD | hz |
| hds | hd, hs |
| hprod | hz1, hz, hD |
| amgm | none |
| hsum | hab, hz1, hd, hs |

For example, following hprod to hD and then to hz exposes how local proofs are assembled. The reader links the statement, defining value, each additional binder and a reference in the proof. An earlier local binder also links to its own defining proof. The empty difference for amgm means only that the same enclosing variables are already present in its statement. The AM–GM application still has the two nonnegativity proof arguments shown above it.

These are direct lexical dependencies on the outer binding spine of one theorem. The count excludes definitions nested inside the displayed values and does not establish logical necessity. The [independent checker](check-riccati-local-inputs.cjs) enumerates occurrence paths separately for type and value, resolves every bound reference, and verifies all 11 additional input positions across the six definitions. [Riccati reader](riccati.html) · [Browser check](check-riccati-local-browser.cjs).

## Reading backward from the final expression

In the Riccati reader the final expression has four distinct local inputs. It references hsum, hprod and amgm once each and hds twice. Selecting hprod exposes hz and hD. Selecting hD leads to hz again. These seven directed dependencies connect all six outer local definitions to the final expression, with eight expanded references. The reader opens one immediate neighborhood at a time, links to the first reference at its exact source route, and returns along the reader's chosen path. The [independent occurrence enumeration](check-riccati-local-inputs.cjs) checks every local edge including its first witness and multiplicity. [Open the reader](riccati.html).

The same extraction on the six recorded AI proof bodies finds 14 outer local definitions. Their values contain zero references to earlier outer local definitions. Eight feed a final body directly; the other six have no recorded value-to-value path to it. Two proofs have no outer local definitions at all. This limits the use of the outer binding spine as a general proof outline. The test counts references in defining values and the final expression, excluding references solely in the enclosing let statements. It makes no assertion about steps nested inside these expressions. The [transfer check](check-spine-transfer.cjs) compares every eligible pair with a separately computed binder-use ordinal interval, including absent edges. [Per-proof results](spine-transfer.json).

## From the theorem result to a recorded inference

Open **Read backward from the theorem result** in the inference reader. It follows the outer lambda and let bodies to the final compiled application, shows its recorded conclusion, and exposes each proof argument at its original occurrence. The remaining type and value arguments expand separately. When a displayed argument contains calls in the reader's existing native port inventory, each link opens that call's proof inputs. Containment uses the full argument route as a prefix of the call route. This relation may span intervening constructions.

All six AI final applications have a checked trace in the primary occurrence-type records. Together they have 31 supplied arguments, including 12 proof arguments. Eight proof arguments contain 26 of the 28 calls in the existing port reader. For lean_workbook_plus_15068, which has no outer local definitions, the final application of le_of_not_gt has one proof argument; its subtree contains four recorded calls. In lean_workbook_plus_6206, all eight recorded calls are in the sixth argument of Or.casesOn. Four proof arguments across the sample contain no selected call; the reader still exposes their types and exact argument occurrences. The coverage concerns the fixed port inventory and does not measure mathematical importance.

The [builder](final-application.cjs) checks the selected full application, every stage's three recorded conversion results, actual type, slot and original argument route. The [browser check](check-final-application-browser.cjs) exercises every nested call link and checks its resulting selection and focus at 320 and 1280 pixels. The primary trace owner hash is retained with each theorem.

The two remaining recorded calls are inside defining values of outer lets. In lean_workbook_4274, final inputs 5 and 6 each reference h₃, whose defining value contains call 2. In lean_workbook_plus_19617, final input 2 references h₂, whose defining value contains call 3. These three one-definition paths expose the remaining two calls. Each path includes the original binder, a reference within that particular final argument and the defining value. This accounts for all 28 selected calls while preserving the distinction between containment and a link through a local definition.

## Reading the two final disjunction eliminations

Four final proof arguments in the six-theorem sample contain no selected port call. All four occur in two applications of Or.casesOn: the scrutinized disjunction and the left branch of each. The public elimination records project the wrapper onto Or.rec. The major premise occupies recursor slot 6 but original source slot 4. Constructor order assigns the left and right methods to source slots 5 and 6. Joining by the recursor slot alone would label the right branch as the disjunction.

The reader groups the branches using the validated constructor map. In both proofs the local result h₄ establishes the split between a = 0 and a = 1/2. Each branch links to its original assumption field, body and function head, even when the port inventory has no inner call there. The body head is a structural observation; the branch assignment comes from the recorded eliminator metadata. The two proofs have different immediate constructions:

| AI proof | Left branch body head | Right branch body head |
|---|---|---|
| [lean_workbook_20418](inferences.html#8892b0884f374abfa704f50ac89a3c31872a9d3f1aef369b1ae84e44891bde8d-0/final) | Eq.ndrec | Eq.ndrec |
| [lean_workbook_plus_6206](inferences.html#2e5bbcebb8129c823d4640a7c17f06b1a073c8a2df20889e65f4efc61f213bd6-0/final) | Or.casesOn | Or.casesOn |

The third final application with an elimination packet, False.elim, has an unavailable constructor projection in that packet. Its independently recorded application arguments remain visible. The [adapter](final-cases.cjs) uses the existing elimination validator, checks that the mapped argument routes agree with the primary application record and follows the lambda fields directly in the compiled term. The [browser check](check-final-application-browser.cjs) verifies both branch layouts and their links. These examples do not measure reader comprehension.

## Where the branch assumptions enter the next construction

For each outer case binder, the reader partitions its direct bound-variable references among the function head and ordered arguments of the branch body. A positive count links to the original argument and its first reference in source field order. Counts include references inside types and nested expressions. They measure occurrences of the particular binder, not the number of mathematical applications of the assumption.

| AI proof | Outer case | Branch body head | Source arguments containing the assumption |
|---|---|---|---|
| lean_workbook_20418 | Or.inl | Eq.ndrec | input 6 (1) |
| lean_workbook_20418 | Or.inr | Eq.ndrec | input 6 (1) |
| lean_workbook_plus_6206 | Or.inl | Or.casesOn | input 5 (4), input 6 (3) |
| lean_workbook_plus_6206 | Or.inr | Or.casesOn | input 5 (3), input 6 (3) |

Both outer splits test the same two equalities. In the first proof each branch body contains its own assumption once. In the second proof each outer assumption occurs in two arguments of the next call. The two inner Or.casesOn occurrences have no checked elimination projection in the loaded records. Their argument numbers retain source order, without assigning constructor identities from the outer call.

The [ordinal traversal](branch-assumption.cjs) uses the shared term and verifies that the partition sums to the body total. The [independent finite check](check-case-uses.cjs) expands the four bodies in source order, resolves each reference to its original binder, and verifies all field counts and first witnesses. The browser check verifies the displayed binder, argument and witness links in both layouts.

## Which operation takes the branch assumption?

The outer-branch use counts admit a finer reading. In lean_workbook_20418, each equality assumption is passed to Eq.symm (argument 4 of 4), inside argument 6 of the surrounding Eq.ndrec expression. In lean_workbook_plus_6206, the left assumption feeds congrArg six times and congr once. The right assumption feeds Eq.trans four times (argument 5 of 6) and Eq.mp twice (argument 4 of 4). Thus the outer split on the same two alternatives leads to different local equality operations in the two proofs.

The reader groups displayed references by the immediate application's head label and argument position within each branch-body input. Each item retains separate links to the exact reference and the application that accepts it. The 15 applications occupy eight distinct stored expression rows across the two declarations. For instance, all four Eq.trans applications use row 91074 but have distinct occurrence routes. The grouping describes direct syntactic use; it does not count independent mathematical ideas or supply new type judgments.

The extractor selects at most the first eight references per branch-body input in source field order and reports the full count. This covers all 15 in these four branches. The [independent checker](check-case-uses.cjs) enumerates the original occurrences, decomposes each reported application back into its function and ordered arguments, and verifies the selected argument against the exact reference. [Extraction rule](use-consumer.cjs).

### Recorded judgments at case-assumption uses

Two of the 15 consumer occurrences match a complete application in the six-proof port inventory at their full original routes. The join also requires the assumption reference to match the precise proof input at its original slot. In lean_workbook_20418, Eq.symm uses the branch assumption a = 1 / 2 and returns 1 / 2 = a. In lean_workbook_plus_6206, Eq.mp takes the same assumption at slot 4. Slot 3 supplies equality of the propositions (a = 1 / 2) = (a = 2⁻¹), and the result is a = 2⁻¹. The reader links that additional proof input as well as the full recorded inference.

The other Eq.mp use in the same branch shares application row 91274 and all 13 enclosing binder occurrences in order. Its link opens the recording at the original call. The two application routes remain distinct, and only the recorded route counts toward direct coverage. This comparison requires the same declaration index, root, expression row, proof input slot, input row and ordered binder routes. Exactly one of the 13 uses without a direct recording qualifies. The coverage label counts the displayed uses matched by this port inventory; other native evidence collections were not exhaustively audited. The [source join](case-use-judgments.cjs) and [independent checker](check-case-uses.cjs) respectively match against the rendered inference records and the checksum-verified native port entries. No new Lean build was required.

### When a shared application changes its binder target

Across the six compiled proof bodies, 79,431 application rows occur at least twice (rows counted within each declaration). Comparing the first and last occurrence in expression-field order gives:

| Endpoint comparison | Application rows |
| --- | ---: |
| Identical ordered enclosing binder occurrences | 52,375 |
| Different enclosing context, same directly referenced outer binder occurrences | 21,616 |
| At least one variable refers to a different outer binder occurrence | 5,440 |

The last count is a lower bound on rows exhibiting a change anywhere among their occurrences. Equal endpoints can hide an intermediate change. Different binder identities establish a difference in provenance; this test does not compare the mathematical values of the binders. A folded diagram can reuse the expression shape, but a variable link must resolve at the selected occurrence.

The [checker](check-shared-application-contexts.cjs) traverses the stored graph in forward and reverse child order, retaining one parent per row per traversal. A bottom-up set of free indices determines which outer binders each row references. The checker also expands the two smallest proof bodies (6,994 and 66,609 occurrences) and reproduces all three categories by independent variable lookup. The [results](shared-application-contexts.json) include one pair per proof with a relative variable route verified against both binder targets.

The all-occurrence calculation finds **5,482 of 79,431** repeated applications with at least one changing outer binder target. Comparing only endpoints missed 42. In lean_workbook_plus_39831, the argument of application row 276 is variable index 5 at all three recorded routes. It refers to the outer binder `a` at the first and last occurrence and to the next binder `b` at an intermediate occurrence. The results file records the three application routes and the relative reference.

For the exact count, process reachable rows from parent to child. For each directly referenced free index, collect its possible binder occurrences, retaining a single identity or the fact that at least two exist. Entering a binder body introduces the parent occurrence at index zero and shifts the inherited indices. A parent row reached multiple times already denotes distinct binder occurrences. Every incoming edge contributes all its parent occurrences, so merging these summaries preserves whether each index has one target or several. The computation stores summaries on the compressed graph. The independent control expands the three proof bodies with at most 500,000 occurrences and checks the classification of each repeated application by resolving its variable references.

The inference reader includes one switchable occurrence diagram per theorem. In the [intermediate occurrence of row 276](inferences.html#f596c3ecdbe411dbee9539b59d1010f6a711ff31f1e3eda778e45ac070641f02-0/sharing/1), switch among First, Intermediate and Last to trace the same variable to its binder. Application, variable and binder each link to their own compiled occurrence. The example belongs to the selected theorem and can be inspected from any recorded call in it.

### Binder sharing outside the six reader examples

The [corpus check](check-sharing-corpus.cjs) classifies every repeated application row in the theorem bodies of four local edition manifests, excluding the six development indices. Each count refers to rows within a declaration. The two SE(2) editions overlap and are reported separately.

| Edition | Theorems tested | Theorems with changing targets | Repeated application rows | Rows with changing targets | Theorems independently expanded |
| --- | ---: | ---: | ---: | ---: | ---: |
| Published SE(2) | 561 | 246 | 250,718 | 7,239 | 315 |
| Working SE(2) | 1,083 | 421 | 582,545 | 14,452 | 668 |
| Remaining Goedel sample | 14 | 13 | 30,286 | 640 | 3 |
| Recursion controls | 23 | 11 | 782 | 34 | 20 |

The verifier hashes each compiled index and checks its proof-body occurrence count before classifying its compressed graph. For every body with at most 2,000 expanded occurrences, it also visits every variable and compares the classification row by row. All theorems in these manifests had a body. Definitions and other declaration kinds are outside the denominator. The 14 Goedel proofs complete the available 20-proof sample alongside the six development examples. These are finite corpus measurements; their frequencies do not estimate prevalence in the parent AI dataset. [Per-edition counts and result digests](sharing-corpus.json).

### How often a shared application with changing targets occurs

A repeated application row contributes once for each path to it from the proof root. Counting duplicate child slots separately gives the following exact expanded counts. The percentage uses all application occurrences in the edition as its denominator.

| Edition | Occurrences of applications with changing outer targets | All application occurrences | Share |
| --- | ---: | ---: | ---: |
| Published SE(2) | 61,038 | 24,610,408 | 0.248% |
| Working SE(2) | 12,302,955 | 333,543,830 | 3.689% |
| Remaining Goedel sample | 184,266 | 6,577,966 | 2.801% |
| Recursion controls | 2,508,757,194,025,438,550,053 | 6,308,786,473,211,049,034,590 | 39.766% |

Concentration matters. In the working SE(2) edition, `JacobiConcrete.AmplitudeChart.midpoint_polynomial` accounts for 10,781,305 of the 12,302,955 affected occurrences (87.63%). The synthetic `AtlasExamples.shared_induction_64` accounts for over 99.99% of the affected recursion-control occurrences. These totals count possible selections in an expanded tree. Reader behavior and the number of incorrect links under any particular default binder assignment require separate measurements.

The checker propagates exact integer path counts through each compiled graph. It independently sums marked descendants from the leaves to the root for every theorem and explicitly enumerates the small-proof controls. Per-edition results include the largest contributor and its exact source index hash.

The occurrence number selects any appearance of the displayed application row in the theorem body, in source-field order. The six examples have 2, 2, 2, 3, 113 and 2 occurrences respectively. For [row 276, occurrence 57](inferences.html#f596c3ecdbe411dbee9539b59d1010f6a711ff31f1e3eda778e45ac070641f02-0/occurrence/57), the reader descends the intervals containing 57, then resolves the selected variable against the enclosing binders on that route. The table stores only reachable ancestors of the example row. The browser check independently enumerates every target route in order and checks the application, variable and binder destinations at each of the 124 occurrences.

In the complete proof library, select an application and open **Find occurrences of this application**. The count and ordinal are relative to the selected type, body or reduction-rule root. Choosing a number updates the ordinary expression selection and its URL. Child and enclosing-binder controls then operate on that exact path. The counter runs when the panel opens and uses at most one integer count per stored row between the target and root. The paged library and the occurrence-window reader have separate data-loading models.

The [ordinal check](check-row-ordinals.cjs) independently enumerates all 3,734 application positions across the type and body of lean_workbook_plus_19617 and compares both directions. A binary DAG with 64 levels checks a rank above the JavaScript safe-integer range. The [library browser check](check-library-occurrences.cjs) follows application 276 through occurrence 57 to its variable and enclosing binder at phone and desktop widths.

### Occurrence selection using authenticated source pages

The [paged row selector](paged-row-occurrences.cjs) scans compiled rows from the target to the selected root in ascending order. It retains a count and ordered child slots only for rows in this interval that reach the target. Choosing an occurrence descends these counts. Ranking a route adds the counts of preceding siblings. Both operations use the retained index without fetching more pages.

The [comparison](check-paged-row-occurrences.cjs) checks all 124 ordinals across the six AI examples against the complete graph. It also checks eight positions for application row 3 of the synthetic shared-induction control, whose count is 1,217,485,108,864,830,406,656. The control includes adjacent positions across the JavaScript safe-integer boundary. Two source pages and two page-index entries were allowed per cursor. Across the six AI queries, at most 512 decoded source rows were resident in the page cache, with 9–312 additional rows retained in the navigation index. These counts exclude runtime and object overhead.

Cold-start transfer was higher than downloading the complete compressed packet in all six AI examples (1.24–1.44 times its size). The largest query issued 366 local asset requests. This is a working-set tradeoff. The full scan would be expensive as a default operation on a remote site. The experiment measures asset bytes from a cold local fetcher, without HTTP caching or timing claims. [Results and source hashes](paged-row-occurrences.json).

### Transfer cost of a declaration-wide occurrence index

For selecting a compiled occurrence and resolving its bound variables, retain the declaration's ordered roots, the constructor at each stored row, its ordered child distances and the index of each bound variable. These fields preserve every expression-field route and binder target. Names, literal values, universe levels, metadata and recorded typing judgments still require their source records. A source SHA-256 in the index identifies the exact original, and a separate digest covers the compressed index. The experiment checks agreement with the original locally.

Across all 20 available AI proofs (268,356 rows), the compressed source packets total 1,570,446 bytes. Projecting the routing fields into gzipped JSON takes 765,832 bytes. Encoding the same fields as unsigned base-128 integers before gzip takes 676,542 bytes (43.1% of source size in aggregate, 12.0–47.0% individually). For the Riccati proof, the binary index takes 7,084 of 24,165 bytes. The synthetic 64-level induction control takes 752 of 4,709 bytes. All three byte comparisons use gzip level 9. These are alternative file sizes for navigation, not savings when a client downloads both the index and the original.

The [checker](check-occurrence-index-transfer.cjs) round-trips the binary index, checks every constructor, child slot, root and variable index against the source, and follows all 124 example occurrences to the same binder targets. Eight large-control rank/route checks include consecutive ranks around the safe-integer boundary. The decoder materializes the projected graph in memory. Peak browser memory, loading times and combined transfer for on-demand source details have not been measured. [Per-proof sizes and digests](occurrence-index-transfer.json).

### Reading the name at the end of a binding link

Across the six AI examples, the compact routing indices require 520,577 bytes. Resolving a selected occurrence, following its variable to the binder, and reading the binder name from authenticated source pages adds 36,662 compressed bytes. There were three or four page-asset requests per declaration, including page metadata. Visiting all 124 occurrences in source order required no further asset reads after the first selection in each declaration: the binder rows used by each example shared a resident page. This locality is specific to these examples.

A separate gzip file per declaration containing the source hash and the binder names in compiled row order costs 1,527 bytes across all six. The checker decoded all 358 binder labels and compared each with its original row. It also verified both routes and names at every example occurrence. Equal displayed names still use distinct binder routes. Total asset sizes were 522,104 bytes with the label files, 557,239 with source pages, and 1,140,910 for the full packets. These measurements exclude HTTP headers, descriptor distribution and browser heap. The label files contain display names only; types and declaration bodies still need their own evidence. [Reproduction](check-binder-label-transfer.cjs) and [per-proof results](binder-label-transfer.json).

**Declared types on binding links.** For each of the 124 selectable positions in the six examples, the diagram follows the variable to its binder and reads field 0 in the context preceding that binder. The formula uses the existing constructor and call notation catalog. Its two destinations distinguish the domain in the proof from the corresponding domain in the theorem statement, where the parallel lambda and Pi binders share the same domain row. Selecting a variable in the formula highlights all displayed uses of its exact binder and the local introduction if present. The two links beneath the selection open that particular use and its binder. The two dependent formulas contain 16 variable occurrences altogether. A separate traversal enumerates all bound-variable routes in each displayed domain and checks every interactive selection against that inventory.

In [the recurrence example, occurrence 2](inferences.html#4738e6bbc69dc2ee6d52f05f1c8e39f0509d2ee051ffab8ecd3587f9025c73b9-0/occurrence/2), a variable points to the recurrence hypothesis. Its declared type quantifies a local natural number and refers back to the sequence b. At occurrence 1 the same variable row points to b itself, whose type is Nat → Real. Conversely, in the 113-occurrence integer example the binder changes while its displayed type stays Int. These are declared type expressions from the compiled binder fields, with no additional typing replay or mathematical interpretation.

### Which variable uses survive the first formula view?

The 48-node notation scene is rooted at the complete theorem statement. Each bound-variable occurrence is either visible, inside a collapsed region, or inside an operand suppressed by the notation at that level. The [checker](check-formula-reference-coverage.cjs) independently enumerates occurrence routes and resolves their binders. It then opens each omitted region containing at least one variable, with the original surrounding context and the same 48-node budget. It checks the accounting at every step and requires every original reference to appear exactly once with its original binder.

| Statement inventory | References | Visible initially | Inside collapsed regions | Inside notation operands | Total panels to recover all references |
| --- | ---: | ---: | ---: | ---: | ---: |
| Six AI development examples | 107 | 65 | 42 | 0 | 18 |
| Fourteen held-out AI examples | 153 | 117 | 36 | 0 | 23 |
| Published SE(2), all 561 theorems | 7,848 | 3,062 | 3,574 | 1,212 | 2,278 |

The AI sample alone misses an important failure mode: in 85 SE(2) statements the notation itself hides variable references. For example, the initial formula for `JacobiData.a_deriv_form._simp_1_5` has 11 visible references and 24 more in suppressed operands, even though no displayed region has hit the scene budget. In the Riccati statement, 12 of 24 references are visible initially. Three additional panels recover the other 12. Across SE(2), the deepest recovery required 18 successive openings. These are source-grounded reconstruction measurements, with no claim that the sequence is convenient for a reader. [Results and corpus digest](formula-reference-coverage.json).

At the type root of a theorem in the complete library, **Trace variables in collapsed regions and omitted operands** lists the operands containing references. Each entry links to the operator and its operand. Selecting a reference number gives the exact variable and binder destinations without unfolding its enclosing regions. Counts include distinct occurrences of a shared row and use integer arithmetic on the stored graph. The check covers all 1,212 references suppressed by the first notation view across the 561 published theorem statements. The separate browser check exercises all 24 in the largest example, including five inside the instance operand of exponentiation. The control also lists collapsed regions that contain variable references.

### References inside complete proof bodies

At a theorem's proof root the same control indexes the body in its own lexical context. Across the 20 AI proof bodies the first bounded notation scene shows 209 of 696,817 variable occurrences; the remaining 696,608 are in 55 collapsed regions. In the Riccati body, 15 of 4,496 references are visible and the other 4,481 lie in two regions. These counts concern the chosen 48-node notation, not typical reader behavior or distinct mathematical assumptions.

The [body check](check-proof-body-references.cjs) verifies that visible references and hidden-region intervals partition the full source-order reference range without gaps or overlaps. It checks every ordinal of regions with at most 512 references and samples large regions, independently reconstructing the selected ordinal and binder from the route. The checks cover 1,975 selections across the AI bodies, 10 in Riccati and 145 in the 64-level induction control. The [browser check](check-library-occurrences.cjs) follows the last reference of each collapsed Riccati region at two viewport widths. [Per-proof counts](proof-body-references.json).

**Which inputs does a fold use?** Within a collapsed region, open the scope breakdown and select an enclosing binder. Its reference numbers now select just the uses of that original binder in the region, in source order. Crossing a lambda or forall body increases the local binder depth by one, as does crossing a let body. A bound index at or above that depth refers outside the region. Fixing the difference selects one enclosing binder. Memoization is limited to 262,144 row/depth states for the active query.

In the larger Riccati fold, 4,400 of 4,476 references cross its boundary. J and p account for 2,195 each. The six remaining inputs (hd, hs, hz1, hz, hD and hab) account for ten references in total. One can select hd and inspect precisely three occurrences. These counts describe compiled term uses; frequency gives no measure of mathematical necessity. Across the AI corpus, 692,426 of 696,608 hidden references use enclosing binders. The verifier compares per-binder counts with an independent free-index calculation and checks every filtered occurrence in regions containing at most 5,000 references, including both Riccati regions. Larger regions use the sampled ordinal checks described above.

**What receives a selected hypothesis?** If a selected variable is supplied directly to an application, the library shows its position among the compiled arguments, the function head, and the complete call at that occurrence. If the variable itself is in function position the display identifies that role. Other arguments that are directly bound variables have separate links to their use and binder. All slots include implicit arguments.

In the larger Riccati fold, the three occurrences of hd supply argument 7 of 8 to mul_pos, argument 5 of 6 to JacobiData.T1_T2_same_sign, and argument 6 of 6 to abs_of_pos. The middle use joins hab, hz1 and hs at the same occurrence of the sign lemma, in slots 3, 4 and 6 respectively; J and p fill slots 1 and 2. This identifies a specific formal inference connecting four hypotheses. It does not certify a correspondence with a particular article sentence. The checker compared the application position and each reported variable argument against a separate source-port reconstruction for all 4,481 hidden Riccati references and 16,391 distinct sampled AI references. The [results](proof-body-references.json) retain occurrence routes for the low-frequency Riccati inputs.

**Where does the result go?** “Follow the result” traces a receiving application's output through enclosing calls to its first structural boundary. In the Riccati example, the three uses of `hd` reach different destinations. The result of `mul_pos` defines `hds`. The result of `JacobiData.T1_T2_same_sign` supplies the disjunction examined by `Or.casesOn`. Its two branches establish the same absolute-value identity, and the case expression defines `hsum`. The result of `abs_of_pos` enters the body of that local definition. Selecting a branch opens its exact compiled occurrence. The branch formulas appear only when the recorded elimination evidence matches the call and its major argument.

The source-port check reproduced 2,277 distinct receiving-call paths in Riccati, 15,978 across 20 AI proof bodies, and 99 in the induction control. These are paths from the selected reference sample. Each path ends at the first enclosing structural field or expression root. The browser check verifies all three Riccati destinations and both case-branch formulas and links at widths of 320 and 1,280 pixels. These checks establish structural fidelity. Reader comprehension remains unmeasured.

**Does a local definition feed the rest of the term?** Among the seven distinct let rows reachable from the Riccati proof root, five bind a variable used once in the body and two bind variables used repeatedly. Following the defining links for `hds` and `hsum` reaches binders with two uses and one use respectively. Across 20 AI proof bodies, seven contain let rows. Of 48 distinct rows counted within their declarations, 33 have zero body references, six have one, and nine have several. This makes drawing a downstream use edge for every local definition unsound. Zero counts concern explicit variable references in the compiled body; they say nothing about the author's motivation. The [checker](check-local-definition-uses.cjs) compares the reader's counts with a separate free-index calculation and exhaustively resolves the Riccati witnesses. [Per-declaration counts and exact occurrence routes](local-definition-uses.json).

Across all 561 published SE(2) theorem bodies, 192 contain local definitions. The 733 distinct let rows comprise 23 with zero references in their body, 515 with one, and 195 with several. Counting occurrences gives 741 definitions: three shared rows appear at multiple locations. All three have one body reference per occurrence. The library's “Find occurrences of this local definition” control navigates between those locations while preserving the row and changing the source route. The browser check follows the first-to-last route for each shared row at both viewport widths. The 20 AI examples have no shared let rows. These inventories have different proportions of unused bindings and do not estimate a population difference between human and AI proofs.

The [Riccati local-definition diagram](riccati-local-flow.md) places four references inside the values of other definitions and five in the remaining proof term. In particular, `hprod` uses three earlier facts. The two uses of `hds` enter different calls. Each arrow has an occurrence-linked witness in the table. The [generator](riccati-local-flow.cjs) resolves every use to its exact binder, checks its destination by a second traversal and checks the receiving argument against the compiled application.

**Transfer to AI proofs.** Across the 20 Goedel sample bodies (82,340,980 expanded expression occurrences), the Riccati rule yields an edge between local definitions in two proofs. There are 31 distinct source–destination–field triples, accounting for 33 uses in values and zero in local types. Another 23 uses reach the remaining proof term. Thirty of the 31 edges come from a single proof. The [per-proof records](ai-local-flow.json) give the two binder routes and a witness occurrence for every edge.

Of 696,817 bound-variable occurrences, 696,706 resolve to lambdas, 55 to forall binders and 56 to lets. In particular 692,587 resolve to leading lambdas of the proof term, 35 to lambdas receiving an argument along a literal application spine, and 4,084 to other lambdas. Occurrence counts weight repeated subtrees by their multiplicity. A view tracing the uses of leading proof inputs has substantially greater reference coverage on this sample. Whether it identifies mathematically informative uses remains open. The [audit](check-ai-local-flow.cjs) traverses the full bodies, checks category totals against the reference inventory, and checks each local binder count against the independent scope counter.

Grouping the 692,587 leading-input references by binder and receiving role gives 937 groups. Among 93 leading inputs, 87 have at least one use. The median used input has two groups and the largest has 49. In `lean_workbook_20418`, 78,671 of 90,194 uses of `a` occupy the fifth compiled argument of `HPow.hPow`. Members of one group can have different surrounding goals and other arguments. The [expandable inventory](leading-input-receivers.md) links to one compiled witness per group. Its [generator](leading-input-receivers.cjs) compares every binder total with a separate scope count.

In the library, selecting a leading lambda in the Goedel sample exposes **Where this input is used**. Opening it loads the selected declaration's role inventory. Links resolve to the first variable occurrence in each role; its enclosing binder button returns to the selected input. The reader checks every displayed witness against the loaded term and its binder route. The browser test follows the most frequent role for the 90,194-use input in `lean_workbook_20418` and checks the empty state of an unused input at 320 and 1,280 pixels. Regenerate the 20 declaration packets with `node research/proof-atlas/use-rank/leading-input-receivers.cjs --write-packets`.

**Transfer to published SE(2).** Of 561 theorem proof bodies, 551 begin with at least one lambda. Among 2,076 leading binders, 2,024 have references. Their 697,014 occurrences occupy 9,245 binder-specific roles, with at most 39 roles for one binder. All binder totals matched the independent scope count. Each application group's first witness also matched the argument or function recovered from the full receiving call. At a proof root, open “Where this input is used” and select a proof input by its name and position. In the Riccati bound, both J and p have 2,204 uses across 11 roles apiece. The three uses of hd occupy separate roles. The browser test follows its sign-lemma use from the proof root at both widths. The ten proofs whose compiled bodies do not start with a lambda are outside this projection. Run the generator with `--published --write-packets` to reproduce this edition.

**Selecting any use within a role.** The first-use link remains available. For a repeated role, “Choose a use” accepts its source-order occurrence number. Each declaration packet stores differences between consecutive preorder offsets, as variable-length integers, for its repeated groups. The reader decodes up to the selected ordinal, descends by compiled subtree sizes and checks the original binder route. Across both editions, 4,877 repeated groups contain 1,384,296 references and require 2,587,982 offset bytes before base64 encoding. Singleton groups retain their existing source link. The generator checks the first, middle and last ordinal of every group against the compiled binder and receiving role. The two-width browser test selects use 78,671 of the exponentiation role, verifies the exact route and returns to the original binder. This encoding grows with the number of repeated references; its measurements apply to these two inventories.

**Recovering ordinals from sharing.** For literal constant argument groups whose offset stream would occupy at least 4,096 bytes, the generator tries a count on the compiled DAG. It tracks the selected binder's de Bruijn index and whether the current function spine belongs to a matching full application. This prevents an argument to a partially applied constant from being counted under the wrong arity. Counts are arbitrary-precision integers. Selecting an ordinal subtracts counts of preceding child slots. The query uses a one-byte-per-row head-presence table and separate limits of 65,536 counting states and cached spines. Groups exceeding the limits retain the offset index.

Across the AI and published SE(2) inventories, 76 groups containing 931,587 references use this representation. The other groups require 803,430 raw offset bytes, down from 2,587,982 across the original inventories. This comparison excludes group metadata, encoding and transient query memory. The generator checks the exact total and compares sampled routes with the earlier offset method for every converted group. A [synthetic sharing test](check-shared-role-index.cjs) represents 2^64 uses in 133 rows, uses 129 counting states and checks exact routes on both sides of the JavaScript safe-integer boundary. This control exercises structural sharing and carries no Lean typing claim.

**Where do the uses separate?** “Explore proof branches” skips the common route of the first and last use in a role. At the first diverging constructor, the reader shows the occupied child fields, their counts and links to their exact compiled occurrences. Selecting a child repeats the operation within its contiguous ordinal interval. The field labels distinguish structural branches from mathematical case splits. For the 78,671 exponentiation uses of `a` in `lean_workbook_20418`, the first split is at lambda row 86,582. One use is in the binder domain and 78,670 are in the body.

The generator's `--branch-summary` check (add `--published` for SE(2)) verifies first-split interval endpoints and counts for all 4,877 repeated groups against the earlier offset index. In 190 of 815 AI groups and 1,254 of 4,062 SE(2) groups, at least 90% of occurrences lie in one child. The display therefore reports the counts explicitly. The synthetic sharing control also checks 64 successive splits of a group with 2^64 occurrences. Browser checks open the large AI split, follow a branch, and restore the preceding split at both widths.

**Which arguments contain the uses?** At an application split the branch reader follows the function spine to its complete enclosing call and shows the occupied function or argument positions. The counts apply to the currently selected interval of uses. Compiled argument numbers include implicit arguments. Of 4,877 repeated groups, 2,635 first split at an application. For 664 of these groups, uses occupy at least three positions of the call. In `lean_workbook_3485`, the 421 selected uses of the leading input in the fifth argument of exponentiation occur within five arguments of a single `Mathlib.Tactic.Ring.Common.add_congr` call. Arguments 4, 6, 8, 9 and 10 contain 1, 1, 371, 46 and 2 uses. The corpus check compares every displayed argument route with an independent reconstruction and verifies the interval endpoints. The browser test checks all five links at both widths.

**Which parameter receives a branch?** For a same-edition constant or a bound function, “Show declared parameters” reads its declared type and follows the literal forall prefix. The argument link opens the supplied term in the caller. The parameter link opens the corresponding binder in the declaration or local type and identifies its visibility. For example, argument 1 of the `CrossingData.mk.noConfusion` call in `CrossingData.mk.inj` corresponds to implicit parameter `P`, row 175 of the callee's type root. The two-width browser check follows that cross-declaration link.

At the first split of each repeated role in published SE(2), 146 of 4,972 occupied argument positions have a parameter available by this rule, spread over 78 splits. Of the rest, 4,791 refer to constants outside the edition and 35 lie beyond the literal forall prefix. All 1,262 occupied argument positions in the AI inventory refer to constants outside its edition. Counts are per displayed position and can include repeated calls across groups. Extending this view to imported constants requires their matching compiled signatures. A formal parameter name alone does not explain the mathematical purpose of the argument.

**Imported parameter evidence.** The reader can also open a parameter from the existing kernel-checked notation signature catalogue. The signature details give the binder row, its domain graph and the signature digest in that export's namespace. For the Goedel edition, eligibility is limited to the core-only export and its matching compiler. The published SE(2) reader also uses the [cache-attributed Riccati signature export](../type-notation/README.md). A parameter in a declaration provides declared syntax; it is distinct from a typing judgment at the selected caller occurrence.

This raises first-split SE(2) coverage from 146 to 368 of 4,972 occupied argument positions (189 splits). The 222 additional positions include the two arguments of the imported conjunction in `CrossingData.branch_range`. Neither this signature catalogue nor its core subset supplies any of the 18 external names accounting for the AI sample's 1,262 positions. The most frequent missing AI signature is `Mathlib.Tactic.Ring.Common.add_congr` (469 positions); the most frequent SE(2) signature still missing is `Or.casesOn` (768). The branch summary ranks missing signatures by measured position count.

**Targeted core signature extraction.** The two missing-name inventories had 72 distinct entries. A new run of Lean 4.33.1 resolved 29 by importing Lean alone and checked each declaration type with `Lean.Kernel.check`. The executable hash and compiler string matched the recorded notation runtime. Re-running the [exporter](export-core-signatures.py) with `--lean PATH --check` reproduced the 48,292-byte catalogue. Its [requests](core-signature-requests.json) are frozen before this coverage change. This checks declaration types; the corpus proof bodies were not replayed in this run.

Using these 29 signatures raises first-split parameter coverage to 386/1,262 occupied argument positions in the Goedel sample and 3,948/4,972 in published SE(2). For the AI proof `lean_workbook_20418`, the branch reader opens the fifth parameter of `Or.casesOn`, named `inl`, at row 27 of its exported signature. The browser check follows it at both widths. The remaining Mathlib ring lemma `Mathlib.Tactic.Ring.Common.add_congr` accounts for 469 AI positions and 258 SE(2) positions.

**Dependent argument types.** In “Show declared parameters”, a parameter whose domain mentions earlier parameters exposes “Earlier arguments in this parameter type”. Each link goes to the corresponding operand in the selected call. One exact bound-variable occurrence in the declared domain witnesses each link. For the left handler of `Or.casesOn`, those inputs are `a`, `b` and `motive`: the handler receives a proof of `a` and returns the motive applied to a left injection into `a ∨ b`. Two variable occurrences here share signature row 10 but have different lexical routes and binders.

Across first application splits with available parameter signatures, 321 of 386 AI positions and 2,729 of 3,948 SE(2) positions have at least one such dependency, yielding 682 and 5,538 position-to-position links respectively. The audit independently computes free-index support, resolves the lexical witness to its earlier binder, and reconstructs the actual argument at the caller. It checks declared syntax; it does not perform dependent substitution or kernel-check the instantiated domain at each call.

**Which inputs appear in the result?** When the recorded forall prefix covers every supplied argument, the branch reader opens its remaining codomain. The displayed result precedes substitution. Links resolve its parameter references to exact operands of this call. For example, the declared result of `Or.casesOn` is `motive t`. Its references point to the motive (slot 3) and the disjunction being eliminated (slot 4). The two branch handlers are supplied to the call but do not appear in that result expression.

Across first application splits, the available signatures yielded result expressions for 154/589 AI splits and 1,628/2,046 SE(2) splits. Earlier parameters occur in all 154 AI results and in 1,565 SE(2) results. The checker independently reconstructs the free-index support and source operand locations for 282 and 2,568 resulting links, respectively. The two-width browser check verifies the formula and both destinations for the AI recursor example. These are declaration-level dependencies; no result type was inferred afresh or kernel-checked at these call occurrences.

**What type did Lean record at this call?** The branch view joins the declaration result to the existing primary and case-typing observations by proof edition, index and exact occurrence route. It also shows an exact recorded type when the declaration signature is absent. In `lean_workbook_20418`, the declared `Or.casesOn` result is `motive t`. At the selected call, the recorded type applies a lambda to `h₄`; its body states that either all three numbers are zero or all three are one half. Its bound variable has zero references in that body. This observation concerns the result expression, not the use of the disjunction in constructing the proof.

Of the first application splits, 170/589 AI positions and 17/2,046 SE(2) positions have an exact checked observation in these two inventories. Both the declared and recorded result are available at 78 and 17 positions respectively. In 28 AI positions and 5 SE(2) positions the recorded result is an application of a lambda with zero references to its parameter. The audit verifies native package hashes, source routes, and counts against independent free-index support. Counts refer to displayed positions, which may share the same call. The browser test checks the AI example and source link at both widths. No fresh kernel replay was performed.

**Which assumption belongs to each case?** At a call with a checked elimination record, the reader shows the expression being eliminated, the constructor associated with each handler, and its recorded input domains. Counts distinguish the selected role's occurrences inside that handler from references in its body to its own input. In `lean_workbook_20418`, the disjunction is `a = 0 ∨ a = 1 / 2`. Each handler contains one selected use of `a` in the fifth argument of `Eq.ndrec`, and each handler's equality assumption is referenced once. The links identify the matched handler, its input type and its binder by source occurrence.

The first-split audit found checked elimination evidence at 35 AI positions (three distinct calls) and five SE(2) positions (one distinct call). These yield 75 displayed handler positions and 80 recorded handler-input positions, all of which have body references. Counts weight repeated display positions. The constructor-to-handler mapping uses the recorded source-slot permutation; separate checks reconstruct the actual operands and binder-domain routes. The two-width browser test verifies both equality assumptions, their binder links and their distinct counts in the AI example. This uses existing native evidence with no new Lean replay.

**Where is a case input consumed?** “Follow this input” opens the selected source-order reference to a checked handler binder and the enclosing application that receives it. The reader reuses the scoped count for each child to skip whole subtrees while selecting an ordinal. It retains the exact route when a compiled row has several occurrences. In the left equality case of the AI example above, the assumption enters `Eq.symm` in argument 4 of 4.

Across the four distinct case calls found at the first splits, the audit checked all 52 distinct handler-input use locations (21 AI, 31 SE(2)). They account for 444 displayed use positions when repeated views of a call are included. Every use in this sample has a receiving application. A separate ordinal index reproduced each use; each use resolved to its original binder and matched the reconstructed source argument or function position. Browser tests followed the unique use and receiving call in both equality cases at both widths. This is a trace of compiled variable use; it does not measure mathematical necessity.

**Where does the reversed equality go?** In the left equality case of `lean_workbook_20418`, the result of `Eq.symm` supplies the equality parameter `h` of `Eq.ndrec`. The compiled call has ten arguments. A fresh export using the pinned Lean 4.33.1 executable checked the declaration's six-parameter prefix, so the reader can distinguish the transport itself from four subsequent applications of its result. Its motive (source row 85,456) is a lambda whose body starts with a forall and contains seven references to its input. The reader links the motive, its body and the two endpoints of transport to their source occurrences. These are syntactic occurrences; no normalization or proof replay is implied.

Across all 52 distinct checked handler-input uses previously audited, 43 first receiving calls pass their result to another application and nine end at a lambda or forall field. Two distinct use paths follow `Eq.symm` to the sixth input of `Eq.ndrec`. The branch summary reconstructs each occupied source port. Browser checks verify all ten links in the left-case example at both viewport widths. The core signature replay now checks the original 72 requests plus the additional `Eq.ndrec` request.

**What does the transport motive vary?** When the recorded signature ends in a bound function applied to a bound argument, the reader identifies that function's supplied lambda by its formal slot. It partitions the lambda body into the domains of its leading forall binders and the remaining conclusion. The reference index advances under each binder. A domain links to its compiled expression and, when present, the corresponding subsequent argument of the transported result. The view retains a residual type after 64 binders.

In the left equality case of `lean_workbook_20418`, the four domains named h₀, h₁, h₂ and h₃ contain 1, 2, 1 and 1 references to the motive input. The conclusion contains two. The four domains correspond in order to source arguments 7–10. The structural check reproduced the counts using an independent source-order interval index. Browser checks verified the five region routes and the four supplied argument routes at 320 and 1,280 pixels. These links describe the formal family before substitution. They do not establish which subexpressions survive normalization.

### Downstream uses of local definitions in the AI sample

Run `node research/proof-atlas/use-rank/check-ai-local-flow.cjs --consumers` from the repository root to emit each binder, its value row, and every receiving field or application slot with occurrence routes and the declaration index hash. The traversal resolves each reference against the binding stack, compares it with the source binder lookup, and compares per-definition totals with the compiled reference index.

Across 20 proof bodies (82,340,980 expanded occurrences), seven contain local definitions. Of 48 definition occurrences, 33 have zero explicit uses, six have one, and nine have multiple uses (maximum 14). Of 56 explicit uses, 55 are direct arguments to named constants. One reference occupies a let body. Some named calls construct propositions: the three inputs to `Eq` in `lean_workbook_plus_62755` cannot be presented as three deductions. This supports showing a selectable set of exact uses, including an empty set, while retaining each destination’s role. No occurrence-level typing or reader comprehension was measured by this census.

### Comparing the two sides of an equality

In the 20 AI proof bodies, 3,909 of 16,586 fully applied Eq occurrences have different operand rows. A comparison in constructor-field order locates a difference inside the operands for 3,307 occurrences, with maximum relative depth 13. The other 602 differ at the operand root. The 512-pair budget suffices for every case in this sample. The witness records a constructor or payload difference in the stored expressions. It makes no claim about definitional equality, the proof of the equality or which difference a mathematician would emphasize.

Run `node research/proof-atlas/use-rank/check-equality-sides.cjs` to recompute expanded counts and compare the bounded traversal with a recursive control.

The same census checks the six arguments of fully applied Lean `Eq.trans` against the compiled application spine. Across 20 AI proof bodies it finds 561 expanded applications, represented by 172 declaration-local rows in nine proofs. The reader links the start, intermediate term, end and two supplied proofs. Its scope is literal `Eq.trans` applications. Other transitivity rules and human chains expressed through rewriting require separate evidence.

Nested `Eq.trans` calls can be displayed in proof order when the child carrier and both endpoints occupy the expected rows. Both applications occur in the same lexical context along these argument paths. Of the 561 call occurrences, 116 expand to more than two visible steps. The longest has nine. Five contain at least one nested call with a different carrier or endpoint row. The reader retains that whole proof step and its route. The counts describe selected call occurrences and can include a call inside another counted call. The display caps the list at 16 steps. A two-step control verifies that folding retains the original proof arguments.

All five folded call occurrences disagree only at the start term. In four, the first structural difference is between the constants `DivInvMonoid.toMonoid` and `MonoidWithZero.toMonoid`. In one it is between `instLTNat` and an application headed by `Preorder.toLT`. The weights count occurrences of the enclosing call; nested selections can refer to the same inner call. The reader links the enclosing and nested start terms and the two sites of the first difference. These observations identify a difference in the supplied structures. A separate conversion check would be required to explain how Lean reconciles the endpoints.

### Kernel check of the five folded start terms

Lean 4.33.1 accepted reflexivity at the equality between the complete enclosing and nested endpoints at all five call occurrences (three declarations). This establishes definitional equality in the reconstructed local contexts of sizes 25, 25, 13, 13 and 4. The kernel rejected reflexivity at `0 = 1` in each context. The comparison does not record the kernel's reduction sequence. The four monoid cases include repeated selections, so the five observations are not independent proofs.

From the repository root, reproduce the public JSON record using the existing pinned dependency build. The driver checks the recorded Lake manifest and package revisions, decodes and round-trips each compiled term packet, checks the entire proof against its theorem type, and reconstructs the local declarations on each selected route before checking the two endpoints.

```sh
python3 research/proof-atlas/use-rank/replay-endpoints.py \
  --lean /path/to/lean-4.33.1/bin/lean --project /path/to/pinned/lake/project \
  --output /tmp/chain-endpoint-conversions.json
```

The reader matches the report digest, declaration index, enclosing call and both endpoint routes before displaying the result.

For each of these five recorded joins the reader can expand the nested transitivity proof into its two equalities. Each equality links its two operands and its proof at their own occurrence paths. The enclosing endpoints remain visible for comparison. The check requires a recorded conversion for every mismatched field of that step. An altered report leaves only the structural comparison available.

### Applying a function to an equality

The six-argument `congrArg` rule in Lean 4.33.1 yields `f a = f b` from a proof of `a = b`. The reader links each repeated symbol to its supplied argument. The conclusion shows the rule instantiated schematically; it has no invented source rows for the two derived applications. In the Riccati bound, the lambda in call 2358 places its parameter in argument five of `HDiv.hDiv`; in call 3219 it places the parameter under `Real.sqrt`.

The equality census found 3,101 complete call occurrences in 19 of the 20 AI proof bodies. Of these, 2,644 supplied a literal lambda, and every such lambda had exactly one syntactic reference to its parameter. The other supplied functions were applications (419), constants (34), or bound variables (4). These counts are weighted by expanded occurrences; they measure explicit syntax without unfolding named definitions.

For single-use lambdas, the reader reconstructs the operator path from the bound occurrence to the body, replacing siblings by linked fixed terms. The two Riccati substitutions have the forms `x ↦ s₂ ≤ x / s₁` and `x ↦ s₁ · √x ≤ s₂`. Operator links select their whole compiled calls. A complete context requires that every application on the path match a catalogued operand of a binary or unary operator, within the 16-frame display bound. Metadata wrappers may be crossed along their expression field.

All 2,644 explicit lambdas in the AI congruence census met that criterion. They produced only five distinct sequences of operators and operand positions. In 2,514 cases the parameter was the right factor of a product on the right side of an equality. A separate traversal from the body back to the parameter verified operator routes, sibling routes and the terminal bound occurrence. The high coverage is specific to this repetitive sample.

### Transfer to SE(2) theorem bodies

Run `node research/proof-atlas/use-rank/check-equality-sides.cjs --published-contexts`. All 561 available theorem bodies in the published 15-module edition were inspected. There were 6,126 fully applied congrArg occurrences across 276 bodies. Of 5,351 supplied lambdas with one explicit parameter use, the rule recovered 5,175 operator contexts and 40 identities. The remaining 136 paths included applications outside the notation catalogue and crossings of binder fields. Among the remaining calls, 736 used a function other than a literal lambda and 39 used a lambda with multiple references. These are expanded occurrence counts; the Riccati case is included in this corpus.

The multiple-use lambdas had two references in 19 occurrences, three in 19, and six in one. The reader accepts a use number and opens its exact binder-resolved occurrence. Across all 39, a separate traversal checked the complete ordered reference list against selection by ordinal. In `JacobiCore.Sol.eq_of_eq_at`, the six destinations and the out-of-range control were also checked in the browser.

The named-call extension recovers 104 of the 136 previously missing single-use contexts: five use catalogue application notation, and 99 require at least one fully explicit call. A call outside the catalogue is displayed as `@name(...)` with all supplied slots, including types and instances, in kernel order. The six-argument display bound applies to these explicit calls. Among the 5,351 single-use occurrences, 5,279 now yield nonempty formulas, 40 yield identities, and 32 remain unavailable. The remaining paths involve binders (20 occurrences), functions held in local variables (8), or calls beyond the explicit argument bound (4). These results use the same hashed packets and occurrence weights as the preceding census.

A locally bound function can itself be the substitution site. The reader treats the function position and the ordered argument positions as separate source occurrences. In `JacobiPeriodic.exists_unique_f1_zero`, row 6570 gives `x ↦ s₁(x) = s₂`; row 2514 gives `x ↦ x(s₁) = s₂`. The reader links the function occurrence, its enclosing binder and the full application. Among the formerly missing SE(2) contexts, four occurrences use the parameter as an argument and four as the function. Coverage is now 5,327 of 5,351 single-use contexts, including 40 identities. The 24 remaining paths cross binders or exceed the explicit argument bound. The AI sample adds no examples of this rule.

The reader now traces single-use substitutions across lambda and dependent-function binders. The ordered path identifies whether it enters the domain (outside the scope of that binder) or the body (inside its scope), links the other field, and ends at the selected variable and its original binder. The reader presents these as field paths rather than assigning a free-standing mathematical symbol to an expression that may depend on the intervening binder. In the published edition this accounts for all 20 previously identified scope-crossing occurrences. The 5,351 single-use contexts comprise 5,287 nonempty operator formulas, 40 identities, 20 binder traces and four unavailable cases. The AI sample has no binder crossings in this subset.

### Calls with more than six compiled arguments

The reader shows the selected argument number and its enclosing application. An argument selector opens each other compiled slot on demand. In three SE(2) proof bodies, the substitution reaches argument 9 of 10 to `HasDerivAt` (the proposed derivative). In one it reaches argument 12 of 12 to `DifferentiableOn` (the set on which the function is differentiable). The meaning of those slots follows the pinned [derivative definition](https://github.com/leanprover-community/mathlib4/blob/0df444a360eaa60ab8c11dca51a86af692955474/Mathlib/Analysis/Calculus/Deriv/Basic.lean#L130) and [differentiability definition](https://github.com/leanprover-community/mathlib4/blob/0df444a360eaa60ab8c11dca51a86af692955474/Mathlib/Analysis/Calculus/FDeriv/Defs.lean#L163). The browser control checks every argument route in those four applications.

The published edition now has a complete structural path for all 5,351 fully applied congrArg occurrences whose supplied lambda references its parameter once. The presentations comprise 5,287 operator contexts, 40 identities, 20 scope-crossing paths and four paths through larger applications. The other 775 congrArg occurrences in this edition use a different function form or have repeated parameter references. The AI census remains 2,644 operator contexts in its corresponding subset. Neither census measures reader comprehension.

For a function supplied as an application, the reader separates the already supplied arguments from the changing input. In `CrossingData.exists_branch` at row 3558, the head is `HMul.hMul` and five compiled arguments are fixed. The default formula for this occurrence is x ↦ s · x. The symbol s links to the left operand and the multiplication sign links to the compiled head. All five fixed arguments can be inspected. The binary catalogue applies to 282 of the 723 published occurrences and 203 of the 419 AI occurrences. Other heads retain the ordered compiled form. The input values on the two sides of the equality link into the enclosing congrArg call. The variable x in the displayed function context denotes the next input.

The published census found 723 such occurrences, with 101, 105, 19, 275 and 223 occurrences at arities one through five respectively. The 20 AI theorem bodies yielded 419 occurrences (36, 13, 1, 179 and 190). Both commands above check the displayed routes on a representative path per reachable application row, reconstruct the original function by reapplying the fixed arguments, and weight counts by expanded proof occurrence. The reader shows at most six fixed arguments and retains the earlier function prefix as one selectable term. A one-argument display limit exercises folding on real calls in both corpora. These checks concern structural reconstruction; no reader performance was measured.

### Looking up substitution anchors with one source page

Run `node research/proof-atlas/use-rank/check-paged-substitutions.cjs`. The sample takes the three largest declarations in the source-page inventory. For each eligible declaration it selects the deepest canonical proof-root route to a fully applied congrArg whose function is itself an application (lowest row breaks ties). A complete hash-checked index supplies the reference routes and expected paths. The paged lookup receives those routes separately and its fetcher accepts only the declaration's paged assets.

| Declaration | Stored rows | Selected row | Route depth | Anchors checked | Source page loads across ten lookups |
| --- | ---: | ---: | ---: | ---: | ---: |
| lean_workbook_plus_6206 | 91,424 | 30,328 | 67 | 10 | 53 |
| lean_workbook_20418 | 86,587 | 30,288 | 78 | 10 | 53 |

In both examples the previous root-to-node lookup used four resident source pages with its default cache and exhausted the retry limit with a one-page cache. Continuing at the last resolved field produced the same row, field path and constructor at all ten selected addresses with at most 256 resident source rows and one index page. The addresses cover the call, both endpoints, function, premise, function head and fixed arguments. The larger working-edition midpoint polynomial (121,568 stored rows) had no eligible call on a canonical proof-root route. The cache counts cover source rows. The full-index reference search, path strings, browser state and other proof panels have separate memory costs. No discovery of substitutions from paged data alone was measured.

The paged reader now derives the endpoints, equality premise, function and up to six fixed arguments from the selected call route. It reads each application row separately. An earlier function prefix stays selectable when the six-argument limit is reached. For the two selected calls above, a cold lookup took seven source page loads each, including the initial descent to the call. The caller supplied only the call route. The 53-load measurement above instead resolves all ten addresses independently; the two measurements cover different operations.

The same checker compared every fully applied congrArg row with a canonical proof-root route in these two AI packets: 65 rows in `lean_workbook_plus_6206` and 41 in `lean_workbook_20418`. The supplied function was a lambda in 36 rows, an application in 52 and a constant in 18. Every derived argument and function-prefix address agreed with the independent complete-index lookup under a one-source-page cache. These are distinct compiled rows; other occurrences of a shared row can have different routes. Call selection in this census still used the complete index.
