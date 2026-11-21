'use strict';
const fs=require('node:fs'),vm=require('node:vm'),z=require('node:zlib'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const atlas=require('../../../public/js/proof-atlas-library-data');
const pages=require('../../../public/js/proof-atlas-source-pages');
const codec=require('./occurrence-routing-codec.cjs');
const {index}=require('../../../public/js/proof-atlas-row-occurrences');
const fixtures=require('./shared-application-contexts.json'),sizes=require('./occurrence-index-transfer.json');
const hash=b=>createHash('sha256').update(b).digest('hex');
const window={};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/source-pages-manifest.js','utf8'),{window});
const label=p=>p.binderName??p.declName;
const isBinder=k=>k===6||k===7||k===8;

(async()=>{
 const results=[];
 for(const {source,witness,middleWitness} of fixtures){
  const w=middleWitness??witness;
  const {record}=inventory().find(i=>i.record.indexSha256===source.indexSha256);
  const original=fs.readFileSync('.'+record.indexFile),bytes=z.gunzipSync(original);
  assert.equal(hash(bytes),source.indexSha256);
  const full=atlas.validateIndex(JSON.parse(bytes),record);
  const packed=codec.packBinary(full,source.indexSha256),expected=sizes.find(s=>s.source===source.indexSha256);
  const compact=codec.open(packed,source.indexSha256,expected.packetSha);

  // One label per binder in stored-row order. Equal names may belong to different binders.
  const labels=full.kind.flatMap((k,i)=>isBinder(k)?[label(full.payloads[i])]:[]);
  assert(labels.every(name=>typeof name==='string'));
  const labelFile=z.gzipSync(JSON.stringify([1,source.indexSha256,labels]),{level:9});
  const [version,owner,names]=JSON.parse(z.gunzipSync(labelFile));
  assert.equal(version,1);assert.equal(owner,source.indexSha256);
  const byRow=new Map();
  compact.kind.forEach((k,i)=>{if(isBinder(k))byRow.set(i,names[byRow.size]);});
  assert.equal(byRow.size,names.length);
  for(const [row,name] of byRow)assert.equal(name,label(full.payloads[row]));

  const descriptor=window.PROOF_ATLAS_SOURCE_PAGES.records.find(d=>d.edition===source.edition&&d.name===source.name);
  const base=descriptor.file.slice(0,descriptor.file.lastIndexOf('/')+1);
  let pageBytes=0,requests=0,firstBytes,firstRequests;
  const cursor=await pages.open(descriptor,record,{pageLimit:2,indexLimit:2,fetcher:async file=>{
   assert(file.startsWith(base)&&file!==record.indexFile);
   const content=fs.readFileSync('.'+file);pageBytes+=content.length;requests++;return new Response(content);
  }});
  try{
   const route={root:1,slots:w.first??w.left},nav=index(compact,w.row,route),reference=index(full,w.row,route);
   const targets=new Set();
   for(let n=1n;n<=nav.total;n++){
    const hit=nav.select(n);assert.deepEqual(hit,reference.select(n));
    const variable={root:1,slots:hit.slots.concat(w.relative??w.relativeReference)};
    const binder=atlas.binding(compact,variable);
    assert.deepEqual(binder,atlas.binding(full,variable));
    targets.add(binder.route.slots.join('.'));
    const name=await cursor.run(()=>label(cursor.data.payloads[binder.node]));
    assert.equal(name,byRow.get(binder.node));
    if(n===1n){firstBytes=pageBytes;firstRequests=requests;}
   }
   results.push({name:source.name,source:source.indexSha256,row:w.row,occurrences:String(nav.total),
    distinctBinderRoutes:targets.size,binderRows:byRow.size,fullBytes:original.length,routingBytes:packed.length,
    labelFileBytes:labelFile.length,labelFileSha256:hash(labelFile),firstPageBytes:firstBytes,firstPageRequests:firstRequests,
    allPageBytes:pageBytes,allPageRequests:requests});
  }finally{cursor.dispose();}
 }
 console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
