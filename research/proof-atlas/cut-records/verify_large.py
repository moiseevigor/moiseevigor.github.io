"""Check sparse cuts of source graphs up to 262,144 stored nodes with core Lean.

The original decoder and verifier remain unchanged. This profile reuses their
indexed-cut and lexical checkers, with an explicit versioned table-bound decoder.
Original mathematical source modules are not imported or independently verified.
"""
import argparse
import gzip
import hashlib
import importlib.util
import json
import os
import re
from pathlib import Path
import shutil
import sys

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
spec = importlib.util.spec_from_file_location('frozen_source_cut_native', BASE/'verify_native.py')
original = importlib.util.module_from_spec(spec)
spec.loader.exec_module(original)
spec = importlib.util.spec_from_file_location('independent_source_cut', BASE/'check.py')
independent = importlib.util.module_from_spec(spec)
spec.loader.exec_module(independent)
sha = lambda b: hashlib.sha256(b).hexdigest()


def source_files():
    return original.source_files() + [BASE/'LargePacket.lean', BASE/'LargeNativeCut.lean', Path(__file__), ROOT/'scripts/test-proof-atlas-large-cut-inputs.cjs']


def runtime_source():
    frozen = (BASE.parent/'compiled-replay/Replay.lean').read_text()
    frozen = frozen[frozen.index('def decode (packet'):frozen.index('\ndef graph (roots')].strip()
    profile = (BASE/'LargePacket.lean').read_text()
    profile = profile[profile.index('def decode (packet'):profile.index('\ndef exact (packet')].strip()
    assert profile.replace('kinds.size <= 262144', 'kinds.size <= 131072') == frozen
    return original.runtime_source() + '\n' + (BASE/'LargePacket.lean').read_text() + '\n' + (BASE/'LargeNativeCut.lean').read_text()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    parser.add_argument('--requests', type=Path, nargs='+', required=True)
    parser.add_argument('--reserve-gib', type=int, default=30)
    args = parser.parse_args()
    assert args.reserve_gib >= 1 and 0 < len(args.requests) <= 4096
    folder = args.workdir.resolve()
    folder.mkdir(parents=True, exist_ok=False)
    (folder/'scratch').mkdir()
    assert shutil.disk_usage(folder).free >= args.reserve_gib*1024**3
    lean = args.lean.resolve()
    assert lean.is_file()
    env = dict(PATH=str(lean.parent)+os.pathsep+os.defpath, LEAN_PATH=str(folder), TMPDIR=str(folder/'scratch'), LANG='en_US.UTF-8')
    original.run_checked([str(lean), '--version'], folder, 'version', env, args.reserve_gib, 120)
    version = (folder/'version.log').read_text().strip()
    assert 'version 4.33.1,' in version
    files, runtime = source_files(), runtime_source()
    hashes = {str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in files}
    rows = []
    for number, path in enumerate(args.requests):
        path = path.resolve()
        assert path.stat().st_size <= 64*1024**2
        checked = independent.run(path)
        request = json.loads(path.read_text())
        with gzip.open(request['packetFile'], 'rb') as stream:
            raw = stream.read(64*1024**2+1)
        assert len(raw) <= 64*1024**2 and sha(raw) == request['expected']['indexSha256']
        packet = json.loads(raw)
        assert packet['serialization'] == 'ExprDAG/1' and len(packet['kind']) <= 262144
        work = folder/str(number)
        work.mkdir()
        source = work/'source.json'
        source.write_bytes(raw)
        request['packetFile'] = str(source)
        request.setdefault('rejectedRefinements', [])
        request_file, output = work/'request.json', work/'native.json'
        request_file.write_text(json.dumps(request))
        assert request_file.stat().st_size <= 64*1024**2
        entry = work/'Native.lean'
        entry.write_text(runtime+'\n#atlas_large_source_cuts '+json.dumps(str(request_file))+' => '+json.dumps(str(output))+'\n')
        cmd = [str(lean), str(entry)]
        if sys.platform == 'darwin':
            cmd = ['/usr/bin/sandbox-exec', '-p', original.sandbox_profile(lean, folder, []), *cmd]
        resources = original.run_checked(cmd, folder, 'native-'+str(number), env, args.reserve_gib, 120)
        log = (folder/('native-'+str(number)+'.log')).read_text()
        assert 'sorryAx' not in log
        theorems = {name:sorted(v.strip() for v in axioms.split(',') if v.strip())
                    for name, axioms in re.findall(r"'([^']+)' depends on axioms: \[([^\]]*)\]", log)}
        for name in ('AtlasLargePacketReplay.legacy_decode_agrees', 'AtlasLargePacketReplay.legacy_exact_agrees'):
            assert name in theorems and set(theorems[name]) <= {'propext', 'Classical.choice', 'Quot.sound'}
        assert output.stat().st_size <= 64*1024**2
        observed = json.loads(output.read_text())
        assert observed['format'] == 'ProofAtlasNativeSourceCuts/1'
        assert observed['sourceNodeLimit'] == 262144 and observed['sourceNodes'] == len(packet['kind'])
        assert observed['records'] == checked['records'] and observed['nativeMathematicalTyping'] is False
        targets = [b for row in observed['bindings'] for b in row]
        assert sum(b['target'] is not None for b in targets) == checked['bindings']
        assert sum(b['external'] for b in targets) == checked['externalTargets']
        rows.append(dict(source=request['expected'], native=observed, nativeOutputSha256=sha(output.read_bytes()),
                         recordSetSha256=sha(json.dumps(request['records'], sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()),
                         packetSha256=sha(raw), independent=checked, genericTheorems=theorems, resources=resources))
        assert hashes == {str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in files}
        (folder/'progress.json').write_text(json.dumps(dict(status='RUNNING', completed=len(rows), rows=rows), indent=2)+'\n')
        print(json.dumps(dict(status='PASS', name=request['expected']['name'], nodes=observed['sourceNodes'], cuts=observed['records'])), flush=True)
    report = dict(status='PASS', format='ProofAtlasLargeNativeSourceCutVerification/1', compiler=version,
                  sourceNodeLimit=262144, sourceFiles=hashes, runtimeSha256=sha(runtime.encode()),
                  requests=len(rows), records=sum(r['native']['records'] for r in rows), rows=rows,
                  sourceModuleBytesVerified=False, mathematicalTypingChecked=False,
                  scope='Native source roundtrip, indexed cuts and lexical correspondence under explicit process/input bounds. No new mathematical typing or all-size guarantee.')
    (folder/'verification.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k not in ('rows', 'sourceFiles')}))


if __name__ == '__main__':
    main()
