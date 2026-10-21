import Lean

/- Structural laws on actual Lean.Expr. They do not verify the JavaScript fold,
   its native-type adapter, graph codec or renderer. No beta/eta reduction occurs. -/
namespace ProofAtlas.ApplicationFold
open Lean

def join (head : Expr) (args : List Expr) : Expr := args.foldl Expr.app head

def split : Nat → Expr → Expr × List Expr
 | 0, e => (e, [])
 | n + 1, .app f a => let (head, args) := split n f; (head, args ++ [a])
 | _ + 1, e => (e, [])

theorem join_append (head a : Expr) (args : List Expr) :
    join head (args ++ [a]) = .app (join head args) a := by
 simp [join, List.foldl_append]

theorem split_roundtrip (fuel : Nat) (e : Expr) :
    join (split fuel e).1 (split fuel e).2 = e := by
 induction fuel generalizing e with
 | zero => rfl
 | succ fuel ih =>
   cases e <;> simp only [split, join_append, ih] <;> rfl

theorem split_argument_bound (fuel : Nat) (e : Expr) :
    (split fuel e).2.length ≤ fuel := by
 induction fuel generalizing e with
 | zero => simp [split]
 | succ fuel ih =>
   cases e <;> simp [split, List.length_append, Nat.succ_le_succ (ih _)]

def occurrences : Expr → Nat
 | .app f a => 1 + occurrences f + occurrences a
 | .lam _ t b _ | .forallE _ t b _ => 1 + occurrences t + occurrences b
 | .letE _ t v b _ => 1 + occurrences t + occurrences v + occurrences b
 | .mdata _ e | .proj _ _ e => 1 + occurrences e
 | _ => 1

theorem join_occurrences (head : Expr) (args : List Expr) :
    occurrences (join head args) =
      occurrences head + args.length + (args.map occurrences).sum := by
 induction args generalizing head with
 | nil => simp [join]
 | cons a args ih =>
   change occurrences (join (.app head a) args) = _
   rw [ih]
   simp [occurrences, Nat.add_assoc, Nat.add_comm, Nat.add_left_comm]

theorem split_partition (fuel : Nat) (e : Expr) :
    occurrences e = occurrences (split fuel e).1 +
      (split fuel e).2.length + ((split fuel e).2.map occurrences).sum := by
 rw [← join_occurrences, split_roundtrip]

#print axioms split_roundtrip
#print axioms split_argument_bound
#print axioms join_occurrences
#print axioms split_partition
end ProofAtlas.ApplicationFold
