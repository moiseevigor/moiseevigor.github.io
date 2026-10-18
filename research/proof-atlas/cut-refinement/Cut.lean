import Lean

namespace ProofAtlas.SourceCut
open Lean

/-- Expanded constructor occurrences; no typing or semantic claim. -/
def occurrences : Expr → Nat
 | .app f a => 1 + occurrences f + occurrences a
 | .lam _ d b _ | .forallE _ d b _ => 1 + occurrences d + occurrences b
 | .letE _ t v b _ => 1 + occurrences t + occurrences v + occurrences b
 | .mdata _ e | .proj _ _ e => 1 + occurrences e
 | _ => 1

/-- An exact syntactic cut. A hole retains the complete original expression. -/
inductive Cut : Expr → Type
 | hole (e : Expr) : Cut e
 | bvar (i : Nat) : Cut (.bvar i)
 | fvar (id : FVarId) : Cut (.fvar id)
 | mvar (id : MVarId) : Cut (.mvar id)
 | sort (u : Level) : Cut (.sort u)
 | const (n : Name) (us : List Level) : Cut (.const n us)
 | app {f a : Expr} (cf : Cut f) (ca : Cut a) : Cut (.app f a)
 | lam (n : Name) (bi : BinderInfo) {d b : Expr} (cd : Cut d) (cb : Cut b) : Cut (.lam n d b bi)
 | forallE (n : Name) (bi : BinderInfo) {d b : Expr} (cd : Cut d) (cb : Cut b) : Cut (.forallE n d b bi)
 | letE (n : Name) (nonDep : Bool) {t v b : Expr} (ct : Cut t) (cv : Cut v) (cb : Cut b) : Cut (.letE n t v b nonDep)
 | lit (l : Literal) : Cut (.lit l)
 | mdata (d : MData) {e : Expr} (ce : Cut e) : Cut (.mdata d e)
 | proj (s : Name) (i : Nat) {e : Expr} (ce : Cut e) : Cut (.proj s i e)

def retained : {e : Expr} → Cut e → Nat
 | _, .hole _ => 0
 | _, .app f a => 1 + retained f + retained a
 | _, .lam _ _ d b | _, .forallE _ _ d b => 1 + retained d + retained b
 | _, .letE _ _ t v b => 1 + retained t + retained v + retained b
 | _, .mdata _ e | _, .proj _ _ e => 1 + retained e
 | _, _ => 1

def hidden : {e : Expr} → Cut e → Nat
 | _, .hole e => occurrences e
 | _, .app f a => hidden f + hidden a
 | _, .lam _ _ d b | _, .forallE _ _ d b => hidden d + hidden b
 | _, .letE _ _ t v b => hidden t + hidden v + hidden b
 | _, .mdata _ e | _, .proj _ _ e => hidden e
 | _, _ => 0

/-- Only holes may be replaced; every already retained constructor is preserved. -/
inductive Refines : {e : Expr} → Cut e → Cut e → Prop
 | fill {e : Expr} (c : Cut e) : Refines (.hole e) c
 | bvar (i : Nat) : Refines (.bvar i) (.bvar i)
 | fvar (id : FVarId) : Refines (.fvar id) (.fvar id)
 | mvar (id : MVarId) : Refines (.mvar id) (.mvar id)
 | sort (u : Level) : Refines (.sort u) (.sort u)
 | const (n : Name) (us : List Level) : Refines (.const n us) (.const n us)
 | app (hf : Refines cf cf') (ha : Refines ca ca') : Refines (.app cf ca) (.app cf' ca')
 | lam (n : Name) (bi : BinderInfo) (hd : Refines cd cd') (hb : Refines cb cb') : Refines (.lam n bi cd cb) (.lam n bi cd' cb')
 | forallE (n : Name) (bi : BinderInfo) (hd : Refines cd cd') (hb : Refines cb cb') : Refines (.forallE n bi cd cb) (.forallE n bi cd' cb')
 | letE (n : Name) (nonDep : Bool) (ht : Refines ct ct') (hv : Refines cv cv') (hb : Refines cb cb') : Refines (.letE n nonDep ct cv cb) (.letE n nonDep ct' cv' cb')
 | lit (l : Literal) : Refines (.lit l) (.lit l)
 | mdata (d : MData) (he : Refines ce ce') : Refines (.mdata d ce) (.mdata d ce')
 | proj (s : Name) (i : Nat) (he : Refines ce ce') : Refines (.proj s i ce) (.proj s i ce')

/-- Kernel child slots; source occurrences are paths, including under shared terms. -/
def visible : {e : Expr} → Cut e → List Nat → Bool
 | _, .hole _, _ => false
 | _, _, [] => true
 | _, .app f _, 0 :: p => visible f p
 | _, .app _ a, 1 :: p => visible a p
 | _, .lam _ _ d _, 0 :: p | _, .forallE _ _ d _, 0 :: p => visible d p
 | _, .lam _ _ _ b, 1 :: p | _, .forallE _ _ _ b, 1 :: p => visible b p
 | _, .letE _ _ t _ _, 0 :: p => visible t p
 | _, .letE _ _ _ v _, 1 :: p => visible v p
 | _, .letE _ _ _ _ b, 2 :: p => visible b p
 | _, .mdata _ e, 0 :: p | _, .proj _ _ e, 0 :: p => visible e p
 | _, _, _ :: _ => false

theorem partition (c : Cut e) : retained c + hidden c = occurrences e := by
 induction c <;> simp_all [retained, hidden, occurrences] <;> omega

theorem reflexive (c : Cut e) : Refines c c := by
 induction c <;> constructor <;> assumption

theorem retained_monotone (h : Refines c c') : retained c ≤ retained c' := by
 induction h <;> simp_all [retained] <;> omega

theorem hidden_antitone (h : Refines c c') : hidden c' ≤ hidden c := by
 have p := partition c
 have q := partition c'
 have m := retained_monotone h
 omega

theorem exact_transfer (h : Refines c c') :
    retained c' - retained c = hidden c - hidden c' := by
 have p := partition c
 have q := partition c'
 have m := retained_monotone h
 omega

theorem visible_monotone (h : Refines c c') (p : List Nat) :
    visible c p = true → visible c' p = true := by
 induction h generalizing p <;> cases p with
 | nil => simp_all [visible]
 | cons i ps =>
   cases i with
   | zero => simp_all [visible]
   | succ i =>
     cases i with
     | zero => simp_all [visible]
     | succ i =>
       cases i with
       | zero => simp_all [visible]
       | succ i => simp_all [visible]

#print axioms partition
#print axioms reflexive
#print axioms retained_monotone
#print axioms hidden_antitone
#print axioms visible_monotone
#print axioms exact_transfer
end ProofAtlas.SourceCut
