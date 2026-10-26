#!/usr/bin/env python3
"""Kernel-check a general projection model and closed certificates for runtime outputs.

Requires only the pinned Lean distribution, Node, and checked-in compiled pages.
Generated cases/logs stay in a new temporary directory; only review metadata is saved.
"""
import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def literal(value):
    return json.dumps(value, ensure_ascii=False)


def fin_list(indices):
    return '[' + ', '.join(f'⟨{i}, by decide⟩' for i in indices) + ']'


def encode_projection(p, n, keys):
    groups = ', '.join(f'({keys.index(key)}, {fin_list(refs)})' for key, refs in p['groups'])
    return (f'({{ heads := {fin_list(p["heads"])}, arguments := {fin_list(p["arguments"])}, '
            f'others := {fin_list(p["others"])}, groups := [{groups}] }} : Projection {n} Nat)')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--lean', default='/Users/igor/.elan/toolchains/leanprover--lean4---v4.33.1/bin/lean')
    parser.add_argument('--report', type=Path, default=HERE / 'kernel-check.json')
    args = parser.parse_args()
    work = Path(tempfile.mkdtemp(prefix='atlas-boundary-kernel-', dir='/private/tmp'))
    env = {**os.environ, 'LEAN_PATH': str(work)}

    def run(argv, name, expected_success=True, allow_resource_limit=False):
        if argv[0] == args.lean and '--version' not in argv:
            argv = [argv[0], '-j1', '-M2048', *argv[1:]]
        with (work / (name + '.log')).open('w') as log:
            result = subprocess.run(argv, cwd=work, env=env, stdout=log, stderr=subprocess.STDOUT, timeout=240)
        output = (work / (name + '.log')).read_text()
        if allow_resource_limit and result.returncode != 0 and 'excessive memory consumption detected' in output:
            return None
        if (result.returncode == 0) != expected_success:
            raise RuntimeError(f'{name}: unexpected exit {result.returncode}; see {work / (name + ".log")}')
        return output

    version = run([args.lean, '--version'], 'version').strip()
    assert 'version 4.33.1' in version, version
    run(['node', str(HERE / 'export-cases.cjs'), str(work / 'cases.json')], 'export')
    data = json.loads((work / 'cases.json').read_text())
    shutil.copyfile(HERE / 'Boundary.lean', work / 'Boundary.lean')
    run([args.lean, '-o', 'Boundary.olean', 'Boundary.lean'], 'model')
    print('General model checked', flush=True)
    header = 'import Boundary\nopen ProofAtlas.Boundary\nset_option maxRecDepth 8192\nset_option maxHeartbeats 8000000\n'
    theorem_names, case_axiom_outputs, generated_hashes, certified_cases, resource_limits = [], [], {}, [], []
    for k, case in enumerate(data['cases']):
        # Exact full keys are interned, never hashed for equality. This coding step,
        # like JSON parsing itself, remains outside the general Lean theorem.
        keys = list(dict.fromkeys(c['source'] for c in case['cells']))
        assert len(keys) == len(set(keys))
        assert all(key in keys for key, _ in case['projection']['groups'])
        case['sourceDictionarySha256'] = hashlib.sha256(literal(keys).encode()).hexdigest()
        lines = [header, f'def sources_{k} : Array String := #[{", ".join(literal(key) for key in keys)}]\n']
        for i, c in enumerate(case['cells']):
            lines.append(f'opaque payload_{k}_{i} : String := {literal(c["payload"])}\n')
        cells = ',\n'.join(f'⟨{c["slot"]}, .{c["role"]}, {keys.index(c["source"])}, payload_{k}_{i}⟩' for i, c in enumerate(case['cells']))
        lines.append(f'def cells_{k} : Array (Cell Nat String) := #[{cells}]\n')
        lines.append(f'def table_{k} : Table cells_{k}.size Nat String := fun i => cells_{k}[i]\n')
        lines.append(f'def runtime_{k} := {encode_projection(case["projection"], f"cells_{k}.size", keys)}\n')
        lines.append(f'theorem case_{k}_matches : runtime_{k} = project table_{k} := by decide\n')
        lines.append(f'theorem case_{k}_recovers : recoverOrdered table_{k} runtime_{k} = List.ofFn (fun i => some (table_{k} i)) := by\n  rw [case_{k}_matches]\n  exact ordered_metadata_recovery table_{k}\n')
        names = [f'case_{k}_matches', f'case_{k}_recovers']
        lines.extend('#print axioms ' + name for name in names)
        filename = f'Case{k}.lean'
        (work / filename).write_text('\n'.join(lines))
        output = run([args.lean, '-o', f'Case{k}.olean', filename], f'certificate-{k}', allow_resource_limit=case['label']=='512-position-scalar')
        generated_hashes[filename] = digest(work / filename)
        if output is None:
            resource_limits.append({'label': case['label'], 'positions': len(case['cells']), 'status': 'NOT_CERTIFIED_COMPILER_MEMORY_LIMIT', 'compilerMemoryLimitMiB': 2048})
            continue
        case_axiom_outputs.append(output)
        certified_cases.append(k)
        theorem_names.extend(names)
        if (k + 1) % 16 == 0:
            print(f'{k + 1} cases checked', flush=True)
    assert sum(data['cases'][k]['mode']=='native' for k in certified_cases) == 106
    print(f'{len(certified_cases)} closed projection/recovery pairs checked; {len(resource_limits)} resource-limited case', flush=True)

    model = (HERE / 'Boundary.lean').read_text()
    general = re.findall(r'^(?:@\[simp\] )?theorem ([\w.]+)', model, re.M)
    audit_names = ['ProofAtlas.Boundary.' + name for name in general] + theorem_names
    (work / 'Audit.lean').write_text('import Lean\nimport Boundary\n' + '\n'.join('#print axioms ' + name for name in audit_names if name.startswith('ProofAtlas.')))
    audit_output = run([args.lean, 'Audit.lean'], 'axioms') + '\n' + '\n'.join(case_axiom_outputs)
    axiom_audit = {}
    for name, axioms in re.findall(r"'([^']+)' depends on axioms: \[([^\]]*)\]", audit_output):
        axiom_audit[name] = [a.strip() for a in axioms.split(',') if a.strip()]
    for name in re.findall(r"'([^']+)' does not depend on any axioms", audit_output):
        axiom_audit[name] = []
    assert set(axiom_audit) == set(audit_names), 'incomplete axiom audit'
    allowed = {'propext', 'Quot.sound', 'Classical.choice'}
    assert all(set(axioms) <= allowed for axioms in axiom_audit.values()), 'unapproved axiom or evaluation oracle'

    scalar = next(k for k, c in enumerate(data['cases']) if c['label'] == 'role-and-order-controls')
    original = data['cases'][scalar]['projection']
    negative_keys = list(dict.fromkeys(c['source'] for c in data['cases'][scalar]['cells'])) + ['wrong-original-source']
    changes = {}
    def changed(name, mutate):
        p = json.loads(json.dumps(original))
        mutate(p)
        assert p != original
        changes[name] = p
    changed('dropped_head', lambda p: p['heads'].pop())
    changed('duplicate_head', lambda p: p['heads'].append(p['heads'][0]))
    changed('proof_argument_in_other_lane', lambda p: p['others'].append(p['arguments'].pop()))
    changed('wrong_source_key', lambda p: p['groups'][0].__setitem__(0, 'wrong-original-source'))
    changed('merged_shadowed_source', lambda p: (p['groups'][0][1].extend(p['groups'][1][1]), p['groups'].pop()))
    changed('reordered_uses', lambda p: p['groups'][0][1].reverse())
    changed('value_as_proof', lambda p: (p['arguments'].append(2), p['others'].remove(2)))
    changed('dropped_proof_head_from_pool', lambda p: p['groups'][0][1].remove(0))
    negative = []
    for name, projection in changes.items():
        inequality_name = 'negative_' + name
        inequality = (f'import Case{scalar}\nopen ProofAtlas.Boundary\nset_option maxRecDepth 8192\n'
                      f'theorem {inequality_name} : {encode_projection(projection, f"cells_{scalar}.size", negative_keys)} ≠ project table_{scalar} := by decide\n'
                      f'#print axioms {inequality_name}\n')
        (work / 'NegativeProof.lean').write_text(inequality)
        proof_output = run([args.lean, 'NegativeProof.lean'], name + '-inequality')
        found = re.findall(r"'([^']+)' depends on axioms: \[([^\]]*)\]", proof_output)
        assert len(found) == 1 and found[0][0] == inequality_name
        axioms = [a.strip() for a in found[0][1].split(',') if a.strip()]
        assert set(axioms) <= allowed
        axiom_audit[inequality_name] = axioms
        source = (f'import Case{scalar}\nopen ProofAtlas.Boundary\nset_option maxRecDepth 8192\n'
                  f'example : {encode_projection(projection, f"cells_{scalar}.size", negative_keys)} = project table_{scalar} := by decide\n')
        (work / 'Negative.lean').write_text(source)
        output = run([args.lean, 'Negative.lean'], name, expected_success=False)
        assert 'Tactic `decide` proved that the proposition' in output and re.search(r'^is false$', output, re.M), f'{name} did not fail by deciding the false equality'
        negative.append({'name': name, 'kernelVerifiedInequality': inequality_name, 'falseEqualityRejectedByLean': True, 'inequalitySourceSha256': hashlib.sha256(inequality.encode()).hexdigest(), 'falseEqualitySourceSha256': hashlib.sha256(source.encode()).hexdigest()})
    # A source/table mutation is not prevented by a theorem about supplied data.
    # Binding that table to compiled evidence remains the encoder/hash/native-evidence contract.
    summaries = [{k: v for k, v in case.items() if k not in ('cells', 'projection')} |
                 {'positions': len(case['cells']), 'proofLabelPositions': sum(c['role'] == 'proof' for c in case['cells']),
                  'sourceBuckets': len(case['projection']['groups']), 'certificate': f'case_{i}_matches', 'recovery': f'case_{i}_recovers'}
                 for i, case in enumerate(data['cases']) if i in certified_cases]
    producers = data['producerHashes'] | {str(p.relative_to(REPO)): digest(p) for p in (HERE / 'Boundary.lean', HERE / 'verify.py')}
    assert all(digest(REPO / f) == value for f, value in producers.items()), 'producer changed during verification'
    assert all(digest(REPO / f.lstrip('/')) == value for f, value in data['loadedAssetHashes'].items()), 'data changed during verification'
    report = {'format': 'ProofAtlasBoundaryKernelCheck/1', 'status': 'KERNEL_REFERENCE_AND_FINITE_RUNTIME_BRIDGE_PASS_NOT_PUBLISHED',
              'toolchain': version, 'generalTheorems': len(general), 'finiteProjectionCertificates': len(summaries),
              'finiteRecoveryCertificates': len(summaries), 'nativeProfiles': data['nativeProfiles'], 'nativeCuts': data['nativeCuts'],
              'sourceOnlyCuts': data['sourceOnlyCuts'], 'authoredScalarCases': data['authoredScalarCases'],
              'attemptedCases': len(data['cases']), 'resourceLimitedCases': resource_limits,
              'positionAppearances': sum(c['positions'] for c in summaries), 'negativeControls': negative,
              'axiomAudit': axiom_audit, 'cases': summaries, 'producerHashes': producers,
              'loadedAssetHashes': data['loadedAssetHashes'], 'generatedInputsSha256': digest(work / 'cases.json'),
              'generatedLeanHashes': generated_hashes, 'leanExecutableSha256': digest(args.lean),
              'verificationBounds': {'compilerThreads': 1, 'compilerMemoryLimitMiB': 2048, 'sequentialCases': True},
              'limits': ['General theorems concern supplied roles and source keys, not their extraction from Lean.',
                         'Exact recovery dereferences an immutable original table; the projection is not a standalone archive.',
                         'Closed finite certificates check encoded JS outputs, not all JS executions or the encoder globally.',
                         'Full source keys are interned injectively by the encoder; Lean checks the resulting numeric keys. JSON parsing/key interning are external coding steps.',
                         'Source-only proof counts remain unknown; empty recorded proof pools do not mean no proofs.',
                         'No common-context typing, mathematical premise necessity, quotient acyclicity or measured comprehension theorem.']}
    args.report.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    with args.report.with_suffix(args.report.suffix + '.gz').open('wb') as f:
        f.write(gzip.compress(args.report.read_bytes(), mtime=0))
    print(json.dumps({k: report[k] for k in ('status', 'generalTheorems', 'finiteProjectionCertificates', 'nativeProfiles', 'positionAppearances')}), flush=True)
    print('Temporary reproduction inputs and compiler logs: ' + str(work), flush=True)


if __name__ == '__main__':
    main()
