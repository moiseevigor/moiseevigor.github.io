# Selecting a variable use by ordinal

A query begins at the body of one binder occurrence in a validated original packet. It orders direct references by depth-first traversal in stored field order. Ordinals start at one. Distinct expanded occurrences count separately, including edges that share a stored child. The result gives the original root, field slots and stored row. The caller must retain the packet identity with that address.

The builder counts reachable pairs of stored row and intervening binder depth in source DAG order. A subtree total stays live until its last consumer. For navigation, each positive internal state retains a field mask and counts for the positive children preceding the last one. The last child receives the remaining total. A single positive child needs only its field position. To descend an edge, it subtracts the exact use counts of preceding siblings. The inverse sums those counts along the supplied path. A body field extends the lexical context of a lambda, dependent function or local definition. The local definition's type and value use the enclosing context.

Run from the repository root with Node:

```sh
node --max-old-space-size=256 research/proof-atlas/use-rank/check.cjs
```

The [record](results.json) covers every leading proof lambda in the 35-declaration typing inventory. It includes refusals, exact routes and maximum observed counts by inventory. The check follows first, middle and last references where available, resolves their lexical binders and verifies the inverse ordinal. For small bodies it independently expands every occurrence in field order. A separate binary sharing fixture supplies an independent 240-bit path oracle. That fixture is syntax data. The largest recorded example is an authored recursion control. AI results are reported separately.

All 190 binder totals agree with the independent free-index multiplicity evaluator. For the largest total in each inventory the checker also recovers the middle ordinal by independently counting every preceding sibling subtree along the selected path. Bounds on state count, coefficient slots and coefficient digits still refuse oversized queries.

The original all-rows count table reached its coefficient limit on 18 of the 190 binders. Retaining branch splits resolves all 18. The measured peaks across the 190 queries are 116,630 requested row/depth states, 59,407 retained coefficient slots and 99,801 retained decimal digits. These units exclude the source packet, maps, masks, reference counts, temporary arithmetic and JavaScript object overhead. Each query used the existing caps of 262,144 states, 65,536 coefficient slots and 524,288 decimal digits. Index construction still needs the entire compiled packet. No paged-construction, total-heap or human-comprehension result is claimed. No new Lean build or typing judgment was performed.
