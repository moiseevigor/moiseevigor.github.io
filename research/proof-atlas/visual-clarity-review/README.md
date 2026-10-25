# Visualization clarity review — 25 October 2026

Scope: the main visualization families in the current local site. This is a design and interaction audit, not a reader study or a scientific comprehension result. It does not assert that every declaration or every experiment has been visually inspected. Compiled data, native evidence and article mappings are not changed by this revision.

The reported failure was `published-15 / SBracket.exact_time / root.value / e11990`. Its body represents 2,243,405 expression occurrences. The old default displayed 800 unlabeled stored subterms. The edition dependency mode placed all 739 declarations and their links on a circle. Neither figure supplied readable ordered fields, a clear direction of use, or a tractable initial reading task. Data completeness did not make the display useful.

## Reading tasks and dispositions

| Family | Reading task | Finding and disposition |
| --- | --- | --- |
| Complete-library term view | Read the statement and follow a field | Replaced the default storage drawing with a two-level occurrence tree, at most 13 cards. Constructor labels, decoded fields, lexical binder links and exact folded counts are visible. No stored-node merging in this cut. |
| Complete-library dependency circle | Follow a direct named reference or find a user | Removed the whole-edition circle. Lists now separate **Uses** and **Used by**, page 12 entries, and mark external declarations. References in types and bodies do not establish necessary premises. |
| Stored expression graph | Diagnose storage sharing and connectivity | Kept as an explicit diagnostic. Its overall shape does not explain the argument. It still has weak readability at large scale; not recommended for ordinary reading. |
| Scoped constructor geometry | Inspect ordered ports, folds and lexical scope | Retained as a specialist option with an exact occurrence list. Canvas captions can be crowded; the default local tree provides a readable alternative. |
| Occurrence windows | Identify an occurrence and its lexical binder | Bounded labeled cards and explicit frontiers support this task. The control vocabulary and lack of statement context still impose effort. Kept specialist, not promoted as a proof summary. |
| Recorded type diagrams | Inspect a selected native type and context | Useful for a local typing question. Separate computed/source namespaces and unrecorded boundaries remain essential. Large nested types need local expansion; a whole type drawing is not a semantic summary. |
| Application / lambda / let rules | Compare a recorded input, binder or value with its result | Explicit premise/conclusion interfaces are more informative than constructor dots. Retained on selection; no inferred role for unrecorded inputs. |
| Conversions and substitution | Compare expected, inferred and computed terms | Useful for diagnosing one rule. Too detailed as an initial view. Native ownership and separate computed routes retained. |
| Cases, recursion and method interfaces | Locate branch inputs, recursive premises and results | Branch frames are useful locally. Whole strategies are not automatically recovered from recursor syntax. Retained as specialist inspections and controlled manual examples. |
| Context modules / source corridors / variable-use navigation | Cross a scope boundary or find an exact use | Meaningful only with the source route, binder and original context visible. No change to their extraction or evidence; no new comprehension claim. |
| Finite and paged application cuts | Trace a producer to an ordered consumer input | Small cuts retain useful types and source uses. Added arrowheads and `fn` / `arg N` labels directly on wires. The connection list remains the accessible complete description. Source-only cards without types are structurally informative but weak mathematical explanations. |
| Riccati argument diagram | Locate a reviewed AM–GM, product or sign step | Useful because formulas and reviewed steps provide context. It is a curated case study, not an automatic general abstraction. |
| Synchronized article / Lean / graph | Locate the reviewed proof step for a selected source part | Retained. The shared compiled panel now uses the local term reader. Unmapped passages must clear the old match; containment is still distinct from an exact step anchor. |
| Crossing microscope: named map | Follow a small named-reference network | Potentially useful at enlarged scale. Labels shrink/truncate in a narrow panel; still a limitation. It remains a focused reference application. |
| Crossing microscope: radial syntax / dependencies | Inspect full structural distribution | Diagnostic only. Not recommended as a mathematical explanation. Its existence is not evidence of useful comprehension. |
| Crossing microscope: mathematical idea | Read a human-authored argument outline | Useful editorial context when explicitly distinguished from extraction. No automatic semantic proof claim. |
| Constructor catalogue and manual scope controls | Learn one relation at a time | Small labeled controls are appropriate. Added a question-based guide to avoid making readers choose between technical implementation names. Authored examples remain distinguished from native observations. |
| Language grammar / universe diagrams | Check fields and syntax-layer boundaries | Suitable reference diagrams. A field schema does not supply a native typing judgment. Surface syntax and kernel syntax remain separate. |

## Changes to presentation

The statement precedes selected-term detail. Full decoded terms, corpus counts, provenance and specialist-reader choices use disclosures. Direct article and proof-step links remain visible in the selected-term reader. An explicit type-coverage statement remains available; missing evidence is not concealed or converted into an inferred judgment. Local term cards and declaration lists use the existing responsive, themed site controls. The article and compiled library share the same workspace.

No new semantic abstraction, Lean theorem, extraction coverage or storage scaling result is claimed. No blog entry is appropriate for this change. Remaining work should test whether readers can find an assumption, a result and a proof step with fewer navigation errors; that has not yet been measured.

## Validation

- `scripts/test-proof-atlas-local-reader.cjs`: all 2,098 declaration packets from the two project editions, every 4,164 root, and 14,080 representative interior cuts; packet hashes, exact cut accounting and 4,319 lexical binding checks. Four authored controls cover shared de Bruijn variables under different binders, let scope, application sharing and counts above JavaScript's exact-number range. This checks structure, not readability.
- `scripts/test-proof-atlas-visual-clarity-browser.cjs`: built-page statement/selection, child and binder navigation, direct-use navigation, both project editions, native Riccati rules, article synchronization, missing-component refusal/retry, desktop/mobile and both themes.
- Existing manual, proof-step, application-rule and network suites are rerun as current compatibility checks. Original evidence bundles and native artifacts remain historical; their old hashes of mutable presentation files are not claimed to match this revision.

Current outputs are recorded separately in this directory. Public deployment is not part of this local review.

## Branch navigation follow-up

The folded application path had a further dead end: it stopped at a shared result while hiding the general connection list. Its branch boundary now exposes a bounded, labeled page of consumer input positions. Consumer result summaries supply local reading context; the exact entry use remains inspectable after following it. The [rule and checks](../result-use-branches/README.md) distinguish shared source results from repeated stored nodes. This is a navigation change, not a measured improvement in comprehension.
