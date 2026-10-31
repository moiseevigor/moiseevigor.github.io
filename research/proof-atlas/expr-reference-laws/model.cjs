/* Independent shared-graph implementation. No Lean evaluator or type inference. */
'use strict';
const assert=require('assert/strict'),F=require('../binder-computation-exchange/model.cjs');
const binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
function transform(g,root,operation,{amount=0,cutoff=0,depth=0,value=null}={}){
 assert(['lift','swap','substitute'].includes(operation));
 for(const n of[amount,cutoff,depth])assert(Number.isSafeInteger(n)&&n>=0&&n<=512,'reference transform bound');
 if(operation==='substitute')assert(Number.isInteger(value)&&value>=0&&value<g.kind.length);
 const t=F.table(),memo=new Map(),copies=new Map();
 function shifted(node,by,local=0){const key=node+':'+by+':'+local;if(copies.has(key))return copies.get(key);assert(copies.size<262144);const k=g.kind[node],p=k===0&&g.payloads[node].index>=local?{index:g.payloads[node].index+by}:g.payloads[node],result=t.add(k,p,g.children[node].map((c,s)=>shifted(c,by,local+Number(binds(k,s)))));copies.set(key,result);return result;}
 function visit(node,local=0){const key=node+':'+local;if(memo.has(key))return memo.get(key);assert(memo.size<262144&&local<=512,'reference transform work bound');const k=g.kind[node];let result;
  if(k===0){const i=g.payloads[node].index,d=depth+local;let index=i;
   if(operation==='lift')index=i>=cutoff+local?i+amount:i;
   if(operation==='swap')index=i===d?d+1:i===d+1?d:i;
   if(operation==='substitute'&&i===d)result=shifted(value,d);
   else {if(operation==='substitute'&&i>d)index=i-1;result=t.add(0,{index});}
  }else result=t.add(k,g.payloads[node],g.children[node].map((c,s)=>visit(c,local+Number(binds(k,s)))));
  memo.set(key,result);return result;
 }
 t.g.roots=[visit(root)];return t.g;
}
module.exports={transform};
