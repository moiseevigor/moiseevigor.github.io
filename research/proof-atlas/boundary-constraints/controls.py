"""Fresh core-only controls for earlier-input assignments and source recovery."""
import argparse, gzip, hashlib, importlib.util, json, os, shutil, sys
from pathlib import Path
BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = RESEARCH.parents[1]
sys.path.insert(0, str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(raw): return hashlib.sha256(raw).hexdigest()

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--lean', type=Path, required=True)
    p.add_argument('--workdir', type=Path, required=True)
    p.add_argument('--publish', action='store_true')
    a = p.parse_args()
    lean, folder = a.lean.resolve(), a.workdir.resolve()
    folder.mkdir(exist_ok=False); (folder/'scratch').mkdir()
    assert shutil.disk_usage(folder).free >= 30*1024**3
    spec = importlib.util.spec_from_file_location('boundary_build', BASE/'build.py')
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    stable = module.runtime()
    files = [BASE/n for n in ['controls.py','Controls.lean','Native.lean','Solver.lean','build.py']]
    files += [RESEARCH/'region-input-functions/Native.lean', RESEARCH/'region-native-types/KernelQueries.lean']
    fingerprints = {str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
    output = folder/'controls.json'
    entry = folder/'Controls.lean'
    entry.write_text(stable+'\n'+(BASE/'Controls.lean').read_text()+
        '\nrun_cmd do\n let env ← getEnv\n let result ← liftIO <| AtlasBoundaryControls.run env\n liftIO <| IO.FS.writeFile '+json.dumps(str(output))+' result.compress\n')
    env = {'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':str(folder),'TMPDIR':str(folder/'scratch'),'LANG':'en_US.UTF-8'}
    resource = run_checked(['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[]),str(lean),'-j1','-M4096',str(entry)],folder,'controls',env,30,120)
    raw = output.read_bytes(); data = json.loads(raw)
    assert data['status']=='PASS' and len(data['records'])==9
    assert sum(r['accepted'] for r in data['records'])==2
    assert stable==module.runtime() and fingerprints=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
    report = {'format':'ProofAtlasBoundaryConstraintControlVerification/1','status':'PASS',
        'producerFiles':fingerprints,'runtimeSha256':sha(stable.encode()),'nativeSha256':sha(raw),
        'leanExecutableSha256':sha(lean.read_bytes()),'resource':resource,'imports':['Lean'],
        'accepted':2,'refusals':7,'privateSourcesRead':False,
        'scope':'Authored assignment/scope/source-specialization controls, including two equally typed function families that agree at one original argument but are not definitionally equal. No general preservation or corpus claim.'}
    (folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
    if a.publish:
        (BASE/'controls.json.gz').write_bytes(gzip.compress(raw,mtime=0))
        (BASE/'control-verification.json.gz').write_bytes(gzip.compress((json.dumps(report,indent=2)+'\n').encode(),mtime=0))
    print(json.dumps({'status':'PASS','accepted':2,'refusals':7}))

if __name__=='__main__': main()
