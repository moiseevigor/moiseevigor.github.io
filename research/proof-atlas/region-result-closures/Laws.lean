import Lean

/- Structural wrapper composition only. Scope validity and kernel typing are
   separate preconditions checked by the native finite bridge. -/
namespace AtlasResultClosureLaws
open Lean

universe u v

def closeUsing {Header : Type u} {Term : Type v} (wrap : Header → Term → Term)
    (headers : List Header) (body : Term) : Term := headers.foldr wrap body

theorem wrapper_append {Header : Type u} {Term : Type v} (wrap : Header → Term → Term)
    (outer inner : List Header) (body : Term) :
 closeUsing wrap (outer ++ inner) body = closeUsing wrap outer (closeUsing wrap inner body) := by
 induction outer with
 | nil => rfl
 | cons header tail ih => exact congrArg (wrap header) ih

def wrapTerm (header body : Expr) : Expr :=
 match header with
 | .lam n domain _ info | .forallE n domain _ info => .lam n domain body info
 | .letE n domain value _ nondep => .letE n domain value body nondep
 | _ => body

def wrapType (header body : Expr) : Expr :=
 match header with
 | .lam n domain _ info | .forallE n domain _ info => .forallE n domain body info
 | .letE n domain value _ nondep => .letE n domain value body nondep
 | _ => body

def closeTerm (headers : List Expr) (body : Expr) : Expr :=
 headers.foldr wrapTerm body

def closeType (headers : List Expr) (body : Expr) : Expr :=
 headers.foldr wrapType body

theorem term_append (outer inner : List Expr) (body : Expr) :
 closeTerm (outer ++ inner) body = closeTerm outer (closeTerm inner body) := by
 exact wrapper_append wrapTerm outer inner body

theorem type_append (outer inner : List Expr) (body : Expr) :
 closeType (outer ++ inner) body = closeType outer (closeType inner body) := by
 exact wrapper_append wrapType outer inner body

end AtlasResultClosureLaws
