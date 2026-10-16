"""Extract compiled constructor metadata from an existing environment; never rebuild private projects."""
import argparse, hashlib, json, os, subprocess, tempfile
from pathlib import Path
from build_recursion_examples import run_checked
BASE=Path(__file__).parent
parser=argparse.ArgumentParser()
parser.add_argument('--lean',required=True)
parser.add_argument('--request',type=Path,required=True)
parser.add_argument('--snapshot',type=Path)
parser.add_argument('--root-module',default='SE2Conjugate')
parser.add_argument('--recursion',action='store_true')
parser.add_argument('--ai-evaluation',type=Path)
parser.add_argument('--reserve-gib',type=int,default=30)
a=parser.parse_args();assert a.reserve_gib>=1
compiler=subprocess.check_output([a.lean,'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
folder=Path(tempfile.mkdtemp(prefix='atlas-constructor-catalogue-'));output=folder/'catalogue.json'
request=json.loads(a.request.read_text());env=dict(os.environ)
core=(BASE/'ExportLibrary.lean').read_text()
assert all(part.isidentifier() for part in a.root_module.split('.'))
imports=['Lean'];environment={'compiler':compiler,'kind':'core-only/1'}
if a.snapshot:
 path=(a.snapshot/'lean-env-path.txt').read_text().strip();env['LEAN_PATH']=path;imports.append(a.root_module);core=core.replace('import SE2Conjugate','import '+a.root_module)
 manifest=(a.snapshot/'lake-manifest.json').read_bytes();packages={p['name']:p['rev'] for p in json.loads(manifest)['packages']};dependencies={}
 for part in path.split(os.pathsep):
  p=Path(part)
  if str(p).endswith('/.lake/build/lib/lean'):
   package=p.parents[3]
   if package.name in packages:
    rev=subprocess.check_output(['git','rev-parse','HEAD'],cwd=package,text=True).strip();assert rev==packages[package.name];dependencies[package.name]=rev
 assert 'mathlib' in dependencies
 modules={}
 for record in request['sources']:
  name=record['module'];root=a.ai_evaluation or a.snapshot
  source=root/Path(*name.split('.')).with_suffix('.lean')
  compiled=(root if a.ai_evaluation else root/'.lake/build/lib/lean')/Path(*name.split('.')).with_suffix('.olean')
  assert hashlib.sha256(source.read_bytes()).hexdigest()==record['sourceSha256'],'Source module changed: '+name
  if name not in modules:modules[name]={'sourceSha256':record['sourceSha256'],'compiledModuleSha256':hashlib.sha256(compiled.read_bytes()).hexdigest()}
 environment['sourceModules']=modules
 if a.ai_evaluation:
  evaluation=json.loads((a.ai_evaluation/'evaluation.json').read_text());assert evaluation['environment']['dependencyRevisions']==dependencies
  for name,m in modules.items():
   original=next(r for r in evaluation['results'] if r['module']==name)
   assert original['sourceSha256']==m['sourceSha256'] and original['compiledModuleSha256']==m['compiledModuleSha256']
  env['LEAN_PATH']=str(a.ai_evaluation)+os.pathsep+path;imports=['Lean']+sorted(modules)
  core=core.replace('import '+a.root_module,'\n'.join('import '+m for m in sorted(modules)))
 environment.update(kind='existing-project-environment/1',lakeManifestSha256=hashlib.sha256(manifest).hexdigest(),dependencyRevisions=dependencies)
else:
 core=core.replace('import SE2Conjugate','')
 if a.recursion:
  from recursion_fixture_source import SOURCE
  core+='\n'+SOURCE.replace('import Lean','')
  environment.update(kind='self-contained-recursion/1',fixtureSha256=hashlib.sha256(SOURCE.encode()).hexdigest())
exporter=(BASE/'ExportConstructorCatalogue.lean').read_text().replace('import ExportLibrary','')
stable=core+'\nset_option maxHeartbeats 5000000\nset_option maxRecDepth 8192\n'+exporter
entry=folder/'Catalogue.lean';entry.write_text(stable+'\n#atlas_constructor_catalogue '+json.dumps(str(a.request.resolve()))+' => '+json.dumps(str(output))+'\n')
run_checked([a.lean,str(entry)],folder,'native',env,a.reserve_gib)
if a.snapshot:
 for name,m in environment['sourceModules'].items():
  root=a.ai_evaluation or a.snapshot
  source=root/Path(*name.split('.')).with_suffix('.lean')
  compiled=(root if a.ai_evaluation else root/'.lake/build/lib/lean')/Path(*name.split('.')).with_suffix('.olean')
  assert hashlib.sha256(source.read_bytes()).hexdigest()==m['sourceSha256']
  assert hashlib.sha256(compiled.read_bytes()).hexdigest()==m['compiledModuleSha256']
x=json.loads(output.read_text());x.update(environment=environment,imports=imports,producerSha256=hashlib.sha256(stable.encode()).hexdigest(),requestSha256=hashlib.sha256(a.request.read_bytes()).hexdigest())
output.write_text(json.dumps(x,separators=(',',':'),ensure_ascii=False))
print(json.dumps({'output':str(output),'edition':x['edition'],'inventory':x['inventory'],'graphNodes':len(x['graph']['kind'])}))
