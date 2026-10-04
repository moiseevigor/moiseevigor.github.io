# Lab UX study — how research sites present programs and their outputs

**Question.** What site structure makes a personal blog that runs multi-part,
pre-registered research programs readable as a *lab* — one entry point per
program, outputs typed and findable, verdicts visible before the reader commits
an hour to a post?

**Hypothesis (falsifiable).** A reader landing on the home page should reach any
program's verdict in ≤ 1 click and any part / appendix / article / code of it in
≤ 2 clicks. The pre-restructure site fails this: 19 series posts interleaved in
the feed, verdicts buried mid-post, appendices and articles reachable only from
inside posts, and the four programs described in free text on `/projects/`.

## Survey — what the reference sites do

| Site | Pattern worth copying | Caveat |
|---|---|---|
| [Transformer Circuits Thread](https://transformer-circuits.pub/) | One index; each research line is a *thread* whose papers are listed in order under it — the reader enters the line, not a random paper. | Index is a flat date list within a thread; no verdicts at the index. |
| [Distill — Threads](https://distill.pub/2020/circuits/) | A thread landing page: short framing, then the ordered articles with one-line abstracts. | Threads are editorial collections, not hypotheses with outcomes. |
| [Ink & Switch](https://www.inkandswitch.com/) | Projects as the unit; each lists its essays, prototypes, and findings — outputs typed by kind. | Heavy bespoke design per essay; does not scale to a Jekyll blog. |
| [Arcadia Science pubs](https://research.arcadiascience.com/) | Every pub states its purpose, the *key takeaway*, and "next steps"; versions are explicit. Negative results are published as first-class. | Pub-centric, so program-level lineage is weak. |
| [gwern.net](https://gwern.net/about#confidence-tags) | Epistemic metadata at the top of each page (status, confidence, importance) so readers calibrate before reading. | Tags are self-assessed, not tied to pre-registered tests. |

## Edge and design decisions

1. **One program, one entry** (Circuits/Distill threads). Home feed shows only each
   program's Part 1; Parts 2+ are `hidden: true` (jekyll-paginate 1.1.0 drops them
   from pagination only — archives, tags and the atom feed still list them).
2. **A Lab index at `/lab/`** (Ink & Switch). One card per program: the question,
   status, the outcome in one sentence, a hypothesis **scoreboard**, the open
   frontier, and typed outputs — *narrative parts*, *theory appendices*, *formal
   articles*, *code*.
3. **Verdicts at the index** (Arcadia takeaways, gwern status). The scoreboard
   reads verdict symbols from `_data/series.yml`, which mirror the verdict tables
   in each program's Part 1 / research README — no new claims are made on the Lab
   page.
4. **Lineage** (none of the references do this well). Programs grew from each
   other; each card says what it grew out of.
5. **Wayfinding back up.** Every series page carries a breadcrumb
   *Lab › Program › Part n*, so a reader deep in appendix C4 can climb back.
6. **One source of truth.** Program metadata lives in `_data/series.yml`; the Lab
   page, the series table of contents, prev/next navigation and the home-card
   counts all render from it. `/projects/` keeps software only and points to the
   Lab.

## Glossary

- **Program** — a research line with a scoping post (Part 1), pre-registered
  hypotheses, ordered experiments and a verdict; one `_data/series.yml` entry.
- **Part** — a narrative blog post of a program (`_posts/`, `series_part: n`).
- **Appendix** — theory background for a program (`_appendices/`, part label
  `A1`, `B3`, `C6`, `D2`…; the letter identifies the program).
- **Article** — a formal output with full statements and proofs (`_articles/`,
  linked to its program by `program: <series id>`).
- **Scoreboard** — the per-hypothesis verdicts of a program:
  ✓ confirmed · ✗ refuted · △ partial/split · ○ pending.
- **Frontier** — the open question the program ends on.

## Result and open questions

Result is checked by the click-depth hypothesis above once the site builds:
home → program card's Part 1 (1 click, verdict box at the top) and home →
Lab → any output (2 clicks).

Open: should the atom feed also collapse to program posts (subscribers currently
get every part)? Should articles get a version/changelog line like Arcadia pubs?
