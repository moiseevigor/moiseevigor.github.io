"""Independent, bounded comparison of recorded type interfaces at exact source uses.

This checker imports neither the scene producer nor its expression comparator.
Native PASS fields remain recorded attestations: this is not a kernel replay.
"""
from pathlib import Path
from collections import OrderedDict, Counter
import argparse
import copy
import gzip
import hashlib
import json

KINDS = ('bvar', 'fvar', 'mvar', 'sort', 'const', 'app', 'lam', 'forallE', 'letE', 'lit', 'mdata', 'proj')
FIELDS = {5: ('fn', 'arg'), 6: ('domain', 'body'), 7: ('domain', 'body'), 8: ('type', 'value', 'body'), 10: ('expr',), 11: ('struct',)}
ROLES = {'proof', 'value', 'type'}
MAX_BYTES = 64 * 1024**2
MAX_STATES = 131072


def require(test, message):
    if not test:
        raise ValueError(message)


def beneath(route, parent):
    return route['root'] == parent['root'] and route['slots'][:len(parent['slots'])] == parent['slots']


def occurrence(data, route):
    require(type(route.get('root')) is int and 0 <= route['root'] < len(data['roots']), 'source root')
    slots = route['slots']
    require(isinstance(slots, list) and len(slots) <= 512, 'source route bound')
    node = data['roots'][route['root']]
    path = data['declaration']['rootPaths'][route['root']]
    context = []
    for j, slot in enumerate(slots):
        kind = data['kind'][node]
        require(type(slot) is int and 0 <= slot < len(FIELDS.get(kind, ())), 'source field')
        if kind in (6, 7) and slot == 1 or kind == 8 and slot == 2:
            context.append(dict(node=node, kind=KINDS[kind], path=path,
                                route=dict(root=route['root'], slots=slots[:j])))
        path += '.' + FIELDS[kind][slot]
        node = data['children'][node][slot]
    return dict(node=node, path=path, route=route, context=context)


class Checker:
    def __init__(self, repo):
        self.repo = repo.resolve()
        self.source = None
        self.source_identity = None
        self.evidence = OrderedDict()
        self.hashes = {}
        self.comparisons = 0
        self.pair_states = 0

    def load(self, file, digest):
        require(file.startswith('/public/data/proof-atlas/'), 'public evidence path')
        path = (self.repo / file.lstrip('/')).resolve()
        try:
            path.relative_to(self.repo / 'public/data/proof-atlas')
        except ValueError:
            raise ValueError('evidence path traversal')
        key = (file, digest)
        if key not in self.evidence:
            with gzip.open(path, 'rb') as f:
                raw = f.read(MAX_BYTES + 1)
            require(len(raw) <= MAX_BYTES, 'decoded input bound')
            require(hashlib.sha256(raw).hexdigest() == digest, 'compiled evidence hash')
            self.evidence[key] = json.loads(raw)
            self.hashes[file] = digest
            while len(self.evidence) > 2:
                self.evidence.popitem(last=False)
        self.evidence.move_to_end(key)
        return self.evidence[key]

    def set_source(self, record):
        identity = (record['name'], record['indexSha256'], record['sourceSha256'])
        if identity != self.source_identity:
            self.evidence.clear()
            self.source = self.load(record['indexFile'], record['indexSha256'])
            require(self.source['declaration']['name'] == record['name'], 'source declaration')
            self.source_identity = identity

    def resolve(self, reference):
        require(reference['namespace'] == 'type-expression', 'unsupported computed namespace')
        pkg = self.load(reference['file'], reference['evidenceSha256'])
        require(tuple(pkg['source'][f] for f in ('name', 'indexSha256', 'sourceSha256')) == self.source_identity, 'evidence source identity')
        require(pkg['nativeDagMatchesPacket'] is True and pkg['leanVersion'] == '4.33.1', 'native packet attestation')
        query = reference['query']
        at = occurrence(self.source, query['route'])
        require(query['node'] == at['node'] and query['path'] == at['path'], 'query occurrence')
        es = [e for e in pkg['entries'] if e['route'] == query['route']]
        require(len(es) == 1, 'unique recorded query')
        e = es[0]
        require(e['status'] == 'checked' and e['kernelCheck'] == 'PASS' and e['contextWellFormed'] is True and e['typeAbstractionRoundtrip'] is True, 'native query attestation')
        require(e['node'] == at['node'] and e['path'] == at['path'] and e['context'] == at['context'], 'query lexical context')
        component, origin = reference.get('component'), reference.get('typingOrigin')
        require(not (component and origin), 'ambiguous reference derivation')
        if component:
            require(reference.get('relation') == 'recorded-parent-premise', 'parent premise relation')
            family, part = component['part'].split('-', 1)
            slot = component.get('slot')
        elif origin:
            require(origin['query'] == query, 'observation origin query')
            family = {'application-trace-observation': 'application', 'lambda-introduction-observation': 'lambda', 'let-premise-observation': 'let'}.get(origin['kind'])
            require(family is not None, 'unsupported observation origin')
            part, slot = origin['part'], origin.get('slot')
        else:
            family, part, slot = None, None, None
        subject, root, role = at, e['typeRoot'], e['role']
        if family:
            t = e[{'application': 'applicationJudgment', 'lambda': 'lambdaJudgment', 'let': 'letJudgment'}[family]]
            require(t['status'] == 'checked', 'native construction attestation')
            if family == 'application':
                stages = t['stages']
                require(stages and all(s[f] == 'PASS' for s in stages for f in ('kernelFunctionConversion', 'kernelDomainConversion', 'kernelResultConversion')), 'native application conversions')
                if part == 'head':
                    p, root = t['head'], t['head']['typeRoot']
                else:
                    require(part == 'argument' and type(slot) is int and 1 <= slot <= len(stages), 'argument slot')
                    p, root = e['arguments'][slot - 1], stages[slot - 1]['actualRoot']
                role = p['role']
            elif family == 'lambda':
                require(part in ('domain', 'body') and all(t[f] == 'PASS' for f in ('kernelDomainSort', 'kernelBinderConversion', 'kernelBodyConversion', 'kernelFunctionConversion')), 'native lambda conversions')
                p = t[part]
                root, role = p['typeRoot'], 'type' if part == 'domain' else p['role']
            else:
                require(part in ('type', 'value', 'body') and all(t[f] == 'PASS' for f in ('kernelDomainSort', 'kernelValueConversion', 'kernelResultTyping')), 'native let conversions')
                p = t[part]
                root, role = p['typeRoot'], 'type' if part == 'type' else p['role']
            subject = occurrence(self.source, p['route'])
            require(p['node'] == subject['node'] and p['path'] == subject['path'], 'premise source occurrence')
            expected_context = at['context']
            if family in ('lambda', 'let') and part == 'body':
                expected_context = expected_context + [dict(node=at['node'], kind=KINDS[self.source['kind'][at['node']]], path=at['path'], route=at['route'])]
            require(subject['context'] == expected_context, 'premise lexical extension')
            if 'context' in p:
                require(p['context'] == expected_context, 'recorded premise context')
        require(role in ROLES and type(reference['graphRoot']) is int and reference['graphRoot'] == root, 'recorded type root')
        graph = e.get('typeGraph') or pkg['typeGraph']
        return subject, role, graph, root

    def compare(self, left, a, right, b, ambient):
        # Memoize DAG pairs at lexical depth, never expand the occurrence tree.
        work, seen = [(a, b, 0)], set()
        while work:
            i, j, depth = work.pop()
            require(depth <= 512 and len(seen) < MAX_STATES, 'type comparison bound')
            state = (i, j, depth)
            if state in seen:
                continue
            seen.add(state)
            require(type(i) is int and type(j) is int and 0 <= i < len(left['kind']) and 0 <= j < len(right['kind']), 'type DAG root')
            kind = left['kind'][i]
            require(kind == right['kind'][j] and 0 <= kind < 12, 'different type constructor')
            p, q = left['payloads'][i], right['payloads'][j]
            require(p == q, 'different type payload')
            require(kind not in (1, 2), 'unresolved elaborator type object')
            if kind == 0:
                require(type(p['index']) is int and 0 <= p['index'] < ambient + depth, 'type variable outside lexical context')
            cs, ds = left['children'][i], right['children'][j]
            require(len(cs) == len(ds) == len(FIELDS.get(kind, ())), 'type constructor fields')
            for slot, (c, d) in enumerate(zip(cs, ds)):
                require(c < i and d < j, 'non-topological type graph')
                extended = kind in (6, 7) and slot == 1 or kind == 8 and slot == 2
                work.append((c, d, depth + int(extended)))
        self.comparisons += 1
        self.pair_states += len(seen)
        return len(seen)

    def check(self, case):
        self.set_source(case['source'])
        boundary, child = case['boundary'], case['child']
        at = occurrence(self.source, boundary['route'])
        origin = occurrence(self.source, boundary['origin']['route'])
        require(origin['node'] == boundary['origin']['node'] and origin['path'] == boundary['origin']['path'], 'origin source occurrence')
        require(beneath(at['route'], origin['route']) and len(at['route']['slots']) > len(origin['route']['slots']), 'origin source ancestry')
        for f in ('node', 'path', 'route'):
            require(boundary[f] == child[f] == at[f], 'child boundary occurrence')
        require(child['context'] == at['context'], 'child lexical context')
        edge = case['edge']
        require(edge['from'] == at['path'] and edge['to'] == boundary['origin']['path'], 'refinement connection')
        parent_ref, child_ref = boundary['typeReference'], child['typeReference']
        require(edge['relation'] == ('recorded-premise' if parent_ref else 'source-field'), 'source field promoted to premise')
        if parent_ref:
            interface = case['rootInterface']
            require(interface is not None and interface['relation'] == 'recorded-observation-and-structural-type-agreement', 'typed boundary interface absent')
            require(interface['reference'] == parent_ref and interface['role'] == boundary['role'], 'changed parent interface')
            for f in ('node', 'path', 'route'):
                require(interface[f] == at[f], 'interface occurrence')
            subject, role, graph, root = self.resolve(parent_ref)
            require(subject == at and role == boundary['role'] == child['role'], 'parent observation subject or role')
            require(child_ref is not None, 'typed child observation absent')
        else:
            require(case['rootInterface'] is None, 'invented parent typing')
            require(boundary['role'] == 'unrecorded', 'invented parent proof role')
        if child_ref:
            subject, role, own_graph, own_root = self.resolve(child_ref)
            require(subject == at and role == child['role'], 'child observation subject or role')
            self.compare(own_graph, own_root, own_graph, own_root, len(at['context']))
            if parent_ref:
                return self.compare(graph, root, own_graph, own_root, len(at['context']))
        else:
            require(child['role'] == 'unrecorded', 'invented child proof role')
        return 0


def negative_controls(cases, repo):
    checker, results = Checker(repo), []
    representatives = {}
    for case in cases:
        ref = case['boundary']['typeReference']
        if ref:
            representatives.setdefault(ref['component']['part'], case)

    def rejects(name, original, mutate):
        checker.check(original)
        bad = copy.deepcopy(original)
        mutate(bad)
        try:
            checker.check(bad)
        except (ValueError, KeyError, IndexError, TypeError) as error:
            results.append(dict(control=name, reason=str(error)))
        else:
            raise AssertionError('Control was accepted: ' + name)

    for family, case in representatives.items():
        mutations = [
            ('missing-interface', lambda c: c.update(rootInterface=None)),
            ('wrong-source-hash', lambda c: c['source'].update(indexSha256='0' * 64)),
            ('wrong-evidence-hash', lambda c: c['child']['typeReference'].update(evidenceSha256='0' * 64)),
            ('wrong-namespace', lambda c: c['child']['typeReference'].update(namespace='source-expression')),
            ('wrong-type-root', lambda c: c['child']['typeReference'].update(graphRoot=c['child']['typeReference']['graphRoot'] + 1)),
            ('wrong-child-role', lambda c: c['child'].update(role='type' if c['child']['role'] != 'type' else 'proof')),
            ('wrong-edge-relation', lambda c: c['edge'].update(relation='source-field')),
            ('wrong-interface-occurrence', lambda c: c['rootInterface'].update(node=-1)),
            ('changed-parent-reference', lambda c: c['rootInterface']['reference'].update(graphRoot=-1)),
            ('escaped-evidence-path', lambda c: c['child']['typeReference'].update(file='/public/data/proof-atlas/../../../../etc/passwd')),
        ]
        if case['child']['context']:
            mutations.append(('omitted-context-entry', lambda c: c['child']['context'].pop()))
        for name, mutate in mutations:
            rejects(family + '/' + name, case, mutate)
    source_only = next(c for c in cases if not c['boundary']['typeReference'] and c['child']['typeReference'])
    rejects('typed-child-does-not-type-parent-edge', source_only, lambda c: c['edge'].update(relation='recorded-premise'))
    rejects('typed-child-does-not-give-parent-proof-role', source_only, lambda c: c['boundary'].update(role='proof'))
    selected = [c for c in cases if c.get('selectedSharedNodeControl')]
    require(len(selected) == 2 and selected[0]['child']['node'] == selected[1]['child']['node'] == 17, 'predetermined shared-use controls')
    for i, case in enumerate(selected):
        other = selected[1-i]
        rejects('shared-node-type-record-swap-' + str(i), case, lambda c: c['child'].update(typeReference=copy.deepcopy(other['child']['typeReference'])))
        rejects('shared-node-context-swap-' + str(i), case, lambda c: c['child'].update(context=copy.deepcopy(other['child']['context'])))
    # Even literally equal stored type roots cannot identify their subject use.
    groups = {}
    same_type_pair = None
    for case in cases:
        ref = case['child']['typeReference']
        if not ref:
            continue
        k = (case['source']['indexSha256'], case['child']['node'], case['child']['role'], ref['evidenceSha256'], ref['graphRoot'])
        other = groups.get(k)
        if other and other['child']['route'] != case['child']['route']:
            same_type_pair = (other, case)
            break
        groups[k] = case
    require(same_type_pair is not None, 'shared subject with same stored type at distinct uses')
    first, second = same_type_pair
    rejects('same-term-same-type-different-source-use', first, lambda c: c['child'].update(typeReference=copy.deepcopy(second['child']['typeReference'])))
    return results


def comparator_controls(repo):
    """Well-scoped serialized expressions; no mathematical typing assertions."""
    checker = Checker(repo)
    base = dict(kind=[4, 0, 6], children=[[], [], [0, 1]],
                payloads=[dict(name='Nat', nameParts=[dict(str='Nat')], levels=[]),
                          dict(index=0), dict(binderName='x', binderNameParts=[dict(str='x')], binderInfo='default')])
    require(checker.compare(base, 2, base, 2, 0) == 3, 'internal lambda scope')
    let = copy.deepcopy(base)
    let['kind'][2], let['children'][2], let['payloads'][2] = 8, [0, 0, 1], dict(declName='x', nondep=False)
    checker.compare(let, 2, let, 2, 0)
    failures = []

    def rejects(label, graph, root, other=None, ambient=0):
        try:
            checker.compare(graph, root, graph if other is None else other, root, ambient)
        except ValueError as error:
            failures.append(dict(control=label, reason=str(error)))
        else:
            raise AssertionError('Comparator accepted: ' + label)

    for label, edit in [
        ('lambda-domain-before-binder', lambda g: g['children'][2].__setitem__(0, 1)),
        ('out-of-context-index', lambda g: g['payloads'][1].update(index=1)),
        ('non-topological-child', lambda g: g['children'][2].__setitem__(1, 2)),
        ('wrong-constructor-arity', lambda g: g['children'][2].append(0)),
    ]:
        graph = copy.deepcopy(base)
        edit(graph)
        rejects(label, graph, 2)
    for label, slot in [('let-type-before-binder', 0), ('let-value-before-binder', 1)]:
        graph = copy.deepcopy(let)
        graph['children'][2][slot] = 1
        rejects(label, graph, 2)
    for label, edit in [
        ('different-constant', lambda g: g['payloads'][0].update(name='Int', nameParts=[dict(str='Int')])),
        ('different-universe', lambda g: g['payloads'][0].update(levels=[dict(kind='zero')])),
        ('different-binder-info', lambda g: g['payloads'][2].update(binderInfo='implicit')),
        ('different-binder-name', lambda g: g['payloads'][2].update(binderName='y', binderNameParts=[dict(str='y')])),
    ]:
        graph = copy.deepcopy(base)
        edit(graph)
        rejects(label, base, 2, other=graph)
    for kind in (1, 2):
        graph = dict(kind=[kind], children=[[]], payloads=[dict(name='unresolved')])
        rejects('unresolved-' + KINDS[kind], graph, 0)
    shared = dict(kind=[4], children=[[]], payloads=[base['payloads'][0]])
    for i in range(1, 385):
        shared['kind'].append(5)
        shared['children'].append([i-1, i-1])
        shared['payloads'].append({})
    states = checker.compare(shared, 384, shared, 384, 0)
    require(states == 385, 'shared-DAG comparison expanded occurrences')
    return dict(negativeControls=failures, sharedStoredNodes=385,
                sharedExpandedOccurrences=str(2**385-1), sharedComparedStates=states,
                scope='Synthetic serialized syntax and scope controls, not kernel typing checks.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[3])
    parser.add_argument('--cases', type=Path, default=Path('/tmp/atlas-type-interfaces/cases.json'))
    parser.add_argument('--report', type=Path, default=Path('/tmp/atlas-type-interfaces/independent.json'))
    args = parser.parse_args()
    require(args.cases.stat().st_size <= MAX_BYTES, 'case input bound')
    raw = args.cases.read_bytes()
    packet = json.loads(raw)
    require(packet.get('format') == 'ProofAtlasTypeInterfaceCases/1', 'case format')
    cases = packet['cases']
    require(isinstance(cases, list) and 0 < len(cases) <= 4096, 'case count bound')
    sources = {(c['source']['name'], c['source']['indexSha256']) for c in cases}
    require(packet.get('packets') == len(sources), 'source inventory count')
    checker = Checker(args.repo)
    counts = Counter()
    for case in cases:
        states = checker.check(case)
        counts['boundaries'] += 1
        counts['typedInterfaces'] += bool(case['boundary']['typeReference'])
        counts['unrecordedParentFields'] += not bool(case['boundary']['typeReference'])
        counts['independentTypedChildren'] += bool(case['child']['typeReference']) and not bool(case['boundary']['typeReference'])
        counts['maxTypePairStates'] = max(counts['maxTypePairStates'], states)
    negatives = negative_controls(cases, args.repo)
    comparator = comparator_controls(args.repo)
    report = dict(status='PASS', format='ProofAtlasIndependentTypeInterfaces/1', packets=len(sources), casesSha256=hashlib.sha256(raw).hexdigest(),
                  **counts, typeComparisons=checker.comparisons, typePairStates=checker.pair_states,
                  evidenceFiles=checker.hashes, negativeControls=negatives, comparatorControls=comparator,
                  compiledPacketHashesVerified=True, typeReferenceHashesVerified=True,
                  sourceModuleBytesVerified=False, kernelReplay=False, producerOrComparatorImported=False,
                  scope='Exact compiled-source scope and recorded type syntax agreement. Native PASS fields remain attestations; no new kernel replay, definitional equality, general typing-preservation theorem or comprehension claim.')
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + '\n')
    summary = {k: len(v) if k == 'negativeControls' else v for k, v in report.items()
               if k not in ('evidenceFiles', 'comparatorControls')}
    summary.update(comparatorNegativeControls=len(comparator['negativeControls']),
                   sharedDAGComparedStates=comparator['sharedComparedStates'])
    print(json.dumps(summary))


if __name__ == '__main__':
    main()
