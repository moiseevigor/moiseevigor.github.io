"""Fresh closed-packet replay; no original theorem/module or per-call type queries."""
import argparse
import gzip
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = RESEARCH.parents[1]
sys.path.insert(0, str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def load(name, file):
    spec = importlib.util.spec_from_file_location(name, file)
    value = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(value)
    return value

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--cache', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    args = parser.parse_args()
    folder = args.workdir.resolve()
    folder.mkdir(parents=True, exist_ok=False)
    (folder / 'scratch').mkdir()
    assert shutil.disk_usage(folder).free >= 30 * 1024**3
    lean = args.lean.resolve()
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    cache = load('network_checking_cache', RESEARCH / 'use-sites/verify.py')
    paths, recovery = cache.recovered(args.cache.resolve())
    manifest_file = ROOT / 'public/data/proof-atlas/network-streaming-manifest.js'
    manifest = json.loads(manifest_file.read_text().split('=', 1)[1].strip().rstrip(';'))
    descriptor = next(d for d in manifest['records'] if d['mode'] == 'source-only')
    record = descriptor['record']
    packet = gzip.decompress((ROOT / record['indexFile'].lstrip('/')).read_bytes())
    assert sha(packet) == record['indexSha256']
    (folder / 'packet.json').write_bytes(packet)
    request = [{'file': str(folder / 'packet.json'), **{k: record[k] for k in ['name', 'module', 'indexSha256', 'axioms']}}]
    (folder / 'request.json').write_text(json.dumps(request, separators=(',', ':')) + '\n')
    runtime_module = load('network_packet_runtime', RESEARCH / 'packet-typing/verify.py')
    runtime = runtime_module.runtime()
    entry = folder / 'Replay.lean'
    absence = '\nrun_cmd do\n let env ← Lean.getEnv\n unless !(env.header.moduleNames.any (fun n => n.toString.startsWith "SE2Conjugate")) do throwError "Private modules imported"\n'
    command = '\n#atlas_packet_replay ' + json.dumps(str(folder / 'request.json')) + ' => ' + json.dumps(str(folder / 'proof.ndjson')) + '\n'
    entry.write_text(runtime + absence + command)
    producers = [BASE / 'verify-packet.py', RESEARCH / 'use-sites/verify.py', RESEARCH / 'packet-typing/verify.py', RESEARCH / 'ExportLibrary.lean', RESEARCH / 'ExportOccurrenceTypes.lean', RESEARCH / 'LevelTransportControls.lean', RESEARCH / 'compiled-replay/Replay.lean', RESEARCH / 'packet-typing/PacketTyping.lean', RESEARCH / 'evaluate_goedel.py', RESEARCH / 'build_recursion_examples.py']
    fingerprints = {str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in producers}
    inputs = {p.name: sha(p.read_bytes()) for p in [entry, folder / 'packet.json', folder / 'request.json']}
    environment = {'PATH': str(lean.parent) + ':/usr/bin:/bin', 'LEAN_PATH': os.pathsep.join(map(str, paths)), 'LANG': 'en_US.UTF-8', 'TMPDIR': str(folder / 'scratch')}
    print(json.dumps({'phase': 'closed-packet replay', 'name': record['name']}), flush=True)
    run_checked(['/usr/bin/sandbox-exec', '-p', sandbox_profile(lean, folder, paths), str(lean), str(entry)], folder, 'native', environment, reserve=30, timeout=120)
    raw = (folder / 'proof.ndjson').read_bytes()
    rows = [json.loads(line) for line in raw.splitlines()]
    assert len(rows) == 1
    proof = rows[0]
    assert proof['name'] == record['name'] and proof['indexSha256'] == record['indexSha256']
    assert proof['storedNodes'] == record['uniqueNodes'] and set(proof['axioms']) == set(record['axioms']) and 'sorryAx' not in proof['axioms']
    for key in ['kernelExpectedType', 'kernelProof', 'kernelExpectedTypeIsProposition', 'kernelExpectedTypeConversion']:
        assert proof[key] == 'PASS'
    for key in ['originalTheoremAbsentFromEnvironment', 'originalModuleAbsentFromEnvironment', 'wrongProofRejectedByKernel', 'illTypedBinderRejectedByKernel']:
        assert proof[key] is True
    assert inputs == {p.name: sha(p.read_bytes()) for p in [entry, folder / 'packet.json', folder / 'request.json']}
    assert fingerprints == {str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in producers}
    result = {'format': 'ProofAtlasNetworkPacketReplay/1', 'status': 'PASS', 'source': descriptor['source'], 'compiler': compiler, 'dependencyRecovery': recovery, 'packetSha256': sha(packet), 'proof': proof, 'nativeOutputSha256': sha(raw), 'runtimeSha256': sha(entry.read_bytes()), 'producerFiles': fingerprints, 'imports': ['Mathlib', 'Aesop'], 'originalProofSourcesRead': False, 'originalProofModuleImported': False, 'privateRiccatiModulesImported': False, 'perCallTypeObservationsAdded': 0, 'scope': 'Fresh closed-packet kernel replay and negative controls. Source-spine types remain unobserved; dependency revision is cache attribution, not an independent dependency rebuild.'}
    (folder / 'verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'status': 'PASS', 'name': record['name'], 'storedNodes': record['uniqueNodes'], 'perCallTypeObservationsAdded': 0}), flush=True)

if __name__ == '__main__':
    main()
