'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib'), crypto = require('crypto'), assert = require('assert/strict'), cp = require('child_process');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/source-template-inputs/';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex'), digest = file => sha(fs.readFileSync(file));
const read = name => JSON.parse(z.gunzipSync(fs.readFileSync(base + name + '.json.gz')));
for (const checker of ['check.cjs','figure.cjs']) cp.execFileSync(process.execPath, [base + checker, '--check'], {stdio:'pipe'});
const verification = read('verification'), model = read('model-check'), controls = read('control-verification');
const build = read('build-check');
for (const [file, hash] of Object.entries({...build.sourceFiles, ...build.builtFiles})) assert.equal(digest(file), hash);
const figure = read('figure'), browser = read('browser-check'), network = read('network-browser'), networkRun = read('network-run'), retirement = read('retirement');
for (const report of [verification,model,controls,build,figure,browser,network,networkRun,retirement]) assert.equal(report.status, 'PASS');
assert.equal(verification.candidates, 30); assert.equal(verification.passed, 30); assert.equal(verification.kernelRejected, 0); assert.equal(verification.unsupported, 0);
assert.equal(verification.build.runtimeSha256, controls.runtimeSha256); assert.equal(verification.build.leanExecutableSha256, controls.leanExecutableSha256);
assert.equal(model.unchangedFunctions, 29); assert.equal(model.newlyAccepted, 1); assert.equal(model.derivedInputs, 23);
assert.equal(model.templates, 3); assert.equal(model.permutations, 1); assert.equal(model.mutations.length, 91); assert.equal(model.controls.length, 13);
assert.equal(figure.templates.length, 3); assert.equal(figure.links.length, 10); assert.equal(figure.edges.length, 3);
assert(figure.edges.every(row => row.relation === 'derived-source-value-pattern/1'));
assert.equal(figure.svgSha256, digest(base + 'source-lambdas.svg')); assert.equal(figure.producerSha256, digest(base + 'figure.cjs'));
assert.equal(browser.checkerSha256, digest(base + 'check-browser.cjs')); assert.equal(browser.sourceLinks, 10);
for (const audit of browser.audits) { if (audit.violations !== undefined) assert.equal(audit.violations, 0); assert.equal(digest(base + audit.file), audit.sha256); }
for (const [file, hash] of Object.entries(browser.files)) { assert.equal(digest(file), hash); assert.equal(digest('_site_production/' + file), hash); }
assert.equal(browser.htmlSha256, digest('_site_production/projects/proof-atlas/manual/paged-network/index.html'));
assert.equal(network.checkerSha256, digest('scripts/test-proof-atlas-network-streaming-browser.cjs'));
assert.equal(network.nativeCalls, 162); assert.equal(network.nativeWires, 101); assert.equal(network.wholeArchiveAttempts, 0); assert.equal(network.axeAudits, 4);
assert.equal(network.html.sourceSha256, digest('research/proof-atlas/network-streaming/index.html'));
const built = network.files || network.builtFiles || {};
assert(!Array.isArray(built));
for (const [file, hash] of Object.entries(built)) { assert.equal(digest(file), hash); assert.equal(digest('_site_production/' + file), hash); }
const normalizedHtml = fs.readFileSync('_site_production/projects/proof-atlas/manual/paged-network/index.html','utf8').replace(/(href="\/public\/css\/(?:site|distill|syntax|theme)\.css\?v=)\d+(")/g,'$1BUILD_TIME$2');
assert.equal(network.html.normalizedSha256, sha(Buffer.from(normalizedHtml)), 'network regression HTML differs beyond stylesheet build timestamps');
assert.equal(networkRun.checkerSha256, digest(base + 'check-network.cjs')); assert.equal(networkRun.reportSha256, digest(base + 'network-browser.json.gz'));
assert.equal(networkRun.originalCheckerSha256, network.checkerSha256);
assert.equal(retirement.recoverySha256, verification.kernelRecoverySha256);
assert.equal(retirement.nativeVerificationSha256, sha(z.gunzipSync(fs.readFileSync(base + 'verification.json.gz'))));
assert.equal(retirement.retiredFiles, 26070);
const files = Object.fromEntries(fs.readdirSync(base).filter(file => file !== 'evidence.json.gz' && !file.startsWith('failure') && /\.(?:lean|py|cjs|md|svg|png|json\.gz)$/.test(file)).sort().map(file => [base + file, digest(base + file)]));
const sourceInputs = Object.fromEntries(['docs/proof-atlas-research-program.md','research/proof-atlas/network-streaming/index.html'].map(file => [file,digest(file)]));
const report = {format:'ProofAtlasSourceTemplateEvidence/1', status:'PASS', files, sourceInputs,
  candidates:30, accepted:30, unchangedFunctions:29, newlyAccepted:1, derivedPositions:23, sourceLambdas:3, declarationPermutations:1,
  scope:'Finite dependent region interfaces with whole-source-lambda specialization and explicit declaration order. Independent complete-term, assignment-context and rewrite checks; thirteen authored controls and ninety-one damaged-record refusals. Ten keyboard source links and current production network regression. Source use, derived pattern relation and computed declaration order remain distinct. Interactive paging of the new policy, general preservation, out-of-sample coverage, comprehension and deployment remain open.'};
if (process.argv.includes('--check')) assert.deepEqual(read('evidence'), report);
else { assert(process.argv.includes('--publish'), 'Use --check or --publish'); fs.writeFileSync(base+'evidence.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0})); }
console.log(JSON.stringify({status:'PASS',files:Object.keys(files).length,candidates:30,accepted:30,newlyAccepted:1}));
