'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib');
const cp = require('child_process'), crypto = require('crypto'), assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/method-conversion/';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const load = name => JSON.parse(z.gunzipSync(fs.readFileSync(base + name + '.json.gz')));
const checked = cp.execFileSync(process.execPath, [base + 'check.cjs', '--check'], {encoding: 'utf8'});
assert.equal(JSON.parse(checked).status, 'PASS');
const model = load('model-check'), native = load('native-check');
const predecessor = '6967ca80c6742a5f30acda8f7c79b46e69dcec68';
const unchanged = [
  'research/proof-atlas/method-context/model-check.json.gz',
  'research/proof-atlas/method-context/primitive-check.json.gz',
  'research/proof-atlas/method-context/browser-check.json.gz',
  'research/proof-atlas/method-context/evidence.json.gz',
  'public/js/proof-atlas-method-context.js', 'public/js/proof-atlas-method-interfaces.js',
  'public/js/proof-atlas-branch-instantiation.js',
];
const inputs = unchanged.map(file => {
  const bytes = fs.readFileSync(file);
  assert(bytes.equals(cp.execFileSync('git', ['show', predecessor + ':' + file], {maxBuffer: 67108864})), file);
  return {file, sha256: sha(bytes)};
});
const files = ['README.md', 'prepare.cjs', 'verify.py', 'StrictBeta.lean', 'PortConversion.lean',
  'check.cjs', 'evidence.cjs', 'native-check.json.gz', 'model-check.json.gz'].map(name => {
  const file = base + name; return {file, sha256: sha(fs.readFileSync(file))};
});
const report = {format: 'ProofAtlasMethodPortConversionEvidence/1', status: 'PASS', predecessor,
  ports: model.ports, profiles: model.profiles, prefixChecks: model.prefixChecks,
  nativeWrongTypeRejections: model.nativeWrongTypeRejections,
  endpointMutationRejections: model.endpointMutationRejections,
  originalProofSourcesRead: false, originalProofModulesImported: false,
  originalEnvironmentIdentityVerified: false,
  dependencyRecovery: native.verification.dependencyRecovery,
  inputs, files, scope: model.scope};
const bytes = Buffer.from(JSON.stringify(report, null, 2) + '\n');
if (process.argv.includes('--check')) assert.deepEqual(z.gunzipSync(fs.readFileSync(base + 'evidence.json.gz')), bytes);
else fs.writeFileSync(base + 'evidence.json.gz', z.gzipSync(bytes));
console.log(JSON.stringify({status: 'PASS', ports: report.ports, profiles: report.profiles,
  prefixChecks: report.prefixChecks, nativeWrongTypeRejections: report.nativeWrongTypeRejections,
  endpointMutationRejections: report.endpointMutationRejections, sha256: sha(bytes)}));
