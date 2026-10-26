/- Structural focusing model. This does not verify the JavaScript binary codec. -/
namespace ProofAtlas.SourceCut.Binding
open Lean

def follow : Expr → Context → Path → Path → Option (Expr × Context × Path)
 | e, ctx, atRoot, [] => some (e, ctx, atRoot)
 | .app f _, ctx, atRoot, 0::p => follow f ctx (atRoot++[0]) p
 | .app _ a, ctx, atRoot, 1::p => follow a ctx (atRoot++[1]) p
 | .lam _ d _ _, ctx, atRoot, 0::p | .forallE _ d _ _, ctx, atRoot, 0::p => follow d ctx (atRoot++[0]) p
 | .lam _ _ b _, ctx, atRoot, 1::p | .forallE _ _ b _, ctx, atRoot, 1::p => follow b (atRoot::ctx) (atRoot++[1]) p
 | .letE _ t _ _ _, ctx, atRoot, 0::p => follow t ctx (atRoot++[0]) p
 | .letE _ _ v _ _, ctx, atRoot, 1::p => follow v ctx (atRoot++[1]) p
 | .letE _ _ _ b _, ctx, atRoot, 2::p => follow b (atRoot::ctx) (atRoot++[2]) p
 | .mdata _ e, ctx, atRoot, 0::p | .proj _ _ e, ctx, atRoot, 0::p => follow e ctx (atRoot++[0]) p
 | _, _, _, _ => none

def endpointTarget (state : Expr × Context × Path) : Option Path :=
 match state.1 with
 | .bvar i => state.2.1[i]?
 | _ => none

theorem follow_append (e : Expr) (ctx : Context) (atRoot p q : Path) :
    follow e ctx atRoot (p++q) =
      (follow e ctx atRoot p).bind (fun state => follow state.1 state.2.1 state.2.2 q) := by
 induction p generalizing e ctx atRoot with
 | nil => simp [follow]
 | cons i p ih =>
  cases e <;> cases i with
  | zero => simp_all [follow]
  | succ i =>
   cases i with
   | zero => simp_all [follow]
   | succ i =>
    cases i with
    | zero => simp_all [follow]
    | succ i => simp_all [follow]

theorem source_from_follow (e : Expr) (ctx : Context) (atRoot p : Path) :
    source e ctx atRoot p = (follow e ctx atRoot p).bind endpointTarget := by
 induction p generalizing e ctx atRoot with
 | nil => cases e <;> simp [source, follow, endpointTarget]
 | cons i p ih =>
  cases e <;> cases i with
  | zero => simp_all [source,follow]
  | succ i =>
   cases i with
   | zero => simp_all [source,follow]
   | succ i =>
    cases i with
    | zero => simp_all [source,follow]
    | succ i => simp_all [source,follow]

theorem source_in_segments (e : Expr) (ctx : Context) (atRoot p q : Path) :
    source e ctx atRoot (p++q) =
      (follow e ctx atRoot p).bind (fun state => source state.1 state.2.1 state.2.2 q) := by
 rw [source_from_follow,follow_append]
 simp only [Option.bind_assoc, source_from_follow]

theorem follow_route (e : Expr) (ctx : Context) (atRoot p : Path)
    (out : Expr × Context × Path) (h : follow e ctx atRoot p = some out) :
    out.2.2 = atRoot++p := by
 induction p generalizing e ctx atRoot with
 | nil =>
   simp only [follow, Option.some.injEq] at h
   cases h
   simp
 | cons i p ih =>
   cases e <;> cases i with
   | zero =>
     try simp only [follow] at h
     first | contradiction | simpa [List.append_assoc] using ih _ _ _ h
   | succ i =>
     cases i with
     | zero =>
       try simp only [follow] at h
       first | contradiction | simpa [List.append_assoc] using ih _ _ _ h
     | succ i =>
       cases i with
       | zero =>
         try simp only [follow] at h
         first | contradiction | simpa [List.append_assoc] using ih _ _ _ h
       | succ i =>
         try simp only [follow] at h
         contradiction


def oldestTarget (events : List Path) (index : Nat) : Option Path :=
 if index < events.length then events[events.length-1-index]? else none

theorem oldest_target_agrees (events : List Path) (index : Nat) :
    oldestTarget events index = events.reverse[index]? := by
 by_cases h : index < events.length
 · simp only [oldestTarget, if_pos h]
   exact (List.getElem?_reverse h).symm
 · have hi : events.reverse.length ≤ index := by simpa using Nat.le_of_not_gt h
   simp only [oldestTarget, if_neg h, List.getElem?_eq_none hi]

#print axioms follow_append
#print axioms source_from_follow
#print axioms source_in_segments
#print axioms follow_route
#print axioms oldest_target_agrees
end ProofAtlas.SourceCut.Binding
