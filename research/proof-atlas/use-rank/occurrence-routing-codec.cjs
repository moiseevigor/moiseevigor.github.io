'use strict';
const assert=require('node:assert/strict'),z=require('node:zlib');
const {createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
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

module.exports={packBinary,open};
