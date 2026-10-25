"""Native method-interface extraction; checking binaries only, bounded resources.

Private Riccati source and tactic scripts are never copied into public output.
The existing privately compiled modules are rehashed against their earlier
verification. Dependency attribution is a cache claim, not a source rebuild.
"""
import argparse, gzip, hashlib, importlib.util, json, os, sys
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
    p.add_argument('--workdir', type=Path, required=True)
    p.add_argument('--cache', type=Path, required=True)
    p.add_argument('--riccati-build', type=Path, required=True)
    p.add_argument('--lean', type=Path, required=True)
    args = p.parse_args()
    folder = args.workdir.resolve(); folder.mkdir(parents=True, exist_ok=False)
    lean = args.lean.resolve()
    import subprocess
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    spec = importlib.util.spec_from_file_location('site_recovery', RESEARCH/'use-sites/verify.py')
    recovery = importlib.util.module_from_spec(spec); spec.loader.exec_module(recovery)
    paths, dependencies = recovery.recovered(args.cache.resolve())
    private = args.riccati_build.resolve()
    previous = json.loads((private/'riccati-verification.json').read_text())
    for name, row in previous['sourceModules'].items():
        file = private/Path(*name.split('.'))
        assert sha(file.with_suffix('.lean').read_bytes()) == row['sourceSha256']
        assert sha(file.with_suffix('.olean').read_bytes()) == row['compiledModuleSha256']
    paths = [private] + paths
    plan = json.loads(subprocess.check_output(['node', str(BASE/'prepare.cjs')], cwd=ROOT))
    (folder/'plan.json').write_text(json.dumps(plan))
    producer = [BASE/'BranchInterfaces.lean', BASE/'Controls.lean', BASE/'prepare.cjs', BASE/'verify.py', RESEARCH/'ExportLibrary.lean', RESEARCH/'ExportOccurrenceTypes.lean']
    source_hashes = {str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in producer}
    core = (RESEARCH/'ExportLibrary.lean').read_text().replace('import SE2Conjugate', 'import SE2Conjugate.Riccati')
    core += '\n' + (RESEARCH/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary', '')
    core += '\n' + (BASE/'BranchInterfaces.lean').read_text() + '\n' + (BASE/'Controls.lean').read_text()
    export = '''
run_cmd do
 for name in [``AtlasMethodControls.disjunction,``AtlasMethodControls.conjunction,
              ``AtlasMethodControls.dependent,``AtlasMethodControls.functionValued,``AtlasMethodControls.storedMethod] do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "Control body unavailable"
  liftTermElabM fun _ => AtlasOccurrenceTypes.kernelAs value info.type
  let (t,s) := AtlasLibrary.intern info.type {}
  let (v,s) := AtlasLibrary.intern value s
  let packet := Json.mkObj [("declaration",Json.mkObj [("name",toJson name.toString),
   ("kernelCheck",toJson "PASS"),("module",toJson (← getMainModule).toString),("rootPaths",toJson #["root.type","root.value"])]),
   ("serialization",toJson "ExprDAG/1"),("roots",toJson #[t,v])]
  let packet := packet.mergeObj (AtlasOccurrenceTypes.graphJson s)
  liftIO <| IO.FS.writeFile ("FOLDER/" ++ name.toString ++ ".json") packet.compress
'''.replace('FOLDER', str(folder))
    # Json object merging is explicit so packet bytes are checked in the next run.
    runtime = folder/'Runtime.lean'; runtime.write_text(core+'\n'+export)
    (folder/'scratch').mkdir()
    env = {'PATH': str(lean.parent)+':/usr/bin:/bin', 'LEAN_PATH': os.pathsep.join(map(str,paths)), 'LANG':'en_US.UTF-8', 'TMPDIR':str(folder/'scratch')}
    command = ['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,paths),str(lean),str(runtime)]
    run_checked(command, folder, 'compile-controls', env, timeout=120)
    record = plan['record']; raw = gzip.decompress((ROOT/record['indexFile'].lstrip('/')).read_bytes())
    assert sha(raw) == record['indexSha256']
    packet = folder/'riccati.json'; packet.write_bytes(raw)
    requests = [{'packetFile':str(packet),'source':{k:record[k] for k in ['name','indexSha256','sourceSha256']}|{'edition':'published-15'},'routes':plan['routes']}]
    control_records=[]
    control_sha=sha((BASE/'Controls.lean').read_bytes())
    for file in sorted(folder.glob('AtlasMethodControls.*.json')):
        data=json.loads(file.read_text()); name=data['declaration']['name']
        slots=[]; node=data['roots'][1]
        while data['kind'][node] in [6,8]:
            slot=1 if data['kind'][node]==6 else 2
            slots.append(slot);node=data['children'][node][slot]
        data['declaration']['sourceSha256']=control_sha
        file.write_text(json.dumps(data,separators=(',',':')))
        r={'name':name,'sourceSha256':control_sha,'indexSha256':sha(file.read_bytes()),'uniqueNodes':len(data['kind']),
           'occurrences':str(sum(int(data['expanded'][r]) for r in data['roots'])),'module':data['declaration']['module'],'kind':'def'}
        control_records.append(r)
        requests.append({'packetFile':str(file),'source':{k:r[k] for k in ['name','indexSha256','sourceSha256']}|{'edition':'branch-method-controls'},'routes':[{'root':1,'slots':slots}]})
    (folder/'requests.json').write_text(json.dumps(requests))
    (folder/'controls.json').write_text(json.dumps(control_records))
    output=folder/'native.json'
    runtime.write_text(core+'\n#atlas_branch_interfaces '+json.dumps(str(folder/'requests.json'))+' => '+json.dumps(str(output))+'\n')
    run_checked(command, folder, 'branch-interfaces', env, timeout=120)
    results=json.loads(output.read_text())
    assert len(results)==len(requests)==6
    for result,request in zip(results,requests):
        assert result['source']==request['source'] and result['nativeDagMatchesPacket'] is True
        record=plan['record'] if result['source']['edition']=='published-15' else next(r for r in control_records if r['name']==result['name'])
        assert result['nativeDeclarationModule']==record['module']
        if result['source']['edition']=='branch-method-controls': assert result['nativeDeclarationModule']==result['nativeMainModule']
        assert [e['parent']['route'] for e in result['entries']]==request['routes']
    assert source_hashes=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in producer}
    verification={'status':'PASS','compiler':compiler,'dependencyRecovery':dependencies,'sourceModules':previous['sourceModules'],
       'producerFiles':source_hashes,'runtimeSha256':sha(runtime.read_bytes()),'nativeOutputSha256':sha(output.read_bytes()),
       'profiles':len(results),'queries':sum(len(r['entries']) for r in results),'interfaces':sum(len(e['branches']) for r in results for e in r['entries']),
       'originalPrivateSourcePublished':False,'originalRiccatiModulesRecompiledThisRun':False}
    (folder/'verification.json').write_text(json.dumps(verification,indent=2)+'\n')
    print(json.dumps({k:verification[k] for k in ['status','profiles','queries','interfaces']}),flush=True)

if __name__=='__main__':main()
