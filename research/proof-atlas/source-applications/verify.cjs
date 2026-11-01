'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib'), crypto = require('crypto'), assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/source-applications/', files = {}, sha = b => crypto.createHash('sha256').update(b).digest('hex');
function pin(file, expected) { const hash = sha(fs.readFileSync(file)); if (expected) assert.equal(hash, expected, file); files[file] = hash; return hash; }
function read(file) { const r = JSON.parse(z.gunzipSync(fs.readFileSync(file))); assert.equal(r.status, 'PASS', file); pin(file); for (const [f, hash] of Object.entries(r.files || {})) pin(f, hash); return r; }
const model = read(base + 'model-check.json.gz'), browser = read(base + 'browser-check.json.gz'), prior = read('research/proof-atlas/application-collar/evidence.json.gz');
for (const [key, expected] of Object.entries({ packets: 2127, storedNodes: 2096774, storedApplications: 1883973, originalStoredApplications: 1883739, ruleOnlyStoredNodes: 486, ruleOnlyStoredApplications: 234, unsupportedRuleRoots: 16, spinesOver64: 0, maxStoredArity: 59, maxOriginalPathDepth: 267, originalRootsBeyondPathBound: 0, alternateScopePaths: 6421, deepestOriginalPaths: 4206, models: 31349, ports: 59055, lexicalReferences: 13606, pages: 35449, pagedPackets: 35, pagedModels: 566, aiPagedPackets: 20, previewScenes: 35 })) assert.equal(model[key], expected, key);
assert.equal(new Set(model.inventory.map(x => x.edition + ':' + x.name)).size, model.packets);
assert.equal(model.peakSourceCachedNodes, 256); assert(model.peakMetadataBytes <= 1048576 && model.peakModelReads <= 8192 && model.peakNotationRows <= 8192);
for (const [key, expected] of Object.entries({ pagedPackets: 35, aiPagedPackets: 20, models: 35, ports: 322, pages: 73, exactSourceJumps: 35, exactBinderJumps: 1, nativePreference: 1, completeArchiveRequests: 0, staleControls: 36, failures: 2 })) assert.equal(browser[key], expected, key);
assert.equal(browser.audits.length, 4); assert.deepEqual(browser.audits.map(a => [a.width, a.theme, a.violations]), [[1500, 'light', 0], [1500, 'dark', 0], [390, 'light', 0], [390, 'dark', 0]]);
assert.equal(browser.checkerSha256, pin(base + 'browser.cjs'));
assert.equal(browser.productionHtmlSha256, sha(fs.readFileSync('_site_production/projects/proof-atlas/library/index.html')));
assert.equal(prior.status, 'PASS');
const compatibility=read(base+'compatibility.json.gz'),typed=compatibility.typedApplication;
assert.equal(typed.status,'PASS');assert.equal(typed.manualProfiles,31);assert.equal(typed.manualWindows,207);assert.equal(typed.libraryCalls,115);for(const[file,hash]of Object.entries(typed.builtFiles))pin(file,hash);
assert.equal(compatibility.completeLibrary.status,'PASS');assert.equal(compatibility.completeLibrary.allServedPackets.reduce((n,e)=>n+e.declarations,0),2237);
assert.equal(compatibility.scopedGeometry.status,'PASS');assert.equal(compatibility.scopedGeometry.accessibilityAudits,4);

for (const f of [base + 'README.md', base + 'verify.cjs', '.github/workflows/proof-atlas-browser.yml', 'docs/proof-atlas-research-program.md', 'research/proof-atlas/context-modules/module-use-check.json.gz']) pin(f);
const integration = read('research/proof-atlas/certified-substitution/integration.json.gz');
assert.equal(integration.productionBuild.exitCode, 0); assert.equal(integration.htmlProofer.exitCode, 0);
const result = { format: 'ProofAtlasSourceApplicationEvidence/1', status: 'PASS', files,
 observations: { inputPackets: model.packets, storedApplications: model.storedApplications, originalStoredApplications: model.originalStoredApplications, selectedModels: model.models, selectedLexicalLinks: model.lexicalReferences, pagedModelComparisons: model.pagedModels, pagedSourcePackets: model.pagedPackets, attributedAiSourcePackets: model.aiPagedPackets, browserArgumentPages: browser.pages, nativeApplicationPreference: browser.nativePreference, themeLayouts: browser.audits.length, priorNativeCallSelections: typed.libraryCalls, completeLibraryPackets: 2237 },
 productionBuild: integration.productionBuild, htmlProofer: integration.htmlProofer, productionHtmlSha256: browser.productionHtmlSha256,
 scope: 'Original-source instantiation of the existing application-spine rule, complete/paged selected-path comparisons, source-qualified lexical uses, actual production browser selections and separately executed prior-reader checks. Static stored-node arity census does not enumerate every expanded path. No new native judgments, inferred argument roles, generic reduction-rule scope, semantic compression or comprehension claim.' };
const file = base + 'evidence.json.gz'; if (process.argv.includes('--write')) fs.writeFileSync(file, z.gzipSync(Buffer.from(JSON.stringify(result, null, 2) + '\n'), { mtime: 0 })); else assert.deepEqual(JSON.parse(z.gunzipSync(fs.readFileSync(file))), result);
console.log(JSON.stringify({ status: 'PASS', files: Object.keys(files).length, observations: result.observations }));
