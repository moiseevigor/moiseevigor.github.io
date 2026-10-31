'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/frontier-pages/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),reports={};
function model(script,old,name){const frozen=fs.readFileSync(old),out=base+name+'.json.gz';cp.execFileSync(process.execPath,['-e',`
 const fs=require('fs'),path=require('path'),write=fs.writeFileSync;
 fs.writeFileSync=function(file,...args){return write.call(this,path.resolve(String(file))===path.resolve(${JSON.stringify(old)})?${JSON.stringify(out)}:file,...args);};
 require('./'+${JSON.stringify(script)});
`],{maxBuffer:2097152});assert(fs.readFileSync(old).equals(frozen));const r=JSON.parse(z.gunzipSync(fs.readFileSync(out)));assert.equal(r.status,'PASS');reports[name]={file:out,sha256:sha(fs.readFileSync(out))};}
model('research/proof-atlas/region-output-view/check-model.cjs','research/proof-atlas/region-output-view/model-check.json.gz','output-model');
model('research/proof-atlas/region-composition-view/check-model.cjs','research/proof-atlas/region-composition-view/model-check.json.gz','composition-model');
const temp=fs.mkdtempSync('/private/tmp/atlas-frontier-compat-'),network=temp+'/network.json';cp.execFileSync(process.execPath,['scripts/test-proof-atlas-network-streaming.cjs'],{env:{...process.env,ATLAS_NETWORK_STREAM_AUDIT:network},maxBuffer:2097152});
function retain(file,name){const bytes=fs.readFileSync(file);assert.equal(JSON.parse(bytes).status,'PASS');const out=base+name+'.json.gz';fs.writeFileSync(out,z.gzipSync(bytes));reports[name]={file:out,sha256:sha(fs.readFileSync(out))};}
retain(network,'network-model');
if(!process.argv.includes('--models-only')){
 cp.execFileSync(process.execPath,['research/proof-atlas/region-composition-view/check-browser.cjs',temp+'/composition'],{env:process.env,maxBuffer:2097152});retain(temp+'/composition/browser-check.json','composition-browser');
 cp.execFileSync(process.execPath,['scripts/test-proof-atlas-network-streaming-browser.cjs'],{env:{...process.env,ATLAS_NETWORK_STREAM_SCREENSHOTS:temp+'/network'},maxBuffer:2097152});retain(temp+'/network/audit.json','network-browser');
 const report={format:'ProofAtlasFrontierPageCompatibility/1',status:'PASS',reports,checkerSha256:sha(fs.readFileSync(__filename)),scope:'Preceding shared-neighborhood output models, paged source-use model, output-regrouping production browser and full native/source-only network browser. Preceding frozen reports are unchanged.'};fs.writeFileSync(base+'compatibility.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n')));
}
console.log(JSON.stringify({status:'PASS',reports}));
