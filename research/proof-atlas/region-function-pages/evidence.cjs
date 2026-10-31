'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib'), crypto = require('crypto'), cp = require('child_process'), assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/region-function-pages/';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const digest = file => hash(fs.readFileSync(file));
const read = name => JSON.parse(z.gunzipSync(fs.readFileSync(base + name + '.json.gz')));
const unchanged = files => { for (const [file, expected] of Object.entries(files)) assert.equal(digest(file), expected, file); };
cp.execFileSync(process.execPath, [base + 'pack.cjs', '--check'], { stdio: 'pipe' });
const model = read('model-check'), browser = read('browser-check'), compatibility = read('compatibility');
const collect = process.argv.indexOf('--collect');
if (collect >= 0) {
  assert(process.argv.includes('--publish') && process.argv[collect + 1], 'Collection requires --publish and the reported compatibility directory.');
  for (const audit of read('composition-browser').audits) {
    assert(/^grouped-(?:1500|390)-(?:light|dark)\.png$/.test(audit.file));
    const file = path.join(process.argv[collect + 1], 'composition', audit.file);
    assert.equal(digest(file), audit.sha256); fs.copyFileSync(file, base + audit.file);
  }
}
for (const report of [model, browser, compatibility]) assert.equal(report.status, 'PASS');
unchanged(model.files); unchanged(browser.files);
assert.equal(browser.checkerSha256, digest(base + 'check-browser.cjs'));
assert.equal(compatibility.checkerSha256, digest(base + 'check-compatibility.cjs'));
assert.equal(model.components, 160); assert.equal(browser.componentRoots, 160);
assert.equal(model.accepted, 16); assert.equal(browser.accepted, 16);
assert.equal(model.rejected, 2); assert.equal(browser.rejected, 2);
assert.equal(browser.wholeArchiveAttempts, 0);
assert.equal(browser.htmlSha256, digest('_site_production/projects/proof-atlas/manual/paged-network/index.html'));
for (const audit of browser.audits) assert.equal(digest(base + audit.file), audit.sha256);
for (const item of Object.values(compatibility.reports)) {
  assert.equal(digest(item.file), item.sha256); assert.equal(JSON.parse(z.gunzipSync(fs.readFileSync(item.file))).status, 'PASS');
}
for (const name of ['frontier-browser', 'composition-browser', 'network-browser']) {
  const report = read(name);
  unchanged(report.files || report.builtFiles);
  if (report.audits) for (const audit of report.audits) if (audit.file && audit.sha256) assert.equal(digest(base + audit.file), audit.sha256);
}
const assets = {}, folder = 'public/data/proof-atlas/region-function-pages/';
for (const name of fs.readdirSync(folder).sort()) {
  assert(/^[a-f0-9]{64}\.(?:page|index|manifest)\.gz$/.test(name));
  const file = folder + name, bytes = fs.readFileSync(file), raw = z.gunzipSync(bytes);
  assert.equal(hash(raw), name.slice(0, 64), file);
  assert(bytes.equals(fs.readFileSync('_site_production/' + file)), 'Not in actual production build: ' + file);
  assets[file] = hash(bytes);
}
for (const [file, expected] of Object.entries(browser.files)) assert.equal(digest('_site_production/' + file), expected, file);
const files = Object.fromEntries(fs.readdirSync(base).filter(name => name !== 'evidence.json.gz' && /\.(?:cjs|md|png|json\.gz)$/.test(name)).sort().map(name => [base + name, digest(base + name)]));
const report = { format: 'ProofAtlasRegionFunctionPageEvidence/1', status: 'PASS',
  files, assets, components: 160, accepted: 16, rejected: 2,
  sourceHtml: { 'research/proof-atlas/network-streaming/index.html': digest('research/proof-atlas/network-streaming/index.html'), 'docs/proof-atlas-research-program.md': digest('docs/proof-atlas-research-program.md') },
  scope: 'Finite native-parent delivery and scoped geometry, independent row/cut model, actual production interactions, compatibility and content-addressed asset integrity. No fresh kernel replay, arbitrary dependent-region rule, human comprehension evidence or deployment.' };
if (process.argv.includes('--check')) assert.deepEqual(read('evidence'), report);
else { assert(process.argv.includes('--publish'), 'Use --check or --publish explicitly.'); fs.writeFileSync(base + 'evidence.json.gz', z.gzipSync(Buffer.from(JSON.stringify(report, null, 2) + '\n'), { mtime: 0 })); }
console.log(JSON.stringify({ status: 'PASS', components: 160, accepted: 16, rejected: 2, assets: Object.keys(assets).length, files: Object.keys(files).length }));
