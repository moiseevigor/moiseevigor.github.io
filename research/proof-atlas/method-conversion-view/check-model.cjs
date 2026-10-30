'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const {profiles,read,compact,sha}=require('../method-context/catalogue.cjs');
const A=require('../../../public/js/proof-atlas-library-data'),M=require('../../../public/js/proof-atlas-method-interfaces');
const I=require('../../../public/js/proof-atlas-branch-instantiation'),B=require('../../../public/js/proof-atlas-method-context');
const N=require('../../../public/js/proof-atlas-method-conversion'),Q=require('../../../public/js/proof-atlas-method-query-pages');
const base='research/proof-atlas/method-conversion-view/',h={},clone=x=>JSON.parse(JSON.stringify(x));
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/method-conversion-manifest.js','utf8'),{window:h});
const inventory=clone(h.PROOF_ATLAS_METHOD_PORT_KERNEL);
const old=JSON.parse(z.gunzipSync(fs.readFileSync('research/proof-atlas/method-context/model-check.json.gz')));
const cases=JSON.parse(z.gunzipSync(fs.readFileSync('research/proof-atlas/method-context/primitive-input.json.gz')));
const report={status:'RUNNING',profiles:0,frames:0,ports:0,pagedPorts:0,nativeBridges:0,pagedNativeBridges:0,
  unrecordedBodies:0,unrecordedInputs:0,mutations:0,boundRefusals:0,ownershipRefusals:0,primitiveReplays:0,rows:[]};
(async()=>{
 const originalFetch=globalThis.fetch;let nativeFetches=0,forbidSource=false;
 const forbidden=new Set(profiles.flatMap(({d})=>[d.file,d.record.indexFile]));
 globalThis.fetch=async file=>{if(forbidSource)assert(!forbidden.has(file),'whole packet/native archive forbidden');
  if(file.startsWith('/public/data/proof-atlas/method-conversion/'))nativeFetches++;
  return new Response(fs.readFileSync('.'+file));};
 try{
 let oldRow=0;
 for(const {d,s,q:delivery} of profiles){
  const raw=read(d.file,d.sha256),source=A.validateIndex(read(d.record.indexFile,d.record.indexSha256),d.record),model=M.open(raw,source,d.record,d);report.profiles++;
  for(const query of raw.entries){
   forbidSource=true;const paged=s?await Q.open(s,d,delivery,d.record,query.parent.route,{sourceStrategy:'stream'}):null;
   for(const branch of query.branches){
    const flow=model.flow(query.parent.route,branch.minor),parent=await I.compare(flow);
    const peer=paged?.flow(query.parent.route,branch.minor),peerParent=peer?await I.compare(peer):null;
    for(let j=0;j<=flow.inputs.length;j++){
     const focus=j===flow.inputs.length?{kind:'body'}:{kind:'input',ordinal:j};
     const r=B.compare(flow,parent,focus),v=B.exportRecord(r),previous=old.rows[oldRow++];
     assert.equal(previous.name,d.name);assert.equal(previous.minor,branch.minor);assert.deepEqual(previous.query,query.parent.route);
     for(const key of ['status','relation','context','expected','computed','renamings','mismatch','state'])assert.deepEqual(r[key],previous[key]);
     const canonical=compact(v.graph,[v.expectedRoot,v.actualRoot]);assert(B.matchNativeEndpoints(r,canonical));
     assert.throws(()=>B.matchNativeEndpoints(clone(r),canonical));report.ownershipRefusals++;
     const before=nativeFetches,n=await N.load(flow,parent,r,{inventory});
     if(n.status==='unavailable'){
      assert.equal(nativeFetches,before);if(focus.kind==='body')report.unrecordedBodies++;else report.unrecordedInputs++;
     }else{
      assert(N.accepts(n,flow,parent,r));assert.equal(n.betaAlpha.status,'unavailable');assert.equal(r.status,'unavailable');
      for(const action of [()=>N.accepts(clone(n),flow,parent,r),()=>N.accepts(n,clone(flow),parent,r),()=>N.accepts(n,flow,clone(parent),r),()=>N.accepts(n,flow,parent,clone(r))]){
       assert.throws(action);report.ownershipRefusals++;
      }
      const descriptor=N.descriptor(flow,r,inventory),record=read(descriptor.file,descriptor.sha256);
      const changes=[
       x=>x.output.source.name+='wrong',x=>x.output.source.indexSha256='0'.repeat(64),
       x=>x.output.source.sourceSha256='0'.repeat(64),x=>x.output.originalNativeOwner='0'.repeat(64),
       x=>x.output.queries[qi].source.route.slots.push(0),
       x=>x.output.originalTheoremAbsent=false,x=>x.output.originalDeclarationKernelTyping='FAIL',
       x=>x.verification.originalEnvironmentIdentityVerified=true,
       x=>x.verification.dependencyRecovery.independentlyRebuilt=true,
      ];
      const selected=record.output.queries.find(q=>JSON.stringify(q.source.route)===JSON.stringify(flow.source.query));
      const index=selected.ports.findIndex(p=>p.minor===branch.minor),qi=record.output.queries.indexOf(selected);
      changes.push(
       x=>x.output.queries[qi].ports[index].minor+=100,
       x=>x.output.queries[qi].ports.push(clone(x.output.queries[qi].ports[index])),
       x=>x.output.queries[qi].ports[index].originalContext[0].node++,
       x=>x.output.queries[qi].ports[index].computedInputs++,
       x=>x.output.queries[qi].ports[index].contextLength++,
       x=>x.output.queries[qi].ports[index].prefixChecks.push({ordinal:99}),
       x=>x.output.queries[qi].ports[index].graph.roots.reverse(),
       x=>x.output.queries[qi].ports[index].graph.kind[0]=99,
       x=>x.output.queries[qi].ports[index].graph.payloads[0]={index:999},
       x=>x.output.queries[qi].ports[index].graph.extra=true,
       x=>x.output.queries[qi].ports[index].graph.expanded[0]='2',
       x=>x.output.queries[qi].ports[index].graph.neededScope[0]=999,
       x=>x.output.queries[qi].ports[index].checks.kernelTypeConversion='FAIL',
       x=>x.output.queries[qi].ports[index].checks.kernelTermAtExpectedType='FAIL',
       x=>x.output.queries[qi].ports[index].checks.wrongTypeRejected=false);
      for(const [mutation,change] of changes.entries()){const altered=clone(record);change(altered);assert.throws(()=>N.validate(altered,flow,parent,r,descriptor),undefined,d.name+":"+branch.minor+":"+mutation);report.mutations++;}
      assert.throws(()=>N.validate(record,flow,parent,clone(r),descriptor));report.ownershipRefusals++;
      const goodFetch=globalThis.fetch;
      try{globalThis.fetch=async()=>new Response(z.gzipSync(Buffer.from('{}')));
       await assert.rejects(N.load(flow,parent,r,{inventory}),/size mismatch|SHA-256/);report.mutations++;
      }finally{globalThis.fetch=goodFetch;}
      const invalidGraphs=[
       [x=>x.kind=Array(2049).fill(0),/graph bound/],
       [x=>x.payloads[0].padding='x'.repeat(262144),/endpoint bytes/],
       [x=>x.children[0]=[0],/postorder/],
       [x=>x.roots[0]=x.kind.length,/endpoint root/],
       [x=>{for(const k of ['kind','children','payloads','neededScope','expanded'])x[k].push(clone(x[k][0]));},/unreachable/],
      ];
      for(const [change,reason] of invalidGraphs){const graph=clone(canonical);change(graph);assert.throws(()=>B.matchNativeEndpoints(r,graph),reason);report.boundRefusals++;}
      const controller=new AbortController();controller.abort();const beforeAbort=nativeFetches;
      await assert.rejects(N.load(flow,parent,r,{inventory,signal:controller.signal}));assert.equal(nativeFetches,beforeAbort);report.boundRefusals++;
      try{globalThis.fetch=async()=>new Response(z.gzipSync(Buffer.alloc(262145,32)));
       await assert.rejects(N.load(flow,parent,r,{inventory}),/decoded byte bound/);report.boundRefusals++;
      }finally{globalThis.fetch=goodFetch;}
      report.nativeBridges++;
      report.rows.push({source:n.source,context:n.context,native:n.native,expected:n.expected,computed:n.computed});
     }
     if(peer){const other=B.compare(peer,peerParent,focus);assert.deepEqual(other,r);report.pagedPorts++;
      if(n.status!=='unavailable'){const nativePeer=await N.load(peer,peerParent,other,{inventory});assert.deepEqual(nativePeer,n);report.pagedNativeBridges++;}}
     report.ports++;
    }
    report.frames++;
   }
   paged?.dispose();forbidSource=false;
  }
 }
 assert.equal(oldRow,old.rows.length);
 // Recheck the frozen Lean-core replay endpoints with the current browser
 // normalizer. This is compatibility with prior native evidence, not new Lean.
 for(const c of cases){const focusCount=c.focus.kind==='body'?c.count:c.focus.ordinal;
  const outer=Math.max(c.rawExpected.neededScope[c.rawExpected.roots[0]],c.rawActual.neededScope[c.rawActual.roots[0]]-focusCount,0);
  const value=B.normalizePair(c.rawExpected,c.rawExpected.roots[0],c.rawActual,c.rawActual.roots[0],c.count,c.focus,outer);
  assert.equal(value.status,c.status);assert.equal(value.relation,c.relation);
  assert.deepEqual(compact(value.graph,[value.expectedRoot]),c.expectedOutput);assert.deepEqual(compact(value.graph,[value.actualRoot]),c.actualOutput);report.primitiveReplays++;
 }
 }finally{globalThis.fetch=originalFetch;}
 for(const [key,value] of Object.entries({profiles:23,frames:65,ports:171,pagedPorts:153,nativeBridges:6,pagedNativeBridges:4,unrecordedBodies:59,unrecordedInputs:106,primitiveReplays:219,boundRefusals:42}))assert.equal(report[key],value,key);
 const files=[base+'check-model.cjs',base+'build-data.cjs','public/js/proof-atlas-method-context.js','public/js/proof-atlas-method-conversion.js','public/js/proof-atlas-method-interfaces.js','public/js/proof-atlas-branch-instantiation.js','public/data/proof-atlas/method-conversion-manifest.js',...inventory.records.map(d=>d.file.slice(1))];
 report.status='PASS';report.files=Object.fromEntries(files.map(file=>[file,sha(fs.readFileSync(file))]));
 report.scope='Current beta/alpha endpoints agree with the frozen 171-port model and 219 Lean-core cases. Six hash-verified native bridges, four in paged delivery; unrecorded ports remain unavailable. New native checks are inherited from the pinned six-pair record, not rerun here.';
 fs.writeFileSync(base+'model-check.json.gz',z.gzipSync(JSON.stringify(report,null,2)+'\n'));console.log(JSON.stringify({...report,files:undefined,rows:undefined}));
})().catch(error=>{console.error(error.stack);process.exitCode=1});
