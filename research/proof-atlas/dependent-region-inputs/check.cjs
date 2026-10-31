'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib'), vm = require('vm'), assert = require('assert/strict');
const A = require('../../../public/js/proof-atlas-library-data'), M = require('../../../public/js/proof-atlas-application-ports');
const C = require('../region-input-functions/model.cjs'), { table } = require('../method-context/catalogue.cjs');
const P = require('../../../public/js/proof-atlas-region-function-pages'), Q = require('../../../public/js/proof-atlas-application-paged-provider');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/dependent-region-inputs/';
const hash = require('crypto').createHash;
const sha = bytes => hash('sha256').update(bytes).digest('hex');
const read = file => JSON.parse(z.gunzipSync(fs.readFileSync(file)));
const copy = value => JSON.parse(JSON.stringify(value));
const native = read(base + 'native.json.gz'), verification = read(base + 'verification.json.gz');
const rows = read(base + 'ports.json.gz'), legacy = read(base + 'legacy-ports.json.gz'), host = {};
for (const name of ['dependent-region-controls', 'dependent-region-function-pages']) vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + name + '-manifest.js', 'utf8'), { window: host });
const controls = copy(host.PROOF_ATLAS_DEPENDENT_REGION_CONTROLS), functions = copy(host.PROOF_ATLAS_DEPENDENT_REGION_FUNCTION_PAGES);
assert.equal(verification.status, 'PASS');
for (const [file, digest] of Object.entries(verification.producerFiles)) assert.equal(sha(fs.readFileSync(file)), digest, file);
for (const [file, expected] of [['native', verification.nativeSha256], ['ports', verification.refinedPortsSha256], ['legacy-ports', verification.legacyPortsSha256], ['core-data', verification.coreDataInventorySha256]]) assert.equal(sha(z.gunzipSync(fs.readFileSync(base + file + '.json.gz'))), expected);
const report = { format: 'ProofAtlasDependentRegionModel/1', status: 'RUNNING', profiles: 0, cases: 0, accepted: 0, rejected: 0,
  ports: 0, legacyRefusals: 0, preservedLegacyTypeTables: 0, zetaChecks: 0, rejectedLambdaExpansions: 0,
  rawComparisonTrueWithoutTyping: 0, bindingDomains: 0, dependentInputDomains: 0, dependentResultDomains: 0,
  referencesToEarlierInputs: 0, referencesToEarlierResults: 0, computedBinderPortals: 0,
  pagedTypeWindows: 0, countedProbeGraphArrays: 0, sourceSelections: 0, refusals: 0, casesWithDependencies: [], files: {} };
const binds = (kind, slot) => ((kind === 6 || kind === 7) && slot === 1) || (kind === 8 && slot === 2);
function probe(source, observed, witness) {
  const pool = table(), memo = new WeakMap();
  function imported(g, id) { if (!memo.has(g)) memo.set(g, new Map()); const m = memo.get(g); if (m.has(id)) return m.get(id); const row = pool.add(g.kind[id], g.payloads[id], g.children[id].map(child => imported(g, child))); m.set(id, row); return row; }
  const g = pool.g, roots = observed.roots.map(root => imported(observed, root));
  assert.equal(roots[0], imported(source, witness.sourceBinder.node), 'Exact original source let');
  assert.equal(g.kind[roots[0]], 8);
  const [domain, value, body] = g.children[roots[0]];
  function lift(root, offset, cutoff = 0) {
    const kind = g.kind[root], payload = g.payloads[root];
    return pool.add(kind, kind === 0 && payload.index >= cutoff ? { index: payload.index + offset } : payload,
      g.children[root].map((child, slot) => lift(child, offset, cutoff + Number(binds(kind, slot)))));
  }
  const replacements = new Map();
  function substitute(root, depth = 0) {
    const key = root + ':' + depth; if (replacements.has(key)) return replacements.get(key); assert(replacements.size <= 262144);
    const kind = g.kind[root], payload = g.payloads[root]; let result;
    if (kind === 0) result = payload.index < depth ? root : payload.index === depth ? lift(value, depth) : pool.add(0, { index: payload.index - 1 });
    else result = pool.add(kind, payload, g.children[root].map((child, slot) => substitute(child, depth + Number(binds(kind, slot)))));
    replacements.set(key, result); return result;
  }
  assert.equal(substitute(body), roots[1], 'Complete direct zeta substitution');
  const payload = g.payloads[roots[0]], lambda = pool.add(6, { binderName: payload.declName, binderNameParts: payload.declNameParts, binderInfo: 'default' }, [domain, body]);
  assert.equal(lambda, roots[2], 'Complete raw lambda candidate');
  assert.equal(pool.add(5, {}, [lambda, value]), roots[3], 'Complete raw beta application');
}
function references(g, root) {
  const todo = [{ node: root, slots: [], depth: 0 }], seen = new Set(), result = new Map();
  while (todo.length) {
    const point = todo.pop(), key = point.node + ':' + point.depth; if (seen.has(key)) continue; seen.add(key); assert(seen.size <= 262144);
    if (g.kind[point.node] === 0) { const index = g.payloads[point.node].index - point.depth; if (index >= 0 && !result.has(index)) result.set(index, point.slots); }
    else for (const [slot, child] of g.children[point.node].entries()) todo.push({ node: child, slots: [...point.slots, slot], depth: point.depth + Number(binds(g.kind[point.node], slot)) });
  }
  return result;
}
async function main() {
  const previousFetch = global.fetch;
  const blocked = new Set(native.profiles.flatMap(profile => [profile.record.indexFile, profile.originalNativeOwner.file]));
  global.fetch = async file => { assert(!blocked.has(file), 'Whole archive request: ' + file); assert(file.startsWith('/public/data/proof-atlas/')); return new Response(fs.readFileSync('.' + file)); };
  try {
    for (const [pi, profile] of native.profiles.entries()) {
      const source = read('.' + profile.record.indexFile), descriptor = controls.records[pi]; A.validateIndex(source, profile.record);
      assert.deepEqual(descriptor.source, profile.source); assert.deepEqual(descriptor.owner, profile.originalNativeOwner);
      const old = legacy[pi], current = rows[pi]; assert.deepEqual(current.source, profile.source);
      assert.deepEqual(current.refusals, []); report.legacyRefusals += old.refusals.length;
      const entries = new Map(current.entries.map(entry => [entry.id, entry.junction]));
      for (const entry of old.entries) {
        const j = entries.get(entry.id); assert(j); assert.deepEqual(entry.junction.graph, j.graph); assert.deepEqual(entry.junction.roots, j.roots); report.preservedLegacyTypeTables++;
      }
      for (const call of profile.records) {
        const lease = await Q.open(descriptor, call.anchor.route), scene = lease.create(); report.pagedTypeWindows++;
        assert.equal(scene.nodes.length, call.arguments + 2);
        const probes = call.ports.flatMap(port => entries.get(port.id).bindingZetaChecks);
        assert.equal(lease.state().completeGraphArraysAllocated, 6 * probes.length);
        assert.equal(lease.state().completeRecordedTypeGraphArraysAllocated, 0);
        assert.equal(lease.state().bindingProbeRows, probes.reduce((n, item) => n + item.graph.kind.length, 0)); report.countedProbeGraphArrays += lease.state().completeGraphArraysAllocated;
        for (const port of call.ports) {
          const j = entries.get(port.id); assert.equal(j.format, 'ProofAtlasApplicationPort/2'); M.validatePort(j, source, call, port.slot); report.ports++;
          for (const witness of j.bindingZetaChecks) {
            probe(source, witness.graph, witness); assert.equal(witness.betaLambdaTyping, 'REJECTED'); assert.equal(witness.betaApplicationTyping, 'REJECTED');
            assert.equal(witness.rawBetaConversion, 'TRUE'); report.zetaChecks++; report.rejectedLambdaExpansions++; report.rawComparisonTrueWithoutTyping++;
          }
          const n = scene.nodes.find(node => node.slot === port.slot); assert(n); assert.equal(n.inputAddress.node, port.input.node); assert.deepEqual(n.inputAddress.route, port.input.route);
          assert.equal(lease.inspectSource(n.inputAddress).node ?? n.inputAddress.node, n.inputAddress.node); report.sourceSelections++;
          if (j.bindingZetaChecks.length) for (const mutate of [v => v.bindingConversionRule = 'lambda-copy', v => v.format = 'ProofAtlasApplicationPort/1', v => v.checks.kernelBindingAbstractionConversions = 'PASS', v => v.checks.kernelBindingZetaConversions = 'unchecked', v => v.bindingZetaChecks = [], v => v.bindingZetaChecks[0].contextLength++, v => v.bindingZetaChecks[0].nondep = !v.bindingZetaChecks[0].nondep, v => v.bindingZetaChecks[0].sourceBinder.node++, v => v.bindingZetaChecks[0].graph.roots.pop()]) {
            const bad = copy(j); mutate(bad); assert.throws(() => M.validatePort(bad, source, call, port.slot)); report.refusals++;
          }
        }
        assert(lease.state().typeCachedNodes <= 320 && lease.state().metadataBytes <= 5 * 2097152); lease.dispose();
      }
      for (const [ci, item] of profile.native.cases.entries()) {
        C.audit(source, profile, item); report.cases++;
        if (item.status === 'KERNEL_REJECTED') { assert.equal(item.kernelInputTypeNonconversion, 'PASS'); assert.equal(item.call, 3); assert.equal(item.slot, 3); report.rejected++; continue; }
        assert.equal(item.status, 'PASS'); report.accepted++;
        const d = functions.profiles[pi].cases[ci], cursor = await P.open(d, profile.source);
        assert.equal(d.nativeCaseSha256, sha(Buffer.from(JSON.stringify(item))));
        const dependencies = [];
        for (const [i, binding] of cursor.bindings.entries()) {
          report.bindingDomains++;
          for (const [index, slots] of references(item.graph, binding.domain.node)) if (index < i) {
            const target = i - 1 - index, original = cursor.bindings[target];
            const cut = await cursor.neighborhood('function.original', [...binding.domain.route.slots, ...slots]);
            assert.equal(cut.root.binding.relation, 'computed-local-binder'); assert.deepEqual(cut.root.binding.address, original.binder);
            dependencies.push({ binding: i, sourceKind: binding.kind, target, targetKind: original.kind,
              selected: cut.root.address, binder: original.binder, relation: 'literal-computed-domain-reference' });
            report.computedBinderPortals++; report[original.kind === 'input' ? 'referencesToEarlierInputs' : 'referencesToEarlierResults']++;
          }
          if (dependencies.some(edge => edge.binding === i)) report[binding.kind === 'input' ? 'dependentInputDomains' : 'dependentResultDomains']++;
        }
        assert(dependencies.length > 0); report.casesWithDependencies.push({ source: profile.source, policy: item.policy, dependencies });
        assert(cursor.state().peakCachedRows <= 64 && cursor.state().peakIndexPages <= 2); cursor.dispose();
      }
      report.profiles++;
    }
  } finally { global.fetch = previousFetch; }
  assert.equal(report.profiles, 4); assert.equal(report.cases, 12); assert.equal(report.accepted, 11); assert.equal(report.rejected, 1);
  assert.equal(report.ports, 32); assert.equal(report.legacyRefusals, 5); assert.equal(report.preservedLegacyTypeTables, 27);
  assert.equal(report.zetaChecks, 5); assert(report.dependentInputDomains && report.referencesToEarlierInputs && report.referencesToEarlierResults);
  report.files = Object.fromEntries([base + 'check.cjs', base + 'native.json.gz', base + 'verification.json.gz', base + 'legacy-ports.json.gz', base + 'ports.json.gz', base + 'publication.json.gz', base + 'pack-functions.cjs',
    'public/js/proof-atlas-application-ports.js', 'public/js/proof-atlas-application-type-pages.js', 'public/js/proof-atlas-application-paged-provider.js', 'public/js/proof-atlas-region-function-pages.js', 'public/js/proof-atlas-computed-type-neighborhood.js',
    'public/data/proof-atlas/dependent-region-controls-manifest.js', 'public/data/proof-atlas/dependent-region-function-pages-manifest.js'].map(file => [file, sha(fs.readFileSync(file))]));
  report.status = 'PASS'; report.scope = 'Four authored controls, independent exact zeta/lambda/beta syntax reconstruction, eleven region functions and their computed-domain references, thirty-two native ports through paged type delivery. Native observed domains remain inputs to the constructor audit; no independent type inference, general preservation or comprehension result.';
  fs.writeFileSync(base + 'model-check.json.gz', z.gzipSync(Buffer.from(JSON.stringify(report, null, 2) + '\n')));
  console.log(JSON.stringify({ ...report, files: undefined, casesWithDependencies: report.casesWithDependencies.length }));
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
