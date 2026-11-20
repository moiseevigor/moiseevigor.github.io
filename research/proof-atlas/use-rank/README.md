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
