/- Computed eta interfaces for recursor methods. No invented source lambdas. -/
namespace AtlasBranchInterfaces
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes

def conversion (a b : Expr) : MetaM Unit := do
 match Kernel.isDefEq (← getEnv) (← getLCtx) a b with
 | .ok true => pure ()
 | _ => throwError "Computed method interface failed kernel conversion"

def methodInterface (method : Expr) (xs : Array Expr) (count : Nat) : MetaM Json := do
 if count > 128 then throwError "Method interface input bound"
 let type ← kernelType method
 forallBoundedTelescope type (some count) (fun ys _ => do
  unless ys.size == count do throwError "Method type has too few inputs"
  let body := mkAppN method ys
  let eta ← mkLambdaFVars ys body (etaReduce := false)
  kernelAs eta type
  conversion eta method
  let mut betaBody := eta
  for _ in [:count] do
   unless betaBody.isLambda do throwError "Computed input is not an explicit lambda"
   betaBody := betaBody.bindingBody!
  unless (⟨betaBody.instantiateRev ys⟩ : ExprStructEq) == ⟨body⟩ do
   throwError "Computed eta body failed exact abstraction roundtrip"
  let etaType ← kernelType eta
  let (etaRoot,s) ← internScoped eta xs {} 65536
  let (methodRoot,s) ← internScoped method xs s 65536
  let (methodTypeRoot,s) ← internScoped type xs s 65536
  let (etaTypeRoot,s) ← internScoped etaType xs s 65536
  let mut pool := s
  let mut inputs : Array Json := #[]
  for i in [:ys.size] do
   let decl ← ys[i]!.fvarId!.getDecl
   let domain ← kernelType ys[i]!
   let before := xs ++ ys.extract 0 i
   let (domainRoot,s) ← internScoped domain before pool 65536
   let (domainTypeRoot,s) ← internScoped (← kernelType domain) before s 65536
   pool := s
   inputs := inputs.push (obj [("ordinal",nat i),("name",str decl.userName.toString),
    ("binderInfo",str (AtlasLibrary.bi decl.binderInfo)),("role",str (← role domain)),
    ("contextLength",nat before.size),("domainRoot",nat domainRoot),
    ("domainTypeRoot",nat domainTypeRoot),("typeText",str (← prettyType domain))])
  let scope := xs ++ ys
  let bodyType ← kernelType body
  let (bodyRoot,s) ← internScoped body scope pool 65536
  let (bodyTypeRoot,s) ← internScoped bodyType scope s 65536
  return obj [("format",str "ProofAtlasComputedMethodInterface/1"),
   ("namespace",str "computed-method-interface"),("ambientContextLength",nat xs.size),
   ("inputCount",nat count),("sourceMethodRoot",nat methodRoot),
   ("sourceMethodTypeRoot",nat methodTypeRoot),("etaRoot",nat etaRoot),
   ("etaTypeRoot",nat etaTypeRoot),("inputs",toJson inputs),
   ("body",obj [("root",nat bodyRoot),("typeRoot",nat bodyTypeRoot),
    ("role",str (← role bodyType)),("contextLength",nat scope.size),
    ("typeText",str (← prettyType bodyType))]),("graph",graphJson s),
   ("checks",obj [("kernelTyping",str "PASS"),("kernelTypeConversion",str "PASS"),
    ("kernelTermConversion",str "PASS"),("exactEtaBodyRoundtrip",toJson true)]),
   ("sourceOccurrenceInvented",toJson false)] ) (whnfType := true)

def observe (original term : Expr) (xs : Array Expr) (context : Array Json)
    (shared : Shared) (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 let parent ← inspect original term xs context shared root slots path
 let t ← match parent.getObjVal? "eliminationJudgment" with
  | .ok v => pure v | .error _ => throwError "No recursor judgment"
 unless (t.getObjValAs? String "status").toOption == some "checked" do
  throwError "Recursor judgment unavailable"
 let order ← match t.getObjValAs? (Array Nat) "argumentOrder" with
  | .ok v => pure v | .error e => throwError e
 let parameters ← match t.getObjValAs? Nat "parameters" with | .ok v => pure v | .error e => throwError e
 let motives ← match t.getObjValAs? Nat "motives" with | .ok v => pure v | .error e => throwError e
 let rules ← match t.getObjValAs? (Array Json) "rules" with | .ok v => pure v | .error e => throwError e
 let args := term.getAppArgs
 let mut branches : Array Json := #[]
 for rule in rules do
  let minor ← match rule.getObjValAs? Nat "minor" with | .ok v => pure v | .error e => throwError e
  let count ← match rule.getObjValAs? Nat "inputCount" with | .ok v => pure v | .error e => throwError e
  let slot := order[parameters+motives+minor]!
  let value ← methodInterface args[slot-1]! xs count
  branches := branches.push (obj [("minor",nat minor),("sourceSlot",nat slot),("interface",value)])
 return obj [("parent",parent),("branches",toJson branches)]

syntax "#atlas_branch_interfaces " str " => " str : command
elab_rules : command
 | `(#atlas_branch_interfaces $input:str => $output:str) => do
  let requests ← readJson input.getString
  let cases ← match requests.getArr? with | .ok v => pure v | .error e => throwError e
  if cases.size > 32 then throwError "Branch profile bound"
  let mut results : Array Json := #[]
  for query in cases do
   let packet ← readJson (← string query "packetFile")
   let declaration ← field packet "declaration"
   let name ← string declaration "name"
   let info ← getConstInfo name.toName
   let env ← getEnv
   let owner := match env.getModuleIdxFor? info.name with
    | some i => env.header.moduleNames[i.toNat]!
    | none => env.mainModule
   let (typeRoot,s) := intern info.type {}
   let some value := info.value? true | throwError "Missing body"
   let (valueRoot,shared) := intern value s
   let native := graphJson shared
   for key in ["kind","children","payloads","expanded","neededScope"] do
    unless (← field native key) == (← field packet key) do throwError "Native packet mismatch: {key}"
   unless toJson #[typeRoot,valueRoot] == (← field packet "roots") do throwError "Root mismatch"
   let routes ← match (← field query "routes").getArr? with | .ok v => pure v | .error e => throwError e
   if routes.size > 64 then throwError "Branch query bound"
   let mut entries : Array Json := #[]
   for route in routes do
    let root ← match route.getObjValAs? Nat "root" with | .ok v => pure v | .error e => throwError e
    let slots ← match route.getObjValAs? (Array Nat) "slots" with | .ok v => pure v | .error e => throwError e
    if root > 1 || slots.size > 512 then throwError "Invalid branch route"
    let expr := if root == 0 then info.type else value
    let entry ← liftTermElabM fun _ =>
     atRouteWith expr slots.toList #[] #[] shared root #[] (if root == 0 then "root.type" else "root.value") observe
    entries := entries.push entry
   results := results.push (obj [("format",str "ProofAtlasBranchInterfaces/1"),
    ("name",str name),("source",← field query "source"),("nativeDagMatchesPacket",toJson true),
    ("nativeDeclarationModule",str owner.toString),("nativeMainModule",str env.mainModule.toString),
    ("leanVersion",str Lean.versionString),("entries",toJson entries)])
  liftIO <| IO.FS.writeFile output.getString (toJson results).compress
end AtlasBranchInterfaces
