"""Native-only changed-record and table-bound controls on a real large source."""
import argparse, copy, gzip, importlib.util, json, os, sys
from pathlib import Path
BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))
import verify_large as profile
from verify_native_controls import variants


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--lean', type=Path, required=True)
    p.add_argument('--workdir', type=Path, required=True)
    p.add_argument('--request', type=Path, required=True)
    p.add_argument('--reserve-gib', type=int, default=30)
    a = p.parse_args()
    assert a.reserve_gib >= 1
    folder = a.workdir.resolve()
    folder.mkdir(parents=True, exist_ok=False)
    (folder/'scratch').mkdir()
    lean = a.lean.resolve()
    env = dict(PATH=str(lean.parent)+os.pathsep+os.defpath, LEAN_PATH=str(folder), TMPDIR=str(folder/'scratch'), LANG='en_US.UTF-8')
    profile.independent.run(a.request)
    request = json.loads(a.request.read_text())
    positive, controls = variants(request)
    at = next(i for i,e in enumerate(positive['entries']) if e.get('binding',{}).get('target',{}).get('external') is not None)
    actual = positive['entries'][at]['binding']['target']['external']
    other = next(i for i in range(len(positive['external'])) if i != actual)
    changed = copy.deepcopy(positive)
    changed['entries'][at]['binding']['target'] = dict(external=other)
    controls.append(dict(name='wrong-genuine-enclosing-binder', record=changed))
    with gzip.open(request['packetFile'], 'rb') as stream:
        raw = stream.read(64*1024**2+1)
    assert len(raw) <= 64*1024**2 and profile.sha(raw) == request['expected']['indexSha256']
    packet, input_file, output = folder/'source.json', folder/'request.json', folder/'native.json'
    packet.write_bytes(raw)
    input_file.write_text(json.dumps(dict(packetFile=str(packet), positive=positive, controls=controls)))
    assert input_file.stat().st_size <= 64*1024**2
    files = profile.source_files()+[BASE/'LargeRejects.lean', BASE/'verify_native_controls.py', Path(__file__), profile.ROOT/'scripts/build-proof-atlas-large-cut-negative.cjs']
    hashes = {str(f.relative_to(profile.ROOT)):profile.sha(f.read_bytes()) for f in files}
    runtime = profile.runtime_source()+'\n'+(BASE/'LargeRejects.lean').read_text()
    entry = folder/'Native.lean'
    entry.write_text(runtime+'\n#atlas_large_source_cut_rejects '+json.dumps(str(input_file))+' => '+json.dumps(str(output))+'\n')
    cmd = [str(lean), str(entry)]
    if sys.platform == 'darwin':
        cmd = ['/usr/bin/sandbox-exec', '-p', profile.original.sandbox_profile(lean, folder, []), *cmd]
    resources = profile.original.run_checked(cmd, folder, 'native', env, a.reserve_gib, 120)
    assert 'sorryAx' not in (folder/'native.log').read_text()
    native = json.loads(output.read_text())
    assert native['status'] == 'PASS' and native['rejected'] == [c['name'] for c in controls]
    assert native['tableBoundaryControls'] == 3
    assert hashes == {str(f.relative_to(profile.ROOT)):profile.sha(f.read_bytes()) for f in files}
    report = dict(status='PASS', source=request['expected'], nativeRejections=len(controls), native=native,
                  sourceFiles=hashes, runtimeSha256=profile.sha(runtime.encode()), resources=resources,
                  scope='Native structural/lexical changed-record checks with a valid large-source positive first. Table-bound tests use raw decoder tables, not canonical proof graphs. No mathematical typing claim.')
    (folder/'verification.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k not in ('sourceFiles','native','resources')}))


if __name__ == '__main__':
    main()
