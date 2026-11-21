// Sample equally spaced midpoints in proof-body bound-variable occurrence order.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),z=require('node:zlib'),crypto=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data');
const repeated=require('../../../public/js/proof-atlas-repeated-receiver');
const {applicationAtUse}=require('../../../public/js/proof-atlas-omitted-references');
global.window={};require('../../../public/data/proof-atlas/goedel-sample-manifest');
const allScopes=process.argv.includes('--all-scopes');
const exhaustive=allScopes||process.argv.includes('--all-distinct-ports');
const distinct=exhaustive || process.argv.includes('--distinct-ports');
const results=[];
for(const d of window.PROOF_ATLAS_AI_SAMPLE.edition.declarations.filter(d=>d.kind==='theorem' && d.bodyAvailable)){
 const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.indexSha256);
 const g=A.validateIndex(JSON.parse(raw),d),weights=[];
 for(const [node,kind] of g.kind.entries()){
  weights.push(g.children[node].reduce((n,c)=>n+weights[c],BigInt(kind===0)));
 }
 const root=g.roots[1],total=weights[root];
 const census=distinct?require('./distinct-call-ports.cjs')(g,exhaustive?Infinity:12):null;
 const partition=allScopes?require('./receiver-scopes.cjs')(g):null;
 const samples=census?census.routes.length:Number(total<12n?total:12n);
 const row={proof:d.name,samples,outsideCall:0,single:0,repeated:0,limited:0,checked:0,maxMatches:'0',maxStates:0};
 if(census){
  // Count bvar children at application edges bottom-up, independently of call spines.
  const direct=[];
  for(const [id,kind] of g.kind.entries()){
   direct.push(g.children[id].reduce((sum,c)=>sum+direct[c]+BigInt(kind===5 && g.kind[c]===0),0n));
  }
  assert.equal(String(direct[root]),census.expanded);
 }
 if(partition)row.scopes={globalOnly:0,repeatedElsewhere:0,anyRepeat:0,foldedUses:0};
 if(census)row.population={distinct:census.distinct,globallySingle:census.globallySingle,expanded:census.expanded};
 for(let i=0;i<samples;i++){
  let n=root,rank=BigInt(2*i+1)*total/BigInt(2*samples);
  const slots=census?census.routes[i].slots:[];
  if(census)n=A.walk(g,{root:1,slots});
  while(!census && g.kind[n]!==0){
   const field=g.children[n].findIndex(c=>{if(rank<weights[c])return true;rank-=weights[c];return false;});
   assert(field>=0);slots.push(field);n=g.children[n][field];
  }
  const route={root:1,slots},binder=A.binding(g,route).route;
  const port=applicationAtUse(g,{node:n,route},{includePeers:false});
  if(census){
   assert.equal(port?.call.node,census.routes[i].callNode);
   assert.equal(port.call.route.slots.length,census.routes[i].callLength);
  }
  if(!port){row.outsideCall++;continue;}
  const suffix=slots.slice(port.call.route.slots.length);
  let q;
  try{q=repeated(g,binder,port.call.node,suffix,{completeCall:true});}catch(e){
   if(!(e instanceof RangeError)||!/^Receiver query (state|depth) limit$/.test(e.message))throw e;
   row.limited++;continue;
  }
  if(census)assert(q.total<=census.routes[i].upper);
  const selected=q.rankOf(port.call.route);
  assert(selected!==null);assert.deepEqual(q.select(selected),port.call.route);
  if(q.total>1n)row.repeated++;else row.single++;
  if(partition && census.routes[i].upper>1n){
   const {binders,total,instances}=partition(port.call.node,g.payloads[n].index);
   assert.equal(total,census.routes[i].upper);
   assert(total<=BigInt(Number.MAX_SAFE_INTEGER));
   row.scopes.foldedUses+=Number(total-instances);
   assert.equal(binders.get(A.walk(g,binder)),q.total);
   const any=[...binders.values()].some(v=>v>1n);
   if(any)row.scopes.anyRepeat++;
   if(q.total===1n)row.scopes[any?'repeatedElsewhere':'globalOnly']++;
  }
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
