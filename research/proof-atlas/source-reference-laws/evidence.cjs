/* Verify the exact scope of the reference-law and implementation evidence. */
'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib');
const crypto = require('crypto'), assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/source-reference-laws/';
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
const read = name => JSON.parse(z.gunzipSync(fs.readFileSync(base + name)));
const native = read('native.json.gz');
assert.equal(native.format, 'ProofAtlasSourceReferenceLaws/1');
assert.equal(native.leanVersion, '4.33.1');
const expected = ['reference_partition', 'visible_references_monotone',
  'hidden_references_antitone', 'exact_reference_transfer', 'reference_present_iff',
  'reference_absent_iff', 'references_bounded', 'let_reference_fields',
  'lambda_reference_fields', 'pi_reference_fields'];
assert.deepEqual(native.theorems.map(t => t.name), expected.map(n => 'ProofAtlas.SourceCut.' + n));
for (const t of native.theorems) {
  assert(t.axioms.every(a => ['propext', 'Quot.sound'].includes(a)));
  for (const k of ['kernelType', 'kernelProof', 'kernelExpectedTypeConversion']) assert.equal(t[k], 'PASS');
}
for (const [file, hash] of Object.entries(native.producer.sourceFiles))
  assert.equal(sha(fs.readFileSync(file)), hash, 'changed native source: ' + file);
const a = read('native-run-a.json.gz'), b = read('native-run-b.json.gz');
for (const r of [a, b]) {
  assert.equal(r.status, 'PASS'); assert.equal(r.recordSha256, sha(fs.readFileSync(base + 'native.json.gz')));
  assert.deepEqual(r.sourceFiles, native.producer.sourceFiles);
  assert.equal(r.compilerBinarySha256, native.producer.compilerBinarySha256);
  assert.equal(r.theorems, 10); assert.equal(r.fixtures, 52); assert.equal(r.coefficientRows, 2496);
  assert(r.coreLeanOnly && !r.originalPrivateProofModulesImported);
}
assert.equal(a.nativeOutputSha256, b.nativeOutputSha256);
assert.notEqual(a.runtimeSha256, b.runtimeSha256, 'isolated output paths remain separate');
const model = read('model-check.json.gz'); assert.equal(model.status, 'PASS');
for (const [file, hash] of Object.entries(model.files))
  assert.equal(sha(fs.readFileSync(file)), hash, 'changed model source: ' + file);
for (const [field, value] of Object.entries({nativeFixtures: 52, nativeCoefficientRows: 2496,
  nativeRootComparisons: 416, occurrenceCuts: 1424, cutCoefficientChecks: 17012,
  refinementTransfers: 12759, contextCoefficients: 15588, profiles: 51, selectedBodies: 303,
  frontierTerms: 104090, visibleTerms: 718, rejectedAlternatives: 7})) assert.equal(model[field], value, field);
assert.equal(model.largeSharing.count, String(1n << 180n));
assert.equal(model.largeSharing.proofTypingClaim, false);
assert(model.peakCells <= 65536 && model.peakDigits <= 524288);
const multiplicity = read('multiplicity-controls.json.gz'); assert.equal(multiplicity.status, 'PASS');
assert.equal(multiplicity.smallComparisons, 5554); assert.equal(multiplicity.partialRefusals, 2);
assert.equal(multiplicity.modelSha256, sha(fs.readFileSync('research/proof-atlas/free-index-multiplicity/model.cjs')));
assert.equal(multiplicity.testSha256, sha(fs.readFileSync('research/proof-atlas/free-index-multiplicity/check.cjs')));
const manual = read('manual-model.json.gz'), browser = read('manual-browser.json.gz');
assert.equal(manual.status, 'PASS'); assert.equal(manual.constructors, 12); assert.equal(manual.semanticFields, 27);
assert.equal(browser.status, 'PASS'); assert.equal(browser.examples, 4); assert.equal(browser.cutStates, 40);
assert.equal(browser.accessibility, 9); assert.equal(browser.compiledNavigation, 1);
const rendered = read('rendered-manual.json.gz');
assert.equal(rendered.status, 'PASS');
assert.equal(rendered.sourceSha256, sha(fs.readFileSync('projects/proof-atlas/manual/index.html')));
assert.equal(rendered.checkerSha256, sha(fs.readFileSync('scripts/test-proof-atlas-manual-browser.cjs')));
assert.equal(rendered.referenceCheckerSha256, sha(fs.readFileSync(base + 'check-browser.cjs')));
for (const [file, hash] of Object.entries(rendered.assets))
  assert.equal(sha(fs.readFileSync(file)), hash, 'changed served theorem asset: ' + file);
if (fs.existsSync('_site_production/projects/proof-atlas/manual/index.html')) {
  const html = fs.readFileSync('_site_production/projects/proof-atlas/manual/index.html', 'utf8');
  const normalized = html.replace(/(href="\/public\/css\/(?:site|distill|syntax|theme)\.css\?v=)\d+(")/g, '$1BUILD_TIME$2');
  assert.equal(sha(normalized), rendered.normalizedSha256, 'manual differs from browser-tested build');
}
const names = ['native.json.gz', 'native-run-a.json.gz', 'native-run-b.json.gz', 'model-check.json.gz',
  'multiplicity-controls.json.gz', 'manual-model.json.gz', 'manual-browser.json.gz', 'rendered-manual.json.gz'];
const files = [...new Set([...Object.keys(native.producer.sourceFiles), ...Object.keys(model.files),
  base + 'README.md', base + 'evidence.cjs', base + 'check-browser.cjs', 'projects/proof-atlas/manual/index.html',
  'research/proof-atlas/free-index-multiplicity/README.md',
  'research/proof-atlas/free-index-multiplicity/check.cjs',
  'scripts/test-proof-atlas-manual.cjs', 'scripts/test-proof-atlas-manual-browser.cjs'])].sort();
const result = {format: 'ProofAtlasSourceReferenceEvidence/1', status: 'PASS',
  generalTheorems: 10, nativeOutputSha256: a.nativeOutputSha256,
  finiteBridge: {nativeCoefficientRows: 2496, cutCoefficientChecks: 17012, occurrenceCuts: 1424,
    refinementTransfers: 12759, profiles: 51, selectedBodies: 303},
  manualAccessibilityAudits: browser.accessibility,
  reports: names.map(n => ({file: base + n, sha256: sha(fs.readFileSync(base + n))})),
  files: files.map(file => ({file, sha256: sha(fs.readFileSync(file))})),
  scope: 'General syntax-count/refinement laws in core Lean; separate finite implementation comparisons. '
    + 'No proof of JavaScript, typing preservation, premise necessity, semantic compression or human comprehension. '
    + 'Research branch only; not merged or deployed.'};
const raw = Buffer.from(JSON.stringify(result, null, 2) + '\n');
if (process.argv.includes('--check')) assert.deepEqual(z.gunzipSync(fs.readFileSync(base + 'evidence.json.gz')), raw);
else fs.writeFileSync(base + 'evidence.json.gz', z.gzipSync(raw));
console.log(JSON.stringify({status: 'PASS', generalTheorems: 10, ...result.finiteBridge,
  manualAccessibilityAudits: result.manualAccessibilityAudits, sha256: sha(raw)}));
