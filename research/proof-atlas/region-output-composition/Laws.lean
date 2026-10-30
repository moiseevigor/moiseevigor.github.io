import Lean

/- Standard dependent-function/product distributivity, used as a typed law
   for moving output collections across a shared scope boundary. This is
   not a theorem about the semantics of a Lean.Expr decoder or arbitrary
   proof-graph substitution. -/
namespace AtlasOutputComposition
universe u v w

def split {X : Sort u} {A : X → Sort v} {B : X → Sort w}
    (f : (x : X) → PProd (A x) (B x)) :
    PProd ((x : X) → A x) ((x : X) → B x) :=
 ⟨fun x => (f x).fst, fun x => (f x).snd⟩

def join {X : Sort u} {A : X → Sort v} {B : X → Sort w}
    (p : PProd ((x : X) → A x) ((x : X) → B x)) :
    (x : X) → PProd (A x) (B x) := fun x => ⟨p.fst x,p.snd x⟩

theorem join_split {X : Sort u} {A : X → Sort v} {B : X → Sort w}
    (f : (x : X) → PProd (A x) (B x)) : join (split f) = f := rfl

theorem split_join {X : Sort u} {A : X → Sort v} {B : X → Sort w}
    (p : PProd ((x : X) → A x) ((x : X) → B x)) : split (join p) = p := rfl

theorem split_fst_apply {X : Sort u} {A : X → Sort v} {B : X → Sort w}
    (f : (x : X) → PProd (A x) (B x)) (x : X) : (split f).fst x = (f x).fst := rfl

theorem split_snd_apply {X : Sort u} {A : X → Sort v} {B : X → Sort w}
    (f : (x : X) → PProd (A x) (B x)) (x : X) : (split f).snd x = (f x).snd := rfl

end AtlasOutputComposition
