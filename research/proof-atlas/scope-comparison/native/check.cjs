/* Native fixtures plus finite runtime checks. Fresh kernel replay is verify.py. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../../..'));
const A=require('../../../../public/js/proof-atlas-library-data'),M=require('../../../../public/js/proof-atlas-application-ports'),W=require('../../../../public/js/proof-atlas-scope-comparison'),O=require('../../../../public/js/proof-atlas-paged-type-operations'),L=require('../../../../public/js/proof-atlas-type-pages'),E=require('../../../../public/js/proof-atlas-equality-transport');
const C=require('../model.cjs'),K=require('../certificate.cjs'),P=require('../../native-type-paging/pack.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),copy=x=>JSON.parse(JSON.stringify(x)),raw=name=>z.gunzipSync(fs.readFileSync(path.join(__dirname,name))),read=name=>JSON.parse(raw(name));
const inventory=read('inventory.json.gz'),verification=read('verification.json.gz'),batch=read('native-batch.json.gz');
assert.equal(inventory.status,'PASS');assert.equal(verification.status,'PASS');assert.equal(verification.sourceProfiles,3);assert.equal(verification.recordedPorts,9);assert.equal(verification.wrongTypeRefusedByKernel,true);
assert.equal(sha(raw('verification.json.gz')),inventory.verificationSha256);assert.equal(sha(raw('native-batch.json.gz')),inventory.batchSha256);assert.equal(inventory.batchSha256,verification.nativeSha256);
assert.equal(sha(fs.readFileSync(path.join(__dirname,'record.py'))),inventory.recorderSha256);
for(const[file,digest]of Object.entries(verification.producerFiles))assert.equal(sha(fs.readFileSync(file)),digest,file);
const report={format:'ProofAtlasScopeNativeRuntime/1',status:'RUNNING',execution:{node:process.version,execArgv:process.execArgv,heapLimitScope:'V8 flag, not total process RSS'},profiles:[],ports:0,nonzeroExtensions:0,preservedLocalPorts:0,shiftedExternalPorts:0,withoutVariablePorts:0,certificateRows:0,pagedComparisons:0,sourceContextRefusals:0,variableMutationsRefused:0,completeScenes:[],readerBoundaries:[],wholeArchivesRequested:false,scope:'Finite native observations and scope certificates, not a general JavaScript/decoder refinement, total-memory theorem or human-comprehension result.'};
(async()=>{
 for(const [position,d]of inventory.profiles.entries()){
  const source=z.gunzipSync(fs.readFileSync('.'+d.record.indexFile)),native=z.gunzipSync(fs.readFileSync('.'+d.owner.file)),data=A.validateIndex(JSON.parse(source),d.record),row=JSON.parse(native),prepared=P.prepare(d,native,source);
  assert.deepEqual(row,batch[position]);M.validateHeader(row,d);assert.deepEqual(data.declaration.axioms,[]);
  assert.equal(d.record.sourceSha256,sha(fs.readFileSync(path.join(__dirname,'Controls.lean'))));
  const summary={name:d.source.name,owner:d.owner.sha256,sourceRows:data.kind.length,ports:[]};
  for(const entry of row.entries){
   const j=entry.junction,g=j.graph,left=j.roots.producerType,right=j.roots.producerTypeInConsumer,shift=j.consumer.context.length-j.producer.context.length;
   M.validatePort(j,data,d.calls[0],j.consumer.slot);
   const result=W.compare(g,left,g,right,shift,{includeCertificate:true});assert.equal(result.status,'same');assert.deepEqual(result,C.compare(g,left,g,right,shift,{includeCertificate:true}));K.check(g,left,g,right,shift,result.certificate);
   const variables=result.certificate.rows.filter(r=>g.kind[r.left]===0);report.ports++;report.certificateRows+=result.pairs;
   if(shift){report.nonzeroExtensions++;if(variables.some(r=>g.payloads[r.left].index===g.payloads[r.right].index))report.preservedLocalPorts++;if(variables.some(r=>g.payloads[r.left].index!==g.payloads[r.right].index))report.shiftedExternalPorts++;if(!variables.length)report.withoutVariablePorts++;}
   const foreign=copy(j);foreign.producer.context[0].node++;
   assert.throws(()=>M.validatePort(foreign,data,d.calls[0],j.consumer.slot),/exact source-use and original context/);report.sourceContextRefusals++;
   if(shift)for(const r of variables){const damaged=copy(g);damaged.payloads[r.right].index=g.payloads[r.left].index+(g.payloads[r.left].index===g.payloads[r.right].index?shift:0);assert.equal(W.compare(g,left,damaged,right,shift).status,'different');report.variableMutationsRefused++;}
   const packed=P.pack(prepared,entry.id);let requests=0;
   const cursor=await L.open(packed.descriptor,{pageLimit:1,indexLimit:2,fetcher:async file=>{assert(packed.files.has(file),'whole archive or unlisted asset requested');requests++;return new Response(z.gzipSync(packed.files.get(file)));}});
   let state;
   try{
    const metadata=await cursor.portMetadata();assert.equal(metadata.owner.sha256,d.owner.sha256);assert.deepEqual(metadata.port.roots,j.roots);assert.equal(Object.hasOwn(metadata.port,'graph'),false);
    const get=id=>cursor.readNode(id),paged=await W.comparePaged(get,g.kind.length,left,right,shift,{includeCertificate:true});assert.deepEqual(paged,result);assert.equal((await O.equalShifted(get,g.kind.length,left,right,shift)).status,'same');
    state=cursor.state();assert(state.cachedNodes<=64);assert.equal(state.fullTableArchiveRequests,0);if(g.kind.length>64){assert.equal(state.peakCachedNodes,64);assert(state.evictions>0);assert.equal(state.completeTableResident,false);}report.pagedComparisons++;
   }finally{cursor.dispose();assert.equal(cursor.state().cachedNodes,0);}
   summary.ports.push({input:entry.id,shift,sourceContext:j.producer.context,consumerContext:j.consumer.context,roots:j.roots,pairs:result.pairs,expanded:g.expanded[left],variables,requests,pageState:state});
  }
  if(d.source.name.endsWith('sharedLocal')){
   const j=row.entries[1].junction,g=j.graph;
   assert.throws(()=>E.equal(g,j.roots.producerType,g,j.roots.producerTypeInConsumer,2),/comparison work bound/);
   assert.throws(()=>M.create(row,row.entries,data,d,d.calls[0]),/formal-reference work bound/);
   assert.equal(summary.ports[1].pairs,1545);assert.equal(summary.ports[1].expanded.length,156);
   assert.deepEqual(summary.ports[1].variables.map(r=>[g.payloads[r.left].index,r.minimum,r.maximum]),[[0,1,513]]);
   report.readerBoundaries.push({name:d.source.name,reason:'formal-reference work bound',stage:'formal dependency scan of first argument',weakeningGate:'PASS',endToEndApplicationScene:'unavailable'});
  }else{
   const scene=M.create(row,row.entries,data,d,d.calls[0]);assert.equal(scene.nodes.length,4);assert.equal(scene.nodes.find(n=>n.slot===1).typeBridge.contextExtension,2);
   report.completeScenes.push({name:d.source.name,nodes:scene.nodes.length});
   // The same source storage row is local along one path and external along another.
   const variables=summary.ports[1].variables;assert(variables.some(a=>variables.some(b=>a.left===b.left&&a.right!==b.right)));
  }
  report.profiles.push(summary);
 }
 assert.equal(report.ports,9);assert.equal(report.nonzeroExtensions,6);assert.equal(report.preservedLocalPorts,3);assert.equal(report.shiftedExternalPorts,2);assert.equal(report.withoutVariablePorts,3);assert.equal(report.sourceContextRefusals,9);assert.equal(report.variableMutationsRefused,7);assert.equal(report.pagedComparisons,9);assert.equal(report.completeScenes.length,2);assert.equal(report.readerBoundaries.length,1);
 report.status='PASS';report.files=Object.fromEntries(['check.cjs','inventory.json.gz','verification.json.gz','native-batch.json.gz',...inventory.profiles.flatMap(d=>[path.basename(d.record.indexFile),path.basename(d.owner.file)])].map(file=>['research/proof-atlas/scope-comparison/native/'+file,sha(fs.readFileSync(path.join(__dirname,file)))]));
 for(const file of ['public/js/proof-atlas-library-data.js','public/js/proof-atlas-application-ports.js','public/js/proof-atlas-scope-comparison.js','public/js/proof-atlas-paged-type-operations.js','public/js/proof-atlas-type-pages.js','public/js/proof-atlas-equality-transport.js','research/proof-atlas/native-type-paging/pack.cjs','research/proof-atlas/scope-comparison/model.cjs','research/proof-atlas/scope-comparison/certificate.cjs'])report.files[file]=sha(fs.readFileSync(file));
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({...report,profiles:report.profiles.map(p=>({name:p.name,ports:p.ports.length,sourceRows:p.sourceRows})),files:undefined}));
})().catch(e=>{console.error(e.stack);process.exit(1);});
