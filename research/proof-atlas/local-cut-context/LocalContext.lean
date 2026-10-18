namespace ProofAtlas.SourceCut.Local
open Lean

/-- A retained surrounding cut, with one expression-indexed hole. -/
inductive HoleContext : Expr → Expr → Type
 | here (s : Expr) : HoleContext s s
 | appFn {s f a} (ctx : HoleContext s f) (ca : Cut a) : HoleContext s (.app f a)
 | appArg {s f a} (cf : Cut f) (ctx : HoleContext s a) : HoleContext s (.app f a)
 | lamDomain (n : Name) (bi : BinderInfo) {s d b} (ctx : HoleContext s d) (cb : Cut b) : HoleContext s (.lam n d b bi)
 | lamBody (n : Name) (bi : BinderInfo) {s d b} (cd : Cut d) (ctx : HoleContext s b) : HoleContext s (.lam n d b bi)
 | forallDomain (n : Name) (bi : BinderInfo) {s d b} (ctx : HoleContext s d) (cb : Cut b) : HoleContext s (.forallE n d b bi)
 | forallBody (n : Name) (bi : BinderInfo) {s d b} (cd : Cut d) (ctx : HoleContext s b) : HoleContext s (.forallE n d b bi)
 | letType (n : Name) (nd : Bool) {s t v b} (ctx : HoleContext s t) (cv : Cut v) (cb : Cut b) : HoleContext s (.letE n t v b nd)
 | letValue (n : Name) (nd : Bool) {s t v b} (ct : Cut t) (ctx : HoleContext s v) (cb : Cut b) : HoleContext s (.letE n t v b nd)
 | letBody (n : Name) (nd : Bool) {s t v b} (ct : Cut t) (cv : Cut v) (ctx : HoleContext s b) : HoleContext s (.letE n t v b nd)
 | mdata (d : MData) {s e} (ctx : HoleContext s e) : HoleContext s (.mdata d e)
 | proj (n : Name) (i : Nat) {s e} (ctx : HoleContext s e) : HoleContext s (.proj n i e)

def plug : {s e : Expr} → HoleContext s e → Cut s → Cut e
 | _, _, .here _, c => c
 | _, _, .appFn ctx ca, c => .app (plug ctx c) ca
 | _, _, .appArg cf ctx, c => .app cf (plug ctx c)
 | _, _, .lamDomain n bi ctx cb, c => .lam n bi (plug ctx c) cb
 | _, _, .lamBody n bi cd ctx, c => .lam n bi cd (plug ctx c)
 | _, _, .forallDomain n bi ctx cb, c => .forallE n bi (plug ctx c) cb
 | _, _, .forallBody n bi cd ctx, c => .forallE n bi cd (plug ctx c)
 | _, _, .letType n nd ctx cv cb, c => .letE n nd (plug ctx c) cv cb
 | _, _, .letValue n nd ct ctx cb, c => .letE n nd ct (plug ctx c) cb
 | _, _, .letBody n nd ct cv ctx, c => .letE n nd ct cv (plug ctx c)
 | _, _, .mdata d ctx, c => .mdata d (plug ctx c)
 | _, _, .proj n i ctx, c => .proj n i (plug ctx c)

theorem plug_refines : {s e : Expr} → (ctx : HoleContext s e) →
    {c c' : Cut s} → Refines c c' → Refines (plug ctx c) (plug ctx c')
 | _, _, .here _, _, _, h => h
 | _, _, .appFn ctx ca, _, _, h => .app (plug_refines ctx h) (reflexive ca)
 | _, _, .appArg cf ctx, _, _, h => .app (reflexive cf) (plug_refines ctx h)
 | _, _, .lamDomain n bi ctx cb, _, _, h => .lam n bi (plug_refines ctx h) (reflexive cb)
 | _, _, .lamBody n bi cd ctx, _, _, h => .lam n bi (reflexive cd) (plug_refines ctx h)
 | _, _, .forallDomain n bi ctx cb, _, _, h => .forallE n bi (plug_refines ctx h) (reflexive cb)
 | _, _, .forallBody n bi cd ctx, _, _, h => .forallE n bi (reflexive cd) (plug_refines ctx h)
 | _, _, .letType n nd ctx cv cb, _, _, h => .letE n nd (plug_refines ctx h) (reflexive cv) (reflexive cb)
 | _, _, .letValue n nd ct ctx cb, _, _, h => .letE n nd (reflexive ct) (plug_refines ctx h) (reflexive cb)
 | _, _, .letBody n nd ct cv ctx, _, _, h => .letE n nd (reflexive ct) (reflexive cv) (plug_refines ctx h)
 | _, _, .mdata d ctx, _, _, h => .mdata d (plug_refines ctx h)
 | _, _, .proj n i ctx, _, _, h => .proj n i (plug_refines ctx h)

theorem fill_refines (ctx : HoleContext s e) (c : Cut s) :
    Refines (plug ctx (.hole s)) (plug ctx c) :=
 plug_refines ctx (.fill c)

theorem retained_plug (ctx : HoleContext s e) (c : Cut s) :
    retained (plug ctx c) = retained (plug ctx (.hole s)) + retained c := by
 induction ctx with
 | here => simp [plug, retained]
 | appFn ctx ca ih => simp only [plug, retained]; have := ih c; omega
 | appArg cf ctx ih => simp only [plug, retained]; have := ih c; omega
 | lamDomain n bi ctx cb ih => simp only [plug, retained]; have := ih c; omega
 | lamBody n bi cd ctx ih => simp only [plug, retained]; have := ih c; omega
 | forallDomain n bi ctx cb ih => simp only [plug, retained]; have := ih c; omega
 | forallBody n bi cd ctx ih => simp only [plug, retained]; have := ih c; omega
 | letType n nd ctx cv cb ih => simp only [plug, retained]; have := ih c; omega
 | letValue n nd ct ctx cb ih => simp only [plug, retained]; have := ih c; omega
 | letBody n nd ct cv ctx ih => simp only [plug, retained]; have := ih c; omega
 | mdata d ctx ih => simp only [plug, retained]; have := ih c; omega
 | proj n i ctx ih => simp only [plug, retained]; have := ih c; omega

theorem hidden_plug (ctx : HoleContext s e) (c : Cut s) :
    hidden (plug ctx c) + occurrences s = hidden (plug ctx (.hole s)) + hidden c := by
 have old := partition (plug ctx (.hole s))
 have new := partition (plug ctx c)
 have inside := partition c
 have transfer := retained_plug ctx c
 omega

theorem fill_visible (ctx : HoleContext s e) (c : Cut s) (p : List Nat) :
    visible (plug ctx (.hole s)) p = true → visible (plug ctx c) p = true :=
 visible_monotone (fill_refines ctx c) p

theorem fill_exact_transfer (ctx : HoleContext s e) (c : Cut s) :
    retained (plug ctx c) - retained (plug ctx (.hole s)) =
    hidden (plug ctx (.hole s)) - hidden (plug ctx c) :=
 exact_transfer (fill_refines ctx c)


def focusPath : {s e : Expr} → HoleContext s e → List Nat
 | _, _, .here _ => []
 | _, _, .appFn ctx _ | _, _, .lamDomain _ _ ctx _ | _, _, .forallDomain _ _ ctx _ | _, _, .letType _ _ ctx _ _ | _, _, .mdata _ ctx | _, _, .proj _ _ ctx => 0 :: focusPath ctx
 | _, _, .appArg _ ctx | _, _, .lamBody _ _ _ ctx | _, _, .forallBody _ _ _ ctx | _, _, .letValue _ _ _ ctx _ => 1 :: focusPath ctx
 | _, _, .letBody _ _ _ _ ctx => 2 :: focusPath ctx

def isBelow : List Nat → List Nat → Bool
 | [], _ => true
 | _ :: _, [] => false
 | i :: p, j :: q => (i == j) && isBelow p q

theorem visible_inside : {s e : Expr} → (ctx : HoleContext s e) → (c : Cut s) → (p : List Nat) →
    visible (plug ctx c) (focusPath ctx ++ p) = visible c p
 | _, _, .here _, _, _ => rfl
 | _, _, .appFn ctx ca, c, p => visible_inside ctx c p
 | _, _, .appArg cf ctx, c, p => visible_inside ctx c p
 | _, _, .lamDomain n bi ctx cb, c, p => visible_inside ctx c p
 | _, _, .lamBody n bi cd ctx, c, p => visible_inside ctx c p
 | _, _, .forallDomain n bi ctx cb, c, p => visible_inside ctx c p
 | _, _, .forallBody n bi cd ctx, c, p => visible_inside ctx c p
 | _, _, .letType n nd ctx cv cb, c, p => visible_inside ctx c p
 | _, _, .letValue n nd ct ctx cb, c, p => visible_inside ctx c p
 | _, _, .letBody n nd ct cv ctx, c, p => visible_inside ctx c p
 | _, _, .mdata data ctx, c, p => visible_inside ctx c p
 | _, _, .proj n i ctx, c, p => visible_inside ctx c p

theorem visible_outside : {s e : Expr} → (ctx : HoleContext s e) → (c d : Cut s) → (p : List Nat) →
    isBelow (focusPath ctx) p = false → visible (plug ctx c) p = visible (plug ctx d) p
 | _, _, .here _, _, _, _, h => nomatch h
 | _, _, .appFn ctx ca, _, _, [], _ => rfl
 | _, _, .appFn ctx ca, c, d, 0 :: p, h => visible_outside ctx c d p h
 | _, _, .appFn ctx ca, c, d, 1 :: p, h => rfl
 | _, _, .appFn ctx ca, _, _, (_ + 2) :: _, _ => rfl
 | _, _, .appArg cf ctx, _, _, [], _ => rfl
 | _, _, .appArg cf ctx, c, d, 0 :: p, h => rfl
 | _, _, .appArg cf ctx, c, d, 1 :: p, h => visible_outside ctx c d p h
 | _, _, .appArg cf ctx, _, _, (_ + 2) :: _, _ => rfl
 | _, _, .lamDomain n bi ctx cb, _, _, [], _ => rfl
 | _, _, .lamDomain n bi ctx cb, c, d, 0 :: p, h => visible_outside ctx c d p h
 | _, _, .lamDomain n bi ctx cb, c, d, 1 :: p, h => rfl
 | _, _, .lamDomain n bi ctx cb, _, _, (_ + 2) :: _, _ => rfl
 | _, _, .lamBody n bi cd ctx, _, _, [], _ => rfl
 | _, _, .lamBody n bi cd ctx, c, d, 0 :: p, h => rfl
 | _, _, .lamBody n bi cd ctx, c, d, 1 :: p, h => visible_outside ctx c d p h
 | _, _, .lamBody n bi cd ctx, _, _, (_ + 2) :: _, _ => rfl
 | _, _, .forallDomain n bi ctx cb, _, _, [], _ => rfl
 | _, _, .forallDomain n bi ctx cb, c, d, 0 :: p, h => visible_outside ctx c d p h
 | _, _, .forallDomain n bi ctx cb, c, d, 1 :: p, h => rfl
 | _, _, .forallDomain n bi ctx cb, _, _, (_ + 2) :: _, _ => rfl
 | _, _, .forallBody n bi cd ctx, _, _, [], _ => rfl
 | _, _, .forallBody n bi cd ctx, c, d, 0 :: p, h => rfl
 | _, _, .forallBody n bi cd ctx, c, d, 1 :: p, h => visible_outside ctx c d p h
 | _, _, .forallBody n bi cd ctx, _, _, (_ + 2) :: _, _ => rfl
 | _, _, .letType n nd ctx cv cb, _, _, [], _ => rfl
 | _, _, .letType n nd ctx cv cb, c, d, 0 :: p, h => visible_outside ctx c d p h
 | _, _, .letType n nd ctx cv cb, c, d, 1 :: p, h => rfl
 | _, _, .letType n nd ctx cv cb, c, d, 2 :: p, h => rfl
 | _, _, .letType n nd ctx cv cb, _, _, (_ + 3) :: _, _ => rfl
 | _, _, .letValue n nd ct ctx cb, _, _, [], _ => rfl
 | _, _, .letValue n nd ct ctx cb, c, d, 0 :: p, h => rfl
 | _, _, .letValue n nd ct ctx cb, c, d, 1 :: p, h => visible_outside ctx c d p h
 | _, _, .letValue n nd ct ctx cb, c, d, 2 :: p, h => rfl
 | _, _, .letValue n nd ct ctx cb, _, _, (_ + 3) :: _, _ => rfl
 | _, _, .letBody n nd ct cv ctx, _, _, [], _ => rfl
 | _, _, .letBody n nd ct cv ctx, c, d, 0 :: p, h => rfl
 | _, _, .letBody n nd ct cv ctx, c, d, 1 :: p, h => rfl
 | _, _, .letBody n nd ct cv ctx, c, d, 2 :: p, h => visible_outside ctx c d p h
 | _, _, .letBody n nd ct cv ctx, _, _, (_ + 3) :: _, _ => rfl
 | _, _, .mdata data ctx, _, _, [], _ => rfl
 | _, _, .mdata data ctx, c, d, 0 :: p, h => visible_outside ctx c d p h
 | _, _, .mdata data ctx, _, _, (_ + 1) :: _, _ => rfl
 | _, _, .proj n i ctx, _, _, [], _ => rfl
 | _, _, .proj n i ctx, c, d, 0 :: p, h => visible_outside ctx c d p h
 | _, _, .proj n i ctx, _, _, (_ + 1) :: _, _ => rfl

def compose : {s t e : Expr} → HoleContext t e → HoleContext s t → HoleContext s e
 | _, _, _, .here _, inner => inner
 | _, _, _, .appFn ctx ca, inner => .appFn (compose ctx inner) ca
 | _, _, _, .appArg cf ctx, inner => .appArg cf (compose ctx inner)
 | _, _, _, .lamDomain n bi ctx cb, inner => .lamDomain n bi (compose ctx inner) cb
 | _, _, _, .lamBody n bi cd ctx, inner => .lamBody n bi cd (compose ctx inner)
 | _, _, _, .forallDomain n bi ctx cb, inner => .forallDomain n bi (compose ctx inner) cb
 | _, _, _, .forallBody n bi cd ctx, inner => .forallBody n bi cd (compose ctx inner)
 | _, _, _, .letType n nd ctx cv cb, inner => .letType n nd (compose ctx inner) cv cb
 | _, _, _, .letValue n nd ct ctx cb, inner => .letValue n nd ct (compose ctx inner) cb
 | _, _, _, .letBody n nd ct cv ctx, inner => .letBody n nd ct cv (compose ctx inner)
 | _, _, _, .mdata data ctx, inner => .mdata data (compose ctx inner)
 | _, _, _, .proj n i ctx, inner => .proj n i (compose ctx inner)

theorem plug_compose (outer : HoleContext t e) (inner : HoleContext s t) (c : Cut s) :
    plug (compose outer inner) c = plug outer (plug inner c) := by
 induction outer <;> simp_all [compose, plug]

theorem focus_compose (outer : HoleContext t e) (inner : HoleContext s t) :
    focusPath (compose outer inner) = focusPath outer ++ focusPath inner := by
 induction outer <;> simp_all [compose, focusPath]

end ProofAtlas.SourceCut.Local
