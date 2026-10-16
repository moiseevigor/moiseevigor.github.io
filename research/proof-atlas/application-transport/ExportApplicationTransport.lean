import ExportContextTransport
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
namespace AtlasApplicationTransport

def observe (original term : Expr) (xs : Array Expr) (context : Array Json)
    (headers : Array AtlasContextTransport.Anchor) (shared : Shared)
    (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 unless original.isApp do throwError "Application source required"
 let args := term.getAppArgs
 unless args.size > 0 && args.size <= 128 do throwError "Application spine bound"
 let type ← kernelType term
 let typeType ← kernelType type
 let mut function := term.getAppFn
 let mut before ← kernelType function
 let mut components := #[term,type,typeType,before]
 let mut head := original
 let mut headSlots := slots
 let mut headPath := path
 for _ in [:args.size] do
  head := head.appFn!; headSlots := headSlots.push 0; headPath := headPath++".fn"
 let headRecord := obj [("node",nat (← sourceId shared head)),("route",routeJson root headSlots),
  ("path",str headPath),("component",nat 3),("role",str (← role before))]
 let mut stages : Array Json := #[]
 for j in [:args.size] do
  let pi ← whnf before
  let .forallE name domain body info := pi | throwError "Application has no normalized Pi"
  kernelAs function pi
  let arg := args[j]!
  let actual ← kernelType arg
  kernelAs arg domain
  let next := mkApp function arg
  let after ← kernelType next
  let substituted := body.instantiate1 arg
  kernelAs next substituted
  let offset := components.size
  components := components ++ #[before,pi,actual,domain,after,substituted]
  let mut source := original
  let mut atSlots := slots
  let mut atPath := path
  for _ in [:args.size-1-j] do
   source := source.appFn!; atSlots := atSlots.push 0; atPath := atPath++".fn"
  stages := stages.push (obj [("slot",nat (j+1)),
   ("source",obj [("node",nat (← sourceId shared source)),("route",routeJson root atSlots),("path",str atPath)]),
   ("argument",obj [("node",nat (← sourceId shared source.appArg!)),("route",routeJson root (atSlots.push 1)),("path",str (atPath++".arg"))]),
   ("components",obj [("before",nat offset),("pi",nat (offset+1)),("actual",nat (offset+2)),
    ("domain",nat (offset+3)),("after",nat (offset+4)),("substituted",nat (offset+5))]),
   ("binderName",str name.toString),("binderInfo",str (bi info)),("bodyUsesBinder",toJson (body.hasLooseBVar 0)),
   ("functionRole",str (← role before)),("argumentRole",str (← role actual)),("resultRole",str (← role after)),
   ("kernelFunctionConversion",str "PASS"),("kernelDomainConversion",str "PASS"),("kernelResultConversion",str "PASS"),
   ("beforeText",str (← AtlasSourceReferences.presentation before)),("argumentText",str (← AtlasSourceReferences.presentation actual)),
   ("domainText",str (← AtlasSourceReferences.presentation domain)),("afterText",str (← AtlasSourceReferences.presentation after))])
  function := next; before := after
 unless (⟨before⟩ : ExprStructEq) == ⟨type⟩ do throwError "Final application type changed structurally"
 let mut collected ← AtlasContextTransport.group {} {original,term,route:=routeJson root slots,path,sourceContext:=context,origin:="selected"} root slots
 for (field,slot,e) in #[("fn",0,original.appFn!),("arg",1,original.appArg!)] do
  collected ← AtlasContextTransport.group collected {original:=e,term:=e.instantiateRev xs,route:=routeJson root (slots.push slot),path:=path++"."++field,sourceContext:=context,origin:="selected-child"} root (slots.push slot)
 for a in headers.reverse do
  let headerSlots ← match a.route.getObjValAs? (Array Nat) "slots" with | .ok s => pure s | .error _ => throwError "Header route"
  collected ← AtlasContextTransport.group collected a root headerSlots
 let anchors := collected.anchors
 AtlasSourceReferences.withAnchors (anchors.map (·.toAnchor)) 0 #[] fun holes => do
  let mut replacements : ExprStructMap Expr := {}
  let mut anchorRecords : Array Json := #[]
  for j in [:anchors.size] do
   let a := anchors[j]!
   unless a.sourceContext.size <= context.size && a.sourceContext == context.extract 0 a.sourceContext.size do
    throwError "Application anchor context is not a prefix"
   let lift := context.size-a.sourceContext.size
   unless (⟨a.term.abstract xs⟩ : ExprStructEq) == ⟨a.original.liftLooseBVars 0 lift⟩ do
    throwError "Application anchor context changed binding"
   unless shared.neededScope[← sourceId shared a.original]! <= a.sourceContext.size do throwError "Application anchor escaped scope"
   if !replacements.contains ⟨a.term⟩ then replacements := replacements.insert ⟨a.term⟩ holes[j]!
   anchorRecords := anchorRecords.push (obj [("node",nat (← sourceId shared a.original)),("route",a.route),("path",str a.path),
    ("sourceContext",toJson a.sourceContext),("lift",nat lift),("origin",str a.origin),("contextEmbeddingRoundtrip",toJson true)])
  let mut templates : Shared := {}
  let mut roots : Array Nat := #[]
  for e in components do
   let template := (e.replace fun sub => replacements.get? ⟨sub⟩).abstract (xs++holes)
   unless !template.hasFVar && !template.hasMVar do throwError "Unresolved application template"
   unless (⟨template.instantiateRev (xs++anchors.map (·.term))⟩ : ExprStructEq) == ⟨e⟩ do
    throwError "Application template roundtrip changed syntax"
   let (r,next) := intern template templates
   unless next.kind.size <= 32768 do throwError "Application template table bound"
   templates := next; roots := roots.push r
  return obj [("format",str "ProofAtlasApplicationTransport/1"),("namespace",str "application-transport"),("status",str "checked"),
   ("node",nat (← sourceId shared original)),("route",routeJson root slots),("path",str path),("context",toJson context),
   ("head",headRecord),("stages",toJson stages),("anchors",toJson anchorRecords),("anchorCollectorTruncated",toJson collected.truncated),
   ("templateGraph",graphJson templates),("roots",toJson roots),("kernelOriginalTermTyping",str "PASS"),("kernelOriginalTypeTyping",str "PASS"),
   ("templateInstantiationStructuralRoundtrip",toJson true),("templatesAreKernelJudgments",toJson false),
   ("finalTypeStructuralMatch",toJson true),("conversions",str "native-kernel-typed-identity/1"),
   ("role",str (← role type)),("typeText",str (← AtlasSourceReferences.presentation type))]

partial def atContext (e : Expr) (rest : List Nat) (xs : Array Expr) (context : Array Json) (headers : Array AtlasContextTransport.Anchor)
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
  let descend (ys : Array Expr) (ctx : Array Json) (hs : Array AtlasContextTransport.Anchor) := atContext child tail ys ctx hs shared root (slots.push slot) (path++"."++field)
  match e,slot with
  | .lam n t _ info,1 | .forallE n t _ info,1 =>
   let entry := obj [("node",nat (← sourceId shared e)),("route",routeJson root slots),("path",str path),("kind",str (if e.isLambda then "lam" else "forallE"))]
   let domain := t.instantiateRev xs
   checkDomain domain
   let a := AtlasContextTransport.header t domain context root (slots.push 0) (path++".domain")
   withLocalDecl n info domain fun x => descend (xs.push x) (context.push entry) (headers.push a)
  | .letE n t v _ nondep,2 =>
   let entry := obj [("node",nat (← sourceId shared e)),("route",routeJson root slots),("path",str path),("kind",str "letE")]
   let domain := t.instantiateRev xs
   let value := v.instantiateRev xs
   checkDomain domain; kernelAs value domain
   let hs := (headers.push (AtlasContextTransport.header t domain context root (slots.push 0) (path++".type"))).push (AtlasContextTransport.header v value context root (slots.push 1) (path++".value"))
   withLetDecl n domain value (nondep:=nondep) fun x => descend (xs.push x) (context.push entry) hs
  | _,_ => descend xs context headers

syntax "#atlas_application_transport " str " => " str : command
elab_rules : command
 | `(#atlas_application_transport $input:str => $output:str) => do
  let request ← readJson input.getString
  let cases ← match request.getArr? with | .ok a => pure a | .error e => throwError e
  unless cases.size <= 32 do throwError "Declaration bound"
  let mut results : Array Json := #[]
  for query in cases do
   let packet ← readJson (← string query "packetFile")
   let declaration ← field packet "declaration"
   let name ← string declaration "name"
   let info ← getConstInfo name.toName
   let some checkedValue := info.value? true | throwError "Application source declaration has no body"
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
   unless toJson roots == (← field packet "roots") && toJson labels == (← field declaration "rootPaths") do throwError "Native/source roots differ"
   let routes ← match (← field query "routes").getArr? with | .ok a => pure a | .error e => throwError e
   unless routes.size <= 512 do throwError "Query bound"
   let mut entries : Array Json := #[]
   for route in routes do
    let root ← match route.getObjValAs? Nat "root" with | .ok a => pure a | .error e => throwError e
    let slots ← match route.getObjValAs? (Array Nat) "slots" with | .ok a => pure a | .error e => throwError e
    unless root < exprs.size && slots.size <= 512 do throwError "Route bound"
    let e ← try
     liftTermElabM fun _ => atContext exprs[root]! slots.toList #[] #[] #[] shared root #[] labels[root]!
    catch ex =>
     logWarning ex.toMessageData
     pure <| obj [("status",str "unavailable"),("route",routeJson root slots),("reason",str "Native application transport failed; inspect private extraction log")]
    entries := entries.push e
   results := results.push (obj [("format",str "ProofAtlasApplicationTransportPackage/1"),("source",← field query "source"),("nativeDagMatchesPacket",toJson true),("kernelDeclarationTyping",str "PASS"),("leanVersion",str Lean.versionString),("entries",toJson entries)])
  liftIO <| IO.FS.writeFile output.getString (toJson results).compress
end AtlasApplicationTransport
