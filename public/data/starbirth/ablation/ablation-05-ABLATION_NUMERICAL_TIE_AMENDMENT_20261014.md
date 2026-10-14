# Identical-input score correction before any verified publication

The independent execution4 replay passed all five model/metric fold checks and
all score tolerances, then failed exact review selections. Identical molecular-only
inputs (no gas measurements) in one fold acquired up to 1.78e-15 score jitter from
batch matrix multiplication. For example, 3,868 zero-gas rows in fold 0 received
nine distinct float scores despite identical vectors. Lexicographic tie semantics
were therefore not faithfully implemented. The original execution2 output remains
unverified, preserved and excluded from publication. This is a disclosed post-read
numerical correction, not an unseen preregistration or an adjusted science gate.

Canonicalize identical transformed feature vectors within each prediction call,
compute each unique vector once, then map its score to every duplicate row. The
independent direct-distance implementation canonicalizes separately. Freeze the
corrected worker and checker before a new analysis; add a duplicate-vector synthetic
control crossing a 512-row batch boundary. No feature, outcome, model, regularization,
bandwidth formula, capacity, threshold, budget or random seed changes. The original
four models must still replay within 1e-7 and retain their original review selections.

The checker proves numerical agreement for every score at the original tolerance,
and independently orders the exact stored float bytes for selections. Equivalent
inputs within each fold must receive bit-identical stored scores. Floating-point
agreement is not bitwise equality between two independent linear-algebra algorithms.
All identities, curves, controls, numerical fits and primary metrics are rechecked.

Fresh stages: ablation_controls_execution3_20261014 (50s/1MiB),
ablation_diagnostic_execution3_20261014 (1130s/12MiB),
ablation_verification_execution5_20261014 (530s/4MiB). The original total 1740s and
aggregate output budgets still apply, including earlier failed stages. Fit/score
outputs from earlier execution2 stay local with complete hash inventories. Compact
publication uses only the separately verified corrected packet. No model is selected
or promoted after observing this correction.
