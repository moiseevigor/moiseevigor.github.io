/* A lexical boundary of one selected expression occurrence; no type inference. */
'use strict';
const assert=require('assert/strict'),A=require('../../../public/js/proof-atlas-library-data');
const binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
const integer=s=>typeof s==='string'&&s.length<=4096&&/^(0|[1-9]\d*)$/.test(s);
function validate(summary,expanded,neededScope){
 assert(Array.isArray(summary)&&summary.length===2&&integer(summary[0]));
 assert(Array.isArray(summary[1])&&summary[1].length<=512);
 let last=-1,total=BigInt(summary[0]);
 for(const pair of summary[1]){assert(Array.isArray(pair)&&pair.length===2);const[index,count]=pair;assert(Number.isSafeInteger(index)&&index>=0&&index>last&&index<512);assert(integer(count)&&BigInt(count)>0n);last=index;total+=BigInt(count);}
 assert.equal(last+1,neededScope);assert(total<=BigInt(expanded));return true;
}
// Check the defining recurrence from serialized child coefficients, separately
// from the recursive sparse counter used by the producer.
function recurrence(g,node,rows){
 const k=g.kind[node],free=new Map();let local=0n;
 if(k===0)free.set(g.payloads[node].index,1n);
 g.children[node].forEach((child,slot)=>{
  const row=rows[child];local+=BigInt(row[0]);
  for(const[index,count]of row[1]){
   const value=BigInt(count);
   if(binds(k,slot)&&index===0)local+=value;
   else{const target=index-Number(binds(k,slot));free.set(target,(free.get(target)||0n)+value);}
  }
 });
 return[String(local),[...free].sort((a,b)=>a[0]-b[0]).map(([i,n])=>[i,String(n)])];
}
function boundary(g,root,slots,summary,page=0){
 assert(Array.isArray(slots)&&slots.length<=512&&slots.every(s=>Number.isInteger(s)&&s>=0&&s<3));
 assert(Number.isSafeInteger(root)&&root>=0&&root<g.kind.length);const context=[];let node=root;
 for(let depth=0;depth<slots.length;depth++){const slot=slots[depth];assert(slot<g.children[node].length);if(binds(g.kind[node],slot))context.push({node,depth});node=g.children[node][slot];}
 validate(summary,g.expanded[node],g.neededScope[node]);
 assert(Number.isSafeInteger(page)&&page>=0&&page<=Math.max(0,Math.ceil(summary[1].length/4)-1));
 const ports=summary[1].slice(page*4,page*4+4).map(([index,count])=>{const binder=context[context.length-1-index];assert(binder,'expression context incomplete');return{index,count,binder:binder.node,slots:slots.slice(0,binder.depth)};});
 return{node,slots:[...slots],contextDepth:context.length,occurrences:g.expanded[node],localReferences:summary[0],externalReferences:String(summary[1].reduce((n,p)=>n+BigInt(p[1]),0n)),portCount:summary[1].length,page,pages:Math.ceil(summary[1].length/4),ports};
}
module.exports={validate,recurrence,boundary,binds};
