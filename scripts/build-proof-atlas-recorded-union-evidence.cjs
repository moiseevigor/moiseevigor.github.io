/* Publish only this iteration's named, compiled-data verification reports. */
'use strict';
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict'),folder='research/proof-atlas/recorded-union/',check=process.argv.includes('--check');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),index=JSON.parse(fs.readFileSync(folder+'verification-index.json'));
// Preserve the historical bundle. Its renderer is checked by a separately
// executed current browser report; native data and validators remain exact.
const runtime='public/js/proof-atlas-occurrence-view.js',current=JSON.parse(fs.readFileSync(folder+'current-browser-compatibility.json'));
assert.equal(current.status,'PASS');assert.equal(current.checkerSha256,sha(fs.readFileSync('scripts/test-proof-atlas-recorded-union-browser.cjs')));
assert.equal(current.sourceSites,3);assert.equal(current.transportPairs,3);assert.equal(current.pagedCompleteArchiveRequests,0);
for(const[file,hash]of Object.entries(current.files))assert.equal(sha(fs.readFileSync(file)),hash,'current implementation differs: '+file);
assert.equal(current.files[runtime],sha(fs.readFileSync(runtime)));
const tooling=['scripts/build-proof-atlas-recorded-union-evidence.cjs','scripts/test-proof-atlas-recorded-union-browser.cjs'];for(const file of tooling)assert.equal(current.tooling[file],sha(fs.readFileSync(file)),'current tooling differs: '+file);
const constructionChecker='scripts/test-proof-atlas-construction-pages-browser.cjs',construction=JSON.parse(fs.readFileSync(folder+'current-construction-browser.json'));
assert.equal(construction.status,'PASS');assert.equal(construction.checkerSha256,sha(fs.readFileSync(constructionChecker)));
for(const[key,value]of Object.entries({profiles:35,sceneComparisons:51,typeComparisons:47,failureControls:7,axeAudits:4,completeArchiveRequests:0}))assert.equal(construction[key],value,'current construction browser: '+key);
assert(construction.typeManifestHashRefusals>0,'current corruption control did not run');
for(const key of ['delayedNativeTypeOperation','typeCachePrewarmed','nativeResultSettledBeforeSourceSelection','gatesBounded','typeHashFaultAfterCaptions'])assert.equal(construction[key],true,'current asynchronous control: '+key);
for(const row of index.files){
 // Keep the original checker bytes under the original checkpoint digest.
 const file=row.file===constructionChecker?folder+'construction-pages-browser.checkpoint.cjs':row.file;
 if(row.file!==runtime&&!tooling.includes(row.file))assert.equal(sha(fs.readFileSync(file)),row.sha256,'stale evidence: '+row.file);
}
const reports={};for(const name of ['audit','browser-audit','complete-browser-audit','construction-transport','let-browser-audit','regressions','transport-browser-audit','type-browser-audit','type-query-transport']){const file=name+'.json',bytes=fs.readFileSync(folder+file),recorded=index.files.find(x=>x.file===folder+file);assert(recorded);assert.equal(sha(bytes),recorded.sha256);reports[file]=JSON.parse(bytes);assert.equal(reports[file].status,'PASS');}
const bytes=Buffer.from(JSON.stringify({format:'ProofAtlasRecordedUnionPublicEvidence/1',index,reports},null,2)+'\n'),file=folder+'recorded-union-evidence.json';
if(check)assert(fs.readFileSync(file).equals(bytes),'public evidence bundle differs');else fs.writeFileSync(file,bytes);
console.log(JSON.stringify({status:'PASS',mode:check?'check':'write',reports:Object.keys(reports).length,bytes:bytes.length,file,privateSourceProjectsIncluded:false}));
