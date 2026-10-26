/* Local exact paged/complete mixed-interface comparison. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict'),path=require('path');
const repo=path.resolve(__dirname,'..');process.chdir(repo);
const get=n=>require(path.join(repo,'public/js/proof-atlas-'+n));
const T=get('deep-context'),SP=get('source-pages'),Q=get('construction-pages'),P=get('packed-routes');
const M=get('cursor-mixed-interfaces'),F=require('../research/proof-atlas/mixed-interfaces/model.cjs');
const {cases}=require('../research/proof-atlas/mixed-interfaces/inputs.cjs');
(async()=>{
 const out={status:'RUNNING',corpusProfiles:0,coreProfiles:0,corpusStarts:0,coreStarts:0,frames:0,mixedFrames:0,joins:0,distinctBodyCodomains:0,peakSourceNodes:0,peakTypeNodes:0,peakFrameBytes:0,refusals:0,completeArchiveRequests:0,rows:[]};
 for await(const x of cases()){
  if(process.env.ATLAS_MIXED_CASE&&x.record.name!==process.env.ATLAS_MIXED_CASE)continue;
  const entries=x.c.entries.filter(e=>['Pi-introduction','let-binding'].includes(T.construction(e,x.c.data)?.rule));
  out[x.core?'coreProfiles':'corpusProfiles']++;if(!entries.length)continue;
  const s=await SP.open(x.sd,x.record,{fetcher:x.fetcher,pageLimit:1,indexLimit:1}),q=await Q.open(x.qd,x.record,{fetcher:x.fetcher,indexLimit:1,recordLimit:1});
  const m=M.open(s,q,x.record,x.edition),full=F.open(x.c,x.captions,x.edition);let last;
  try{
   for(const e of entries){out[x.core?'coreStarts':'corpusStarts']++;
    for(const maxUnits of [1,4,8]){
     const v=await m.create(e.route,{maxUnits}),expected=await full.create(e.route,{maxUnits});assert.deepEqual(v,expected);assert.equal(q.state().activeTypeTables,0);last=v;
     for(const[i,u]of v.units.entries())assert.deepEqual(m.resolve(v,i),u.root.route);
     out.frames++;out.joins+=v.joins.length;out.mixedFrames+=new Set(v.units.map(u=>u.format)).size>1;out.peakFrameBytes=Math.max(out.peakFrameBytes,Buffer.byteLength(JSON.stringify(v)));
     if(maxUnits===1){const u=v.units[0],fields=u.rule==='Pi-introduction'?['conclusion','binderType','body']:['conclusion','type','value','body'];for(const field of fields){const session=await m.typeFor(v,{unit:0,field},'kernel',{pageLimit:1}),expected=await T.constructionType(e,x.c.data,field);assert.equal(session.observation.root,expected.typeData.roots[0]);assert.deepEqual(session.observation.sourceRoute,expected.route);assert.equal(session.observation.contextLength,expected.contextLength);m.releaseType(session);assert.equal(q.state().activeTypeTables,0);out.typeSelections=(out.typeSelections||0)+1;}}
     if(maxUnits===1&&v.units[0].bodyConversion&&!v.units[0].bodyConversion.structuralEquality)out.distinctBodyCodomains++;
     if(maxUnits===8){
      const intro=v.units.findIndex(u=>u.bodyConversion);
      if(intro>=0)for(const change of [f=>f.units[intro].ports.codomain.context.typeLocalBinders=0,f=>f.units[intro].ports.expectedBody.namespace='computed-native-type',f=>f.units[intro].ports.expectedBody.recordedOwner.sourceNode++,f=>f.units[intro].bodyConversion.expectedRoot++]){const bad=structuredClone(v);change(bad);assert.notDeepEqual(bad,v);await assert.rejects(()=>m.validate(bad));out.refusals++;}
     }
    }
   }
   assert(await m.validate(structuredClone(last)));
   for(const change of [f=>f.units[0].binding.variableRole=f.units[0].wholeRole,f=>f.sourcePartition.hidden='0',f=>f.units[0].body.contextLength--]){const bad=structuredClone(last);change(bad);await assert.rejects(()=>m.validate(bad));out.refusals++;}
   for(const field of ['expectedBody','codomain','binding']){await assert.rejects(()=>m.typeFor(last,{unit:0,field}));out.refusals++;}
   for(const index of [-1,last.units.length,0.5]){assert.throws(()=>m.resolve(last,index));out.refusals++;}
   assert.throws(()=>m.resolve(structuredClone(last),0));out.refusals++;
   for(const maxUnits of [0,9,1.5]){await assert.rejects(()=>m.create(last.root.route,{maxUnits}));out.refusals++;}
   const a=new AbortController();a.abort(Error('cancelled mixed frame'));await assert.rejects(()=>m.create(last.root.route,{signal:a.signal}));out.refusals++;
   out.peakSourceNodes=Math.max(out.peakSourceNodes,s.state().peakCachedNodes);out.peakTypeNodes=Math.max(out.peakTypeNodes,m.state().peakTypeNodes,m.state().letModel.peakTypeNodes);
   assert(s.state().cachedNodes<=256&&q.state().indexPages<=1&&q.state().recordPages<=1&&out.peakTypeNodes<=64);
   out.rows.push({name:x.record.name,edition:x.edition,starts:entries.length,source:s.state(),query:q.state(),model:m.state()});console.log(JSON.stringify({name:x.record.name,frames:out.frames}));
  }finally{q.dispose();s.dispose();assert.equal(q.state().activeTypeTables,0);assert.equal(s.state().cachedNodes,0);if(last){assert.throws(()=>m.resolve(last,0));await assert.rejects(()=>m.create(last.root.route));}}
 }
 if(!process.env.ATLAS_MIXED_CASE){assert.equal(out.corpusProfiles,26);assert.equal(out.coreProfiles,25);assert.equal(out.corpusStarts,269);assert.equal(out.coreStarts,34);assert.equal(out.frames,909);assert.equal(out.distinctBodyCodomains,7);}
 out.status='PASS';out.scope='Local paged mixed introduction/definition model compared exactly with the complete compiled-record model. One-page source/native/index/type caches, distinct actual/expected/codomain origins. No complete archive fallback, new native judgments, browser integration, whole-process memory bound or comprehension claim.';
 fs.writeFileSync(process.env.ATLAS_CURSOR_MIXED_REPORT||'/tmp/atlas-cursor-mixed-interfaces.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({...out,rows:undefined}));
})().catch(e=>{console.error(e.stack);process.exit(1)});
