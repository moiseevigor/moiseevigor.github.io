'use strict';
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const {formula,statement,caption,hypothesisInputs}=require('../../../public/js/proof-atlas-arithmetic');
const ports=require('./distinct-call-ports.cjs');
global.window={};require('../../../public/data/proof-atlas/goedel-sample-manifest');
const arities={'HPow.hPow':6,'HMul.hMul':6,'HSub.hSub':6,'HAdd.hAdd':6,'HDiv.hDiv':6,Eq:3,Ne:3,'LE.le':4,'LT.lt':4,'Real.sqrt':1,abs:4},counts={},examples={};
  function check(g,t){
   assert.equal(A.walk(g,t.site.route),t.site.node);
   if(t.variables){
    const s=spine(g,t.site.node);
    assert.equal(g.payloads[s.head].name,t.label);
    t.variables.forEach((v,i)=>{
     assert.equal(A.walk(g,v.site.route),s.args[i]);
     const b=A.binding(g,v.site.route);assert(b);
     const p=g.payloads[b.node];assert.equal(v.label,p.binderName||p.declName||'e'+v.site.node);
    });
   }
   if(!t.symbol)return;
   const s=spine(g,t.site.node);
   assert.equal(A.walk(g,t.head.route),s.head);
   const inputs=[...t.parameters,t.left.site,...(t.right?[t.right.site]:[])];
   inputs.forEach((input,i)=>{
    assert.equal(A.walk(g,input.route),s.args[i]);
    assert.deepEqual(input.route.slots,t.site.route.slots.concat(Array(s.args.length-1-i).fill(0),1));
   });
   check(g,t.left);if(t.right)check(g,t.right);
  }
let absent=0,nested=0;
const joins=[];
for(const d of window.PROOF_ATLAS_AI_SAMPLE.edition.declarations.filter(d=>d.kind==='theorem'&&d.bodyAvailable)){
 const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.indexSha256);
 const g=A.validateIndex(JSON.parse(raw),d),seen=new Set();
 for(const p of ports(g,Infinity).routes){
  if(seen.has(p.callNode))continue;
  seen.add(p.callNode);
  const at={node:p.callNode,route:{root:1,slots:p.slots.slice(0,p.callLength)}};
  const join=hypothesisInputs(g,at);
  if(join){
   const names=[];
   for(const input of join.inputs){
    assert.equal(A.walk(g,input.binder.domain.route),input.binder.domain.node);
    const c=require('../../../public/js/proof-atlas-omitted-references').applicationAtUse(g,input.site,{includePeers:false});
    assert.deepEqual(c.call.route,at.route);assert.equal(c.slot,input.slot);
    assert.deepEqual(A.binding(g,input.site.route).route,input.binder.proofBinder.route);
    names.push(input.binder.name);
   }
   joins.push({proof:d.name,at,name:join.name,names});
  }
  const tree=formula(g,at),s=spine(g,at.node),name=g.payloads[s.head].name;
  if(s.args.length!==arities[name]){assert.equal(tree,null);absent++;continue;}
  counts[name]=(counts[name]||0)+1;
  check(g,tree);check(g,formula(g,at,6));
  if(tree.left.symbol||tree.right?.symbol)nested++;
  const type=tree.right?.label?.startsWith('Nat.rawCast(')?'cast':tree.right?.label?.startsWith('OfNat.ofNat(')?'ofNat':
   (tree.left.symbol||tree.right?.symbol)?'nested':name;
  examples[type]??={proof:d.name,at};
 }
}
require('../../../public/data/proof-atlas/library-manifest');
const riccati=[];
for(const edition of window.PROOF_ATLAS_LIBRARY.editions){
 const d=edition.declarations.find(d=>d.name==='JacobiData.slope_bound_abs');
 const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.indexSha256);
 const g=A.validateIndex(JSON.parse(raw),d),slots=[];
 let node=g.roots[0];
 while(g.kind[node]===7){slots.push(1);node=g.children[node][1];}
 const at={node,route:{root:0,slots}},t=formula(g,at);
 check(g,t);
 const context=statement(g,{node:g.roots[0],route:{root:0,slots:[]}});
 assert.deepEqual(context.focus,at);
 assert.deepEqual(context.binders.map(b=>b.name),['J','p','hab','hz1','hd','hs']);
 for(const b of context.binders){
  assert.equal(A.walk(g,b.site.route),b.site.node);assert.equal(A.walk(g,b.domain.route),g.children[b.site.node][0]);
  const t=formula(g,b.domain);if(t){check(g,t);assert(caption(t).includes(t.symbol));}
 }
 const sameSign=new Set();
 for(const [k,b] of context.binders.slice(2).entries()){
  assert.equal(A.walk(g,b.proofBinder.route),b.proofBinder.node);
  const refs=require('./ranked-binder-uses.cjs')(g,b.proofBinder.route);
  assert.equal(refs.total,[2n,2n,3n,2n][k]);
  let hits=0;
  for(let i=0n;i<refs.total;i++){
   const site=refs.select(i);
   assert.deepEqual(A.binding(g,site.route).route,b.proofBinder.route);
   const c=require('../../../public/js/proof-atlas-omitted-references').applicationAtUse(g,site,{includePeers:false});
   if(c?.label==='JacobiData.T1_T2_same_sign'){
    assert.equal(c.slot,k+3);sameSign.add(JSON.stringify(c.call.route));hits++;
   }
  }
  assert.equal(hits,1);
 }
 assert.equal(sameSign.size,1);
 const callRoute=JSON.parse([...sameSign][0]),call={node:A.walk(g,callRoute),route:callRoute};
 const receiving=hypothesisInputs(g,call);
 assert.equal(receiving.name,'JacobiData.T1_T2_same_sign');
 assert.deepEqual(receiving.inputs.map(input=>input.slot),[3,4,5,6]);
 for(const [i,input] of receiving.inputs.entries()){
  assert.deepEqual(input.binder,context.binders[i+2]);
  assert.deepEqual(A.binding(g,input.site.route).route,input.binder.proofBinder.route);
  assert.equal(A.walk(g,input.site.route),input.site.node);
 }
 const expanded=formula(g,at,6);check(g,expanded);
 const names=[];
 function inspect(t){if(t.variables)names.push(t.label);if(t.left)inspect(t.left);if(t.right)inspect(t.right);}
 inspect(expanded);
 assert.deepEqual(names,['z','z','Dz','T1','T2','d','s'].map(n=>'JacobiData.'+n));
 assert.deepEqual([t.name,t.left.name,t.left.right.name,t.right.name,t.right.left.name],
  ['LE.le','HMul.hMul','Real.sqrt','abs','HDiv.hDiv']);
 riccati.push({edition:edition.id,proof:d.name,at,call});
}
console.log(JSON.stringify({counts,absent,nested,examples,riccati,joins},null,2));
