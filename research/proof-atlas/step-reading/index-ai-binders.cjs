// Offline producer and independent expanded-tree oracle for one compiled declaration.
'use strict';
const fs=require('node:fs'),z=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const A=require('../../../public/js/proof-atlas-library-data');
global.window={};
require('../../../public/data/proof-atlas/goedel-sample-manifest');
require('../../../public/data/proof-atlas/source-pages-manifest');
const edition=window.PROOF_ATLAS_AI_SAMPLE.edition;
const candidates=edition.declarations.filter(d=>d.kind==='theorem'&&d.bodyAvailable);
const record=process.argv[4]?candidates.find(d=>d.name===process.argv[4]):candidates.sort((a,b)=>b.uniqueNodes-a.uniqueNodes)[0];
assert(record,'Unknown theorem');
const descriptor=window.PROOF_ATLAS_SOURCE_PAGES.records.find(d=>d.indexSha256===record.indexSha256);
const raw=z.gunzipSync(fs.readFileSync('.'+record.indexFile));
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),record.indexSha256);
const g=A.validateIndex(JSON.parse(raw),record),memo=new Map(),weights={},binders=[],checks=[];
const cutoff=64;
function count(id,index){
 if(index>=g.neededScope[id])return 0n;
 const key=id+'/'+index;
 if(memo.has(key))return memo.get(key);
 const k=g.kind[id];
 let total=BigInt(k===0&&g.payloads[id].index===index);
 for(const [slot,c] of g.children[id].entries()){
  const next=index+Number((k===6||k===7)&&slot===1||k===8&&slot===2);
  const size=count(c,next);
  if(size>0n && slot+1<g.children[id].length && BigInt(g.expanded[c])>BigInt(cutoff))
   weights[c+'/'+next]=String(size);
  total+=size;
 }
 memo.set(key,total);

 return total;
}
let binder=g.roots[1],prefix=[];
while(g.kind[binder]===6){
 const body=g.children[binder][1],total=count(body,0);
 binders.push({name:g.payloads[binder].binderName,slots:prefix,node:binder,count:String(total)});
 const ranks=new Set([1n,(total+1n)/2n,total].filter(n=>n>0n&&n<=total));
 const path=prefix.concat(1);let ordinal=0n;
 function visit(id,target){
  if(g.neededScope[id]<=target)return;
  if(g.kind[id]===0 && g.payloads[id].index===target){
   ordinal++;
   if(ranks.has(ordinal))checks.push({binder,rank:String(ordinal),node:id,slots:path.slice()});
  }
  g.children[id].forEach((c,s)=>{
   const k=g.kind[id];path.push(s);visit(c,target+Number((k===6||k===7)&&s===1||k===8&&s===2));path.pop();
  });
 }
 visit(body,0);assert.equal(ordinal,total);
 binder=body;prefix=prefix.concat(1);
}
const index={indexSha256:record.indexSha256,cutoff,binders,weights};
const encoded=JSON.stringify(index);
const weightsSha256=crypto.createHash('sha256').update(encoded).digest('hex');
fs.writeFileSync(process.argv[2],encoded);
fs.writeFileSync(process.argv[3],JSON.stringify({record,descriptor,weightsSha256,checks}));
console.log(record.name,Object.keys(weights).length,'weights',checks.length,'oracle routes',fs.statSync(process.argv[2]).size,'raw bytes',z.gzipSync(JSON.stringify(index)).length,'gzip bytes');
