namespace AtlasRuleSupport

-- The literal function type is a local alias; the recorded normalized type is callable.
def aliasProof (P Q : Prop) (p : P) : (P → Q) → Q :=
  let F : Prop := P → Q
  fun (f : F) => f p

def aliasValue (n : Nat) : (Nat → Nat) → Nat :=
  let F : Type := Nat → Nat
  fun (f : F) => f n

-- The same original proof binder is both a supplied argument and a function head.
def bothRoles (P Q : Prop) (h : (P → Q) → P) (f : P → Q) : Q :=
  f (h f)

end AtlasRuleSupport
