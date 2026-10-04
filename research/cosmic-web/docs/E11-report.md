# E11 — hybrid: Lagrangian (MUSCLE) trigger + directional damping

| model | transport all | web | r(k=0.53) | T(k=0.34) |
|---|---|---|---|---|
| muscle | 4.49 ± 0.12 | 5.57 ± 0.07 | 0.527 | 0.433 |
| damp | 4.52 ± 0.18 | 5.77 ± 0.16 | 0.388 | 0.410 |
| damp_msc | 4.67 ± 0.18 | 6.15 ± 0.17 | 0.374 | 0.343 |

## Verdict

Negative, and diagnostic: the Lagrangian-trigger hybrid (4.67 ± 0.18) is
worse than BOTH parents (MUSCLE 4.49, Eulerian-trigger damping 4.52), and
weakest at the web (6.15 vs 5.57/5.77). The evolving Eulerian density
carries trigger information that the precomputed Lagrangian collapse time
lacks; conversely MUSCLE's advantage must live in its
displacement-divergence construction, not its trigger. A working hybrid
would need to combine at the displacement/field level, not the trigger
level — recorded as future work, not pursued (diminishing returns).
