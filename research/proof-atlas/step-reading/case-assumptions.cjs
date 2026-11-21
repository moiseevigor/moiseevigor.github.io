'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {gunzipSync}=require('node:zlib'),{createHash}=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const {countReferences}=require('../../../public/js/proof-atlas-recursive-inputs');
global.window={};
require('../../../public/data/proof-atlas/library-manifest');
require('../../../public/data/proof-atlas/goedel-sample-manifest');
const {applicationAtUse}=require('../../../public/js/proof-atlas-omitted-references');
const budget={maxStates:8192,maxDepth:512,useSupport:false};
for(const e of [...window.PROOF_ATLAS_LIBRARY.editions,window.PROOF_ATLAS_AI_SAMPLE.edition]){
 const counts={zero:0,one:0,multiple:0,unavailable:0};
 const destinations={argument:0,fn:0,field:0};
 const overflow=[];
 let peakEntries=0,peakWork=0;
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
      const index=binders.length-1-k;
      const baseline=countReferences(g,body,index,budget);
      const bounded={...budget,maxWork:16384,firstIfPresent:true};
      const result=countReferences(g,body,index,bounded);
      peakEntries=Math.max(peakEntries,result.peakEntries);
      peakWork=Math.max(peakWork,result.states);
      // Independent expanded traversal comparing lexical indices at each leaf.
      let first;
      const relative=[];
      function tally(id,depth){
       if(g.kind[id]===0){
        const hit=g.payloads[id].index===index+depth;
        if(hit && !first)first={node:id,slots:relative.slice()};
        return BigInt(hit);
       }
       let total=0n;
       for(const [slot,child] of g.children[id].entries()){
        const binds=(g.kind[id]===6||g.kind[id]===7)&&slot===1||g.kind[id]===8&&slot===2;
        relative.push(slot);total+=tally(child,depth+Number(binds));relative.pop();
       }
       return total;
      }
      const n=tally(body,0);
      if(result.status!=='counted'){
       counts.unavailable++;continue;
      }
      if(baseline.status!=='counted')overflow.push([d.name,i,path.join(''),n.toString()]);
      assert.equal(BigInt(result.occurrences),n);
      counts[n===0n?'zero':n===1n?'one':'multiple']++;
      assert.deepEqual(result.witness,first);
      if(n){
       const {witness}=result;
       const route={root:1,slots:bodyPath.concat(witness.slots)};
       assert.deepEqual(A.binding(g,route).route.slots,binder);
       const use={node:witness.node,route},receiver=applicationAtUse(g,use,{includePeers:false});
       const parent={root:1,slots:route.slots.slice(0,-1)};
       const parentNode=A.walk(g,parent);
       if(receiver){
        const {call,slot,arity}=receiver;
        const suffix=Array(arity-slot).fill(0);
        if(slot)suffix.push(1);
        assert.deepEqual(call.route.slots.concat(suffix),route.slots);
        assert.equal(A.walk(g,call.route),call.node);
        assert.equal(g.kind[parentNode],5);
        destinations[slot?'argument':'fn']++;
       }else{
        assert.notEqual(g.kind[parentNode],5);
        assert(A.fields[A.kinds[g.kind[parentNode]]][route.slots.at(-1)]);
        destinations.field++;
       }
      }
     }
    }
   }
   g.children[i].forEach((c,s)=>walk(c,path.concat(s)));
  }
  walk(g.roots[1],[]);
 }
 assert.equal(counts.unavailable,0);
 assert(peakEntries<=8192 && peakWork<=16384);
 console.log(e.id,counts,destinations,{recovered:overflow,peakWork,peakEntries});
}
