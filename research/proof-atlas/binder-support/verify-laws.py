"""Core-only kernel checks of the named-reference counting algebra."""
import argparse,gzip,hashlib,json,os,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent
RESEARCH=BASE.parent
ROOT=BASE.parents[2]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(b):return hashlib.sha256(b).hexdigest()

def main():
 p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args()
 lean=a.lean.resolve();folder=a.workdir.resolve();folder.mkdir(exist_ok=False);(folder/'scratch').mkdir()
 compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 files=[BASE/'Coefficients.lean',BASE/'verify-laws.py',RESEARCH/'build_recursion_examples.py',RESEARCH/'evaluate_goedel.py']
 producers={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 source=(BASE/'Coefficients.lean').read_bytes();executable=sha(lean.read_bytes())
 entry=folder/'Check.lean';output=folder/'output.json'
 entry.write_bytes(source+('\n#atlas_reference_laws '+json.dumps(str(output))+'\n').encode())
 env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':str(folder),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')}
 command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[folder]),str(lean),'-j1','-M2048',str(entry)]
 resources=run_checked(command,folder,'laws',env,timeout=120)
 raw=output.read_bytes();data=json.loads(raw)
 assert [r['name'] for r in data['laws']]==['AtlasReferenceCoefficients.use_substitution','AtlasReferenceCoefficients.size_substitution']
 for row in data['laws']:assert row['kernelTyping']=='PASS' and row['axioms']==['propext','Quot.sound']
 assert producers=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 assert sha(lean.read_bytes())==executable and source==(BASE/'Coefficients.lean').read_bytes()
 report={'format':'ProofAtlasReferenceCoefficientNative/1','status':'PASS','compiler':compiler,'leanExecutableSha256':executable,'producerFiles':producers,'outputSha256':sha(raw),'runtimeSha256':sha(entry.read_bytes()),'resources':resources,'observation':data,'environment':'Lean core only; no private projects or Mathlib imported','independentDependencyRebuild':False,'scope':'Two general counting identities for named-reference trees with substitution holes. Not Lean.Expr typing, scope resolution or a general correctness proof for the JavaScript/native transformations.'}
 (folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'status':'PASS','laws':2,'axioms':['propext','Quot.sound']}),flush=True)
if __name__=='__main__':main()
