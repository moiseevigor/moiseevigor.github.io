# Kernel conversion at computed method results

The previous [computed-context rule](../method-context/README.md) leaves six
body-type comparisons unavailable under strict beta normalization and explicit
binder-name correspondence. **All six exact displayed pairs pass fresh Lean
kernel conversion checks in their reconstructed contexts.** Their actual
computed body terms also type-check at the corresponding expected types.

This is a second relation. It does not turn a beta mismatch into a beta match.

| Compiled declaration | Branches checked | Original binders | Computed inputs per branch |
|---|---:|---:|---|
| `AtlasMethodControls.dependent` | 2 | 4 | 0, 2 |
| `lean_workbook_plus_6206` | 2 | 12 | 1, 1 |
| `lean_workbook_plus_62755` | 2 | 4 | 1, 1 |

The natural-number control compares `P Nat.zero` with `P 0`, and
`P (Nat.succ n)` with `P (n + 1)`. The other four pairs include differences in
metadata or proof expressions. The check establishes kernel conversion; it
does not isolate which reduction or irrelevance rule accounts for every pair.
Identical printed types are not used as evidence.

## Judgment and provenance

For a recorded method with expected type E, actual type C and actual computed
inputs ι, reconstruct the original context Γ from the closed compiled packet.
Open exactly the recorded method-input count, including every preceding input
domain. Let Eβ and Cβ be the two displayed beta-normal forms in Γ,ι.

```text
Γ,ι ⊢ Eβ is a type             Γ,ι ⊢ Cβ is a type
Γ,ι ⊢ Eβ ≡ Cβ                 Γ,ι ⊢ method ι : Eβ
```

`PortConversion.lean` freshly checks the closed declaration, selected recursor
call, argument order, native reduction-rule minor and method-input count. It
reconstructs E from the recursor signature and its actual preceding arguments,
and C from the actual method. These endpoints must match the earlier compiled
records by structural expression equality. Each actual computed input domain
is checked against the expected one before opening the body comparison.
Function-valued results remain results after the recorded input count.

The displayed pair is independently beta-normalized with Lean's substitution
primitive and checked against the candidate graph. All constructor payloads,
including binder names, metadata and flags, must round-trip exactly. Both
endpoints are checked as types. `Kernel.isDefEq` checks conversion, and a typed
identity forces `Kernel.check` to check the actual body at Eβ. Replacing Eβ with
`Bool` is rejected in each of the six cases.

The [native record](native-check.json.gz) contains compiled endpoint graphs,
original compiled occurrence paths and binder contexts, original evidence owners, fresh
check results, producer hashes and environment attribution. Original proof
scripts and source modules are absent from this package. The native checks
import neither the original proof modules nor private SE(2) modules; the three
original theorem declarations remain absent from the checking environment.

The dependency binaries were recovered from attributed mathlib cache archives
and individually hashed. This establishes the recorded checking environment,
not an independent source rebuild or identity with the original extraction
environment. The fresh inventory hash is
`dee3dfbe1d8c88fd965357a77f17f3f690d8b5a8957fa11c8dc2819a54da2d1f`.
The native record explicitly sets `originalEnvironmentIdentityVerified: false`.
These qualifications also apply to the AI-source sample; its earlier publisher
attribution remains unchanged.

## Checks and scope

The [endpoint audit](model-check.json.gz) reopens the immutable packets and
method records, recomputes the current displayed forms and binds every fresh
native output to its exact owner, selected call, minor and original/computed
context. All six endpoint graphs agree. Six preceding-domain obligations pass.
The matcher rejects 120 mutations of provenance, paths, context, minor,
endpoints and result flags; these are separate from the six native wrong-type
negative controls.

The earlier 171-port model and browser evidence are unchanged: 164 strict beta
matches, one explicit binder-name correspondence and six beta/alpha
unavailable results. This checkpoint adds native evidence for the latter six;
it does not rerun native checking on all 171 ports. It adds no browser controls,
visual notation, application behavior or deployment. A conversion relation in
the geometry must retain both endpoints, their Γ/ι context and the separate
native evidence owner. It must not merge source occurrences or imply a source
use, literal equality or mathematical premise necessity.

This finite result does not establish arbitrary recursor coverage, a general
conversion algorithm in JavaScript, semantic compression or improved human
comprehension. The general research goal remains active. Blog unchanged;
research branch only.

## Reproduction

The JavaScript checker needs only the existing public compiled packets and
records. `--check` reads the frozen bundle without rewriting it.

```sh
node research/proof-atlas/method-conversion/check.cjs --check
node research/proof-atlas/method-conversion/evidence.cjs --check
```

For fresh native checks, use Lean 4.33.1 on macOS and the recovered cache format
accepted by `use-sites/verify.py:recovered` (`restoration.json`, runtime artifacts
and `lean-env-path.txt`). All dependency hashes are rechecked. The sandbox
permits reads from the toolchain/runtime and writes only to the new working
directory. Each native process has the existing 120-second, 8-GiB RSS and
30-GiB free-space bounds. The strict normalizer is finite-sample tooling under
these process bounds, not a browser normalization or memory theorem.

```sh
node research/proof-atlas/method-conversion/prepare.cjs /tmp/new-method-conversions
python3 research/proof-atlas/method-conversion/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean \
  --cache /path/to/recovered-runtime \
  --workdir /tmp/new-method-conversions
node research/proof-atlas/method-conversion/check.cjs --freeze /tmp/new-method-conversions
node research/proof-atlas/method-conversion/evidence.cjs
```

Fresh runs retain their own output/environment hashes. Reusing the attributed
cache does not establish an independent dependency rebuild. Native request,
packet and producer hashes are pinned throughout the run; failed attempts
cannot inherit an earlier successful output.
