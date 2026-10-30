'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib'), vm = require('vm');
const crypto = require('crypto'), cp = require('child_process'), assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/branch-instantiation/';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const load = name => JSON.parse(z.gunzipSync(fs.readFileSync(base + name)));
const model = load('model-check.json.gz'), browser = load('browser-check.json.gz');
const names = ['flow-model', 'manual-model', 'flow-browser', 'mutual-browser', 'manual-browser', 'clarity-browser'];
const compatibility = Object.fromEntries(names.map(n => [n, load(n + '.json.gz')]));
for (const report of [model, browser, ...Object.values(compatibility)]) assert.equal(report.status, 'PASS');
for (const report of [model, browser, ...Object.values(compatibility)]) {
  const files = report.files || report.builtFiles || {};
  for (const [file, hash] of Array.isArray(files) ? files.map(x => [x.file, x.sha256]) : Object.entries(files))
    assert.equal(sha(fs.readFileSync(file)), hash, 'changed checked file: ' + file);
}
const expected = {profiles: 23, frames: 65, pagedFrames: 57, pagedCalls: 30, synthetic: 256,
  refusals: 742, peakMemo: 240, peakFrontier: 40, peakPairs: 240, usedBindings: 160, wholeArchiveAttempts: 0};
const primitive = load('primitive-check.json.gz');
assert.equal(primitive.status, 'PASS'); assert.equal(primitive.positiveCases, 322); assert.equal(primitive.negativeCases, 16);
assert.equal(primitive.coreOnly, true); assert.equal(primitive.newKernelTyping, false);
assert.equal(primitive.originalProofSourcesRead, false); assert.equal(primitive.originalProofModulesImported, false);
assert.equal(sha(z.gunzipSync(fs.readFileSync(base + 'primitive-input.json.gz'))), primitive.inputSha256);
assert.equal(model.primitiveInputSha256, primitive.inputSha256);
for (const [file, hash] of Object.entries(primitive.producerFiles)) assert.equal(sha(fs.readFileSync(file)), hash, file);
assert.equal(model.sharedArgument.storedNodes, 1025); assert.equal(model.sharedArgument.pairs, 1026);
assert.equal(model.sharedArgument.peakMemo, 1); assert.equal(model.sharedArgument.peakFrontier, 1);
assert.equal(BigInt(model.sharedArgument.expandedOccurrences), 2n ** 1025n - 1n);
for (const [key, value] of Object.entries(expected)) assert.equal(model[key], value, key);
assert.equal(browser.frames, 66); assert.equal(browser.accessibilityAudits, 4);
assert.equal(browser.sourceSelectionPreserved, 66); assert.equal(browser.wholeArchiveAttempts, 0);
assert(browser.signatureClicks > 0 && browser.fieldClicks > 0 && browser.binderClicks > 0 &&
  browser.counterpartClicks > 0 && browser.argumentPages > 0 && browser.indexPages > 0);
assert.equal(browser.instantiationChecks, 66); assert.equal(browser.genericDomainJumps, 66); assert.equal(browser.instantiationFailureControls, 1); assert.equal(browser.sourceArgumentJumps, 1);
assert.equal(browser.keyboardChecks, 1); assert.equal(browser.staleControls, 3);
assert.equal(browser.optionalFailureControls, 1);
assert.equal(compatibility['flow-model'].frames, 36);
assert.equal(compatibility['flow-browser'].pagedFrames, 26);
assert.equal(compatibility['flow-browser'].wholeForbiddenArchiveRequests, 0);
assert.equal(compatibility['mutual-browser'].frames, 11);
assert.equal(compatibility['mutual-browser'].inputSelections, 27);
assert.equal(compatibility['manual-browser'].links, 55);
assert.equal(compatibility['manual-browser'].accessibility, 9);
assert.equal(compatibility['clarity-browser'].tasks.length, 12);
assert.equal(compatibility['clarity-browser'].accessibility.length, 8);
for (const check of compatibility['clarity-browser'].accessibility) assert.equal(check.violations, 0);
const checkers = {'flow-model': 'scripts/test-proof-atlas-method-flow.cjs',
  'manual-model': 'scripts/test-proof-atlas-manual.cjs',
  'flow-browser': 'scripts/test-proof-atlas-method-flow-browser.cjs',
  'mutual-browser': 'scripts/test-proof-atlas-method-mutual-browser.cjs',
  'manual-browser': 'scripts/test-proof-atlas-manual-browser.cjs',
  'clarity-browser': 'scripts/test-proof-atlas-visual-clarity-browser.cjs'};
for (const [key, file] of Object.entries(checkers)) if (compatibility[key].checkerSha256)
  assert.equal(sha(fs.readFileSync(file)), compatibility[key].checkerSha256);

// Existing compiled records are inputs. Pin them to the prior branch state;
// this iteration neither regenerates them nor reruns their native producers.
const predecessor = '20335618fdcd5bb3dc6c0b5956b7adadf3b2ebdd', h = {};
const manifestNames = ['method-interfaces', 'method-interfaces-ai', 'method-streaming',
  'method-origins', 'method-indices', 'method-parameters', 'method-mutual'];
function unchanged(file) {
  const bytes = fs.readFileSync(file), old = cp.execFileSync('git', ['show', predecessor + ':' + file], {maxBuffer: 67108864});
  assert(bytes.equals(old), 'changed original evidence: ' + file); return sha(bytes);
}
const manifests = manifestNames.map(n => {
  const file = 'public/data/proof-atlas/' + n + '-manifest.js', hash = unchanged(file);
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), {window: h}); return {file, sha256: hash};
});
const descriptors = [...h.PROOF_ATLAS_METHOD_INTERFACES.records, ...h.PROOF_ATLAS_METHOD_REPLAY.records,
  h.PROOF_ATLAS_STREAM_FIXTURE.nativeDescriptor,
  ...['PROOF_ATLAS_METHOD_ORIGINS', 'PROOF_ATLAS_METHOD_INDICES', 'PROOF_ATLAS_METHOD_PARAMETERS', 'PROOF_ATLAS_METHOD_MUTUAL']
    .flatMap(k => h[k].records.map(x => x.nativeDescriptor))];
assert.equal(descriptors.length, model.profiles);
const inputs = descriptors.map(d => {
  const file = d.file.slice(1), source = d.record.indexFile.slice(1);
  const compressedSha256 = unchanged(file), sourceCompressedSha256 = unchanged(source);
  assert.equal(sha(z.gunzipSync(fs.readFileSync(file))), d.sha256);
  assert.equal(sha(z.gunzipSync(fs.readFileSync(source))), d.record.indexSha256);
  return {name: d.name, edition: d.edition, file, nativeSha256: d.sha256, compressedSha256,
    sourceFile: source, sourceIndexSha256: d.record.indexSha256, sourceCompressedSha256};
});
for (const row of model.rows) assert(inputs.some(d => d.name === row.name && d.nativeSha256 === row.nativeOwner));

const runtime = ['public/js/proof-atlas-branch-conclusion.js', 'public/js/proof-atlas-branch-instantiation.js', 'public/js/proof-atlas-method-flow.js',
  'public/js/proof-atlas-method-interfaces.js', 'public/js/proof-atlas-method-source-view.js',
  'public/js/proof-atlas-elimination.js', 'public/js/proof-atlas-stream-example.js',
  'public/js/proof-atlas-paged-library.js', 'public/js/proof-atlas-library.js',
  'public/js/proof-atlas-sync.js', 'public/css/proof-atlas-theme.css'];
for (const file of runtime) assert(fs.readFileSync(file).equals(fs.readFileSync('_site_production/' + file)), 'unbuilt runtime: ' + file);
assert.equal(sha(fs.readFileSync('_site_production/projects/proof-atlas/manual/index.html')), browser.manualHtmlSha256);
const files = [...new Set([...runtime, ...Object.keys(model.files), ...Object.keys(browser.files),
  ...Object.values(checkers), '_includes/proof-atlas-reading-tools.html', '_layouts/default.html',
  'projects/proof-atlas/library/index.html', base + 'README.md', base + 'evidence.cjs',
  base + 'branch-instantiation-desktop.png', base + 'branch-instantiation-phone-dark.png', base + 'verify-primitive.py'])].sort();
const result = {format: 'ProofAtlasBranchInstantiationEvidence/1', status: 'PASS', predecessor,
  model: expected, browser: {...browser, files: undefined}, manifests, inputs,
  reports: ['model-check', 'browser-check', 'primitive-check', 'primitive-input', ...names].map(n => {
    const file = base + n + '.json.gz'; return {file, sha256: sha(fs.readFileSync(file))};
  }),
  files: files.map(file => ({file, sha256: sha(fs.readFileSync(file))})),
  scope: 'Capture-avoiding substitution into recorded expected method domains, with distinct previously recorded actual/expected native conversions. '
    + 'Finite complete/paged comparisons and independent Lean-core substitution/serialization replay; original native inputs unchanged. '
    + 'No fresh kernel typing or domain conversion, actual computed body-context instantiation, additional recursor or AI-source coverage, semantic compression or comprehension measurement. '
    + 'Research branch only; not merged or deployed.'};
const raw = Buffer.from(JSON.stringify(result, null, 2) + '\n');
if (process.argv.includes('--check')) assert.deepEqual(z.gunzipSync(fs.readFileSync(base + 'evidence.json.gz')), raw);
else fs.writeFileSync(base + 'evidence.json.gz', z.gzipSync(raw));
console.log(JSON.stringify({status: 'PASS', profiles: model.profiles, frames: model.frames,
  browserFrames: browser.frames, unchangedNativeInputs: inputs.length, sha256: sha(raw)}));
