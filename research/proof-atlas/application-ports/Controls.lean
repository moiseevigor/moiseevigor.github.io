namespace AtlasApplicationPorts
-- No project-local auxiliary declaration is required by packet replay.
def dependent (A : Type) (P : A → Prop) (x : A) (h : P x) : {y : A // P y} := ⟨x, h⟩
def functions (A B C : Type) (f : B → C) (g : A → B) (x : A) : C := Function.comp f g x
def instances (n : Nat) : Nat := n + n
def partialUse (A B : Type) (f : A → B) : A → B := @Function.comp A B B (fun x => x) f
def binding (A : Type) (x : A) (f : A → A) : A :=
 have y : A := x
 f y
def wide (a b c d e f g h i : Nat) : Nat :=
 (fun (x1 x2 x3 x4 x5 x6 x7 x8 x9 : Nat) => x9) a b c d e f g h i
def visibility (b : Bool) : Nat :=
 (fun {A : Type} ⦃B : Type⦄ [unitA : Inhabited A] (x : A) (_y : B) => x) (A := Nat) (B := Bool) (unitA := inferInstance) 7 b
def aliasType : (Nat → Nat) → Nat :=
 let F : Type := Nat → Nat
 fun (f : F) => f 0
end AtlasApplicationPorts
