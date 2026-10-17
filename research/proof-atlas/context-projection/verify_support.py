"""Fresh core-Lean support laws and compiled scope-summary comparisons."""
import argparse,gzip,json,os,shutil,subprocess,sys
from pathlib import Path
from verify import BASE,RESEARCH,ROOT,sha,run_checked,sandbox_profile

FILES=[RESEARCH/'ExportLibrary.lean',BASE/'Projection.lean',BASE/'Fixtures.lean',BASE/'Support.lean',BASE/'SupportFixtures.lean',BASE/'verify_support.py',BASE/'verify.py']
def runtime():
    core=(RESEARCH/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','')
    theory=(BASE/'Projection.lean').read_text().replace('import Lean\n','',1)
    return core+'\n'+theory+'\n'+(BASE/'Support.lean').read_text()+'\n'+(BASE/'Fixtures.lean').read_text()+'\n'+(BASE/'SupportFixtures.lean').read_text()

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--lean',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);p.add_argument('--publish',action='store_true');p.add_argument('--check',action='store_true');a=p.parse_args();assert not(a.publish and a.check)
    lean=a.lean.resolve();compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,'in compiler
    folder=a.workdir.resolve();folder.mkdir(exist_ok=False);(folder/'scratch').mkdir();assert shutil.disk_usage(folder).free>=30*1024**3
    output=folder/'support.json';entry=folder/'Support.lean';stable=runtime();entry.write_text(stable+'\n#atlas_projection_support '+json.dumps(str(output))+'\n');entry_sha=sha(entry.read_bytes());driver_sha=sha(Path(__file__).read_bytes())
    env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':str(folder),'TMPDIR':str(folder/'scratch'),'LANG':'en_US.UTF-8'}
    cmd=[str(lean),str(entry)]
    if sys.platform=='darwin':cmd=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[]),*cmd]
    resources=run_checked(cmd,folder,'native',env,30,120)
    assert runtime()==stable and sha(entry.read_bytes())==entry_sha and sha(Path(__file__).read_bytes())==driver_sha
    data=json.loads(output.read_text());assert data['format']=='ProofAtlasProjectionSupport/1'and len(data['theorems'])==4 and len(data['cases'])==115 and len(data['extras'])==5
    for t in data['theorems']:
        assert set(t['axioms'])<={'propext','Quot.sound','Classical.choice'}
        assert all(t[k]=='PASS'for k in ['kernelType','kernelProof','kernelExpectedTypeConversion'])
    data['producer']={'runtimeSha256':sha(stable.encode()),'driverSha256':driver_sha,'sourceFiles':{str(f.relative_to(ROOT)):sha(f.read_bytes())for f in FILES}}
    raw=json.dumps(data,separators=(',',':'),ensure_ascii=False).encode();assert len(raw)<=8*1024**2
    digest=sha(raw);file='/public/data/proof-atlas/projection-support/'+digest+'.json.gz';d={'format':'ProofAtlasProjectionSupportDescriptor/1','file':file,'sha256':digest,'decodedBytes':len(raw)}
    target=ROOT/file.lstrip('/');manifest=ROOT/'public/data/proof-atlas/projection-support-manifest.js'
    if a.publish:
        target.parent.mkdir(exist_ok=True)
        if target.exists():assert gzip.decompress(target.read_bytes())==raw
        else:target.write_bytes(gzip.compress(raw,mtime=0))
        manifest.write_text('window.PROOF_ATLAS_PROJECTION_SUPPORT='+json.dumps(d,separators=(',',':'))+';\n')
    if a.check:
        assert json.loads(manifest.read_text().split('=',1)[1].strip().rstrip(';'))==d
        assert gzip.decompress(target.read_bytes())==raw
    (folder/'verification.json').write_text(json.dumps({'status':'PASS','compiler':compiler,'resources':resources,'entrySha256':entry_sha,'outputSha256':sha(output.read_bytes()),'descriptor':d,'theorems':data['theorems']},indent=2)+'\n')
    print(json.dumps({'status':'PASS','theorems':4,'sourceCases':115,'extras':5,'descriptor':d}))
if __name__=='__main__':main()
