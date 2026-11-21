'use strict';
const fs=require('node:fs'),z=require('node:zlib'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data'),N=require('../../../public/js/proof-atlas-type-notation');
const {inspect}=require('../../../public/js/proof-atlas-omitted-references');
const window={};
for(const f of ['type-notation-catalog','library-manifest','goedel-sample-manifest','recursion-examples-manifest'])
 vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+f+'.js','utf8'),{window});
const catalog=window.PROOF_ATLAS_TYPE_NOTATION;
function audit(record){
 const bytes=z.gunzipSync(fs.readFileSync('.'+record.indexFile));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),record.indexSha256);
 const data=A.validateIndex(JSON.parse(bytes),record),root=data.roots[1],counts=[];
 for(let i=0;i<=root;i++)counts.push(data.children[i].reduce((s,c)=>s+counts[c],BigInt(data.kind[i]===0)));
 // Compute the first reference ordinal in any subtree by summing preceding siblings.
 function interval(slots){
  let node=root,first=1n;const binders=[];
  for(const [depth,slot] of slots.entries()){
   const cs=data.children[node];
   for(const sibling of cs.slice(0,slot))first+=counts[sibling];
   if(((data.kind[node]===6||data.kind[node]===7)&&slot===1)||(data.kind[node]===8&&slot===2))
    binders.push({node,route:{root:1,slots:slots.slice(0,depth)}});
   node=cs[slot];
  }
  return {node,first,count:counts[node],binders};
 }
 const visible=[];
 function collect(term){
  if(term.kind==='reference')visible.push(interval(term.slots));
  term.children.forEach(c=>collect(c.value));
 }
 collect(N.scene(data,root,catalog,{address:(node,slots)=>({namespace:'source',node,route:{root:1,slots}})}).root);
 const intervals=[...visible],hidden={notation:0n,collapsed:0n};let tested=0;
 const groups=inspect(data,catalog,1);
 for(const g of groups){
  const region=interval(g.operand.route.slots);
  assert.equal(region.node,g.operand.node);assert.equal(region.count,g.total);
  intervals.push(region);hidden[g.kind]+=g.total;
  const ordinals=g.total<=512n?Array.from({length:Number(g.total)},(_,i)=>BigInt(i+1)):
   [...new Set([1n,2n,g.total/2n,g.total-1n,g.total,...(g.total>2n**53n?[2n**53n,2n**53n+1n]:[])])];
  for(const n of ordinals){
   const {use,binder}=g.select(n),selected=interval(use.route.slots);
   assert.equal(use.route.root,1);assert.equal(selected.node,use.node);assert.equal(data.kind[use.node],0);
   assert.equal(selected.first,region.first+n-1n);
   assert.deepEqual(binder,selected.binders.at(-1-data.payloads[use.node].index));tested++;
  }
 }
 intervals.sort((a,b)=>a.first<b.first?-1:a.first>b.first?1:0);
 let next=1n;
 for(const hit of intervals){assert.equal(hit.first,next);next+=hit.count;}
 assert.equal(next-1n,counts[root]);
 return {name:record.name,source:record.indexSha256,total:String(counts[root]),visible:visible.length,
  omittedOperands:String(hidden.notation),collapsed:String(hidden.collapsed),groups:groups.length,tested};
}
const ai=window.PROOF_ATLAS_AI_SAMPLE.edition.declarations;
const riccati=window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15').declarations.find(r=>r.name==='JacobiData.slope_bound_abs');
const large=window.PROOF_ATLAS_RECURSION_EXAMPLES.edition.declarations.find(r=>r.name==='AtlasExamples.shared_induction_64');
console.log(JSON.stringify({ai:ai.map(audit),riccati:audit(riccati),large:audit(large)},null,2));
