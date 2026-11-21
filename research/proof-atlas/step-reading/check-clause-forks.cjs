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
let verified=0;
for(const fork of window.PROOF_ATLAS_CLAUSE_FORKS){
 const d=editions.find(e=>e.id===fork.edition).declarations.find(x=>x.name===fork.declaration);
 const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),fork.digest);
 const data=A.validateIndex(JSON.parse(raw),d),route=path=>({root:1,slots:[...path].map(Number)});
 const binder=route(fork.binder.path),seen=new Set();
 for(const group of fork.groups){
  const uses=[group,...group.additional||[]];
  assert.equal(uses.length,group.count);
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
   assert(!seen.has(path));seen.add(path);verified++;
  }
 }
 const refs=ranked(data,binder);
 assert.equal(BigInt(seen.size),refs.total);
 for(let i=0n;i<refs.total;i++)assert(seen.has(refs.select(i).route.slots.join('')));
}
console.log(verified+' distinct binder references verified across '+window.PROOF_ATLAS_CLAUSE_FORKS.length+' edition-specific forks');
