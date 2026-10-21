# Reversible application groups in construction cuts

A recorded call can appear as a chain of binary application cards. The grouping
rule replaces a contiguous retained `fn` chain with one application group. Its
members remain in call order, from the innermost application to the selected
outermost application. Each argument port names its original member and `arg`
field. The head port names the innermost member's original `fn` field.

This uses the existing application-spine vocabulary. It introduces no Lean
constructor, term rewriting or inferred type judgment. The optional **Group applications** control uses this rule in the existing
occurrence construction reader. Individual stages remain available by turning
grouping off. Article reading defaults are unchanged.

## Contract

`ProofAtlasApplicationSpineCut/1` is a reversible quotient of an attested
`ProofAtlasOccurrenceConstructionCut/1`. Every primitive rule belongs to exactly
one group. Single introductions keep their ordered `binderType` and `body` ports.
The original source edges, member records, computed-type origins and frontiers
remain recoverable. Unfolding restores the entire original cut, including its
node ordering, checks, addresses and exact occurrence partition.

Only already retained, compatible native application rules can join a group.
A missing record, different interface, non-application constructor or cut/member
limit stops the chain. If the head boundary is itself an application, argument
slots are relative to the retained suffix. They are not numbered as the first
arguments of the complete source call. Selecting an inner application does not
import arguments from enclosing applications. A complete structural spine does
not establish saturation or mathematical relevance.

Every original member remains selectable. `stageFor` exposes its original Γ,
function/argument/result roles, binder visibility, conversion checks, recording
query/stage and shared type-table references for the before, argument, after,
normalized Π, expected domain and substituted result types. Meta argument types
remain distinct observations. Type roots use the construction record's table;
an older matching contextual observation can use a different table for the same
source occurrence. The tables must not be interchanged.

The primitive cut keeps its bounds of thirteen retained constructors, depth four
and source suffixes of at most five fields. Grouping cannot expand that cut or
create additional native coverage. The grouped serialized scene is capped at
64 KiB. On-demand stage interfaces reference the existing table rather than
copying it. Source/type tables still reside in memory; this is not a whole-proof
memory guarantee. External original Γ links contribute zero to subtree counts.

## General structural laws

`ApplicationFold.lean` defines bounded splitting and ordered reassembly on the
actual `Lean.Expr` type. Four theorems establish, for every expression and fuel:

- Reassembling the split yields the identical expression.
- The number of extracted arguments does not exceed the fuel.
- Reassembly has `size(head) + argument count + sum(size(argument))` occurrences.
- Splitting therefore partitions the original expanded occurrence count exactly.

The compiler is Lean 4.33.1. Printed axiom inventories contain only `propext`
and `Quot.sound`; none contains `sorryAx`. The checked summary records the source
hash and each theorem's axiom inventory. These laws do not verify the JavaScript
consumer, serialized codec, graph layout or native typing algorithm.

## Finite adapter checks

The independent audit checks 9,270 cuts in 36 cases: eleven contextual controls
and twenty-five existing project/attributed-AI declarations. Across the tested
cuts it checks 4,155 multi-member group appearances, 10,261 grouped member
appearances, 4,143 original binder-link appearances and 2,345 on-demand stage
interfaces, with 7,035 before/argument/after type-component checks. It checks selection at 709 inner applications and twelve refusal
controls. The largest tested scene is 40,191 bytes. Counts are appearances in
these overlapping cuts, not distinct new proofs or kernel judgments.

In the Riccati AM–GM call `JacobiData.two_sqrt_mul_le_add`, at original source
node 1227 in `JacobiData.slope_bound_abs`, four retained application constructors
become one group with a head and four ordered argument ports. The exact count is
four retained plus 165 boundary occurrences, totaling 169. Both nonnegativity
proof arguments retain recorded types but lack their own construction records;
the fold does not turn them into newly checked steps.

Run from the repository root:

```sh
node scripts/test-proof-atlas-occurrence-application-fold.cjs
python3 research/proof-atlas/occurrence-constructions/verify_application_fold.py \
  --lean /absolute/path/to/lean-4.33.1/bin/lean \
  --workdir /private/workdir/application-fold --check
```

The default audit output is `/tmp/atlas-application-spine-fold/`. Compiler logs
and resource reports stay in the requested private work directory. These results
do not establish complete proof coverage, semantic compression or improved human
comprehension. The consumer's general correctness and measured reading tasks remain separate
work.

## Reader interactions

In the occurrence reader choose **Proof constructions**, then **Group
applications**. The shared node/depth controls still bound retained primitive
rules. A group has a head port and ordered argument ports. Its **Retained stages**
list opens individual member selections without changing the group root. Each
member has before, argument and after type actions and a source-focus action.
Before/argument actions select those exact original source fields, rather than
showing their type beside the parent application's source node.

The list is scrollable and native text previews are capped at 1,600 characters
per component; the full recorded type graph remains selectable. Expanding the
list recomputes card positions and connector endpoints. Grouping and the level
limit are retained in shareable occurrence URLs. A failed optional grouping
script leaves the individual construction reader available, and a late load
cannot override an explicit return to individual stages or source mode.

Browser checks compare the grouped scene in all 36 profiles, including three
controls that have no construction records. They exercise Riccati port order,
every retained AM–GM stage's source and three type components, partial-spine
labels, inner-source focus, saved view settings, distinct Meta/kernel types,
missing/stale optional components and desktop/mobile reading in both themes.
These tests establish the listed interactions, not a renderer correctness proof
or coverage of every formalized proof step.

[Local definitions](local-definitions.md) use version 2 of the primitive and grouped
cut formats. They retain three source ports as one member; their body context
is extended by a local definition. The application-group rule remains unchanged.
