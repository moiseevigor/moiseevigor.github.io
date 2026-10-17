/* Damaged transport, invalid native records and bounded evidence working sets. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),A=require('../public/js/proof-atlas-library-data'),N=require('../public/js/proof-atlas-native-pages'),{inventory}=require('./proof-atlas-judgment-fixtures.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),encode=v=>Buffer.from(JSON.stringify(v)),host={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/native-query-pages-manifest.js','utf8'),{window:host});
function fixture(name='JacobiCore.E_pos'){
 const item=inventory().find(x=>x.record.name===name),original=host.PROOF_ATLAS_NATIVE_PAGES.records.find(x=>x.name===name&&x.edition===item.edition),d=structuredClone(original),m=JSON.parse(z.gunzipSync(fs.readFileSync('.'+d.file))),data=A.validateIndex(JSON.parse(z.gunzipSync(fs.readFileSync('.'+item.record.indexFile))),item.record),base=d.file.slice(0,d.file.lastIndexOf('/')+1),files=new Map();
 const put=(ref,value)=>{const bytes=encode(value);ref.sha256=hash(bytes);ref.bytes=bytes.length;files.set(base+ref.sha256+'.gz',z.gzipSync(bytes));};
 const seal=()=>{const bytes=encode(m);d.sha256=hash(bytes);d.bytes=bytes.length;files.set(d.file,z.gzipSync(bytes));};seal();
 const fetcher=async(file,options={})=>{if(options.signal?.aborted)throw options.signal.reason;return new Response(files.get(file)||fs.readFileSync('.'+file));};
 const file=ref=>base+ref.sha256+'.gz',get=ref=>JSON.parse(z.gunzipSync(files.get(file(ref))||fs.readFileSync('.'+file(ref))));
 return{item,d,m,data,base,files,put,seal,fetcher,file,get,route:m.providers[0].queries[0].route};
}
(async()=>{const prior=globalThis.fetch;let rejected=0;try{
 const reject=async(change,pattern,options={})=>{const f=fixture();await change(f);globalThis.fetch=f.fetcher;await assert.rejects(async()=>{const c=await N.open(f.d,f.data,f.item.record,options);try{await c.run(()=>c.providers.primary.getQuery(f.route));}finally{c.dispose();}},pattern);rejected++;};
 await reject(f=>{const b=encode(f.m);b[b.length-1]^=1;f.files.set(f.d.file,z.gzipSync(b));},/SHA-256 mismatch/);
 for(const [change,pattern]of [
  [m=>m.record.indexSha256='0'.repeat(64),/manifest identity/], [m=>m.edition='wrong',/manifest identity/],
  [m=>m.providers=[],/manifest identity/], [m=>m.providers.push(m.providers[0]),/provider identity/],
  [m=>m.providers[0].header.source.sourceSha256='0'.repeat(64),/stale source/],
  [m=>m.providers[0].header.leanVersion='0',/native extraction version/],
  [m=>m.providers[0].header.entries=[],/native header/],
  [m=>m.providers[0].queries[0].bytes=2097153,/query descriptor/],
  [m=>m.providers[0].queries[0].route.slots=[3],/route/],
  [m=>m.providers[0].getQuery.level=5,/index root/],
  [m=>m.providers[0].methods.getQuery=false,/lookup methods/]
 ])await reject(f=>{change(f.m);f.seal();},pattern);
 await reject(f=>{const ref=f.m.providers[0].graph;const b=encode(f.get(ref));b[b.length-1]^=1;f.files.set(f.file(ref),z.gzipSync(b));},/SHA-256 mismatch/);
 await reject(f=>{const ref=f.m.providers[0].graph,v=f.get(ref);v.kind[0]=12;f.put(ref,v);f.seal();},/type constructor/);
 await reject(f=>{const ref=f.m.providers[0].graph,v=f.get(ref);v.kind=Array(65537).fill(0);f.put(ref,v);f.seal();},/type DAG bound/);
 await reject(f=>{const ref=f.m.providers[0].getQuery;const b=encode(f.get(ref));b[b.length-1]^=1;f.files.set(f.file(ref),z.gzipSync(b));},/SHA-256 mismatch/);
 await reject(f=>{const ref=f.m.providers[0].getQuery,v=f.get(ref);v.level++;f.put(ref,v);f.seal();},/index level/);
 await reject(f=>{f.m.providers[0].getQuery.min+='0';f.seal();},/index range/);
 for(const [change,pattern]of [
  [q=>q.nativeSha256='0'.repeat(64),/query identity/], [q=>q.id=-1,/query identity/],
  [q=>q.entry.kernelCheck='FAIL',/unchecked judgment/], [q=>q.entry.path='forged',/source occurrence mismatch/],
  [q=>q.entry.context.push({}),/context size/], [q=>q.entry.typeRoot=-1,/type root/]
 ])await reject(f=>{const ref=f.m.providers[0].queries[0],q=f.get(ref);change(q);f.put(ref,q);f.seal();},pattern);
 await reject(f=>{const ref=f.m.providers[0].queries[0],b=encode(f.get(ref));b[b.length-1]^=1;f.files.set(f.file(ref),z.gzipSync(b));},/SHA-256 mismatch/);
 const f=fixture();globalThis.fetch=f.fetcher;for(const opts of [{queryLimit:0},{queryLimit:257},{byteLimit:16777217},{byteLimit:1},{indexLimit:0},{indexLimit:17}]){await assert.rejects(()=>N.open(f.d,f.data,f.item.record,opts),/cache bounds/);rejected++;}
 await assert.rejects(()=>N.open(f.d,f.data,f.item.record,{expectedDescriptors:[]}),/original descriptor inventory/);rejected++;
 const pre=new AbortController();pre.abort();await assert.rejects(()=>N.open(f.d,f.data,f.item.record,{signal:pre.signal}),/abort/i);rejected++;
 const one=await N.open(f.d,f.data,f.item.record,{queryLimit:1}),r1=f.m.providers[0].queries[0].route,r2=f.m.providers[0].queries[1].route;
 await assert.rejects(()=>one.run(()=>[one.providers.primary.getQuery(r1),one.providers.primary.getQuery(r2)]),/retry limit/);rejected++;assert(one.state().peakQueries<=1);one.dispose();
 const c=await N.open(f.d,f.data,f.item.record);let active=0,peak=0;await Promise.all([0,1,2].map(()=>c.run(async()=>{active++;peak=Math.max(peak,active);await new Promise(done=>setTimeout(done,2));active--;})));assert.equal(peak,1);
 const controller=new AbortController();await assert.rejects(()=>c.run(async()=>{controller.abort();await Promise.resolve();},{signal:controller.signal}),/abort/i);rejected++;
 c.dispose();assert.equal(c.state().cachedQueries,0);assert.equal(c.state().typeNodes,0);await assert.rejects(()=>c.run(()=>0),/disposed/);rejected++;
 // The byte bound must evict large records independently of the record-count bound.
 const big=fixture('SBracket.mk.inj');globalThis.fetch=big.fetcher;const b=await N.open(big.d,big.data,big.item.record,{byteLimit:2097152});for(const q of [...big.m.providers[0].queries].sort((a,b)=>b.bytes-a.bytes).slice(0,8))await b.run(()=>b.providers.primary.getQuery(q.route));assert(b.state().evictions>0);assert(b.state().peakBytes<=2097152);assert(b.state().cachedQueries<8);b.dispose();
 // Reusing a hashed index cannot bypass a second reference's range or byte checks.
 for(const [field,pattern]of [['min',/cached index range/],['bytes',/cached index decoded size/]]){const bad=fixture();bad.m.providers[0].getQuery={...bad.m.providers[0].get};if(field==='min')bad.m.providers[0].getQuery.min+='0';else bad.m.providers[0].getQuery.bytes++;bad.seal();globalThis.fetch=bad.fetcher;const cached=await N.open(bad.d,bad.data,bad.item.record);await cached.run(()=>cached.providers.primary.get(bad.route));await assert.rejects(()=>cached.run(()=>cached.providers.primary.getQuery(bad.route)),pattern);cached.dispose();rejected++;}
 assert.equal(N.routeKey({root:128,slots:[0,1,2]}),'128:012');
 // One native archive can be interpreted by different rule providers. Their prepared maps must be isolated.
 const beta=fixture('CrossingData.crossing'),bp=structuredClone(beta.m.providers.find(p=>p.kind==='beta')),raw=beta.get(bp.queries[0]),route=raw.entry.route,key=route.root+':'+route.slots.join('');
 const primary=structuredClone(bp);primary.kind='primary';primary.methods={getQuery:true};const ix={};beta.put(ix,{format:'NativeQueryIndex/1',level:0,rows:[[key,0]]});primary.get=primary.getQuery={...ix,level:0,min:key,max:key};beta.m.providers=[primary,bp];beta.seal();globalThis.fetch=beta.fetcher;const isolated=await N.open(beta.d,beta.data,beta.item.record);await isolated.run(()=>isolated.providers.primary.getQuery(route));const head=await isolated.run(()=>isolated.providers.beta.get(raw.entry.betaJudgment.head.route));assert.equal(head.typingOrigin.kind,'beta-composition-observation');assert.equal(head.lambdaJudgment.status,'checked');isolated.dispose();
 // Disposal while a request is pending cannot repopulate either cache.
 globalThis.fetch=f.fetcher;const d=await N.open(f.d,f.data,f.item.record);let resume,started;const waiting=new Promise(done=>started=done),gate=new Promise(done=>resume=done);globalThis.fetch=async(file,options)=>{started();await gate;return f.fetcher(file,options);};const pending=d.run(()=>d.providers.primary.getQuery(r1));const rejectedPending=assert.rejects(()=>pending,/disposed/);await waiting;d.dispose();resume();await rejectedPending;assert.equal(d.state().cachedQueries,0);assert.equal(d.state().indexPages,0);
 const report={status:'PASS',negativeControls:rejected,recordAndByteEviction:true,serializedOperations:true,disposedLoadCannotRepopulate:true,typeGraphsReleasedOnDispose:true,providerInterpretationsIsolated:true,defaultQueryLimit:128,decodedQueryByteLimit:16777216,typeGraphNodeLimit:65536,scope:'Transport integrity, exact native-record validation, authenticated-index shape, cache limits and cancellation. Shared type graphs stay resident within separate fixed bounds; not another Lean certificate or total browser-memory bound.'};fs.writeFileSync('/tmp/atlas-native-page-controls.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{globalThis.fetch=prior;}})().catch(e=>{console.error(e.stack);process.exit(1)});
