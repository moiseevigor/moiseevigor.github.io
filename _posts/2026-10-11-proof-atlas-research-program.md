---
layout: distill
title: "Proof Atlas: Compiled Proof Graphs and Article Coverage"
subtitle: >
  Complete compiled proof graphs from two Lean corpora, their shared structure, and the limits of correspondence with a mathematical article.
date: 2026-10-11 18:30:00 +0200
categories: [mathematics]
tags: [lean, formal-verification, proof-visualization, graphs, logic, mathematical-reasoning]
series: proof-atlas
series_title: "Proof Atlas"
series_part: 1
permalink: /mathematics/2026/10/11/proof-atlas-research-program/
published: true
last_modified_at: 2026-10-14
image: /public/img/posts/proof-atlas-1.svg
result: '739 + 1,359 declarations · 1,277,896 shared nodes'
comments: false
description: >
  Measured Lean expression structure, complete compiled declaration inventories, and an audited boundary between proof coverage and mathematical explanation.
---

<div class="l-body" markdown="1">

**Measured result · 12 October 2026.** Proof Atlas represents every owned declaration in two finite Lean corpora, including complete compiled theorem bodies and local dependency links. This establishes structural coverage of the extracted formal objects. It does not establish complete formalization of the accompanying article or automatic discovery of its mathematical argument.

[Read the article with synchronized proof views](/projects/proof-atlas/article/) · [Coverage and evidence](/projects/proof-atlas/coverage/)

Lean checks a proof term against a proposition. In a context of assumptions $\Gamma$,

$$\Gamma \vdash p : T$$

means that the term $p$ has type $T$. An exact structural representation must retain expression children, declaration references and variable binding. A drawing's layout is an additional choice, not a mathematical invariant of the proof.

## Complete compiled proof inventories

The extracted inventory includes every owned declaration in two separately identified snapshots:

| Extracted corpus | Modules | Declarations | Theorems | Available bodies | Shared expression nodes | Expanded occurrences |
|:--|--:|--:|--:|--:|--:|--:|
| Published snapshot | 15 | **739** | **561** | 715 | **549,509** | **49,693,046** |
| Working snapshot | 26 | **1,359** | **1,083** | 1,335 | **1,277,896** | **670,018,056** |

Both inventories include complete types, available bodies, eight recursor reduction rules and exact local declaration references. External library references remain named boundaries. The published and working snapshots are different corpora; their counts must not be combined as independent samples.

**Structural sharing.** The working corpus's 670,018,056 expanded occurrences are represented by 1,277,896 shared nodes. Sharing retains binder names, annotations and typed metadata. It does not identify proofs up to mathematical equivalence. A bound variable's meaning follows its root-to-node path: a shared node may occur under several different enclosing binders.

The private native check kernel-checked all extracted types, available bodies and reduction rules and compared inferred types. Public packet audits reproduce graph, scope, hash and inventory checks. Original source projects and tactic scripts remain private, so these public audits are not an independent project-source kernel rebuild. The [coverage report](/projects/proof-atlas/coverage/) links the exact inventories and checks.

<span id="the-crossing-benchmark"></span>

## A worked crossing proof

The first measured object is `CrossingData.crossing`, a counting lemma in the $\mathrm{SE}(2)$ formalization. Its exported type and proof contain:

| Measured quantity | Value |
|:--|--:|
| Expression occurrences | **7,288** |
| Structural child edges | **7,286** |
| Bound-variable-to-binder links | **431** |
| Constant-use occurrences | **2,892** |
| Distinct directly referenced declarations | **42** |
| Maximum expression depth | **49** |

The type has 203 occurrences and the proof 7,085. The complete term payloads retain declaration names and occurrence paths. For example, [occurrence 1852](/projects/proof-atlas/app/#expr-1852) has 105 occurrences and decodes to `C.branch σ p = ψ + (2 : Real) * C.K * (↑n : Real)`. It is an equality proposition; selecting it does not itself supply a proof of that equality.

A declaration reference reveals its supporting argument only when that declaration’s body is included. Repeated syntax is not by itself mathematical redundancy or proof equivalence.

## What the article correspondence establishes

The [web article](/projects/proof-atlas/article/?view=lean) preserves the published mathematical manuscript. Its Lean comparison audits **all nine numbered statements**, using 49 declaration headers and 107 original statement lines:

| Article coverage | Audited result |
|:--|:--|
| Numbered statements | **Five partial, conditional counterparts; four unformalized** |
| Proof blocks | **Five of six link to complete supporting compiled proofs** |
| Floquet proof | **Unformalized in the published snapshot** |

Complete declaration coverage is not complete article formalization. The checked scalar counting clauses retain finite-tangency assumptions (`hfin`, `hL/hR`). They do not establish all the article's claims about first-root continuity and extrema, quartic zero order, Floquet asymptotics, late folds or separatrix limits. The [statement-by-statement review](/research/proof-atlas/article-coverage-review.md) records the exact boundaries.

Article links are curated correspondences with source hashes, labels and expression paths. Several expressions can inherit the same enclosing passage; a small kernel node need not have an individual article sentence. The links record provenance. They do not certify equivalence between prose and Lean.

## Structure does not yet explain the proof

For the crossing lemma, `exists_branch` and `unique_branch` expose the mathematical mechanism:

$$
\underbrace{\text{continuity + endpoint coverage}}_{\text{existence}}
\quad + \quad
\underbrace{\text{monotonicity + endpoint identification}}_{\text{uniqueness}}
\quad\Longrightarrow\quad
\text{exactly one crossing}.
$$

Intermediate-value reasoning supplies existence. Strict branch monotonicity and identification of glued endpoints supply uniqueness. A degree-one winding argument alone would not prove injectivity. The compiled library contains both supporting proofs, but this concept map is still a human interpretation anchored to them.

**Not established:** that graph clusters isolate mathematical ideas, that repeated subtrees admit certified semantic compression, or that the diagrams improve reader comprehension. No reader-comparison result or automatic explanation result is reported.

The kernel and source language also remain distinct. The pinned Lean 4.33.1 reference covers all **12 `Expr`**, **6 `Level`** and **4 `Syntax`** constructors. Surface terms, tactics, commands, macros and elaborator structures are curated families, not an exhaustive inventory of Lean extensions. A final compiled term does not recover the original tactic script or source-to-term trace. The [language reference](/projects/proof-atlas/grammar/) and [methodology record](https://github.com/moiseevigor/moiseevigor.github.io/tree/master/research/proof-atlas) document that scope.

## References and nearby work

- [Lean 4: Expressions](https://lean-lang.org/doc/api/Lean/Expr.html) and [Theorem Proving in Lean](https://lean-lang.org/theorem_proving_in_lean4/Propositions-and-Proofs/) — the underlying term language and proof typing.
- [Paperproof](https://github.com/Paper-Proof/paperproof) — visualizing Lean goals, contexts and proof development.
- [Independent ProofAtlas](https://proof-atlas.vercel.app/) — Lean-based proof hypergraphs and structural metrics; a separate project with a closely related name and research questions.
- [Lean Atlas](https://github.com/NyxFoundation/lean-atlas) — declaration dependency exploration.
- [Peter Selinger, *A Survey of Graphical Languages for Monoidal Categories*](https://arxiv.org/abs/0908.3347) — formal compositional diagram syntax.
- [Proof-net research](https://arxiv.org/abs/1802.03224) — removing sequential bureaucracy in particular logical systems, not all dependent type theory.
- [The interactive benchmark](/projects/proof-atlas/) — the current measured structural visualization and its public-data limitations.

</div>
