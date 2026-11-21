'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),z=require('node:zlib'),crypto=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data');
const {nestedStarts,outline,layers}=require('../../../public/js/proof-atlas-local-outline');
global.window={};require('../../../public/data/proof-atlas/goedel-sample-manifest');
const results=[];
for(const d of window.PROOF_ATLAS_AI_SAMPLE.edition.declarations.filter(d=>d.kind==='theorem'&&d.bodyAvailable)){
 const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.indexSha256);
 const g=A.validateIndex(JSON.parse(raw),d),{entries,truncated}=nestedStarts(g),examples=[];
 for(const entry of entries){
  assert.equal(A.walk(g,entry.route),entry.node);
  const m=outline(g,entry);assert(m.steps.length>=1);assert.deepEqual(m.steps[0].binder,entry);
  for(const step of m.steps)for(const at of [step.binder,step.type,step.value])assert.equal(A.walk(g,at.route),at.node);
  const rows=m.steps.length>=2 && m.steps.length<=8?layers(g,m):null;
  for(const item of rows?.flat()||[])for(const edge of item.edges)assert.deepEqual(A.binding(g,edge.use.route),edge.source.binder);
  examples.push({entry,length:m.steps.length,levels:rows?.length??null});
 }
 const allLets=A.reachable(g,g.roots[1]).filter(n=>g.kind[n]===8);
 const leading=new Set(outline(g)?.steps.map(s=>s.binder.node)||[]);
 results.push({proof:d.name,rootSequence:!!outline(g),allLetRows:allLets.length,
  outsideLeading:allLets.filter(n=>!leading.has(n)).length,truncated,examples});
}
console.log(JSON.stringify(results,null,2));
