# Published-manuscript Lean coverage review — 12 October 2026

The website previously indexed only the crossing principle. This omitted existing
Lean counterparts of **Theorem 3.4** and **Theorem 4.1** and left the remaining
numbered statements visually ambiguous. The comparison view now audits every
numbered statement and displays its checked counterparts, explicit assumptions,
and clauses outside Lean.

| Article statement | Audited status | Checked counterparts and limits |
|:--|:--|:--|
| Lemma 3.1, identities | Partial, conditional | Coefficient collapse, quotient/Γ derivatives, zero/sign results and α₁ monotonicity/uniqueness. Simplicity of α₁'s zero and the unique numerical critical modulus are outside this snapshot. |
| Lemma 3.2, Riccati slope bound | Partial, conditional | Riccati pair, z derivative, T₁T₂, common signs, AM–GM slope inequality and oriented lift bound. The displayed exact square-gap identity/equality characterization has no matching exported declaration in this audit. |
| Lemma 3.3, crossing | Partial, conditional | The existing crossing graph proves the count under CrossingData continuity, endpoint and strict-monotonicity fields. Zero orders and tangency finiteness are not established by that theorem. |
| Theorem 3.4, first conjugate time | Partial, conditional | `JacobiFull.exact_first_time`, `first_time_complete`, `J2_pos_before_p0`. The counting results require finite tangencies (`hfin`). Continuity/extrema of p* and the geometric/time interpretation are outside these scalar counting declarations. |
| Theorem 4.1, every cell | Partial, conditional | One root on each bracket, cell exhaustion, two roots for K ≠ 2E, contact iff K = 2E, necessary coincidence location, even-period phase and cumulative count. Finite tangencies (`hL/hR`) are explicit parameters; Lean m is article n − 1. Zero orders and identification of a unique k₀ are outside Lean. |
| Remark 4.2, coincident order | Not formalized | The quartic expansion and exact zero order four are not certified by the cell-counting theorems. |
| Theorem 5.1, Floquet and asymptotics | Not formalized | Both parts are excluded from the snapshot's formalization scope by Appendix A. |
| Remark 5.2, late folds | Not formalized | A companion-manuscript claim; no corresponding proof in these fifteen modules. |
| Remark 5.3, separatrix limits | Not formalized | The limits and their rate are outside the published Lean scope. |

**No complete article statement is labelled fully formalized by this interface.**
Partial means checked counterparts for the specified clauses, with their actual
premises. It does not mean the whole article theorem or its prose is certified.
The article itself already states the finite-tangency premise and the principal
exclusions in Appendix A; this update makes them visible beside the relevant
statements. No mathematical statement in the published PDF or TeX was changed.

## Evidence and provenance

- Article snapshot: 7 October 2026, source SHA-256
  `043746bc7127bdc0f6cb7a62d3143ffc1827e7bfcfa51fe18c045683ec7ab512`.
- Research revision: `5c304fd9957eafc781969703b4bcc75abe0c0201`, the revision recorded
  with the published manuscript. Newer, uncommitted research was not mixed into this
  edition.
- Fifteen modules rebuilt from this exact Git revision in an isolated directory.
  Compiler: Lean 4.33.1; Mathlib revision
  `0df444a360eaa60ab8c11dca51a86af692955474`.
- Thirty-nine additional declarations passed fresh `#check` and `#print axioms`.
  Their only axiom dependencies are subsets of `propext`, `Classical.choice`, and
  `Quot.sound`. Mathematical structure fields and ordinary theorem parameters
  remain hypotheses even though they are not additional global axioms.
- `JacobiCore.toJacobiFull` was checked too: it derives the 31-field structure from
  thirteen Jacobi-data hypotheses. This does not remove finite-tangency parameters
  of the final counting theorems or construct the assumed functions from scratch.
- The comparison publishes 49 statement headers / 107 source lines: the original
  ten crossing declarations and 39 additional checked declarations. Header text,
  original line numbers, module hashes and excerpt hashes are retained. No private
  theorem proof bodies are newly published.
- All nine statement targets, numbers and source excerpts were checked independently.
  The 916 mathematical expressions, 21 numbered equations, four figures, three
  tables and twelve references in the web conversion remain intact.

The [coverage audit](article-coverage-audit.json) records every statement, its
clause assessment, headers, checked types, hypotheses and source hashes. The
[Lean check log](article-coverage-lean-check.log) is the actual compiler output.
The [coverage map](article-coverage-map.json) is the reviewed editorial input.
The public data are audit records, not a standalone formal proof certificate or a
kernel certification of article-to-Lean equivalence.

## Interface checks

The browser regression visits every statement, checks that Theorems 3.4 and 4.1
have the proper counterparts and visible finite-tangency hypotheses, opens an
additional declaration and a Greek-named declaration's actual source fragment,
and checks that the four unformalized statements receive no invented proof links.
The existing graph links remain operational. Only the crossing expression graph
has been released; connections for other declarations open their checked source
headers, not nonexistent crossing nodes.

Default reading stays centered. Comparison mode preserves formulas, source targets,
keyboard focus and reading position, works at phone/tablet/desktop widths, and
passes scoped light/dark WCAG A/AA checks. Stale article/coverage data are rejected.
These checks concern presentation and correspondence; they do not reprove all
analytic arguments in the manuscript or establish every article sentence in Lean.

## Reproduction

With access to the research repository and its matching cached dependencies:

```sh
python3 research/proof-atlas/verify_article_lean_snapshot.py \
  --repository /path/to/se2-conjugate-locus \
  --lean /path/to/Lean-4.33.1/bin/lean \
  --output /tmp/proof-atlas-coverage-snapshot
python3 research/proof-atlas/build_article_coverage.py \
  --repository /path/to/se2-conjugate-locus \
  --snapshot /tmp/proof-atlas-coverage-snapshot
python3 research/proof-atlas/verify_article_coverage.py
python3 research/proof-atlas/verify_distill_article.py
# After building and serving the actual website:
node scripts/test-proof-atlas-article-columns.cjs
node scripts/test-proof-atlas-coverage.cjs
```

The public CI checks audit integrity and presentation. It cannot rebuild private
proof bodies without access to the private research repository; the new fresh
kernel replay was performed locally against the pinned snapshot.
