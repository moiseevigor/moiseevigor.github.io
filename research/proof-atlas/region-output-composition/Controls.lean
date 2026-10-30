import Lean

/- Own synthetic examples. These are not original private proof scripts. -/
namespace AtlasOutputCompositionControls
universe u

def dependentFamilies (P : Nat → Type u) (make : (n : Nat) → P n)
    (x y : Nat) : (Sigma P) × (Sigma P) :=
 ((fun n : Nat => (⟨n,make n⟩ : Sigma P)) x,
  (fun n : Nat => (⟨n,make n⟩ : Sigma P)) y)

def dependentLets (P : Nat → Type u) (make : (n : Nat) → P n)
    (x y : Nat) : (Sigma P) × (Sigma P) :=
 ((fun n : Nat => let k := n+1; (⟨k,make k⟩ : Sigma P)) x,
  (fun n : Nat => let k := n+1; (⟨k,make k⟩ : Sigma P)) y)

def mixedSorts (P : Prop) (p : P) (F : Unit → Type u)
    (step : Nat → Nat) (n : Nat) :
    PProd (Type u) (PProd P Nat) :=
 ⟨(fun z : Unit => F z) (), ⟨p,(fun x : Nat => step x) n⟩⟩

end AtlasOutputCompositionControls
