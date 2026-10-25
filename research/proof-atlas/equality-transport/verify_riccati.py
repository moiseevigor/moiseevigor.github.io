"""Check the published Riccati packet against pinned private compiled modules.
No original Lean source files are read or published by this driver.
"""
import argparse,hashlib,importlib.util,json,os,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent; RESEARCH=BASE.parent; ROOT=RESEARCH.parents[1]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile
def sha(b):return hashlib.sha256(b).hexdigest()
def module(name,file):
 s=importlib.util.spec_from_file_location(name,file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--lean',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);p.add_argument('--riccati-build',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args();folder=a.workdir.resolve();folder.mkdir(parents=True,exist_ok=False);(folder/'scratch').mkdir();lean=a.lean.resolve()
 paths,recovery=module('riccati_transport_cache',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve());private=a.riccati_build.resolve();previous=json.loads((private/'riccati-verification.json').read_text());compiled={}
 for name,row in previous['sourceModules'].items():
  file=private/Path(*name.split('.')).with_suffix('.olean');assert sha(file.read_bytes())==row['compiledModuleSha256'];compiled[name]=row['compiledModuleSha256']
 paths=[private]+paths;subprocess.check_call(['node',str(BASE/'prepare-riccati.cjs'),str(folder)],cwd=ROOT);plan=json.loads((folder/'plan.json').read_text());request={'packetFile':str(folder/'packet.json'),'source':plan['source'],'routes':plan['routes']};(folder/'request.json').write_text(json.dumps(request))
 runtime=module('riccati_transport_runtime',RESEARCH/'packet-typing/verify.py').runtime().replace('import Mathlib\nimport Aesop','import SE2Conjugate.Riccati')+'\n'+(BASE/'EqualityTransport.lean').read_text()+'\n'+(BASE/'RiccatiTransport.lean').read_text()
 producer=[BASE/'verify_riccati.py',BASE/'prepare-riccati.cjs',BASE/'EqualityTransport.lean',BASE/'RiccatiTransport.lean',RESEARCH/'ExportLibrary.lean',RESEARCH/'ExportOccurrenceTypes.lean',RESEARCH/'packet-typing/verify.py',RESEARCH/'LevelTransportControls.lean',RESEARCH/'compiled-replay/Replay.lean',RESEARCH/'packet-typing/PacketTyping.lean',RESEARCH/'use-sites/verify.py'];hashes={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in producer}
 entry=folder/'Runtime.lean';entry.write_text(runtime+'\n#atlas_riccati_transport '+json.dumps(str(folder/'request.json'))+' => '+json.dumps(str(folder/'native.json'))+'\n');env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,paths)),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')}
 run_checked(['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,paths),str(lean),str(entry)],folder,'native',env,timeout=180)
 native=json.loads((folder/'native.json').read_bytes());assert native['source']==plan['source'] and native['packetFieldsMatchCompiledDeclaration'] is True and native['originalTheoremAbsent'] is False
 assert hashes=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in producer}
 report={'status':'PASS','format':'ProofAtlasRiccatiEqualityNative/1','source':plan['source'],'record':plan['record'],'compiler':subprocess.check_output([str(lean),'--version'],text=True).strip(),'producerFiles':hashes,'dependencyRecovery':recovery,'compiledModules':compiled,'nativeOutputSha256':sha((folder/'native.json').read_bytes()),'runtimeSha256':sha(entry.read_bytes()),'queries':len(native['outcomes']),'checked':len(native['entries']),'originalTheoremImported':True,'privateCompiledModulesImported':True,'originalProofSourcesRead':False,'scope':plan['selection']}
 (folder/'verification.json').write_text(json.dumps(report,separators=(',',':'))+'\n');print(json.dumps({k:report[k] for k in ['status','queries','checked']}),flush=True)
if __name__=='__main__':main()
