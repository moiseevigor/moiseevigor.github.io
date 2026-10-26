'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const T=require('../public/js/proof-atlas-deep-context'),TP=require('../public/js/proof-atlas-type-pages'),SP=require('../public/js/proof-atlas-source-pages'),P=require('../public/js/proof-atlas-packed-routes'),W=require('../public/js/proof-atlas-occurrence-window'),{pack}=require('../research/proof-atlas/type-pages/pack.cjs'),h={};
for(const name of ['library-manifest','occurrence-types-manifest','source-pages-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'.js','utf8'),{window:h});
const raw=f=>z.gunzipSync(fs.readFileSync('.'+f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),encode=x=>Buffer.from(JSON.stringify(x));
let refusals=0;const reject=async f=>{await assert.rejects(f);refusals++;},refuse=f=>{assert.throws(f);refusals++;};
(async()=>{
 const d=h.PROOF_ATLAS_OCCURRENCE_TYPES.records.find(x=>x.name==='JacobiConcrete.AmplitudeChart.midpoint_polynomial'),record=h.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id===d.edition).declarations.find(r=>r.name===d.name),pkg=await T.recorded(raw(record.indexFile),raw(d.file),d,record),c=pkg.case(record.name),packed=pack(c),row=packed.observations.find(o=>o.sourceRoute.depth===18&&o.sourceRoute.slots==='VVVVRQA');assert(row);
 const sd=h.PROOF_ATLAS_SOURCE_PAGES.records.find(x=>x.edition===d.edition&&x.name===record.name),requests=[];
 function fixture(){const files=new Map(packed.files),fetcher=async file=>{requests.push(file);if(files.has(file))return new Response(z.gzipSync(files.get(file)));assert(file.startsWith('/public/data/proof-atlas/source-pages/'));return new Response(fs.readFileSync('.'+file));};return{files,fetcher};}
 function replace(f,descriptor,change){const value=JSON.parse(f.files.get(descriptor.file));change(value);const bytes=encode(value);f.files.set(descriptor.file,bytes);return{...descriptor,sha256:sha(bytes),bytes:bytes.length};}
 function changedPage(f,change){
  const descriptor=structuredClone(row.table),manifest=JSON.parse(f.files.get(descriptor.file)),base=descriptor.file.slice(0,descriptor.file.lastIndexOf('/')+1),page=Math.floor(10291/64),path=[];let id=manifest.indexRoot;
  for(let level=manifest.indexLevel;level>=0;level--){const file=base+id+'.index.gz',value=JSON.parse(f.files.get(file)),slot=Math.floor(page/(64**level))%64;path.push({id,value,slot});id=value.children[slot].sha256;}
  const file=base+id+'.page.gz',value=JSON.parse(f.files.get(file));change(value,value.nodes[10291%64]);let bytes=encode(value),ref={sha256:sha(bytes),bytes:bytes.length};f.files.set(base+ref.sha256+'.page.gz',bytes);
  for(const p of path.reverse()){p.value.children[p.slot]=ref;bytes=encode(p.value);ref={sha256:sha(bytes),bytes:bytes.length};delete manifest.indexSizes[p.id];manifest.indexSizes[ref.sha256]=ref.bytes;f.files.set(base+ref.sha256+'.index.gz',bytes);}
  manifest.indexRoot=ref.sha256;bytes=encode(manifest);descriptor.sha256=sha(bytes);descriptor.bytes=bytes.length;f.files.set(descriptor.file,bytes);return descriptor;
 }
 const f=fixture(),source=await SP.open(sd,record,{fetcher:f.fetcher}),cursor=await TP.open(row.table,{fetcher:f.fetcher,pageLimit:1}),o=await cursor.observation(row.descriptor);
 assert.equal(record.indexSha256,'2d55fcee4c570869eacb882d5c131deb173cfd82c941af68aa2b561943627f7b');
 const actual=await cursor.scene(o,source,P.encode(0,[]),{maxNodes:13,maxDepth:3});assert.deepEqual(actual,T.typeScene(c.get(row.sourceRoute),c.data,P.encode(0,[]),{maxNodes:13,maxDepth:3}));assert(cursor.state().evictions>0&&cursor.state().peakCachedNodes===64);
 // Whole-cut restart under the same one-page bound cannot retain its read set.
 const t=cursor.table(o);await reject(()=>cursor.run(()=>W.create(t.data,t.record,P.encode(0,[]),{maxNodes:13,maxDepth:3,maxLayerNodes:3})));
 // The resumable traversal still succeeds after the exhausted restart operation.
 assert.deepEqual(await cursor.scene(o,source,P.encode(0,[]),{maxNodes:13,maxDepth:3}),actual);
 refuse(()=>Object.keys(t.data.kind));refuse(()=>{t.data.kind[0]=3;});await cursor.run(()=>{refuse(()=>{t.data.children[o.root].push(0);});refuse(()=>{t.data.payloads[o.root].changed=true;});});
 refuse(()=>SP.identity({...source}));refuse(()=>{source.data.roots[0]=-1;});await source.run(()=>{refuse(()=>{source.data.children[source.data.roots[0]].push(0);});});
 await reject(()=>cursor.scene(structuredClone(o),source));await reject(()=>cursor.scene(o,{...source}));await reject(()=>cursor.scene(o,source,P.encode(0,[]),{maxNodes:14}));await reject(()=>cursor.scene(o,source,P.encode(1,[])));
 for(const change of [v=>v.sourceIndexSha256='0'.repeat(64),v=>v.evidenceSha256='0'.repeat(64),v=>v.root++,v=>v.origin.typeTableRoot++,v=>v.origin.contextLength++,v=>v.sourceRoute.slots='!']){const x=fixture(),bad=replace(x,row.descriptor,change),cur=await TP.open(row.table,{fetcher:x.fetcher});try{await reject(()=>cur.observation(bad));}finally{cur.dispose();}}
 {const x=fixture(),bad=replace(x,row.descriptor,v=>v.sourceNode++),cur=await TP.open(row.table,{fetcher:x.fetcher});try{const obs=await cur.observation(bad);await reject(()=>cur.scene(obs,source));}finally{cur.dispose();}}
 for(const change of [v=>v.nodeCount++,v=>v.typeTableSha256='0'.repeat(64),v=>v.typeDeclaration.name='foreign',v=>v.indexLevel++,v=>v.indexSizes=[]]){const x=fixture(),bad=replace(x,row.table,change);await reject(()=>TP.open(bad,{fetcher:x.fetcher}));}
 {const x=fixture();x.files.set(row.table.file,Buffer.from('{}'));await reject(()=>TP.open(row.table,{fetcher:x.fetcher}));}
 for(const change of [(p,r)=>r[0]=12,(p,r)=>r[1]=[10291],(p,r)=>r[2]=[],(p,r)=>r[3]='0',(p,r)=>r[4]=-1,(p,r)=>r[3]=String(BigInt(r[3])+1n),p=>p.start++,p=>p.typeTableSha256='0'.repeat(64)]){
  const x=fixture(),bad=changedPage(x,change),cur=await TP.open(bad,{fetcher:x.fetcher});try{const obs=await cur.observation(row.descriptor);await reject(()=>cur.scene(obs,source,P.encode(0,[]),{maxNodes:13,maxDepth:3}));}finally{cur.dispose();}
 }
 for(const options of [{pageLimit:0},{pageLimit:17},{indexLimit:0},{indexLimit:5}])await reject(()=>TP.open(row.table,{fetcher:f.fetcher,...options}));
 await reject(()=>TP.open({...row.table,file:row.table.file.replace('.manifest.gz','/../private.manifest.gz')},{fetcher:f.fetcher}));
 await reject(()=>cursor.observation({...row.descriptor,file:row.descriptor.file.replace('.observation.gz','/../../private.gz')}));
 const aborted=new AbortController();aborted.abort();await reject(()=>TP.open(row.table,{fetcher:f.fetcher,signal:aborted.signal}));await reject(()=>cursor.scene(o,source,P.encode(0,[]),{signal:aborted.signal}));
 // Snapshot the expected descriptor before an asynchronous fetch can mutate it.
 {const x=fixture(),copy=structuredClone(row.table);let release,hit;const gate=new Promise(r=>release=r),started=new Promise(r=>hit=r),pending=TP.open(copy,{fetcher:async file=>{hit();await gate;return x.fetcher(file);}});await started;copy.sha256='0'.repeat(64);copy.typeTableSha256='0'.repeat(64);release();const cur=await pending;assert.equal(cur.manifest.typeTableSha256,row.table.typeTableSha256);cur.dispose();}
 const before=cursor.state();for(let i=0;i<cursor.manifest.nodeCount;i+=64)await cursor.run(()=>cursor.table(o).data.kind[i]);assert(cursor.state().evictions>before.evictions);assert.equal(cursor.state().peakCachedNodes,64);
 cursor.dispose();assert.equal(cursor.state().cachedNodes,0);await reject(()=>cursor.scene(o,source));source.dispose();refuse(()=>SP.identity(source));
 assert(!requests.some(file=>file===d.file||file===record.indexFile));
 const report={status:'PASS',refusals,resumableCutMatchesComplete:true,restartExhaustionReproduced:true,onePageTypeNodeLimit:64,evictionAndResume:true,immutableNestedTuples:true,sourceCursorSeal:true,descriptorSnapshot:true,completeArchiveRequests:0,scope:'Codec, identity, scope, cache and cancellation checks; no new typing or general consumer correctness theorem'};fs.writeFileSync('/tmp/atlas-type-page-controls.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e.stack);process.exit(1);});
