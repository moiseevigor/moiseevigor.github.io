# N20 gate outcome: no identified physical fraction

The gate was registered in commit `930dff1e` before execution. It did not fit a
latent-class model, acquire observations or estimate a new Hi-GAL fraction.
Its empirical coverage worker terminated with exit code 1 at the frozen
identity check; it was not restarted. The separate exact mathematical
identifiability test failed the stated identification criterion.

## What the existing table reveals

The MALT90 table has 3,556 entries with unique ID and native recno values.
The cached maser/ATLASGAL subset has 896 rows, with two repeated Name strings
across four rows. They are not identical full rows: each repeated Name/Clump
pair has one distance value and one missing distance. The specific rows and
unmodified identifiers are retained in the conflict export. No rows were
removed or merged, and this audit does not decide whether the repeated names
represent one physical source or multiple unresolved entries.

Consequently the complete population support matrix was not produced. Do not
quote the planned coverage intersections or treat this as a successful data
preparation/model run. A future coverage run would need a separate registration
for native observation-row identities and unresolved alias/source associations.
This is a failed prerequisite, not permission to repair identities silently.

## Why more indicators alone do not identify the fraction

For binary indicator vector X and hidden state Z, the observable distribution
is p(x)=(1−π)p0(x)+πp1(x). Without justified restrictions on within-class
response distributions, many prevalences give the same observations.
Even a known class-1 distribution and correctly oriented informative indicators
do not generally remove that ambiguity.

The checked-in rational witness uses three indicators. Both models have the
same eight-pattern observable distribution and identical class-1 response,
with positive probability 4/5 for each indicator in class 1:

| Mathematical witness | Prevalence | Class-0 positive probability | Class-0 pair covariance |
|---|---:|---:|---:|
| Dependence allowed | 1/10 | 1/3 | 14/225 |
| Product class-0 response | 3/10 | 1/5 | 0 |

Every probability is nonnegative, both classes normalize to one, class 1 is
strictly more positive for each indicator, and both mixtures agree exactly
for all eight patterns. These 10%/30% values are **mathematical counterexample
parameters, not astrophysical estimates**. The example shows why assuming
conditional independence can choose a fraction that the observables alone
do not identify. It does not assert that every restricted latent-class model
is unidentifiable, or that Hi-GAL must have either example prevalence.

The same ambiguity can occur within a fixed covariate stratum. Mass/distance
adjustment alone cannot certify independence or response transfer. Even with
an assumed transferable known p1=q, nonnegativity of p0 gives only a conditional
bound π<=min p(x)/q(x); the witness bound 199/640 is also mathematical, not a
Hi-GAL bound. Actual constraints would require scientifically justified class
responses, dependence limits, source ownership and treatment of selection and
missingness. Agreement with the old 19% figure supplies none of those.

## Scientific conclusion and stopping decision

This gate does not establish an identified physical hidden-protostar fraction
or lifetime correction. The approximately 9–25% estimator spread and 45–55%
corrected-share scenarios remain descriptive sensitivity. The observed E15
counterparts and enrichment support follow-up, while reddening, neighbouring
sources, evolutionary tracer windows and uncertain ownership remain competing
explanations. Stop before fitting N20 under the current assumptions.

Exact witness, terminal failure, input hashes and identity-conflict exports are
in `artifacts/n20_prefit_gate_20261006/`. The field coverage remains incomplete;
no population precision/recall, new star, massive-protostar exclusion or
physical birth was established. The external Atlas remains unpublished at
this revision, pending the previously requested cancellation approval.
