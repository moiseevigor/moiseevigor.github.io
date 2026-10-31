# Composing input/computation exchanges

The local let/input exchange now composes along a primary lambda/let spine. Each exchange transports the input domain by substitution, lifts the computation under the input and permutes the two body binders. Inputs retain their mutual order, as do computations. The body outside the selected path remains literal syntax.

[Interactive sequence view](/projects/proof-atlas/manual/binder-blocks/) · [Local rule and its limits](../binder-computation-exchange/README.md).

## Checked result

Eight authored core-only controls cover dependent computations, dependent input domains, a type-valued definition, proof values, implicit inputs, interleaving, repeated binder names and a trailing definition that must not move. One control is already ordered.

For each control, two schedules repeatedly exchange either the outermost or the deepest adjacent let/lambda pair. The number of let-before-input pairs decreases by one at each step. All **48 intermediate whole terms** pass fresh kernel typing at the original declared goal and convert to the original term. The final pair of terms agrees literally in all eight controls; sixteen complete traces reverse to the exact original source. The final source equality witnesses are checked separately.

The independent JavaScript model reconstructs every intermediate whole term and original-domain residual against the native table. It checks all 48 local inverses and 16 complete inverses. Eighty-four ordinary-input refusals cover missing final steps, changed computed ordinals, changed original flags, foreign source owners and step/retained-row limits. These are codec refusals, not kernel-negative judgments. The preceding local experiment retains the kernel-negative domain and body mutations.

This is finite evidence for composition and schedule coherence. There is no general theorem here about confluence, the Expr compiler or equivalence of arbitrary graph regions.

## Provenance and inverse

A trace identifies its original packet and input owner. Every computed step identifies its schedule, ordinal, before/after term hashes and exact body-field path. Its residual retains the domain in the *before-step* context and the original let flag. A later step's residual is not an expression in the original source context by default. Recovery checks the current computed owner, applies the inverse and checks the resulting previous owner before proceeding.

The joint native table shares storage among all states. Root indices identify components of that observation, not original source node IDs. The UI uses a separate computed namespace; constructor fields retain component, revision and path. A residual's external binder links return to the precise before-step context. Text from Lean's pretty printer is presentation; structural checks use the retained constructor fields.

All crossed lets clear `nondep` to false, following the local rule's annotation check. Other syntax, including a trailing uncrossed let, remains intact. Original annotations remain available to the inverse.

## Corpus probe

The probe reconstructs **all 18 previously recorded output closures** for `JacobiData.slope_bound_abs` and `lean_workbook_plus_6206`, matching their original native canonical hashes. Six of the ten Riccati closures contain two inversions each. Both schedules agree literally and reverse exactly. The remaining four Riccati closures and all eight AI-source closures have no exchanges, as do both original proof-body spines.

**New typing for the exchanged corpus terms remains unavailable.** These are structural candidates, excluded from the checked selector. A previous native closure check does not certify its newly exchanged descendant. This scan addresses one binder spine per recorded closure; it does not normalize every subtree of those proofs or evaluate a broad corpus.

## Bounds and open work

The offline model caps a spine at 128 binders, a sequence at 4,096 exchanges, each table at 131,072 rows and the retained sequence at 262,144 rows. It refuses work beyond those limits. The browser loads one small authored control (256 KiB decoded, 4,096 source/native rows), shows at most 128 binder cards per column and inspects at most four constructor vertices. These are distinct bounds, not a theorem about whole-process memory or scalable paged normalization.

The rule only moves lambda inputs across earlier lets along a primary body spine. Metadata and other constructors stop this spine; the scan does not look through them. It does not reorder inputs, exchange dependent input binders, rewrite under every branch, choose mathematical premises, construct arbitrary graph-region interfaces or measure comprehension. Typed normalization on a wider corpus and a verified general compiler remain open. The research goal stays active; the blog is unchanged.

## Evidence and reproduction

- [Native records](native-check.json.gz), including complete original compiled packets and intermediate shared graphs.
- [Independent model](model-check.json.gz), with all finite comparisons and refusals.
- [Corpus probe](corpus-probe.json.gz), with exact parent owners and unavailable new typing.
- [Production browser checks](browser-check.json.gz) and [aggregate fingerprints](evidence.json.gz).

```sh
python3 research/proof-atlas/binder-block-exchange/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean --workdir /tmp/new-binder-block-check
node research/proof-atlas/binder-block-exchange/check.cjs --freeze /tmp/new-binder-block-check
node research/proof-atlas/binder-block-exchange/check.cjs
node research/proof-atlas/binder-block-exchange/check-corpus.cjs --check
# After the production Jekyll build:
node research/proof-atlas/binder-block-exchange/check-browser.cjs
node research/proof-atlas/binder-block-exchange/evidence.cjs --check
```

Native checks use Lean 4.33.1 core only with the existing allocation, monitored RSS, timeout, output and free-space guards. No Mathlib runtime or private source is required for these authored controls. Compiler entries and raw execution logs remain local. Only authored controls/tooling, compiled term data and evidence are public. Reproduction records can be refreshed in the built technical directory; tested HTML, scripts and styles remain actual production-build bytes. A feature-branch push is not a deployment.
