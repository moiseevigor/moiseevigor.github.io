namespace AtlasInventoryRegionControls

def crossedGroups (A B C D E : Type) (f : A → B) (g : A → C)
    (left : B → C → D) (right : B → C → E) (a : A) : D × E :=
  let x := f a
  let y := g a
  (left x y, right x y)

def longReturn (A : Type) (f : A → A) (join : A → A → A) (a : A) : A :=
  let x0 := f a
  let x1 := f x0
  let x2 := f x1
  let x3 := f x2
  let x4 := f x3
  let x5 := f x4
  let x6 := f x5
  let x7 := f x6
  let x8 := f x7
  let x9 := f x8
  let x10 := f x9
  let x11 := f x10
  let x12 := f x11
  join x0 x12

end AtlasInventoryRegionControls
