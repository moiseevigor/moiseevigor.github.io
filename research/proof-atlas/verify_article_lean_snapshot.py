"""Rebuild and inspect the published private Lean snapshot without changing that checkout.

Requires access to the research repository and its matching Mathlib dependency cache.
The public projection is an audit record, not a standalone proof certificate.
"""
import argparse,json,os,subprocess,tempfile,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
def audit(repository,lean,output):
 cfg=json.loads((ROOT/'research/proof-atlas/article-coverage-map.json').read_text());rev=cfg['researchRevision']
 output.mkdir(parents=True,exist_ok=True);prefix='lean/SE2Conjugate/'
 paths=subprocess.check_output(['git','ls-tree','-r','--name-only',rev,prefix],cwd=repository,text=True).splitlines()
 for path in paths:
  if path.endswith('.lean')or path.endswith(('lean-toolchain','lake-manifest.json')):
   p=output/path.removeprefix(prefix);p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(subprocess.check_output(['git','show',rev+':'+path],cwd=repository))
 packages=repository/'lean/SE2Conjugate/.lake/packages'
 mathlib=subprocess.check_output(['git','rev-parse','HEAD'],cwd=packages/'mathlib',text=True).strip()
 assert mathlib=='0df444a360eaa60ab8c11dca51a86af692955474','Mathlib cache revision does not match the article snapshot'
 version=subprocess.check_output([str(lean),'--version'],text=True);assert 'version 4.33.1'in version
 built=output/'.lake/build/lib/lean';built.mkdir(parents=True,exist_ok=True)
 env=os.environ.copy();env['LEAN_PATH']=':'.join([str(built)]+[str(p/'.lake/build/lib/lean')for p in packages.iterdir()if(p/'.lake/build/lib/lean').exists()])
 modules={p.stem:p for p in(output/'SE2Conjugate').glob('*.lean')};assert len(modules)==15
 completed=set();log=[];start=time.monotonic()
 def compile(name):
  if name in completed:return
  source=modules[name]
  for line in source.read_text().splitlines():
   if line.startswith('import SE2Conjugate.'):compile(line.split('.')[-1])
  target=built/'SE2Conjugate'/(name+'.olean');target.parent.mkdir(parents=True,exist_ok=True)
  r=subprocess.run([str(lean),'-o',str(target),str(source)],cwd=output,env=env,text=True,capture_output=True)
  log.append({'module':name,'exitCode':r.returncode,'output':r.stdout+r.stderr});print(name,'PASS'if not r.returncode else'FAIL',flush=True)
  assert not r.returncode,r.stdout+r.stderr;completed.add(name)
 for name in modules:compile(name)
 (output/'build-audit.json').write_text(json.dumps({'elapsedSeconds':round(time.monotonic()-start,2),'modules':log},indent=2))
 r=subprocess.run([str(lean),'-o',str(built/'SE2Conjugate.olean'),'SE2Conjugate.lean'],cwd=output,env=env,text=True,capture_output=True);assert not r.returncode,r.stdout+r.stderr
 names=sorted({d['name']for row in cfg['statements']for d in row['declarations']}|{d['name']for d in cfg['supportDeclarations']})
 (output/'CheckCoverage.lean').write_text('import SE2Conjugate\n'+''.join('#check '+n+'\n#print axioms '+n+'\n'for n in names))
 r=subprocess.run([str(lean),'CheckCoverage.lean'],cwd=output,env=env,text=True,capture_output=True);assert not r.returncode,r.stdout+r.stderr
 (output/'coverage-check.log').write_text(r.stdout+r.stderr);print(json.dumps({'status':'PASS','modules':15,'declarations':len(names),'output':str(output)}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--repository',type=Path,required=True);p.add_argument('--lean',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();audit(a.repository,a.lean,a.output)
