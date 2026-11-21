// Compare source locations in one compiled proof with its reviewed article anchors.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {gunzipSync}=require('node:zlib');
const {createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const routes=require('../../../public/data/proof-atlas/substitution-routes.json');
const window={};
require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/article-proof-steps.js','utf8'),{window});
const article=window.PROOF_ATLAS_PROOF_STEPS;
const name='JacobiData.slope_bound_abs',edition=article.edition;
const {record}=inventory().find(i=>i.edition===edition && i.record.name===name);
const source=gunzipSync(fs.readFileSync('.'+record.indexFile));
assert.equal(createHash('sha256').update(source).digest('hex'),record.indexSha256);
const data=atlas.validateIndex(JSON.parse(source),record);
const catalog=routes.records.find(r=>r.name===name && r.edition===edition);
for(const identity of [article.packets.find(p=>p.name===name),catalog]){
 assert.equal(identity.indexSha256,record.indexSha256);
 assert.equal(identity.sourceSha256,record.sourceSha256);
}
const witnesses=new Map(catalog.entries.map(([node,slots])=>[slots,node]));
const anchors=article.anchors.filter(a=>a.declaration===name && a.scope==='proof').map(a=>{
 const route=a.path.split('.').slice(2);
 let node=data.roots[1];
 const slots=[];
 for(const field of route){
  const slot=atlas.fields[atlas.kinds[data.kind[node]]].indexOf(field);
  assert(slot>=0);
  slots.push(slot);
  node=data.children[node][slot];
 }
 assert.equal(node,a.node);
 assert.equal(atlas.path(data,{root:1,slots}),a.path);
 return {...a,slots:slots.join(''),inside:0,nearest:0,witnesses:0,enclosingCalls:[]};
}).sort((a,b)=>b.slots.length-a.slots.length);
const matching=new Set();
for(let i=0;i<data.kind.length;i++){
 if(data.kind[i]!==5)continue;
 const {head,args}=spine(data,i);
 if(data.kind[head]===4 && data.payloads[head].name==='congrArg' && args.length===6)matching.add(i);
}
const seen=new Set(),contexts=new Map();
let visited=0,occurrences=0,unmapped=0,exact=0,checkedWitnesses=0;
function visit(node,route){
 visited++;
 if(matching.has(node)){
  occurrences++;
  seen.add(node);
  const inside=anchors.filter(a=>route.startsWith(a.slots));
  for(const a of inside)a.inside++;
  if(!inside.length)unmapped++;
  else inside[0].nearest++;
  if(inside.some(a=>a.slots===route))exact++;
  if(witnesses.has(route)){
   assert.equal(witnesses.get(route),node);
   checkedWitnesses++;
   if(inside.length)inside[0].witnesses++;
  }
  if(!contexts.has(node))contexts.set(node,new Set());
  contexts.get(node).add(inside[0]?.path??null);
  for(const a of anchors){
   if(a.slots.length<=route.length || !a.slots.startsWith(route))continue;
   const relative=a.slots.slice(route.length);
   a.enclosingCalls.push({node,route,field:relative==='1'?'direct equality premise':relative[0]==='1'?'inside equality premise':'inside function spine'});
  }
 }
 data.children[node].forEach((child,index)=>visit(child,route+index));
}
visit(data.roots[1],'');
assert.equal(BigInt(visited),BigInt(data.expanded[data.roots[1]]));
assert.equal(checkedWitnesses,witnesses.size);
assert.deepEqual(seen,new Set(catalog.entries.map(e=>e[0])));
console.log({visited,distinct:seen.size,occurrences,unmapped,exact,multipleContexts:[...contexts.values()].filter(c=>c.size>1).length});
assert.equal(anchors.filter(a=>a.role==='call').length,3);
assert.equal(exact,0);
assert(anchors.filter(a=>a.role==='call').every(a=>a.inside===0));
assert.equal(anchors.find(a=>a.role==='proof').nearest,occurrences);
const product=anchors.find(a=>a.callee==='JacobiData.T1_mul_T2');
assert(product);
assert.deepEqual(product.enclosingCalls.map(c=>[c.node,c.field]),[[951,'direct equality premise']]);
for(const c of product.enclosingCalls.filter(c=>c.field==='direct equality premise')){
 const parent=spine(data,c.node);
 assert.equal(parent.args[5],product.node);
 assert.equal(data.payloads[spine(data,parent.args[5]).head].name,product.callee);
 console.log('Direct product premise at',c.node,'witness listed:',witnesses.get(c.route)===c.node,
  'source route:',c.route);
}
console.table(anchors.map(a=>({step:a.step,anchor:a.node,subtree:Number(data.expanded[a.node]),inside:a.inside,nearest:a.nearest,witnesses:a.witnesses,
 enclosing:a.enclosingCalls.map(c=>c.node+' '+c.field).join(', ')})));
