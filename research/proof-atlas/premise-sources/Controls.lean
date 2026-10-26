namespace AtlasPremiseSources

-- One original proof binder is used before and after a local definition.
def contexts (P Q R : Prop) (f : P → Q) (g : P → Q → R) (p : P) : R :=
  let q := f p
  g p q

-- Equal proposition text does not identify the two shadowed proof binders.
def shadows (P Q R : Prop) (f : P → Q) (g : P → Q → R) (p : P) : P → R :=
  let q := f p
  fun p => g p q

end AtlasPremiseSources
