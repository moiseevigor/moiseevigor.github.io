/- Core-only Level controls. The large raw DAG is structural, not a proof benchmark. -/
open Lean Elab Command Meta AtlasLibrary
namespace AtlasUniverses
structure Shared where
 kind : Array String := #[]
 children : Array (Array Nat) := #[]
 payloads : Array Json := #[]
 expanded : Array Nat := #[]
 ids : LevelMap Nat := {}
 deriving Inhabited
partial def intern (u : Level) (s : Shared) : Nat × Shared := Id.run do
 if let some id := s.ids[u]? then return (id,s)
 let (tag,payload,inputs) := match u with
  | .zero => ("zero",obj [],#[])
  | .succ a => ("succ",obj [],#[a])
  | .max a b => ("max",obj [],#[a,b])
  | .imax a b => ("imax",obj [],#[a,b])
  | .param n => ("param",obj [("name",str n.toString),("nameParts",toJson (nameParts n))],#[])
  | .mvar n => ("mvar",obj [("id",str (reprStr n)),("idNameParts",toJson (nameParts n.name))],#[])
 let mut out := s
 let mut cs := #[]
 for child in inputs do
  let (id,next) := intern child out
  out := next; cs := cs.push id
 let id := out.kind.size
 let size := cs.foldl (fun n c => n+out.expanded[c]!) 1
 out := {out with kind:=out.kind.push tag,children:=out.children.push cs,payloads:=out.payloads.push payload,expanded:=out.expanded.push size,ids:=out.ids.insert u id}
 return (id,out)
def graph (s : Shared) (roots : Array Nat) : Json := obj [
 ("format",str "LevelDAG/1"),("kind",toJson s.kind),("children",toJson s.children),
 ("payloads",toJson s.payloads),("expanded",toJson (s.expanded.map (toString ·))),("roots",toJson roots)]
end AtlasUniverses
run_cmd do
 let u := Level.param `u
 let v := Level.param `v
 let numeric := Name.num .anonymous 1
 let textual := Name.str .anonymous "1"
 let hugeName := Name.num .anonymous (2^100+1)
 unless !(Level.max u .zero == u) && Level.isEquiv (.max u .zero) u do
  throwError "LevelMap identity must preserve raw max syntax"
 unless !(Level.max u v == Level.max v u) && Level.isEquiv (.max u v) (.max v u) do throwError "Ordered max syntax lost"
 unless nameParts numeric != nameParts textual do throwError "Name identity lost"
 let parameters := #[`u,`v,numeric,textual,hugeName]
 let mut levels : Array Level := #[.zero,.succ .zero,.max u .zero,.imax u v,u,.mvar ⟨`openUniverse⟩,
  .max u v,.imax u .zero,.imax u (.succ v),.max (.succ u) (.succ v),.imax (.max u v) (.imax v u),
  .param numeric,.param textual,.param hugeName]
 let mut labels := #["zero","successor","raw max u 0","imax u v","parameter u","unresolved metavariable",
  "max u v","imax u 0","imax u (v+1)","max (u+1) (v+1)","nested imax","numeric name 1","string name 1","large numeric name"]
 let mut shared := u
 for _ in [:80] do shared := .max shared shared
 let (sharedRoot,sharedDag) := AtlasUniverses.intern shared {}
 unless sharedDag.kind.size == 81 && sharedDag.expanded[sharedRoot]! == 2^81-1 do
  throwError "Universe sharing/count failed"
 levels := levels.push shared
 labels := labels.push "shared raw max, 80 levels (structural control)"
 let mut deep := Level.zero
 for _ in [:200] do deep := .succ deep
 levels := levels.push deep
 labels := labels.push "200 successors"
 levels := levels ++ #[.max (.param numeric) (.param textual),.max v u]
 labels := labels ++ #["two distinct structured names","reversed max v u"]
 let mut state : AtlasUniverses.Shared := {}
 let mut roots := #[]
 for l in levels do
  let (r,next) := AtlasUniverses.intern l state
  state := next; roots := roots.push r
 let mut valuations : Array Json := #[]
 for i in (List.range 14 ++ [16,17]) do
  let l := levels[i]!
  if l.hasMVar then continue
  for a in [:5] do
   for b in [:5] do
    let values := #[a,b,a+1,b+2,3]
    let assigned := l.instantiateParams parameters.toList (values.map Level.ofNat).toList
    let some result := assigned.normalize.toNat | throwError "Concrete Level normalization is not natural"
    valuations := valuations.push (obj [("root",toJson i),("values",toJson (values.map (toString ·))),("result",str (toString result))])
 let mut sortChecks := #[]
 for i in (List.range 14 ++ [16,17]) do
  let checked := match Kernel.check (← getEnv) {} (.sort levels[i]!) with | .ok _ => true | .error _ => false
  sortChecks := sortChecks.push (obj [("root",toJson i),("accepted",toJson checked)])
 let badDecl : Declaration := .axiomDecl {name:=`AtlasUniverseUnresolved,levelParams:=[],type:=.sort levels[5]!,isUnsafe:=false}
 let declarationRejected := match Kernel.Environment.addDecl (← getEnv).toKernelEnv {} badDecl with | .error _ => true | .ok _ => false
 unless declarationRejected do throwError "Unresolved universe admitted to a declaration"
 let wrongName : Declaration := .axiomDecl {name:=`AtlasUniverseWrongName,levelParams:=[numeric],type:=.sort (.param textual),isUnsafe:=false}
 let wrongNameRejected := match Kernel.Environment.addDecl (← getEnv).toKernelEnv {} wrongName with | .error _ => true | .ok _ => false
 unless wrongNameRejected do throwError "Different universe Name accepted as the declared parameter"
 let exactNames : Declaration := .axiomDecl {name:=`AtlasUniverseExactNames,levelParams:=[numeric,textual],type:=.sort (.max (.param numeric) (.param textual)),isUnsafe:=false}
 let exactNamesAccepted := match Kernel.Environment.addDecl (← getEnv).toKernelEnv {} exactNames with | .ok _ => true | .error _ => false
 unless exactNamesAccepted do throwError "Exact structured universe names rejected"
 liftIO <| IO.FS.writeFile "UNIVERSE_OUTPUT" (obj [
  ("format",str "ProofAtlasUniverseControls/1"),("leanVersion",str Lean.versionString),
  ("graph",AtlasUniverses.graph state roots),("labels",toJson labels),
  ("parameters",toJson (parameters.map (fun n => obj [("name",str n.toString),("nameParts",toJson (nameParts n))]))),
  ("valuations",toJson valuations),("sortChecks",toJson sortChecks),("unresolvedDeclarationRejected",toJson declarationRejected),("wrongNameRejected",toJson wrongNameRejected),("exactNamesAccepted",toJson exactNamesAccepted),("numericStringDisplayCollision",toJson (numeric.toString == textual.toString)),
  ("sharedControl",obj [("root",toJson (14:Nat)),("uniqueNodes",toJson sharedDag.kind.size),("occurrences",str (toString sharedDag.expanded[sharedRoot]!)),("kernelChecked",toJson false)]),
  ("scope",str "Native Level syntax and small concrete valuations. Shared raw 80-level input is a structural control, not a kernel-checked proof.")]).compress
