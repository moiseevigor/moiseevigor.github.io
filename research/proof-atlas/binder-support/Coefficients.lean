import Lean

/- Counting algebra after lexical references and replacement holes have been
   identified. This is not Lean.Expr, a scope resolver or a verified compiler. -/
namespace AtlasReferenceCoefficients
inductive Tree where
 | hole
 | atom (originalBinder : Nat)
 | leaf (tag : Nat)
 | unary (tag : Nat) (a : Tree)
 | binary (tag : Nat) (a b : Tree)
 | ternary (tag : Nat) (a b c : Tree)

def uses (t : Tree) (binder : Nat) : Nat :=
 match t with
 | .hole | .leaf _ => 0
 | .atom n => if n == binder then 1 else 0
 | .unary _ a => uses a binder
 | .binary _ a b => uses a binder + uses b binder
 | .ternary _ a b c => uses a binder + uses b binder + uses c binder

def holes : Tree → Nat
 | .hole => 1
 | .atom _ | .leaf _ => 0
 | .unary _ a => holes a
 | .binary _ a b => holes a + holes b
 | .ternary _ a b c => holes a + holes b + holes c

def size : Tree → Nat
 | .hole | .atom _ | .leaf _ => 1
 | .unary _ a => 1 + size a
 | .binary _ a b => 1 + size a + size b
 | .ternary _ a b c => 1 + size a + size b + size c

def substitute (t v : Tree) : Tree :=
 match t with
 | .hole => v
 | .atom n => .atom n
 | .leaf tag => .leaf tag
 | .unary tag a => .unary tag (substitute a v)
 | .binary tag a b => .binary tag (substitute a v) (substitute b v)
 | .ternary tag a b c => .ternary tag (substitute a v) (substitute b v) (substitute c v)

theorem use_substitution (t v : Tree) (binder : Nat) :
 uses (substitute t v) binder = uses t binder + holes t * uses v binder := by
 induction t <;> simp_all [substitute, uses, holes, Nat.add_mul] <;> omega

/- Additive form avoids truncated natural-number subtraction. -/
theorem size_substitution (t v : Tree) :
 size (substitute t v) + holes t = size t + holes t * size v := by
 induction t <;> simp_all [substitute, size, holes, Nat.add_mul] <;> omega

open Lean Elab Command
syntax "#atlas_reference_laws " str : command
elab_rules : command
 | `(#atlas_reference_laws $file:str) => do
  let mut rows : Array Json := #[]
  for name in [``use_substitution, ``size_substitution] do
   let env ← getEnv
   let .thmInfo info := env.find? name |>.get! | throwError "Expected theorem"
   let .ok inferred := Kernel.check env {} info.value | throwError "Theorem kernel rejection"
   let .ok true := Kernel.isDefEq env {} inferred info.type | throwError "Theorem declared type"
   let axioms ← liftCoreM <| Lean.collectAxioms name
   rows := rows.push <| Json.mkObj [("name",toJson name.toString),("kernelTyping",toJson "PASS"),("axioms",toJson (axioms.toList.map Name.toString))]
  liftIO <| IO.FS.writeFile file.getString (Json.mkObj [("format",toJson "ProofAtlasReferenceCoefficientLaws/1"),("laws",toJson rows),("scope",toJson "General named-atom/hole tree substitution algebra, not a verified Lean.Expr transformation or scope resolver.")]).compress
end AtlasReferenceCoefficients
