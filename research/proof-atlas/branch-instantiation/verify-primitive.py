"""Replay literal substitution with Lean core only; this is not a typing check."""
import argparse,gzip,hashlib,json,os,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent
ROOT=BASE.parents[2]
sys.path.insert(0,str(BASE.parent))
from build_recursion_examples import run_checked
def sha(b):return hashlib.sha256(b).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args()
 folder=a.workdir.resolve();folder.mkdir(exist_ok=False);lean=a.lean.resolve()
 compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 inp=gzip.decompress((BASE/'primitive-input.json.gz').read_bytes());cases=json.loads(inp);assert len(cases)==338
 (folder/'input.json').write_bytes(inp)
 files=['research/proof-atlas/ExportLibrary.lean','research/proof-atlas/LevelTransportControls.lean','research/proof-atlas/compiled-replay/Replay.lean','research/proof-atlas/branch-instantiation/verify-primitive.py','research/proof-atlas/build_recursion_examples.py']
 library=(ROOT/files[0]).read_text().replace('import SE2Conjugate','').split('syntax "#atlas_library ')[0]+'\nend AtlasLibrary\n'
 levels=(ROOT/files[1]).read_text().split('def compactGraph')[0]+'\nend AtlasLevelTransport\n'
 replay=(ROOT/files[2]).read_text().split('def checked')[0]+'\nend AtlasPacketReplay\n'
 runtime=library+'\nnamespace AtlasOccurrenceTypes\nend AtlasOccurrenceTypes\n'+levels+replay
 runtime+='''
set_option maxHeartbeats 10000000
set_option maxRecDepth 8192
run_cmd do
 let env ← getEnv
 unless !(env.header.moduleNames.any (fun n => n.toString.startsWith "SE2Conjugate" || n.toString.startsWith "Mathlib" || n.toString == "Aesop")) do throwError "Non-core module imported"
 let .ok requests := Json.parse (← IO.FS.readFile INPUT) >>= Json.getArr? | throwError "Input shape"
 let mut rows : Array Json := #[]
 for q in requests do
  let get (key : String) : CommandElabM Json := match q.getObjVal? key with | .ok v => pure v | .error e => throwError e
  let template ← get "template"
  let source ← get "source"
  let expected ← get "expected"
  let .ok ts := AtlasPacketReplay.decode template | throwError "Template decoder"
  let .ok ss := AtlasPacketReplay.decode source | throwError "Source decoder"
  let .ok es := AtlasPacketReplay.decode expected | throwError "Expected decoder"
  let .ok tr := template.getObjValAs? (Array Nat) "roots" | throwError "Template root"
  let .ok sr := source.getObjValAs? (Array Nat) "roots" | throwError "Argument roots"
  let .ok er := expected.getObjValAs? (Array Nat) "roots" | throwError "Expected root"
  let .ok wanted := q.getObjValAs? Bool "shouldMatch" | throwError "Expected status"
  let result := ts[tr[0]!]!.instantiateRev (sr.map (ss[·]!))
  let matched := (⟨result⟩ : ExprStructEq) == ⟨es[er[0]!]!⟩
  unless matched == wanted do throwError "Substitution mismatch: {← get "name"}"
  if wanted then
   let graph := AtlasPacketReplay.graph #[result]
   for key in ["kind","children","payloads","expanded","neededScope","roots"] do
    let .ok lhs := graph.getObjVal? key | throwError "Output field missing"
    let .ok rhs := expected.getObjVal? key | throwError "Expected field missing"
    unless lhs == rhs do throwError "Serialized result mismatch {key}: {← get "name"}"
  rows := rows.push (Json.mkObj [("name",← get "name"),("matches",toJson matched),("wanted",toJson wanted),("exactSerializedOutput",toJson wanted)])
 liftIO <| IO.FS.writeFile OUTPUT (Json.mkObj [("status",toJson "PASS"),("rows",toJson rows),("coreOnly",toJson true),("newKernelTyping",toJson false)]).compress
'''.replace('INPUT',json.dumps(str(folder/'input.json'))).replace('OUTPUT',json.dumps(str(folder/'output.json')))
 (folder/'Runtime.lean').write_text(runtime)
 env={'PATH':str(lean.parent)+':/usr/bin:/bin','LANG':'en_US.UTF-8','TMPDIR':str(folder)}
 run_checked([str(lean),str(folder/'Runtime.lean')],folder,'native',env,timeout=120)
 result=json.loads((folder/'output.json').read_bytes());assert result['status']=='PASS' and len(result['rows'])==338
 result.update({'format':'ProofAtlasBranchSubstitutionPrimitive/1','compiler':compiler,'leanBinarySha256':sha(lean.read_bytes()),'inputSha256':sha(inp),'runtimeSha256':sha(runtime.encode()),'producerFiles':{f:sha((ROOT/f).read_bytes()) for f in files},'positiveCases':sum(x['shouldMatch'] for x in cases),'negativeCases':sum(not x['shouldMatch'] for x in cases),'originalProofSourcesRead':False,'originalProofModulesImported':False,'scope':'Lean core Expr.instantiateRev and exact serializer agreement on finite ASTs. No new kernel typing or conversion check; the synthetic inputs may be ill typed.'})
 (BASE/'primitive-check.json.gz').write_bytes(gzip.compress((json.dumps(result,indent=2)+'\n').encode(),mtime=0))
 print(json.dumps({k:result[k] for k in ['status','positiveCases','negativeCases','coreOnly','newKernelTyping']}))
if __name__=='__main__':main()
