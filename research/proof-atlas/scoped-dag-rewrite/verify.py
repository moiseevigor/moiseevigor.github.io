"""Guarded core-only shared-expression stress run; original proof data unused."""
import argparse,gzip,hashlib,importlib.util,json,os,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=BASE.parents[2]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(b):return hashlib.sha256(b).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args()
 folder=a.workdir.resolve();folder.mkdir(exist_ok=False);(folder/'scratch').mkdir();lean=a.lean.resolve()
 compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 spec=importlib.util.spec_from_file_location('expr_stress_runtime',RESEARCH/'expr-reference-laws/verify.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
 files=[BASE/n for n in ['Stress.lean','NodeRewrite.lean','Pruning.lean','verify.py']]+[RESEARCH/n for n in ['expr-reference-laws/verify.py','expr-reference-laws/Reference.lean','expr-reference-laws/Bridge.lean','packet-typing/verify.py','packet-typing/PacketTyping.lean','ExportLibrary.lean','ExportOccurrenceTypes.lean','LevelTransportControls.lean','compiled-replay/Replay.lean','build_recursion_examples.py','evaluate_goedel.py']]
 producers={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files};binary=sha(lean.read_bytes());entry=folder/'Stress.lean';output=folder/'output.json'
 entry.write_text(m.runtime()+'\n'+(BASE/'Pruning.lean').read_text()+'\n'+(BASE/'NodeRewrite.lean').read_text()+'\n'+(BASE/'Stress.lean').read_text()+'\n#atlas_expr_reference_stress '+json.dumps(str(output))+'\n')
 env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':str(folder),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')}
 command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[folder]),str(lean),'-j1','-M4096',str(entry)]
 resources=run_checked(command,folder,'native',env,timeout=120);raw=output.read_bytes();data=json.loads(raw)
 assert data['kernelTyping']==4 and data['kernelConversions']==3 and data['typedEqualityWitnesses']==3 and data['literalInverses']==2
 assert data['leafCount']==8192 and data['doublings']==64 and len(data['graph']['kind'])<=131072
 assert producers=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files} and binary==sha(lean.read_bytes())
 report={'format':'ProofAtlasExprReferenceStressEvidence/1','status':'PASS','compiler':compiler,'leanExecutableSha256':binary,'producerFiles':producers,'outputSha256':sha(raw),'runtimeSha256':sha(entry.read_bytes()),'resources':resources,'observation':data,'scope':'Separately authored kernel-checked Nat/Prod value program with shared structure in distinct binder contexts. Finite native/memoized transformation and recovery checks, not an AI proof benchmark or general memoization proof.'}
 (folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'PASS','jointRows':len(data['graph']['kind']),'memoStates':data['memoStates']}),flush=True)
if __name__=='__main__':main()
