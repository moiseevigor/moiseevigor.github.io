'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib'), crypto = require('crypto'), assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/declaration-window/', sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex'), files = {};
function pin(file, expected) { const digest = sha(fs.readFileSync(file)); if (expected) assert.equal(digest, expected, file); files[file] = digest; return digest; }
function report(file) { const r = JSON.parse(z.gunzipSync(fs.readFileSync(file))); assert.equal(r.status, 'PASS', file); pin(file); for (const [f, h] of Object.entries(r.files || {})) pin(f, h); return r; }
const model = report(base + 'model-check.json.gz'), browser = report(base + 'browser-check.json.gz'), compatibility = report(base + 'compatibility.json.gz');
assert.equal(model.candidates, 30); assert.equal(model.windows, 66); assert.equal(model.declarations, 222); assert.deepEqual(model.references, { 'type-local': 167, 'earlier-declaration': 87, 'original-context': 387 }); assert.equal(model.refusals, 183);
assert(model.peakObjects <= 192 && model.peakSceneBytes <= 16777216 && model.peakNotationRows <= 8192 && model.peakNotationBytes <= 4194304); assert.equal(model.archiveRequests, 0);
assert.equal(browser.profiles, 10); assert.equal(browser.windows, 34); assert.equal(browser.typeLinks, 118); assert.equal(browser.computationLinks, 54); assert.equal(browser.referenceLinks, 40); assert.equal(browser.originalContextTargets, 28); assert.equal(browser.typeLocalTargets, 15);
for (const key of ['keyboardPaging', 'singleNotationCacheHandoff', 'retiredHandlersRefused', 'cancelledWindowCleared', 'cancelledWindowRetry', 'exactNotationSymbol', 'exactOriginalSourceJump', 'suppliedAdapterType']) assert.equal(browser[key], true, key);
assert.equal(browser.checkerSha256, pin(base + 'browser.cjs')); assert.equal(compatibility.checkerSha256, pin(base + 'compatibility.cjs'));
assert.deepEqual(browser.audits.map(a => [a.width, a.theme, a.violations]), [[1500, 'light', 0], [1500, 'dark', 0], [390, 'light', 0], [390, 'dark', 0]]);
assert.deepEqual(Object.keys(compatibility.reports), ['direct', 'adapter', 'notation', 'source-specializing']);
for (const entry of Object.values(compatibility.reports)) { pin(entry.checker, entry.checkerSha256); pin(entry.file, entry.sha256); const r = report(entry.file); assert.equal(r.checkerSha256, entry.checkerSha256); }
const source = report(compatibility.reports['source-specializing'].file); assert.equal(source.sourcePorts, 113); assert.equal(source.sourceResults, 31); assert.equal(source.sourceRecoveryFields, 92); assert.equal(source.orderChanges, 1);
for (const f of Object.keys(browser.files)) assert(fs.readFileSync(f).equals(fs.readFileSync('_site_production/' + f)), 'Production asset mismatch: ' + f);
const html = '_site_production/projects/proof-atlas/manual/paged-network/index.html'; assert.equal(sha(fs.readFileSync(html)), browser.productionHtmlSha256); assert.equal(browser.manualSourceSha256, pin('research/proof-atlas/network-streaming/index.html'));
const integration = report('research/proof-atlas/certified-substitution/integration.json.gz'); assert.equal(integration.productionBuild.exitCode, 0); assert.equal(integration.htmlProofer.exitCode, 0); assert.equal(integration.manualBrowser.manualHtmlSha256, browser.productionHtmlSha256);
for (const f of [base + 'README.md', base + 'verify.cjs', '.github/workflows/proof-atlas-browser.yml']) pin(f);
const result = { format: 'ProofAtlasDeclarationWindowEvidence/1', status: 'PASS', files, productionHtmlSha256: browser.productionHtmlSha256,
 observations: { recordedCandidates: 30, modelWindows: 66, declarations: 222, visibleReferences: 641, browserAllPositionWindows: 34, priorSourcePorts: 113, priorSourceResults: 31, peakWindowObjects: model.peakObjects, peakWindowSceneBytes: model.peakSceneBytes, browserThemeLayouts: browser.audits.length },
 productionBuild: integration.productionBuild, htmlProofer: integration.htmlProofer,
 scope: 'Executed declaration-window model, production browser and prior-reader compatibility checks. Native data and judgments are reused without modification; declared annotations and lexical references remain distinct from new descendant typing, logical necessity and human comprehension. Raw logs and screenshots are local.' };
const file = base + 'evidence.json.gz'; if (process.argv.includes('--write')) fs.writeFileSync(file, z.gzipSync(Buffer.from(JSON.stringify(result, null, 2) + '\n'), { mtime: 0 })); else assert.deepEqual(JSON.parse(z.gunzipSync(fs.readFileSync(file))), result);
console.log(JSON.stringify({ status: 'PASS', files: Object.keys(files).length, observations: result.observations }));
