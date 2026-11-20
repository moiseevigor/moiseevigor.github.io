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
