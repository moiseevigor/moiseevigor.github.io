namespace ProofAtlas.SourceCut
open Lean

/-- Expanded occurrences of one free de Bruijn index, including annotations.
    This is syntax, not typing, fvar support or logical premise necessity. -/
def references : Expr → Nat → Nat
 | .bvar j, i => if i = j then 1 else 0
 | .app f a, i => references f i + references a i
 | .lam _ d b _ , i | .forallE _ d b _, i => references d i + references b (i+1)
 | .letE _ t v b _, i => references t i + references v i + references b (i+1)
 | .mdata _ e, i | .proj _ _ e, i => references e i
 | _, _ => 0

/-- References whose bound-variable occurrence is retained by the source cut. -/
def visibleReferences : {e : Expr} → Cut e → Nat → Nat
 | _, .hole _, _ => 0
 | _, .bvar j, i => if i = j then 1 else 0
 | _, .app f a, i => visibleReferences f i + visibleReferences a i
 | _, .lam _ _ d b, i | _, .forallE _ _ d b, i =>
     visibleReferences d i + visibleReferences b (i+1)
 | _, .letE _ _ t v b, i =>
     visibleReferences t i + visibleReferences v i + visibleReferences b (i+1)
 | _, .mdata _ e, i | _, .proj _ _ e, i => visibleReferences e i
 | _, _, _ => 0

/-- Reference mass remaining in the exact hidden frontiers, with lexical shifts. -/
def hiddenReferences : {e : Expr} → Cut e → Nat → Nat
 | _, .hole e, i => references e i
 | _, .app f a, i => hiddenReferences f i + hiddenReferences a i
 | _, .lam _ _ d b, i | _, .forallE _ _ d b, i =>
     hiddenReferences d i + hiddenReferences b (i+1)
 | _, .letE _ _ t v b, i =>
     hiddenReferences t i + hiddenReferences v i + hiddenReferences b (i+1)
 | _, .mdata _ e, i | _, .proj _ _ e, i => hiddenReferences e i
 | _, _, _ => 0

theorem reference_partition (c : Cut e) (i : Nat) :
    visibleReferences c i + hiddenReferences c i = references e i := by
 induction c generalizing i with
 | hole | bvar | fvar | mvar | sort | const | lit =>
   simp [references, visibleReferences, hiddenReferences]
 | app cf ca hf ha =>
   have p := hf i
   have q := ha i
   simp only [references, visibleReferences, hiddenReferences]
   omega
 | lam n bi cd cb hd hb | forallE n bi cd cb hd hb =>
   have p := hd i
   have q := hb (i+1)
   simp only [references, visibleReferences, hiddenReferences]
   omega
 | letE n nd ct cv cb ht hv hb =>
   have p := ht i
   have q := hv i
   have r := hb (i+1)
   simp only [references, visibleReferences, hiddenReferences]
   omega
 | mdata d ce he | proj n j ce he =>
   simp only [references, visibleReferences, hiddenReferences]
   exact he i

theorem visible_references_monotone (h : Refines c c') (i : Nat) :
    visibleReferences c i ≤ visibleReferences c' i := by
 induction h generalizing i with
 | fill | bvar | fvar | mvar | sort | const | lit => simp [visibleReferences]
 | app hf ha ihf iha =>
   exact Nat.add_le_add (ihf i) (iha i)
 | lam n bi hd hb ihd ihb | forallE n bi hd hb ihd ihb =>
   exact Nat.add_le_add (ihd i) (ihb (i+1))
 | letE n nd ht hv hb iht ihv ihb =>
   exact Nat.add_le_add (Nat.add_le_add (iht i) (ihv i)) (ihb (i+1))
 | mdata d he ihe | proj n j he ihe => exact ihe i

theorem hidden_references_antitone (h : Refines c c') (i : Nat) :
    hiddenReferences c' i ≤ hiddenReferences c i := by
 have p := reference_partition c i
 have q := reference_partition c' i
 have m := visible_references_monotone h i
 omega

theorem exact_reference_transfer (h : Refines c c') (i : Nat) :
    visibleReferences c' i - visibleReferences c i =
      hiddenReferences c i - hiddenReferences c' i := by
 have p := reference_partition c i
 have q := reference_partition c' i
 have m := visible_references_monotone h i
 omega

theorem reference_present_iff (c : Cut e) (i : Nat) :
    0 < references e i ↔
      0 < visibleReferences c i ∨ 0 < hiddenReferences c i := by
 rw [← reference_partition c i]
 cases visibleReferences c i <;> simp [Nat.succ_add]

theorem reference_absent_iff (c : Cut e) (i : Nat) :
    references e i = 0 ↔
      visibleReferences c i = 0 ∧ hiddenReferences c i = 0 := by
 rw [← reference_partition c i]
 exact Nat.add_eq_zero_iff

theorem references_bounded (e : Expr) (i : Nat) :
    references e i ≤ occurrences e := by
 induction e generalizing i with
 | bvar j => simp only [references, occurrences]; split <;> omega
 | fvar | mvar | sort | const | lit => simp [references, occurrences]
 | app f a hf ha =>
   have h₁ := hf i
   have h₂ := ha i
   simp only [references, occurrences]
   omega
 | lam n d b bi hd hb | forallE n d b bi hd hb =>
   have h₁ := hd i
   have h₂ := hb (i+1)
   simp only [references, occurrences]
   omega
 | letE n t v b nd ht hv hb =>
   have h₁ := ht i
   have h₂ := hv i
   have h₃ := hb (i+1)
   simp only [references, occurrences]
   omega
 | mdata d e he | proj n j e he =>
   have h := he i
   simp only [references, occurrences]
   omega

/-- Counts respect the source telescope: the new binder scopes over the body
    only, even if Lean marks the let as nondependent. -/
theorem let_reference_fields (n : Name) (t v b : Expr) (nd : Bool) (i : Nat) :
    references (.letE n t v b nd) i =
      references t i + references v i + references b (i+1) := rfl

theorem lambda_reference_fields (n : Name) (d b : Expr) (bi : BinderInfo) (i : Nat) :
    references (.lam n d b bi) i = references d i + references b (i+1) := rfl

theorem pi_reference_fields (n : Name) (d b : Expr) (bi : BinderInfo) (i : Nat) :
    references (.forallE n d b bi) i = references d i + references b (i+1) := rfl

end ProofAtlas.SourceCut
