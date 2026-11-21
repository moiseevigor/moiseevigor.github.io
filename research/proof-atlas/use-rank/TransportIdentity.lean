namespace ProofAtlas.TransportIdentity

universe u

theorem forward {A : Sort u} (e : A = A) (x : A) : Eq.mp e x = x := rfl

theorem backward {A : Sort u} (e : A = A) (x : A) : Eq.mpr e x = x := rfl

-- Distinct type variables require the equality hypothesis to be eliminated.
example {A B : Sort u} (e : A = B) (x : A) : HEq (Eq.mp e x) x := by
  fail_if_success exact HEq.rfl
  cases e
  exact HEq.rfl

example {A B : Sort u} (e : A = B) (x : B) : HEq (Eq.mpr e x) x := by
  fail_if_success exact HEq.rfl
  cases e
  exact HEq.rfl

end ProofAtlas.TransportIdentity
