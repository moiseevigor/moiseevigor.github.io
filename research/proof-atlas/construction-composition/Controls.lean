namespace AtlasComposeControls
def inlineCalls (P Q R : Prop) (h : P = Q) (k : Q = R) (p : P) : R := Eq.mp k (Eq.mp h p)
def aliases (P Q R : Prop) (h : P = Q) (k : Q = R) (p : P) : R :=
 let q : Q := Eq.mp h p
 let copyOfQ : Q := q
 Eq.mp k copyOfQ
def weakening (P Q R : Prop) (h : P = Q) (k : Q = R) (p : P) : Nat → R :=
 let q : Q := Eq.mp h p
 fun _n => Eq.mp k q
def parallel (P Q R : Prop) (h : P = Q) (k : Q = R) (p q : P) : Q ∧ R :=
 ⟨Eq.mp h p, Eq.mp k (Eq.mp h q)⟩
def shared (P Q R : Prop) (h : P = Q) (k : Q = R) (p : P) : Q ∧ R :=
 ⟨Eq.mp h p, Eq.mp k (Eq.mp h p)⟩
def crossContext (P Q : Prop) (h : P = Q) : (P → Q) ∧ (P → Q) :=
 ⟨(fun p => Eq.mp h p), (fun q => Eq.mp h q)⟩
def samePorts : (0 : Nat) = 0 := @Eq.rec Nat 0 (fun b _ => 0 = b) rfl 0 rfl
def nondepValue (n : Nat) (h : (0 : Nat) = 0) : Nat :=
 have a : Nat := n + 1
 @Eq.rec Nat 0 (fun _ _ => Nat) a 0 h
end AtlasComposeControls
