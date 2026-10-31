import Lean

namespace AtlasExprReference
open Lean

/- Structural reference functions on all twelve Lean 4.33.1 Expr constructors.
   Payloads and annotations are preserved; universes are not Expr children. -/
def uses (e : Expr) (target : Nat) : Nat :=
 match e with
 | .bvar i => if i = target then 1 else 0
 | .app f a => uses f target + uses a target
 | .lam _ t b _ | .forallE _ t b _ => uses t target + uses b (target+1)
 | .letE _ t v b _ => uses t target + uses v target + uses b (target+1)
 | .mdata _ b | .proj _ _ b => uses b target
 | .fvar _ | .mvar _ | .sort _ | .const _ _ | .lit _ => 0

def size (e : Expr) : Nat :=
 match e with
 | .app f a => 1 + size f + size a
 | .lam _ t b _ | .forallE _ t b _ => 1 + size t + size b
 | .letE _ t v b _ => 1 + size t + size v + size b
 | .mdata _ b | .proj _ _ b => 1 + size b
 | .bvar _ | .fvar _ | .mvar _ | .sort _ | .const _ _ | .lit _ => 1

def lift (e : Expr) (amount cutoff : Nat) : Expr :=
 match e with
 | .bvar i => .bvar (if cutoff ≤ i then i+amount else i)
 | .app f a => .app (lift f amount cutoff) (lift a amount cutoff)
 | .lam n t b bi => .lam n (lift t amount cutoff) (lift b amount (cutoff+1)) bi
 | .forallE n t b bi => .forallE n (lift t amount cutoff) (lift b amount (cutoff+1)) bi
 | .letE n t v b flag => .letE n (lift t amount cutoff) (lift v amount cutoff) (lift b amount (cutoff+1)) flag
 | .mdata md b => .mdata md (lift b amount cutoff)
 | .proj n i b => .proj n i (lift b amount cutoff)
 | e => e

def substitute (e value : Expr) (depth : Nat) : Expr :=
 match e with
 | .bvar i => if i=depth then lift value depth 0 else .bvar (if depth<i then i-1 else i)
 | .app f a => .app (substitute f value depth) (substitute a value depth)
 | .lam n t b bi => .lam n (substitute t value depth) (substitute b value (depth+1)) bi
 | .forallE n t b bi => .forallE n (substitute t value depth) (substitute b value (depth+1)) bi
 | .letE n t v b flag => .letE n (substitute t value depth) (substitute v value depth) (substitute b value (depth+1)) flag
 | .mdata md b => .mdata md (substitute b value depth)
 | .proj n i b => .proj n i (substitute b value depth)
 | e => e

theorem lift_size (e : Expr) (amount cutoff : Nat) : size (lift e amount cutoff) = size e := by
 induction e generalizing cutoff <;> simp_all [lift,size]

theorem lift_uses_above (e : Expr) (amount cutoff target : Nat) (h : cutoff ≤ target) :
 uses (lift e amount cutoff) (target+amount) = uses e target := by
 induction e generalizing cutoff target with
 | bvar i =>
  by_cases hi : cutoff ≤ i
  · simp [lift,uses,hi]
  · have ht : i ≠ target := by omega
    have ha : i ≠ target+amount := by omega
    simp [lift,uses,hi,ht,ha]
 | _ => simp_all [lift,uses,Nat.add_assoc,Nat.add_comm]

theorem lift_uses_below (e : Expr) (amount cutoff target : Nat) (h : target < cutoff) :
 uses (lift e amount cutoff) target = uses e target := by
 induction e generalizing cutoff target with
 | bvar i =>
  by_cases hi : cutoff ≤ i
  · have ht : i ≠ target := by omega
    have ha : i+amount ≠ target := by omega
    simp [lift,uses,hi,ht,ha]
  · simp [lift,uses,hi]
 | _ => simp_all [lift,uses]

theorem lift_uses_gap (e : Expr) (amount cutoff target : Nat)
 (lo : cutoff ≤ target) (hi : target < cutoff+amount) :
 uses (lift e amount cutoff) target = 0 := by
 induction e generalizing cutoff target with
 | bvar i =>
  by_cases hc : cutoff ≤ i
  · have ht : i+amount ≠ target := by omega
    simp [lift,uses,hc,ht]
  · have ht : i ≠ target := by omega
    simp [lift,uses,hc,ht]
 | _ =>
  have hlo : cutoff+1 ≤ target+1 := by omega
  have hhi : target+1 < (cutoff+1)+amount := by omega
  simp_all [lift,uses]

theorem substitute_uses_below (e value : Expr) (depth target : Nat) (h : target < depth) :
 uses (substitute e value depth) target = uses e target := by
 induction e generalizing depth target with
 | bvar i =>
  by_cases hi : i=depth
  · subst i
    have hg := lift_uses_gap value depth 0 target (by omega) (by omega)
    have ht : depth ≠ target := by omega
    simpa [substitute,uses,ht] using hg
  · by_cases hd : depth<i
    · have ht : i ≠ target := by omega
      have ht' : i-1 ≠ target := by omega
      simp [substitute,uses,hi,hd,ht,ht']
    · simp [substitute,uses,hi,hd]
 | _ => simp_all [substitute,uses]

theorem substitute_uses_above (e value : Expr) (depth target : Nat) (h : depth ≤ target) :
 uses (substitute e value depth) target = uses e (target+1) + uses e depth * uses value (target-depth) := by
 induction e generalizing depth target with
 | bvar i =>
  by_cases hi : i=depth
  · subst i
    have hg := lift_uses_above value depth 0 (target-depth) (by omega)
    have ht : depth ≠ target+1 := by omega
    have he : target-depth+depth=target := by omega
    simpa [substitute,uses,ht,he] using hg
  · by_cases hd : depth<i
    · have he : i-1=target ↔ i=target+1 := by omega
      simp [substitute,uses,hi,hd,he]
    · have ht : i ≠ target := by omega
      have ht' : i ≠ target+1 := by omega
      simp [substitute,uses,hi,hd,ht,ht']
 | _ => simp_all [substitute,uses,Nat.add_mul,Nat.add_assoc] <;> omega

theorem substitute_size (e value : Expr) (depth : Nat) :
 size (substitute e value depth) + uses e depth = size e + uses e depth * size value := by
 induction e generalizing depth with
 | bvar i =>
  by_cases hi : i=depth
  · simp [substitute,uses,size,hi,lift_size,Nat.add_comm]
  · by_cases hd : depth<i <;> simp [substitute,uses,size,hi,hd]
 | app f a ihF ihA =>
  have hf := ihF depth
  have ha := ihA depth
  simp only [substitute,size,uses,Nat.add_mul]
  omega
 | lam n t b bi ihT ihB | forallE n t b bi ihT ihB =>
  have ht := ihT depth
  have hb := ihB (depth+1)
  simp only [substitute,size,uses,Nat.add_mul]
  omega
 | letE n t v b flag ihT ihV ihB =>
  have ht := ihT depth
  have hv := ihV depth
  have hb := ihB (depth+1)
  simp only [substitute,size,uses,Nat.add_mul]
  omega
 | mdata md b ihB | proj n i b ihB =>
  have hb := ihB depth
  simp only [substitute,size,uses]
  omega
 | _ => simp [substitute,size,uses]

theorem instantiate_uses (e value : Expr) (target : Nat) :
 uses (substitute e value 0) target = uses e (target+1) + uses e 0 * uses value target := by
 simpa using substitute_uses_above e value 0 target (Nat.zero_le target)

theorem instantiate_size (e value : Expr) :
 size (substitute e value 0) + uses e 0 = size e + uses e 0 * size value :=
 substitute_size e value 0

def swapIndex (depth index : Nat) : Nat :=
 if index=depth then depth+1 else if index=depth+1 then depth else index

theorem swapIndex_involutive (depth index : Nat) : swapIndex depth (swapIndex depth index) = index := by
 by_cases h0 : index=depth
 · simp [swapIndex,h0]
 · by_cases h1 : index=depth+1
   · simp [swapIndex,h1]
   · simp [swapIndex,h0,h1]

theorem swapIndex_injective (depth i j : Nat) : swapIndex depth i = swapIndex depth j ↔ i=j := by
 constructor
 · intro h
   have hh := congrArg (swapIndex depth) h
   simpa [swapIndex_involutive] using hh
 · intro h
   exact congrArg (swapIndex depth) h

theorem swapIndex_succ (depth index : Nat) : swapIndex (depth+1) (index+1) = swapIndex depth index + 1 := by
 by_cases h0 : index=depth
 · simp [swapIndex,h0]
 · by_cases h1 : index=depth+1
   · simp [swapIndex,h1,Nat.add_assoc]
   · simp [swapIndex,h0,h1]

def swap (e : Expr) (depth : Nat) : Expr :=
 match e with
 | .bvar i => .bvar (swapIndex depth i)
 | .app f a => .app (swap f depth) (swap a depth)
 | .lam n t b bi => .lam n (swap t depth) (swap b (depth+1)) bi
 | .forallE n t b bi => .forallE n (swap t depth) (swap b (depth+1)) bi
 | .letE n t v b flag => .letE n (swap t depth) (swap v depth) (swap b (depth+1)) flag
 | .mdata md b => .mdata md (swap b depth)
 | .proj n i b => .proj n i (swap b depth)
 | e => e

theorem swap_involutive (e : Expr) (depth : Nat) : swap (swap e depth) depth = e := by
 induction e generalizing depth <;> simp_all [swap,swapIndex_involutive]

theorem swap_size (e : Expr) (depth : Nat) : size (swap e depth) = size e := by
 induction e generalizing depth <;> simp_all [swap,size]

theorem swap_uses (e : Expr) (depth target : Nat) :
 uses (swap e depth) (swapIndex depth target) = uses e target := by
 induction e generalizing depth target with
 | bvar i => simp [swap,uses,swapIndex_injective]
 | _ => simp_all only [swap,uses,← swapIndex_succ]

def exchanged (letName inputName : Name) (a value domain body : Expr) (bi : BinderInfo) : Expr :=
 .lam inputName (substitute domain value 0)
  (.letE letName (lift a 1 0) (lift value 1 0) (swap body 0) false) bi

theorem exchange_size (letName inputName : Name) (a value domain body : Expr)
 (bi : BinderInfo) (flag : Bool) :
 size (exchanged letName inputName a value domain body bi) + uses domain 0 =
 size (.letE letName a value (.lam inputName domain body bi) flag) + uses domain 0 * size value := by
 have h := instantiate_size domain value
 simp only [exchanged,size,lift_size,swap_size]
 omega

end AtlasExprReference
