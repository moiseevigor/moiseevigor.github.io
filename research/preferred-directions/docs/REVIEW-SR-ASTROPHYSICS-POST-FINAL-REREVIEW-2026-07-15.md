# Post-final-response SR and astrophysics re-review

**Date:** 2026-07-15  
**Response reviewed:** RESPONSE-FINAL-REREVIEW-2026-07-14.md  
**Baseline:** REVIEW-SR-ASTROPHYSICS-FINAL-REREVIEW-2026-07-14.md  
**Scope:** article, eight posts, appendices, program reports, Lean project, F2/F3/O6
certificates, Jupiter ensemble, regression guard and rendered site  
**Decision:** **minor revision.** The previous substantive first-root objection is
resolved. The package is scientifically much closer to release, but the response's
claim that every objection has been fully propagated is not yet accurate.

## 1. Executive verdict

The most important repair is successful. The new structural order-counting argument
shows that the endpoint Jacobian has no terms below \(t^4\), uniformly in the
perturbation parameters, and the exact-symbolic F3 calculation independently returns

\[
[t^0]J=[t^1]J=[t^2]J=[t^3]J=0,\qquad [t^4]J=\frac1{12}.
\]

Together with continuity, compactness of the launch circle, homogeneous positivity on
\((0,2\pi)\), uniform convergence on the bulk interval and the implicit-function
argument near \(2\pi\), this supplies the missing first-root window. Proposition 4.2
may retain “first conjugate time” for sufficiently small epsilon.

The response also correctly repairs most of the Lean ledger, F2 wording, gradient
calibration, no-spiral scope, Jupiter model language and stale program reports. All
mathematical and numerical reruns pass.

What remains is narrower but still visible to readers:

1. the proof says “analytic flow” although the proposition assumes only “sufficiently
   smooth” \(L\);
2. several current pages still turn the exact **period-average** divergence into a
   proved divergence of the **first-conjugate/refocusing** time;
3. one P1 caveat still denies the profile-curvature dependence established by
   Proposition 4.2;
4. the F2 script still states an unproved even-power conclusion; and
5. the build-verification log was not updated as the response claims.

These are focused corrections. I no longer recommend major revision.

## 2. The first-root repair

### 2.1 Order counting is correct

For the endpoint columns \(\partial_{\theta_0}\), \(\partial_h\) and
\(\partial_t\), the stated component orders are

\[
\partial_{\theta_0}=(O(t),O(t),O(t^2)),\quad
\partial_h=(O(t^2),O(t^2),O(t^3)),\quad
\partial_t=(O(1),O(1),O(t)).
\]

The launch gauge \(A(0)=0\) makes the fibre component one order higher. Every
determinant permutation uses each column and the fibre row once. Its total order is
therefore \(1+2+1=4\), irrespective of which column supplies the fibre entry.
Consequently \(J=O(t^4)\) structurally, not merely at epsilon \(=0\).

The shipped F3 script correctly tracks \(A(x(t))\) by
\(\dot A=B(x)\cos\theta\), constructs exact Taylor coefficients through sufficient
order, differentiates the endpoint series in \((\theta_0,h,t)\), and expands the
determinant. My rerun completed in 42 seconds and reproduced the archived result:
the coefficients through \(t^3\) vanish identically and the \(t^4\) coefficient is
identically \(1/12\) for the three-jet family, including exact \(h\) dependence.

### 2.2 One proof-writing correction remains

Article lines 826–828 say \(R\) is bounded on compacts because the flow is analytic.
Proposition 4.2 assumes only that \(L\) is “sufficiently smooth,” not analytic.

This is readily fixed without changing the theorem. State the required finite
regularity explicitly and use the finite-order Taylor formula/Hadamard lemma with
parameter-dependent remainder:

\[
J(t,p)=t^4\left(\frac{1}{3!}\int_0^1(1-s)^3
\partial_t^4J(st,p)\,ds\right),
\]

where \(p=(\varepsilon,\theta_0)\), after the first four Taylor coefficients have been
shown to vanish. Continuity of \(\partial_t^4J\) gives a continuous quotient \(J/t^4\);
one additional derivative, or a modulus-of-continuity form of the remainder, supplies
the displayed \(a+tR\) form. Alternatively assume analytic \(L\) explicitly, but that
would unnecessarily narrow the result.

The article should also say whether “bounded higher jets” means a fixed bounded
profile family as epsilon tends to zero. The perturbation expansion uses
\(L''(0)=\beta\varepsilon^2\), so fixed/bounded normalized jets are the natural
interpretation.

**Disposition:** previous major objection closed; minor rigor clarification required.

## 3. Period versus caustic language is still not fully propagated

The exact theorem is

\[
\frac{\langle T\rangle}{2\pi}=\frac{2}{\pi}K(2\varepsilon),
\]

for the launch-angle averaged theta-period. Reading this as the averaged first
conjugate/refocusing time remains conditional on Conjecture A. The supercritical run
adds finite-horizon numerical evidence; it does not turn the conditional caustic
statement into a theorem.

The following live passages still cross that boundary:

- **Article, lines 595–597:** “What diverges ... is the launch-averaged refocusing
  time.” The proved statement is that the mean period diverges. A refocusing-time
  statement is conditional on Conjecture A, although strongly supported numerically.
- **README, lines 47 and 66–68:** “mean refocusing time diverges” and “the slowest
  launch angle stops refocusing.” Replace with mean-period language plus the explicit
  finite-horizon caustic observation.
- **Part 3, lines 101–103:** repeats the same unconditional refocusing conclusion.
- **Part 7, lines 91–96, 104–116 and glossary lines 227–231:** calls the exact curve
  mean/per-angle refocusing time and says the launch-averaged caustic opens. Preserve
  the period theorem, numerical caustic agreement and finite-horizon band as three
  separate statements.
- **Appendix D5, lines 121–122 and 189–190:** “equals the period only on the
  exponential profile” and “is a special property” imply that equality on the
  exponential has been proved. Say equality is refuted off-exponential and remains
  Conjecture A on the exponential.
- **Appendix D5, lines 235–248:** again promotes the period divergence to a proved
  mean-refocusing divergence.
- **T2 report, lines 13–16, 32–43 and 71–82:** the prose now says period, but the
  displayed period formula is still labelled \(t_c\), after which the corollary calls
  the divergence a mean refocusing divergence and says the caustic opens. Use \(T\)
  consistently. Reserve \(t_c\) for the measured/conditional comparison.

The response says T2 was rewritten around the period average. That is directionally
true, but the remaining notation and corollary still contradict the stated boundary.

## 4. Two smaller scientific consistency findings

### 4.1 P1's Hessian caveat is now false

P1-moduli-read-grad-B.md line 128 says:

> At this order delta is blind to the Hessian of \(B\).

The current caustic coefficient depends on
\(\beta=L''(0)/L'(0)^2\) at the same \(O(\varepsilon^2)\) order. The exponential
experiment itself cannot separate this dependence because beta is fixed at zero, but
the general result is not blind to profile curvature. Replace the caveat with:

> This experiment alone cannot identify profile-curvature dependence; V1/O6 later
> showed that the leading coefficient depends on beta.

The banner helps, but it should not be asked to reverse an explicit, scientifically
false caveat in the body.

### 4.2 F2 script still assumes its conclusion in one sentence

The F2 docstring correctly says the numerical fit only tests consistency with zero and
that its even-power models assume an even form. Line 22 then says:

> With \(c_2=0\) the signal starts at epsilon-four.

That conclusion requires absence of an epsilon-cubed term, which remains open for
general profiles. Change it to:

> Under the even-power fit ansatz, the first fitted residual term is epsilon-four.

The numerical F2 pass itself remains valid under its pre-registered criterion.

## 5. Guard and release-engineering assessment

Guard v4 now scans 24 files and catches all 30 stored fixtures. This is a real
improvement. It still passes the following phrases without a finding:

- “the mean refocusing time diverges”;
- “the slowest launch angle stops refocusing”; and
- “the launch-averaged caustic opens.”

I verified this directly by calling its check function on those sentences; all
returned an empty hit list. Add fixtures/rules that require “period,” “conditional on
Conjecture A,” or “finite-horizon” in the appropriate local context.

The response also says the build-verification log carries the new F3 and guard-v4
stamp and documents the HTML-proofer gap. The current
artifacts/site_build_verification.txt is stale: it still records 39 rules/25 fixtures,
contains no F3 result, and does not record the libcurl failure. Update it or stop
claiming it is the current release log.

The Jekyll production build succeeds. HTML-proofer still aborts before inspecting any
page because the Docker image lacks libcurl. This remains a release-engineering gap,
not evidence of broken content and not a scientific blocker.

## 6. Verification record

| Check | Independent result |
|---|---|
| Lean build | **Pass**, 8661 jobs |
| Lean proof-hole scan | **Pass**; only a documentation occurrence of the word “sorry” |
| F3 uniform small-time certificate | **Pass**, exact \(t^0\)–\(t^3=0\), \(t^4=1/12\), 42 s |
| O6 caustic coefficient | **Pass**, \(c_2=1-3\beta/4\), 9 s |
| F2 beta \(=4/3\) test | **Pass** under the pre-registered sensitivity-band rule |
| T2 elliptic reduction | **Pass**, symbolic identity and numerical agreement |
| Smoke suite | **Pass** |
| Guard v4 | **Mechanical pass**, 24 files, 44/3/4/2 rules, 30 fixtures |
| Jupiter J2b | **Pass**, counts \(15/19/32\), \(17/28/35\), \(14/15/29\), 106 s |
| Jekyll production build | **Pass**, 61.304 s |
| HTML-proofer | **No content verdict**; startup failure from missing libcurl |

The Jupiter interpretation remains appropriately conditional on the degree-18 JRM33
continuation. The primary JRM33 paper says the coefficients are reasonably resolved
through degree/order 13 and useful information extends through 18; the program's
stress ensemble remains a sensitivity proxy, not a posterior.

External checks:

- [Connerney et al., JRM33](https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2021JE007055)
- [Barilari and Rizzi, comparison theorems for conjugate points](https://www.esaim-cocv.org/articles/cocv/pdf/2016/02/cocv150013.pdf)
- [Barilari, Bossio and Franceschi, accepted-paper record](https://cvgmt.sns.it/paper/7077/)

## 7. Updated scores

| Criterion | Article | Blog/package | Assessment |
|---|---:|---:|---|
| Scientific contribution | **3.9/5** | **3.4/5** | First-root status is now supported; period identity and caustic profile law remain the main contributions. |
| Logical correctness | **4.3/5** | **3.8/5** | Article's former major gap is closed; period/caustic leakage remains across summaries. |
| Mathematical correctness | **4.3/5** | **3.9/5** | Structural proof plus F3 materially strengthen Proposition 4.2; finite-regularity wording needs tightening. |
| Astrophysical evidential strength | **2.8/5** | **2.8/5** | Correctly a model-interrogation program, not direct topology detection. |
| Clarity and status discipline | **4.2/5** | **3.8/5** | Most scope repairs landed, but the critical-gradient narrative still mixes theorem, conjecture and finite-horizon evidence. |
| Reproducibility | **4.7/5** | **4.5/5** | All scientific reruns and site build reproduce; proofing image and release log remain incomplete. |

## 8. Minimal acceptance checklist

1. Replace “analytic flow” by a finite-order parameter-dependent Taylor/Hadamard
   argument, or explicitly assume analyticity; clarify the bounded normalized-jet
   family.
2. Correct the period/refocusing divergence statements in article, README, Part 3,
   Part 7, D5 and T2; use \(T\) rather than \(t_c\) for the exact period formulas.
3. Correct P1's “blind to the Hessian” caveat.
4. Qualify the F2 “signal starts at epsilon-four” sentence by its even-fit ansatz.
5. Extend the guard with the three surviving paraphrases.
6. Update the build-verification log with F3, guard v4, the current build, and the
   libcurl/HTML-proofer status.

After these six focused changes, I would accept the package for public circulation as
a carefully scoped independent research article and computational research program.
No new mathematical experiment or observational data is required.
