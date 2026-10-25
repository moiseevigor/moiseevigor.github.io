"""Fresh packet-only equality transport checks, with bounded native execution."""
import argparse, hashlib, importlib.util, json, os, shutil, subprocess, sys
from pathlib import Path
BASE=Path(__file__).resolve().parent; RESEARCH=BASE.parent; ROOT=RESEARCH.parents[1]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile
def sha(b): return hashlib.sha256(b).hexdigest()
def write(p,v): p.write_text(json.dumps(v,separators=(',',':'))+'\n')
def module(name,file):
 s=importlib.util.spec_from_file_location(name,file); m=importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
def fixture(): return '''namespace AtlasTransportControls
universe u v
def simple (P Q : Prop) (h : P = Q) (p : P) : Q := Eq.mp h p
def dependent (A : Sort u) (a b : A) (C : A → Sort v) (h : a = b) (p : C a) : C b := @Eq.ndrec A a C p b h
def proofDependent (A : Sort u) (a b : A) (C : (b : A) → a = b → Sort v) (h : a = b) (p : C a rfl) : C b h := @Eq.rec A a C p b h
def trailing (P Q R : Prop) (h : (P → R) = (Q → R)) (f : P → R) (q : Q) : R := (Eq.mp h f) q
def same (P : Prop) (h : P = P) (p : P) : P := Eq.mp h p
def reordered (A : Sort u) (a b : A) (C : (b : A) → a = b → Sort v) (h : a = b) (p : C a rfl) : C b h := @Eq.recOn A a C b h p
def reverse (P Q : Prop) (h : P = Q) (q : Q) : P := Eq.mpr h q
def ordinary (P Q : Prop) (f : P → Q) (p : P) : Q := f p
def partialCall (A : Sort u) (a : A) (C : A → Sort v) (p : C a) := @Eq.ndrec A a C p
end AtlasTransportControls
'''
def main():
 p=argparse.ArgumentParser(description=__doc__); p.add_argument('--lean',type=Path,required=True); p.add_argument('--cache',type=Path,required=True); p.add_argument('--workdir',type=Path,required=True); a=p.parse_args()
 folder=a.workdir.resolve(); folder.mkdir(parents=True,exist_ok=False); (folder/'scratch').mkdir(); lean=a.lean.resolve()
 assert shutil.disk_usage(folder).free>=30*1024**3
 compiler=subprocess.check_output([str(lean),'--version'],text=True).strip(); assert 'version 4.33.1,' in compiler
 paths,recovery=module('transport_cache',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve())
 runtime=module('transport_runtime',RESEARCH/'packet-typing/verify.py').runtime()+'\n'+(BASE/'EqualityTransport.lean').read_text()
 producer=[BASE/'verify.py',BASE/'EqualityTransport.lean',RESEARCH/'method-replay/prepare.cjs',RESEARCH/'ExportLibrary.lean',RESEARCH/'ExportOccurrenceTypes.lean',RESEARCH/'LevelTransportControls.lean',RESEARCH/'compiled-replay/Replay.lean',RESEARCH/'packet-typing/PacketTyping.lean',RESEARCH/'packet-typing/verify.py',RESEARCH/'use-sites/verify.py']
 hashes={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in producer}
 env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,paths)),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')}
 def run(target,code,phase='native'):
  entry=target/'Runtime.lean'; entry.write_text(runtime+'\n'+code)
  run_checked(['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,paths),str(lean),str(entry)],target,phase,env,timeout=180)
  return sha(entry.read_bytes())
 # Authored controls are compiled once; replay runs omit this source entirely.
 names=['simple','dependent','proofDependent','trailing','same','reordered','reverse','ordinary','partialCall']
 target=folder/'controls'; target.mkdir(); source=fixture(); (target/'Fixture.lean').write_text(source)
 export='''
run_cmd do
 let env ← getEnv
 for (name,file) in #[ITEMS] do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "No fixture body"
  liftTermElabM fun _ => AtlasOccurrenceTypes.kernelAs value info.type
  let (t,s) := AtlasLibrary.intern info.type {}
  let (v,s) := AtlasLibrary.intern value s
  let packet := Json.mkObj [("declaration",Json.mkObj [("name",toJson name.toString),("kernelCheck",toJson "PASS"),("kind",toJson (AtlasLibrary.kind info)),("levelParams",toJson (info.levelParams.map (·.toString))),("module",toJson env.mainModule.toString),("rootPaths",toJson #["root.type","root.value"])]),("serialization",toJson "ExprDAG/1"),("roots",toJson #[t,v])]
  liftIO <| IO.FS.writeFile file (packet.mergeObj (AtlasOccurrenceTypes.graphJson s)).compress
'''.replace('ITEMS',','.join('(``AtlasTransportControls.'+n+','+json.dumps(str(target/(n+'.json')))+')' for n in names))
 run(target,source+export,'fixtures')
 controls=[]; requests=[]
 for n in names:
  f=target/(n+'.json'); data=json.loads(f.read_bytes()); record={'name':data['declaration']['name'],'module':data['declaration']['module'],'sourceSha256':sha(source.encode()),'indexSha256':sha(f.read_bytes()),'uniqueNodes':len(data['kind']),'occurrences':str(sum(int(data['expanded'][r]) for r in data['roots']))}
  node=data['roots'][1]; slots=[]
  while data['kind'][node]==6: slots.append(1); node=data['children'][node][1]
  routes=[{'root':1,'slots':slots}]
  if n=='trailing': routes.append({'root':1,'slots':slots+[0]})
  item={'source':{'edition':'equality-transport-controls',**{k:record[k] for k in ['name','sourceSha256','indexSha256']}},'record':record,'routes':routes,'expectedChecked':0 if n in ['ordinary','partialCall'] else len(routes)}
  controls.append(item); requests.append({'packetFile':str(f),'source':item['source'],'routes':routes})
 write(target/'request.json',requests)
 controlRuntime=run(target,'#atlas_equality_replay '+json.dumps(str(target/'request.json'))+' => '+json.dumps(str(target/'native.json')))
 output=json.loads((target/'native.json').read_bytes()); assert len(output)==9
 for row in output:
  expected=next(c['expectedChecked'] for c in controls if c['source']==row['source']); assert len(row['entries'])==expected,(row['name'],row['outcomes'])
 # Frozen candidate inventory, selected before this transport rule existed.
 subprocess.check_call(['node',str(RESEARCH/'method-replay/prepare.cjs'),str(folder)],cwd=ROOT)
 plan=json.loads((folder/'plan.json').read_bytes()); profiles=[]
 for item in plan['rows']:
  target=folder/item['record']['name']; assert sha((target/'packet.json').read_bytes())==item['source']['indexSha256']
  request=[{'packetFile':str(target/'packet.json'),'source':item['source'],'routes':[q['route'] for q in item['queries']]}]; write(target/'request.json',request)
  write(target/'proof-request.json',[{'file':str(target/'packet.json'),**{k:item['record'][k] for k in ['name','module','indexSha256','axioms']}}])
  code='#atlas_packet_replay '+json.dumps(str(target/'proof-request.json'))+' => '+json.dumps(str(target/'proof.ndjson'))+'\n#atlas_equality_replay '+json.dumps(str(target/'request.json'))+' => '+json.dumps(str(target/'native.json'))
  runtimeHash=run(target,code); native=json.loads((target/'native.json').read_bytes()); assert len(native)==1
  row=native[0]; proof=json.loads((target/'proof.ndjson').read_text()); assert proof['indexSha256']==item['source']['indexSha256']
  for key in ['kernelProof','kernelExpectedType','kernelExpectedTypeConversion']: assert proof[key]=='PASS'
  for key in ['originalTheoremAbsentFromEnvironment','originalModuleAbsentFromEnvironment','wrongProofRejectedByKernel','illTypedBinderRejectedByKernel']: assert proof[key] is True
  assert 'sorryAx' not in proof['axioms'] and set(proof['axioms'])==set(item['record']['axioms'])
  profiles.append({'source':item['source'],'record':item['record'],'nativeOutputSha256':sha((target/'native.json').read_bytes()),'runtimeSha256':runtimeHash,'baselineProofSha256':sha((target/'proof.ndjson').read_bytes()),'baselineProof':proof,'checked':len(row['entries']),'queries':len(row['outcomes'])})
  print(json.dumps({'name':row['name'],'checked':len(row['entries']),'queries':len(row['outcomes'])}),flush=True)
 assert hashes=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in producer}
 report={'status':'PASS','format':'ProofAtlasEqualityNativeVerification/1','compiler':compiler,'dependencyRecovery':recovery,'producerFiles':hashes,'planSha256':sha((folder/'plan.json').read_bytes()),'controlFixtureSha256':sha(source.encode()),'controlRuntimeSha256':controlRuntime,'controls':controls,'controlNativeSha256':sha((folder/'controls/native.json').read_bytes()),'profiles':profiles,'checked':sum(p['checked'] for p in profiles),'queries':sum(p['queries'] for p in profiles),'originalProofSourcesRead':False,'originalProofModulesImported':False,'privateRiccatiModulesImported':False}
 write(folder/'verification.json',report); print(json.dumps({k:report[k] for k in ['status','checked','queries']}),flush=True)
if __name__=='__main__': main()
