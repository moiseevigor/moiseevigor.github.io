"""Compile the explicit-adapter region experiment against core Lean only."""
import argparse, hashlib, importlib.util, json, os, subprocess, sys
from pathlib import Path
BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = RESEARCH.parents[1]
sys.path.insert(0, str(RESEARCH))
from build_recursion_examples import run_checked

def sha(b):
    return hashlib.sha256(b).hexdigest()

def runtime():
    spec = importlib.util.spec_from_file_location('region_input_packet', RESEARCH / 'packet-typing/verify.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.runtime().replace('import Mathlib\nimport Aesop','import Lean') + '\n' + \
        (RESEARCH / 'region-native-types/KernelQueries.lean').read_text().split('def observe (')[0] + \
        '\nend AtlasRegionKernel\n' + (BASE / 'Native.lean').read_text()

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--lean',type=Path,required=True)
    p.add_argument('--workdir',type=Path,required=True)
    a=p.parse_args();lean=a.lean.resolve();folder=a.workdir.resolve()
    compiler=subprocess.check_output([str(lean),'--version'],text=True).strip()
    assert 'version 4.33.1,' in compiler
    folder.mkdir(exist_ok=False);(folder/'scratch').mkdir()
    stable=runtime();(folder/'Check.lean').write_text(stable)
    env=dict(os.environ,TMPDIR=str(folder/'scratch'),LEAN_PATH=str(folder))
    libraries=lean.parents[1]/'lib/lean'
    commands=[[str(lean),'-j1','-M4096','-c','Check.c','Check.lean'],
        [str(lean.parent/'leanc'),'-O0','-c','Check.c','-o','Check.o','-mmacosx-version-min=11.0'],
        ['/usr/bin/clang','-o','checker','Check.o','-L'+str(libraries),'-lInit_shared','-lleanshared','-Wl,-rpath,'+str(libraries),'-mmacosx-version-min=11.0']]
    resources=[run_checked(cmd,folder,'build-'+str(i),env,30,120) for i,cmd in enumerate(commands)]
    assert stable==runtime()
    report={'format':'ProofAtlasRegionInputAdapterBuild/1','status':'PASS','compiler':compiler,
        'runtimeSha256':sha(stable.encode()),'leanExecutableSha256':sha(lean.read_bytes()),
        'executableSha256':sha((folder/'checker').read_bytes()),'resources':resources,
        'libraries':{name:sha((libraries/name).read_bytes()) for name in
            ['libInit_shared.dylib','libleanshared.dylib','libleanshared_1.dylib','libleanshared_2.dylib']}}
    (folder/'build.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))
if __name__=='__main__':main()
