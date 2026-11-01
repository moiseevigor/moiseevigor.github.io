'use strict';
// Replay previous browser assertions without replacing their historical records.
const fs = require('fs'), path = require('path'), cp = require('child_process'), z = require('zlib'), crypto = require('crypto'), assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/declaration-window/', folder = fs.mkdtempSync('/private/tmp/atlas-declaration-compat-'), reports = {}, screenshots = {}, sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
for (const [name, script, prior] of [
 ['direct', 'research/proof-atlas/region-function-pages/check-browser.cjs', 'research/proof-atlas/region-function-pages/'],
 ['adapter', 'research/proof-atlas/region-input-adapters/check-browser.cjs', 'research/proof-atlas/region-input-adapters/'],
 ['notation', 'research/proof-atlas/paged-type-notation/check-browser.cjs', 'research/proof-atlas/paged-type-notation/'],
 ['source-specializing', 'research/proof-atlas/source-template-pages/check-browser.cjs', 'research/proof-atlas/source-template-pages/']
]) {
 const output = folder + '/' + name + '/'; fs.mkdirSync(output);
 const old = fs.readFileSync(prior + 'browser-check.json.gz');
 cp.execFileSync(process.execPath, ['-e', `const fs=require('fs'),path=require('path'),Module=require('module'),file=path.resolve(${JSON.stringify(script)});let source=fs.readFileSync(file,'utf8');
 const edits=[[/fs\\.writeFileSync\\(base\\s*\\+/g,'fs.writeFileSync('+${JSON.stringify(JSON.stringify(output))}+'+',2],
 [/screenshot\\(\\{\\s*path:\\s*base\\s*\\+/g,'screenshot({path:'+${JSON.stringify(JSON.stringify(output))}+'+',2],
 [/fs\\.readFileSync\\(base\\s*\\+\\s*file\\)/g,'fs.readFileSync('+${JSON.stringify(JSON.stringify(output))}+'+file)',1]];
 for(const[pattern,replacement,count]of edits){if([...source.matchAll(pattern)].length!==count)throw Error('Output-only boundary changed');source=source.replace(pattern,replacement);}
 const scoped=new Module(file,module);scoped.filename=file;scoped.paths=Module._nodeModulePaths(path.dirname(file));scoped._compile(source,file);`], { maxBuffer: 4194304 });
 assert(fs.readFileSync(prior + 'browser-check.json.gz').equals(old), 'Historical report changed');
 const bytes = fs.readFileSync(output + 'browser-check.json.gz'), report = JSON.parse(z.gunzipSync(bytes)); assert.equal(report.status, 'PASS'); assert.equal(report.checkerSha256, sha(fs.readFileSync(script)));
 fs.writeFileSync(base + name + '-browser.json.gz', bytes); reports[name] = { file: base + name + '-browser.json.gz', sha256: sha(bytes), checker: script, checkerSha256: report.checkerSha256 };
 screenshots[name] = Object.fromEntries(fs.readdirSync(output).filter(file => file.endsWith('.png')).map(file => [file, sha(fs.readFileSync(output + file))]));
 console.log('PASS ' + name);
}
const report = { format: 'ProofAtlasDeclarationWindowCompatibility/1', status: 'PASS', checkerSha256: sha(fs.readFileSync(__filename)), reports, screenshots, screenshotsPublished: false,
 scope: 'Existing direct, adapter, notation and source-specializing browser assertions. Only report/screenshot destinations and corresponding screenshot reads are redirected. Historical reports and screenshots remain unchanged; native observations are not rechecked.' };
fs.writeFileSync(base + 'compatibility.json.gz', z.gzipSync(Buffer.from(JSON.stringify(report, null, 2) + '\n'), { mtime: 0 })); console.log(JSON.stringify({ status: 'PASS', reports: Object.keys(reports) }));
