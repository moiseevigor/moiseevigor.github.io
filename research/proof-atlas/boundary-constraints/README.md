# Source-specializing boundary equations

A boundary port need not remain an independent input. It can instead be a
local definition determined by an incoming type, provided its value is
well typed, uses only earlier bindings and specializes to the original source
value. This is a different interface policy from independent replacement.
It does not add a proof adapter or establish that every port can vary freely.

Of the same thirty predetermined region/policy candidates, **29 pass** fresh
closed typing and original-source recovery. The twenty-seven previously
accepted function graphs are literally unchanged. Two preceding failures
now close with five derived boundary positions and no adapter assumptions.
The Riccati all-position case remains rejected.

[![Dependent boundary equations](boundary-equations.svg)](boundary-equations.svg)

The figure is the authored `proofDiamond` calibration. It has eleven original
boundary positions: nine independent inputs and two derived propositions.
Its four original result positions remain explicit. Solid arrows represent
computed value uses. Dotted arrows connect recorded result types to the
proposition definitions; they are not value coercions or logical implications.
The six links open original source occurrences in the existing paged graph.
Computed addresses remain separately qualified in [figure provenance](figure.json.gz).
This new policy is not yet a selector in the interactive function reader.

## Rule

When a rebuilt application fails strict input-type conversion, compare the
actual and required types. The restricted solver may replace an independent
boundary variable by an expression from its exact earlier context. It checks:

1. No self reference, future binder, loose variable or metavariable occurs.
2. The proposed value has the original input domain in the computed context.
3. Substituting every earlier original boundary/result value yields a value
   with the original source domain.
4. That specialized value is kernel-convertible to the original source input.
   A separately typed `Eq.refl` witness records the equality.
5. Replacing the input declaration by a let definition leaves every later
   declaration well typed. The rebuilt application is checked again.

The position remains in the ordered boundary ledger with kind
`derived-input`; its source port is retained. It is no longer an independent
lambda parameter. Assignment values, domains, original values and witnesses
have explicit original or computed contexts. A failed candidate retains its
partial assignments and strict nonconversion record, without acquiring a
closed-function judgment.

The solver uses deterministic first-order application/projection decomposition
and prefers defining the later variable. It unfolds root metadata and local
definitions. It does not search for higher-order function solutions, solve
universe constraints, infer new axioms or use `MetaM` in the constant-data
environment. It has 4,096-step, depth-64 and root-unfolding-512 guards.
Native typing and source checks, rather than syntactic matching alone, decide
whether an assignment is admissible.

## Fixed comparison

| Earlier all-position failure | Independent replacement | Explicit adapters | Boundary equations |
|---|---|---|---|
| Riccati, seven calls | Rejected | 35 boundary inputs + 6 adapters | Still rejected at `25:4`; three partial definitions |
| `lean_workbook_plus_6206`, two calls | Rejected | 11 boundary inputs + 1 adapter | 8 independent + 3 derived positions; no retained original context |
| Authored dependent diamond, four calls | Rejected | 11 boundary inputs + 2 adapters | 9 independent + 2 derived positions; no retained original context |

These are overlapping policies in two corpus proofs and eight authored
controls. They are not thirty independent proofs, additional AI coverage or
minimal premise counts. In the diamond, the two derived propositions are
literally the incoming result types `a ≤ k` and `b < Nat.succ k`.
All arguments of every application and every original result remain present.

In the Riccati attempt, the first transport equality forces a type argument
to `Prop` and two proposition ports to applications of a supplied function.
The next proof requires another constraint on that function application.
The restricted solver leaves it unresolved. This is not an impossibility
result for a richer source-template or higher-order rule. The original
five-fact Riccati interface and conditional adapter interface remain valid.

## Why the source-value check is necessary

Two authored predicates are

```lean
F := fun n : Nat => n = n
G := fun _ : Nat => 0 = 0
```

Both have type `Nat → Prop`. Their applications at zero are definitionally
equal, while the functions are not kernel-convertible. This is a failure of
definitional equality, not a theorem that the predicates are logically
inequivalent. A solver that chose a constant motive merely to satisfy one
application could therefore lose the original function input. The assignment
rule refuses `G` as a replacement for the source `F`.

Fresh controls additionally refuse a differently valued Nat assignment,
a wrongly typed value, a future reference, self reference and exceeded work
or depth bounds. Two positive controls check later-input orientation and
a proposition derived from an earlier value.

## Evidence

- [Native cases](native.json.gz) and [verification](verification.json.gz):
  all thirty fixed candidates; 29 accepted functions with closed typing,
  source specialization, equality witnesses and original result portals.
  Five assignments belong to accepted functions; three belong only to the
  rejected partial Riccati attempt. The native report's total of eight counts
  both categories.
- [Independent reconstruction](model-check.json.gz): complete raw, reduced,
  closed and source-specialized functions for the accepted cases, the rejected
  application, every assignment's scope/source specialization and equality
  syntax, and literal equality with all twenty-seven earlier function graphs.
  Thirty damaged assignment records refuse. Observed domains, assignment
  choices and kernel conversions remain native inputs; JavaScript does not
  independently infer Lean types.
- [Authored controls](controls.json.gz) and [control verification](control-verification.json.gz):
  two accepted controls and seven refusals, including the source-family pair.
- [Figure provenance](figure.json.gz), [production browser](browser-check.json.gz)
  and [aggregate evidence](evidence.json.gz) record source links and presentation
  separately from native judgments.

The native run compares the complete Riccati type/body with its pinned compiled
module. Other original declarations are absent from packet replay. All 26,070
restored constant-data files and the support modules are hashed before and
after checking. Dependency binaries are attributed to their pinned cache,
not independently rebuilt. Original private proof scripts and logs remain
unpublished. Earlier reports are unchanged.

This is a finite, source-specializing boundary construction. General typing
preservation, higher-order constraint inference, arbitrary graph regions,
local-lambda closure, executable/codec refinement and measured comprehension
remain open. The article and blog are unchanged; the general research goal
remains active.

## Reproduction

```sh
node research/proof-atlas/boundary-constraints/prepare.cjs /tmp/fresh-boundary-plan
python3 research/proof-atlas/boundary-constraints/build.py \
  --lean /path/to/lean --workdir /tmp/fresh-boundary-build
python3 research/proof-atlas/boundary-constraints/controls.py \
  --lean /path/to/lean --workdir /tmp/fresh-boundary-controls --publish
# Recover the pinned constant data with region-native-types/recover.py.
python3 research/proof-atlas/boundary-constraints/verify.py \
  --lean /path/to/lean --build /tmp/fresh-boundary-build \
  --plan /tmp/fresh-boundary-plan --runtime /tmp/fresh-kernel-data \
  --support /path/to/checked-riccati-support --workdir /tmp/fresh-boundary-native --publish
node research/proof-atlas/boundary-constraints/check.cjs --check
node research/proof-atlas/boundary-constraints/figure.cjs --check
# After the actual production build:
node research/proof-atlas/boundary-constraints/check-browser.cjs
node research/proof-atlas/boundary-constraints/check-network.cjs
node research/proof-atlas/boundary-constraints/evidence.cjs --check
```

Native runs keep the 30 GiB free reserve, 8 GiB monitored RSS, 120-second
process and 64 MiB output limits. Temporary kernel data may be retired after
terminal checks; cache archives and provenance remain. No executable Mathlib
IR is restored. Offline audits retain complete fixtures; the diagram's source
links use the existing bounded reader. These are component/workflow bounds,
not a total-memory theorem.
