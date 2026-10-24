# Composing case interfaces in the Riccati bound

Status: local research prototype. No blog result or deployment is attached to
this iteration. The general geometric-language goal remains active.

The original audits were frozen at local commit `2c607f10`. Their browser hashes
describe that checkpoint. The later [source-context browser audit](../source-corridor/browser-audit.json)
records integration checks against the subsequent reader implementation.

## Representation problem

The target is the manual’s “Read a proof construction” weakness: compositional
elimination remains incomplete. An individual recursor view separates constructor cases, but following its minor
body opens a new view. The ordinary judgment renderer can compose these records;
its context frames already retain all seven recursors in the example below.
There is no new elimination-coverage result here. The experiment is a dedicated
case topology with explicit input scopes and independently checked source cuts.

The test case is the sign argument inside `JacobiData.slope_bound_abs` (Lemma
3.2), published-15. It proves the equality

\[
 |J.T1\ p+J.T2\ p|=|J.T1\ p|+|J.T2\ p|.
\]

The recorded major premise splits into

\[
 (0<J.a\ p\land0<J.b\ p\land0\le J.T1\ p\land0\le J.T2\ p)
 \ \lor\
 (J.a\ p<0\land J.b\ p<0\land J.T1\ p\le0\land J.T2\ p\le0).
\]

These formulas describe the native type presentation; the implementation retains
its original motive application, not a newly generated normalization trace.
The resulting case structure is one `Or.rec`, then three `And.rec` eliminations
on each side. It has eight case lanes, fourteen source lambda inputs, six
continuation joins and two terminal body boundaries. Context sizes along either
side are 11, 12, 14, 16, then 18 at the terminal body.

## Geometric rule

Each cell retains the original application spine and has ports for the source
head and every argument **in source order**. Constructor roles are references to
these ports. They are not extra subtrees. For `Or.casesOn`, the recorded kernel
slot permutation is `[1,2,3,5,6,4]`: the major premise occupies source slot four,
not the last source slot. No edge is classified by a constant-name suffix.

A case lane refines only its recorded source lambda prefix. Each lambda retains
one constructor, its domain before the new binder, and its body after that binder.
The immediate body may compose with another checked recursor at that **same
occurrence route**. Other terms remain boundaries. Missing source lambdas stop
composition even when the function type is available. A fixed breadth-first
recursor budget makes additional cells refine existing frontier roots rather
than reselect previously visible positions.

The expected minor type and its actual inferred type remain separate references
to native conversion endpoints. A lambda or recursor continuation must match the
preceding **actual** body type structurally, in the exact original context.
Every type reference retains its evidence owner, query route and graph root;
roots from separate query graphs are never compared as bare integers. Computed
kernel-rule expressions remain in their existing separate namespace.

## Source-cut invariant

For each selected source occurrence, let `R` be retained constructor positions
and `F` the unexpanded subtree roots. The implementation checks

\[
 |R|+\sum_{f\in F}|f|=|t|.
\]

The stronger claim is a disjoint, complete partition of **positions**, not only
that the totals agree. An application-spine replacement covers its head, ordered
arguments and original application constructors exactly once. A lambda
replacement covers its constructor and two ordered children. Replacing a
frontier by either partition preserves completeness and disjointness. Induction
over these replacements gives the composed cut invariant. The existing
[source-cut refinement model](../cut-refinement/README.md) supplies the general
structural setting; this iteration adds no new Lean theorem proving the
JavaScript implementation.

For the sign argument the final cut is
`50 retained + 55,365 hidden = 55,415 occurrences`.
Its two terminal bodies have native types but no further recorded elimination
interface. They are not labelled as completed semantic explanations of the full
Riccati bound. The working-26 declaration has a different packet identity and
has no corresponding elimination inventory; it cannot borrow this evidence.

## Evidence and comparison

The [audit](audit.json) records hashes and exact query routes. It checks 29 native
query starts: 16 project representatives in two declarations and 13 recursive
representatives in nine synthetic profiles. These include indexed and
function-valued recursion, missing-source-input controls and shared expressions.
There are 232 cuts at budgets one through eight and 203 adjacent budget
comparisons. All preserve previous retained source positions. The 165
continuation joins and 890 input-frame checks are sums over overlapping cuts,
not counts of distinct proof steps. The 298 rejection controls include changed
packet identities, branch contexts, actual types, type owners, source-slot
mappings and relocated shared-node positions whose total count is unchanged.

An independent checker rebuilds a trie from source child slots. It requires
every exposed constructor to have all its original children, forbids descendants
under hidden regions, and recomputes masses from the shared DAG rather than
trusting the scene's totals. It does not invoke the builder's partition routine. A further synthetic
re-encoding gives each query a separate type table with different root numbers.
Its native judgment digest is unchanged, and all seven Riccati cells still
compose. This tests table ownership; it is not another native proof run.

At the Riccati starting occurrence, using the same elimination sidecar and the
existing thirteen-region default, individual judgment rules retain three
recursors; existing context frames already retain seven. The new view displays
seven recursor cells and two terminal bodies, with the inputs carried in their
case lanes. This is a different inspectable interface, not an improvement from
three to seven over the strongest existing mode. No user study has compared
premise finding, scope tracing or error localization.

The [browser audit](browser-audit.json) checks all seven cells and eight lanes without changing the
source selection, follow exact source actions, exercise zoom/fit/pan/scroll and
audit light/dark desktop/mobile layouts. The existing elimination and recursion
audits remain separate. This iteration reuses their pinned native attestations;
it does not claim a fresh kernel replay.

## Reproduction and limits

```sh
ATLAS_CASE_REPORT=/tmp/case-audit.json \
  node scripts/test-proof-atlas-elimination-composition.cjs
node scripts/test-proof-atlas-elimination.cjs
node scripts/test-proof-atlas-recursion-examples.cjs
# After a production build; with Playwright and axe-core available:
ATLAS_ORIGIN=http://127.0.0.1:8866 \
  node scripts/test-proof-atlas-elimination-composition-browser.cjs
node scripts/test-proof-atlas-elimination-browser.cjs
```

Open the compiled library at the route recorded for `Or.rec` in the audit and
choose **Show case elimination**. Cell/lane buttons inspect locally; **Open exact
source** selects the original occurrence through the existing graph/Lean/article
synchronizer. Other arguments and original head remain source-linked in each
interface. This is integrated into the complete-packet view, not the newer paged
occurrence/construction view.

Composition is bounded to 32 recursor cells; the existing extraction bounds are
32 minor premises, 128 core arguments and 128 inputs per minor. Work follows
recorded source prefixes and shared DAG counts, not expanded occurrences. This
is not a corpus-wide memory or performance benchmark. In particular, the recorded
recursor region in each `shared_induction_8/24/64` profile has only 51 occurrences,
even though its complete source packet can represent a much larger proof. Those
small cuts do not establish case-composition performance on a massive proof. Arbitrary computed
wrappers, unsupported mutual schemes, arbitrary intermediate term navigation,
tactic execution and automatic semantic interpretation remain outside the rule.
No original private proof script or source project is published.

Publication decision: retain the prototype and checks locally. The result does
not yet support a new coverage, comprehension or general-elimination claim strong
enough for a research post. A measured inspection task or a demonstrably broader
compositional rule is needed before promoting such a claim.
