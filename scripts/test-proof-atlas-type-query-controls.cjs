'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto'),Q=require('../public/js/proof-atlas-type-query-pages'),P=require('../public/js/proof-atlas-packed-routes'),h={};
for(const name of ['library-manifest','type-query-pages-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'.js','utf8'),{window:h});
const d=h.PROOF_ATLAS_TYPE_QUERY_PAGES.records.find(x=>x.name==='SBracket.mk.inj'),record=h.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id===d.edition).declarations.find(r=>r.name===d.name),parse=f=>JSON.parse(z.gunzipSync(fs.readFileSync('.'+f))),encode=v=>Buffer.from(JSON.stringify(v)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');let refusals=0;
const reject=async f=>{await assert.rejects(f);refusals++;};
function fixture(){const desc=structuredClone(d),manifest=parse(d.file),files=new Map(),fetcher=async file=>new Response(files.get(file)||fs.readFileSync('.'+file));return{desc,manifest,files,fetcher};}
function seal(f){const b=encode(f.manifest);f.desc.sha256=sha(b);f.desc.bytes=b.length;f.files.set(f.desc.file,z.gzipSync(b));}
function rootChange(f,change){const ref=f.manifest.index,value=parse(ref.file);change(value);const b=encode(value);ref.sha256=sha(b);ref.bytes=b.length;ref.file=ref.file.slice(0,ref.file.lastIndexOf('/')+1)+ref.sha256+'.index.gz';f.files.set(ref.file,z.gzipSync(b));seal(f);}
(async()=>{
 const f=fixture(),q=await Q.open(f.desc,record,{fetcher:f.fetcher});let rows=[];for(let offset=0;offset<q.manifest.observations;offset+=16)rows.push(...(await q.page({offset})).rows);assert.equal(new Set(rows.map(r=>Q.key(r.route))).size,q.manifest.observations);assert(q.state().indexPages<=4);const first=rows[0];assert.deepEqual(await q.lookup(first.route),first);
 await reject(()=>q.selected(structuredClone(first)));for(const options of [{offset:-1},{limit:0},{limit:21},{offset:4097}])await reject(()=>q.page(options));
 for(const change of [m=>m.source.indexSha256='0'.repeat(64),m=>m.source.name='foreign',m=>m.index.count++,m=>m.tables=[],m=>m.tables=Array(9).fill(m.tables[0]),m=>m.tables[0].nodes=65537,m=>m.tables[0].file='/foreign']){const x=fixture();change(x.manifest);seal(x);await reject(()=>Q.open(x.desc,record,{fetcher:x.fetcher}));}
 {const x=fixture();x.files.set(x.desc.file,Buffer.from('bad gzip'));await reject(()=>Q.open(x.desc,record,{fetcher:x.fetcher}));}
 for(const change of [v=>v.level++,v=>v.children.reverse(),v=>v.children[0].count++,v=>v.children[0].level++,v=>v.children[0].min='~']){const x=fixture();rootChange(x,change);const c=await Q.open(x.desc,record,{fetcher:x.fetcher});try{await reject(()=>c.lookup(first.route));}finally{c.dispose();}}
 {const x=fixture();x.manifest.index.min='!';seal(x);const c=await Q.open(x.desc,record,{fetcher:x.fetcher});try{await reject(()=>c.lookup(P.encode(31,[])));}finally{c.dispose();}}
 {const x=fixture();x.files.set(x.manifest.index.file,z.gzipSync(Buffer.from('{}')));seal(x);const c=await Q.open(x.desc,record,{fetcher:x.fetcher});try{await reject(()=>c.page());}finally{c.dispose();}}
 const aborted=new AbortController();aborted.abort();await reject(()=>q.lookup(first.route,{signal:aborted.signal}));await reject(()=>q.page({signal:aborted.signal}));await reject(()=>Q.open(d,record,{fetcher:f.fetcher,signal:aborted.signal}));
 for(const indexLimit of [0,5])await reject(()=>Q.open(d,record,{fetcher:f.fetcher,indexLimit}));
 // Expected source/transport identities are captured before asynchronous I/O.
 {const x=fixture(),r=structuredClone(record);let release,hit;const gate=new Promise(done=>release=done),started=new Promise(done=>hit=done),pending=Q.open(x.desc,r,{fetcher:async file=>{hit();await gate;return x.fetcher(file);}});await started;x.desc.sha256='0'.repeat(64);r.indexSha256='0'.repeat(64);release();const c=await pending;assert.equal(c.manifest.source.indexSha256,record.indexSha256);c.dispose();}
 q.dispose();assert.equal(q.state().indexPages,0);await reject(()=>q.lookup(first.route));await reject(()=>q.selected(first));
 const report={status:'PASS',refusals,positionRows:rows.length,boundedIndexPages:4,lookupAndPositionOrder:true,inputSnapshots:true,scope:'Authenticated transport and finite profile membership/absence; not independent native archive membership or kernel checking'};fs.writeFileSync('/tmp/atlas-type-query-controls.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e.stack);process.exit(1);});
