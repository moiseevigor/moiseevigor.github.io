'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {gunzipSync}=require('node:zlib'),{createHash}=require('node:crypto');
const match=require('../../../public/js/proof-atlas-conjunction');
const A=require('../../../public/js/proof-atlas-library-data');
global.window={};
require('../../../public/data/proof-atlas/goedel-sample-manifest');
require('../../../public/data/proof-atlas/library-manifest');
function read(d){
 const raw=gunzipSync(fs.readFileSync('.'+d.indexFile));
 assert.equal(createHash('sha256').update(raw).digest('hex'),d.indexSha256);
 return A.validateIndex(JSON.parse(raw),d);
}
const counts={introduction:0,rewrite:0};
for(const d of window.PROOF_ATLAS_AI_SAMPLE.edition.declarations.filter(d=>d.kind==='theorem'&&d.bodyAvailable)){
 const g=read(d),pending=[g.roots[1]],seen=new Set();
 while(pending.length){
  const i=pending.pop();
  if(seen.has(i))continue;
  seen.add(i);pending.push(...g.children[i]);
  const m=match(g,i);
  if(m){
   counts[m.kind]++;
   assert.equal(d.name,'lean_workbook_plus_68616');
   assert.deepEqual([i,...[m.left,m.right].map(slots=>slots.reduce((j,s)=>g.children[j][s],i))],[357,346,353]);
  }
 }
}
assert.deepEqual(counts,{introduction:0,rewrite:1});
const edition=window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15');
const g=read(edition.declarations.find(d=>d.name==='CrossingData.branch_range'));
const pair=match(g,1672);
assert.equal(pair.kind,'introduction');
assert.deepEqual([pair.left,pair.right].map(slots=>slots.reduce((j,s)=>g.children[j][s],1672)),[1485,1671]);
console.log('20 AI proof bodies, both occurrence patterns and four evidence links checked.');
