'use strict';
const path=require('path'),fs=require('fs'),assert=require('assert/strict');
const I=require('./index.cjs'),repo=path.resolve(__dirname,'../../..');
process.chdir(repo);
const P=require(path.join(repo,'public/js/proof-atlas-packed-routes')),T=require(path.join(repo,'public/js/proof-atlas-deep-context')),{cases}=require(path.join(repo,'research/proof-atlas/mixed-interfaces/inputs.cjs'));
const M=require(path.join(repo,'research/proof-atlas/mixed-interfaces/model.cjs'));
// Independent slot-string oracle. It does not use the index comparator/range pruning.
const word=r=>{const b=P.parse(r);return r.root+'/'+Array.from({length:r.depth},(_,i)=>(b[i>>2]>>((i%4)*2))&3).join('');};
const under=(a,b)=>word(b).startsWith(word(a));
const out={status:'RUNNING',profiles:0,observations:0,uses:0,binderQueries:0,regionQueries:0,returnedRows:0,paginationSteps:0,pages:0,storedBytes:0,maxManifestBytes:0,peakResidentPageBytes:0,peakResultBytes:0,refusals:0,deepStorageControls:0,sourceOnlyUses:0,frames:0,references:0,referenceKinds:{}};
const loadedModelHash=I.hash(fs.readFileSync(path.resolve(__dirname,'index.cjs')));
out.inputs=[];
async function nativeRow(row,x){
 const r=P.resolve(x.c.data,row.route);assert.equal(r.node,row.node);assert.equal(r.scopeDepth,row.contextLength);assert.equal(x.c.data.kind[row.node],0);assert.deepEqual(r.binding,{node:row.binder.node,route:row.binder.route});
 assert.equal(row.binder.ordinal,row.contextLength-1-x.c.data.payloads[row.node].index);
 for(const o of row.observations){
  const e=x.c.get(o.owner.route);assert(e);const typed=o.field==='recorded'?e:await T.constructionType(e,x.c.data,o.field);
  assert.deepEqual(typed.route,row.route);assert.equal(typed.node,row.node);assert.equal(typed.role,row.role);assert.equal(o.role,row.role);assert.equal(typed.contextLength,row.contextLength);
  assert.deepEqual(JSON.parse(JSON.stringify(T.typeIdentity(typed))),o.owner.typeIdentity);assert.deepEqual(JSON.parse(JSON.stringify(typed.recording)),o.owner.recording);assert.equal(typed.typeData.roots[0],o.owner.typeRoot);assert.equal(e.evidenceSha256,o.owner.evidenceSha256);assert.deepEqual(typed.contextAt(row.binder.ordinal).route,row.binder.route);
 }
}
async function consume(client,query,expected){
 let cursor=null,rows=[],guard=0;
 do{
  const r=await client.query({...query,cursor});assert(r.scanned<=I.limits.scanRows&&r.pageReads<=I.limits.pageReads&&r.rows.length<=I.limits.resultRows);assert.equal(r.countContribution,'0');assert.equal(r.coverage,'recorded-uses-only');
  rows.push(...r.rows);cursor=r.next;out.paginationSteps++;assert(++guard<1000,'continuation must make progress');
 }while(cursor);
 assert.deepEqual(rows,expected);out.returnedRows+=rows.length;return rows;
}
(async()=>{
 let sample;
 for await(const x of cases()){
  out.profiles++;const inventory=await I.extract(x),built=I.produce(inventory);out.observations+=inventory.observationCount;out.uses+=inventory.rows.length;
  out.inputs.push({source:inventory.source,manifestSha256:built.manifestSha256,manifestBytes:built.manifestBytes.length,uses:inventory.rows.length,observations:inventory.observationCount,sourcePages:built.manifest.indexes.source.length,binderPages:built.manifest.indexes.binder.length});
  for(const row of inventory.rows){await nativeRow(row,x);if(!x.c.get(row.binder.route)||!['Pi-introduction','let-binding'].includes(T.construction(x.c.get(row.binder.route),x.c.data)?.rule))out.sourceOnlyUses++;}
  for(const [sha,raw]of built.files){assert.equal(I.hash(raw),sha);assert(raw.length<=I.limits.pageBytes);out.pages++;out.storedBytes+=raw.length;}
  out.maxManifestBytes=Math.max(out.maxManifestBytes,built.manifestBytes.length);
  const client=I.open(built.manifestBytes,built.manifestSha256,inventory.source,async sha=>built.files.get(sha));
  for(let root=0;root<x.c.data.roots.length;root++){
   const within=P.encode(root,[]),expected=inventory.rows.filter(row=>row.route.root===root).sort((a,b)=>word(a.route).localeCompare(word(b.route)));
   await consume(client,{within,limit:1},expected);out.regionQueries++;
  }
  const binders=new Map();for(const row of inventory.rows)binders.set(I.key(row.binder.route),row.binder.route);
  for(const binder of binders.values()){
   const within=P.encode(binder.root,[]),expected=inventory.rows.filter(row=>word(row.binder.route)===word(binder)).sort((a,b)=>word(a.route).localeCompare(word(b.route)));
   await consume(client,{within,binder,limit:2},expected);out.binderQueries++;
  }
  // Test subregions at every observed source use and at every original typed-context unit.
  const regions=new Map(inventory.rows.map(r=>[I.key(r.route),r.route]));
  for(const e of x.c.entries)if(['Pi-introduction','let-binding'].includes(T.construction(e,x.c.data)?.rule))regions.set(I.key(e.route),e.route);
  for(const within of regions.values()){
   await consume(client,{within},inventory.rows.filter(r=>under(within,r.route)).sort((a,b)=>word(a.route).localeCompare(word(b.route))));out.regionQueries++;
  }
  const model=M.open(x.c,x.captions,x.edition);
  for(const e of x.c.entries)if(['Pi-introduction','let-binding'].includes(T.construction(e,x.c.data)?.rule))for(const maxUnits of [1,4,8]){
   const frame=await model.create(e.route,{maxUnits}),before=I.canonical(frame.sourcePartition);let cursor=null,seen=[];out.frames++;
   do{
    const result=await client.query({within:e.route,cursor}),overlay=client.references(frame,result);assert.strictEqual(overlay.sourcePartition,frame.sourcePartition);assert.equal(overlay.countContribution,'0');
    for(const ref of overlay.references){
     const row=ref.use,matches=frame.sourcePartition.regions.filter(r=>under(r.route,row.route));assert.equal(matches.length,1);assert.deepEqual(ref.region.route,matches[0].route);
     const internal=under(matches[0].route,row.binder.route),member=frame.units.findIndex(u=>word(u.root.route)===word(row.binder.route));
     assert.equal(ref.kind,internal?'internal-to-hidden-region':member>=0?'retained-binder':'external-original-context');assert.deepEqual(ref.target.route,row.binder.route);assert.equal(ref.target.node,row.binder.node);assert.equal(ref.countContribution,'0');
     out.references++;out.referenceKinds[ref.kind]=(out.referenceKinds[ref.kind]||0)+1;seen.push(row);
    }
    cursor=result.next;
   }while(cursor);
   assert.equal(I.canonical(frame.sourcePartition),before);assert.deepEqual(seen,inventory.rows.filter(r=>under(e.route,r.route)).sort((a,b)=>word(a.route).localeCompare(word(b.route))));
  }
  const s=client.stats();assert(s.residentPages<=2);out.peakResidentPageBytes=Math.max(out.peakResidentPageBytes,s.peakResidentPageBytes);out.peakResultBytes=Math.max(out.peakResultBytes,s.peakResultBytes);
  if(!sample&&inventory.rows.length>8)sample={inventory,built};client.dispose();assert.equal(client.stats().residentPages,0);await assert.rejects(()=>client.query({within:P.encode(1,[])}));out.refusals++;
 }
 assert.equal(out.profiles,51);assert.equal(out.observations,340);assert.equal(out.uses,170);assert.equal(out.sourceOnlyUses,36);
 const{inventory,built}=sample,within=P.encode(1,[]),fresh=(read=async sha=>built.files.get(sha))=>I.open(built.manifestBytes,built.manifestSha256,inventory.source,read);
 assert.throws(()=>I.open(built.manifestBytes,'0'.repeat(64),inventory.source,async()=>{}));out.refusals++;
 assert.throws(()=>I.open(built.manifestBytes,built.manifestSha256,{...inventory.source,indexSha256:'0'.repeat(64)},async()=>{}));out.refusals++;
 const damaged=fresh(async sha=>{const b=Buffer.from(built.files.get(sha));b[0]^=1;return b;});await assert.rejects(()=>damaged.query({within}));out.refusals++;
 const client=fresh(),a=await client.query({within,limit:1});assert(a.next);await assert.rejects(()=>client.query({within,cursor:{...a.next}}));out.refusals++;
 // Caller-owned identity/query objects cannot change an in-flight selection.
 const identity=JSON.parse(JSON.stringify(inventory.source)),owned=I.open(built.manifestBytes,built.manifestSha256,identity,async sha=>built.files.get(sha));identity.indexSha256='0'.repeat(64);
 assert.deepEqual(owned.manifest.source,inventory.source);assert((await owned.query({within})).rows.length>0);
 let release,hit;const gate=new Promise(r=>release=r),started=new Promise(r=>hit=r),delayed=fresh(async sha=>{hit();await gate;return built.files.get(sha);}),requestRoute=JSON.parse(JSON.stringify(within)),pending=delayed.query({within:requestRoute});await started;requestRoute.root=0;release();assert.deepEqual((await pending).rows,inventory.rows.filter(r=>r.route.root===1).slice(0,8));out.callerMutationControls=2;
 await assert.rejects(()=>client.query({within:P.encode(0,[]),cursor:a.next}));out.refusals++;
 await assert.rejects(()=>fresh().query({within,cursor:a.next}));out.refusals++;
 await assert.rejects(()=>client.query({within,limit:9}));out.refusals++;
 // Secondary references are authenticated too, and cannot be grafted to another binder.
 const changed=JSON.parse(JSON.stringify(built.manifest)),bd=changed.indexes.binder[0],bp=JSON.parse(built.files.get(bd.sha256)),other=changed.indexes.source.at(-1);bp.rows[0].source={page:other.sha256,row:other.rows-1};
 // Reissue a self-consistent transport fixture to test the cross-reference relation, not only hashing.
 const br=I.bytes(bp),bh=I.hash(br);bd.sha256=bh;bd.bytes=br.length;
 const mr=I.bytes(changed),files=new Map(built.files);files.set(bh,br);const wrong=I.open(mr,I.hash(mr),inventory.source,async sha=>files.get(sha));await assert.rejects(()=>wrong.query({within:P.encode(bp.rows[0].route.root,[]),binder:bp.rows[0].binder}));out.refusals++;
 // Deep paths are storage controls only; these are not invented native typing records.
 const deep=P.encode(1,Array(10001).fill(1)),synthetic={source:{test:'storage-only'},rows:[{route:deep,binder:{route:P.prefix(deep,10000)},observations:[],countContribution:'0'}],observationCount:0,scope:'synthetic storage control; no Lean judgment'};
 const db=I.produce(synthetic),dc=I.open(db.manifestBytes,db.manifestSha256,synthetic.source,async sha=>db.files.get(sha));await consume(dc,{within:P.prefix(deep,9999),binder:P.prefix(deep,10000)},synthetic.rows);out.deepStorageControls++;
 assert(I.compare(P.encode(1,[0,2]),P.encode(1,[1,0]))<0);assert(I.compare(P.encode(1,[1]),P.encode(1,[1,0]))<0);
 assert.equal(out.frames,909);assert.equal(I.hash(fs.readFileSync(path.resolve(__dirname,'index.cjs'))),loadedModelHash,'tested model bytes stayed fixed');
 out.status='PASS';out.codeSha256=loadedModelHash;out.testSha256=I.hash(fs.readFileSync(__filename));out.scope='Local sparse delivery and zero-source-count geometric references over existing observations, with independent native-owner/source/context comparisons and exact binder/subregion retrieval. Two resident delivery pages and bounded per-query results/reads; producer and native reference tables are not memory-bounded by this test. Deep controls test storage only. No public integration, exhaustive dependency coverage, fresh native typing, semantic necessity or comprehension result.';
 fs.writeFileSync(path.resolve(__dirname,'verification.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({...out,inputs:undefined}));
})().catch(e=>{out.status='FAIL';out.error=e.stack;fs.writeFileSync(path.resolve(__dirname,'verification.json'),JSON.stringify(out,null,2)+'\n');console.error(e.stack);process.exit(1)});
