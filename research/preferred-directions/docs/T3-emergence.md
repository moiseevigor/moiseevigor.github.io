# T3 — the null census of AR11158 through its emergence (2011-02-13 → 02-15)

Reproduce: `../cosmic-web/.venv/bin/python scripts/fetch_sequence.py` (8 real HMI frames,
~125 MB, gitignored) then `scripts/run_p5_sequence.py` (~6 s). Results →
`artifacts/p5_sequence.json`, figure → `public/img/posts/forbidden-directions-emergence.png`.

## What was hunted, and what was caught

The goal: catch a **fold** — an opposite-sign null pair being born — on the real Sun,
and watch the S1 knee migrate. The target: AR11158, the textbook emergence region
(born Feb 12–13, X2.2 flare Feb 15 01:56), tracked across 2.5 days at 6–12 h cadence,
window locked on the flux centroid (the first, uncentred tracking pass produced a
spurious "annihilation candidate" from quiet-Sun framing — caught and discarded).

**The census** (interior coronal nulls of the potential extrapolation):

| frame | 13T00 | 13T06 | 13T12 | 13T18 | 14T00 | 14T12 | 15T00 | 15T12 |
|---|---|---|---|---|---|---|---|---|
| nulls | 0 | 0 | 0 | 1* | 0 | 1 | 0 | **2** |
| peak G | 1379 | 1578 | 1743 | 1713 | 1833 | 1884 | 1749 | 1726 |

(*threshold-level transient.)

## Honest verdict

- **The physics trend is captured**: a young emerging bipole is a simple arcade —
  *zero* coronal nulls through day one — and nulls appear as the region builds its
  multipolar (flare-capable) topology; by twelve hours after the X2.2 flare the volume
  hosts a null pair (separation 36.5 px).
- **A fold birth was NOT caught.** The final pair is radial+/radial+ — *same* sign —
  and fold-born pairs are necessarily opposite-signed (topological degree). These two
  nulls arose independently (or with partners outside the box / below threshold).
- What a real catch needs (recorded): hourly cadence, a co-moving window locked to the
  same photospheric flux (not re-framed per frame), and null *identity tracking*
  between frames — plus the honest caveat that a potential extrapolation of a flaring
  (highly non-potential) region approximates the topology at best.

## Status

T3's minimum deliverable (the census time series) is delivered, with one genuinely
useful real-data observation — **null count as a topological complexity index of an
emerging region** — and the fold hunt honestly unresolved, with its data requirements
specified.
