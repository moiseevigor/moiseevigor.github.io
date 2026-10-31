/- Included after Reference.lean and the unchanged exact ExprDAG codec. -/
namespace AtlasExprReferenceBridge
open Lean Elab Command AtlasExprReference
abbrev Memo := Std.HashMap (ExprStructEq × Nat) Expr

/- Executable shared-DAG port. Its refinement to the structural reference is
   tested below; it is not covered by the general reference-function proofs. -/
partial def memoRewrite (e : Expr) (depth : Nat) (mapVariable : Nat → Nat → Expr) : StateT Memo (Except String) Expr := do
 if let some found := (← get).get? (⟨e⟩,depth) then return found
 unless (← get).size < 262144 && depth<=512 do throw "Memo rewrite state/depth bound"
 let result ← match e with
  | .bvar i => pure (mapVariable i depth)
  | .app f a => return .app (← memoRewrite f depth mapVariable) (← memoRewrite a depth mapVariable)
  | .lam n t b bi => return .lam n (← memoRewrite t depth mapVariable) (← memoRewrite b (depth+1) mapVariable) bi
  | .forallE n t b bi => return .forallE n (← memoRewrite t depth mapVariable) (← memoRewrite b (depth+1) mapVariable) bi
  | .letE n t v b flag => return .letE n (← memoRewrite t depth mapVariable) (← memoRewrite v depth mapVariable) (← memoRewrite b (depth+1) mapVariable) flag
  | .mdata md b => return .mdata md (← memoRewrite b depth mapVariable)
  | .proj n i b => return .proj n i (← memoRewrite b depth mapVariable)
  | e => pure e
 unless (← get).size < 262144 do throw "Memo rewrite retained state bound"
 modify (·.insert (⟨e⟩,depth) result)
 return result

def memoLift (e : Expr) (amount cutoff : Nat) : Except String (Expr × Nat) := do
 let (result,state) ← (memoRewrite e cutoff fun i d => .bvar (if d≤i then i+amount else i)).run {}
 return (result,state.size)

def memoSwap (e : Expr) (depth : Nat) : Except String (Expr × Nat) := do
 let (result,state) ← (memoRewrite e depth fun i d => .bvar (swapIndex d i)).run {}
 return (result,state.size)

def memoSubstitute (e value : Expr) : Except String (Expr × Nat) := do
 let (result,state) ← (memoRewrite e 0 fun i d => if i=d then value.liftLooseBVars 0 d else .bvar (if d<i then i-1 else i)).run {}
 return (result,state.size)

def nativeSwap (e : Expr) : Expr :=
 (e.liftLooseBVars 2 2).instantiateRev #[.bvar 0,.bvar 1]

def equal (a b : Expr) (label : String) : Except String Unit :=
 if (⟨a⟩ : ExprStructEq) == ⟨b⟩ then .ok () else .error ("Raw constructor mismatch: "++label)

partial def selectPath (e : Expr) : List Nat → Except String Expr
 | [] => return e
 | slot::rest => do
  let fields := match e with
   | .app f a => #[f,a]
   | .lam _ t b _ | .forallE _ t b _ => #[t,b]
   | .letE _ t v b _ => #[t,v,b]
   | .mdata _ b | .proj _ _ b => #[b]
   | _ => #[]
  unless slot<fields.size do throw "Selected constructor field"
  selectPath fields[slot]! rest

def required (r : Except String α) : CommandElabM α :=
 match r with | .ok value => pure value | .error e => throwError "{e}"

def laws : List Name := [``lift_size,``lift_uses_above,``lift_uses_below,``lift_uses_gap,
 ``substitute_uses_below,``substitute_uses_above,``substitute_size,``instantiate_uses,``instantiate_size,
 ``swapIndex_involutive,``swapIndex_injective,``swapIndex_succ,``swap_involutive,``swap_size,``swap_uses,``exchange_size]

def auditLaws : CommandElabM Json := do
 let mut rows : Array Json := #[]
 for name in laws do
  let env ← getEnv
  let .thmInfo info := env.find? name |>.get! | throwError "Expected reference theorem"
  let .ok inferred := Kernel.check env {} info.value | throwError "Reference theorem kernel rejection"
  let .ok true := Kernel.isDefEq env {} inferred info.type | throwError "Reference theorem declared type"
  let axioms ← liftCoreM <| Lean.collectAxioms name
  unless !axioms.contains ``sorryAx do throwError "Unproved reference theorem"
  rows := rows.push <| Json.mkObj [("name",toJson name.toString),("kernelTyping",toJson "PASS"),("axioms",toJson (axioms.toList.map Name.toString))]
 return toJson rows

syntax "#atlas_expr_reference " str " => " str : command
elab_rules : command
 | `(#atlas_expr_reference $input:str => $output:str) => do
  let request ← liftIO <| IO.FS.readFile input.getString
  let .ok request := Json.parse request | throwError "Reference request JSON"
  let .ok graphFile := request.getObjValAs? String "graphFile" | throwError "Graph input path"
  let bytes ← liftIO <| IO.FS.readFile graphFile
  let .ok graph := Json.parse bytes | throwError "Reference graph JSON"
  let nodes ← required <| AtlasPacketReplay.decode graph
  let roots ← required <| graph.getObjValAs? (Array Nat) "roots"
  unless roots.size>0 && roots.size<=256 && roots.all (·<nodes.size) do throwError "Joint component root bound"
  let rebuilt := AtlasPacketReplay.graph (roots.map (nodes[·]!))
  for field in ["kind","children","payloads","expanded","neededScope","roots"] do
   unless (← required <| graph.getObjVal? field)==(← required <| rebuilt.getObjVal? field) do throwError "Exact joint graph roundtrip: {field}"
  let source ← required <| request.getObjVal? "source"
  let sourceName ← required <| source.getObjValAs? String "name"
  unless ((← getEnv).find? sourceName.toName).isNone do throwError "Original proof declaration imported"
  unless !(← getEnv).header.moduleNames.any (fun n => n.toString.startsWith "Mathlib" || n.toString.startsWith "SE2Conjugate") do throwError "Non-core reference environment"
  let queries ← required <| request.getObjValAs? (Array Json) "queries"
  unless queries.size<=128 do throwError "Query count bound"
  let mut observations : Array Json := #[]
  for q in queries do
   let indices ← required <| q.getObjVal? "nodes"
   let nodeId (key : String) := required <| indices.getObjValAs? Nat key
   let node (key : String) : CommandElabM Expr := do
    let i ← nodeId key
    unless i<nodes.size do throwError "Native node index"
    return nodes[i]!
   let beforeRoot ← required <| q.getObjValAs? Nat "beforeRoot"
   let afterRoot ← required <| q.getObjValAs? Nat "afterRoot"
   unless beforeRoot<roots.size && afterRoot<roots.size do throwError "Stage component"
   let path ← required <| q.getObjValAs? (Array Nat) "path"
   unless path.size<=128 do throwError "Stage path bound"
   let before ← required <| selectPath nodes[roots[beforeRoot]!]! path.toList
   let after ← required <| selectPath nodes[roots[afterRoot]!]! path.toList
   let .letE ln a v (.lam iname domain body bi) flag := before | throwError "Original exchange shape"
   let .lam _ newDomain (.letE _ newA newValue newBody false) _ := after | throwError "Computed exchange shape / annotation"
   for (key,e) in [("before",before),("after",after),("a",a),("value",v),("domain",domain),("body",body),("newDomain",newDomain),("newA",newA),("newValue",newValue),("newBody",newBody)] do
    let _ ← required <| equal (← node key) e ("selected "++key)
   let counts ← required <| q.getObjVal? "counts"
   let count (key : String) : CommandElabM Nat := do
    let s ← required <| counts.getObjValAs? String key
    let some n := s.toNat? | throwError "Occurrence integer"
    return n
   unless (← count "domain")<=65536 && (← count "newDomain")<=65536 do throwError "Direct reference evaluation bound"
   let replacementCount := uses domain 0
   let direct := substitute domain v 0
   let _ ← required <| equal direct newDomain "proved reference substitution / recorded domain"
   let _ ← required <| equal direct (domain.instantiate1 v) "proved reference substitution / native instantiate1"
   let (memoDomain,subStates) ← required <| memoSubstitute domain v
   let _ ← required <| equal memoDomain direct "memoized substitution / direct reference"
   let (memoA,aStates) ← required <| memoLift a 1 0
   let (memoV,vStates) ← required <| memoLift v 1 0
   let (memoBody,bodyStates) ← required <| memoSwap body 0
   let _ ← required <| equal memoA (a.liftLooseBVars 0 1) "memoized lift / native type"
   let _ ← required <| equal memoV (v.liftLooseBVars 0 1) "memoized lift / native value"
   let _ ← required <| equal memoBody (nativeSwap body) "memoized swap / native swapPair"
   let _ ← required <| equal (.lam iname direct (.letE ln memoA memoV memoBody false) bi) after "complete local exchange"
   let mut coefficients : Array Json := #[]
   for target in [:path.size] do
    let old := uses domain (target+1)
    -- Zero replacements make the value coefficient irrelevant; do not expand
    -- a large retained proof merely to multiply its count by zero.
    let valueUses := if replacementCount==0 then none else some (uses v target)
    let current := uses direct target
    unless current==old+replacementCount*valueUses.getD 0 do throwError "Direct reference coefficient law"
    coefficients := coefficients.push <| Json.mkObj [("target",toJson target),("old",toJson (toString old)),("value",toJson (valueUses.map toString)),("computed",toJson (toString current))]
   unless size domain==(← count "domain") && size direct==(← count "newDomain") do throwError "Direct reference size / encoded occurrence count"
   unless size direct+replacementCount==(← count "domain")+replacementCount*(← count "value") do throwError "Domain occurrence-size law"
   unless (← count "after")+replacementCount==(← count "before")+replacementCount*(← count "value") do throwError "Whole block occurrence-size law"
   observations := observations.push <| Json.mkObj [("query",q),("referenceDomain",toJson "PASS"),("nativeInstantiate",toJson "PASS"),("memoizedPrimitives",toJson "PASS"),("completeRecordedBlock",toJson "PASS"),("replacementCount",toJson (toString replacementCount)),("coefficients",toJson coefficients),("originalFlag",toJson flag),("memoStates",toJson #[subStates,aStates,vStates,bodyStates])]
  let result := Json.mkObj [("format",toJson "ProofAtlasExprReferenceBridge/1"),("source",source),("id",← required <| request.getObjVal? "id"),("nativeCaseSha256",← required <| request.getObjVal? "nativeCaseSha256"),("nativeInventory",← required <| request.getObjVal? "nativeInventory"),("originalDeclarationImported",toJson false),("exactRoundtrip",toJson "PASS"),("laws",← auditLaws),("observations",toJson observations)]
  liftIO <| IO.FS.writeFile output.getString result.compress
end AtlasExprReferenceBridge
