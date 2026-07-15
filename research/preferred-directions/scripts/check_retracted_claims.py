#!/usr/bin/env python3
"""Regression guard: retracted/corrected claims must not reappear (v5).

v5 (post-final re-review): the period-vs-refocusing boundary gets near-context
rules — "mean/launch-averaged refocusing time diverges", "stops refocusing",
"launch-averaged caustic opens" now demand period / Conjecture A /
finite-horizon language within +-2 lines.

SCOPE OF THE TOOL (post-response review, finding 5): this is a syntactic
regression PHRASE/CONTEXT check, not a semantic scientific-invariant checker.
It proves the stored patterns and fixtures stay caught; it cannot prove that a
paraphrased overclaim is caught. Release therefore also requires the manual
claim-ledger pass (article section 7) — this tool guards against REGRESSION
to known-bad wording, nothing stronger.

The first version searched 15 exact strings and the re-review demonstrated the
failure mode: a claim can survive verbatim while every narrow pattern misses
it. v2 therefore tests INVARIANTS, three ways:

1. BANNED     -- pattern must not appear (whitespace-tolerant, optionally
                 scoped to the files where the claim would be wrong).
2. REQUIRE    -- if a trigger appears anywhere in a file, a qualifier must
                 appear in the SAME file (e.g. the inversion formula demands
                 "leading-order"/"estimator" somewhere on the page).
3. NEAR       -- if a trigger appears on a line, the qualifier must appear
                 within +-2 lines (e.g. "reconnection site" needs "candidate"
                 or "non-ideal" nearby).

plus a FIXTURES self-test: every sentence the two reviews actually caught is
embedded below, and the guard must flag each one -- so the guard cannot pass
while being too narrow to catch what it exists to catch.

Historical reports carrying a SUPERSEDED/CORRECTED banner are exempt by
design. Run: python scripts/check_retracted_claims.py  (exit 1 on any hit or
on a fixture the rules fail to flag).
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]      # research/preferred-directions
SITE = ROOT.parents[1]                          # repo root

# scopes: substring of the path selects the files a rule applies to
JUP = ("jupiter", "J1-jupiter", "run_j2")       # Part 8 + doc + census scripts
ALL = None

# ---- 1. banned patterns: (regex, why, scope) --------------------------------
BANNED = [
    # carried over from v1 (whitespace-tolerated where multi-word)
    (r"79 spiral — exactly where", "T96 census retracted", ALL),
    (r"spiral class exists in real physics", "T96 census retracted", ALL),
    (r"\*\*\$Q=7\$ at the fold\*\* \| stands", "generic rank-2 fold reads Q=6", ALL),
    (r"an \*\*exact law\*\*", "period-average law; caustic reading is Conjecture A", ALL),
    (r"exact caustic law", "period-average law; caustic reading is Conjecture A", ALL),
    (r"\| exact law \(", "period-average law; caustic reading is Conjecture A", ALL),
    (r"topological complexity index of", "candidate indicator only; G1 is the test", ALL),
    (r"280(σ|\\sigma)", "bands are numerical/fit sensitivity, not sampling sigma", ALL),
    (r"32(σ|\\sigma)", "bands are numerical/fit sensitivity, not sampling sigma", ALL),
    (r"full JRM33", "the analysis uses the l<=18 continuation", ALL),
    (r"beam stops refocusing once the field changes", "band statement only (R6)", ALL),
    (r"none found at \$\\varepsilon = 0\.52\$", "55/64 angles DO have conjugate points", ALL),
    (r"Larmor radii\s+separate the", "one combination at leading order", ALL),
    (r"radii \(two \$w\$\) separates", "one combination at leading order", ALL),
    (r"codimension[- ]9", "trace-free Jacobian: codimension 8", ALL),
    # re-review additions (R1, R3, R4, R5, R6)
    (r"seven[- ]part\s+series", "the series has eight parts", ALL),
    (r"two\s+Larmor\s+radii\s+(do\s+)?separate\s+gradient",
     "separation retracted: one combination at leading order", ALL),
    (r"two\s+radii\s+separate", "separation retracted", ALL),
    (r"actual detector", "consistency check on known nulls, not a detector claim", ALL),
    (r"los(es|e|ing)\s+(its\s+)?conjugate\s+point",
     "finite-horizon: 'no conjugate point detected within the window'", ALL),
    (r"no conjugate point found at",
     "finite-horizon: 'no conjugate point detected within the window'", ALL),
    (r"beam stops\s+refocusing",
     "band + finite-horizon statement only (R6)", ALL),
    (r"extrapolation-based catalogue is a numerical force-free violation",
     "scope: smooth force-free (bounded-alpha) extrapolations only", ALL),
    (r"reads a physical curvature gradient, invertibly\.",
     "exponential-profile scope required (calibrated combination in general)", ALL),
    (r"Jupiter'?s real field",
     "the JRM33 model/continuation, not the real field", JUP),
    (r"never\s+come\s+back", "finite-horizon evidence only (R6)", ALL),
    (r"detects a real null", "independent local confirmation, not blind detection", ALL),
    (r"§4's profile law was derived",
     "ambiguous: name WHICH law (period-average derived-first vs caustic measured-first)", ALL),
    (r"\(1-\\tfrac34\\beta\)\^\{-1/2\}",
     "needs absolute value |1-(3/4)b|^(-1/2): negative past beta=4/3", ALL),
    (r"=\s*w\s*\\sum_j\s*F_\{ij\}", "Lorentz sign: u' = -w F u with F_ij = d_iA_j - d_jA_i", ALL),
    (r"\\dot u_i \\;=\\; w\\,F", "Lorentz sign: u' = -w F u", ALL),
    (r"exhaustive\s+(spherical-cell\s+|cell[- ])?census",
     "two-resolution cell-prefiltered root census (no completeness theorem)", JUP),
    (r"survival\s+probabilit", "survival FRACTION under the chosen stress ensemble", JUP),
    (r"error\s+bar", "sample position range under the stress ensemble", JUP),
    (r"spirals?\s+out\s+of\s+2", "three retained roots; 0 spirals out of 3", JUP),
    # post-response review additions
    (r"no solar extrapolation can ever host",
     "theorem covers smooth force-free extrapolations with bounded alpha only", ALL),
    (r"truncation\s+noise\s+dominates",
     "truncation-sensitive / poorly constrained layer; cause not diagnosed", JUP),
    (r"identically\s+\$?0", "numerically consistent with zero, not identically", JUP),
    (r"no null with net index was missed",
     "net-charge only; index-cancelling pairs not excluded", JUP),
    (r"completeness\s+evidence",
     "two-grid/floor agreement is CONVERGENCE evidence", JUP),
    (r"is the robust one", "say 'more persistent under this chosen stress ensemble'", JUP),
    (r"closing (post|part)", "the series has eight parts; nothing before Part 8 closes it", ALL),
    (r"sub-Riemannian\s*\n?geometry \*\*iff", "one-way implication; iff is false", ALL),
    (r"the only knob", "general profiles also depend on beta and higher jets", ALL),
]

# ---- 2. file-level context requirements: (trigger, required, why, scope) ----
REQUIRE = [
    (r"\\sqrt\{\\lvert\\delta\\rvert\}/r_L|\\sqrt\{\|\\delta\|\}/r_L|sqrt\(\|δ\|\)/r_L",
     r"(?i)leading[- ]order|estimator",
     "the inversion must be qualified as a leading-order estimator", ALL),
    (r"survival\s+fraction",
     r"(?i)stress\s+(ensemble|proxy)|model-difference",
     "survival fractions exist only under the named stress ensemble", ALL),
    (r"arbitrary\s+(?!one-dimensional)[a-z]*\s*profiles?|ARBITRARY\s+profile",
     r"(?i)one-dimensional|1D\s+profile",
     "Prop 4.2 scope: arbitrary ONE-DIMENSIONAL profiles only", ALL),
]

# ---- 3. near-context requirements: (trigger, required, why, scope) ----------
NEAR = [
    (r"reconnection\s+sites?\b",
     r"candidate|non-ideal|Pontin|separate,?\s+dynamical",
     "a null is a CANDIDATE site; reconnection needs non-ideal evolution", ALL),
    (r"completeness\s+(statement|theorem|claim)",
     r"(?i)\bnot?\b|\bno\b|makes no",
     "a completeness statement is only allowed in negated form", JUP),
    (r"delays?\s+(the\s+)?refocusing|\*delays\*\s+refocusing",
     r"(?i)exponential|tfrac34\\beta|3\s*beta/4|3β/4|profile",
     "delay claim needs its profile scope (flips past beta = 4/3)", ALL),
    (r"invertibl",
     r"(?i)leading[- ]order|calibrat|profile|estimator",
     "inversion claims must carry the calibration/estimator qualifier", ALL),
    # post-final re-review: the period-vs-refocusing boundary
    (r"(mean|launch-averaged)\s+\*?refocusing\*?\s+time\s+diverg",
     r"(?i)\bperiod|Conjecture[\s-]+A|finite-horizon",
     "the divergence theorem is for the PERIOD; its refocusing reading is "
     "Conjecture A", ALL),
    (r"stops?\s+refocusing",
     r"(?i)finite-horizon|horizon|window|Conjecture[\s-]+A",
     "stops-refocusing claims are finite-horizon measurements, not theorems", ALL),
    (r"launch-averaged\s+caustic\s+open",
     r"(?i)Conjecture[\s-]+A|period identification|\bperiod\b",
     "the caustic opening rides on the period identification (Conjecture A)", ALL),
]

# ---- positive invariants: (path substring, required regex, why) -------------
POSITIVE = [
    ("README.md", r"Part 8", "README must list all eight parts"),
    ("README.md", r"eight-part", "README part count"),
]

CURRENT_LAYER = (
    [ROOT / "README.md", ROOT / "docs" / "PROGRAM.md",
     ROOT / "docs" / "J1-jupiter.md", ROOT / "docs" / "V1-profile-law.md",
     ROOT / "docs" / "T2-closed-form.md",
     ROOT / "docs" / "P1-moduli-read-grad-B.md",
     ROOT / "docs" / "P2-null-detection.md",
     ROOT / "docs" / "PROGRAM-P5-litmus.md",
     ROOT / "scripts" / "run_j2_census.py",
     ROOT / "scripts" / "run_j2b_sensitivity.py"]
    + sorted((SITE / "_posts").glob("*forbidden-directions*.md"))
    + sorted((SITE / "_appendices").glob("*forbidden-directions*.md"))
    + sorted((SITE / "_articles").glob("*.md"))
)

# ---- fixtures: sentences the reviews caught; each MUST be flagged -----------
FIXTURES = [
    ("A magnetic null is a **reconnection site** — where field lines break", "p8.md"),
    ("locates\nthe magnetic nulls — the reconnection sites — and reads", "p2.md"),
    ("a point where $\\mathbf B = 0$; a reconnection site.", "p1.md"),
    ("factor (1 − (3/4)β)^{−1/2}; two Larmor radii separate\ngradient from curvature",
     "V1-profile-law.md"),
    ("written up as a seven-part series with five appendices", "README.md"),
    ("the band $\\sin\\theta_0 \\ge (1-\\varepsilon)/\\varepsilon$ loses its\nconjugate point",
     "p7.md"),
    ("the census obliges, 0 spirals out of 2.", "jupiter.md"),
    ("The exhaustive census the review demanded", "jupiter.md"),
    ("survival probability $\\approx 33/40$ under the model-difference", "jupiter.md"),
    ("That box is the prediction's error bar under the proxy.", "jupiter.md"),
    ("It inverts: $|\\nabla\\ln B| = \\sqrt{|\\delta|}/r_L$. A field gradient", "README.md"),
    ("✓ detects a real null (Q=6); raw-grid resolution-limited", "README.md"),
    ("= w\\sum_j F_{ij}\\,u_j . \\qquad\\blacksquare", "article.md"),
    ("evaluates symbolically to 2π(1 − 3β/4) for an ARBITRARY profile jet", "V1.md"),
    ("and §4's profile law was derived *before* being measured", "article.md"),
    # post-response review fixtures
    ("finds it reads the\nfield gradient exactly — δ = −ε², invertibly — the first time",
     "p3.md"),
    ("**A gradient delays refocusing.** $\\delta<0$ means $t_c$ exceeds", "p3.md"),
    ("**no solar extrapolation can ever host a spiral null**", "p6.md"),
    ("in $0.80$–$0.855$, where truncation noise dominates and no completeness", "jupiter.md"),
    ("and $0.999$ is identically $0$, so **no null with net index was\nmissed", "jupiter.md"),
    ("floor-move agreement is the completeness evidence on\noffer", "jupiter.md"),
    ("(15/40 and 19/40): the polar structure is the robust one.", "jupiter.md"),
    ("This closing post takes the growth-vector null detector", "p4.md"),
    ("carries genuine sub-Riemannian\ngeometry **iff there is a", "README.md"),
    ("across one orbit; the only knob $\\delta$ can depend on.", "p3.md"),
    # final re-review fixtures: paraphrases that slipped past v3
    ("losing its conjugate point at exactly $\\varepsilon = 1/2$", "T2-closed-form.md"),
    ("no conjugate point found at ε = 0.52", "T2-closed-form.md"),
    ("a charged-particle beam stops\nrefocusing when the field changes", "T2-closed-form.md"),
    ("any spiral null in an extrapolation-based catalogue is a numerical force-free violation",
     "PROGRAM-P5-litmus.md"),
    ("statistic reads a physical curvature gradient, invertibly.", "P1-moduli-read-grad-B.md"),
    # post-final re-review fixtures: the three paraphrases v4 passed
    ("the mean refocusing time diverges at the critical gradient.", "README.md"),
    ("and the slowest launch angle stops refocusing.", "p7.md"),
    ("above it the launch-averaged caustic opens.", "p7.md"),
]


def in_scope(fname, scope):
    return scope is None or any(s in fname for s in scope)


def check_text(text, fname):
    """All rule hits for one file's text. Returns [(line, message)]."""
    hits = []
    for pat, why, scope in BANNED:
        if not in_scope(fname, scope):
            continue
        for m in re.finditer(pat, text):
            hits.append((text[: m.start()].count("\n") + 1, f"banned /{pat}/  [{why}]"))
    for trig, req, why, scope in REQUIRE:
        if not in_scope(fname, scope):
            continue
        m = re.search(trig, text)
        if m and not re.search(req, text):
            hits.append((text[: m.start()].count("\n") + 1,
                         f"trigger /{trig}/ without required /{req}/  [{why}]"))
    lines = text.split("\n")
    for trig, req, why, scope in NEAR:
        if not in_scope(fname, scope):
            continue
        for i, ln in enumerate(lines):
            if re.search(trig, ln):
                window = "\n".join(lines[max(0, i - 2): i + 3])
                if not re.search(req, window):
                    hits.append((i + 1, f"/{trig}/ without nearby /{req}/  [{why}]"))
    return hits


def main():
    # self-test first: the guard must catch every reviewer-caught sentence
    weak = [f"fixture NOT caught ({fn}): {t[:60]!r}"
            for t, fn in FIXTURES if not check_text(t, fn)]
    if weak:
        print("GUARD TOO WEAK — it would miss claims the reviews caught:")
        print("\n".join(" " + w for w in weak))
        sys.exit(1)

    hits = []
    for f in CURRENT_LAYER:
        if not f.exists():
            continue
        for line, msg in check_text(f.read_text(), f.name):
            hits.append(f"{f.relative_to(SITE)}:{line}: {msg}")
    for path_sub, req, why in POSITIVE:
        for f in CURRENT_LAYER:
            if f.exists() and path_sub in f.name and not re.search(req, f.read_text()):
                hits.append(f"{f.relative_to(SITE)}: missing required /{req}/  [{why}]")
    if hits:
        print("RETRACTED-CLAIM REGRESSION — fix before release:")
        print("\n".join(" " + h for h in hits))
        sys.exit(1)
    print(f"clean: {len(CURRENT_LAYER)} files; {len(BANNED)} banned, "
          f"{len(REQUIRE)} require-context, {len(NEAR)} near-context, "
          f"{len(POSITIVE)} positive rules; {len(FIXTURES)} fixtures caught")


if __name__ == "__main__":
    main()
