namespace AtlasRegionControls

def diamond (A B C D E : Type) (f : A → B) (g : B → C) (h : B → D)
    (join : C → D → E) (a : A) : E :=
  let x := f a
  join (g x) (h x)

def shortcut (A B C D : Type) (f : A → B) (g : B → C)
    (join : B → C → D) (a : A) : D :=
  let x := f a
  join x (g x)

def twoPorts (A B C : Type) (f : A → B) (join : B → B → C) (a : A) : C :=
  let x := f a
  join x x

def proofShortcut (P Q R S : Prop) (seed : P) (f : P → Q)
    (g : Q → R) (join : Q → R → S) : S :=
  let q := f seed
  join q (g q)

end AtlasRegionControls
