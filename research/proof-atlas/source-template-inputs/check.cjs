'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib'), crypto = require('crypto'), assert = require('assert/strict');
const A = require('../../../public/js/proof-atlas-library-data'), M = require('./model.cjs'), C = require('./control-model.cjs');
const {allGraphs} = require('./graphs.cjs');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/source-template-inputs/';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const raw = file => z.gunzipSync(fs.readFileSync(file)), read = file => JSON.parse(raw(file)), clone = value => JSON.parse(JSON.stringify(value));
const native = read(base + 'native.json.gz'), verification = read(base + 'verification.json.gz');
const controls = read(base + 'controls.json.gz'), controlVerification = read(base + 'control-verification.json.gz');
for (const [file, report] of [[base + 'native.json.gz', verification], [base + 'controls.json.gz', controlVerification]]) {
  assert.equal(report.status, 'PASS'); assert.equal(sha(raw(file)), report.nativeSha256);
  for (const [file, hash] of Object.entries(report.producerFiles)) assert.equal(sha(fs.readFileSync(file)), hash, file);
}
assert.equal(native.format, 'ProofAtlasSourceTemplateInputs/1');
assert.equal(controls.format, 'ProofAtlasSourceTemplateControls/1');
assert.equal(controls.namespace, 'authored-source-template-controls');
assert.equal(controls.status, 'PASS');
assert.equal(verification.candidates, 30); assert.equal(verification.passed, 30);
const parents = new Map();
for (const [file, hash] of Object.entries(verification.parents)) {
  assert.equal(sha(raw(file)), hash);
  if (file.includes('/boundary-constraints/')) for (const profile of read(file).profiles) parents.set(profile.source.indexSha256, profile);
}
assert.equal(parents.size, 10);
const files = [...new Set([
  ...['check.cjs','model.cjs','control-model.cjs','graphs.cjs','native.json.gz','verification.json.gz','controls.json.gz','control-verification.json.gz'].map(file => base + file),
  'research/proof-atlas/method-context/catalogue.cjs', 'public/js/proof-atlas-library-data.js',
  ...Object.keys(verification.producerFiles), ...Object.keys(controlVerification.producerFiles), ...Object.keys(verification.parents), ...native.profiles.map(p => p.record.indexFile.slice(1))
])];
const fingerprints = () => Object.fromEntries(files.map(file => [file, sha(fs.readFileSync(file))])), initial = fingerprints();
const report = {format:'ProofAtlasSourceTemplateModel/1', status:'RUNNING', profiles:0, candidates:0, accepted:0, unchangedFunctions:0, newlyAccepted:0,
  derivedInputs:0, templates:0, permutations:0, templateStates:0, peakRows:0, mutations:[], controls:[], cases:[], files:{}};
function audit(source, profile, record) {
  assert.equal(record.status, 'PASS'); assert.equal(record.constraintRule, 'source-lambda-order/1');
  for (const flag of ['kernelClosedTyping','kernelSpecialization','kernelEqualityWitness']) assert.equal(record[flag], 'PASS');
  assert.equal(record.originalResultPortals, profile.members.length);
  allGraphs(record);
  return M.audit(source, profile, record);
}
function refuse(label, source, profile, record, mutate) {
  const damaged = clone(record); mutate(damaged);
  assert.throws(() => audit(source, profile, damaged), undefined, 'undetected mutation: ' + label);
  report.mutations.push({source:profile.source.name, policy:record.policy, mutation:label});
}
for (const profile of native.profiles) {
  const parent = parents.get(profile.source.indexSha256); assert(parent);
  for (const key of ['source','record','members','order','records','commonContext','graphCheck']) assert.deepEqual(profile[key], parent[key]);
  const bytes = raw('.' + profile.record.indexFile); assert.equal(sha(bytes), profile.source.indexSha256);
  const source = A.validateIndex(JSON.parse(bytes), profile.record);
  assert.deepEqual(profile.native.cases.map(row => row.policy), parent.native.cases.map(row => row.policy));
  for (const candidate of profile.native.cases) {
    const result = audit(source, profile, candidate), baseline = parent.native.cases.find(row => row.policy === candidate.policy);
    report.candidates++; report.accepted++;
    report.derivedInputs += result.derived; report.templates += result.templates; report.permutations += result.permutations; report.templateStates += result.templateStates;
    report.peakRows = Math.max(report.peakRows, result.rows);
    if (baseline.status === 'PASS') { assert.deepEqual(candidate.graph, baseline.graph, 'earlier accepted function changed'); report.unchangedFunctions++; }
    else { assert.equal(baseline.status, 'KERNEL_REJECTED'); assert.equal(profile.source.name, 'JacobiData.slope_bound_abs'); report.newlyAccepted++; }
    report.cases.push({source:profile.source.name, policy:candidate.policy, baseline:baseline.status, ...result});
    if (candidate.constraints.length) {
      const mutations = [
        ['assignment-key', d => d.constraints[0].bindingKey = 'foreign'],
        ['assignment-index', d => d.constraints[0].binding++],
        ['assignment-context-length', d => d.constraints[0].contextLength++],
        ['assignment-event', d => d.constraints[0].slot = 64],
        ['assignment-source-port', d => d.constraints[0].sourcePort.slot++],
        ['assignment-value', d => d.constraints[0].graph.roots[0] = d.constraints[0].graph.roots[3]],
        ['source-specialization-value', d => d.constraints[0].graph.roots[1] = d.constraints[0].graph.roots[4]],
        ['source-witness', d => d.constraints[0].graph.roots[5] = d.constraints[0].graph.roots[6]],
        ['source-specialization-status', d => d.constraints[0].kernelSourceSpecialization = 'UNKNOWN'],
        ['root-context-owner', d => d.constraints[0].rootContexts[0] = 'original'],
        ['assignment-count', d => d.constraints.pop()],
        ['declaration-key', d => d.bindings[0].key = 'foreign'],
        ['result-recovery-status', d => d.kernelSpecialization = 'UNKNOWN'],
        ['call-snapshot-order', d => d.calls.at(-1).contextBindingKeys.reverse()],
        ['call-snapshot-result', d => d.calls[0].graph.roots[0] = d.calls[0].graph.roots[1]],
        ['source-equality-type', d => d.graph.roots[9] = d.graph.roots[8]]
      ];
      for (const [label, mutate] of mutations) refuse(label, source, profile, candidate, mutate);
    }
    if (candidate.templates.length) {
      assert.equal(candidate.independentInputs, 17); assert.equal(candidate.derivedInputs, 18); assert.deepEqual(candidate.keptContextSlots, [0, 1]);
      assert.equal(candidate.templates.length, 3); assert.equal(candidate.permutations.length, 1);
      for (const [label, mutate] of [
        ['template-relation', d => d.templates[0].relation = 'source-use'],
        ['template-binding', d => d.templates[0].bindingKey = d.bindings[0].key],
        ['template-constraint', d => d.templates[0].constraint++],
        ['template-trigger-slot', d => d.templates[0].slot++],
        ['template-source-pattern', d => {const p=d.templates[0];p.groups[p.usedGroups[0]].sourceRoot=0;}],
        ['template-target-identity', d => {const p=d.templates[0];p.groups[p.usedGroups[0]].targets=[d.bindings[0].key];}],
        ['template-output', d => d.templates[0].graph.roots[1] = d.templates[0].graph.roots[0]],
        ['template-scope', d => d.templates[0].contextBindingKeys.reverse()],
        ['template-cache-accounting', d => d.templates[0].storedStates--],
        ['template-used-patterns', d => d.templates[0].usedGroups.pop()],
        ['permutation-cause', d => d.permutations[0].cause = 'foreign'],
        ['permutation-old-order', d => d.permutations[0].old.reverse()],
        ['permutation-new-order', d => d.permutations[0].new = [...d.permutations[0].old]],
        ['permutation-header', d => {const p=d.permutations[0];p.nodes[0].domainRoot=p.nodes.at(-1).domainRoot;}],
        ['permutation-value', d => {const p=d.permutations[0],n=p.nodes.find(n=>n.valueRoot!==null);n.valueRoot=n.domainRoot;}],
        ['permutation-record-omitted', d => d.permutations = []],
        ['permutation-context-status', d => d.permutations[0].kernelContextTyping = 'UNKNOWN']
      ]) refuse(label, source, profile, candidate, mutate);
    }
  }
  report.profiles++;
}
assert.equal(report.profiles, 10); assert.equal(report.candidates, 30); assert.equal(report.accepted, 30);
assert.equal(report.unchangedFunctions, 29); assert.equal(report.newlyAccepted, 1); assert.equal(report.derivedInputs, 23);
assert.equal(report.templates, 3); assert.equal(report.permutations, 1); assert.equal(report.templateStates, 215);
const expectedControls = ['forward-value-order','dependent-domain-order','cycle-refused','source-lambda','shadowed-lambda','shared-lambda','ambiguous-source-values-refused','coherent-source-values','constant-family-refused','source-value-refused','wrong-type-refused','unknown-binding-refused','closed-telescope-alignment'];
assert.deepEqual(controls.records.map(row => row.name), expectedControls);
for (const record of controls.records) {
  report.controls.push(C.auditControl(record));
  const mutations = [];
  if (record.template) mutations.push(
    ['control-template-cache', d => d.template.storedStates++],
    ['control-template-pattern', d => d.template.groups[0].sourceRoot = 0],
    ['control-template-value', d => d.template.graph.roots[1] = d.template.graph.roots[0]]
  );
  if (record.permutations?.length) mutations.push(['control-dependency-order', d => d.permutations[0].new = [...d.permutations[0].old]]);
  if (record.name === 'coherent-source-values') mutations.push(['control-duplicate-identity', d => d.template.groups[0].targets.pop()]);
  if (record.graph && record.bindings) mutations.push(['control-function-term', d => d.graph.roots[d.template ? 2 : 0] = d.graph.roots[1]]);
  if (record.refusal) mutations.push(['control-refusal-reason', d => d.refusal.reason = 'UNAVAILABLE']);
  if (record.refusalReason) mutations.push(['control-ambiguity-cause', d => d.refusalReason = 'typing-error']);
  for (const [label, mutate] of mutations) {
    const damaged = clone(record); mutate(damaged); assert.throws(() => C.auditControl(damaged), undefined, label);
    report.mutations.push({control:record.name, mutation:label});
  }
}
report.files = fingerprints(); assert.deepEqual(report.files, initial);
report.status = 'PASS';
report.scope = 'Independent constructor reconstruction of thirty fixed source-specializing region functions and source witnesses; complete assignment-context traces, explicit stable dependency permutations and maximal whole-source-lambda rewrites with literal source recovery. Thirteen authored control audits include bounded shared-DAG rewriting, shadowing, coherent duplicate identities and cycle refusal. Native inferred domains/signatures, tuple universes, type eligibility and kernel conversions remain observations. No general preservation theorem, JS type inference, interface minimality or comprehension claim.';
const bytes = Buffer.from(JSON.stringify(report, null, 2) + '\n');
if (process.argv.includes('--check')) assert(raw(base + 'model-check.json.gz').equals(bytes));
else fs.writeFileSync(base + 'model-check.json.gz', z.gzipSync(bytes, {mtime:0}));
console.log(JSON.stringify({...report, cases:undefined, controls:report.controls.length, mutations:report.mutations.length, files:undefined}));
