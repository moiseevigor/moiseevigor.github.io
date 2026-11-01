import Instantiation

/- A total, proof-carrying executor over postorder expression rows. Cache keys
   are natural-number addresses, not Expr's opaque structural comparison.
   The decoder and the represented mathematical typing are separate gates. -/
namespace ProofAtlas.CertifiedSubstitution
open Lean ProofAtlas.ContextInstantiation

inductive Frame (α : Type) where
  | bvar (index : Nat)
  | fvar (id : FVarId)
  | mvar (id : MVarId)
  | sort (level : Level)
  | const (name : Name) (levels : List Level)
  | app (fn arg : α)
  | lam (name : Name) (type body : α) (info : BinderInfo)
  | forallE (name : Name) (type body : α) (info : BinderInfo)
  | letE (name : Name) (type value body : α) (nondep : Bool)
  | lit (value : Literal)
  | mdata (data : MData) (body : α)
  | proj (name : Name) (index : Nat) (body : α)

def Frame.build (value : α → Expr) : Frame α → Expr
  | .bvar i => .bvar i
  | .fvar i => .fvar i
  | .mvar i => .mvar i
  | .sort u => .sort u
  | .const n us => .const n us
  | .app f a => .app (value f) (value a)
  | .lam n t b bi => .lam n (value t) (value b) bi
  | .forallE n t b bi => .forallE n (value t) (value b) bi
  | .letE n t v b nd => .letE n (value t) (value v) (value b) nd
  | .lit l => .lit l
  | .mdata md b => .mdata md (value b)
  | .proj n i b => .proj n i (value b)

/-- Every child reference is earlier than its parent. Missing finite-table rows
    can be assigned an explicit leaf by the adapter; there are no cyclic rows. -/
abbrev Graph := (i : Nat) → Frame (Fin i)

def interpret (g : Graph) (i : Nat) : Expr :=
  (g i).build (fun child => interpret g child.val)
termination_by i
decreasing_by exact child.isLt

theorem interpret_unfold (g : Graph) (i : Nat) :
    interpret g i = (g i).build (fun child => interpret g child.val) := by
  rw [interpret]

def liftRen (ρ : Renaming) : Nat → Renaming
  | 0 => ρ
  | d+1 => upRen (liftRen ρ d)

def liftSubst (σ : Substitution) : Nat → Substitution
  | 0 => σ
  | d+1 => upSubst (liftSubst σ d)

theorem liftSubst_below (σ : Substitution) (h : i < d) :
    liftSubst σ d i = .bvar i := by
  induction d generalizing i with
  | zero => exact (Nat.not_lt_zero _ h).elim
  | succ d ih =>
    cases i with
    | zero => rfl
    | succ i =>
      rw [liftSubst, upSubst, ih (i := i) (Nat.lt_of_succ_lt_succ h)]
      rfl

theorem liftSubst_above (σ : Substitution) (d j : Nat) :
    liftSubst σ d (d+j) = rename (fun i => i+d) (σ j) := by
  induction d with
  | zero =>
    simp only [liftSubst, Nat.zero_add, Nat.add_zero]
    exact (rename_id (σ j)).symm
  | succ d ih =>
    have index : d+1+j = (d+j)+1 := by omega
    rw [index, liftSubst, upSubst, ih, rename_comp]
    congr 1

theorem liftSubst_at (σ : Substitution) (h : d ≤ i) :
    liftSubst σ d i = rename (fun j => j+d) (σ (i-d)) := by
  have index : i = d+(i-d) := by omega
  calc
    liftSubst σ d i = liftSubst σ d (d+(i-d)) := congrArg _ index
    _ = _ := liftSubst_above σ d (i-d)

def substitution (g : Graph) (images : Array Nat) : Substitution := fun i =>
  if i < images.size then interpret g images[images.size-1-i]!
  else .bvar (i-images.size)

def Renamed (g : Graph) (key : Nat × Nat × Nat) :=
  { out : Expr // rename (liftRen (fun j => j+key.1) key.2.2)
      (interpret g key.2.1) = out }

def Substituted (g : Graph) (images : Array Nat) (key : Nat × Nat) :=
  { out : Expr // ProofAtlas.ContextInstantiation.subst (liftSubst (substitution g images) key.2)
      (interpret g key.1) = out }

def Copied (g : Graph) (i : Nat) := {out : Expr // interpret g i = out}

structure Work (g : Graph) (images : Array Nat) where
  copies : Std.DHashMap Nat (Copied g) := ∅
  renamings : Std.DHashMap (Nat × Nat × Nat) (Renamed g) := ∅
  substitutions : Std.DHashMap (Nat × Nat) (Substituted g images) := ∅

def Work.size (s : Work g images) : Nat := s.copies.size+s.renamings.size+s.substitutions.size

theorem liftRen_id (depth : Nat) : liftRen id depth = id := by
  induction depth with
  | zero => rfl
  | succ depth ih => simp [liftRen, ih, upRen_id]

theorem liftRen_zero (depth : Nat) : liftRen (fun j => j+0) depth = id := by
  simp only [Nat.add_zero]
  exact liftRen_id depth

def copyGraph (g : Graph) (images : Array Nat) (limit : Nat) :
    (fuel node : Nat) → StateT (Work g images) (Except String) (Copied g node)
  | 0, _ => throw "Copy depth bound"
  | fuel+1, node => do
    if let some out := (← get).copies.get? node then return out
    unless (← get).size < limit do throw "Certificate table bound"
    let frame := g node
    let out : Copied g node ← match h : frame with
      | .bvar i => do
        pure ⟨.bvar i, by
          rw [interpret_unfold]; simp [frame, h, Frame.build]⟩
      | .fvar i => do
        pure ⟨.fvar i, by
          rw [interpret_unfold]; simp [frame, h, Frame.build]⟩
      | .mvar i => do
        pure ⟨.mvar i, by
          rw [interpret_unfold]; simp [frame, h, Frame.build]⟩
      | .sort u => do
        pure ⟨.sort u, by
          rw [interpret_unfold]; simp [frame, h, Frame.build]⟩
      | .const n us => do
        pure ⟨.const n us, by
          rw [interpret_unfold]; simp [frame, h, Frame.build]⟩
      | .lit l => do
        pure ⟨.lit l, by
          rw [interpret_unfold]; simp [frame, h, Frame.build]⟩
      | .app f a => do
        let rf ← copyGraph g images limit fuel f.val
        let ra ← copyGraph g images limit fuel a.val
        pure ⟨.app rf.val ra.val, by
          rw [interpret_unfold]; simp [frame, h, Frame.build, rf.property, ra.property]⟩
      | .lam n t b bi => do
        let rt ← copyGraph g images limit fuel t.val
        let rb ← copyGraph g images limit fuel b.val
        pure ⟨.lam n rt.val rb.val bi, by
          rw [interpret_unfold]; simp [frame, h, Frame.build, rt.property, rb.property]⟩
      | .forallE n t b bi => do
        let rt ← copyGraph g images limit fuel t.val
        let rb ← copyGraph g images limit fuel b.val
        pure ⟨.forallE n rt.val rb.val bi, by
          rw [interpret_unfold]; simp [frame, h, Frame.build, rt.property, rb.property]⟩
      | .letE n t v b nd => do
        let rt ← copyGraph g images limit fuel t.val
        let rv ← copyGraph g images limit fuel v.val
        let rb ← copyGraph g images limit fuel b.val
        pure ⟨.letE n rt.val rv.val rb.val nd, by
          rw [interpret_unfold]; simp [frame, h, Frame.build, rt.property, rv.property, rb.property]⟩
      | .mdata md b => do
        let rb ← copyGraph g images limit fuel b.val
        pure ⟨.mdata md rb.val, by
          rw [interpret_unfold]; simp [frame, h, Frame.build, rb.property]⟩
      | .proj n i b => do
        let rb ← copyGraph g images limit fuel b.val
        pure ⟨.proj n i rb.val, by
          rw [interpret_unfold]; simp [frame, h, Frame.build, rb.property]⟩
    unless (← get).size < limit do throw "Certificate table bound"
    modify fun s => {s with copies := s.copies.insert node out}
    return out

def renameGraph (g : Graph) (images : Array Nat) (limit : Nat) :
    (fuel amount node depth : Nat) →
      StateT (Work g images) (Except String) (Renamed g (amount,node,depth))
  | 0, _, _, _ => throw "Renaming depth bound"
  | fuel+1, amount, node, depth => do
    if zero : amount = 0 then
      let copy ← copyGraph g images limit (fuel+1) node
      return ⟨copy.val, by rw [zero, liftRen_zero, rename_id]; exact copy.property⟩
    let key := (amount,node,depth)
    if let some out := (← get).renamings.get? key then return out
    unless (← get).size < limit do throw "Certificate table bound"
    let frame := g node
    let out : Renamed g key ← match h : frame with
      | .bvar i => pure ⟨.bvar (liftRen (fun j => j+amount) depth i), by
          dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, rename]⟩
      | .fvar i => pure ⟨.fvar i, by dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, rename]⟩
      | .mvar i => pure ⟨.mvar i, by dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, rename]⟩
      | .sort u => pure ⟨.sort u, by dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, rename]⟩
      | .const n us => pure ⟨.const n us, by dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, rename]⟩
      | .lit l => pure ⟨.lit l, by dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, rename]⟩
      | .app f a => do
        let rf ← renameGraph g images limit fuel amount f.val depth
        let ra ← renameGraph g images limit fuel amount a.val depth
        pure ⟨.app rf.val ra.val, by
          dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, rename, rf.property, ra.property]⟩
      | .lam n t b bi => do
        let rt ← renameGraph g images limit fuel amount t.val depth
        let rb ← renameGraph g images limit fuel amount b.val (depth+1)
        pure ⟨.lam n rt.val rb.val bi, by
          dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, rename, liftRen, rt.property]
          exact rb.property⟩
      | .forallE n t b bi => do
        let rt ← renameGraph g images limit fuel amount t.val depth
        let rb ← renameGraph g images limit fuel amount b.val (depth+1)
        pure ⟨.forallE n rt.val rb.val bi, by
          dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, rename, liftRen, rt.property]
          exact rb.property⟩
      | .letE n t v b nd => do
        let rt ← renameGraph g images limit fuel amount t.val depth
        let rv ← renameGraph g images limit fuel amount v.val depth
        let rb ← renameGraph g images limit fuel amount b.val (depth+1)
        pure ⟨.letE n rt.val rv.val rb.val nd, by
          dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, rename, liftRen, rt.property, rv.property]
          exact rb.property⟩
      | .mdata md b => do
        let rb ← renameGraph g images limit fuel amount b.val depth
        pure ⟨.mdata md rb.val, by
          dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, rename, rb.property]⟩
      | .proj n i b => do
        let rb ← renameGraph g images limit fuel amount b.val depth
        pure ⟨.proj n i rb.val, by
          dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, rename, rb.property]⟩
    unless (← get).size < limit do throw "Certificate table bound"
    modify fun s => {s with renamings := s.renamings.insert key out}
    return out

def variableGraph (g : Graph) (images : Array Nat) (limit fuel depth i : Nat) :
    StateT (Work g images) (Except String)
      {out : Expr // liftSubst (substitution g images) depth i = out} := do
  if below : i < depth then
    return ⟨.bvar i, liftSubst_below _ below⟩
  else if image : i-depth < images.size then
    let row := images[images.size-1-(i-depth)]!
    let result ← renameGraph g images limit fuel depth row 0
    return ⟨result.val, by
      rw [liftSubst_at _ (by omega)]
      simpa only [substitution, if_pos image, liftRen] using result.property⟩
  else
    return ⟨.bvar (i-images.size), by
      rw [liftSubst_at _ (by omega)]
      simp only [substitution, if_neg image, rename]
      congr 1
      omega⟩

def substituteGraph (g : Graph) (images : Array Nat) (limit : Nat) :
    (fuel node depth : Nat) →
      StateT (Work g images) (Except String) (Substituted g images (node,depth))
  | 0, _, _ => throw "Substitution depth bound"
  | fuel+1, node, depth => do
    let key := (node,depth)
    if let some out := (← get).substitutions.get? key then return out
    unless (← get).size < limit do throw "Certificate table bound"
    let frame := g node
    let out : Substituted g images key ← match h : frame with
      | .bvar i => do
        let result ← variableGraph g images limit fuel depth i
        pure ⟨result.val, by
          dsimp only [key]; rw [interpret_unfold]
          simpa only [frame, h, Frame.build, ProofAtlas.ContextInstantiation.subst] using result.property⟩
      | .fvar i => pure ⟨.fvar i, by
          dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, ProofAtlas.ContextInstantiation.subst]⟩
      | .mvar i => pure ⟨.mvar i, by
          dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, ProofAtlas.ContextInstantiation.subst]⟩
      | .sort u => pure ⟨.sort u, by
          dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, ProofAtlas.ContextInstantiation.subst]⟩
      | .const n us => pure ⟨.const n us, by
          dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, ProofAtlas.ContextInstantiation.subst]⟩
      | .lit l => pure ⟨.lit l, by
          dsimp only [key]; rw [interpret_unfold]; simp [frame, h, Frame.build, ProofAtlas.ContextInstantiation.subst]⟩
      | .app f a => do
        let rf ← substituteGraph g images limit fuel f.val depth
        let ra ← substituteGraph g images limit fuel a.val depth
        pure ⟨.app rf.val ra.val, by
          dsimp only [key]; rw [interpret_unfold]
          simp [frame, h, Frame.build, ProofAtlas.ContextInstantiation.subst, rf.property, ra.property]⟩
      | .lam n t b bi => do
        let rt ← substituteGraph g images limit fuel t.val depth
        let rb ← substituteGraph g images limit fuel b.val (depth+1)
        pure ⟨.lam n rt.val rb.val bi, by
          dsimp only [key]; rw [interpret_unfold]
          simp [frame, h, Frame.build, ProofAtlas.ContextInstantiation.subst, liftSubst, rt.property]
          exact rb.property⟩
      | .forallE n t b bi => do
        let rt ← substituteGraph g images limit fuel t.val depth
        let rb ← substituteGraph g images limit fuel b.val (depth+1)
        pure ⟨.forallE n rt.val rb.val bi, by
          dsimp only [key]; rw [interpret_unfold]
          simp [frame, h, Frame.build, ProofAtlas.ContextInstantiation.subst, liftSubst, rt.property]
          exact rb.property⟩
      | .letE n t v b nd => do
        let rt ← substituteGraph g images limit fuel t.val depth
        let rv ← substituteGraph g images limit fuel v.val depth
        let rb ← substituteGraph g images limit fuel b.val (depth+1)
        pure ⟨.letE n rt.val rv.val rb.val nd, by
          dsimp only [key]; rw [interpret_unfold]
          simp [frame, h, Frame.build, ProofAtlas.ContextInstantiation.subst, liftSubst, rt.property, rv.property]
          exact rb.property⟩
      | .mdata md b => do
        let rb ← substituteGraph g images limit fuel b.val depth
        pure ⟨.mdata md rb.val, by
          dsimp only [key]; rw [interpret_unfold]
          simp [frame, h, Frame.build, ProofAtlas.ContextInstantiation.subst, rb.property]⟩
      | .proj n i b => do
        let rb ← substituteGraph g images limit fuel b.val depth
        pure ⟨.proj n i rb.val, by
          dsimp only [key]; rw [interpret_unfold]
          simp [frame, h, Frame.build, ProofAtlas.ContextInstantiation.subst, rb.property]⟩
    unless (← get).size < limit do throw "Certificate table bound"
    modify fun s => {s with substitutions := s.substitutions.insert key out}
    return out

def execute (g : Graph) (images : Array Nat) (limit fuel root : Nat) :
    Except String Expr :=
  match (substituteGraph g images limit fuel root 0).run {} with
  | .error message => .error message
  | .ok (result, _) => .ok result.val

theorem execute_correct (g : Graph) (images : Array Nat) (limit fuel root : Nat)
    (accepted : execute g images limit fuel root = .ok out) :
    ProofAtlas.ContextInstantiation.subst (substitution g images) (interpret g root) = out := by
  unfold execute at accepted
  cases h : (substituteGraph g images limit fuel root 0).run {} with
  | error message => simp only [h] at accepted; cases accepted
  | ok pair =>
    obtain ⟨result, work⟩ := pair
    simp only [h] at accepted
    exact result.property.trans (Except.ok.inj accepted)

#print axioms interpret_unfold
#print axioms liftSubst_below
#print axioms liftSubst_above
#print axioms liftSubst_at
#print axioms liftRen_id
#print axioms liftRen_zero
#print axioms copyGraph
#print axioms renameGraph
#print axioms variableGraph
#print axioms substituteGraph
#print axioms execute_correct

end ProofAtlas.CertifiedSubstitution
