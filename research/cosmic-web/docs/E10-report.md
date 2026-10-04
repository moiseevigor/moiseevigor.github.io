# E10 — truth convergence (step doubling)


- truth self-convergence (90 vs 180 steps): median shift 0.008 vox
- vs truth(90 steps): ZA 4.457, damp 4.153, advantage -6.8%
- vs truth(180 steps): ZA 4.460, damp 4.155, advantage -6.8%

Grid-axis convergence: covered by E7/E7b (256³ truths; advantage persists at −9% to −12%). External-simulation cross-check (Quijote snapshot) remains open pending download approval.

## Verdict

Truth is numerically converged in time (0.008 vox shift under step
doubling — three orders below the measured effects) and the model-vs-ZA
comparison is invariant to it. With the grid axis covered by E7/E7b, the
referee's truth-validation point is addressed up to the optional
external-simulation cross-check.
