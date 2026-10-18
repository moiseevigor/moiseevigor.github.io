/- Lexical targets are source occurrence paths, independent of displayed card IDs. -/
namespace ProofAtlas.SourceCut.Binding
open Lean
abbrev Path := List Nat
abbrev Context := List Path

/-- Source lookup follows one literal kernel path, never expands an unrelated subtree. -/
def source : Expr → Context → Path → Path → Option Path
 | .bvar i, ctx, _, [] => ctx[i]?
 | .app f _, ctx, atRoot, 0::p => source f ctx (atRoot++[0]) p
 | .app _ a, ctx, atRoot, 1::p => source a ctx (atRoot++[1]) p
 | .lam _ d _ _, ctx, atRoot, 0::p | .forallE _ d _ _, ctx, atRoot, 0::p => source d ctx (atRoot++[0]) p
 | .lam _ _ b _, ctx, atRoot, 1::p | .forallE _ _ b _, ctx, atRoot, 1::p => source b (atRoot::ctx) (atRoot++[1]) p
 | .letE _ t _ _ _, ctx, atRoot, 0::p => source t ctx (atRoot++[0]) p
 | .letE _ _ v _ _, ctx, atRoot, 1::p => source v ctx (atRoot++[1]) p
 | .letE _ _ _ b _, ctx, atRoot, 2::p => source b (atRoot::ctx) (atRoot++[2]) p
 | .mdata _ e, ctx, atRoot, 0::p | .proj _ _ e, ctx, atRoot, 0::p => source e ctx (atRoot++[0]) p
 | _, _, _, _ => none

/-- Sparse-cut lookup follows retained constructors. A hole contributes no visible link. -/
def inCut : {e : Expr} → Cut e → Context → Path → Path → Option Path
 | _, .bvar i, ctx, _, [] => ctx[i]?
 | _, .app f _, ctx, atRoot, 0::p => inCut f ctx (atRoot++[0]) p
 | _, .app _ a, ctx, atRoot, 1::p => inCut a ctx (atRoot++[1]) p
 | _, .lam _ _ d _, ctx, atRoot, 0::p | _, .forallE _ _ d _, ctx, atRoot, 0::p => inCut d ctx (atRoot++[0]) p
 | _, .lam _ _ _ b, ctx, atRoot, 1::p | _, .forallE _ _ _ b, ctx, atRoot, 1::p => inCut b (atRoot::ctx) (atRoot++[1]) p
 | _, .letE _ _ t _ _, ctx, atRoot, 0::p => inCut t ctx (atRoot++[0]) p
 | _, .letE _ _ _ v _, ctx, atRoot, 1::p => inCut v ctx (atRoot++[1]) p
 | _, .letE _ _ _ _ b, ctx, atRoot, 2::p => inCut b (atRoot::ctx) (atRoot++[2]) p
 | _, .mdata _ e, ctx, atRoot, 0::p | _, .proj _ _ e, ctx, atRoot, 0::p => inCut e ctx (atRoot++[0]) p
 | _, _, _, _, _ => none

theorem agrees (c : Cut e) (ctx : Context) (atRoot p : Path) :
    inCut c ctx atRoot p = if visible c p then source e ctx atRoot p else none := by
 induction c generalizing ctx atRoot p <;> cases p with
 | nil => simp [inCut,source,visible]
 | cons i ps =>
   cases i with
   | zero => simp_all [inCut,source,visible]
   | succ i =>
     cases i with
     | zero => simp_all [inCut,source,visible]
     | succ i =>
       cases i with
       | zero => simp_all [inCut,source,visible]
       | succ i => simp_all [inCut,source,visible]

theorem visible_of_target (c : Cut e) (ctx : Context) (atRoot p target : Path)
    (h : inCut c ctx atRoot p = some target) : visible c p = true := by
 rw [agrees] at h
 split at h
 next hv => exact hv
 next => contradiction

theorem source_target (c : Cut e) (ctx : Context) (atRoot p target : Path)
    (h : inCut c ctx atRoot p = some target) : source e ctx atRoot p = some target := by
 have hv := visible_of_target c ctx atRoot p target h
 simpa [agrees,hv] using h

theorem refines_target (h : Refines c c') (ctx : Context) (atRoot p target : Path)
    (hb : inCut c ctx atRoot p = some target) : inCut c' ctx atRoot p = some target := by
 have hv := visible_monotone h p (visible_of_target c ctx atRoot p target hb)
 rw [agrees,if_pos hv]
 exact source_target c ctx atRoot p target hb

#print axioms agrees
#print axioms source_target
#print axioms refines_target
end ProofAtlas.SourceCut.Binding
