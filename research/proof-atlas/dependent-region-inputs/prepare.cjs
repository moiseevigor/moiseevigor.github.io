'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), assert = require('assert/strict');
const A = require('../../../public/js/proof-atlas-library-data');
const E = require('../../../public/js/proof-atlas-equality-transport');
const M = require('../../../public/js/proof-atlas-application-ports');
const P = require('../application-ports/prepare.cjs');
const C = require('../region-input-functions/model.cjs');
process.chdir(path.resolve(__dirname, '../../..'));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const folder = process.argv[2]; assert(folder);
const names = ['finSuccessor', 'finConstructor', 'proofAfter', 'proofDiamond'];
const sourceHash = hash(fs.readFileSync('research/proof-atlas/dependent-region-inputs/Controls.lean'));
const plans = [];
for (const name of names) {
  const packet = fs.readFileSync(path.join(folder, 'packets', name + '.json')), g = JSON.parse(packet);
  const record = { name: g.declaration.name, module: g.declaration.module, kind: g.declaration.kind,
    sourceSha256: sourceHash, indexSha256: hash(packet), uniqueNodes: g.kind.length,
    occurrences: g.roots.reduce((sum, root) => sum + BigInt(g.expanded[root]), 0n).toString(),
    indexFile: '/public/data/proof-atlas/dependent-region-controls/' + hash(packet) + '.json.gz' };
  A.validateIndex(g, record); assert(!g.declaration.axioms.includes('sorryAx'));
  const source = { edition: 'dependent-region-controls', name: record.name, indexSha256: record.indexSha256, sourceSha256: sourceHash };
  let node = g.roots[1], slots = [];
  while (g.kind[node] === 6) { slots.push(1); node = g.children[node][1]; }
  assert.equal(g.kind[node], 8); assert.equal(g.payloads[node].declName, 'k');
  const seed = { node: g.children[node][1], route: { root: 1, slots: [...slots, 1] } };
  const body = { node: g.children[node][2], route: { root: 1, slots: [...slots, 2] } };
  const anchors = name === 'proofDiamond' ? [seed, M.sourceInput(g, body, 3), M.sourceInput(g, body, 4), body] : [seed, body];
  const heads = anchors.map(anchor => g.payloads[E.spine(g, anchor.node).head].name);
  assert.deepEqual(heads, name === 'finSuccessor' ? ['Nat.succ', 'Fin.succ'] : name === 'finConstructor' ? ['Nat.succ', 'Fin.mk'] : name === 'proofAfter' ? ['Nat.succ', 'Nat.le_of_lt'] : ['Nat.succ', 'Nat.le_of_lt', 'Nat.lt_succ_of_lt', 'And.intro']);
  const plan = P.plan(source, record, null, g, anchors, 'authored-dependent-region');
  assert.equal(plan.calls.length, anchors.length); plans.push(plan);
}
if (!process.argv.includes('--ports')) {
  fs.writeFileSync(path.join(folder, 'port-plan.json'), JSON.stringify(plans, null, 2) + '\n');
  fs.writeFileSync(path.join(folder, 'port-requests.json'), JSON.stringify(plans.map(plan => ({
    packetFile: path.resolve(folder, 'packets', plan.record.name.split('.').pop() + '.json'), source: plan.source, mode: 'replay', inputs: plan.inputs
  }))) + '\n');
  console.log(JSON.stringify({ status: 'PASS', profiles: plans.length, calls: plans.reduce((n, plan) => n + plan.calls.length, 0), ports: plans.reduce((n, plan) => n + plan.inputs.length, 0) }));
} else {
  const native = JSON.parse(fs.readFileSync(path.join(folder, 'ports.json'))), profiles = [];
  for (const [i, plan] of plans.entries()) {
    const row = native[i], g = JSON.parse(fs.readFileSync(path.join(folder, 'packets', names[i] + '.json')));
    assert.deepEqual(row.source, plan.source); assert.equal(row.kernelClosedTermTyping, 'PASS'); assert.deepEqual(row.refusals, []);
    assert.equal(row.originalDeclarationPresent, false); assert.equal(row.originalModulePresent, false); assert.equal(row.privateRiccatiModulesPresent, false);
    const entries = new Map(row.entries.map(entry => [entry.id, entry.junction]));
    assert.equal(entries.size, plan.inputs.length);
    const callAt = new Map(plan.calls.map(call => [M.key(call.anchor.route), call.index]));
    const records = plan.calls.map(call => ({ index: call.index, anchor: call.anchor, arguments: call.arguments,
      functionLabel: entries.get(call.index + ':0').display.inputTerm.slice(0, 180),
      result: { role: entries.get(call.index + ':0').resultRole, contextLength: entries.get(call.index + ':0').consumer.context.length, typeText: entries.get(call.index + ':0').display.consumerType.slice(0, 1024) },
      ports: call.inputs.map(input => {
        const j = entries.get(input.id); M.validatePort(j, g, call, input.slot);
        const producer = callAt.get(M.key(j.producer.anchor.route));
        if (producer !== undefined) {
          const original = entries.get(producer + ':0');
          assert.deepEqual(j.producer.anchor, original.consumer.anchor);
          assert.deepEqual(j.producer.context, original.consumer.context);
          assert(E.equal(j.graph, j.roots.producerType, original.graph, original.roots.consumerType, 0), 'Literal original producer-result type');
        }
        return { id: input.id, slot: input.slot, input: j.consumer.input, producer: j.producer.anchor,
          producerKind: j.producer.kind, producerContextLength: j.producer.context.length, consumerContextLength: j.consumer.context.length,
          role: j.producer.role, visibility: j.binderInfo, hops: j.definitionHops, externalBinder: j.externalBinder,
          definitionBoundary: j.definitionBoundary, knownProducer: producer ?? null,
          literalProducerResultType: producer === undefined ? null : 'PASS' };
      }) }));
    let commonContext = C.context(g, records[0].anchor);
    for (const call of records) { const frames = C.context(g, call.anchor); let length = 0; while (length < frames.length && length < commonContext.length && M.same(frames[length], commonContext[length])) length++; commonContext = commonContext.slice(0, length); }
    const edges = records.flatMap(call => call.ports.filter(port => port.knownProducer !== null).map(port => ({ from: port.knownProducer, to: call.index, slot: port.slot })));
    const members = records.map(call => call.index), order = [], pending = new Set(members);
    while (pending.size) { const id = [...pending].find(id => !edges.some(edge => edge.to === id && pending.has(edge.from))); assert.notEqual(id, undefined); order.push(id); pending.delete(id); }
    assert.deepEqual(order, members);
    const ownerBytes = Buffer.from(JSON.stringify(row) + '\n'), owner = { file: '/public/data/proof-atlas/application-ports/' + hash(ownerBytes) + '.json.gz', sha256: hash(ownerBytes), bytes: ownerBytes.length };
    const profile = { source: plan.source, record: plan.record, originalNativeOwner: owner, members, order, commonContext, records, edges,
      graphCheck: { status: 'ACYCLIC', inventoryCalls: members.length, inventoryUses: edges.length, scope: 'Complete predetermined computational call inventory for this authored control; type-expression applications are not inventoried calls.' },
      policies: ['all-boundary-positions', 'proof-arguments', 'proof-and-function-inputs'] };
    const request = { format: 'ProofAtlasRegionInputFunctionRequest/1', ...profile,
      packetFile: path.resolve(folder, 'packets', names[i] + '.json') };
    const requestFile = path.resolve(folder, 'region-request-' + i + '.json'); fs.writeFileSync(requestFile, JSON.stringify(request) + '\n');
    profiles.push({ ...profile, requestFile, requestSha256: hash(fs.readFileSync(requestFile)), packetFile: request.packetFile });
  }
  fs.writeFileSync(path.join(folder, 'region-plan.json'), JSON.stringify({ format: 'ProofAtlasDependentRegionPlan/1', profiles }, null, 2) + '\n');
  console.log(JSON.stringify({ status: 'PASS', profiles: profiles.length, candidates: profiles.length * 3 }));
}
