"""Record checked candidate runtime evidence without rewriting historical reports."""
import argparse
import gzip
import hashlib
import json
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
sha = lambda value: hashlib.sha256(value).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inputs', type=Path, required=True, help='Folder with the named fresh JSON reports.')
    parser.add_argument('--publish', action='store_true', help='Save compressed technical records locally.')
    args = parser.parse_args()
    expected = {
        'runtime': 'PASS',
        'runtime-application': 'PASS',
        'runtime-native-pages': 'PAGED_COMPARISON_WEAKENING_FORMALS_AND_SOURCE_CUTS_PASS_NOT_DEPLOYED',
        'runtime-bridge-model': 'NATIVE_TYPE_ROOTS_AND_INDEPENDENT_FINGERPRINTS_PASS_NOT_PUBLISHED',
        'runtime-page-controls': 'LITERAL_OPERATIONS_DEPTH_BUDGET_AND_EVICTION_CONTROLS_PASS',
        'runtime-bridge-browser': 'PRODUCTION_SHARED_TYPE_BRIDGE_BROWSER_PASS_NOT_PUBLISHED',
        'runtime-wiring-browser': 'PASS',
    }
    reports, compressed = {}, {}
    for name, status in expected.items():
        raw = (args.inputs/(name+'.json')).read_bytes()
        report = json.loads(raw)
        assert report['status'] == status, name
        files = report.get('files', {})
        if isinstance(files, list):
            files = {row['file']: row['sha256'] for row in files}
        for file, digest in files.items():
            assert sha((ROOT/file).read_bytes()) == digest, file
        reports[name] = report
        compressed[name+'.json.gz'] = gzip.compress(raw, mtime=0)
    runtime, complete, native = [reports[name] for name in ['runtime', 'runtime-application', 'runtime-native-pages']]
    bridge, browser, wiring = [reports[name] for name in ['runtime-bridge-model', 'runtime-bridge-browser', 'runtime-wiring-browser']]
    assert (runtime['nativeProfiles'], runtime['nativeInputs'], complete['windows'], native['ports'], native['cuts']) == (42, 877, 207, 877, 10524)
    assert (bridge['sameStructure'], bridge['differentStructure'], bridge['contextExtensions']) == (792, 85, 37)
    assert (browser['axeAudits'], browser['typeRootSelections'], browser['librarySourcePreserved']) == (16, 18, 3)
    assert browser['sourceOverride'] is False and browser['wholeRuntimeArchiveRequests'] == 0
    assert wiring['sourceOverrides'] is False
    compatibility = json.loads((args.inputs/'compatibility.json').read_text())
    assert len(compatibility) == 8 and all(row['exitCode'] == 0 for row in compatibility)
    stable_compatibility = []
    for row in compatibility:
        report = json.loads(Path(row['report']).read_bytes())
        assert report['status'] == 'PASS'
        for file, value in report.get('builtFiles', {}).items():
            digest = value if isinstance(value, str) else value['sourceSha256']
            assert sha((ROOT/file).read_bytes()) == digest, file
        saved = 'research/proof-atlas/application-ports/browser-'+row['key']+'.json'
        assert (ROOT/saved).read_bytes() == Path(row['report']).read_bytes()
        stable_compatibility.append(dict(key=row['key'], script=row['script'], exitCode=0,
                                         report=saved, reportSha256=sha((ROOT/saved).read_bytes())))
    compressed['runtime-compatibility.json.gz'] = gzip.compress(
        (json.dumps(stable_compatibility, indent=2)+'\n').encode(), mtime=0)
    sources = ['public/js/proof-atlas-scope-comparison.js', 'public/js/proof-atlas-application-ports.js',
               'public/js/proof-atlas-paged-type-operations.js', 'public/js/proof-atlas-application-port-view.js',
               'public/js/proof-atlas-input-type-bridge-view.js', 'public/js/proof-atlas-library.js',
               'public/js/proof-atlas-paged-library.js', 'projects/proof-atlas/manual/index.html',
               'projects/proof-atlas/library/index.html', 'research/proof-atlas/equality-transport/index.html',
               'research/proof-atlas/network-streaming/index.html', 'docs/proof-atlas-research-program.md',
               'research/proof-atlas/input-type-bridge/README.md',
               '.github/workflows/proof-atlas-browser.yml',
               '.github/workflows/proof-atlas-scope-comparison.yml',
               'research/proof-atlas/application-ports/current-compatibility.json',
               'research/proof-atlas/application-ports/application-ports-evidence.json']
    for row in compatibility:
        sources += [row['script'], 'research/proof-atlas/application-ports/browser-'+row['key']+'.json']
    sources += [str(file.relative_to(ROOT)) for file in BASE.iterdir()
                if file.is_file() and file.name != 'runtime-evidence.json.gz'
                and file.suffix in ['.cjs', '.py', '.lean', '.md', '.svg', '.json', '.gz']]
    files = {file: sha((ROOT/file).read_bytes()) for file in sorted(set(sources))
             if Path(file).name not in compressed}
    for name, raw in compressed.items():
        files[str((BASE/name).relative_to(ROOT))] = sha(raw)
    evidence = dict(format='ProofAtlasScopeRuntimeEvidence/1', status='PASS', files=files,
                    completeApplicationWindows=complete['windows'], nativePagedPorts=native['ports'],
                    nativeTypeCuts=native['cuts'], nativeProfiles=runtime['nativeProfiles'],
                    contextExtensions=runtime['contextExtensions'], extensionCoverage=runtime['extensionCoverage'],
                    literalTypePairs=dict(same=bridge['sameStructure'], different=bridge['differentStructure']),
                    bridgeBrowser=browser, wiringBrowser=wiring, compatibility=stable_compatibility,
                    sourceOverrides=False, publicDeployment=False, generalJavaScriptRefinementProved=False,
                    originalPrivateProofSourcesPublished=False,
                    originalApplicationAuditSha256=sha((ROOT/'research/proof-atlas/application-ports/audit.json').read_bytes()),
                    scope='Candidate complete and paged weakening gates, recorded native ownership and context checks, finite scope certificates and built browser presentations. No new mathematical typing observation, native preserved-local coverage, total heap bound or public deployment.')
    raw = (json.dumps(evidence, indent=2)+'\n').encode()
    (args.inputs/'runtime-evidence.json').write_bytes(raw)
    if args.publish:
        for name, data in compressed.items():
            (BASE/name).write_bytes(data)
        (BASE/'runtime-evidence.json.gz').write_bytes(gzip.compress(raw, mtime=0))
    print(json.dumps(dict(status='PASS', nativeInputs=runtime['nativeInputs'], browserCompatibilitySuites=len(compatibility))))


if __name__ == '__main__':
    main()
