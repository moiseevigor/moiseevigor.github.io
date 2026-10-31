import Lean

/- Lossless presentation of one left application/metadata spine. The residual
   keeps all supplied arguments and metadata, including interspersed wrappers. -/
namespace AtlasNotation
open Lean

inductive Frame where
  | argument (value : Expr)
  | metadata (data : MData)

def peel : Expr → Expr × List Frame
  | .app f a => let (h, frames) := peel f; (h, .argument a :: frames)
  | .mdata m e => let (h, frames) := peel e; (h, .metadata m :: frames)
  | e => (e, [])

def rebuild (head : Expr) : List Frame → Expr
  | [] => head
  | .argument a :: rest => .app (rebuild head rest) a
  | .metadata m :: rest => .mdata m (rebuild head rest)

theorem reconstruct (e : Expr) : rebuild (peel e).1 (peel e).2 = e := by
  induction e <;> simp_all [peel, rebuild]

theorem lossless {a b : Expr} (h : peel a = peel b) : a = b := by
  rw [← reconstruct a, ← reconstruct b, h]

def occurrences : Expr → Nat
  | .app f a => 1 + occurrences f + occurrences a
  | .lam _ t b _ | .forallE _ t b _ => 1 + occurrences t + occurrences b
  | .letE _ t v b _ => 1 + occurrences t + occurrences v + occurrences b
  | .mdata _ e | .proj _ _ e => 1 + occurrences e
  | _ => 1

def weight : List Frame → Nat
  | [] => 0
  | .argument a :: rest => 1 + occurrences a + weight rest
  | .metadata _ :: rest => 1 + weight rest

theorem reconstruction_count (head : Expr) (frames : List Frame) :
    occurrences (rebuild head frames) = occurrences head + weight frames := by
  induction frames with
  | nil => simp [rebuild, weight]
  | cons frame rest ih =>
    cases frame <;> simp only [rebuild, occurrences, weight, ih] <;> omega

theorem spine_count (e : Expr) :
    occurrences e = occurrences (peel e).1 + weight (peel e).2 := by
  rw [← reconstruction_count, reconstruct]

/- A glyph alone cannot identify an overloaded operation. Both applications
   have the same head, type arguments and displayed operands. Their supplied
   instances differ and their values are unequal. -/
@[instance_reducible] def addInstance : HAdd Nat Nat Nat := ⟨Nat.add⟩
@[instance_reducible] def subtractInstance : HAdd Nat Nat Nat := ⟨Nat.sub⟩
def leftValue : Nat := @HAdd.hAdd Nat Nat Nat addInstance 7 2
def rightValue : Nat := @HAdd.hAdd Nat Nat Nat subtractInstance 7 2
theorem left_result : leftValue = 9 := rfl
theorem right_result : rightValue = 5 := rfl
theorem glyph_collision : leftValue ≠ rightValue := by decide

end AtlasNotation
