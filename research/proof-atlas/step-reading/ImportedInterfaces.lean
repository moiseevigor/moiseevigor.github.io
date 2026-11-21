import Lean
import Mathlib.Tactic.Linarith.Lemmas
import Mathlib.Tactic.FieldSimp.Lemmas

open Lean Elab Command

namespace ProofAtlas.ImportedInterfaces

run_cmd do
  let env ← getEnv
  let input ← liftIO <| IO.FS.readFile "research/proof-atlas/step-reading/external-stage-slots.json"
  let names ← IO.ofExcept <| (Json.parse input).bind Json.getObj?
  let mut rows : Array Json := #[]
  for (text, _) in names.toList do
    let some info := env.find? text.toName | throwError "missing {text}"
    let mut sig := info.type
    let mut formals := 0
    while let .forallE _ _ b _ := sig do
      sig := b
      formals := formals + 1
    let kind := match info with
      | .thmInfo _ => "theorem" | .defnInfo _ => "definition"
      | .ctorInfo _ => "constructor" | .recInfo _ => "recursor"
      | .axiomInfo _ => "axiom" | .opaqueInfo _ => "opaque"
      | .inductInfo _ => "inductive" | .quotInfo _ => "quotient"
    let mut row := [("name",toJson text),("kind",toJson kind),("signatureBinders",toJson formals)]
    if let some body := info.value? true then
      let check := mkApp (mkLambda `expected .default info.type (.bvar 0)) body
      if let .error _ := Kernel.check env {} check then throwError "invalid body at declared type: {text}"
      let mut e := body
      let mut binders := 0
      while let .lam _ _ b _ := e do
        e := b
        binders := binders + 1
      let head := e.getAppFn
      row := row ++ [("bodyBinders",toJson binders),("resultHead",toJson (head.constName?.map Name.toString)),
        ("resultHeadKind",toJson head.ctorName),("supplied",toJson e.getAppNumArgs)]
    rows := rows.push <| Json.mkObj row
  liftIO <| IO.println (toJson rows).compress

end ProofAtlas.ImportedInterfaces
