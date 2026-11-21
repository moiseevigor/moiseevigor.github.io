// Count binder occurrences for a fixed bound input of a shared call in the entire proof body.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),z=require('node:zlib');
const {binderCopies}=require('../../../public/js/proof-atlas-arithmetic');
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
const work=[];
function enumerate(g,target,relative){
 const root=g.roots[1],reachable=new Uint8Array(root+1);
 reachable[target]=1;
 for(let n=target+1;n<=root;n++)reachable[n]=Number(g.children[n].some(c=>reachable[c]));
 const owners=new Map(),stack=[{node:root,slots:[]}];
 while(stack.length){
  const {node,slots}=stack.pop();
  if(node===target){
   const refRoute={root:1,slots:slots.concat(relative)},binder=A.binding(g,refRoute);
   assert(binder);
   if(!owners.has(binder.node))owners.set(binder.node,{reference:{node:A.walk(g,refRoute),route:refRoute},routes:new Set(),uses:0n});
   const entry=owners.get(binder.node);entry.uses++;entry.routes.add(binder.route.slots.join('.'));
  }else g.children[node].forEach((child,slot)=>{
   if(reachable[child])stack.push({node:child,slots:slots.concat(slot)});
  });
 }
 for(const [row,v] of owners){
  const model=binderCopies(g,v.reference);
  if(process.argv.includes('--profile')){
   const reached=new Set(),pending=[root];
   while(pending.length){
    const n=pending.pop();
    if(n<=row||reached.has(n))continue;
    reached.add(n);
    for(const child of g.children[n])pending.push(child);
   }
   work.push({span:root-row,visited:reached.size});
  }
  assert.deepEqual(model.select(model.rank).reference,v.reference);
  assert.throws(()=>model.select(model.total),RangeError);
  // DFS above visits the higher child first. Reverse the insertion order for lower-child-first rank.
  const routes=[...v.routes].reverse();
  assert.equal(model.total,BigInt(routes.length));
  routes.forEach((slots,i)=>{
   const hit=model.select(BigInt(i));
   assert.equal(hit.binder.node,row);assert.equal(hit.binder.route.slots.join('.'),slots);
   assert.equal(A.walk(g,hit.reference.route),v.reference.node);
   assert.deepEqual(A.binding(g,hit.reference.route),hit.binder);
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


// A single lambda row is reached by 2^128 distinct paths in this small compiled-shaped DAG.
const stress={roots:[null,130],kind:[0,3,6],children:[[],[],[1,0]],payloads:[{index:0},{},{binderName:'x'}]};
for(let n=3;n<=130;n++){stress.kind[n]=5;stress.children[n]=[n-1,n-1];stress.payloads[n]={};}
const last={node:0,route:{root:1,slots:Array(129).fill(1)}};
const model=binderCopies(stress,last);
assert.equal(model.total,2n**128n);assert.equal(model.rank,model.total-1n);
for(const rank of [0n,1n,2n**97n+13n,model.rank]){
 const hit=model.select(rank);
 assert.deepEqual(hit.binder.route.slots,[...rank.toString(2).padStart(128,'0')].map(Number));
 assert.deepEqual(A.binding(stress,hit.reference.route),hit.binder);
}

// Place a large disjoint tree between the shared proof and its new root in topological order.
const sparse={kind:stress.kind.slice(),children:stress.children.slice(),payloads:stress.payloads.slice()};
let layer=[];
for(let i=0;i<100002;i++){
 layer.push(sparse.kind.length);sparse.kind.push(9);sparse.children.push([]);sparse.payloads.push({literalKind:'natVal',value:String(i)});
}
while(layer.length>1){
 const next=[];
 for(let i=0;i<layer.length;i+=2){
  if(i+1===layer.length){next.push(layer[i]);continue;}
  next.push(sparse.kind.length);sparse.kind.push(5);sparse.children.push([layer[i],layer[i+1]]);sparse.payloads.push({});
 }
 layer=next;
}
const root=sparse.kind.length;sparse.roots=[layer[0],root];
sparse.kind.push(5);sparse.children.push([130,130]);sparse.payloads.push({});
const sparseSite={node:0,route:{root:1,slots:[1,...last.route.slots]}};
const large=binderCopies(sparse,sparseSite);
assert.equal(large.visited,129);assert.equal(large.total,2n**129n);
assert.deepEqual(large.select(large.rank).reference,sparseSite);
for(const rank of [0n,(1n<<128n)+137n,large.total-1n]){
 const hit=large.select(rank);
 assert.deepEqual(hit.binder.route.slots,[...rank.toString(2).padStart(129,'0')].map(Number));
 assert.deepEqual(A.binding(sparse,hit.reference.route),hit.binder);
}
sparse.children[root]=[layer[0],130];
assert.equal(binderCopies(sparse,sparseSite),null);
const span=work.reduce((a,x)=>a+x.span,0),visited=work.reduce((a,x)=>a+x.visited,0);
const profile={results,work:{queries:work.length,span,visited},synthetic:{span:root-2,visited:large.visited,total:large.total}};
console.log(JSON.stringify(process.argv.includes('--profile')?profile:results,(_,v)=>typeof v==='bigint'?String(v):v,2));
