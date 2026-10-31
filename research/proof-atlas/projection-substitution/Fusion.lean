import Lean

/- Loaded after the frozen context-projection/Projection.lean and
   expr-reference-laws/Reference.lean definitions. These are structural laws
   for actual Lean.Expr, not typing judgments or native-extern refinements. -/
namespace ProofAtlas.Projection
open Lean

theorem liftN_succ (c : Nat) (r : Renaming) : liftN (c+1) r = lift (liftN c r) := rfl

theorem project_lift (e : Expr) (r : Renaming) (c k : Nat) :
    project (liftN (c+k) r) (AtlasExprReference.lift e k c) =
      (project (liftN c r) e).map (fun e' => AtlasExprReference.lift e' k c) := by
  induction e generalizing c with
  | bvar i =>
    by_cases h : i < c
    · have h' : i < c+k := by omega
      simp [AtlasExprReference.lift, project, Nat.not_le.mpr h,
        liftN_below h, liftN_below h']
    · have hi : i = c+(i-c) := by omega
      have hik : i+k = (c+k)+(i-c) := by omega
      simp only [AtlasExprReference.lift, project, if_pos (show c ≤ i by omega)]
      have hp := liftN_above (r:=r) c (i-c)
      have hp' := liftN_above (r:=r) (c+k) (i-c)
      rw [← hi] at hp
      rw [← hik] at hp'
      rw [hp, hp']
      cases hr : r (i-c) <;> simp [AtlasExprReference.lift, Nat.add_comm, Nat.add_left_comm]
  | fvar _ | mvar _ | sort _ | const _ _ | lit _ => rfl
  | app f a ihf iha =>
    simp only [AtlasExprReference.lift, project, ihf, iha]
    cases project (liftN c r) f <;> cases project (liftN c r) a <;> rfl
  | lam n t b bi iht ihb =>
    simp only [AtlasExprReference.lift, project, ← liftN_succ]
    rw [show c+k+1 = (c+1)+k by omega, iht, ihb]
    cases project (liftN c r) t <;> cases project (liftN (c+1) r) b <;> rfl
  | forallE n t b bi iht ihb =>
    simp only [AtlasExprReference.lift, project, ← liftN_succ]
    rw [show c+k+1 = (c+1)+k by omega, iht, ihb]
    cases project (liftN c r) t <;> cases project (liftN (c+1) r) b <;> rfl
  | letE n t v b nd iht ihv ihb =>
    simp only [AtlasExprReference.lift, project, ← liftN_succ]
    rw [show c+k+1 = (c+1)+k by omega, iht, ihv, ihb]
    cases project (liftN c r) t <;> cases project (liftN c r) v <;>
      cases project (liftN (c+1) r) b <;> rfl
  | mdata d e ih =>
    simp only [AtlasExprReference.lift, project, ih]
    cases project (liftN c r) e <;> rfl
  | proj n i e ih =>
    simp only [AtlasExprReference.lift, project, ih]
    cases project (liftN c r) e <;> rfl

theorem project_substitute (e v v' : Expr) (r : Renaming) (d : Nat)
    (hv : project r v = some v') :
    project (liftN d r) (AtlasExprReference.substitute e v d) =
      (project (liftN (d+1) r) e).map
        (fun e' => AtlasExprReference.substitute e' v' d) := by
  induction e generalizing d with
  | bvar i =>
    by_cases he : i = d
    · subst i
      have hp := project_lift v r 0 d
      simp only [Nat.zero_add, liftN] at hp
      rw [hv] at hp
      simp only [Option.map_some] at hp
      simpa [project, liftN_below (show d < d+1 by omega), AtlasExprReference.substitute] using hp
    · by_cases hl : i < d
      · simp [AtlasExprReference.substitute, he, show ¬d < i by omega,
          project, liftN_below hl, liftN_below (show i < d+1 by omega)]
      · have hd : d < i := by omega
        have hb : i = (d+1)+(i-(d+1)) := by omega
        have ha : i-1 = d+(i-(d+1)) := by omega
        have hp := liftN_above (r:=r) (d+1) (i-(d+1))
        have hq := liftN_above (r:=r) d (i-(d+1))
        rw [← hb] at hp
        rw [← ha] at hq
        simp only [AtlasExprReference.substitute, if_neg he, if_pos hd, project, hp, hq]
        cases hr : r (i-(d+1)) with
        | none => rfl
        | some j =>
          simp [AtlasExprReference.substitute, show d+1+j ≠ d by omega,
            show d < d+1+j by omega]
  | fvar _ | mvar _ | sort _ | const _ _ | lit _ => rfl
  | app f a ihf iha =>
    simp only [AtlasExprReference.substitute, project, ihf, iha]
    cases project (liftN (d+1) r) f <;> cases project (liftN (d+1) r) a <;> rfl
  | lam n t b bi iht ihb =>
    simp only [AtlasExprReference.substitute, project, ← liftN_succ]
    rw [iht, ihb]
    cases project (liftN (d+1) r) t <;> cases project (liftN ((d+1)+1) r) b <;> rfl
  | forallE n t b bi iht ihb =>
    simp only [AtlasExprReference.substitute, project, ← liftN_succ]
    rw [iht, ihb]
    cases project (liftN (d+1) r) t <;> cases project (liftN ((d+1)+1) r) b <;> rfl
  | letE n t w b nd iht ihw ihb =>
    simp only [AtlasExprReference.substitute, project, ← liftN_succ]
    rw [iht, ihw, ihb]
    cases project (liftN (d+1) r) t <;> cases project (liftN (d+1) r) w <;>
      cases project (liftN ((d+1)+1) r) b <;> rfl
  | mdata md e ih =>
    simp only [AtlasExprReference.substitute, project, ih]
    cases project (liftN (d+1) r) e <;> rfl
  | proj n i e ih =>
    simp only [AtlasExprReference.substitute, project, ih]
    cases project (liftN (d+1) r) e <;> rfl

theorem project_instantiate (e v v' : Expr) (r : Renaming)
    (hv : project r v = some v') :
    project r (AtlasExprReference.substitute e v 0) =
      (project (lift r) e).map (fun e' => AtlasExprReference.substitute e' v' 0) :=
  project_substitute e v v' r 0 hv

/- Eagerly projecting an unused replacement is stricter than projecting the
   substituted term. The success premise above cannot be dropped by replacing
   its right-hand side with an unconditional Option.bind on the replacement. -/
theorem unused_replacement_counterexample :
    project (fun _ => none)
      (AtlasExprReference.substitute (.const ``Nat []) (.bvar 0) 0) = some (.const ``Nat []) ∧
    project (fun _ => none) (.bvar 0) = none := by
  constructor <;> rfl

end ProofAtlas.Projection
