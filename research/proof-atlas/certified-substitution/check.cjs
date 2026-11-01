'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/certified-substitution/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(base+f)));
const inputs=read('inputs.json.gz'),native=read('native.json.gz'),report=read('verification.json.gz');
assert.equal(report.status,'PASS');assert.equal(native.status,'PASS');assert.equal(report.nativeSha256,sha(z.gunzipSync(fs.readFileSync(base+'native.json.gz'))));
for(const[file,hash]of Object.entries(report.producerFiles))assert.equal(sha(fs.readFileSync(file)),hash,file);
assert.equal(inputs.parentInputManifestSha256,sha(fs.readFileSync('research/proof-atlas/context-instantiation/inputs.json.gz')));
assert.equal(inputs.templateFileSha256,sha(fs.readFileSync('research/proof-atlas/source-template-laws/instances.json.gz')));
assert.deepEqual(report.counts,inputs.counts);assert.equal(inputs.counts.moduleUses,1376);assert.equal(inputs.counts.templateOpenings,16);assert.equal(inputs.counts.riccatiOpenings,6);assert.equal(inputs.counts.newControls,2);assert.equal(inputs.counts.previouslyBudgetedCases,29);assert.equal(inputs.counts.queries,2835);
assert.equal(native.queries.length,2835);assert.equal(inputs.shards.length,38);assert.equal(report.batches.length,38);
assert.equal(inputs.shards.reduce((n,s)=>n+s.rows,0),3331136);assert.equal(report.rowRoundtrips,3331136);
assert.equal(inputs.shards.reduce((n,s)=>n+s.queries,0),2835);assert(inputs.shards.every(s=>s.rows<=262144&&s.bytes<=64*1024*1024));
for(const [i,b]of report.batches.entries()){const s=inputs.shards[i];assert.equal(b.status,'PASS');assert.equal(b.inputSha256,s.sha256);assert.equal(b.queries,s.queries);assert.equal(b.rowRoundtrips,s.rows);assert(/^[a-f0-9]{64}$/.test(b.outputs.certified)&&/^[a-f0-9]{64}$/.test(b.outputs.primitive));}
const previousCases=new Set(),moduleCases=new Set(),openings=[],controls=[];let letQueries=0;
for(const [i,q]of native.queries.entries()){
 assert.equal(q.index,i);assert.equal(q.status,'PASS');assert.equal(q.primitive,'PASS');assert.equal(q.proof,'Substituted.property');assert(inputs.shards.some(s=>s.sha256===q.inputSha256));assert.equal(q.totalStates,q.copyStates+q.renamingStates+q.substitutionStates);assert(q.totalStates<=262144);
 if('caseIndex'in q.owner){previousCases.add(q.owner.caseIndex);if(q.owner.caseIndex<1376)moduleCases.add(q.owner.caseIndex);if(q.owner.part==='let-value')letQueries++;}
 if(q.owner.kind==='recorded-template-opening')openings.push(q);
 if(q.owner.kind==='authored-cache-control')controls.push(q);
}
assert.equal(previousCases.size,1383);assert.equal(moduleCases.size,1376);assert.equal(letQueries,51);assert.equal(openings.length,16);assert.equal(openings.filter(q=>q.owner.originalOwner.source?.name==='JacobiData.slope_bound_abs').length,6);
assert.deepEqual(controls.map(q=>q.owner.name),['shared-row-distinct-depth','shared-open-image-under-two-binders']);assert(controls.every(q=>q.owner.mathematicalTyping===false));
assert(BigInt(controls[1].owner.resultOccurrences)>2n**92n);
const axioms=Object.entries(report.axioms).filter(([n])=>n.startsWith('ProofAtlas.CertifiedSubstitution.'));assert.equal(axioms.length,11);assert(axioms.every(([,a])=>a.every(x=>['propext','Quot.sound'].includes(x))));
assert.equal(report.genericSuccessfulOutputCorrectnessProved,true);for(const flag of ['decoderRefinementProved','perInputProofTermsRechecked','representedMathematicsRetyped','originalProofScriptsRead','dependencyCacheRestored'])assert.equal(report[flag],false);assert.equal(report.proofsErasedDuringNativeExecution,true);
assert.equal(report.implementationRefusals.length,4);for(const r of report.implementationRefusals){assert.equal(r.leanAccepted,false);assert.equal(r.resources.stopReason,null);assert.notEqual(r.resources.exitCode,0);}
assert(report.resources.every(r=>r.exitCode===0&&r.stopReason===null&&r.maxScratchBytes<=report.resourcePolicy.maximumScratchBytes&&r.maxProcessGroupRssBytes<=report.resourcePolicy.maximumProcessGroupRssBytes));
const guardedCases=new Set(native.queries.filter(q=>q.owner.recursiveSpecificationPreviouslyEvaluated===false).map(q=>q.owner.caseIndex));assert.equal(guardedCases.size,29);
const integration=read('integration.json.gz');assert.equal(integration.status,'PASS');assert.equal(integration.productionBuild.exitCode,0);assert.equal(integration.htmlProofer.exitCode,0);
const browser=integration.manualBrowser;assert.equal(browser.status,'PASS');assert.equal(browser.certifiedCacheEquations,2);assert.equal(browser.evidenceAnchorOpens,true);assert.equal(browser.checkerSha256,sha(fs.readFileSync(base+'browser.cjs')));assert.equal(browser.manualSourceSha256,sha(fs.readFileSync('research/proof-atlas/network-streaming/index.html')));
for(const [file,hash]of Object.entries(browser.files))assert.equal(sha(fs.readFileSync(file)),hash,file);
for(const b of [browser,integration.moduleBrowser]){assert.equal(b.audits.length,4);assert.deepEqual(b.audits.map(a=>[a.width,a.theme]),[[1500,'light'],[1500,'dark'],[390,'light'],[390,'dark']]);assert(b.audits.every(a=>a.violations===0));}
assert.equal(integration.moduleBrowser.sourceJumps,9);assert.equal(integration.moduleBrowser.wrapperJumps,6);
console.log(JSON.stringify({status:'PASS',genericCorrectnessTheorem:true,moduleUses:moduleCases.size,substitutionQueries:native.queries.length,riccatiOpenings:6,rowRoundtrips:report.rowRoundtrips,scope:report.scope}));
