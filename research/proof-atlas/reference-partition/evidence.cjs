'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib'), crypto = require('crypto');
const assert = require('assert/strict'), cp = require('child_process');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/reference-partition/';
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
const load = name => JSON.parse(z.gunzipSync(fs.readFileSync(base + name)));
const model = load('model-check.json.gz'), browser = load('browser-check.json.gz'), compatibility = load('compatibility.json.gz');
for (const report of [model, browser, compatibility]) assert.equal(report.status, 'PASS');
for (const report of [model, browser]) for (const [file, hash] of Object.entries(report.files))
  assert.equal(sha(fs.readFileSync(file)), hash, 'changed source: ' + file);
for (const [field, value] of Object.entries({packets: 2118, packetsWithBinders: 2051,
  sourceStarts: 5934, sourceCuts: 23736, sourceAnnotations: 38731, mixedFrames: 269,
  definitionFrames: 60, frameAnnotations: 1622, independentChecks: 40353,
  frontierTerms: 108366, positiveExposed: 4597, positiveFolded: 29497, zeroTotals: 8646,
  refusals: 14, mutationControls: 1})) assert.equal(model[field], value, field);
assert(model.peakCells <= 65536 && model.peakDigits <= 524288 && model.peakPageBytes <= 65536);
for (const field of ['bodyNavigation', 'exactTransfer', 'completeMode', 'optionalFailurePreservesTotals',
  'delayedRelease', 'unknownCountHasNoSplit', 'rawUseCompatibility']) assert.equal(browser[field], true, field);
assert.equal(browser.accessibilityAudits, 4); assert.equal(browser.wholeArchiveAttempts, 0);
assert.equal(browser.riccati.coarse.total, browser.riccati.fine.total);
assert(BigInt(browser.riccati.fine.exposed) > BigInt(browser.riccati.coarse.exposed));
assert.equal(browser.largeSource.storedNodes, 121568);
assert(browser.largeSource.sourceCacheRows <= browser.largeSource.sourceCacheLimit);
assert(browser.largeSource.countPageBytes <= 65536);
assert.equal(compatibility.fullCorpus, true); assert.equal(compatibility.frames, 269);
assert.equal(compatibility.annotations, 1430); assert.equal(compatibility.accessibilityAudits, 4);
assert.equal(compatibility.legacyUnavailableResolved, 7); assert.equal(compatibility.recordedUseCompatibility, 2);
for (const file of Object.keys(browser.files).filter(f => f.startsWith('public/')))
  assert.equal(sha(fs.readFileSync('_site_production/' + file)), browser.files[file], 'unbuilt runtime: ' + file);
const html = fs.readFileSync('_site_production/projects/proof-atlas/library/index.html', 'utf8');
const normalized = html.replace(/(href="\/public\/css\/(?:site|distill|syntax|theme)\.css\?v=)\d+(")/g, '$1BUILD_TIME$2');
assert.equal(sha(normalized), browser.html.normalizedSha256);
assert.equal(sha(fs.readFileSync('projects/proof-atlas/library/index.html')), browser.html.sourceSha256);
const predecessor = {commit: 'b9e87559c36e0c9623627d8f9167d6706c1376aa',
  file: 'research/proof-atlas/source-reference-laws/evidence.json.gz'};
predecessor.sha256 = sha(cp.execFileSync('git', ['show', predecessor.commit + ':' + predecessor.file]));
assert.equal(sha(fs.readFileSync(predecessor.file)), predecessor.sha256, 'changed general-law record');
const files = [...new Set([...Object.keys(model.files), ...Object.keys(browser.files),
  base + 'README.md', base + 'evidence.cjs', 'research/proof-atlas/free-index-multiplicity/reader.md',
  base + 'riccati-source-light.png', base + 'riccati-source-phone-dark.png',
  'scripts/test-proof-atlas-syntax-counts-browser.cjs'])].sort();
const result = {format: 'ProofAtlasReferencePartitionEvidence/1', status: 'PASS', predecessor,
  model: {packets: 2118, sourceCuts: 23736, mixedFrames: 269, definitionFrames: 60,
    independentBinderChecks: 40353, frontierTerms: 108366},
  browser: {targetedAccessibilityAudits: 8, fullExistingFrameStarts: 269,
    largeSourceStoredNodes: 121568, wholeArchiveAttemptsInPagedMode: 0},
  reports: ['model-check.json.gz', 'browser-check.json.gz', 'compatibility.json.gz'].map(name =>
    ({file: base + name, sha256: sha(fs.readFileSync(base + name))})),
  files: files.map(file => ({file, sha256: sha(fs.readFileSync(file))})),
  scope: 'Reference mass projected onto source-validated exact cuts using authenticated totals. '
    + 'Finite independent frontier comparisons and production-browser checks; immutable prior general Lean laws. '
    + 'Not authentication of arbitrary JSON, new native typing, general elimination, premise necessity or measured comprehension. '
    + 'Research branch only, not merged or deployed.'};
const raw = Buffer.from(JSON.stringify(result, null, 2) + '\n');
if (process.argv.includes('--check')) assert.deepEqual(z.gunzipSync(fs.readFileSync(base + 'evidence.json.gz')), raw);
else fs.writeFileSync(base + 'evidence.json.gz', z.gzipSync(raw));
console.log(JSON.stringify({status: 'PASS', ...result.model, ...result.browser, sha256: sha(raw)}));
