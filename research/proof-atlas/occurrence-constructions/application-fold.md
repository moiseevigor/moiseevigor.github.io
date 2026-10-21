# Reversible application groups in construction cuts

A recorded call can appear as a chain of binary application cards. The grouping
rule replaces a contiguous retained `fn` chain with one application group. Its
members remain in call order, from the innermost application to the selected
outermost application. Each argument port names its original member and `arg`
field. The head port names the innermost member's original `fn` field.

This uses the existing application-spine vocabulary. It introduces no Lean
constructor, term rewriting or inferred type judgment. The current implementation
is a model experiment; it is not connected to the browser renderer.

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
interfaces. It checks selection at 709 inner applications and twelve refusal
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
comprehension. Browser integration and the consumer's general correctness remain
separate work.
