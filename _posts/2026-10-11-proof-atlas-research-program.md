---
layout: distill
title: "Proof Atlas: The Geometry of a Formal Proof"
subtitle: >
  Can an entire Lean proof be read as a geometric object? An interactive
  first experiment, a carefully separated syntax graph and mathematical argument,
  and a research program for navigating formal proofs at different scales.
date: 2026-10-11 18:30:00 +0200
categories: [mathematics]
tags: [lean, formal-verification, proof-visualization, graphs, logic, mathematical-reasoning]
series: proof-atlas
series_title: "Proof Atlas"
series_part: 1
permalink: /mathematics/2026/10/11/proof-atlas-research-program/
published: true
last_modified_at: 2026-10-12
image: /public/img/posts/proof-atlas-1.svg
comments: false
description: >
  An introduction to the geometry of formal proofs, with a measured 7,288-node
  Lean expression graph, an interactive public demonstration, and a research
  agenda for certified multiscale visual explanations.
---

<div class="l-body" markdown="1">

<div style="border-left:3px solid #288881;padding:.2em 1em;margin:1.2em 0 2em;background:var(--fig-bg);"><strong>Research status · 11 October 2026.</strong> A prototype extracts and visualizes the exact <em>structure</em> of one elaborated Lean proof. The public interactive data remove proof-term payloads and most names. A human-authored explanation of the theorem exists, but automatic discovery of its core mathematical idea is not established. This is an initial instrument and benchmark, not a general graphical proof language.</div>

<p><a href="/projects/proof-atlas/" style="display:inline-block;padding:11px 18px;background:#205c62;color:white;text-decoration:none;border-radius:3px;font-family:var(--sans);font-weight:700;">Explore the interactive proof graph →</a></p>

Imagine a hundred-page mathematical argument. At ordinary reading scale it is a succession of definitions, estimates, lemmas and proofs. From a distance we may instead see a single structure: long chains of implications, shared pillars, branches that rejoin, bottlenecks, and regions whose internal reasoning repeats. **Does a formal proof have a meaningful geometry, and can that geometry help us understand its mathematical idea?**

Lean provides an unusually good starting point because its kernel checks a proof as an expression with a type. It does not accept a diagram merely because the diagram is persuasive. Formally, in a context of assumptions and declared objects $\Gamma$, the assertion

$$\Gamma \vdash p : T$$

means that $p$ is a proof term whose type is the proposition $T$. Lean expressions are constructed from applications, binders, constants and other precisely defined constructors. See the [Lean expression reference](https://lean-lang.org/doc/api/Lean/Expr.html) and [Theorem Proving in Lean 4](https://lean-lang.org/theorem_proving_in_lean4/Propositions-and-Proofs/).

The experiment is to begin with that checked object, recover its connections, and then ask what is lost or gained as we choose increasingly abstract representations.

## Two geometries—and why they must not be confused

A **structural graph** represents the syntax and references of the formal object. In our initial benchmark a node is an occurrence of a Lean expression, a structural edge joins it to a subexpression, and additional links point a bound variable to its binder or a constant occurrence to its declaration.

A **mathematical explanation** is a different object. It may say that continuity establishes existence, monotonicity establishes uniqueness, and the combination yields exactly one crossing. Those statements reveal mathematical *meaning*, not merely the nesting of applications and binders.

There is no reason for the most central syntactic node to be the most important idea. The type `Real` can occur hundreds of times even though a theorem's essential insight may be a single interval-covering argument.

The project therefore treats the proof as one exact object with several distinct views:

| Scale | Visible structure | What it can legitimately tell us |
|:--|:--|:--|
| Exact syntax | Expressions, binders, constructors | How the checked term is assembled |
| Dependency graph | Named declarations and their uses | Which results and objects the theorem references |
| Recursive modules | Expandable subarguments with typed boundaries | How pieces of the proof compose, if the boundaries are preserved |
| Explanation | Existence, uniqueness, contradiction, induction, geometry | A mathematical interpretation, which must retain provenance to be trustworthy |

These views need not all be generated automatically. In the present prototype the first two follow from measured exports; the explanatory grouping is explicitly authored and labeled.

## A finite visual grammar for Lean's kernel expressions

The first part of the visualization language is now explicit rather than implicit in dot colors. The CoreGIR exporter handles all **twelve constructors of `Lean.Expr`**: `bvar`, `fvar`, `mvar`, `sort`, `const`, `app`, `lam`, `forallE`, `letE`, `lit`, `mdata`, and `proj`. Each has a distinct type of input or scope boundary. Six occur in the exported crossing certificate; all twelve must be representable for a general compiler.

**[Open the illustrated twelve-rule grammar](/projects/proof-atlas/language/)** — every rule has a vector diagram, a Lean example, and a warning about what the picture cannot establish.

The distinction between constructors is structural: `app` takes a function and an argument; `lam` binds a variable to construct a function; `forallE` constructs a dependent function type and also represents universal quantification and implication; `bvar` points back to a specific enclosing binder; `const` refers to a named environment declaration. A theorem need not be a single special kind of syntax node: its checked proof is built from these operations.

One example shows why this matters. The Lean source

```lean
theorem identity (P : Prop) : P → P := by
  intro h
  exact h
```

can be understood, after elaboration, as a function taking a proposition `P` and a proof `h : P`, then returning that same proof. Schematically the proof term has nested lambda binders with a bound-variable reference in its body. The proposition to be proved has the corresponding dependent-function structure. **The lines connecting variable occurrences to binders are part of the logic, not decorative edges.**

A second boundary matters just as much. **Tactics, macros, notations, and declarations are not additional `Lean.Expr` constructors.** They belong to the Lean surface language, elaboration process, or declaration environment. Twelve rules cover the *core expression algebra* but do not yet amount to a complete graphical language for every Lean source program. The exporter presently omits metadata payloads, so even its comprehensive constructor coverage must not be confused with lossless reconstruction of all source text or elaborator state.

The next test is whether typed visual composition can preserve these boundaries under collapsing and expansion, and whether it helps readers recognize actual mathematical inference patterns.

## Why borrow from Feynman diagrams?

The useful analogy is **local graphical composition**. In a Feynman diagram, permitted lines and vertices have mathematical meanings and composition rules. The diagram is not, in general, a drawing of a particle's most probable actual path; individual diagrams represent contributions to perturbative calculations. We want to borrow the discipline of a small visual grammar, not the probability interpretation.

A mathematical proof may likewise be represented through ports (inputs and outputs), wires (uses or dependencies), interaction nodes (inferences and constructions), and enclosures (assumptions or subproof scopes). Expanding a box reveals its internal argument. Collapsing it retains an honest typed contract.

This is also related to [string diagrams](https://arxiv.org/abs/0908.3347) and [proof nets](https://arxiv.org/abs/1802.03224). These traditions motivate compositional graphical reasoning but do not provide a universal semantics for all Lean proofs out of the box. There are also existing Lean-specific structural viewers: [Lean Atlas](https://github.com/NyxFoundation/lean-atlas) and an **independent, similarly named [ProofAtlas](https://proof-atlas.vercel.app/)** that studies Lean expression hypergraphs and verified structural measurements. This project is not affiliated with that one; merely drawing a Lean graph is not a novelty claim. Our open question is whether exact graphs can support faithful, recursively expandable *mathematical explanations*.

## The recursive tree is a way of reading a graph

A tree is a natural navigational instrument: a theorem has branches, each branch has its own supporting arguments, and a small lemma can itself become a new tree when opened.

Yet the actual dependencies need not form a simple tree. A lemma may be reused in several places; several independent premises may be needed jointly; bound variables refer to an enclosing scope; a proof by cases joins arguments made under different hypotheses. Forcing all these into a tree either duplicates information or silently removes it.

Our working model is therefore:

**A typed dependency graph, organized into a recursive tree of explanatory modules.**

Each module has a boundary: the assumptions and inputs it receives, the conclusion or construction it provides, and an underlying reference to exact formal evidence. A collapsed node is allowed to hide its interior. It is not allowed to delete necessary premises.

A proof by contradiction illustrates this boundary requirement. To establish $\neg A$, we introduce an assumption $A$ inside a scoped enclosure, derive `False` within that scope, and discharge the assumption. If we instead want to infer $A$ from $\neg\neg A$, we need an additional principle such as classical double-negation elimination (or a suitable decidability hypothesis). The graphical junction must show this change of scope, not depict an unexplained collision between two lines.

Induction has a different appearance: a finite box contains a base case, a step, and the legitimate recursor. An apparent loop in the drawing must never be mistaken for circular reasoning.

## The first measured experiment

The benchmark is `CrossingData.crossing`, a counting lemma in a Lean formalization associated with a sub-Riemannian problem on $\mathrm{SE}(2)$. The underlying mathematical claim concerns a phase line intersecting a two-branch zero curve exactly once on an appropriate interval.

The existing exporter processed the elaborated **theorem statement and proof term**. The resulting CoreGIR expression-occurrence structure was transformed into a graph with explicit binder and declaration references. Seven local integrity tests passed, and a GitHub Actions run regenerated the export and viewer from Lean.

| Directly measured quantity | Value |
|:--|--:|
| Expression occurrences (type and value combined) | **7,288** |
| Structural child edges | **7,286** |
| Bound-variable-to-binder reference links | **431** |
| Constant-use occurrences | **2,892** |
| Distinct directly referenced constants | **42** |
| Maximum expression depth (edges) | **49** |

We also computed **665 distinct structural subtree fingerprints** across the 7,288 occurrences. This is a preliminary *syntactic* statistic, based on constructor, payload and ordered child fingerprints. It does **not** show that 91% of the mathematical argument is redundant, that the associated proofs are equivalent, or that repeated subtrees may be identified across different binder contexts.

The public [interactive atlas](/projects/proof-atlas/) offers whole-proof geometry, a declaration-use constellation, recursive zoom and an editorial explanation. It ships only the anonymized structural projection: not the private Lean certificate text.

## The mathematical idea we want the compiler to find

For this theorem, the source exposes two named lemmas, `exists_branch` and `unique_branch`. Together they support the final exactly-one result:

$$
\underbrace{\text{continuity + endpoint coverage}}_{\text{existence}}
\quad + \quad
\underbrace{\text{monotonicity + endpoint identification}}_{\text{uniqueness}}
\quad\Longrightarrow\quad
\text{exactly one crossing}.
$$

The existence result uses intermediate-value reasoning over phase intervals. The uniqueness result uses strict monotonicity within branches and the fact that apparent double descriptions at glued endpoints represent the same parameter. The proof is not justified by a winding-number slogan alone: a degree-one map need not be one-to-one.

**For now, the diagram of this idea is an interpretation anchored to named formal results.** The initial export references those two lemmas but does not contain their full internal proofs. Automatically recovering the concept map from transitive formal dependencies is the next challenge.

## Research questions and failure criteria

We will measure progress against three questions—not declare them solved in advance.

**H1 · Global structure.** Is there stable, nontrivial organization in a full proof graph that survives reasonable choices of graph projection and layout? The claim fails if all apparent clusters are arbitrary layout effects or elaboration noise.

**H2 · Faithful compression.** Can a compiler collapse repeated or low-level proof structure into usable modules while preserving a typed interface and a complete path back to Lean? The claim fails if compression hides an indispensable assumption, introduces an unsupported inference, or breaks provenance.

**H3 · Mathematical understanding.** Does the multiscale explanation help a reader identify why a theorem is true more reliably than browsing the raw proof term? We need actual reader tasks and comparisons; appealing diagrams alone are not evidence.

The experimental sequence is: complete the transitive local dependency graph, build well-scoped recursive modules, test direct reasoning / contradiction / induction, then evaluate whether readers can locate the core mechanism of the SE(2) crossing argument.

## Current verdict

**Established:** a real Lean proof can be converted into a complete expression-occurrence graph, audited numerically, and explored interactively in the browser. The first sample contains 7,288 nodes and connects syntax with direct declaration references.

**Not established:** that the graph geometry identifies the important mathematical ideas; that structural repetition is proof redundancy; that arbitrary Lean terms have concise, automatically discovered graphical explanations; or that such explanations measurably improve comprehension.

The distinction is the research program. We are trying to move from a correct *map of a formal object* toward a correct and illuminating *map of its reasoning*.

## 12 October 2026: a reference for Lean’s language layers

The [visual language reference](/projects/proof-atlas/grammar/) now separates eight layers instead of treating every visible feature as an expression constructor. Its **74 entries** cover all **12 `Expr`**, **6 `Level`** and **4 `Syntax`** constructors in **Lean 4.33.1**, together with 16 surface-term families, 11 tactic families, 13 command families, six macro/notation families and six selected elaborator structures.

The finite constructor inventories are exhaustive for the pinned version. The other inventories are curated: Lean and its libraries can register additional parsers, notation, commands and tactics. Each entry includes a tiny example, a diagram, an explanation of the links and a source reference. Constructor fields are checked against Lean’s definitions; family diagrams are explicitly authored processing summaries, not recovered tactic traces or certified translations.

This distinction changes how we read the pictures. A `Level` child is not an `Expr` child. A `Syntax.ident` may resolve to a local variable or a constant. A tactic changes goals and constructs a term, while a command can change the environment without producing a proof expression. Source-to-term correspondence requires retained source spans and elaboration information; the final expression alone does not recover the original proof script.

Validation checks 40 complete source examples with Lean 4.33.1 and ten small closed terms with the kernel, including a negative control that rejects an invalid projection. Chromium exercises all 74 reference entries, search, deep links, keyboard selection, field highlighting and responsive layouts. The reference has no detected WCAG A/AA violations in the scoped automated light/dark audit; this is not a claim of complete accessibility certification. The original expression-graph interaction regression and independent topology audit also pass.

The contrast failure in the first interface exposed a testing gap: tests served raw page files without Jekyll’s shared styles. The browser workflow now builds and serves the actual site. The code panel’s measured foreground/background contrast is **11.02:1**. Reproducible commands, scope and remaining gaps are recorded in the [public research record](https://github.com/moiseevigor/moiseevigor.github.io/tree/master/research/proof-atlas).

This is a reference and interface milestone. It does not establish automatic mathematical explanations, universal semantic compression, or graphical proof construction. The released crossing graph and its provenance data retain their existing scope.

## References and nearby work

- [Lean 4: Expressions](https://lean-lang.org/doc/api/Lean/Expr.html) and [Theorem Proving in Lean](https://lean-lang.org/theorem_proving_in_lean4/Propositions-and-Proofs/) — the underlying term language and proof typing.
- [Paperproof](https://github.com/Paper-Proof/paperproof) — visualizing Lean goals, contexts and proof development.
- [Independent ProofAtlas](https://proof-atlas.vercel.app/) — Lean-based proof hypergraphs and structural metrics; a separate project with a closely related name and research questions.
- [Lean Atlas](https://github.com/NyxFoundation/lean-atlas) — declaration dependency exploration.
- [Peter Selinger, *A Survey of Graphical Languages for Monoidal Categories*](https://arxiv.org/abs/0908.3347) — formal compositional diagram syntax.
- [Proof-net research](https://arxiv.org/abs/1802.03224) — removing sequential bureaucracy in particular logical systems, not all dependent type theory.
- [The interactive benchmark](/projects/proof-atlas/) — the current measured structural visualization and its public-data limitations.

</div>
