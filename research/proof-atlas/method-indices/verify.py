"""Fresh public indexed-recursion controls."""
import argparse,hashlib,importlib.util,json,os,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=RESEARCH.parents[1]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile
def sha(b):return hashlib.sha256(b).hexdigest()
def module(name,file):
 spec=importlib.util.spec_from_file_location(name,file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def fixture():return '''namespace AtlasIndexControls
inductive Chain : Nat → Type where
 | zero : Chain 0
 | next (n : Nat) (tail : Chain n) : Chain (n+1)
noncomputable def chain (seed : Nat) (step : (n : Nat) → Chain n → Nat → Nat) (n : Nat) (xs : Chain n) : Nat :=
 Chain.rec (motive := fun _ _ => Nat) seed step xs
inductive Grid : Nat → Nat → Nat → Nat → Nat → Type where
 | zero : Grid 0 0 0 0 0
 | next (a b c d e : Nat) (tail : Grid a b c d e) : Grid (a+1) b c d e
noncomputable def grid (seed : Nat) (step : (a b c d e : Nat) → Grid a b c d e → Nat → Nat) (a b c d e : Nat) (xs : Grid a b c d e) : Nat :=
 Grid.rec (motive := fun _ _ _ _ _ _ => Nat) seed step xs
inductive Stair : Nat → Type where
 | zero : Stair 0
 | node (n : Nat) (children : (k : Fin n) → Stair k.val) : Stair (n+1)
noncomputable def family (seed : Nat) (step : (n : Nat) → ((k : Fin n) → Stair k.val) → ((k : Fin n) → Nat) → Nat) (n : Nat) (xs : Stair n) : Nat :=
 Stair.rec (motive := fun _ _ => Nat) seed step xs
end AtlasIndexControls
'''
def main():
 p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args();folder=a.workdir.resolve();folder.mkdir(parents=True,exist_ok=False);(folder/'scratch').mkdir();lean=a.lean.resolve()
 compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 paths,recovery=module('origin_cache',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve())
 runtime=module('origin_runtime',RESEARCH/'packet-typing/verify.py').runtime()+'\n'+(RESEARCH/'branch-interfaces/BranchInterfaces.lean').read_text();source=fixture();(folder/'Fixture.lean').write_text(source);core=runtime+'\n'+source
 names=['AtlasIndexControls.chain','AtlasIndexControls.grid','AtlasIndexControls.family']
 export='''
run_cmd do
 let env ← getEnv
 unless !(env.header.moduleNames.any (·.toString.startsWith "SE2Conjugate")) do throwError "Private module imported"
 for (name,file) in #[ITEMS] do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "Missing fixture body"
  liftTermElabM fun _ => AtlasOccurrenceTypes.kernelAs value info.type
  let (t,s) := AtlasLibrary.intern info.type {}
  let (v,s) := AtlasLibrary.intern value s
  let packet := Json.mkObj [("declaration",Json.mkObj [("name",toJson name.toString),("kernelCheck",toJson "PASS"),("module",toJson env.mainModule.toString),("rootPaths",toJson #["root.type","root.value"])]),("serialization",toJson "ExprDAG/1"),("roots",toJson #[t,v])]
  liftIO <| IO.FS.writeFile file (packet.mergeObj (AtlasOccurrenceTypes.graphJson s)).compress
'''.replace('ITEMS',','.join('(``'+n+','+json.dumps(str(folder/f'packet-{i}.json'))+')' for i,n in enumerate(names)))
 entry=folder/'Runtime.lean';entry.write_text(core+'\n'+export);env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,paths)),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')};command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,paths),str(lean),str(entry)]
 run_checked(command,folder,'fixtures',env,timeout=120)
 records=[];request=[]
 for i,name in enumerate(names):
  file=folder/f'packet-{i}.json';data=json.loads(file.read_bytes());data['declaration']['sourceSha256']=sha(source.encode());packet=json.dumps(data,separators=(',',':')).encode();file.write_bytes(packet)
  record={'name':name,'module':data['declaration']['module'],'kind':'def','sourceSha256':sha(source.encode()),'indexSha256':sha(packet),'uniqueNodes':len(data['kind']),'occurrences':str(sum(int(data['expanded'][r]) for r in data['roots']))};slots=[];node=data['roots'][1]
  while data['kind'][node]==6:slots.append(1);node=data['children'][node][1]
  assert len(slots)==(8 if i==1 else 4)
  at={'root':1,'slots':slots};records.append({'ordinal':i,'record':record,'route':at,'packetSha256':sha(packet)})
  request.append({'packetFile':str(file),'source':{'edition':'branch-method-controls',**{k:record[k] for k in ['name','indexSha256','sourceSha256']}},'routes':[at]})
 (folder/'request.json').write_text(json.dumps(request));entry.write_text(core+'\n#atlas_branch_interfaces '+json.dumps(str(folder/'request.json'))+' => '+json.dumps(str(folder/'native.json'))+'\n');run_checked(command,folder,'methods',env,timeout=120)
 native=json.loads((folder/'native.json').read_bytes());assert len(native)==3
 for i,e in enumerate(native):assert e['nativeDeclarationModule']==records[i]['record']['module'] and len(e['entries'])==1
 assert [len(e['entries'][0]['branches']) for e in native]==[2,2,2]
 files=[BASE/'verify.py',RESEARCH/'branch-interfaces/BranchInterfaces.lean',RESEARCH/'ExportLibrary.lean',RESEARCH/'ExportOccurrenceTypes.lean',RESEARCH/'LevelTransportControls.lean',RESEARCH/'compiled-replay/Replay.lean',RESEARCH/'packet-typing/PacketTyping.lean',RESEARCH/'packet-typing/verify.py']
 report={'format':'ProofAtlasMethodIndicesNative/1','status':'PASS','compiler':compiler,'dependencyRecovery':recovery,'producerFiles':{str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files},'records':records,'fixtureSourceSha256':sha(source.encode()),'runtimeSha256':sha(entry.read_bytes()),'nativeOutputSha256':sha((folder/'native.json').read_bytes()),'imports':['Mathlib','Aesop'],'privateRiccatiModulesImported':False,'allDefinitionsNoncomputable':True,'scope':'Three authored controls, fresh kernel declaration typing and eta-method observations. Recursive index ports and lexical scope are checked separately against the output. No AI-source attribution, new mathematical theorem or independent dependency rebuild.'}
 (folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'PASS','profiles':len(records),'methods':sum(len(e['entries'][0]['branches']) for e in native),'records':records}),flush=True)
if __name__=='__main__':main()
