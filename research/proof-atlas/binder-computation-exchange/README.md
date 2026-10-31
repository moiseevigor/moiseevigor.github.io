# Moving an input across a computation

A typed region boundary must retain the dependencies of its input domains. This experiment adds a local rule to the [visual manual](/projects/proof-atlas/manual/#binder-exchange): exchange one adjacent let computation and input lambda, transporting the input domain and permuting the two binders in the body.

```text
Before: let x : A := t; fun y : B(x) => r(x,y)
After:  fun y : B(t) => let x : A := t; r(x,y)
```

Two general typed dependent laws in [Laws.lean](Laws.lean) have fresh Lean kernel checks and empty transitive axiom lists. They allow arbitrary `Sort` universes and a result family depending on both `x` and `y`. They are mathematical laws, not a verified compiler theorem about the Expr implementation.

## Exact field rule and inverse

The let's domain `A` and value `t` belong to Γ. The original lambda domain belongs to Γ,x; the body belongs to Γ,x,y. Moving the input substitutes `t` for index zero in its domain. The moved let domain and value are lifted beneath `y`; the body swaps the two corresponding de Bruijn indices, respecting every nested binder. Names, binder information, levels and metadata are retained. The new let clears its `nondep` annotation to false; the original flag is retained with the original domain for the inverse.

The output term alone does not determine the original domain. The inverse therefore carries the literal original domain, in Γ,x, with its source record and original let flag. It verifies that substituting `t` into that retained domain reproduces the transported domain, removes the added input scope from the let's domain/value, swaps the body back and reconstructs the original term exactly. This is syntax recovery with a domain/annotation residual, separate from kernel conversion.

Moving an input can invalidate the old let's nondependence annotation. The native diagnostic replaces the moved let with its lambda application and checks that exact expression independently. Five source-true flags fail that diagnostic after exchange. Clearing the new flag avoids retaining an unverified elaborator claim; the old flag remains in the inverse residual. Lean's kernel does not itself verify `nondep`. This is a kernel-expression rule, not recovery of original tactics or surface syntax.

## Native and independent checks

Eleven authored compiled declarations cover dependent values/results, proof inputs and local proofs, a type-valued definition with universe parameters, repeated binder names, an implicit input, a nested lambda, an ambient local definition and a domain-origin collision. The original control declarations are absent from replay. Each original closed packet passes kernel checking. Each exchanged term checks at the original type, its inferred type converts to that type, and the term converts to the original. A typed equality witness and closure over the entire original context are checked separately.

The independent JavaScript codec reconstructs all eleven complete transformed terms, original-domain residuals and exact inverses. It also reconstructs twenty-two native mutation candidates. Two unchanged-domain candidates infer a type but fail at the original type. Seven unchanged-body candidates fail initial kernel typing. One unchanged-body proof candidate passes typing and conversion while changing the literal binding: conversion does not establish the required source correspondence. Three fresh native processes refuse changed source nodes, contexts and declaration names with ordinary input errors.

### A literal collision

`namedDomain` and `expandedDomain` have different original input domains, `Fin k` and `Fin 1`, under a local definition `k := 1`. Both use their inputs; `Fin 1` is inhabited. Their transported terms and their closed transported functions are literally identical, including annotations. Their domain residuals differ. Using the other residual reconstructs the other original source term, so a correct residual must remain associated with its original owner.

This is a counterexample to reconstructing original syntax from the transported term alone. The two source programs are not claimed to be semantically different.

## Riccati and AI-source probe

Neither selected original proof body (`JacobiData.slope_bound_abs`, `lean_workbook_plus_6206`) contains a stored directly adjacent let/lambda pair. The closure rule can create this adjacency while closing a result over its actual source context.

Six previously checked Riccati output closures have an adjacent pair, at calls 25, 26, 27, 76, 77 and 78. The probe first reconstructs each complete original closure and matches its old native canonical hash. It then checks the field exchange and exact inverse. All six exchanged input domains are syntactically independent of the crossed let binder. The AI-source output closures have no matching pair.

**The six new corpus terms have no fresh native typing record.** They remain structural candidates and are excluded from the manual's checked-control selector. Their original source ports, original native closure owners and computed closure routes remain distinct. The scan uses one canonical body occurrence per matching stored source pair and the recorded wrapper prefixes; it does not enumerate the expanded occurrence tree.

This local exchange is one operation needed for typed region interfaces. It does not construct an interface for arbitrary source-use graph regions, normalize every dependency, establish minimal premises or measure human comprehension. The general research program remains active. The blog is unchanged.

## Delivery and reproduction

The manual loads one authored control on request. Its original packet and native component table each have a 4,096-row limit; the decoded control has a 256 KiB limit. The recorded examples are much smaller. Constructor inspection uses the shared four-vertex neighborhood, ordered fields and exact lexical portals, with a 512-slot path limit. This small-control view does not establish paged delivery or a total-browser memory bound for arbitrary exchanges.

- [Native evidence](native-check.json.gz): source packets, exact native outputs, compiler/producer fingerprints, two laws and three native input refusals.
- [Independent model](model-check.json.gz): forward/inverse construction, mutation comparisons and the literal collision.
- [Corpus probe](corpus-probe.json.gz): exact old closure owners and explicit unavailable new typing.
- [Production browser checks](browser-check.json.gz): fields, original/derived identities, binder portals, cancellation, accessibility and keyboard.
- [Compatibility](compatibility.json.gz) and [aggregate fingerprints](evidence.json.gz): preceding readers and current production bytes.

```sh
python3 research/proof-atlas/binder-computation-exchange/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean --workdir /tmp/new-exchange-check
node research/proof-atlas/binder-computation-exchange/check.cjs --freeze /tmp/new-exchange-check
# Frozen checks:
node research/proof-atlas/binder-computation-exchange/check.cjs
node research/proof-atlas/binder-computation-exchange/check-corpus.cjs --check
# After the actual production Jekyll build:
node research/proof-atlas/binder-computation-exchange/check-browser.cjs
node research/proof-atlas/binder-computation-exchange/check-compatibility.cjs
node research/proof-atlas/binder-computation-exchange/evidence.cjs --check
```

Native runs use Lean 4.33.1 core only, without Mathlib or private project imports, under the existing allocation/RSS/time/output/free-space guards. Private execution logs and compiler binaries are not published. Only authored controls/tooling, compiled terms and verification records are added. Reports may be refreshed in the production reproduction directory after the build; tested HTML, application scripts and styles remain actual build outputs. A feature-branch push is not a merge or deployment.
