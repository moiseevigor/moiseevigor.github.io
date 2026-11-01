import Certified

/- Ordered Expr paths are occurrence coordinates, not shared row identities.
   All statements concern syntax; no kernel typing judgment is inferred. -/
namespace ProofAtlas.SubstitutionPaths
open Lean ProofAtlas.ContextInstantiation ProofAtlas.CertifiedSubstitution

/-- The second coordinate counts binders introduced by this one field. -/
def field : Expr → Nat → Option (Expr × Nat)
  | .app f _, 0 => some (f,0)
  | .app _ a, 1 => some (a,0)
  | .lam _ t _ _, 0 => some (t,0)
  | .forallE _ t _ _, 0 => some (t,0)
  | .lam _ _ b _, 1 => some (b,1)
  | .forallE _ _ b _, 1 => some (b,1)
  | .letE _ t _ _ _, 0 => some (t,0)
  | .letE _ _ v _ _, 1 => some (v,0)
  | .letE _ _ _ b _, 2 => some (b,1)
  | .mdata _ b, 0 => some (b,0)
  | .proj _ _ b, 0 => some (b,0)
  | _, _ => none

def follow (e : Expr) : List Nat → Option (Expr × Nat)
  | [] => some (e,0)
  | slot :: rest =>
      match field e slot with
      | none => none
      | some (child,binds) =>
          match follow child rest with
          | none => none
          | some (out,depth) => some (out,binds+depth)

theorem liftSubst_add (σ : Substitution) (a b : Nat) :
    liftSubst σ (a+b) = liftSubst (liftSubst σ a) b := by
  induction b with
  | zero => rfl
  | succ b ih => exact congrArg upSubst ih

theorem liftRen_add (ρ : Renaming) (a b : Nat) :
    liftRen ρ (a+b) = liftRen (liftRen ρ a) b := by
  induction b with
  | zero => rfl
  | succ b ih => exact congrArg upRen ih

theorem field_subst (σ : Substitution) (e child : Expr) (slot depth : Nat)
    (h : field e slot = some (child,depth)) :
    field (subst σ e) slot = some (subst (liftSubst σ depth) child,depth) := by
  cases e <;> cases slot with
  | zero => simp only [field, Option.some.injEq, Prod.mk.injEq] at h <;>
      rcases h with ⟨rfl,rfl⟩ <;> rfl
  | succ slot =>
      cases slot with
      | zero => simp only [field, Option.some.injEq, Prod.mk.injEq] at h <;>
          rcases h with ⟨rfl,rfl⟩ <;> rfl
      | succ slot =>
          cases slot with
          | zero => simp only [field, Option.some.injEq, Prod.mk.injEq] at h <;>
              rcases h with ⟨rfl,rfl⟩ <;> rfl
          | succ slot => simp_all [field]

theorem field_rename (ρ : Renaming) (e child : Expr) (slot depth : Nat)
    (h : field e slot = some (child,depth)) :
    field (rename ρ e) slot = some (rename (liftRen ρ depth) child,depth) := by
  cases e <;> cases slot with
  | zero => simp only [field, Option.some.injEq, Prod.mk.injEq] at h <;>
      rcases h with ⟨rfl,rfl⟩ <;> rfl
  | succ slot =>
      cases slot with
      | zero => simp only [field, Option.some.injEq, Prod.mk.injEq] at h <;>
          rcases h with ⟨rfl,rfl⟩ <;> rfl
      | succ slot =>
          cases slot with
          | zero => simp only [field, Option.some.injEq, Prod.mk.injEq] at h <;>
              rcases h with ⟨rfl,rfl⟩ <;> rfl
          | succ slot => simp_all [field]

/-- A valid source path survives substitution. Invalid source paths can become
    valid in an inserted image, so an unconditional Option equality is false. -/
theorem follow_subst (σ : Substitution) (e out : Expr) (path : List Nat) (depth : Nat)
    (h : follow e path = some (out,depth)) :
    follow (subst σ e) path = some (subst (liftSubst σ depth) out,depth) := by
  induction path generalizing σ e depth with
  | nil => simp only [follow, Option.some.injEq, Prod.mk.injEq] at h
           rcases h with ⟨rfl,rfl⟩
           rfl
  | cons slot rest ih =>
      simp only [follow] at h
      cases hf : field e slot with
      | none => simp [hf] at h
      | some pair =>
          rcases pair with ⟨child,binds⟩
          cases hp : follow child rest with
          | none => simp [hf, hp] at h
          | some pair =>
              rcases pair with ⟨selected,d⟩
              simp only [hf, hp, Option.some.injEq, Prod.mk.injEq] at h
              rcases h with ⟨rfl,rfl⟩
              simp only [follow, field_subst σ e child slot binds hf,
                ih (liftSubst σ binds) child d hp, liftSubst_add]

theorem follow_rename (ρ : Renaming) (e out : Expr) (path : List Nat) (depth : Nat)
    (h : follow e path = some (out,depth)) :
    follow (rename ρ e) path = some (rename (liftRen ρ depth) out,depth) := by
  induction path generalizing ρ e depth with
  | nil => simp only [follow, Option.some.injEq, Prod.mk.injEq] at h
           rcases h with ⟨rfl,rfl⟩
           rfl
  | cons slot rest ih =>
      simp only [follow] at h
      cases hf : field e slot with
      | none => simp [hf] at h
      | some pair =>
          rcases pair with ⟨child,binds⟩
          cases hp : follow child rest with
          | none => simp [hf, hp] at h
          | some pair =>
              rcases pair with ⟨selected,d⟩
              simp only [hf, hp, Option.some.injEq, Prod.mk.injEq] at h
              rcases h with ⟨rfl,rfl⟩
              simp only [follow, field_rename ρ e child slot binds hf,
                ih (liftRen ρ binds) child d hp, liftRen_add]

theorem follow_append (e middle out : Expr) (front back : List Nat) (d k : Nat)
    (hp : follow e front = some (middle,d)) (hs : follow middle back = some (out,k)) :
    follow e (front ++ back) = some (out,d+k) := by
  induction front generalizing e d with
  | nil => simp only [follow, Option.some.injEq, Prod.mk.injEq] at hp
           rcases hp with ⟨rfl,rfl⟩
           simpa using hs
  | cons slot rest ih =>
      cases hf : field e slot with
      | none => simp [follow, hf] at hp
      | some pair =>
          rcases pair with ⟨child,binds⟩
          cases hr : follow child rest with
          | none => simp [follow, hf, hr] at hp
          | some pair =>
              rcases pair with ⟨selected,n⟩
              simp only [follow, hf, hr, Option.some.injEq,
                Prod.mk.injEq] at hp
              rcases hp with ⟨rfl,rfl⟩
              simp only [List.cons_append, follow, hf,
                ih child n hr, Nat.add_assoc]

theorem field_rename_map (ρ : Renaming) (e : Expr) (slot : Nat) :
    field (rename ρ e) slot =
      (field e slot).map (fun (child,d) => (rename (liftRen ρ d) child,d)) := by
  cases e <;> cases slot with
  | zero => rfl
  | succ slot => cases slot with
    | zero => rfl
    | succ slot => cases slot <;> rfl

/-- Renaming preserves the whole path domain, including invalid paths. -/
theorem follow_rename_map (ρ : Renaming) (e : Expr) (path : List Nat) :
    follow (rename ρ e) path =
      (follow e path).map (fun (out,d) => (rename (liftRen ρ d) out,d)) := by
  induction path generalizing ρ e with
  | nil => rfl
  | cons slot rest ih =>
      cases hf : field e slot with
      | none => simp [follow, field_rename_map, hf]
      | some pair =>
          rcases pair with ⟨child,binds⟩
          cases hp : follow child rest with
          | none => simp [follow, field_rename_map, hf, ih, hp]
          | some pair =>
              rcases pair with ⟨out,d⟩
              simp [follow, field_rename_map, hf, ih, hp, liftRen_add]

/-- A field in a postorder graph retains its stored child and binder increment. -/
def frameField {α : Type} : Frame α → Nat → Option (α × Nat)
  | .app f _, 0 => some (f,0)
  | .app _ a, 1 => some (a,0)
  | .lam _ t _ _, 0 => some (t,0)
  | .forallE _ t _ _, 0 => some (t,0)
  | .lam _ _ b _, 1 => some (b,1)
  | .forallE _ _ b _, 1 => some (b,1)
  | .letE _ t _ _ _, 0 => some (t,0)
  | .letE _ _ v _ _, 1 => some (v,0)
  | .letE _ _ _ b _, 2 => some (b,1)
  | .mdata _ b, 0 => some (b,0)
  | .proj _ _ b, 0 => some (b,0)
  | _, _ => none

theorem field_build (value : α → Expr) (f : Frame α) (slot : Nat) :
    field (f.build value) slot =
      (frameField f slot).map (fun (child,d) => (value child,d)) := by
  cases f <;> cases slot with
  | zero => rfl
  | succ slot => cases slot with
    | zero => rfl
    | succ slot => cases slot <;> rfl

def selectGraph (g : Graph) (node : Nat) : List Nat → Option (Nat × Nat)
  | [] => some (node,0)
  | slot :: rest =>
      match frameField (g node) slot with
      | none => none
      | some (child,binds) =>
          match selectGraph g child.val rest with
          | none => none
          | some (out,depth) => some (out,binds+depth)

/-- Row paths refine the interpreted Expr paths without expanding the graph. -/
theorem follow_graph_map (g : Graph) (node : Nat) (path : List Nat) :
    follow (interpret g node) path =
      (selectGraph g node path).map (fun (out,d) => (interpret g out,d)) := by
  induction path generalizing node with
  | nil => rfl
  | cons slot rest ih =>
      rw [follow, interpret_unfold, field_build]
      cases hf : frameField (g node) slot with
      | none => simp [hf, selectGraph]
      | some pair =>
          rcases pair with ⟨child,binds⟩
          cases hp : selectGraph g child.val rest with
          | none => simp [hf, selectGraph, ih, hp]
          | some pair =>
              rcases pair with ⟨out,d⟩
              simp [hf, selectGraph, ih, hp]

theorem follow_graph (g : Graph) (node out depth : Nat) (path : List Nat)
    (h : selectGraph g node path = some (out,depth)) :
    follow (interpret g node) path = some (interpret g out,depth) := by
  rw [follow_graph_map, h]
  rfl

/-- An image suffix uses its own local binder depth, after the source prefix. -/
theorem inserted_image_path (σ : Substitution) (source fragment : Expr)
    (front back : List Nat) (i d k : Nat)
    (hp : follow source front = some (.bvar i,d)) (external : d ≤ i)
    (hs : follow (σ (i-d)) back = some (fragment,k)) :
    follow (subst σ source) (front ++ back) =
      some (rename (liftRen (fun j => j+d) k) fragment,d+k) := by
  have first := follow_subst σ source (.bvar i) front d hp
  simp only [ProofAtlas.ContextInstantiation.subst, liftSubst_at σ external] at first
  exact follow_append _ _ _ front back d k first
    (follow_rename (fun j => j+d) (σ (i-d)) fragment back k hs)

theorem execute_source_path (g : Graph) (images : Array Nat) (limit fuel root : Nat)
    (output : Expr) (path : List Nat) (node depth : Nat)
    (accepted : execute g images limit fuel root = .ok output)
    (selected : selectGraph g root path = some (node,depth)) :
    follow output path =
      some (subst (liftSubst (substitution g images) depth) (interpret g node),depth) := by
  rw [← execute_correct g images limit fuel root accepted]
  exact follow_subst _ _ _ path depth (follow_graph g root node depth path selected)

/-- A successful certified result has exact source-prefix/image-suffix addresses. -/
theorem execute_image_path (g : Graph) (images : Array Nat) (limit fuel root : Nat)
    (output : Expr) (front back : List Nat) (sourceNode imageNode i d k : Nat)
    (accepted : execute g images limit fuel root = .ok output)
    (use : selectGraph g root front = some (sourceNode,d))
    (leaf : g sourceNode = .bvar i) (external : d ≤ i)
    (supplied : i-d < images.size)
    (selected : selectGraph g images[images.size-1-(i-d)]! back = some (imageNode,k)) :
    follow output (front ++ back) =
      some (rename (liftRen (fun j => j+d) k) (interpret g imageNode),d+k) := by
  have original : interpret g sourceNode = .bvar i := by
    rw [interpret_unfold, leaf]
    rfl
  have first := follow_graph g root sourceNode d front use
  rw [original] at first
  have image := follow_graph g images[images.size-1-(i-d)]! imageNode k back selected
  have entry : substitution g images (i-d) = interpret g images[images.size-1-(i-d)]! := by
    simp only [substitution, supplied, ite_true]
  rw [← entry] at image
  rw [← execute_correct g images limit fuel root accepted]
  exact inserted_image_path _ _ _ front back i d k first external image

theorem liftRen_shift_at (shift localDepth index : Nat) :
    liftRen (fun j => j+shift) localDepth index =
      if index < localDepth then index else index+shift := by
  induction localDepth generalizing index with
  | zero => simp [liftRen]
  | succ d ih =>
      cases index with
      | zero => simp [liftRen, upRen]
      | succ i =>
          simp only [liftRen, upRen, ih, Nat.succ_lt_succ_iff]
          split <;> omega

theorem image_reference (shift localDepth index : Nat) :
    rename (liftRen (fun j => j+shift) localDepth) (.bvar index) =
      .bvar (if index < localDepth then index else index+shift) := by
  simp only [rename, liftRen_shift_at]

theorem liftRen_below (ρ : Renaming) (h : index < depth) :
    liftRen ρ depth index = index := by
  induction depth generalizing index with
  | zero => exact (Nat.not_lt_zero _ h).elim
  | succ depth ih =>
      cases index with
      | zero => rfl
      | succ i => exact congrArg Nat.succ (ih (Nat.lt_of_succ_lt_succ h))

theorem lifted_rename_owner (ρ : Renaming) (i : Nat) :
    liftRen (upRen ρ) i i = i := by
  have h := liftRen_add ρ 1 i
  change liftRen ρ (1+i) = liftRen (upRen ρ) i at h
  rw [← h]
  exact liftRen_below ρ (by omega)

theorem lifted_subst_owner (σ : Substitution) (i : Nat) :
    liftSubst (upSubst σ) i i = .bvar i := by
  have h := liftSubst_add σ 1 i
  change liftSubst σ (1+i) = liftSubst (upSubst σ) i at h
  rw [← h]
  exact liftSubst_below σ (by omega)

/-- The selected variable belongs to the binder's selected body field precisely
    when its index equals the number of later binders along that body path.
    This uses constructor roles and exact paths, not names or inferred types. -/
def Owns (e : Expr) (usePath binderPath : List Nat) : Prop :=
  ∃ binder body slot tail beforeDepth index,
    usePath = binderPath ++ slot :: tail ∧
    follow e binderPath = some (binder,beforeDepth) ∧
    field binder slot = some (body,1) ∧
    follow body tail = some (.bvar index,index)

theorem owns_rename (ρ : Renaming) (e : Expr) (usePath binderPath : List Nat)
    (h : Owns e usePath binderPath) :
    Owns (rename ρ e) usePath binderPath := by
  obtain ⟨binder,body,slot,tail,d,i,path,selected,bodyField,reference⟩ := h
  refine ⟨rename (liftRen ρ d) binder,
    rename (upRen (liftRen ρ d)) body,slot,tail,d,i,path,?_,?_,?_⟩
  · exact follow_rename ρ e binder binderPath d selected
  · exact field_rename (liftRen ρ d) binder body slot 1 bodyField
  · have out := follow_rename (upRen (liftRen ρ d)) body (.bvar i) tail i reference
    simpa only [rename, lifted_rename_owner] using out

theorem owns_subst (σ : Substitution) (e : Expr) (usePath binderPath : List Nat)
    (h : Owns e usePath binderPath) :
    Owns (subst σ e) usePath binderPath := by
  obtain ⟨binder,body,slot,tail,d,i,path,selected,bodyField,reference⟩ := h
  refine ⟨subst (liftSubst σ d) binder,
    subst (upSubst (liftSubst σ d)) body,slot,tail,d,i,path,?_,?_,?_⟩
  · exact follow_subst σ e binder binderPath d selected
  · exact field_subst (liftSubst σ d) binder body slot 1 bodyField
  · have out := follow_subst (upSubst (liftSubst σ d)) body (.bvar i) tail i reference
    simpa only [ProofAtlas.ContextInstantiation.subst, lifted_subst_owner] using out

theorem owns_under_path (e middle : Expr) (front usePath binderPath : List Nat)
    (d : Nat) (selected : follow e front = some (middle,d))
    (h : Owns middle usePath binderPath) :
    Owns e (front ++ usePath) (front ++ binderPath) := by
  obtain ⟨binder,body,slot,tail,k,i,path,atBinder,bodyField,reference⟩ := h
  refine ⟨binder,body,slot,tail,d+k,i,?_,?_,bodyField,reference⟩
  · simp only [path, List.append_assoc]
  · exact follow_append e middle binder front binderPath d k selected atBinder

theorem inserted_image_owner (σ : Substitution) (source : Expr)
    (front usePath binderPath : List Nat) (i d : Nat)
    (selected : follow source front = some (.bvar i,d)) (external : d ≤ i)
    (owned : Owns (σ (i-d)) usePath binderPath) :
    Owns (subst σ source) (front ++ usePath) (front ++ binderPath) := by
  have first := follow_subst σ source (.bvar i) front d selected
  simp only [ProofAtlas.ContextInstantiation.subst, liftSubst_at σ external] at first
  exact owns_under_path _ _ front usePath binderPath d first
    (owns_rename (fun j => j+d) _ usePath binderPath owned)

theorem execute_source_owner (g : Graph) (images : Array Nat) (limit fuel root : Nat)
    (output : Expr) (usePath binderPath : List Nat)
    (accepted : execute g images limit fuel root = .ok output)
    (owned : Owns (interpret g root) usePath binderPath) :
    Owns output usePath binderPath := by
  rw [← execute_correct g images limit fuel root accepted]
  exact owns_subst _ _ usePath binderPath owned

theorem residual_reference (g : Graph) (images : Array Nat) (index depth : Nat)
    (outside : depth+images.size ≤ index) :
    subst (liftSubst (substitution g images) depth) (.bvar index) =
      .bvar (index-images.size) := by
  have localBound : depth ≤ index := by omega
  have notSupplied : ¬ index-depth < images.size := by omega
  simp only [ProofAtlas.ContextInstantiation.subst, liftSubst_at _ localBound, substitution, notSupplied, ite_false, rename]
  congr 1
  omega

/-- A source/result path isomorphism fails even on a three-node image. -/
theorem created_image_field :
    let image := Expr.app (.const `Nat []) (.const `Nat [])
    follow (.bvar 0) [0] = none ∧
      follow (subst (fun _ => image) (.bvar 0)) [0] = some (.const `Nat [],0) := by
  exact ⟨rfl,rfl⟩

/-- Equal image/fragment values do not identify their distinct use occurrences. -/
theorem repeated_image_uses :
    let image := Expr.app (.const `Nat []) (.const `Nat [])
    let source := Expr.app (.bvar 0) (.bvar 0)
    follow source [0] = some (.bvar 0,0) ∧
    follow source [1] = some (.bvar 0,0) ∧
    follow (subst (fun _ => image) source) [0,0] = some (.const `Nat [],0) ∧
    follow (subst (fun _ => image) source) [1,0] = some (.const `Nat [],0) ∧
    ([0,0] : List Nat) ≠ [1,0] := by
  exact ⟨rfl,rfl,rfl,rfl,by decide⟩

end ProofAtlas.SubstitutionPaths

#print axioms ProofAtlas.SubstitutionPaths.field
#print axioms ProofAtlas.SubstitutionPaths.follow
#print axioms ProofAtlas.SubstitutionPaths.liftSubst_add
#print axioms ProofAtlas.SubstitutionPaths.liftRen_add
#print axioms ProofAtlas.SubstitutionPaths.field_subst
#print axioms ProofAtlas.SubstitutionPaths.field_rename
#print axioms ProofAtlas.SubstitutionPaths.follow_subst
#print axioms ProofAtlas.SubstitutionPaths.follow_rename
#print axioms ProofAtlas.SubstitutionPaths.follow_append
#print axioms ProofAtlas.SubstitutionPaths.field_rename_map
#print axioms ProofAtlas.SubstitutionPaths.follow_rename_map
#print axioms ProofAtlas.SubstitutionPaths.frameField
#print axioms ProofAtlas.SubstitutionPaths.field_build
#print axioms ProofAtlas.SubstitutionPaths.selectGraph
#print axioms ProofAtlas.SubstitutionPaths.follow_graph_map
#print axioms ProofAtlas.SubstitutionPaths.follow_graph
#print axioms ProofAtlas.SubstitutionPaths.inserted_image_path
#print axioms ProofAtlas.SubstitutionPaths.execute_source_path
#print axioms ProofAtlas.SubstitutionPaths.execute_image_path
#print axioms ProofAtlas.SubstitutionPaths.liftRen_shift_at
#print axioms ProofAtlas.SubstitutionPaths.image_reference
#print axioms ProofAtlas.SubstitutionPaths.liftRen_below
#print axioms ProofAtlas.SubstitutionPaths.lifted_rename_owner
#print axioms ProofAtlas.SubstitutionPaths.lifted_subst_owner
#print axioms ProofAtlas.SubstitutionPaths.Owns
#print axioms ProofAtlas.SubstitutionPaths.owns_rename
#print axioms ProofAtlas.SubstitutionPaths.owns_subst
#print axioms ProofAtlas.SubstitutionPaths.owns_under_path
#print axioms ProofAtlas.SubstitutionPaths.inserted_image_owner
#print axioms ProofAtlas.SubstitutionPaths.execute_source_owner
#print axioms ProofAtlas.SubstitutionPaths.created_image_field
#print axioms ProofAtlas.SubstitutionPaths.repeated_image_uses
#print axioms ProofAtlas.SubstitutionPaths.residual_reference
