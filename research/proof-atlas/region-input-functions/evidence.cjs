'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const assert = require('assert/strict');
const { execFileSync } = require('child_process');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/region-input-functions/';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = name => JSON.parse(zlib.gunzipSync(fs.readFileSync(base + name + '.json.gz')));
const digest = file => hash(fs.readFileSync(file));
function unchanged(files) {
  for (const [file, expected] of Object.entries(files)) assert.equal(digest(file), expected, file);
}

execFileSync(process.execPath, ['--max-old-space-size=2048', base + 'check.cjs', '--check'], { stdio: 'pipe' });
execFileSync(process.execPath, [base + 'figure.cjs', '--check'], { stdio: 'pipe' });
const native = read('native');
const verification = read('verification');
const model = read('model');
const refusals = read('refusals');
const figure = read('figure');
const presentation = read('presentation');
const production = read('production-check');
const regression = read('network-regression');
for (const report of [verification, model, refusals, figure, presentation, production, regression]) assert.equal(report.status, 'PASS');
unchanged(verification.producerFiles);
unchanged(model.files);
assert.equal(verification.nativeSha256, hash(zlib.gunzipSync(fs.readFileSync(base + 'native.json.gz'))));
const cases = native.profiles.flatMap(profile => profile.native.cases);
assert.equal(cases.length, 18);
assert.equal(cases.filter(item => item.status === 'PASS').length, 16);
assert.equal(cases.filter(item => item.status === 'KERNEL_REJECTED').length, 2);
for (const item of cases) {
  if (item.status === 'PASS') for (const field of ['kernelClosedTyping', 'kernelEqualityWitness', 'kernelSpecialization']) assert.equal(item[field], 'PASS');
  else assert.equal(item.kernelInputTypeNonconversion, 'PASS');
}
assert.equal(refusals.nativeSourceSha256, digest(base + 'Native.lean'));
assert.equal(refusals.executableSha256, verification.build.executableSha256);
assert.equal(refusals.checkerSha256, digest(base + 'check-negative.py'));
assert.equal(refusals.checks.filter(item => item.verdict === 'ORDINARY_INPUT_REFUSAL').length, 8);
assert.equal(refusals.checks.filter(item => item.verdict === 'UNSUPPORTED_SCOPE_NOT_KERNEL_REJECTION').length, 1);
assert.equal(presentation.svgSha256, digest(base + 'riccati-module.svg'));
assert.equal(presentation.checkerSha256, digest(base + 'render.cjs'));
assert.deepEqual(presentation.clippedLabels, []);
for (const audit of presentation.audits) assert.equal(audit.sha256, digest(base + audit.file));
assert.equal(production.checkerSha256, digest(base + 'check-production.cjs'));
assert.equal(production.sourcePortals.length, 13);
assert.equal(production.audits.length, 4);
for (const audit of production.audits) assert.equal(audit.sha256, digest(base + audit.screenshot));
unchanged(production.files);
for (const [file, expected] of Object.entries(production.html)) assert.equal(digest('_site_production/' + file), expected);
assert.equal(regression.checkerSha256, digest('scripts/test-proof-atlas-network-streaming-browser.cjs'));
assert.equal(regression.nativeCalls, 162);
assert.equal(regression.nativeWires, 101);
assert.equal(regression.wholeArchiveAttempts, 0);
unchanged(regression.builtFiles);
assert.equal(regression.html.sourceSha256, digest(regression.html.source));
for (const [file, expected] of Object.entries({ ...production.files, ...regression.builtFiles })) assert.equal(digest('_site_production/' + file), expected);

const files = Object.fromEntries(fs.readdirSync(base).filter(name => name !== 'evidence.json.gz' && /\.(?:cjs|py|lean|md|svg|png|json\.gz)$/.test(name)).sort().map(name => [base + name, digest(base + name)]));
const report = { format: 'ProofAtlasRegionInputFunctionEvidence/1', status: 'PASS',
  candidates: 18, accepted: 16, kernelRejected: 2, nontrivialInputs: model.nontrivial,
  sourcePortals: 13, responsiveThemeAudits: 4, regressionCalls: 162, regressionWires: 101,
  files, scope: 'Integrity and reproduction of finite native artifacts, independent reconstruction, original-source portal navigation, production delivery and existing paged-network regression. Not fresh kernel replay, verified compiler refinement, arbitrary dependent-region typing, deployment or comprehension evidence.' };
if (process.argv.includes('--check')) assert.deepEqual(read('evidence'), report);
else {
  assert(process.argv.includes('--publish'), 'Use --check or --publish explicitly.');
  fs.writeFileSync(base + 'evidence.json.gz', zlib.gzipSync(Buffer.from(JSON.stringify(report, null, 2) + '\n'), { mtime: 0 }));
}
console.log(JSON.stringify({ ...report, files: Object.keys(files).length }));
