/- Loaded after the existing source-indexed Cut and reference definitions. -/
namespace ProofAtlas.SourceCut.Union
open Lean

def join : {e : Expr} → Cut e → Cut e → Cut e
  | _, .hole _, d => d
  | _, c, .hole _ => c
  | _, .bvar i, .bvar _ => .bvar i
  | _, .fvar i, .fvar _ => .fvar i
  | _, .mvar i, .mvar _ => .mvar i
  | _, .sort u, .sort _ => .sort u
  | _, .const n us, .const _ _ => .const n us
  | _, .lit l, .lit _ => .lit l
  | _, .app f a, .app f' a' => .app (join f f') (join a a')
  | _, .lam n bi d b, .lam _ _ d' b' => .lam n bi (join d d') (join b b')
  | _, .forallE n bi d b, .forallE _ _ d' b' => .forallE n bi (join d d') (join b b')
  | _, .letE n nd t v b, .letE _ _ t' v' b' => .letE n nd (join t t') (join v v') (join b b')
  | _, .mdata m e, .mdata _ e' => .mdata m (join e e')
  | _, .proj n i e, .proj _ _ e' => .proj n i (join e e')

def meet : {e : Expr} → Cut e → Cut e → Cut e
  | _, .hole e, _ => .hole e
  | _, _, .hole e => .hole e
  | _, .bvar i, .bvar _ => .bvar i
  | _, .fvar i, .fvar _ => .fvar i
  | _, .mvar i, .mvar _ => .mvar i
  | _, .sort u, .sort _ => .sort u
  | _, .const n us, .const _ _ => .const n us
  | _, .lit l, .lit _ => .lit l
  | _, .app f a, .app f' a' => .app (meet f f') (meet a a')
  | _, .lam n bi d b, .lam _ _ d' b' => .lam n bi (meet d d') (meet b b')
  | _, .forallE n bi d b, .forallE _ _ d' b' => .forallE n bi (meet d d') (meet b b')
  | _, .letE n nd t v b, .letE _ _ t' v' b' => .letE n nd (meet t t') (meet v v') (meet b b')
  | _, .mdata m e, .mdata _ e' => .mdata m (meet e e')
  | _, .proj n i e, .proj _ _ e' => .proj n i (meet e e')

theorem join_hole (c : Cut e) : join c (.hole e) = c := by
  cases c <;> rfl

theorem join_idempotent (c : Cut e) : join c c = c := by
  induction c <;> simp_all [join]

theorem join_commutative (c d : Cut e) : join c d = join d c := by
  induction c <;> cases d <;> simp_all [join]

theorem join_associative (a b c : Cut e) : join (join a b) c = join a (join b c) := by
  induction a <;> cases b <;> cases c <;> simp_all [join]

theorem visible_join (c d : Cut e) (p : List Nat) :
    visible (join c d) p = (visible c p || visible d p) := by
  induction c generalizing p <;> cases d <;> cases p with
  | nil => simp_all [join,visible]
  | cons i ps =>
    cases i with
    | zero => simp_all [join,visible]
    | succ i =>
      cases i with
      | zero => simp_all [join,visible]
      | succ i =>
        cases i with
        | zero => simp_all [join,visible]
        | succ i => simp_all [join,visible]

theorem visible_meet (c d : Cut e) (p : List Nat) :
    visible (meet c d) p = (visible c p && visible d p) := by
  induction c generalizing p <;> cases d <;> cases p with
  | nil => simp_all [meet,visible]
  | cons i ps =>
    cases i with
    | zero => simp_all [meet,visible]
    | succ i =>
      cases i with
      | zero => simp_all [meet,visible]
      | succ i =>
        cases i with
        | zero => simp_all [meet,visible]
        | succ i => simp_all [meet,visible]

theorem retained_inclusion_exclusion (c d : Cut e) :
    retained (join c d) + retained (meet c d) = retained c + retained d := by
  induction c with
  | hole | bvar | fvar | mvar | sort | const | lit => cases d <;> simp [join,meet,retained]
  | app cf ca hf ha =>
    cases d with
    | hole => simp [join,meet,retained]
    | app df da =>
      have h₁ := hf df
      have h₂ := ha da
      simp only [join,meet,retained]
      omega
  | lam n bi ct cb ht hb =>
    cases d with
    | hole => simp [join,meet,retained]
    | lam _ _ dt db =>
      have h₁ := ht dt
      have h₂ := hb db
      simp only [join,meet,retained]
      omega
  | forallE n bi ct cb ht hb =>
    cases d with
    | hole => simp [join,meet,retained]
    | forallE _ _ dt db =>
      have h₁ := ht dt
      have h₂ := hb db
      simp only [join,meet,retained]
      omega
  | letE n nd ct cv cb ht hv hb =>
    cases d with
    | hole => simp [join,meet,retained]
    | letE _ _ dt dv db =>
      have h₁ := ht dt
      have h₂ := hv dv
      have h₃ := hb db
      simp only [join,meet,retained]
      omega
  | mdata md ce he =>
    cases d with
    | hole => simp [join,meet,retained]
    | mdata _ de =>
      have h := he de
      simp only [join,meet,retained]
      omega
  | proj name idx ce he =>
    cases d with
    | hole => simp [join,meet,retained]
    | proj _ _ de =>
      have h := he de
      simp only [join,meet,retained]
      omega

theorem hidden_inclusion_exclusion (c d : Cut e) :
    hidden (join c d) + hidden (meet c d) = hidden c + hidden d := by
  have h₁ := partition c
  have h₂ := partition d
  have h₃ := partition (join c d)
  have h₄ := partition (meet c d)
  have h₅ := retained_inclusion_exclusion c d
  omega

theorem join_left (c d : Cut e) : Refines c (join c d) := by
  induction c <;> cases d <;> simp_all [join]
  all_goals first | exact .fill _ | exact reflexive _ | constructor <;> (apply_assumption <;> assumption)

theorem join_right (c d : Cut e) : Refines d (join c d) := by
  rw [join_commutative]
  exact join_left d c

theorem join_least (hc : Refines c u) (hd : Refines d u) : Refines (join c d) u := by
  induction hc <;> cases hd <;> simp_all [join]
  all_goals constructor <;> (apply_assumption <;> assumption)

theorem visible_reference_inclusion_exclusion (c d : Cut e) (i : Nat) :
    visibleReferences (join c d) i + visibleReferences (meet c d) i =
      visibleReferences c i + visibleReferences d i := by
  induction c generalizing i with
  | hole | bvar | fvar | mvar | sort | const | lit => cases d <;> simp [join,meet,visibleReferences]
  | app cf ca hf ha =>
    cases d with
    | hole => simp [join,meet,visibleReferences]
    | app df da =>
      have h0 := hf df i
      have h1 := ha da i
      simp only [join,meet,visibleReferences]
      omega
  | lam n bi ct cb ht hb =>
    cases d with
    | hole => simp [join,meet,visibleReferences]
    | lam _ _ dt db =>
      have h0 := ht dt i
      have h1 := hb db (i+1)
      simp only [join,meet,visibleReferences]
      omega
  | forallE n bi ct cb ht hb =>
    cases d with
    | hole => simp [join,meet,visibleReferences]
    | forallE _ _ dt db =>
      have h0 := ht dt i
      have h1 := hb db (i+1)
      simp only [join,meet,visibleReferences]
      omega
  | letE n nd ct cv cb ht hv hb =>
    cases d with
    | hole => simp [join,meet,visibleReferences]
    | letE _ _ dt dv db =>
      have h0 := ht dt i
      have h1 := hv dv i
      have h2 := hb db (i+1)
      simp only [join,meet,visibleReferences]
      omega
  | mdata md ce he =>
    cases d with
    | hole => simp [join,meet,visibleReferences]
    | mdata _ de =>
      have h0 := he de i
      simp only [join,meet,visibleReferences]
      omega
  | proj name idx ce he =>
    cases d with
    | hole => simp [join,meet,visibleReferences]
    | proj _ _ de =>
      have h0 := he de i
      simp only [join,meet,visibleReferences]
      omega

theorem hidden_reference_inclusion_exclusion (c d : Cut e) (i : Nat) :
    hiddenReferences (join c d) i + hiddenReferences (meet c d) i =
      hiddenReferences c i + hiddenReferences d i := by
  have h₁ := reference_partition c i
  have h₂ := reference_partition d i
  have h₃ := reference_partition (join c d) i
  have h₄ := reference_partition (meet c d) i
  have h₅ := visible_reference_inclusion_exclusion c d i
  omega

theorem join_context (ctx : Local.HoleContext s e) (c d : Cut s) :
    join (Local.plug ctx c) (Local.plug ctx d) = Local.plug ctx (join c d) := by
  induction ctx <;> simp_all [Local.plug,join,join_idempotent]

theorem frontier_join (ctx : Local.HoleContext s e) (c : Cut s) :
    join (Local.plug ctx (.hole s)) (Local.plug ctx c) = Local.plug ctx c := by
  rw [join_context]
  rfl

end ProofAtlas.SourceCut.Union
