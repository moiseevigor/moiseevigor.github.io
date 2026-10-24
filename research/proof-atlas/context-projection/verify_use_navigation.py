"""Bounded core-Lean checks of source-use support facts; no private project import."""
import argparse, json, shutil, subprocess, sys
from pathlib import Path
from verify import BASE, ROOT, sha, run_checked, sandbox_profile

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--lean', type=Path, required=True)
    p.add_argument('--workdir', type=Path, required=True)
    args = p.parse_args()
    lean = args.lean.resolve()
    compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    folder = args.workdir.resolve()
    folder.mkdir(exist_ok=False)
    (folder / 'scratch').mkdir()
    assert shutil.disk_usage(folder).free >= 30 * 1024**3
    paths = [BASE / f for f in ['Projection.lean', 'Support.lean', 'UseNavigation.lean']]
    stable = '\n'.join(f.read_text() for f in paths)
    entry, output = folder / 'UseNavigation.lean', folder / 'theorems.json'
    entry.write_text(stable + '\n#atlas_use_navigation ' + json.dumps(str(output)) + '\n')
    env = {'PATH': str(lean.parent) + ':/usr/bin:/bin', 'LEAN_PATH': str(folder),
           'TMPDIR': str(folder / 'scratch'), 'LANG': 'en_US.UTF-8'}
    cmd = [str(lean), str(entry)]
    if sys.platform == 'darwin':
        cmd = ['/usr/bin/sandbox-exec', '-p', sandbox_profile(lean, folder, []), *cmd]
    resources = run_checked(cmd, folder, 'native', env, 30, 120)
    assert stable == '\n'.join(f.read_text() for f in paths)
    result = json.loads(output.read_text())
    assert result['format'] == 'ProofAtlasUseNavigationTheory/1' and len(result['theorems']) == 6
    assert all(all(r[k] == 'PASS' for k in ['kernelType', 'kernelProof', 'kernelExpectedTypeConversion'])
               and set(r['axioms']) <= {'propext', 'Quot.sound', 'Classical.choice'} for r in result['theorems'])
    result.update(status='PASS', compiler=compiler, resources=resources,
                  sourceFiles={str(f.relative_to(ROOT)): sha(f.read_bytes()) for f in paths + [Path(__file__)]},
                  entrySha256=sha(entry.read_bytes()), outputSha256=sha(output.read_bytes()),
                  scope='General raw Expr support facts. No JavaScript implementation verification or typing theorem.')
    (folder / 'verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({'status': 'PASS', 'theorems': 6, 'resources': resources}))

if __name__ == '__main__':
    main()
