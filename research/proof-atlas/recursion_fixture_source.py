"""Assistant-authored synthetic controls, not an AI theorem-solving benchmark.

Only the generated compiled data enter the website. The source below is our
reproduction fixture, not any private project proof script.
"""
SOURCE = """import Lean
open Lean Meta Elab
namespace AtlasExamples
inductive Fork where
 | leaf
 | fork (left right : Fork)
def forkHolds (t : Fork) : Prop := Fork.rec True (fun _ _ left right => left ∧ right) t
theorem fork_holds (t : Fork) : forkHolds t :=
 Fork.rec (motive := fun t => forkHolds t) True.intro (fun _ _ left right => And.intro left right) t
inductive Fan where
 | leaf
 | node (children : Nat → Fan)
def fanHolds (t : Fan) : Prop := Fan.rec True (fun _ holds => ∀ n, holds n) t
theorem fan_holds (t : Fan) : fanHolds t :=
 Fan.rec (motive := fun t => fanHolds t) True.intro (fun _ holds n => holds n) t
universe u
inductive Sized (α : Type u) : Nat → Type u where
 | nil : Sized α 0
 | cons {n : Nat} (head : α) (tail : Sized α n) : Sized α (n+1)
noncomputable def copySized {α : Type u} {n : Nat} (xs : Sized α n) : Sized α n :=
 @Sized.rec α (fun n _ => Sized α n) Sized.nil (fun {n} head _ copied => @Sized.cons _ n head copied) n xs
theorem sized_copy_eq {α : Type u} {n : Nat} (xs : Sized α n) : copySized xs = xs :=
 @Sized.rec α (fun _ xs => copySized xs = xs) (Eq.refl Sized.nil)
  (fun {n} head _ ih => congrArg (fun tail => @Sized.cons _ n head tail) ih) n xs
noncomputable def copyList {α : Type u} (xs : List α) : List α := List.rec [] (fun head _ copied => head :: copied) xs
theorem list_copy_eq {α : Type u} (xs : List α) : copyList xs = xs :=
 List.rec (motive := fun xs => copyList xs = xs) (Eq.refl []) (fun head _ ih => congrArg (List.cons head) ih) xs
theorem nat_self (n : Nat) : n = n := Nat.rec (motive := fun n => n = n) (Eq.refl 0) (fun _ ih => congrArg Nat.succ ih) n
def ignored_premise (n : Nat) : Nat := Nat.rec 0 (fun _ _ => 0) n
end AtlasExamples
run_meta do
 let info ← getConstInfo ``AtlasExamples.nat_self
 let some base := info.value? true | throwError "Missing induction control"
 let .lam _ domain body _ := base | throwError "Missing outer binder"
 let .forallE _ _ proposition _ := info.type | throwError "Missing statement binder"
 for depth in [8,24,64] do
  let mut value := body
  let mut type := proposition
  for _ in [:depth] do
   value := mkAppN (mkConst ``And.intro) #[type,type,value,value]
   type := mkApp2 (mkConst ``And) type type
  let closedValue := Expr.lam `n domain value .default
  let closedType := Expr.forallE `n domain type .default
  let name := Name.str `AtlasExamples ("shared_induction_" ++ toString depth)
  addDecl (.thmDecl {name,levelParams:=[],type:=closedType,value:=closedValue})
"""
