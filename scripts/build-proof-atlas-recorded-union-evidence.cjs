/* Publish only this iteration's named, compiled-data verification reports. */
'use strict';
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict'),folder='research/proof-atlas/recorded-union/',check=process.argv.includes('--check');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),index=JSON.parse(fs.readFileSync(folder+'verification-index.json'));
for(const row of index.files)assert.equal(sha(fs.readFileSync(row.file)),row.sha256,'stale evidence: '+row.file);
const reports={};for(const name of ['audit','browser-audit','complete-browser-audit','construction-transport','let-browser-audit','regressions','transport-browser-audit','type-browser-audit','type-query-transport']){const file=name+'.json',bytes=fs.readFileSync(folder+file),recorded=index.files.find(x=>x.file===folder+file);assert(recorded);assert.equal(sha(bytes),recorded.sha256);reports[file]=JSON.parse(bytes);assert.equal(reports[file].status,'PASS');}
const bytes=Buffer.from(JSON.stringify({format:'ProofAtlasRecordedUnionPublicEvidence/1',index,reports},null,2)+'\n'),file=folder+'recorded-union-evidence.json';
if(check)assert(fs.readFileSync(file).equals(bytes),'public evidence bundle differs');else fs.writeFileSync(file,bytes);
console.log(JSON.stringify({status:'PASS',mode:check?'check':'write',reports:Object.keys(reports).length,bytes:bytes.length,file,privateSourceProjectsIncluded:false}));
