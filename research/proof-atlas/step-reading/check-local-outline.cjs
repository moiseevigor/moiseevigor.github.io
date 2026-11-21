'use strict';
const fs=require('node:fs'),z=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const A=require('../../../public/js/proof-atlas-library-data');
const {outline,inputs,layers,hypothesisUse}=require('../../../public/js/proof-atlas-local-outline');
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
  const rowsByLevel=layers(g,m);assert(rowsByLevel);
  const F=require('../../../public/js/proof-atlas-arithmetic');
  for(const h of F.statement(g,{node:g.roots[0],route:{root:0,slots:[]}}).binders){
   const f=F.formula(g,h.domain);if(!h.proofBinder||!(f?.relation||f?.logical))continue;
   const all=ranked(g,h.proofBinder.route);
   const paths=[];
   for(let k=0n;k<all.total;k++)paths.push(all.select(k).route.slots.join(''));
   for(const entry of rowsByLevel.flat()){
    const edge=hypothesisUse(g,m,entry.step,h);
    if(edge?.unavailable)continue;
    const prefix=(entry.step?.value||m.end).route.slots.join('');
    const matches=paths.filter(p=>p.startsWith(prefix));
    assert.equal(matches.length,Number(edge?.count||0));
    if(edge)assert.equal(edge.use.route.slots.join(''),matches[0]);
   }
  }
  const depths=new Map();
  rowsByLevel.forEach((row,i)=>row.forEach(entry=>depths.set(entry.step,i)));
  assert.equal(depths.size,m.steps.length+1);
  for(const row of rowsByLevel)for(const entry of row){
   for(const edge of entry.edges)assert(depths.get(edge.source)<depths.get(entry.step));
  }
  for(let i=0;i<=m.steps.length;i++){
   const here=m.steps[i]?.value||m.end,found=inputs(g,m,i);
   for(const edge of found){
    if(edge.unavailable){unknown++;continue;}
    edges++;
    assert.equal(A.walk(g,edge.use.route),edge.use.node);
    assert.deepEqual(A.binding(g,edge.use.route),edge.source.binder);
   }
   if(m.steps[i]){
    const type=m.steps[i].type,record=rowsByLevel.flat().find(r=>r.step===m.steps[i]);
    for(const step of m.steps.slice(0,i)){
     const all=ranked(g,step.binder.route);let count=0;
     for(let k=0n;k<all.total;k++)if(all.select(k).route.slots.join('').startsWith(type.route.slots.join('')))count++;
     assert.equal(Number(record.edges.find(e=>e.source===step && e.field==='type')?.count||0),count);
    }
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
