namespace AtlasEndpointConversion
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes

def getKey [Monad m] [MonadError m] (j : Json) (key : String) : m Json := do
 match j.getObjVal? key with
 | .ok v => return v
 | .error err => throwError err

-- The inner terms are reached exclusively through application fields, hence
-- share the local context reconstructed at the enclosing call.
def endpoint (original term : Expr) (base : Array Nat) (shared : Shared) (anchor : Json) : MetaM Expr := do
 let route ← getKey anchor "route"
 let slots ← match route.getObjValAs? (Array Nat) "slots" with
  | .ok v => pure v | .error e => throwError e
 unless (← getKey route "root") == toJson (1:Nat) && slots.extract 0 base.size == base do
  throwError "Endpoint outside the enclosing call"
 let mut raw := original
 let mut contextTerm := term
 for slot in slots.extract base.size slots.size do
  unless raw.isApp && contextTerm.isApp && slot < 2 do throwError "Non-application field"
  raw := if slot == 0 then raw.appFn! else raw.appArg!
  contextTerm := if slot == 0 then contextTerm.appFn! else contextTerm.appArg!
 unless toJson (← sourceId shared raw) == (← getKey anchor "node") do throwError "Wrong endpoint row"
 return contextTerm

def checkPair (query : Json) (raw term : Expr) (_ : Array Expr) (ctx : Array Json)
    (shared : Shared) (_ : Nat) (slots : Array Nat) (_ : String) : MetaM Json := do
 let transport := (← getKey query "field") == toJson "transport input"
 if transport then
  unless raw.getAppFn.isConstOf ``Eq.mp && raw.getAppNumArgs == 4 &&
      raw.appArg!.getAppFn.isConstOf ``Eq.mp && raw.appArg!.getAppNumArgs == 4 do throwError "Expected nested forward transports"
 else
  unless raw.getAppFn.isConstOf ``Eq.trans && raw.getAppNumArgs == 6 do throwError "Expected Eq.trans"
 let call ← getKey query "call"
 unless toJson (← sourceId shared raw) == (← getKey call "node") do throwError "Wrong call row"
 let left ← endpoint raw term slots shared (← getKey query "outer")
 let right ← endpoint raw term slots shared (← getKey query "nested")
 if transport then
  unless (⟨left⟩ : ExprStructEq) == ⟨term.getAppArgs[0]!⟩ &&
      (⟨right⟩ : ExprStructEq) == ⟨term.appArg!.getAppArgs[1]!⟩ do throwError "Wrong intermediate types"
 unless (⟨left⟩ : ExprStructEq) != ⟨right⟩ do throwError "Expected distinct syntax"
 let _ ← kernelType left
 let _ ← kernelType right
 kernelAs (← mkEqRefl left) (← mkEq left right)
 let wrongAccepted ← try
  kernelAs (← mkEqRefl (mkNatLit 0)) (← mkEq (mkNatLit 0) (mkNatLit 1))
  pure true
 catch _ => pure false
 if wrongAccepted then throwError "Negative control accepted"
 return query.mergeObj (obj [("contextSize",nat ctx.size),("kernelReflexivity",str "PASS")])

syntax "#atlas_endpoints " str str str : command
elab_rules : command
 | `(#atlas_endpoints $packetFile:str $queryFile:str $outFile:str) => do
  let packet ← readJson packetFile.getString
  let (values,roots) ← match AtlasPacketReplay.exact packet with
   | .ok v => pure v | .error e => throwError e
  unless roots.size == 2 do throwError "Expected theorem roots"
  let type := values[roots[0]!]!
  let proof := values[roots[1]!]!
  liftTermElabM fun _ => kernelAs proof type
  let (_,start) := intern type {}
  let (_,shared) := intern proof start
  let queries ← match (← readJson queryFile.getString).getArr? with
   | .ok v => pure v | .error e => throwError e
  let mut entries := #[]
  for query in queries do
   let call ← getKey query "call"
   let route ← getKey call "route"
   unless (← getKey route "root") == toJson (1:Nat) do throwError "Expected proof body"
   let slots ← match route.getObjValAs? (Array Nat) "slots" with
    | .ok v => pure v | .error e => throwError e
   let result ← liftTermElabM fun _ => atRouteWith proof slots.toList #[] #[] shared 1 #[] "root.value" (checkPair query)
   entries := entries.push result
  liftIO <| IO.FS.writeFile outFile.getString (toJson entries).compress
end AtlasEndpointConversion
