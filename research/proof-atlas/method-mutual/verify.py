"""Fresh mutual recursor controls with different index signatures and functional families."""
import argparse,hashlib,importlib.util,json,os,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=RESEARCH.parents[1]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile
def sha(b):return hashlib.sha256(b).hexdigest()
def module(name,file):
 spec=importlib.util.spec_from_file_location(name,file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def fixture():return '''namespace AtlasMutualControls
universe u
mutual
 inductive Tree (A : Type u) : Nat → Type u where
  | leaf : A → Tree A 0
  | node (n : Nat) (children : Forest A n n) : Tree A (n+1)
 inductive Forest (A : Type u) : Nat → Nat → Type u where
  | empty : Forest A 0 0
  | cons (n m : Nat) (tree : Tree A n) (tail : Forest A n m) : Forest A n (m+1)
end
noncomputable def tree (A : Type u) (leaf : A → Nat) (node : (n : Nat) → Forest A n n → Bool → Nat) (empty : Bool) (cons : (n m : Nat) → Tree A n → Forest A n m → Nat → Bool → Bool) (n : Nat) (xs : Tree A n) : Nat :=
 @Tree.rec A (fun _ _ => Nat) (fun _ _ _ => Bool) leaf node empty cons n xs
noncomputable def forest (A : Type u) (leaf : A → Nat) (node : (n : Nat) → Forest A n n → Bool → Nat) (empty : Bool) (cons : (n m : Nat) → Tree A n → Forest A n m → Nat → Bool → Bool) (n m : Nat) (xs : Forest A n m) : Bool :=
 @Forest.rec A (fun _ _ => Nat) (fun _ _ _ => Bool) leaf node empty cons n m xs
mutual
 inductive Rose (A : Type u) : Nat → Type u where
  | leaf : A → Rose A 0
  | branch (n : Nat) (children : (k : Fin n) → Grove A k.val) : Rose A (n+1)
 inductive Grove (A : Type u) : Nat → Type u where
  | node (n : Nat) (child : Rose A n) : Grove A (n+1)
end
noncomputable def family (A : Type u) (leaf : A → Nat) (branch : (n : Nat) → ((k : Fin n) → Grove A k.val) → ((k : Fin n) → Bool) → Nat) (node : (n : Nat) → Rose A n → Nat → Bool) (n : Nat) (xs : Rose A n) : Nat :=
 @Rose.rec A (fun _ _ => Nat) (fun _ _ => Bool) leaf branch node n xs
end AtlasMutualControls
'''
def main():
 p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args();folder=a.workdir.resolve();folder.mkdir(parents=True,exist_ok=False);(folder/'scratch').mkdir();lean=a.lean.resolve()
 compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 paths,recovery=module('origin_cache',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve())
 runtime=module('origin_runtime',RESEARCH/'packet-typing/verify.py').runtime();extension=(BASE/'MutualElimination.lean').read_text();marker='/- Kernel Expr.proj is a field elimination';assert runtime.count(marker)==1;runtime=runtime.replace(marker,extension+'\n'+marker).replace('← eliminationJudgment original term type xs shared types root slots path','← mutualEliminationJudgment original term type xs shared types root slots path');runtime+='\n'+(RESEARCH/'branch-interfaces/BranchInterfaces.lean').read_text();source=fixture();(folder/'Fixture.lean').write_text(source);core=runtime+'\n'+source
 names=['AtlasMutualControls.tree','AtlasMutualControls.forest','AtlasMutualControls.family']
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
  let packet := Json.mkObj [("declaration",Json.mkObj [("name",toJson name.toString),("kernelCheck",toJson "PASS"),("kind",toJson (AtlasLibrary.kind info)),("levelParams",toJson (info.levelParams.map (·.toString))),("module",toJson env.mainModule.toString),("rootPaths",toJson #["root.type","root.value"])]),("serialization",toJson "ExprDAG/1"),("roots",toJson #[t,v])]
  liftIO <| IO.FS.writeFile file (packet.mergeObj (AtlasOccurrenceTypes.graphJson s)).compress
'''.replace('ITEMS',','.join('(``'+n+','+json.dumps(str(folder/f'packet-{i}.json'))+')' for i,n in enumerate(names)))
 entry=folder/'Runtime.lean';entry.write_text(core+'\n'+export);env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,paths)),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')};command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,paths),str(lean),str(entry)]
 run_checked(command,folder,'fixtures',env,timeout=120)
 records=[];request=[]
 for i,name in enumerate(names):
  file=folder/f'packet-{i}.json';data=json.loads(file.read_bytes());data['declaration']['sourceSha256']=sha(source.encode());packet=json.dumps(data,separators=(',',':')).encode();file.write_bytes(packet)
  record={'name':name,'module':data['declaration']['module'],'kind':data['declaration']['kind'],'sourceSha256':sha(source.encode()),'indexSha256':sha(packet),'uniqueNodes':len(data['kind']),'occurrences':str(sum(int(data['expanded'][r]) for r in data['roots']))};slots=[];node=data['roots'][1]
  while data['kind'][node]==6:slots.append(1);node=data['children'][node][1]
  assert len(slots)==[7,8,6][i]
  at={'root':1,'slots':slots};records.append({'ordinal':i,'record':record,'route':at,'packetSha256':sha(packet)})
  request.append({'packetFile':str(file),'source':{'edition':'branch-method-controls',**{k:record[k] for k in ['name','indexSha256','sourceSha256']}},'routes':[at]})
 (folder/'request.json').write_text(json.dumps(request));entry.write_text(core+'\n#atlas_branch_interfaces '+json.dumps(str(folder/'request.json'))+' => '+json.dumps(str(folder/'native.json'))+'\n');run_checked(command,folder,'methods',env,timeout=120)
 assert [r['record']['kind'] for r in records]==['definition','definition','definition']
 native=json.loads((folder/'native.json').read_bytes());assert len(native)==3
 for i,e in enumerate(native):assert e['nativeDeclarationModule']==records[i]['record']['module'] and len(e['entries'])==1
 assert [len(e['entries'][0]['branches']) for e in native]==[4,4,3]
 files=[BASE/'verify.py',BASE/'MutualElimination.lean',RESEARCH/'branch-interfaces/BranchInterfaces.lean',RESEARCH/'ExportLibrary.lean',RESEARCH/'ExportOccurrenceTypes.lean',RESEARCH/'LevelTransportControls.lean',RESEARCH/'compiled-replay/Replay.lean',RESEARCH/'packet-typing/PacketTyping.lean',RESEARCH/'packet-typing/verify.py']
 report={'format':'ProofAtlasMethodMutualNative/1','status':'PASS','compiler':compiler,'dependencyRecovery':recovery,'producerFiles':{str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files},'records':records,'fixtureSourceSha256':sha(source.encode()),'runtimeSha256':sha(entry.read_bytes()),'nativeOutputSha256':sha((folder/'native.json').read_bytes()),'imports':['Mathlib','Aesop'],'privateRiccatiModulesImported':False,'computationalDefinitionsNoncomputable':True,'scope':'Three authored controls, fresh kernel declaration typing and eta-method observations. Mutual rule ownership, sibling target signatures and lexical scope are checked separately against the output. No AI-source attribution, new mathematical theorem or independent dependency rebuild.'}
 (folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'PASS','profiles':len(records),'methods':sum(len(e['entries'][0]['branches']) for e in native),'records':records}),flush=True)
if __name__=='__main__':main()
