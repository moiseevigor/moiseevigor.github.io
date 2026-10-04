# Response to the final re-review (REVIEW-SR-ASTROPHYSICS-FINAL-REREVIEW-2026-07-14)

All eight checklist items executed. The substantive one — §3, the first-root gap — is
repaired by the review's own preferred route (repair 1, the structural factorization),
not by renaming.

## §3 — the first-root gap: REPAIRED (structural factorization, proved + verified)

The review is right that smooth dependence alone does not give the uniform short-time
window (the counterexample $t^4/12 - \varepsilon t^3$ settles it). The repair
delivered is exactly its option 1:

- **Order-counting lemma (article, window (i), rewritten).** The endpoint variations
  obey, in $(x,y,\varphi)$-components: $\partial_{\theta_0} = (O(t), O(t), O(t^2))$,
  $\partial_h = (O(t^2), O(t^2), O(t^3))$, $\partial_t = (O(1), O(1), O(t))$ — the
  $\varphi$-component always one order higher because $A(0) = 0$ (the launch gauge).
  Every determinant term takes one entry per column and uses the $\varphi$-row exactly
  once, so **every term is $O(t^4)$, for every analytic profile and every $h$**:
  $J = t^4(a(\varepsilon,\theta_0) + tR)$ with $a$ continuous, $R$ bounded on
  compacts, $a(0,\theta_0) = 1/12$ — the uniform window follows. This answers the
  review's demand to "explain why no $t^0..t^3$ terms appear for the perturbed
  exponential-map Jacobian, not merely at $\varepsilon = 0$."
- **Exact-symbolic verification** (`run_f3_smalltime_uniform.py`, ~45 s; jets $l_1,
  l_2, l_3$ and $h$ kept exact — all orders of $\varepsilon$ at once): the $t^0$–$t^3$
  coefficients vanish **identically** in (jets, $h$, $\theta_0$), and the $t^4$
  coefficient is **identically $1/12$** for the three-jet family — stronger than
  required (continuity would have sufficed). Artifact:
  `artifacts/f3_smalltime_uniform.json`.
- **Belt and braces (the review's repair 2, also adopted):** the proposition's scope
  note now states that, independently of window (i), the construction always yields
  the unique simple root continuing from $2\pi$ and every coefficient statement holds
  for that root — window (i) is precisely what upgrades it to *first*.
- **Barilari–Rizzi 2016** added to the references as the general-technology
  alternative (curvature-based lower bounds on the first conjugate time).
- Method note: the first attempt at the verification used series-of-composition
  machinery and stalled (the same tarpit as the first O6 run); the shipped script uses
  a formal derivation operator on the state (the potential enters only through
  $A' = B$, never an integral) and runs in 44 s.

## §4 — evidence-calibrated F2 language: DONE

"Vanishes exactly" → "consistent with zero, as predicted"; "pure ε⁴" → "consistent
with ε⁴ scaling over the sampled range, under the even-power fit models used" — in the
article's F2 passage, `RESPONSE-FINAL-2026-07-14.md`, `V1-profile-law.md` item 4, and
the F2 script docstring (which now states the prediction/observation distinction
explicitly).

## §5 — Lean ledger and presentation: DONE

1. FORMAL.md's critical-gradient row narrowed to the exact algebra proved; the
   "finite θ-period" step is explicitly routed through the external period formula.
2. `lean/README.md` replaced (purpose, toolchain, build, theorem map, scope boundary).
3. `run_o6_caustic_c2.py` label corrected to `theta0-independent: True`; certificate
   regenerated. FORMAL.md's small-time row now also names the F3 structural
   factorization as the (non-Lean) uniformity evidence.

## §6 — primary-document consistency: DONE

- **P1-moduli-read-grad-B.md**: SCOPE-CORRECTED banner (exponential experiment;
  calibrated combination + β = 4/3 blindness are the current result) + in-place fixes
  (verdict line, delay claim scoped, 280σ → 280× the numerical band).
- **P2-null-detection.md**: TERMINOLOGY-CORRECTED banner (tangent-cone consistency
  check / independent local confirmation; δ = −ε² scoped).
- **T2-closed-form.md**: main body rewritten around the exact **period average** —
  headline, chain item 2, corollary (finite-horizon supercritical statement replaces
  "losing its conjugate point"/"beam stops refocusing"), inversion marked
  period-average-exact and Conjecture-A-conditional as a caustic statement.
- **PROGRAM-P5-litmus.md**: catalogue audit scoped to smooth force-free (bounded-α)
  extrapolations; the Sun-vs-magnetotail "dichotomy" **withdrawn** (T96 retraction).
- **README** thesis + **PROGRAM.md** thesis: "moduli give its gradient" → the
  calibrated combination, blind jet named, original phrasing marked as the superseded
  hypothesis.
- **Guard v4**: P1/P2/PROGRAM-P5 added to the scanned set; patterns generalized
  (los(es|ing) its conjugate point, "no conjugate point found at", "beam stops
  refocusing", unscoped catalogue-audit, "reads a physical curvature gradient,
  invertibly", "Jupiter's real field"); 5 new fixtures from this review's caught
  paraphrases. First run of v4 caught **five further live instances** (P1 doc ×2,
  Part 7 ×2, Part 8 ×1) — fixed. Now clean: 24 files, 44/3/4/2 rules, 30 fixtures.
  The guard remains, per its own docstring, a syntactic regression check — the manual
  claim-ledger pass stays the release gate.

## §7/§8 — article and blog claim scopes: DONE

Article: intro "special property" → "general-profile identification refuted; equality,
if valid, exponential-specific (Conjecture A)" (both sites); "theorem at this order" →
"exact symbolic result at this order" (article + D5). Blog: Part 1 thesis → calibrated
combination; Part 3 inversion display carries **β ≠ 4/3** with the blind-jet pointer,
P1 figure caption scoped to the exponential experiment, glossary/limitation lines →
one calibrated combination, Conjecture A preserved ("fails off the exponential
(measured); agrees to 1e-8 on it but remains Conjecture A"); Part 5 description →
"independent local confirmations at root-finder locations" + force-free-scoped
"whole problem"; Part 6 "cannot have" force-free-scoped + three-worlds scoreboard now
names the analytic Dungey/vacuum model and marks the T96 census retracted; Part 7
audit row scoped + quoted blanket claim rephrased; Part 8 "Jupiter's real field" →
"the JRM33 model field (Juno-derived)" and "skeleton is real" → "a reproducible but
resolution-fragile feature of the chosen model continuation".

## §12.8 — release engineering: DONE (with one documented gap)

Reruns after all edits: guard clean (24 files/30 fixtures), `lake build` green (8661
jobs), O6 regenerated (9 s), F3 PASS (44 s), article + posts re-verified on the live
site. The HTML-proofer/libcurl gap in the Docker image is documented in the
build-verification log as a release-engineering item; per the review it is not a
scientific blocker, and the guard is cited only in its syntactic role.

## Standing scores note

With §3 repaired by the structural factorization, the "first conjugate time" reading
of Proposition 4.2 stands (for sufficiently small ε, uniformly in launch angle), with
the coefficient statements unchanged. The package's astrophysical claims remain model
interrogations, exactly as scored.
