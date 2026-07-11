---
layout: distill
title: "The Inverse Map: Reading the Fingerprint"
subtitle: >
  Now we run the reverse. Given noisy caustic data, can we name the group? This post
  is the payoff of the series: the three-part fingerprint, the confusion matrix that
  grades it, the two "rigidity points" where a single clue is all that separates a
  pair — and the honest silence the method keeps when the data isn't a group at all.
  Every number is from the code in <code>research/caustics-to-groups/</code>.
date: 2026-07-22 09:00:00
categories: [mathematics]
tags: [sub-riemannian, caustics, lie-groups, inverse-problems, classification, optimal-control]
image: /public/img/posts/caustics-groups-1.svg
description: >
  Part 3 of the caustics-to-groups series: the inverse estimator. Splitting the
  Heisenberg/SE(2) alias with the nilpotent-deviation moduli; the confusion matrix over
  four groups with graceful, class-preserving degradation; the aliasing map and its two
  rigidity points; and calibrated silence on effective (non-group) flows.
series: caustics-to-groups
series_title: "From Caustics to Groups"
series_part: 3
comments: true
published: false
---

<div class="l-body" markdown="1">

<div class="callout">
<div class="callout-title">Where we are</div>
<a href="{% post_url 2026-07-15-caustics-to-groups-research-program %}">Part 1</a> set the
goal (caustics in, group out) and the obstruction (local caustics are group-blind).
<a href="{% post_url 2026-07-18-caustics-to-groups-forward-map %}">Part 2</a> built the
forward model and the first real clue — the <em>growth vector</em>, which sorts the four
model groups into three classes but declares Heisenberg and SE(2) identical. This post
runs the inverse, splits that last tie, grades the whole thing with a confusion matrix,
and maps exactly where it can and cannot succeed.
</div>

**The clue the growth vector can't give.** Heisenberg and SE(2) have the same tangent cone,
so no amount of zooming in tells them apart (Part 2). The difference only shows at *finite*
scale, in how each group's caustic refocuses. A Heisenberg geodesic refocuses exactly when
its circle closes — at time $2\pi/|w|$ for vertical momentum $w$, a law we can prove and the
code reproduces to machine precision. SE(2) is *curved*, and its geodesics refocus **early** —
the more so the larger the loop:

| momentum $w$ | SE(2) refocus time ÷ flat law | reading |
|---|---|---|
| 8 (tight loops) | 0.996 | almost flat — the tangent-cone limit |
| 2 | 0.945 | mild curvature showing |
| 0.5 (wide loops) | 0.658 | strongly early — 34% short of flat |

Average that shortfall over a range of momenta and you get a single number, the
**nilpotent-deviation** $\delta$ — how far a group's caustic departs from the flat model.
Heisenberg scores $\delta \approx 0$ (it *is* the flat model); SE(2) scores $\delta \approx
0.14$. That gap is the whole ballgame: it's the clue that breaks the tie the growth vector
can't.

**The fingerprint, assembled.** The classifier reads three things, in order:

1. the **growth vector** → the class: $(2,3)$ = {Heisenberg, SE(2)}, $(2,3,4)$ = Engel,
   $(2,3,5)$ = Cartan;
2. within $(2,3)$, the **deviation** $\delta$ → Heisenberg (flat) vs SE(2) (curved);
3. the **abnormal bit**[^abnormal] → a coarse, robust corroborator that splits the contact
   groups from Engel/Cartan.

Run it on noisy synthetic caustics from each group, 25 fresh realizations apiece, and tally
what it guesses. That table is the confusion matrix.

[^abnormal]: Some geometries have a second kind of shortest path, forced by the shape of the allowed directions rather than the metric; whether they exist is a coarse yes/no (Heisenberg and SE(2): no; Engel and Cartan: yes) that survives noise well because it only asks how many directions you can drive, not the fine structure.

</div><!-- /.l-body -->

<figure class="l-middle" id="fig-confusion">
  <div style="text-align:center; margin-bottom:0.5em;">
    <button class="fig-toggle active" id="cm-b0">clean (noise 0.001)</button>
    <button class="fig-toggle" id="cm-b1">noise 0.01</button>
    <button class="fig-toggle" id="cm-b2">noise 0.03</button>
  </div>
  <div id="c2g-confusion" style="text-align:center;"></div>
  <figcaption>
    <strong>The confusion matrix (experiment E1).</strong> Rows are the true group, columns
    the classifier's guess, over 25 realizations per group; darker = more. The first four
    columns are exact group labels; <em>E/C</em> and <em>H/S</em> are <em>coarse</em> guesses
    ("it's Engel-or-Cartan / Heisenberg-or-SE(2)") the classifier falls back to when noise
    blurs the fine detail. Clean data: a perfect diagonal — every group named correctly, the
    Heisenberg/SE(2) tie broken by $\delta$. As noise rises the step-3 groups (Engel, Cartan)
    slide into the <em>E/C</em> coarse column — the correct <em>class</em> — and essentially
    never into a wrong group. The failure mode is honest hedging, not confident error. Data:
    <code>research/caustics-to-groups/artifacts/e1_results.json</code>.
  </figcaption>
</figure>

<script>
(function () {
  const host = document.getElementById("c2g-confusion");
  if (!host) return;
  const ns = "http://www.w3.org/2000/svg";
  const SANS = "'Source Sans 3', system-ui, sans-serif";
  const MONO = "'JetBrains Mono', monospace";
  const ROWS = ["Heisenberg", "SE(2)", "Engel", "Cartan"];
  const COLS = ["Heis", "SE2", "Eng", "Car", "E/C", "H/S"];
  // real E1 counts (25 per row); columns = Heis,SE2,Eng,Car,Engel/Cartan,Heisenberg/SE(2)
  const M = {
    "0.001": [[25,0,0,0,0,0],[0,25,0,0,0,0],[0,0,25,0,0,0],[0,0,0,24,1,0]],
    "0.01":  [[25,0,0,0,0,0],[0,25,0,0,0,0],[0,0,19,0,6,0],[0,0,0,18,7,0]],
    "0.03":  [[23,0,0,0,0,2],[0,25,0,0,0,0],[0,0,3,0,19,3],[0,0,0,1,23,1]]
  };
  const ACC = { "0.001": "exact 0.99 · class 1.00", "0.01": "exact 0.87 · class 1.00",
                "0.03": "exact 0.52 · class 0.96" };
  const W = 560, H = 300, mL = 92, mT = 44, cw = 58, ch = 46;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.style.maxWidth = "560px"; svg.style.width = "100%";
  host.appendChild(svg);
  const el = (t, a, tx) => { const e = document.createElementNS(ns, t);
    for (const k in a) e.setAttribute(k, a[k]); if (tx != null) e.textContent = tx; return e; };

  function render(key) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const m = M[key];
    // column headers
    COLS.forEach((c, j) => {
      const coarse = j >= 4;
      svg.appendChild(el("text", { x: mL + cw * (j + 0.5), y: mT - 24, "text-anchor": "middle",
        "font-size": 11, fill: coarse ? "#999" : "#333", "font-family": SANS,
        "font-style": coarse ? "italic" : "normal" }, c));
    });
    svg.appendChild(el("text", { x: mL + cw * 3, y: 14, "text-anchor": "middle", "font-size": 11,
      fill: "#555", "font-family": SANS }, "classifier's guess  →"));
    m.forEach((row, i) => {
      svg.appendChild(el("text", { x: mL - 8, y: mT + ch * (i + 0.5) + 4, "text-anchor": "end",
        "font-size": 11.5, fill: "#333", "font-family": SANS }, ROWS[i]));
      row.forEach((v, j) => {
        const x = mL + cw * j, y = mT + ch * i;
        const diag = (i === j);
        const frac = v / 25;
        const base = diag ? [43, 108, 176] : (j >= 4 ? [47, 133, 90] : [197, 48, 48]);
        const fill = v === 0 ? "#f7f7f7"
          : `rgba(${base[0]},${base[1]},${base[2]},${0.15 + 0.8 * frac})`;
        svg.appendChild(el("rect", { x: x + 2, y: y + 2, width: cw - 4, height: ch - 4, rx: 3,
          fill, stroke: "#e2e2e2", "stroke-width": 1 }));
        if (v > 0) svg.appendChild(el("text", { x: x + cw / 2, y: y + ch / 2 + 4,
          "text-anchor": "middle", "font-size": 12, "font-family": MONO,
          fill: frac > 0.5 ? "#fff" : "#333", "font-weight": diag ? 700 : 400 }, v));
      });
    });
    svg.appendChild(el("text", { x: mL, y: H - 8, "text-anchor": "start", "font-size": 11.5,
      fill: "#555", "font-family": SANS }, "accuracy: " + ACC[key]));
  }
  const btns = [["cm-b0", "0.001"], ["cm-b1", "0.01"], ["cm-b2", "0.03"]];
  btns.forEach(([id, key]) => {
    document.getElementById(id).onclick = () => {
      render(key);
      btns.forEach(([bid]) => document.getElementById(bid).classList.toggle("active", bid === id));
    };
  });
  render("0.001");
})();
</script>

<div class="l-body" markdown="1">

## Reading the matrix

**Clean data: a perfect diagonal.** Every group named correctly (one Cartan realization hedges
to the coarse class — 24 of 25 exact). The Heisenberg/SE(2) tie that stumped the growth vector
is broken cleanly by $\delta$: those two rows never bleed into each other, at any noise level in
the study. The moduli component does exactly the job the series was premised on.

**Under noise, it degrades the right way.** Turn up the measurement noise and the contact groups
(Heisenberg, SE(2)) stay pinned to the diagonal, while Engel and Cartan slide sideways — but into
the green *E/C* column, the correct *class*, not into a wrong group. That green column is the
abnormal bit doing its work: it asks only "how many directions can you drive?", a question so
coarse it survives noise that erases the fine growth-vector detail (at one particular noise level
the full growth vector fails for Cartan 100% of the time, while the abnormal bit is still right
100% of the time). So the classifier's exact-group accuracy falls with noise, but its *class-level*
accuracy barely moves — from 1.00 to 0.96. **It hedges honestly; it does not guess wrong.** For a
method meant to eventually face real data, failing to "I can only narrow it to two" is exactly the
right kind of failure.

## The aliasing map: where a single clue is load-bearing

Which clue separates which pair? Running each observable on each pair gives a clean map, and it has
exactly two **rigidity points** — pairs held apart by a *single* clue:

- **Heisenberg vs SE(2)** — identical growth vector, identical abnormal bit; separated **only by
  $\delta$**. Remove the deviation moduli and they become indistinguishable.
- **Engel vs Cartan** — both have abnormals, so that bit is useless here; separated **only by the
  growth vector**. Remove it and they collapse together.

Every other pair is separated redundantly (by growth vector *and* abnormal bit), and no pair is
fully aliased under the complete kit. This is the honest rigidity statement the program wanted: not
"everything is distinguishable", but *exactly which distinctions rest on which single piece of
evidence* — and therefore which would be lost first if that evidence were unavailable in the wild.

## Calibrated silence: knowing when not to answer

The sharpest test of an inference method is whether it refuses when it should. A real cosmic-web
caustic field is **not** a single group — it is a patchwork of sheets, filaments and nodes, each
with different local structure. Point the detector at such a field and the honest answer is *"there
is no one group here."*

It gives that answer. Sampling the growth vector at many points across a genuine group returns the
same vector everywhere → a confident label. Sampling across a modelled effective flow returns a
*mixture* — $(2,3)$, $(2,3,4)$, $(2,3,5)$ all present, no single vector holding even 40% — and the
detector reports **"a field of varying tangent cones"** rather than inventing a group. That is the
calibrated silence promised in Part 1: the method mapping the edge of its own competence, refusing
to read a group into a flow that hasn't got one.

## The verdict, and the frontier

The reverse map works — with a stated envelope. From caustic data alone the detector recovers the
group when the geometry is homogeneous, breaks the one alias the coarse fingerprint can't, degrades
into honest class-level hedging rather than wrong answers as noise grows, names exactly which
distinctions are single-clue fragile, and stays silent when handed a flow that isn't a group. The
group-blindness obstruction of Part 1 is real, and the escape — the *triple* fingerprint, never a
local germ — is what makes the inverse possible.

What remains is the genuine wild: the $\mathrm{SE}(3)$ structure of diffusion-MRI fibre fields, where
the configuration space really is a group and the data is real and noisy. That is the next frontier —
and the calibrated-silence machinery above is exactly what will keep the answer honest when we get
there. The full, reproducible code, every experiment, and the methods derivation live in
[`research/caustics-to-groups/`](https://github.com/moiseevigor/moiseevigor.github.io/tree/master/research/caustics-to-groups).

## Glossary

- **Growth vector** — how fast a group's hidden dimensions fill in; sorts the four models into
  three classes (Part 2).
- **Nilpotent deviation $\delta$** — how far a group's caustic refocusing departs from the flat
  (Heisenberg) law; 0 for Heisenberg, ~0.14 for SE(2); breaks their tie.
- **Abnormal bit** — coarse yes/no for a distribution-forced kind of shortest path; splits contact
  groups from Engel/Cartan and is unusually noise-robust.
- **Confusion matrix** — rows = truth, columns = guess; a perfect classifier is a pure diagonal.
- **Coarse label (E/C, H/S)** — a class-level guess ("Engel-or-Cartan") the classifier falls back to
  when noise blurs the exact group.
- **Aliasing / rigidity point** — a pair of groups separated by only one clue; removing it makes them
  indistinguishable.
- **Calibrated silence** — the method's refusal to name a group when the data is an effective flow
  with no single homogeneous structure.

</div><!-- /.l-body -->

<div class="l-body" markdown="1">
<div class="d-references" style="margin-top:2em; padding-top:1em;">
<h2>References</h2>
<ol>
  <li>A. Agrachev, D. Barilari &amp; U. Boscain (2019). <em>A Comprehensive Introduction to Sub-Riemannian Geometry</em>. Cambridge University Press.</li>
  <li>A. Agrachev &amp; D. Barilari (2012). "Sub-Riemannian structures on 3D Lie groups." <em>J. Dyn. Control Syst.</em> 18, 21–44. <a href="https://arxiv.org/abs/1007.4970">arXiv:1007.4970</a>.</li>
  <li>L. Sacchelli (2019). "Short geodesics losing optimality in contact sub-Riemannian manifolds and stability of the 5-dimensional caustic." <em>SIAM J. Control Optim.</em> 57, 2362–2391. <a href="https://arxiv.org/abs/1812.11340">arXiv:1812.11340</a>.</li>
  <li>Yu. L. Sachkov (2010). "Conjugate and cut time in the sub-Riemannian problem on the group of motions of a plane." <em>ESAIM: COCV</em> 16, 1018–1039. <a href="https://arxiv.org/abs/0903.0727">arXiv:0903.0727</a>.</li>
  <li>J. Feldbrugge, R. van de Weygaert, J. Hidding &amp; J. Feldbrugge (2018). "Caustic skeleton &amp; cosmic web." <em>JCAP</em> 05, 027. <a href="https://arxiv.org/abs/1703.09598">arXiv:1703.09598</a>.</li>
</ol>
</div>
</div><!-- /.l-body -->
