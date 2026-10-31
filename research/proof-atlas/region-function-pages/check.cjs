'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), z = require('zlib');
const assert = require('assert/strict'), crypto = require('crypto');
process.chdir(path.resolve(__dirname, '../../..'));
const P = require('../../../public/js/proof-atlas-region-function-pages');
const A = require('../../../public/js/proof-atlas-library-data');
const base = 'research/proof-atlas/region-function-pages/';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = file => JSON.parse(z.gunzipSync(fs.readFileSync(file)));
const copy = value => JSON.parse(JSON.stringify(value));
const host = {}; vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/region-function-pages-manifest.js', 'utf8'), { window: host });
const inventory = copy(host.PROOF_ATLAS_REGION_FUNCTION_PAGES);
const nativeFile = 'research/proof-atlas/region-input-functions/native.json.gz', native = read(nativeFile);
assert.equal(inventory.nativeInventorySha256, hash(z.gunzipSync(fs.readFileSync(nativeFile))));
const virtual = new Map(); let requests = 0;
const fetcher = async file => { assert(file.startsWith(P.base), 'Whole source/native archive request: ' + file); requests++; return new Response(virtual.get(file) || fs.readFileSync('.' + file)); };
const report = { format: 'ProofAtlasRegionFunctionPageModel/1', status: 'RUNNING', cases: 0, accepted: 0, rejected: 0,
  components: 0, rowComparisons: 0, cuts: 0, bindingPortals: 0, sourceBinders: 0, localBinders: 0,
  contextReindexWitnesses: 0, bindingDomains: 0, domainsReferringToEarlierComputedBindings: 0, refusals: 0, peakCachedRows: 0, peakIndexPages: 0 };
const binds = (kind, slot) => ((kind === 6 || kind === 7) && slot === 1) || (kind === 8 && slot === 2);
function reference(g, root, slots, context) {
  let node = root; const local = [];
  for (const [depth, slot] of slots.entries()) { if (binds(g.kind[node], slot)) local.push({ node, slots: slots.slice(0, depth) }); node = g.children[node][slot]; }
  function point(id, route, binders) {
    let binding = null;
    if (g.kind[id] === 0) {
      const index = g.payloads[id].index;
      if (index < binders.length) { const target = binders[binders.length - 1 - index]; binding = { relation: 'computed-local-binder', node: target.node, slots: target.slots }; }
      else { const target = context[context.length - 1 - (index - binders.length)]; assert(target); binding = { relation: 'original-context-binder', node: target.node, slots: target.route.slots }; }
    }
    return { node: id, slots: route, kind: A.kinds[g.kind[id]], expanded: g.expanded[id], binding };
  }
  return [point(node, slots, local), ...g.children[node].map((child, slot) => point(child, [...slots, slot], binds(g.kind[node], slot) ? [...local, { node, slots }] : local))];
}
function compare(cut, expected) {
  assert.equal(cut.stats.retained, expected.length);
  assert.equal(BigInt(cut.stats.retained) + BigInt(cut.stats.hidden), BigInt(cut.stats.represented));
  for (const [i, value] of [cut.root, ...cut.children].entries()) {
    const point = expected[i]; assert.equal(value.address.node, point.node); assert.deepEqual(value.address.route.slots, point.slots);
    assert.equal(value.kind, point.kind); assert.equal(value.expanded, point.expanded);
    if (point.binding) {
      assert.equal(value.binding.relation, point.binding.relation); assert.equal(value.binding.address.node, point.binding.node); assert.deepEqual(value.binding.address.route.slots, point.binding.slots);
      report[point.binding.relation === 'original-context-binder' ? 'sourceBinders' : 'localBinders']++;
    } else assert.equal(value.binding, null);
  }
  report.cuts++;
}
function witnesses(g, root) {
  const todo = [{ node: root, slots: [], depth: 0 }], seen = new Set(), paths = new Map();
  for (let at = 0; at < todo.length; at++) {
    const value = todo[at], key = value.node + ':' + value.depth;
    if (seen.has(key)) continue; seen.add(key); assert(seen.size <= 262144);
    if (g.kind[value.node] === 0) { const type = g.payloads[value.node].index >= value.depth ? 'source' : 'local'; if (!paths.has(type)) paths.set(type, value.slots); if (paths.size === 2) break; }
    if (value.slots.length < 128) for (const [slot, child] of g.children[value.node].entries()) todo.push({ node: child, slots: [...value.slots, slot], depth: value.depth + Number(binds(g.kind[value.node], slot)) });
  }
  return [...paths.values()];
}
function freeIndices(g, root) {
  const todo = [{ node: root, depth: 0 }], seen = new Set(), found = new Set();
  while (todo.length) {
    const value = todo.pop(), key = value.node + ':' + value.depth;
    if (seen.has(key)) continue; seen.add(key); assert(seen.size <= 262144);
    if (g.kind[value.node] === 0) { const index = g.payloads[value.node].index; if (index >= value.depth) found.add(index - value.depth); }
    else for (const [slot, child] of g.children[value.node].entries()) todo.push({ node: child, depth: value.depth + Number(binds(g.kind[value.node], slot)) });
  }
  return found;
}
async function refused(fn, pattern) { await assert.rejects(fn, pattern); report.refusals++; }
async function main() {
  for (const [pi, profile] of native.profiles.entries()) for (const [ci, candidate] of profile.native.cases.entries()) {
    const descriptor = inventory.profiles[pi].cases[ci];
    assert.equal(descriptor.nativeCaseSha256, hash(Buffer.from(JSON.stringify(candidate))));
    assert.deepEqual(descriptor.source, profile.source);
    const cursor = await P.open(descriptor, profile.source, { fetcher }), m = cursor.manifest;
    assert.equal(m.status, candidate.status); report.cases++;
    if (m.status === 'KERNEL_REJECTED') {
      assert.equal(cursor.state().cachedRows, 0); assert.equal(cursor.neighborhood, undefined);
      assert.deepEqual(cursor.rejectionAddress().route, profile.records.find(value => value.index === candidate.call).ports[candidate.slot].input.route);
      cursor.dispose(); assert.throws(() => cursor.rejectionAddress(), /disposed/); report.rejected++; continue;
    }
    const g = candidate.graph;
    for (let id = 0; id < g.kind.length; id++) { assert.deepEqual(await cursor.readNode(id), ['kind', 'children', 'payloads', 'expanded', 'neededScope'].map(field => g[field][id])); report.rowComparisons++; }
    const expectedContext = { original: profile.commonContext.map(frame => ({ node: frame.node, route: { root: 1, slots: frame.slots } })), closed: [] };
    expectedContext.reduced = candidate.keptContextSlots.map(slot => expectedContext.original[slot]);
    for (const component of m.components) {
      const paths = [[], ...g.children[component.root].map((_, slot) => [slot]), ...witnesses(g, component.root)];
      for (const slots of paths) {
        const cut = await cursor.neighborhood(component.component, slots);
        compare(cut, reference(g, component.root, slots, expectedContext[component.scope]));
        assert.equal(cut.root.address.namespace, 'region-input-components');
        assert.equal(cut.root.address.manifestSha256, descriptor.sha256); assert.equal(cut.root.address.nativeCaseSha256, descriptor.nativeCaseSha256);
      }
      report.components++;
    }
    for (const [i, binding] of cursor.bindings.entries()) {
      report.bindingDomains++;
      if ([...freeIndices(g, binding.domain.node)].some(index => index < i)) report.domainsReferringToEarlierComputedBindings++;
      for (const address of [binding.binder, binding.domain, ...(binding.value ? [binding.value] : [])]) {
        const cut = await cursor.neighborhood(address.component, address.route.slots);
        assert.deepEqual(cut.root.address, address);
        compare(cut, reference(g, g.roots[0], address.route.slots, expectedContext.original)); report.bindingPortals++;
      }
      const record = profile.records.find(record => record.index === binding.call);
      assert.deepEqual(binding.original.route, binding.kind === 'input' ? record.ports[binding.slot].input.route : record.anchor.route);
    }
    // Same constructor path before/after pruning: index may change while the
    // original binder target must remain the same. This is an independent
    // paired traversal, not an assumption based on equal displayed names.
    const todo = [{ a: g.roots[0], b: g.roots[2], slots: [], depth: 0 }], seen = new Set();
    for (let at = 0; at < todo.length; at++) {
      const value = todo[at], key = value.a + ':' + value.b + ':' + value.depth;
      if (seen.has(key)) continue; seen.add(key); assert(seen.size <= 262144);
      assert.equal(g.kind[value.a], g.kind[value.b]);
      if (g.kind[value.a] === 0 && g.payloads[value.a].index !== g.payloads[value.b].index) {
        const a = await cursor.neighborhood('function.original', value.slots), b = await cursor.neighborhood('function.reduced', value.slots);
        assert.equal(a.root.binding.relation, 'original-context-binder'); assert.deepEqual(a.root.binding.address, b.root.binding.address); report.contextReindexWitnesses++; break;
      }
      assert.equal(g.children[value.a].length, g.children[value.b].length);
      for (const [slot, child] of g.children[value.a].entries()) todo.push({ a: child, b: g.children[value.b][slot], slots: [...value.slots, slot], depth: value.depth + Number(binds(g.kind[value.a], slot)) });
    }
    await refused(() => cursor.neighborhood('unknown'), /component path/);
    await refused(() => cursor.neighborhood('function.original', Array(513).fill(1)), /component path/);
    const state = cursor.state(); assert(state.peakCachedRows <= 64 && state.peakIndexPages <= 2 && state.cachedPages <= 1);
    report.peakCachedRows = Math.max(report.peakCachedRows, state.peakCachedRows); report.peakIndexPages = Math.max(report.peakIndexPages, state.peakIndexPages);
    cursor.dispose(); assert.equal(cursor.state().cachedRows, 0); assert.equal(cursor.state().indexPages, 0); await refused(() => cursor.readNode(0), /disposed/); report.accepted++;
  }
  const d = inventory.profiles[0].cases.find(value => value.id === 'proof-arguments'), m = read('.' + d.file);
  await refused(() => P.open(d, { ...d.source, name: 'foreign' }, { fetcher }), /identity/);
  async function altered(change) {
    const value = copy(m); change(value);
    const bytes = Buffer.from(JSON.stringify(value)), sha256 = hash(bytes), file = P.base + sha256 + '.manifest.gz'; virtual.set(file, z.gzipSync(bytes));
    await refused(() => P.open({ ...d, file, sha256, bytes: bytes.length }, d.source, { fetcher })); virtual.clear();
  }
  for (const change of [value => value.nativeCaseSha256 = '0'.repeat(64), value => value.source.name = 'foreign', value => value.members.push(value.members[0]), value => value.order.reverse(), value => value.keptContextSlots.reverse(), value => value.context.reduced = [], value => value.commonContext[0].route.slots = [2], value => value.components[0].scope = 'closed', value => value.components.pop(), value => value.bindings[0].node++, value => value.bindings.reverse(), value => value.nodeCount = 131073, value => value.indexLevel++, value => value.judgments.kernelClosedTyping = 'FAIL']) await altered(change);
  virtual.set(d.file, z.gzipSync(Buffer.alloc(P.limits.manifestBytes + 1))); await refused(() => P.open(d, d.source, { fetcher }), /byte bound/); virtual.clear();
  virtual.set(P.base + m.indexRoot + '.index.gz', z.gzipSync(Buffer.from('{}'))); await refused(() => P.open(d, d.source, { fetcher }), /size|hash/); virtual.clear();
  const aborted = new AbortController(); aborted.abort(Error('test cancellation'));
  await refused(() => P.open(d, d.source, { fetcher, signal: aborted.signal }), /cancellation/);
  let entered, resume, waiting = false;
  const arrival = new Promise(resolve => { entered = resolve; }), gate = new Promise(resolve => { resume = resolve; });
  const cursor = await P.open(d, d.source, { fetcher: async file => { if (waiting) { entered(); await gate; } return fetcher(file); } });
  waiting = true; const active = cursor.readNode(0); await arrival;
  const pending = cursor.readNode(1), rejected = assert.rejects(() => pending, /superseded/), latest = cursor.readNode(2);
  assert.equal(cursor.state().pendingOperations, 1); resume(); await rejected; await active; await latest; assert.equal(cursor.state().pendingOperations, 0); report.refusals++;
  await refused(() => cursor.readNode(0, { signal: aborted.signal }), /cancellation/); cursor.dispose();
  let held = false, started, release;
  const startedPromise = new Promise(resolve => { started = resolve; }), hold = new Promise(resolve => { release = resolve; });
  const retired = await P.open(d, d.source, { fetcher: async file => { if (held) { started(); await hold; } return fetcher(file); } });
  held = true; const task = retired.readNode(0); await startedPromise; retired.dispose(); release(); await refused(() => task, /disposed/); assert.equal(retired.state().cachedRows, 0);
  assert.equal(report.cases, 18); assert.equal(report.accepted, 16); assert.equal(report.rejected, 2); assert.equal(report.components, 160);
  assert.equal(report.bindingDomains, 100); assert.equal(report.domainsReferringToEarlierComputedBindings, 0);
  assert(report.sourceBinders && report.localBinders && report.contextReindexWitnesses);
  report.status = 'PASS'; report.requests = requests;
  report.files = Object.fromEntries([nativeFile, base + 'pack.cjs', base + 'check.cjs', 'public/data/proof-atlas/region-function-pages-manifest.js', 'public/js/proof-atlas-region-function-pages.js', 'public/js/proof-atlas-computed-type-neighborhood.js'].map(file => [file, hash(fs.readFileSync(file))]));
  report.scope = 'Complete native row comparison, independent finite constructor/binding cuts in 160 components, exact binding/source portals, context reindexing, refusal and lifecycle controls. One 64-row consumer cache; the offline reference retains full graphs. No new kernel replay or comprehension measurement.';
  fs.writeFileSync(base + 'model-check.json.gz', z.gzipSync(Buffer.from(JSON.stringify(report, null, 2) + '\n'), { mtime: 0 }));
  console.log(JSON.stringify({ ...report, files: undefined }));
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
