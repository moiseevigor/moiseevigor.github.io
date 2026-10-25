"""Fresh kernel fixture and packet-only transport replay; no original sources."""
import argparse,hashlib,importlib.util,json,os,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=RESEARCH.parents[1]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile
def sha(b):return hashlib.sha256(b).hexdigest()
def module(name,file):
 s=importlib.util.spec_from_file_location(name,file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def main():
 p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args();folder=a.workdir.resolve();folder.mkdir(parents=True,exist_ok=False);(folder/'scratch').mkdir();lean=a.lean.resolve()
 compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 paths,recovery=module('equality_stress_cache',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve())
 runtime=module('equality_stress_runtime',RESEARCH/'packet-typing/verify.py').runtime()+'\n'+(RESEARCH/'equality-transport/EqualityTransport.lean').read_text()
 files=[BASE/'verify_stress.py',BASE/'Stress.lean',RESEARCH/'use-sites/verify.py',RESEARCH/'packet-typing/verify.py',RESEARCH/'ExportLibrary.lean',RESEARCH/'ExportOccurrenceTypes.lean',RESEARCH/'LevelTransportControls.lean',RESEARCH/'compiled-replay/Replay.lean',RESEARCH/'packet-typing/PacketTyping.lean',RESEARCH/'equality-transport/EqualityTransport.lean'];hashes={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,paths)),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')};entry=folder/'Runtime.lean';command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,paths),str(lean),str(entry)]
 entry.write_text(runtime+'\n'+(BASE/'Stress.lean').read_text()+'\n#atlas_transport_stress '+json.dumps(str(folder/'packet.json'))+'\n');run_checked(command,folder,'fixture',env,timeout=180)
 raw=(folder/'packet.json').read_bytes();data=json.loads(raw);record={'name':data['declaration']['name'],'module':data['declaration']['module'],'sourceSha256':sha((BASE/'Stress.lean').read_bytes()),'indexSha256':sha(raw),'uniqueNodes':len(data['kind']),'occurrences':str(sum(int(data['expanded'][r]) for r in data['roots']))}
 source={'edition':'equality-transport-controls',**{k:record[k] for k in ['name','sourceSha256','indexSha256']}};request=[{'packetFile':str(folder/'packet.json'),'source':source,'routes':[{'root':1,'slots':[1]}]}];(folder/'request.json').write_text(json.dumps(request))
 # The generator is absent from this fresh replay runtime.
 entry.write_text(runtime+'\n#atlas_equality_replay '+json.dumps(str(folder/'request.json'))+' => '+json.dumps(str(folder/'native.json'))+'\n');run_checked(command,folder,'native',env,timeout=180)
 native=json.loads((folder/'native.json').read_bytes());assert len(native)==1 and len(native[0]['entries'])==1,native
 assert native[0]['originalTheoremAbsent'] and native[0]['originalModuleAbsent'] and native[0]['privateRiccatiModulesAbsent']
 assert sha((folder/'packet.json').read_bytes())==record['indexSha256'];assert hashes=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 report={'format':'ProofAtlasEqualityStressNative/1','status':'PASS','compiler':compiler,'dependencyRecovery':recovery,'source':source,'record':record,'route':request[0]['routes'][0],'producerFiles':hashes,'runtimeSha256':sha(entry.read_bytes()),'nativeOutputSha256':sha((folder/'native.json').read_bytes()),'originalProofSourcesRead':False,'privateRiccatiModulesImported':False,'scope':'Authored balanced dependent-family control. Fresh kernel typing and packet-only replay; not an AI-source proof or comprehension result.'};(folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'PASS','record':record}),flush=True)
if __name__=='__main__':main()
