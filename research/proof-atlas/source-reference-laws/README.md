# Reference counts under source-cut refinement

For a fixed original outside binder, opening a hidden region must preserve its
total syntactic reference count. The new result is a general law on actual
`Lean.Expr` and the existing source-indexed `Cut e`, separately compared with
the current JavaScript count and occurrence-cut models. It does not add a
typing judgment or determine necessary mathematical premises.

## Rule

Write `R(e,i)` for the expanded occurrences of free de Bruijn index `i` in `e`.
For a cut `C : Cut e`, let `V(C,i)` count retained variable occurrences and
`F(C,i)` count occurrences inside its hidden frontiers. Then, for every `e`,
every cut and every natural index:

```text
V(C,i) + F(C,i) = R(e,i)
```

Each frontier's index is shifted by the number of binders between it and the
selected root. The constructor equations are:

| Expression | Reference count at index i |
| --- | --- |
| bvar j | 1 if i = j; otherwise 0 |
| app f a | R(f,i) + R(a,i) |
| lam / forallE with domain d and body b | R(d,i) + R(b,i+1) |
| letE with type t, value v and body b | R(t,i) + R(v,i) + R(b,i+1) |
| mdata / proj with child e | R(e,i) |
| fvar, mvar, sort, const, lit | 0 term de Bruijn occurrences |

The zero in the last row does not mean a free variable or metavariable has no
dependencies. Its external assignment is outside this syntactic count. The
existing source-support scanner still refuses unresolved expression objects;
these formal laws do not change that policy. Universe payloads and metadata
values are not term de Bruijn indices. Every ordered expression child is counted,
including annotations; shared child fields contribute separately.

If `C'` refines `C` by replacing only holes, then:

```text
V(C,i) ≤ V(C',i)
F(C',i) ≤ F(C,i)
V(C',i) - V(C,i) = F(C,i) - F(C',i)
```

Thus a hidden-reference label is preserved under local source refinement.
Absence means both the visible and hidden counts are zero; absence from the
visible diagram alone is insufficient. A depth/budget control that reselects a
different cut is not automatically refinement: the older
[depth counterexamples](../cut-refinement/README.md) still apply.

For the own `dependent-let` syntax control, the type and value are `bvar 0`,
and the body is `bvar 1` below the new binder. At outer index zero the total is
three. Retaining only the let wrapper gives `0 visible + 3 hidden`; retaining
its three atomic fields gives `3 visible + 0 hidden`. Counting `bvar 0` in the
body as an outer reference would instead capture the new binder. These open
fixtures carry no proof-typing claim.

## General proof and finite bridge

[References.lean](References.lean) defines the three functions and proves ten
laws: partition, visible monotonicity, hidden antitonicity, exact transfer,
presence, absence, an upper bound by constructor occurrences, and the explicit
lambda/Pi/let field equations. The `Cut` index fixes original constructor fields
and payloads. No variable is reindexed or term reduced. Theorems quantify over
all twelve constructor forms, including arbitrary shared expression values;
they are not conclusions inferred from a corpus test.

Two fresh isolated core-Lean 4.33.1 runs reproduce the same native output hash.
The driver independently checks each theorem's type, proof and expected-type
conversion with `Kernel.check`, and records its axiom list. Those lists are
subsets of `propext` and `Quot.sound`, with no admitted proof or extra axiom.
The installed compiler/core environment is trusted; it is not independently
rebuilt. No Mathlib or original private mathematical proof module is imported.
Only the program's own reference proofs and small authored controls are added.

The [native record](native.json.gz) also contains 52 small syntax fixtures and
2,496 coefficient rows. An independent occurrence enumeration agrees with all
native visible/hidden/total counts. The unchanged sparse-vector evaluator
agrees with 416 root coefficients. Controls cover all eleven child positions,
shadowing, domain and let-value scope, both let flags and repeated child fields.
Seven discriminating controls distinguish the correct equations from alternatives
with wrong body shifts, shifted let headers or deduplicated repeated fields.

The [implementation comparison](model-check.json.gz) checks 17,012 coefficient
identities over 1,424 occurrence cuts. These include all free-index coefficients
plus one absent coefficient at 303 selected binder bodies in 51 profiles, as
well as the native fixtures and one authored sharing control. Among these
checks, 12,759 adjacent budget refinements preserve retained original paths and
transfer the same reference count from hidden to visible. Profile and body
inventories overlap; they are not counts of independent theorems or proof steps.
Project/AI-attributed inputs include packets with 86,587, 91,424 and 121,568
stored nodes. The dataset publisher supplies AI attribution; generation
provenance is not independently verified here.

The separate sharing control has 181 stored nodes and `2^180` reference
occurrences. Exact integer counts preserve repeated fields without enumerating
that occurrence tree. It is authored syntax, not a newly checked AI proof.
The offline evaluator keeps the complete source DAG resident, with its existing
65,536 coefficient-cell and 524,288 decimal-digit bounds. Observed peaks in this
comparison are 33,001 cells and 54,128 digits. These units are not browser heap
measurements, a paged-count algorithm or an end-to-end massive-proof benchmark.

The Lean proofs establish the specified functions and cut relation. The finite
bridge does not prove the JavaScript implementation, decoder, source
authentication, typing preservation, semantic compression or human comprehension.
Existing native typing records, compiled packets and historical evidence remain
unchanged. The manual links this law from its existing cut rule; no new competing
reader or blog entry is introduced. The general research goal remains active.

## Reproduction

```sh
python3 research/proof-atlas/source-reference-laws/verify.py \
  --lean /absolute/path/to/lean-4.33.1/bin/lean \
  --workdir /absolute/path/to/fresh-workdir --check
node research/proof-atlas/source-reference-laws/check.cjs
node research/proof-atlas/free-index-multiplicity/check.cjs
node scripts/test-proof-atlas-manual.cjs
# After a production build, with Playwright/Chromium and axe-core available:
ATLAS_ORIGIN=http://127.0.0.1:8866 node scripts/test-proof-atlas-manual-browser.cjs
ATLAS_ORIGIN=http://127.0.0.1:8866 \
  node research/proof-atlas/source-reference-laws/check-browser.cjs /tmp/reference-law-figures
node research/proof-atlas/source-reference-laws/evidence.cjs --check
```

The native driver imports the existing source-cut definitions and fixture
utilities before this extension; it records all their hashes. Local native
execution enforces memory/time/output and free-space bounds. Raw logs and
resource samples remain outside the public evidence and blog. The final
[evidence bundle](evidence.json.gz) pins the two reproduction records, finite
comparison, manual/browser checks and exact source revisions. This research
branch is not merged or deployed. The browser record verifies the actual
production-built HTML. Static theorem records and technical notes are synced
to the local preview after the build; application runtime assets are not overlaid.
