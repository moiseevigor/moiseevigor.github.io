import Lean

/- Constructor-level recovery for captured source expressions. These laws use
   actual Lean.Expr values. They do not establish typing of the represented
   mathematical terms or refinement of the stateful native matcher. -/
namespace ProofAtlas.SourceRecovery
open Lean

/-- Local binder depth; free variables keep their separate context identity. -/
def Scoped : Expr → Nat → Prop
  | .bvar i, d => i < d
  | .app f a, d => Scoped f d ∧ Scoped a d
  | .lam _ t b _, d | .forallE _ t b _, d => Scoped t d ∧ Scoped b (d+1)
  | .letE _ t v b _, d => Scoped t d ∧ Scoped v d ∧ Scoped b (d+1)
  | .mdata _ b, d | .proj _ _ b, d => Scoped b d
  | _, _ => True

/-- Simultaneous free-variable recovery, with no recursion into an inserted
    image. ClosedImages is required for the capture-safety law below. -/
def plug (σ : FVarId → Expr) : Expr → Expr
  | .fvar id => σ id
  | .app f a => .app (plug σ f) (plug σ a)
  | .lam n t b bi => .lam n (plug σ t) (plug σ b) bi
  | .forallE n t b bi => .forallE n (plug σ t) (plug σ b) bi
  | .letE n t v b nd => .letE n (plug σ t) (plug σ v) (plug σ b) nd
  | .mdata data b => .mdata data (plug σ b)
  | .proj n i b => .proj n i (plug σ b)
  | e => e

def ClosedImages (σ : FVarId → Expr) : Prop := ∀ id, Scoped (σ id) 0

theorem scoped_mono {e : Expr} {d n : Nat} (h : Scoped e d) (le : d ≤ n) :
    Scoped e n := by
  induction e generalizing d n with
  | bvar i => exact Nat.lt_of_lt_of_le h le
  | fvar _ | mvar _ | sort _ | const _ _ | lit _ => trivial
  | app _ _ ihf iha => exact ⟨ihf h.1 le, iha h.2 le⟩
  | lam _ _ _ _ iht ihb | forallE _ _ _ _ iht ihb =>
    exact ⟨iht h.1 le, ihb h.2 (Nat.succ_le_succ le)⟩
  | letE _ _ _ _ _ iht ihv ihb =>
    exact ⟨iht h.1 le, ihv h.2.1 le, ihb h.2.2 (Nat.succ_le_succ le)⟩
  | mdata _ _ ih | proj _ _ _ ih => exact ih h le

theorem plug_scoped (σ : FVarId → Expr) (closed : ClosedImages σ)
    {e : Expr} {d : Nat} (h : Scoped e d) : Scoped (plug σ e) d := by
  induction e generalizing d <;> simp only [plug, Scoped] at * <;> simp_all
  exact scoped_mono (closed _) (Nat.zero_le _)

theorem plug_compose (σ τ : FVarId → Expr) (e : Expr) :
    plug σ (plug τ e) = plug (fun id => plug σ (τ id)) e := by
  induction e <;> simp_all [plug]

theorem closed_compose {σ τ : FVarId → Expr}
    (hσ : ClosedImages σ) (hτ : ClosedImages τ) :
    ClosedImages (fun id => plug σ (τ id)) := fun id => plug_scoped σ hσ (hτ id)

/-- A constructor-preserving source-to-template certificate. A cut replaces a
    closed source expression by a named free variable whose image is that exact
    source. Unchanged source free variables require an explicit identity image.
    Names, universes, metadata and binder flags are preserved by constructors. -/
inductive Rewrite (σ : FVarId → Expr) : Expr → Expr → Prop
  | capture (source : Expr) (id : FVarId) (image : σ id = source)
      (closed : Scoped source 0) : Rewrite σ source (.fvar id)
  | bvar (i : Nat) : Rewrite σ (.bvar i) (.bvar i)
  | fvar (id : FVarId) (fixed : σ id = .fvar id) : Rewrite σ (.fvar id) (.fvar id)
  | mvar (id : MVarId) : Rewrite σ (.mvar id) (.mvar id)
  | sort (u : Level) : Rewrite σ (.sort u) (.sort u)
  | const (n : Name) (us : List Level) : Rewrite σ (.const n us) (.const n us)
  | app {f a f' a'} (hf : Rewrite σ f f') (ha : Rewrite σ a a') :
      Rewrite σ (.app f a) (.app f' a')
  | lam (n : Name) (bi : BinderInfo) {t b t' b'}
      (ht : Rewrite σ t t') (hb : Rewrite σ b b') :
      Rewrite σ (.lam n t b bi) (.lam n t' b' bi)
  | forallE (n : Name) (bi : BinderInfo) {t b t' b'}
      (ht : Rewrite σ t t') (hb : Rewrite σ b b') :
      Rewrite σ (.forallE n t b bi) (.forallE n t' b' bi)
  | letE (n : Name) (nd : Bool) {t v b t' v' b'}
      (ht : Rewrite σ t t') (hv : Rewrite σ v v') (hb : Rewrite σ b b') :
      Rewrite σ (.letE n t v b nd) (.letE n t' v' b' nd)
  | lit (l : Literal) : Rewrite σ (.lit l) (.lit l)
  | mdata (data : MData) {b b'} (hb : Rewrite σ b b') :
      Rewrite σ (.mdata data b) (.mdata data b')
  | proj (n : Name) (i : Nat) {b b'} (hb : Rewrite σ b b') :
      Rewrite σ (.proj n i b) (.proj n i b')

theorem recovery {σ : FVarId → Expr} {source template : Expr}
    (h : Rewrite σ source template) : plug σ template = source := by
  induction h <;> simp_all [plug]

theorem template_scoped {σ : FVarId → Expr} {source template : Expr}
    (h : Rewrite σ source template) {d : Nat} (hs : Scoped source d) :
    Scoped template d := by
  induction h generalizing d <;> simp_all [Scoped]

theorem same_template_same_source {σ : FVarId → Expr} {a b template : Expr}
    (ha : Rewrite σ a template) (hb : Rewrite σ b template) : a = b := by
  rw [← recovery ha, recovery hb]

theorem two_stage_recovery {σ τ : FVarId → Expr} {source middle final : Expr}
    (first : Rewrite σ source middle) (second : Rewrite τ middle final) :
    plug (fun id => plug σ (τ id)) final = source := by
  rw [← plug_compose, recovery second, recovery first]

def occurrences : Expr → Nat
  | .app f a => 1 + occurrences f + occurrences a
  | .lam _ t b _ | .forallE _ t b _ => 1 + occurrences t + occurrences b
  | .letE _ t v b _ => 1 + occurrences t + occurrences v + occurrences b
  | .mdata _ b | .proj _ _ b => 1 + occurrences b
  | _ => 1

/-- A capture port accounts for its complete recovery image, not one leaf. -/
def weighted (σ : FVarId → Expr) : Expr → Nat
  | .fvar id => occurrences (σ id)
  | .app f a => 1 + weighted σ f + weighted σ a
  | .lam _ t b _ | .forallE _ t b _ => 1 + weighted σ t + weighted σ b
  | .letE _ t v b _ => 1 + weighted σ t + weighted σ v + weighted σ b
  | .mdata _ b | .proj _ _ b => 1 + weighted σ b
  | _ => 1

theorem plug_count (σ : FVarId → Expr) (e : Expr) :
    occurrences (plug σ e) = weighted σ e := by
  induction e <;> simp_all [plug, occurrences, weighted]

theorem recovery_count {σ : FVarId → Expr} {source template : Expr}
    (h : Rewrite σ source template) : weighted σ template = occurrences source := by
  rw [← plug_count, recovery h]

theorem open_cut_refused (σ : FVarId → Expr) (id : FVarId) :
    ¬ Rewrite σ (.bvar 0) (.fvar id) := by
  intro h
  cases h with
  | capture _ _ _ closed => exact Nat.not_lt_zero _ closed

theorem open_image_breaks_scope (id : FVarId) :
    Scoped (.fvar id) 0 ∧ ¬ Scoped (plug (fun _ => .bvar 0) (.fvar id)) 0 := by
  simp [Scoped, plug]

/- A template without its recovery assignment does not identify its source.
   These are ordinary typed Nat functions, separate from Expr-as-data laws. -/
def capturedFunction (a x : Nat) := x + a
theorem capture_17 : capturedFunction 17 = (fun x => x + 17) := rfl
theorem capture_18 : capturedFunction 18 = (fun x => x + 18) := rfl
theorem distinct_specializations : capturedFunction 17 0 ≠ capturedFunction 18 0 := by
  decide

end ProofAtlas.SourceRecovery
