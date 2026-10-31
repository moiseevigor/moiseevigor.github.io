"""Fresh core-only composition checks; no mathematical source projects imported."""
import argparse,hashlib,importlib.util,json,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=BASE.parents[2]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(b):return hashlib.sha256(b).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args()
 lean=a.lean.resolve();folder=a.workdir.resolve();folder.mkdir(exist_ok=False);(folder/'scratch').mkdir()
 compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 files=[BASE/n for n in ['Controls.lean','Blocks.lean','prepare.cjs','verify.py']]+[RESEARCH/n for n in ['binder-computation-exchange/Exchange.lean','binder-computation-exchange/Laws.lean','packet-typing/verify.py','ExportLibrary.lean','ExportOccurrenceTypes.lean','LevelTransportControls.lean','compiled-replay/Replay.lean','packet-typing/PacketTyping.lean','region-result-closures/ResultClosures.lean','region-result-closures/Laws.lean','build_recursion_examples.py','evaluate_goedel.py']]
 producers={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':str(folder),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')};command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[folder]),str(lean),'-j1','-M2048']
 (folder/'BlockControls.lean').write_bytes((BASE/'Controls.lean').read_bytes());resources=[run_checked(command+['-o',str(folder/'BlockControls.olean'),str(folder/'BlockControls.lean')],folder,'controls',env)]
 exporter=(RESEARCH/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','import BlockControls').replace('startsWith "SE2Conjugate."','startsWith "BlockControls"')
 (folder/'Export.lean').write_text(exporter+'\n#atlas_library '+json.dumps(str(folder/'packets'))+'\n');resources.append(run_checked(command+[str(folder/'Export.lean')],folder,'export',env))
 subprocess.run(['node',str(BASE/'prepare.cjs'),str(folder)],cwd=ROOT,check=True);planRaw=(folder/'plan.json').read_bytes();plan=json.loads(planRaw)
 spec=importlib.util.spec_from_file_location('block_runtime',RESEARCH/'packet-typing/verify.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 runtime=module.runtime().replace('import Mathlib\nimport Aesop','')
 for name in ['region-result-closures/Laws.lean','region-result-closures/ResultClosures.lean','binder-computation-exchange/Laws.lean','binder-computation-exchange/Exchange.lean']:runtime+='\n'+(RESEARCH/name).read_text().replace('import Lean','')
 runtime+='\n'+(BASE/'Blocks.lean').read_text();entry=folder/'Native.lean';entry.write_text(runtime+'\n#atlas_binder_blocks '+json.dumps(str(folder/'plan.json'))+' => '+json.dumps(str(folder/'output.json'))+'\n')
 resources.append(run_checked(command+[str(entry)],folder,'native',env));output=json.loads((folder/'output.json').read_bytes());assert len(output['profiles'])==8
 for r in output['profiles']:
  assert r['originalDeclarationImported'] is False
  assert all(r['result'][key]=='PASS' for key in ['status','declaredGoalTyping','literalScheduleCoherence','sourceEqualityWitness','completeLiteralInverse'])
 assert producers=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files};assert (folder/'plan.json').read_bytes()==planRaw
 report={'format':'ProofAtlasBinderBlocksVerification/1','status':'PASS','compiler':compiler,'leanExecutableSha256':sha(lean.read_bytes()),'outputSha256':sha((folder/'output.json').read_bytes()),'planSha256':sha(planRaw),'runtimeSha256':sha(entry.read_bytes()),'producerFiles':producers,'resources':resources,'scope':'Fresh whole-term typing at the original declared goal and source conversion after each step in two deterministic binder-spine schedules. Authored controls only; no general compiler theorem or corpus typing.'}
 (folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'PASS','controls':8,'steps':sum(2*p['result']['initialInversions'] for p in output['profiles'])}))
if __name__=='__main__':main()
