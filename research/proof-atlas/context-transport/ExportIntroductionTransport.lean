import ExportContextTransport
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
namespace AtlasIntroductionTransport

structure ContextPacking where
 contexts : Array Json := #[Json.null]
 keys : Std.HashMap String Nat := {}
 deriving Inhabited

def internContext (j : Json) : StateT ContextPacking MetaM Nat := do
 let items ← match j.getArr? with | .ok a => pure a | .error _ => throwError "Context array required"
 unless items.size <= 512 do throwError "Context packing depth bound"
 let mut parent := 0
 for binder in items do
  let key := s!"{parent}:" ++ binder.compress
  let state ← get
  if let some id := state.keys[key]? then parent := id
  else
   unless state.contexts.size < 16384 do throwError "Context prefix inventory bound"
   let id := state.contexts.size
   set {state with contexts:=state.contexts.push (obj [("parent",nat parent),("binder",binder)]),keys:=state.keys.insert key id}
   parent := id
 return parent

partial def packContexts (j : Json) : StateT ContextPacking MetaM Json := do
 match j with
 | .arr items => return toJson (← items.mapM packContexts)
 | .obj fields =>
  let mut out := #[]
  for (key,value) in fields.toArray do
   if key == "context" || key == "sourceContext" then
    out := out.push (key++"Ref",nat (← internContext value))
   else out := out.push (key,← packContexts value)
  return Json.mkObj out.toList
 | _ => return j

partial def introduce (original : Expr) (xs : Array Expr) (context : Array Json)
    (headers : Array AtlasContextTransport.Anchor) (shared : Shared)
    (root : Nat) (slots : Array Nat) (path : String) (steps : Array Json) : MetaM Json := do
 let term := original.instantiateRev xs
 let type ← kernelType term
 let .lam n t body info := original | return obj [
  ("steps",toJson steps),("terminal",← AtlasContextTransport.observe original term xs context headers shared root slots path)]
 unless steps.size < 64 do throwError "Introduction prefix bound"
 let .forallE pn pt pb pi := type | throwError "Native lambda type is not Pi"
 let domain := t.instantiateRev xs
 unless n == pn && info == pi && (⟨domain⟩ : ExprStructEq) == ⟨pt⟩ do
  throwError "Lambda/Pi domain or annotation differs structurally"
 checkDomain domain
 let entry := obj [("node",nat (← sourceId shared original)),("route",routeJson root slots),
  ("path",str path),("kind",str "lam")]
 let domainRecord := obj [("node",nat (← sourceId shared t)),
  ("route",routeJson root (slots.push 0)),("path",str (path++".domain"))]
 let bodyRecord := obj [("node",nat (← sourceId shared body)),
  ("route",routeJson root (slots.push 1)),("path",str (path++".body"))]
 let header := AtlasContextTransport.header t domain context root (slots.push 0) (path++".domain")
 withLocalDecl n info domain fun x => do
  let bodyTerm := body.instantiateRev (xs.push x)
  let bodyType ← kernelType bodyTerm
  unless (⟨bodyType⟩ : ExprStructEq) == ⟨pb.instantiate1 x⟩ do
   throwError "Native lambda/Pi body type differs structurally"
  kernelAs bodyTerm (pb.instantiate1 x)
  let step := obj [("source",entry),("context",toJson context),("domain",domainRecord),
   ("body",bodyRecord),("binderName",str n.toString),("binderInfo",str (bi info)),
   ("kernelDomainSort",str "PASS"),("kernelBodyTyping",str "PASS"),
   ("kernelBodyConversion",str "PASS"),("piDomainStructuralMatch",toJson true),
   ("piBodyStructuralMatch",toJson true),("domainBeforeBinder",toJson true),
   ("bodyContextExtended",toJson true)]
  introduce body (xs.push x) (context.push entry) (headers.push header)
   shared root (slots.push 1) (path++".body") (steps.push step)

def observe (original : Expr) (xs : Array Expr) (context : Array Json)
    (headers : Array AtlasContextTransport.Anchor) (shared : Shared)
    (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 let term := original.instantiateRev xs
 let type ← kernelType term
 let typeType ← kernelType type
 let body ← introduce original xs context headers shared root slots path #[]
 let (sortRoot,sortGraph) := intern (typeType.abstract xs) {}
 unless sortGraph.kind.size <= 8192 do throwError "Introduction sort table bound"
 return obj [("format",str "ProofAtlasIntroductionTransport/1"),
  ("namespace",str "introduction-transport"),("status",str "checked"),
  ("node",nat (← sourceId shared original)),("route",routeJson root slots),
  ("path",str path),("context",toJson context),("derivation",body),
  ("sortGraph",graphJson sortGraph),("sortRoot",nat sortRoot),
  ("kernelOriginalTermTyping",str "PASS"),("kernelOriginalTypeTyping",str "PASS"),
  ("reconstruction",str "structural-pi-composition/1"),
  ("role",str (← role type)),("typeText",str (← AtlasSourceReferences.presentation type))]

partial def atContext (e : Expr) (rest : List Nat) (xs : Array Expr) (context : Array Json)
    (headers : Array AtlasContextTransport.Anchor) (shared : Shared)
    (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 match rest with
 | [] => observe e xs context headers shared root slots path
 | slot :: tail =>
  let (field,child) ← match e,slot with
   | .app f _,0 => pure ("fn",f) | .app _ a,1 => pure ("arg",a)
   | .lam _ t _ _,0 | .forallE _ t _ _,0 => pure ("domain",t)
   | .lam _ _ b _,1 | .forallE _ _ b _,1 => pure ("body",b)
   | .letE _ t _ _ _,0 => pure ("type",t) | .letE _ _ v _ _,1 => pure ("value",v)
   | .letE _ _ _ b _,2 => pure ("body",b)
   | .mdata _ x,0 => pure ("expr",x) | .proj _ _ x,0 => pure ("struct",x)
   | _,_ => throwError "Invalid occurrence route"
  let descend (ys : Array Expr) (ctx : Array Json) (hs : Array AtlasContextTransport.Anchor) :=
   atContext child tail ys ctx hs shared root (slots.push slot) (path++"."++field)
  match e,slot with
  | .lam n t _ info,1 | .forallE n t _ info,1 =>
   let entry := obj [("node",nat (← sourceId shared e)),("route",routeJson root slots),
    ("path",str path),("kind",str (if e.isLambda then "lam" else "forallE"))]
   let domain := t.instantiateRev xs
   checkDomain domain
   let header := AtlasContextTransport.header t domain context root (slots.push 0) (path++".domain")
   withLocalDecl n info domain fun x => descend (xs.push x) (context.push entry) (headers.push header)
  | .letE n t v _ nondep,2 =>
   let entry := obj [("node",nat (← sourceId shared e)),("route",routeJson root slots),
    ("path",str path),("kind",str "letE")]
   let domain := t.instantiateRev xs
   let value := v.instantiateRev xs
   checkDomain domain; kernelAs value domain
   let hs := (headers.push (AtlasContextTransport.header t domain context root (slots.push 0) (path++".type"))).push
    (AtlasContextTransport.header v value context root (slots.push 1) (path++".value"))
   withLetDecl n domain value (nondep:=nondep) fun x => descend (xs.push x) (context.push entry) hs
  | _,_ => descend xs context headers

syntax "#atlas_introduction_transport " str " => " str : command
elab_rules : command
 | `(#atlas_introduction_transport $input:str => $output:str) => do
  let request ← readJson input.getString
  let cases ← match request.getArr? with | .ok a => pure a | .error e => throwError e
  unless cases.size <= 32 do throwError "Declaration bound"
  let mut results : Array Json := #[]
  for query in cases do
   let packet ← readJson (← string query "packetFile")
   let declaration ← field packet "declaration"
   let name ← string declaration "name"
   let info ← getConstInfo name.toName
   let some checkedValue := info.value? true | throwError "Introduction source declaration has no body"
   liftTermElabM fun _ => kernelAs checkedValue info.type
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
   unless toJson roots == (← field packet "roots") && toJson labels == (← field declaration "rootPaths") do
    throwError "Native/source roots differ"
   let routes ← match (← field query "routes").getArr? with | .ok a => pure a | .error e => throwError e
   unless routes.size <= 512 do throwError "Query bound"
   let mut entries : Array Json := #[]
   for route in routes do
    let root ← match route.getObjValAs? Nat "root" with | .ok a => pure a | .error e => throwError e
    let slots ← match route.getObjValAs? (Array Nat) "slots" with | .ok a => pure a | .error e => throwError e
    unless root < exprs.size && slots.size <= 512 do throwError "Route bound"
    let e ← liftTermElabM fun _ => atContext exprs[root]! slots.toList #[] #[] #[] shared root #[] labels[root]!
    entries := entries.push e
   let (packed,packing) ← liftTermElabM fun _ => (packContexts (toJson entries)).run {}
   results := results.push (obj [("format",str "ProofAtlasIntroductionTransportPackage/2"),
    ("source",← field query "source"),("nativeDagMatchesPacket",toJson true),
    ("kernelDeclarationTyping",str "PASS"),
    ("leanVersion",str Lean.versionString),("packing",str "lexical-context-prefix-interning/1"),
    ("contexts",toJson packing.contexts),("entries",packed)])
  liftIO <| IO.FS.writeFile output.getString (toJson results).compress
end AtlasIntroductionTransport
