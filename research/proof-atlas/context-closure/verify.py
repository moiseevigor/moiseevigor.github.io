"""Core-Lean least-context laws and finite bridge fixtures; no private proof imports."""
import argparse,gzip,hashlib,json,shutil,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent
RESEARCH=BASE.parent
ROOT=BASE.parents[2]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(raw):return hashlib.sha256(raw).hexdigest()
def runtime():return (BASE/'Closure.lean').read_text()+'\n'+(BASE/'Fixtures.lean').read_text()
FILES=[BASE/'Closure.lean',BASE/'Fixtures.lean',BASE/'verify.py',RESEARCH/'build_recursion_examples.py',RESEARCH/'evaluate_goedel.py']
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--lean',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);p.add_argument('--publish',action='store_true');p.add_argument('--check',action='store_true');a=p.parse_args();assert not(a.publish and a.check)
 lean=a.lean.resolve();compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 folder=a.workdir.resolve();folder.mkdir(exist_ok=False);(folder/'scratch').mkdir();assert shutil.disk_usage(folder).free>=30*1024**3
 output=folder/'closure.json';entry=folder/'Closure.lean';stable=runtime();source_hashes={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in FILES};entry.write_text(stable+'\n#atlas_context_closure '+json.dumps(str(output))+'\n');entry_sha=sha(entry.read_bytes())
 env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':str(folder),'TMPDIR':str(folder/'scratch'),'LANG':'en_US.UTF-8'}
 cmd=[str(lean),str(entry)]
 if sys.platform=='darwin':cmd=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[]),*cmd]
 resources=run_checked(cmd,folder,'native',env,30,120)
 assert runtime()==stable and sha(entry.read_bytes())==entry_sha and source_hashes=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in FILES}
 data=json.loads(output.read_text());assert data['format']=='ProofAtlasContextClosure/1' and len(data['theorems'])==6 and len(data['cases'])==76 and len(data['extras'])==6
 assert sum(len(c['rows']) for c in data['cases'])==1099
 for t in data['theorems']:
  assert set(t['axioms'])<={'propext','Quot.sound'}
  assert all(t[k]=='PASS' for k in ['kernelType','kernelProof','kernelExpectedTypeConversion'])
 data['producer']={'runtimeSha256':sha(stable.encode()),'sourceFiles':source_hashes}
 raw=json.dumps(data,separators=(',',':'),ensure_ascii=False).encode();assert len(raw)<=8*1024**2
 digest=sha(raw);d={'format':'ProofAtlasContextClosureDescriptor/1','file':'/public/data/proof-atlas/context-closure/'+digest+'.json.gz','sha256':digest,'decodedBytes':len(raw)};target=ROOT/d['file'].lstrip('/');manifest=ROOT/'public/data/proof-atlas/context-closure-manifest.js'
 if a.publish:
  target.parent.mkdir(exist_ok=True)
  if target.exists():assert gzip.decompress(target.read_bytes())==raw
  else:target.write_bytes(gzip.compress(raw,mtime=0))
  manifest.write_text('window.PROOF_ATLAS_CONTEXT_CLOSURE='+json.dumps(d,separators=(',',':'))+';\n')
 if a.check:
  assert json.loads(manifest.read_text().split('=',1)[1].strip().rstrip(';'))==d
  assert gzip.decompress(target.read_bytes())==raw
 (folder/'verification.json').write_text(json.dumps({'status':'PASS','compiler':compiler,'resources':resources,'entrySha256':entry_sha,'descriptor':d,'theorems':data['theorems'],'graphs':len(data['cases']),'seedSelections':1099,'extras':6},indent=2)+'\n')
 print(json.dumps({'status':'PASS','theorems':6,'graphs':76,'seedSelections':1099,'extras':6,'descriptor':d}))
if __name__=='__main__':main()
