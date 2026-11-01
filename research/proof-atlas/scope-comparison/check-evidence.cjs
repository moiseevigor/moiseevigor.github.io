/* Artifact identities and explicit boundaries, separate from fresh execution. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=name=>JSON.parse(z.gunzipSync(fs.readFileSync(path.join(__dirname,name))));
const model=read('model.json.gz'),theory=read('theory.json.gz'),diagnostics=read('theory-diagnostics.json.gz');
for(const [report,field] of [[model,'files'],[theory,'producerFiles']]){
 assert.equal(report.status,'PASS');for(const [file,digest]of Object.entries(report[field]))assert.equal(sha(fs.readFileSync(file)),digest,file);
}
assert.equal(model.nativeProfiles,42);assert.equal(model.nativeInputs,877);assert.equal(model.contextExtensions,37);
assert.equal(model.certificatesChecked,13168);assert.equal(model.randomPositive,12288);assert.equal(model.randomNegative,6198);assert.equal(model.damagedCertificatesRefused,4);
assert.deepEqual(model.witnessBoundaries.map(row=>[row.depth,row.result.witness.status]),[[512,'located'],[513,'unavailable']]);
assert.equal(theory.theorems,13);assert.equal(Object.keys(theory.axioms).length,13);assert.equal(theory.refusals.length,5);
for(const axioms of Object.values(theory.axioms))assert(axioms.every(axiom=>['propext','Quot.sound'].includes(axiom)));
for(const run of theory.runs){assert.equal(sha(Buffer.from(diagnostics[run.name])),run.logSha256);if(run.exitCode===0)assert(!/sorryAx|declaration uses/.test(diagnostics[run.name]));else assert(/error:/.test(diagnostics[run.name]));}
assert.equal(theory.generalJavaScriptOrDecoderRefinementProved,false);assert.equal(theory.dependencyCacheRestored,false);
const illustration=JSON.parse(fs.readFileSync(path.join(__dirname,'scope-sharing.json'))),K=require('./certificate.cjs');
assert.equal(illustration.mathematicalTyping,'not-asserted');K.check(illustration.source,illustration.sourceRoot,illustration.target,illustration.targetRoot,illustration.shift,illustration.result.certificate);
require('child_process').execFileSync(process.execPath,[path.join(__dirname,'diagram.cjs'),'--check']);
console.log(JSON.stringify({status:'PASS',theorems:theory.theorems,nativeInputs:model.nativeInputs,localCertificates:model.certificatesChecked,generalJavaScriptRefinement:false,productionIntegrated:false}));
