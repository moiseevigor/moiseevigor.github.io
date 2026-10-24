# Free-index multiplicity and source-cut refinement

Local reference model; reader integration and deployment are separate work.
This package reads authenticated compiled expressions. It does not read original
private mathematical source or run a new Lean compiler job.

## Representation problem

A hidden source region may contain many uses of an original binder, while only
a few uses have recorded native types. The previous per-binder scalar evaluator
completed 296 of 303 construction counts at its 65,536-state bound. The seven
unavailable counts were not zero. Increasing a residue mask would not resolve
that limit: the affected packet's maximum required scope is fourteen, already
within the existing mask's exact range.

The new rule annotates source syntax with multiplicity. It does not turn a use
count into a typing judgment or a necessary mathematical assumption. No term is
rewritten, expanded into its complete occurrence tree, or removed from the
source cut.

## Compositional rule

Let `H(e)[i]` be the number of occurrences of free de Bruijn index `i` in the
expanded syntax of region `e`. Use a sparse vector of nonnegative integers.
Let `D(h)[i] = h[i+1]` discard a binder's index zero and shift its other indices.

- A bound-variable node with index `j` contributes one to component `j`.
- An application sums its function and argument vectors.
- A lambda or Pi contributes `H(domain) + D(H(body))`.
- A let contributes `H(type) + H(value) + D(H(body))`.
- Metadata and projection wrappers preserve their expression child's vector.
- The other kernel constructors contribute no free term-variable indices.

Domains, declared types and let values therefore retain the prior context.
Universe parameters, free-variable identifiers and unresolved metavariables are
not counted as term de Bruijn indices. Shared child fields contribute once per
field occurrence. Reusing a DAG node does not reduce its multiplicity to one.
For a selected source binder, coefficient zero of its original body is its
syntactic use count. Different original binders can share a stored body without
acquiring the same native typing or occurrence identity.

For an ordinary source cut, each hidden frontier has an internal binder depth
relative to the cut root. Apply `D` that many times to the frontier vector. The
sum of those shifted frontier vectors and the free bound-variable occurrences
retained in the cut equals the root vector. This is the proposed multiplicity
annotation under refinement. It adds no source occurrences and does not replace
the cut's existing retained/hidden expression accounting. The finite checker
here exercises coefficient zero at selected original binder bodies. A general
Lean proof of this identity is not supplied.

## Evaluation and resource contract

`model.cjs` implements `evaluate(data, queries, bounds)`. Input is an already
authenticated and validated postorder expression DAG; a query is a unique
`{node, index}` pair. Results have explicit algorithm identity
`free-index-live-frontier/1`. The caller must retain the source packet hash and
original binder route when attaching a result to a diagram. A node-only result
is not a native variable-use identity.

Only nodes reachable from the requested regions are evaluated. Remaining
source-field reference counts release a child's sparse vector after its last
required parent. A parent reads repeated child fields before releasing them.
The current scratch vector and completed scalar outputs are charged before a
new coefficient or output is retained. Default maximums are:

| Unit | Maximum |
|---|---:|
| Source nodes | 262,144 |
| Query rows | 262,144 |
| Coefficient cells, including completed outputs | 65,536 |
| Decimal coefficient/output digits | 524,288 |

Bounds may be reduced, never raised through this API. A refusal retains exact
completed rows and returns `count: null` for unfinished rows; it never invents a
partial count or interprets a refusal as zero. `partial` and `unavailable` are
distinct top-level results. A no-query call allocates no traversal index.

These units do not assert a whole-process RAM limit. The source packet is
separately resident. Reachability and reference-count arrays use five bytes per
source node; pending table slots and query indexing use separately bounded
metadata. JavaScript object overhead, temporary arithmetic and decimal strings
are outside the coefficient-table units. The Linux reproduction also runs
under an explicit container memory/process limit. This is an offline reference
counter, not an on-demand paged browser counter.

## Finite evidence

The local corpus audit reports the overlapping inventories separately:

- All 44,143 stored binders in 2,098 library packets completed, over 1,827,405
  stored source nodes. There were no budget refusals in that inventory.
- Independent occurrence enumeration agreed on 36,358 small library bodies.
- The 51 native/control profiles supplied 1,272 stored-binder counts, with 891
  small-body enumeration comparisons. These profiles overlap the library.
- All 303 selected construction counts agreed with the separate scalar
  evaluator at its explicitly larger verification-only state allowance. This
  resolves the seven counts unavailable under the old production method.
- Across 909 cuts for those 303 selected binders, 4,929 scope-adjusted frontier
  terms and 119 retained variable terms reconstructed the original body count.
  There were 291 binders with different retained/hidden partitions across the
  three display budgets; source scenes remained unchanged.
- Controls cover all twelve structural constructors, 5,554 small coefficient
  comparisons, 240 shared application doublings, 10,000 nested binders, twelve
  refused modifications and two explicit partial-result resource refusals.

The combined observed peaks across the corpus and refinement checks were
32,488 coefficient cells and 53,500 decimal digits, including scalar outputs.
These differ from the earlier prototype's units and are not scalar traversal
states. Source-index arrays peaked at 607,840 bytes. Native typing inventories,
original source packets and the frozen reader candidates remain unchanged.

The source audit authenticates packet hashes and structural metadata. It does
not prove the JavaScript implementation or a general Lean metatheorem. Large
results have the separate 303-count scalar comparison; small-body enumeration
covers only its stated subset. There is no new native judgment, public count
transport, browser integration, semantic necessity or measured comprehension
result.

## Reproduction

From the repository root, using the existing Node environment:

```sh
node research/proof-atlas/free-index-multiplicity/check.cjs
node research/proof-atlas/free-index-multiplicity/check-corpus.cjs
node research/proof-atlas/free-index-multiplicity/check-refinement.cjs
```

Reports are written to `/tmp/atlas-free-index-multiplicity-controls.json`,
`/tmp/atlas-free-index-multiplicity-corpus.json` and
`/tmp/atlas-free-index-multiplicity-refinement.json`. They contain code hashes,
input packet identities, per-packet result digests and declared limitations.
The scalar comparison modifies only the verification copy's state cap in an
isolated module; it records both code hashes and leaves `support.cjs` unchanged.
No data is downloaded and no native Lean job is started.
