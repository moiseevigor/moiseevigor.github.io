/- Included after the unchanged Reference.lean. Structural scope bounds make
   protected shared subtrees reusable without traversing their occurrences. -/
namespace AtlasExprReferencePruning
open Lean AtlasExprReference

def scope (e : Expr) : Nat :=
 match e with
 | .bvar i => i+1
 | .app f a => max (scope f) (scope a)
 | .lam _ t b _ | .forallE _ t b _ => max (scope t) (scope b-1)
 | .letE _ t v b _ => max (max (scope t) (scope v)) (scope b-1)
 | .mdata _ b | .proj _ _ b => scope b
 | _ => 0

theorem lift_protected (e : Expr) (amount cutoff : Nat) (h : scope e ≤ cutoff) :
 AtlasExprReference.lift e amount cutoff = e := by
 induction e generalizing cutoff with
 | bvar i =>
  have hi : ¬cutoff≤i := by simp only [scope] at h; omega
  simp [AtlasExprReference.lift,hi]
 | app f a hf ha =>
  simp only [scope,Nat.max_le] at h
  simp [AtlasExprReference.lift,hf cutoff h.1,ha cutoff h.2]
 | lam n t b bi ht hb | forallE n t b bi ht hb =>
  simp only [scope,Nat.max_le] at h
  have hd : scope b ≤ cutoff+1 := by omega
  simp [AtlasExprReference.lift,ht cutoff h.1,hb (cutoff+1) hd]
 | letE n t v b flag ht hv hb =>
  simp only [scope,Nat.max_le] at h
  have hd : scope b ≤ cutoff+1 := by omega
  simp [AtlasExprReference.lift,ht cutoff h.1.1,hv cutoff h.1.2,hb (cutoff+1) hd]
 | mdata md b hb | proj n i b hb => simpa [AtlasExprReference.lift,scope] using congrArg (fun x => x) (hb cutoff h)
 | _ => rfl

theorem swap_protected (e : Expr) (depth : Nat) (h : scope e ≤ depth) :
 AtlasExprReference.swap e depth = e := by
 induction e generalizing depth with
 | bvar i =>
  have h0 : i≠depth := by simp only [scope] at h; omega
  have h1 : i≠depth+1 := by simp only [scope] at h; omega
  simp [AtlasExprReference.swap,swapIndex,h0,h1]
 | app f a hf ha =>
  simp only [scope,Nat.max_le] at h
  simp [AtlasExprReference.swap,hf depth h.1,ha depth h.2]
 | lam n t b bi ht hb | forallE n t b bi ht hb =>
  simp only [scope,Nat.max_le] at h
  have hd : scope b ≤ depth+1 := by omega
  simp [AtlasExprReference.swap,ht depth h.1,hb (depth+1) hd]
 | letE n t v b flag ht hv hb =>
  simp only [scope,Nat.max_le] at h
  have hd : scope b ≤ depth+1 := by omega
  simp [AtlasExprReference.swap,ht depth h.1.1,hv depth h.1.2,hb (depth+1) hd]
 | mdata md b hb | proj n i b hb => simpa [AtlasExprReference.swap,scope] using congrArg (fun x => x) (hb depth h)
 | _ => rfl

theorem substitute_protected (e value : Expr) (depth : Nat) (h : scope e ≤ depth) :
 AtlasExprReference.substitute e value depth = e := by
 induction e generalizing depth with
 | bvar i =>
  have h0 : i≠depth := by simp only [scope] at h; omega
  have h1 : ¬depth<i := by simp only [scope] at h; omega
  simp [AtlasExprReference.substitute,h0,h1]
 | app f a hf ha =>
  simp only [scope,Nat.max_le] at h
  simp [AtlasExprReference.substitute,hf depth h.1,ha depth h.2]
 | lam n t b bi ht hb | forallE n t b bi ht hb =>
  simp only [scope,Nat.max_le] at h
  have hd : scope b ≤ depth+1 := by omega
  simp [AtlasExprReference.substitute,ht depth h.1,hb (depth+1) hd]
 | letE n t v b flag ht hv hb =>
  simp only [scope,Nat.max_le] at h
  have hd : scope b ≤ depth+1 := by omega
  simp [AtlasExprReference.substitute,ht depth h.1.1,hv depth h.1.2,hb (depth+1) hd]
 | mdata md b hb | proj n i b hb => simpa [AtlasExprReference.substitute,scope] using congrArg (fun x => x) (hb depth h)
 | _ => rfl
end AtlasExprReferencePruning
