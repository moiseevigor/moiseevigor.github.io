// Sample equally spaced midpoints in proof-body bound-variable occurrence order.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),z=require('node:zlib'),crypto=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data');
const repeated=require('../../../public/js/proof-atlas-repeated-receiver');
const {applicationAtUse}=require('../../../public/js/proof-atlas-omitted-references');
global.window={};require('../../../public/data/proof-atlas/goedel-sample-manifest');
const results=[];
for(const d of window.PROOF_ATLAS_AI_SAMPLE.edition.declarations.filter(d=>d.kind==='theorem' && d.bodyAvailable)){
 const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.indexSha256);
 const g=A.validateIndex(JSON.parse(raw),d),weights=[];
 for(const [node,kind] of g.kind.entries()){
  weights.push(g.children[node].reduce((n,c)=>n+weights[c],BigInt(kind===0)));
 }
 const root=g.roots[1],total=weights[root],samples=Number(total<12n?total:12n);
 const row={proof:d.name,samples,outsideCall:0,single:0,repeated:0,limited:0,checked:0,maxMatches:'0',maxStates:0};
 for(let i=0;i<samples;i++){
  let n=root,rank=BigInt(2*i+1)*total/BigInt(2*samples);
  const slots=[];
  while(g.kind[n]!==0){
   const field=g.children[n].findIndex(c=>{if(rank<weights[c])return true;rank-=weights[c];return false;});
   assert(field>=0);slots.push(field);n=g.children[n][field];
  }
  const route={root:1,slots},binder=A.binding(g,route).route;
  const port=applicationAtUse(g,{node:n,route},{includePeers:false});
  if(!port){row.outsideCall++;continue;}
  const suffix=slots.slice(port.call.route.slots.length);
  let q;
  try{q=repeated(g,binder,port.call.node,suffix,{completeCall:true});}catch(e){
   if(!(e instanceof RangeError)||!/^Receiver query (state|depth) limit$/.test(e.message))throw e;
   row.limited++;continue;
  }
  const selected=q.rankOf(port.call.route);
  assert(selected!==null);assert.deepEqual(q.select(selected),port.call.route);
  if(q.total>1n)row.repeated++;else row.single++;
  if(q.total>BigInt(row.maxMatches)){
   row.maxMatches=String(q.total);
   row.example={node:n,slots:slots.join(''),last:q.select(q.total-1n).slots.concat(suffix).join('')};
  }
  row.maxStates=Math.max(row.maxStates,q.states);
  for(const k of new Set([0n,q.total/2n,q.total-1n])){
   const call=q.select(k),operand={root:1,slots:call.slots.concat(suffix)};
   assert.equal(A.walk(g,call),port.call.node);assert.equal(A.walk(g,operand),n);
   assert.equal(q.rankOf(call),k);assert.deepEqual(A.binding(g,operand).route,binder);
   const other=applicationAtUse(g,{node:n,route:operand},{includePeers:false});
   assert.deepEqual(other.call.route,call);assert.equal(other.slot,port.slot);
   row.checked++;
  }
 }
 results.push(row);
}
console.log(JSON.stringify(results,null,2));
