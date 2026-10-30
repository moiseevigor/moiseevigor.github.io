'use strict';
// Bind fresh native outputs to the exact current derived endpoints. No inference
// from matching printed types, enclosing declarations or old kernel successes.
const fs = require('fs'), path = require('path'), z = require('zlib');
const assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '../../..'));
const {profiles, read, compact, sha} = require('../method-context/catalogue.cjs');
const A = require('../../../public/js/proof-atlas-library-data');
const M = require('../../../public/js/proof-atlas-method-interfaces');
const I = require('../../../public/js/proof-atlas-branch-instantiation');
const B = require('../../../public/js/proof-atlas-method-context');
const base = 'research/proof-atlas/method-conversion/';
const clone = x => JSON.parse(JSON.stringify(x));
const previousBytes = fs.readFileSync('research/proof-atlas/method-context/model-check.json.gz');
const previous = JSON.parse(z.gunzipSync(previousBytes));
const targets = previous.rows.filter(r => r.status === 'unavailable');
const names = [...new Set(targets.map(t => t.name))];
const mode = process.argv[2] || '--check';
assert(['--freeze', '--check'].includes(mode));

function bind(output, native, descriptor, query, flow, receipt, graph) {
  assert.deepEqual(output.source, {
    name: descriptor.name, edition: descriptor.edition, module: descriptor.record.module,
    indexSha256: descriptor.indexSha256, sourceSha256: descriptor.sourceSha256,
  });
  assert.equal(output.originalNativeOwner, descriptor.sha256);
  assert.deepEqual(native.source, {
    node: query.parent.node, route: query.parent.route, path: query.parent.path,
  });
  assert.equal(native.port.minor, flow.kernelRule.minor);
  assert.deepEqual(native.port.originalContext, query.parent.context);
  assert.equal(native.port.originalContextLength, flow.context.length);
  assert.equal(native.port.computedInputs, flow.inputs.length);
  assert.equal(native.port.contextLength, receipt.context.length);
  assert.equal(receipt.context.status, 'checked');
  assert.equal(receipt.status, 'unavailable');
  assert.equal(receipt.relation, 'beta-normal-forms-differ');
  assert.deepEqual(native.port.graph, graph);
  assert.equal(native.port.prefixChecks.length, flow.inputs.length);
  native.port.prefixChecks.forEach((p, i) => {
    assert.deepEqual(p, {ordinal: i, kernelDomainConversion: 'PASS', termAtExpectedDomain: 'PASS'});
  });
  assert.deepEqual(native.port.checks, {
    expectedIsType: 'PASS', computedIsType: 'PASS', kernelTypeConversion: 'PASS',
    kernelTermAtExpectedType: 'PASS', exactContextRoundtrip: true, wrongTypeRejected: true,
  });
}

(async () => {
  let record;
  if (mode === '--freeze') {
    const folder = process.argv[3]; assert(folder, 'private verifier output folder required');
    const verification = JSON.parse(fs.readFileSync(path.join(folder, 'verification.json')));
    record = {format: 'ProofAtlasMethodPortConversions/1',
      previousModelSha256: sha(previousBytes), verification,
      outputs: names.map((_, i) => JSON.parse(fs.readFileSync(path.join(folder, 'output-' + i + '.json'))))};
  } else record = JSON.parse(z.gunzipSync(fs.readFileSync(base + 'native-check.json.gz')));
  assert.equal(record.format, 'ProofAtlasMethodPortConversions/1');
  assert.equal(record.previousModelSha256, sha(previousBytes));
  const verification = record.verification;
  assert.equal(verification.format, 'ProofAtlasMethodPortNativeVerification/1');
  assert.equal(verification.status, 'PASS'); assert.equal(verification.ports, 6);
  assert.equal(verification.profiles.length, 3); assert.equal(record.outputs.length, 3);
  assert.equal(verification.originalProofSourcesRead, false);
  assert.equal(verification.originalProofModulesImported, false);
  assert.equal(verification.originalEnvironmentIdentityVerified, false);
  assert.equal(verification.dependencyRecovery.allBinaryHashesVerified, true);
  assert.equal(verification.dependencyRecovery.independentlyRebuilt, false);
  assert.equal(verification.dependencyRecovery.originalGitCheckoutsVerified, false);
  for (const [file, digest] of Object.entries(verification.producerFiles))
    assert.equal(sha(fs.readFileSync(file)), digest, file);
  const rows = []; let prefixChecks = 0, mutations = 0;
  for (const [ordinal, name] of names.entries()) {
    const descriptor = profiles.find(p => p.d.name === name).d;
    const output = record.outputs[ordinal], summary = verification.profiles[ordinal];
    assert.equal(output.status, 'PASS'); assert.equal(output.leanVersion, '4.33.1');
    assert.equal(sha(Buffer.from(JSON.stringify(output))), summary.outputSha256);
    assert.deepEqual(output.source, summary.source);
    assert.equal(summary.originalNativeOwner, descriptor.sha256);
    for (const key of ['originalTheoremAbsent', 'originalModuleAbsent', 'privateResearchModulesAbsent'])
      assert.equal(output[key], true);
    assert.equal(output.originalDeclarationKernelTyping, 'PASS');
    const raw = read(descriptor.file, descriptor.sha256);
    const source = A.validateIndex(read(descriptor.record.indexFile, descriptor.record.indexSha256), descriptor.record);
    const model = M.open(raw, source, descriptor.record, descriptor);
    const selected = targets.filter(t => t.name === name);
    assert.equal(output.queries.length, new Set(selected.map(t => JSON.stringify(t.query))).size);
    const seen = new Set();
    for (const nativeQuery of output.queries) {
      const query = raw.entries.find(q => JSON.stringify(q.parent.route) === JSON.stringify(nativeQuery.source.route));
      assert(query, 'exact original call');
      for (const port of nativeQuery.ports) {
        const key = JSON.stringify([nativeQuery.source.route, port.minor]); assert(!seen.has(key)); seen.add(key);
        assert(selected.some(t => t.minor === port.minor && JSON.stringify(t.query) === JSON.stringify(nativeQuery.source.route)));
        const flow = model.flow(query.parent.route, port.minor), parent = await I.compare(flow);
        const receipt = B.compare(flow, parent, {kind: 'body'}), derived = B.exportRecord(receipt);
        const graph = compact(derived.graph, [derived.expectedRoot, derived.actualRoot]);
        const native = {source: nativeQuery.source, port};
        bind(output, native, descriptor, query, flow, receipt, graph);
        // The endpoint matcher must reject near-miss provenance and context even
        // when the printed types and old parent kernel result are unchanged.
        const wrong = [
          x => { x.source.node++; }, x => { x.source.route.slots.push(0); },
          x => { x.source.path += '.body'; }, x => { x.port.minor++; },
          x => { x.port.originalContext[0].node++; },
          x => { x.port.originalContext[0].route.slots.push(0); },
          x => { x.port.originalContextLength++; }, x => { x.port.computedInputs++; },
          x => { x.port.contextLength++; }, x => { x.port.graph.roots.reverse(); },
          x => { x.port.graph.payloads[0] = {wrong: true}; },
          x => { x.port.checks.kernelTypeConversion = 'FAIL'; },
          x => { x.port.checks.kernelTermAtExpectedType = 'FAIL'; },
          x => { x.port.checks.wrongTypeRejected = false; },
        ];
        for (const change of wrong) {
          const altered = clone(native); change(altered);
          assert.throws(() => bind(output, altered, descriptor, query, flow, receipt, graph)); mutations++;
        }
        for (const key of ['name', 'edition', 'indexSha256', 'sourceSha256', 'module']) {
          const altered = clone(output); altered.source[key] += '-wrong';
          assert.throws(() => bind(altered, native, descriptor, query, flow, receipt, graph)); mutations++;
        }
        const foreign = clone(output); foreign.originalNativeOwner = '0'.repeat(64);
        assert.throws(() => bind(foreign, native, descriptor, query, flow, receipt, graph)); mutations++;
        prefixChecks += port.prefixChecks.length;
        rows.push({name, owner: descriptor.sha256, query: query.parent.route, minor: port.minor,
          betaAlphaStatus: receipt.status, betaAlphaRelation: receipt.relation,
          context: {original: port.originalContextLength, computedInputs: port.computedInputs, length: port.contextLength},
          kernelTypeConversion: port.checks.kernelTypeConversion,
          kernelTermAtExpectedType: port.checks.kernelTermAtExpectedType,
          graphSha256: sha(Buffer.from(JSON.stringify(graph))), cells: graph.kind.length});
      }
    }
    assert.equal(seen.size, summary.ports); assert.equal(seen.size, selected.length);
  }
  assert.equal(rows.length, 6); assert.equal(prefixChecks, 6); assert.equal(mutations, 120);
  const files = [base + 'check.cjs', base + 'prepare.cjs', base + 'verify.py', base + 'StrictBeta.lean', base + 'PortConversion.lean',
    'public/js/proof-atlas-method-context.js', 'public/js/proof-atlas-method-interfaces.js',
    'public/js/proof-atlas-branch-instantiation.js', 'research/proof-atlas/method-context/catalogue.cjs'];
  const report = {format: 'ProofAtlasMethodPortConversionBinding/1', status: 'PASS',
    profiles: 3, ports: rows.length, prefixChecks, nativeWrongTypeRejections: 6,
    endpointMutationRejections: mutations, previousModelSha256: sha(previousBytes),
    nativeRecordSha256: sha(Buffer.from(JSON.stringify(record))),
    files: Object.fromEntries(files.map(f => [f, sha(fs.readFileSync(f))])), rows,
    scope: 'Six exact compiled body-type endpoints and actual computed contexts, with separate fresh kernel evidence. '
      + 'Beta/alpha outcomes unchanged. Endpoint mutations test the matcher; native wrong-type controls test the kernel. '
      + 'No original source scripts, broader conversion coverage, application changes, deployment or comprehension result.'};
  if (mode === '--freeze') {
    fs.writeFileSync(base + 'native-check.json.gz', z.gzipSync(JSON.stringify(record)));
    fs.writeFileSync(base + 'model-check.json.gz', z.gzipSync(JSON.stringify(report, null, 2) + '\n'));
  } else assert.deepEqual(report, JSON.parse(z.gunzipSync(fs.readFileSync(base + 'model-check.json.gz'))));
  console.log(JSON.stringify({...report, files: undefined, rows: undefined}));
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
