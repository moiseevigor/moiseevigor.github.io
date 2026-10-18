# One-hole contexts and local refinement

Matching retained and hidden counts does not establish that an operation changed
only the selected region. `HoleContext s e` records a surrounding cut of the
original `Lean.Expr e`, with one hole for the original expression `s`. Its
siblings, constructors and payload parameters remain fixed. `plug C S` inserts
the cut `S : Cut s` into that hole.

The pinned Lean kernel checks ten laws. In particular, filling the hole refines
the original cut; every previously visible path remains visible. Two stronger
equalities describe exactly which region changes. If `q` is the hole's path:

```
outside q:  visible(C[S], p) = visible(C[T], p)
inside q:   visible(C[S], q ++ p) = visible(S, p)
```

Outside means that `q` is not a prefix of `p`. The outside equality holds for
any two replacement cuts, including cuts with different visibility. It preserves
the entire surrounding cut, rather than merely preserving its total size.
Nested contexts compose as `compose(C, D)[S] = C[D[S]]`; their source routes
concatenate in the same order.

The exact count identities are:

```
retained(C[S]) = retained(C[hole s]) + retained(S)
hidden(C[S]) + size(s) = hidden(C[hole s]) + hidden(S)
```

The model has all eleven structural child positions: both application fields,
binder type/body fields of lambdas and foralls, the three let fields, metadata's
expression and a projection's structure. Any of the twelve expression kinds may
occupy the hole. Source names, binder information, universe parameters, metadata
and the let's nondependency flag remain parameters of the original expression;
the operation does not rewrite or reindex them. An occurrence path, rather than
a shared expression identifier, determines the hole.

## Evidence

The native checker separately checks each theorem's type, proof term and
expected-type conversion with `Kernel.check`. Allowed axiom sets are subsets of
`propext` and `Quot.sound`; `plug_refines` and `fill_refines` have no axioms.
The general laws quantify over expressions, cuts and paths. They are not inferred
from the finite examples.

The compiled fixture packet has 156 cases: twelve focus kinds in thirteen
contexts (the root, eleven child positions and a nested shadowing example).
Four replacement depths give 624 replacements. An independent reader reconstructs
each source cut, replaces only the selected hole and compares the complete result,
including literal payloads and sibling cuts. It checks 1,196 inside-path and 2,208
outside-path observations. Twenty-two changed-record controls must reject.

Payloads in these small fixtures use literal pinned-compiler representations.
They are not a general `Expr` interchange decoder. Metadata fixtures use an empty
metadata map. Some controls contain open variables or deliberately untyped
surroundings; no fixture receives a proof-typing claim. The source-indexed laws
preserve their original syntax regardless of whether it is well typed.

These laws extend the [source-cut model](../cut-refinement/README.md). The
[browser replacement rule](../local-refinement/README.md) has separate finite
implementation checks. This development does not prove the JavaScript, its
lexical-link implementation, native type composition, semantic interpretation or
human comprehension. No expanded large-proof tree is built by the browser rule;
the fixtures here are small structural controls, not an AI-proof benchmark.

## Reproduction

Only pinned core Lean and this repository's public control sources are used.
Private mathematical source projects are absent. Two isolated native reproductions
must agree on compiled theorem and fixture records before publication. The packet
records producer hashes; `--check` also compares a fresh native result with the
published output.

```sh
python3 research/proof-atlas/local-cut-context/verify.py \
  --lean /absolute/path/to/lean-4.33.1/bin/lean \
  --workdir /absolute/path/to/new-private-workdir --check
node scripts/test-proof-atlas-local-cut-context.cjs
```

[Definitions and proofs](LocalContext.lean) · [Native fixture producer](Fixtures.lean)
· [Bounded native checker](verify.py) · [Compiled records](/public/data/proof-atlas/local-cut-context-manifest.js)
· [Independent reader](/scripts/proof-atlas-local-cut-context-audit.cjs)
· [Altered-record checks](/scripts/test-proof-atlas-local-cut-context.cjs)
