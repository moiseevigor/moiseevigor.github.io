# Response to the post-final re-review (REVIEW-SR-ASTROPHYSICS-POST-FINAL-REREVIEW-2026-07-15)

All six checklist items executed. No mathematical content changed — this round is
proof-writing rigor (item 1), claim-boundary propagation (items 2–4), and release
hygiene (items 5–6).

## Item 1 — "analytic flow" → finite-order Taylor/Hadamard argument: DONE

- **Proposition 4.2's hypothesis** now states the regularity explicitly: "$L$
  sufficiently smooth near the launch point ($C^6$ suffices — no analyticity is
  assumed; window (i) of the proof)", and defines "bounded jets" exactly as the review
  asked: *the higher normalized jets range over a fixed bounded family as
  $\varepsilon \to 0$ — the limit holds the normalized profile fixed
  ($L''(0) = \beta L'(0)^2$, and so on up the jet) while $\varepsilon$ shrinks.*
- **Window (i)** replaces "(analytic flow)" with the review's displayed remainder: with
  the first four $t$-coefficients identically zero,
  $J(t;p) = t^4\cdot\frac{1}{3!}\int_0^1(1-s)^3\,\partial_t^4J(st;p)\,ds
  = t^4(a(p)+tR(t;p))$, $a(p) = \partial_t^4J(0;p)/4!$ — the first equality needs only
  $\partial_t^4J$ continuous and exhibits $J/t^4$ as continuous in $(t,p)$; the second
  (one Taylor order further) bounds $R$ on compacts via $\partial_t^5J$. Both hold once
  $L \in C^6$: the flow and its first variations are then $C^5$ jointly in $(t,p)$
  across the bounded normalized-jet family.

## Item 2 — period vs refocusing, propagated to every cited passage: DONE

The three statements are now kept separate everywhere: (a) the mean **period**
diverges — theorem; (b) the supercritical band shows no conjugate point within the
eight-period window — finite-horizon measurement; (c) the mean **refocusing** time
diverges / the launch-averaged caustic opens — Conjecture A's reading.

- **Article (B2):** "What diverges at $\varepsilon = \tfrac12$ *as a theorem* is the
  launch-averaged **period**; that the launch-averaged *refocusing* time diverges with
  it is exactly Conjecture A's reading (numerically supported, unproven)…"
- **README:** T2 results row ("mean **period** diverges… the refocusing reading of
  that divergence is Conjecture-A-conditional") and the moduli paragraph (period
  divergence + loses-its-finite-period + Conjecture-A note + finite-horizon band).
- **Part 3:** the critical-gradient sentence now names the period theorem, marks the
  refocusing reading as riding on the period identification, and states the
  supercritical observation as finite-horizon.
- **Part 7:** the per-angle bullet marks the identification "formally open (and it
  *fails* off the exponential profile)"; the figure caption relabels panel A as
  *measured* conjugate-time dots riding the exact mean-*period* curve ("the agreement
  is the numerical content of the period identification") and panel B as measured
  conjugate time vs the exact θ-period formula; the divergence paragraph and the bold
  summary sentence carry the three-way split explicitly; the glossary's "critical
  gradient" entry separates theorem / conditional reading / finite-horizon band.
- **Appendix D5:** "equals the period *only* on the exponential" → "the identification
  is *refuted off* the exponential (measured, V1) — on the exponential itself it
  remains Conjecture A, supported to $10^{-8}$ but unproven"; the "special property"
  sentence rewritten the same way; the closing critical-gradient passage now separates
  the three claims in the bold statement itself.
- **T2 report:** the exact period formulas now use $T$ — $\langle T\rangle/T^{\rm flat}$
  in the headline display, $T(\theta_0)$ in chain item 2, $\langle T\rangle/2\pi$ in
  chain item 3 — with an explicit notation line: *$T$ is the exact θ-period throughout;
  $t_c$ is reserved for the measured conjugate time, whose identification with $T$ is
  the conditional step.* The critical-gradient corollary separates the three claims and
  labels the verified numbers as measured conjugate times.

## Item 3 — P1's Hessian caveat: DONE

Caveat 3 now reads: "**This experiment alone cannot identify profile-curvature
dependence.** The family $B=B_0e^{gx}$ has $\beta = 0$ by construction, so profile
curvature is never varied here; V1/O6 later showed the leading coefficient *does*
depend on it — $c_2 = 1-\tfrac34\beta$ at the same $O(\varepsilon^2)$ order (article
Prop. 4.2)." — with the original "blind to $\nabla^2B$" claim explicitly marked false
in general and superseded.

## Item 4 — F2's even-fit sentence: DONE

The docstring sentence now reads: "Under the even-power fit ansatz, with c2 = 0 the
first fitted residual term is eps^4 (an eps^3 term is not excluded by theory for
general profiles; the ansatz assumes it away)…" The pre-registered criterion and the
recorded verdict are unchanged.

## Item 5 — guard v5: DONE

Three near-context rules added, exactly the surviving paraphrases: "mean/launch-averaged
refocusing time diverges", "stop(s) refocusing", "launch-averaged caustic opens" — each
demands period / Conjecture A / finite-horizon (window/horizon) language within ±2
lines. Three fixtures added (the review's bare sentences); the self-test confirms all
are flagged when unqualified. Clean run over the corrected corpus: 24 files; 44 banned,
3 require-context, 7 near-context, 2 positive rules; 33 fixtures caught.

## Item 6 — build-verification log refreshed: DONE

`artifacts/site_build_verification.txt` is regenerated from this round's actual runs:
Jekyll production build PASS (51.6 s); all ten pages 200; ten served-HTML content
checks for items 1–2 (all OK); article KaTeX 640 rendered / 0 errors (live DOM);
guard v5 counts; **F3 rerun PASS (45 s, $t^0..t^3 \equiv 0$, $a \equiv 1/12$)**; O6
certificate regenerated (9 s); F2 artifact stamp; lake build 8661 jobs + sorry-scan;
and the **HTML-proofer libcurl startup failure recorded verbatim** with the fix path —
no content verdict claimed.

## Standing

Proposition 4.2 retains "first conjugate time" under the finite-order argument, per the
review's own disposition. The period identity and the caustic profile law remain the
package's main contributions; every refocusing-flavored reading of the exact curve is
now uniformly labelled Conjecture-A-conditional at each site the review listed.
