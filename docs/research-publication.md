# Research presentation and publication

The site uses Jekyll, Liquid templates and its existing vanilla CSS/JavaScript. Keep changes incremental. Mathematical articles, compiled data and their provenance are independent of navigation and presentation.

The primary Proof Atlas objective is the [general geometric language research program](proof-atlas-research-program.md). The article reader is an application and testbed; its release milestones do not replace or complete the program goal.

## Navigation

- Home introduces the author and lists recent articles, with equations or measured results on their cards.
- Lab (`/lab/`) presents research series with their question, main result and explicit confirmed, refuted, partial or pending findings. `_data/series.yml` owns topics and their outputs; `_data/research.yml` supplies supported findings.
- Projects (`/projects/`) separates interactive scientific explainers from software libraries. Articles (`/articles/`) provides the article index.
- Manuscripts and background remain reachable from Lab and each topic. Historical URLs remain valid.

Proof Atlas has one overview, a [visual notation manual](/projects/proof-atlas/manual/), a general research program and a scoped geometry prototype in the compiled library. Its article application has a synchronized reader at `/projects/proof-atlas/article/`. Human-readable article text is the default. Optional side views share a path-qualified compiled graph/Lean selection. Indexed crossing expressions, source-bound proof steps for Lemmas 3.1–3.3 and Theorems 3.4/4.1, declaration counterparts and supporting-module context are distinct relations; an unindexed passage clears the previous match. The separate crossing microscope and complete compiled library remain available under Reference & evidence, including their historical URLs. Language reference and coverage are supporting material; the compact constructor catalogue retains its optional illustrative scale diagrams. The overview does not duplicate the working graph or language explorer. Old shared occurrence/declaration URLs on the overview resolve to the microscope.

## Editorial rule

Use dry, factual prose consistent with the older authored technical articles: observed problem, concrete result, assumptions and evidence. Avoid promotional headings, rhetorical verdicts and repeated declarations of honesty. Publish stable, significant scientific conclusions with their evidence and assumptions. Lead with supported positive results. Preserve counterexamples, failed hypotheses and withdrawn interpretations when they change the conclusion. Label published theory, author manuscript claims, numerical measurements and structural representation results distinctly.

A repaired parser, successful download, software smoke check or completed execution unit is not a new scientific result. Do not put disk/RAM accounting, execution timings, worker/approval histories, routine UI updates, speculative roadmaps or serial checkpoints into research posts. Keep those in linked reproduction records when needed. Replace a transient readout with the final qualified conclusion; preserve the original evidence through links and repository history.

Emphasis on positive findings does not justify promoting partial formalization to full proof, synthetic data to physical observation, positional association to membership, or a failed data-quality gate to physical absence. Unmeasured claims are limitations, not measured negative results.

## Validation

Build the actual production site. Check internal URLs and anchors, active navigation, desktop/mobile reading, both themes and keyboard access. Exercise the graph, library, article correspondence and references after shared navigation changes. Preserve source/data hashes and mathematical article content; run the existing artifact checkers. Application fragments such as `#expr-1852` require browser checks.

## Proof-step correspondence

`research/proof-atlas/proof-step-map.json` is the reviewed input. Each excerpt retains literal manuscript text, source lines, declared scope and an explicit unformalized status where needed. `build_proof_steps.cjs` binds compiled paths to immutable packets; it uses full application spines and declaration telescope arities for named proof calls and recorded paths for reviewed witness/uniqueness branches. It prunes shared graphs before enumerating indexed occurrence paths. `article-proof-steps.js` contains only public article excerpts and compiled-term metadata.

`build_distill_article.py` adds these anchors without changing mathematical content and preserves the reading tools through their shared include. The browser distinguishes a selected anchor from a descendant within its indexed proof step. For a reused helper, show the relevant article uses explicitly. This index does not certify prose equivalence or formalize the excluded analytic clauses. Do not replace checksum/path checks with declaration-name or module-name heuristics. The focused Riccati geometry draws only checked completed-call edges; do not insert mathematical flow arrows where a direct compiled call is absent.
