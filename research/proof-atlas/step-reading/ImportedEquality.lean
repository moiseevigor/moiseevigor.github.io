import Lean
import Mathlib.Algebra.Group.Basic

open Lean Elab Command

namespace ProofAtlas.ImportedEquality

/-- Field order agrees with the compiled occurrence reader. Track the de Bruijn index
    of one fixed binder under later binders, including dependent domain fields. -/
partial def uses (e : Expr) (index : Nat) (path : Array Nat) : Array (Array Nat) := Id.run do
  match e with
  | .bvar i => return if i == index then #[path] else #[]
  | .app f a => return uses f index (path.push 0) ++ uses a index (path.push 1)
  | .lam _ d b _ | .forallE _ d b _ =>
    return uses d index (path.push 0) ++ uses b (index+1) (path.push 1)
  | .letE _ t v b _ =>
    return uses t index (path.push 0) ++ uses v index (path.push 1) ++ uses b (index+1) (path.push 2)
  | .mdata _ b | .proj _ _ b => return uses b index (path.push 0)
  | _ => return #[]

run_cmd do
  let env ← getEnv
  let some info := env.find? `sub_eq_zero_of_eq | throwError "missing declaration"
  let some body := info.value? true | throwError "missing compiled proof body"
  let check := mkApp (mkLambda `expected .default info.type (.bvar 0)) body
  if let .error _ := Kernel.check env {} check then throwError "kernel rejected proof at declared type"
  let mut e := body
  let mut path : Array Nat := #[]
  let mut slots : Array Json := #[]
  while let .lam name _ b _ := e do
    slots := slots.push <| Json.mkObj [("slot", toJson (slots.size+1)), ("name", toJson name.toString),
      ("binder", toJson path), ("uses", toJson (uses b 0 (path.push 1)))]
    path := path.push 1
    e := b
  let proofHead := e.getAppFn.constName?
  unless slots.size == 4 && proofHead == some ``Iff.mpr && e.getAppNumArgs == 3 do
    throwError "unexpected compiled forwarding structure"
  let iffProof := e.getAppArgs[2]!
  unless iffProof.getAppFn.constName? == some ``sub_eq_zero && iffProof.getAppNumArgs == 4 do
    throwError "unexpected source of equivalence"
  let mut sig := info.type
  let mut arity := 0
  while let .forallE _ _ b _ := sig do
    arity := arity + 1
    sig := b
  unless arity == 5 do throwError "unexpected declared arity"
  let output := Json.mkObj [("declaration", toJson info.name.toString), ("bodyParameters", toJson slots),
    ("declaredArity", toJson arity), ("equivalenceHead", toJson "sub_eq_zero"),
    ("resultHead", toJson (proofHead.map Name.toString)), ("resultArguments", toJson e.getAppNumArgs),
    ("compiledBody", toJson (reprStr body)), ("compiledType", toJson (reprStr info.type))]
  liftIO <| IO.println output.compress

end ProofAtlas.ImportedEquality
