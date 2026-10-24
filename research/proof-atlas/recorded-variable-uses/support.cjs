/* Counts compiled syntax uses, not mathematical necessity or native typing. */
'use strict';
const path=require('path'),P=require(path.resolve(__dirname,'../../../public/js/proof-atlas-packed-routes'));
const maskCache=new WeakMap();
// A 64-residue support mask is a conservative set of possible free indices.
// Removing index zero is safe when neededScope <=64. For larger scopes keep
// residue zero before rotating: index64 might still occur. False positives only.
function supportMasks(data){
 if(maskCache.has(data))return maskCache.get(data);
 const masks=[];
 for(let node=0;node<data.kind.length;node++){
  const scope=data.neededScope[node],kind=data.kind[node];let mask=0n;
  if(scope){
   if(kind===0)mask=1n<<BigInt(data.payloads[node].index%64);
   else data.children[node].forEach((child,slot)=>{
    let part=masks[child];
    if([6,7].includes(kind)&&slot===1||kind===8&&slot===2){if(data.neededScope[child]<=64)part&=~1n;part=(part>>1n)|((part&1n)<<63n);}
    mask|=part;
   });
   if(scope<64)mask&=(1n<<BigInt(scope))-1n;
  }
  masks.push(mask);
 }
 maskCache.set(data,masks);return masks;
}
function count(data,route,{maxStates=65536,scopePruning=true,residuePruning=true}={}){
 if(!Number.isSafeInteger(maxStates)||maxStates<1||maxStates>65536)throw Error('Binder use count: state bound');
 const selected=P.resolve(data,route),kind=data.kind[selected.node],bodySlot=kind===8?2:1;
 if(![6,7,8].includes(kind))throw Error('Binder use count: original binder required');
 const root=data.children[selected.node][bodySlot],memo=new Map(),seen=new Set(),todo=[[root,0,false]],masks=residuePruning?supportMasks(data):null;let pruned=0;
 const key=(id,index)=>id+':'+index;
 while(todo.length){
  const[node,index,ready]=todo.pop(),k=key(node,index);if(memo.has(k))continue;
  if(!seen.has(k)){if(seen.size===maxStates)return{status:'unavailable',reason:'state-bound',states:seen.size,count:null};seen.add(k);}
  if(scopePruning&&data.neededScope[node]<=index||masks&&!(masks[node]&(1n<<BigInt(index%64)))){memo.set(k,0n);pruned++;continue;}
  const kind=data.kind[node],children=data.children[node];
  if(kind===0){memo.set(k,data.payloads[node].index===index?1n:0n);continue;}
  const parts=children.map((child,slot)=>[child,index+(([6,7].includes(kind)&&slot===1||kind===8&&slot===2)?1:0)]);
  if(ready){memo.set(k,parts.reduce((n,[child,next])=>n+memo.get(key(child,next)),0n));continue;}
  todo.push([node,index,true]);for(const[child,next]of parts)if(!memo.has(key(child,next)))todo.push([child,next,false]);
 }
 return{status:'complete',count:String(memo.get(key(root,0))),states:seen.size,pruned,sourceBinder:route,sourceNode:selected.node,bodyRoot:root,scope:'Exact expanded bound-variable occurrence count in the original body, conditional on validated compiled syntax/scope metadata. This counts syntax, not typed observations or necessary assumptions.'};
}
module.exports={count};
