import ContextFrame

/- Capture-avoiding substitution on actual Lean.Expr data. The equations below
   describe syntax and explicit binder scope, not the Lean kernel typing rules
   or a refinement proof for native instantiate/replace implementations. -/
namespace ProofAtlas.ContextInstantiation
open Lean
open ProofAtlas.ContextFrame

abbrev Renaming := Nat → Nat
abbrev Substitution := Nat → Expr

def upRen (ρ : Renaming) : Renaming
  | 0 => 0
  | i+1 => ρ i + 1

def rename (ρ : Renaming) : Expr → Expr
  | .bvar i => .bvar (ρ i)
  | .app f a => .app (rename ρ f) (rename ρ a)
  | .lam n t b bi => .lam n (rename ρ t) (rename (upRen ρ) b) bi
  | .forallE n t b bi => .forallE n (rename ρ t) (rename (upRen ρ) b) bi
  | .letE n t v b nd => .letE n (rename ρ t) (rename ρ v) (rename (upRen ρ) b) nd
  | .mdata d b => .mdata d (rename ρ b)
  | .proj n i b => .proj n i (rename ρ b)
  | e => e

theorem upRen_id : upRen id = id := by funext i; cases i <;> rfl
theorem upRen_comp (ρ τ : Renaming) :
    upRen (fun i => τ (ρ i)) = fun i => upRen τ (upRen ρ i) := by
  funext i; cases i <;> rfl

theorem rename_id (e : Expr) : rename id e = e := by
  induction e <;> simp_all [rename, upRen_id]

theorem rename_comp (ρ τ : Renaming) (e : Expr) :
    rename τ (rename ρ e) = rename (fun i => τ (ρ i)) e := by
  induction e generalizing ρ τ <;> simp_all [rename, upRen_comp]

def upSubst (σ : Substitution) : Substitution
  | 0 => .bvar 0
  | i+1 => rename Nat.succ (σ i)

def subst (σ : Substitution) : Expr → Expr
  | .bvar i => σ i
  | .app f a => .app (subst σ f) (subst σ a)
  | .lam n t b bi => .lam n (subst σ t) (subst (upSubst σ) b) bi
  | .forallE n t b bi => .forallE n (subst σ t) (subst (upSubst σ) b) bi
  | .letE n t v b nd => .letE n (subst σ t) (subst σ v) (subst (upSubst σ) b) nd
  | .mdata d b => .mdata d (subst σ b)
  | .proj n i b => .proj n i (subst σ b)
  | e => e

def variables : Substitution := Expr.bvar

theorem upSubst_variables : upSubst variables = variables := by
  funext i; cases i <;> rfl

theorem subst_variables (e : Expr) : subst variables e = e := by
  induction e <;> simp_all [subst, upSubst_variables]
  all_goals rfl

theorem upSubst_ren (σ : Substitution) (ρ : Renaming) :
    upSubst (fun i => σ (ρ i)) = fun i => upSubst σ (upRen ρ i) := by
  funext i; cases i <;> rfl

theorem subst_rename (σ : Substitution) (ρ : Renaming) (e : Expr) :
    subst σ (rename ρ e) = subst (fun i => σ (ρ i)) e := by
  induction e generalizing σ ρ <;> simp_all [subst, rename, upSubst_ren]

theorem upSubst_rename (σ : Substitution) (ρ : Renaming) :
    upSubst (fun i => rename ρ (σ i)) = fun i => rename (upRen ρ) (upSubst σ i) := by
  funext i
  cases i with
  | zero => rfl
  | succ i => simp [upSubst, rename_comp, upRen]

theorem rename_subst (ρ : Renaming) (σ : Substitution) (e : Expr) :
    rename ρ (subst σ e) = subst (fun i => rename ρ (σ i)) e := by
  induction e generalizing ρ σ <;> simp_all [rename, subst, upSubst_rename]

theorem upSubst_comp (σ τ : Substitution) :
    upSubst (fun i => subst τ (σ i)) = fun i => subst (upSubst τ) (upSubst σ i) := by
  funext i
  cases i with
  | zero => rfl
  | succ i => simp [upSubst, rename_subst, subst_rename]

theorem subst_comp (σ τ : Substitution) (e : Expr) :
    subst τ (subst σ e) = subst (fun i => subst τ (σ i)) e := by
  induction e generalizing σ τ <;> simp_all [subst, upSubst_comp]

def cons (a : Expr) (σ : Substitution) : Substitution
  | 0 => a
  | i+1 => σ i

def single (a : Expr) : Substitution := cons a variables

theorem subst_shift (a e : Expr) : subst (single a) (rename Nat.succ e) = e := by
  rw [subst_rename]
  exact subst_variables e

theorem beta_lift (σ : Substitution) (a e : Expr) :
    subst (single a) (subst (upSubst σ) e) = subst (cons a σ) e := by
  rw [subst_comp]
  congr 1
  funext i
  cases i with
  | zero => rfl
  | succ i => exact subst_shift a (σ i)

def isDefinition : Member → Bool
  | .assumption .. => false
  | .definition .. => true

def arity : List Member → Nat
  | [] => 0
  | .assumption .. :: rest => 1 + arity rest
  | .definition .. :: rest => arity rest

def closeType : List Member → Expr → Expr
  | [], body => body
  | .assumption n t bi :: rest, body => .forallE n t (closeType rest body) bi
  | .definition n t v nd :: rest, body => .letE n t v (closeType rest body) nd

/-- Stop at the declared boundary, even if the selected body is itself a lambda. -/
def applyTerm : List Bool → Expr → List Expr → Option Expr
  | [], body, [] => some body
  | false :: rest, .lam _ _ body _, a :: args =>
      applyTerm rest (subst (single a) body) args
  | true :: rest, .letE _ _ value body _, args =>
      applyTerm rest (subst (single value) body) args
  | _, _, _ => none

/-- Instantiate Pi bodies as a type recipe; this does not apply a Pi as a term. -/
def instantiateType : List Bool → Expr → List Expr → Option Expr
  | [], body, [] => some body
  | false :: rest, .forallE _ _ body _, a :: args =>
      instantiateType rest (subst (single a) body) args
  | true :: rest, .letE _ _ value body _, args =>
      instantiateType rest (subst (single value) body) args
  | _, _, _ => none

/-- Source-order context evaluation. Definitions use the preceding environment
    and consume no supplied argument. Images live in one fixed target context. -/
def evaluate : List Member → List Expr → Substitution → Option Substitution
  | [], [], σ => some σ
  | .assumption .. :: rest, a :: args, σ => evaluate rest args (cons a σ)
  | .definition _ _ value _ :: rest, args, σ =>
      evaluate rest args (cons (subst σ value) σ)
  | _, _, _ => none

theorem term_recovery (members : List Member) (body : Expr)
    (args : List Expr) (σ : Substitution) :
    applyTerm (members.map isDefinition) (subst σ (rebuild members body)) args =
      (evaluate members args σ).map (fun τ => subst τ body) := by
  induction members generalizing args σ with
  | nil => cases args <;> rfl
  | cons member rest ih =>
    cases member with
    | assumption n t bi =>
      cases args <;> simp [isDefinition, rebuild, wrap, subst, applyTerm, evaluate,
        beta_lift, ih]
    | definition n t value nd =>
      simp [isDefinition, rebuild, wrap, subst, applyTerm, evaluate, beta_lift, ih]

theorem type_recovery (members : List Member) (body : Expr)
    (args : List Expr) (σ : Substitution) :
    instantiateType (members.map isDefinition) (subst σ (closeType members body)) args =
      (evaluate members args σ).map (fun τ => subst τ body) := by
  induction members generalizing args σ with
  | nil => cases args <;> rfl
  | cons member rest ih =>
    cases member with
    | assumption n t bi =>
      cases args <;> simp [isDefinition, closeType, subst, instantiateType, evaluate,
        beta_lift, ih]
    | definition n t value nd =>
      simp [isDefinition, closeType, subst, instantiateType, evaluate, beta_lift, ih]

def RenamingScoped (ρ : Renaming) (n m : Nat) : Prop := ∀ i, i < n → ρ i < m
def ImagesScoped (σ : Substitution) (n m : Nat) : Prop :=
  ∀ i, i < n → scopedAt m (σ i)

theorem upRen_scoped (h : RenamingScoped ρ n m) :
    RenamingScoped (upRen ρ) (n+1) (m+1) := by
  intro i hi
  cases i with
  | zero => exact Nat.zero_lt_succ _
  | succ i => exact Nat.succ_lt_succ (h i (Nat.lt_of_succ_lt_succ hi))

theorem rename_scoped {e : Expr} (h : scopedAt n e) (hr : RenamingScoped ρ n m) :
    scopedAt m (rename ρ e) := by
  induction e generalizing n m ρ with
  | bvar i => exact hr i h
  | fvar _ | mvar _ | sort _ | const _ _ | lit _ => trivial
  | app _ _ ihf iha => exact ⟨ihf h.1 hr, iha h.2 hr⟩
  | lam _ _ _ _ iht ihb | forallE _ _ _ _ iht ihb =>
    exact ⟨iht h.1 hr, ihb h.2 (upRen_scoped hr)⟩
  | letE _ _ _ _ _ iht ihv ihb =>
    exact ⟨iht h.1 hr, ihv h.2.1 hr, ihb h.2.2 (upRen_scoped hr)⟩
  | mdata _ _ ih | proj _ _ _ ih => exact ih h hr

theorem upSubst_scoped (h : ImagesScoped σ n m) :
    ImagesScoped (upSubst σ) (n+1) (m+1) := by
  intro i hi
  cases i with
  | zero => exact Nat.zero_lt_succ _
  | succ i =>
    exact rename_scoped (h i (Nat.lt_of_succ_lt_succ hi)) (fun j hj => by omega)

theorem subst_scoped {e : Expr} (h : scopedAt n e) (hs : ImagesScoped σ n m) :
    scopedAt m (subst σ e) := by
  induction e generalizing n m σ with
  | bvar i => exact hs i h
  | fvar _ | mvar _ | sort _ | const _ _ | lit _ => trivial
  | app _ _ ihf iha => exact ⟨ihf h.1 hs, iha h.2 hs⟩
  | lam _ _ _ _ iht ihb | forallE _ _ _ _ iht ihb =>
    exact ⟨iht h.1 hs, ihb h.2 (upSubst_scoped hs)⟩
  | letE _ _ _ _ _ iht ihv ihb =>
    exact ⟨iht h.1 hs, ihv h.2.1 hs, ihb h.2.2 (upSubst_scoped hs)⟩
  | mdata _ _ ih | proj _ _ _ ih => exact ih h hs

theorem cons_scoped (ha : scopedAt m a) (hs : ImagesScoped σ n m) :
    ImagesScoped (cons a σ) (n+1) m := by
  intro i hi
  cases i with
  | zero => exact ha
  | succ i => exact hs i (Nat.lt_of_succ_lt_succ hi)

theorem evaluate_scoped (members : List Member) (headers : telescopeScoped n members)
    (images : ImagesScoped σ n m) (arguments : ∀ a ∈ args, scopedAt m a)
    (accepted : evaluate members args σ = some τ) :
    ImagesScoped τ (n+members.length) m := by
  induction members generalizing n σ args with
  | nil =>
    cases args with
    | nil =>
      simp only [evaluate, Option.some.injEq] at accepted
      subst τ
      simpa using images
    | cons a rest => simp [evaluate] at accepted
  | cons member rest ih =>
    cases member with
    | assumption name type info =>
      cases args with
      | nil => simp [evaluate] at accepted
      | cons a args =>
        have next := ih headers.2 (cons_scoped (arguments a (by simp)) images)
          (fun x hx => arguments x (by simp [hx])) accepted
        simpa [Nat.add_assoc, Nat.add_comm, Nat.add_left_comm] using next
    | definition name type value nd =>
      have next := ih headers.2 (cons_scoped (subst_scoped headers.1.2 images) images)
        arguments accepted
      simpa [Nat.add_assoc, Nat.add_comm, Nat.add_left_comm] using next

theorem evaluate_arity (members : List Member)
    (accepted : evaluate members args σ = some τ) : args.length = arity members := by
  induction members generalizing args σ with
  | nil => cases args <;> simp_all [evaluate, arity]
  | cons member rest ih =>
    cases member with
    | assumption name type info =>
      cases args with
      | nil => simp [evaluate] at accepted
      | cons a args =>
        have size := ih accepted
        simp only [List.length_cons, arity]
        omega
    | definition name type value nd => exact ih accepted

theorem evaluate_append (left right : List Member)
    (first : evaluate left args₁ σ = some τ)
    (second : evaluate right args₂ τ = some υ) :
    evaluate (left ++ right) (args₁ ++ args₂) σ = some υ := by
  induction left generalizing args₁ σ with
  | nil =>
    cases args₁ with
    | nil =>
      simp only [evaluate, Option.some.injEq] at first
      subst τ
      exact second
    | cons a rest => simp [evaluate] at first
  | cons member rest ih =>
    cases member with
    | assumption name type info =>
      cases args₁ with
      | nil => simp [evaluate] at first
      | cons a args => exact ih first
    | definition name type value nd => exact ih first

theorem term_success (accepted : evaluate members args σ = some τ) :
    applyTerm (members.map isDefinition) (subst σ (rebuild members body)) args =
      some (subst τ body) := by rw [term_recovery, accepted]; rfl

theorem type_success (accepted : evaluate members args σ = some τ) :
    instantiateType (members.map isDefinition) (subst σ (closeType members body)) args =
      some (subst τ body) := by rw [type_recovery, accepted]; rfl

theorem result_scoped (headers : telescopeScoped n members)
    (bodyScope : scopedAt (n+members.length) body) (images : ImagesScoped σ n m)
    (arguments : ∀ a ∈ args, scopedAt m a) (accepted : evaluate members args σ = some τ) :
    scopedAt m (subst τ body) :=
  subst_scoped bodyScope (evaluate_scoped members headers images arguments accepted)

/- Small data controls make the interface distinction explicit. Native typing
   of mathematical terms is a separate verification gate. -/
def natType : Expr := .const ``Nat []
def identityValue : Expr := .lam `x natType (.bvar 0) .default
def identityType : Expr := .forallE `x natType natType .default
def oneAssumption : List Member := [.assumption `x natType .default]

theorem same_closed_term_different_boundary :
    rebuild [] identityValue = rebuild oneAssumption (.bvar 0) := rfl
theorem same_closed_type_different_boundary :
    closeType [] identityType = closeType oneAssumption natType := rfl
theorem empty_boundary_keeps_function : applyTerm [] identityValue [] = some identityValue := rfl
theorem argument_boundary_needs_argument : applyTerm [false] identityValue [] = none := rfl

def oneDefinition : List Member :=
  [.assumption `x natType .default, .definition `k natType (.bvar 0) false]
def seventeen : Expr := .lit (.natVal 17)
def eighteen : Expr := .lit (.natVal 18)

theorem definition_uses_prefix_value :
    applyTerm [false,true] (rebuild oneDefinition (.bvar 0)) [seventeen] = some seventeen := rfl
theorem definition_refuses_extra_argument :
    applyTerm [false,true] (rebuild oneDefinition (.bvar 0)) [seventeen,eighteen] = none := rfl

#print axioms upRen_id
#print axioms upRen_comp
#print axioms rename_id
#print axioms rename_comp
#print axioms upSubst_variables
#print axioms subst_variables
#print axioms upSubst_ren
#print axioms subst_rename
#print axioms upSubst_rename
#print axioms rename_subst
#print axioms upSubst_comp
#print axioms subst_comp
#print axioms subst_shift
#print axioms beta_lift
#print axioms term_recovery
#print axioms type_recovery
#print axioms upRen_scoped
#print axioms rename_scoped
#print axioms upSubst_scoped
#print axioms subst_scoped
#print axioms cons_scoped
#print axioms evaluate_scoped
#print axioms evaluate_arity
#print axioms evaluate_append
#print axioms term_success
#print axioms type_success
#print axioms result_scoped
#print axioms same_closed_term_different_boundary
#print axioms same_closed_type_different_boundary
#print axioms empty_boundary_keeps_function
#print axioms argument_boundary_needs_argument
#print axioms definition_uses_prefix_value
#print axioms definition_refuses_extra_argument

end ProofAtlas.ContextInstantiation
