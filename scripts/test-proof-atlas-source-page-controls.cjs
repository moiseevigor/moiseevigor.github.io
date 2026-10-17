/* Codec and source-only notation controls. Synthetic terms are not Lean certificates. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../public/js/proof-atlas-library-data'),P=require('../public/js/proof-atlas-source-pages'),J=require('../public/js/proof-atlas-judgment-geometry'),audit=require('./test-proof-atlas-judgment-audit.cjs'),{inventory}=require('./proof-atlas-judgment-fixtures.cjs');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),encode=x=>Buffer.from(JSON.stringify(x)),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync('.'+f)));
const w={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/source-pages-manifest.js','utf8'),{window:w});
const items=inventory(),item=items.reduce((a,b)=>a.record.uniqueNodes<b.record.uniqueNodes?a:b),descriptor=w.PROOF_ATLAS_SOURCE_PAGES.records.find(d=>d.name===item.record.name&&d.edition===item.edition);
function fixture(){
 const d=structuredClone(descriptor),m=read(d.file),files=new Map(),base=d.file.slice(0,d.file.lastIndexOf('/')+1);
 const put=(file,value)=>files.set(file,z.gzipSync(encode(value)));
 const seal=()=>{d.sha256=hash(encode(m));put(d.file,m);};seal();
 const fetcher=async f=>new Response(files.get(f)||fs.readFileSync('.'+f));
 return{d,m,base,put,seal,files,fetcher};
}
(async()=>{
 let rejected=0;
 const reject=async (change,pattern,run=true)=>{const f=fixture();await change(f);await assert.rejects(async()=>{const c=await P.open(f.d,item.record,{fetcher:f.fetcher});try{if(run)await c.run(()=>c.data.kind[0]);}finally{c.dispose();}},pattern);rejected++;};
 await reject(f=>f.files.set(f.d.file,z.gzipSync(Buffer.from('{}'))),/manifest hash/);
 for(const [change,pattern]of [
  [m=>m.nodeCount++,/manifest bounds/], [m=>m.indexLevel++,/manifest bounds/],
  [m=>m.originalIndexSha256='0'.repeat(64),/source identity/],
  [m=>m.header.kind=[],/header/], [m=>m.header.declaration.kernelCheck='FAIL',/header/],
  [m=>m.header.roots=[-1],/roots/], [m=>m.descriptors[0].descriptor.sourceSha256='0'.repeat(64),/native inventory/]
 ])await reject(f=>{change(f.m);f.seal();},pattern,false);
 await reject(f=>f.files.set(f.base+f.m.indexRoot+'.json.gz',z.gzipSync(Buffer.from('{}'))),/index hash/);
 await reject(f=>{const v=read(f.base+f.m.indexRoot+'.json.gz');v.first++;const h=hash(encode(v));f.put(f.base+h+'.json.gz',v);f.m.indexRoot=h;f.seal();},/index range/);
 // The smallest genuine packet has one index level; re-sign local shape changes independently.
 assert.equal(read(descriptor.file).indexLevel,0);
 for(const [change,pattern]of [
  [p=>p.start++,/page identity/], [p=>p.nodes[0][0]=12,/source constructor/],
  [p=>p.nodes[0][1]=[0],/source constructor/], [p=>p.nodes[0][2]=[],/source payload/],
  [p=>p.nodes[0][3]='0',/source payload/], [p=>p.nodes[0][4]=-1,/source payload/]
 ])await reject(f=>{const ix=read(f.base+f.m.indexRoot+'.json.gz'),page=read(f.base+ix.children[0]+'.gz');change(page);const ph=hash(encode(page));f.put(f.base+ph+'.gz',page);ix.children[0]=ph;const ih=hash(encode(ix));f.put(f.base+ih+'.json.gz',ix);f.m.indexRoot=ih;f.seal();},pattern);
 await reject(f=>{const ix=read(f.base+f.m.indexRoot+'.json.gz');f.files.set(f.base+ix.children[0]+'.gz',z.gzipSync(Buffer.from('{}')));},/page hash/);
 await reject(f=>{f.files.set(f.d.file,z.gzipSync(Buffer.alloc(1048577,32)));},/asset byte bound/);
 const f=fixture(),aborted=new AbortController();aborted.abort();await assert.rejects(()=>P.open(f.d,item.record,{fetcher:f.fetcher,signal:aborted.signal}),/abort/i);rejected++;
 for(const options of [{pageLimit:0},{pageLimit:17},{indexLimit:5}]){await assert.rejects(()=>P.open(f.d,item.record,{fetcher:f.fetcher,...options}),/cache bounds/);rejected++;}
 const big=items.find(x=>x.record.uniqueNodes>8192),bd=w.PROOF_ATLAS_SOURCE_PAGES.records.find(d=>d.edition===big.edition&&d.name===big.record.name),cursor=await P.open(bd,big.record,{fetcher:f.fetcher});
 for(let i=0;i<big.record.uniqueNodes;i+=256)await cursor.run(()=>cursor.data.kind[i]);
 assert.equal(cursor.state().cachedPages,16);assert(cursor.state().evictions>0);assert(cursor.state().peakCachedNodes<=4096);assert(cursor.state().indexPages<=4);
 assert.throws(()=>Object.keys(cursor.data.kind),/whole-source enumeration/);assert.throws(()=>cursor.data.kind[0]=1,/read-only/);rejected+=2;
 let active=0,peak=0;await Promise.all([1,2,3].map(()=>cursor.run(async()=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,2));active--;})));assert.equal(peak,1);
 const stop=new AbortController();const pending=cursor.run(async()=>{stop.abort();await Promise.resolve();},{signal:stop.signal});await assert.rejects(()=>pending,/abort/i);rejected++;
 cursor.dispose();assert.equal(cursor.state().cachedNodes,0);await assert.rejects(()=>cursor.run(()=>0),/disposed/);rejected++;
 const tiny=await P.open(bd,big.record,{fetcher:f.fetcher,pageLimit:1});await assert.rejects(()=>tiny.run(()=>[tiny.data.kind[0],tiny.data.kind[256]]),/retry limit/);tiny.dispose();rejected++;
 // Literal field notation must preserve lexical scope even with no native observations.
 const data={serialization:'ExprDAG/1',declaration:{name:'SyntheticSourceFields',rootPaths:[]},kind:[],children:[],payloads:[],expanded:[],neededScope:[],roots:[]};
 const add=(k,cs=[],payload={})=>{const i=data.kind.length;data.kind.push(A.kinds.indexOf(k));data.children.push(cs);data.payloads.push(payload);data.expanded.push((1n+cs.reduce((s,c)=>s+BigInt(data.expanded[c]),0n)).toString());data.neededScope.push(k==='bvar'?payload.index+1:Math.max(0,...cs.map((c,j)=>data.neededScope[c]-((['lam','forallE'].includes(k)&&j===1||k==='letE'&&j===2)?1:0))));return i;};
 const nat=add('const',[],{name:'Nat',levels:[]}),v=add('bvar',[],{index:0}),inner=add('lam',[v,v],{binderName:'x'}),outer=add('lam',[nat,inner],{binderName:'x'}),local=add('letE',[nat,v,v],{binderName:'x'}),withLet=add('lam',[nat,local],{binderName:'x'});
 const record={name:data.declaration.name,indexSha256:'1'.repeat(64),sourceSha256:'2'.repeat(64)},roots=[outer,withLet];
 for(const k of A.kinds)if(k!=='bvar')roots.push(add(k,(A.fields[k]||[]).map(()=>nat),k==='const'?{name:'Nat',levels:[]}:k==='sort'?{level:{kind:'zero'}}:k==='proj'?{typeName:'SyntheticRecord',index:0}:['fvar','mvar'].includes(k)?{id:'synthetic-open-object'}:k==='lit'?{value:'0',literalKind:'natVal'}:k==='mdata'?{metadata:[]}:{}));
 const seen=new Set();let scenes=0;for(const [i,node]of roots.entries()){data.roots.push(node);data.declaration.rootPaths.push('root.control'+i);const s=J.create(data,record,()=>null,{judgmentRoute:{root:i,slots:[]},maxNodes:32,maxDepth:8,sourceFallback:true,policy:'source-order'});audit(s,data);s.nodes.forEach(n=>seen.add(n.kind));assert.equal(s.stats.rules,0);assert(s.edges.every(e=>e.relation==='source-field'));scenes++;if(i<2){assert.equal(s.links.length,2);assert.notEqual(s.links[0].to,s.links[1].to);}}
 assert.equal(seen.size,12);
 const report={status:'PASS',negativeControls:rejected,constructors:seen.size,sourceOnlyScopeScenes:scenes,serializedOperations:true,evictionAndReload:true,sourceCacheLimit:4096,scope:'Codec integrity, bounds, cancellation and synthetic lexical structure. No new kernel certificate or total application memory bound.'};
 fs.writeFileSync('/tmp/atlas-source-page-controls.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e.stack);process.exit(1)});
