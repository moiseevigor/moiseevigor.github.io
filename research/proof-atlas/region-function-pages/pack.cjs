'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib');
const assert = require('assert/strict'), crypto = require('crypto'), cp = require('child_process');
const A = require('../../../public/js/proof-atlas-library-data');
const T = require('../../../public/js/proof-atlas-occurrence-types');
process.chdir(path.resolve(__dirname, '../../..'));
const base = '/public/data/proof-atlas/region-function-pages/';
const parent = 'research/proof-atlas/region-input-functions/native.json.gz';
const pinned = '39df58d9584c225b9f6fd1893df114e753f87d98';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const bytes = fs.readFileSync(parent);
assert(bytes.equals(cp.execFileSync('git', ['show', pinned + ':' + parent], { maxBuffer: 16777216 })));
const raw = z.gunzipSync(bytes), inventory = JSON.parse(raw), nativeInventorySha256 = hash(raw);
const files = new Map(), profiles = [];
const names = ['function.original', 'function.originalType', 'function.reduced', 'function.reducedType',
  'function.closed', 'function.closedType', 'source.specialization', 'source.results', 'recovery.witness', 'recovery.type'];
const owners = ['original', 'original', 'reduced', 'reduced', 'closed', 'closed', 'original', 'original', 'closed', 'closed'];
const roots = ['kind', 'children', 'payloads', 'expanded', 'neededScope'];
function put(kind, value) {
  const raw = Buffer.from(JSON.stringify(value)), sha256 = hash(raw), file = base + sha256 + '.' + kind + '.gz';
  assert(raw.length <= (kind === 'page' ? 1048576 : kind === 'index' ? 16384 : 262144));
  if (files.has(file)) assert(files.get(file).equals(raw));
  files.set(file, raw); return { file, sha256, bytes: raw.length };
}
function keys(g) {
  return g.kind.map((kind, id) => {
    assert(g.children[id].every(child => child < id));
    return null;
  }).reduce((out, _, id) => {
    out.push(hash(Buffer.from(JSON.stringify([g.kind[id], A.payloadKey(A.kinds[g.kind[id]], g.payloads[id]), g.children[id].map(child => out[child])]))));
    return out;
  }, []);
}
for (const profile of inventory.profiles) {
  const source = JSON.parse(z.gunzipSync(fs.readFileSync('.' + profile.record.indexFile)));
  assert.equal(hash(z.gunzipSync(fs.readFileSync('.' + profile.record.indexFile))), profile.source.indexSha256);
  const commonContext = profile.commonContext.map(frame => ({ node: frame.node,
    kind: A.kinds[source.kind[frame.node]], route: { root: 1, slots: frame.slots } }));
  for (const record of profile.records) {
    assert.equal(A.walk(source, record.anchor.route), record.anchor.node);
    assert.deepEqual(require('../region-input-functions/model.cjs').context(source, record.anchor).slice(0, commonContext.length), profile.commonContext);
  }
  const out = { source: profile.source, members: profile.members, cases: [] };
  for (const item of profile.native.cases) {
    const id = item.policy, nativeCaseSha256 = hash(Buffer.from(JSON.stringify(item)));
    const shared = { format: 'ProofAtlasRegionFunctionPages/1', id, source: profile.source,
      nativeInventorySha256, nativeCaseSha256, status: item.status, members: profile.members, order: profile.order,
      commonContext, sourceAnchor: profile.records[0].anchor, originalNativeOwner: profile.originalNativeOwner,
      validation: 'Producer checks exact native graph, source contexts and function binding routes. Browser checks page hashes, visible recurrences and lexical links; it does not replay the kernel.' };
    let manifest;
    if (item.status === 'KERNEL_REJECTED') {
      assert.equal(item.kernelInputTypeNonconversion, 'PASS');
      const call = profile.records.find(record => record.index === item.call);
      manifest = { ...shared, rejection: { call: item.call, slot: item.slot, phase: item.phase,
        kernelInputTypeNonconversion: item.kernelInputTypeNonconversion, source: call.ports[item.slot].input },
        components: [], bindings: [], nodeCount: 0 };
    } else {
      assert.equal(item.status, 'PASS');
      const g = item.graph;
      assert.equal(g.roots.length, 10);
      T.validateExpressionGraph(g, g.roots, commonContext.length, 131072);
      const context = { original: commonContext, reduced: item.keptContextSlots.map(slot => commonContext[slot]), closed: [] };
      const components = names.map((component, i) => {
        assert(g.neededScope[g.roots[i]] <= context[owners[i]].length);
        return { component, root: g.roots[i], scope: owners[i] };
      });
      const fingerprints = keys(g), bindings = []; let node = g.roots[0], slots = [];
      for (const [i, binding] of item.bindings.entries()) {
        const input = binding.port.kind === 'input', kind = input ? 6 : 8;
        assert.equal(g.kind[node], kind);
        assert.equal(input ? g.payloads[node].binderName : g.payloads[node].declName, (input ? 'input.' : 'result.') + i);
        const observed = keys(binding.graph);
        assert.equal(fingerprints[g.children[node][0]], observed[binding.graph.roots[0]], 'binding domain in exact enclosing scope');
        if (!input) assert.equal(fingerprints[g.children[node][1]], observed[binding.graph.roots[1]], 'computed result value in exact enclosing scope');
        const record = profile.records.find(record => record.index === binding.port.call);
        const anchor = input ? record.ports[binding.port.slot].input : record.anchor;
        assert.equal(A.walk(source, anchor.route), anchor.node);
        bindings.push({ kind: binding.port.kind, call: binding.port.call,
          ...(input ? { slot: binding.port.slot } : {}), node, slots: [...slots], source: anchor });
        slots.push(input ? 1 : 2); node = g.children[node][input ? 1 : 2];
      }
      const indexSizes = {}; let refs = [], level = 0, span = 1;
      for (let start = 0; start < g.kind.length; start += 64) {
        const nodes = Array.from({ length: Math.min(64, g.kind.length - start) }, (_, j) => roots.map(field => g[field][start + j]));
        const ref = put('page', { format: 'ProofAtlasRegionFunctionPage/1', start, nodes });
        refs.push({ sha256: ref.sha256, bytes: ref.bytes });
      }
      const pageCount = refs.length;
      while (true) {
        const next = [];
        for (let i = 0; i < refs.length; i += 64) {
          const ref = put('index', { format: 'ProofAtlasRegionFunctionIndex/1', level, first: i * span, children: refs.slice(i, i + 64) });
          indexSizes[ref.sha256] = ref.bytes; next.push({ sha256: ref.sha256, bytes: ref.bytes });
        }
        refs = next; if (refs.length === 1) break; level++; span *= 64;
      }
      const judgments = Object.fromEntries(['kernelClosedTyping', 'kernelEqualityWitness', 'kernelSpecialization'].map(field => {
        assert.equal(item[field], 'PASS'); return [field, item[field]];
      }));
      manifest = { ...shared, context, components, bindings, judgments,
        independentInputs: item.independentInputs, boundaryPositions: item.boundaryPositions, internalPositions: item.internalPositions,
        keptContextSlots: item.keptContextSlots, originalResultPortals: item.originalResultPortals,
        nodeCount: g.kind.length, pageSize: 64, pageCount, indexLevel: level, indexRoot: refs[0].sha256, indexSizes };
    }
    out.cases.push({ ...put('manifest', manifest), id, source: profile.source, nativeInventorySha256,
      nativeCaseSha256, status: item.status, members: profile.members });
  }
  profiles.push(out);
}
const manifest = 'public/data/proof-atlas/region-function-pages-manifest.js';
const js = 'window.PROOF_ATLAS_REGION_FUNCTION_PAGES = ' + JSON.stringify({
  format: 'ProofAtlasRegionFunctionPageInventory/1', nativeInventorySha256, profiles
}) + ';\n';
if (process.argv.includes('--check')) {
  assert.equal(fs.readFileSync(manifest, 'utf8'), js);
  for (const [file, raw] of files) assert(z.gunzipSync(fs.readFileSync('.' + file)).equals(raw), file);
} else {
  fs.mkdirSync('.' + base, { recursive: true });
  for (const [file, raw] of files) fs.writeFileSync('.' + file, z.gzipSync(raw, { mtime: 0 }));
  fs.writeFileSync(manifest, js);
}
console.log(JSON.stringify({ status: 'PASS', profiles: profiles.length, cases: profiles.reduce((n, p) => n + p.cases.length, 0), assets: files.size, decodedBytes: [...files.values()].reduce((n, value) => n + value.length, 0) }));
