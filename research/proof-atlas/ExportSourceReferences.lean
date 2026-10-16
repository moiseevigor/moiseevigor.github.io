import ExportOccurrenceTypes
/- Experimental source-backed type transport. Original kernel terms are checked
   before any abstraction. Templates are ordinary Expr DAGs in Γ plus explicit
   substitution slots, not types inferred for the slots or new kernel nodes. -/
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
namespace AtlasSourceReferences
def presentation (e : Expr) : MetaM String := do
 let text ← prettyType e
 return if text.length <= 8192 then text else String.ofList (text.toList.take 8192) ++ "\n… [presentation truncated; inspect the shared expression]"

structure Anchor where
 original : Expr
 term : Expr
 route : Json
 path : String
 deriving Inhabited

partial def withAnchors (anchors : Array Anchor) (j : Nat) (holes : Array Expr)
    (action : Array Expr → MetaM Json) : MetaM Json := do
 if j == anchors.size then return ← action holes
 let a := anchors[j]!
 unless !a.term.hasLooseBVars do throwError "Anchor has an unresolved lexical variable"
 let t ← kernelType a.term
 withLocalDecl (Name.str .anonymous s!"atlasSource{j}") .default t fun x =>
  withAnchors anchors (j+1) (holes.push x) action

def projection (original term : Expr) (xs : Array Expr) (context : Array Json)
    (shared : Shared) (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 let .proj family index operand := term | throwError "Kernel projection required"
 let .proj _ _ originalOperand := original | throwError "Source projection required"
 let inputType ← kernelType operand
 let normalized ← whnf inputType
 let .const typeFamily levels := normalized.getAppFn | throwError "No structure family"
 let params := normalized.getAppArgs
 let ind ← getConstInfoInduct family
 unless typeFamily == family && ind.ctors.length == 1 && ind.numIndices == 0 && params.size == ind.numParams do
  throwError "Unsupported structure family"
 let ctor ← getConstInfoCtor ind.ctors.head!
 unless !ind.isUnsafe && !ctor.isUnsafe && index < ctor.numFields && ctor.numParams+ctor.numFields <= 256 do
  throwError "Unsupported structure field"
 let resultType ← kernelType term
 let nativeCtorType ← kernelType (mkConst ctor.name levels)
 let mut expected := nativeCtorType
 for param in params do
  let .forallE _ domain body _ := expected | throwError "Parameter telescope"
  kernelAs param domain
  expected := body.instantiate1 param
 let mut preceding : Array Expr := #[]
 for j in [:index] do
  let .forallE _ domain body _ := expected | throwError "Field telescope"
  let value := Expr.proj family j operand
  kernelAs value domain
  preceding := preceding.push value
  expected := body.instantiate1 value
 let .forallE fieldName domain _ binderInfo := expected | throwError "Selected field telescope"
 kernelAs operand normalized
 kernelAs term domain
 -- Borrow the operand and the exact arguments of its application spine. The
 -- latter also occur in unreduced/inferred dependent result types. No binder
 -- boundary is crossed while collecting these additional anchors.
 let mut anchors := #[{ original:=originalOperand,term:=operand,route:=routeJson root (slots.push 0),path:=path++".struct" : Anchor }]
 let args := originalOperand.getAppArgs
 if args.size > 128 then throwError "Source anchor application bound"
 for j in [:args.size] do
  let mut sourceArg := originalOperand
  let mut atSlots := slots.push 0
  let mut atPath := path++".struct"
  for _ in [:args.size-1-j] do
   sourceArg := sourceArg.appFn!; atSlots := atSlots.push 0; atPath := atPath++".fn"
  let arg := sourceArg.appArg!
  anchors := anchors.push {original:=arg,term:=arg.instantiateRev xs,route:=routeJson root (atSlots.push 1),path:=atPath++".arg"}
 withAnchors anchors 0 #[] fun holes => do
  let mut replacements : ExprStructMap Expr := {}
  for j in [:anchors.size] do
   if !(replacements.contains ⟨anchors[j]!.term⟩) then replacements := replacements.insert ⟨anchors[j]!.term⟩ holes[j]!
  let mut templates : Shared := {}
  let mut roots : Array Nat := #[]
  let expressions := #[operand,inputType,normalized,resultType,domain] ++ params ++ preceding
  for e in expressions do
   let symbolic := e.replace fun sub => replacements.get? ⟨sub⟩
   let template := symbolic.abstract (xs++holes)
   unless !template.hasFVar && !template.hasMVar do throwError "Template has unresolved variables"
   unless (⟨template.instantiateRev (xs++anchors.map (·.term))⟩ : ExprStructEq) == ⟨e⟩ do
    throwError "Source-reference substitution changed native syntax or binding"
   let (r,next) := intern template templates
   unless next.kind.size <= 32768 do throwError "Source-reference template table bound"
   roots := roots.push r; templates := next
  let anchorRecords ← anchors.mapM fun a => do
   unless (⟨a.term.abstract xs⟩ : ExprStructEq) == ⟨a.original⟩ do throwError "Source anchor context roundtrip"
   pure <| obj [("node",nat (← sourceId shared a.original)),("route",a.route),("path",str a.path),("contextAbstractionRoundtrip",toJson true)]
  let (signatureRoot,metadata) := intern nativeCtorType {}
  unless metadata.kind.size <= 32768 do throwError "Native signature bound"
  return obj [("format",str "ProofAtlasSourceReferences/2"),("status",str "checked"),
   ("method",str "native-exact-source-substitution/1"),("node",nat (← sourceId shared original)),
   ("route",routeJson root slots),("path",str path),("context",toJson context),
   ("family",str family.toString),("familyNameParts",toJson (nameParts family)),("levels",toJson (levels.map level)),
   ("index",nat index),("parameters",nat ctor.numParams),("fields",nat ctor.numFields),
   ("constructor",str ctor.name.toString),("constructorNameParts",toJson (nameParts ctor.name)),
   ("nativeConstructor",obj [("kind",str "ctorInfo"),("name",str ctor.name.toString),("nameParts",toJson (nameParts ctor.name)),
    ("inductive",str ctor.induct.toString),("index",nat ctor.cidx),("parameters",nat ctor.numParams),("fields",nat ctor.numFields),("unsafe",toJson ctor.isUnsafe)]),
   ("fieldName",str fieldName.toString),("binderInfo",str (bi binderInfo)),
   ("anchors",toJson anchorRecords),("templateGraph",graphJson templates),("roots",toJson roots),
   ("metadataGraph",graphJson metadata),("signatureRoot",nat signatureRoot),
   ("role",str (← role resultType)),("structureRole",str (← role inputType)),
   ("typeText",str (← presentation resultType)),("structureTypeText",str (← presentation inputType)),("expectedText",str (← presentation domain)),("textIsPresentation",toJson true),
   ("kernelProjectionTyping",str "PASS"),("kernelStructureConversion",str "PASS"),
   ("kernelFieldConversion",str "PASS"),("kernelParameters",str "PASS"),("kernelPrecedingFields",str "PASS"),
   ("templateInstantiationStructuralRoundtrip",toJson true),("templatesAreKernelJudgments",toJson false)]

syntax "#atlas_source_references " str " => " str : command
elab_rules : command
 | `(#atlas_source_references $input:str => $output:str) => do
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
   unless toJson roots == (← field packet "roots") && toJson labels == (← field declaration "rootPaths") do
    throwError "Native/source roots differ"
   let routes ← match (← field query "routes").getArr? with | .ok a => pure a | .error e => throwError e
   unless routes.size <= 512 do throwError "Query bound"
   let mut entries : Array Json := #[]
   for route in routes do
    let root ← match route.getObjValAs? Nat "root" with | .ok a => pure a | .error e => throwError e
    let slots ← match route.getObjValAs? (Array Nat) "slots" with | .ok a => pure a | .error e => throwError e
    unless root < exprs.size && slots.size <= 512 do throwError "Route bound"
    -- Fail closed: research fixtures must all succeed. No unavailable success.
    let e ← liftTermElabM fun _ => atRouteWith exprs[root]! slots.toList #[] #[] shared root #[] labels[root]! projection
    entries := entries.push e
   results := results.push <| obj [("format",str "ProofAtlasSourceReferencePackage/2"),("source",← field query "source"),
    ("nativeDagMatchesPacket",toJson true),("leanVersion",str Lean.versionString),("entries",toJson entries)]
  liftIO <| IO.FS.writeFile output.getString (toJson results).compress
end AtlasSourceReferences
