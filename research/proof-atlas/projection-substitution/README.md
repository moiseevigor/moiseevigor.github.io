# Context projection and substitution

Context reduction can be composed with capture-avoiding substitution at the structural reference layer. `Fusion.lean` proves a lifting law, a substitution law and its depth-zero corollary on actual `Lean.Expr`, using the unchanged functions from `context-projection/Projection.lean` and `expr-reference-laws/Reference.lean`. A fourth checked declaration records a counterexample to unconditional eager projection of the replacement. These are standard structural compatibility properties applied to this reference model; no mathematical novelty claim is made.

The purpose is compositional: a folded region may drop unused context entries and subsequently replace an input or local definition. Its internal references must have the same meaning whichever operation is performed first. This supplies a structural constraint for that operation; it does not construct arbitrary typed graph-region interfaces or establish typing preservation.

## Rules

Let `P(r,e)` be the partial projection, returning `Option Expr`; `↑ᶜr = liftN c r` protects the first `c` indices. The map `r : Nat → Option Nat` may be any partial renaming. `L(e,k,c)` inserts `k` slots at cutoff `c`; `S(e,v,d)` substitutes `v` at index `d`, lifting it beneath inner binders and decrementing higher indices.

The exact checked lifting law is:

```
P(↑ᶜ⁺ᵏr, L(e,k,c)) = map (fun e' => L(e',k,c)) (P(↑ᶜr,e))
```

If `P(r,v) = some v'`, the substitution law is:

```
P(↑ᵈr, S(e,v,d)) = map (fun e' => S(e',v',d)) (P(↑ᵈ⁺¹r,e))
```

The extra protected slot on the right is the binder being eliminated. Domain/type fields and let values remain in their original scope; only lambda/Pi/let bodies add a binder. Metadata, structured names, binder annotations, nondependent let flags, literals, levels and free/metavariable IDs remain unchanged. Both equations include failed projection, not only successful outputs. No injectivity or ordering assumption is needed for these raw syntax equalities; valid context pruning has additional requirements.

The geometric composition square at depth zero has four corners:

| | Before substitution | After substitution |
|---|---|---|
| Original context | `e` in `Γ,x` | `S(e,v,0)` in `Γ` |
| Projected context | `P(↑r,e)` in `Γ',x` | `S(P(↑r,e),v',0)` in `Γ'` |

Vertical edges are partial context projection. Horizontal edges are substitution. This is an operation diagram over exact expressions, not a source-use edge or a claim that two prose passages are equivalent. A failed projection leaves its corner unavailable.

## Checked examples and limitation

Two authored closed controls pass fresh kernel typing, recovery conversion and a typed `Eq.refl` witness. Every generated body, closure, inferred type and witness is retained in the compiled graph, with independent structural reconstruction:

- With `Γ = (a : Nat, unused : Nat)`, drop `unused`, replace `x` by `a` in `Nat.add x a`. Both routes produce `Nat.add a a`. The original closed function converts to the adapter that supplies `a` to the reduced function.
- With `Γ = (A : Type, unused : Nat, a : A)`, drop `unused`, replace `x : A` by `a` in `fun y : A => x`. Both routes produce `fun y : A => a`. Domain and body indices cross different scopes; the type parameter `A` stays attached to its binder.

The replacement premise is significant. Take `r(i)=none`, `e=Nat`, `v=#0`. Substitution leaves `Nat`, whose projection succeeds, although the unused replacement does not project. Therefore an unconditional implementation that first projects the replacement and aborts on failure is stricter than projecting the substituted expression. The theorem is conditional; it is not that unconditional algorithm. Successful projection here also says nothing about free or metavariables being closed.

## Evidence

`native.json.gz` contains one 654-row postorder expression graph and compact reference tuples for every case. Tuple schemas are explicit in `Controls.lean` and `check.cjs`. The unchanged 23-shape constructor fixture is instantiated at ambient depth four, with cutoffs/depths zero through three. Sixty-four maps enumerate every partial map from three indices to `{0,1,2}`; three additional twelve-entry maps test identity, shifting and collisions. All maps are unavailable beyond their finite recorded domain. The twelve constructor kinds, four binder visibility annotations, both let flags, metadata, literal variants, structured names and shared universe payloads are exercised.

| Check | Result |
|---|---:|
| Lifting/native comparisons and projection squares | 18,492 |
| Successful lifting projection | 13,548 |
| Failed lifting projection | 4,944 |
| Substitution/native comparisons | 30,820 |
| Replacement projects, result projects | 22,898 |
| Replacement projects, result is unavailable | 2,402 |
| Replacement unavailable, conditional law inapplicable | 5,520 |
| Of those, substituted result still projects | 3,234 |
| Closed typed controls / closed terms / recovery witnesses | 2 / 8 / 2 |

All 49,312 native comparisons use Lean's opaque `liftLooseBVars` or `instantiate1`; substitution beneath a cutoff is checked through an explicit lambda wrapper and peel. This is finite implementation evidence, separate from the general theorems. The independent JavaScript checker reconstructs every result, including all failure branches and both typed control closures. It has explicit small-control work/node limits; it is not a production evaluator or massive-sharing benchmark.

Each theorem type, proof and proof-at-expected-type wrapper is freshly kernel checked. The laws use `propext` and `Quot.sound`; the counterexample uses `propext`. No `sorryAx` or added axiom is allowed. `verification.json.gz` records compiler/executable/source/runtime hashes and the guarded native run. `model.json.gz` records the independent reconstruction and source fingerprints. `evidence.cjs` verifies the complete technical package and, after a production build, `check-production.cjs` checks its manual explanation in desktop/mobile light/dark layouts.

Reproduce from the repository root with core Lean 4.33.1 and a fresh private directory:

```sh
python3 research/proof-atlas/projection-substitution/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean \
  --workdir /private/tmp/atlas-projection-fusion-fresh --check
node research/proof-atlas/projection-substitution/check.cjs --check
```

After an actual production Jekyll build, serve `_site_production` and run `check-production.cjs` with Playwright and axe-core available through `NODE_PATH`, plus `ATLAS_ORIGIN` and `ATLAS_CHROMIUM_PATH` for that server/browser. It produces the current four-layout render record. `evidence.cjs --check` verifies the frozen complete package against that recorded build; a fresh timestamped build requires a fresh render record. Generated technical records may be copied into the build and checked byte for byte; application HTML/JS/CSS must come from the actual build.

Original private modules and Mathlib are not imported. Old producer snapshots and evidence are unchanged. This result does not prove the wire codec, the bounded shared evaluator or native externs in general, context well-formedness after pruning, typing preservation, semantic premise minimality, semantic compression or improved human comprehension. The two typed controls do not remove these boundaries. The general geometric-language goal remains active. Blog and deployment state are separate.
