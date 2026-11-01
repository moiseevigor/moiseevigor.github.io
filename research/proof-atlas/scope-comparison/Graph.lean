import Ranges

namespace ProofAtlas.ScopeComparison
open Lean

/-- A coupled constructor retains equal payloads and ordered child pairs;
    only the two bound-variable indices can differ. -/
inductive PairFrame (α : Type) where
  | bvar (left right : Nat)
  | fvar (fid : FVarId)
  | mvar (mid : MVarId)
  | sort (level : Level)
  | const (name : Name) (levels : List Level)
  | app (fn arg : α)
  | lam (name : Name) (domain body : α) (info : BinderInfo)
  | forallE (name : Name) (domain body : α) (info : BinderInfo)
  | letE (name : Name) (domain value body : α) (nondep : Bool)
  | lit (value : Literal)
  | mdata (data : MData) (body : α)
  | proj (name : Name) (field : Nat) (body : α)

def PairFrame.build (right : Bool) (value : α → Expr) : PairFrame α → Expr
  | .bvar i j => .bvar (if right then j else i)
  | .fvar fid => .fvar fid
  | .mvar mid => .mvar mid
  | .sort u => .sort u
  | .const name levels => .const name levels
  | .app fn arg => .app (value fn) (value arg)
  | .lam name domain body info => .lam name (value domain) (value body) info
  | .forallE name domain body info => .forallE name (value domain) (value body) info
  | .letE name domain val body nd => .letE name (value domain) (value val) (value body) nd
  | .lit val => .lit val
  | .mdata data body => .mdata data (value body)
  | .proj name field body => .proj name field (value body)

abbrev PairGraph := (i : Nat) → PairFrame (Fin i)

def interpret (g : PairGraph) (right : Bool) (i : Nat) : Expr :=
  (g i).build right (fun child => interpret g right child.val)
termination_by i
decreasing_by exact child.isLt

theorem interpret_unfold (g : PairGraph) (right : Bool) (i : Nat) :
    interpret g right i = (g i).build right (fun child => interpret g right child.val) := by
  rw [interpret]

abbrev Bounds := Nat → Nat × Nat

def Covers (bounds : Bounds) (parent : Nat) (child : Fin parent) (increment : Nat) : Prop :=
  (bounds child.val).1 ≤ (bounds parent).1 + increment ∧
    (bounds parent).2 + increment ≤ (bounds child.val).2

def PairFrame.Valid (amount : Nat) (bounds : Bounds) (parent : Nat) : PairFrame (Fin parent) → Prop
  | .bvar i j => IndexOk amount i j (bounds parent).1 (bounds parent).2
  | .app fn arg => Covers bounds parent fn 0 ∧ Covers bounds parent arg 0
  | .lam _ domain body _ | .forallE _ domain body _ =>
      Covers bounds parent domain 0 ∧ Covers bounds parent body 1
  | .letE _ domain val body _ => Covers bounds parent domain 0 ∧
      Covers bounds parent val 0 ∧ Covers bounds parent body 1
  | .mdata _ body | .proj _ _ body => Covers bounds parent body 0
  | _ => True

variable {g : PairGraph} {amount : Nat} {bounds : Bounds}

/-- Shared children receive the enclosing interval through explicit field
    increments; no unfolded occurrence list is part of the certificate. -/
theorem graph_match (valid : ∀ i, (g i).Valid amount bounds i) (root : Nat) :
    Match amount (interpret g false root) (interpret g true root)
      (bounds root).1 (bounds root).2 := by
  induction root using Nat.strongRecOn with
  | ind parent ih =>
    have localValid := valid parent
    have childMatch : ∀ (child : Fin parent) (increment : Nat), Covers bounds parent child increment →
        Match amount (interpret g false child.val) (interpret g true child.val)
          ((bounds parent).1 + increment) ((bounds parent).2 + increment) := by
      intro child increment covered
      exact match_narrow (ih child.val child.isLt) _ _ covered.1 covered.2
    rw [interpret_unfold g false parent, interpret_unfold g true parent]
    cases frame : g parent <;> simp only [frame, PairFrame.Valid] at localValid
    case bvar i j => exact Match.bvar localValid
    case fvar fid => exact Match.fvar
    case mvar mid => exact Match.mvar
    case sort u => exact Match.sort
    case const name levels => exact Match.const
    case lit val => exact Match.lit
    case app fn arg =>
      exact Match.app (childMatch fn 0 localValid.1) (childMatch arg 0 localValid.2)
    case lam name domain body info =>
      exact Match.lam (childMatch domain 0 localValid.1) (childMatch body 1 localValid.2)
    case forallE name domain body info =>
      exact Match.forallE (childMatch domain 0 localValid.1) (childMatch body 1 localValid.2)
    case letE name domain val body nd =>
      exact Match.letE (childMatch domain 0 localValid.1) (childMatch val 0 localValid.2.1)
        (childMatch body 1 localValid.2.2)
    case mdata data body => exact Match.mdata (childMatch body 0 localValid)
    case proj name field body => exact Match.proj (childMatch body 0 localValid)

theorem graph_root (valid : ∀ i, (g i).Valid amount bounds i)
    (rootBounds : bounds root = (0, 0)) :
    lift (interpret g false root) amount 0 = interpret g true root := by
  apply root_match
  simpa [rootBounds] using graph_match valid root

#print axioms interpret_unfold
#print axioms graph_match
#print axioms graph_root

end ProofAtlas.ScopeComparison
