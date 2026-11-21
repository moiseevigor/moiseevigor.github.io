'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {gunzipSync}=require('node:zlib'),{createHash}=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const {countReferences}=require('../../../public/js/proof-atlas-recursive-inputs');
global.window={};
require('../../../public/data/proof-atlas/library-manifest');
require('../../../public/data/proof-atlas/goedel-sample-manifest');
const budget={maxStates:8192,maxDepth:512,useSupport:false};
for(const e of [...window.PROOF_ATLAS_LIBRARY.editions,window.PROOF_ATLAS_AI_SAMPLE.edition]){
 const counts={zero:0,one:0,multiple:0,unavailable:0};
 const overflow=[];
 for(const d of e.declarations.filter(x=>x.kind==='theorem'&&x.bodyAvailable)){
  const raw=gunzipSync(fs.readFileSync('.'+d.indexFile));
  assert.equal(createHash('sha256').update(raw).digest('hex'),d.indexSha256);
  const g=A.validateIndex(JSON.parse(raw),d),seen=new Set();
  function walk(i,path){
   if(seen.has(i))return;
   seen.add(i);
   const {head,args}=spine(g,i),name=g.payloads[head]?.name;
   const either=name==='Or.casesOn'&&args.length===6;
   if(either || name==='And.casesOn'&&args.length===5){
    for(let j=4;j<args.length;j++){
     let body=args[j],bodyPath=path.concat(Array(args.length-j-1).fill(0),1);
     const binders=[];
     for(let b=0;b<(either?1:2);b++){
      assert.equal(g.kind[body],6);
      binders.push(bodyPath);body=g.children[body][1];bodyPath=bodyPath.concat(1);
     }
     for(const [k,binder] of binders.entries()){
      const index=binders.length-1-k,result=countReferences(g,body,index,budget);
      // Independent expanded traversal comparing lexical indices at each leaf.
      function tally(id,depth){
       if(g.kind[id]===0)return BigInt(g.payloads[id].index===index+depth);
       return g.children[id].reduce((sum,c,s)=>sum+tally(c,depth+Number(
        (g.kind[id]===6||g.kind[id]===7)&&s===1||g.kind[id]===8&&s===2)),0n);
      }
      const n=tally(body,0);
      if(result.status!=='counted'){
       counts.unavailable++;overflow.push(n.toString());continue;
      }
      assert.equal(BigInt(result.occurrences),n);
      counts[n===0n?'zero':n===1n?'one':'multiple']++;
      if(n){
       const {witness}=countReferences(g,body,index,{...budget,ordinal:1n});
       const route={root:1,slots:bodyPath.concat(witness.slots)};
       assert.deepEqual(A.binding(g,route).route.slots,binder);
      }
     }
    }
   }
   g.children[i].forEach((c,s)=>walk(c,path.concat(s)));
  }
  walk(g.roots[1],[]);
 }
 console.log(e.id,counts,{offlineCountsForUnavailable:overflow});
}
