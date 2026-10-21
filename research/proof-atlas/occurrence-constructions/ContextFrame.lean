import Lean

/- Laws on actual Lean.Expr. These do not prove the native-record adapter,
   serialized frame protocol, JavaScript consumer or renderer correct. -/
namespace ProofAtlas.ContextFrame
open Lean

inductive Member where
 | assumption (name : Name) (type : Expr) (info : BinderInfo)
 | definition (name : Name) (type value : Expr) (nondep : Bool)

def wrap : Member → Expr → Expr
 | .assumption name type info, body => .lam name type body info
 | .definition name type value nondep, body => .letE name type value body nondep

def rebuild : List Member → Expr → Expr
 | [], body => body
 | m :: rest, body => wrap m (rebuild rest body)

def peel : Nat → Expr → List Member × Expr
 | 0, e => ([], e)
 | n + 1, .lam name type body info =>
   let (members, rest) := peel n body
   (.assumption name type info :: members, rest)
 | n + 1, .letE name type value body nondep =>
   let (members, rest) := peel n body
   (.definition name type value nondep :: members, rest)
 | _ + 1, e => ([], e)

theorem peel_roundtrip (fuel : Nat) (e : Expr) :
    rebuild (peel fuel e).1 (peel fuel e).2 = e := by
 induction fuel generalizing e with
 | zero => rfl
 | succ fuel ih => cases e <;> simp [peel, rebuild, wrap, ih]

theorem peel_member_bound (fuel : Nat) (e : Expr) :
    (peel fuel e).1.length ≤ fuel := by
 induction fuel generalizing e with
 | zero => simp [peel]
 | succ fuel ih => cases e <;> simp [peel, Nat.succ_le_succ (ih _)]

def occurrences : Expr → Nat
 | .app f a => 1 + occurrences f + occurrences a
 | .lam _ t b _ | .forallE _ t b _ => 1 + occurrences t + occurrences b
 | .letE _ t v b _ => 1 + occurrences t + occurrences v + occurrences b
 | .mdata _ e | .proj _ _ e => 1 + occurrences e
 | _ => 1

def headerOccurrences : Member → Nat
 | .assumption _ type _ => occurrences type
 | .definition _ type value _ => occurrences type + occurrences value

theorem rebuild_occurrences (members : List Member) (body : Expr) :
    occurrences (rebuild members body) =
      members.length + (members.map headerOccurrences).sum + occurrences body := by
 induction members with
 | nil => simp [rebuild]
 | cons m rest ih =>
   cases m <;> simp [rebuild, wrap, occurrences, headerOccurrences, ih,
     Nat.add_assoc, Nat.add_comm, Nat.add_left_comm]

theorem peel_partition (fuel : Nat) (e : Expr) :
    occurrences e = (peel fuel e).1.length +
      ((peel fuel e).1.map headerOccurrences).sum + occurrences (peel fuel e).2 := by
 rw [← rebuild_occurrences, peel_roundtrip]

/- Syntactic bound-variable scope only; free variables, metavariables and typing
   environments are deliberately not certified by this predicate. -/
def scopedAt (gamma : Nat) : Expr → Prop
 | .bvar index => index < gamma
 | .app f a => scopedAt gamma f ∧ scopedAt gamma a
 | .lam _ t b _ | .forallE _ t b _ => scopedAt gamma t ∧ scopedAt (gamma + 1) b
 | .letE _ t v b _ => scopedAt gamma t ∧ scopedAt gamma v ∧ scopedAt (gamma + 1) b
 | .mdata _ e | .proj _ _ e => scopedAt gamma e
 | _ => True

def headerScoped (gamma : Nat) : Member → Prop
 | .assumption _ type _ => scopedAt gamma type
 | .definition _ type value _ => scopedAt gamma type ∧ scopedAt gamma value

def telescopeScoped : Nat → List Member → Prop
 | _, [] => True
 | gamma, m :: rest => headerScoped gamma m ∧ telescopeScoped (gamma + 1) rest

theorem wrap_scope (gamma : Nat) (m : Member) (body : Expr) :
    scopedAt gamma (wrap m body) ↔
      headerScoped gamma m ∧ scopedAt (gamma + 1) body := by
 cases m <;> simp [wrap, scopedAt, headerScoped, and_assoc]

theorem rebuild_scope (gamma : Nat) (members : List Member) (body : Expr) :
    scopedAt gamma (rebuild members body) ↔
      telescopeScoped gamma members ∧ scopedAt (gamma + members.length) body := by
 induction members generalizing gamma with
 | nil => simp [rebuild, telescopeScoped]
 | cons m rest ih =>
   simp [rebuild, wrap_scope, ih, telescopeScoped,
     Nat.add_assoc, Nat.add_comm, Nat.add_left_comm, and_assoc]

theorem peel_scope (gamma fuel : Nat) (e : Expr) :
    scopedAt gamma e ↔ telescopeScoped gamma (peel fuel e).1 ∧
      scopedAt (gamma + (peel fuel e).1.length) (peel fuel e).2 := by
 rw [← rebuild_scope, peel_roundtrip]

#print axioms peel_roundtrip
#print axioms peel_member_bound
#print axioms rebuild_occurrences
#print axioms peel_partition
#print axioms wrap_scope
#print axioms rebuild_scope
#print axioms peel_scope
end ProofAtlas.ContextFrame
