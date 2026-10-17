import Lean

/- Partial context renaming on the actual Lean.Expr type. Non-variable payloads
   stay opaque and unchanged. These are structural theorems, not typing or
   kernel-soundness theorems, and do not verify a JavaScript implementation. -/
set_option maxRecDepth 8192
set_option maxHeartbeats 5000000
open Lean
namespace ProofAtlas.Projection
abbrev Renaming := Nat → Option Nat

def lift (r : Renaming) : Renaming
 | 0 => some 0
 | i+1 => (r i).map Nat.succ

def project (r : Renaming) : Expr → Option Expr
 | .bvar i => (.bvar ·) <$> r i
 | .fvar i => some (.fvar i)
 | .mvar i => some (.mvar i)
 | .sort u => some (.sort u)
 | .const n us => some (.const n us)
 | .app f a => return .app (← project r f) (← project r a)
 | .lam n t b bi => return .lam n (← project r t) (← project (lift r) b) bi
 | .forallE n t b bi => return .forallE n (← project r t) (← project (lift r) b) bi
 | .letE n t v b nd => return .letE n (← project r t) (← project r v) (← project (lift r) b) nd
 | .lit l => some (.lit l)
 | .mdata d e => return .mdata d (← project r e)
 | .proj n i e => return .proj n i (← project r e)

def LeftInverse (r s : Renaming) : Prop := ∀ i j, r i = some j → s j = some i

theorem lift_leftInverse (h : LeftInverse r s) : LeftInverse (lift r) (lift s) := by
 intro i j hij
 cases i with
 | zero => simp [lift] at hij; subst j; rfl
 | succ i =>
  cases hr : r i with
  | none => simp [lift, hr] at hij
  | some k =>
   simp [lift, hr] at hij
   subst j
   simp [lift, h i k hr]

theorem project_roundtrip (h : LeftInverse r s) (he : project r e = some e') :
    project s e' = some e := by
 induction e generalizing r s e' with
 | bvar i =>
  cases hr : r i with
  | none => simp [project, hr] at he
  | some j =>
   simp [project, hr] at he
   subst e'
   simp [project, h i j hr]
 | fvar i => simp [project] at he; subst e'; rfl
 | mvar i => simp [project] at he; subst e'; rfl
 | sort u => simp [project] at he; subst e'; rfl
 | const n us => simp [project] at he; subst e'; rfl
 | lit l => simp [project] at he; subst e'; rfl
 | app f a ihf iha =>
  cases hf : project r f with
  | none => simp [project, hf] at he
  | some f' =>
   cases ha : project r a with
   | none => simp [project, hf, ha] at he
   | some a' =>
    simp [project, hf, ha] at he
    subst e'
    simp [project, ihf h hf, iha h ha]
 | lam n t b bi iht ihb =>
  cases ht : project r t with
  | none => simp [project, ht] at he
  | some t' =>
   cases hb : project (lift r) b with
   | none => simp [project, ht, hb] at he
   | some b' =>
    simp [project, ht, hb] at he
    subst e'
    simp [project, iht h ht, ihb (lift_leftInverse h) hb]
 | forallE n t b bi iht ihb =>
  cases ht : project r t with
  | none => simp [project, ht] at he
  | some t' =>
   cases hb : project (lift r) b with
   | none => simp [project, ht, hb] at he
   | some b' =>
    simp [project, ht, hb] at he
    subst e'
    simp [project, iht h ht, ihb (lift_leftInverse h) hb]
 | letE n t v b nd iht ihv ihb =>
  cases ht : project r t with
  | none => simp [project, ht] at he
  | some t' =>
   cases hv : project r v with
   | none => simp [project, ht, hv] at he
   | some v' =>
    cases hb : project (lift r) b with
    | none => simp [project, ht, hv, hb] at he
    | some b' =>
     simp [project, ht, hv, hb] at he
     subst e'
     simp [project, iht h ht, ihv h hv, ihb (lift_leftInverse h) hb]
 | mdata d e ih =>
  cases hx : project r e with
  | none => simp [project, hx] at he
  | some x =>
   simp [project, hx] at he
   subst e'
   simp [project, ih h hx]
 | proj n i e ih =>
  cases hx : project r e with
  | none => simp [project, hx] at he
  | some x =>
   simp [project, hx] at he
   subst e'
   simp [project, ih h hx]

def occurrences : Expr → Nat
 | .app f a => 1 + occurrences f + occurrences a
 | .lam _ t b _ | .forallE _ t b _ => 1 + occurrences t + occurrences b
 | .letE _ t v b _ => 1 + occurrences t + occurrences v + occurrences b
 | .mdata _ e | .proj _ _ e => 1 + occurrences e
 | _ => 1

theorem project_occurrences (he : project r e = some e') : occurrences e' = occurrences e := by
 induction e generalizing r e' with
 | bvar i =>
  cases hr : r i with
  | none => simp [project, hr] at he
  | some j => simp [project, hr] at he; subst e'; rfl
 | fvar i => simp [project] at he; subst e'; rfl
 | mvar i => simp [project] at he; subst e'; rfl
 | sort u => simp [project] at he; subst e'; rfl
 | const n us => simp [project] at he; subst e'; rfl
 | lit l => simp [project] at he; subst e'; rfl
 | app f a ihf iha =>
  cases hf : project r f with
  | none => simp [project, hf] at he
  | some f' =>
   cases ha : project r a with
   | none => simp [project, hf, ha] at he
   | some a' =>
    simp [project, hf, ha] at he
    subst e'
    simp [occurrences, ihf hf, iha ha]
 | lam n t b bi iht ihb =>
  cases ht : project r t with
  | none => simp [project, ht] at he
  | some t' =>
   cases hb : project (lift r) b with
   | none => simp [project, ht, hb] at he
   | some b' =>
    simp [project, ht, hb] at he
    subst e'
    simp [occurrences, iht ht, ihb hb]
 | forallE n t b bi iht ihb =>
  cases ht : project r t with
  | none => simp [project, ht] at he
  | some t' =>
   cases hb : project (lift r) b with
   | none => simp [project, ht, hb] at he
   | some b' =>
    simp [project, ht, hb] at he
    subst e'
    simp [occurrences, iht ht, ihb hb]
 | letE n t v b nd iht ihv ihb =>
  cases ht : project r t with
  | none => simp [project, ht] at he
  | some t' =>
   cases hv : project r v with
   | none => simp [project, ht, hv] at he
   | some v' =>
    cases hb : project (lift r) b with
    | none => simp [project, ht, hv, hb] at he
    | some b' =>
     simp [project, ht, hv, hb] at he
     subst e'
     simp [occurrences, iht ht, ihv hv, ihb hb]
 | mdata d e ih =>
  cases hx : project r e with
  | none => simp [project, hx] at he
  | some x => simp [project, hx] at he; subst e'; simp [occurrences, ih hx]
 | proj n i e ih =>
  cases hx : project r e with
  | none => simp [project, hx] at he
  | some x => simp [project, hx] at he; subst e'; simp [occurrences, ih hx]

def select : List Nat → Renaming
 | [], _ => none
 | a::tail, i => if i = a then some 0 else (select tail i).map Nat.succ

def embed (kept : List Nat) : Renaming := fun j => kept[j]?

theorem select_embed (kept : List Nat) : LeftInverse (select kept) (embed kept) := by
 induction kept with
 | nil => intro i j h; simp [select] at h
 | cons a tail ih =>
  intro i j h
  by_cases hia : i = a
  · simp [select, hia] at h
    subst j
    simp [embed, hia]
  · cases ht : select tail i with
    | none => simp [select, hia, ht] at h
    | some k =>
     simp [select, hia, ht] at h
     subst j
     simpa [embed] using ih i k ht

theorem selected_context_roundtrip (h : project (select kept) e = some e') :
    project (embed kept) e' = some e := project_roundtrip (select_embed kept) h

def compose (s r : Renaming) : Renaming := fun i => (r i).bind s

theorem lift_compose : lift (compose s r) = compose (lift s) (lift r) := by
 funext i
 cases i with
 | zero => rfl
 | succ i => cases hr : r i <;> simp [lift, compose, hr]

theorem project_compose : (project r e).bind (project s) = project (compose s r) e := by
 induction e generalizing r s with
 | bvar i => cases hr : r i <;> simp [project, compose, hr]
 | fvar i => rfl
 | mvar i => rfl
 | sort u => rfl
 | const n us => rfl
 | lit l => rfl
 | app f a ihf iha =>
  cases hf : project r f <;> cases ha : project r a <;>
   simp [project, ← ihf, ← iha, hf, ha]
 | lam n t b bi iht ihb =>
  cases ht : project r t <;> cases hb : project (lift r) b <;>
   simp [project, lift_compose, ← iht, ← ihb, ht, hb]
 | forallE n t b bi iht ihb =>
  cases ht : project r t <;> cases hb : project (lift r) b <;>
   simp [project, lift_compose, ← iht, ← ihb, ht, hb]
 | letE n t v b nd iht ihv ihb =>
  cases ht : project r t <;> cases hv : project r v <;> cases hb : project (lift r) b <;>
   simp [project, lift_compose, ← iht, ← ihv, ← ihb, ht, hv, hb]
 | mdata d e ih =>
  cases hx : project r e <;> simp [project, ← ih, hx]
 | proj n i e ih =>
  cases hx : project r e <;> simp [project, ← ih, hx]


theorem project_injective (h : LeftInverse r s)
    (ha : project r a = some e') (hb : project r b = some e') : a = b := by
 have h1 := project_roundtrip h ha
 have h2 := project_roundtrip h hb
 exact Option.some.inj (h1.symm.trans h2)

def liftN : Nat → Renaming → Renaming
 | 0, r => r
 | c+1, r => lift (liftN c r)

theorem liftN_below (h : i < c) : liftN c r i = some i := by
 induction c generalizing i with
 | zero => omega
 | succ c ih =>
  cases i with
  | zero => rfl
  | succ i =>
   simp only [liftN, lift]
   rw [ih (by omega)]
   rfl

theorem liftN_above (c i : Nat) : liftN c r (c+i) = (r i).map (fun j => c+j) := by
 induction c with
 | zero => simp [liftN]
 | succ c ih =>
  simp only [Nat.succ_add, liftN, lift, ih, Option.map_map]
  rfl

end ProofAtlas.Projection
