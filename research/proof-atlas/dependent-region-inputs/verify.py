"""Core-only calibration of dependent region input domains; no private sources."""
import argparse, gzip, hashlib, importlib.util, json, os, shutil, subprocess, sys
from pathlib import Path
BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = RESEARCH.parents[1]
sys.path.insert(0, str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def module(name, file):
    spec = importlib.util.spec_from_file_location(name, file)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded

def write(file, value):
    file.write_text(json.dumps(value, indent=2) + '\n')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    parser.add_argument('--publish', action='store_true')
    args = parser.parse_args()
    lean, folder = args.lean.resolve(), args.workdir.resolve()
    folder.mkdir(exist_ok=False)
    (folder / 'scratch').mkdir()
    assert shutil.disk_usage(folder).free >= 30 * 1024**3
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    core = lean.parents[1] / 'lib/lean'
    data = {str(file.relative_to(core)): sha(file.read_bytes()) for file in sorted(core.rglob('*.olean*')) if file.is_file()}
    assert data and not any('Mathlib' in name or 'SE2Conjugate' in name for name in data)
    libraries = {name: sha((core / name).read_bytes()) for name in ['libInit_shared.dylib', 'libleanshared.dylib', 'libleanshared_1.dylib', 'libleanshared_2.dylib']}
    sources = [BASE / 'Controls.lean', BASE / 'verify.py', BASE / 'prepare.cjs', BASE / 'observer.py',
        RESEARCH / 'region-input-functions/Native.lean', RESEARCH / 'region-input-functions/build.py',
        RESEARCH / 'region-native-types/KernelQueries.lean', RESEARCH / 'application-ports/Ports.lean',
        RESEARCH / 'application-ports/prepare.cjs', RESEARCH / 'construction-composition/prepare.cjs',
        RESEARCH / 'packet-typing/verify.py', RESEARCH / 'packet-typing/PacketTyping.lean',
        RESEARCH / 'ExportLibrary.lean', RESEARCH / 'ExportOccurrenceTypes.lean',
        RESEARCH / 'LevelTransportControls.lean', RESEARCH / 'compiled-replay/Replay.lean',
        RESEARCH / 'region-input-functions/model.cjs', RESEARCH / 'method-context/catalogue.cjs']
    sources += [ROOT / ('public/js/proof-atlas-' + name + '.js') for name in
        ['library-data', 'occurrence-types', 'equality-transport', 'construction-composition', 'application-ports']]
    producer_files = {str(file.relative_to(ROOT)): sha(file.read_bytes()) for file in sources}
    runtime = module('dependent_packet_runtime', RESEARCH / 'packet-typing/verify.py').runtime().replace('import Mathlib\nimport Aesop', 'import Lean')
    env = {'PATH': str(lean.parent) + ':/usr/bin:/bin', 'LEAN_PATH': str(folder), 'LANG': 'en_US.UTF-8', 'TMPDIR': str(folder / 'scratch')}
    sandbox = sandbox_profile(lean, folder, [])
    resources = []
    def run(name, source):
        file = folder / (name + '.lean')
        file.write_text(source)
        resources.append({'phase': name, 'runtimeSha256': sha(file.read_bytes()),
            'resource': run_checked(['/usr/bin/sandbox-exec', '-p', sandbox, str(lean), '-j1', '-M4096', str(file)], folder, name, env, 30, 120)})
    packets = folder / 'packets'
    packets.mkdir()
    names = ['finSuccessor', 'finConstructor', 'proofAfter', 'proofDiamond']
    export = '''
run_cmd do
 for (name,file) in #[ITEMS] do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "Control body absent"
  liftTermElabM fun _ => AtlasOccurrenceTypes.kernelAs value info.type
  let axioms ← collectAxioms name
  unless !(axioms.contains ``sorryAx) do throwError "Unexpected admitted axiom"
  let (t,s) := AtlasLibrary.intern info.type {}
  let (v,s) := AtlasLibrary.intern value s
  let kind := match info with | .thmInfo _ => "theorem" | _ => "definition"
  let packet := Json.mkObj [("serialization",toJson "ExprDAG/1"),("roots",toJson #[t,v]),("declaration",Json.mkObj [("name",toJson name.toString),("kind",toJson kind),("kernelCheck",toJson "PASS"),("module",toJson "AtlasDependentControls"),("axioms",toJson (axioms.map Name.toString)),("rootPaths",toJson #["root.type","root.value"])])]
  liftIO <| IO.FS.writeFile file (packet.mergeObj (AtlasOccurrenceTypes.graphJson s)).compress
'''.replace('ITEMS', ','.join('(``AtlasDependentRegion.' + name + ',' + json.dumps(str(packets / (name + '.json'))) + ')' for name in names))
    run('Export', runtime + '\n' + (BASE / 'Controls.lean').read_text() + '\n' + export)
    subprocess.check_call(['node', str(BASE / 'prepare.cjs'), str(folder)], cwd=ROOT)
    run('LegacyPorts', runtime + '\n' + (RESEARCH / 'application-ports/Ports.lean').read_text() +
        '\n#atlas_application_ports ' + json.dumps(str(folder / 'port-requests.json')) + ' => ' + json.dumps(str(folder / 'legacy-ports.json')) + '\n')
    legacy = json.loads((folder / 'legacy-ports.json').read_bytes())
    assert [len(row['refusals']) for row in legacy] == [1, 1, 1, 2]
    assert all(row['kernelClosedTermTyping'] == 'PASS' for row in legacy)
    observer = module('dependent_zeta_observer', BASE / 'observer.py').refine((RESEARCH / 'application-ports/Ports.lean').read_text())
    run('Ports', runtime + '\n' + observer +
        '\n#atlas_application_ports ' + json.dumps(str(folder / 'port-requests.json')) + ' => ' + json.dumps(str(folder / 'ports.json')) + '\n')
    subprocess.check_call(['node', str(BASE / 'prepare.cjs'), str(folder), '--ports'], cwd=ROOT)
    subprocess.check_call([sys.executable, str(RESEARCH / 'region-input-functions/build.py'), '--lean', str(lean), '--workdir', str(folder / 'build')], cwd=ROOT, stdout=subprocess.DEVNULL)
    build = json.loads((folder / 'build/build.json').read_bytes())
    executable = folder / 'build/checker'
    assert build['executableSha256'] == sha(executable.read_bytes())
    profile = sandbox_profile(lean, folder, []).replace('(literal ' + json.dumps(str(lean)) + ')', '(literal ' + json.dumps(str(executable)) + ')', 1)
    env['LEAN_PATH'] = os.pathsep.join([str(folder / 'build'), str(folder)])
    plan = json.loads((folder / 'region-plan.json').read_bytes())
    profiles = []
    for i, entry in enumerate(plan['profiles']):
        request = Path(entry['requestFile'])
        assert sha(request.read_bytes()) == entry['requestSha256']
        output = folder / ('region-native-' + str(i) + '.json')
        resources.append({'phase': 'Region-' + str(i), 'requestSha256': entry['requestSha256'],
            'resource': run_checked(['/usr/bin/sandbox-exec', '-p', profile, str(executable), str(lean.parents[1]), str(request), str(output)], folder, 'Region-' + str(i), env, 30, 120)})
        result = json.loads(output.read_bytes())
        assert result['closedOriginalTyping'] == 'PASS' and result['source'] == entry['source']
        assert [case['policy'] for case in result['cases']] == entry['policies']
        profiles.append({key: value for key, value in entry.items() if key not in ['requestFile', 'requestSha256', 'packetFile']} | {'native': result})
        print(json.dumps({'source': entry['source']['name'], 'cases': [{key: case[key] for key in ['policy', 'status', 'phase', 'call', 'slot', 'independentInputs', 'keptContextSlots'] if key in case} for case in result['cases']]}), flush=True)
    assert data == {str(file.relative_to(core)): sha(file.read_bytes()) for file in sorted(core.rglob('*.olean*')) if file.is_file()}
    assert libraries == {name: sha((core / name).read_bytes()) for name in libraries}
    assert producer_files == {str(file.relative_to(ROOT)): sha(file.read_bytes()) for file in sources}
    native = {'format': 'ProofAtlasDependentRegionInputs/1', 'profiles': profiles}
    raw = (json.dumps(native, separators=(',', ':'), ensure_ascii=False) + '\n').encode()
    report = {'format': 'ProofAtlasDependentRegionVerification/1', 'status': 'PASS', 'compiler': compiler,
        'leanExecutableSha256': sha(lean.read_bytes()), 'producerFiles': producer_files,
        'nativeSha256': sha(raw), 'build': build, 'resources': resources, 'libraries': libraries,
        'coreDataFiles': len(data), 'coreDataInventorySha256': sha(json.dumps(data, sort_keys=True, separators=(',', ':')).encode()),
        'coreDataVerifiedBeforeAfter': True, 'imports': ['Lean'], 'dependencyArchivesRestored': False,
        'legacyPortRefusals': sum(len(row['refusals']) for row in legacy),
        'legacyPortsSha256': sha((folder / 'legacy-ports.json').read_bytes()),
        'refinedPortsSha256': sha((folder / 'ports.json').read_bytes()),
        'originalPrivateSourcesRead': False, 'originalPrivateSourcesPublished': False,
        'independentDependencyRebuild': False, 'candidates': sum(len(p['native']['cases']) for p in profiles),
        'outcomes': {status: sum(c['status'] == status for p in profiles for c in p['native']['cases']) for status in ['PASS', 'KERNEL_REJECTED', 'UNSUPPORTED_SCOPE', 'UNSUPPORTED_TYPE_FORM']},
        'scope': 'Four authored dependent-domain calibrations with original packet typing, source-free native ports and the unchanged finite region-input construction. No general preservation theorem, new corpus coverage or comprehension result.'}
    if args.publish:
        (BASE / 'native.json.gz').write_bytes(gzip.compress(raw, mtime=0))
        (BASE / 'verification.json.gz').write_bytes(gzip.compress((json.dumps(report, indent=2) + '\n').encode(), mtime=0))
        (BASE / 'legacy-ports.json.gz').write_bytes(gzip.compress((folder / 'legacy-ports.json').read_bytes(), mtime=0))
        (BASE / 'ports.json.gz').write_bytes(gzip.compress((folder / 'ports.json').read_bytes(), mtime=0))
        (BASE / 'core-data.json.gz').write_bytes(gzip.compress(json.dumps(data, sort_keys=True, separators=(',', ':')).encode(), mtime=0))
    write(folder / 'verification.json', report)
    print(json.dumps({'status': 'PASS', 'candidates': report['candidates'], 'outcomes': report['outcomes']}))

if __name__ == '__main__':
    main()
