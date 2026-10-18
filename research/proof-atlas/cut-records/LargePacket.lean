/- Versioned larger source-table profile. The original decoder remains frozen.
   Constructor decoding reuses the same name, universe, binder and metadata
   helpers. This changes the table bound, not mathematical typing coverage. -/
namespace AtlasLargePacketReplay
open Lean Elab Command AtlasLibrary AtlasPacketReplay
def decode (packet : Json) : Except String (Array Expr) := do
 let kinds ← packet.getObjValAs? (Array Nat) "kind"
 let children ← packet.getObjValAs? (Array (Array Nat)) "children"
 let payloads ← packet.getObjValAs? (Array Json) "payloads"
 unless kinds.size > 0 && kinds.size <= 262144 && children.size == kinds.size && payloads.size == kinds.size do throw "Expression table bound/shape"
 let mut values : Array Expr := #[]
 for i in [:kinds.size] do
  let cs := children[i]!
  unless cs.all (· < i) do throw "Forward or cyclic expression input"
  let k := kinds[i]!
  let expected := if k == 5 || k == 6 || k == 7 then 2 else if k == 8 then 3 else if k == 10 || k == 11 then 1 else 0
  unless cs.size == expected do throw "Constructor port arity"
  let p := payloads[i]!
  let value : Expr ← match k with
   | 0 => pure (.bvar (← p.getObjValAs? Nat "index"))
   | 1 => do
    let n ← AtlasLevelTransport.jsonName (← field p "idNameParts")
    pure (.fvar ⟨n⟩)
   | 2 => do
    let n ← AtlasLevelTransport.jsonName (← field p "idNameParts")
    pure (.mvar ⟨n⟩)
   | 3 => pure (.sort (← AtlasLevelTransport.decode (← field p "level")))
   | 4 => do
    let levels ← p.getObjValAs? (Array Json) "levels"
    pure (.const (← name p "nameParts" "name") (← levels.toList.mapM AtlasLevelTransport.decode))
   | 5 => pure (.app values[cs[0]!]! values[cs[1]!]!)
   | 6 => pure (.lam (← name p "binderNameParts" "binderName") values[cs[0]!]! values[cs[1]!]! (← binderInfo p))
   | 7 => pure (.forallE (← name p "binderNameParts" "binderName") values[cs[0]!]! values[cs[1]!]! (← binderInfo p))
   | 8 => pure (.letE (← name p "declNameParts" "declName") values[cs[0]!]! values[cs[1]!]! values[cs[2]!]! (← p.getObjValAs? Bool "nondep"))
   | 9 => do
    let v ← p.getObjValAs? String "value"
    match ← p.getObjValAs? String "literalKind" with
    | "natVal" => do
     let some n := v.toNat? | throw "Natural literal encoding"
     pure (.lit (.natVal n))
    | "strVal" => pure (.lit (.strVal v))
    | _ => throw "Literal kind"
   | 10 => pure (.mdata (← metadata p) values[cs[0]!]!)
   | 11 => pure (.proj (← name p "typeNameParts" "typeName") (← p.getObjValAs? Nat "index") values[cs[0]!]!)
   | _ => throw "Expression constructor"
  values := values.push value
 return values

def exact (packet : Json) : Except String (Array Expr × Array Nat) := do
 unless (← packet.getObjValAs? String "serialization") == "ExprDAG/1" do throw "Packet format"
 let values ← decode packet
 let roots ← packet.getObjValAs? (Array Nat) "roots"
 unless roots.size > 0 && roots.size <= 32 && roots.all (· < values.size) do throw "Packet roots"
 let rebuilt := AtlasPacketReplay.graph (roots.map (values[·]!))
 for key in ["kind","children","payloads","expanded","neededScope","roots"] do
  unless (← rebuilt.getObjVal? key) == (← packet.getObjVal? key) do
   throw ("Exact roundtrip mismatch: " ++ key)
 return (values,roots)

theorem legacy_decode_agrees (packet : Json) (kinds : Array Nat)
    (parsed : packet.getObjValAs? (Array Nat) "kind" = .ok kinds)
    (bounded : kinds.size ≤ 131072) :
    decode packet = AtlasPacketReplay.decode packet := by
 have wide : kinds.size ≤ 262144 := Nat.le_trans bounded (by decide)
 cases childParse : packet.getObjValAs? (Array (Array Nat)) "children" <;>
  cases payloadParse : packet.getObjValAs? (Array Json) "payloads" <;>
   simp [decode, AtlasPacketReplay.decode, parsed, childParse, payloadParse, Bind.bind, Except.bind, bounded, wide]

theorem legacy_exact_agrees (packet : Json) (kinds : Array Nat)
    (parsed : packet.getObjValAs? (Array Nat) "kind" = .ok kinds)
    (bounded : kinds.size ≤ 131072) :
    exact packet = AtlasPacketReplay.exact packet := by
 unfold exact AtlasPacketReplay.exact
 rw [legacy_decode_agrees packet kinds parsed bounded]

#print axioms legacy_decode_agrees
#print axioms legacy_exact_agrees

end AtlasLargePacketReplay
