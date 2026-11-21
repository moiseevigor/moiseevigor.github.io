// Recover receiver occurrences under one binder from a single operand witness.
'use strict';
(function(host){
const common=typeof module!=='undefined' && module.exports;
const A=common?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
function repeatedReceiver(data,binderRoute,receiver,operandSlots,{maxStates=200000,maxDepth=512,completeCall=false}={}){
 const bodySlot=(id)=>[6,7].includes(data.kind[id])?1:data.kind[id]===8?2:-1;
 const binder=A.walk(data,binderRoute),slot=bodySlot(binder);
 if(slot<0)throw Error('Expected a binder');
 let operand=receiver,localDepth=0;
 for(const field of operandSlots){
  if(field===bodySlot(operand))localDepth++;
  operand=data.children[operand][field];
 }
 if(data.kind[operand]!==0)throw Error('Expected a bound-variable operand');
 const depthAtReceiver=data.payloads[operand].index-localDepth;
 const body=data.children[binder][slot],cache=new Map();
 function count(node,depth,level){
  // validateIndex enforces child < parent for every structural edge.
  if(node<receiver || depth>depthAtReceiver)return 0n;
  if(node===receiver)return BigInt(depth===depthAtReceiver);
  const key=node+'/'+depth;
  if(cache.has(key))return cache.get(key);
  if(level>maxDepth)throw RangeError('Receiver query depth limit');
  if(cache.size>=maxStates)throw RangeError('Receiver query state limit');
  cache.set(key,0n);
  let n=0n;
  for(const k of data.children[node].keys()){
   n+=childCount(node,k,depth,level);
  }
  cache.set(key,n);return n;
 }
 function childCount(node,k,depth,level){
  const child=data.children[node][k];
  if(completeCall && child===receiver && data.kind[node]===5 && k===0)return 0n;
  return count(child,depth+Number(k===bodySlot(node)),level+1);
 }
 const total=count(body,0,0);
 function select(rank){
  if(typeof rank!=='bigint'||rank<0n||rank>=total)throw RangeError('Invalid receiver ordinal');
  let node=body,depth=0,level=0;
  const slots=binderRoute.slots.concat(slot);
  while(node!==receiver || depth!==depthAtReceiver){
   let found=false;
   for(const [k,child] of data.children[node].entries()){
    const childDepth=depth+Number(k===bodySlot(node));
    const size=childCount(node,k,depth,level);
    if(rank<size){slots.push(k);node=child;depth=childDepth;level++;found=true;break;}
    rank-=size;
   }
   if(!found)throw Error('Inconsistent receiver count');
  }
  return {root:binderRoute.root,slots};
 }
 function rankOf(route){
  const prefix=binderRoute.slots.concat(slot);
  if(route.root!==binderRoute.root || !prefix.every((v,i)=>route.slots[i]===v))return null;
  let node=body,depth=0,level=0,rank=0n;
  for(const field of route.slots.slice(prefix.length)){
   const children=data.children[node];
   if(!Number.isInteger(field) || field<0 || field>=children.length)return null;
   for(let k=0;k<field;k++)rank+=childCount(node,k,depth,level);
   if(!childCount(node,field,depth,level))return null;
   depth+=Number(field===bodySlot(node));node=children[field];level++;
  }
  return node===receiver && depth===depthAtReceiver?rank:null;
 }
 return {total,select,rankOf,states:cache.size};
}
if(common)module.exports=repeatedReceiver;else host.ProofAtlasRepeatedReceiver=repeatedReceiver;
})(typeof window==='undefined'?globalThis:window);
