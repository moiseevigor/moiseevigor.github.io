/* Finite bridge from the general Lean laws to the existing count/cut models. */
'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib');
const crypto = require('crypto'), assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '../../..'));
const M = require('../free-index-multiplicity/model.cjs');
const W = require('../../../public/js/proof-atlas-occurrence-window');
const P = require('../../../public/js/proof-atlas-packed-routes');
const A = require('../../../public/js/proof-atlas-library-data');
const T = require('../../../public/js/proof-atlas-deep-context');
const {cases} = require('../mixed-interfaces/inputs.cjs');
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
const base = 'research/proof-atlas/source-reference-laws/';
const native = JSON.parse(z.gunzipSync(fs.readFileSync(base + 'native.json.gz')));
for (const [file, hash] of Object.entries(native.producer.sourceFiles))
  assert.equal(sha(fs.readFileSync(file)), hash, 'changed native input: ' + file);
const key = q => q.node + ':' + q.index;
const out = {status: 'RUNNING', nativeFixtures: 0, nativeCoefficientRows: 0,
  nativeRootComparisons: 0, occurrenceCuts: 0, cutCoefficientChecks: 0,
  refinementTransfers: 0, contextCoefficients: 0, profiles: 0, selectedBodies: 0,
  frontierTerms: 0, visibleTerms: 0, rejectedAlternatives: 0, peakCells: 0, peakDigits: 0,
  sources: []};

// This oracle enumerates the small native tree by occurrence. It does not call
// the sparse-vector evaluator or read stored scope summaries.
function enumerate(tree, target, at = 0, depth = Infinity) {
  if (at >= depth) return {visible: 0n, hidden: enumerate(tree, target).visible};
  let visible = tree.kind === 'bvar' && tree.index === target ? 1n : 0n, hidden = 0n;
  tree.children.forEach((child, slot) => {
    const extended = (tree.kind === 'lam' || tree.kind === 'forallE') && slot === 1 ||
      tree.kind === 'letE' && slot === 2;
    const count = enumerate(child, target + Number(extended), at + 1, depth);
    visible += count.visible; hidden += count.hidden;
  });
  return {visible, hidden};
}

function fromTree(tree, label) {
  const data = {serialization: 'ExprDAG/1', kind: [], children: [], payloads: [],
    expanded: [], neededScope: [], roots: [], declaration: {name: label, rootPaths: ['root.value']}};
  const intern = new Map();
  function add(t) {
    const tag = JSON.stringify(t); if (intern.has(tag)) return intern.get(tag);
    const children = t.children.map(add), kind = A.kinds.indexOf(t.kind), id = data.kind.length;
    assert(kind >= 0); data.kind.push(kind); data.children.push(children);
    data.payloads.push(t.kind === 'bvar' ? {index: t.index} : {});
    data.expanded.push(String(1n + children.reduce((n, c) => n + BigInt(data.expanded[c]), 0n)));
    data.neededScope.push(kind === 0 ? t.index + 1 : Math.max(0, ...children.map((c, s) =>
      data.neededScope[c] - Number((kind === 6 || kind === 7) && s === 1 || kind === 8 && s === 2))));
    intern.set(tag, id); return id;
  }
  data.roots = [add(tree)];
  const hash = sha(JSON.stringify(data));
  const record = {name: label, uniqueNodes: data.kind.length, indexSha256: hash, sourceSha256: hash};
  W.validateSource(data, record);
  return {data, record};
}

// Resolve lexical shifts independently from the window's cached scopeDepth.
function resolve(data, packed, startDepth = 0) {
  let node = data.roots[packed.root], depth = 0;
  const bytes = P.parse(packed);
  for (let at = 0; at < packed.depth; at++) {
    const slot = (bytes[at >> 2] >> ((at % 4) * 2)) & 3;
    const kind = data.kind[node];
    if ((kind === 6 || kind === 7) && slot === 1 || kind === 8 && slot === 2) depth++;
    node = data.children[node][slot];
  }
  assert(depth >= startDepth);
  return {node, depth: depth - startDepth};
}

function makeCut(data, record, route, options, indices) {
  const scene = W.create(data, record, route, options), root = resolve(data, route);
  const visible = new Map(indices.map(i => [i, 0n])), frontiers = [];
  for (const n of scene.nodes) {
    const selected = resolve(data, n.route, root.depth);
    assert.equal(selected.node, n.node);
    if (n.kind === 'bvar') for (const i of indices)
      if (data.payloads[n.node].index === i + selected.depth) visible.set(i, visible.get(i) + 1n);
    for (const port of n.ports) if (!port.displayed) {
      const hidden = resolve(data, port.route, root.depth);
      assert.equal(hidden.node, port.node);
      frontiers.push(hidden);
    }
  }
  return {scene, root: root.node, visible, frontiers};
}

function checkCuts(data, record, groups) {
  const queries = new Map(), cuts = [];
  const add = (node, index) => {const q = {node, index}; queries.set(key(q), q);};
  for (const {route, indices} of groups) {
    let previous = null;
    for (const maxNodes of [1, 7, 13, 32]) {
      const cut = makeCut(data, record, route, {maxNodes, maxDepth: 3}, indices);
      for (const i of indices) {
        add(cut.root, i);
        for (const f of cut.frontiers) add(f.node, i + f.depth);
      }
      cuts.push({...cut, indices, previous}); previous = cut;
    }
  }
  const result = M.evaluate(data, [...queries.values()]);
  assert.equal(result.status, 'complete', record.name);
  out.peakCells = Math.max(out.peakCells, result.stats.peakCoefficientCells);
  out.peakDigits = Math.max(out.peakDigits, result.stats.peakDecimalDigits);
  const counts = new Map(result.rows.map(r => [key(r), BigInt(r.count)]));
  for (const cut of cuts) {
    out.occurrenceCuts++;
    for (const i of cut.indices) {
      const total = counts.get(cut.root + ':' + i);
      const hidden = cut.frontiers.reduce((n, f) => n + counts.get(f.node + ':' + (i + f.depth)), 0n);
      assert.equal(cut.visible.get(i) + hidden, total, record.name + ' index ' + i);
      out.cutCoefficientChecks++; out.frontierTerms += cut.frontiers.length;
      out.visibleTerms += Number(cut.visible.get(i));
      if (i > 0) out.contextCoefficients++;
      if (cut.previous) {
        const before = cut.previous;
        const paths = new Set(cut.scene.nodes.map(n => W.id(n.route)));
        assert(before.scene.nodes.every(n => paths.has(W.id(n.route))));
        const oldHidden = before.frontiers.reduce((n, f) => n + counts.get(f.node + ':' + (i + f.depth)), 0n);
        assert(cut.visible.get(i) >= before.visible.get(i)); assert(hidden <= oldHidden);
        assert.equal(cut.visible.get(i) - before.visible.get(i), oldHidden - hidden);
        out.refinementTransfers++;
      }
    }
  }
  return sha(JSON.stringify(result.rows));
}

(async () => {
  for (const c of native.cases) {
    const {data, record} = fromTree(c.source, c.label);
    assert.equal(c.proofTypingClaim, false);
    const result = M.evaluate(data, Array.from({length: 8}, (_, index) => ({node: data.roots[0], index})));
    assert.equal(result.status, 'complete');
    for (const row of c.rows) for (const coefficient of row.coefficients) {
      const expected = enumerate(c.source, coefficient.index, 0, row.depth);
      assert.equal(String(expected.visible), coefficient.visible);
      assert.equal(String(expected.hidden), coefficient.hidden);
      assert.equal(String(expected.visible + expected.hidden), coefficient.total);
      assert.equal(result.rows[coefficient.index].count, coefficient.total);
      out.nativeCoefficientRows++;
    }
    out.nativeRootComparisons += 8; out.nativeFixtures++;
    checkCuts(data, record, [{route: P.encode(0, []), indices: [0, 1, 2, 3, 4, 5, 6, 7]}]);
  }
  // Original native construction routes select a finite, explicitly overlapping
  // set of proof bodies; counts remain syntactic and add no typing judgments.
  for await (const x of cases()) {
    const groups = [];
    for (const entry of x.c.entries) if (['Pi-introduction', 'let-binding'].includes(T.construction(entry, x.c.data)?.rule)) {
      const route = P.append(entry.route, [x.c.data.kind[entry.node] === 8 ? 2 : 1]);
      const root = P.resolve(x.c.data, route).node, scope = x.c.data.neededScope[root];
      const indices = Array.from({length: scope + 1}, (_, i) => i);
      assert(indices.length <= 513); groups.push({route, indices}); out.selectedBodies++;
    }
    const resultSha256 = checkCuts(x.c.data, x.record, groups);
    out.sources.push({edition: x.edition, name: x.record.name, indexSha256: x.record.indexSha256,
      storedNodes: x.c.data.kind.length, bodyQueries: groups.length, resultSha256});
    out.profiles++;
  }
  // A shared node contributes at every child-field occurrence. The exact count
  // is beyond Number precision, while only 181 source nodes are stored.
  let tree = {kind: 'bvar', index: 0, children: []};
  const shared = fromTree(tree, 'shared-base');
  let root = shared.data.roots[0];
  for (let j = 0; j < 180; j++) {
    const d = shared.data, next = d.kind.length;
    d.kind.push(5); d.children.push([root, root]); d.payloads.push({});
    d.neededScope.push(1); d.expanded.push(String(1n + 2n * BigInt(d.expanded[root]))); root = next;
  }
  shared.data.roots = [root]; shared.record.uniqueNodes = shared.data.kind.length;
  shared.record.indexSha256 = shared.record.sourceSha256 = sha(JSON.stringify(shared.data));
  W.validateSource(shared.data, shared.record);
  assert.equal(M.evaluate(shared.data, [{node: root, index: 0}]).rows[0].count, String(1n << 180n));
  checkCuts(shared.data, shared.record, [{route: P.encode(0, []), indices: [0, 1]}]);
  out.largeSharing = {storedNodes: 181, count: String(1n << 180n), proofTypingClaim: false};
  // The field controls are discriminating: treating a body like a domain,
  // forgetting repeated fields or counting a local binder changes the answer.
  function wrongCount(tree, target, mode) {
    if (tree.kind === 'bvar') return tree.index === target ? 1n : 0n;
    let children = tree.children;
    if (mode === 'deduplicate-fields') children = [...new Map(children.map(c => [JSON.stringify(c), c])).values()];
    return children.reduce((sum, child, slot) => {
      const shift = mode === 'shift-all-let-fields' && tree.kind === 'letE';
      return sum + wrongCount(child, target + Number(shift), mode);
    }, 0n);
  }
  for (const label of ['lambda-body', 'pi-body', 'let-body', 'let-type', 'let-value', 'lambda-local', 'shared-reference-0']) {
    const c = native.cases.find(c => c.label === label);
    const expected = BigInt(c.rows[0].coefficients[0].total);
    const mode = label === 'let-type' || label === 'let-value' ? 'shift-all-let-fields' :
      label === 'shared-reference-0' ? 'deduplicate-fields' : 'no-body-shifts';
    const wrong = wrongCount(c.source, 0, mode);
    assert.notEqual(wrong, expected, 'control does not distinguish ' + mode);
    out.rejectedAlternatives++;
  }
  assert.equal(out.nativeFixtures, 52); assert.equal(out.nativeCoefficientRows, 2496);
  assert.equal(out.profiles, 51); assert.equal(out.selectedBodies, 303);
  assert(out.contextCoefficients > 0 && out.visibleTerms > 0 && out.frontierTerms > 0);
  const files = [base + 'check.cjs', base + 'native.json.gz',
    'research/proof-atlas/free-index-multiplicity/model.cjs',
    'public/js/proof-atlas-occurrence-window.js', 'public/js/proof-atlas-packed-routes.js',
    'public/js/proof-atlas-geometry-core.js', 'public/js/proof-atlas-library-data.js',
    'public/js/proof-atlas-deep-context.js',
    'research/proof-atlas/mixed-interfaces/inputs.cjs',
    'research/proof-atlas/construction-pages/captions.cjs',
    'research/proof-atlas/local-definitions/control-pages.cjs',
    ...['library', 'occurrence-types', 'goedel-sample', 'let-result-pools', 'source-pages', 'construction-pages']
      .map(name => 'public/data/proof-atlas/' + name + '-manifest.js')];
  out.files = Object.fromEntries(files.map(f => [f, sha(fs.readFileSync(f))]));
  out.status = 'PASS';
  out.scope = 'Finite bridge for all coefficients at selected original source cuts. '
    + 'The general Lean theorem does not prove the JavaScript implementation, fixture decoder or source authentication. '
    + 'Complete source DAGs are resident in this offline comparison. No native typing, semantic necessity or comprehension claim.';
  fs.writeFileSync(base + 'model-check.json.gz', z.gzipSync(JSON.stringify(out, null, 2) + '\n'));
  console.log(JSON.stringify({...out, sources: undefined, files: undefined}));
})().catch(error => {console.error(error.stack); process.exitCode = 1;});
