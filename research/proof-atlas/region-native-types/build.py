"""Build a small shared-runtime checker; original research sources are not compiled."""
import argparse, hashlib, importlib.util, json, os, subprocess, sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
ROOT = RESEARCH.parents[1]
sys.path.insert(0, str(RESEARCH))
from build_recursion_examples import run_checked


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def runtime():
    spec = importlib.util.spec_from_file_location('region_packet_runtime', RESEARCH / 'packet-typing/verify.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.runtime().replace('import Mathlib\nimport Aesop', 'import Lean') + '\n' + \
        (BASE / 'KernelQueries.lean').read_text() + '\n' + (BASE / 'Main.lean').read_text()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean', type=Path, required=True)
    parser.add_argument('--workdir', type=Path, required=True)
    args = parser.parse_args()
    lean, folder = args.lean.resolve(), args.workdir.resolve()
    folder.mkdir(exist_ok=False)
    (folder / 'scratch').mkdir()
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    stable = runtime()
    (folder / 'Checker.lean').write_text(stable)
    env = {'PATH': str(lean.parent) + ':/usr/bin:/bin', 'TMPDIR': str(folder / 'scratch'), 'LANG': 'en_US.UTF-8'}
    commands = [[str(lean), '-j1', '-M4096', '-c', 'Checker.c', 'Checker.lean'],
        [str(lean.parent / 'leanc'), '-O0', '-c', 'Checker.c', '-o', 'Checker.o', '-mmacosx-version-min=11.0'],
        ['/usr/bin/clang', '-o', 'checker', 'Checker.o', '-L' + str(lean.parents[1] / 'lib/lean'),
         '-lInit_shared', '-lleanshared', '-Wl,-rpath,' + str(lean.parents[1] / 'lib/lean'),
         '-mmacosx-version-min=11.0']]
    resources = [run_checked(cmd, folder, 'build-' + str(i), env, 30, 120)
                 for i, cmd in enumerate(commands)]
    assert stable == runtime()
    library_files = [lean.parents[1] / 'lib/lean' / name for name in
        ['libInit_shared.dylib', 'libleanshared.dylib', 'libleanshared_1.dylib', 'libleanshared_2.dylib']]
    report = {'format': 'ProofAtlasRegionKernelBuild/1', 'status': 'PASS', 'compiler': compiler,
        'runtimeSha256': sha(stable.encode()), 'leanExecutableSha256': sha(lean.read_bytes()),
        'resources': resources, 'outputs': {p: sha((folder / p).read_bytes()) for p in
            ['Checker.lean', 'Checker.c', 'Checker.o', 'checker']},
        'libraries': {p.name: sha(p.read_bytes()) for p in library_files},
        'sourceFiles': {str(p.relative_to(ROOT)): sha(p.read_bytes()) for p in [BASE / 'build.py',
            BASE / 'KernelQueries.lean', BASE / 'Main.lean', RESEARCH / 'packet-typing/verify.py',
            RESEARCH / 'packet-typing/PacketTyping.lean', RESEARCH / 'ExportLibrary.lean',
            RESEARCH / 'ExportOccurrenceTypes.lean', RESEARCH / 'LevelTransportControls.lean',
            RESEARCH / 'compiled-replay/Replay.lean']}}
    (folder / 'build.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'status': 'PASS', 'runtimeSha256': report['runtimeSha256'],
                      'checkerSha256': report['outputs']['checker']}))


if __name__ == '__main__':
    main()
