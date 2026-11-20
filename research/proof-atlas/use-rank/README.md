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
