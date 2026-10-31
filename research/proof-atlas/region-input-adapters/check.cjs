'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../../../public/js/proof-atlas-library-data'),C=require('./model.cjs');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/region-input-adapters/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=file=>JSON.parse(z.gunzipSync(fs.readFileSync(file))),copy=x=>JSON.parse(JSON.stringify(x));
const native=read(base+'native.json.gz'),verification=read(base+'verification.json.gz'),baseline=new Map();
assert.equal(verification.status,'PASS');assert.equal(sha(z.gunzipSync(fs.readFileSync(base+'native.json.gz'))),verification.nativeSha256);
for(const[file,hash]of Object.entries(verification.producerFiles))assert.equal(sha(fs.readFileSync(file)),hash,file);
for(const[file,hash]of Object.entries(verification.parents)){
 const raw=z.gunzipSync(fs.readFileSync(file));assert.equal(sha(raw),hash);
 for(const p of JSON.parse(raw).profiles)baseline.set(p.source.indexSha256,p);
}
const report={format:'ProofAtlasRegionInputAdapterModel/1',status:'RUNNING',profiles:0,candidates:0,accepted:0,formerlyRejected:0,unchangedFunctions:0,adapters:0,sourceResultPortals:0,refusals:0,rows:[]};
for(const profile of native.profiles){
 const bytes=z.gunzipSync(fs.readFileSync('.'+profile.record.indexFile));assert.equal(sha(bytes),profile.source.indexSha256);const source=A.validateIndex(JSON.parse(bytes),profile.record),old=baseline.get(profile.source.indexSha256);
 assert(old);for(const key of['source','record','members','order','commonContext','records','edges','policies','graphCheck'])assert.deepEqual(profile[key],old[key],key);
 for(const c of profile.native.cases){
  assert.equal(c.status,'PASS');const result=C.audit(source,profile,c),before=old.native.cases.find(b=>b.policy===c.policy);
  report.candidates++;report.accepted++;report.adapters+=c.adapterInputs;report.sourceResultPortals+=c.originalResultPortals;
  if(before.status==='KERNEL_REJECTED'){
   assert(c.adapterInputs>0);const first=c.adapters[0];assert.equal(first.call,before.call);assert.equal(first.slot,before.slot);report.formerlyRejected++;
  }else{
   assert.equal(c.adapterInputs,0);assert.deepEqual(c.graph,before.graph,'No-adapter function changed');assert.deepEqual(c.bindings,before.bindings);report.unchangedFunctions++;
  }
  assert.equal(c.boundaryInputs,c.bindings.filter(b=>b.port.kind==='input').length);
  assert.equal(c.adapterInputs,c.bindings.filter(b=>b.port.kind==='adapter').length);
  assert(c.graph.kind.length<=131072);
  report.rows.push({source:profile.source,policy:c.policy,baseline:before.status,boundaryInputs:c.boundaryInputs,adapters:c.adapterInputs,keptContextSlots:c.keptContextSlots,nativeRows:c.graph.kind.length,...result});
  // Corrupt each added adapter independently, holding the source and ordinary
  // inputs fixed. This checks wire ownership and literal identity recovery.
  for(const[ai,a]of c.adapters.entries()){
   for(const mutate of[
    d=>d.adapters[ai].slot++,
    d=>d.adapters[ai].binding++,
    d=>d.adapters[ai].sourcePort.input.node++,
    d=>d.adapters[ai].contextLength++,
    d=>d.adapters[ai].kernelInputTypeNonconversion='FAIL',
    d=>d.adapters[ai].graph.payloads[d.adapters[ai].graph.children[d.adapters[ai].graph.roots[3]][1]].index=1,
    d=>d.bindings[a.binding].port.adapterIndex=999,
    d=>d.bindings[a.binding].port.originalSpecialization='constant',
    d=>d.adapters[ai].graph.roots[2]=d.adapters[ai].graph.roots[0]
   ]){const damaged=copy(c);mutate(damaged);assert.throws(()=>C.audit(source,profile,damaged));report.refusals++;}
  }
 }
 report.profiles++;
}
assert.equal(report.profiles,10);assert.equal(report.accepted,30);assert.equal(report.formerlyRejected,3);assert.equal(report.unchangedFunctions,27);assert.equal(report.adapters,9);assert.equal(report.refusals,81);
report.files=Object.fromEntries([base+'check.cjs',base+'model.cjs',base+'Native.lean',base+'build.py',base+'verify.py',base+'prepare.cjs',base+'native.json.gz',base+'verification.json.gz','public/js/proof-atlas-library-data.js','research/proof-atlas/method-context/catalogue.cjs'].map(file=>[file,sha(fs.readFileSync(file))]));
report.status='PASS';report.scope='Complete independent reconstruction of all thirty conditional functions, source specialization and retained result positions. Nine adapters reconstruct their actual-to-expected domains and identity bodies from native type observations. Twenty-seven no-adapter functions are literally unchanged. No independent type inference, general refinement, adapter existence or comprehension claim.';
fs.writeFileSync(base+'model-check.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));console.log(JSON.stringify({...report,files:undefined,rows:undefined}));
