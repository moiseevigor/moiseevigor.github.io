/* Audit immutable native frontier layers, preserving earlier contextual judgments. */
'use strict';
const fs = require('fs'), vm = require('vm'), z = require('zlib'), crypto = require('crypto'), assert = require('assert/strict');
const A = require('../public/js/proof-atlas-library-data'), T = require('../public/js/proof-atlas-occurrence-types');
const E = require('../public/js/proof-atlas-elimination'), Z = require('../public/js/proof-atlas-let-reduction');
const F = require('../research/proof-atlas/packet-typing/frontier.cjs'), S = require('../research/proof-atlas/share_type_graphs.cjs');
const audit = require('./proof-atlas-frontier-chain-audit.cjs');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const chain = JSON.parse(fs.readFileSync('research/proof-atlas/packet-typing/frontier-chain.json')), w = {};
for (const f of ['goedel-sample-manifest.js', 'packet-types-manifest.js']) vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + f, 'utf8'), {window: w});
function read(d) {
  const bytes = z.gunzipSync(fs.readFileSync('.' + (d.indexFile || d.file)));
  assert.equal(sha(bytes), d.indexFile ? d.indexSha256 : d.sha256); return JSON.parse(bytes);
}
(async () => {
  assert.equal(chain.format, 'ProofAtlasProofFrontierChain/1');
  assert(chain.stages.length > 0 && chain.stages.length <= 32);
  const record = w.PROOF_ATLAS_AI_SAMPLE.edition.declarations.find(r => r.name === chain.source.name);
  const data = A.validateIndex(read(record), record), providers = {}, rows = [];
  const firstSeed = JSON.parse(fs.readFileSync(chain.stages[0].seedFile));
  const priorFetch = globalThis.fetch;
  try {
    globalThis.fetch = async f => new Response(fs.readFileSync('.' + f));
    for (const p of firstSeed.providers) providers[p.kind] = await ({primary: T, case: E, let: Z}[p.kind]).open(p.descriptor, data, record);
  } finally { globalThis.fetch = priorFetch; }
  let previousDescriptor = firstSeed.seedTypes, before = read(previousDescriptor), lastFrontier, lastIndependent, lastBefore;
  assert(S.verify(before));
  const historicalSeedCount = before.entries.length;
  const initialEvidence = before;
  for (const stage of chain.stages) {
    const seedBytes = fs.readFileSync(stage.seedFile), seed = JSON.parse(seedBytes);
    assert.deepEqual(seed.source, chain.source); assert.deepEqual(seed.seedTypes, previousDescriptor);
    assert.deepEqual(seed.providers, firstSeed.providers, 'A layer changed the earlier providers');
    const resolve = F.resolver({...providers, packet: T.provider(before, data, record, previousDescriptor)});
    const seeds = before.entries.map(e => e.route), independent = audit.enumerate(data, resolve, seeds);
    const frontier = F.collect(data, record, resolve, seeds);
    audit.auditFrontier(frontier, independent);
    assert.deepEqual(seed.expected, {seedQueries: seeds.length, proofPremises: independent.proofPremises,
      terminalReferences: independent.terminalReferences, recordedConstructions: independent.recordedConstructions,
      newQueries: independent.pending.length, totalQueries: seeds.length + independent.pending.length});
    const after = read(stage.resultTypes); assert(S.verify(after)); T.provider(after, data, record, stage.resultTypes);
    assert.equal(after.queryPolicy.kind, 'recorded-proof-premise-layer/1');
    assert.equal(after.queryPolicy.seedPolicySha256, sha(seedBytes));
    assert.deepEqual(after.queryPolicy.seedTypes, seed.seedTypes); assert.deepEqual(after.queryPolicy.providers, seed.providers);
    assert.deepEqual(after.queryPolicy.frontier, frontier);
    rows.push({...audit.auditLayer(data, before, after, frontier), evidenceSha256: stage.resultTypes.sha256,
      proofPremises: independent.proofPremises, terminalReferences: independent.terminalReferences,
      recordedConstructions: independent.recordedConstructions});
    lastBefore = before; lastFrontier = frontier; lastIndependent = independent;
    before = after; previousDescriptor = stage.resultTypes;
  }
  assert.deepEqual(previousDescriptor, JSON.parse(JSON.stringify(w.PROOF_ATLAS_PACKET_TYPES.records[0])), 'Chain must end at the active package');
  for (const entry of initialEvidence.entries) {
    const current = before.entries.find(e => audit.key(e.route) === audit.key(entry.route));
    assert.deepEqual(audit.normalized(current, before.typeGraph), audit.normalized(entry, initialEvidence.typeGraph));
  }
  const provider = T.provider(before, data, record, previousDescriptor), resolve = F.resolver({...providers, packet: provider});
  const seeds = before.entries.map(e => e.route), next = F.collect(data, record, resolve, seeds);
  const independentNext = audit.enumerate(data, resolve, seeds); audit.auditFrontier(next, independentNext);
  const shared = new Map();
  for (const stage of chain.stages) {
    const seed = JSON.parse(fs.readFileSync(stage.seedFile)), evidence = read(seed.seedTypes);
    const resolve = F.resolver({...providers, packet: T.provider(evidence, data, record, seed.seedTypes)});
    for (const pending of audit.enumerate(data, resolve, evidence.entries.map(e => e.route)).pending) {
      const k = pending.node; if (!shared.has(k)) shared.set(k, new Map());
      shared.get(k).set(audit.key(pending.route), pending.context);
    }
  }
  // Changed topology, identity, context and route incidence must all fail.
  let controls = 0;
  function reject(fn) { assert.throws(fn); controls++; }
  for (const change of [
    e => e.entries.pop(),
    e => e.entries.push(structuredClone(e.entries[0])),
    e => e.entries.reverse(),
    e => e.source.indexSha256 = '0'.repeat(64),
    e => e.entries[0].typeText += ' changed',
    e => e.entries.find(x => x.context.length).context.pop()
  ]) { const changed = structuredClone(before); change(changed); reject(() => audit.auditLayer(data, lastBefore, changed, lastFrontier)); }
  const omitted = structuredClone(lastFrontier); omitted.pending.pop(); reject(() => audit.auditFrontier(omitted, lastIndependent));
  const wrongParent = structuredClone(lastFrontier); wrongParent.pending[0].parents[0].field = 'other'; reject(() => audit.auditFrontier(wrongParent, lastIndependent));
  const collapsed = structuredClone(lastFrontier); collapsed.pending = [...new Map(collapsed.pending.map(p => [p.node, p])).values()];
  if (collapsed.pending.length < lastFrontier.pending.length) reject(() => audit.auditFrontier(collapsed, lastIndependent));
  reject(() => audit.enumerate(data, resolve, [seeds[0], seeds[0]]));
  if (next.pending.length > 1) reject(() => audit.enumerate(data, resolve, seeds, {maxNewQueries: next.pending.length - 1}));
  assert.equal(audit.enumerate(data, () => null, seeds).proofPremises, 0);
  for (const maxNewQueries of [0, 513]) reject(() => F.collect(data, record, resolve, seeds, {maxNewQueries}));
  reject(() => F.collect(data, record, resolve, [seeds[0], seeds[0]]));
  if (next.pending.length > 1) reject(() => F.collect(data, record, resolve, seeds, {maxNewQueries: next.pending.length - 1}));
  // Moving type nodes must preserve scalar and array references; changing a referenced type must not.
  const g = {kind: [3, 11], payloads: [{level: {kind: 'zero'}}, {typeName: 'Pair', index: 0}], children: [[], [0]], expanded: ['1', '2'], neededScope: [0, 0]};
  const shifted = {kind: [4, 3, 11], payloads: [{name: 'Unused', levels: []}, ...g.payloads], children: [[], [], [1]], expanded: ['1', '1', '2'], neededScope: [0, 0, 0]};
  const originalRoots = {typeRoot: 1, projectionJudgment: {parameterRoots: [0], previousProjectionRoots: [1]}};
  const shiftedRoots = {typeRoot: 2, projectionJudgment: {parameterRoots: [1], previousProjectionRoots: [2]}};
  assert.deepEqual(audit.normalized(originalRoots, g), audit.normalized(shiftedRoots, shifted));
  reject(() => assert.deepEqual(audit.normalized(originalRoots, g), audit.normalized({...shiftedRoots, projectionJudgment: {...shiftedRoots.projectionJudgment, parameterRoots: [0]}}, shifted)));
  const report = {status: 'PASS', evidenceSha256: previousDescriptor.sha256, stages: rows,
    historicalSeedJudgmentsPreserved: historicalSeedCount, nativeSeedJudgmentsPreserved: lastBefore.entries.length,
    newQueries: lastFrontier.pending.length, publishedQueries: before.entries.length,
    proofPremisesIndependentlyEnumerated: rows.reduce((n, r) => n + r.proofPremises, 0),
    sharedNodesWithDistinctRoutes: [...shared.values()].filter(m => m.size > 1).length,
    controlRejections: controls, unknownRolesDoNotGenerateQueries: true,
    nextUnrecordedProofPremises: next.pending.length, source: next.source, next,
    scope: 'Exact finite native proof-premise layers. Type tables are compared structurally in their original contexts. Terminal references, unrecorded descendants and omitted type/value branches prevent a whole-proof or semantic-coverage claim.'};
  fs.writeFileSync(process.env.ATLAS_FRONTIER_CHAIN_REPORT || '/tmp/atlas-frontier-chain.json', JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(process.env.ATLAS_PROOF_FRONTIER_REPORT || '/tmp/atlas-proof-frontier.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({...report, next: undefined}));
})().catch(error => { console.error(error.stack); process.exit(1); });
