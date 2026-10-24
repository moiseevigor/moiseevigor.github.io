'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),repo=path.resolve(__dirname,'..');process.chdir(repo);
const U=require('../public/js/proof-atlas-variable-uses'),I=require('../research/proof-atlas/recorded-variable-uses/index.cjs'),M=require('../research/proof-atlas/mixed-interfaces/model.cjs'),P=require('../public/js/proof-atlas-packed-routes'),T=require('../public/js/proof-atlas-deep-context'),{cases}=require('../research/proof-atlas/mixed-interfaces/inputs.cjs');
const out={status:'RUNNING',profiles:0,uses:0,observations:0,frames:0,references:0,binderQueries:0,sourceRefusals:0,typeRefusals:0,transportRefusals:0,peakResidentPageBytes:0};
(async()=>{
 let sample;
 for await(const x of cases()){
  const inventory=await I.extract(x),built=I.produce(inventory),read=async sha=>built.files.get(sha),a=I.open(built.manifestBytes,built.manifestSha256,inventory.source,read),b=await U.openIndex(built.manifestBytes,built.manifestSha256,inventory.source,read),model=M.open(x.c,x.captions,x.edition);out.profiles++;out.uses+=inventory.rows.length;
  for(const row of inventory.rows){
   const ref={source:inventory.source,use:row},point={...P.resolve(x.c.data,row.route),route:row.route};assert(U.verifySource(ref,point,inventory.source));assert.throws(()=>U.verifySource(ref,{...point,scopeDepth:point.scopeDepth+1},inventory.source));out.sourceRefusals++;
   for(const[i,o]of row.observations.entries()){
    const e=x.c.get(o.owner.route),typed=o.field==='recorded'?e:await T.constructionType(e,x.c.data,o.field);assert(U.verifyObservation(ref,i,typed));out.observations++;assert.throws(()=>U.verifyObservation(ref,i,{...typed,role:typed.role==='proof'?'value':'proof'}));out.typeRefusals++;
   }
  }
  const binders=new Map(inventory.rows.map(r=>[I.key(r.binder.route),r.binder.route]));
  for(const binder of binders.values()){
   let ca=null,cb=null;do{const q={within:P.encode(binder.root,[]),binder,limit:2},ra=await a.query({...q,cursor:ca}),rb=await b.query({...q,cursor:cb});assert.deepEqual(rb,ra);ca=ra.next;cb=rb.next;}while(ca);out.binderQueries++;
  }
  for(const e of x.c.entries)if(['Pi-introduction','let-binding'].includes(T.construction(e,x.c.data)?.rule))for(const maxUnits of [1,4,8]){
   const frame=await model.create(e.route,{maxUnits});let ca=null,cb=null;out.frames++;
   do{const ra=await a.query({within:e.route,cursor:ca}),rb=await b.query({within:e.route,cursor:cb});assert.deepEqual(rb,ra);const actual=b.references(frame,rb);assert.deepEqual(actual,a.references(frame,ra));out.references+=actual.references.length;ca=ra.next;cb=rb.next;}while(ca);
  }
  assert(b.stats().residentPages<=2);out.peakResidentPageBytes=Math.max(out.peakResidentPageBytes,b.stats().peakResidentPageBytes);b.dispose();assert.equal(b.stats().residentPages,0);await assert.rejects(()=>b.query({within:P.encode(1,[])}));out.transportRefusals++;if(!sample&&inventory.rows.length>8)sample={inventory,built};
 }
 const{inventory,built}=sample;
 const mutable=Buffer.from(built.manifestBytes),at=mutable.indexOf('Sparse existing observations');assert(at>=0);queueMicrotask(()=>mutable[at]=88);const isolated=await U.openIndex(mutable,built.manifestSha256,inventory.source,async sha=>built.files.get(sha));assert.deepEqual(isolated.manifest,built.manifest);assert.notEqual(I.hash(mutable),built.manifestSha256);
 const media=await U.openIndex(built.manifestBytes,built.manifestSha256,inventory.source,async sha=>{const raw=Buffer.from(built.files.get(sha)),page=JSON.parse(raw);if(page.mode==='source'){const marker=Buffer.from('"name":'+JSON.stringify(page.rows[0].binder.name)),at=raw.indexOf(marker)+8;assert(at>=8);queueMicrotask(()=>queueMicrotask(()=>raw[at]^=1));}return raw;});
 const within=P.encode(built.manifest.indexes.source[0].first.root,[]);const clean=await isolated.query({within}),changed=await media.query({within});assert.deepEqual(changed,clean);out.bufferMutationControls=2;
 await assert.rejects(()=>U.openIndex(built.manifestBytes,'0'.repeat(64),inventory.source,async()=>{}));out.transportRefusals++;
 const corrupted=await U.openIndex(built.manifestBytes,built.manifestSha256,inventory.source,async sha=>{const p=Buffer.from(built.files.get(sha));p[0]^=1;return p;});await assert.rejects(()=>corrupted.query({within:P.encode(1,[])}));out.transportRefusals++;
 let hit,release;const started=new Promise(r=>hit=r),gate=new Promise(r=>release=r),late=await U.openIndex(built.manifestBytes,built.manifestSha256,inventory.source,async sha=>{hit();await gate;return built.files.get(sha);}),pending=late.query({within:P.encode(1,[])});await started;late.dispose();release();await assert.rejects(()=>pending);assert.equal(late.stats().residentPages,0);out.transportRefusals++;
 assert.equal(out.profiles,51);assert.equal(out.uses,170);assert.equal(out.observations,340);assert.equal(out.frames,909);assert.equal(out.references,12642);assert.equal(out.binderQueries,131);out.status='PASS';out.scope='Portable consumer compared with the retained reference model and accepted native observations; finite source/context/type-origin correspondence, not new kernel judgments or public-browser verification.';
 fs.writeFileSync('/tmp/atlas-variable-uses.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
})().catch(e=>{console.error(e.stack);process.exit(1)});
