/- Exact free de Bruijn support for the explicit projection function.
   The driver prepends Projection.lean. This does not resolve free-variable IDs,
   expression/universe metavariables, metadata semantics or typing contexts. -/
namespace ProofAtlas.Projection

def unbind (xs : List Nat) : List Nat := xs.filterMap fun
 | 0 => none
 | i+1 => some i

def support : Expr → List Nat
 | .bvar i => [i]
 | .app f a => support f ++ support a
 | .lam _ t b _ | .forallE _ t b _ => support t ++ unbind (support b)
 | .letE _ t v b _ => support t ++ support v ++ unbind (support b)
 | .mdata _ e | .proj _ _ e => support e
 | _ => []

def Covered (r : Renaming) (xs : List Nat) : Prop := ∀ i ∈ xs, (r i).isSome = true

theorem covered_append : Covered r (xs ++ ys) ↔ Covered r xs ∧ Covered r ys := by
 simp [Covered, List.mem_append, or_imp, forall_and]

theorem covered_lift : Covered (lift r) xs ↔ Covered r (unbind xs) := by
 induction xs with
 | nil => simp [Covered, unbind]
 | cons i xs ih =>
  cases i with
  | zero => simpa [Covered, unbind, lift] using ih
  | succ i => simpa [Covered, unbind, lift] using and_congr Iff.rfl ih

theorem project_supported : (project r e).isSome = true ↔ Covered r (support e) := by
 induction e generalizing r with
 | bvar i => simp [project, support, Covered]
 | fvar i => simp [project, support, Covered]
 | mvar i => simp [project, support, Covered]
 | sort u => simp [project, support, Covered]
 | const n us => simp [project, support, Covered]
 | lit l => simp [project, support, Covered]
 | app f a ihf iha =>
  rw [support, covered_append, ← ihf, ← iha]
  cases hf : project r f <;> cases ha : project r a <;> simp [project, hf, ha]
 | lam n t b bi iht ihb =>
  rw [support, covered_append, ← covered_lift, ← iht, ← ihb]
  cases ht : project r t <;> cases hb : project (lift r) b <;> simp [project, ht, hb]
 | forallE n t b bi iht ihb =>
  rw [support, covered_append, ← covered_lift, ← iht, ← ihb]
  cases ht : project r t <;> cases hb : project (lift r) b <;> simp [project, ht, hb]
 | letE n t v b nd iht ihv ihb =>
  rw [support, covered_append, covered_append, ← covered_lift, ← iht, ← ihv, ← ihb]
  cases ht : project r t <;> cases hv : project r v <;> cases hb : project (lift r) b <;> simp [project, ht, hv, hb]
 | mdata d e ih =>
  rw [support, ← ih]
  cases hx : project r e <;> simp [project, hx]
 | proj n i e ih =>
  rw [support, ← ih]
  cases hx : project r e <;> simp [project, hx]

def needed : Expr → Nat
 | .bvar i => i+1
 | .app f a => max (needed f) (needed a)
 | .lam _ t b _ | .forallE _ t b _ => max (needed t) (needed b-1)
 | .letE _ t v b _ => max (max (needed t) (needed v)) (needed b-1)
 | .mdata _ e | .proj _ _ e => needed e
 | _ => 0

def Below (xs : List Nat) (d : Nat) : Prop := ∀ i ∈ xs, i < d

theorem below_append : Below (xs ++ ys) d ↔ Below xs d ∧ Below ys d := by
 simp [Below, List.mem_append, or_imp, forall_and]

theorem below_unbind : Below (unbind xs) d ↔ Below xs (d+1) := by
 induction xs with
 | nil => simp [Below, unbind]
 | cons i xs ih =>
  cases i with
  | zero => simpa [Below, unbind] using ih
  | succ i => simpa [Below, unbind, Nat.succ_lt_succ_iff] using and_congr Iff.rfl ih

theorem needed_bound : needed e ≤ d ↔ Below (support e) d := by
 induction e generalizing d with
 | bvar i => simp [needed, support, Below, Nat.succ_le_iff]
 | fvar i => simp [needed, support, Below]
 | mvar i => simp [needed, support, Below]
 | sort u => simp [needed, support, Below]
 | const n us => simp [needed, support, Below]
 | lit l => simp [needed, support, Below]
 | app f a ihf iha => simp [needed, support, below_append, Nat.max_le, ihf, iha]
 | lam n t b bi iht ihb =>
  rw [needed, support, below_append, below_unbind]
  have sub : needed b - 1 ≤ d ↔ needed b ≤ d+1 := by omega
  simp [Nat.max_le, sub, iht, ihb]
 | forallE n t b bi iht ihb =>
  rw [needed, support, below_append, below_unbind]
  have sub : needed b - 1 ≤ d ↔ needed b ≤ d+1 := by omega
  simp [Nat.max_le, sub, iht, ihb]
 | letE n t v b nd iht ihv ihb =>
  rw [needed, support, below_append, below_append, below_unbind]
  have sub : needed b - 1 ≤ d ↔ needed b ≤ d+1 := by omega
  simp [Nat.max_le, sub, iht, ihv, ihb, and_assoc]
 | mdata d e ih => simpa [needed, support] using ih
 | proj n i e ih => simpa [needed, support] using ih

theorem needed_zero_iff : needed e = 0 ↔ support e = [] := by
 constructor
 · intro h
   apply List.eq_nil_iff_forall_not_mem.mpr
   intro i hi
   have bound := (needed_bound (e:=e) (d:=0)).mp (Nat.le_of_eq h) i hi
   omega
 · intro h
   have bound : Below (support e) 0 := by simp [Below, h]
   have := (needed_bound (e:=e) (d:=0)).mpr bound
   omega

def onlyOuter : Expr := .bvar 2

def outerAndInner : Expr := .app (.app (mkConst ``Nat.add) (.bvar 2)) (.bvar 0)

theorem maximum_is_not_support :
    needed onlyOuter = needed outerAndInner ∧
    project (select [2]) onlyOuter = some (.bvar 0) ∧
    project (select [2]) outerAndInner = none := by
 exact ⟨rfl,rfl,rfl⟩

end ProofAtlas.Projection
