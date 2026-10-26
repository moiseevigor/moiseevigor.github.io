# Mixed context interfaces: rule specification

Candidate syntax/recorded-typing language, not a semantic proof diagram or a verified renderer. `README.md` records the finite evidence and restrictions of the implementation. Native conversions below are existing recorded observations; this model adds no kernel checks.

## Distinct identities

An original source occurrence is identified by its packet hash and route. A computed type component additionally identifies its evidence archive, type table, original recording owner and component root. A descendant of a computed type also retains the enclosing recorded type root and its local type route. A type-table node number alone does not specify a binder or an original occurrence.

There are three different kinds of connection:

1. **Source field:** an unchanged constructor and one of its original ordered children.
2. **Recorded typing:** a source occurrence, its own context and role, and an observed type component. It does not type all descendants of that component.
3. **Recorded conversion:** a native check relating two expressions. It neither merges their syntax nor gives the expression port another typing judgment.

A context extension is an operation on the original context. It contributes no source occurrence and no introduced-variable typing judgment. Text and binder names are presentation payloads; equal names do not establish a reference link.

## Introduction

For original `fun x : A => b`, retain the following separately:

| Port | Object | Context |
|---|---|---|
| A | Original domain expression | Original Γ |
| S | Recorded inferred type of A | Original Γ |
| b | Original body | Original Γ+x:A |
| C | Recorded inferred type of b | Original Γ+x:A |
| D | Native expected-body expression | Original Γ+x:A |
| R | Recorded inferred type of the whole lambda | Original Γ |
| R.codomain | Exact descendant of R's observed Pi root | Computed Pi-local binder plus original Γ |

S is the observed type of A. The native normalized domain-sort component is retained separately; the model does not replace S with that component or confuse A with S.

The source lambda binder and R's computed Pi binder have an explicit correspondence. They remain different objects. The existing `kernelBodyConversion` observation relates C and D. D and R.codomain have matching syntax in the current admitted cases, but their binder namespaces and origins remain separate. The existing function conversion retains its actual normalized Pi component independently of R.

The source cut is `1 + size(A) + size(b)`. Type components, conversion observations and binder correspondence have zero source-occurrence contribution.

The implemented candidate requires R itself to have an observed Pi root and requires matching source/Pi domain syntax and binder payloads. General Lean typing does not require identical binder presentation or a syntactic Pi root in every equivalent type expression. Other shapes need an explicit boundary or a separately justified extension of this rule.

## Local definition

For original `let x : A := v; b`, retain source A and v in prior Γ, the value's observed type B in Γ, source b and its observed type C in original Γ+x:A:=v, and the whole expression's observed result type R in Γ. Preserve the recorded relations B ≡ A and C[v/x] ≡ R as relations between their own components.

The role of v comes from v's own record. The role of the whole let cannot classify the introduced variable. Shared formula presentation of A/B requires structural equality in the same context and preserves both formal ports. It never identifies C with R across the context extension.

The source cut is `1 + size(A) + size(v) + size(b)`.

## Composition at the actual body interface

A context unit can be followed by another admitted context unit only when the parent's original body and the next whole expression have the same packet-bound route, source node, original context and recorded role. Their **actual recorded types** must agree structurally; separate native origins remain attached.

An introduction's D is not its actual body typing C. Even when C ≡ D is recorded, a join through D would require a different conversion-aware composition rule. The current rule uses C. Two finite crossing positions refute substituting D for C in a structural join: the next recorded application result matches C, while its syntax differs from D. Those applications remain beyond this context-only chain.

A mixed frame with n retained constructors has one header region per introduction, two per local definition, and one final original body region:

`size(frame root) = n + sum(size(header regions)) + size(final body)`.

Earlier whole-unit subtrees overlap later units and are not summed. Rechunking the same prefix preserves its units, exact source boundary and disjoint regions; native origins at chunk seams do not collapse. Current finite checks use 4+4 and 1+3+4, not a general associativity theorem.

## Display and evaluation boundary

A future integrated view must make source fields, typing and conversions visually distinguishable; show the original contexts on both sides of each extension; and expose original/computed binder correspondence without drawing an invented source variable node. The same source position can select two different native components, for example a parent's body type and the child's conclusion type. Missing or incompatible observations must preserve source navigation and an explicit unavailable state.

The integrated mixed view and its finite browser checks are described in [reader.md](reader.md). Bounded paged model construction is separate from whole-browser memory, mathematical abstraction and measured proof-inspection benefit. Article synchronization is not required by the rule.
