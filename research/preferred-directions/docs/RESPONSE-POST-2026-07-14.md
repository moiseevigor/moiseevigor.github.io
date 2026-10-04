# Response to the post-response incremental review (REVIEW-SR-ASTROPHYSICS-POST-RESPONSE-2026-07-14)

Disposition of the seven minimum-action items and every per-file finding. The review's
framing is accepted in full: the previous response over-claimed blog/article
synchronisation, the degree check was over-interpreted, "truncation noise" was a
diagnosis the data does not support, the ensemble mixed acceptance sets, and the guard
is syntactic. All are addressed below; the two structural upgrades (paired ensemble,
proof certificate) go beyond wording.

## Minimum action list

| # | Item | Disposition |
|---|---|---|
| 1 | Part 3 metadata, delay/parity/glossary + cross-post universal-inversion copies | **Done.** Subtitle, description and callout scope $\delta=-\varepsilon^2$ to the exponential profile with the general $1-\tfrac34\beta$ calibration; the displayed inversion now carries $\lvert 1-\tfrac34\beta\rvert^{-1/2}$ in the sentence itself; delay claim conditioned on $1-\tfrac34\beta>0$ with the $\beta>\tfrac43$ acceleration flip; parity scoped (all orders exponential, first order general, higher odd orders open O6); glossary: $\varepsilon$ demoted from "the only knob", $\beta$ and higher jets added. Cross-post copies fixed in Part 1 (×2), Part 4 (×2), Part 5 (division-of-labour row), Part 7 (§ opening), README (×3), PROGRAM.md (found by the new guard rule, not by the review). |
| 2 | Part 4 reconnection + closing-post metadata | **Done.** Subtitle: "candidate site for reconnection", "the fourth of eight"; description: "directional-reach estimator … tangent-cone consistency check"; the closing sections point at Parts 5–8 and label the four-part arc as the original roadmap. |
| 3 | Part 6 force-free narrowing + period-vs-caustic separation | **Done.** "No smooth force-free extrapolation with bounded $\alpha$ can host a spiral null (non-force-free and data-driven MHD extrapolations are not covered)"; scoreboard row separates the exact period-average law from the numerically-agreeing-but-open caustic reading; the T96 constellation caption now **leads** with "continuation-only structure, outside T96's own validity domain" (house figure rules put status in the caption, not as an in-figure overlay). |
| 4 | Jupiter degree/truncation/range/robustness sentences | **Done.** Degree: "numerically consistent with zero ($-0.000$, $-0.000$, $-0.005$)… no unexplained **net topological charge** above 0.885; index-cancelling missed pairs are not excluded (fold pairs are exactly such)"; "convergence evidence", with Haynes–Parnell trilinear named as the stronger comparator (G1); "truncation noise dominates" → "truncation-sensitive, poorly constrained continuation region — cause not diagnosed"; position range now conditioned on the 32 nominal survivors ($r$ 0.86–0.93) with the 36/40 raw-recapture set stated separately; "robust one" → "more persistent under this chosen stress ensemble". Part 8 + J1 doc + both scripts. |
| 5 | Placeholder links + old four-part navigation | **Done.** All four `](#)` links resolved to real permalinks (Part 1 → D2 ×2; Part 2 → D4, Part 3); Part 1's series list labelled as the original roadmap with Parts 5–8 named; served HTML verified free of bare-`#` anchors. |
| 6 | Prop 4.2 small-time coefficient + certificate | **Done.** The proof now displays $J(t;0) = \tfrac1{12}t^4(1+O(t))$ with the coefficient **symbolically computed and $\theta_0$-independent** (uniformly nonzero); an *Exactness boundary and certificate* paragraph states exactly which identities are exact symbolic and which numbers are verification-only; `run_o6_caustic_c2.py` now writes `artifacts/o6_certificate.json` ($\tau_1$, $\tau_2$ in full, $\langle\tau_2\rangle$, $J_0(2\pi)$, $J_0'(2\pi)$, small-time series, quadrature table). §0 gains a fourth label — **Computer-assisted** — and Proposition 4.2 is retitled and re-leddered under it; the closing ledger sentence now says "period reduction and its period-average consequences are proved" instead of "everything downstream is mathematics". |
| 7 | Reproducible build evidence | **Done (as evidence, not CI).** `artifacts/site_build_verification.txt`: container identity, Jekyll version, HTTP 200 for the article + all eight posts, served-HTML content checks for every item in this review (all pass), live-DOM KaTeX counts (article 597/0 errors; Part 8 123/0). The reviewer's checkout lacking a Jekyll executable is an environment gap this log bridges; a CI build remains the right long-term fix and is noted as such. |

## Other required article edits

- Front-matter description: linear 3/2 qualified as the **period-average** coefficient (caustic 7/4). **Done.**
- "If the measured law extrapolates" → the $\beta = \tfrac43$ caustic-blind jet is a consequence of Prop 4.2, untested in the full numerical caustic pipeline. **Done** (and the pipeline test is queued as the natural next V-run).
- "Unique exponential profile class" → the local jet condition $L''(0)=0$ at the launch point, with global exponential form only if it holds along the interval. **Done.**
- BBF citation → Trans. Amer. Math. Soc., accepted 2026, with the cvgmt record linked (×2 sites). **Done.**

## Findings accepted with structural fixes beyond wording

- **Paired stress ensemble.** The amplitude legs now reuse the *same* 40 standardized
  coefficient draws scaled ×½/×1/×2 (the ×1 leg reproduces the original 32/40 exactly),
  so amplitude sensitivity is isolated from finite-ensemble variation: polar 35/32/29,
  low-lat 17/15/14 and 28/19/15 of 40. The JRM33 resolution-matrix diagonals are
  recorded in the J1 doc as the next constraint-weighting upgrade; the "stress proxy,
  not posterior" label stays.
- **Guard v3, honestly scoped.** The docstring now states the tool is a *syntactic
  regression phrase/context check*, not a semantic invariant checker, and that release
  also requires the manual claim-ledger pass. New rules per the review: near-context
  requirements on every "…delays refocusing" and "invertib…" occurrence, bans on the
  force-free overclaim, "truncation noise dominates", "identically 0", "no null with
  net index was missed", "completeness evidence", "is the robust one", "closing
  post/part", the iff-thesis, and "the only knob"; ten new fixtures = this review's
  caught sentences. First run of v3 caught two live instances in PROGRAM.md that the
  review itself had not listed. 39 banned / 3 require / 4 near / 2 positive / 25 fixtures, clean.

## Positions taken (not silently)

- **Q cell for the third root:** now "6 (tangent-cone; raw $w_4$ not measured)" per the
  review's suggested split.
- **Figure-overlay status text:** the review asked for "continuation-only" in the T96
  figure titles/overlays; house figure rules forbid in-figure titles, so the status
  leads the caption in bold instead. Same information, different surface.
- **β = 4/3 pipeline test and JRM33 resolution weighting:** acknowledged as the right
  next experiments; queued, not run in this pass (the review required wording, not the runs).
- **Proof-status:** Prop 4.2 is labelled computer-assisted everywhere; the O6
  human-readable proof stays open and is the article's stated boundary for a
  conventional journal submission, alongside the dedicated literature review the
  review recommends.
