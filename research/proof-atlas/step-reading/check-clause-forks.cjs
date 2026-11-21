// Reconstruct each original binder reference from the displayed projection chain.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),z=require('node:zlib'),crypto=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data');
const ranked=require('./ranked-binder-uses.cjs');
const {applicationAtUse}=require('../../../public/js/proof-atlas-omitted-references');
global.window={};
require('../../../public/data/proof-atlas/library-manifest');
require('../../../public/data/proof-atlas/goedel-sample-manifest');
require('../../../public/data/proof-atlas/clause-forks');
const editions=[...window.PROOF_ATLAS_LIBRARY.editions,window.PROOF_ATLAS_AI_SAMPLE.edition];
const repeated=require('../../../public/js/proof-atlas-repeated-receiver');
let verified=0,queries=0,maxStates=0,repeatedQueries=0;
for(const fork of window.PROOF_ATLAS_CLAUSE_FORKS){
 const d=editions.find(e=>e.id===fork.edition).declarations.find(x=>x.name===fork.declaration);
 const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),fork.digest);
 const data=A.validateIndex(JSON.parse(raw),d),route=path=>({root:1,slots:[...path].map(Number)});
 const binder=route(fork.binder.path),seen=new Set();
 for(const group of fork.groups){
  const uses=[group,...group.additional||[]];
  assert.equal(uses.length,group.count);
  const patterns=new Map();
  for(const {use,target} of uses){
   let node=use.node,path=use.path;
   assert.equal(A.walk(data,route(path)),node);
   const call=applicationAtUse(data,{node,route:route(path)},{includePeers:false});
   if(call){
    assert.equal(call.call.route.slots.join(''),target.path);assert.equal(call.slot,group.slot);
   }else assert.equal(path.slice(0,-1),target.path);
   assert.equal(A.walk(data,route(target.path)),target.node);
   for(const side of [...group.steps].reverse()){
    if(data.kind[node]===11){
     assert.equal(data.payloads[node].typeName,'And');assert.equal(data.payloads[node].index,Number(side==='R'));path+='0';
    }else{
     let head=node,arity=0;
     while(data.kind[head]===5){head=data.children[head][0];arity++;}
     assert.equal(arity,3);assert.equal(data.payloads[head].name,side==='L'?'And.left':'And.right');path+='1';
    }
    node=A.walk(data,route(path));
   }
   assert.deepEqual(A.binding(data,route(path)).route,binder);
   const suffix=path.slice(target.path.length),key=JSON.stringify([target.node,suffix]);
   if(!patterns.has(key))patterns.set(key,{node:target.node,suffix,paths:[]});
   patterns.get(key).paths.push(target.path);
   assert(!seen.has(path));seen.add(path);verified++;
  }
  for(const pattern of patterns.values()){
   const query=repeated(data,binder,pattern.node,[...pattern.suffix].map(Number));
   assert.equal(query.total,BigInt(pattern.paths.length));
   pattern.paths.sort().forEach((path,i)=>{assert.equal(query.select(BigInt(i)).slots.join(''),path);assert.equal(query.rankOf(route(path)),BigInt(i));});
   queries++;if(query.total>1n)repeatedQueries++;maxStates=Math.max(maxStates,query.states);
  }
 }
 const refs=ranked(data,binder);
 assert.equal(BigInt(seen.size),refs.total);
 for(let i=0n;i<refs.total;i++)assert(seen.has(refs.select(i).route.slots.join('')));
}
console.log(verified+' distinct binder references verified across '+window.PROOF_ATLAS_CLAUSE_FORKS.length+' edition-specific forks');

console.log({queries,repeatedQueries,maxStates});

// Structural control: the same receiver row is shared under two different binders.
const dag={kind:[0,4,5],payloads:[{index:0},{},{}],children:[[],[],[1,0]],roots:[]};
function add(kind,children){dag.kind.push(kind);dag.payloads.push({});dag.children.push(children);return dag.kind.length-1;}
let duplicated=2;
for(let i=0;i<64;i++)duplicated=add(5,[duplicated,duplicated]);
const shadow=add(6,[1,duplicated]),both=add(5,[duplicated,shadow]);
dag.roots=[add(6,[1,both])];
const outer={root:0,slots:[]},inner={root:0,slots:[1,1]};
for(const binder of [outer,inner]){
 const q=repeated(dag,binder,2,[1]),total=1n<<64n;
 assert.equal(q.total,total);
 for(const i of [0n,1n,total/3n,total/2n,total-1n]){
  const path=q.select(i);assert.equal(q.rankOf(path),i);
  const prefix=binder===outer?[1,0]:[1,1,1];
  assert.deepEqual(path.slots,prefix.concat([...i.toString(2).padStart(64,'0')].map(Number)));
  assert.deepEqual(A.binding(dag,{root:0,slots:path.slots.concat(1)}).route,binder);
 }
 assert.throws(()=>q.select(total),RangeError);
}
assert.throws(()=>repeated(dag,outer,2,[1],{maxStates:8}),/state limit/);
console.log('Recovered five ranks under each of two binders sharing 2^64 receiver occurrences apiece.');
