# FDFormal — machine-checked core of the Forbidden Directions article

Lean 4 formalization of the elementary load-bearing steps of
*Growth Vectors and Caustics of Magnetic Flux Lifts*
(`_articles/2026-09-05-magnetic-flux-lifts.md`). The claim-by-claim map —
including an explicit "what it does NOT prove" column and the list of results
deliberately left unformalized — is **[FORMAL.md](FORMAL.md)**, which is the
only interface the article cites.

## Toolchain

- Lean `leanprover/lean4:v4.32.0` (`lean-toolchain`; install via
  [elan](https://github.com/leanprover/elan))
- mathlib, pinned in `lakefile.toml` / `lake-manifest.json`

## Build

```bash
lake exe cache get   # first time: fetch prebuilt mathlib binaries
lake build           # completes with zero errors; FDFormal/ contains no `sorry`
```

## Theorem map (details in FORMAL.md)

| Module | Contents |
|---|---|
| `FDFormal/Jacobian.lean` | the homogeneous Jacobian `J0 t = 2(1−cos t) − t sin t`: positivity on `(0, 2π)`, the simple zero at `2π` (`J0' = −2π`), the small-time limit `J0/t⁴ → 1/12` |
| `FDFormal/Lorentz.lean` | Lemma 1.3's sign: sum identity + the trajectory (`HasDerivAt`) form of `u̇ = −wFu` |
| `FDFormal/EllipticStep.lean` | Theorem B's tan-half-angle factorization, the substitution relation, the modulus `k = 2ε` |
| `FDFormal/CriticalGradient.lean` | Corollary B2's subcritical algebra (`E > ε`, positive radicand; sharp at `ε = 1/2`) |
| `FDFormal/ForceFree.lean` | real symmetric ⇒ complexified Hermitian ⇒ real spectrum (the no-spiral core) |

## Scope boundary

Formalized: the elementary steps above, exactly as stated in Lean.
Not formalized (see FORMAL.md for reasons): the elliptic period average, the
ε-perturbation certificate (sympy remains the derivation of record,
`artifacts/o6_certificate.json`), the uniform small-time factorization
(structural argument in the article + `run_f3_smalltime_uniform.py`), the
growth-vector flag, anything observational.
