'use strict';
const fs=require('node:fs'),z=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const A=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const {arithmeticInference}=require('../../../public/js/proof-atlas-arithmetic');
global.window={};require('../../../public/data/proof-atlas/goedel-sample-manifest');
const edition=window.PROOF_ATLAS_AI_SAMPLE.edition;
const report=fs.readFileSync(0,'utf8').trim().split('\n').map(line=>JSON.parse(line)).find(x=>x.edition===edition.id);
const frontier={},rules={},roots=report.aiArithmetic;
const added=new Set(['mul_eq','add_nonpos','le_of_le_of_eq','sub_nonpos_of_le','sub_neg_of_lt']);
const baseline=process.argv.includes('--baseline');
let uniqueSteps=0;
let steps=0,leaves=0,maxDepth=0,longest;
for(const d of edition.declarations){
 const selected=roots.filter(r=>r.proof===d.name);
 if(!selected.length)continue;
 const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.indexSha256);
 const g=A.validateIndex(JSON.parse(raw),d);
 const distinct=new Set();
 for(const {premise} of selected){
  const todo=[{site:premise,depth:0,parent:null}];
  while(todo.length){
   const item=todo.pop(),{site,depth}=item;
   assert.equal(A.walk(g,site.route),site.node);
   const s=spine(g,site.node),name=g.payloads[s.head]?.name||A.kinds[g.kind[s.head]];
   const rule=arithmeticInference(g,site);
   if(!rule || (baseline && added.has(rule.name.split('.').at(-1)))){frontier[name]=(frontier[name]||0)+1;leaves++;
    if(!longest || depth>longest.depth){
     const path=[];
     for(let p=item;p;p=p.parent)path.push(p.site);
     longest={proof:d.name,depth,path:path.reverse()};
    }
    continue;}
   distinct.add(site.node);
   rules[name]=(rules[name]||0)+1;steps++;maxDepth=Math.max(maxDepth,depth+1);
   rule.proofs.forEach((child,i)=>{
    const offset=rule.proofs.length-i;
    assert.deepEqual(child.route.slots,site.route.slots.concat(Array(offset-1).fill(0),1));
    assert.equal(child.node,s.args.at(-offset));
    todo.push({site:child,depth:depth+1,parent:item});
   });
  }
 }
 uniqueSteps+=distinct.size;
}
assert.equal(longest.depth,maxDepth);
console.log(JSON.stringify({uniqueSteps,roots:roots.length,steps,leaves,maxDepth,rules,frontier,longest},null,2));
