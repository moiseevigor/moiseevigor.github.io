"""Replay beta normalization and explicit binder-name comparison with Lean core."""
import argparse,gzip,hashlib,json,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent;ROOT=BASE.parents[2]
sys.path.insert(0,str(BASE.parent))
from build_recursion_examples import run_checked
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args()
 folder=a.workdir.resolve();folder.mkdir(exist_ok=False);lean=a.lean.resolve();compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 raw=gzip.decompress((BASE/'primitive-input.json.gz').read_bytes());cases=json.loads(raw);assert len(cases)==219;(folder/'input.json').write_bytes(raw)
 files=['research/proof-atlas/ExportLibrary.lean','research/proof-atlas/LevelTransportControls.lean','research/proof-atlas/compiled-replay/Replay.lean','research/proof-atlas/method-context/verify-primitive.py','research/proof-atlas/build_recursion_examples.py']
 library=(ROOT/files[0]).read_text().replace('import SE2Conjugate','').split('syntax "#atlas_library ')[0]+'\nend AtlasLibrary\n'
 levels=(ROOT/files[1]).read_text().split('def compactGraph')[0]+'\nend AtlasLevelTransport\n'
 replay=(ROOT/files[2]).read_text().split('def checked')[0]+'\nend AtlasPacketReplay\n'
 runtime=library+'\nnamespace AtlasOccurrenceTypes\nend AtlasOccurrenceTypes\n'+levels+replay+'''
set_option maxHeartbeats 10000000
set_option maxRecDepth 8192
namespace ContextPrimitive
open Lean
abbrev Memo := ExprStructMap Expr
partial def normal (e : Expr) : StateM Memo Expr := do
 if let some r := (← get).get? ⟨e⟩ then return r
 let r ← match e with
  | .app f a => do
   let f ← normal f
   let a ← normal a
   match f with
   | .lam _ _ body _ => normal (body.instantiate1 a)
   | _ => pure (.app f a)
  | .lam n t b i => return .lam n (← normal t) (← normal b) i
  | .forallE n t b i => return .forallE n (← normal t) (← normal b) i
  | .letE n t v b d => return .letE n (← normal t) (← normal v) (← normal b) d
  | .mdata m b => return .mdata m (← normal b)
  | .proj n i b => return .proj n i (← normal b)
  | _ => pure e
 modify (·.insert ⟨e⟩ r)
 return r
partial def names (e : Expr) : StateM Memo Expr := do
 if let some r := (← get).get? ⟨e⟩ then return r
 let r ← match e with
  | .app f a => return .app (← names f) (← names a)
  | .lam _ t b i => return .lam .anonymous (← names t) (← names b) i
  | .forallE _ t b i => return .forallE .anonymous (← names t) (← names b) i
  | .letE _ t v b d => return .letE .anonymous (← names t) (← names v) (← names b) d
  | .mdata m b => return .mdata m (← names b)
  | .proj n i b => return .proj n i (← names b)
  | _ => pure e
 modify (·.insert ⟨e⟩ r)
 return r
end ContextPrimitive
run_cmd do
 let env ← getEnv
 unless !(env.header.moduleNames.any (fun n => n.toString.startsWith "SE2Conjugate" || n.toString.startsWith "Mathlib" || n.toString == "Aesop")) do throwError "Non-core module imported"
 let .ok cases := Json.parse (← IO.FS.readFile INPUT) >>= Json.getArr? | throwError "Input"
 let decode (graph : Json) : CommandElabM (Array Expr) := do
  let .ok values := AtlasPacketReplay.decode graph | throwError "Graph decode"
  let .ok roots := graph.getObjValAs? (Array Nat) "roots" | throwError "Roots"
  return roots.map (values[·]!)
 let exact (e : Expr) (graph : Json) : CommandElabM Unit := do
  let native := AtlasPacketReplay.graph #[e]
  for key in ["kind","children","payloads","expanded","neededScope","roots"] do
   let .ok a := native.getObjVal? key | throwError "Native field"
   let .ok b := graph.getObjVal? key | throwError "Expected field"
   unless a == b do throwError "Exact output field {key}"
 let mut rows : Array Json := #[]
 let mut steps := 0
 for q in cases do
  let get (key : String) : CommandElabM Json := match q.getObjVal? key with | .ok v => pure v | .error e => throwError e
  let e ← decode (← get "rawExpected")
  let a ← decode (← get "rawActual")
  let .ok focus := (← get "focus").getObjValAs? String "kind" | throwError "Focus"
  let .ok count := q.getObjValAs? Nat "count" | throwError "Count"
  let port ← if focus == "body" then pure count else do
   let .ok ordinal := (← get "focus").getObjValAs? Nat "ordinal" | throwError "Ordinal"
   pure ordinal
  let mut left := (ContextPrimitive.normal e[0]!).run' {}
  for _ in [:port] do
   let .forallE _ _ body _ := left | throwError "Expected telescope"
   left := body
  if focus == "input" then
   let .forallE _ domain _ _ := left | throwError "Expected input"
   left := domain
  let right := (ContextPrimitive.normal a[0]!).run' {}
  exact left (← get "expectedOutput")
  exact right (← get "actualOutput")
  let identical := (⟨left⟩ : ExprStructEq) == ⟨right⟩
  let renamed := (⟨(ContextPrimitive.names left).run' {}⟩ : ExprStructEq) == ⟨(ContextPrimitive.names right).run' {}⟩
  let relation := if identical then "beta-normal-forms-identical" else if renamed then "beta-and-explicit-binder-renaming" else "beta-normal-forms-differ"
  let .ok wanted := q.getObjValAs? String "relation" | throwError "Relation"
  unless relation == wanted do throwError "Classification mismatch: {← get "name"}"
  let .ok betaSteps := (← get "betaSteps").getArr? | throwError "Steps"
  for step in betaSteps do
   let .ok graph := step.getObjVal? "graph" | throwError "Step graph"
   let xs ← decode graph
   unless xs[0]!.isApp && (⟨xs[0]!.appFn!⟩ : ExprStructEq) == ⟨xs[1]!⟩ && (⟨xs[0]!.appArg!⟩ : ExprStructEq) == ⟨xs[2]!⟩ do throwError "Redex fields"
   let .lam _ _ body _ := xs[1]! | throwError "Direct lambda redex"
   unless (⟨body.instantiate1 xs[2]!⟩ : ExprStructEq) == ⟨xs[3]!⟩ do throwError "Beta substitution mismatch"
   steps := steps+1
  rows := rows.push (Json.mkObj [("name",← get "name"),("relation",toJson relation),("exactNormalForms",toJson true)])
 liftIO <| IO.FS.writeFile OUTPUT (Json.mkObj [("status",toJson "PASS"),("rows",toJson rows),("betaSteps",toJson steps),("coreOnly",toJson true),("newKernelTyping",toJson false)]).compress
'''
 runtime=runtime.replace('INPUT',json.dumps(str(folder/'input.json'))).replace('OUTPUT',json.dumps(str(folder/'output.json')))
 (folder/'Runtime.lean').write_text(runtime);run_checked([str(lean),str(folder/'Runtime.lean')],folder,'native',{'PATH':str(lean.parent)+':/usr/bin:/bin','LANG':'en_US.UTF-8','TMPDIR':str(folder)},timeout=120)
 result=json.loads((folder/'output.json').read_bytes());assert result['status']=='PASS' and len(result['rows'])==219
 result.update({'format':'ProofAtlasMethodContextPrimitive/1','compiler':compiler,'leanBinarySha256':sha(lean.read_bytes()),'inputSha256':sha(raw),'runtimeSha256':sha(runtime.encode()),'producerFiles':{f:sha((ROOT/f).read_bytes()) for f in files},'cases':len(cases),'originalProofSourcesRead':False,'originalProofModulesImported':False,'scope':'Lean core beta substitution, normalization, exact serialization and binder-name-only classification. Finite AST replay; synthetic terms may be ill typed. No new kernel typing, domain conversion, metadata erasure or arithmetic.'})
 (BASE/'primitive-check.json.gz').write_bytes(gzip.compress((json.dumps(result,indent=2)+'\n').encode(),mtime=0))
 print(json.dumps({k:result[k] for k in ['status','cases','betaSteps','coreOnly','newKernelTyping']}))
if __name__=='__main__':main()
