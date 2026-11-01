'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib'), crypto = require('crypto'), assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/application-collar/', files = {}, sha = b => crypto.createHash('sha256').update(b).digest('hex');
function pin(file, expected) { const hash = sha(fs.readFileSync(file)); if (expected) assert.equal(hash, expected, file); files[file] = hash; return hash; }
function report(file) { const r = JSON.parse(z.gunzipSync(fs.readFileSync(file))); assert.equal(r.status, 'PASS', file); pin(file); for (const [f, h] of Object.entries(r.files || {})) pin(f, h); return r; }
const model = report(base + 'model-check.json.gz'), browser = report(base + 'browser-check.json.gz'), lifecycle = report(base + 'lifecycle.json.gz'), window = report('research/proof-atlas/declaration-window/evidence.json.gz');
for (const [key, value] of Object.entries({ candidates: 30, values: 116, applications: 104, atomicValues: 12, ports: 389, wrappers: 273, pages: 130, sourcePorts: 339, computedReferences: 228, originalReferences: 45, repeatedRowsAtDistinctPorts: 7, previewScenes: 51, refusals: 476 })) assert.equal(model[key], value, key);
for (const [key, value] of Object.entries({ candidates: 30, values: 116, applications: 104, atomicValues: 12, ports: 389, pages: 130, sourceAddresses: 339, binderLinks: 273 })) assert.equal(browser[key], value, key);
assert.equal(browser.checkerSha256, pin(base + 'browser.cjs')); assert.equal(lifecycle.checkerSha256, pin(base + 'lifecycle.cjs'));
for (const key of ['keyboardPaging', 'retiredPagesRefused', 'retiredValuesRefused', 'originalJump', 'riccatiArgumentPreviews', 'cancelAndRetry', 'missingModuleRetainsTypes']) assert.equal(browser[key], true, key);
for (const key of ['singleActiveValue', 'supersededLiveRead', 'retiredValueRefused', 'rejectedPolicyClearsValue', 'selectionPreserved']) assert.equal(lifecycle[key], true, key);
assert.deepEqual(browser.audits.map(a => [a.width, a.theme, a.violations]), [[1500, 'light', 0], [1500, 'dark', 0], [390, 'light', 0], [390, 'dark', 0]]);
assert(model.peakMetadataBytes <= 1048576 && model.peakRows <= 64 && model.peakIndices <= 2 && model.peakPreviewRows <= 8192);
assert.equal(browser.manualSourceSha256, pin('research/proof-atlas/network-streaming/index.html'));
assert.equal(browser.productionHtmlSha256, sha(fs.readFileSync('_site_production/projects/proof-atlas/manual/paged-network/index.html'))); assert.equal(window.productionHtmlSha256, browser.productionHtmlSha256);
for (const file of Object.keys(browser.files)) assert(fs.readFileSync(file).equals(fs.readFileSync('_site_production/' + file)), 'Production app drift: ' + file);
for (const f of [base + 'README.md', base + 'verify.cjs', '.github/workflows/proof-atlas-browser.yml']) pin(f);
const evidence = { format: 'ProofAtlasApplicationCollarEvidence/1', status: 'PASS', files, productionHtmlSha256: browser.productionHtmlSha256,
 observations: { recordedValues: 116, literalApplications: 104, atomicValues: 12, endpointPorts: 389, sourcePortCorrespondences: 339, directLexicalUses: 273, previewScenes: 51, argumentPages: 130, peakModelBytes: model.peakMetadataBytes, themesAndWidths: 4 },
 productionBuild: window.productionBuild, htmlProofer: window.htmlProofer,
 scope: 'Executed finite application/cut/reference checks, recoverable preview comparisons, production interactions, held-request lifecycle and prior-reader compatibility. Reuses frozen native judgments. No general compiler/typing refinement, logical necessity, semantic compression or measured comprehension claim. Logs and screenshots are local.' };
const file = base + 'evidence.json.gz'; if (process.argv.includes('--write')) fs.writeFileSync(file, z.gzipSync(Buffer.from(JSON.stringify(evidence, null, 2) + '\n'), { mtime: 0 })); else assert.deepEqual(JSON.parse(z.gunzipSync(fs.readFileSync(file))), evidence); console.log(JSON.stringify({ status: 'PASS', files: Object.keys(files).length, observations: evidence.observations }));
