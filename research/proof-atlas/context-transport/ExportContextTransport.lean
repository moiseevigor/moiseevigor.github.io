import ExportSourceReferences
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
namespace AtlasContextTransport
structure Anchor extends AtlasSourceReferences.Anchor where
 sourceContext : Array Json
 origin : String
 deriving Inhabited
structure Collected where
 anchors : Array Anchor := #[]
 keys : Std.HashSet String := {}
 truncated : Bool := false
 deriving Inhabited

def addAnchor (c : Collected) (a : Anchor) : Collected := Id.run do
 let key := a.route.compress
 if c.keys.contains key then return c
 if c.anchors.size == 256 then return {c with truncated:=true}
 return {c with anchors:=c.anchors.push a,keys:=c.keys.insert key}

def group (c : Collected) (a : Anchor) (root : Nat) (slots : Array Nat) : MetaM Collected := do
 if slots.size > 512 then return {c with truncated:=true}
 let mut c := addAnchor c a
 let mut original := a.original
 let mut contextual := a.term
 let mut atSlots := slots
 let mut atPath := a.path
 let mut arguments : Array Anchor := #[]
 for _ in [:min 128 (512-slots.size)] do
  match original,contextual with
  | .app f arg,.app g value =>
   arguments := arguments.push {original:=arg,term:=value,route:=routeJson root (atSlots.push 1),path:=atPath++".arg",sourceContext:=a.sourceContext,origin:=a.origin++"-argument"}
   original := f; contextual := g; atSlots := atSlots.push 0; atPath := atPath++".fn"
  | .app ..,_ | _,.app .. => throwError "Source application shape changed"
  | _,_ => break
 for arg in arguments.reverse do c := addAnchor c arg
 return if original.isApp then {c with truncated:=true} else c

def header (original term : Expr) (context : Array Json) (root : Nat) (slots : Array Nat) (path : String) : Anchor :=
 {original,term,sourceContext:=context,route:=routeJson root slots,path,origin:="context-header"}

def observe (original term : Expr) (xs : Array Expr) (context : Array Json) (headers : Array Anchor)
    (shared : Shared) (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 let type ← kernelType term
 let typeType ← kernelType type
 let mut collected ← group {} {original,term,route:=routeJson root slots,path,sourceContext:=context,origin:="selected"} root slots
 let children := match original with
  | .app f a => #[("fn",0,f),("arg",1,a)]
  | .lam _ t _ _ | .forallE _ t _ _ => #[("domain",0,t)]
  | .letE _ t v _ _ => #[("type",0,t),("value",1,v)]
  | .mdata _ e => #[("expr",0,e)]
  | .proj _ _ e => #[("struct",0,e)]
  | _ => #[]
 for (field,slot,e) in children do
  collected ← group collected {original:=e,term:=e.instantiateRev xs,route:=routeJson root (slots.push slot),path:=path++"."++field,sourceContext:=context,origin:="selected-child"} root (slots.push slot)
 for a in headers.reverse do
  let slots ← match a.route.getObjValAs? (Array Nat) "slots" with | .ok s => pure s | .error _ => throwError "Header route"
  collected ← group collected a root slots
 let anchors := collected.anchors
 AtlasSourceReferences.withAnchors (anchors.map (·.toAnchor)) 0 #[] fun holes => do
  let mut replacements : ExprStructMap Expr := {}
  let mut records : Array Json := #[]
  for j in [:anchors.size] do
   let a := anchors[j]!
   unless a.sourceContext.size <= context.size && a.sourceContext == context.extract 0 a.sourceContext.size do throwError "Context is not a prefix"
   let lift := context.size-a.sourceContext.size
   unless (⟨a.term.abstract xs⟩ : ExprStructEq) == ⟨a.original.liftLooseBVars 0 lift⟩ do throwError "Context embedding changed source binding"
   unless shared.neededScope[← sourceId shared a.original]! <= a.sourceContext.size do throwError "Source scope escaped"
   if !replacements.contains ⟨a.term⟩ then replacements := replacements.insert ⟨a.term⟩ holes[j]!
   records := records.push (obj [("node",nat (← sourceId shared a.original)),("route",a.route),("path",str a.path),("sourceContext",toJson a.sourceContext),("lift",nat lift),("origin",str a.origin),("contextEmbeddingRoundtrip",toJson true)])
  let mut templates : Shared := {}
  let mut roots : Array Nat := #[]
  for e in #[term,type,typeType] do
   let template := (e.replace fun sub => replacements.get? ⟨sub⟩).abstract (xs++holes)
   unless !template.hasFVar && !template.hasMVar do throwError "Unresolved template"
   unless (⟨template.instantiateRev (xs++anchors.map (·.term))⟩ : ExprStructEq) == ⟨e⟩ do throwError "Native template roundtrip changed expression"
   let (r,next) := intern template templates
   unless next.kind.size <= 32768 do throwError "Context template table bound"
   templates := next; roots := roots.push r
  return obj [("format",str "ProofAtlasContextTransport/1"),("namespace",str "context-transport"),("status",str "checked"),
   ("node",nat (← sourceId shared original)),("route",routeJson root slots),("path",str path),("context",toJson context),
   ("anchors",toJson records),("anchorCollectorTruncated",toJson collected.truncated),("templateGraph",graphJson templates),("roots",toJson roots),
   ("kernelOriginalTermTyping",str "PASS"),("kernelOriginalTypeTyping",str "PASS"),("templateInstantiationStructuralRoundtrip",toJson true),
   ("templatesAreKernelJudgments",toJson false),("role",str (← role type)),("typeText",str (← AtlasSourceReferences.presentation type))]

partial def atContext (e : Expr) (rest : List Nat) (xs : Array Expr) (context : Array Json) (headers : Array Anchor)
    (shared : Shared) (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 match rest with
 | [] => observe e (e.instantiateRev xs) xs context headers shared root slots path
 | slot :: tail =>
  let (field,child) ← match e,slot with
   | .app f _,0 => pure ("fn",f) | .app _ a,1 => pure ("arg",a)
   | .lam _ t _ _,0 | .forallE _ t _ _,0 => pure ("domain",t)
   | .lam _ _ b _,1 | .forallE _ _ b _,1 => pure ("body",b)
   | .letE _ t _ _ _,0 => pure ("type",t) | .letE _ _ v _ _,1 => pure ("value",v) | .letE _ _ _ b _,2 => pure ("body",b)
   | .mdata _ x,0 => pure ("expr",x) | .proj _ _ x,0 => pure ("struct",x)
   | _,_ => throwError "Invalid occurrence route"
  let descend (ys : Array Expr) (ctx : Array Json) (hs : Array Anchor) := atContext child tail ys ctx hs shared root (slots.push slot) (path++"."++field)
  match e,slot with
  | .lam n t _ info,1 | .forallE n t _ info,1 =>
   let entry := obj [("node",nat (← sourceId shared e)),("route",routeJson root slots),("path",str path),("kind",str (if e.isLambda then "lam" else "forallE"))]
   let domain := t.instantiateRev xs
   checkDomain domain
   let a := header t domain context root (slots.push 0) (path++".domain")
   withLocalDecl n info domain fun x => descend (xs.push x) (context.push entry) (headers.push a)
  | .letE n t v _ nondep,2 =>
   let entry := obj [("node",nat (← sourceId shared e)),("route",routeJson root slots),("path",str path),("kind",str "letE")]
   let domain := t.instantiateRev xs
   let value := v.instantiateRev xs
   checkDomain domain; kernelAs value domain
   let hs := (headers.push (header t domain context root (slots.push 0) (path++".type"))).push (header v value context root (slots.push 1) (path++".value"))
   withLetDecl n domain value (nondep:=nondep) fun x => descend (xs.push x) (context.push entry) hs
  | _,_ => descend xs context headers

syntax "#atlas_context_transport " str " => " str : command
elab_rules : command
 | `(#atlas_context_transport $input:str => $output:str) => do
  let request ← readJson input.getString
  let cases ← match request.getArr? with | .ok a => pure a | .error e => throwError e
  unless cases.size <= 32 do throwError "Declaration bound"
  let mut results : Array Json := #[]
  for query in cases do
   let packet ← readJson (← string query "packetFile")
   let declaration ← field packet "declaration"
   let name ← string declaration "name"
   let info ← getConstInfo name.toName
   let (t,s) := intern info.type {}
   let mut shared := s
   let mut roots := #[t]
   let mut exprs := #[info.type]
   let mut labels := #["root.type"]
   if let some value := info.value? true then
    let (v,s) := intern value shared
    shared := s; roots := roots.push v; exprs := exprs.push value; labels := labels.push "root.value"
   let native := graphJson shared
   for key in ["kind","children","payloads","expanded","neededScope"] do
    unless (← field native key) == (← field packet key) do throwError "Native/source DAG differs: {key}"
   unless toJson roots == (← field packet "roots") && toJson labels == (← field declaration "rootPaths") do throwError "Native/source roots differ"
   let routes ← match (← field query "routes").getArr? with | .ok a => pure a | .error e => throwError e
   unless routes.size <= 512 do throwError "Query bound"
   let mut entries : Array Json := #[]
   for route in routes do
    let root ← match route.getObjValAs? Nat "root" with | .ok a => pure a | .error e => throwError e
    let slots ← match route.getObjValAs? (Array Nat) "slots" with | .ok a => pure a | .error e => throwError e
    unless root < exprs.size && slots.size <= 512 do throwError "Route bound"
    let e ← liftTermElabM fun _ => atContext exprs[root]! slots.toList #[] #[] #[] shared root #[] labels[root]!
    entries := entries.push e
   results := results.push (obj [("format",str "ProofAtlasContextTransportPackage/1"),("source",← field query "source"),("nativeDagMatchesPacket",toJson true),("leanVersion",str Lean.versionString),("entries",toJson entries)])
  liftIO <| IO.FS.writeFile output.getString (toJson results).compress
end AtlasContextTransport
