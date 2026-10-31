/- Kernel-only operations in an imported constant-data environment. No MetaM
   operation is run against the environment with uninitialized extensions. -/
namespace AtlasRegionKernel
open Lean Elab Command AtlasLibrary AtlasPacketReplay

def required (r : Except String α) : IO α :=
  match r with | .ok a => pure a | .error e => throw (IO.userError e)

def typeOf (env : Environment) (ctx : LocalContext) (e : Expr) : IO Expr :=
  match Kernel.check env ctx e with
  | .ok type => pure type
  | .error ex => do
    throw (IO.userError ("Kernel type check rejected: " ++ (← (ex.toMessageData {}).toString)))

def atType (env : Environment) (ctx : LocalContext) (e expected : Expr) : IO Unit := do
  let _ ← typeOf env ctx expected
  let _ ← typeOf env ctx <| .app (.lam `expected expected (.bvar 0) .default) e

abbrev Supports := ExprStructMap (Array Nat)
def union (a b : Array Nat) : Array Nat :=
  (a ++ b).toList.eraseDups.toArray.qsort (· < ·)
def under (a : Array Nat) : Array Nat := a.filterMap fun i => if i == 0 then none else some (i-1)

partial def supportCore (e : Expr) : StateT Supports (Except String) (Array Nat) := do
  if !e.hasLooseBVars then return #[]
  if let some found := (← get).get? ⟨e⟩ then return found
  unless (← get).size < 262144 do throw "Support state bound"
  let result ← match e with
    | .bvar i => pure #[i]
    | .app f a => pure <| union (← supportCore f) (← supportCore a)
    | .lam _ t b _ | .forallE _ t b _ => pure <| union (← supportCore t) (under (← supportCore b))
    | .letE _ t v b _ => pure <| union (union (← supportCore t) (← supportCore v)) (under (← supportCore b))
    | .mdata _ b | .proj _ _ b => supportCore b
    | _ => pure #[]
  unless result.size <= 512 && result.all (· < 512) do throw "Support width/index bound"
  unless (← get).size < 262144 do throw "Support retained-state bound"
  modify (·.insert ⟨e⟩ result)
  return result

def support (memo : IO.Ref Supports) (e : Expr) : IO (Array Nat) := do
  let (result,next) ← required <| (supportCore e).run (← memo.get)
  memo.set next
  return result

abbrev Projections := Std.HashMap (ExprStructEq × Nat) Expr
partial def projectCore (mapping : Array (Option Nat)) (e : Expr) (depth : Nat) :
    StateT Projections (Except String) Expr := do
  if !e.hasLooseBVars then return e
  if let some found := (← get).get? (⟨e⟩,depth) then return found
  unless depth <= 512 && (← get).size < 262144 do throw "Projection state/depth bound"
  let result ← match e with
    | .bvar i => do
      if i < depth then pure e
      else
        let some j := (mapping[i-depth]?).join | throw "Required context slot omitted"
        pure (.bvar (depth+j))
    | .app f a => pure <| .app (← projectCore mapping f depth) (← projectCore mapping a depth)
    | .lam n t b bi => pure <| .lam n (← projectCore mapping t depth) (← projectCore mapping b (depth+1)) bi
    | .forallE n t b bi => pure <| .forallE n (← projectCore mapping t depth) (← projectCore mapping b (depth+1)) bi
    | .letE n t v b nd => pure <| .letE n (← projectCore mapping t depth) (← projectCore mapping v depth) (← projectCore mapping b (depth+1)) nd
    | .mdata d b => pure <| .mdata d (← projectCore mapping b depth)
    | .proj n i b => pure <| .proj n i (← projectCore mapping b depth)
    | e => pure e
  unless (← get).size < 262144 do throw "Projection retained-state bound"
  modify (·.insert (⟨e⟩,depth) result)
  return result

def project (e : Expr) (depth : Nat) (kept : Array Nat) : IO Expr := do
  let mapping := (List.range depth).toArray.map fun i => do
    let position ← kept.toList.idxOf? (depth-1-i)
    return kept.size-1-position
  let (result,_) ← required <| (projectCore mapping e 0).run {}
  return result

def embed (e : Expr) (depth : Nat) (kept : Array Nat) : IO Expr := do
  let mapping := kept.reverse.map (fun slot => some (depth-1-slot))
  let (result,_) ← required <| (projectCore mapping e 0).run {}
  return result

structure Frame where
  original : Expr
  pathDepth : Nat
  deriving Inhabited

def walk (e : Expr) (slots : Array Nat) : IO (Expr × Array Frame) := do
  unless slots.size <= 512 do throw (IO.userError "Source path bound")
  let mut e := e
  let mut frames := #[]
  for depth in [:slots.size] do
    let slot := slots[depth]!
    let fields := match e with
      | .app f a => #[f,a]
      | .lam _ t b _ | .forallE _ t b _ => #[t,b]
      | .letE _ t v b _ => #[t,v,b]
      | .mdata _ b | .proj _ _ b => #[b]
      | _ => #[]
    unless slot < fields.size do throw (IO.userError "Invalid source field")
    if ((e.isLambda || e.isForall) && slot == 1) || (e.isLet && slot == 2) then
      frames := frames.push {original := e, pathDepth := depth}
    e := fields[slot]!
  return (e,frames)

def domainValue (frame : Frame) : IO (Name × Expr × Option Expr × BinderInfo × Bool) :=
  match frame.original with
  | .lam n t _ bi | .forallE n t _ bi => pure (n,t,none,bi,false)
  | .letE n t v _ nd => pure (n,t,some v,.default,nd)
  | _ => throw (IO.userError "Not a source context binder")

def openContext (env : Environment) (frames : Array Frame) : IO (LocalContext × Array Expr) := do
  let mut ctx : LocalContext := {}
  let mut xs : Array Expr := #[]
  for j in [:frames.size] do
    let (name,rawType,rawValue,bi,nd) ← domainValue frames[j]!
    let domain := rawType.instantiateRev xs
    let _ ← typeOf env ctx (.forallE `checkDomain domain (.sort .zero) .default)
    let id : FVarId := ⟨Name.num `atlasRegionContext j⟩
    if let some value := rawValue then
      let value := value.instantiateRev xs
      atType env ctx value domain
      ctx := ctx.mkLetDecl id name domain value (nondep := nd)
    else ctx := ctx.mkLocalDecl id name domain bi
    xs := xs.push (.fvar id)
  return (ctx,xs)

def close (body : Expr) (frames : Array Frame) (kept : Array Nat) (pi : Bool) : IO Expr := do
  let mut result := body
  for slot in kept.reverse do
    let (name,type,value,bi,_) ← domainValue frames[slot]!
    let before := kept.filter (· < slot)
    let type ← project type slot before
    if let some value := value then
      result := .letE name type (← project value slot before) result false
    else if pi then result := .forallE name type result bi
    else result := .lam name type result bi
  return result

def observe (env : Environment) (memo : IO.Ref Supports) (source : Expr) (query : Json) : IO Json := do
  let slots ← required <| query.getObjValAs? (Array Nat) "slots"
  let kept ← required <| query.getObjValAs? (Array Nat) "keptSlots"
  let (raw,frames) ← walk source slots
  unless kept.toList.eraseDups.length == kept.size && kept.all (· < frames.size) &&
      kept == kept.qsort (· < ·) do throw (IO.userError "Ordered retained context")
  let (ctx,xs) ← openContext env frames
  let opened := raw.instantiateRev xs
  let inferred ← typeOf env ctx opened
  let rawType := inferred.abstract xs
  unless !rawType.hasFVar && !rawType.hasMVar &&
      (⟨rawType.instantiateRev xs⟩ : ExprStructEq) == ⟨inferred⟩ do
    throw (IO.userError "Raw type context roundtrip")
  let typeSupport ← support memo rawType
  let termSupport ← support memo raw
  let seeds := union termSupport typeSupport
  let mut closure := seeds.map (fun i => frames.size-1-i)
  for slot in (List.range frames.size).reverse do
    if closure.contains slot then
      let (_,type,value,_,_) ← domainValue frames[slot]!
      let mut dependencies ← support memo type
      if let some value := value then dependencies := union dependencies (← support memo value)
      for index in dependencies do
        unless index < slot do throw (IO.userError "Non-earlier native header support")
        let needed := slot-1-index
        if !closure.contains needed then closure := closure.push needed
  closure := closure.qsort (· < ·)
  unless closure.all kept.contains do throw (IO.userError "Typing needs omitted lexical context")
  let projected ← project raw frames.size kept
  let projectedType ← project rawType frames.size kept
  unless (⟨← embed projected frames.size kept⟩ : ExprStructEq) == ⟨raw⟩ &&
      (⟨← embed projectedType frames.size kept⟩ : ExprStructEq) == ⟨rawType⟩ do
    throw (IO.userError "Literal projection inverse")
  let closed ← close projected frames kept false
  let expected ← close projectedType frames kept true
  let actual ← typeOf env {} closed
  atType env {} closed expected
  let mut projectedFrames : Array Frame := #[]
  for slot in kept do
    let (name,type,value,bi,_) ← domainValue frames[slot]!
    let earlierSlots := kept.filter (· < slot)
    let type ← project type slot earlierSlots
    let header ← match value with
      | none => pure <| Expr.lam name type (.bvar 0) bi
      | some value => pure <| Expr.letE name type (← project value slot earlierSlots) (.bvar 0) false
    projectedFrames := projectedFrames.push {original := header, pathDepth := frames[slot]!.pathDepth}
  let (projectedContext,projectedVars) ← openContext env projectedFrames
  atType env projectedContext (projected.instantiateRev projectedVars)
    (projectedType.instantiateRev projectedVars)
  let mut applied := closed
  for slot in kept do
    let (_,_,value,_,_) ← domainValue frames[slot]!
    if value.isNone then applied := .app applied xs[slot]!
  atType env ctx applied inferred
  let .ok true := Kernel.isDefEq env ctx applied opened | throw (IO.userError "Recovery conversion")
  let .sort level ← typeOf env ctx inferred | throw (IO.userError "Inferred type sort form")
  let equality := mkApp3 (.const ``Eq [level]) inferred applied opened
  let witness := mkApp2 (.const ``Eq.refl [level]) inferred applied
  atType env ctx witness equality
  let all := (List.range frames.size).toArray
  let closedWitness ← close (witness.abstract xs) frames all false
  let closedEquality ← close (equality.abstract xs) frames all true
  atType env {} closedWitness closedEquality
  let types := AtlasPacketReplay.graph #[rawType,projectedType]
  let .ok kinds := types.getObjValAs? (Array Nat) "kind" | throw (IO.userError "Type table")
  unless kinds.size <= 32768 do throw (IO.userError "Raw type graph bound")
  let graph := AtlasPacketReplay.graph #[raw,rawType,projected,projectedType,closed,expected,actual,closedWitness,closedEquality]
  let .ok kinds := graph.getObjValAs? (Array Nat) "kind" | throw (IO.userError "Closed table")
  unless kinds.size <= 262144 do throw (IO.userError "Closed query graph bound")
  return Json.mkObj [("format",toJson "ProofAtlasRegionNativeQuery/1"),("status",toJson "PASS"),
    ("query",query),("originalDepth",toJson frames.size),("retainedDepth",toJson kept.size),
    ("rawTypeSupport",toJson typeSupport),("termSupport",toJson termSupport),
    ("typedClosureSlots",toJson closure),("graph",graph),("types",types),
    ("kernelOriginalTyping",toJson "PASS"),("kernelClosedExpectedType",toJson "PASS"),
    ("kernelProjectedOpenTyping",toJson "PASS"),
    ("kernelRecoveryConversion",toJson "PASS"),("kernelEqualityWitness",toJson "PASS"),
    ("literalInverse",toJson "PASS")]

def run (input output : System.FilePath) : IO Unit := do
  let request ← required <| Json.parse (← IO.FS.readFile input)
  let graphPath ← required <| request.getObjValAs? String "graphFile"
  let packet ← required <| Json.parse (← IO.FS.readFile graphPath)
  let values ← required <| AtlasPacketReplay.decode packet
  let roots ← required <| packet.getObjValAs? (Array Nat) "roots"
  let rebuilt := AtlasPacketReplay.graph (roots.map (values[·]!))
  for key in ["kind","children","payloads","expanded","neededScope","roots"] do
    unless (← required <| rebuilt.getObjVal? key) == (← required <| packet.getObjVal? key) do
      throw (IO.userError "Exact joint graph reconstruction failed")
  let imports ← required <| request.getObjValAs? (Array String) "imports"
  -- Import constants and kernel reduction data, without running library IR or
  -- initializing environment extensions. The process owns this one environment.
  let env ← importModules (imports.map fun n => {module := n.toName, importAll := true}) {}
    (trustLevel := 0) (loadExts := false)
  let source ← required <| request.getObjVal? "source"
  let originalName ← required <| source.getObjValAs? String "name"
  let originalImported := (env.find? originalName.toName).isSome
  if originalName == "JacobiData.slope_bound_abs" then
    let some original := env.find? originalName.toName | throw (IO.userError "Original Riccati support absent")
    let some body := original.value? true | throw (IO.userError "Original Riccati body absent")
    unless (⟨original.type⟩ : ExprStructEq) == ⟨values[roots[1]!]!⟩ &&
        (⟨body⟩ : ExprStructEq) == ⟨values[roots[0]!]!⟩ do
      throw (IO.userError "Imported Riccati type/body differs from exact packet")
  else if originalImported then throw (IO.userError "Original AI target declaration was imported")
  let mut missing : Array String := #[]
  for e in values do
    if let .const n _ := e then
      if (env.find? n).isNone then missing := missing.push n.toString
  unless missing.isEmpty do throw (IO.userError s!"Missing joint constants: {missing}")
  for (term,type) in [(0,1),(2,3),(4,5),(4,6),(7,1)] do
    IO.eprintln s!"Checking root assignment {term}/{type}"
    atType env {} values[roots[term]!]! values[roots[type]!]!
  let wrong := Kernel.check env {} <| .app
    (.lam `expected values[roots[1]!]! (.bvar 0) .default) (mkNatLit 0)
  let .error _ := wrong | throw (IO.userError "Wrong proof was accepted")
  let queries := (request.getObjValAs? (Array Json) "queries").toOption.getD #[]
  let memo ← IO.mkRef ({} : Supports)
  for query in queries do
    let component ← required <| query.getObjValAs? Nat "componentIndex"
    unless component < 8 do throw (IO.userError "Query component")
    let id ← required <| query.getObjValAs? Nat "id"
    IO.eprintln s!"Checking region {id}"
    let result ← observe env memo values[roots[component]!]! query
    IO.println result.compress
  IO.FS.writeFile output (Json.mkObj [("format",toJson "ProofAtlasRegionKernelBaseline/1"),
    ("status",toJson "PASS"),("imports",toJson imports),("originalTargetImported",toJson originalImported),
    ("kernelRootAssignments",toJson (5:Nat)),("wrongProofRejected",toJson true),
    ("loadExts",toJson false),("executableIrRestored",toJson false),
    ("importedModules",toJson env.header.moduleNames.size),("queries",toJson queries.size)]).compress

syntax "#atlas_region_kernel " str " => " str : command
elab_rules : command
  | `(#atlas_region_kernel $input:str => $output:str) =>
    liftIO <| run input.getString output.getString
end AtlasRegionKernel
