"""Kernel-typed core-only scope controls; no private imports or Mathlib cache."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import resource
import shutil
import signal
import subprocess
import time

BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parents[1]
ROOT = BASE.parents[3]
sha = lambda raw: hashlib.sha256(raw).hexdigest()
POLICY = dict(minimumFreeBytes=20*1024**3, scratchBytes=256*1024**2,
              fileBytes=64*1024**2, leanMemoryMiB=2048, commandSeconds=180)


def runtime():
    exporter = (RESEARCH/'ExportLibrary.lean').read_text()
    assert exporter.count('import SE2Conjugate\n') == 1
    exporter = exporter.replace('import SE2Conjugate\n', '')
    occurrence = (RESEARCH/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary\n', '')
    levels = (RESEARCH/'LevelTransportControls.lean').read_text().split('def compactGraph')[0]+'\nend AtlasLevelTransport\n'
    spec = importlib.util.spec_from_file_location('scope_zeta_observer', RESEARCH/'dependent-region-inputs/observer.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    ports = module.refine((RESEARCH/'application-ports/Ports.lean').read_text())
    result = '\n'.join([exporter, 'set_option maxRecDepth 16384\nset_option maxHeartbeats 10000000', occurrence,
                        levels, (RESEARCH/'compiled-replay/Replay.lean').read_text(), ports])
    assert re.findall(r'^import (.+)$', result, re.M) == ['Lean']
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    args = parser.parse_args()
    lean, folder = args.lean.resolve(), args.workdir.resolve()
    assert shutil.disk_usage(folder.parent).free >= POLICY['minimumFreeBytes']
    folder.mkdir(exist_ok=False)
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    stable = runtime()
    sources = [BASE/'Controls.lean', BASE/'prepare.cjs', BASE/'prepare_runtime.py', BASE/'verify.py', RESEARCH/'ExportLibrary.lean',
               RESEARCH/'ExportOccurrenceTypes.lean', RESEARCH/'LevelTransportControls.lean',
               RESEARCH/'compiled-replay/Replay.lean', RESEARCH/'application-ports/Ports.lean',
               RESEARCH/'dependent-region-inputs/observer.py']
    producers = {str(file.relative_to(ROOT)): sha(file.read_bytes()) for file in sources}
    profile = '\n'.join(['(version 1)', '(allow default)', '(deny network*)', '(deny file-write*)',
                         '(allow file-write* (subpath '+json.dumps(str(folder))+') (literal "/dev/null"))', ''])
    (folder/'confinement.sb').write_text(profile)
    env = {'PATH': str(lean.parent)+':/usr/bin:/bin', 'LEAN_PATH': str(folder),
           'TMPDIR': str(folder), 'LANG': 'en_US.UTF-8'}
    runs = []

    def run(label, source):
        (folder/(label+'.lean')).write_text(source)
        def limits():
            resource.setrlimit(resource.RLIMIT_FSIZE, (POLICY['fileBytes'],)*2)
        command = ['/usr/bin/sandbox-exec', '-f', str(folder/'confinement.sb'), str(lean),
                   '-j1', '-M'+str(POLICY['leanMemoryMiB']), label+'.lean']
        start = time.monotonic()
        with (folder/(label+'.log')).open('w') as log:
            process = subprocess.Popen(command, cwd=folder, env=env, stdout=log, stderr=subprocess.STDOUT,
                                       preexec_fn=limits, start_new_session=True)
            try:
                code = process.wait(timeout=POLICY['commandSeconds'])
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()
                raise RuntimeError('Native command time limit: '+label)
        output = (folder/(label+'.log')).read_bytes()
        assert code == 0, str(folder/(label+'.log'))
        assert not re.search(rb'sorryAx|declaration uses', output)
        assert shutil.disk_usage(folder).free >= POLICY['minimumFreeBytes']
        used = sum(file.stat().st_size for file in folder.rglob('*') if file.is_file())
        assert used <= POLICY['scratchBytes']
        runs.append(dict(name=label, exitCode=code, sourceSha256=sha(source.encode()),
                         diagnosticSha256=sha(output), seconds=round(time.monotonic()-start, 3), scratchBytes=used))
        print(json.dumps(runs[-1]), flush=True)

    exports = []
    for name in ['dependentDomain', 'dependentLet', 'sharedLocal']:
        exports.append('(``AtlasScopeNative.'+name+','+json.dumps(str(folder/(name+'.json')))+')')
    export = '''
run_cmd do
  for (name,file) in #[ITEMS] do
    let info ← getConstInfo name
    let some value := info.value? true | throwError "Missing authored control"
    liftTermElabM fun _ => AtlasOccurrenceTypes.kernelAs value info.type
    let axioms ← collectAxioms name
    unless axioms.isEmpty do throwError "Unexpected axiom in authored control"
    let (t,start) := AtlasLibrary.intern info.type {}
    let (v,graph) := AtlasLibrary.intern value start
    let packet := Json.mkObj [("serialization",toJson "ExprDAG/1"),("roots",toJson #[t,v]),
      ("declaration",Json.mkObj [("name",toJson name.toString),("kind",toJson "definition"),
        ("kernelCheck",toJson "PASS"),("axioms",toJson (axioms.map Name.toString)),("module",toJson "ScopeNativeControls"),
        ("rootPaths",toJson #["root.type","root.value"])])]
    liftIO <| IO.FS.writeFile file (packet.mergeObj (AtlasOccurrenceTypes.graphJson graph)).compress
'''.replace('ITEMS', ','.join(exports))
    run('ScopeNativeControls', stable+'\n'+(BASE/'Controls.lean').read_text()+export)
    negative = '''
run_cmd do
  liftTermElabM fun _ => do
    let mut refused := false
    try
      AtlasOccurrenceTypes.kernelAs (mkConst ``True.intro) (mkConst ``Nat)
    catch _ => refused := true
    unless refused do throwError "Ill-typed declaration accepted"
'''
    run('ScopeWrongType', stable+'\n'+negative)
    subprocess.run(['/opt/homebrew/bin/node', str(BASE/'prepare.cjs'), str(folder)], cwd=ROOT, check=True)
    run('ScopeObserver', stable+'\n#atlas_application_ports '+json.dumps(str(folder/'requests.json'))+
        ' => '+json.dumps(str(folder/'native.json'))+'\n')
    native = json.loads((folder/'native.json').read_bytes())
    assert len(native) == 3
    for row in native:
        assert row['mode'] == 'replay' and row['kernelClosedTermTyping'] == 'PASS'
        assert not row['originalDeclarationPresent'] and not row['originalModulePresent'] and not row['privateRiccatiModulesPresent']
        assert len(row['entries']) == 3 and row['refusals'] == []
        for entry in row['entries']:
            checks = entry['junction']['checks']
            assert checks['literalSourceUseWitness'] is True and checks['literalTypeWeakening'] is True
            for check in ['originalContextTyping', 'consumerContextTyping', 'kernelInputDomain',
                          'kernelPortTypeConversion', 'kernelNormalizedInput', 'kernelNormalizedResult',
                          'kernelBindingZetaConversions']:
                assert checks[check] == 'PASS'
    assert stable == runtime() and producers == {file: sha((ROOT/file).read_bytes()) for file in producers}
    report = dict(format='ProofAtlasScopeNativeControls/1', status='PASS', compiler=compiler,
                  leanExecutableSha256=sha(lean.read_bytes()), producerFiles=producers,
                  runtimeSha256=sha(stable.encode()), nativeSha256=sha((folder/'native.json').read_bytes()),
                  runs=runs, resourcePolicy=POLICY, imports=['Lean'], mathlibRestored=False,
                  originalPrivateProofProjectsRead=False, originalControlDeclarationsAbsentDuringReplay=True,
                  sourceProfiles=3, recordedPorts=9, wrongTypeRefusedByKernel=True,
                  scope='Authored core-only dependent and shared proof controls, closed declaration checks and source-free kernel input replay. Not an AI benchmark or a general JavaScript/decoder refinement theorem.')
    (folder/'verification.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps(dict(status='PASS', profiles=3, ports=9)), flush=True)


if __name__ == '__main__':
    main()
