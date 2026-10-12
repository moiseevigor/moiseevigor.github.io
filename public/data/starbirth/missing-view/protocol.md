# Frozen retrospective missing-view ranking comparison

12 October 2026. Distinct unit within the accepted seven-day multi-survey
program, following verified eligibility and association audits. This does not
restart E13/CLIP, E22/E28 or the stopped occurrence comparison. Historical
chemistry outcomes and covariate findings are already consumed; registering a
new method does not turn them into fresh physical validation.

## Falsifiable question and outcome

Does a label-free six-dimensional shared representation improve recovery of a
withheld **consumed chemistry proxy** over both linear and nonlinear tabular
baselines at identical spatial review budgets? Learn from infrared, variability
and non-withheld dense-gas measurements with explicit missing views. Assess in
held-out sky tiles. Retain every 19,328 requested clump and unknown proxy.

Primary endpoint: minimum of two paired differences in qualifying-positive
recovery (embedding minus linear baseline; embedding minus nonlinear baseline),
at the fixed tile-wise review rule below. Retrospective support requires this
minimum >=0.10 and its 95% paired spatial-bootstrap lower endpoint >0. Adequacy
requires >=15 qualifying positives, >=80 qualifying proxy negatives and >=4
populated 10-degree tiles, finite common-support predictions, and no invalid
populated fold. If adequate but the benefit gate is not met, conclude **no
retrospective gain demonstrated**; this is not equivalence or a physical null.
If adequacy/fitting/source checks fail, conclude insufficient evidence and retain
all incomplete outputs. A supported retrospective gain is not independent
physical classification, population precision/recall or a newborn-star result.

The historical 303-object chemistry check had 26 positives, so only very large
improvements could be discerned. The minimum-count gates prevent a trivial
few-object success; they are not a conventional power guarantee. The bootstrap
will expose attainable precision. No sample-size, endpoint, threshold, model
or feature changes after new readout. Do not tune on test labels.

## Exact population, features and censoring

Use the verified 19,328-clump nearby Hi-GAL parent; sorted designation strings
and source hashes are frozen in registration. All reliable catalogue objects
remain neighbour context in the prior edge ledger. One-record/unshared molecular
support at 30 arcsec is required for gas features and proxy adjudication. The
32 ambiguous/shared cases retain their edges and unknown proxy state; no row is
dropped from the all-requested output. All four input/output tracers come from
the same instrument and environment: withholding the latter prevents direct
feature leakage but does not establish conditional independence.

The four evaluation-only fields are DHC3N, DHNCO404, DCH3CN and DSIO. At an
unambiguous native record, any 'Y' is a qualifying proxy positive; four 'N'
values are a qualifying proxy negative. Marginal 'M', missing/other flags with
no 'Y', absent records and ambiguous ownership are **unknown**, not negative.
These are chemistry labels, not physical absence/presence of a protostar. All
raw flags were historically consumed; every label has that role. No old model
scores, stage probe, 70-micron flux, Lbol, Tbol or evolutionary label is an input.

The feature order below is fixed; values are float64, missing entries NaN with
separate Boolean masks. Observed/censored/quality-missing states remain in the
source-bound inputs and ledgers. Missing values are never interpreted as zero
flux or absent stars. Model standardisation/imputation is distinct from those
scientific states.

0–4: log10 mass, temperature, log10 distance, log10 surface density, log10 diameter.
Positive finite values required; temperature is unlogged. These five physical
covariates are also supplied directly to the embedding ranker and both baselines.
Surface density is only a column proxy, not a validated line-of-sight extinction
control; the failed 333/800 column uncertainty gate is unchanged.

5–11: ln F160, ln F250, ln scaled-F350, ln scaled-F500, and consecutive log flux
ratios. F160/F250 require positive finite corresponding quoted errors as well as
positive flux; scaled350/500 require positive finite values, with absent quoted
errors explicitly unverified. The scaled fields are fsc350/fsc500, not their
uncertainties. No pixels, native photometry reconstruction or upper-limit fit.

12–15: W1−W2, W2−W3, W3−W4 and W2 magnitude from the retained AllWISE anchor
within 3 arcsec. Each contributing band requires finite magnitude, SNR>=5, its
cc_flags character '0', and ext_flg=0. Errors/alternatives/native IDs missing in
this derived table remain unverified. Low-SNR upper-limit-like values are not
substituted as detections. These catalogue values are provisional input context.

16–19: mean supported-visit W2 magnitude, ln(1+reduced constant-fit chi-square),
visit-mean peak-to-peak range and weighted slope in mag/year. Use only the
previously frozen anchored temporal-support subset: same available-field screen,
2-arcsec anchor radius, exact five-string deduplication, >30-day gaps, >=5 tuples
per supported visit, >=3 supported visits and >=365-day overall anchored span.
For a supported visit compute inverse-quoted-variance weighted mean magnitude;
variance is 1/sum weights plus a fixed 0.03^2 mag^2 analysis floor. That floor is
an assumption, not measured calibration. Use supported visits only for features.
No p-value, physical event or uncertainty coverage is inferred from the quoted
error model. Preserve unscreened and unanchored alternatives in original bytes.

20–27: for each of HCOP, HNC, N2HP, HCN, asinh(II/e_II) and ln FWHM. Require
positive finite e_II and finite II for the former, positive finite FWHM for the
latter, and NG in {1,2,3}. NG is the fit form/validity flag, not a count of stars.
No detection flags for these input lines are used. The four withheld tracers'
measurements/NG/noise/derived flags and the catalogue IR-based S category are
excluded from inputs. Keep all native molecular IDs and geometric alternatives.

Infrared/context columns 0–15 form one view, temporal 16–19 a second, and
molecular 20–27 a third. Fixed per-column loss scales are 1/sqrt(view dimension).
This scales dimensions, not a proven observation-noise likelihood. The model
does not assume missingness is random; explicit feature-availability masks enter
all rankers and missing-view strata are reported.

## Frozen spatial splits and fitting

Use 10-degree Galactic-longitude tiles, floor(glon/10), with longitude in [0,360).
The nominal fold is tile modulo five. Parent clumps sharing a molecular-position
component are assigned the fold of that component's lexicographically smallest
source; identical retained AllWISE coordinate pairs are additionally joined.
Store the group and tile for every ID. Entire groups stay out of training when
held out. A one-degree circular-longitude buffer around every nominal held-out
10-degree interval excludes nearby training rows, even if a component assignment
moves a case across a tile boundary. This guards nearby duplicate WISE queries
without asserting reconstructed native identity. Actual split arrays and hashes
must be inspected in the pre-read registration. Labels do not determine splits.

For each of five folds, train feature scaling and the embedding only on other
folds outside the buffer. All unlabelled parent training rows are allowed; never
use held-out rows to fit scaling, missing-value completion or a basis. Use only
qualifying proxy labels in training groups to fit downstream rankers. At least
five training positives and twenty training negatives are needed; a fold failing
this is recorded invalid, not re-partitioned. A fold with no qualifying test
labels still gets all-requested predictions if training is eligible.

Standardise each feature by training observed median and IQR; if no observations,
use median=0 and scale=1. If IQR<1e-8 use scale=1. Clip standardised values to
[-5,5]; set missing entries to zero for tabular baselines, alongside masks.
No test-specific feature scaling.

Shared representation: fixed rank six iterative low-rank completion. Initialise
missing scaled entries at zero, run exactly twenty full-SVD iterations, retaining
rank-six reconstruction only at missing entries and clipping those to the same
view-scaled range. Reinsert every observed entry unchanged at each iteration.
Centre the completed matrix each iteration; final centred SVD defines the basis.
This is an explicit low-rank completion procedure, not a calibrated probabilistic
PCA likelihood, a deep neural network or a claimed new method. Encode each row
from only its observed columns by ridge least squares (ridge=0.01) against that
basis and centring vector. Six coordinates are **fold-specific**; do not pool them
into an allegedly global latent map or fit test data to align them.

Three primary rankers:
- Linear comparator: class-balanced logistic regression on all 28 standardised
  raw features plus 28 masks; objective mean weighted logistic loss plus
  0.05/2 times squared coefficients, unpenalised intercept; L-BFGS-B, at most
  300 iterations, gradient tolerance 1e-7. A gradient infinity norm <=1e-4 may
  certify a numerically stationary stop even if the solver's generic status is
  non-success. Otherwise record a failed fold; no tuning/retry.
- Nonlinear comparator: Gaussian kernel ridge on the same 56 tabular columns;
  sigma squared is median positive squared pairwise training-reference distance,
  or one if degenerate; ridge=1 with class-balanced weights. Targets are +/-1.
- Embedding ranker: same kernel-ridge rule on six latent coordinates, five direct
  standardised physical covariates and all 28 masks. Standardise its continuous
  coordinates by training-reference mean/std (scale floor 1e-8); masks stay Boolean.
  Use the same reference labels and review objects as the comparators.

One fixed infrared-only ablation uses the same rank-six/20-iteration procedure
on columns 0–15, with its latent coordinates, physical controls and 16 masks in
an otherwise identical kernel ranker. It is diagnostic, not a selectable primary.
No model/hyperparameter sweep, learning on proxy test labels or old CLIP execution.
All scores are ranking scores, not calibrated physical class probabilities.

## Review budgets, uncertainty and confounding

Within each held-out 10-degree tile, select ceil(0.05*N) objects with the highest
score, ties broken by exact designation, separately for each method. For the
primary **common qualifying-proxy cohort**, N counts only qualifying positive or
negative proxies with valid predictions for every primary method. Require all
qualifying proxies to have valid common predictions for an adequate readout;
otherwise report incomplete support instead of silently reducing that cohort.
Keep unknowns in the all-requested ledger and denominator. Report the actual
rounded review counts/fractions; small tiles need not realise exactly 5%.

Separately apply the same rule to every requested source in each tile and record
selected proxy positives, proxy negatives and unknowns for each method. This
all-requested diagnostic is not population precision/recall: its truth is selected
and incomplete. Never exclude unknown selections from a claimed physical
precision denominator. No pooling or calibration of fold-specific latent spaces;
review comparisons use within-tile ordering, not cross-fold raw score cutoffs.

Use 2,000 paired bootstrap draws of populated qualifying-proxy tiles, sampling
whole tiles with replacement, seed 20261012. Recompute recovery differences from
fixed held-out selections and apply min(delta_linear,delta_nonlinear) per draw.
Discard draws with no proxy positives, report the discarded count; require at
least 1,900 retained draws. Percentile endpoints at 2.5/97.5%. All methods have
the same tile-wise reviews in every draw. This conditional spatial interval is
not an uncertainty bound on a hidden-protostar fraction or a survey detector.

Report recovery/selection by missing temporal/gas support, and low/high mass,
temperature, distance and surface-density strata using the global *input-only*
parent medians (outcomes do not set those divisions). Include the infrared-only
ablation, and descriptive covariate means/ranges of qualifying versus unknown
cohorts. These expose selection/confounding; they do not repair the stopped
column-matched occurrence estimator or establish causal effects.

## Reproduction, evidence and stopping

Freeze exact input/code/protocol hashes, feature names, seeds and all-source
split CSV before any new line/magnitude/variance readout. Geometry/missingness
from the verified association ledger may set these splits without labels.
Persist feature values/masks, all source and native-record joins, unknown proxy
states, five fold models, unaligned fold coordinates, all-requested out-of-fold
scores/review flags, proxy comparisons, bootstrap and caveats. Independently
reconstruct features/labels/splits from raw bytes and recompute the paired
readout. Verify solver stationarity, conditional encoders and saved kernel
coefficients numerically without importing the generator. Synthetic tests cover
missingness, forbidden-label invariance, exact ties, wrap-around buffers and
known linear-system solutions before real readout. Independent software replay
is not fresh physical validation.

Worker and checker each <=1,800 seconds, one CPU, <=256 MiB sampled RSS. Combined
outputs <=16 MiB, below the research 64 MiB ceiling, with a fresh guarded worker
stage cap 12 MiB and checker cap 4 MiB, and final combined check. Keep 5 GiB free.
No network observations, downloads, GPU, cloud jobs, native-input deletion,
private Atlas/E155/E121 actions or archived experiment execution. Preserve failed
attempts and stop after the frozen question. Model success cannot authorize an
automatic successor, scientific threshold adjustment or physical discovery.

A verified retrospective positive/null/insufficient result advances the accepted
comparison but cannot complete independent detector requirements. Any physical
candidate cards (at most twenty) require separately bound evidence and explicit
known/provisional/unknown status. No publication or cloud-app inference is
claimed merely by local execution; follow the existing blog publication checks
for a meaningful verified result.

Primary sources: [MALT90 catalogue, section 4](https://researchonline.ljmu.ac.uk/id/eprint/4139/1/MALT90_catalog.pdf),
[official NEOWISE column definitions](https://irsa.ipac.caltech.edu/data/WISE/docs/release/NEOWISE/expsup/sec2_1a.html).
[Roweis 1997](https://papers.nips.cc/paper_files/paper/1997/hash/d9731321ef4e063ebbee79298fa36f56-Abstract.html)
provides historical context for missing-data subspaces; the exact completion
procedure above is defined by this registration and is not asserted to be that
paper's probabilistic algorithm. Native fit/photometry uncertainties are not
replaced by an assumed latent-space likelihood.
