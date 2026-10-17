"""Fresh core-Lean theory checks and own compiled implementation-bridge fixtures."""
import argparse, gzip, hashlib, json, os, shutil, subprocess, sys
from pathlib import Path
BASE=Path(__file__).resolve().parent
RESEARCH=BASE.parent
ROOT=RESEARCH.parents[1]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(data): return hashlib.sha256(data).hexdigest()

def runtime():
    core=(RESEARCH/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','')
    theory=(BASE/'Projection.lean').read_text().replace('import Lean\n','',1)
    return core+'\n'+theory+'\n'+(BASE/'Fixtures.lean').read_text()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean',type=Path,required=True)
    parser.add_argument('--workdir',type=Path,required=True)
    parser.add_argument('--publish',action='store_true')
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args();assert not(args.publish and args.check)
    lean=args.lean.resolve();version=subprocess.check_output([str(lean),'--version'],text=True).strip()
    assert 'version 4.33.1,'in version
    folder=args.workdir.resolve();folder.mkdir(exist_ok=False)
    assert shutil.disk_usage(folder).free>=30*1024**3
    (folder/'scratch').mkdir()
    output=folder/'theory.json';entry=folder/'Theory.lean';stable=runtime()
    entry.write_text(stable+'\n#atlas_projection_theory '+json.dumps(str(output))+'\n')
    entry_sha=sha(entry.read_bytes());driver_sha=sha(Path(__file__).read_bytes())
    env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':str(folder),
         'TMPDIR':str(folder/'scratch'),'LANG':'en_US.UTF-8'}
    command=[str(lean),str(entry)]
    if sys.platform=='darwin':command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[]),*command]
    resources=run_checked(command,folder,'native',env,30,120)
    assert runtime()==stable and sha(entry.read_bytes())==entry_sha and sha(Path(__file__).read_bytes())==driver_sha
    data=json.loads(output.read_text());assert data['format']=='ProofAtlasProjectionTheory/1'
    assert len(data['theorems'])==7 and len(data['rows'])==713
    for row in data['theorems']:
        assert set(row['axioms'])<={'propext','Quot.sound'}
        assert all(row[k]=='PASS'for k in ['kernelType','kernelProof','kernelExpectedTypeConversion'])
    data['producer']={'runtimeSha256':sha(stable.encode()),'driverSha256':driver_sha,
                      'sourceFiles':{str(p.relative_to(ROOT)):sha(p.read_bytes())for p in [BASE/'Projection.lean',BASE/'Fixtures.lean',BASE/'verify.py',RESEARCH/'ExportLibrary.lean']}}
    raw=json.dumps(data,separators=(',',':'),ensure_ascii=False).encode();assert len(raw)<=8*1024**2
    digest=sha(raw);file='/public/data/proof-atlas/projection-theory/'+digest+'.json.gz'
    descriptor={'format':'ProofAtlasProjectionTheoryDescriptor/1','file':file,'sha256':digest,'decodedBytes':len(raw)}
    target=ROOT/file.lstrip('/');manifest=ROOT/'public/data/proof-atlas/projection-theory-manifest.js'
    if args.publish:
        target.parent.mkdir(exist_ok=True)
        if target.exists():assert gzip.decompress(target.read_bytes())==raw
        else:target.write_bytes(gzip.compress(raw,mtime=0))
        manifest.write_text('window.PROOF_ATLAS_PROJECTION_THEORY='+json.dumps(descriptor,separators=(',',':'))+';\n')
    if args.check:
        frozen=json.loads(manifest.read_text().split('=',1)[1].strip().rstrip(';'))
        assert descriptor==frozen and gzip.decompress(target.read_bytes())==raw
    (folder/'verification.json').write_text(json.dumps({'status':'PASS','compiler':version,
      'runtimeSha256':sha(stable.encode()),'entrySha256':entry_sha,'outputSha256':sha(output.read_bytes()),
      'descriptor':descriptor,'resources':resources,'theorems':data['theorems'],'fixtureRows':len(data['rows'])},indent=2)+'\n')
    print(json.dumps({'status':'PASS','theorems':7,'fixtureRows':len(data['rows']),'descriptor':descriptor}))

if __name__=='__main__':main()
