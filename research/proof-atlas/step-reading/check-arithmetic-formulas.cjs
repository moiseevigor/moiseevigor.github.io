'use strict';
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const {formula}=require('../../../public/js/proof-atlas-arithmetic');
const ports=require('./distinct-call-ports.cjs');
global.window={};require('../../../public/data/proof-atlas/goedel-sample-manifest');
const names=['HPow.hPow','HMul.hMul','HSub.hSub','HAdd.hAdd'],counts={},examples={};
let absent=0,nested=0;
for(const d of window.PROOF_ATLAS_AI_SAMPLE.edition.declarations.filter(d=>d.kind==='theorem'&&d.bodyAvailable)){
 const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.indexSha256);
 const g=A.validateIndex(JSON.parse(raw),d),seen=new Set();
 for(const p of ports(g,Infinity).routes){
  if(seen.has(p.callNode))continue;
  seen.add(p.callNode);
  const at={node:p.callNode,route:{root:1,slots:p.slots.slice(0,p.callLength)}};
  const tree=formula(g,at),s=spine(g,at.node),name=g.payloads[s.head].name;
  if(!names.includes(name)||s.args.length!==6){assert.equal(tree,null);absent++;continue;}
  counts[name]=(counts[name]||0)+1;
  function check(t){
   assert.equal(A.walk(g,t.site.route),t.site.node);
   if(!t.symbol)return;
   const s=spine(g,t.site.node);
   assert.equal(A.walk(g,t.head.route),s.head);
   const inputs=[...t.parameters,t.left.site,t.right.site];
   inputs.forEach((input,i)=>{
    assert.equal(A.walk(g,input.route),s.args[i]);
    assert.deepEqual(input.route.slots,t.site.route.slots.concat(Array(5-i).fill(0),1));
   });
   check(t.left);check(t.right);
  }
  check(tree);
  if(tree.left.symbol||tree.right.symbol)nested++;
  const type=tree.right.label?.startsWith('Nat.rawCast(')?'cast':tree.right.label?.startsWith('OfNat.ofNat(')?'ofNat':
   (tree.left.symbol||tree.right.symbol)?'nested':name;
  examples[type]??={proof:d.name,at};
 }
}
console.log(JSON.stringify({counts,absent,nested,examples},null,2));
