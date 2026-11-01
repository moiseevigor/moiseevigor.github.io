import Lean

namespace ProofAtlas.ScopeComparison
open Lean

/-- Literal de Bruijn weakening, retaining every Expr payload. -/
def lift (e : Expr) (amount cutoff : Nat) : Expr :=
  match e with
  | .bvar i => .bvar (if cutoff ≤ i then i + amount else i)
  | .app f a => .app (lift f amount cutoff) (lift a amount cutoff)
  | .lam n t b bi => .lam n (lift t amount cutoff) (lift b amount (cutoff+1)) bi
  | .forallE n t b bi => .forallE n (lift t amount cutoff) (lift b amount (cutoff+1)) bi
  | .letE n t v b nd => .letE n (lift t amount cutoff) (lift v amount cutoff)
      (lift b amount (cutoff+1)) nd
  | .mdata md b => .mdata md (lift b amount cutoff)
  | .proj n i b => .proj n i (lift b amount cutoff)
  | e => e

def indexAt (amount index depth : Nat) : Nat :=
  if depth ≤ index then index + amount else index

/-- A variable pair is valid at every depth between the two extrema. -/
def IndexOk (amount i j lo hi : Nat) : Prop :=
  (amount = 0 ∧ i = j) ∨
  (0 < amount ∧ ((i = j ∧ i < lo) ∨ (j = i + amount ∧ hi ≤ i)))

theorem indexOk_sound (valid : IndexOk amount i j lo hi)
    (lower : lo ≤ d) (upper : d ≤ hi) : indexAt amount i d = j := by
  unfold IndexOk at valid
  unfold indexAt
  rcases valid with ⟨zero, same⟩ | ⟨positive, alternatives⟩
  · split <;> omega
  · rcases alternatives with ⟨same, localDepth⟩ | ⟨shifted, externalDepth⟩
    · split <;> omega
    · split <;> omega

theorem indexOk_endpoints (ordered : lo ≤ hi) :
    IndexOk amount i j lo hi ↔
      indexAt amount i lo = j ∧ indexAt amount i hi = j := by
  constructor
  · intro valid
    exact ⟨indexOk_sound valid (Nat.le_refl _) ordered,
      indexOk_sound valid ordered (Nat.le_refl _)⟩
  · rintro ⟨left, right⟩
    by_cases zero : amount = 0
    · apply Or.inl
      exact ⟨zero, by simpa [indexAt, zero] using left⟩
    · apply Or.inr
      refine ⟨Nat.pos_of_ne_zero zero, ?_⟩
      by_cases localDepth : i < lo
      · apply Or.inl
        exact ⟨by simpa [indexAt, Nat.not_le.mpr localDepth] using left, localDepth⟩
      · have lower : lo ≤ i := Nat.le_of_not_lt localDepth
        have shifted : i + amount = j := by simpa [indexAt, lower] using left
        apply Or.inr
        refine ⟨shifted.symm, ?_⟩
        by_cases upper : hi ≤ i
        · exact upper
        · have unchanged : i = j := by simpa [indexAt, upper] using right
          omega

/-- The reached depths may have gaps. Only attained extrema and bounds matter. -/
theorem indexOk_depths (D : Nat → Prop) (hasLo : D lo) (hasHi : D hi)
    (bounded : ∀ d, D d → lo ≤ d ∧ d ≤ hi) :
    IndexOk amount i j lo hi ↔ ∀ d, D d → indexAt amount i d = j := by
  constructor
  · intro valid d member
    exact indexOk_sound valid (bounded d member).1 (bounded d member).2
  · intro valid
    apply (indexOk_endpoints (bounded lo hasLo).2).2
    exact ⟨valid lo hasLo, valid hi hasHi⟩

theorem indexOk_narrow (valid : IndexOk amount i j lo hi)
    (lower : lo ≤ lo') (upper : hi' ≤ hi) : IndexOk amount i j lo' hi' := by
  rcases valid with zero | ⟨positive, alternatives⟩
  · exact Or.inl zero
  · apply Or.inr
    refine ⟨positive, ?_⟩
    rcases alternatives with ⟨same, localDepth⟩ | ⟨shifted, externalDepth⟩
    · exact Or.inl ⟨same, Nat.lt_of_lt_of_le localDepth lower⟩
    · exact Or.inr ⟨shifted, Nat.le_trans upper externalDepth⟩

/-- Compositional syntax certificate. A shared pair can receive one range
    containing several different occurrence depths. -/
inductive Match (amount : Nat) : Expr → Expr → Nat → Nat → Prop where
  | bvar (valid : IndexOk amount i j lo hi) : Match amount (.bvar i) (.bvar j) lo hi
  | fvar : Match amount (.fvar fid) (.fvar fid) lo hi
  | mvar : Match amount (.mvar mid) (.mvar mid) lo hi
  | sort : Match amount (.sort u) (.sort u) lo hi
  | const : Match amount (.const name levels) (.const name levels) lo hi
  | lit : Match amount (.lit value) (.lit value) lo hi
  | app (fn : Match amount f g lo hi) (arg : Match amount a b lo hi) :
      Match amount (.app f a) (.app g b) lo hi
  | lam (domain : Match amount t t' lo hi)
      (body : Match amount b b' (lo+1) (hi+1)) :
      Match amount (.lam name t b info) (.lam name t' b' info) lo hi
  | forallE (domain : Match amount t t' lo hi)
      (body : Match amount b b' (lo+1) (hi+1)) :
      Match amount (.forallE name t b info) (.forallE name t' b' info) lo hi
  | letE (domain : Match amount t t' lo hi) (value : Match amount v v' lo hi)
      (body : Match amount b b' (lo+1) (hi+1)) :
      Match amount (.letE name t v b nondep) (.letE name t' v' b' nondep) lo hi
  | mdata (body : Match amount b b' lo hi) :
      Match amount (.mdata data b) (.mdata data b') lo hi
  | proj (body : Match amount b b' lo hi) :
      Match amount (.proj name field b) (.proj name field b') lo hi

theorem match_sound (valid : Match amount a b lo hi) :
    ∀ d, lo ≤ d → d ≤ hi → lift a amount d = b := by
  induction valid with
  | bvar ok =>
    intro d lower upper
    exact congrArg Expr.bvar (indexOk_sound ok lower upper)
  | fvar | mvar | sort | const | lit => intros; rfl
  | app fn arg ihFn ihArg =>
    intro d lower upper
    simp only [lift, ihFn d lower upper, ihArg d lower upper]
  | lam domain body ihDomain ihBody | forallE domain body ihDomain ihBody =>
    intro d lower upper
    have dl : _ ≤ d+1 := Nat.add_le_add_right lower 1
    have du : d+1 ≤ _ := Nat.add_le_add_right upper 1
    simp only [lift, ihDomain d lower upper, ihBody (d+1) dl du]
  | letE domain value body ihDomain ihValue ihBody =>
    intro d lower upper
    have dl : _ ≤ d+1 := Nat.add_le_add_right lower 1
    have du : d+1 ≤ _ := Nat.add_le_add_right upper 1
    simp only [lift, ihDomain d lower upper, ihValue d lower upper, ihBody (d+1) dl du]
  | mdata body ihBody | proj body ihBody =>
    intro d lower upper
    simp only [lift, ihBody d lower upper]

/-- The root comparison is one instance of the same compositional rule. -/
theorem root_match (valid : Match amount a b 0 0) : lift a amount 0 = b :=
  match_sound valid 0 (Nat.le_refl _) (Nat.le_refl _)

theorem match_narrow (valid : Match amount a b lo hi) :
    ∀ lo' hi', lo ≤ lo' → hi' ≤ hi → Match amount a b lo' hi' := by
  induction valid with
  | bvar ok =>
    intro lo' hi' lower upper
    exact Match.bvar (indexOk_narrow ok lower upper)
  | fvar => intros; exact Match.fvar
  | mvar => intros; exact Match.mvar
  | sort => intros; exact Match.sort
  | const => intros; exact Match.const
  | lit => intros; exact Match.lit
  | app fn arg ihFn ihArg =>
    intro lo' hi' lower upper
    exact Match.app (ihFn lo' hi' lower upper) (ihArg lo' hi' lower upper)
  | lam domain body ihDomain ihBody =>
    intro lo' hi' lower upper
    exact Match.lam (ihDomain lo' hi' lower upper)
      (ihBody (lo'+1) (hi'+1) (Nat.add_le_add_right lower 1) (Nat.add_le_add_right upper 1))
  | forallE domain body ihDomain ihBody =>
    intro lo' hi' lower upper
    exact Match.forallE (ihDomain lo' hi' lower upper)
      (ihBody (lo'+1) (hi'+1) (Nat.add_le_add_right lower 1) (Nat.add_le_add_right upper 1))
  | letE domain value body ihDomain ihValue ihBody =>
    intro lo' hi' lower upper
    exact Match.letE (ihDomain lo' hi' lower upper) (ihValue lo' hi' lower upper)
      (ihBody (lo'+1) (hi'+1) (Nat.add_le_add_right lower 1) (Nat.add_le_add_right upper 1))
  | mdata body ihBody =>
    intro lo' hi' lower upper
    exact Match.mdata (ihBody lo' hi' lower upper)
  | proj body ihBody =>
    intro lo' hi' lower upper
    exact Match.proj (ihBody lo' hi' lower upper)

/-- A shared bvar zero cannot be uniformly shifted at both depths. -/
theorem mixed_local_external_refused (positive : 0 < amount) :
    ¬ IndexOk amount 0 amount 0 1 := by
  unfold IndexOk
  omega

def reordered (index : Fin 3) : Fin 5 :=
  if index.val = 0 then 2 else if index.val = 1 then 0 else 4

theorem reordered_injective : Function.Injective reordered := by
  intro i j same
  have equalValues := congrArg Fin.val same
  have hi := i.isLt
  have hj := j.isLt
  apply Fin.ext
  by_cases i0 : i.val = 0 <;> by_cases i1 : i.val = 1 <;>
    by_cases j0 : j.val = 0 <;> by_cases j1 : j.val = 1 <;>
    simp [reordered, i0, i1, j0, j1] at equalValues <;> omega

/-- A source bvar two under zero, one or two local binders, transported
    through the same injective but reordered external-context map. -/
def reorderedIndexAt (depth : Fin 3) : Nat :=
  (reordered ⟨2 - depth.val, by omega⟩).val + depth.val

theorem reordered_extrema_counterexample :
    reorderedIndexAt 0 = 4 ∧ reorderedIndexAt 2 = 4 ∧ reorderedIndexAt 1 ≠ 4 := by
  decide

#print axioms indexOk_sound
#print axioms indexOk_endpoints
#print axioms indexOk_depths
#print axioms indexOk_narrow
#print axioms match_sound
#print axioms root_match
#print axioms match_narrow
#print axioms mixed_local_external_refused
#print axioms reordered_injective
#print axioms reordered_extrema_counterexample

end ProofAtlas.ScopeComparison
