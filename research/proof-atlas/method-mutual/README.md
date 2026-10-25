# Mutual reduction-rule owners and recursive targets

Status: local research iteration. No blog post or public deployment.

## Representation problem

For a mutually defined family, the enclosing proof call, the owner of a
constructor reduction rule and the target of a recursive premise can be three
different identities. The preceding observer assumed one recursor's rules
covered every method. Fresh native checks show why that assumption fails:
each sibling stores its own constructors, while both accept all family methods.
The unchanged observer refuses all three controls with “Some minor premises
have no mapped constructor rule”. The declarations themselves pass kernel checks.

The Tree/Forest control also distinguishes signatures. Tree has one index and
Forest has two. A Tree-owned rule calls Forest with two indices; the Forest
constructor has a Tree premise and a Forest premise, selecting different motives
and returning Nat and Bool in the authored example. Reusing the enclosing call's
arity or selected motive would misrepresent those premises.

## Versioned native contract

`ProofAtlasElimination/2` adds a bounded mutual target table and explicit rule
owners. The versioned fixture runtime leaves the existing exporter source and
all previous observations unchanged. Its extension:

- Obtains each kernel recursor with Lean's `mkRecName` and `getConstInfo`, then
  checks its mutual family, major inductive, fixed prefix domains and selected
  result-motive binder. The browser does not infer family membership from names.
- Records each target's literal constant head, exact universe payload, checked
  type root, parameter/motive/method/index counts and major-premise position.
  A typed constant-head node binds the target name and levels to serialized
  syntax. It prevents an unselected sibling's universe list from drifting away
  from its recorded head.
- Gathers the family-owned constructor rules, checks each RHS and constructor
  owner in Lean, and requires a unique complete mapping of family methods.
- Retains the original enclosing call's source route and its kernel-checked
  method interfaces. A sibling-owned rule does not invent another source call.

The client validates the complete target/constructor inventory, fixed prefix
shape, result-motive selection, major inductive and parameter/index order.
Recursive-input classification accepts only a recorded target with unchanged
family parameters, motives and methods, and a major drawn directly from the
corresponding constructor field or forwarded functional field. Unknown or changing
schemes remain unavailable. The actual call must match the complete recorded constant payload, including
structured name parts and universe levels. Printed names and equal-looking
types do not establish a link.

## Shared geometry

The existing origin view and argument-group collar expose the target signature
of the selected recursive premise. They keep the enclosing proof call, rule
owner and target/motive visible separately. Each target supplies its own index
count and major position; parameters, motives and branch methods keep their
shared ordered prefix. A functional sibling premise retains the schema lambda
and its local variable scope.

Every port keeps its original native-record hash, query/minor, schema root and
exact occurrence route. Schema navigation stays in that namespace and preserves
the selected source proof. Origin collars remain bounded at 12 vertices, argument
collars at eight, and raw kernel cuts at 32. Counts for ports, schema occurrences
and source-proof occurrences remain separate.

## Native controls and finite evidence

Three authored Lean 4.33.1 definitions add eleven kernel-checked method frames:
the Tree and Forest calls have four methods each, and the functional Rose/Grove
call has three. The selected source caller differs from the rule owner in five
frames. The model audit checks 27 inputs, eight recursive premises (six sibling,
two self), twelve recursive index arguments, 54 forwarded prefix arguments and
129 bounded kernel cuts. All eleven frames agree through paged source/native
query delivery without requesting complete archives on that path; offline
reassembly reproduces the three original native records exactly.

An independent application/type-spine and lexical walk checks ownership and
signature positions. The constant-valued motives in these controls also permit
an exact check that the computed premise type selects Nat or Bool correctly.
Negative controls reject missing targets, wrong arities/motives/owners, changed
universe payloads and an attempted downgrade to the old contract.

The [evidence bundle](method-mutual-evidence.json) retains native producer hashes,
the [baseline boundary](legacy-boundary.json), current compatibility reports and
browser checks. Earlier checkpoints remain immutable, including `351462850`
for argument groups.

```sh
ATLAS_MUTUAL_CHECK=1 node scripts/test-proof-atlas-method-mutual.cjs
node scripts/test-proof-atlas-method-mutual-browser.cjs
node scripts/build-proof-atlas-method-mutual-evidence.cjs --check
```

Regenerate with `verify.py`, package with `publish.cjs`, and run `legacy.py`
against the same native directory for the preceding observer's boundary check.
The three definitions are noncomputable because this compiler does not emit
these recursors directly. No execution benchmark is claimed.

The environment imports Mathlib/Aesop, excludes private Riccati modules and uses
hash-verified binaries attributed to Mathlib revision
`0df444a360eaa60ab8c11dca51a86af692955474`. Original Git checkouts and an independent
dependency rebuild are not verified. Public assets contain compiled packets and
native observations, not original private proof scripts. These controls remain
separate from the main corpus and the publisher-attributed AI sample.

## Limits

The mutual inventory is capped at eight targets, shared prefix counts, 32 methods
and the existing metadata/native-record bounds. This is a finite extension of
literal kernel-schema navigation, not a portable kernel certificate, general
elimination, index normalization, premise necessity or measured comprehension.
Changing recursive parameters and other recursor schemes remain outside the rule.
Native/type graphs still load fully for the selected call under the existing
8 MiB limit; source/page bounds and diagram bounds are not whole-browser heap
measurements. The recorded Riccati methods acquire no invented recursion or
mutual-family correspondence.
