/- Strict beta only, preserving metadata and all constructor payloads. -/
namespace ContextPrimitive
open Lean
abbrev Memo := ExprStructMap Expr
partial def normal (e : Expr) : StateM Memo Expr := do
 if let some r := (← get).get? ⟨e⟩ then return r
 let r ← match e with
  | .app f a => do
   let f ← normal f
   let a ← normal a
   match f with
   | .lam _ _ body _ => normal (body.instantiate1 a)
   | _ => pure (.app f a)
  | .lam n t b i => return .lam n (← normal t) (← normal b) i
  | .forallE n t b i => return .forallE n (← normal t) (← normal b) i
  | .letE n t v b d => return .letE n (← normal t) (← normal v) (← normal b) d
  | .mdata m b => return .mdata m (← normal b)
  | .proj n i b => return .proj n i (← normal b)
  | _ => pure e
 modify (·.insert ⟨e⟩ r)
 return r
end ContextPrimitive
