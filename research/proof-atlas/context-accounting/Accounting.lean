/- The driver prepends Projection.lean. These laws count expanded Expr
   occurrences, not stored DAG nodes, display vertices, or logical necessity. -/
namespace ProofAtlas.ContextAccounting
open Lean ProofAtlas.Projection

structure Header where
 name : Name
 info : BinderInfo
 type : Expr
 value : Option Expr

/-- Size of the added wrapper and its off-body regions. -/
def weight (h : Header) : Nat :=
 1 + occurrences h.type + (h.value.map occurrences).getD 0

def wrap (asType : Bool) (h : Header) (body : Expr) : Expr :=
 match h.value with
 | some value => .letE h.name h.type value body false
 | none => if asType then .forallE h.name h.type body h.info
           else .lam h.name h.type body h.info

/-- Headers are in original outer-to-inner order. -/
def close (asType : Bool) (headers : List Header) (body : Expr) : Expr :=
 headers.foldr (wrap asType) body

def total (headers : List Header) : Nat := (headers.map weight).sum

theorem weight_positive (h : Header) : 0 < weight h := by
 simp only [weight]; omega

theorem wrap_occurrences : occurrences (wrap asType h body) = weight h + occurrences body := by
 cases h with
 | mk n bi t value =>
  cases value with
  | none => cases asType <;> simp [wrap,weight,occurrences]
  | some v => simp [wrap,weight,occurrences]

theorem close_occurrences : occurrences (close asType headers body) = total headers + occurrences body := by
 induction headers with
 | nil => simp [close,total]
 | cons h hs ih =>
  simp only [close,List.foldr_cons,wrap_occurrences] at *
  rw [ih]
  simp [total,Nat.add_assoc]

/-- Actual expression projection of both kinds of header field. -/
def projectHeader (r : Renaming) (h : Header) : Option Header := do
 let type ← project r h.type
 let value ← match h.value with
  | none => some none
  | some value => (project r value).map some
 return {h with type, value}

theorem projectHeader_weight (h : projectHeader r header = some result) :
    weight result = weight header := by
 cases header with
 | mk n bi t value =>
  cases ht : project r t with
  | none => simp [projectHeader,ht] at h
  | some t' =>
   cases value with
   | none =>
    simp [projectHeader,ht] at h
    subst result
    simp [weight,project_occurrences ht]
   | some v =>
    cases hv : project r v with
    | none => simp [projectHeader,ht,hv] at h
    | some v' =>
     simp [projectHeader,ht,hv] at h
     subst result
     simp [weight,project_occurrences ht,project_occurrences hv]

/-- Each projected retained header may use its own pre-binder renaming.
    Omitted headers are explicit; this relation asserts no typing judgment. -/
inductive Selection : List Header → List Header → List Header → Prop
 | nil : Selection [] [] []
 | keep (hp : projectHeader r h = some h') (tail : Selection hs retainedHeaders omitted) :
     Selection (h::hs) (h'::retainedHeaders) omitted
 | skip (tail : Selection hs retainedHeaders omitted) : Selection (h::hs) retainedHeaders (h::omitted)

theorem selection_partition (h : Selection headers retainedHeaders omitted) :
    total headers = total retainedHeaders + total omitted := by
 induction h with
 | nil => rfl
 | keep hp _ ih =>
  have equal := projectHeader_weight hp
  simp only [total,List.map_cons,List.sum_cons] at *
  omega
 | skip _ ih =>
  simp only [total,List.map_cons,List.sum_cons] at *
  omega

/-- The exact gain is the sum of omitted headers, independently of term/type mode. -/
theorem projected_closure_partition (hs : Selection headers retainedHeaders omitted)
    (hp : project r body = some body') :
    occurrences (close asType headers body) =
      occurrences (close asType retainedHeaders body') + total omitted := by
 rw [close_occurrences,close_occurrences,project_occurrences hp,selection_partition hs]
 omega

theorem projected_closure_le (hs : Selection headers retainedHeaders omitted)
    (hp : project r body = some body') :
    occurrences (close asType retainedHeaders body') ≤ occurrences (close asType headers body) := by
 have := projected_closure_partition (asType:=asType) hs hp
 omega

theorem total_positive_iff : 0 < total headers ↔ headers ≠ [] := by
 cases headers with
 | nil => simp [total]
 | cons h hs =>
  constructor
  · intro _; simp
  · intro _
    have := weight_positive h
    simp only [total,List.map_cons,List.sum_cons]
    omega

theorem projected_closure_strict_iff (hs : Selection headers retainedHeaders omitted)
    (hp : project r body = some body') :
    occurrences (close asType retainedHeaders body') < occurrences (close asType headers body) ↔ omitted ≠ [] := by
 have eq := projected_closure_partition (asType:=asType) hs hp
 have positive := total_positive_iff (headers:=omitted)
 constructor
 · intro h
   apply positive.mp
   omega
 · intro h
   have := positive.mpr h
   omega

end ProofAtlas.ContextAccounting
