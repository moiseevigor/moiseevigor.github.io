# Immediate typed inputs from binder uses

Status: local research result. No new blog post or deployment.

## Representation rule

A binding wire identifies an occurrence of a hypothesis. To continue that wire
into a proof construction, query the **original application immediately above
the selected use**, in its original lexical context. A successful native
Π-application record supplies the function and argument judgments, expected
domain, result and instantiated result type. The wire ends at the exact input
port; it no longer passes through an untyped containing region.

This extends the [recorded-input operator](../use-inputs/README.md). A missing
native record still produces either an explicit source gap to a containing
recorded input or an unrecorded result. The notation never assigns intermediate
types from containment. Function, proof, type and value inputs remain distinct.
The selected operation is a curried application stage; it need not be saturated
or mathematically necessary.

## Riccati result

All three raw uses of `hd : 0 < J.d p` in `JacobiData.slope_bound_abs` now have
direct checked input judgments:

| Immediate source head | Application stage | Selected input | Earlier match |
|---|---:|---|---|
| `mul_pos` | 7 of 8 | proof argument | Already direct |
| `JacobiData.T1_T2_same_sign` | 5 of 5 | proof argument | Inside `Or.casesOn`, 2 fields below its input |
| `abs_of_pos` | 6 of 6 | proof argument | Inside `Eq.mpr`, 3 fields below its input |

The source names above come from the exact application heads. The new records
check 29 application sites in the published snapshot and 20 in the working
snapshot. These are different selected route inventories over the matching
Riccati graphs, not two independent recompilations of all snapshot modules.

The same stored bvar e50 still has a separate `hab` occurrence in a let value.
It is not an application input and does not acquire `hd`'s binder or typing.
The existing wrong-binder, proof-under-value and lexical-scope controls remain
in the baseline checks.

## Finite evaluation

The frozen baseline is 469 selected uses across 35 recorded profiles. The
[planner](prepare.cjs) resolves every selected original route and lexical
binder, then checks that the requested parent is an actual application and the
selected child is its function or argument. It plans 421 distinct immediate
application sites for 422 non-direct uses across 34 profiles. Three uses meet
let fields and 44 already have direct input judgments.

New native checks cover 283 sites in 22 profiles: the two Riccati snapshots and
the twenty released AI-attributed proofs. Every requested site in that subset
has a checked application trace.

| Fixed sample outcome | Earlier records | With additional records |
|---|---:|---:|
| Direct typed input | 44 | 327 |
| Strictly inside a recorded input | 290 | 118 |
| No containing recorded application input | 135 | 24 |

The new matches include 273 argument ports and 10 function ports, with 135 proof inputs and 148 value inputs.

The new records directly identify 283 previously non-direct uses, including
111 previously unrecorded matches. These counts concern the same selected
occurrences; they are not all-use or all-proof coverage. Untouched profiles
retain their earlier gaps. Introduction and let interfaces still need a
separate composition rule. Semantic compression, premise necessity and human
comprehension remain unmeasured.

The [independent audit](audit.json) checks source application spines, exact
function/argument ports, lexical binder identity, source context lengths,
all six native type roots and the three conversion flags. Complete and paged
consumers agree on all 469 uses. It performs 1,035 independent comparisons and
113 rejection controls. The existing baseline audits are preserved unchanged.

## Native provenance and trust boundary

Lean is pinned to 4.33.1. For Riccati, only the matching `Jacobi`, `Identities`
and `Riccati` modules are compiled privately. Before any query, the producer
compares the native declaration against all six published ExprDAG tables and
its root labels. Source hashes and newly compiled module hashes are retained
in [native verification](native-verification.json). Fresh binary identity is
not substituted for an older binary hash.

The AI proofs are decoded from authenticated public compiled packets, with
their original theorems and proof modules absent. Each whole proof is checked
against its theorem type before querying its application sites. Axiom lists,
exact six-table roundtrips, invalid routes, wrong proofs and ill-typed binders
are checked separately. Publisher attribution is inherited from the frozen
AI corpus; this work does not establish a new generation history.

The original dependency build is no longer present. Checking binaries were
recovered from the local compiler cache. All 43,450 retained binary files were
checked against the restoration inventory. Their archives carry the comment
`git=mathlib4@0df444a360eaa60ab8c11dca51a86af692955474`, matching the earlier
pinned Mathlib revision. This is **cache attribution**, not independent
verification of dependency Git checkouts or a dependency rebuild. The new
environment records explicitly say so. These are native extraction/replay
attestations under those dependencies, not portable kernel certificates.

Original private mathematical source, tactic scripts, archives, generated
compiler entries and raw logs remain private. Public assets contain compiled
judgments and their verification metadata only.

## Delivery and checks

The additional records are separate from older evidence packages. They use
the existing hashed native-query pages and LRU, with at most one cached query
of 2 MiB in the finite audit, eight native index pages, sixteen source pages
and 4,096 cached source rows. Shared type graphs retain their separate bounds.
The largest newly direct input scene is 6,732 bytes. These are decoder/cache
bounds, not whole-browser memory measurements.

The complete source reader borrows the same paged native provider when the
binding inspector opens. The paged reader includes it in the existing native
cursor. This supplement serves the binding-to-input inspector; general construction cuts retain their existing query policy. Their standalone typing coverage is not enlarged by this operator. Original source selection and article selection remain unchanged
during inspection; each port opens its exact original occurrence. Missing or
rejected evidence cannot create a typed input. Historical native pages keep
their producer's validator digests; the compatibility check validates their
actual records with the current consumer against complete original providers.

Native jobs have fixed time, memory, output-file and disk-reserve guards. Their
resource records stay in the private work directory. They are not research
blog results.

## Reproduction

1. `node research/proof-atlas/use-sites/prepare.cjs PRIVATE_WORKDIR` freezes the
   source application-site requests and authenticates packets.
2. `python3 research/proof-atlas/use-sites/verify.py --mode riccati --lean LEAN
   --cache RESTORED_CACHE --workdir PRIVATE_WORKDIR --snapshot PRIVATE_SNAPSHOT`
   compiles the three required matching source modules and checks Riccati.
   `--mode ai` replays the twenty public AI-attributed packets. Both require
   the recorded checking-binary restoration inventory and retain private logs.
3. `node research/proof-atlas/use-sites/publish.cjs PRIVATE_WORKDIR` projects
   compiled judgments only. `node scripts/build-proof-atlas-use-site-pages.cjs`
   creates the separate paged supplement, preserving older packages.
4. `ATLAS_USE_SITE_CHECK_REPORT=1 node scripts/test-proof-atlas-use-sites.cjs`
   verifies the current frozen audit. The `ATLAS_USE_SITE_REPORT` variable
   writes a fresh report. `node scripts/build-proof-atlas-use-site-pages.cjs
   --check` verifies generated pages.
5. The browser test is `scripts/test-proof-atlas-use-inputs-browser.cjs`. It
   checks all three immediate Riccati inputs in both readers, keyboard source
   jumps, light/dark mobile/desktop accessibility, stale inspection, the
   unrecorded let alias and the article application. Browser success measures
   software behavior, not comprehension.
