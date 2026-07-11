# E6 — the local symmetry group of the cosmic web, validated against Doroshkevich (1970)

Phase B of [`PLAN-astrophysics-local-groups.md`](PLAN-astrophysics-local-groups.md).
Reproduce: `.venv/bin/python scripts/run_e6.py` → `artifacts/e6_results.json`.

**This is the programme's first external validation.** Every prediction tested here is
an analytic result from the literature that we did not generate.

## The question

E5 established that gravity has no sub-Riemannian structure, so the growth vector is the
wrong tool. But the user's intuition — *globally not a group, locally maybe* — is right;
the group is simply a different one. At each Lagrangian point the deformation tensor
$T_{ij} = \partial_i\partial_j\Phi$ is a symmetric $3\times3$ form, and its **local
isotropy (stabilizer) group** is fixed by eigenvalue degeneracy:

| Eigenvalues | Local group | Codim | Caustic |
|---|---|---|---|
| $\lambda_1>\lambda_2>\lambda_3$ (triaxial) | discrete $\mathbb{Z}_2\times\mathbb{Z}_2$ | 0 | $A_2$ walls, $A_3$ filaments, $A_4$ nodes |
| two equal (axisymmetric) | continuous $\mathrm{SO}(2)$ | 2 | on the $D_4$ umbilic locus |
| all three equal | $\mathrm{SO}(3)$ | 5 | isolated |

**Read from the source** (Feldbrugge et al. 2018, [arXiv:1703.09598](https://arxiv.org/abs/1703.09598),
via ar5iv — secondary summaries conflicted and were *wrong*): the caustic conditions are
stated in **Lagrangian space**; $A_2$ fold ($1+\mu_i=0$) → **walls**; $A_3$ cusp (fold plus
$v_i\cdot\nabla\mu_i = 0$) → **filaments**; $A_4$ → **cluster nodes**. $D_4$ umbilic is
**corank 2**: *two* eigenvalue fields at the fold simultaneously — i.e. degeneracy **and**
fold.

## External predictions tested (Doroshkevich 1970)

At any point of a Gaussian field the Hessian is a random symmetric matrix with the
isotropic covariance $\langle T_{ij}T_{kl}\rangle = \frac{\sigma^2}{15}
(\delta_{ij}\delta_{kl}+\delta_{ik}\delta_{jl}+\delta_{il}\delta_{jk})$, $\sigma^2 =
\langle\delta^2\rangle$. Splitting $T = \frac{\delta}{3}I + \tilde T$ with $\tilde T$
traceless gives the eigenvalue density

$$
p(\lambda_1,\lambda_2,\lambda_3) \;\propto\;
\exp\!\Big[-\tfrac{3}{\sigma^2}I_1^2 + \tfrac{15}{2\sigma^2}I_2\Big]\;
\underbrace{(\lambda_1-\lambda_2)(\lambda_1-\lambda_3)(\lambda_2-\lambda_3)}_{\textbf{Vandermonde}}
$$

The Vandermonde factor forces **eigenvalue repulsion** — degeneracies, i.e. the points of
enhanced local $\mathrm{SO}(2)$ symmetry, are strongly suppressed.

## Results ($96^3$ Gaussian field, $\sigma = 0.1132$)

**P1 — the analytic covariance (validates our FFT deformation tensor).**

```
max|trace(T) - delta| / sigma = 1.96e-15     (theory: 0)
Var(T_00)/sigma^2 = 0.2025                   (theory 1/5  = 0.2000)
Var(T_01)/sigma^2 = 0.0664                   (theory 1/15 = 0.0667)
```

**P2 — the eigenvalue law matches the 1970 prediction.**

```
              KS D      <lambda>/sigma measured    theory
lambda1      0.0023           +0.5358            +0.5353
lambda2      0.0029           -0.0012            -0.0000
lambda3      0.0018           -0.5346            -0.5356
```

Agreement to ~0.1%. **This is the first time anything in this repository has been checked
against a criterion it did not invent.**

**P3 — eigenvalue repulsion, and the codimension of the local-group stratum.**

```
p(min gap = s) ~ s^alpha :  measured alpha = 0.973   (theory 1.0, from the Vandermonde)
no-repulsion null        :  alpha = -0.070           (does NOT vanish at s->0)
P(min gap < s) ~ s^beta  :  measured beta  = 1.944   (theory 2.0)
```

The null (three eigenvalues drawn independently from the pooled marginal) shows no
suppression at $s\to0$; the real field's gap density vanishes linearly. Hence the
$\mathrm{SO}(2)$ stratum has **codimension 2**: it is a set of **curves** in 3D Lagrangian
space.

**Local-group census** — the $s^2$ scaling is visible directly:

```
within 0.10 sigma of SO(2) degeneracy:  5.508% of volume
within 0.03 sigma of SO(2) degeneracy:  0.513% of volume   (ratio 10.7; s^2 predicts 11.1)
within 0.01 sigma of SO(2) degeneracy:  0.055% of volume   (ratio  9.3; s^2 predicts  9.0)
```

## Answer to the question

**Yes, local groups are detectable in cosmic structure — and they are not the groups this
series' technique looks for.**

- The generic point of the cosmic web has only a **discrete** symmetry (triaxial
  deformation tensor). There is no continuous local group almost everywhere.
- Points of continuous $\mathrm{SO}(2)$ symmetry (axisymmetric deformation) form
  **codimension-2 curves**, and they are *statistically suppressed by eigenvalue
  repulsion* — a 1970 law, here confirmed at $\alpha = 0.973$ vs the predicted 1.
- $\mathrm{SO}(3)$ (fully isotropic) points are higher codimension still.
- The $D_4$ **umbilic caustics** are exactly where an $\mathrm{SO}(2)$ degeneracy coincides
  with the fold condition (corank 2) — codimension 3, i.e. **isolated points**.

So: **local-group detection in the cosmic web is eigenvalue-degeneracy detection is umbilic
caustic classification.** All three are the same measurement, and it is made from the
deformation tensor, never from a growth vector. Astrophysics already has the machinery
(the caustic skeleton); the right basis-free degeneracy detector is the discriminant
$\Delta = \prod_{i<j}(\lambda_i-\lambda_j)^2$, which vanishes precisely on the stratum and
needs no eigendecomposition.

## Honest caveats

1. The field here is a Gaussian random field (the primordial/linear regime), which is where
   Doroshkevich's law applies exactly. Non-linear evolution makes the deformation-tensor
   statistics non-Gaussian; the repulsion exponent is expected to survive (it is a
   symmetry/Jacobian effect, not a Gaussianity effect) but this was not tested here.
2. We measured the degeneracy stratum's codimension, not the $D_4$ set itself. Locating
   $D_4$ points requires intersecting the degeneracy locus with the fold condition
   $D\lambda_i = 1$ — straightforward but not done here.
3. The "external validation" validates our *implementation* against published analytic
   theory. It is not a discovery. Its value is that a wrong deformation tensor, a wrong
   sign convention, or a non-Gaussian field would all have shown up — and none did.
4. An early run showed `Var(T_00)/sigma^2 = 0.165` against theory `0.200`. This was **not**
   a bug: by Parseval the measured ratio is the *realization-weighted* $\langle\hat n_1^4
   \rangle$, and heavy smoothing had left only ~100 independent modes. Increasing the mode
   count restored agreement. Logged because it is exactly the kind of near-miss that
   invites a spurious "discovery".

## Consequence for the plan

Phase B's core is done and its verdict is clean. H-C (does the isotropy stratification beat
T-web as a descriptor?) remains open and is expected to be a **null** — the stratification is
equivalent to known caustic conditions, not new physics. Phase C (magnetized plasma, where a
genuine nonholonomic constraint exists) is the remaining constructive question: does this
technique have *any* astrophysical home?
