/- Unlike the exploratory counter, this audit does not classify a kernel
   error as non-conversion. Every comparison must return .ok explicitly. -/
namespace AtlasOutputCompositionStrict
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes AtlasResultClosures

def compareAt (rowSpec : Json) (original _term : Expr) (xs : Array Expr) (context : Array Json)
    (_shared : Shared) (root : Nat) (slots : Array Nat) (_path : String) : MetaM Json := do
 unless (← fieldM rowSpec "context") == toJson context && (← fieldM rowSpec "prefix") == routeJson root slots do throwError "Strict comparison original context"
 let readType (field : String) : MetaM Expr := do
  let graph ← fieldM rowSpec field
  let .ok expressions := AtlasPacketReplay.decode graph | throwError "Strict type graph decode"
  let .ok roots := graph.getObjValAs? (Array Nat) "roots" | throwError "Strict type roots"
  unless roots.size==2 do throwError "Strict graph components"
  let type := expressions[roots[1]!]!.instantiateRev xs
  checkDomain type
  return type
 let flat ← readType "flat"
 let hierarchical ← readType "hierarchical"
 let convertible ← match Kernel.isDefEq (← getEnv) (← getLCtx) hierarchical flat with
  | .ok result => pure result
  | .error _ => throwError "Kernel type comparison error"
 let .ok expected := (← fieldM rowSpec "expectedConvertible").getBool? | throwError "Expected explicit comparison result"
 unless convertible==expected do throwError "Strict comparison changed the recorded result"
 let _ := original
 return obj [("id",← fieldM rowSpec "id"),("context",toJson context),("comparisonStatus",str "ok"),("convertible",toJson convertible)]

syntax "#atlas_output_comparison " str " => " str : command
elab_rules : command
 | `(#atlas_output_comparison $input:str => $output:str) => do
  let .ok requests := (← readJson input.getString).getArr? | throwError "Strict comparison requests"
  let mut results := #[]
  for request in requests do
   let source ← field request "source"
   let packet ← readJson (← string request "packetFile")
   let .ok (values,roots) := AtlasPacketReplay.exact packet | throwError "Strict original packet"
   liftTermElabM fun _ => do
    checkDomain values[roots[0]!]!
    kernelAs values[roots[1]!]! values[roots[0]!]!
   let (_,start) := intern values[roots[0]!]! {}
   let (_,shared) := intern values[roots[1]!]! start
   let .ok cases := (← field request "cases").getArr? | throwError "Strict cases"
   let mut rows := #[]
   for rowSpec in cases do
    let prefixRoute ← field rowSpec "prefix"
    let .ok rt := prefixRoute.getObjValAs? Nat "root" | throwError "Strict prefix root"
    let .ok ss := prefixRoute.getObjValAs? (Array Nat) "slots" | throwError "Strict prefix path"
    let row ← liftTermElabM fun _ => atRouteWith values[roots[rt]!]! ss.toList #[] #[] shared rt #[] "root.value" (compareAt rowSpec)
    rows := rows.push row
   let name ← string source "name"
   let imported := ((← getEnv).find? name.toName).isSome
   let privateImported := (← getEnv).header.moduleNames.any (·.toString.startsWith "SE2Conjugate.")
   results := results.push (obj [("source",source),("rows",toJson rows),("originalDeclarationImported",toJson imported),("privateRiccatiModulesImported",toJson privateImported)])
  liftIO <| IO.FS.writeFile output.getString (obj [("status",str "PASS"),("profiles",toJson results)]).compress
end AtlasOutputCompositionStrict
