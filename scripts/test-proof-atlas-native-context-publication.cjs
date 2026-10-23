/* Reproduce new projections from public compiled inputs, without private modules. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),{project}=require('../research/proof-atlas/publish_native_contexts.cjs'),h={};
for(const name of ['library-manifest','occurrence-types-manifest','let-reductions-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'.js','utf8'),{window:h});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),raw=f=>z.gunzipSync(fs.readFileSync('.'+f),{maxOutputLength:67108864}),clone=v=>JSON.parse(JSON.stringify(v));
const report={status:'RUNNING',compiledInputs:0,queries:0,typeProfiles:0,letProfiles:0,refusals:0,privateModulesImported:false,historicalEnvironmentsReconstructed:false,rows:[]};
for(const [kind,manifest]of [['types',h.PROOF_ATLAS_OCCURRENCE_TYPES],['lets',h.PROOF_ATLAS_LET_REDUCTIONS]])for(const descriptor of manifest.records.filter(d=>d.nativeInput)){
 const inputBytes=raw(descriptor.nativeInput.file);assert.equal(sha(inputBytes),descriptor.nativeInput.sha256);const input=JSON.parse(inputBytes),record=h.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id===descriptor.edition).declarations.find(r=>r.name===descriptor.name),result=project(input,kind,record);
 assert.deepEqual(result.descriptor,clone(descriptor));for(const[file,b]of result.files)assert(raw(file).equals(z.gunzipSync(b)));assert.equal(result.packed.environment.historicalSnapshotEnvironmentReconstructed,false);assert.equal(result.packed.source.indexSha256,record.indexSha256);
 const refuse=change=>{const wrong=clone(input);change(wrong);assert.throws(()=>project(wrong,kind,record));report.refusals++;};
 for(const change of [x=>x.source.indexSha256='0'.repeat(64),x=>x.source.sourceSha256='0'.repeat(64),x=>x.sourceModuleHashVerified=false,x=>x.environment.compiler='another compiler',x=>x.entries[0].status='unavailable',x=>x.originalSourceScript='unreviewed source field'])refuse(change);
 if(kind==='lets')for(const change of [x=>x.entries[0].letJudgment.body.context.pop(),x=>x.entries[0].letJudgment.kernelValueConversion='FAIL',x=>x.entries[0].letJudgment.value.node++])refuse(change);
 else for(const change of [x=>x.entries[0].lambdaJudgment.domainBeforeBinder=false,x=>x.entries[0].lambdaJudgment.body.context.pop()])refuse(change);
 report.compiledInputs++;report.queries+=input.entries.length;report[kind==='lets'?'letProfiles':'typeProfiles']++;report.rows.push({kind,edition:descriptor.edition,name:record.name,queries:input.entries.length,inputSha256:descriptor.nativeInput.sha256,packedSha256:descriptor.sha256});
}
assert.equal(report.compiledInputs,3);assert.equal(report.queries,18);assert.equal(report.typeProfiles,1);assert.equal(report.letProfiles,2);assert.equal(report.refusals,26);
report.status='PASS';report.scope='Exact deterministic compiled-input projection and hash-bound source/context/attestation refusal controls. Native kernel execution was performed by the recorded private producer; this check imports no private mathematical modules and is not a portable kernel certificate.';fs.writeFileSync('/tmp/atlas-native-context-publication.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
