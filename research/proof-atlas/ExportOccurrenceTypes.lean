import ExportLibrary
/- Bounded occurrence queries against an exact, independently hashed published DAG.
   This file is combined with ExportLibrary by the private extraction driver.
   It never exports original source or tactic scripts. -/
open Lean Elab Command Meta AtlasLibrary
namespace AtlasOccurrenceTypes
def routeJson (root : Nat) (slots : Array Nat) : Json := obj [("root",nat root),("slots",toJson slots)]
def sourceId (shared : Shared) (e : Expr) : MetaM Nat := do
 let some i := shared.seen.get? ⟨e⟩ | throwError "Occurrence absent from native shared graph"
 return i
def graphJson (shared : Shared) : Json := obj [("kind",toJson shared.kind),("children",toJson shared.children),
 ("payloads",toJson shared.payloads),("expanded",toJson (shared.expanded.map (toString ·))),("neededScope",toJson shared.neededScope)]
def role (type : Expr) : MetaM String := do
 if ← isProp type then return "proof"
 match ← whnf type with | .sort _ => return "type" | _ => return "value"
def kernelType (e : Expr) : MetaM Expr := do
 match Kernel.check (← getEnv) (← getLCtx) e with
 | .ok t => return t
 | .error ex => throwError "Kernel rejected contextual expression: {ex.toMessageData (← getOptions)}"
def checkDomain (domain : Expr) : MetaM Unit := do
 unless (← whnf (← kernelType domain)).isSort do throwError "Local declaration domain is not a type"
def internScoped (type : Expr) (xs : Array Expr) (shared : Shared) : MetaM (Nat × Shared) := do
 let type ← instantiateMVars type
 let abstractType := type.abstract xs
 if abstractType.hasFVar || abstractType.hasMVar then throwError "Unresolved local/type metavariable"
 unless (⟨abstractType.instantiateRev xs⟩ : ExprStructEq) == ⟨type⟩ do
  throwError "Type abstraction/context roundtrip changed the inferred expression"
 let (r,next) := intern abstractType shared
 if next.kind.size > 8192 then throwError "Type DAG exceeds 8192 shared nodes"
 return (r,next)

def inspect (original term : Expr) (xs : Array Expr) (context : Array Json) (shared : Shared)
    (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 let type ← kernelType term
 unless ← isDefEq type (← inferType term) do throwError "Kernel/meta type mismatch"
 let (typeRoot,initial) ← internScoped type xs {}
 let mut types := initial
 let mut arguments : Array Json := #[]
 let args := term.getAppArgs
 if args.size > 128 then throwError "Application exceeds 128 argument observations"
 let mut funTerm := term.getAppFn
 for j in [:args.size] do
  let arg := args[j]!
  let argType ← inferType arg
  let .forallE _ domain body binderInfo ← whnf (← inferType funTerm) | throwError "No function domain"
  unless ← isDefEq domain argType do throwError "Instantiated argument domain mismatch"
  let next := mkApp funTerm arg
  unless ← isDefEq (body.instantiate1 arg) (← inferType next) do throwError "Dependent result substitution mismatch"
  let (aRoot,s) ← internScoped argType xs types
  let (dRoot,s) ← internScoped domain xs s
  types := s
  let mut argSlots := slots
  let mut argPath := path
  let mut source := original
  for _ in [:args.size-1-j] do
   source := source.appFn!
   argSlots := argSlots.push 0
   argPath := argPath ++ ".fn"
  source := source.appArg!
  argSlots := argSlots.push 1
  argPath := argPath ++ ".arg"
  arguments := arguments.push (obj [("slot",nat (j+1)),("node",nat (← sourceId shared source)),
   ("route",routeJson root argSlots),("path",str argPath),("role",str (← role argType)),
   ("binderInfo",str (AtlasLibrary.bi binderInfo)),("typeRoot",nat aRoot),("expectedRoot",nat dRoot)])
  funTerm := next
 let text ← withOptions (fun o => ((o.set `pp.maxDepth (12 : Nat)).set `pp.maxSteps (5000 : Nat)).set `pp.width (80 : Nat)) do
  return (← ppExpr type).pretty
 return obj [("status",str "checked"),("kernelCheck",str "PASS"),("contextWellFormed",toJson true),("typeAbstractionRoundtrip",toJson true),("node",nat (← sourceId shared original)),
  ("route",routeJson root slots),("path",str path),("context",toJson context),("role",str (← role type)),
  ("typeRoot",nat typeRoot),("typeGraph",graphJson types),("typeText",str text),
  ("typeTextIsPresentation",toJson true),("arguments",toJson arguments)]

partial def atRoute (e : Expr) (rest : List Nat) (xs : Array Expr) (context : Array Json)
    (shared : Shared) (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 match rest with
 | [] => inspect e (e.instantiateRev xs) xs context shared root slots path
 | slot :: tail =>
  let (field,child) ← match e,slot with
   | .app f _,0 => pure ("fn",f) | .app _ a,1 => pure ("arg",a)
   | .lam _ t _ _,0 | .forallE _ t _ _,0 => pure ("domain",t)
   | .lam _ _ b _,1 | .forallE _ _ b _,1 => pure ("body",b)
   | .letE _ t _ _ _,0 => pure ("type",t) | .letE _ _ v _ _,1 => pure ("value",v) | .letE _ _ _ b _,2 => pure ("body",b)
   | .mdata _ x,0 => pure ("expr",x) | .proj _ _ x,0 => pure ("struct",x)
   | _,_ => throwError "Invalid occurrence route"
  let descend (ys : Array Expr) (ctx : Array Json) := atRoute child tail ys ctx shared root (slots.push slot) (path ++ "." ++ field)
  match e,slot with
  | .lam n t _ info,1 | .forallE n t _ info,1 =>
   let entry := obj [("node",nat (← sourceId shared e)),("route",routeJson root slots),("path",str path),
    ("kind",str (if e.isLambda then "lam" else "forallE"))]
   let domain := t.instantiateRev xs
   checkDomain domain
   withLocalDecl n info domain fun x => descend (xs.push x) (context.push entry)
  | .letE n t v _ nondep,2 =>
   let entry := obj [("node",nat (← sourceId shared e)),("route",routeJson root slots),("path",str path),("kind",str "letE")]
   let domain := t.instantiateRev xs
   let value := v.instantiateRev xs
   checkDomain domain
   unless ← isDefEq (← kernelType value) domain do throwError "Let value has the wrong declared type"
   withLetDecl n domain value (nondep := nondep) fun x => descend (xs.push x) (context.push entry)
  | _,_ => descend xs context

def readJson (p : String) : CommandElabM Json := do
 let text ← liftIO <| IO.FS.readFile p
 match Json.parse text with | .ok j => pure j | .error e => throwError "JSON input: {e}"
def field (j : Json) (key : String) : CommandElabM Json := do
 match j.getObjVal? key with | .ok v => pure v | .error e => throwError "JSON field: {e}"
def string (j : Json) (key : String) : CommandElabM String := do
 match j.getObjValAs? String key with | .ok v => pure v | .error e => throwError "JSON string: {e}"

syntax "#atlas_occurrence_types " str " => " str : command
elab_rules : command
 | `(#atlas_occurrence_types $input:str => $output:str) => do
  let request ← readJson input.getString
  let cases ← match request.getArr? with | .ok a => pure a | .error e => throwError e
  if cases.size > 32 then throwError "At most 32 declarations per extraction"
  let mut results : Array Json := #[]
  for query in cases do
   let packet ← readJson (← string query "packetFile")
   let declaration ← field packet "declaration"
   let name ← string declaration "name"
   let info ← getConstInfo name.toName
   let (typeRoot,start) := intern info.type {}
   let mut shared := start
   let mut roots := #[typeRoot]
   let mut exprs := #[info.type]
   let mut rootPaths := #["root.type"]
   if let some value := info.value? true then
    let (r,s) := intern value shared
    shared := s; roots := roots.push r; exprs := exprs.push value; rootPaths := rootPaths.push "root.value"
   if let .recInfo recursor := info then
    for rule in recursor.rules do
     let (r,s) := intern rule.rhs shared
     shared := s; roots := roots.push r; exprs := exprs.push rule.rhs; rootPaths := rootPaths.push s!"root.rule.{rootPaths.size-1}"
   let native := graphJson shared
   for key in ["kind","children","payloads","expanded","neededScope"] do
    unless (← field native key) == (← field packet key) do throwError "Native/published DAG mismatch in {name}: {key}"
   unless toJson roots == (← field packet "roots") do throwError "Native/published roots mismatch in {name}"
   unless toJson rootPaths == (← field declaration "rootPaths") do throwError "Root-label mismatch in {name}"
   let paths ← match (← field query "routes").getArr? with | .ok a => pure a | .error e => throwError e
   if paths.size > 512 then throwError "At most 512 occurrence queries per declaration"
   let mut entries : Array Json := #[]
   for route in paths do
    let root ← match route.getObjValAs? Nat "root" with | .ok n => pure n | .error e => throwError e
    let slots ← match route.getObjValAs? (Array Nat) "slots" with | .ok a => pure a | .error e => throwError e
    if root >= roots.size || slots.size > 512 then throwError "Invalid/bounded route"
    let result ← liftTermElabM fun _ => do
     try atRoute exprs[root]! slots.toList #[] #[] shared root #[] rootPaths[root]!
     catch _ => pure (obj [("status",str "unavailable"),("route",routeJson root slots),("reason",str "Type query failed or exceeded its bound")])
    entries := entries.push result
   results := results.push (obj [("format",str "ProofAtlasOccurrenceTypes/1"),("name",str name),
    ("source",← field query "source"),("nativeDagMatchesPacket",toJson true),("leanVersion",str Lean.versionString),
    ("entries",toJson entries)])
  liftIO <| IO.FS.writeFile output.getString (toJson results).compress
  logInfo m!"Checked bounded occurrence types for {results.size} exact native/published declarations."
end AtlasOccurrenceTypes
