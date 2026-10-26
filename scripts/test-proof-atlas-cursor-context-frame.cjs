/* Compare paged frames with independently resolved complete native records. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict');
const A=require('../public/js/proof-atlas-library-data'),T=require('../public/js/proof-atlas-deep-context'),F=require('../public/js/proof-atlas-occurrence-context-frame'),M=require('../public/js/proof-atlas-cursor-context-frame'),SP=require('../public/js/proof-atlas-source-pages'),Q=require('../public/js/proof-atlas-construction-pages'),P=require('../public/js/proof-atlas-packed-routes'),h={};
for(const name of ['library-manifest','occurrence-types-manifest','goedel-sample-manifest','let-result-pools-manifest','source-pages-manifest','construction-pages-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'.js','utf8'),{window:h});
const{library,types}=require('../public/js/proof-atlas-ai-sample').register(h.PROOF_ATLAS_LIBRARY,h.PROOF_ATLAS_OCCURRENCE_TYPES,null,h.PROOF_ATLAS_AI_SAMPLE),raw=f=>z.gunzipSync(fs.readFileSync('.'+f),{maxOutputLength:67108864});
(async()=>{
 const report={status:'RUNNING',profiles:0,starts:0,frames:0,typeSelections:0,sourceAddresses:0,presentationPoints:0,maxPresentationBytes:0,sameSourceDifferentComponents:0,binderLinks:0,localDefinitionLinks:0,mixedChains:0,maxMembers:0,maxSceneBytes:0,peakSourceNodes:0,peakTypeNodes:0,peakRecordBytes:0,refusals:0,completeArchiveRequests:0,rows:[]};
 const descriptors=process.env.ATLAS_CONTEXT_FRAME_CASE?types.records.filter(d=>d.name===process.env.ATLAS_CONTEXT_FRAME_CASE):types.records;
 for(const d of descriptors){
  const stat=fs.statfsSync('.');assert(stat.bavail*stat.bsize>=30*1024**3);
  const record=library.editions.find(e=>e.id===d.edition).declarations.find(r=>r.name===d.name),bytes=raw(record.indexFile);let pkg=await T.recorded(bytes,raw(d.file),d,record);
  const ld=h.PROOF_ATLAS_LET_REDUCTIONS.records.find(x=>x.edition===d.edition&&x.name===record.name&&x.indexSha256===record.indexSha256);if(ld)pkg=T.mergeRecorded(pkg,await T.recordedLets(bytes,raw(ld.file),ld,record));
  const c=pkg.case(record.name),complete=F.open(c),sd=h.PROOF_ATLAS_SOURCE_PAGES.records.find(r=>r.edition===d.edition&&r.name===record.name),qd=h.PROOF_ATLAS_CONSTRUCTION_PAGES.records.find(r=>r.edition===d.edition&&r.name===record.name);
  const fetcher=async file=>{assert(['/public/data/proof-atlas/source-pages/','/public/data/proof-atlas/type-pages/','/public/data/proof-atlas/construction-pages/'].some(prefix=>file.startsWith(prefix)),'Complete archive requested: '+file);return new Response(fs.readFileSync('.'+file));};
  const source=await SP.open(sd,record,{fetcher,pageLimit:1}),queries=await Q.open(qd,record,{fetcher,indexLimit:1,recordLimit:1}),model=M.open(source,queries);let starts=0,finalFrame;
  const refuse=async f=>{await assert.rejects(f);report.refusals++;},reject=f=>{assert.throws(f);report.refusals++;};
  try{
   for(const entry of c.entries){
    if(!['Pi-introduction','let-binding'].includes(T.construction(entry,c.data)?.rule))continue;starts++;report.starts++;
    for(const maxMembers of [1,4,13,32,64]){
     const frame=await model.create(entry.route,{maxMembers}),expected=complete.create(entry.route,{maxMembers});assert.deepEqual(frame,expected);assert.deepEqual(model.expand(frame),complete.expand(expected));
     const addresses=[...frame.members.flatMap((m,i)=>[{member:i},{member:i,field:'body'}]),...frame.headers.map(p=>p.address),frame.continuation.address];
     for(const address of addresses){assert.deepEqual(model.resolve(frame,address),complete.resolve(expected,address));report.sourceAddresses++;}
     report.maxSceneBytes=Math.max(report.maxSceneBytes,Buffer.byteLength(JSON.stringify(frame)));assert(report.maxSceneBytes<=M.limits.metadataBytes);report.frames++;
     if(maxMembers!==64)continue;
     finalFrame=frame;report.maxMembers=Math.max(report.maxMembers,frame.members.length);if(new Set(frame.members.map(m=>m.rule)).size>1)report.mixedChains++;
     const labels=await model.presentation(frame);assert(labels.decodedBytes<=labels.byteLimit);report.maxPresentationBytes=Math.max(report.maxPresentationBytes,labels.decodedBytes);
     for(const address of [...frame.members.map((m,i)=>({member:i})),...frame.headers.map(p=>p.address),frame.continuation.address]){const node=P.resolve(c.data,complete.resolve(expected,address)).node,text=A.describe(c.data,node);assert.deepEqual(labels.previews[JSON.stringify(address)],{node,text:text.length>240?text.slice(0,240)+'… [constructor preview]':text});report.presentationPoints++;}
     report.binderLinks+=frame.links.length;report.localDefinitionLinks+=frame.links.filter(l=>l.bindingClass==='local-definition').length;
     for(const address of addresses){
      const actual=await model.typeFor(frame,address,'kernel',{pageLimit:1}),reference=await complete.typeFor(expected,address);
      assert.deepEqual(await actual.cursor.scene(actual.observation,source),T.typeScene(reference,c.data));report.typeSelections++;report.peakTypeNodes=Math.max(report.peakTypeNodes,actual.cursor.state().peakCachedNodes);
      assert(actual.cursor.state().cachedNodes<=64&&source.state().cachedNodes<=256);
     }
     // A parent's body and its child's conclusion share a source route but retain distinct recordings.
     for(let i=0;i<frame.members.length-1;i++){
      assert.deepEqual(model.resolve(frame,{member:i,field:'body'}),model.resolve(frame,{member:i+1}));
      const parent=await model.typeFor(frame,{member:i,field:'body'},'kernel',{pageLimit:1}),child=await model.typeFor(frame,{member:i+1},'kernel',{pageLimit:1});
      assert.equal(parent.observation.origin.recording.field,'body');assert.equal(child.observation.origin.recording.field,'conclusion');assert.notDeepEqual(parent.observation.origin.recording,child.observation.origin.recording);report.sameSourceDifferentComponents++;
     }
     if(record.name==='JacobiData.slope_bound_abs'&&entry.route.depth===0&&entry.route.root===1)report.riccati={members:frame.members.length,stop:frame.stop,continuation:frame.continuation,route:model.resolve(frame,frame.continuation.address)};
    }
   }
   if(finalFrame){
    assert.equal(await model.validate(structuredClone(finalFrame)),true);
    reject(()=>model.resolve(structuredClone(finalFrame),{member:0}));reject(()=>model.expand(structuredClone(finalFrame)));
    for(const address of [{member:-1},{member:finalFrame.members.length+1},{member:finalFrame.members.length,field:'body'},{member:0,field:'unknown'},{prefixDepth:finalFrame.root.route.depth},{member:0,extra:0}])reject(()=>model.resolve(finalFrame,address));
    for(const maxMembers of [0,65,1.5,NaN])await refuse(()=>model.create(finalFrame.root.route,{maxMembers}));
    for(const change of [s=>s.members[0].contextLength++,s=>s.headers[0].type.root++,s=>s.stats.hidden='0',s=>s.source.indexSha256='0'.repeat(64)]){const bad=structuredClone(finalFrame);change(bad);await refuse(()=>model.validate(bad));}
    await refuse(()=>model.typeFor(finalFrame,{member:0},'unsupported'));
    if(finalFrame.root.route.depth)await refuse(()=>model.typeFor(finalFrame,{prefixDepth:0}));
    const controller=new AbortController();controller.abort(Error('test cancellation'));await refuse(()=>model.create(finalFrame.root.route,{signal:controller.signal}));
    const body=model.resolve(finalFrame,finalFrame.continuation.address);if(!c.get(body))await refuse(()=>model.create(body));
   }
   assert(queries.state().indexPages<=1&&queries.state().recordPages<=1&&queries.state().activeTypeTables<=1);report.peakSourceNodes=Math.max(report.peakSourceNodes,source.state().peakCachedNodes);report.peakRecordBytes=Math.max(report.peakRecordBytes,queries.state().peakRecordBytes);
   report.profiles++;report.rows.push({name:record.name,edition:d.edition,starts,source:source.state(),query:queries.state()});console.log(JSON.stringify({name:record.name,starts,frames:report.frames}));
  }finally{
   queries.dispose();source.dispose();assert.equal(source.state().cachedNodes,0);assert.equal(queries.state().recordPages,0);assert.equal(queries.state().activeTypeTables,0);
   if(finalFrame){reject(()=>model.resolve(finalFrame,{member:0}));await refuse(()=>model.create(finalFrame.root.route));await refuse(()=>model.typeFor(finalFrame,{member:0}));}
  }
 }
 if(!process.env.ATLAS_CONTEXT_FRAME_CASE){assert.equal(report.profiles,26);assert.equal(report.starts,269);assert.equal(report.frames,1345);assert.equal(report.mixedChains,45);assert.equal(report.maxMembers,57);assert(report.sameSourceDifferentComponents>0&&report.localDefinitionLinks>0);}
 report.status='PASS';report.scope='Finite exact complete-reference comparison of paged context frames and their recorded type components. One-page source/native/index/type caches. No new native judgments, whole-process memory claim, synthetic/deep adapter or measured comprehension result.';
 fs.writeFileSync(process.env.ATLAS_CONTEXT_FRAME_REPORT||'/tmp/atlas-cursor-context-frame.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined}));
})().catch(error=>{console.error(error.stack);process.exit(1);});
