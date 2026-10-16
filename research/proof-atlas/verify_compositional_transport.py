"""Serial, bounded native controls for source-backed lambda/type composition.

Requires Lean 4.33.1 and Node, never imports a private project or Mathlib.
ATLAS_LEAN may name the pinned compiler. Raw logs stay in the work directory.
"""
from pathlib import Path
import argparse, json, os, subprocess, tempfile

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--lean', default=os.environ.get('ATLAS_LEAN', 'lean'))
    parser.add_argument('--workdir', type=Path)
    args = parser.parse_args()
    compiler = subprocess.check_output([args.lean, '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler, 'Pinned Lean 4.33.1 required'
    work = (args.workdir or Path(tempfile.mkdtemp(prefix='atlas-composition-'))).resolve()
    work.mkdir(parents=True, exist_ok=True)
    env = dict(os.environ, ATLAS_LEAN=args.lean)
    scripts = BASE / 'context-transport'

    def run(name, command):
        with (work / (name + '.log')).open('w') as output:
            result = subprocess.run(command, cwd=ROOT, env=env, stdout=output,
                                    stderr=subprocess.STDOUT, timeout=900)
        assert result.returncode == 0, 'Inspect ' + str(work / (name + '.log'))
        lines = (work / (name + '.log')).read_text().splitlines()
        return json.loads(lines[-1])

    large = run('native-context', ['python3', str(scripts / 'verify_context_controls.py')])
    folder = large['folder']
    context = run('context-checks', ['node', str(scripts / 'check_context_controls.cjs'), folder])
    mappings = run('index-mappings', ['node', str(scripts / 'test_lifted_views.cjs'), folder])
    boundary = run('context-boundary', ['python3', str(scripts / 'verify_whole_boundary.py'), folder])
    run('native-introductions', ['python3', str(scripts / 'verify_introductions.py'), folder])
    introductions = run('introduction-checks', ['node', str(scripts / 'check_introductions.cjs'), folder])
    scope = run('native-scopes', ['python3', str(scripts / 'verify_introduction_scopes.py')])
    scopes = run('scope-checks', ['node', str(scripts / 'check_introduction_scopes.cjs'), scope['folder']])
    deep_native = run('native-deep-contexts', ['python3', str(scripts / 'verify_deep_contexts.py')])
    deep = run('deep-context-checks', ['node', str(scripts / 'check_deep_contexts.cjs'), deep_native['folder']])
    result = dict(status='PASS', compiler=compiler, workdir=str(work),
                  context=context, mappings=mappings, firstRuleBoundary=boundary,
                  introductions=introductions, scopes=scopes, deepContexts=deep)
    (work / 'checks.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result))


if __name__ == '__main__':
    main()
