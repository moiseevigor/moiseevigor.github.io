// Rebuild one routing index per source in memory. No generated packet is published.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),z=require('node:zlib');
const {createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {index}=require('../../../public/js/proof-atlas-row-occurrences');
const previous=require('./paged-row-occurrences.json');
const samples=require('./shared-application-contexts.json');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const window={};
for(const file of ['library','goedel-sample','recursion-examples'])
 vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+file+'-manifest.js','utf8'),{window});
const library=window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15');
const controls=window.PROOF_ATLAS_RECURSION_EXAMPLES.edition;
const ai=window.PROOF_ATLAS_AI_SAMPLE.edition;

function pack(data,source){
 const rows=data.kind.map((kind,i)=>[kind,...data.children[i].map(c=>i-c),...(kind===0?[data.payloads[i].index]:[])]);
 return z.gzipSync(JSON.stringify({version:1,source,roots:data.roots,rows}),{level:9});
}

// Unsigned base-128 integers encode child distances and bound-variable indices.
function packBinary(data,source){
 const bytes=[1,...Buffer.from(source,'hex')];
 function put(n){
  assert(Number.isSafeInteger(n)&&n>=0);
  while(n>=128){bytes.push(128+n%128);n=Math.floor(n/128);}
  bytes.push(n);
 }
 put(data.kind.length);put(data.roots.length);data.roots.forEach(put);
 data.kind.forEach((kind,i)=>{
  put(kind);data.children[i].forEach(c=>put(i-c));if(kind===0)put(data.payloads[i].index);
 });
 return z.gzipSync(Buffer.from(bytes),{level:9});
}

function open(packet,source,expectedHash){
 assert.equal(hash(packet),expectedHash);
 const bytes=z.gunzipSync(packet);assert.equal(bytes[0],1);assert.equal(bytes.subarray(1,33).toString('hex'),source);
 let offset=33;
 function take(){
  let value=0,scale=1;
  while(offset<bytes.length){
   const byte=bytes[offset++];value+=(byte%128)*scale;
   assert(Number.isSafeInteger(value));
   if(byte<128)return value;
   scale*=128;assert(Number.isSafeInteger(scale));
  }
  throw Error('Incomplete routing index');
 }
 const length=take(),rootCount=take();
 assert(length>0&&rootCount>0&&length+rootCount<=bytes.length-offset);
 const roots=Array.from({length:rootCount},take);
 const data={kind:[],roots,children:[],payloads:[]};
 for(let i=0;i<length;i++){
  const kind=take();
  assert(Number.isInteger(kind)&&atlas.kinds[kind]);
  const arity=atlas.fields[atlas.kinds[kind]]?.length??0;
  const children=Array.from({length:arity},()=>{
   const delta=take();
   assert(Number.isSafeInteger(delta)&&delta>0&&delta<=i);return i-delta;
  });
  data.kind.push(kind);data.children.push(children);
  data.payloads.push(kind===0?{index:take()}:null);
 }
 assert.equal(offset,bytes.length);
 for(const root of data.roots)assert(Number.isInteger(root)&&root>=0&&root<data.kind.length);
 return data;
}

const results=[];
for(const [edition,records] of [[ai,ai.declarations],[library,library.declarations.filter(r=>r.name==='JacobiData.slope_bound_abs')],
 [controls,controls.declarations.filter(r=>r.name==='AtlasExamples.shared_induction_64')]]){
 assert(records.length);
 for(const record of records){
  const original=fs.readFileSync('.'+record.indexFile),bytes=z.gunzipSync(original),source=record.indexSha256;
  assert.equal(hash(bytes),source);
  const full=atlas.validateIndex(JSON.parse(bytes),record),packet=packBinary(full,source),packetSha=hash(packet);
  const compact=open(packet,source,packetSha);
  assert.deepEqual(compact.roots,full.roots);assert.deepEqual(compact.children,full.children);assert.deepEqual(compact.kind,full.kind);
  compact.kind.forEach((kind,i)=>{if(kind===0)assert.equal(compact.payloads[i].index,full.payloads[i].index);});
  const item=samples.find(s=>s.source.indexSha256===source),w=item?.middleWitness??item?.witness;
  let bindingChecks=0;
  if(w){
   const route={root:1,slots:w.first??w.left},a=index(full,w.row,route),b=index(compact,w.row,route);
   assert.equal(a.total,b.total);
   for(let n=1n;n<=a.total;n++){
    const hit=b.select(n);assert.deepEqual(hit,a.select(n));
    const variable={root:1,slots:hit.slots.concat(w.relative??w.relativeReference)};
    const expected=atlas.binding(full,variable);assert(expected);
    assert.deepEqual(atlas.binding(compact,variable),expected);bindingChecks++;
   }
  }
  let largeOrdinalChecks=0;
  if(record.name==='AtlasExamples.shared_induction_64'){
   const route={root:1,slots:[...Array(65).fill(1),0,1,1,0,0,0]},target=atlas.walk(full,route);
   const a=index(full,target,route),b=index(compact,target,route);
   assert.equal(b.total,a.total);assert.equal(b.total,1217485108864830406656n);
   for(const n of [1n,2n,2n**53n-1n,2n**53n,2n**53n+1n,b.total/2n,b.total-1n,b.total]){
    const hit=b.select(n);assert.deepEqual(hit,a.select(n));assert.equal(atlas.walk(full,hit),target);
    assert.equal(index(compact,target,hit).rank,n);largeOrdinalChecks++;
   }
  }
  const scan=previous.find(p=>p.source===source);
  results.push({edition:edition.id,name:record.name,source,packetSha,rows:full.kind.length,
   originalBytes:original.length,fullGzip9Bytes:z.gzipSync(bytes,{level:9}).length,jsonRoutingBytes:pack(full,source).length,packetBytes:packet.length,
   ...(scan?{pagedScanBytes:scan.compressedBytes}:{}),bindingChecks,largeOrdinalChecks});
 }
}
console.log(JSON.stringify(results,null,2));
