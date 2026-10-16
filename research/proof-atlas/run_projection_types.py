"""Native projection queries from existing projects or our own recursion fixture. No private rebuild."""
import argparse,hashlib,json,os,subprocess,tempfile
from pathlib import Path
from build_recursion_examples import run_checked
B=Path(__file__).parent
p=argparse.ArgumentParser();p.add_argument('--lean',required=True);p.add_argument('--request',type=Path,required=True);p.add_argument('--snapshot',type=Path);p.add_argument('--recursion',action='store_true');p.add_argument('--source-references',action='store_true');p.add_argument('--reserve-gib',type=int,default=30);a=p.parse_args();assert bool(a.snapshot)!=a.recursion
sha=lambda b:hashlib.sha256(b).hexdigest()
compiler=subprocess.check_output([a.lean,'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
folder=Path(tempfile.mkdtemp(prefix='atlas-projection-types-'));queries=json.loads(a.request.read_text());assert 0<len(queries)<=32
env=dict(os.environ);modules={};source_files={};dependency_roots={}
if a.snapshot:
 lean_path=(a.snapshot/'lean-env-path.txt').read_text().strip();env['LEAN_PATH']=lean_path
 manifest=(a.snapshot/'lake-manifest.json').read_bytes();packages={p['name']:p['rev'] for p in json.loads(manifest)['packages']};dependencies={}
 for part in lean_path.split(os.pathsep):
  lib=Path(part)
  if str(lib).endswith('/.lake/build/lib/lean') and lib.parents[3].name in packages:
   package=lib.parents[3];revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=package,text=True).strip();assert revision==packages[package.name];dependencies[package.name]=revision;dependency_roots[package]=revision
 assert 'mathlib' in dependencies
 environment={'kind':'existing-project-projection/1','compiler':compiler,'lakeManifestSha256':sha(manifest),'dependencyRevisions':dependencies,'sourceModules':modules}
 root=a.snapshot;compiled=root/'.lake/build/lib/lean';imports='import SE2Conjugate'
else:
 from recursion_fixture_source import SOURCE
 root=folder;source=root/'ProofAtlasExamples/Recursion.lean';source.parent.mkdir(parents=True);source.write_text(SOURCE);compiled=root
 env['LEAN_PATH']=str(root);run_checked([a.lean,'-o',str(source.with_suffix('.olean')),str(source)],root,'compile',env,a.reserve_gib)
 environment={'kind':'self-contained-lean/1','compiler':compiler,'module':'ProofAtlasExamples.Recursion','sourceSha256':sha(SOURCE.encode()),'compiledModuleSha256':sha(source.with_suffix('.olean').read_bytes()),'imports':['Lean'],'dependencyRevisions':{}}
 imports='import ProofAtlasExamples.Recursion'
for q in queries:
 assert len(q['routes'])<=512 and all(len(r['slots'])<=512 for r in q['routes'])
 raw=Path(q['packetFile']).read_bytes();assert sha(raw)==q['source']['indexSha256'];module=json.loads(raw)['declaration']['module'];source=root/Path(*module.split('.')).with_suffix('.lean');olean=compiled/Path(*module.split('.')).with_suffix('.olean')
 assert sha(source.read_bytes())==q['source']['sourceSha256'];source_files[module]=(source,olean);modules[module]={'sourceSha256':sha(source.read_bytes()),'compiledModuleSha256':sha(olean.read_bytes())}
core=(B/'ExportLibrary.lean').read_text().replace('import SE2Conjugate',imports)+'\nset_option maxHeartbeats 5000000\nset_option maxRecDepth 8192\n'+(B/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary','')
if a.source_references:core+='\n'+(B/'ExportSourceReferences.lean').read_text().replace('import ExportOccurrenceTypes','')
command='atlas_source_references' if a.source_references else 'atlas_occurrence_types'
output=folder/'types.json';entry=folder/'Queries.lean';entry.write_text(core+'\n#'+command+' '+json.dumps(str(a.request.resolve()))+' => '+json.dumps(str(output))+'\n')
run_checked([a.lean,str(entry)],folder,'native',env,a.reserve_gib)
for module,(source,olean) in source_files.items():assert sha(source.read_bytes())==modules[module]['sourceSha256'] and sha(olean.read_bytes())==modules[module]['compiledModuleSha256']
for package,rev in dependency_roots.items():assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=package,text=True).strip()==rev
if a.snapshot:assert sha((a.snapshot/'lake-manifest.json').read_bytes())==sha(manifest)
records=json.loads(output.read_text());assert all(r['nativeDagMatchesPacket'] for r in records)
for r in records:r.update(environment=environment,sourceModuleHashVerified=True,producerSha256=sha(core.encode()),requestSha256=sha(a.request.read_bytes()))
output.write_text(json.dumps(records,separators=(',',':')))
print(json.dumps({'status':'EXTRACTED','output':str(output),'declarations':len(records),'queries':sum(len(r['entries']) for r in records),'checkedProjections':sum(e.get('projectionJudgment',{}).get('status')=='checked' or e.get('format')=='ProofAtlasSourceReferences/2' for r in records for e in r['entries'])}))
