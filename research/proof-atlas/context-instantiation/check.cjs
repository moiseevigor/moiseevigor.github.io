'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/context-instantiation/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=n=>JSON.parse(z.gunzipSync(fs.readFileSync(base+n)));
if(process.argv.includes('--rebuild'))cp.execFileSync(process.execPath,[base+'prepare.cjs'],{stdio:'inherit'});
const inputs=read('inputs.json.gz'),native=read('native.json.gz'),report=read('verification.json.gz');
assert.equal(report.status,'PASS');assert.equal(native.status,'PASS');assert.equal(report.nativeSha256,sha(z.gunzipSync(fs.readFileSync(base+'native.json.gz'))));
for(const[file,hash]of Object.entries(report.producerFiles))assert.equal(sha(fs.readFileSync(file)),hash,file);
for(const[file,hash]of Object.entries(inputs.files))assert.equal(sha(fs.readFileSync(file)),hash,file);
assert.deepEqual(report.counts,inputs.counts);assert.equal(native.cases.length,1383);assert.equal(inputs.packages.length,29);assert.equal(inputs.shards.length,29);
assert.equal(inputs.counts.recordedUses,1376);assert.equal(inputs.counts.authoredControls,7);assert.equal(inputs.counts.distinctSourceDeclarations,16);
assert.equal(inputs.shards.reduce((n,s)=>n+s.rows,0),report.rowRoundtrips);assert.equal(inputs.shards.reduce((n,s)=>n+s.cases,0),1383);
assert.equal(report.batches.length,29);for(const [i,b]of report.batches.entries()){const s=inputs.shards[i];assert.equal(b.status,'PASS');assert.equal(b.inputSha256,s.sha256);assert(/^[a-f0-9]{64}$/.test(b.outputSha256));assert.equal(b.cases,s.cases);assert.equal(b.rowRoundtrips,s.rows);}
assert(inputs.shards.every(s=>s.rows<=262144&&s.bytes<=64*1024*1024));
const packages=new Map(),sourceNames=new Set();let specifications=0;const controlNames=[];
for(const [i,c]of native.cases.entries()){
 assert.equal(c.index,i);assert(inputs.shards.some(s=>s.sha256===c.shardSha256));
 for(const field of ['nativeSimultaneous','nativeSequential','modelResults','scope'])assert.equal(c[field],'PASS');
 assert(['PASS','not-evaluated-expanded-budget'].includes(c.specification));specifications+=c.specification==='PASS';
 assert(c.maximumQueryStates<=262144);assert(c.substitutionStates>=c.maximumQueryStates);
 if(i<1376){assert(/^[a-f0-9]{64}$/.test(c.owner.indexSha256));assert(/^[a-f0-9]{64}$/.test(c.owner.evidenceSha256));assert(Array.isArray(c.owner.use.slots)&&Array.isArray(c.owner.canonicalRoute.slots));const k=c.owner.kind+':'+c.owner.name;packages.set(k,(packages.get(k)||0)+1);sourceNames.add(c.owner.indexSha256);}
 else{assert.equal(c.owner.kind,'authored-syntax-control');assert.equal(c.owner.mathematicalTyping,false);controlNames.push(c.owner.name);}
}
assert.equal(packages.size,29);assert.equal(sourceNames.size,16);for(const p of inputs.packages)assert.equal(packages.get(p.kind+':'+p.name),p.count);
assert.equal(specifications,report.specificationCases);assert.equal(specifications,inputs.counts.specificationCases);
assert.deepEqual(controlNames,['empty-interface-retains-function','one-argument-interface','capture-avoidance-under-lambda','ordered-two-argument-interface','let-value-uses-prefix','shared-2pow90-body','all-twelve-constructors']);
assert.equal(native.cases.find(c=>c.owner.name==='shared-2pow90-body').specification,'not-evaluated-expanded-budget');
const axioms=Object.entries(report.axioms).filter(([n])=>n.startsWith('ProofAtlas.ContextInstantiation.'));assert.equal(axioms.length,33);assert(axioms.every(([,a])=>a.every(x=>['propext','Quot.sound'].includes(x))));
assert.equal(report.certificateRefusals.length,3);for(const r of report.certificateRefusals){assert.equal(r.leanAccepted,false);assert.equal(r.resources.stopReason,null);assert.notEqual(r.resources.exitCode,0);}
assert.equal(report.nativeControlRefusals,8);assert.equal(report.originalProofScriptsRead,false);assert.equal(report.dependencyCacheRestored,false);assert.equal(report.representedMathematicsRetyped,false);assert.equal(report.generalExecutorRefinementProved,false);
assert(report.resources.every(r=>r.exitCode===0&&r.stopReason===null&&r.maxScratchBytes<=report.resourcePolicy.maximumScratchBytes&&r.maxProcessGroupRssBytes<=report.resourcePolicy.maximumProcessGroupRssBytes));
const integration=read('integration.json.gz');assert.equal(integration.status,'PASS');assert.equal(integration.productionBuild.exitCode,0);assert.equal(integration.htmlProofer.exitCode,0);
assert.equal(integration.moduleBrowser.status,'PASS');assert.equal(integration.moduleBrowser.sourceJumps,9);assert.equal(integration.moduleBrowser.wrapperJumps,6);assert.equal(integration.moduleBrowser.keyboardPages,2);
assert.equal(integration.moduleBrowser.checkerSha256,sha(fs.readFileSync('scripts/test-proof-atlas-context-module-use-browser.cjs')));
for(const [file,hash]of Object.entries(integration.moduleBrowser.files))assert.equal(sha(fs.readFileSync(file)),hash,file);
assert.equal(integration.manualBrowser.status,'PASS');assert.equal(integration.manualBrowser.newEquationRendered,true);assert.equal(integration.manualBrowser.manualSourceSha256,sha(fs.readFileSync('research/proof-atlas/network-streaming/index.html')));
for(const browser of [integration.moduleBrowser,integration.manualBrowser]){assert.equal(browser.audits.length,4);assert.deepEqual(browser.audits.map(a=>[a.width,a.theme]),[[1500,'light'],[1500,'dark'],[390,'light'],[390,'dark']]);assert(browser.audits.every(a=>a.violations===0));}
console.log(JSON.stringify({status:'PASS',proofDeclarations:33,generalAndHelperLaws:27,boundaryEquations:6,recordedUses:1376,authoredControls:7,specificationCases:specifications,rowRoundtrips:report.rowRoundtrips,sourceDeclarations:sourceNames.size,scope:report.scope}));
