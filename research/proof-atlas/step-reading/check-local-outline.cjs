'use strict';
const fs=require('node:fs'),z=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const A=require('../../../public/js/proof-atlas-library-data');
const {outline,inputs}=require('../../../public/js/proof-atlas-local-outline');
const ranked=require('./ranked-binder-uses.cjs');
global.window={};require('../../../public/data/proof-atlas/library-manifest');require('../../../public/data/proof-atlas/goedel-sample-manifest');
const ai=window.PROOF_ATLAS_AI_SAMPLE.edition;
for(const edition of [...window.PROOF_ATLAS_LIBRARY.editions,ai]){
 const rows=edition.declarations.filter(d=>edition===ai?d.kind==='theorem'&&d.bodyAvailable:d.name==='JacobiData.slope_bound_abs');
 let matched=0,edges=0,limited=0,unknown=0,pairs=0;
 for(const d of rows){
  const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
  assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.indexSha256);
  const g=A.validateIndex(JSON.parse(raw),d),m=outline(g);if(!m)continue;
  matched++;if(m.limited)limited++;
  for(let i=0;i<=m.steps.length;i++){
   const here=m.steps[i]?.value||m.end,found=inputs(g,m,i);
   for(const edge of found){
    if(edge.unavailable){unknown++;continue;}
    edges++;
    assert.equal(A.walk(g,edge.use.route),edge.use.node);
    assert.deepEqual(A.binding(g,edge.use.route),edge.source.binder);
   }
   for(const step of m.steps.slice(0,i)){
     pairs++;
     const all=ranked(g,step.binder.route),prefix=here.route.slots.join('');let count=0;
     for(let k=0n;k<all.total;k++)if(all.select(k).route.slots.join('').startsWith(prefix))count++;
     const edge=found.find(e=>e.source===step);
     assert(!edge?.unavailable);assert.equal(Number(edge?.count||0),count);
   }
  }
 }
 console.log(edition.id,{declarations:rows.length,matched,pairs,edges,limited,unknown});
}
