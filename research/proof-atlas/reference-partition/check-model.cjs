'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), z = require('zlib');
const assert = require('assert/strict'), crypto = require('crypto');
process.chdir(path.resolve(__dirname, '../../..'));
const R = require('../../../public/js/proof-atlas-reference-partition');
const C = require('../../../public/js/proof-atlas-syntax-counts');
const W = require('../../../public/js/proof-atlas-occurrence-window');
const P = require('../../../public/js/proof-atlas-packed-routes');
const A = require('../../../public/js/proof-atlas-library-data');
const AI = require('../../../public/js/proof-atlas-ai-sample');
const T = require('../../../public/js/proof-atlas-deep-context');
const Mixed = require('../../../public/js/proof-atlas-mixed-interfaces');
const Definitions = require('../../../public/js/proof-atlas-local-definition-frame');
const M = require('../free-index-multiplicity/model.cjs');
const {cases} = require('../mixed-interfaces/inputs.cjs');
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
const base = 'research/proof-atlas/reference-partition/';
const h = {};
for (const n of ['library-manifest', 'goedel-sample-manifest', 'syntax-counts-manifest'])
  vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + n + '.js', 'utf8'), {window: h});
const {library} = AI.register(h.PROOF_ATLAS_LIBRARY, null, null, h.PROOF_ATLAS_AI_SAMPLE);
const inventory = h.PROOF_ATLAS_SYNTAX_COUNTS;
const key = route => route.root + ':' + route.depth + ':' + route.slots;
const prefix = (a, b) => a.root === b.root && a.depth <= b.depth && key(a) === key(P.prefix(b, a.depth));
const queryKey = q => q.node + ':' + q.index;
const fetcher = async file => {
  assert(file.startsWith('/public/data/proof-atlas/syntax-count-pages/'), 'whole archive request: ' + file);
  return new Response(fs.readFileSync(file.slice(1)));
};
const out = {status: 'RUNNING', packets: 0, packetsWithBinders: 0, sourceStarts: 0,
  sourceCuts: 0, sourceAnnotations: 0, positiveExposed: 0, positiveFolded: 0,
  zeroTotals: 0, mixedFrames: 0, definitionFrames: 0, frameAnnotations: 0,
  frontierTerms: 0, independentChecks: 0, refusals: 0, mutationControls: 0,
  peakPageBytes: 0, peakCells: 0, peakDigits: 0, packetsChecked: []};

// Read original routes independently. No count helper or cached binding link
// participates in this oracle's target-index calculation.
function resolve(data, route) {
  const bytes = P.parse(route); let node = data.roots[route.root], depth = 0;
  for (let j = 0; j < route.depth; j++) {
    const slot = (bytes[j >> 2] >> ((j % 4) * 2)) & 3, kind = data.kind[node];
    if ((kind === 6 || kind === 7) && slot === 1 || kind === 8 && slot === 2) depth++;
    node = data.children[node][slot];
  }
  return {node, depth};
}

function prepareOracle(data, scene, partition, queries) {
  const raw = scene.format === 'ProofAtlasOccurrenceWindow/1';
  const b = partition.body.route, selected = resolve(data, b);
  assert.equal(selected.node, partition.body.node);
  let exposed = 0n;
  if (raw) for (const n of scene.nodes) if (n.kind === 'bvar' && prefix(b, n.route)) {
    const at = resolve(data, n.route);
    if (data.payloads[at.node].index === at.depth - selected.depth) exposed++;
  }
  const all = raw ? scene.nodes.flatMap(n => n.ports.filter(p => !p.displayed)) : scene.sourcePartition.regions;
  const frontiers = [];
  for (const f of all) if (prefix(b, f.route)) {
    const at = resolve(data, f.route), q = {node: at.node, index: at.depth - selected.depth};
    assert.equal(at.node, f.node); assert(q.index >= 0);
    queries.set(queryKey(q), q); frontiers.push(q);
  }
  const root = {node: selected.node, index: 0}; queries.set(queryKey(root), root);
  return {partition, exposed, frontiers, root};
}

function compare(data, pending) {
  const queries = new Map();
  const rows = pending.map(({scene, partition}) => prepareOracle(data, scene, partition, queries));
  const result = M.evaluate(data, [...queries.values()]); assert.equal(result.status, 'complete');
  const counts = new Map(result.rows.map(q => [queryKey(q), BigInt(q.count)]));
  for (const {partition: p, exposed, frontiers, root} of rows) {
    const folded = frontiers.reduce((n, q) => n + counts.get(queryKey(q)), 0n);
    assert.equal(p.exposed, String(exposed)); assert.equal(p.folded, String(folded));
    assert.equal(p.total, String(counts.get(queryKey(root))));
    assert.equal(p.total, String(exposed + folded)); out.independentChecks++;
    out.frontierTerms += frontiers.length;
    if (exposed > 0n) out.positiveExposed++;
    if (folded > 0n) out.positiveFolded++;
    if (p.total === '0') out.zeroTotals++;
  }
  out.peakCells = Math.max(out.peakCells, result.stats.peakCoefficientCells);
  out.peakDigits = Math.max(out.peakDigits, result.stats.peakDecimalDigits);
  return sha(JSON.stringify(rows.map(r => r.partition)));
}

async function annotate(scene, points, cursor, pending) {
  const before = JSON.stringify(scene), model = await R.open(scene);
  for (const point of points) {
    const a = await cursor.forPoint(point, scene.source); assert(a && a.status === 'complete');
    const partition = model.forAnnotation(a);
    assert(Object.isFrozen(partition) && Object.isFrozen(partition.binder.route));
    assert.equal(partition.countManifestSha256, a.manifestSha256);
    assert.equal(partition.countModelSha256, a.modelSha256);
    assert.equal(partition.countContribution, '0'); assert.equal(partition.typing, 'not-queried');
    pending.push({scene, partition});
  }
  assert.equal(model.state().sourceRowsFetched, 0); assert.equal(model.state().nativeTypesInferred, 0);
  model.dispose(); assert.equal(model.state().retained, 0); assert.equal(model.state().frontiers, 0);
  assert.equal(JSON.stringify(scene), before);
}

(async () => {
  let sample;
  for (const edition of library.editions) for (const record of edition.declarations) {
    const raw = z.gunzipSync(fs.readFileSync(record.indexFile.slice(1)), {maxOutputLength: 67108864});
    assert.equal(sha(raw), record.indexSha256);
    const data = A.validateIndex(JSON.parse(raw), record), binders = [];
    data.kind.forEach((k, node) => {if ([6, 7, 8].includes(k)) binders.push(node);});
    out.packets++;
    if (!binders.length) continue;
    out.packetsWithBinders++;
    const d = inventory.records.find(d => d.edition === edition.id && d.indexSha256 === record.indexSha256 && d.name === record.name);
    assert(d); const cursor = await C.open(d, record, {fetcher}), routes = W.representatives(data), pending = [];
    const selected = [...new Set([binders[0], binders[Math.floor(binders.length / 2)], binders.at(-1)])];
    for (const node of selected) {
      const route = routes.route(node); out.sourceStarts++;
      for (const maxNodes of [1, 7, 13, 32]) {
        const scene = W.create(data, record, route, {maxNodes, maxDepth: 3});
        const points = scene.nodes.filter(n => ['lam', 'forallE', 'letE'].includes(n.kind));
        await annotate(scene, points, cursor, pending);
        out.sourceCuts++; out.sourceAnnotations += points.length;
        if (!sample && points.length && scene.nodes.some(n => n.kind === 'bvar' && n.binding) &&
          scene.nodes.some(n => n.ports.some(p => !p.displayed))) {
          const point = points.find(p => scene.nodes.some(n => n.binding?.node === p.node && key(n.binding.route) === key(p.route)));
          if (point) sample = {scene: structuredClone(scene), a: await cursor.forPoint(point, scene.source)};
        }
      }
    }
    const resultSha256 = compare(data, pending);
    out.packetsChecked.push({edition: edition.id, name: record.name, indexSha256: record.indexSha256,
      starts: selected.length, annotations: pending.length, resultSha256});
    out.peakPageBytes = Math.max(out.peakPageBytes, cursor.state().peakPageBytes); cursor.dispose();
    if (out.packets % 250 === 0) console.log(JSON.stringify({packets: out.packets, sourceCuts: out.sourceCuts, checks: out.independentChecks}));
  }
  for await (const x of cases()) {
    if (x.core) break;
    const d = inventory.records.find(d => d.edition === x.edition && d.indexSha256 === x.record.indexSha256 && d.name === x.record.name);
    const cursor = await C.open(d, x.record, {fetcher});
    const mixed = Mixed.open(x.c, x.captions, x.edition), definitions = Definitions.open(x.c, x.captions, x.edition), pending = [];
    for (const e of x.c.entries) if (['Pi-introduction', 'let-binding'].includes(T.construction(e, x.c.data)?.rule)) {
      for (const [provider, field] of [[mixed, 'mixedFrames'], ...(x.c.data.kind[e.node] === 8 ? [[definitions, 'definitionFrames']] : [])]) {
        const scene = await provider.create(e.route, {maxUnits: 8});
        const points = scene.units.map(u => W.create(x.c.data, x.record, u.root.route, {maxNodes: 1, maxDepth: 0}).nodes[0]);
        await annotate(scene, points, cursor, pending); out[field]++; out.frameAnnotations += points.length;
      }
    }
    compare(x.c.data, pending); cursor.dispose();
  }
  assert(sample);
  for (const mutate of [s => s.source.indexSha256 = '0'.repeat(64),
    s => s.nodes.push(structuredClone(s.nodes[0])),
    s => s.nodes.splice(1, 1),
    s => s.stats.represented = '1',
    s => s.nodes[0].expanded = '1',
    s => s.nodes.flatMap(n => n.ports).find(p => !p.displayed).route = P.encode(31, [])]) {
    const changed = structuredClone(sample.scene); mutate(changed);
    let model = null, refused = false;
    try {
      model = await R.open(changed); model.forAnnotation(sample.a);
    } catch (error) {assert(error instanceof Error); refused = true;}
    finally {model?.dispose();}
    assert(refused, 'changed cut was accepted');
    out.refusals++;
  }
  const lease = await R.open(sample.scene);
  for (const mutate of [a => a.status = 'unavailable', a => a.count = '-1',
    a => a.body.node++, a => a.route = P.encode(31, []), a => a.count = '0',
    a => a.source.name += 'foreign']) {
    const a = structuredClone(sample.a); mutate(a); assert.throws(() => lease.forAnnotation(a)); out.refusals++;
  }
  lease.dispose(); assert.throws(() => lease.forAnnotation(sample.a)); out.refusals++;
  const controller = new AbortController(), pending = R.open(sample.scene, {signal: controller.signal});
  controller.abort(); await assert.rejects(pending); out.refusals++;
  const changed = structuredClone(sample.scene), opened = R.open(changed);
  changed.nodes[0].node++; changed.source.indexSha256 = '0'.repeat(64);
  const captured = await opened; assert.equal(captured.forAnnotation(sample.a).source.indexSha256, sample.a.source.indexSha256);
  captured.dispose(); out.mutationControls++;
  assert.equal(out.packets, 2118); assert.equal(out.mixedFrames, 269);
  assert(out.positiveExposed > 0 && out.positiveFolded > 0 && out.zeroTotals > 0);
  const files = ['public/js/proof-atlas-reference-partition.js', 'public/js/proof-atlas-syntax-counts.js',
    'public/js/proof-atlas-occurrence-window.js', 'public/js/proof-atlas-packed-routes.js',
    'public/js/proof-atlas-mixed-interfaces.js', 'public/js/proof-atlas-local-definition-frame.js',
    'research/proof-atlas/free-index-multiplicity/model.cjs', base + 'check-model.cjs',
    'public/data/proof-atlas/library-manifest.js', 'public/data/proof-atlas/goedel-sample-manifest.js',
    'public/data/proof-atlas/syntax-counts-manifest.js'];
  out.files = Object.fromEntries(files.map(f => [f, sha(fs.readFileSync(f))]));
  out.status = 'PASS';
  out.scope = 'Finite source-cut projection with independently recomputed frontier coefficients and source indices. '
    + 'First/middle/last stored-binder representatives, four budgets, all public mixed starts and let-only starts. '
    + 'Source/name/body identities are retained. Authentication and lexical validity remain caller preconditions; '
    + 'the projection is not a new source or native certificate. Offline oracles retain complete source DAGs.';
  fs.writeFileSync(base + 'model-check.json.gz', z.gzipSync(JSON.stringify(out, null, 2) + '\n'));
  console.log(JSON.stringify({...out, files: undefined, packetsChecked: undefined}));
})().catch(error => {console.error(error.stack); process.exitCode = 1;});
