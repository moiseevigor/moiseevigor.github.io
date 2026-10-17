import ExportOccurrenceTypes
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
namespace AtlasContextClosure
structure Frame where
 original : Expr
 route : Json
 deriving Inhabited
structure Checked where
 entry : Json := Json.null
 original : Expr := .bvar 0
 headers : Array Expr := #[]
 closedTerm : Expr := .bvar 0
 rawType : Expr := .bvar 0
 depth : Nat := 0
 deriving Inhabited

def headerShape : Expr → Expr
 | .lam n t _ bi => .lam n t (.bvar 0) bi
 | .forallE n t _ bi => .forallE n t (.bvar 0) bi
 | .letE n t v _ nondep => .letE n t v (.bvar 0) nondep
 | e => e

def closedKernelType (e : Expr) : MetaM Expr := do
 unless !e.hasFVar && !e.hasMVar && !e.hasLooseBVars do throwError "Closure is not closed"
 match Kernel.check (← getEnv) {} e with
 | .ok t => return t
 | .error ex => throwError "Kernel rejected closed context: {ex.toMessageData (← getOptions)}"


structure ReducedModule where
 term : Expr
 type : Expr
 route : Json
 arity : Nat
 letSlots : Array Bool
 deriving Inhabited

def reducedContext (term inferred : Expr) (xs : Array Expr) (retained : Array Frame) (slots : Array Nat)
    (state : Json) (cache : IO.Ref (Array ReducedModule)) : MetaM Json := do
 unless slots.size <= retained.size do throwError "Reduced context bounds"
 let mut previous : Option Nat := none
 let mut selected : Array Expr := #[]
 for j in slots do
  unless j < retained.size do throwError "Reduced context bound"
  if let some prior := previous then
   unless prior < j do throwError "Reduced context order"
  previous := some j
  selected := selected.push xs[xs.size-retained.size+j]!
 let rawTerm := term.abstract selected
 let rawType := inferred.abstract selected
 unless !rawTerm.hasFVar && !rawType.hasFVar && !rawTerm.hasMVar && !rawType.hasMVar do throwError "Reduced context omitted term/type support"
 unless (⟨rawTerm.instantiateRev selected⟩ : ExprStructEq) == ⟨term⟩ && (⟨rawType.instantiateRev selected⟩ : ExprStructEq) == ⟨inferred⟩ do throwError "Reduced context roundtrip"
 let mut closed := rawTerm
 let mut expected := rawType
 for pos in (List.range slots.size).reverse do
  let j := slots[pos]!
  let ambientPrefix := xs.extract 0 (xs.size-retained.size+j)
  let preceding := selected.extract 0 pos
  match retained[j]!.original with
  | .lam n t _ bi | .forallE n t _ bi =>
   let domain := (t.instantiateRev ambientPrefix).abstract preceding
   closed := .lam n domain closed bi
   expected := .forallE n domain expected bi
  | .letE n t v _ _ =>
   let domain := (t.instantiateRev ambientPrefix).abstract preceding
   let value := (v.instantiateRev ambientPrefix).abstract preceding
   closed := .letE n domain value closed false
   expected := .letE n domain value expected false
  | _ => throwError "Reduced context header"
 let _ ← closedKernelType closed
 let _ ← closedKernelType expected
 let _ ← closedKernelType (mkApp (mkLambda `atlasReducedExpected .default expected (.bvar 0)) closed)
 let mut applied := closed
 for pos in [:slots.size] do
  unless retained[slots[pos]!]!.original.isLet do applied := mkApp applied selected[pos]!
 kernelAs applied inferred
 kernelAs (← mkEqRefl applied) (← mkEq applied term)
 let originals : Array ReducedModule ← cache.get
 let letSlots := slots.map (fun j => retained[j]!.original.isLet)
 let mut found : Option Nat := none
 for j in [:originals.size] do
  let candidate := originals[j]!
  if candidate.arity == slots.size && candidate.letSlots == letSlots &&
    (⟨candidate.term⟩ : ExprStructEq) == ⟨closed⟩ && (⟨candidate.type⟩ : ExprStructEq) == ⟨expected⟩ then
   found := some j
   break
 let route ← match state.getObjVal? "route" with | .ok r => pure r | .error e => throwError e
 let moduleRecord ← match found with
  | some id => do
   let canonical := originals[id]!
   let mut instantiated := canonical.term
   for pos in [:slots.size] do
    unless letSlots[pos]! do instantiated := mkApp instantiated selected[pos]!
   kernelAs instantiated inferred
   kernelAs (← mkEqRefl instantiated) (← mkEq instantiated term)
   pure <| obj [("namespace",str "checked-context-module"),("id",nat id),("status",str "checked-instantiation"),
    ("contextEntryCount",nat slots.size),("argumentCount",nat (letSlots.filter (!·)).size),("letSlots",toJson letSlots),("canonicalRoute",canonical.route),
    ("closedTermStructuralMatch",toJson true),("closedTypeStructuralMatch",toJson true),
    ("kernelInstantiationTyping",str "PASS"),("kernelInstantiationConversion",str "PASS")]
  | none => do
   let id := originals.size
   cache.set (originals.push {term:=closed,type:=expected,route,arity:=slots.size,letSlots})
   let (moduleTermRoot,mg) := intern closed {}
   let (moduleTypeRoot,mg) := intern expected mg
   pure <| obj [("namespace",str "checked-context-module"),("id",nat id),("status",str "first-checked-module"),
    ("contextEntryCount",nat slots.size),("argumentCount",nat (letSlots.filter (!·)).size),("letSlots",toJson letSlots),("canonicalRoute",route),
    ("moduleTermRoot",nat moduleTermRoot),("moduleTypeRoot",nat moduleTypeRoot),("moduleGraph",graphJson mg)]
 let (root,g) := intern rawType {}
 return obj [("status",str "checked"),("slots",toJson slots),("rawTypeRoot",nat root),("rawTypeGraph",graphJson g),("module",moduleRecord),
  ("closedTermTyping",str "PASS"),("closedTypeTyping",str "PASS"),("closedExpectedConversion",str "PASS"),
  ("appliedClosureTyping",str "PASS"),("instantiatedTermConversion",str "PASS"),("sourceTypeRoundtrip",str "PASS")]

def observe (original : Expr) (xs : Array Expr) (frames : Array Frame) (shared : Shared)
    (state : Json) (canonical : Option Checked) (reducedCache : IO.Ref (Array ReducedModule)) : MetaM Checked := do
 let depth ← match state.getObjValAs? Nat "patternDepth" with | .ok n => pure n | .error e => throwError e
 unless depth <= frames.size do throwError "Retained context exceeds actual source context"
 let term := original.instantiateRev xs
 let inferred ← kernelType term
 let rawType := inferred.abstract xs
 unless !rawType.hasFVar && !rawType.hasMVar && (⟨rawType.instantiateRev xs⟩ : ExprStructEq) == ⟨inferred⟩ do throwError "Type context roundtrip failed"
 let retained := frames.extract (frames.size-depth) frames.size
 let headers := retained.map (fun f => headerShape f.original)
 let mut closedTerm := original
 let mut expected := rawType
 let mut recipe : Array Json := #[]
 for j in [:retained.size] do
  let frame := retained[j]!
  let (domain,value) ← match frame.original with
   | .lam _ t _ _ | .forallE _ t _ _ => pure (t,none)
   | .letE _ t v _ _ => pure (t,some v)
   | _ => throwError "Not a source binder"
  unless shared.neededScope[← sourceId shared domain]! <= j do throwError "Retained header depends on discarded context"
  if let some v := value then
   unless shared.neededScope[← sourceId shared v]! <= j do throwError "Retained let value depends on discarded context"
  let valueId ← match value with | some v => do pure (nat (← sourceId shared v)) | none => pure Json.null
  recipe := recipe.push (obj [("node",nat (← sourceId shared frame.original)),("sourceRoute",frame.route),
   ("domain",nat (← sourceId shared domain)),("value",valueId),
   ("slot",nat j),("namespace",str "context-closure-slot")])
 for frame in retained.reverse do
  match frame.original with
  | .lam n t _ bi | .forallE n t _ bi =>
   closedTerm := .lam n t closedTerm bi
   expected := .forallE n t expected bi
  | .letE n t v _ _ =>
   -- The new body differs from the source body. Do not copy its nondep hint.
   closedTerm := .letE n t v closedTerm false
   expected := .letE n t v expected false
  | _ => throwError "Not a retained binder"
 let actual ← closedKernelType closedTerm
 let _ ← closedKernelType expected
 let _ ← closedKernelType (mkApp (mkLambda `atlasClosureExpected .default expected (.bvar 0)) closedTerm)
 -- Closed wrappers borrow source headers, including potentially large let
 -- values. Their exact recipe is exported instead of copying those values.
 let (typeRoot,types) := intern rawType {}
 unless types.kind.size <= 32768 && types.neededScope[typeRoot]! <= depth do throwError "Closure type table/scope bound"
 let transport ← match canonical with
  | none => pure <| obj [("status",str "first-class-observation")]
  | some previous => do
   unless previous.depth == depth && previous.headers.size == headers.size &&
     (⟨previous.original⟩ : ExprStructEq) == ⟨original⟩ &&
     (previous.headers.zip headers).all (fun (a,b) => (⟨a⟩ : ExprStructEq) == ⟨b⟩) do
    throwError "Native context class differs from representative"
   let mut applied := previous.closedTerm
   for j in [:retained.size] do
    unless retained[j]!.original.isLet do
     applied := mkApp applied xs[xs.size-depth+j]!
   let expectedAtTarget := previous.rawType.instantiateRev xs
   kernelAs term expectedAtTarget
   kernelAs applied expectedAtTarget
   -- Kernel checking Eq.refl forces endpoint conversion, including beta/zeta.
   let equality ← mkEq applied term
   kernelAs (← mkEqRefl applied) equality
   let canonicalRoute ← match previous.entry.getObjVal? "state" >>= fun s => s.getObjVal? "route" with
    | .ok r => pure r
    | .error ex => throwError ex
   pure <| obj [("status",str "kernel-compared-at-selected-target"),
    ("method",str "closed-lambda-let-instantiation/1"),("canonicalRoute",canonicalRoute),
    ("kernelTargetAtCanonicalType",str "PASS"),("kernelAppliedClosureTyping",str "PASS"),
    ("kernelInstantiatedTermConversion",str "PASS"),("nativeHeaderStructuralMatch",toJson true)]

 let selectedSlots ← match state.getObjValAs? (Array Nat) "requiredSlots" with | .ok a => pure a | .error e => throwError e
 let expectFailure ← match state.getObjValAs? Bool "expectReducedFailure" with | .ok a => pure a | .error e => throwError e
 let reduced ← if expectFailure then do
   let rejected ← try
    let _ ← reducedContext term inferred xs retained selectedSlots state reducedCache
    pure false
   catch _ => pure true
   unless rejected do throwError "Invalid reduced context accepted"
   pure <| obj [("status",str "expected-rejection"),("slots",toJson selectedSlots)]
  else reducedContext term inferred xs retained selectedSlots state reducedCache
 let entry := obj [("reducedContext",reduced),("format",str "ProofAtlasClosedContextObservation/2"),("status",str "checked"),
  ("namespace",str "closed-context-judgment"),("state",state),("node",nat (← sourceId shared original)),
  ("actualContextDepth",nat frames.size),("retainedContextDepth",nat depth),("discardedPrefix",nat (frames.size-depth)),
  ("recipe",toJson recipe),("closedRepresentation",str "source-backed-context-recipe/1"),
  ("newLetNondep",toJson false),("graph",graphJson types),("typeRoot",nat typeRoot),
  ("kernelOriginalTermTyping",str "PASS"),("kernelClosedTermTyping",str "PASS"),
  ("kernelClosedTypeTyping",str "PASS"),("kernelClosedConversion",str "PASS"),("typeAbstractionRoundtrip",toJson true),
  ("closedTypesStructurallyEqual",toJson ((⟨actual⟩ : ExprStructEq) == ⟨expected⟩)),("role",str (← role inferred)),
  ("reuseAtOtherSourcePaths",str "not-derived"),("selectedTargetTransport",transport)]
 return {entry,original,headers,closedTerm,rawType,depth}

partial def atRoute (e : Expr) (rest : List Nat) (xs : Array Expr) (frames : Array Frame)
    (shared : Shared) (root : Nat) (slots : Array Nat) (state : Json) (canonical : Option Checked) (reducedCache : IO.Ref (Array ReducedModule)) : MetaM Checked := do
 match rest with
 | [] => observe e xs frames shared state canonical reducedCache
 | slot::tail =>
  let child ← match e,slot with
   | .app f _,0 => pure f | .app _ a,1 => pure a
   | .lam _ t _ _,0 | .forallE _ t _ _,0 => pure t
   | .lam _ _ b _,1 | .forallE _ _ b _,1 => pure b
   | .letE _ t _ _ _,0 => pure t | .letE _ _ v _ _,1 => pure v | .letE _ _ _ b _,2 => pure b
   | .mdata _ t,0 | .proj _ _ t,0 => pure t
   | _,_ => throwError "Invalid source route"
  let descend ys fs := atRoute child tail ys fs shared root (slots.push slot) state canonical reducedCache
  let frame : Frame := {original:=e,route:=routeJson root slots}
  match e,slot with
  | .lam n t _ bi,1 | .forallE n t _ bi,1 =>
   let domain := t.instantiateRev xs
   checkDomain domain
   withLocalDecl n bi domain fun x => descend (xs.push x) (frames.push frame)
  | .letE n t v _ nondep,2 =>
   let domain := t.instantiateRev xs
   let value := v.instantiateRev xs
   checkDomain domain; kernelAs value domain
   withLetDecl n domain value (nondep:=nondep) fun x => descend (xs.push x) (frames.push frame)
  | _,_ => descend xs frames

syntax "#atlas_closed_context " str " => " str : command
elab_rules : command
 | `(#atlas_closed_context $input:str => $output:str) => do
  let request ← readJson input.getString
  let queries ← match request.getArr? with | .ok a => pure a | .error e => throwError e
  unless queries.size <= 32 do throwError "Declaration bound"
  liftIO <| IO.FS.writeFile output.getString ""
  for query in queries do
   let packet ← readJson (← string query "packetFile")
   let declaration ← field packet "declaration"
   let info ← getConstInfo (← string declaration "name").toName
   let some value := info.value? true | throwError "Body required"
   liftTermElabM fun _ => kernelAs value info.type
   let (t,s) := intern info.type {}
   let (v,shared) := intern value s
   let exprs := #[info.type,value]
   let native := graphJson shared
   for key in ["kind","children","payloads","expanded","neededScope"] do
    unless (← field native key) == (← field packet key) do throwError "Native/source DAG mismatch: {key}"
   unless toJson #[t,v] == (← field packet "roots") do throwError "Native/source roots mismatch"
   let states ← match (← field query "states").getArr? with | .ok a => pure a | .error e => throwError e
   unless states.size <= 512 do throwError "Query bound"
   let mut representatives : Std.HashMap Nat Checked := {}
   let reducedCache ← liftIO <| IO.mkRef (#[] : Array ReducedModule)
   for state in states do
    let route ← field state "route"
    let root ← match route.getObjValAs? Nat "root" with | .ok a => pure a | .error e => throwError e
    let slots ← match route.getObjValAs? (Array Nat) "slots" with | .ok a => pure a | .error e => throwError e
    unless root < 2 && slots.size <= 512 do throwError "Route bound"
    let id ← match state.getObjValAs? Nat "state" with | .ok a => pure a | .error e => throwError e
    let result ← try
     liftTermElabM fun _ => atRoute exprs[root]! slots.toList #[] #[] shared root #[] state (representatives.get? id) reducedCache
    catch ex =>
     logWarning ex.toMessageData
     pure <| {entry:=obj [("status",str "unavailable"),("state",state),("reason",str "Closed context check failed; diagnostic retained privately")] : Checked}
    if (← string result.entry "status") == "checked" && !representatives.contains id then representatives := representatives.insert id result
    let row := obj [("source",← field query "source"),("nativeDagMatchesPacket",toJson true),("kernelDeclarationTyping",str "PASS"),("entry",result.entry)]
    liftIO <| IO.FS.withFile output.getString .append fun h => h.putStrLn row.compress
end AtlasContextClosure
