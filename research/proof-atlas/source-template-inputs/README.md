# Source lambdas in dependent region interfaces

The seven-call Riccati region now has a checked all-position interface with
**17 independent inputs, 18 derived boundary positions and retained `J,p`**.
It adds no proof adapters. All 35 original boundary positions and all seven
result positions remain accounted for. Source-value specialization recovers
the original result tuple and every result portal.

This extends the restricted [boundary-equation rule](../boundary-constraints/README.md).
It reconstructs three stored source lambdas and explicitly changes one
declaration order. It does not make every original boundary position freely
replaceable.

[![Source lambdas and declaration order](source-lambdas.svg)](source-lambdas.svg)

The figure labels `a,b` as independent inputs and records their source values
for specialization; those labels do not impose equations on arbitrary inputs.
It shows the three exact lambda bodies using checked literal Real
operator/numeral aliases. Hidden type and instance arguments retain their
native field identities in [figure provenance](figure.json.gz). The displayed
`x` is a name alias for each original lambda binder; its original payload stays
in that record. Dashed arrows
are **derived source-pattern rewrites**, not original proof-use wires.
Ten keyboard links open original compiled occurrences. Source port order and
computed declaration order remain distinct. This policy is **not yet in the
interactive function selector**; its computed records are downloadable here.
Layout carries no mathematical metric.

## Rule

A failing rebuilt application first uses the earlier first-order equation
solver. If its types refer to a still-independent input whose original value
is a lambda, the extension may reconstruct that whole source lambda:

1. Group preceding bindings by literal equality of their complete original
   source values. Keep every binding identity in each group. Skip positions
   whose original value has a literal Sort type; this avoids replacing `Real`
   throughout a mathematical function body.
2. Traverse the source lambda by stored constructor structure. Replace maximal
   complete group values by their computed representatives. Patterns have no
   loose bound variables or metavariables; original-context variables remain
   allowed. Preserve all unmatched constructors, names, flags and metadata.
3. If one used source value has several computed representatives, require
   their kernel conversion. Refuse ambiguous independent representatives;
   matching original values alone does not identify them.
4. Align supported function-type domains and closed codomains through the
   equation solver. Kernel-check the complete proposed lambda at its required
   type. Substituting all original source values must recover the **whole
   original function**, with a separately checked typed equality witness.
5. Convert the input declaration to a local definition. Its value can refer
   to a later-created binding only if the complete declaration set has an
   acyclic order. Compute a stable dependency order using both domains and
   values, then kernel-check the complete reordered context. Refuse cycles,
   unknown variables and ill-typed reorders.

Assignment records retain stable binding keys and exact predecessor lists.
Permutation records retain both orders, every domain/value root and the
assignment causing the change. Original boundary positions stay in their
source ledger; they are not renumbered by declaration order. Call observations
keep the order in force when that call was checked.

In the Riccati case the three rewritten functions capture `|T1(J,p)|` and
`|T2(J,p)|`, replaced by independent values `a,b`. Their bodies respectively
contain `2 * sqrt x`, `2 * x`, and `2 * (x * sqrt C)` on the left of the
inequality. The third retains `C = z(J,p) * (1-z(J,p)) * Dz(J,p)`.
One derived value for original port `77:4` refers to the input at `78:3`.
The latter must therefore precede that definition in the computed context.
Twelve declaration positions move; the original source occurrences do not.

## Fixed comparison

| Policy on the same selected Riccati region | Outcome |
|---|---|
| Independent replacement of all positions | Rejected |
| Explicit supplied proof adapters | 35 boundary inputs + 6 adapters; no original context |
| Earlier first-order boundary equations | Rejected at `25:4`, with three partial definitions |
| Source lambdas and dependent declaration order | 17 independent + 18 derived positions; retain `J,p`; no adapters |
| Proof-argument inputs | Earlier five-fact function is literally unchanged; retain `J,p` |

All **30 predetermined region/policy candidates pass** fresh closed typing and
source recovery. The 29 previously accepted complete function graphs are
literally unchanged. The AI-source all-position function still has eight
independent and three derived positions; the authored dependent diamond has
nine and two. Across the overlapping policy appearances there are 23 derived
positions, three lambda templates and one permutation.

These are ten fixed region profiles with three policies each: two corpus
proofs and eight authored controls. They are not thirty independent proofs,
additional AI coverage, minimal premise counts or a general higher-order
unification result. The chosen Riccati region ends before the theorem's
remaining division steps.

## Independent checks

- [Native verification](verification.json.gz) and [complete terms](native.json.gz)
  record closed function/signature checking, complete source specialization,
  typed equality witnesses and every original result portal.
- [Independent model](model-check.json.gz) reconstructs all thirty complete
  functions, reduced/closed terms, source tuples and equality-witness syntax.
  It replays every assignment's complete predecessor context, the stable
  permutation, call snapshots and maximal lambda rewrites. All three rewrites
  agree, with 62, 60 and 93 stored states. Replacing the captured inputs by
  their original values literally recovers each complete source lambda, beyond
  the native conversion check. Ninety-one damaged records refuse.
- [Thirteen authored controls](controls.json.gz) have fresh
  [core-only checks](control-verification.json.gz). Seven accepted cases cover
  forward values, dependent domains, lambdas, shadowing, coherent duplicates,
  closed function-type alignment and shared rewriting. Six refusals cover a
  dependency cycle, ambiguous duplicates, source-function loss, a changed
  source value, wrong typing and an unknown variable.
- The separate constructor oracle checks the tiny controls' declaration
  orders by enumerating valid orders. It reconstructs the complete closed
  control functions. An 80-doubling lambda represents more than `2^80`
  occurrences while the rewrite retains 167 distinct stored states. This is
  an authored stress fixture, not an AI proof or semantic compression result.

Native inferred domains/signatures, tuple universe annotations, pattern type
eligibility and kernel conversions remain inputs to the JavaScript audit.
JavaScript does not independently infer Lean types. Finite reconstruction
does not prove the native algorithm, asynchronous reader or serializer correct
for all inputs. The predicate counterexample from the earlier rule remains:
agreement at one argument does not preserve a whole source function.

The native runtime uses the earlier validated source ports and direct-zeta
binding paths. The complete Riccati type/body matches its pinned compiled
module. Other original declarations are absent from packet replay.
Constant-data files, kernel libraries and private support modules are hashed
before and after checking. Dependency binaries are cache-attributed, not
independently rebuilt. Original private Lean/tactic scripts and raw logs remain
unpublished. Only this run's exact temporary constant-data files were retired
after terminal checks; [retirement record](retirement.json.gz). Cache archives,
recovery manifests and support modules remain.

## Presentation checks

The [production build](build-check.json.gz) and [browser record](browser-check.json.gz)
cover the source-linked diagram, ten keyboard selections of exact original
occurrences, unclipped SVG/card text and desktop/phone reading in both themes.
Four scoped accessibility audits report no violations. The wide figure pans
inside its own focusable viewport and opens separately at full size.

The [existing network regression](network-browser.json.gz) checks 162 native
calls and 101 source wires, including type selections, paging, zoom, pan and
stale/corrupt evidence refusals. Its delivered application bytes match the
final build. The HTML comparison permits only stylesheet build timestamps to
differ. Presentation checks are separate from native judgments and do not
measure human comprehension.

The [aggregate evidence](evidence.json.gz) binds the native reports, independent
model, figure, build, browser checks and reproduction sources. Final technical
records were refreshed after the production build; application HTML/CSS/JS/SVG
were not overlaid. This is a local preview and research-branch result, not a
merge or deployment. The blog has no new entry.

## Bounds and remaining work

The source-pattern traversal has a 262,144-state/depth-512 guard and memoizes
composite expressions. Declaration ordering admits at most 512 bindings.
The equation solver keeps its 4,096-step/depth-64 and root-unfolding-512 guards;
template fallback admits at most 32 advances. Existing region/packet/native
graph bounds remain. Native processes retain their time, RSS, output and free
space guards. These are component/workflow bounds, not a whole-program memory
or complexity theorem. Failed template attempts restore the previous state
while retaining the consumed equation-work count.

General dependent-region preservation, required local-lambda closure,
higher-order constraint inference, executable/codec refinement, diverse
out-of-sample evaluation and measured human comprehension remain open.
Interactive paging of this new policy is unfinished. The existing direct and
adapter readers remain available with their original records. The article and
blog are unchanged; the general research goal remains active.

## Reproduction

```sh
node research/proof-atlas/source-template-inputs/prepare.cjs /tmp/fresh-template-plan
python3 research/proof-atlas/source-template-inputs/build.py \
  --lean /path/to/lean --workdir /tmp/fresh-template-build
python3 research/proof-atlas/source-template-inputs/controls.py \
  --lean /path/to/lean --workdir /tmp/fresh-template-controls --publish
# Recover only the pinned constant data with region-native-types/recover.py.
python3 research/proof-atlas/source-template-inputs/verify.py \
  --lean /path/to/lean --build /tmp/fresh-template-build \
  --plan /tmp/fresh-template-plan --runtime /tmp/fresh-kernel-data \
  --support /path/to/checked-riccati-support --workdir /tmp/fresh-template-native --publish
node research/proof-atlas/source-template-inputs/check.cjs --check
node research/proof-atlas/source-template-inputs/figure.cjs --check
```

The offline checks need Node and the checked-in compiled records. Fresh native
checking requires the pinned Lean 4.33.1 compiler and attributed dependency
data. The Riccati comparison also requires its checked private support modules.
The diagram and manual require the actual production build and browser checks;
native success alone does not establish public availability.

For a fresh native run, regenerate the model and figure without `--check` to
bind their new verification identities. The `--check` commands compare the
frozen records; execution-resource metadata in fresh native reports can differ.

After the production build, run `check-browser.cjs`, `check-network.cjs`, then
`evidence.cjs --publish` in this directory. The browser tools require Playwright,
axe-core, the local preview origin and an installed Chromium. Use
`evidence.cjs --check` to verify the final frozen package.
