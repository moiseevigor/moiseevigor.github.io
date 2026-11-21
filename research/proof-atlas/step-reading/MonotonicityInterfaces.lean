import Mathlib.Order.Monotone.Defs

namespace ProofAtlas.MonotonicityInterfaces

universe u v
variable {α : Type u} {β : Type v} [Preorder α] [Preorder β]

theorem monotone_interface (f : α → β) :
    Monotone f ↔ (∀ ⦃a b : α⦄, a ≤ b → f a ≤ f b) := Iff.rfl

theorem strictMono_interface (f : α → β) :
    StrictMono f ↔ (∀ ⦃a b : α⦄, a < b → f a < f b) := Iff.rfl

theorem strictMonoOn_interface (f : α → β) (s : Set α) :
    StrictMonoOn f s ↔ (∀ ⦃a : α⦄, a ∈ s → ∀ ⦃b : α⦄, b ∈ s → a < b → f a < f b) := Iff.rfl

theorem strictAntiOn_interface (f : α → β) (s : Set α) :
    StrictAntiOn f s ↔ (∀ ⦃a : α⦄, a ∈ s → ∀ ⦃b : α⦄, b ∈ s → a < b → f b < f a) := Iff.rfl

#print axioms monotone_interface
#print axioms strictMono_interface
#print axioms strictMonoOn_interface
#print axioms strictAntiOn_interface

end ProofAtlas.MonotonicityInterfaces
