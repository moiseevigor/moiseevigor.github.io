'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib'), vm = require('vm'), crypto = require('crypto'), assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '../../..'));
const P = require('../../../public/js/proof-atlas-region-function-pages'), C = require('../../../public/js/proof-atlas-application-collar');
const N = require('../../../public/js/proof-atlas-type-notation');
const base = 'research/proof-atlas/application-collar/', read = f => JSON.parse(z.gunzipSync(fs.readFileSync(f))), copy = v => JSON.parse(JSON.stringify(v)), sha = b => crypto.createHash('sha256').update(b).digest('hex'), host = {};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/source-template-function-pages-manifest.js', 'utf8'), { window: host });
for (const name of ['source-template-notation-bindings', 'type-notation-catalog']) vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + name + '.js', 'utf8'), { window: host });
const registry = copy(host.PROOF_ATLAS_SOURCE_TEMPLATE_NOTATION_BINDINGS), catalog = copy(host.PROOF_ATLAS_TYPE_NOTATION);
const inventory = copy(host.PROOF_ATLAS_SOURCE_TEMPLATE_FUNCTION_PAGES), native = read('research/proof-atlas/source-template-inputs/native.json.gz');
const files = [base + 'check.cjs', 'public/js/proof-atlas-application-collar.js', 'public/js/proof-atlas-declaration-window.js', 'public/js/proof-atlas-region-function-pages-view.js', 'public/js/proof-atlas-region-function-pages.js', 'public/css/proof-atlas-declaration-window.css', 'research/proof-atlas/network-streaming/index.html', 'public/data/proof-atlas/source-template-function-pages-manifest.js', 'research/proof-atlas/source-template-inputs/native.json.gz'];
files.push('public/js/proof-atlas-type-notation.js', 'public/js/proof-atlas-paged-notation.js', 'research/proof-atlas/type-notation/view.js', 'public/data/proof-atlas/type-notation-catalog.js', 'public/data/proof-atlas/source-template-notation-bindings.js');
const fingerprints = () => Object.fromEntries(files.map(f => [f, sha(fs.readFileSync(f))])), initial = fingerprints();
const report = { format: 'ProofAtlasApplicationCollarCheck/1', status: 'RUNNING', candidates: 0, values: 0, applications: 0, atomicValues: 0, ports: 0, wrappers: 0, pages: 0, sourcePorts: 0, computedReferences: 0, originalReferences: 0, repeatedRowsAtDistinctPorts: 0, peakMetadataBytes: 0, peakRows: 0, peakIndices: 0, refusals: 0 };
report.previewScenes = 0; report.peakPreviewRows = 0;
const fetcher = async file => { assert(/^\/public\/data\/proof-atlas\/region-function-pages\/[a-f0-9]{64}\.(manifest|index|page)\.gz$/.test(file), file); return new Response(fs.readFileSync('.' + file)); };
const binds = (k, s) => (k === 6 || k === 7) && s === 1 || k === 8 && s === 2;
function walk(g, root, slots) { let node = root, scope = []; for (const [depth, slot] of slots.entries()) { if (binds(g.kind[node], slot)) scope.push({ node, slots: slots.slice(0, depth) }); node = g.children[node][slot]; assert.notEqual(node, undefined); } return { node, scope }; }
function expectedNotation(g, m, port, d) {
 const env = registry.registries.find(r => r.nativeInventorySha256 === d.nativeInventorySha256), frames = env.sources.find(s => P.sourceEqual(s.source, m.source)).context;
 const owner = { namespace: 'region-input-notation', sourceIndexSha256: m.source.indexSha256, nativeInventorySha256: d.nativeInventorySha256, nativeCaseSha256: d.nativeCaseSha256, manifestSha256: d.sha256, case: m.id, component: 'function.original', typeRoot: 0, catalogueObjectSha256: registry.catalogueObjectSha256, environmentSha256: registry.environmentSha256 }, origin = (node, slots) => ({ ...owner, node, slots });
 const selected = walk(g, m.components[0].root, port.address.route.slots), context = frames.map(f => ({ name: f.name, address: { namespace: 'source-expression', name: m.source.name, indexSha256: m.source.indexSha256, sourceSha256: m.source.sourceSha256, node: f.node, route: f.route } }));
 for (const f of selected.scope) context.push({ name: g.payloads[f.node].binderName || g.payloads[f.node].declName || '_', address: origin(f.node, f.slots) });
 const active = env.mode === 'full' ? catalog : { ...catalog, entries: catalog.entries.filter(e => registry.coreNames.includes(e.name)) };
 return N.scene(g, selected.node, active, { slots: port.address.route.slots, address: origin, context });
}
async function refuse(task, pattern) { await assert.rejects(task, pattern); report.refusals++; }
let example, variable;
async function main() {
 for (const [pi, profile] of native.profiles.entries()) for (const d of inventory.profiles[pi].cases) {
  const lease = await P.open(d, profile.source, { fetcher }), m = lease.manifest, g = profile.native.cases.find(c => c.policy === d.id).graph;
  for (const [index, binding] of lease.bindings.entries()) {
   if (!binding.value) continue;
   const data = await C.read(lease, index); assert.deepEqual(data.root, binding.value); assert.equal(data.index, index);
   // The complete native graph independently checks every occurrence and every
   // literal reassembly step; equal stored rows at different paths stay distinct.
   let fn = data.ports[0].address.node;
   for (const port of data.ports) {
    const picked = walk(g, m.components[0].root, port.address.route.slots); assert.equal(picked.node, port.address.node); assert.equal(port.expanded, g.expanded[picked.node]);
    if (port.slot) { const wrapper = data.wrappers.at(-port.slot); assert.equal(g.kind[wrapper.node], 5); assert.deepEqual(g.children[wrapper.node], [fn, picked.node]); fn = wrapper.node; }
    if (g.kind[picked.node] === 0) {
     const n = g.payloads[picked.node].index; assert(port.reference); assert.deepEqual(port.reference.use, port.address);
     if (n < picked.scope.length) { const frame = picked.scope.at(-1 - n), targetIndex = m.bindings.findIndex(b => b.node === frame.node && JSON.stringify(b.slots) === JSON.stringify(frame.slots)); assert.equal(port.reference.targetIndex, targetIndex); assert(targetIndex >= 0 && targetIndex < index); assert.equal(port.reference.target.node, frame.node); assert.deepEqual(port.reference.target.route.slots, frame.slots); report.computedReferences++; variable ||= { d, source: profile.source, index, node: picked.node }; }
     else { const frame = m.commonContext.at(-1 - (n - picked.scope.length)); assert.equal(port.reference.relation, 'original-context-use'); assert.equal(port.reference.target.node, frame.node); assert.deepEqual(port.reference.target.route, frame.route); report.originalReferences++; }
    } else assert.equal(port.reference, null, 'composite ports must not be labelled reference-free');
    if (port.original) { const mapped = lease.portMap.find(p => p.call === binding.call && p.slot === port.slot); assert.deepEqual(mapped.original, port.original); assert.equal(mapped.relation, port.sourceRelation); report.sourcePorts++; }
    report.ports++;
   }
   assert.equal(fn, data.root.node); assert.equal(data.expanded, g.expanded[data.root.node]);
   for (const wrapper of data.wrappers) assert.equal(walk(g, m.components[0].root, wrapper.route.slots).node, wrapper.node);
   for (let offset = 0; offset < Math.max(1, data.arguments); offset += 4) { const p = C.page(data, offset); assert(p.vertices <= 6 && p.ports.length <= 5); assert.equal(BigInt(p.retained) + BigInt(p.hidden), BigInt(data.expanded)); assert.deepEqual(p.ports.map(p => p.slot), [0, ...Array.from({ length: Math.min(4, data.arguments - offset) }, (_, i) => offset + i + 1)]);
    for (const port of p.ports.filter(port => ['app', 'mdata', 'proj', 'lam', 'forallE', 'letE'].includes(port.kind))) {
     const cursor = await lease.openNotation(port.address.component, port.address.route.slots, { catalog, registry });
     try { assert.deepEqual(cursor.scene, expectedNotation(g, m, port, d)); assert(cursor.scene.stats.nodes <= 48); report.peakPreviewRows = Math.max(report.peakPreviewRows, cursor.state().peakRows); } finally { cursor.dispose(); }
     assert.equal(lease.state().notation, undefined); report.previewScenes++;
    }
    report.pages++; }
   const rows = new Set(); for (const port of data.ports) { if (rows.has(port.address.node)) report.repeatedRowsAtDistinctPorts++; rows.add(port.address.node); }
   for (const offset of [-1, 1, data.arguments + 4]) { assert.throws(() => C.page(data, offset), /argument page/); report.refusals++; }
   report.values++; report.applications += Number(data.application); report.atomicValues += Number(!data.application); report.wrappers += data.wrappers.length; report.peakMetadataBytes = Math.max(report.peakMetadataBytes, data.metadataBytes);
   if (!example && binding.kind === 'result' && lease.portMap.some(p => p.call === binding.call && p.bindingKey)) example = { d, source: profile.source, index };
  }
  const aborted = new AbortController(); aborted.abort(Error('test cancellation')); const first = lease.bindings.findIndex(b => b.value);
  await refuse(() => C.read(lease, first, { signal: aborted.signal }), /cancellation/);
  await refuse(() => C.read(lease, -1), /recorded value/); await refuse(() => C.read(lease, lease.bindings.length), /recorded value/);
  const state = lease.state(); assert(state.cachedRows <= 64 && state.indexPages <= 2 && state.fullTableArchiveRequests === 0); report.peakRows = Math.max(report.peakRows, state.peakCachedRows); report.peakIndices = Math.max(report.peakIndices, state.peakIndexPages);
  lease.dispose(); await refuse(() => C.read(lease, first), /retired/); report.candidates++;
 }
 assert(example && variable); const e = example, lease = await P.open(e.d, e.source, { fetcher });
 for (const change of [ports => ports.splice(ports.findIndex(p => p.call === lease.bindings[e.index].call), 1), ports => ports.find(p => p.call === lease.bindings[e.index].call).counterpart.node++, ports => ports.find(p => p.call === lease.bindings[e.index].call && p.bindingKey).bindingKey = 'foreign']) { const ports = copy(lease.portMap); change(ports); await refuse(() => C.read({ ...lease, portMap: ports }, e.index), /source input/); }
 const bindings = copy(lease.bindings); bindings[e.index].value.nativeCaseSha256 = 'f'.repeat(64); await refuse(() => C.read({ ...lease, bindings }, e.index), /foreign component/); lease.dispose();
 const v = variable, source = await P.open(v.d, v.source, { fetcher });
 await refuse(() => C.read({ ...source, readNode: async (id, options) => { const r = copy(await source.readNode(id, options)); if (id === v.node) r[2].index = 100000; return r; } }, v.index), /unresolved original/); source.dispose();
 // Structural work-limit controls are not new kernel-checked proofs. They
 // use a separate owner and a small synthetic reader, never corpus addresses.
 function control(n, depth = 0, ownerLabel = 'structural-control') {
  const tuples = [[4, [], { name: 'control' }, '1', 0]];
  for (let i = 0; i < n; i++) tuples.push([5, [i, 0], {}, String(2 * i + 3), 0]);
  tuples.push([8, [0, n, 0], {}, String(2 * n + 4), 0]);
  const manifest = { status: 'PASS', id: ownerLabel, source: { name: 'structural-only', indexSha256: '0'.repeat(64) }, nativeInventorySha256: '0'.repeat(64), nativeCaseSha256: '0'.repeat(64), commonContext: [], context: { original: [] } };
  const address = (node, slots) => ({ namespace: 'region-input-components', component: 'function.original', sourceIndexSha256: manifest.source.indexSha256, nativeInventorySha256: manifest.nativeInventorySha256, nativeCaseSha256: manifest.nativeCaseSha256, manifestSha256: '0'.repeat(64), case: ownerLabel, node, route: { root: 'function.original', slots } });
  let reads = 0; return { manifest, bindings: [{ kind: 'derived-input', binder: address(n + 1, Array(depth).fill(2)), value: address(n, [...Array(depth).fill(2), 1]) }], state: () => ({ disposed: false, reads }), readNode: async id => { reads++; return tuples[id]; } };
 }
 const wide = control(1000); await refuse(() => C.read(wide, 0), /spine exceeds/); assert(wide.state().reads <= 66);
 await refuse(() => C.read(control(20, 500), 0), /path bound/);
 await refuse(() => C.read(control(32, 0, 'x'.repeat(100000)), 0), /metadata bound/);
 assert.equal(report.candidates, 30); assert.equal(report.values, 116); assert(report.applications && report.atomicValues && report.computedReferences && report.originalReferences && report.repeatedRowsAtDistinctPorts); assert.equal(report.sourcePorts, 339);
 assert(report.peakMetadataBytes <= C.limits.metadataBytes); assert.deepEqual(fingerprints(), initial); report.files = initial; report.status = 'PASS';
 report.scope = 'All 116 result/definition values in 30 frozen candidates: literal app reassembly, exact occurrence accounting, lexical roots and existing original-port correspondences. Composite endpoints remain opaque. No new typing, logical-necessity, semantic-compression or comprehension result.';
 const file = base + 'model-check.json.gz'; if (process.argv.includes('--check')) assert.deepEqual(read(file), report); else fs.writeFileSync(file, z.gzipSync(Buffer.from(JSON.stringify(report, null, 2) + '\n'), { mtime: 0 })); console.log(JSON.stringify({ ...report, files: undefined }));
}
main().catch(e => { console.error(e.stack); process.exitCode = 1; });
