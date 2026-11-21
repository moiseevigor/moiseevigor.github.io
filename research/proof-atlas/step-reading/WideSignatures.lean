import Mathlib.Tactic

open Lean Meta Elab Command

namespace ProofAtlas.WideSignatures

partial def parameters (type : Expr) (locals : Array Expr) : MetaM (Array Json) := do
  let .forallE name domain body info := type | return #[]
  let mut depends : Array Nat := #[]
  for i in [:locals.size] do
    if domain.containsFVar locals[i]!.fvarId! then depends := depends.push (i+1)
  let row := Json.mkObj [("name",toJson name.toString),("domain",toJson (← ppExpr domain).pretty),
    ("binderInfo",toJson (reprStr info)),("dependsOn",toJson depends)]
  withLocalDecl name info domain fun localVar => do
    return #[row] ++ (← parameters (body.instantiate1 localVar) (locals.push localVar))

run_cmd do
  let env ← getEnv
  let input ← liftIO <| IO.FS.readFile "research/proof-atlas/step-reading/wide-heads.json"
  let names ← IO.ofExcept <| (Json.parse input).bind Json.getObj?
  let mut rows : Array Json := #[]
  for (name, _) in names.toList do
    let some info := env.find? name.toName | throwError "Missing declaration {name}"
    if let .error _ := Kernel.check env {} info.type then throwError "Invalid type for {name}"
    let params ← liftTermElabM <| parameters info.type #[]
    rows := rows.push <| Json.mkObj [("name",toJson name),("levelCount",toJson info.levelParams.length),
      ("parameters",toJson params)]
  liftIO <| IO.println (toJson rows).compress

end ProofAtlas.WideSignatures
