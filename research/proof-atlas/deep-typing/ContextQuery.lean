import Lean
open Lean Elab Command Meta

/- Bounded core-only contextual query. No original mathematical project imports.
   Source positions remain in the original expression, not an instantiated copy. -/
namespace AtlasDeepTyping

def checkAt (ctx : LocalContext) (term : Expr) : MetaM Expr := do
  match Kernel.check (← getEnv) ctx term with
  | .ok type => return type
  | .error error => throwError "Kernel rejection: {error.toMessageData (← getOptions)}"

def checkAs (ctx : LocalContext) (term expected : Expr) : MetaM Unit := do
  let _ ← checkAt ctx (mkApp (mkLambda `expected .default expected (.bvar 0)) term)

def query (root : Expr) (slots : Array Nat) : MetaM (Expr × Array Nat × Expr × String) := do
  unless slots.size <= 262144 do throwError "Query route limit"
  let mut source := root
  let mut ctx : LocalContext := {}
  let mut locals : Array Expr := #[]
  let mut binders : Array Nat := #[]
  for depth in [:slots.size] do
    let slot := slots[depth]!
    match source with
    | .lam name domain body info | .forallE name domain body info =>
      if slot == 0 then source := domain
      else if slot == 1 then
        let domain := domain.instantiateRev locals
        let domainType ← checkAt ctx domain
        let .ok sort := Kernel.whnf (← getEnv) ctx domainType
          | throwError "Domain normalization rejected"
        unless sort.isSort do throwError "Binder domain is not a type"
        let id ← mkFreshFVarId
        ctx := ctx.mkLocalDecl id name domain info
        locals := locals.push (.fvar id)
        binders := binders.push depth
        source := body
      else throwError "Invalid binder slot"
    | .letE name type value body nondep =>
      if slot == 0 then source := type
      else if slot == 1 then source := value
      else if slot == 2 then
        let type := type.instantiateRev locals
        let value := value.instantiateRev locals
        let typeType ← checkAt ctx type
        let .ok sort := Kernel.whnf (← getEnv) ctx typeType
          | throwError "Let domain normalization rejected"
        unless sort.isSort do throwError "Let domain is not a type"
        checkAs ctx value type
        let id ← mkFreshFVarId
        ctx := ctx.mkLetDecl id name type value nondep
        locals := locals.push (.fvar id)
        binders := binders.push depth
        source := body
      else throwError "Invalid let slot"
    | .app fn arg =>
      if slot == 0 then source := fn
      else if slot == 1 then source := arg
      else throwError "Invalid application slot"
    | .mdata _ inner | .proj _ _ inner =>
      if slot == 0 then source := inner else throwError "Invalid unary slot"
    | _ => throwError "Path continues through a terminal"
  let term := source.instantiateRev locals
  let type ← checkAt ctx term
  let typeType ← checkAt ctx type
  let .ok typeSort := Kernel.whnf (← getEnv) ctx typeType
    | throwError "Type-of-type normalization rejected"
  let .ok normalizedType := Kernel.whnf (← getEnv) ctx type
    | throwError "Selected type normalization rejected"
  let role := if typeSort == mkSort .zero then "proof" else if normalizedType.isSort then "type" else "value"
  let abstractType := type.abstract locals
  unless (⟨abstractType.instantiateRev locals⟩ : ExprStructEq) == ⟨type⟩ do
    throwError "Type/context roundtrip failed"
  return (source, binders, abstractType, role)


end AtlasDeepTyping
