/- Prototype: reconstruct indexed source cuts, without mathematical typing claims. -/
namespace ProofAtlas.SourceCut.Bridge
open Lean

def test : {e : Expr} → (c d : Cut e) → Bool
 | _, .hole _, _ => true
 | _, .bvar _, .bvar _ | _, .fvar _, .fvar _ | _, .mvar _, .mvar _
 | _, .sort _, .sort _ | _, .const _ _, .const _ _ | _, .lit _, .lit _ => true
 | _, .app f a, .app f' a' => test f f' && test a a'
 | _, .lam _ _ a b, .lam _ _ a' b' | _, .forallE _ _ a b, .forallE _ _ a' b' => test a a' && test b b'
 | _, .letE _ _ t v b, .letE _ _ t' v' b' => test t t' && test v v' && test b b'
 | _, .mdata _ a, .mdata _ b | _, .proj _ _ a, .proj _ _ b => test a b
 | _, _, _ => false

theorem test_sound {e : Expr} (c d : Cut e) : test c d = true → Refines c d := by
 intro h
 induction c <;> cases d <;> simp_all [test]
 all_goals constructor <;> (apply_assumption <;> simp_all)

#print axioms test_sound
end ProofAtlas.SourceCut.Bridge

namespace ProofAtlas.SourceCut.Bridge
open Lean Elab Command

def takeRow (entries : Array Json) (cursor node : Nat) (slots : Array Nat) : Except String Json := do
 unless cursor < entries.size do throw "Cut entry missing"
 let row := entries[cursor]!
 unless (← row.getObjValAs? Nat "node") == node && (← row.getObjValAs? (Array Nat) "slots") == slots do throw "Cut source node or route mismatch"
 return row

def build : Nat → (entries : Array Json) → (children : Array (Array Nat)) →
    (node : Nat) → (e : Expr) → (slots : Array Nat) → Nat → Except String (Cut e × Nat)
 | 0, _, _, _, _, _, _ => throw "Cut route depth bound"
 | fuel+1, entries, children, node, e, slots, cursor => do
  unless node < children.size do throw "Source node bound"
  let row ← takeRow entries cursor node slots
  let tag ← row.getObjValAs? String "tag"
  if tag == "hole" then return (.hole e,cursor+1)
  unless tag == "node" do throw "Cut entry tag"
  let kind ← row.getObjValAs? String "constructor"
  let refs ← row.getObjValAs? (Array Nat) "children"
  let cs := children[node]!
  unless refs.size == cs.size do throw "Retained child arity"
  let start := cursor+1
  match (dependent := true) e with
  | .bvar i =>
   unless kind == "bvar" && refs.isEmpty do throw "Retained bound variable"
   return (.bvar i,start)
  | .fvar id =>
   unless kind == "fvar" && refs.isEmpty do throw "Retained free variable"
   return (.fvar id,start)
  | .mvar id =>
   unless kind == "mvar" && refs.isEmpty do throw "Retained metavariable"
   return (.mvar id,start)
  | .sort u =>
   unless kind == "sort" && refs.isEmpty do throw "Retained sort"
   return (.sort u,start)
  | .const n us =>
   unless kind == "const" && refs.isEmpty do throw "Retained constant"
   return (.const n us,start)
  | .lit value =>
   unless kind == "lit" && refs.isEmpty do throw "Retained literal"
   return (.lit value,start)
  | .app f a =>
   unless kind == "app" && refs.size == 2 && refs[0]! == start do throw "Retained application"
   let (cf,next) ← build fuel entries children cs[0]! f (slots.push 0) start
   unless refs[1]! == next do throw "Application preorder"
   let (ca,last) ← build fuel entries children cs[1]! a (slots.push 1) next
   return (.app cf ca,last)
  | .lam n d b bi =>
   unless kind == "lam" && refs.size == 2 && refs[0]! == start do throw "Retained lambda"
   let (cd,next) ← build fuel entries children cs[0]! d (slots.push 0) start
   unless refs[1]! == next do throw "Lambda preorder"
   let (cb,last) ← build fuel entries children cs[1]! b (slots.push 1) next
   return (.lam n bi cd cb,last)
  | .forallE n d b bi =>
   unless kind == "forallE" && refs.size == 2 && refs[0]! == start do throw "Retained forall"
   let (cd,next) ← build fuel entries children cs[0]! d (slots.push 0) start
   unless refs[1]! == next do throw "Forall preorder"
   let (cb,last) ← build fuel entries children cs[1]! b (slots.push 1) next
   return (.forallE n bi cd cb,last)
  | .letE n t v b nondep =>
   unless kind == "letE" && refs.size == 3 && refs[0]! == start do throw "Retained let"
   let (ct,next) ← build fuel entries children cs[0]! t (slots.push 0) start
   unless refs[1]! == next do throw "Let value preorder"
   let (cv,next') ← build fuel entries children cs[1]! v (slots.push 1) next
   unless refs[2]! == next' do throw "Let body preorder"
   let (cb,last) ← build fuel entries children cs[2]! b (slots.push 2) next'
   return (.letE n nondep ct cv cb,last)
  | .mdata md e =>
   unless kind == "mdata" && refs.size == 1 && refs[0]! == start do throw "Retained metadata"
   let (ce,last) ← build fuel entries children cs[0]! e (slots.push 0) start
   return (.mdata md ce,last)
  | .proj type index e =>
   unless kind == "proj" && refs.size == 1 && refs[0]! == start do throw "Retained projection"
   let (ce,last) ← build fuel entries children cs[0]! e (slots.push 0) start
   return (.proj type index ce,last)

def decodeAt (children : Array (Array Nat)) (node depth : Nat) (e : Expr)
    (record : Json) : Except String (Cut e) := do
 let entries ← record.getObjValAs? (Array Json) "entries"
 unless entries.size > 0 && entries.size <= 3072 do throw "Cut entry bound"
 let (cut,last) ← build (513-depth) entries children node e #[] 0
 unless last == entries.size do throw "Unconsumed cut entries"
 let stats ← record.getObjVal? "stats"
 unless toString (retained cut) == (← stats.getObjValAs? String "retained") do throw "Retained source count"
 return cut

def decodeCut (values : Array Expr) (roots : Array Nat) (children : Array (Array Nat))
    (record : Json) : Except String ((e : Expr) × Cut e) := do
 unless (← record.getObjValAs? String "format") == "ProofAtlasSourceCutRecord/1" do throw "Cut format"
 let root ← record.getObjVal? "root"
 let route ← root.getObjVal? "route"
 let rootIndex ← route.getObjValAs? Nat "root"
 let slots ← route.getObjValAs? (Array Nat) "slots"
 unless rootIndex < roots.size && slots.size <= 512 do throw "Selected root route"
 let mut node := roots[rootIndex]!
 for slot in slots do
  unless node < children.size && slot < children[node]!.size do throw "Selected source field"
  node := children[node]![slot]!
 unless node < values.size && (← root.getObjValAs? Nat "node") == node do throw "Selected source node"
 let e := values[node]!
 let cut ← decodeAt children node slots.size e record
 return ⟨e,cut⟩

def compareRecords (values : Array Expr) (roots : Array Nat) (children : Array (Array Nat))
    (a b : Json) : Except String Bool := do
 unless (← a.getObjVal? "root") == (← b.getObjVal? "root") do throw "Refinement root mismatch"
 let root ← a.getObjVal? "root"
 let route ← root.getObjVal? "route"
 let rootIndex ← route.getObjValAs? Nat "root"
 let slots ← route.getObjValAs? (Array Nat) "slots"
 unless rootIndex < roots.size && slots.size <= 512 do throw "Refinement source root"
 let mut node := roots[rootIndex]!
 for slot in slots do
  unless node < children.size && slot < children[node]!.size do throw "Refinement source field"
  node := children[node]![slot]!
 unless node < values.size && (← root.getObjValAs? Nat "node") == node do throw "Refinement source node"
 let e := values[node]!
 let ca ← decodeAt children node slots.size e a
 let cb ← decodeAt children node slots.size e b
 return test ca cb

syntax "#atlas_source_cuts " str " => " str : command
elab_rules : command
 | `(#atlas_source_cuts $input:str => $output:str) => do
  let .ok request := Json.parse (← IO.FS.readFile input.getString) | throwError "Request JSON"
  let .ok packetFile := request.getObjValAs? String "packetFile" | throwError "Packet path"
  let .ok packet := Json.parse (← IO.FS.readFile packetFile) | throwError "Packet JSON"
  let .ok (values,roots) := AtlasPacketReplay.exact packet | throwError "Exact native source roundtrip failed"
  let .ok children := packet.getObjValAs? (Array (Array Nat)) "children" | throwError "Source children"
  let .ok records := request.getObjValAs? (Array Json) "records" | throwError "Cut records"
  unless records.size > 0 && records.size <= 4096 do throwError "Record bound"
  let mut entries := 0
  let mut bindings : Array Json := #[]
  for record in records do
   let .ok cut := decodeCut values roots children record | throwError "Indexed cut reconstruction failed"
   let .ok observed := BindingWire.check values roots children cut.1 cut.2 record | throwError "Native lexical check failed"
   bindings := bindings.push (toJson observed)
   let .ok es := record.getObjValAs? (Array Json) "entries" | throwError "Entries"
   entries := entries+es.size
  let .ok pairs := request.getObjValAs? (Array (Array Nat)) "refinements" | throwError "Refinement pairs"
  let .ok rejected := request.getObjValAs? (Array (Array Nat)) "rejectedRefinements" | throwError "Rejected pairs"
  for pair in pairs do
   unless pair.size == 2 && pair.all (· < records.size) do throwError "Refinement index"
   let .ok result := compareRecords values roots children records[pair[0]!]! records[pair[1]!]! | throwError "Refinement record decode"
   unless result do throwError "Native cut refinement rejected"
  for pair in rejected do
   unless pair.size == 2 && pair.all (· < records.size) do throwError "Counterexample index"
   let .ok result := compareRecords values roots children records[pair[0]!]! records[pair[1]!]! | throwError "Counterexample record decode"
   unless !result do throwError "Non-refinement incorrectly accepted"
  liftIO <| IO.FS.writeFile output.getString (Json.mkObj [("format",toJson "ProofAtlasNativeSourceCuts/1"),("records",toJson records.size),("entries",toJson entries),("refinements",toJson pairs.size),("rejectedRefinements",toJson rejected.size),("sourceNodes",toJson values.size),("nativeIndexedCutReconstruction",toJson true),("nativeMathematicalTyping",toJson false),("bindings",toJson bindings)]).compress
end ProofAtlas.SourceCut.Bridge
