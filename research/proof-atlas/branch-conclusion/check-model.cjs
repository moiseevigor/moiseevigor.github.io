'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), z = require('zlib');
const assert = require('assert/strict'), crypto = require('crypto');
process.chdir(path.resolve(__dirname, '../../..'));
const A = require('../../../public/js/proof-atlas-library-data');
const M = require('../../../public/js/proof-atlas-method-interfaces');
const C = require('../../../public/js/proof-atlas-branch-conclusion');
const W = require('../../../public/js/proof-atlas-method-flow');
const Q = require('../../../public/js/proof-atlas-method-query-pages');
const base = 'research/proof-atlas/branch-conclusion/';
const sha = x => crypto.createHash('sha256').update(x).digest('hex'), plain = x => JSON.parse(JSON.stringify(x));
const h = {}, manifests = ['method-interfaces', 'method-interfaces-ai', 'method-streaming',
  'method-origins', 'method-indices', 'method-parameters', 'method-mutual', 'method-query-pages', 'source-pages'];
for (const n of manifests) vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + n + '-manifest.js', 'utf8'), {window: h});
const primary = [...h.PROOF_ATLAS_METHOD_INTERFACES.records, ...h.PROOF_ATLAS_METHOD_REPLAY.records];
const fixtures = ['PROOF_ATLAS_METHOD_ORIGINS', 'PROOF_ATLAS_METHOD_INDICES', 'PROOF_ATLAS_METHOD_PARAMETERS', 'PROOF_ATLAS_METHOD_MUTUAL']
  .flatMap(k => h[k].records);
const inputs = [...primary.map(d => ({d, s: h.PROOF_ATLAS_SOURCE_PAGES.records.find(x => x.name === d.name),
  q: h.PROOF_ATLAS_METHOD_QUERY_PAGES.records.find(x => x.name === d.name)})),
  {d: h.PROOF_ATLAS_STREAM_FIXTURE.nativeDescriptor, s: h.PROOF_ATLAS_STREAM_FIXTURE.sourceDescriptor, q: h.PROOF_ATLAS_STREAM_FIXTURE.queryDescriptor},
  ...fixtures.map(f => ({d: f.nativeDescriptor, s: f.sourceDescriptor, q: f.queryDescriptor}))];
const load = (file, hash) => {const bytes = z.gunzipSync(fs.readFileSync('.' + file)); if (hash) assert.equal(sha(bytes), hash); return JSON.parse(bytes);};
const out = {status: 'RUNNING', profiles: 0, frames: 0, diagrams: 0, signatureSelections: 0,
  binderChecks: 0, inputPositionBridges: 0, indexAppearances: 0, constructorArgumentSelections: 0,
  multiIndexPages: 0, mutualOwnerDifferences: 0, functionResultFrames: 0,
  pagedCalls: 0, pagedFrames: 0, refusals: 0, extraDataRequests: 0, rows: []};
const child = (g, at, slot) => ({node: g.children[at.node][slot], route: {root: 0, slots: [...at.route.slots, slot]}});
const slotKey = at => at.route.slots.join('.');
function binder(g, root, at) {
  const scope = []; let id = root;
  for (const [j, slot] of at.route.slots.entries()) {
    if ((g.kind[id] === 6 || g.kind[id] === 7) && slot === 1 || g.kind[id] === 8 && slot === 2)
      scope.push({node: id, route: {root: 0, slots: at.route.slots.slice(0, j)}});
    id = g.children[id][slot];
  }
  assert.equal(id, at.node);
  return {context: scope.length, target: g.kind[id] === 0 ? scope.at(-1 - g.payloads[id].index) : null};
}
function application(g, at) {
  const args = []; while (g.kind[at.node] === 5) {args.unshift(child(g, at, 1)); at = child(g, at, 0);} return {head: at, args};
}
function oracle(t, r) {
  const g = t.metadataGraph, prefix = [], type = {node: t.recursorTypeRoot, route: {root: 0, slots: []}};
  let at = type;
  while (g.kind[at.node] === 7) {prefix.push(at); at = child(g, at, 1);}
  const method = child(g, prefix[t.parameters + t.motives + r.minor], 0), inputs = [];
  at = method;
  while (g.kind[at.node] === 7) {inputs.push(at); at = child(g, at, 1);}
  assert.equal(inputs.length, r.inputCount);
  const result = application(g, at), target = binder(g, type.node, result.head).target;
  const motiveOrdinal = prefix.findIndex(p => slotKey(p) === slotKey(target)) - t.parameters;
  const ctor = application(g, result.args.at(-1));
  assert.equal(g.payloads[ctor.head.node].name, r.constructor);
  return {g, inputs, result: at, args: result.args, ctor, motiveOrdinal, motiveBinder: target};
}

(async () => {
  const originalFetch = globalThis.fetch, forbidden = new Set(inputs.flatMap(({d}) => [d.file, d.record.indexFile])); let requests = 0;
  globalThis.fetch = async f => {assert(!forbidden.has(f), 'whole archive request: ' + f); requests++; return new Response(fs.readFileSync('.' + f));};
  const common = new Map();
  try {
    for (const {d, s, q: delivery} of inputs) {
      const raw = load(d.file, d.sha256), data = A.validateIndex(load(d.record.indexFile, d.record.indexSha256), d.record);
      const model = M.open(raw, data, d.record, d); out.profiles++;
      for (const q of raw.entries) {
        const paged = s ? await Q.open(s, d, delivery, d.record, q.parent.route, {sourceStrategy: 'stream'}) : null;
        if (paged) out.pagedCalls++;
        for (const branch of q.branches) {
          const flow = model.flow(q.parent.route, branch.minor), t = q.parent.eliminationJudgment,
            r = t.rules.find(r => r.minor === branch.minor), ref = oracle(t, r);
          const beforeRequests = requests, originalFlow = JSON.stringify(flow), n = ref.args.length - 1;
          for (const indexLimit of [1, 4]) for (let firstIndex = 0; firstIndex < Math.max(1, n); firstIndex += indexLimit) {
            const scene = C.create(flow, {firstIndex, indexLimit}); assert(C.validate(scene, flow));
            assert.deepEqual(W.create(flow, {focus: {kind: 'branch-conclusion'}, firstIndex, indexLimit}), scene);
            assert(W.validate(scene, flow)); assert(scene.nodes.length <= 8 && scene.links.length <= 7);
            assert.equal(scene.motive, ref.motiveOrdinal); assert.deepEqual(scene.motiveBinder.route, ref.motiveBinder.route);
            assert.equal(scene.resultAddress.node, ref.result.node); assert.deepEqual(scene.resultAddress.route, ref.result.route);
            assert.equal(scene.stats.representedResultIndices, n);
            assert.equal(scene.stats.visibleResultIndices + scene.stats.hiddenResultIndices, n);
            assert.equal(scene.nodes.find(n => n.id === 'body-type').address.namespace, 'computed-method-interface');
            assert.equal(scene.constructorPayload.name, r.constructor);
            assert.deepEqual(scene.constructorPayload, ref.g.payloads[ref.ctor.head.node]);
            for (const p of scene.nodes.filter(p => p.id.startsWith('signature:index:'))) {
              const i = Number(p.id.split(':').at(-1)); assert.deepEqual(p.address.route, ref.args[i].route); assert.equal(p.address.node, ref.args[i].node); out.indexAppearances++;
            }
            // All immediate child/binder ports and application windows are read
            // independently against the original signature graph and lexical stack.
            for (const node of scene.nodes.filter(n => n.kind === 'kernel-signature')) {
              const first = C.inspect(flow, node.address), queue = [{address: node.address, depth: 0}], seen = new Set();
              while (queue.length) {
                const {address, depth} = queue.shift(), tag = slotKey(address); if (seen.has(tag)) continue; seen.add(tag);
                const selected = C.inspect(flow, address), at = {node: address.node, route: address.route};
                assert.equal(address.namespace, 'kernel-signature'); assert.equal(address.signatureRoot, t.recursorTypeRoot);
                assert.equal(address.evidenceSha256, d.sha256); assert.equal(address.minor, branch.minor);
                assert.deepEqual(address.query, q.parent.route); assert.deepEqual(selected.payload, ref.g.payloads[address.node]);
                assert.equal(selected.kind, A.kinds[ref.g.kind[address.node]]);
                assert.equal(selected.typing, 'signature-syntax-only'); assert.equal(selected.sourceOccurrenceInvented, false);
                const context = binder(ref.g, t.recursorTypeRoot, at); assert.equal(selected.contextLength, context.context);
                for (const [i, field] of selected.fields.entries()) {
                  assert.equal(field.field, A.fields[selected.kind][i]); assert.deepEqual(field.address.route, child(ref.g, at, i).route);
                  assert.equal(field.address.node, ref.g.children[address.node][i]); if (depth < 2) queue.push({address: field.address, depth: depth + 1});
                }
                if (selected.binding) {
                  assert.deepEqual(selected.binding.address.route, context.target.route); assert.equal(selected.binding.address.node, context.target.node); out.binderChecks++;
                  const i = ref.inputs.findIndex(p => slotKey(p) === slotKey(context.target));
                  if (i >= 0) {assert.equal(selected.binding.computedInput, i); assert.deepEqual(selected.binding.counterpart, flow.inputs[i].address); out.inputPositionBridges++;}
                  else assert.equal(selected.binding.computedInput, undefined);
                }
                out.signatureSelections++;
              }
              const app = application(ref.g, {node: node.address.node, route: node.address.route});
              for (let firstArgument = 0; firstArgument < Math.max(1, app.args.length); firstArgument += 4) {
                const page = C.inspect(flow, node.address, {firstArgument}); assert.equal(page.application.totalArguments, app.args.length);
                for (const argument of page.application.arguments) {
                  assert.deepEqual(argument.address.route, app.args[argument.ordinal].route);
                  assert.equal(argument.address.node, app.args[argument.ordinal].node);
                  if (node.id === 'signature:constructor') out.constructorArgumentSelections++;
                }
              }
              assert(first.fields.length <= 3);
            }
            out.diagrams++; if (n > 4) out.multiIndexPages++;
          }
          const scene = C.create(flow);
          for (const mutate of [x => x.motive++, x => x.ruleOwner += 'wrong', x => x.nodes[0].address.namespace = 'source-expression', x => x.stats.hiddenResultIndices++]) {
            const altered = plain(scene); mutate(altered); assert.throws(() => C.validate(altered, flow)); out.refusals++;
          }
          for (const mutate of [x => x.namespace = 'kernel-rule', x => x.signatureRoot = r.rhsRoot,
            x => x.evidenceSha256 = '0'.repeat(64), x => x.minor = 99, x => x.route = {root: 1, slots: []}]) {
            const at = plain(scene.resultAddress); mutate(at); assert.throws(() => C.inspect(flow, at)); out.refusals++;
          }
          assert.throws(() => C.create(plain(flow))); out.refusals++;
          for (const options of [{firstIndex: 999}, {indexLimit: 5}]) {assert.throws(() => C.create(flow, options)); out.refusals++;}
          assert.equal(requests, beforeRequests, 'projection must not fetch additional data');
          assert.equal(JSON.stringify(flow), originalFlow);
          if (paged) {
            const peer = paged.flow(q.parent.route, branch.minor); assert.deepEqual(C.create(peer), scene);
            for (const p of scene.nodes.filter(n => n.kind === 'kernel-signature')) assert.deepEqual(C.inspect(peer, p.address), C.inspect(flow, p.address));
            out.pagedFrames++;
          }
          if (scene.ruleOwner !== scene.recursor) out.mutualOwnerDifferences++;
          if (branch.interface.graph.kind[branch.interface.body.typeRoot] === 7) out.functionResultFrames++;
          out.rows.push({name: d.name, query: q.parent.route, minor: branch.minor, nativeOwner: d.sha256,
            recursor: scene.recursor, ruleOwner: scene.ruleOwner, constructor: scene.constructor,
            motive: scene.motive, indices: n, inputs: scene.inputCount, signatureRoot: t.recursorTypeRoot,
            computedBodyTypeRoot: flow.body.address.root, sceneSha256: sha(JSON.stringify(scene))});
          if (['AtlasOriginControls.natural', 'AtlasOriginControls.product'].includes(d.name) && branch.minor === (d.name.endsWith('natural') ? 1 : 0))
            common.set(d.name, {scene, interface: branch.interface});
          out.frames++;
        }
        paged?.dispose();
      }
    }
  } finally {globalThis.fetch = originalFetch;}
  const nat = common.get('AtlasOriginControls.natural'), prod = common.get('AtlasOriginControls.product');
  assert.deepEqual(nat.interface.graph, prod.interface.graph);
  assert.equal(nat.interface.body.typeText, prod.interface.body.typeText);
  assert.notEqual(nat.scene.constructor, prod.scene.constructor);
  out.identicalMethodDifferentConstructor = {status: 'PASS', sameComputedGraph: true, sameComputedResultText: true,
    constructors: [nat.scene.constructor, prod.scene.constructor]};
  assert.equal(out.profiles, 23); assert.equal(out.frames, 65); assert.equal(out.pagedFrames, 57);
  assert(out.multiIndexPages > 0 && out.mutualOwnerDifferences > 0 && out.functionResultFrames > 0 && out.inputPositionBridges > 0);
  const files = ['public/js/proof-atlas-branch-conclusion.js', 'public/js/proof-atlas-method-flow.js',
    'public/js/proof-atlas-method-interfaces.js', 'public/js/proof-atlas-elimination.js',
    'public/js/proof-atlas-mutual-recursors.js', base + 'check-model.cjs',
    ...manifests.map(n => 'public/data/proof-atlas/' + n + '-manifest.js')];
  out.files = Object.fromEntries(files.map(file => [file, sha(fs.readFileSync(file))]));
  out.status = 'PASS'; out.scope = 'Finite recorded generic branch signature projection and independent type/lexical walks, '
    + 'with complete/paged parity. No new native checks, added source occurrences, signature instantiation, expression-equality, general recursor coverage or comprehension claim.';
  fs.writeFileSync(base + 'model-check.json.gz', z.gzipSync(JSON.stringify(out, null, 2) + '\n'));
  console.log(JSON.stringify({...out, rows: undefined, files: undefined}));
})().catch(error => {console.error(error.stack); process.exitCode = 1;});
