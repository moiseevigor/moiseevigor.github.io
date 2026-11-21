// Enumerate these four finite branch bodies without using ordinal counts.
'use strict';
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const html=fs.readFileSync(__dirname+'/inferences.html','utf8');
const finals=JSON.parse(html.match(/^const finalApplications=(.*);$/m)[1]);
let branches=0,uses=0;
for(const [hash,f] of Object.entries(finals)){
 if(!f.cases?.checked)continue;
 const {record}=inventory().find(i=>i.record.indexSha256===hash);
 const bytes=z.gunzipSync(fs.readFileSync('.'+record.indexFile));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
 const d=atlas.validateIndex(JSON.parse(bytes),record);
 for(const branch of f.cases.branches){
  branches++;
  for(const u of branch.assumptionUses){
   const counts=u.parts.map(()=>0),firsts=u.parts.map(()=>null);
   const stack=[branch.body];
   while(stack.length){
    const hit=stack.pop();
    if(d.kind[hit.node]===0){
     const binder=atlas.binding(d,hit.route);
     if(binder.node===u.binder.node && String(binder.route.slots)===String(u.binder.route.slots)){
      const matching=u.parts.filter(p=>p.anchor.route.slots.every((v,i)=>hit.route.slots[i]===v));
      assert.equal(matching.length,1);
      const slot=matching[0].slot;
      const sample=matching[0].examples[counts[slot]];
      if(counts[slot]<8){
       assert.deepEqual(sample.use,hit);
       const c=sample.consumer;
       if(c){
        let at=c.call.node,route=c.call.route.slots.slice(),args=[];
        assert.equal(atlas.walk(d,c.call.route),at);
        if(route.length>branch.body.route.slots.length){
         const parent={root:1,slots:route.slice(0,-1)};
         assert(route.at(-1)!==0 || d.kind[atlas.walk(d,parent)]!==5);
        }
        while(d.kind[at]===5){
         args.unshift({node:d.children[at][1],route:{root:1,slots:route.concat(1)}});
         at=d.children[at][0];route.push(0);
        }
        assert.equal(args.length,c.arity);
        assert.deepEqual(args[c.slot-1],hit);
        assert.equal(at,c.head.node);assert.deepEqual(route,c.head.route.slots);
        assert.equal(d.payloads[at].name,c.head.label);
       }else{
        const parent={root:1,slots:hit.route.slots.slice(0,-1)};
        assert(hit.route.slots.at(-1)!==1 || d.kind[atlas.walk(d,parent)]!==5);
       }
      }
      counts[slot]++;firsts[slot]??=hit;
     }
    }
    for(let j=d.children[hit.node].length-1;j>=0;j--)stack.push({node:d.children[hit.node][j],route:{root:1,slots:hit.route.slots.concat(j)}});
   }
   assert.deepEqual(counts.map(String),u.parts.map(p=>p.count));
   assert.deepEqual(firsts,u.parts.map(p=>p.first));
   assert.equal(String(counts.reduce((a,b)=>a+b,0)),u.total);
   uses+=Number(u.total);
  }
 }
}
assert.equal(branches,4);
console.log(branches+' branches, '+uses+' references independently verified');
