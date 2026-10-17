/- Own decoder controls. Open terms exercise structural transport only. -/
namespace AtlasPacketReplay
open Lean Elab Command Meta AtlasLibrary

def updateEntry (p : Json) (field : String) (i : Nat) (value : Json) : Except String Json := do
 let entries ← p.getObjValAs? (Array Json) field
 unless i < entries.size do throw "Control index"
 return p.setObjVal! field (toJson (entries.set! i value))

syntax "#atlas_packet_controls " str : command
elab_rules : command
 | `(#atlas_packet_controls $output:str) => do
  let nat := mkConst ``Nat
  let zero := mkNatLit 0
  let u := Level.param (.num .anonymous 1)
  let v := Level.param (.str .anonymous "1")
  let mut shared := u
  for _ in [:80] do shared := .max shared shared
  let md := (KVMap.empty.setBool (.num .anonymous 1) true).setBool (.str .anonymous "1") false
  let mut fixtures : Array (String × Expr) := #[
   ("open-bound-variable",.bvar 1),
   ("open-free-variable",.fvar ⟨.num (.str .anonymous "local") 17⟩),
   ("open-expression-metavariable",.mvar ⟨.num (.str .anonymous "meta") 19⟩),
   ("raw-universe-sort",.sort (.imax (.max u .zero) (.succ v))),
   ("shared-universe-DAG",.sort shared),
   ("universe-metavariable",.sort (.mvar ⟨`unresolvedUniverse⟩)),
   ("polymorphic-constant",.const ``id [u]),
   ("ordered-application",mkApp2 (mkConst ``id [.zero]) nat zero),
   ("dependent-shadowing",.lam `x (.sort (.succ .zero)) (.lam `x (.bvar 0) (.bvar 0) .default) .implicit),
   ("Pi-scope",.forallE `p (.sort .zero) (.bvar 0) .default),
   ("dependent-let",.letE `x nat zero (.bvar 0) false),
   ("nondependent-let",.letE `x nat zero (mkNatLit 1) true),
   ("natural-literal",mkNatLit (2^100+1)),
   ("string-literal",mkStrLit "a\n\"\\λ"),
   ("Boolean-metadata",.mdata md (mkConst ``True.intro)),
   ("projection-port",.proj ``Prod 1 (.bvar 0))]
  for info in [BinderInfo.default,.implicit,.strictImplicit,.instImplicit] do
   fixtures := fixtures.push ("binder-visibility-" ++ bi info,.lam `x nat (.bvar 0) info)
  let mut cases : Array Json := #[]
  for (label,e) in fixtures do
   let packet := graph #[e]
   let (values,roots) ← match exact packet with | .ok v => pure v | .error err => throwError "Control {label}: {err}"
   unless graph #[values[roots[0]!]!] == packet do throwError "Control graph mismatch"
   cases := cases.push (Json.mkObj [("label",toJson label),("packet",packet),
    ("exactStructuralRoundtrip",toJson true),("kernelChecked",toJson false)])
  let good := graph #[mkConst ``True, mkConst ``True.intro]
  let bads : Array (String × Json) := #[
   ("unknown-format",good.setObjVal! "serialization" (toJson "ExprDAG/2")),
   ("unknown-constructor",good.setObjVal! "kind" (toJson #[999,4])),
   ("forward-cycle",good.setObjVal! "children" (toJson #[#[0],#[]])),
   ("wrong-arity",good.setObjVal! "children" (toJson #[#[0,0],#[]])),
   ("wrong-count",good.setObjVal! "expanded" (toJson #["2","1"])),
   ("wrong-scope",good.setObjVal! "neededScope" (toJson #[1,0])),
   ("out-of-range-root",good.setObjVal! "roots" (toJson #[2])),
   ("unreachable-node",good.setObjVal! "roots" (toJson #[0])),
   ("noncanonical-natural",(graph #[zero]).setObjVal! "payloads" (toJson #[Json.mkObj [("repr",toJson "Lean.Literal.natVal 0"),("literalKind",toJson "natVal"),("value",toJson "00")]])),
   ("unsupported-string-metadata",graph #[.mdata (KVMap.empty.setString `annotation "text") zero])]
  let mut rejected : Array String := #[]
  for (label,packet) in bads do
   match exact packet with
   | .error _ => rejected := rejected.push label
   | .ok _ => throwError "Malformed packet accepted: {label}"
  let positive ← liftTermElabM fun _ => do
   let mut positive : Array Json := #[]
   for (label,e) in [("identity",.lam `x nat (.bvar 0) .default),
       ("dependent-binders",.lam `p (.sort .zero) (.lam `h (.bvar 0) (.bvar 0) .default) .default),
       ("let-substitution",.letE `x nat zero (.bvar 0) false),
       ("metadata-proof",.mdata md (mkConst ``True.intro))] do
    let type ← checked e
    let packet := graph #[type,e]
    let (values,roots) ← match exact packet with | .ok v => pure v | .error err => throwError err
    let _ ← checked values[roots[0]!]!
    let _ ← checked values[roots[1]!]!
    let _ ← checked (mkApp (mkLambda `expected .default values[roots[0]!]! (.bvar 0)) values[roots[1]!]!)
    positive := positive.push (Json.mkObj [("label",toJson label),("packet",packet),
     ("kernelExpectedType",toJson "PASS"),("kernelTerm",toJson "PASS"),("kernelExpectedTypeConversion",toJson "PASS")])
   return positive
  -- Kernel rejection is separate from structural decoder rejection.
  let kernelRejected ← liftTermElabM fun _ => do
   let mut kernelRejected : Array String := #[]
   for (label,e) in [("missing-constant",mkConst `AtlasPacketMissing),
       ("ill-typed-domain",.lam `x zero (.bvar 0) .default),
       ("wrong-proof",mkApp (mkLambda `expected .default (mkConst ``False) (.bvar 0)) (mkConst ``True.intro))] do
    let accepted ← try
     let _ ← checked e
     pure true
    catch _ => pure false
    unless !accepted do throwError "Invalid kernel control accepted: {label}"
    kernelRejected := kernelRejected.push label
   return kernelRejected
  liftIO <| IO.FS.writeFile output.getString (Json.mkObj [("format",toJson "ProofAtlasPacketReplayControls/1"),
   ("structural",toJson cases),("native",toJson positive),("decoderRejected",toJson rejected),
   ("kernelRejected",toJson kernelRejected)]).compress
end AtlasPacketReplay
