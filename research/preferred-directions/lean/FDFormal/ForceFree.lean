/-
F1e — the linear-algebra core of the force-free radial-nulls theorem
(Part 5 / article Corollary; narrowed scope per the reviews: smooth
force-free extrapolations with bounded α).

The physics step — at a null of a field with `J = α B`, the current vanishes,
so `curl B = 0` there and the Jacobian `∇B` is symmetric — is a two-line
identity documented in the article; the mathematical content is: a real
symmetric matrix has only real eigenvalues, hence no spiral (complex-pair)
null type. That content is machine-checked here for any finite dimension,
via mathlib's spectral theorem for Hermitian matrices.
-/
import Mathlib

namespace FDFormal

open Matrix

/-- A real symmetric matrix, complexified, is Hermitian. -/
theorem isHermitian_map_ofReal_of_isSymm {m : ℕ} (M : Matrix (Fin m) (Fin m) ℝ)
    (hM : M.IsSymm) : (M.map (Complex.ofReal ·)).IsHermitian := by
  have hsym : ∀ i j, M j i = M i j := fun i j => by
    have h := congrFun (congrFun hM i) j
    simpa [Matrix.transpose_apply] using h
  show (M.map (Complex.ofReal ·))ᴴ = M.map (Complex.ofReal ·)
  ext i j
  simp [Matrix.conjTranspose_apply, Matrix.map_apply, Complex.conj_ofReal,
    hsym i j]

/-- **Real symmetric ⇒ real spectrum**: every complex eigenvalue of a real
symmetric matrix has zero imaginary part. Applied at a force-free null
(`∇B` symmetric because the current vanishes with the field), this is the
"no spiral nulls" theorem's mathematical core. -/
theorem spectrum_real_of_isSymm {m : ℕ} (M : Matrix (Fin m) (Fin m) ℝ)
    (hM : M.IsSymm) :
    ∀ μ ∈ spectrum ℂ (M.map (Complex.ofReal ·)), μ.im = 0 := by
  intro μ hμ
  have hH := isHermitian_map_ofReal_of_isSymm M hM
  rw [hH.spectrum_eq_image_range] at hμ
  obtain ⟨r, -, rfl⟩ := hμ
  simp

/-- The 3×3 instance the null taxonomy uses: a symmetric `∇B` admits no
complex-conjugate (spiral) eigenvalue pair. -/
theorem forcefree_null_no_spiral (M : Matrix (Fin 3) (Fin 3) ℝ) (hM : M.IsSymm) :
    ∀ μ ∈ spectrum ℂ (M.map (Complex.ofReal ·)), μ.im = 0 :=
  spectrum_real_of_isSymm M hM

end FDFormal
