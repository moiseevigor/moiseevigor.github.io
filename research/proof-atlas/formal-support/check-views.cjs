/* Actual paged provider versus complete native scenes; no complete archive fetch. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
process.chdir(path.resolve(__dirname,'../../..'));
const Q=require('../../../public/js/proof-atlas-application-paged-provider'),M=require('../../../public/js/proof-atlas-application-ports'),A=require('../../../public/js/proof-atlas-library-data'),N=require('../../../public/js/proof-atlas-computed-type-neighborhood'),host={},sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const file='public/data/proof-atlas/formal-support-controls-manifest.js';vm.runInNewContext(fs.readFileSync(file,'utf8'),{window:host});const records=JSON.parse(JSON.stringify(host.PROOF_ATLAS_FORMAL_SUPPORT_CONTROLS.records)),forbidden=new Set(records.flatMap(d=>[d.owner.file,d.record.indexFile]));
const report={format:'ProofAtlasFormalSupportViews/1',status:'RUNNING',profiles:[],windows:0,typeSelections:0,sourceSelections:0,requests:0,wholeArchiveRequests:0,scope:'Actual paged application provider and exact recorded type/source selections. Component bounds, not total-process memory or mathematical premise necessity.'};
const fetcher=async file=>{assert(!forbidden.has(file),'whole source/native archive requested');assert(file.startsWith('/public/data/proof-atlas/'),'unexpected asset namespace');report.requests++;return new Response(fs.readFileSync('.'+file));};
(async()=>{
 for(const d of records){const row=JSON.parse(z.gunzipSync(fs.readFileSync('.'+d.owner.file))),data=A.validateIndex(JSON.parse(z.gunzipSync(fs.readFileSync('.'+d.record.indexFile))),d.record),call=d.calls[0],lease=await Q.open(d,call.anchor.route,{fetcher});
  try{const actual=lease.create(),expected=M.create(row,row.entries,data,d,call);assert.deepEqual(actual,expected);report.windows++;
   for(const node of actual.nodes){for(const address of [node.address,node.inputAddress,node.externalBinder].filter(Boolean)){assert.equal(lease.inspectSource(address).path,A.path(data,address.route));report.sourceSelections++;}
    if(!node.typeBridge)continue;
    const j=row.entries.find(e=>e.id===node.typeBridge.identity.input).junction;
    for(const stage of node.typeBridge.stages){const address=stage.address,ambient=stage.id==='original'?j.producer.context:j.consumer.context,anchor=stage.id==='original'?j.producer.anchor:j.consumer.anchor,context={namespace:'source-expression',name:d.source.name,indexSha256:d.source.indexSha256,sourceSha256:d.source.sourceSha256,...anchor},expected=N.create(j.graph,j.roots,address,ambient,context),actual=await lease.computedNeighborhood(address);assert.deepEqual(actual,expected);assert.equal(actual.context.length,ambient.length);report.typeSelections++;}
   }
   const state=lease.state();assert.equal(state.completeRecordedTypeGraphArraysAllocated,0);assert(state.typeCachedNodes<=192&&state.sourceCachedNodes<=768);report.profiles.push({name:d.source.name,owner:d.owner.sha256,source:d.source,sceneSha256:sha(Buffer.from(JSON.stringify(actual))),state});
  }finally{lease.dispose();assert.equal(lease.state().typeCachedNodes,0);assert.equal(lease.state().sourceRows,0);}
 }
 assert.equal(report.windows,3);assert.equal(report.typeSelections,27);report.status='PASS';report.files=Object.fromEntries([file,'research/proof-atlas/formal-support/check-views.cjs','public/js/proof-atlas-application-ports.js','public/js/proof-atlas-paged-type-operations.js','public/js/proof-atlas-application-paged-provider.js','public/js/proof-atlas-application-type-pages.js'].map(file=>[file,sha(fs.readFileSync(file))]));
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,profiles:report.profiles.map(d=>({name:d.name,sceneSha256:d.sceneSha256})),files:undefined}));
})().catch(e=>{console.error(e.stack);process.exit(1)});
