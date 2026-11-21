'use strict';
const fs=require('node:fs'),z=require('node:zlib'),vm=require('node:vm'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data'),N=require('../../../public/js/proof-atlas-type-notation');
const {inspect,applicationAtUse}=require('../../../public/js/proof-atlas-omitted-references');
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
 let outsideTotal=0n,externalChecks=0;
 const scopeCounts=[];
 const rareUses=[],checkedUses=new Set();
 function checkCall(use){
  const app=applicationAtUse(data,use);
  const slots=use.route.slots,parent={root:1,slots:slots.slice(0,-1)};
  const applicable=slots.length>0&&data.kind[A.walk(data,parent)]===5;
  assert.equal(Boolean(app),applicable);
  if(app){
   const {call,head,slot,arity}=app;
   const port=require('../../../public/js/proof-atlas-application-ports').sourceInput(data,call,slot);
   assert.deepEqual(port.route,use.route);assert.equal(port.node,use.node);
   assert.equal(A.walk(data,head.route),head.node);assert(data.kind[head.node]!==5);
   assert.equal(A.walk(data,call.route),call.node);
   assert.equal(head.route.slots.length-call.route.slots.length,arity);
   for(const peer of app.peers){
    const supplied=require('../../../public/js/proof-atlas-application-ports').sourceInput(data,call,peer.slot);
    assert.deepEqual(peer.use,supplied);
    assert.deepEqual(peer.binder,interval(supplied.route.slots).binders.at(-1-data.payloads[supplied.node].index));
   }
   if(call.route.slots.at(-1)===0)
    assert(data.kind[A.walk(data,{root:1,slots:call.route.slots.slice(0,-1)})]!==5);
  }
  checkedUses.add(slots.join('.'));
  return app;
 }
 const groups=inspect(data,catalog,1);
 for(const g of groups){
  const region=interval(g.operand.route.slots);
  assert.equal(region.node,g.operand.node);assert.equal(region.count,g.total);
  const inputs=require('./lexical-inputs.cjs')(data,g.operand);
  assert(inputs);
  const outside=inputs.reduce((sum,r)=>sum+BigInt(r.count),0n);
  assert.equal(g.externalTotal(),outside);outsideTotal+=outside;
  const named=g.inputs();assert.equal(inputs.length,named.length);
  for(const item of named){
   const oracle=inputs.find(r=>r.binder.node===item.binder.node&&String(r.binder.route.slots)===String(item.binder.route.slots));
   assert(oracle);assert.equal(String(item.count),oracle.count);
   for(const n of new Set([1n,item.count])){
    const ref=g.select(n,true,item.index);
    assert.deepEqual(ref.binder,{node:oracle.binder.node,route:oracle.binder.route});
    if(n===1n)assert.deepEqual(ref.use.route,oracle.use.route);
   }
  }
  if(record.name==='JacobiData.slope_bound_abs'){
   for(const item of named){
    if(item.count>10n)continue;
    const payload=data.payloads[item.binder.node];
    for(let n=1n;n<=item.count;n++){
     const {use}=g.select(n,true,item.index),app=checkCall(use);
     rareUses.push({name:payload.binderName??payload.declName,binder:item.binder.route,use:use.route,
      ...(app?{head:app.label,slot:app.slot,arity:app.arity,call:app.call}: {})});
    }
   }
  }
  scopeCounts.push({total:String(g.total),outside:String(outside),binders:inputs.map(r=>({name:r.name,count:r.count}))});
  const expected=[];
  if(g.total<=5000n){
   for(let n=1n;n<=g.total;n++){
    const ref=g.select(n);checkCall(ref.use);
    if(ref.binder.route.slots.length<g.operand.route.slots.length)expected.push(ref);
   }
   assert.equal(BigInt(expected.length),outside);
   expected.forEach((ref,j)=>{assert.deepEqual(g.select(BigInt(j+1),true),ref);externalChecks++;});
   for(const item of named){
    const uses=expected.filter(ref=>String(ref.binder.route.slots)===String(item.binder.route.slots));
    assert.equal(BigInt(uses.length),item.count);
    uses.forEach((ref,j)=>assert.deepEqual(g.select(BigInt(j+1),true,item.index),ref));
   }
  }else if(outside){
   for(const n of new Set([1n,(outside+1n)/2n,outside])){
    const ref=g.select(n,true),hit=interval(ref.use.route.slots);
    assert.deepEqual(ref.binder,hit.binders.at(-1-data.payloads[hit.node].index));
    assert(ref.binder.route.slots.length<g.operand.route.slots.length);externalChecks++;
   }
  }
  intervals.push(region);hidden[g.kind]+=g.total;
  const ordinals=g.total<=512n?Array.from({length:Number(g.total)},(_,i)=>BigInt(i+1)):
   [...new Set([1n,2n,g.total/2n,g.total-1n,g.total,...(g.total>2n**53n?[2n**53n,2n**53n+1n]:[])])];
  for(const n of ordinals){
   const {use,binder}=g.select(n),selected=interval(use.route.slots);
   checkCall(use);assert.equal(use.route.root,1);assert.equal(selected.node,use.node);assert.equal(data.kind[use.node],0);
   assert.equal(selected.first,region.first+n-1n);
   assert.deepEqual(binder,selected.binders.at(-1-data.payloads[use.node].index));tested++;
  }
 }
 intervals.sort((a,b)=>a.first<b.first?-1:a.first>b.first?1:0);
 let next=1n;
 for(const hit of intervals){assert.equal(hit.first,next);next+=hit.count;}
 assert.equal(next-1n,counts[root]);
 return {name:record.name,source:record.indexSha256,total:String(counts[root]),visible:visible.length,
  omittedOperands:String(hidden.notation),collapsed:String(hidden.collapsed),groups:groups.length,tested,outside:String(outsideTotal),externalChecks,distinctUsesCheckedForApplication:checkedUses.size,
  ...(record.name==='JacobiData.slope_bound_abs'?{scopeCounts,rareUses}:{})};
}
const ai=window.PROOF_ATLAS_AI_SAMPLE.edition.declarations;
const riccati=window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15').declarations.find(r=>r.name==='JacobiData.slope_bound_abs');
const large=window.PROOF_ATLAS_RECURSION_EXAMPLES.edition.declarations.find(r=>r.name==='AtlasExamples.shared_induction_64');
console.log(JSON.stringify({ai:ai.map(audit),riccati:audit(riccati),large:audit(large)},null,2));
