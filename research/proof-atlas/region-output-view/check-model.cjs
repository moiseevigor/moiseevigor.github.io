'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');process.chdir(path.resolve(__dirname,'../../..'));
const A=require('../../../public/js/proof-atlas-library-data'),Q=require('../../../public/js/proof-atlas-network-stream-pages'),R=require('../../../public/js/proof-atlas-application-regions'),O=require('../../../public/js/proof-atlas-region-outputs');
const copy=x=>JSON.parse(JSON.stringify(x)),sha=x=>crypto.createHash('sha256').update(x).digest('hex'),h={};
for(const name of ['network-streaming','region-outputs'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'-manifest.js','utf8'),{window:h});
const inventory=copy(h.PROOF_ATLAS_REGION_OUTPUTS),ds=copy(h.PROOF_ATLAS_NETWORK_STREAMING.records),forbidden=new Set(ds.flatMap(d=>[d.owner?.file,d.record.indexFile]).filter(Boolean));let modifier=null,gate=null,requests=[],virtual=new Map();
global.fetch=async(file,options)=>{assert(!forbidden.has(file)&&!file.includes('/application-ports/')&&!file.includes('/type-pages/'),'whole/native fetch '+file);requests.push(file);if(gate)await gate(file,options);let b=virtual.get(file)||fs.readFileSync('.'+file);if(modifier)b=modifier(file,b);return new Response(b);};
const read=d=>{const b=z.gunzipSync(fs.readFileSync('.'+d.file));assert.equal(sha(b),d.sha256);return JSON.parse(b);};
const report={format:'ProofAtlasOutputViewModel/1',status:'RUNNING',collections:0,outputs:0,fieldCuts:0,sourceHeaders:0,originalBindings:0,computedBindings:0,refusals:0,peakGraphs:0,peakRows:0,peakComparisonPairs:0};
async function model(s){const scene=s.getScene();return R.create(scene,scene.nodes.map(n=>s.getCall(n.id)),scene.nodes.map(n=>[n.id]),s.getIdentity());}
async function refusal(fn,pattern){await assert.rejects(fn,pattern);report.refusals++;}
(async()=>{
 for(const record of inventory.records){const d=ds.find(d=>d.source.indexSha256===record.source.indexSha256),s=await Q.open(d),scene=await s.selectCalls(record.members),m=await model(s),index=read(record),source=JSON.parse(z.gunzipSync(fs.readFileSync('.'+d.record.indexFile)));
  assert.deepEqual(scene.nodes.map(n=>n.id).sort((a,b)=>a-b),record.members);assert(scene.nodes.length<=8);assert(scene.links.every(e=>s.getCall(e.to).ports[e.slot].knownProducer===e.from));
  const old=s.getScene();for(const ids of [[],[0,0],Array.from({length:9},(_,i)=>i),[-1],[d.counts.calls]])await refusal(()=>s.selectCalls(ids));assert.deepEqual(s.getScene(),old);
  const lease=await O.open(m,null,d,{inventory});assert.equal(lease.status,'recorded');assert.equal(lease.summary().commonContextLength,record.commonContextLength);
  let previous;
  for(const port of index.ports){const r=await lease.select(port.call),raw=read(port.type);if(previous)assert.throws(()=>lease.neighborhood(previous,'closedResultType'),/current/);previous=r;
   assert.equal(r.originalTypeText,raw.port.originalTypeText);assert.equal(r.closedTypeText,raw.port.closedTypeText);assert.deepEqual(r.checks,raw.checks);assert.deepEqual(r.projection,port.projection);
   assert.throws(()=>lease.neighborhood(copy(r),'closedResultType'),/current/);report.refusals++;
   for(const component of ['originalResultType','closedResultType']){
    const g=raw.graphs[component],todo=[{id:g.roots[0],slots:[]}],seen=new Set();
    while(todo.length){const {id,slots}=todo.pop();if(seen.has(id))continue;seen.add(id);const cut=lease.neighborhood(r,component,slots);assert.equal(cut.root.address.namespace,'common-prefix-output-types');assert.equal(cut.root.address.evidenceSha256,port.type.sha256);assert.equal(cut.root.address.node,id);assert(cut.stats.retained<=4);assert.equal(BigInt(cut.stats.retained)+BigInt(cut.stats.hidden),BigInt(cut.stats.represented));
     for(const n of [cut.root,...cut.children])if(n.binding){if(n.binding.relation==='computed-local-binder'){assert.equal(n.binding.address.namespace,'common-prefix-output-types');report.computedBindings++;}else{assert.equal(n.binding.address.namespace,'source-expression');let node=source.roots[n.binding.address.route.root];for(const slot of n.binding.address.route.slots)node=source.children[node][slot];assert.equal(node,n.binding.address.node);report.originalBindings++;}}
     const header=lease.sourceHeader(r,cut.root.address);if(header){assert.equal(component,'closedResultType');assert.equal(A.kinds[source.kind[header.node]],g.kind[id]===8?'letE':'lam');report.sourceHeaders++;}report.fieldCuts++;
     g.children[id].forEach((child,slot)=>todo.push({id:child,slots:[...slots,slot]}));
    }
   }
   const address=lease.neighborhood(r,'closedResultType').root.address;await refusal(async()=>lease.sourceHeader(r,{...address,node:address.node+1}),/address|node/);
   const state=lease.state();assert.equal(state.residentTypeGraphs,2);assert(state.residentGraphRows<=4096&&state.contextBytes<=O.limits.contextBytes&&state.sourceCursorClosed);report.peakRows=Math.max(report.peakRows,state.residentGraphRows);report.peakGraphs=Math.max(report.peakGraphs,state.residentTypeGraphs);report.peakComparisonPairs=Math.max(report.peakComparisonPairs,state.peakWork);report.outputs++;
  }
  lease.dispose();assert.equal(lease.state().residentTypeGraphs,0);assert.equal(lease.state().contextBytes,0);assert.throws(()=>lease.neighborhood(previous,'closedResultType'),/retired/);report.refusals++;
  await s.selectCalls([record.members[0]]);const no=await O.open(await model(s),null,d,{inventory});assert.equal(no.status,'unavailable');
  // Hash and context mutations must fail, even after a structurally valid cut.
  const bad=copy(inventory);bad.records.find(x=>x.sha256===record.sha256).commonContextLength++;await refusal(()=>O.open(m,null,d,{inventory:bad}),/prefix/);
  modifier=(file,b)=>file===record.file?z.gzipSync(Buffer.from('{}')):b;await refusal(()=>O.open(m,null,d,{inventory}),/hash|checksum|size|byte/i);modifier=null;
  const second=await O.open(m,null,d,{inventory});modifier=(file,b)=>file===index.ports[0].type.file?z.gzipSync(Buffer.from('{}')):b;await refusal(()=>second.select(index.ports[0].call),/hash|checksum|size|byte/i);modifier=null;await second.select(index.ports[0].call);second.dispose();
  if(record.members.length===8)assert(scene.links.length<record.members.length-1,'AI components must remain separate');
  for(const change of [x=>x.source.name='foreign',x=>x.originalNativeOwner='0'.repeat(64),x=>x.tupleTyping='FAIL',x=>x.commonContext[0].node++,x=>x.ports[0].source.node++,x=>x.ports[0].context[0].node++,x=>x.ports[0].projection.snd++,x=>x.ports[0].argumentCount++,x=>x.ports[0].checks.instantiationTyping='FAIL',x=>x.provenance.originalEnvironmentIdentityVerified=true]){const altered=copy(index);change(altered);const raw=Buffer.from(JSON.stringify(altered)),digest=sha(raw),file='/public/data/proof-atlas/region-output-types/'+digest+'.json.gz',bad=copy(inventory),entry=bad.records.find(x=>x.sha256===record.sha256);Object.assign(entry,{file,sha256:digest,bytes:raw.length});virtual.set(file,z.gzipSync(raw));await refusal(()=>O.open(m,null,d,{inventory:bad}));virtual.clear();}
  report.collections++;s.dispose();
 }
 // Pending collection replacement is cancelled; the earlier cut is preserved.
 const d=ds.find(d=>d.source.name==='JacobiData.slope_bound_abs'),s=await Q.open(d),before=s.getScene();let enter,release;const entered=new Promise(r=>enter=r),wait=new Promise(r=>release=r);
 gate=async()=>{enter();await wait;};const pending=s.selectCalls([0,20]);await entered;s.release();release();await refusal(()=>pending,/abort|cancel|stale/i);gate=null;assert.deepEqual(s.getScene(),before);
 const rec=inventory.records.find(r=>r.source.name===d.source.name);await s.selectCalls(rec.members);const m=await model(s),lease=await O.open(m,null,d,{inventory});
 let arrived,resume;const enteredType=new Promise(r=>arrived=r),waitType=new Promise(r=>resume=r);gate=async file=>{if(file.includes('/region-output-types/')){arrived();await waitType;}};
 const pendingType=lease.select(rec.members[0]);await enteredType;await refusal(()=>lease.select(rec.members[1]),/another/);lease.dispose();resume();await refusal(()=>pendingType,/retired|abort|cancel/i);gate=null;assert.equal(lease.state().residentTypeGraphs,0);s.dispose();
 const only=ds.find(d=>d.mode==='source-only'),source=await Q.open(only);const count=requests.filter(f=>f.includes('/region-output-types/')).length;assert.equal((await O.open(await model(source),null,only,{inventory})).status,'unavailable');assert.equal(requests.filter(f=>f.includes('/region-output-types/')).length,count);source.dispose();
 assert.equal(report.outputs,18);assert.equal(report.collections,3);assert(report.originalBindings>0&&report.computedBindings>0&&report.sourceHeaders>0);
 report.status='PASS';report.scope='Finite browser-model validation of three recorded collections. Native typing inherited from pinned result-closure records; no fresh kernel run or comprehension measurement.';
 report.files=Object.fromEntries(['public/js/proof-atlas-region-outputs.js','public/js/proof-atlas-network-stream-pages.js','public/js/proof-atlas-computed-type-neighborhood.js','research/proof-atlas/region-output-view/check-model.cjs'].map(f=>[f,sha(fs.readFileSync(f))]));fs.writeFileSync('research/proof-atlas/region-output-view/model-check.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n')));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
