// Count binder occurrences for a fixed bound input of a shared call in the entire proof body.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),z=require('node:zlib');
const A=require('../../../public/js/proof-atlas-library-data');
global.window={};require('../../../public/data/proof-atlas/goedel-sample-manifest');
const edition=window.PROOF_ATLAS_AI_SAMPLE.edition;
const {scopes}=JSON.parse(fs.readFileSync(0,'utf8'));
const witnesses=[
 ...scopes.inferenceExamples.map(w=>({proof:w.proof,target:w.node,relative:w.relative.split('.').map(Number),observed:[w.first,w.second]})),
 ...scopes.examples.map(w=>({proof:w.proof,target:w.node,relative:[],observed:w.owners}))
];
function binds(g,n,slot){
 return (g.kind[n]===6||g.kind[n]===7)&&slot===1 || g.kind[n]===8&&slot===2;
}
function count(g,target,relative){
 const root=g.roots[1],prefix=Array(root+1).fill(0n);
 prefix[root]=1n;
 for(let n=root;n>=0;n--){
  if(prefix[n])for(const c of g.children[n])prefix[c]+=prefix[n];
 }
 let leaf=target;
 for(const slot of relative){
  assert(!binds(g,leaf,slot),'This experiment covers inputs with no intervening binder.');
  leaf=g.children[leaf][slot];
 }
 assert.equal(g.kind[leaf],0);
 const index=g.payloads[leaf].index,owners=[];
 // A suffix bucket counts paths down to target crossing exactly k new binders.
 const suffix=new Map([[target,new Map([[0,1n]])]]);
 for(let n=target+1;n<=root;n++){
  if(!prefix[n])continue;
  const buckets=new Map();
  g.children[n].forEach((child,slot)=>{
   const paths=suffix.get(child);
   if(!paths)return;
   const body=binds(g,n,slot);
   if(body && paths.has(index))owners.push({row:n,occurrences:prefix[n],uses:prefix[n]*paths.get(index)});
   for(const [depth,ways] of paths){
    const next=depth+Number(body);
    if(next<=index)buckets.set(next,(buckets.get(next)||0n)+ways);
   }
  });
  if(buckets.size)suffix.set(n,buckets);
 }
 const uses=owners.reduce((s,x)=>s+x.uses,0n);
 assert.equal(uses,prefix[target]);
 return {uses,introductions:owners.reduce((s,x)=>s+x.occurrences,0n),owners};
}
// Independent control: skip branches without a target, resolve each retained route directly.
function enumerate(g,target,relative){
 const root=g.roots[1],reachable=new Uint8Array(root+1);
 reachable[target]=1;
 for(let n=target+1;n<=root;n++)reachable[n]=Number(g.children[n].some(c=>reachable[c]));
 const owners=new Map(),stack=[{node:root,slots:[]}];
 while(stack.length){
  const {node,slots}=stack.pop();
  if(node===target){
   const binder=A.binding(g,{root:1,slots:slots.concat(relative)});
   assert(binder);
   if(!owners.has(binder.node))owners.set(binder.node,{routes:new Set(),uses:0n});
   const entry=owners.get(binder.node);entry.uses++;entry.routes.add(binder.route.slots.join('.'));
  }else g.children[node].forEach((child,slot)=>{
   if(reachable[child])stack.push({node:child,slots:slots.concat(slot)});
  });
 }
 return [...owners].sort(([a],[b])=>a-b).map(([row,v])=>({row,occurrences:BigInt(v.routes.size),uses:v.uses}));
}
const results=[];
for(const w of witnesses){
 const d=edition.declarations.find(x=>x.name===w.proof);
 const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.indexSha256);
 const g=A.validateIndex(JSON.parse(raw),d),{target,relative}=w;
 const stats=count(g,target,relative);
 assert(stats.uses<=100000n,'Fixture exceeds exhaustive control budget');
 assert.deepEqual(enumerate(g,target,relative),stats.owners);
 for(const x of w.observed)assert(stats.owners.some(y=>y.row===x.binder.node));
 results.push({proof:d.name,row:target,relative,...stats});
}
assert(results.length>0);
console.log(JSON.stringify(results,(_,v)=>typeof v==='bigint'?String(v):v,2));
