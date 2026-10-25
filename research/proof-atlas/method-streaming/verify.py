"""Fresh large, shallow method fixture; compiled terms only in public output."""
import argparse,hashlib,importlib.util,json,os,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=RESEARCH.parents[1]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile
def sha(b):return hashlib.sha256(b).hexdigest()
def module(name,file):
 spec=importlib.util.spec_from_file_location(name,file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def fixture():
 values=['(Nat.add (Nat.add offset n) (Nat.add ih '+str(i)+'))' for i in range(1024)]
 while len(values)>1:values=['(Nat.add '+values[i]+' '+values[i+1]+')' for i in range(0,len(values),2)]
 return 'namespace AtlasMethodControls\ndef largeStream (offset target : Nat) : Nat :=\n Nat.rec (motive := fun _ => Nat) offset (fun n ih => '+values[0]+') target\nend AtlasMethodControls\n'
def main():
 p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args();folder=a.workdir.resolve();folder.mkdir(parents=True,exist_ok=False);(folder/'scratch').mkdir();lean=a.lean.resolve()
 compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 paths,recovery=module('stream_cache',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve())
 runtime=module('stream_runtime',RESEARCH/'packet-typing/verify.py').runtime()+'\n'+(RESEARCH/'branch-interfaces/BranchInterfaces.lean').read_text()
 source=fixture();(folder/'Fixture.lean').write_text(source);core=runtime+'\n'+source
 export='''
run_cmd do
 let name := ``AtlasMethodControls.largeStream
 let info ← getConstInfo name
 let some value := info.value? true | throwError "Missing fixture body"
 liftTermElabM fun _ => AtlasOccurrenceTypes.kernelAs value info.type
 let env ← getEnv
 unless !(env.header.moduleNames.any (·.toString.startsWith "SE2Conjugate")) do throwError "Private module imported"
 let (t,s) := AtlasLibrary.intern info.type {}
 let (v,s) := AtlasLibrary.intern value s
 let packet := Json.mkObj [("declaration",Json.mkObj [("name",toJson name.toString),("kernelCheck",toJson "PASS"),("module",toJson env.mainModule.toString),("rootPaths",toJson #["root.type","root.value"])]),("serialization",toJson "ExprDAG/1"),("roots",toJson #[t,v])]
 liftIO <| IO.FS.writeFile "PACKET" (packet.mergeObj (AtlasOccurrenceTypes.graphJson s)).compress
'''.replace('PACKET',str(folder/'packet.json'))
 entry=folder/'Runtime.lean';entry.write_text(core+'\n'+export);env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,paths)),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')};command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,paths),str(lean),str(entry)]
 run_checked(command,folder,'fixture',env,timeout=120)
 data=json.loads((folder/'packet.json').read_bytes());data['declaration']['sourceSha256']=sha(source.encode());packet=json.dumps(data,separators=(',',':')).encode();(folder/'packet.json').write_bytes(packet)
 record={'name':data['declaration']['name'],'module':data['declaration']['module'],'kind':'def','sourceSha256':sha(source.encode()),'indexSha256':sha(packet),'uniqueNodes':len(data['kind']),'occurrences':str(sum(int(data['expanded'][r]) for r in data['roots']))}
 slots=[];id=data['roots'][1]
 while data['kind'][id]==6:slots.append(1);id=data['children'][id][1]
 request=[{'packetFile':str(folder/'packet.json'),'source':{'edition':'branch-method-controls',**{k:record[k] for k in ['name','indexSha256','sourceSha256']}},'routes':[{'root':1,'slots':slots}]}];(folder/'request.json').write_text(json.dumps(request))
 entry.write_text(core+'\n#atlas_branch_interfaces '+json.dumps(str(folder/'request.json'))+' => '+json.dumps(str(folder/'native.json'))+'\n');run_checked(command,folder,'methods',env,timeout=120)
 native=json.loads((folder/'native.json').read_bytes());assert len(native)==1 and len(native[0]['entries'])==1;assert native[0]['nativeDeclarationModule']==record['module'];assert len(native[0]['entries'][0]['branches'])==2
 files=[BASE/'verify.py',RESEARCH/'branch-interfaces/BranchInterfaces.lean',RESEARCH/'ExportLibrary.lean',RESEARCH/'ExportOccurrenceTypes.lean',RESEARCH/'LevelTransportControls.lean',RESEARCH/'compiled-replay/Replay.lean',RESEARCH/'packet-typing/PacketTyping.lean',RESEARCH/'packet-typing/verify.py']
 report={'format':'ProofAtlasLargeMethodNative/1','status':'PASS','compiler':compiler,'dependencyRecovery':recovery,'producerFiles':{str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files},'record':record,'route':request[0]['routes'][0],'fixtureSourceSha256':sha(source.encode()),'runtimeSha256':sha(entry.read_bytes()),'nativeOutputSha256':sha((folder/'native.json').read_bytes()),'packetSha256':sha(packet),'imports':['Mathlib','Aesop'],'privateRiccatiModulesImported':False,'scope':'Authored large arithmetic method, fresh kernel typing and eta interfaces; not an AI-source proof or comprehension result. Cache binaries verified, no independent dependency rebuild.'}
 (folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'PASS','record':record,'route':report['route']}),flush=True)
if __name__=='__main__':main()
