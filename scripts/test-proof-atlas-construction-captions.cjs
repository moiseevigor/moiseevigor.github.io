/* Caption annotations retain every original cut and selected recording. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict');
const T=require('../public/js/proof-atlas-deep-context'),F=require('../public/js/proof-atlas-occurrence-context-frame');
const G=require('../public/js/proof-atlas-occurrence-application-fold'),K=require('../public/js/proof-atlas-occurrence-constructions'),Q=require('../public/js/proof-atlas-construction-pages');
const C=require('../public/js/proof-atlas-construction-captions'),CP=require('../research/proof-atlas/construction-pages/pack.cjs');
const producer=require('../research/proof-atlas/construction-pages/captions.cjs'),h={};
for(const name of ['library-manifest','occurrence-types-manifest','goedel-sample-manifest','let-result-pools-manifest','construction-pages-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'.js','utf8'),{window:h});
const{library,types}=require('../public/js/proof-atlas-ai-sample').register(h.PROOF_ATLAS_LIBRARY,h.PROOF_ATLAS_OCCURRENCE_TYPES,null,h.PROOF_ATLAS_AI_SAMPLE);
const raw=file=>z.gunzipSync(fs.readFileSync('.'+file),{maxOutputLength:67108864});
const key=r=>r.root+':'+r.depth+':'+r.slots;
const fetcher=async file=>{assert(file.startsWith('/public/data/proof-atlas/construction-pages/'));return new Response(fs.readFileSync('.'+file));};
(async()=>{
 const report={status:'RUNNING',profiles:0,frameStarts:0,primitiveCuts:0,groupedCuts:0,recordedOnlyCuts:0,unrecordedRoots:0,shown:0,missing:0,sourceHeaders:0,inferredTypes:0,maxBytes:0,captionLoads:0,captionQueryUpperBound:0,foreignPresentations:0,negativeControls:0,geometryUnchanged:true,typeOrCompleteArchiveRequests:0};
 let control;
 for(const d of types.records){
  const record=library.editions.find(e=>e.id===d.edition).declarations.find(r=>r.name===d.name),b=raw(record.indexFile);let pkg=await T.recorded(b,raw(d.file),d,record);
  const ld=h.PROOF_ATLAS_LET_REDUCTIONS.records.find(x=>x.name===record.name&&x.edition===d.edition&&x.indexSha256===record.indexSha256);if(ld)pkg=T.mergeRecorded(pkg,await T.recordedLets(b,raw(ld.file),ld,record));
  const native=pkg.case(record.name),frames=F.open(native),primitive=K.open(native),p=producer.open(native,e=>raw(e.evidenceFile)),expected=new Map();
  const qd=h.PROOF_ATLAS_CONSTRUCTION_PAGES.records.find(x=>x.name===record.name&&x.edition===d.edition);
  const queries=await Q.open(qd,record,{fetcher,indexLimit:1,recordLimit:1});
  async function bundle(query){const k=key(query);if(!expected.has(k))expected.set(k,await p.create(native.get(query)));return expected.get(k);}
  async function compare(model,scene,framed){
   const before=JSON.stringify(scene),loadsBefore=queries.state().captionLoads,view=await C.prepare(queries,model,scene);assert(C.assertFor(view,scene));assert.equal(view.counts.refused,0);assert.equal(JSON.stringify(scene),before);assert(view.decodedBytes<=C.byteLimit);report.maxBytes=Math.max(report.maxBytes,view.decodedBytes);
   for(const[id,caption]of Object.entries(view.captions)){
    let query,field;
    if(framed){const a=JSON.parse(id),i=a.member===scene.members.length?a.member-1:a.member;query=model.resolve(scene,{member:i});field=a.member===scene.members.length?'body':a.field||'conclusion';}
    else{const point=[...scene.nodes.map(p=>p.members?{...p.members.at(-1),...p}:p),...scene.frontiers].find(p=>p.id===id);query=model.resolve(scene,point.typeSource.query);field=point.typeSource.construction?point.typeSource.field:'recorded';}
    const archived=field==='recorded'?null:await bundle(query),expectedCaption=field==='recorded'?await p.createRecorded(native.get(query)):field==='binderType'||field==='type'?archived.sourceHeader:archived.inferredTypes[field];assert(expectedCaption);
    assert.equal(caption.text,expectedCaption.text);assert.equal(caption.category,expectedCaption.category);assert.equal(caption.originKey,expectedCaption.origin.originKey);assert.equal(caption.presentation,expectedCaption.presentation);
    if(caption.category==='recorded-source-expression')report.sourceHeaders++;else report.inferredTypes++;
   }
   const owners=new Set(framed?scene.members.map((m,i)=>key(model.resolve(scene,{member:i}))):[...scene.nodes.map(p=>p.members?{...p.members.at(-1),...p}:p),...scene.frontiers].filter(p=>p.typeSource).map(p=>key(model.resolve(scene,p.typeSource.query))));const fetched=queries.state().captionLoads-loadsBefore;assert(fetched<=owners.size);report.captionLoads+=fetched;report.captionQueryUpperBound+=owners.size;report.shown+=view.counts.shown;report.missing+=view.counts.missing;
   assert.throws(()=>C.assertFor(structuredClone(view),scene));assert.throws(()=>C.assertFor(view,structuredClone(scene)));report.foreignPresentations+=2;
  }
  try{
   let grouped=false;
   for(const entry of native.entries){const construction=T.construction(entry,native.data);if(!construction){await compare(primitive,primitive.create(entry.route,{maxNodes:1,maxDepth:0}),false);report.recordedOnlyCuts++;continue;}await compare(primitive,primitive.create(entry.route,{maxNodes:7,maxDepth:3}),false);report.primitiveCuts++;if(construction.rule==='Pi-application'&&!grouped){const group=G.open(native);await compare(group,group.create(entry.route,{maxNodes:7,maxDepth:3}),false);report.groupedCuts++;grouped=true;}
    if(['Pi-introduction','let-binding'].includes(construction.rule)){await compare(frames,frames.create(entry.route,{maxMembers:64}),true);report.frameStarts++;control??={native,entry,record};}
   }
   const unknown={format:'ProofAtlasPackedRoute/1',root:0,depth:0,slots:''};if(!native.get(unknown)){const cut=primitive.create(unknown,{maxNodes:1,maxDepth:0}),view=await C.prepare(queries,primitive,cut);assert.equal(view.counts.shown,0);assert.equal(view.counts.missing,1);report.unrecordedRoots++;}
   assert(queries.state().captionPackages<=1&&queries.state().peakCaptionBytes<=16384);assert.equal(queries.state().activeTypeTables,0);assert(queries.state().recordPages<=1&&queries.state().indexPages<=1);report.profiles++;
  }finally{queries.dispose();}
 }
 // Rehashed altered optional captions must not disable source/type constructions.
 const{native,entry,record}=control,subset={...native,entries:[entry],get:r=>key(r)===key(entry.route)?entry:null},frameModel=F.open(subset),frame=frameModel.create(entry.route),adapter=producer.open(native,e=>raw(e.evidenceFile)),base=await adapter.create(entry);
 for(const alter of [x=>x.inferredTypes.conclusion.origin.contextLength++,x=>x.sourceHeader.origin.namespace='computed-native-type',x=>x.inferredTypes.conclusion.text+='changed']){
  const bad=structuredClone(base);alter(bad);const packed=await CP.pack(subset,{captions:{create:async()=>bad}});
  const q=await Q.open(packed.descriptor,record,{fetcher:async file=>new Response(z.gzipSync(packed.files.get(file))),indexLimit:1,recordLimit:1});
  try{const row=await q.lookup(entry.route);assert(row.construction);await assert.rejects(()=>q.captionsFor(row));const view=await C.prepare(q,frameModel,frame);assert.equal(view.counts.shown,0);assert(view.counts.refused>0);assert(frameModel.validate(frame));assert.equal(row.construction.rule,T.construction(entry,native.data).rule);report.negativeControls++;}
  finally{q.dispose();}
 }
 const legacy=await CP.pack(subset),q=await Q.open(legacy.descriptor,record,{fetcher:async file=>new Response(z.gzipSync(legacy.files.get(file))),indexLimit:1,recordLimit:1});
 try{const view=await C.prepare(q,frameModel,frame);assert.equal(view.counts.shown,0);assert.equal(view.counts.refused,0);assert(view.counts.missing>0);report.negativeControls++;
  const controller=new AbortController();controller.abort(Error('caption cancellation'));await assert.rejects(()=>C.prepare(q,frameModel,frame,{signal:controller.signal}));report.negativeControls++;
 }finally{q.dispose();}
 await assert.rejects(()=>C.prepare(q,frameModel,frame));report.negativeControls++;
 assert.equal(report.profiles,26);assert.equal(report.primitiveCuts,1084);assert.equal(report.frameStarts,269);assert.equal(report.recordedOnlyCuts,1358);assert(report.unrecordedRoots>0);assert(report.sourceHeaders>0&&report.inferredTypes>0);assert(report.groupedCuts>0);
 report.status='PASS';report.scope='Finite caption annotation comparison against independent complete native inputs at every recorded construction and context-frame start. Geometry is unchanged. Rehashed optional-caption failures retain usable construction records. Bounded caption metadata and one-page record caches; complete offline references have separate residency. No new typing or comprehension claim.';
 fs.writeFileSync(process.env.ATLAS_CONSTRUCTION_CAPTION_REPORT||'/tmp/atlas-construction-captions.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(error=>{console.error(error.stack);process.exit(1)});
