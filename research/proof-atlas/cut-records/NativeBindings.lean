/- Wire checks use the formal sparse-cut lookup. Other wire fields remain independently checked in Python. -/
namespace ProofAtlas.SourceCut.BindingWire
open Lean

private def binderKind : Expr → Option String
 | .lam .. => some "lam"
 | .forallE .. => some "forallE"
 | .letE .. => some "letE"
 | _ => none

private def addsBinder (e : Expr) (slot : Nat) : Bool := match e with
 | .lam .. | .forallE .. => slot == 1
 | .letE .. => slot == 2
 | _ => false

def context (values : Array Expr) (roots : Array Nat) (children : Array (Array Nat))
    (record : Json) : Except String (Nat × Array Nat × Array Json × Binding.Context) := do
 let root ← record.getObjVal? "root"
 let route ← root.getObjVal? "route"
 let rootIndex ← route.getObjValAs? Nat "root"
 let slots ← route.getObjValAs? (Array Nat) "slots"
 unless rootIndex < roots.size && slots.size <= 512 do throw "Binding root route"
 let mut node := roots[rootIndex]!
 let mut baseSlots : Array Nat := #[]
 let mut external : Array Json := #[]
 let mut ctx : Binding.Context := []
 for slot in slots do
  unless node < values.size && node < children.size && slot < children[node]!.size do throw "Binding source field"
  if addsBinder values[node]! slot then
   let some kind := binderKind values[node]! | throw "Missing source binder"
   external := external.push (Json.mkObj [("node",toJson node),("kind",toJson kind),("route",Json.mkObj [("root",toJson rootIndex),("slots",toJson baseSlots)])])
   ctx := baseSlots.toList::ctx
  node := children[node]![slot]!
  baseSlots := baseSlots.push slot
 unless node < values.size && (← root.getObjValAs? Nat "node") == node do throw "Binding selected source node"
 unless (← record.getObjValAs? (Array Json) "external") == external do throw "Original enclosing binder table mismatch"
 return (rootIndex,slots,external,ctx)

/-- Compare a wire target reference with its original absolute occurrence path. -/
private def target (entries external : Array Json) (root : Nat) (baseSlots : Array Nat)
    (value : Json) : Except String (Option Binding.Path × Bool) := do
 if value == Json.null then return (none,false)
 let obj ← value.getObj?
 unless obj.size == 1 do throw "Binding target reference shape"
 if let .ok index := value.getObjValAs? Nat "entry" then
  unless index < entries.size do throw "Internal binder reference index"
  let entry := entries[index]!
  unless (← entry.getObjValAs? String "tag") == "node" do throw "Binding target is hidden"
  let kind ← entry.getObjValAs? String "constructor"
  unless ["lam","forallE","letE"].contains kind do throw "Binding target is not a retained binder"
  let slots ← entry.getObjValAs? (Array Nat) "slots"
  return (some (baseSlots.toList++slots.toList),false)
 else
  let index ← value.getObjValAs? Nat "external"
  unless index < external.size do throw "External binder reference index"
  let route ← external[index]!.getObjVal? "route"
  unless (← route.getObjValAs? Nat "root") == root do throw "External binder root"
  return (some (← route.getObjValAs? (Array Nat) "slots").toList,true)

/-- Only the sparse cut is inspected; hidden expression trees are never traversed. -/
def check (values : Array Expr) (roots : Array Nat) (children : Array (Array Nat))
    (e : Expr) (cut : Cut e) (record : Json) : Except String (Array Json) := do
 let (root,baseSlots,external,ctx) ← context values roots children record
 let entries ← record.getObjValAs? (Array Json) "entries"
 let mut observations : Array Json := #[]
 let mut bound := 0
 for row in entries do
  if (← row.getObjValAs? String "tag") == "node" then
   let node ← row.getObjValAs? Nat "node"
   unless node < values.size do throw "Binding source node bound"
   if let .bvar index := values[node]! then
    let slots ← row.getObjValAs? (Array Nat) "slots"
    let binding ← row.getObjVal? "binding"
    unless (← binding.getObjValAs? Nat "index") == index do throw "Source de Bruijn index mismatch"
    let supplied ← binding.getObjVal? "target"
    let (actual,isExternal) ← target entries external root baseSlots supplied
    let expected := Binding.inCut cut ctx baseSlots.toList slots.toList
    unless actual == expected do throw "Source lexical target mismatch"
    if expected.isSome then bound := bound+1
    observations := observations.push (Json.mkObj [("node",toJson node),("root",toJson root),("slots",toJson (baseSlots++slots)),("target",toJson expected),("external",toJson isExternal)])
   else
    if (row.getObjVal? "binding").isOk then throw "Binding attached to a non-bvar"
 let stats ← record.getObjVal? "stats"
 unless (← stats.getObjValAs? Nat "variables") == observations.size && (← stats.getObjValAs? Nat "boundVariables") == bound do throw "Binding statistics mismatch"
 return observations
end ProofAtlas.SourceCut.BindingWire
