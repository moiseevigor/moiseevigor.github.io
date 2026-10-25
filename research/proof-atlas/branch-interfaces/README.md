# Method interfaces without source lambda prefixes

Status: local research prototype. No blog post or deployment.

## Problem and rule

A recursor method is a function. Its original term need not start with the
lambdas expected by a source-only branch diagram: it may be a hypothesis,
let-bound function or another expression. The previous finite inventory has
32 checked recursor calls and 49 branches, all with their required source lambda
prefixes. It does not test this representation gap.

For a recorded method `f` with `n` inputs in its constructor reduction rule, open
its checked function type and form

\[
 f\equiv_\eta\lambda(x_1:A_1)\cdots(x_n:A_n),f\,x_1\cdots x_n.
\]

The input domains may depend on earlier inputs. Each domain sees the original
context and the preceding computed inputs; the body sees all `n` inputs. Stop
after the rule's input count, including when the result is itself a function.
Zero-input methods remain zero-input interfaces.

The new binders and application belong to `computed-method-interface`, with
their native evidence owner and exact computed graph addresses. They do not
inherit source routes or become original source lambda occurrences. The method
retains its original packet-qualified source occurrence. Source lambda frames
remain separately available in the existing elimination view. Domain-reference
links distinguish original context binders from earlier computed inputs.

The native producer checks the eta term's type, conversion to the original
method, and an exact abstraction roundtrip for its application body. The browser
also verifies the literal eta scheme: the original method is lifted under the
new binders and applied to them in order. Kernel conversion alone does not
identify this syntax, particularly for proof-valued methods. Expected method
types and actual inferred types remain separate recorded conversion endpoints.

## Finite result

Fresh Lean 4.33.1 checks cover **16 methods, 24 inputs and 12 recursor calls in
six profiles**. Eight methods come from seven recorded Riccati calls. Five
authored controls supply eight more methods: disjunction, conjunction,
dependent natural-number recursion, function-valued recursion and a let-bound
method application.

Six control methods require inputs but have no source lambda prefix. The
computed interface supplies their typed ports without fabricating source
lambdas. The dependent step includes a domain `P n` referring to the preceding
computed `n`. The function-valued step has two rule inputs and returns a
function; it is not extended to three inputs merely because its result type is
another Pi. Two zero-input methods test the empty interface.

An independent checker hashes lexical variables by their context ordinals and
compares the source method with the function inside the computed application.
It separately reconstructs all displayed domain references. Sixteen rejection
controls include well-formed expression graphs with captured or permuted eta
inputs while leaving original method and type nodes untouched. Eight additional
comparisons bind the fresh Riccati interfaces to the existing elimination
records: method source, constructor, context, actual type and expected type
must agree. Conflicting peer types or contexts are rejected. These forged
claims are in-memory negative fixtures, not native records.

## Provenance and limits

The Riccati query matches the original compiled packet field for field. This
run rehashes the three previously compiled private modules and their associated
source hashes against the preceding verification; it does not recompile those
modules or publish their scripts. The checking cache is hash-verified against
its recorded inventory. Its Mathlib revision remains cache attribution, not an
independent Git checkout or source rebuild.

The five controls are newly authored experiments. Their declaration module is
read from Lean, and their fixture-file hash is distinguished from a verified
compiled-module/source relationship. The generated checking runtime imports
`SE2Conjugate.Riccati`; this is stated for the controls too. They are not
additional formalizations of the Riccati theorem. Only compiled packets, native expression
records and verification metadata are added to the public data. Kernel checks
apply to these finite contextual interfaces, not to all descendants or a
portable certificate checked by the browser.

This opens a method interface; it does not unfold or explain an unrecorded
method body. It neither establishes general recursor coverage nor measures
human comprehension. The general research goal remains active.

## Inspect and reproduce

Open the manual's **kernel-checked method interfaces** experiment. Select the
dependent step and follow its domain reference to computed input 1. In the
complete Riccati reader, open the sign split, choose **Show case elimination**,
then **Show computed method interface**. Source actions select the exact
original method or original context binder.

The native runner uses an existing checking cache, an explicit Lean binary and
the previously verified private compilation. Its local resource records remain
outside the blog and public payload. It enforces an 8 GiB process limit,
30 GiB disk reserve and 120-second native-phase limit. This is an extraction
bound, not a corpus-wide memory benchmark.

```
node research/proof-atlas/branch-interfaces/publish.cjs PRIVATE_WORKDIR --check
ATLAS_METHOD_CHECK=1 node scripts/test-proof-atlas-method-interfaces.cjs
node scripts/test-proof-atlas-method-interfaces-browser.cjs
node scripts/build-proof-atlas-method-evidence.cjs --check
```

[Native, model and browser evidence](method-interface-evidence.json).
No new blog claim is promoted from this finite experiment.
