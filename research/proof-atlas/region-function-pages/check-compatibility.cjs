'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), z = require('zlib'), crypto = require('crypto'), assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/region-function-pages/';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const reports = {};
function redirected(script, folder, name) {
  const old = folder + '/model-check.json.gz', frozen = fs.readFileSync(old), output = base + name + '.json.gz';
  cp.execFileSync(process.execPath, ['-e', `
    const fs=require('fs'),path=require('path'),write=fs.writeFileSync;
    fs.writeFileSync=function(file,...args){return write.call(this,path.resolve(String(file))===path.resolve(${JSON.stringify(old)})?${JSON.stringify(output)}:file,...args);};
    require('./'+${JSON.stringify(script)});
  `], { maxBuffer: 2097152 });
  assert(fs.readFileSync(old).equals(frozen));
  const report = JSON.parse(z.gunzipSync(fs.readFileSync(output))); assert.equal(report.status, 'PASS');
  reports[name] = { file: output, sha256: hash(fs.readFileSync(output)) };
}
function retain(file, name) {
  const bytes = fs.readFileSync(file); assert.equal(JSON.parse(bytes).status, 'PASS');
  const output = base + name + '.json.gz'; fs.writeFileSync(output, z.gzipSync(bytes, { mtime: 0 }));
  reports[name] = { file: output, sha256: hash(fs.readFileSync(output)) };
}
redirected('research/proof-atlas/frontier-pages/check.cjs', 'research/proof-atlas/frontier-pages', 'frontier-model');
redirected('research/proof-atlas/region-composition-view/check-model.cjs', 'research/proof-atlas/region-composition-view', 'composition-model');
const temp = fs.mkdtempSync('/private/tmp/atlas-region-function-compat-');
cp.execFileSync(process.execPath, ['scripts/test-proof-atlas-network-streaming.cjs'], { env: { ...process.env, ATLAS_NETWORK_STREAM_AUDIT: temp + '/network.json' }, maxBuffer: 2097152 });
retain(temp + '/network.json', 'network-model');
if (!process.argv.includes('--models-only')) {
  // Change only the browser checker's report/screenshot destination. All
  // assertions and its original source fingerprint remain unchanged.
  const script = 'research/proof-atlas/frontier-pages/check-browser.cjs';
  const output = temp + '/frontier/'; fs.mkdirSync(output, { recursive: true });
  cp.execFileSync(process.execPath, ['-e', `
    const fs=require('fs'),path=require('path'),Module=require('module');
    const filename=path.resolve(${JSON.stringify(script)});
    const source=fs.readFileSync(filename,'utf8');
    const before="const base='research/proof-atlas/frontier-pages/',";
    if(source.split(before).length!==2)throw Error('Output-only redirect boundary changed');
    const scoped=new Module(filename,module);scoped.filename=filename;scoped.paths=Module._nodeModulePaths(path.dirname(filename));
    scoped._compile(source.replace(before,'const base='+${JSON.stringify(JSON.stringify(output))} + ','),filename);
  `], { env: process.env, maxBuffer: 2097152 });
  const bytes = z.gunzipSync(fs.readFileSync(output + 'browser-check.json.gz'));
  assert.equal(JSON.parse(bytes).status, 'PASS');
  fs.writeFileSync(base + 'frontier-browser.json.gz', z.gzipSync(bytes, { mtime: 0 }));
  reports['frontier-browser'] = { file: base + 'frontier-browser.json.gz', sha256: hash(fs.readFileSync(base + 'frontier-browser.json.gz')) };
  for (const name of fs.readdirSync(output).filter(name => name.endsWith('.png'))) fs.copyFileSync(output + name, base + name);
  cp.execFileSync(process.execPath, ['research/proof-atlas/region-composition-view/check-browser.cjs', temp + '/composition'], { env: process.env, maxBuffer: 2097152 });
  retain(temp + '/composition/browser-check.json', 'composition-browser');
  cp.execFileSync(process.execPath, ['scripts/test-proof-atlas-network-streaming-browser.cjs'], { env: { ...process.env, ATLAS_NETWORK_STREAM_SCREENSHOTS: temp + '/network' }, maxBuffer: 2097152 });
  retain(temp + '/network/audit.json', 'network-browser');
  const report = { format: 'ProofAtlasRegionFunctionCompatibility/1', status: 'PASS', reports,
    checkerSha256: hash(fs.readFileSync(__filename)),
    scope: 'Current source-frontier and output-regrouping neighborhood models/browser checks plus full native/source-only paged-network checks. Browser output directories alone are redirected; historical packages stay unchanged.' };
  fs.writeFileSync(base + 'compatibility.json.gz', z.gzipSync(Buffer.from(JSON.stringify(report, null, 2) + '\n'), { mtime: 0 }));
}
console.log(JSON.stringify({ status: 'PASS', reports, temp }));
