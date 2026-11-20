# Statement clauses and proof occurrences

[Trace the Riccati bound](riccati.html) follows a statement into its explicit proof introductions. [Read a field projection](projection-example.html) shows a quantified claim supplied by a structure field. Both examples link to original occurrences in a named, compiled packet.

## Rule

Follow a declaration’s type and value roots in parallel. Pair a leading dependent function type with a lambda when their domains are the same stored row in this packet. Under each pair, both paths enter the body, so the enclosing variables remain aligned by position. The statement and proof binder still have distinct occurrence addresses. If pairing stops, the whole remaining statement points to the proof expression at that depth. Each address consists of a packet identity, a root and a sequence of field slots.

A variable use links back through its lexical context. In a lambda, its binder enters scope only in the body. A local definition extends scope in its body after the type and value fields. In the projection example, two occurrences of the very same stored variable therefore resolve to different binders.

## Evidence and scope

The [pairing census](census.json) covers all theorem packets in the four named inventories. Two editions are overlapping snapshots. Twenty released packets form the AI sample. The [use census](use-census.json) covers the paired outer binders in those inventories. A bottom-up calculation of free-variable indices and a search for original occurrence witnesses agreed on the presence or absence of a use for each binder.

An explicit type field here means a binder domain or a local definition’s type. Skipping such fields still permits paths through implicit type arguments to applications. Absence of a direct variable occurrence concerns the compiled body. It does not imply that the assumption can be removed from the theorem.

The [page comparison](paged-comparison.json) counts page loads for identical ordered queries with one and two source pages retained in the cache. It covers 35 declarations with paged evidence. It measures cached decoded page bytes separately from index pages, parsed JavaScript objects, the rendering process and the complete packet used by the test oracle.

## Reproduction

Run from the repository root.

```sh
dir=research/proof-atlas/clause-navigation
node "$dir/check.cjs" > /tmp/atlas-clause-witnesses.json
node "$dir/use-census.cjs" /tmp/atlas-clause-witnesses.json
node "$dir/use-positions.cjs" < /tmp/atlas-clause-witnesses.json
node "$dir/census.cjs"
node "$dir/check-paged.cjs" 1
node "$dir/check-paged.cjs" 2
node "$dir/riccati.cjs" < /tmp/atlas-clause-witnesses.json
node "$dir/projection-example.cjs"
```

The two diagram generators emit HTML to standard output. The browser check uses Playwright and the site served at `ATLAS_ORIGIN`. Set `ATLAS_CHROMIUM_PATH` to use an installed Chrome. These checks inspect recorded compiled expressions and interactions. They do not replay Lean or measure reader comprehension.
