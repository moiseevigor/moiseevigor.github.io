'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), z = require('zlib'), crypto = require('crypto'), assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '../../..'));
const P = require('../../../public/js/proof-atlas-region-function-pages'), W = require('../../../public/js/proof-atlas-declaration-window'), N = require('../../../public/js/proof-atlas-type-notation');
const base = 'research/proof-atlas/declaration-window/', read = file => JSON.parse(z.gunzipSync(fs.readFileSync(file))), sha = b => crypto.createHash('sha256').update(b).digest('hex'), copy = v => JSON.parse(JSON.stringify(v));
const host = {};
for (const name of ['source-template-function-pages-manifest', 'source-template-notation-bindings', 'type-notation-catalog']) vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + name + '.js', 'utf8'), { window: host });
const inventory = copy(host.PROOF_ATLAS_SOURCE_TEMPLATE_FUNCTION_PAGES), registry = copy(host.PROOF_ATLAS_SOURCE_TEMPLATE_NOTATION_BINDINGS), catalog = copy(host.PROOF_ATLAS_TYPE_NOTATION), native = read('research/proof-atlas/source-template-inputs/native.json.gz');
const files = ['public/js/proof-atlas-declaration-window.js', 'public/js/proof-atlas-region-function-pages-view.js', 'public/css/proof-atlas-declaration-window.css', 'research/proof-atlas/network-streaming/index.html', base + 'check.cjs',
 'public/js/proof-atlas-region-function-pages.js', 'public/js/proof-atlas-paged-notation.js', 'public/js/proof-atlas-type-notation.js', 'research/proof-atlas/type-notation/view.js', 'research/proof-atlas/source-template-inputs/native.json.gz',
 ...['source-template-function-pages-manifest', 'source-template-notation-bindings', 'type-notation-catalog'].map(n => 'public/data/proof-atlas/' + n + '.js')];
const fingerprints = () => Object.fromEntries(files.map(file => [file, sha(fs.readFileSync(file))])), initial = fingerprints();
const report = { format: 'ProofAtlasDeclarationWindowCheck/1', status: 'RUNNING', profiles: 0, candidates: 0, windows: 0, declarations: 0, roles: {}, references: {}, peakObjects: 0, peakSceneBytes: 0, peakNotationRows: 0, peakNotationBytes: 0, refusals: 0, archiveRequests: 0 };
let requests = 0, example = null;
const fetcher = async file => { assert(/^\/public\/data\/proof-atlas\/region-function-pages\/[a-f0-9]{64}\.(manifest|index|page)\.gz$/.test(file), file); requests++; return new Response(fs.readFileSync('.' + file)); };
const binds = (k, s) => (k === 6 || k === 7) && s === 1 || k === 8 && s === 2;
function walk(g, root, slots) { let id = root, scope = []; for (const [depth, slot] of slots.entries()) { if (binds(g.kind[id], slot)) scope.push({ node: id, slots: slots.slice(0, depth) }); id = g.children[id][slot]; assert.notEqual(id, undefined); } return { id, scope }; }
function original(source, frame) { return { namespace: 'source-expression', name: source.name, indexSha256: source.indexSha256, sourceSha256: source.sourceSha256, node: frame.node, route: frame.route }; }
function notation(g, m, b, d) {
 const entry = registry.registries.find(r => r.nativeInventorySha256 === d.nativeInventorySha256), context = entry.sources.find(s => P.sourceEqual(s.source, m.source)).context;
 const owner = { namespace: 'region-input-notation', sourceIndexSha256: m.source.indexSha256, nativeInventorySha256: d.nativeInventorySha256, nativeCaseSha256: d.nativeCaseSha256, manifestSha256: d.sha256, case: m.id, component: 'function.original', typeRoot: 0, catalogueObjectSha256: registry.catalogueObjectSha256, environmentSha256: registry.environmentSha256 };
 const origin = (node, slots) => ({ ...owner, node, slots }), picked = walk(g, m.components[0].root, b.domain.route.slots), activeCatalog = entry.mode === 'full' ? catalog : { ...catalog, entries: catalog.entries.filter(e => registry.coreNames.includes(e.name)) };
 const scene = N.scene(g, picked.id, activeCatalog, { slots: b.domain.route.slots, address: origin, context: [...context.map(c => ({ name: c.name, address: original(m.source, c) })), ...picked.scope.map(f => ({ name: g.payloads[f.node].binderName || g.payloads[f.node].declName || '_', address: origin(f.node, f.slots) }))] });
 return scene;
}
async function refuse(task, pattern) { await assert.rejects(task, pattern); report.refusals++; }
async function main() {
 for (const [pi, profile] of native.profiles.entries()) {
  for (const d of inventory.profiles[pi].cases) {
   assert.equal(d.status, 'PASS'); const lease = await P.open(d, profile.source, { fetcher }), m = lease.manifest, g = profile.native.cases.find(c => c.policy === d.id).graph;
   for (let start = 0; start < lease.bindings.length; start += 4) {
    const data = await W.read(lease, start, { catalog, registry });
    assert.equal(data.start, start); assert.equal(data.total, lease.bindings.length); assert.equal(data.entries.length, Math.min(4, lease.bindings.length - start));
    assert.equal(lease.state().notation, undefined, 'notation cache must be disposed after every window');
    for (const e of data.entries) {
     const b = lease.bindings[e.index]; assert.equal(e.binding, b); assert.deepEqual(e.scene, notation(g, m, b, d));
     assert.equal(b.domain.node, g.children[m.bindings[e.index].node][0]);
     for (const ref of e.references) {
      const p = walk(g, m.components[0].root, ref.use.route.slots); assert.equal(g.kind[p.id], 0); assert.equal(p.id, ref.use.node);
      const n = g.payloads[p.id].index;
      if (n < p.scope.length) { const f = p.scope.at(-1 - n); assert.equal(ref.target.node, f.node); assert.deepEqual(ref.target.route.slots, f.slots);
       const predecessor = m.bindings.findIndex(b => b.node === f.node && JSON.stringify(b.slots) === JSON.stringify(f.slots));
       assert.equal(ref.relation, predecessor >= 0 ? 'earlier-declaration' : 'type-local'); assert.equal(ref.declaration, predecessor >= 0 ? predecessor : null); assert(predecessor < e.index);
      } else { assert.equal(ref.relation, 'original-context'); assert.deepEqual(ref.target, original(m.source, m.commonContext.at(-1 - (n - p.scope.length)))); }
      report.references[ref.relation] = (report.references[ref.relation] || 0) + 1;
     }
     report.roles[e.role] = (report.roles[e.role] || 0) + 1; report.declarations++;
     if (!example && e.references.some(r => r.relation === 'earlier-declaration')) example = { d, source: profile.source, start, binding: b, scene: copy(e.scene), all: lease.bindings, manifest: m };
    }
    report.windows++; report.peakObjects = Math.max(report.peakObjects, data.stats.objects); report.peakSceneBytes = Math.max(report.peakSceneBytes, data.stats.sceneBytes); report.peakNotationRows = Math.max(report.peakNotationRows, data.stats.peakNotationRows); report.peakNotationBytes = Math.max(report.peakNotationBytes, data.stats.peakNotationBytes);
    assert(lease.state().cachedRows <= 64 && lease.state().indexPages <= 2); assert.equal(lease.state().fullTableArchiveRequests, 0);
   }
   for (const start of [-1, 1, lease.bindings.length, 100000]) await refuse(() => W.read(lease, start, { catalog, registry }), /offset/);
   const aborted = new AbortController(); aborted.abort(Error('test cancellation')); await refuse(() => W.read(lease, 0, { signal: aborted.signal }), /cancellation/);
   lease.dispose(); await refuse(() => W.read(lease), /retired/); report.candidates++;
  }
  report.profiles++;
 }
 assert(example);
 // Corrupt one scene at the consumer boundary; no authentic files are edited.
 // Every failure still releases the sole borrowed notation cursor.
 const e = example, lease = await P.open(e.d, e.source, { fetcher }); let disposed = 0;
 for (const edit of [scene => scene.root.origin.nativeCaseSha256 = 'f'.repeat(64), scene => scene.root.origin.node++, scene => { let term; const visit = n => { if (n.kind === 'reference' && !term) term = n; n.children.forEach(c => visit(c.value)); }; visit(scene.root); const target = term.head.target.address || term.head.target.origin; target.node = e.all.at(-1).binder.node; target.slots = e.all.at(-1).binder.route.slots; }]) {
  const start = Math.floor(e.all.indexOf(e.binding) / 4) * 4;
  const fake = { ...lease, openNotation: async (component, slots) => { const c = await lease.openNotation(component, slots, { catalog, registry }), scene = copy(c.scene); if (JSON.stringify(slots) === JSON.stringify(e.binding.domain.route.slots)) edit(scene); return { ...c, scene, dispose: () => { disposed++; c.dispose(); } }; } };
  await refuse(() => W.read(fake, start), /foreign notation owner|wrong declared type|forward type reference/); assert.equal(lease.state().notation, undefined);
 }
 assert(disposed >= 3); lease.dispose();
 assert.equal(report.profiles, 10); assert.equal(report.candidates, 30); assert(report.roles['Supplied input'] && report.roles['Derived definition'] && report.roles['Result computation']); assert(report.references['earlier-declaration'] && report.references['original-context'] && report.references['type-local']);
 assert(report.peakObjects <= 192 && report.peakSceneBytes <= 16777216 && report.peakNotationRows <= 8192 && report.peakNotationBytes <= 4194304);
 assert.deepEqual(fingerprints(), initial); report.status = 'PASS'; report.requests = requests; report.files = initial;
 report.scope = 'Every declared-type window of the 30 frozen source-specializing candidates: two corpus regions and eight authored controls. Complete-graph notation and independent lexical targets agree. Bounded consumer caches and combined scenes are separate from offline oracle memory and total browser heap. No new native judgments or human-comprehension result.';
 const file = base + 'model-check.json.gz'; if (process.argv.includes('--check')) assert.deepEqual(read(file), report); else fs.writeFileSync(file, z.gzipSync(Buffer.from(JSON.stringify(report, null, 2) + '\n'), { mtime: 0 }));
 console.log(JSON.stringify({ ...report, files: undefined }));
}
main().catch(e => { console.error(e.stack); process.exitCode = 1; });
