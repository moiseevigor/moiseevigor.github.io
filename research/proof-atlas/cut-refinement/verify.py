"""Check source-cut refinement laws against pinned core Lean; private proof modules are absent."""
import argparse,gzip,hashlib,json,shutil,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent
RESEARCH=BASE.parent
ROOT=BASE.parents[2]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(raw):return hashlib.sha256(raw).hexdigest()
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--lean',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);p.add_argument('--reserve-gib',type=int,default=30);p.add_argument('--check',action='store_true');a=p.parse_args();assert a.reserve_gib>=1
 lean=a.lean.resolve();folder=a.workdir.resolve();folder.mkdir(exist_ok=False);(folder/'scratch').mkdir();assert shutil.disk_usage(folder).free>=a.reserve_gib*1024**3
 files=[BASE/'Cut.lean',BASE/'Fixtures.lean',BASE/'verify.py',RESEARCH/'build_recursion_examples.py',RESEARCH/'evaluate_goedel.py']
 hashes={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':str(folder),'TMPDIR':str(folder/'scratch'),'LANG':'en_US.UTF-8'}
 version_resources=run_checked([str(lean),'--version'],folder,'compiler-version',env,a.reserve_gib,120)
 compiler=(folder/'compiler-version.log').read_text().strip();assert 'version 4.33.1,' in compiler
 output=folder/'laws.json';entry=folder/'Cut.lean';source=(BASE/'Cut.lean').read_text()+'\n'+(BASE/'Fixtures.lean').read_text()+'\n#atlas_source_cut_laws '+json.dumps(str(output))+'\n';entry.write_text(source)
 cmd=[str(lean),str(entry)]
 if sys.platform=='darwin':cmd=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[]),*cmd]
 resources=run_checked(cmd,folder,'native',env,a.reserve_gib,120)
 data=json.loads(output.read_text());assert data['format']=='ProofAtlasSourceCutLaws/1' and data['leanVersion']=='4.33.1'
 assert len(data['theorems'])==6 and len(data['cases'])==19
 assert sum(len(c['rows']) for c in data['cases'])==95
 for t in data['theorems']:
  assert set(t['axioms'])<={'propext','Quot.sound'}
  assert all(t[k]=='PASS' for k in ['kernelType','kernelProof','kernelExpectedTypeConversion'])
 assert hashes=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 if a.check:
  manifest=ROOT/'public/data/proof-atlas/source-cut-laws-manifest.js'
  d=json.loads(manifest.read_text().split('=',1)[1].strip().rstrip(';'))
  raw=gzip.decompress((ROOT/d['file'].lstrip('/')).read_bytes());assert sha(raw)==d['sha256'] and len(raw)==d['decodedBytes']
  published=json.loads(raw);assert published['producer']['sourceFiles']==hashes
  assert {k:v for k,v in published.items() if k!='producer'}==data
 result={'status':'PASS','compiler':compiler,'compilerResources':version_resources,'sourceFiles':hashes,'runtimeSha256':sha(source.encode()),'resources':resources,'nativeOutputSha256':sha(output.read_bytes()),'theorems':data['theorems'],'cases':19,'cuts':95,'originalPrivateProofModulesImported':False,'scope':'A source-indexed syntactic cut model for all Expr constructors. These laws do not prove the browser implementation, source typing, semantic importance or comprehension.'}
 (folder/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k not in ['theorems','sourceFiles']}))
if __name__=='__main__':main()
